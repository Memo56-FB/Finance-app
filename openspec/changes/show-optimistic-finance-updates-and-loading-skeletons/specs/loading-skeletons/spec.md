# Spec Delta

## Purpose

Permitir identificar el contenido que se está cargando y utilizar las partes disponibles de la aplicación mientras llegan las respuestas.

## ADDED Requirements

### Requirement: Carga por sección y por componente

La aplicación SHALL mostrar un esqueleto con la forma del contenido pendiente en cada región que aún carece de datos utilizables. Las regiones independientes SHALL poder completarse en distinto orden.

#### Scenario: Entrar en cada sección con lecturas retenidas

- **WHEN** una cuenta visita cada una de las seis secciones con las respuestas de datos retenidas
- **THEN** Resumen reserva sus indicadores y cuatro vistas previas, Transacciones sus filtros dependientes y filas, Categorías su lista, Presupuestos su gráfico, resumen y tarjetas, Apartados sus tarjetas de progreso y Pagos recurrentes sus indicadores y filas.
- **AND** la navegación y los controles que ya tienen datos conservan su función en móvil y escritorio.

#### Scenario: Solo queda pendiente una lectura secundaria

- **WHEN** se conoce el presupuesto pero aún faltan sus gastos recientes, o un editor espera categorías o presupuestos existentes
- **THEN** el marcador ocupa la zona de gastos o el campo afectado. Se ven la tarjeta, los valores introducidos y los demás controles disponibles.
- **AND** una categoría aún sin cargar no aparece como inactiva ni como lista vacía.

### Requirement: Espera, actualización, vacío y error distinguibles

La aplicación SHALL usar contenido real u optimista disponible para la misma cuenta y consulta durante la revalidación. El estado vacío SHALL aparecer después de una lectura correcta y el error recuperable SHALL ofrecer el reintento de la lectura afectada.

#### Scenario: Cambiar de mes y recibir una lista vacía

- **WHEN** se abre un mes sin datos en memoria y se retrasa su primera respuesta
- **THEN** se muestra la estructura de ese bloque. Una respuesta vacía sustituye al esqueleto por el estado vacío localizado y un error lo sustituye por el aviso correspondiente.

#### Scenario: Actualizar una lista visible

- **WHEN** se refresca una lista que incluye una tarjeta optimista o datos válidos en caché
- **THEN** esos registros permanecen visibles. Una respuesta de otro filtro, mes o cuenta no ocupa ese espacio.

### Requirement: Carga de rutas públicas, entradas protegidas y acciones

La entrada directa SHALL conservar el contenido visible sin JavaScript y resolver el acceso en el servidor. Las esperas de hidratación y sesión dentro de la interfaz SHALL usar marcadores neutros mientras falten datos autorizados. Los controles de acceso, registro, invitado, cierre de sesión y preferencias SHALL indicar una acción en curso dentro del control que la inició, conservando nombre accesible y valores de formulario.

#### Scenario: Entrada directa con la identidad aún desconocida

- **WHEN** se demora la resolución de la ruta inicial, el acceso, el registro o una ruta financiera protegida
- **THEN** el servidor comprueba el acceso antes de entregar contenido privado y la página o redirección se resuelve también sin JavaScript. Dentro de la interfaz, un marcador neutro ocupa la región que aún espera datos autorizados.
- **AND** una verificación rutinaria con datos utilizables mantiene la vista autorizada. Una señal de cambio de identidad oculta inmediatamente los datos privados.

#### Scenario: Esperas de controles e invitado

- **WHEN** se demora el ingreso, la confirmación de cuenta, la entrada como invitado, la salida o el cambio de idioma
- **THEN** el control ocupado muestra un indicador compacto, conserva su acción identificable y evita el doble envío. Una vez disponible el contenido local de invitado, se muestra directamente.
- **AND** un guardado financiero en segundo plano se representa por su cambio visible, sin reemplazarlo por un esqueleto.

### Requirement: Indicadores accesibles y adaptables

Cada región cargando SHALL comunicar su estado en el idioma activo, conservar espacio acorde al diseño móvil o de escritorio y respetar la preferencia de movimiento reducido.

#### Scenario: Teclado, lector de pantalla y movimiento reducido

- **WHEN** se recorre una vista en carga con teclado, lector de pantalla o movimiento reducido
- **THEN** los marcadores son decorativos y no reciben foco, se anuncia una sola carga por región en español o inglés, y el marcador permanece estático con movimiento reducido.
- **AND** la llegada de los datos conserva el foco y los indicadores caben en un ancho de 320 px sin desbordamiento horizontal.
