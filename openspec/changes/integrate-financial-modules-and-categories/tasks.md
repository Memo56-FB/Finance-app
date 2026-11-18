# Tasks

Aplicar después de revisar la propuesta. Conservar los cambios pendientes de «Nombre» en transacciones y no crear commits hasta que el usuario revise y los autorice. Antes de editar, leer las guías Next instaladas y, para Java, el AGENTS y los skills pertinentes del backend. Cada bloque incluye sus propias pruebas y documentación; no marcarlo completo con formularios o servicios aún de demostración para cuentas.

## 1. Filtro de categoría en el backend

- [x] 1.1 Añadir `categoryId` opcional y positivo al controlador de transacciones y propagarlo al servicio; verificar con pruebas de contrato que omitirlo conserva el comportamiento y que cero, negativos o valores inválidos devuelven 400.
- [x] 1.2 Aplicar el filtro parametrizado tanto al conteo como al listado de `effective_transactions`, conservando propietario, búsqueda y seis órdenes; verificar con pruebas de varias páginas, búsquedas combinadas, categorías inactivas, categoría ajena/inexistente, empates y aislamiento entre cuentas.
- [x] 1.3 Documentar el nuevo parámetro y un ejemplo paginado en el README del backend; ejecutar `./mvnw verify` con PostgreSQL/Testcontainers aislados y comprobar que las pruebas existentes siguen pasando sin migraciones nuevas.

## 2. Transporte seguro e importes exactos

- [x] 2.1 Agregar `lossless-json` y el codec compartido de JSON/DTOs para importes e IDs como cadenas; probar lectura y escritura de `99999999999999999.99`, `9007199254740993`, nulos, conteos y agregados grandes, rechazando contratos inválidos antes de usarlos.
- [x] 2.2 Extender validación, comparación y formato monetario con centavos exactos, mantener los fixtures pequeños compatibles y limitar la conversión a `number` a proporciones visuales; probar `$` en español/inglés, negativos, dos decimales, máximos, cero prohibido, exceso de escala, valores fuera de rango y tooltips exactos.
- [x] 2.3 Generalizar el transporte upstream y añadir el Route Handler financiero con allowlist de rutas, métodos, parámetros, IDs y meses, preservando respuestas crudas y `no-store`; probar sesión, rechazo de invitado, same-origin, CSRF, timeouts, redirecciones, rutas desconocidas y ausencia de filtración de errores internos.
- [x] 2.4 Extender el cliente Axios existente a las operaciones financieras POST/PUT/DELETE y a los errores por campo, sin replay automático; probar renovación explícita de CSRF tras 403, distinción de 401 de login/sesión, 204 sin JSON, validaciones de clase y resultado incierto de una escritura.
- [x] 2.5 Documentar en el README del frontend el flujo navegador/BFF/Spring, precisión y ausencia de reintentos monetarios; verificar los ejemplos contra pruebas HTTP que cubran una respuesta y un cuerpo numéricos exactos de extremo a extremo, sin doble parseo de Axios.

## 3. Consultas por cuenta, invitado y componentes compartidos

- [x] 3.1 Añadir tipos y servicios explícitos de cada recurso y sus operaciones de detalle, junto con fixtures financieros por cuenta en el servidor de pruebas existente; verificar métodos, parámetros, cuerpos y respuestas contra los contratos del backend usando peticiones disponibles para SSR y navegador.
- [x] 3.2 Integrar precarga por petición e hidratación de React Query con claves por cuenta/filtros y cancelación; probar dos renders de cuentas distintas, navegación entre filtros, carga inicial sin solicitudes duplicadas innecesarias y ausencia de caché privada compartida o secretos serializados.
- [x] 3.3 Añadir invalidación financiera por cuenta tras éxito y refresco único en foco/cada 60 segundos visibles; verificar con reloj controlado que no funciona en invitado ni en pestaña oculta y que no crea pagos ni bucles de invalidación.
- [x] 3.4 Mantener el acceso invitado en una rama local de solo lectura y los estados reales de carga/vacío/error para cuentas; verificar que las seis secciones invitadas no llaman a la API financiera ni guardan cambios y que errores de cuenta nunca muestran fixtures.
- [x] 3.5 Reutilizar controles de formulario y mensajes localizados para pendiente, validación, 404, 409 y resultado incierto, con confirmaciones accesibles; probar doble envío, valores conservados al fallar, cierre solo tras éxito y foco al regresar, sin añadir la leyenda permanente de demostración.
- [x] 3.6 Hacer controlado `SelectColorTag`, mapear la paleta actual a hex y conservar colores válidos externos; actualizar consumidores/stories y verificar selección, prellenado, color fuera de paleta y rechazo de estilos inválidos sin construir clases con datos remotos.
- [x] 3.7 Documentar contratos de datos, estados y aislamiento en una guía breve de integración; verificar que los ejemplos usan IDs, fechas de calendario y DTOs exactos, sin persistencia de caché financiera ni nombres de usuario traducidos.

