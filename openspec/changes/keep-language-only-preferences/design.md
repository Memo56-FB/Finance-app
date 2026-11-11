# Design

> Actualización solicitada tras la implementación: los importes usan solo `$` con dos decimales, sin moneda asignada. Esta decisión reemplaza las referencias siguientes a USD fijo.

> Ajuste de escritorio solicitado después: el selector sale del flujo con posición absoluta arriba a la derecha; el contenido financiero reserva espacio superior y el sidebar ocupa toda la altura desde el borde superior. En móvil se conserva la fila en flujo normal. Esta decisión sustituye la restricción de posición de la sección 4.

## Context

Ver `proposal.md` para la motivación y `specs/` para el contrato final. Este diseño es necesario porque la preferencia monetaria cruza cookies, contexto, formato, controles y pruebas.

La base revisada es `9326de3` más el trabajo sin commits de `add-localization-and-currency-preferences`. `lib/i18n/` recibe `{ language, currency }`, lee dos cookies, construye formateadores nativos y ofrece un contexto compartido. `PreferencesBar` itera ambas preferencias y muestra una explicación de presentación sin conversión. No existen tasas, clientes de cambio ni operaciones de conversión que retirar.

`app/layout.tsx` ya reserva una fila sobre el contenido; el sidebar usa la altura disponible. Presupuestos y apartados tienen acciones en el lado derecho de sus encabezados, y acceso/registro incluyen un logo superior en móvil. El select compartido admite contenido compuesto y navegación por teclado. No hay banderas en `public/`.

No hay especificaciones principales. El cambio anterior tiene todas sus tareas marcadas, pero no está archivado; sus deltas contradicen la nueva decisión sobre moneda. Las traducciones y la infraestructura también están sin versionar o modificadas respecto a HEAD. Esto importa al elegir el contenido real de cada commit.

## Goals / Non-Goals

**Goals:**

- Reducir el contrato de preferencias sin rehacer la localización ni migrar los datos financieros.
- Mantener los mismos helpers y consumidores de traducción/formato cuando sigan siendo útiles.
- Resolver ubicación, banderas y persistencia con los componentes existentes y dos recursos locales.
- Producir commits comprobables, incluyendo sus dependencias y pruebas, aun partiendo de un árbol con cambios previos.

**Non-Goals:**

- Eliminar el formato monetario: la app sigue mostrando dinero en USD.
- Sustituir cookies por otro almacenamiento, renombrar toda la infraestructura de preferencias, añadir idioma automático o rediseñar los encabezados de las siete vistas.
- Añadir backend, conversiones, una nueva moneda base, sincronización entre dispositivos o dependencias.

## Decisions

### 1. Idioma como único campo; conservar la infraestructura útil

Reducir `Preferences` y `defaults` a `language`, con los valores `en` y `es`. Mantener los nombres `PreferencesProvider`, `createI18n`, `getI18n` y los componentes `Text`, `Money`, `CurrencySymbol`, fechas y porcentajes: cambiar sus nombres o eliminar los helpers monetarios obligaría a tocar consumidores sin beneficio.

Eliminar `currency` de validación, lectura de cookies, contexto y propiedades serializadas por `app/layout.tsx`. Simplificar el guardado para que solo acepte idioma; actualizar su único consumidor de producto (`PreferencesBar`) y su test en la misma unidad. Conservar validación de valores, comprobación de escritura, `Path=/`, `SameSite=Lax`, duración de un año y `Secure` bajo HTTPS.

La interfaz conserva `router.refresh()`, estado pendiente y error accesible; el valor efectivo procede del servidor. Las sesiones siguen leyendo su propia cookie y `<html lang>` sigue reflejando la selección. No se añade estado persistente de cliente paralelo.

Alternativa descartada: ocultar el selector de moneda dejando el campo y la cookie activos. Mantendría comportamiento monetario invisible en sesiones antiguas y no cumpliría la eliminación solicitada.

### 2. USD fijo dentro del formateador, sin conversión

En `createFormatters`, fijar `currency: 'USD'` en las opciones de los formateadores monetario y con signo. No convertir USD en una configuración, una preferencia oculta ni una variable de entorno. Conservar `en-US`/`es-MX` para números, `en-GB`/`es-MX` y UTC para fechas, dos decimales y `signDisplay: 'exceptZero'`.

