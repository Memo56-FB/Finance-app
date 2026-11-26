# Design

## Context

`app/finance/layout.tsx` monta `SaveOperations` dentro de `AccountScope`. Hoy ese coordinador conserva el borrador y el número de secuencia al cambiar de sección, ejecuta una escritura sin reintento, identifica las consultas afectadas y maneja errores. Sólo proyecta algunos nombres y colores. La mayoría de las vistas, incluidas las tarjetas de Resumen, leen directamente `query.data`. El filtro de categorías de presupuestos usa la lista de presupuestos activos. Estas rutas de lectura deben compartir el mismo resultado visible.

`FinanceView` entrega un título y «Cargando…» antes de hidratar. `QueryMessage` usa el mismo texto para la carga inicial y la revalidación. Las rutas públicas y el layout financiero esperan decisiones de acceso en el servidor. El proyecto ya dispone de componentes shadcn locales y alias `@/components/ui`.

## Goals / Non-Goals

La unidad de consistencia es una operación de la cuenta verificada en la pestaña abierta. El cálculo optimista cubre los datos que pueden determinarse exactamente con una base válida. Spring sigue asignando IDs, resolviendo reglas de negocio y validando el acceso. La persistencia sin conexión y la ejecución de escrituras dependientes de una entidad sin ID quedan fuera del alcance.

## Decisions

### Un cambio en la sesión, consumido desde todas sus vistas

Ampliar el registro de operaciones existente con una intención tipada por acción, una clave local de presentación y los valores anteriores y nuevos necesarios para cada recurso. Guardar la intención antes de cerrar el diálogo y enviarla una sola vez. Derivar la vista de la consulta confirmada y las operaciones aplicables de esa sesión. Derivar también los datos de gráficos, selectores, vistas previas y estados vacíos de esa misma vista. Mantener la clave visual al recibir el ID real para conservar el foco. Los componentes de presentación pueden representar campos aún desconocidos sin pasar un objeto incompleto por el decodificador de la API.

Modificar por separado todas las entradas de la caché al enviar exigiría restaurar copias potencialmente obsoletas al fallar una solicitud. Restaurar sólo la operación afectada permite que otra edición confirmada durante la espera permanezca visible. Conservar los bloqueos por registro y reservar las claves únicas conocidas (p. ej., categoría de presupuesto o pago del mismo mes). Los controles que necesitan un ID real deben esperar la confirmación. Las solicitudes independientes siguen disponibles.

### Qué se muestra antes de la respuesta

| Operación | Efecto visible y límites |
| --- | --- |
| Alta, edición o baja de categoría | Insertar, actualizar o retirar por identidad en lista y opciones. Propagar nombres conocidos en vistas relacionadas. Mantener las referencias históricas. |
| Presupuesto | Mostrar tarjeta, límite, color y categoría en Presupuestos y los datos que correspondan en Resumen. Reservar la categoría también en otros editores. Al editar, respetar la categoría propia. Si el gasto mensual se conoce, derivar disponible, progreso y totales. Un presupuesto nuevo puede tener gasto previo desconocido. |
| Movimiento manual o vinculado | Aplicar el alta, edición o baja según origen, signo, fecha, categoría, filtros y corte. En una edición aplicar la diferencia entre el efecto anterior y el nuevo, incluidos cambios de periodo o categoría. Actualizar ingresos, gastos, saldo y gasto presupuestado cuando se conocen las bases. Mantener la precisión de `cents` y `decimal`. |
| Apartado | Mostrar alta con saldo inicial definido por contrato, objetivo, edición o baja. Depósitos y retiros ajustan saldo, progreso y suma de apartados. Reflejar movimientos vinculados sólo con pertenencia conocida. Eliminar el apartado no crea un reintegro. Mantener una copia de presentación para restaurarlo y usar el plazo original devuelto por Spring. |
| Pago recurrente | Mostrar alta, edición o baja en los meses aplicables. Marcar pagado cambia la fila del mes, el importe pagado y los grupos calculables. La ocurrencia, el instante efectivo y el movimiento canónico se incorporan desde la respuesta. |
| Ajustes de corte | Mostrar la frecuencia y día elegidos. Cambiar el resumen cuando haya datos para ese corte. Si faltan, reservar espacio para sus indicadores. El cambio de corte conserva la carga independiente de los otros paneles. |

Aplicar la pertenencia a mes, búsqueda y categoría antes del orden y la paginación. Con una página incompleta, mantener las filas conocidas y evitar inventar la posición de una nueva fila. Si la vista de origen no puede posicionar un alta compatible, mostrarla una vez con aspecto de fila junto a la lista hasta poder situarla. Un filtro incompatible sigue excluyéndola. Las vistas previas conservan sus límites y todos los cálculos usan claves de consulta de la cuenta. Un saldo de apartado no es por sí solo el saldo del periodo.

### Respuestas y lecturas concurrentes

Al aceptar el envío guardar la base afectada ya disponible y la generación de sus lecturas. Una lectura que coincide en el tiempo con la escritura podría incluirla antes de que llegue el acuse. Para filas conocidas, asignar el resultado esperado por identidad. Para una suma o un alta sin ID, mantener la base previa más los efectos locales hasta disponer de evidencia inequívoca. En una consulta nueva cuya base pueda incluir ya el efecto, esperar la conciliación para el fragmento ambiguo. Nunca identificar altas por parecido de nombre e importe.

