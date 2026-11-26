# Spec Delta

## MODIFIED Requirements

### Requirement: Un envío válido libera el formulario

La aplicación SHALL cerrar el diálogo al aceptar un envío localmente válido y mostrar el efecto solicitado en el contenido antes de recibir respuesta. La persona SHALL poder navegar y realizar operaciones independientes. La espera ordinaria no requiere franja global, etiqueta de validación ni notificación de éxito anticipada.

#### Scenario: Navegar mientras se guarda

- **WHEN** una persona añade un presupuesto de $500 para Comida y el servidor sigue despertando
- **THEN** el diálogo se cierra, el foco vuelve a la vista y Presupuestos muestra una sola tarjeta de Comida con su límite y color. Si es el primer presupuesto, reemplaza el estado vacío.
- **AND** al navegar a Resumen y regresar, se conserva el presupuesto y su categoría sigue ocupada en el selector de altas. El resumen respeta el límite de cuatro categorías de su vista previa y el total de límites incluye el nuevo presupuesto una sola vez.
- **AND** un doble envío produce una escritura. Los controles que dependen del ID definitivo se habilitan cuando llega ese ID.

#### Scenario: Borrador inválido o cancelado

- **WHEN** se intenta guardar un importe inválido o se cancela la operación
- **THEN** se emiten cero escrituras y cero cambios en las vistas. El formulario inválido conserva el borrador y marca el campo correspondiente.

### Requirement: Previsualización reversible de datos descriptivos

Los cambios sobre categorías, presupuestos y apartados SHALL identificarse por registro y operación. Altas, ediciones y bajas SHALL verse en sus listas, tarjetas, selectores y vistas previas aplicables. Un rechazo SHALL retirar exclusivamente el efecto de la operación rechazada.

#### Scenario: Renombrar una de dos categorías con el mismo nombre

- **WHEN** se renombra una categoría y se vuelve a la lista antes de la respuesta
- **THEN** sólo la categoría editada y las referencias a su identidad muestran el nuevo nombre. La confirmación adopta el nombre canónico y un rechazo devuelve la versión vigente y permite corregir el borrador.

#### Scenario: Dos ediciones independientes

- **WHEN** una edición se confirma y otra se rechaza en orden inverso al de envío
- **THEN** permanece el resultado de la confirmada, se recupera la versión vigente de la rechazada y el foco permanece en el formulario que esté usando la persona.

### Requirement: Confirmación de los cambios financieros

Las escrituras financieras SHALL reflejar inmediatamente los datos conocidos y los efectos calculables con datos completos de la consulta correspondiente. La respuesta de Spring SHALL determinar el resultado definitivo, los IDs, los plazos y las advertencias. Un dato que depende de información ausente SHALL esperar la lectura correspondiente.

#### Scenario: Depositar y consultar Resumen antes de recibir respuesta

- **WHEN** se depositan $25 en un apartado con saldo conocido de $100 y se navega a Resumen antes de recibir respuesta
- **THEN** la tarjeta y la vista previa aplicable muestran $125. Un ingreso, retirada o edición modifica sólo los importes, periodos y movimientos para los que se conoce su efecto.
- **AND** la confirmación adopta los valores devueltos, incluso si difieren de los previstos. El movimiento y sus efectos se contabilizan una vez y los avisos del servidor se entregan una sola vez.

#### Scenario: Marcar pagado o cambiar el corte

- **WHEN** se marca como pagada una cuota o se guardan ajustes de corte
- **THEN** cambia el estado visible de esa cuota y mes, o la configuración visible del corte. El total pagado cambia cuando sus datos lo permiten. Un nuevo periodo sin base suficiente espera su resumen y nunca muestra el del periodo anterior como propio.
- **AND** la confirmación actualiza los recursos afectados sin volver a descargar listas independientes del corte.

#### Scenario: Eliminar un apartado y deshacer desde otra sección

- **WHEN** se elimina un apartado y se abandona la sección antes de recibir respuesta
- **THEN** el apartado desaparece de las vistas activas. Un rechazo lo restablece. Cuando Spring confirma la baja se ofrece deshacer con la identidad y el plazo originales del servidor.
- **AND** una restauración dentro de plazo vuelve a mostrar el apartado conocido mientras se envía una sola solicitud. Un rechazo por vencimiento retira esa restauración y explica el motivo.

#### Scenario: Un presupuesto nuevo tiene gasto previo desconocido

- **WHEN** se crea un presupuesto para una categoría con gastos anteriores cuyo total mensual aún se desconoce
- **THEN** la tarjeta muestra la categoría, color y límite al instante. El gasto, disponible y progreso dependientes del total se completan con datos válidos del mes, sin asumir gasto cero.

#### Scenario: Movimientos en listas filtradas y paginadas

- **WHEN** se crea, modifica o elimina un movimiento o un pago recurrente con búsqueda, periodo, orden y página activos
- **THEN** el cambio aparece en las vistas compatibles y desaparece de aquellas en las que deja de cumplir el filtro. Se respeta el orden y el tamaño de la página cuando su composición es conocida.
- **AND** una página parcial nunca se usa como base para deducir totales globales o ubicar con certeza un elemento en una página desconocida.

## ADDED Requirements

### Requirement: Reconciliación de operaciones visibles

La aplicación SHALL preservar la continuidad del registro entre el envío, la respuesta y la actualización de lecturas. Un estado incierto SHALL mostrarse como tal y permitir verificarlo sin repetir escrituras ni presentar un resultado desconocido como definitivo.

#### Scenario: Alta confirmada mientras llega una lectura anterior

- **WHEN** Spring asigna un ID al presupuesto y una lectura antigua llega antes de que termine la actualización de las listas
- **THEN** permanece una sola tarjeta sin desaparecer entre respuestas. Adopta el ID y los valores canónicos. Un fallo posterior de lectura permite reintentar la lectura sin repetir el alta.

#### Scenario: Rechazo frente a pérdida de respuesta

- **WHEN** Spring devuelve un conflicto por una categoría ocupada
- **THEN** se retira la tarjeta local y sus efectos, se conserva el presupuesto real y se ofrece revisar el borrador desde la sesión abierta.
- **WHEN** vence el tiempo de espera de un envío cuyo resultado se desconoce
- **THEN** se deja de presentar su efecto como resuelto y se ofrece verificar por lectura. Una coincidencia de nombre o importe no confirma un alta. Navegar, verificar y recargar no reenvían la operación.