Los símbolos siguen derivándose del formateador: el aspecto regional puede variar, pero la denominación siempre es USD. `Money`, `CurrencySymbol` y `app/ui/transactions/utils.ts` siguen delegando en la misma fuente; no restaurar cadenas monetarias incrustadas en cada tarjeta.

No modificar fixtures, sumas, porcentajes, metas, filtros ni valores canónicos. Mantener pruebas que distingan USD de MXN; comprobar solo `1,000.00` sería insuficiente, porque ambas monedas pueden mostrar esa parte numérica.

Alternativas descartadas: fijar MXN (cambiaría la denominación original sin petición), y volver a un formateador global inglés (perdería formato localizado útil).

### 3. Cookie antigua inerte, sin mecanismo de migración

Dejar de leer y escribir `finance-currency`. Si permanece en un navegador, ignorarla hasta que caduque: no hace falta un efecto de limpieza, una ruta de migración o un borrado masivo de cookies. `finance-language=es` continúa funcionando con una cookie monetaria válida, inválida o ausente.

El nombre heredado solo debe subsistir donde explica o prueba compatibilidad, además de los artefactos históricos. En producción no se usa para decidir nada. Esta decisión elimina complejidad sin perder datos: esa cookie nunca contiene importes.

### 4. Select compacto en el extremo superior derecho

Mantener un solo control en `PreferencesBar.tsx` y su montaje global actual. Reutilizar la fila reservada en `app/layout.tsx`, alineando su contenido a la derecha con los márgenes de página; retirar la apariencia de barra de ajustes y su texto monetario. La fila queda en flujo normal, sobre el contenido, y usa el fondo de la aplicación. El selector y, si existe, su error ocupan su propio espacio.

Esta interpretación de «esquina derecha» significa la esquina superior derecha de la aplicación, también en acceso/registro. Evita duplicar controles por página o interferir con `CreateBudget` y `CreatePot`. No usar posición fija/absoluta ni mover el control dentro de los encabezados con acciones. Mantener el reparto de altura del layout y el sidebar; tocar otros layouts solo si las comprobaciones detectan una regresión concreta.

Reutilizar `Select` de `components/ui/select.tsx`, conservar `id="preference-language"` y asociarlo a `Language`/`Idioma` mediante una etiqueta accesible, que puede ser visualmente oculta. Mostrar `English` y `Español` como nombres propios de idioma, no traducirlos ni reducir el control a una bandera. El estado pendiente sigue deshabilitando selecciones concurrentes y el mensaje de error conserva `role="alert"`.

Añadir únicamente dos SVG locales, `public/flags/mx.svg` y `public/flags/us.svg`, con tamaño explícito. Usarlos decorativamente (`alt=""`, ocultos al árbol accesible) tanto en el valor activo como en las opciones; el texto proporciona el nombre accesible y la búsqueda por teclado del select. Así la bandera se ve de forma consistente sin depender de soporte de emojis o servicios externos. No hace falta alterar la API del select compartido ni crear una biblioteca de iconos.

Alternativa descartada: emojis como único icono. Su representación puede ser letras regionales en algunos equipos. Tampoco hace falta una barra de ajustes, un menú nuevo o una ruta adicional para dos idiomas.

### 5. Ajustar cobertura y documentación junto al comportamiento

Cambiar las matrices de cuatro combinaciones por los dos idiomas con USD fijo. Conservar paridad de catálogos, validación de cookie, error por almacenamiento rechazado, render de servidor/cliente, aislamiento de sesiones, signos, cero, porcentajes y UTC. Añadir el caso explícito de cookie MXN heredada ignorada y no renovada.

Adaptar `tests/e2e/localization.spec.ts` para los siete recorridos, HTML sin JavaScript, persistencia y parámetros canónicos. Comprobar ausencia del control/aviso monetario y presencia de las banderas en ambas opciones y valor activo. Cubrir teclado, foco, alineación derecha y no solapamiento a 1280, 390 y 320 píxeles, incluyendo presupuestos, apartados y acceso/registro. Mantener las salvaguardas de demo y las pruebas existentes de búsqueda y navegación.

