# Spec Delta

## Purpose

Permitir seguir usando Finanzas durante una escritura y conocer su resultado desde cualquier sección, sin perder un borrador rechazado ni contabilizar dos veces un movimiento.

## ADDED Requirements

### Requirement: Un envío válido libera el formulario

Una cuenta verificada SHALL poder navegar por las seis secciones mientras se procesa un guardado. Después de validar el borrador y aceptar el envío, el diálogo SHALL liberar la interacción y dejar un estado pendiente identificable y accesible desde cualquier sección. Los errores de validación local se presentan en el formulario antes de enviar.

#### Scenario: Navegar mientras se guarda

- **WHEN** se guarda un formulario válido y la respuesta sigue pendiente al abrir otra sección
- **THEN** el diálogo se cierra con su comportamiento de foco y la nueva página es utilizable. Se puede consultar qué operación está pendiente en el idioma activo
- **AND** un doble clic o pulsar Enter de nuevo no produce una segunda escritura. Otra acción independiente sigue disponible

#### Scenario: Borrador inválido o cancelado

- **WHEN** se guarda un importe inválido o se cancela un formulario antes de confirmar el envío
- **THEN** se emiten cero escrituras. El formulario inválido conserva sus valores y señala el campo que necesita corrección

### Requirement: Previsualización reversible de datos descriptivos

La aplicación SHALL mostrar de forma provisional el nuevo nombre de una categoría, el color de un presupuesto o el nombre y color de un apartado existente cuando sólo cambien esos campos. La previsualización SHALL identificar el registro por su ID y la operación pendiente, de modo que una respuesta sólo afecte a ese cambio.

#### Scenario: Renombrar una de dos categorías con el mismo nombre

- **WHEN** se renombra una categoría y se vuelve a su lista mientras el guardado sigue pendiente
- **THEN** sólo el ID editado muestra el nombre provisional con una indicación de su estado
- **AND** una confirmación adopta el dato devuelto por el servidor. Un rechazo retira sólo esa previsualización y deja disponibles los datos introducidos

#### Scenario: Dos ediciones independientes

- **WHEN** la edición de un registro se confirma y la de otro se rechaza en orden inverso al de envío
- **THEN** ambos resultados pueden distinguirse y el rechazo no revierte el cambio ya confirmado ni cierra otro formulario

### Requirement: Confirmación de los cambios financieros

La aplicación SHALL expresar como pendientes los cambios de importe, movimientos, altas, bajas, restauraciones, pagos y ajustes de corte hasta recibir confirmación. Los saldos, totales, cuotas pagadas, advertencias de presupuesto e identidades de registros nuevos SHALL proceder del servidor. Las vistas previas de importe del editor siguen siendo simulaciones.

#### Scenario: Depositar y consultar Resumen antes de recibir respuesta

- **WHEN** se deposita en un apartado y se abre Resumen con el envío pendiente
- **THEN** se ven el estado pendiente y los últimos saldos confirmados disponibles
- **AND** al confirmarse, los apartados, los movimientos y los indicadores afectados se actualizan aunque el formulario haya desaparecido. Se publica una sola confirmación con los avisos devueltos

#### Scenario: Marcar pagado o cambiar el corte

- **WHEN** queda pendiente un pago recurrente o un cambio del periodo de resumen
- **THEN** la cuenta puede navegar y los totales, el estado de pago y el corte visible siguen correspondiendo a datos confirmados
- **AND** el resultado actualiza los recursos afectados. Confirmar el corte no vuelve a descargar las listas independientes

#### Scenario: Eliminar un apartado y deshacer desde otra sección

- **WHEN** se confirma una eliminación después de abandonar Apartados
- **THEN** la opción de deshacer usa la identidad y el plazo devueltos por el servidor. Si el plazo venció, se informa de ello
- **AND** solicitar la restauración una vez permite seguir navegando sin duplicar el envío ni ampliar el plazo

### Requirement: Recuperación de rechazos y respuestas perdidas

Un rechazo definitivo SHALL explicar el motivo y permitir revisar el borrador original desde la sesión abierta. Una pérdida de respuesta, un timeout u otro resultado ambiguo SHALL quedar como pendiente de verificación. La recuperación SHALL consultar datos actuales sin reenviar automáticamente la escritura. Un error al refrescar datos tras una confirmación tampoco permite repetir el guardado.

#### Scenario: Rechazo al editar desde otra página

- **WHEN** Spring rechaza una operación y ya está abierta otra sección
- **THEN** un aviso accesible permite volver voluntariamente al borrador y revisar los valores y errores de campo o de conflicto
- **AND** la respuesta no cambia de página ni desplaza el foco del formulario que se esté usando

#### Scenario: Spring registra el depósito y se pierde la respuesta

- **WHEN** se pierde la respuesta tras registrar un depósito y la persona consulta los movimientos para verificarlo
- **THEN** se envían sólo lecturas, incluso si se navega, se recupera la conexión o se repite la consulta
- **AND** el depósito se ha enviado exactamente una vez. Una lectura que no identifica inequívocamente la operación no se presenta como confirmación automática

### Requirement: Los guardados pertenecen a la sesión que los inició

La aplicación SHALL aislar borradores, resultados y operaciones por sesión de cuenta durante la vida de la pestaña. Al salir o cambiar de identidad SHALL eliminar el estado privado y descartar respuestas tardías de la sesión anterior. El modo invitado no puede enviar ni recuperar esas operaciones.

#### Scenario: Cambio de cuenta con una respuesta en vuelo

- **WHEN** se cierra la sesión de A y se entra con B o como invitado antes de recibir la respuesta del guardado de A
- **THEN** la nueva sesión no ve datos, avisos, borradores ni acciones de recuperación de A
- **AND** ninguna respuesta tardía escribe en la caché de la nueva sesión ni genera otra mutación

#### Scenario: Cambio de sesión antes de terminar de preparar el envío

- **WHEN** se inicia un guardado en la cuenta A, cambia la sesión y después termina la preparación de las credenciales necesarias para enviarlo
- **THEN** la operación de A no se envía con la sesión de B

#### Scenario: Recarga con un resultado aún pendiente

- **WHEN** se recarga o se vuelve a abrir la aplicación después de haber enviado una operación
- **THEN** la entrada protegida obtiene el estado confirmado del servidor y no reproduce la escritura de la pestaña anterior
