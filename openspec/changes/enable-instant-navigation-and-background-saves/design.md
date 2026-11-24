# Design

## Context

Las seis páginas de `app/finance` llaman a `requireAccess`. Para una cuenta, `FinanceHydration` crea un cliente de consultas nuevo y espera las lecturas de la sección, seis en Resumen y dos en Transacciones. El navegador ya tiene un `QueryClient` compartido, claves por cuenta y componentes que leen esos datos. Sin embargo, los enlaces del menú y de detalle siguen esperando el resultado de la ruta de Next.

En `app/ui/finance/common.tsx`, `useSave` espera a Spring y comprueba si el formulario continúa montado antes de notificar, refrescar y cerrar. Quitar el bloqueo del diálogo por sí solo haría que se perdieran esos efectos al navegar. `AccountScope` y las notificaciones ya viven por encima de las páginas y pueden terminar ese trabajo.

### Relación con los cambios anteriores

El catálogo principal está vacío. Los cambios implementados `integrate-backend-auth-and-guest-mode`, `integrate-financial-modules-and-categories` e `improve-finance-interactions-and-requests` aún contienen los deltas anteriores. Estas decisiones sustituyen las siguientes reglas en los casos indicados.

| Regla anterior | Comportamiento acordado |
| --- | --- |
| Verificación bloqueante de cada navegación en `protected-routes` y lecturas de servidor por sección en `financial-data-access` | El servidor sigue protegiendo cada entrada HTTP. Una transición en la pestaña ya verificada usa su propia memoria y comprueba la identidad en segundo plano. |
| El editor conserva el control hasta confirmar en `financial-form-interactions` y `financial-data-access` | El envío válido libera el diálogo. La sesión conserva el borrador recuperable, la protección frente al doble envío y la responsabilidad de terminar la operación. |
| Categorías bajo demanda y actualización por foco o sondeo en `financial-query-efficiency` | Resumen adelanta dos lecturas habituales. Las entradas directas a Presupuestos y Pagos recurrentes mantienen las categorías bajo demanda. Se respeta el comportamiento actual de no consultar periódicamente ni al recuperar el foco. |

## Goals / Non-Goals

La garantía de inmediatez empieza cuando ya está disponible la navegación de una sesión o demo abierta. Se comprueba observando que el destino se presenta mientras las respuestas siguen retenidas. La primera entrada, el acceso desde otra pestaña y la recarga pueden necesitar al servidor para autenticar y recuperar datos.

Las operaciones viven en la memoria de la sesión abierta. El soporte sin conexión tras cerrar la aplicación, la sincronización entre dispositivos y el reenvío de escrituras son alcances posteriores. El contrato HTTP y el despliegue de Spring permiten entregar este cambio desde el frontend.

## Decisions

### 1. Usar la URL como fuente de la sección activa

