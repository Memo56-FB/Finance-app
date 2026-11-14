# Tasks

El apply se realizó sin commits, según la instrucción inicial. El usuario ya revisó los cambios y autorizó su registro en commits atómicos con prefijo. Las tareas completadas conservan el alcance de aquella fase de implementación. No desplegar estados intermedios ni incluir cambios ajenos.

## 1. Transporte HTTP y dependencias

- [x] 1.1 Agregar Axios y TanStack Query v5 compatibles con React 19, actualizar el lockfile pnpm y montar un QueryClientProvider cliente preservando `app/layout.tsx` como servidor; verificar instalación, tipos y aislamiento de QueryClient entre renders del servidor con una prueba focalizada.
- [x] 1.2 Implementar la pasarela limitada de las cinco operaciones de Spring en `app/api/auth/[action]/route.ts`, con configuración solo de servidor, allowlist, validación de Origin/cuerpo, timeout, no-store y transporte correcto de `JSESSIONID`/Set-Cookie; verificar mediante tests métodos rechazados, origen ajeno, cuerpos inválidos, cookie rotada/eliminada, `204` vacío y errores sin secretos.
- [x] 1.3 Crear `lib/api/client.ts` con la instancia Axios y sus interceptores de CSRF/errores; probar adquisición inicial compartida, encabezado correcto, exclusión del propio GET de CSRF, invalidación después de login/logout/403, timeout y ausencia de replay automático de POST.
- [x] 1.4 Documentar `FINANCE_API_URL`, `FINANCE_APP_ORIGIN`, el origen de Spring y los contratos del transporte en `.env.example` y README; contrastar los ejemplos con el contrato inspeccionado y verificar que ninguna variable de autenticación usa `NEXT_PUBLIC_` ni contiene secretos reales.
- [x] 1.5 Ejecutar los tests nuevos del transporte, tipos y `git diff --check`, revisar el diff; dejar los cambios listos para revisión, sin crear commits.

## 2. Estado de sesión y modo invitado

- [x] 2.1 Crear `lib/auth/server.ts` para resolver anónimo, invitado, cuenta e indisponibilidad, consultando `/me` con cookies por petición y sin caché compartida; probar ausencia de cookie, `200`, `401`, respuesta inválida, timeout y dos usuarios simultáneos sin mezcla de identidad.
- [x] 2.2 Implementar POST/DELETE locales de invitado, cookie HttpOnly de sesión, comprobación de origen, limpieza de sesión local y exclusión de identidad privada mientras está activo; probar entrada/salida con la API detenida, ausencia de cuentas creadas y que el marcador nunca concede acceso de cuenta.
- [x] 2.3 Implementar validación de `next` limitada a las cinco rutas financieras conservando query strings; cubrir destinos externos, dobles barras, barras invertidas, variantes codificadas, destinos de auth y retorno válido a transacciones filtradas mediante tests unitarios.
- [x] 2.4 Crear funciones y hooks de auth para los contratos reales, consulta `/me` solo de cuenta y mutaciones sin reintentos ni cola offline; probar registro sin login, `401` público sin redirección global, CSRF renovado, login seguido de fallo de `/me` con reintento de comprobación y limpieza de variables sensibles/caché al cambiar de acceso.
- [x] 2.5 Documentar el modo invitado confirmado y la diferencia entre cookie local y sesión real, ejecutar los tests de este grupo y tipos; dejar los cambios listos para revisión, sin crear commits.

## 3. Formularios y controles de acceso

- [x] 3.1 Conectar `LoginForm` al contrato URL encoded, normalizar email sin modificar contraseña y añadir estados pendiente, error y comprobación de sesión; probar credenciales válidas/rechazadas, espacios de contraseña, envío único con Enter y ausencia de credenciales en URL.
- [x] 3.2 Conectar `SingupForm` al registro JSON, validar límites de nombre/email/contraseña con TextEncoder y mostrar confirmación sin login automático; probar mínimo de 8, máximos UTF-16/UTF-8, errores `400`/`409`, contraseña intacta y conservación de `next` sin datos personales en URL.
- [x] 3.3 Añadir entrada de invitado en ambos formularios y controles para ir al login, salir de invitado o cerrar sesión; integrar limpieza de caché y navegación completa solo en transiciones, y comprobar con tests de interacción que logout fallido no se presenta como éxito ni reactiva invitado.
- [x] 3.4 Completar mensajes ingleses/españoles, autocomplete, errores accesibles y estado sin JavaScript, manteniendo los controles de envío seguros antes de hidratar; sustituir las expectativas de formularios deshabilitados en `tests/interaction-smoke.test.tsx` y verificar formularios con QueryClient aislado por prueba.
- [x] 3.5 Incorporar los controles de sesión al área desplazable financiera sin alterar Sidebar ni volver sticky el selector; verificar visualmente 320/390/1280 px, teclado, ambas lenguas y que los controles financieros que no persisten sigan deshabilitados.
- [x] 3.6 Documentar registro → login, salida y límites de los datos de ejemplo, ejecutar tests de formularios, tipos y lint; dejar los cambios listos para revisión, sin crear commits.

## 4. Protección de rutas y regresiones de navegación

