# Design

## Context

En Spring, `RegistrationRequest` valida `name` y `RegistrationService` lo inserta y lo devuelve. Flyway V2 añadió `users.name` como columna nullable. El principal de Spring y las relaciones de propiedad de los datos financieros ya usan `username`.

En Next.js, `AccountForm` envía el nombre y el proxy rechaza el JSON si falta. Para Finanzas, el layout y `FinanceEntry` comparten `getAccess()`, que deduplica `upstream('me')` dentro de una petición de servidor. En el navegador, `AccountScope` vuelve a llamar a `currentAccount()` al montar y al recibir `finance-navigation` desde `FinanceView`. El login y la reconciliación entre pestañas también usan ese método con fines distintos.

El catálogo principal de OpenSpec está vacío. Los cambios anteriores aún sin archivar contienen `session-authentication`, `protected-routes`, `financial-navigation` y, en la API, `user-registration`. Sus textos antiguos exigen nombre y email, o una consulta de identidad al volver a una vista en caché. Este cambio especifica el contrato vigente con username, sustituye esas exigencias y conserva la comprobación del servidor en entradas protegidas. Al consolidar esas propuestas debe prevalecer el comportamiento descrito aquí.

## Goals / Non-Goals

La unidad de aislamiento de los datos en la interfaz será la sesión que Spring autorizó. El registro, el login y la consulta explícita de identidad seguirán siendo operaciones diferenciadas. Los nombres de categorías, apartados y transacciones pertenecen al dominio financiero.

## Decisions

1. **Reducir el contrato de alta en ambos extremos.** Spring acepta usuario y contraseña, omite `name` en el `INSERT` y responde con el DTO de usuario público que sólo contiene `username`. Tolera un `name` legado sin validarlo ni persistirlo. Next.js valida los dos campos de credenciales y reenvía únicamente esos campos. Eliminar también el estado, mensajes exclusivos y control de nombre del formulario. Mantener la columna histórica evita borrar datos y permite desplegar las aplicaciones por separado.

2. **Usar la primera lectura autorizada que ya necesita cada página.** En las entradas financieras, resolver primero el modo invitado o la ausencia de cookie. Con una cookie candidata, en `FinanceEntry` usar el `QueryClient` de esa petición y esperar mediante `fetchQuery` una consulta necesaria. Usar resumen para Resumen, categorías para Categorías y Transacciones, presupuestos para Presupuestos, apartados para Apartados y resumen de pagos para Pagos recurrentes. Respetar los parámetros de la consulta existente. Hidratar ese resultado con su misma clave y mantener en paralelo las demás precargas que ya realiza la vista. Un `200` válido de Spring, incluida una lista vacía, permite montar la vista. Comprobar sólo la presencia de `JSESSIONID` admitiría también sesiones anónimas de CSRF.

3. **Compartir el resultado comprobado con el árbol financiero.** Sacar del layout la llamada a `getAccess()` y colocar los controles dependientes de la sesión, `AccountScope` y `SaveOperations` bajo la entrada verificada. Mantener el layout visual y la navegación interna por historial. Reutilizar `sessionTag(session)` como clave de caché tanto en servidor como en cliente y en la cabecera `x-finance-session`. Los consumidores financieros usan la identidad como clave de agrupación. Así pueden trabajar sin pedir el username ni exponer el identificador de sesión. Spring sigue autorizando cada petición y el proxy coteja la etiqueta de la pestaña con la cookie actual. Guardar otra identidad en el navegador o introducir una caché global de sesiones añadiría una fuente de estado obsoleto.

4. **Separar la navegación de los eventos reales de sesión.** Iniciar el contexto cliente ya verificado. Retirar la consulta inicial y la suscripción y emisión de `finance-navigation`, conservando foco y scroll. Mantener `/me` para la confirmación de login y sus reintentos, la resolución de acceso en las rutas públicas de autenticación y la comprobación sensible ante una señal entre pestañas o un rechazo financiero. En la comprobación sensible, un éxito con la etiqueta esperada confirma la misma sesión. Un cambio de cookie, logout o invitado obliga a limpiar y volver a resolver el destino en el servidor. Conservar cancelación, ocultación, bloqueo de guardados y descarte de respuestas tardías. Una comprobación sensible fallida por red permite reintento con los datos ocultos.

## Risks / Trade-offs

- **Spring se reinicia o revoca una sesión mientras la pestaña sólo lee caché** → La copia en memoria puede seguir visible hasta la siguiente operación protegida o señal de sesión. A partir de esa señal se oculta la vista. El historial no debe restaurarla después del logout.
- **La lectura de entrada tarda o falla** → Mostrar carga neutral mientras se confirma. Ante `401`, redirigir al login con retorno seguro. Ante red, `5xx` o respuesta inválida, mostrar un error recuperable en la entrada con reintento de la lectura. Evitar un bucle de redirección si el servicio de identidad funciona y el financiero sigue caído. Los fallos de otras consultas se muestran en sus bloques.
- **Una prueba de navegador sólo ve el primer tramo** → Medir por separado el tráfico del navegador y el recibido por el servidor de pruebas que sustituye a Spring, aislado por sesión.

## Migration Plan

Publicar primero la API compatible con peticiones antiguas y nuevas. El frontend anterior usa el estado `201` para confirmar el alta. Después publicar el frontend con el formulario de dos campos. Un consumidor externo que lea `name` de la respuesta deberá actualizarse antes del cambio de la API. Para revertir ambos componentes, volver primero al frontend anterior y después a la API anterior. Las cuentas creadas sin nombre ya pueden iniciar sesión con esa versión.
