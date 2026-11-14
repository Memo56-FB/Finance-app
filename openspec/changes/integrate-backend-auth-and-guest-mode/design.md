# Design

## Context

La motivación está en [proposal.md](./proposal.md). La inspección encontró Next.js 16.4.1, React 19.2.7 y App Router; no hay cliente HTTP, React Query ni autenticación en el frontend. `LoginForm` y `SingupForm` cancelan el submit y mantienen el botón deshabilitado. `next.config.mjs` redirige permanentemente `/` a `/finance`. Transacciones tiene una página cliente con búsqueda, filtros y paginación; las otras cuatro páginas financieras son componentes de servidor. Los datos son fixtures y los diálogos financieros no persisten cambios.

En `../financeApi`, se revisaron `README.md`, `AuthController`, `SecurityConfiguration`, `RegistrationRequest`, `RegistrationExceptionHandler`, propiedades y pruebas de autenticación. El contrato observado es:

| Operación | Contrato existente |
| --- | --- |
| `GET /api/auth/csrf` | Público; `{token, headerName, parameterName}` y sesión anónima cuando hace falta. |
| `POST /api/auth/register` | JSON `{name,email,password}` con CSRF; `201 {name,email}`. No inicia sesión. |
| `POST /api/auth/login` | Formulario URL encoded con `email,password` y CSRF; `204` o `401`, sin cuerpo. |
| `GET /api/auth/me` | `200 {email}` con sesión; `401` sin ella. No devuelve nombre. |
| `POST /api/auth/logout` | CSRF; invalida sesión, elimina `JSESSIONID` y devuelve `204`. |

Registro devuelve problemas de validación `400` y duplicados `409`; CSRF inválido devuelve `403`. El login rota la sesión y descarta el token CSRF anterior. Las cookies son HttpOnly, SameSite=Lax y Secure fuera del perfil local. Las cuentas están en PostgreSQL, pero las sesiones viven en memoria. El único origen CORS permitido se configura mediante `FINANCE_FRONTEND_ORIGIN`.

No hay specs principales publicadas en este frontend. Los cambios históricos de idioma se mantienen; sus pruebas de acceso público y formularios deshabilitados deben ajustarse explícitamente.

## Goals / Non-Goals

**Goals:** reutilizar una sola autoridad de sesión, comprobarla antes del contenido protegido, distinguir cuenta/invitado/anónimo y mantener las páginas públicas renderizadas por Next.js. Incorporar las dos dependencias solicitadas sin convertir la aplicación completa en cliente.

**Non-Goals:** no crear una segunda sesión firmada, servicio de identidad o persistencia financiera. El alcance funcional excluido está en la propuesta. No añadir librería de formularios, caché persistida, cola offline, devtools, middleware de autorización adicional ni una pasarela genérica para APIs futuras.

## Decisions

### 1. Pasarela de autenticación del mismo origen

Usar un Route Handler acotado, `app/api/auth/[action]/route.ts`, para las cinco operaciones del backend y la operación local `guest`. Una tabla cerrada de método/acción impide usarlo como proxy arbitrario. Las variables propuestas son `FINANCE_API_URL` y `FINANCE_APP_ORIGIN`, solo de servidor, documentadas en `.env.example`; localmente serán `http://localhost:8080` y `http://localhost:3000`. Validar la configuración al usarla, sin exigir que la API esté disponible durante build ni para visitar la demo.

El navegador llama a `/api/auth/...`. El handler usa `fetch` hacia el origen configurado, `cache: 'no-store'`, timeout de 10 segundos y sin seguir redirecciones inesperadas. Solo reenvía `JSESSIONID`, el tipo de contenido necesario, el encabezado CSRF y el origen ya validado. No reenvía todas las cookies ni cabeceras arbitrarias. Los POST de cuenta requieren el token aportado por el cliente: el handler no lo obtiene por él. Validar formato y tamaño acotado de los cuerpos de autenticación antes de reenviar, sin registrar sus valores.