- [x] 4.1 Proteger las cinco páginas financieras antes de devolver contenido y extraer únicamente la interacción de transacciones a `app/ui/transactions/TransactionsPage.tsx`; conectar el layout al mismo estado sin depender de él como único guard ni perder `next`, y verificar permisos y filtros con las pruebas de navegación de este grupo.
- [x] 4.2 Sustituir la redirección permanente de `/`, resolver acceso en raíz/login/registro, mantener formularios disponibles ante indisponibilidad y añadir noindex/nofollow a finanzas; verificar redirecciones temporales, páginas públicas con sesión/guest/anónimo y HTML inicial con metadatos e idioma.
- [x] 4.3 Preparar un backend HTTP de pruebas con sesiones/CSRF y configurar Playwright con una instancia Next aislada y variables explícitas, accesible también para las llamadas SSR; verificar el ciclo CSRF-login-me-logout contra el simulador y que el runner no reutiliza una API o servidor de desarrollo ajenos.
- [x] 4.4 Adaptar `navigation-baseline`, `audit-regressions` y `localization` para entrar como invitado en finanzas, usar el origen configurado y sustituir solamente las expectativas obsoletas de auth; verificar que conservan filtros, paginación, formatos `$`, idiomas, navegación móvil y scroll del selector.
- [x] 4.5 Añadir E2E para cada ruta protegida por HTML y RSC, sesiones falsas/caducadas, retorno seguro, API caída sin acceso implícito, invitado offline y dos cuentas aisladas; verificar que no se entrega contenido protegido a anónimos ni se comparten cookies o estado.
- [x] 4.6 Cubrir login/logout/cambio de modo e historial, incluyendo restauración bfcache, limpiando/revalidando la vista antes de reutilizar acceso anterior; verificar con E2E que volver atrás o abrir otra ruta después de salir vuelve a exigir acceso y que invitado → cuenta no conserva identidad anterior.
- [x] 4.7 Documentar la matriz de acceso, comandos del entorno E2E y política de indexación en README, ejecutar las suites afectadas y `git diff --check`; dejar los cambios listos para revisión, sin crear commits.

## 5. Verificación integrada y cierre de implementación

- [x] 5.1 Ejecutar `pnpm test`, `pnpm test:e2e`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` sobre la implementación completa; registrar resultados y comprobar que build y demo no requieren una API activa. Repetir solo lo afectado por correcciones posteriores.
- [x] 5.2 Ejecutar la prueba real Next → Spring con base y cuenta desechables: CSRF, registro, `/me` anónimo, login, rotación y atributos de cookie, `/me` autenticado, CSRF nuevo, logout y rechazo posterior; registrar evidencia sin credenciales. Si falta Java/Docker u otro requisito, dejar esta tarea pendiente y documentar exactamente la validación no realizada.
- [x] 5.3 Registrar la evidencia final y cualquier limitación real, revisar que las cuatro specs están cubiertas, ejecutar `openspec validate integrate-backend-auth-and-guest-mode --strict`; dejar los cambios listos para revisión, sin crear commits.

## Evidencia de verificación

- Unitarias: 40 pruebas en 11 archivos; incluyen aislamiento de sesión/caché, límites de credenciales, destinos, origen, cookies y CSRF.
- E2E: 34 pruebas aprobadas con Next y backend HTTP de pruebas aislados en 3100/3101; incluyen las regresiones de idioma, importes, layout y navegación.
- Tipos, lint, build de producción y validación estricta de OpenSpec aprobados. El build no requirió una API activa.
- Spring real: se compiló el backend existente sin cambiar fuentes y se ejecutó contra PostgreSQL 18 desechable. El smoke reproducible de `tests/integration/auth-real.mjs` aprobó registro, identidad anónima, login por formulario, rotación HttpOnly/Path/SameSite, rechazo del CSRF anterior, renovación y logout con eliminación de sesión.
- Con Spring detenido, se verificaron entrada de invitado, las cinco rutas y salida de invitado. Los servicios y la base desechables se retiraron después.
- No se desplegó ni se modificaron fuentes o datos de desarrollo del backend. No se creó ningún commit ni se añadieron archivos al staging en este apply.
- Limitaciones existentes: los datos financieros continúan siendo de ejemplo y las sesiones de Spring se pierden al reiniciar su proceso. Antes de publicar, aplicar los límites de intentos ya documentados por financeApi.
- Ajuste de encabezado del 13 de noviembre: salida con icono a la izquierda, selector a la derecha y tooltip nativo localizado; leyenda permanente eliminada por petición del usuario. Verificadas 18 pruebas de localización/layout y 9 de autenticación, tipos, lint y OpenSpec. Se revisaron capturas de escritorio y móvil. Se conserva la implementación sin commits.
- Tras la revisión del usuario, se autorizaron y registraron los commits de implementación: `a0fb20e` para Axios/React Query/CSRF y `68f31b2` para autenticación, invitado, rutas protegidas, controles de sesión y pruebas. La documentación se registra por separado. Las 40 pruebas unitarias se ejecutaron nuevamente con éxito antes de crear los commits; no se repitieron build ni integración con Spring.
