# Proposal

## Why

La autenticación ya usa el backend, pero las secciones financieras todavía muestran datos de ejemplo y sus formularios no guardan operaciones. Integrar los servicios existentes permitirá registrar finanzas reales y administrar las categorías que comparten transacciones, presupuestos y pagos recurrentes.

## What Changes

- Añadir `/finance/categories` a las rutas protegidas y a la navegación: tabla sencilla con nombre, botón para agregar y menú de tres puntos por fila para editar o eliminar, siguiendo los componentes y estilos actuales.
- Conectar todas las secciones para cuentas autenticadas: categorías, transacciones, resumen y configuración de cortes, presupuestos, apartados y pagos recurrentes. Habilitar sus formularios y acciones, con estados de carga, vacío, error y confirmación.
- Reemplazar los valores fijos del overview por los mismos servicios que alimentan cada sección; actualizar los datos relacionados después de una operación y cuando el backend genere pagos automáticos.
- Reutilizar Axios, React Query y las sesiones/CSRF existentes mediante rutas del mismo origen. Mantener importes e identificadores exactos en todo el rango admitido por el backend.
- Añadir al backend el filtro opcional `categoryId` de transacciones, aplicado tanto al listado como al conteo antes de paginar. Este ajuste fue elegido expresamente por el usuario; conserva la búsqueda, los seis órdenes y los enlaces desde presupuestos.
- Conservar el modo invitado con datos de ejemplo locales y sin escrituras ni llamadas financieras al backend. Una cuenta sin registros verá listas vacías, sin datos inventados.
- Mantener español/inglés, nombres escritos por el usuario sin traducir, importes con `$` sin código de moneda, transacciones con «Nombre», y los controles de sesión e idioma en sus posiciones actuales sin comportamiento sticky.
- Cambiar los filtros de categoría de cuentas reales para utilizar identificadores, porque los nombres pueden repetirse. Los enlaces antiguos con nombres se normalizarán al filtro general; el invitado conservará sus valores locales estables.

## Capabilities

### New Capabilities

- `financial-data-access`: acceso protegido, transporte exacto, aislamiento de caché por cuenta, sincronización y modo invitado para los servicios financieros.
- `category-management`: listado, creación, edición y eliminación de categorías con dependencias e identidad por ID.
- `transaction-management`: registro y corrección de movimientos, filtros y paginación globales, y efectos de movimientos ligados a apartados o pagos.
- `financial-summary`: overview con datos reales y configuración de cortes calculados por el servidor.
- `budget-management`: presupuestos mensuales por categoría, límites, colores, consumo real y advertencias.
- `savings-pot-management`: administración de apartados, abonos, retiros y eliminación con restauración temporal.
- `recurring-payment-management`: administración de suscripciones y compras a plazos, pago manual y consulta de pagos generados por el backend.

### Modified Capabilities

Ninguna especificación principal: `openspec list --specs` no registra capacidades existentes. Los deltas históricos de autenticación y localización siguen sin archivarse; este cambio sustituye su estado temporal de finanzas de ejemplo para cuentas autenticadas y el uso de nombres de catálogo como identidad de categorías reales. Sus garantías de acceso, idioma y modo invitado se conservan.

## Impact

- Frontend: `app/finance/**`, `app/ui/**`, `components/ui/**`, `lib/api/**`, `lib/auth/**`, `lib/i18n/**`, pruebas unitarias, Storybook y pruebas E2E/fixtures. Se agrega una sexta entrada de navegación sin romper el diseño móvil.
- Backend: `/home/memo56/projects/financeApp/financeApi`; cambios acotados al controlador, servicio, repositorio y pruebas del filtro de transacciones, más su README. No requiere migraciones ni cambios de autenticación o roles.
- APIs consumidas: `/api/categories`, `/api/transactions`, `/api/financial-summary`, `/api/financial-summary/settings`, `/api/budgets`, `/api/savings-pots` y `/api/recurring-payments`, con sus operaciones documentadas.
- Dependencias: conservar Axios y React Query; incorporar únicamente `lossless-json` para no perder precisión al leer/escribir números JSON de Java `Long` y `BigDecimal`.
- Este cambio entrega primero el plan. La aplicación, el backend, los commits y el despliegue quedan para solicitudes posteriores; los commits se harán después de la revisión y autorización del usuario, en unidades atómicas con su prefijo.