Conservar estado y cuerpo del contrato, incluidos problemas de registro y respuestas `204` vacías; sustituir errores de infraestructura por respuestas genéricas, sin detalles internos. Las respuestas de autenticación llevan `Cache-Control: private, no-store`. Reenviar individualmente cada `Set-Cookie` de sesión con la API de cabeceras del runtime Node, sin separarlo por comas. Conservar HttpOnly, SameSite, Secure, Path y eliminación; el contrato esperado de `JSESSIONID` es host-only con `Path=/`, necesario para que llegue también a `/finance`. Verificarlo en la prueba contra Spring.

Comparar `Origin` de toda mutación, incluidas entrada y salida de invitado, con `FINANCE_APP_ORIGIN`; rechazar valores ausentes o ajenos. Usar ese mismo origen en `FINANCE_FRONTEND_ORIGIN` del backend. No confiar en una URL de destino o un host arbitrario enviados por el cliente. No habilitar CORS abierto en Next.js ni desactivar CSRF en Spring.

Las consultas desde componentes de servidor van directamente a `financeApi` mediante un helper `server-only`, reenviando únicamente la cookie de esa solicitud. No hacen una vuelta HTTP al propio frontend. El servidor no conserva un cookie jar compartido.

**Alternativas:** llamadas directas del navegador al backend dejarían la cookie en otro host al desplegar y dificultarían la comprobación SSR. Un rewrite transportaría llamadas, pero aquí también se necesitan límites de operación, validación de origen y transiciones de la cookie invitada. JWT o un proveedor de auth duplicarían el sistema ya construido. La pasarela conserva Spring como autoridad.

### 2. Axios y React Query para el estado remoto del navegador

Agregar `axios` y `@tanstack/react-query` v5 con versiones compatibles con React 19 y lockfile pnpm. Un `QueryClientProvider` pequeño envuelve los hijos del layout raíz, que continúa siendo de servidor junto con `PreferencesProvider`. Cada render del servidor tiene su propio QueryClient; la instancia del navegador se conserva durante su ciclo de vida. No se comparte una instancia global entre solicitudes del servidor.

Separar responsabilidades sin una capa genérica adicional:

- `lib/api/client.ts`: instancia Axios de navegador para `/api/auth`, `withCredentials: true`, timeout de 15 segundos, interceptores y estado CSRF transitorio.
- `lib/auth/client.ts`: funciones de contrato y hooks de sesión/mutaciones. El login utiliza `URLSearchParams`; registro utiliza JSON; logout no parsea un cuerpo vacío.
- `lib/auth/server.ts`: comprobación de acceso en servidor, sin importar Axios del navegador ni hooks.

El interceptor de peticiones obtiene CSRF antes de mutaciones de cuenta y envía `headerName: token`. Valida la respuesta esperada (`X-CSRF-TOKEN` en este backend). Una única promesa en curso coordina la adquisición inicial; GET de CSRF y operaciones locales de invitado quedan excluidos para evitar recursión y dependencia innecesaria del backend.

El interceptor de respuestas convierte fallos en errores pequeños por estado/campo, sin adjuntar el objeto Axios completo con credenciales. Descarta CSRF tras login/logout exitosos y tras `403`. Antes de la siguiente mutación se obtiene un token nuevo. No reenvía automáticamente un POST. El error llega al hook que conoce su contexto: un `401` de login es un error del formulario; un `401` de la identidad de una cuenta activa inicia la salida hacia login. No hay redirección global indiscriminada para cada `401`.

Usar `useMutation` para acceso, registro, logout y modo invitado con `retry: false` y sin pausa/cola offline que reenvíe credenciales al reconectar (`networkMode: 'always'` para esos intentos). Restablecer el estado de las mutaciones al resolverlas para no conservar contraseñas en sus variables más tiempo del necesario. La consulta de cuenta usa `/me`, solo está habilitada para acceso de cuenta y recibe únicamente `{email}` inicial del servidor; puede revalidar al recuperar foco, sin polling ni reintentos automáticos de auth. El estado cliente nunca concede acceso por sí solo.

**Alternativa:** `fetch` bastaría para los formularios, pero el usuario pidió React Query y Axios para organizar peticiones. Se limitan al estado remoto que existe; los fixtures financieros no se convierten en consultas artificiales.

### 3. Estado de acceso y modo invitado

