# Proposal

## Why

Con una sesión abierta, cambiar de sección puede dejar la pantalla anterior visible mientras Next verifica la identidad con Spring y espera las lecturas de destino. También un guardado lento retiene el diálogo y el teclado hasta que llega la respuesta, incluso cuando la persona sólo quiere consultar otra sección.

## What Changes

- Permitir que el menú, los enlaces de detalle y el historial abran inmediatamente Resumen, Transacciones, Categorías, Presupuestos, Apartados y Pagos recurrentes. Cada destino muestra su título y los datos disponibles de esa cuenta y consulta. Los bloques que todavía necesitan datos muestran su propia carga.
- Aprovechar TanStack Query durante la sesión. Al entrar en Resumen, adelantar en segundo plano las categorías y la primera página habitual de movimientos. Las demás secciones piden lo que muestran, incluidos sus filtros y periodos.
- Entregar un guardado válido a la sesión de la cuenta, liberar el diálogo y mantener su estado accesible desde las seis secciones. Un cambio descriptivo reversible, como renombrar una categoría, se puede ver enseguida. Una operación que afecta dinero, pagos, totales o registros relacionados aparece pendiente hasta que Spring confirme.
- Conservar el borrador para corregir rechazos y permitir consultar el estado del servidor si se pierde una respuesta. Una operación enviada una vez puede seguir su curso al cambiar de página. La navegación, la reconexión y la recuperación de un error nunca reenvían el movimiento.

## Capabilities

### New Capabilities

- `financial-navigation` cubre la navegación interna inmediata, las entradas protegidas por URL, el historial y el uso de datos por cuenta, sección y filtros.
- `financial-background-saves` cubre los guardados durante la navegación, los cambios provisionales, la confirmación financiera y la recuperación de resultados rechazados o inciertos.

### Modified Capabilities

El catálogo principal de OpenSpec aún está vacío. Hay deltas implementados y pendientes de archivo sobre rutas protegidas, lecturas financieras e interacción con formularios. El diseño identifica las reglas de esos deltas que esta propuesta sustituye.

## Impact

El trabajo corresponde a `financeFront`, principalmente a `app/finance`, los enlaces internos, `app/ui/finance`, `lib/finance`, los mensajes en español e inglés y las pruebas de integración de interfaz. Se aprovechan las seis rutas financieras protegidas, el cliente de consultas y la API actual de Spring con sesión y CSRF. El alcance de los guardados pendientes es la pestaña abierta. El reenvío automático de operaciones monetarias requeriría un contrato de idempotencia en Spring y queda fuera de esta entrega.
