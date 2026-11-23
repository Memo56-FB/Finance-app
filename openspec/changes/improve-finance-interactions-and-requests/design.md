# Design

## Context

Base de revisión `d521aa5`, 18 de noviembre de 2026. Next App Router verifica la cuenta al renderizar, Spring mantiene la sesión y el libro de movimientos, y React Query hidrata las lecturas con claves por cuenta. Radix ya conserva el panel durante su animación CSS. La capa que desmonta los campos está en `app/ui/finance/common.tsx:65` y `:75`. Las mediciones, los consumidores y las pruebas de referencia figuran en la [auditoría](../../../plans/README.md). El contrato incluye dinero decimal exacto, filtros en la URL, foco de teclado, español/inglés y modo invitado local.

## Goals / Non-Goals

Las unidades de entrega son el diálogo y su envío, la identidad de la pestaña, los formularios de cada módulo, la red y la presentación de datos. Cada unidad debe poder verificarse por separado con la API de prueba. La API pública de Spring, la base de datos, la maquetación, las dependencias instaladas y las especificaciones históricas delimitan el trabajo. El diseño de cuentas e invitados mantiene sus comportamientos propios.

## Decisions

### El diálogo es dueño del ciclo de vida del borrador

En `NewDialog`, alojar los hijos directamente dentro de la presencia de `DialogContent`, que ya los monta al abrir y los retira al terminar la salida. En `RowActions`, separar apertura de acción seleccionada: conservar la acción, el título y la identidad del registro mientras se cierra. Abrir de nuevo debe crear el borrador apropiado. Usar el ciclo de Radix para concluir el cierre, incluido el caso sin animación. Aplicar la preferencia de movimiento reducido a contenido y fondo. Fijar en JavaScript los 150 ms medidos acoplaría el foco y la limpieza a una regla CSS que puede cambiar. [Animación con Radix](https://www.radix-ui.com/primitives/docs/guides/animation)

Bloquear X, Escape, clic exterior, vuelta atrás de la confirmación y un segundo submit **mientras se espera una escritura**. Mostrar y anunciar el estado pendiente. En reposo, estos mecanismos siguen cerrando normalmente. Hacer que el éxito cierre sólo su apertura y que los efectos de interfaz de una respuesta tardía comprueben la vigencia de la cuenta y del borrador. Una operación que llegó al servidor no se deshace al desmontar un componente. Mantener la recarga explícita para un resultado incierto y los errores de campo para un 400.

Con una eliminación, el refresco puede desmontar la propia fila que aloja el diálogo. Mantener el panel hasta el final de la salida, por ejemplo coordinando el refresco de la fila con ese cierre, y restaurar foco al menú si sigue presente o a una acción estable de la lista si desapareció. Mantener el plazo de deshacer del apartado anclado a la respuesta del servidor. El botón de `QueryMessage` debe tener `type="button"` allí donde se crea. Cambiar el tipo predeterminado de todos los botones afectaría otros formularios.

### Mantener la regla de negocio cerca de cada formulario

El archivo actual exporta nueve formularios y una función de opciones. Agrupar por dominio dentro de `app/ui/finance` y usar importaciones directas. Una distribución viable reúne `PotForm` y `PotMoneyForm` en un módulo, `RecurringForm` y `PaymentForm` en otro y deja los formularios con un solo consumidor junto a su pantalla. Mantener compartidos `DeleteForm`, `SaveForm`, los controles y el manejo de validación usados en varios módulos. Dejar `categoryOptions` como función pura en un módulo de categorías importable por la barra, el campo y las pruebas sin cargar React. Evitar una importación circular desde una pantalla hacia un formulario que vuelve a importar la pantalla.

Reescribir las declaraciones de estado, validaciones y JSX de los módulos movidos para que cada campo y rama se pueda revisar. Preservar los ID de categoría, las categorías inactivas en transacciones históricas, los colores válidos fuera de paleta, el signo del movimiento, la vista previa de apartados y el intervalo de 1–12 meses. Para el día de corte, validar entrada decimal entera en 1–31 y pasar el entero acotado al servicio. La conversión a `Number` sólo aplica a este día, nunca a dinero o IDs. Un generador de formularios añadiría configuración para cada una de estas reglas.

### Reconciliar identidad una vez por transición relevante

Hoy `SessionControls` obtiene el resultado de `/me` pero el efecto sólo observa `account.error`; `AccountScope` conserva el correo inicial. Coordinar en el límite de cuenta el resultado positivo, el 401, el error transitorio y el refresco de foco. Mientras se comprueba de nuevo una identidad al recuperar visibilidad, bloquear nuevas acciones privadas y evitar relanzar lecturas en el contexto anterior. Si se confirma el mismo correo, conservar el borrador. Si cambia, desmontar la vista privada y reutilizar la limpieza de consultas, mutaciones locales, CSRF y navegación segura de `useAccessNavigation`. Limpiar avisos y descartar callbacks obsoletos; borrar la caché local no cancela una escritura ya aceptada.

En transiciones explícitas entre pestañas, emitir una señal de cambio tras la confirmación del login, logout o modo invitado; la señal sólo solicita la reconciliación con el servidor. Puede usarse `BroadcastChannel` con detección de disponibilidad y comprobación de identidad al volver al foco como respaldo. La señal no transporta correos, credenciales ni datos financieros. Un 401 en finanzas conserva el retorno permitido al login; el servidor resuelve el nuevo modo después de una transición confirmada. Un fallo temporal debe ofrecer recuperación, sin reclasificarlo como sesión expirada ni desbloquear acciones de una identidad sin confirmar. No se añade una llamada a `/me` por cada GET o cada pulsación.

En `AccountForm`, separar el 401 de la comprobación posterior al login del 401 del propio envío de credenciales. Volver a habilitar login explícito ante sesión ausente. Ante error transitorio conservar «reintentar comprobación», con un solo POST de credenciales en toda esa secuencia. Las pruebas usarán respuestas de identidad simuladas y verificarán el estado de la interfaz.

### Asociar cada lectura a un consumidor

| Interacción | Comportamiento diseñado | Mantenimiento |
| --- | --- | --- |
| Texto en Transacciones o Recurrentes | Actualizar el input al momento y publicar la búsqueda tras 300 ms de inactividad. Actualizar `query` y reiniciar `page` juntos. Para cambio inmediato de filtro, fusionar el último texto con los parámetros actuales. Para navegación externa, cancelar el temporizador y adoptar la URL. | Un temporizador por barra; cancelar al desmontar. Respetar composición de texto, limpiar búsqueda y conservar enlaces y paginación. El invitado filtra localmente. |
| GET desplazado | `financeQueries` y Axios ya consumen la señal. Pasar `request.signal` en el GET de la pasarela financiera a `upstreamPath`, que ya la combina con su timeout de 10 s. | La entrega de la desconexión depende del runtime; comprobar el contrato con señales controladas. Las escrituras mantienen su política de confirmación y reintentos. [Cancelación de consultas](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) |
| Entrada a las seis pantallas | En `FinanceHydration`, precargar categorías para Categorías y Transacciones. En Presupuestos y Recurrentes, que `CategoryField` pida los datos al montarse usando la misma clave privada. Normalizar el mes con la misma regla de cliente y servidor antes de crear la clave. | Evitar GET con mes inválido seguido de una lectura del mes vigente. La primera apertura del editor puede mostrar su estado de carga o reintento. |
| Cambio de corte | Reutilizar la respuesta validada de `saveSettings` para la clave de configuración e invalidar el resumen, o invalidar sólo esas dos claves exactas de cuenta. | Límite de dos lecturas posteriores al PUT. Mantener amplia la recuperación explícita por resultado incierto y la actualización tras operaciones con efectos cruzados. |
| Vista previa de presupuesto | Decidir con `cents(budget.spent) === 0n` antes de montar la consulta de historial. Renderizar el vacío inmediatamente incluso si existe caché. Al pasar de cero a positivo, usar información vigente de esa cuenta, categoría y mes. | Para positivo seguir hasta tres gastos, una fecha anterior al mes o el fin de la paginación. Una consulta obsoleta no puede repoblar la vista vacía. |

Spring suma exclusivamente los movimientos efectivos de importe negativo agrupados por categoría entre el inicio del mes y el siguiente. Por eso un gasto total cero demuestra que no hay filas elegibles. Si ese contrato cambia, revisar la optimización antes de aplicarla. Los agregados permanecen en el servidor. [Contrato del frontend](../../../docs/financial-integration.md#L82)

### Hacer legible el mismo dato en cada presentación

- Conservar filas compactas en móvil y columnas en escritorio. Usar una tabla correctamente encabezada cuando se presenta como tabla, o una lista con valores etiquetados en la versión compacta. La alternativa elegida debe exponer una sola representación accesible por breakpoint y una sola acción activa por fila. En Recurrentes, cubrir la vista de cuenta y la de invitado.
- En `ResponsiveSelect`, reutilizar los radioitems y el grupo del menú Radix ya exportados en `components/ui/dropdown-menu.tsx`. Conservar el disparador de icono y el select de escritorio. Verificar el nombre del filtro, la opción marcada y su actualización con teclado.
- En `BudgetChart`, mostrar los totales exactos en un elemento central que pueda existir aun cuando la serie de gasto tenga cero sectores. Mantener el tooltip exacto de los sectores reales y desactivado para el anillo decorativo. Diferenciar cuenta sin presupuestos de presupuesto con gasto cero.
- El editor de transacciones ya recibe `sourceType`, `potName` y `openingBalance`. Mostrar la procedencia como texto de sólo lectura reutilizando las traducciones existentes. Mantener la forma del PUT y los nombres introducidos por el usuario.

## Risks / Trade-offs

- **Perder el foco al desaparecer el registro.** Cubrir Escape, éxito, rechazo, eliminación de la última fila y movimiento reducido, incluido el foco tras el desmontaje.
- **Refrescar menos y dejar importes antiguos.** Reducir la invalidación sólo donde está demostrada la independencia del corte. Probar pagos automáticos, movimientos ligados, expiración de sesión y deshacer en las pruebas existentes.
- **Confundir orden de llegada con identidad.** Mantener verificación del servidor, cancelación de lecturas y descarte de resultados de la cuenta anterior. Una notificación entre pestañas es un aviso, nunca una autorización.
- **Perder filtros al agrupar pulsaciones.** Probar cambio de mes/categoría y navegación mientras el temporizador está pendiente, junto con lectura que termina fuera de orden.
- **Historial extenso o servicio lento.** Para meses con gasto positivo medir páginas y filas transferidas antes de proponer una consulta de previsualización por categorías y mes a Spring. Para el resumen medir primera tarjeta útil y última tarjeta con una respuesta independiente retrasada antes de proponer límites de renderizado por tarjeta. Las seis lecturas actuales ya arrancan en paralelo.

## Migration Plan

Se puede entregar por grupos de tareas y revertir cada grupo en el frontend. Emparejar los movimientos de archivos con todos sus consumidores y sus pruebas en la misma unidad. El despliegue usa los DTO, las sesiones y las URLs existentes. Revertir la UI no revierte las operaciones financieras ya confirmadas; durante una prueba utilizar cuentas y registros efímeros.
