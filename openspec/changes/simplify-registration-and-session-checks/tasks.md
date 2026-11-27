# Tasks

## 1. Registro en financeApi

- [x] 1.1 Ajustar `RegistrationRequest`, `RegistrationService` y el tipo de respuesta del controlador. Cubrir en `RegistrationRequestTest` y `RegistrationControllerTest` el alta sin nombre, el JSON anterior con nombre ignorado, el cuerpo exacto del `201` y los límites de usuario y contraseña.
- [x] 1.2 Adaptar los constructores y las pruebas de persistencia en `AuthFlowTest`, `PersistentSessionTest` y sus demás consumidores. Sustituir el fallo artificial basado en `users.name` por un fallo sobre un campo que el registro escriba. Verificar alta con nombre nulo en BD, duplicados sin sobrescritura, login posterior y autenticación de cuentas existentes con y sin nombre.
- [x] 1.3 Actualizar el contrato y los ejemplos del README de la API. Contrastar petición y respuesta con las pruebas HTTP, incluido `403` por CSRF, y ejecutar la suite Maven con PostgreSQL de pruebas.

## 2. Registro en financeFront

- [x] 2.1 Reducir el formulario, el tipo `Credentials`, la validación y los mensajes exclusivos de registro a usuario y contraseña. Ajustar el proxy `app/api/auth/[action]/route.ts` para enviar sólo los campos admitidos. Verificar el cuerpo reenviado, JSON incorrecto, tipos inválidos, origen y CSRF con las pruebas del proxy.
- [x] 2.2 Adaptar el fixture de Spring, pruebas unitarias, Playwright y los scripts `auth-real.mjs` y `finance-real.mjs` al contrato de dos campos. Comprobar en español e inglés la ausencia del campo de nombre personal, el conflicto asociado a usuario, la accesibilidad y la confirmación de alta antes del login. Actualizar el ejemplo de registro del README del frontend.

## 3. Entrada protegida y navegación financiera

- [x] 3.1 Adaptar `lib/finance/server.tsx` y el layout financiero para resolver invitado/anónimo y montar el contexto de cuenta tras la lectura protegida de la sección. Usar la etiqueta de sesión para las claves compartidas entre SSR y cliente. Verificar en las pruebas de servidor que dos sesiones se aíslan, una respuesta vacía válida autoriza, la lectura se hidrata una vez y un fallo inicial no entrega datos privados.
- [x] 3.2 Retirar de `FinanceView` y `AccountScope` la revalidación por cambio de página y por montaje. Conservar el enlace de la etiqueta con el proxy, foco, scroll y navegación por historial. Ajustar `scope.test.tsx` y comprobar que montar o recorrer secciones no llama a `currentAccount`, que un guardado sigue funcionando y que un borrador sobrevive a la navegación prevista por la aplicación.
- [x] 3.3 Verificar con las pruebas de sesión que la señal entre pestañas y el rechazo financiero ocultan datos de inmediato, bloquean escrituras, descartan operaciones tardías y permiten reintentar un fallo transitorio. Mantener la confirmación explícita al iniciar sesión, el modo invitado y «Recordar sesión». Actualizar el README para precisar cuándo se comprueba la identidad y cuándo se detecta una revocación.
- [x] 3.4 Actualizar las pruebas que esperan `/me` al entrar o cambiar de sección. Con Playwright y un contador del fixture por sesión, tomar la línea base después del login y exigir cero llamadas adicionales en ambos tramos al entrar por URL, recargar, hidratar, recorrer las seis secciones, filtrar y volver por historial. Incluir vistas con y sin caché y verificar el recorrido de invitado sin tráfico a Spring.

## 4. Verificación integrada

- [x] 4.1 Ejecutar las pruebas de frontend y las suites E2E de autenticación, finanzas y navegación. Verificar en HTML y RSC la redirección con destino seguro ante sesión ausente o expirada y el reintento sin bucle ante servicio caído. Ejecutar el registro y login de integración contra la API local actualizada y comprobar que la nueva cuenta puede acceder y cerrar sesión.
