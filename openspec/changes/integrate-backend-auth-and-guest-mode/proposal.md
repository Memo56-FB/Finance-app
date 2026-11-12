# Proposal

## Why

El frontend permite entrar directamente a todas las pantallas financieras, mientras sus formularios de acceso y registro están deshabilitados. `financeApi` ya ofrece autenticación por sesión y registro; conectarlos permitirá exigir acceso explícito y conservar una demostración sin cuenta mediante el modo invitado.

## What Changes

- Conectar los formularios existentes de `/login` y `/singup` con registro, login, consulta de sesión y logout de Spring Security. El registro confirma la creación y conduce al login; no autentica automáticamente.
- **BREAKING**: exigir una sesión válida o una elección explícita de invitado para acceder a las cinco rutas de `/finance`. Validar en el servidor antes de entregar contenido, incluida navegación mediante React Server Components. `/` resolverá el destino según el acceso disponible.
- Añadir «Continuar como invitado», indicador de demostración, acceso al login y salida del modo invitado. Decisión confirmada por el usuario: usar los datos de ejemplo actuales, sin guardar cambios ni crear una cuenta.
- Añadir `@tanstack/react-query` y `axios` para las peticiones del navegador, con cliente compartido, interceptor CSRF, errores previsibles y limpieza del estado entre sesiones. Conservar la cookie HttpOnly del backend y su protección CSRF.
- Exponer una pasarela limitada de autenticación en Next.js, bajo el mismo origen del frontend, para que tanto el navegador como el servidor puedan comprobar la misma sesión.
- Mantener el renderizado del servidor y los metadatos públicos. Marcar finanzas como no indexable: cerrar su acceso es una decisión de producto; incorporar React Query no obliga a convertir las páginas públicas en contenido disponible solo después de ejecutar JavaScript.
- Localizar los nuevos formularios, errores y controles en inglés y español, conservando el selector que sale de vista al hacer scroll y los importes con `$` sin moneda asignada.

### Fuera de alcance

Integrar datos financieros reales o su persistencia, guardar cambios del invitado, crear cuentas anónimas en el backend, cambiar el contrato de `financeApi`, introducir JWT/OAuth, recuperación de contraseña, verificación por email, «recordarme», renombrar `/singup` o desplegar la aplicación. Incluso con una cuenta válida, los datos financieros seguirán identificados como demostración.

## Capabilities

### New Capabilities

- `session-authentication`: acceso, registro, errores y cierre de sesión con el contrato existente del backend.
- `protected-routes`: comprobación del acceso en servidor, redirecciones seguras y renderizado compatible con la política de indexación.
- `guest-access`: entrada explícita a la demostración sin cuenta, aislamiento de sesiones y salida del modo invitado.
- `http-client`: transporte de sesión, protección CSRF, errores de red y ciclo de caché de las peticiones.

### Modified Capabilities

Ninguna especificación principal: `openspec list --specs` no contiene capacidades publicadas. El acceso público previo a finanzas y las pruebas que exigían formularios deshabilitados se sustituyen deliberadamente; los requisitos de idioma y formato del cambio `keep-language-only-preferences` se conservan.

## Impact

- Frontend: `app/layout.tsx`, `app/page.tsx`, páginas de acceso y registro, layout y cinco páginas financieras; extraer la interacción de transacciones a un componente cliente para poder proteger su página en servidor.
- Incorporaciones acotadas en `app/api/auth/`, `lib/auth/` y `lib/api/`, más controles de sesión y mensajes en `lib/i18n/messages/`.
- Configuración: dependencias y lockfile pnpm, variables de entorno solo de servidor, redirección actual de `next.config.mjs` y configuración de pruebas.
- Verificación: sustituir las pruebas de formularios de demostración deshabilitados, preparar acceso invitado en las regresiones existentes y cubrir cookies, CSRF, errores, rutas directas y separación de usuarios.
- Backend observado en `/home/memo56/projects/financeApp/financeApi`: se reutilizan sus cinco endpoints; no requiere cambios de código ni de base de datos. El despliegue deberá hacer accesible esa API desde el servidor Next.js y coordinar HTTPS y origen permitido.
- Entrega mediante commits atómicos con prefijos convencionales, incluidos los artefactos de planificación.
