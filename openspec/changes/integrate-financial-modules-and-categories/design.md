# Design

## Context

Ver [proposal.md](proposal.md) para la motivación y las siete especificaciones en `specs/` para los contratos observables.

La aplicación usa Next 16.4.1, React 19, Axios y React Query. La autenticación ya pasa por `app/api/auth/[action]/route.ts`, conserva `JSESSIONID`, obtiene CSRF de Spring y distingue cuenta, invitado y servicio no disponible. `requireAccess` protege cada página; `financeRoutes` limita las rutas de retorno. El resto sigue usando arreglos locales, resúmenes fijos y formularios deshabilitados o de previsualización.

El backend vecino, `/home/memo56/projects/financeApp/financeApi`, ya implementa los módulos financieros con propietario derivado de la sesión, errores `application/problem+json` y CSRF en escrituras. Se revisaron su README y los controladores, DTOs, servicios y repositorios relevantes. Solo falta el filtro de categoría en el listado de transacciones. El usuario eligió extenderlo para conservar filtros y paginación correctos.

Los importes individuales admiten hasta 17 enteros y dos decimales; los IDs son `Long`. Ambos exceden la precisión segura de `number`. Los totales agregados pueden superar el máximo de un importe individual. Los días financieros son fechas de calendario de la zona del servidor, mientras que los plazos de restauración son instantes UTC.

No hay especificaciones principales registradas. Los cambios históricos aún sin archivar describen la fase anterior con datos de ejemplo para cuentas: este plan la reemplaza, conservando los contratos de autenticación, idioma y visitante. Se preserva también el cambio pendiente de «destinatario/remitente» a «Nombre», sin avatares.

## Goals / Non-Goals

**Goals:** reutilizar los componentes y las capas instaladas; mantener una sola fuente real por cuenta; respetar precisión, fechas y reglas del backend; completar cada módulo con su validación y pruebas antes de avanzar; permitir una revisión por bloques pequeños.

**Non-Goals:** añadir conversiones o códigos de moneda, transferencias entre usuarios, pagos bancarios, un nuevo sistema de autenticación, roles, una cuenta de invitado persistente, siembra de datos de ejemplo para cuentas, trabajos automáticos en el navegador, exportación masiva o cambios adicionales de negocio en Spring. No se implementa, despliega, archiva ni hacen commits durante la propuesta.

## Decisions

### 1. Conservar el acceso del mismo origen y ampliar el transporte existente

Mantener la ruta de autenticación y agregar `app/api/finance/[...path]/route.ts` con una lista cerrada de recursos, métodos, segmentos y parámetros. Reutilizar `lib/api/upstream.ts` para acceder exclusivamente al origen Spring configurado; generalizar su prefijo actual de autenticación mediante rutas internas validadas, sin aceptar URLs del cliente. Los Server Components consultarán Spring directamente con el mismo transporte, evitando llamadas HTTP a su propio Route Handler.

El BFF financiero conserva cuerpo y respuesta como texto/bytes para no introducir redondeo. Solo reenvía la cookie de sesión y encabezados necesarios, aplica `no-store`, rechaza redirecciones inesperadas y no expone errores internos de Spring. Las escrituras validan origen y CSRF; el backend continúa autorizando el propietario. Un invitado se rechaza en esta ruta aunque el navegador conserve una cookie de sesión anterior. La excepción local de invitado existente solo corresponde a su operación de autenticación.

Extender el cliente Axios para aceptar una URL base financiera sin duplicar clientes de sesión ni interceptores: todas las escrituras POST, PUT y DELETE que van a Spring obtienen el CSRF vigente. Un 403 invalida el token para un siguiente intento explícito, sin repetir la operación fallida. Conservar la diferenciación de 401 de login frente a una sesión financiera vencida. Mantener los límites de cuerpo, timeout y saneamiento ya implementados.