## 4. Categorías y sexta ruta protegida

- [x] 4.1 Crear `/finance/categories` con `requireAccess`, agregarla a `financeRoutes`, retorno seguro, sidebar y mensajes/stories; probar redirección anónima en HTML y navegación, acceso de cuenta/invitado y seis entradas usables a 320 px, tablet y escritorio con controles de sesión/idioma en su lugar.
- [x] 4.2 Implementar tabla de nombres con botón Agregar y menús de tres puntos por ID, usando el diseño existente; verificar vacío, carga, recuperación de error, navegación por teclado y nombres duplicados sin claves repetidas ni traducción del texto escrito.
- [x] 4.3 Conectar crear/editar con formulario compartido y prellenado del registro, más eliminación confirmada; probar nombre vacío/espacios/límite de 100 caracteres, selección entre duplicados, éxito, 404 concurrente y 409 por presupuesto o pago activo.
- [x] 4.4 Verificar mediante E2E que renombrar actualiza etiquetas en otras secciones y eliminar excluye opciones nuevas sin borrar históricos; documentar esas reglas y el modo invitado en la sección de categorías de la guía.

## 5. Transacciones reales

- [x] 5.1 Conectar listado, búsqueda, seis órdenes, categoría por ID y página URL con la API, manteniendo cuatro filas y la conversión página uno/cero; probar resultados en páginas posteriores, conteo global, filtros combinados, enlaces antiguos por nombre, ID inactivo y normalización de página vacía tras eliminación.
- [x] 5.2 Añadir creación y edición compartidas con Nombre, categoría, fecha y tipo ingreso/gasto con importe exacto; probar cuerpo firmado correcto, fechas sin desplazamiento de zona, categoría activa obligatoria al crear e inactiva/nula conservada cuando el contrato del movimiento lo permite.
- [x] 5.3 Añadir acciones por fila/tarjeta y eliminación confirmada, mostrando procedencia solo de lectura; probar corrección/deleción de movimientos manuales, POT y RECURRING_PAYMENT, manejo de conflictos y advertencias de presupuesto sin tratar un guardado exitoso como error.
- [x] 5.4 Actualizar las pruebas y documentación del historial para cuentas y conservar las muestras de invitado; verificar E2E de CRUD, filtros y navegación al overview manteniendo «Nombre», sin remitente/destinatario ni avatares, y etiquetas escritas por el usuario sin traducción.

## 6. Resumen y configuración de cortes

- [x] 6.1 Conectar las tarjetas principales a `/financial-summary` y mostrar fechas inclusivas y ceros reales; probar periodo con neto negativo, precisión grande, mes sin movimientos y separación entre saldo del corte y saldo de apartados.
- [x] 6.2 Añadir diálogo de configuración MONTHLY/SEMIMONTHLY y día 1..31, con GET/PUT y relectura del resumen; probar validaciones, error sin cierre, ancla de día 31 y periodos devueltos por el servidor sin recalcularlos con la zona del dispositivo.
- [x] 6.3 Documentar cortes y límites del balance del resumen; verificar E2E que cambiar preferencias actualiza las tarjetas sin editar transacciones ni el mes calendario de presupuestos.

## 7. Presupuestos reales

- [x] 7.1 Conectar listado y selección de mes efectivo del servidor a tarjetas y gráfico compartidos; probar valores `spent`, `available`, `limitReached` y `exceededAmount`, ingresos excluidos del gasto, disponible negativo, límite exacto y proporciones acotadas con etiquetas exactas.
- [x] 7.2 Habilitar crear/editar/eliminar con categorías activas por ID, límite positivo y color, prellenando registro y conservando valores al fallar; probar 409 por categoría ya presupuestada, límite menor al gasto y eliminación que conserva transacciones.
- [x] 7.3 Sustituir el preview fijo por búsqueda paginada de los tres gastos más recientes de la categoría/mes y generar enlaces por ID; probar ingresos y movimientos de otros meses en primeras páginas, parada al pasar el mes y error del preview sin alterar agregados válidos.
- [x] 7.4 Actualizar tests y documentación de presupuestos; verificar E2E que cambios de límite/color/categoría y nuevas transacciones se reflejan en tarjetas, histórico y gráfico del overview sin mezclar datos de ejemplo de una cuenta.