Conservar el proveedor de `.storybook/preview.tsx` y `tests/interaction-smoke.test.tsx` con los nuevos valores iniciales. Actualizar la sección del README a idioma únicamente, incluyendo USD fijo y la necesidad del runtime de Next para cookies. No cambiar dependencias ni lockfiles por esta simplificación.

### 6. Commits atómicos y relación con el cambio anterior

Usar `tipo(ámbito): descripción` y registrar cada unidad al terminar su comprobación, con pruebas y actualización de sus tareas. La división prevista es:

1. `feat(i18n): keep language preferences without currency selection`: contrato de idioma, USD fijo, eliminación del selector/aviso de moneda, catálogos, documentación funcional y pruebas correspondientes. Como esa localización aún no está en HEAD, incluir sus consumidores previos estrictamente necesarios, integración de Storybook/tests y utilidades compartidas en esta misma unidad funcional. No hacer un commit intermedio que publique USD/MXN ni dejar imports hacia archivos sin versionar.
2. `feat(ui): place flagged language selector at top right`: alineación, dos banderas y pruebas de interacción/disposición. No separar los tests del comportamiento que verifican.
3. `docs(openspec): reconcile language-only change`: registrar resultados finales y señalar en la propuesta anterior que fue sustituida por esta. Conservar sus documentos como historial, sin sincronizar sus requisitos monetarios ni archivarlos durante la implementación.

Antes de cada commit, revisar el diff preparado y sus dependencias respecto a HEAD. No usar `git add .`, no incluir los directorios de skills nuevos ni modificaciones ajenas, y no confiar en un árbol local con archivos sin stage para afirmar que el commit está completo. Comprobar el contenido preparado cuando existan dependencias fuera del índice. Un tamaño grande debido a traducciones previas no justifica separar un contrato de sus consumidores y dejar commits rotos.

Esta propuesta usa `ADDED Requirements` porque no hay specs principales. Conserva íntegramente el delta de `localization` y reemplaza el de `display-preferences`; no usa `REMOVED` contra requisitos que aún no existen en la raíz de specs. Si alguien sincroniza el cambio anterior antes de aplicar este, ajustar los deltas contra esa nueva base antes de continuar. El archivo/sincronización se hará en su flujo posterior; la fuente vigente será esta propuesta.

## Risks / Trade-offs

- **Una cookie MXN anterior podría seguir alterando importes si queda algún lector** → Eliminar lecturas de producción y probar HTML inicial y cambio de idioma con la cookie presente.
- **Eliminar formato junto con la preferencia rompería dinero o traducción** → Mantener helpers y revisar todas las familias de importes; no tocar números ni reglas de negocio.
- **Selector o mensaje de error podrían tapar contenido en móvil** → Usar flujo normal y comprobar 320/390 píxeles, apertura del menú y estado de error.
- **Trabajo previo sin commits podría producir un commit incompleto o mezclado** → Preparar solo archivos/hunks de esta función y sus dependencias, verificar el índice y dejar intacto lo ajeno.
- **El cambio antiguo podría reintroducir requisitos descartados al sincronizarse** → Marcarlo sustituido al implementar y usar únicamente estos deltas en la futura sincronización.
- **La fila global sigue ocupando algo de altura** → Aceptar el espacio mínimo del control para mantenerlo accesible y sin superposición.

## Migration Plan

1. Aplicar la reducción a idioma sobre el árbol existente y verificar sus tests antes del primer commit funcional.
2. Añadir posición y banderas, comprobar interacción y tamaños, y crear el segundo commit con sus pruebas.
3. Ejecutar tipos, lint, Vitest, build, Storybook y E2E con los comandos del proyecto; documentar resultados o bloqueos y cerrar el commit de documentación. No repetir verificaciones ya completadas si no cambiaron sus entradas.
4. Desplegar posteriormente por el flujo habitual: `finance-language` se conserva, `finance-currency` deja de tener efecto, no hay migración de datos ni backend.

Si hubiera una regresión visual, revertir solo el commit de posición/banderas conserva idioma y USD fijo. Una reversión funcional debe hacerse mediante commits dirigidos y conservando trabajo ajeno; no resetear todo el árbol ni restaurar automáticamente la selección monetaria descartada.