**Alternativas:** llamadas del navegador directamente a Spring requerirían otro flujo de cookies/CORS; un proxy abierto ampliaría innecesariamente el acceso. No se introduce otro middleware de autenticación.

### 2. DTOs exactos, conversión monetaria acotada y fechas del servidor

Agregar `lossless-json` al lockfile y usar su lectura de números sin pérdida antes de cualquier `JSON.parse` nativo, tanto en Axios como en la carga del servidor. Un decodificador pequeño por contrato convierte importes e IDs a cadenas decimales serializables. Los campos realmente pequeños, como `page`, `size`, `startDay` y recuento de cuotas solicitado, se validan antes de convertirlos a enteros seguros; los conteos `Long` se conservan exactos. No se coloca `BigInt` ni instancias de la biblioteca dentro del estado hidratado.

Los formularios mantienen importes como texto, sin `parseFloat` o redondeo. Se acepta formato decimal canónico sin separadores de miles ni exponentes, con ayuda localizada y teclado decimal. Validar máximo de 17 enteros, hasta dos decimales, signo permitido y valor no nulo. Para transacciones, un selector ingreso/gasto permite capturar magnitud positiva y enviar su signo; editar conserva el importe real. Apartados, límites y pagos siempre reciben magnitudes positivas. Los cuerpos JSON se serializan con números exactos mediante la biblioteca, respetando el contrato numérico de Jackson, sin convertirlos primero a `number` ni enviar importes entre comillas por accidente.

Usar centavos `bigint` para las pocas operaciones locales necesarias: comparar retiros, sumar muestras, calcular diferencias y formatear con dos decimales. Extender `Money`/`createFormatters` conservando compatibilidad con las muestras numéricas pequeñas. Separadores y presentación siguen español/inglés y `$`; no reaparece una moneda. En Recharts y barras solo se convierten proporciones normalizadas y acotadas; etiquetas y tooltips toman cadenas exactas. No limitar un agregado al máximo de un registro individual.

Conservar `YYYY-MM-DD` como fecha de calendario; no interpretar medianoche local y después convertirla de zona. Meses explícitos usan `YYYY-MM`. El valor «mes actual» omite el parámetro y muestra el mes devuelto por el backend; las acciones usan ese mes efectivo. No se calcula el corte, vencimiento o mes predeterminado con la hora del dispositivo. Los instantes `paidAt`, `deletedAt` y `restoreUntil` se tratan como UTC.

**Alternativas:** `number` pierde centavos e IDs admitidos por el contrato; limitar el frontend a rangos menores descartaría funcionalidad existente. Un parser JSON propio no se justifica. No hace falta una segunda biblioteca de decimales: las operaciones locales son en centavos.

### 3. Consultas pequeñas por recurso y caché por cuenta

Definir tipos y servicios financieros próximos a `lib/api/` con funciones explícitas para categorías, transacciones, resumen/configuración, presupuestos, apartados y pagos recurrentes. Separar transporte servidor/cliente conservando los mismos DTOs y parámetros; no crear una fábrica genérica de repositorios.

Usar claves `['finance', account.email, recurso, parámetros]`, con todos los filtros normalizados. El QueryClient del servidor se crea por petición y precarga consultas independientes en paralelo; `HydrationBoundary` entrega cadenas y DTOs a los componentes interactivos. El QueryClient estable del navegador reutiliza esas claves y un `staleTime` corto evita repetir inmediatamente la precarga. Mantener páginas privadas dinámicas y sin caché pública; no serializar secretos ni datos de otra cuenta. No persiste caché en almacenamiento local.

Tras cada mutación confirmada, invalidar el prefijo financiero completo de esa cuenta: las consultas visibles se actualizan y las demás quedan obsoletas para la siguiente visita. Es suficiente para las dependencias entre siete recursos y evita mantener un grafo de invalidación que pueda olvidar saldos o históricos. No usar actualizaciones monetarias optimistas. Pasar `AbortSignal` al transporte, cancelar y limpiar consultas al salir, y preservar la navegación completa y protección contra bfcache ya existentes para cambios de sesión.

