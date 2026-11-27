# Spec Delta

## Purpose

Dar a la aplicación `finance` una identidad visual propia de pixel art retro, inspirada en Minecraft y Undertale, sin cambiar su layout, su comportamiento ni su accesibilidad.

## ADDED Requirements

### Requirement: Pixel art visual language

Todas las vistas de producto (resumen, transacciones, categorías, presupuestos, apartados, pagos recurrentes, acceso y registro) SHALL usar el lenguaje pixel art: esquinas escalonadas, biseles de bloque, sombras duras sin desenfoque y ningún borde redondeado suave.

#### Scenario: Consistent style across routes

- **WHEN** una persona recorre las siete vistas de producto
- **THEN** tarjetas, paneles, botones, campos, selects, menús, diálogos, notificaciones, paginación y esqueletos de carga muestran esquinas escalonadas y sombras duras
- **AND** no queda ninguna superficie con la paleta beige/gris ni con los radios redondeados del reto

### Requirement: Pixel typography

La interfaz SHALL usar una tipografía pixelada para títulos y cifras y otra tipografía pixelada legible para el texto corrido, con un máximo de dos familias y un tamaño mínimo de 14 px para texto de lectura.

#### Scenario: Headings and amounts

- **WHEN** se muestra un título de vista, de sección o un importe destacado
- **THEN** usa la tipografía de títulos pixelada

#### Scenario: Body text legibility

- **WHEN** se muestra texto de lectura, etiquetas de formulario o filas de tablas
- **THEN** usa la tipografía de texto pixelada con al menos 14 px e interlineado entre 1.4 y 1.6

### Requirement: Segmented progress and charts

Las barras de progreso de presupuestos y apartados SHALL mostrarse como barras segmentadas tipo barra de vida, y el gráfico de presupuestos SHALL conservar sus datos, etiquetas y colores de categoría con el nuevo estilo.

#### Scenario: Budget progress

- **WHEN** se muestra el gasto de un presupuesto o el avance de un apartado
- **THEN** la barra se ve segmentada, conserva el color de la categoría y su porcentaje y valores accesibles no cambian

### Requirement: Preserved layout

El cambio SHALL conservar el layout existente en todos los tamaños de pantalla: posición y orden de la navegación, secciones, retículas, tablas, formularios y diálogos.

#### Scenario: Desktop sidebar

- **WHEN** una persona usa la aplicación en escritorio
- **THEN** la barra lateral sigue a la izquierda, se puede minimizar y expandir con el mismo control y recuerda su estado como hasta ahora

#### Scenario: Mobile navigation

- **WHEN** una persona usa la aplicación en un celular o tableta
- **THEN** la navegación sigue siendo la barra inferior con los mismos seis destinos y el contenido conserva su orden de una columna

### Requirement: Overview summary cards only

El resumen SHALL mostrar en su parte superior únicamente las tarjetas de balance actual, ingresos y gastos, con la tarjeta de balance destacada con el degradado del tema activo.

#### Scenario: Summary without dialog box

- **WHEN** una persona abre el resumen
- **THEN** ve las tres tarjetas de resumen seguidas de las secciones existentes
- **AND** no se muestra ninguna caja de diálogo ni corazón grande decorativo

### Requirement: Own brand and imagery

La aplicación SHALL llamarse `finance`, mostrar un logotipo pixelado propio en la barra lateral expandida, acceso y registro, un icono propio en la barra minimizada, y una ilustración pixel art propia en acceso y registro.

#### Scenario: Challenge assets removed

- **WHEN** se carga cualquier vista
- **THEN** no se solicita ni se muestra ningún logotipo ni ilustración del reto original

#### Scenario: Document title

- **WHEN** el navegador muestra la pestaña de la aplicación
- **THEN** el título y la descripción usan el nombre `finance`

### Requirement: Preserved accessibility

El cambio SHALL conservar todos los nombres, roles, estados y textos accesibles existentes, el orden de tabulación, el uso por teclado y las áreas táctiles mínimas de 44 px.

#### Scenario: Assistive technology output unchanged

- **WHEN** se compara el árbol de accesibilidad de cada vista antes y después del cambio
- **THEN** nombres accesibles, roles, `aria-current`, `aria-expanded`, `aria-busy`, textos solo para lectores de pantalla y regiones de notificación son equivalentes

#### Scenario: Decorative imagery

- **WHEN** se muestra una ilustración o icono puramente decorativo
- **THEN** queda oculto para lectores de pantalla, y los logotipos conservan el texto alternativo `finance`

### Requirement: Visible focus and contrast

Todo elemento interactivo SHALL mostrar un indicador de foco visible de alto contraste al navegar con teclado, y todo texto SHALL cumplir contraste WCAG AA sobre su fondo en cada tema.

#### Scenario: Keyboard focus

- **WHEN** una persona navega con Tab por enlaces, botones, campos, selects y opciones de menú
- **THEN** cada elemento enfocado muestra un contorno de al menos 3 px claramente distinguible del fondo

#### Scenario: Contrast in every theme

- **WHEN** se activa cualquiera de los temas disponibles
- **THEN** el texto normal alcanza al menos 4.5:1 y el texto grande y los indicadores no textuales al menos 3:1

### Requirement: Reduced motion

Las animaciones decorativas nuevas SHALL desactivarse o reducirse cuando la persona tiene activada la preferencia de movimiento reducido.

#### Scenario: Reduced motion enabled

- **WHEN** el sistema indica `prefers-reduced-motion: reduce`
- **THEN** las transiciones escalonadas y animaciones decorativas no se reproducen y el contenido aparece en su estado final
