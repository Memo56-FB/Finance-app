# Tasks

## 1. Preferencias, catálogos y formato

- [x] 1.1 Crear tipos y validación pura en `lib/i18n/` para `en`/`es`, USD/MXN y valores iniciales inglés/USD, con fallback independiente por campo. Verificar con tests de ausencia, valores válidos, idioma desconocido y moneda malformada mediante `pnpm exec vitest run lib/i18n`.
- [x] 1.2 Crear los catálogos tipados inglés/español bajo `lib/i18n/messages/` para navegación, vistas, formularios, controles comunes y preferencias, siguiendo el vocabulario del diseño. Verificar paridad completa de claves y tipos con un test de catálogos y TypeScript; no traducir nombres de personas, comercios o apartados.
- [x] 1.3 Añadir formateadores puros de dinero, dinero con signo, fechas UTC y porcentajes a partir de preferencias explícitas, sin eliminar todavía el formateador antiguo que tienen los consumidores pendientes. Verificar las cuatro combinaciones con `75.5`, `-25`, `0`, `1000`, proporción `0.5525` y fecha UTC en una zona negativa; confirmar que no cambia ningún valor numérico.

## 2. Inicialización de servidor y cliente

- [x] 2.1 Crear el lector servidor de `finance-language` y `finance-currency` en un módulo separado de `lib/i18n/`, sin estado global por usuario. Verificar lecturas y fallbacks con cookies simuladas de dos solicitudes distintas, sin contaminación entre sus resultados.
- [x] 2.2 Añadir `PreferencesProvider`, conectarlo a `app/layout.tsx` con preferencias y mensajes serializables, actualizar `html.lang` y proporcionar contexto equivalente a tests y `.storybook/preview.ts` o `.tsx`. Verificar renderizado de servidor y cliente con la misma configuración, mantener las pruebas existentes en inglés/USD y confirmar `pnpm exec tsc --noEmit --incremental false`.

## 3. Selección y persistencia

- [x] 3.1 Añadir controles globales etiquetados de idioma/moneda usando los Select existentes, escritura validada de cookies y refresco de la vista; conservar la selección efectiva y mostrar error si la escritura falla. Reservar espacio en el layout raíz, ajustar la altura de Sidebar y mostrar la explicación de presentación sin conversión. Verificar las cuatro combinaciones, error de almacenamiento y ausencia de solapamiento en móvil mediante tests de controles y Playwright.
- [x] 3.2 Añadir regresiones de preferencias guardadas en `tests/e2e/localization.spec.ts`: recarga, nueva pestaña, controles en español presentes en HTML antes de JavaScript, cookies inválidas, navegadores independientes e inglés inicial incluso con navegador español. Documentar en README persistencia por navegador, valores iniciales y ausencia de conversión; verificar que esas instrucciones coinciden con los controles implementados.

## 4. Valores canónicos y componentes compartidos

- [x] 4.1 Migrar `ResponsiveSelect` a opciones `{ value, label }` y actualizar la página de transacciones, toolbar de pagos recurrentes y sus stories. Localizar las etiquetas de categorías, estados, colores y ordenación conservando los valores actuales; verificar que seleccionar la etiqueta española de `Bills` o `Highest` entrega el mismo valor canónico y que no queda ningún consumidor del antiguo contrato de strings.
- [x] 4.2 Localizar Sidebar, MinimizeMenu, paginación, cierre de Dialog, visibilidad de InputPassword y textos de SelectColorTag, incluidas etiquetas accesibles. Verificar nombres españoles en móvil y teclado, conservar las stories inglesas y mantener pasando los smoke tests existentes con su proveedor.

## 5. Migración de las vistas de producto

- [x] 5.1 Localizar títulos de páginas y widgets de Overview; convertir los importes de `Summary`, `Pots` y `Transactions` del resumen a números y sus fechas a valores inequívocos, conservando los datos actuales. Verificar por vista los importes, signos, días y nombres originales en ambos idiomas y monedas, sin parsear cadenas monetarias localizadas.
- [x] 5.2 Localizar transacciones de escritorio/móvil, presupuestos, SpendingSummary y BudgetChart con los formateadores comunes. Mantener categorías, `See All`, filtros y URL canónicos; añadir regresión de búsqueda rápida, cambio de idioma, recarga e historial preservando resultados. Verificar que el total presupuestado sigue siendo `975` y el gasto `270.5` con las pruebas de datos y E2E.
- [x] 5.3 Localizar PotCard y los diálogos de crear/editar/eliminar/agregar/retirar, incluyendo símbolos de inputs, metas, porcentajes y mensajes de demostración. Conservar validación de centavos y acciones sin guardado deshabilitadas; verificar previsualizaciones de `10.50`, porcentaje correcto y adornos sin solapamiento con USD/MXN en ambos idiomas.
- [x] 5.4 Localizar lista y resúmenes de pagos recurrentes, derivar vencimientos visibles de `dueDay` y mantener estados/claves estables. Verificar búsqueda y ordenación en español, etiquetas de pagado/vencimiento y que los totales numéricos actuales siguen siendo `1550`, `1510` y `40`, sin cambiar la regla existente de próximos vencimientos.
- [x] 5.5 Localizar acceso y registro, incluidos textos laterales, ayuda, mensajes de demostración y etiquetas de contraseña. Mantener envío bloqueado y respaldo POST; verificar navegación y controles de preferencias sin sesión, formularios en español y que las credenciales no aparecen en la URL.
- [x] 5.6 Retirar `currencyFormatter` fijo de `lib/utils.ts` cuando todos sus consumidores estén migrados; actualizar o retirar los antiguos helpers de formato de transacciones y revisar restos de importes, fechas y textos de interfaz incrustados. Verificar referencias con `rg`, igualdad de las cifras originales, cobertura de las siete vistas y catálogo completo sin modificar datos del usuario.

## 6. Integración completa

- [x] 6.1 Ejecutar `pnpm test`, `pnpm lint` y `pnpm exec tsc --noEmit --incremental false`. Verificar que pasan los tests previos y nuevos y que no hay dependencias adicionales, prefijos de ruta ni cambios de reglas financieras.
- [x] 6.2 Ejecutar `pnpm build`, `pnpm exec storybook build -o /tmp/finance-localization-storybook --disable-telemetry` y `pnpm test:e2e`. Verificar las siete vistas con las cuatro combinaciones, respuesta inicial localizada sin JavaScript, sesiones simultáneas aisladas, controles móviles y escritorio, persistencia y ausencia de solicitudes de tipos de cambio; confirmar que no hay errores de hidratación.

## Verification results

- `pnpm test`: 35 tests passed; `pnpm lint` and `pnpm exec tsc --noEmit --incremental false` passed.
- `TZ=America/Mexico_City pnpm exec vitest run lib/i18n`: 12 tests passed with a negative UTC offset.
- `pnpm test:e2e`: 17 Chromium tests passed, covering all seven routes, four preference combinations, desktop/mobile layouts, initial HTML without JavaScript, cookie failures, session isolation, canonical filters/history, demo safeguards and hydration errors.
- Storybook production build passed at `/tmp/finance-localization-storybook`; inspected the mobile Spanish/MXN savings dialog screenshot.
- `pnpm build` passed earlier during integration. The final Turbopack rerun was blocked by sandbox `EPERM` when PostCSS tried to bind an internal port, including the escalated attempt. The final source passed `pnpm build --webpack` without changing project configuration. The standard Turbopack build still needs confirmation in an unrestricted environment.
- Strict OpenSpec validation and `git diff --check` passed. No dependencies, business endpoints or currency conversion were added.