Representar únicamente `anonymous`, `guest` y `account {email}`, con un resultado separado `unavailable` cuando la identidad no puede comprobarse. No usar un booleano local como prueba de cuenta.

`POST /api/auth/guest` activa una cookie `finance-guest=1`, HttpOnly, SameSite=Lax, Path=/ y Secure bajo HTTPS, sin Max-Age para mantener semántica de cookie de sesión. `DELETE /api/auth/guest` la elimina. Ambas operaciones son locales, validan Origin y limpian la cookie local `JSESSIONID` para que entrar o salir de la demo no restaure una identidad anterior. Esta limpieza local no se presenta como revocación de una sesión remota; las cuentas disponen del logout real.

El marcador invitado se comprueba antes de consultar identidad: con él solo se permite demo y no se consulta el backend. Puede coexistir con una sesión anónima de CSRF creada al intentar login/registro. `/api/auth/me` no devuelve una identidad de cuenta mientras siga activo el marcador. Un valor inventado puede, como máximo, seleccionar la misma demo pública que ofrece el botón; no concede permisos de cuenta. No se añade firma o secreto a un marcador que nunca autoriza datos privados.

Un login `204` elimina la cookie invitada en la misma respuesta que transporta la cookie de Spring. Luego se comprueba `/me`; si esa comprobación falla por infraestructura, se ofrece reintentar `/me` sin reenviar la contraseña. El registro no elimina invitado ni autentica. El logout de cuenta se envía a Spring y solo se presenta como exitoso tras su confirmación; salir de invitado usa la operación local y funciona sin API.

Tras confirmar una transición de acceso, cancelar consultas, vaciar la caché de React Query y el token CSRF y usar navegación completa con `location.replace` hacia un destino validado. El coste de una recarga al entrar o salir evita que el Router Cache, módulos de cliente o datos de otra identidad sobrevivan a la transición. Añadir manejo de restauración desde bfcache para recargar y revalidar antes de restaurar una vista protegida tras salir. La navegación normal entre páginas financieras sigue siendo de Next.js.

**Alternativas:** una cuenta compartida de demo mezclaría identidad y datos; guardar cambios locales ampliaría el producto y fue descartado por el usuario. Una segunda sesión autenticada en Next duplicaría revocación y caducidad sin necesidad.

### 4. Protección junto a cada entrada de página

`getAccess` consulta `/me` con la cookie de la petición, sin caché persistente; `React.cache` solo deduplica el trabajo del mismo render. Sin cookie de cuenta ni invitado devuelve anónimo sin contactar el backend. Un `401` es anónimo; red, timeout, `5xx` o una respuesta de identidad inválida son `unavailable`.

Cada una de las cinco páginas financieras ejecuta el helper de protección antes de devolver su contenido. Extraer el cuerpo interactivo actual de `app/finance/transactions/page.tsx` a `app/ui/transactions/TransactionsPage.tsx`, conservando filtros, estado de búsqueda, Suspense y paginación; su página se convierte en la entrada de servidor protegida. No reescribir las tablas o sus utilidades.

El layout comparte la lectura de acceso para mostrar controles e identidad mínima. No puede ser la única barrera: Next puede reutilizar layouts y solicitar contenido de páginas por separado. Tampoco debe ganar una carrera de redirecciones con un destino genérico: si no hay acceso, deja que la página protegida resuelva la redirección con su ruta y searchParams, sin renderizar el shell de finanzas. No se incorpora `proxy.ts` con otra consulta remota de sesión.

| Ruta/operación | Anónimo | Invitado | Cuenta válida |
| --- | --- | --- | --- |
| `/` | Login | Finanzas | Finanzas |
| `/login`, `/singup` | Formulario | Formulario para cambiar a cuenta | Destino financiero permitido |
| Cinco páginas de `/finance` | Login con retorno | Demo | Demo con acceso de cuenta |
| Identidad privada `/api/auth/me` | `401` | `401`, sin identidad | Contrato de Spring |
| Recursos estáticos y operaciones públicas de auth | Disponibles según método, origen y CSRF | Igual | Igual |

Eliminar la redirección permanente de `next.config.mjs`; `app/page.tsx` resuelve una redirección temporal. Clientes que hayan conservado el antiguo redirect a `/finance` igualmente encontrarán su guard de acceso.