Un único refresco del área financiera, activo solo para cuentas y pestañas visibles, invalida consultas financieras activas cada 60 segundos; también se actualiza al volver al foco. Esto observa los pagos automáticos de Spring sin crear un trabajo financiero en el navegador ni multiplicar intervalos por tarjeta. Evitar invalidación recursiva desde cada respuesta.

**Alternativas:** estados por página duplicarían agregados; recalcular resumen o presupuestos con la página actual es incorrecto; WebSockets y almacenamiento de datos financieros en Zustand no son necesarios.

### 4. Invitado explícito y errores sin resultados ficticios

Resolver el tipo de acceso antes de cargar finanzas. La rama invitado usa los datos locales existentes y una muestra pequeña de categorías; no ejecuta consultas financieras. Las acciones que guardan permanecen deshabilitadas con explicación accesible o abren una indicación de iniciar sesión. Conservar las previsualizaciones locales útiles sin guardarlas. No añadir de nuevo la leyenda permanente de «datos de ejemplo» que el usuario eliminó.

La cuenta usa exclusivamente servicios reales: un resultado vacío es vacío y una falla es un estado recuperable. No hay fallback a las muestras. Cada lista/tarjeta distingue carga, vacío y error. Los formularios conservan valores, bloquean doble envío y solo cierran con éxito confirmado. Ampliar `ApiError.fields` a los campos financieros, mapeando validaciones de clase como `nonzeroAmount` y `validInstallmentCount` al control correspondiente. Mensajes localizados por estado/operación para 400, 401, 403, 404 y 409, sin depender de comparar textos ingleses libres de `detail` ni mostrar trazas.

No reintentar mutaciones ni ponerlas en una cola offline. Si la respuesta se pierde, mostrar resultado incierto y permitir releer el servidor antes de repetir; en particular abonos/retiros no son idempotentes. Los 404 por eliminación concurrente refrescan la lista; los 409 mantienen el formulario. Advertencias de presupuesto en una respuesta exitosa acompañan la confirmación, sin convertirla en error.

**Alternativas:** inicializar una cuenta invitada en Spring o escribir sus finanzas en localStorage contradice el alcance acordado; reintentos automáticos pueden duplicar movimientos reales.

### 5. Ajuste único del backend: filtro de categoría antes de paginar

En `transactions/TransactionController.java`, añadir `categoryId` opcional y positivo. Propagarlo por `TransactionService` y `TransactionRepository`; aplicar la misma condición parametrizada en COUNT y SELECT sobre `effective_transactions`, junto con propietario y búsqueda. Conservar el orden estable actual, los seis valores permitidos y los parámetros existentes.

No exigir categoría activa para consultar: los históricos siguen filtrándose por su ID. Una categoría inexistente o ajena da cero resultados, sin revelar su existencia. Ausencia de parámetro conserva el comportamiento actual. No necesita migración. Añadir pruebas del controlador/repositorio con varias páginas, búsqueda combinada, caracteres literales y aislamiento por propietario; actualizar el README del backend.

El frontend conserva la clave URL `category`, pero las cuentas pasan su ID como `categoryId` a la API. Los nombres antiguos se normalizan a «todas» porque no hay correspondencia única con categorías nuevas o duplicadas. Los enlaces de presupuestos generan IDs. El invitado conserva sus filtros canónicos locales para evitar una migración ficticia de muestras.

**Alternativas:** filtrar solo la página recibida produce conteos falsos; descargar todo el historial elimina la paginación real. No se añaden filtros de fecha o tipo al backend sin necesidad para esta integración.

### 6. Completar módulos respetando sus contratos actuales