Conservar las seis páginas como entradas canónicas, con `requireAccess`, retorno seguro y render inicial por cuenta o invitado. En la entrada autenticada, arrancar las lecturas de `FinanceHydration` y entregar al cliente las consultas resueltas y las pendientes mediante `HydrationBoundary`. La versión instalada de TanStack permite transmitir las promesas en curso. Así los bloques pueden mostrar su carga sin esperar `Promise.allSettled` y una navegación temprana puede compartir la lectura inicial. La respuesta privada completa conserva importes e IDs exactos. Un `loading.tsx` solo ayuda a mostrar una espera y no recupera la lista que el navegador ya tiene. [Hidratación de consultas pendientes](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

Montar bajo el layout financiero una vista de cliente que seleccione la sección por `usePathname`, con el encabezado disponible aunque falte el módulo de la pantalla. Para una cuenta, la página de entrada conoce los filtros e instala la hidratación alrededor de esa vista antes de habilitar las transiciones locales. El selector sigue montado al cambiar sólo el historial y reutiliza los componentes actuales de cuenta o de demostración. Debe haber un único título y un cuerpo para el destino. Si termina tarde el contenido de la entrada, sólo puede alimentar sus propias consultas y nunca volver a seleccionar esa página.

Usar enlaces con un `href` real en el menú, las tarjetas de Resumen, «Ver todo» de Presupuestos y los detalles equivalentes de la demo. Para una navegación ordinaria entre rutas de `financeRoutes` en la misma pestaña hidratada, usar la History API integrada con Next. `pushState` actualiza el destino, `usePathname` y `useSearchParams` lo reflejan, y Atrás/Adelante seleccionan la vista de esa URL. Evitar la precarga RSC automática en los enlaces gestionados así. Nueva pestaña, modificadores, enlaces fuera de Finanzas y navegación antes de hidratar siguen el enlace nativo. Conservar `useFinancialURL`, la cancelación de búsquedas pendientes, el foco del título y el desplazamiento del contenedor al cambiar de sección. Un refresco explícito, incluido el cambio de idioma, debe respetar la URL actual. [Guía de navegación de Next.js](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api)

### 2. Separar una comprobación rutinaria de una sospecha de cambio de identidad

Al navegar con una cuenta activa, iniciar o compartir una comprobación de `/api/auth/me` en segundo plano, también cuando todos los datos ya están en memoria. Esta comprobación ordinaria permite seguir viendo la copia de esa sesión. Reutilizar literalmente el ciclo actual de `verify()` en cada clic cancelaría las consultas y volvería el contenido `inert`. Tampoco se deben cancelar las promesas que acaba de autorizar el servidor al montar la cuenta por primera vez.

Una señal entre pestañas, una salida o un 401 ocultan los datos y suspenden las acciones privadas mientras se resuelve la identidad. Si únicamente falla por red una comprobación rutinaria de una cuenta previamente verificada, conservar la copia en modo lectura, suspender nuevas peticiones privadas y ofrecer reintentar identidad. Al entrar por URL o tras una señal de cambio, un fallo sólo permite ver la estructura de la página. Una lectura financiera fallida por sí sola conserva los últimos datos de la consulta si la cuenta sigue verificada. Al confirmar caducidad, otra cuenta o modo invitado, limpiar datos, operaciones y avisos. La demo elige sus componentes locales y omite todas las consultas privadas.

Asociar cada envío y respuesta a la instancia de sesión que los originó, incluso cuando alguien vuelve a entrar con el mismo nombre. El interceptor de `lib/api/client.ts` puede esperar un token CSRF antes de despachar la escritura. Cancelar esa preparación al salir y verificar la vigencia del envío inmediatamente antes de entregarlo al transporte. Una escritura ya despachada puede completarse en Spring aunque se descarte su respuesta en el navegador. El intermediario de Next y Spring conservan sus controles de sesión, origen y CSRF.

### 3. Conservar en memoria las consultas que sirven al volver

Usar `financeQueries` tanto para precargar como para mostrar los datos. Normalizar las claves equivalentes a nivel de consulta. Hoy la lista por defecto de Transacciones incluye `search: ''` y Resumen omite ese campo, aunque los dos solicitan los mismos cuatro movimientos. Un mes histórico, una categoría, una página o un orden distintos conservan su propia clave. Así se puede compartir también una petición en curso.

Al mostrar Resumen con una cuenta activa, adelantar categorías y esa primera página una vez si faltan. Las consultas de cada destino se atienden en paralelo o por bloque. Mantener en memoria, hasta el cierre de sesión, el conjunto acotado de claves base de las seis vistas. `staleTime: Infinity` indica frescura, pero las consultas inactivas normalmente se desalojan a los cinco minutos. Aplicar retención de sesión sólo a las claves base. Las búsquedas, páginas adicionales, meses históricos y vistas previas conservan un ciclo de vida acotado. Una consulta invalidada puede mostrar su última copia mientras actualiza, sin mostrar otra página o mes como sustituto. [Ciclo de vida de las consultas](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

### 4. Entregar el guardado a la cuenta antes de cerrar

Separar la validación local del envío en los formularios que hoy hacen ambas cosas dentro de `useSave`. Si hay errores, conservar el editor y señalar los campos. Si es válido, capturar el tipo de operación, el ID del registro o del borrador, la sección y los valores exactos. Entregar ese único envío a un responsable montado bajo `AccountScope` con el cliente de mutaciones existente. Tras la aceptación local, cerrar con el mecanismo de foco y animación actual y permitir usar la navegación. No encadenar la petición ni la conciliación al desmontaje o a la animación.

Identificar cada envío dentro de su sesión. Impedir otro envío del mismo borrador o una operación incompatible sobre el mismo registro mientras se resuelve. Dos registros independientes pueden guardarse a la vez, incluso si tienen el mismo nombre. El resultado se procesa aunque la página ya no exista. Las proyecciones de campos descriptivos se derivan de operaciones pendientes identificadas por ID. Retirar una proyección revela la última base confirmada sin restaurar una copia antigua de toda la lista. Un GET anterior tampoco debe deshacer una confirmación posterior. [Mutaciones con componentes desmontados](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) · [Actualizaciones optimistas](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

| Sección | Antes de confirmar | Al confirmar |
| --- | --- | --- |
| Resumen | El cambio de corte queda pendiente. Las cifras siguen correspondiendo al corte confirmado. | Usar los ajustes devueltos e invalidar sólo el resumen del corte actual. |
| Transacciones | Alta, edición y baja pendientes. La búsqueda, el orden, la paginación y los importes pueden cambiar en el servidor. | Actualizar movimientos, resumen, presupuestos y sus vistas previas. Refrescar apartados o pagos recurrentes si el movimiento estaba vinculado. |
| Categorías | Renombre provisional por ID. Alta y baja pendientes. | Aplicar el resultado y actualizar opciones y etiquetas dependientes, incluido el historial visible. |
| Presupuestos | Sólo el cambio exclusivo de color se proyecta. Alta, baja y cambios de categoría o límite quedan pendientes. | Actualizar presupuestos, su tarjeta de Resumen y las vistas previas afectadas. |
| Apartados | Sólo nombre o color de un apartado existente se proyectan si el objetivo no cambió. Altas, bajas, objetivo, depósitos, retiros y restauración quedan pendientes. | Actualizar apartados y los movimientos e indicadores afectados. Al borrar, ofrecer deshacer con `undoDeadline` y el plazo real de Spring, incluso desde otra sección. |
| Pagos recurrentes | Alta, edición, baja y marcar pagado quedan pendientes. | Actualizar lista, ocurrencia y resumen mensual. Cuando se genera o cambia un movimiento, refrescar también transacciones, resumen y presupuestos afectados. |

Usar las familias de claves existentes para invalidar las consultas afectadas de la cuenta. Las visibles se refrescan en segundo plano y las inactivas quedan marcadas para la siguiente visita. Mantener los periodos y los filtros independientes. Respetar la precisión decimal y las advertencias por presupuesto devueltas por Spring.

### 5. Distinguir rechazo, confirmación y resultado incierto

Mostrar el estado en el área financiera compartida, en inglés o español. Un éxito puede usar la notificación existente. Un error o pendiente necesita una acción recuperable aunque haya caducado el aviso temporal. Al recibir un rechazo de validación o negocio, retirar la proyección y permitir volver voluntariamente al borrador con sus valores y errores. Para un 403 se conserva la recuperación explícita con CSRF renovado. Para un 404 se informa de que el registro ya no está disponible. Una respuesta nunca debe cerrar otro editor ni mover el foco de la página nueva.

Una desconexión, un timeout o una respuesta imposible de interpretar después del envío quedan pendientes de verificación. Permitir consultar los recursos afectados con GET y revisar el resultado. No deducir de dos importes iguales que se identificó el mismo depósito. Si Spring confirmó y sólo falla la actualización de la pantalla, marcar el guardado como confirmado y reintentar únicamente la lectura. Los depósitos y retiros actuales cuentan cada petición como un ajuste. Un futuro reenvío automático requeriría una clave de idempotencia que Spring persista atómicamente con el movimiento.

## Risks / Trade-offs

- Revocación silenciosa mientras se consulta una copia en memoria → existe un intervalo hasta recibir la comprobación en segundo plano. Toda petición nueva conserva autorización en servidor. Ante una señal de cambio conocida, ocultar de inmediato la vista privada.
- Guardado en vuelo al recargar o salir → el servidor puede completarlo. La siguiente entrada obtiene el estado real y nunca reproduce el envío.
- Regresión de navegación o datos cruzados → probar con peticiones retenidas, dos cuentas, retorno por historial y consultas distintas resueltas fuera de orden. Los criterios verifican el orden de los acontecimientos sin depender de un tiempo arbitrario del equipo de pruebas.

## Migration Plan

Entregar primero la navegación y la caché para las seis secciones. Después migrar el ciclo de guardado compartido y sus consumidores. Adaptar las pruebas que hoy exigen retener el modal o una lectura redundante, conservando las de aislamiento, precisión y recuperación. El cambio se puede revertir con la versión anterior del frontend. Los movimientos ya confirmados permanecen en Spring.
