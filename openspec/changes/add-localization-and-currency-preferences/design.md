# Design

## Context

Base revisada: commit `9326de3`. Ver `proposal.md` para la motivación y los dos archivos de `specs/` para el comportamiento requerido.

El proyecto usa Next.js App Router, React 19 y componentes de servidor y cliente. No existen API de negocio, autenticación operativa ni guardado de movimientos. Zustand está instalado, pero solo mantiene abierto/cerrado el menú lateral.

`lib/utils.ts` exporta un `currencyFormatter` fijo en `en-US`/USD. Transacciones, presupuestos y pagos recurrentes ya lo comparten. Otros importes siguen incrustados como cadenas en `app/ui/overview/{Summary,Pots,Transactions}.tsx`, y `PotCard.tsx` construye dólares manualmente. Las fechas de transacciones usan `en-GB` y UTC; los vencimientos conservan un `dueDay` numérico junto a una etiqueta inglesa.

Los valores `Bills`, `Highest`, `paid` y similares participan en cálculos, filtros y URLs. `ResponsiveSelect` todavía usa una misma cadena como valor y etiqueta; `SelectColorTag` ya distingue ambos. Todas las rutas se prerenderizan actualmente y no hay configuración de exportación estática obligatoria.

## Goals / Non-Goals

**Goals:**

- Conservar renderizado de servidor y presentar las preferencias guardadas desde el primer HTML, sin corregir el idioma después del montaje.
- Mantener una sola persistencia de preferencias y compartir su valor por solicitud con los componentes de cliente.
- Usar catálogos tipados y las funciones nativas de formato; evitar traducciones en datos financieros y formateadores globales mutables.
- Mantener las rutas, filtros, valores numéricos, precisión y restricciones de la demo existentes.

**Non-Goals:**

- Tipos de cambio, equivalencias entre monedas, importes multimoneda o normalización de todas las cuentas a USD.
- Perfil de usuario en base de datos, sincronización entre dispositivos o habilitación de autenticación y guardado.
- Prefijos `/en` y `/es`, selección automática por navegador, bibliotecas de traducción, editores de traducciones o una preferencia adicional de región.
- Traducir datos del usuario, marcas, documentación del repositorio o el contenido editorial de Storybook.

## Decisions

### 1. Dos preferencias independientes y acotadas

Definir `language: 'en' | 'es'` y `currency: 'USD' | 'MXN'`, con valores iniciales `en`/`USD`. Español usa convenciones regionales de México. USD/MXN es el alcance inicial solicitado; no se agrega EUR ni un selector arbitrario de códigos monetarios.

Para dinero y números, usar `en-US` y `es-MX`. Para fechas, conservar `en-GB` en inglés, como el formateador existente, y usar `es-MX` en español. Las fechas mantienen UTC. Esto preserva el formato inglés existente sin incorporar otra preferencia.

Alternativa descartada: vincular idioma y moneda. Impediría inglés/MXN y español/USD, combinaciones expresamente soportadas.

### 2. Cookies del navegador como única persistencia

Usar dos cookies de alcance del sitio: `finance-language` y `finance-currency`. Validar cada valor mediante listas permitidas; si uno es inválido, aplicar su valor inicial sin descartar el otro. No hay datos secretos en estas preferencias.

Los controles escriben la cookie modificada desde el cliente, con `Path=/`, `SameSite=Lax`, duración de un año y `Secure` cuando se usa HTTPS. Después solicitan `router.refresh()` dentro de una transición. Leer de vuelta la cookie antes de refrescar permite detectar almacenamiento rechazado y mostrar un error sin fingir que se guardó el cambio.