| Módulo | Lectura y escritura | Integración de interfaz |
| --- | --- | --- |
| Categorías | GET/POST `/categories`; GET/PUT/DELETE `/{id}`. Lista `{items}`, nombre sin color. DELETE 204 o 409 por dependencias activas. | Nueva tabla blanca redondeada, botón Agregar, menú de tres puntos y formularios compartidos crear/editar; confirmación para eliminar. Identidad por ID, nombres duplicados permitidos. |
| Transacciones | GET paginado con `search`, `categoryId`, `sort`, `page`, `size`; POST y GET/PUT/DELETE `/{id}`. POST 201, DELETE 204. | Activar creación y acciones de edición/eliminación en tabla y tarjetas. Mantener «Nombre», sin avatares. Mostrar origen manual/apartado/pago como dato de lectura; nunca enviar dueño ni procedencia. |
| Resumen | GET `/financial-summary`; GET/PUT `/financial-summary/settings` con `frequency` y `startDay`. | Tarjetas con periodo inclusivo y totales del servidor; diálogo pequeño de corte mensual/quincenal. Su balance es el neto del corte, sin arrastre ni suma de apartados. |
| Presupuestos | GET lista/detalle con mes opcional; POST/PUT categoría, límite positivo y color; DELETE 204. | Reutilizar tarjetas, gráfico y menús actuales; seleccionar categoría activa, mes y color. Mostrar `spent`, `available`, `limitReached`, `exceededAmount`, incluido disponible negativo. |
| Apartados | GET lista `{items,totalBalance}` y detalle; POST/PUT metadatos; POST depósitos/retiros; DELETE 200 con plazo; POST restauración sin cuerpo. | Conectar todos los diálogos actuales, prellenar registro y mantener saldo real. Progreso acotado, sin limitar abonos al objetivo ni truncar retiros. Aviso temporal con Deshacer. |
| Pagos recurrentes | GET listado paginado y `/summary` por mes; POST/PUT definiciones; DELETE 204; PUT `/{id}/payments/{month}` sin cuerpo. | Agregar acciones y formulario de suscripción/plazos; mes, estado y pago manual con advertencias. Resumen independiente de la búsqueda/página. |

Mantener operaciones de detalle para precargar/revalidar un registro seleccionado cuando corresponda, sin hacer una petición adicional por cada fila del listado. El estado de edición siempre contiene ID y valores del elemento seleccionado, a diferencia de los diálogos placeholder actuales.

**Transacciones:** API página cero, interfaz página uno; conservar el tamaño visual actual de cuatro filas y traducir los seis órdenes a `newest`, `oldest`, `name_asc`, `name_desc`, `amount_desc`, `amount_asc`. Tras eliminar el último registro de una página, ajustar la URL usando metadatos del servidor. Una categoría inactiva ya asignada se conserva como opción solo para ese movimiento; los movimientos POT pueden mantener categoría nula. El saldo inicial, `sourceType`, IDs de origen y vínculos se muestran como solo lectura. Confirmar correcciones que cambian un apartado o pago y manejar sus conflictos; el frontend no fabrica compensaciones.

**Presupuestos:** la categoría se identifica por ID, no por el nombre de los presupuestos de ejemplo. La selección puede excluir categorías ya presupuestadas al crear, pero un 409 sigue siendo la autoridad ante carreras. El mes es calendario y no cambia por las preferencias de corte. El preview «Últimos gastos» debe encontrar tres movimientos negativos de ese mes: consultar por categoría, orden newest y páginas de hasta 100, descartar fechas posteriores e ingresos, continuar hasta reunir tres, agotar resultados o pasar el inicio del mes. Esta lectura puntual no se usa para calcular agregados. No filtrar solo la primera página ni cargar todo el historial de antemano.

**Apartados:** la meta puede quedar debajo del saldo y los abonos pueden excederla. Una eliminación oculta el apartado y sus movimientos, incluso si tenía fondos; no equivale a un retiro. Guardar ID y plazo original únicamente durante el aviso. Estimar el tiempo restante con los instantes devueltos y el encabezado Date del servidor cuando esté disponible; la respuesta de restauración siempre decide, incluso con desfase del reloj o latencia. Una repetición no reinicia diez segundos. Tras vencer o fallar, explicar el resultado y releer; no crear otro apartado para simular deshacer.