## 8. Apartados y restauración temporal

- [x] 8.1 Conectar listado, total, creación y edición a savings-pots; probar saldo inicial cero, actualización que conserva saldo, objetivo debajo del balance, color existente y progreso acotado sin perder valores exactos.
- [x] 8.2 Habilitar abonos y retiros con importe positivo y saldo confirmado, eliminando cualquier clamp silencioso; probar máximo, fondos insuficientes, abono sobre objetivo, doble clic, respuesta perdida sin replay y refresco de movimientos vinculados.
- [x] 8.3 Implementar eliminación con respuesta 200 y aviso Deshacer ligado al ID/plazo originales; probar restauración antes del plazo, expiración exacta/409, repetición sin renovar ventana, desfase de reloj y ausencia de duplicación de apartados o movimientos.
- [x] 8.4 Actualizar pruebas y documentación de apartados; verificar E2E que eliminar/restaurar cambia totales, histórico y resumen coherentemente incluso con fondos, sin crear un gasto o reembolso artificial.

## 9. Pagos recurrentes reales

- [x] 9.1 Conectar mes, búsqueda, orden y paginación del listado, estados y resumen mensual independiente; probar varias páginas, total pagado+pendiente, dueSoon como subconjunto, atraso excluido de dueSoon y fecha del servidor con ancla de fin de mes.
- [x] 9.2 Añadir formulario compartido para crear/editar suscripciones y plazos, categoría activa, importe por cuota, primera fecha y total de cuotas condicional; probar omisión del total en suscripción, entero positivo, secuencia por mes frente a cantidad pagada y conflictos por modificar una serie con historia.
- [x] 9.3 Implementar marcar pagado por ID/mes sin cuerpo y cancelación confirmada; probar pago anticipado, repetición idempotente, advertencias de presupuesto, ausencia de pago en NOT_SCHEDULED y cancelación que conserva gastos/total pagado históricos.
- [x] 9.4 Verificar correcciones de gastos vinculados y observación del job del servidor; probar VOID y colisiones de una segunda ocurrencia, refresco visible tras transición simulada sin POST automático y ausencia de reescritura de pagos pasados al editar la definición; documentar esas reglas en la guía.

## 10. Completar tarjetas compartidas del overview

- [x] 10.1 Sustituir en la rama cuenta los previews fijos por los cuatro movimientos newest, primeros apartados/total, presupuestos y resumen de recurrentes de sus consultas comunes; probar consistencia de nombres/fechas/importes con cada sección, carga en paralelo, estados vacíos y errores independientes por tarjeta.
- [x] 10.2 Verificar mediante E2E que un CRUD de cada módulo y un pago automático observado actualizan overview y secciones al navegar o refrescar; documentar las fuentes de las tarjetas y conservar sin escrituras la presentación local del invitado.

## 11. Verificación integral

- [x] 11.1 Ejecutar los flujos completos de las seis rutas con español/inglés, teclado, móvil/tablet/escritorio y pruebas de aislamiento A/B, logout, invitado, bfcache y sesión vencida durante peticiones; verificar ausencia de datos privados cruzados, scroll horizontal, etiquetas USD y traducción de nombres reales.
- [x] 11.2 Ampliar el smoke real de integración con categoría, presupuesto, transacción, apartado/undo, recurrente/pago y configuración de corte sobre Spring/PostgreSQL aislados; verificar efectos cruzados, precisión, conflictos y limpieza de registros propios, con scheduling deshabilitado para el ciclo determinista y sin usar datos de desarrollo.
- [x] 11.3 Ejecutar `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test:e2e`, `pnpm build` y `pnpm build-storybook`, más `./mvnw verify` en backend; verificar los comandos de arranque y variables documentados, corregir fallos atribuibles al cambio y registrar cualquier límite comprobado antes de presentar la revisión.

## Workflow follow-up

- Presentar la implementación y sus resultados para revisión. Crear commits atómicos con prefijos solo después de que el usuario lo autorice, separando los cambios previos de transacciones y los dos repositorios.
- Archivar o desplegar únicamente si el usuario lo solicita después; no forma parte de esta propuesta ni de sus tareas de implementación.