El destino `next` admite solo las cinco rutas financieras locales y sus query strings. Analizar la URL con origen fijo y rechazar origen distinto, doble barra inicial, barras invertidas, variantes codificadas de rutas no permitidas y destinos de auth; usar `/finance` como fallback. Cada página conoce su pathname y recoge sus searchParams, sin depender de cabeceras controladas por el cliente.

Si la API no permite comprobar una cuenta, dirigir al login con motivo de indisponibilidad y destino conservado, sin borrar la cookie ni conceder invitado automáticamente. Las páginas públicas no se bloquean por esa indisponibilidad: muestran aviso, reintento y la elección de invitado. Un rechazo confirmado de sesión conduce al login sin anunciar fallo de infraestructura.

**Alternativas:** un guard exclusivamente cliente filtra el contenido antes de comprobar identidad; un layout como único guard deja huecos en navegación/RSC; comprobar solamente que existe `JSESSIONID` confunde sesiones anónimas de CSRF con cuentas autenticadas.

### 5. Formularios, controles y compatibilidad visual

Reutilizar `Input`, `InputPassword`, `Button`, mensajes y el estilo de formularios existente. Validar límites de registro con las capacidades estándar, incluida `TextEncoder` para los 72 bytes de contraseña; no imponer al login las reglas de creación de contraseñas. El backend sigue normalizando y validando definitivamente nombre y email. Nunca recortar contraseña.

Conservar `method="post"`; mantener los controles de envío deshabilitados hasta que el formulario esté hidratado y añadir explicación `noscript`. El submit JavaScript envía por Axios. Los errores `400` se asignan a campos conocidos y a mensajes locales, sin copiar mensajes españoles del backend sobre una interfaz inglesa; `409` corresponde al email y los errores desconocidos son generales. Usar `autocomplete` apropiado, asociaciones de errores con campos y un anuncio accesible. Evitar envíos o cambios de modo simultáneos mientras hay una mutación pendiente.

El `201` de registro muestra confirmación y enlace al login con `next` validado, sin email o contraseña en query strings ni login automático. Puede resolverse en el propio formulario; no hace falta una nueva ruta de confirmación.

Los controles de sesión están a la izquierda del encabezado desplazable y el selector de idioma a la derecha, separados con `justify-between`. La salida usa un icono con nombre accesible y tooltip nativo `Cerrar sesión` en español o `Logout` en inglés. Invitado conserva el enlace al login. Por petición del usuario se elimina la leyenda permanente de datos de ejemplo. El selector continúa arriba a la derecha, sin sticky/fixed; el sidebar sigue ocupando desde el borde superior. Las acciones de sesión no se agregan como un sexto elemento a la navegación móvil existente.

### 6. Renderizado e indexación

Conservar los componentes de servidor y el HTML inicial de formularios, títulos, descripciones e idioma. El provider de React Query recibe hijos renderizados por el servidor, sin trasladar toda la aplicación a `use client`. No se necesita deshidratar una caché completa para un DTO de sesión; tokens y contraseñas nunca se serializan a HTML.

Establecer `robots: {index: false, follow: false}` en el segmento financiero y mantener respuestas personalizadas fuera de cachés compartidas. No añadir `noindex` global a las páginas públicas ni un bloqueo global de robots. Los buscadores dejan de ver finanzas por el requisito de acceso; no se promete conservar su indexación anterior. La arquitectura propuesta permite usar React Query sin eliminar el renderizado público existente.

### 7. Verificación ajustada a esta integración

Las pruebas unitarias cubren normalización y validación, destino de retorno, diferencia entre `401` e indisponibilidad, sesión por petición, origen/método permitido, transporte y eliminación de cookies, CSRF concurrente/rotado y ausencia de replay de POST. Los formularios se renderizan con QueryClient aislado por prueba; cambiar solo sus tests afectados en `tests/interaction-smoke.test.tsx`.