**Pagos:** `SUBSCRIPTION` omite `totalInstallments`; `INSTALLMENT` exige entero positivo y su `amount` es por cuota. La secuencia de una cuota depende del mes seleccionado frente a `firstDueDate`, no de `paidInstallments`. Usar los estados PENDING, PAID, VOID y NOT_SCHEDULED y las fechas devueltas. El pago manual es idempotente por ocurrencia y puede pagarse antes de vencer; no es una transferencia bancaria. El backend genera el gasto automático en su fecha de vencimiento y el manual en su fecha de negocio actual. Cancelar preserva pagos históricos; editar una definición no corrige gastos pasados. Una corrección del gasto puede volver VOID la ocurrencia, y las colisiones posteriores se dejan al servidor. El total mensual es pagado + pendiente; «próximos» es un subconjunto de pendiente, no un tercer sumando.

**Overview:** transacciones newest/size 4; apartados del GET común y sus primeros cuatro elementos; presupuestos del mes actual del servidor; pagos del endpoint de resumen; tarjetas principales del resumen financiero. Retirar los valores fijos independientes únicamente de la rama cuenta. Cargar lecturas independientes en paralelo y permitir errores por widget.

**Alternativas:** conservar formularios de demostración para cuentas o implementar solo categorías dejaría incompleto el alcance confirmado. Reimplementar reglas de calendario, saldos o pagos en React crea una segunda contabilidad.

### 7. Reutilizar componentes, colores e idioma

Reutilizar `Button`, `Input`, `Dialog`, `DropdownMenu`, `Select`, `ResponsiveSelect`, `Pagination` y los iconos Phosphor instalados. Compartir el formulario de cada recurso entre crear/editar; no introducir una plataforma genérica de formularios o tablas. Mantener nombres de categorías, transacciones, apartados y pagos como texto del usuario; `ControlledLabel` solo sirve para catálogos locales de demostración.

Hacer controlado `SelectColorTag` y centralizar la correspondencia entre la paleta existente y colores hexadecimales. Conservar un color válido ya guardado aunque no pertenezca a la paleta. Validar `#RRGGBB` y usar estilos `backgroundColor`/`fill` para datos de servidor, sin construir clases Tailwind a partir de nombres remotos.

Añadir Categories/Categorías e icono a `Sidebar`, `financeRoutes`, redirecciones seguras, pruebas y stories afectadas. Las seis entradas deben caber a 320 píxeles con áreas de al menos 44 píxeles; ajustar padding y el breakpoint de etiquetas en tablet si hace falta. Preservar el sidebar de escritorio y controles logout/idioma sin franja superior que desplace el menú y sin sticky.

Los menús y diálogos tienen etiquetas de fila, foco de regreso, Escape, errores asociados, estado pendiente y confirmaciones. Si hay nombres duplicados, desambiguar selector/etiqueta accesible con ID, sin modificar el nombre almacenado.

**Alternativas:** nuevas librerías de UI, colores por categoría o una navegación alternativa completa añaden trabajo que el usuario no pidió.

### 8. Pruebas junto a cada módulo

Extender `tests/fixtures/auth-api.mjs` con respuestas financieras por cuenta accesibles tanto a SSR como al navegador. Los tests de cuenta usan registros reales del contrato; los de invitado conservan sus fixtures separados. Un mock exclusivo de `page.route` no cubre las lecturas del servidor.

Cada bloque incorpora pruebas de sus reglas y de sus acciones antes de marcarlo completo: DTOs exactos, frontera CSRF y allowlist, filtros/cuenta, formularios/409, fechas de calendario, dependencias, restauración y estados de pago. Añadir casos E2E para las seis rutas en español/inglés, teclado y viewports móvil/tablet/escritorio, sin traducir nombres reales.

