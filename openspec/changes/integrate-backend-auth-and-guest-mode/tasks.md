# Tasks

Cada grupo entrega sus pruebas y documentación junto con el cambio. Crear el commit indicado al cerrar el grupo, incluyendo solo sus archivos y las casillas completadas; dividirlo en commits menores con prefijo si aparecen unidades independientes. No desplegar estados intermedios. Mantener los cambios existentes ajenos a esta propuesta fuera de esos commits.

## 1. Transporte HTTP y dependencias

- [ ] 1.1 Agregar Axios y TanStack Query v5 compatibles con React 19, actualizar el lockfile pnpm y montar un QueryClientProvider cliente preservando `app/layout.tsx` como servidor; verificar instalación, tipos y aislamiento de QueryClient entre renders del servidor con una prueba focalizada.
- [ ] 1.2 Implementar la pasarela limitada de las cinco operaciones de Spring en `app/api/auth/[action]/route.ts`, con configuración solo de servidor, allowlist, validación de Origin/cuerpo, timeout, no-store y transporte correcto de `JSESSIONID`/Set-Cookie; verificar mediante tests métodos rechazados, origen ajeno, cuerpos inválidos, cookie rotada/eliminada, `204` vacío y errores sin secretos.
- [ ] 1.3 Crear `lib/api/client.ts` con la instancia Axios y sus interceptores de CSRF/errores; probar adquisición inicial compartida, encabezado correcto, exclusión del propio GET de CSRF, invalidación después de login/logout/403, timeout y ausencia de replay automático de POST.
- [ ] 1.4 Documentar `FINANCE_API_URL`, `FINANCE_APP_ORIGIN`, el origen de Spring y los contratos del transporte en `.env.example` y README; contrastar los ejemplos con el contrato inspeccionado y verificar que ninguna variable de autenticación usa `NEXT_PUBLIC_` ni contiene secretos reales.
- [ ] 1.5 Ejecutar los tests nuevos del transporte, tipos y `git diff --check`, revisar el diff y crear `feat(api): add session-aware HTTP client`; verificar el contenido del commit y que no incluyó archivos ajenos.

## 2. Estado de sesión y modo invitado

- [ ] 2.1 Crear `lib/auth/server.ts` para resolver anónimo, invitado, cuenta e indisponibilidad, consultando `/me` con cookies por petición y sin caché compartida; probar ausencia de cookie, `200`, `401`, respuesta inválida, timeout y dos usuarios simultáneos sin mezcla de identidad.
- [ ] 2.2 Implementar POST/DELETE locales de invitado, cookie HttpOnly de sesión, comprobación de origen, limpieza de sesión local y exclusión de identidad privada mientras está activo; probar entrada/salida con la API detenida, ausencia de cuentas creadas y que el marcador nunca concede acceso de cuenta.
- [ ] 2.3 Implementar validación de `next` limitada a las cinco rutas financieras conservando query strings; cubrir destinos externos, dobles barras, barras invertidas, variantes codificadas, destinos de auth y retorno válido a transacciones filtradas mediante tests unitarios.
- [ ] 2.4 Crear funciones y hooks de auth para los contratos reales, consulta `/me` solo de cuenta y mutaciones sin reintentos ni cola offline; probar registro sin login, `401` público sin redirección global, CSRF renovado, login seguido de fallo de `/me` con reintento de comprobación y limpieza de variables sensibles/caché al cambiar de acceso.
- [ ] 2.5 Documentar el modo invitado confirmado y la diferencia entre cookie local y sesión real, ejecutar los tests de este grupo y tipos, y crear `feat(auth): add account and guest session state`; verificar que los fixtures y operaciones financieras no adquieren persistencia.

## 3. Formularios y controles de acceso