La parte servidor de Next lee las cookies con `await cookies()`. No se añade un endpoint de negocio ni una Server Action para estos dos valores. El almacenamiento sigue estando en el navegador; Next obtiene las preferencias en la solicitud. [Referencia de cookies de Next.js](https://nextjs.org/docs/app/api-reference/functions/cookies).

Alternativas:

- `localStorage` con Zustand `persist`: sirve para preferencias exclusivamente de cliente, pero el servidor no dispone de ellas para generar el primer HTML. Requeriría traducir después del montaje o duplicar persistencia en cookies.
- Base de datos: aporta preferencias por cuenta y entre dispositivos, pero requiere identidad y API que todavía no existen. No resuelve una necesidad de esta fase.
- Cookie más `localStorage`: introduce dos fuentes persistentes que pueden discrepar, sin beneficio actual.

### 3. Inicialización por solicitud y Context para clientes

Crear utilidades puras en `lib/i18n/` para tipos, valores iniciales, validación, catálogos y formato. Un módulo servidor separado lee cookies y prepara la localización de la solicitud; puede usar `React.cache` para deduplicar esa lectura dentro de la solicitud, nunca una variable mutable de idioma o moneda compartida entre usuarios.

`app/layout.tsx` resuelve preferencias, establece `<html lang>` y entrega únicamente preferencias y mensajes serializables a `PreferencesProvider`. Los componentes de servidor usan la utilidad servidor; los de cliente consumen el Context y construyen sus formateadores con los mismos parámetros. No se pasan funciones ni instancias de `Intl` a través de la frontera servidor/cliente.

El Context recibe sus valores de las propiedades actualizadas por el servidor; no crea otra persistencia ni un store global de Zustand para idioma/moneda. Durante una actualización se conserva la configuración efectiva anterior y se deshabilitan temporalmente los selectores para evitar escrituras concurrentes.

Alternativa descartada: convertir todas las páginas a componentes de cliente para leer almacenamiento local. Añadiría límites de hidratación y JavaScript a vistas que actualmente se renderizan en el servidor.

### 4. Catálogos pequeños y tipados, sin dependencia nueva

Crear catálogos inglés/español con la misma estructura bajo `lib/i18n/messages/`, agrupados por textos comunes, navegación, preferencias y vistas de producto. El tipo del catálogo inglés y una comprobación de paridad deben detectar claves ausentes en español. Evitar un parser de rutas de claves o un motor propio de traducción.

Compartir el mismo catálogo entre lectores de servidor y proveedor de cliente; este último recibe el catálogo seleccionado. El patrón de diccionarios es suficiente para los dos idiomas y textos actuales. [Guía de internacionalización de Next.js](https://nextjs.org/docs/app/guides/internationalization).

Vocabulario español inicial: Resumen, Transacciones, Presupuestos, Apartados y Pagos recurrentes. Los nombres de idiomas se muestran como `English` y `Español`, y las opciones monetarias siempre incluyen los códigos USD/MXN. Los nombres de apartados como `Holiday` y los nombres de comercios permanecen intactos.

No usar el idioma para cambiar estados internos ni traducir cadenas de usuario mediante búsquedas globales.

### 5. Formato monetario visual, sin conversión

Sustituir el formateador USD constante por formateadores puros construidos a partir de las preferencias. Usar `Intl.NumberFormat` para dinero normal, importes de transacciones con signo y porcentajes. Mantener dos decimales en USD/MXN y porcentajes; respetar la colocación regional del signo en lugar de concatenarlo a una cadena ya localizada. [Referencia de Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat).

Usar el símbolo monetario regional y mostrar siempre el código seleccionado en el control global. Obtener también el adorno de los inputs del formateador correspondiente; no dejar símbolos `$` incrustados. Los porcentajes usan una proporción como entrada, evitando multiplicarla dos veces por cien.

Migrar a números las constantes de presentación con símbolos o separadores en Summary, Pots y Transactions del resumen. Migrar las fechas de presentación a valores de fecha inequívocos preservando sus días actuales; no parsear frases inglesas ni cadenas monetarias localizadas en tiempo de ejecución. Los filtros, ordenaciones y sumas siguen recibiendo los valores numéricos originales.

La selección USD/MXN afecta exclusivamente a la demo. Junto al selector se muestra el texto localizado equivalente a: «Solo presentación: cambiar la moneda no convierte los importes». No se solicita ninguna tasa ni se multiplica o redondea el valor almacenado para simular una conversión.

**Contrato para el backend futuro:** idioma y formato pueden seguir siendo preferencias de navegador hasta necesitar sincronización. La moneda base de una cuenta con dinero real sí debe guardarse junto a sus importes. Puede existir una sola moneda por cuenta sin multimoneda; no tiene que ser USD para todos. Si los datos reales están en USD, mostrar su equivalente en MXN necesitará una tasa. Al conectar ese backend se deberá respetar la moneda base y no reutilizar esta selección visual para volver a etiquetar balances reales. Esta integración no forma parte de las tareas actuales.

### 6. Separar identificadores y etiquetas

Cambiar `ResponsiveSelect` a opciones `{ value, label }`, siguiendo la forma que ya usa `SelectColorTag`. Actualizar todos sus consumidores conocidos: página de transacciones, toolbar de pagos recurrentes y stories. No mantener dos formatos de opciones ni traducir un valor de vuelta a inglés para ejecutar la lógica.

Mantener canónicos los valores actuales de categorías, ordenación, colores y estados. Traducir únicamente su etiqueta visible, incluidos encabezados de presupuestos y categorías de transacciones. Los enlaces `See All` y los parámetros `query`, `category`, `sortBy` y `page` conservan su significado; cambiar preferencias no los reescribe ni reinicia.

Los vencimientos usan `dueDay` para componer el texto localizado. No se intenta traducir o analizar `Monthly-1st`; las claves de las filas no dependen de las etiquetas traducidas.

### 7. Controles globales que reservan su propio espacio

Agregar una barra compacta de preferencias al layout raíz, dentro del proveedor, con los Select y etiquetas usados por el proyecto. Debe estar disponible también en acceso y registro y poder envolver sus controles en pantallas estrechas.

Reservar una fila para ella y un contenedor flexible para las páginas; ajustar la altura del Sidebar al contenedor disponible, evitando que `lg:min-h-screen` sume una segunda altura completa. No añadir un sexto enlace a la navegación móvil ni superponer un botón fijo a acciones existentes.

La barra incluye la explicación de presentación sin conversión y un mensaje accesible si no se puede guardar. Las preferencias no requieren una ruta de ajustes adicional.

### 8. Pruebas y componentes fuera de la aplicación

Envolver los componentes independientes de tests y Storybook con el proveedor de preferencias iniciales explícitas. Mantener el comportamiento inglés/USD de las pruebas existentes y añadir cobertura de español, USD/MXN, valores inválidos y persistencia rechazada.

Las pruebas de navegador deben comprobar recarga, HTML inicial sin JavaScript, sesiones independientes, conservación de filtros/URL, controles móviles y todas las familias de importes. Las pruebas de formato comprueban signos, cero y parte numérica sin depender de espacios no separables específicos de un motor.

## Risks / Trade-offs

- **Las rutas dejan de ser completamente estáticas** → Se acepta renderizado por solicitud para usar cookies desde la primera respuesta; no se habilita Cache Components ni una nueva capa de caché. El despliegue debe seguir ofreciendo el runtime de Next actual, sin exportación HTML estática. [Comportamiento documentado de cookies](https://nextjs.org/docs/app/api-reference/functions/cookies).
- **USD/MXN podría interpretarse como equivalencia económica** → Explicar que solo cambia la presentación, mantener los números intactos y documentar la moneda base para el backend futuro.
- **Textos traducidos podrían romper filtros** → Separar valores/etiquetas y conservar enlaces y parámetros canónicos con pruebas de regresión.
- **Preferencias podrían filtrarse entre solicitudes** → No guardar locale, moneda ni objetos modificables de preferencias en variables de módulo; probar dos sesiones distintas.
- **Cookies bloqueadas o manipuladas** → Validar al leer, comprobar la escritura, conservar la configuración efectiva y mostrar un error controlado.
- **Queden importes o etiquetas inglesas fuera del sistema común** → Revisar todos los consumidores del formateador, cadenas `$...`, fechas, porcentajes y textos accesibles; recorrer las siete vistas y sus diálogos.

## Migration Plan

1. Añadir tipos, catálogos, validación y formateadores con pruebas de valores iniciales y las cuatro combinaciones.
2. Conectar cookies, lector por solicitud, proveedor y barra global, con contexto equivalente en tests y Storybook.
3. Migrar valores/etiquetas y cubrir todas las familias de vistas sin cambiar reglas de negocio ni rutas.
4. Ejecutar pruebas unitarias, tipos, lint, build, Storybook y E2E, incluida la respuesta española antes de JavaScript.
5. Al desplegar, navegadores sin cookies continúan en inglés/USD. No hay migración de base de datos ni de datos persistidos.

Para revertir, retirar el cambio completo y volver a la presentación inglesa/USD. Las dos cookies pueden ignorarse; nunca contienen movimientos ni modifican los importes.