Para E2E usar un backend HTTP de prueba que reproduzca los contratos de Spring y sea accesible desde el servidor Next, con sesiones y CSRF aislados por navegador. `page.route()` por sí solo no intercepta las consultas SSR y no demuestra la protección real. Playwright levantará esa API y un Next de pruebas con configuración explícita, evitando reutilizar un servidor de desarrollo que apunte a otra API. Si se usa un puerto distinto, sustituir los orígenes `localhost:3000` fijos de las cookies en las pruebas por el baseURL configurado.

Preparar entrada de invitado en las regresiones financieras existentes, sin desactivar el guard bajo `NODE_ENV=test`. Sustituir únicamente las expectativas obsoletas de formularios deshabilitados en las pruebas de auditoría y localización. Comprobar los flujos de las cuatro specs, HTML/RSC anónimo sin contenido, retorno a filtros, expiración, logout e historial, separación de dos cuentas e invitado, API caída y 320/390/1280 px en ambos idiomas. Conservar las verificaciones actuales de `$`, selector y navegación.

Completar además una prueba real contra Spring y una base aislada: CSRF → registro → `/me` `401` → login → cookie rotada → `/me` `200` → CSRF nuevo → logout → `/me` `401`. Las credenciales de prueba son desechables y no se imprimen. El simulador comprueba el frontend; la prueba real confirma el transporte de cookies y contrato del backend. Si no puede ejecutarse por requisitos de Java/Docker, documentar esa limitación y no declararla aprobada.

## Risks / Trade-offs

- Sesiones de Spring en memoria → reiniciar la API obliga a iniciar sesión otra vez; no añadir silenciosamente refresh tokens ni almacenamiento de sesión en este cambio.
- API no accesible desde el host de Next.js → configurar una URL alcanzable desde el servidor; `localhost:8080` es solo para desarrollo en la misma máquina.
- HTTPS, origen o alcance de cookie mal configurados → prueba real de creación/rotación/eliminación y documentación de los dos servicios; Secure nunca se rebaja para producción.
- Backend local aún sin limitación de intentos → antes de exponer login/registro públicamente, configurar límites en el ingress, tal como ya indica `financeApi/README.md`. No se incluye un despliegue en este cambio.
- Cookie de sesión de invitado restaurada por el navegador → no prometer que cerrar una ventana siempre termina la demo; la salida explícita elimina su acceso local.
- Contenido ya mostrado en una pestaña antes de caducar → revalidar al recuperar foco y en cada nueva petición protegida; no prometer borrar retroactivamente datos ya entregados. Las transiciones explícitas limpian cachés y fuerzan comprobación al restaurar historial.
- Finanzas sigue usando fixtures tras login → conservar la documentación y mantener bloqueadas las operaciones no persistidas.
- Coste de comprobar `/me` en SSR → deduplicar dentro de la petición; no sacrificar revocación compartiendo identidad entre solicitudes.

## Migration Plan

1. La implementación y sus comprobaciones se completaron sin commits durante el apply. Tras la revisión y autorización del usuario, registrar los cambios en commits atómicos con prefijo; no desplegar un estado intermedio con protección parcial.
2. Documentar variables, arranque de ambos servicios, límites existentes y prueba real. No hay migración de datos ni cambios de código requeridos en `financeApi`.
3. Ejecutar pruebas, tipos, lint y build, verificar el cambio OpenSpec y registrar resultados antes de considerar terminado el apply.
4. La publicación es un trabajo separado. Si se revierte una implementación publicada, no volver a servir finanzas públicamente: mantener una versión de mantenimiento o el guard de acceso mientras se retiran las piezas defectuosas. Las cuentas ya creadas en el backend se conservan.

## References

- [Next.js: comprobaciones de autenticación en páginas y layouts](https://nextjs.org/docs/app/guides/authentication#layouts-and-auth-checks).
- [Next.js: pasarela y consultas directas desde Server Components](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components).
- [TanStack Query: integración con Server Components y SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).
- [Axios: interceptores de petición y respuesta](https://axios-http.com/docs/interceptors).
- [Spring Security: CSRF y renovación después de autenticación/logout](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).
- [Google Search: renderizado e indexación de JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

Las fuentes se consultaron para confirmar compatibilidad y límites. Los endpoints, formatos y restricciones específicos proceden del código local inspeccionado de `financeApi`.
