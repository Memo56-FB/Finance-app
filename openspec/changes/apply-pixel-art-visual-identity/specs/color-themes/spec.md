# Spec Delta

## Purpose

Permitir elegir entre los temas de color Overworld (verde), Nether (rojo) y Diamante (azul) de la identidad pixel art, y recordar la elección en cada navegador sin afectar datos ni navegación.

## ADDED Requirements

### Requirement: Theme catalog

La aplicación SHALL ofrecer exactamente tres temas: Overworld (verde), Nether (rojo) y Diamante (azul). Cada tema SHALL definir una rampa de cuatro tonos usada en degradados escalonados por bloques, sin degradados suaves.

#### Scenario: Default theme

- **WHEN** una persona abre la aplicación sin haber elegido tema
- **THEN** se aplica Overworld

#### Scenario: Stepped gradients

- **WHEN** se muestra la tarjeta de balance, el elemento de navegación activo o un botón primario
- **THEN** su fondo usa bandas sólidas de la rampa del tema activo

### Requirement: Theme-independent data colors

Los colores de categoría, presupuesto y apartado elegidos por la persona SHALL mantenerse iguales en todos los temas, y los importes positivos y negativos SHALL seguir distinguiéndose además por su signo.

#### Scenario: Switching theme keeps category colors

- **WHEN** una persona cambia de Overworld a Nether
- **THEN** los colores de sus categorías, presupuestos y apartados no cambian

### Requirement: Accessible theme selector

Las vistas de finanzas, acceso y registro SHALL ofrecer un selector de tema junto al selector de idioma, con nombre accesible traducido, nombres de tema traducidos, muestra visual decorativa oculta a lectores de pantalla y uso completo por teclado.

#### Scenario: Keyboard selection

- **WHEN** una persona enfoca el selector de tema con Tab, lo abre y elige Diamante con las flechas y Enter
- **THEN** la interfaz cambia al tema azul sin recargar la página ni perder la vista, el foco vuelve al selector y el valor anunciado es `Diamante`

#### Scenario: Translated labels

- **WHEN** el idioma activo es inglés
- **THEN** el selector se anuncia como `Theme` y sus opciones como `Overworld`, `Nether` y `Diamond`

### Requirement: Theme persistence

El tema elegido SHALL guardarse por navegador durante un año y aplicarse desde el primer renderizado del servidor, sin parpadeo del tema predeterminado.

#### Scenario: Reload keeps theme

- **WHEN** una persona elige Nether y recarga o vuelve otro día
- **THEN** la primera pintura ya usa Nether

#### Scenario: Invalid stored value

- **WHEN** el valor guardado no corresponde a ningún tema
- **THEN** se aplica Overworld y no se muestra ningún error

#### Scenario: Saving fails

- **WHEN** el navegador rechaza guardar la preferencia
- **THEN** se muestra una notificación de error accesible y se conserva el tema anterior

### Requirement: Theme isolation

Cambiar de tema SHALL afectar solo a la presentación: no SHALL modificar datos financieros, idioma, sesión, estado de la barra lateral ni solicitudes al servidor de datos.

#### Scenario: No data refetch

- **WHEN** una persona cambia de tema en la vista de transacciones con filtros y página activos
- **THEN** los filtros, la página, la sesión y los datos mostrados se conservan sin nuevas solicitudes a la API de finanzas
