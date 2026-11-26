# Proposal

## Why

Cuando Spring tarda en responder, el diálogo se cierra, pero el presupuesto recién creado aún no aparece. En la carga inicial, «Cargando…» tampoco permite distinguir si falta una tabla completa, una tarjeta o solo un dato dentro de ella.

## What Changes

- Mostrar en cuanto se acepta un envío su efecto en las vistas que corresponden. Por ejemplo, crear un presupuesto muestra su tarjeta, reserva la categoría y actualiza la vista previa de Resumen según sus reglas de orden y límite.
- Actualizar también los saldos y totales calculables con los datos disponibles. Por ejemplo, depositar $25 en un apartado con $100 muestra $125 al instante. Un rechazo deshace únicamente su efecto y permite recuperar el borrador. Una respuesta perdida ofrece verificación sin repetir la escritura.
- Sustituir la franja de pendientes y las etiquetas de validación rutinarias por el resultado visible. Conservar las acciones que sí requieren atención, incluidos conflictos, verificación y deshacer.
- Componer indicadores Skeleton de shadcn para cada sección, bloque y control que espera datos. Conservar el contenido utilizable durante una actualización en segundo plano, también cuando incluye un cambio optimista. [Skeleton de shadcn/ui, variante Base](https://ui.shadcn.com/docs/components/base/skeleton)

## Capabilities

### New Capabilities

- `loading-skeletons` cubre las esperas visibles de navegación, lectura, sesión y controles, con presentación por región, tamaño de pantalla y tecnología de asistencia.

### Modified Capabilities

- `financial-background-saves` amplía el guardado durante la navegación con efectos inmediatos para altas, ediciones, bajas y operaciones financieras. El catálogo principal aún está vacío. El delta usa el nombre y los requisitos del predecesor implementado `enable-instant-navigation-and-background-saves`. Al sincronizar o archivar, el predecesor debe incorporarse primero.

## Impact

El cambio de producto corresponde al frontend. Afecta al coordinador `SaveOperations`, a las consultas y vistas financieras, a los límites de carga de Next, a autenticación, preferencias, mensajes en español e inglés y pruebas con respuestas demoradas. Se reutilizan las operaciones de Spring y sus identificadores, controles de sesión y validaciones. Los cambios en pantalla viven en memoria durante la sesión de la pestaña.
