# Proposal

## Why

El registro pide un nombre personal que no interviene en el acceso a la cuenta. Al recorrer Finanzas, la aplicación también consulta la identidad en cada cambio de sección, incluso cuando puede mostrar la vista completa desde la caché.

## What Changes

- Pedir únicamente nombre de usuario y contraseña en `/singup` y aceptar esos dos campos en el proxy de Next.js y en Spring. **BREAKING** para consumidores que leen `name` de la respuesta del registro: el `201` devolverá únicamente `username`.
- Aceptar durante la transición clientes que todavía envíen `name`. El registro ignorará ese valor. Las cuentas existentes conservarán sus datos.
- Abrir, recargar y recorrer las seis secciones financieras sin llamadas a `GET /api/auth/me`, tanto del navegador como del servidor. En una entrada directa, Spring ya autentica las lecturas que necesita la pantalla.
- Mantener la consulta explícita de identidad al confirmar el login o resolver una transición de sesión. Una navegación que sólo usa caché podrá detectar una revocación silenciosa en la siguiente operación protegida o señal de sesión.

## Capabilities

### New Capabilities

- `session-authentication` cubre el contrato de registro de extremo a extremo.
- `financial-navigation` cubre el acceso verificado y el número de peticiones al entrar y navegar.

### Modified Capabilities

## Impact

Un solo plan coordina `financeApi` y `financeFront`. Afecta al DTO y servicio de registro de Spring, al formulario y al proxy de autenticación de Next.js, y a la entrada de servidor y el contexto de sesión de Finanzas. Incluye los contratos de prueba, la documentación de ambas aplicaciones y una comprobación de tráfico en navegador y upstream. La columna opcional `users.name` permite desplegar sin migración.
