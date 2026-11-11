# Proposal

> Actualización solicitada tras la implementación: los importes usan solo `$` con dos decimales, sin moneda asignada. Esta decisión reemplaza las referencias siguientes a USD fijo.

## Why

El usuario quiere conservar únicamente el cambio de idioma y retirar la elección de moneda. El código actual solo vuelve a etiquetar importes USD/MXN, sin conversión real; mantener ese selector y su explicación añade una función que ya no se desea.

## What Changes

- Conservar la traducción completa inglés/español, inglés inicial, fechas y porcentajes localizados, persistencia de idioma y renderizado coherente entre servidor y cliente.
- **BREAKING**: eliminar la selección USD/MXN, el campo de preferencia `currency`, la lectura/escritura de `finance-currency` y los mensajes de presentación/conversión. Una cookie monetaria antigua dejará de tener efecto.
- Mantener USD como moneda fija de la demo, coherente con su valor inicial y con la aplicación anterior a las preferencias. Cambiar el idioma podrá modificar el formato regional, nunca la moneda ni los valores financieros.
- Sustituir la barra de dos preferencias por un único select compacto alineado arriba a la derecha, disponible en las cinco vistas de finanzas, acceso y registro. Mostrar bandera de México con `Español` y bandera de Estados Unidos con `English`, tanto en las opciones como en el valor elegido, con nombres accesibles y uso por teclado.
- Actualizar pruebas, integración de Storybook y documentación para el alcance de idioma únicamente.
- Realizar commits atómicos con prefijos convencionales conforme se complete y verifique cada unidad, incluyendo sus pruebas; no acumular toda la implementación en un commit final.
- Esta propuesta sustituye el alcance del cambio pendiente `add-localization-and-currency-preferences`: conserva su localización y reemplaza sus requisitos de preferencias. No se deben sincronizar después sus requisitos USD/MXN obsoletos.

## Capabilities

### New Capabilities

- `display-preferences`: única preferencia de idioma, selector superior derecho con banderas, persistencia por navegador, descarte de preferencias monetarias heredadas y formato de importes con USD fijo.
- `localization`: contrato conservado de traducción completa, accesibilidad, fechas/números, valores internos y contenido del usuario.

Estas rutas coinciden con las del cambio anterior. Se declaran nuevas respecto a las especificaciones principales porque `openspec list --specs` no encuentra ninguna; ambos contratos siguen sin sincronizar. Los deltas de esta propuesta serán autocontenidos para no depender de publicar primero las preferencias monetarias descartadas.

### Modified Capabilities

Ninguna especificación principal existente.

## Impact

- `lib/i18n/{preferences,cookie,server,format,index,client}`, sus pruebas y catálogos: reducir preferencias a idioma y fijar USD sin eliminar las utilidades de formato necesarias.
- `lib/i18n/PreferencesBar.tsx` y `app/layout.tsx`: un select de idioma en la esquina superior derecha, reutilizando `components/ui/select.tsx` y dos iconos de bandera locales.
- Consumidores de importes y adornos en resumen, presupuestos, apartados, transacciones, pagos recurrentes y gráficos: conservar cantidades, signos, precisión y comportamiento; verificar compatibilidad de `app/ui/transactions/utils.ts`.
- `.storybook/preview.tsx`, `tests/interaction-smoke.test.tsx`, `tests/e2e/localization.spec.ts` y `README.md`: adaptar contratos y cobertura.
- El árbol contiene trabajo previo sin commits; la implementación deberá incluir solo sus dependencias de localización al preparar cada commit y preservar cambios ajenos. El commit de esta propuesta contendrá únicamente sus artefactos.
- Sin dependencias nuevas, servicios de tipos de cambio, cambios de backend, datos financieros ni rutas.
