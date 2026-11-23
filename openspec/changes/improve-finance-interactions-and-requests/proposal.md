# Proposal

## Why

Al cerrar un formulario, la aplicación vacía los campos mientras todavía dibuja el diálogo y una respuesta tardía puede cerrar el siguiente borrador. En Chromium, una búsqueda de siete letras inició siete lecturas y cambiar el día de corte volvió a pedir seis recursos. [Auditoría y mediciones en `d521aa5`](../../../plans/README.md)

## What Changes

- Conservar campos y título durante el cierre, devolver el foco a un destino útil y asociar el resultado de cada guardado a su propio formulario. Un botón para reintentar una lectura sólo debe iniciar esa lectura.
- Ubicar los formularios de cuenta junto a su módulo, compartir las piezas que tienen varios consumidores y aceptar el día de corte con o sin cero inicial.
- Recuperar el login ante una confirmación de sesión expirada y reconciliar una pestaña abierta cuando cambia la cuenta activa.
- Agrupar la escritura rápida en los buscadores, cancelar lecturas desplazadas, solicitar categorías cuando la pantalla las necesita y refrescar sólo el corte y el resumen tras guardar esa preferencia.
- Omitir el historial de un presupuesto si el total de gasto confirmado es cero. Mostrar el gasto y el límite en el gráfico incluso en ese caso.
- Asociar cabeceras, valores y estado seleccionado en las listas y filtros responsive. Mostrar el origen de un movimiento en su edición con los datos que ya devuelve la API.

## Capabilities

### New Capabilities

- `financial-form-interactions` cubre el ciclo del diálogo, la lectura auxiliar y el envío del formulario.
- `browser-session-consistency` cubre la confirmación de acceso y el cambio de identidad con una pestaña abierta.
- `financial-query-efficiency` cubre las lecturas correspondientes a cada interacción y la exactitud de las vistas con caché.
- `financial-data-presentation` cubre la lectura accesible de filtros y filas, el origen del movimiento y el gráfico con gasto cero.

### Modified Capabilities

El catálogo principal está vacío. Los deltas de integración financiera y acceso ya documentan las reglas de negocio y de privacidad que se usan como base. [Integración financiera](../integrate-financial-modules-and-categories/design.md) · [Acceso por sesión](../integrate-backend-auth-and-guest-mode/design.md)

## Impact

El cambio afecta a las seis vistas financieras, el login, los componentes compartidos, las consultas de cuenta, la pasarela GET y sus pruebas. Se apoya en Radix, Axios y React Query instalados, en las rutas actuales de Spring y en el diseño existente. La medición de historiales grandes y de tarjetas lentas del resumen queda como seguimiento en la auditoría.