La comprobación real usa Spring y PostgreSQL aislados, datos de prueba propios y programación automática deshabilitada para el ciclo CRUD determinista. `./mvnw verify` valida la extensión y las pruebas existentes de calendario/programación; el test de refresco del frontend observa una transición simulada de servidor sin depender de esperar un job real. Ampliar el smoke de autenticación con un ciclo financiero real y limpieza de sus registros, sin usar ni vaciar la base de desarrollo.

Referencias técnicas: [React Query y renderizado del servidor](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr), [transformaciones de Axios](https://axios-http.com/docs/req_config) y [JSON con precisión conservada](https://github.com/josdejong/lossless-json). Antes de aplicar cambios Next se leerán sus guías locales instaladas, y antes de editar Java las instrucciones/skills del backend.

## Risks / Trade-offs

- [Pérdida de precisión al pasar por un parser implícito] → probar respuesta cruda, SSR, hidratación, formularios y serialización con importes e IDs fuera de `2^53`; no basta probar el formateador aislado.
- [Caché privada compartida o petición tardía de otra sesión] → cliente servidor por petición, claves por cuenta, sin persistencia ni caché pública, cancelación y pruebas de cambio A/B y navegación de historial.
- [Operación monetaria aplicada con respuesta perdida] → sin reintentos automáticos; releer antes de repetir y explicar incertidumbre. El backend no ofrece una clave idempotente para abonos/retiros.
- [Revalidar todo produce lecturas adicionales] → solo recursos activos se recargan; evita errores de dependencias. Revisar una invalidación más fina únicamente si mediciones lo requieren.
- [Preview de gastos de un mes antiguo requiere varias páginas] → lectura por categoría ordenada con parada temprana. La API no tiene filtro de mes/signo y no se amplía más allá del ajuste autorizado; si el volumen lo exige, se propondrá esa extensión por separado.
- [Categorías, apartados y presupuestos son listas no paginadas] → respetar el contrato sin truncar opciones; añadir paginación de servidor en otro cambio si el volumen lo justifica.
- [Vencimiento de Deshacer por latencia o reloj] → el plazo nunca se renueva; se maneja el 409 y se refresca el estado real.
- [No hay códigos de error de negocio estables] → mensajes por operación/estado y validación de campos, sin comparar texto libre; un mensaje genérico de conflicto puede ser menos específico.
- [Alcance en dos repositorios y planes históricos sin archivar] → separar la extensión Java y el frontend al aplicar; no modificar deltas históricos ni archivarlos implícitamente. Las garantías anteriores que se sustituyen están descritas en la propuesta.

## Migration Plan

1. Implementar y verificar el filtro opcional de categoría en el backend; desplegar esa extensión antes de la interfaz que lo consume. Sigue siendo compatible con clientes sin el parámetro.
2. Integrar transporte exacto y acceso financiero; después completar categorías, transacciones y los módulos dependientes con sus propias pruebas. Los cambios de esquema del backend ya existentes se aplican mediante su proceso Flyway habitual, sin añadir nuevas migraciones por este cambio.
3. Revisar el flujo completo en un entorno aislado, ejecutar los checks del frontend y backend y documentar las variables y el orden de arranque. Una cuenta nueva no recibe datos de demostración automáticamente.
4. Presentar el resultado para revisión antes de crear commits. Cuando el usuario lo autorice, agrupar cambios y sus pruebas en commits atómicos con prefijos como `feat`, `fix`, `test` o `docs`; no mezclar modificaciones previas ajenas a este plan.
5. Una reversión del frontend no debe borrar registros: puede restaurarse la versión anterior, avisando que las escrituras confirmadas permanecen en Spring. La extensión de filtro puede mantenerse por compatibilidad. No existe una migración destructiva que revertir.