- [ ] 3.1 Conectar `LoginForm` al contrato URL encoded, normalizar email sin modificar contraseña y añadir estados pendiente, error y comprobación de sesión; probar credenciales válidas/rechazadas, espacios de contraseña, envío único con Enter y ausencia de credenciales en URL.
- [ ] 3.2 Conectar `SingupForm` al registro JSON, validar límites de nombre/email/contraseña con TextEncoder y mostrar confirmación sin login automático; probar mínimo de 8, máximos UTF-16/UTF-8, errores `400`/`409`, contraseña intacta y conservación de `next` sin datos personales en URL.
- [ ] 3.3 Añadir entrada de invitado en ambos formularios y controles para ir al login, salir de invitado o cerrar sesión; integrar limpieza de caché y navegación completa solo en transiciones, y comprobar con tests de interacción que logout fallido no se presenta como éxito ni reactiva invitado.
- [ ] 3.4 Completar mensajes ingleses/españoles, autocomplete, errores accesibles y estado sin JavaScript, manteniendo los controles de envío seguros antes de hidratar; sustituir las expectativas de formularios deshabilitados en `tests/interaction-smoke.test.tsx` y verificar formularios con QueryClient aislado por prueba.
- [ ] 3.5 Incorporar los controles de sesión y aviso de datos de demostración al área desplazable financiera sin alterar Sidebar ni volver sticky el selector; verificar visualmente 320/390/1280 px, teclado, ambas lenguas y que los controles financieros que no persisten sigan deshabilitados.
- [ ] 3.6 Documentar registro → login, salida y límites de los datos de ejemplo, ejecutar tests de formularios, tipos y lint, y crear `feat(auth): connect account forms and guest controls`; verificar que el commit incluye sus mensajes y pruebas.

## 4. Protección de rutas y regresiones de navegación

- [ ] 4.1 Proteger las cinco páginas financieras antes de devolver contenido y extraer únicamente la interacción de transacciones a `app/ui/transactions/TransactionsPage.tsx`; conectar el layout al mismo estado sin depender de él como único guard ni perder `next`, y verificar permisos y filtros con las pruebas de navegación de este grupo.
- [ ] 4.2 Sustituir la redirección permanente de `/`, resolver acceso en raíz/login/registro, mantener formularios disponibles ante indisponibilidad y añadir noindex/nofollow a finanzas; verificar redirecciones temporales, páginas públicas con sesión/guest/anónimo y HTML inicial con metadatos e idioma.
- [ ] 4.3 Preparar un backend HTTP de pruebas con sesiones/CSRF y configurar Playwright con una instancia Next aislada y variables explícitas, accesible también para las llamadas SSR; verificar el ciclo CSRF-login-me-logout contra el simulador y que el runner no reutiliza una API o servidor de desarrollo ajenos.
- [ ] 4.4 Adaptar `navigation-baseline`, `audit-regressions` y `localization` para entrar como invitado en finanzas, usar el origen configurado y sustituir solamente las expectativas obsoletas de auth; verificar que conservan filtros, paginación, formatos `$`, idiomas, navegación móvil y scroll del selector.
- [ ] 4.5 Añadir E2E para cada ruta protegida por HTML y RSC, sesiones falsas/caducadas, retorno seguro, API caída sin acceso implícito, invitado offline y dos cuentas aisladas; verificar que no se entrega contenido protegido a anónimos ni se comparten cookies o estado.
- [ ] 4.6 Cubrir login/logout/cambio de modo e historial, incluyendo restauración bfcache, limpiando/revalidando la vista antes de reutilizar acceso anterior; verificar con E2E que volver atrás o abrir otra ruta después de salir vuelve a exigir acceso y que invitado → cuenta no conserva identidad anterior.
- [ ] 4.7 Documentar la matriz de acceso, comandos del entorno E2E y política de indexación en README, ejecutar las suites afectadas y `git diff --check`, y crear `feat(auth): protect finance routes on the server`; verificar que ninguna ruta usa una excepción de autenticación exclusiva para tests.

## 5. Verificación integrada y cierre de implementación

- [ ] 5.1 Ejecutar `pnpm test`, `pnpm test:e2e`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` sobre la implementación completa; registrar resultados y comprobar que build y demo no requieren una API activa. Repetir solo lo afectado por correcciones posteriores.
- [ ] 5.2 Ejecutar la prueba real Next → Spring con base y cuenta desechables: CSRF, registro, `/me` anónimo, login, rotación y atributos de cookie, `/me` autenticado, CSRF nuevo, logout y rechazo posterior; registrar evidencia sin credenciales. Si falta Java/Docker u otro requisito, dejar esta tarea pendiente y documentar exactamente la validación no realizada.
- [ ] 5.3 Registrar la evidencia final y cualquier limitación real, revisar que las cuatro specs están cubiertas, ejecutar `openspec validate integrate-backend-auth-and-guest-mode --strict` y crear `docs(auth): record backend integration verification`; verificar el historial de commits con prefijo y que no quedan cambios de esta integración sin registrar.