Al recibir la respuesta, asociar el resultado canónico a la operación y adoptar sus campos de inmediato. Las respuestas de escritura parciales, como la de depósito que devuelve sólo el apartado, resuelven únicamente los datos que contienen. Invalidar las claves afectadas y descartar lecturas anteriores. Mantener por consulta el último resultado utilizable hasta la lectura posterior a las escrituras que la afectan. Si dos operaciones tocan un mismo agregado, reconciliar ese agregado al cerrar el grupo o al poder distinguir sus efectos. Así una lectura intermedia no suma dos veces una operación. Una lectura posterior fallida deja el dato visible y ofrece reintentar la lectura.

Un rechazo definitivo retira el efecto por secuencia y recupera el borrador con la validación localizada. Un timeout o respuesta ilegible puede seguir a una escritura exitosa. Retirar del saldo la estimación que ya no se pueda demostrar, mostrar el último dato verificable y mantener la acción «Verificar» mediante GET. Si la lectura no permite atribuir la operación, mantener el resultado incierto y la opción de revisión. Evitar reenvíos también en recarga, reconexión y recuperación. Los avisos reales de presupuesto y la opción de deshacer sólo se publican cuando hay confirmación.

### Composición de Skeleton

Incorporar la implementación local de Skeleton de shadcn Base en `components/ui/skeleton.tsx` siguiendo la instalación manual y los tokens existentes. Reutilizar piezas pequeñas para líneas de texto, campos, filas, importes, gráfico y progreso. Componerlas en el mismo contenedor y con los mismos puntos de corte que el contenido real. Un esqueleto de página único taparía regiones ya disponibles y no cubriría la apertura posterior de un selector. [Referencia de shadcn/ui](https://ui.shadcn.com/docs/components/base/skeleton)

| Ubicación actual | Composición o límite |
| --- | --- |
| Entrada directa, `FinanceView`, transacciones de invitado en Suspense | En una entrada directa, resolver el acceso en el servidor antes de renderizar la página. Aplicar la composición por destino a partir de la hidratación y en esperas posteriores de la sesión. Compartir los mismos bloques para hidratación y navegación. Renderizar directamente los datos locales de invitado si están disponibles. |
| Resumen | Configuración y rango de corte, tres indicadores, vistas previas independientes de apartados, movimientos, presupuestos y pagos. Respetar la comprobación de periodo antes de mostrar cifras. |
| Transacciones y Categorías | Marcador del filtro de categoría, filas/paginación para transacciones y filas con espacio para acciones en Categorías. Reutilizar la variante compacta de filas en móvil. |
| Presupuestos y Apartados | Gráfico y leyenda, tarjetas con importes y progreso, gastos recientes por tarjeta. Apartados usa su propia distribución de tarjetas y controles. |
| Pagos recurrentes y editores | Indicadores de pago y filas con vencimiento, cuotas y paginación. En formularios, sustituir sólo los campos sin opciones disponibles, incluida la dependencia de presupuestos activos. |
| Acceso, registro, sesión y preferencias | Estructura de formulario en la primera espera; en envíos y transiciones, marcador compacto en el control ocupado, nombre accesible y borrador intactos. Verificar la cobertura de `/`, `/login`, `/singup`, invitado, salida y cambio de idioma. |

Usar el estado de carga inicial junto con la disponibilidad de datos y la fase de sesión. Una consulta deshabilitada en modo lectura no debe generar un marcador infinito. Una revalidación con datos visibles conserva el contenido, incluido el optimista. Mantener un mensaje accesible localizado por región y `aria-busy` en el contenedor, formas decorativas con `aria-hidden` y animación desactivada con movimiento reducido. Conservar los botones existentes de recuperación al finalizar en error.

Las entradas directas conservan HTML visible con JavaScript desactivado. Next necesita un script para sustituir el Skeleton que envía antes de completar una ruta en streaming. Por la decisión del usuario, el servidor resuelve el acceso antes de entregar la página en estas entradas. Dentro de la interfaz, la hidratación financiera y las revalidaciones sensibles pueden mostrar una estructura neutra mientras se resuelve el acceso. La comprobación de identidad protege HTML y RSC antes de publicar datos privados.

## Risks / Trade-offs

- **Lista o agregado parcial** → calcular sólo con evidencia suficiente. Usar un marcador para la cifra que falta y conservar los campos que ya se conocen.
- **Resultado incierto sin clave de idempotencia** → verificación por lectura y protección por sesión. La identidad de la operación local nunca viaja como ID de negocio.
- **Regresión de accesibilidad o navegación** → probar foco tras alta, baja y rechazo, anuncios por región, reducción de movimiento y navegación con respuestas retenidas.
- **Requisitos históricos en conflicto** → esta propuesta modifica el delta de guardados en segundo plano. Reemplaza su espera visual y su regla de importes sólo confirmados. Al consolidar los deltas anteriores, reconciliar también las reglas históricas de cierre del diálogo y saldos de `financial-form-interactions` y `financial-data-access`. Se conservan las garantías de confirmación y verificación de las escrituras en Spring.

## Migration Plan

Entregar primero el registro de operaciones y una ruta vertical de presupuesto, extender las proyecciones y después retirar las indicaciones pendientes que sustituyen. El trabajo de Skeleton puede probarse en paralelo con las mismas respuestas demoradas. El despliegue es de frontend y no requiere migrar datos. Para revertir, desplegar la versión anterior y recargar la vista desde el servidor sin reproducir operaciones.
