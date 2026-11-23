# Tasks

Plan para `d521aa5`, 18 de noviembre de 2026. Las pruebas propuestas usan la API efímera de `tests/fixtures`. La línea base tiene 62 pruebas unitarias y 50 E2E. Los ejemplos de las pruebas financieras están en `tests/e2e/finance.spec.ts` y `tests/finance-previews.test.tsx`; para identidad y transporte, en `tests/e2e/auth.spec.ts`, `lib/finance/scope.test.tsx` y `lib/api/finance-route.test.ts`.

Antes de aplicar, ejecutar `git diff --stat d521aa5..HEAD -- app components lib tests docs` y contrastar cualquier cambio relevante con `design.md`. Leer la documentación del Next instalado indicada en `AGENTS.md`. El grupo 3 depende del comportamiento fijado por el 1. Las pruebas de coherencia del grupo 4 deben ejecutarse con el cambio de identidad del grupo 2 integrado. El grupo 5 conserva la maquetación de cuenta e invitado. Los commits atómicos con prefijo quedan para la revisión del usuario.

## 1. Cierre, guardado y recuperación de formularios

- [x] 1.1 En `tests/e2e/finance.spec.ts`, caracterizar alta y edición midiendo el DOM cuando el panel entra en `data-state="closed"`. Cubrir Escape, botón X y fondo; registrar título, campos y valor. Verificar que la prueba detecta el campo que desaparece en la versión de base, sin usar una espera fija de 150 ms ni desactivar animaciones para este caso.
- [x] 1.2 Corregir `NewDialog` y `RowActions` en `app/ui/finance/common.tsx` y el comportamiento de movimiento reducido en `components/ui/dialog.tsx`. Verificar la prueba anterior, un alta nueva sin borrador previo, edición de dos filas distintas, cierre sin animaciones y foco en un control existente tras borrar la última fila.
- [x] 1.3 Coordinar `SaveForm`, `useSave`, los diálogos y las confirmaciones para que un envío pendiente anuncie progreso, no pueda repetirse y conserve el borrador hasta conocer el resultado. En una prueba con respuesta retenida, intentar cerrar por cada vía y confirmar un solo envío; al resolver o rechazar, comprobar el diálogo correcto, los errores, el foco y que ningún callback tardío afecta otra apertura. Verificar también depósito, retiro y plazo de deshacer.
- [x] 1.4 Declarar el botón de `QueryMessage` como acción auxiliar. En un editor válido, simular fallo de categorías, activar la recarga y contar un GET y cero escrituras. Cubrir activación por teclado y verificar los casos existentes de error 400 y resultado incierto con `pnpm exec vitest run tests/finance-previews.test.tsx` y `pnpm test:e2e tests/e2e/finance.spec.ts`.

## 2. Confirmación del login y cambio de cuenta

- [x] 2.1 Distinguir confirmación 401, fallo transitorio y login rechazado en `app/ui/AccountForm.tsx`; añadir el texto localizado a ambos idiomas si hace falta. Ampliar `tests/e2e/auth.spec.ts` para que un 503 seguido de éxito produzca un solo POST y un 401 de confirmación permita un login nuevo sólo al enviar explícitamente el formulario.
- [x] 2.2 Coordinar `lib/auth/SessionControls.tsx`, `lib/auth/client.ts`, `app/finance/layout.tsx` y `lib/finance/AccountScope.tsx`. Al reconciliar, comprobar identidad antes de reactivar formularios, refrescos o notificaciones de la vista anterior. Reutilizar la limpieza de caché y del token. Verificar con identidades simuladas que una respuesta 200 de otra cuenta descarta los datos, el borrador y efectos tardíos, que la misma cuenta conserva el borrador y que el modo invitado no lanza lecturas financieras.
- [x] 2.3 Comunicar transiciones de sesión confirmadas entre pestañas con una señal sin datos privados; coordinar foco, 401, fallo temporal, retorno seguro y el temporizador visible. Comprobar en el fixture el cambio legítimo de modo entre pestañas, ingreso y salida de invitado, y en pruebas de componente respuestas pendientes y foco sin duplicar comprobaciones por consulta. Documentar la reconciliación y el reintento en `docs/financial-integration.md`. Ejecutar `pnpm exec vitest run lib/finance/scope.test.tsx lib/auth/auth.test.ts` y `pnpm test:e2e tests/e2e/auth.spec.ts tests/e2e/finance.spec.ts`.

## 3. Formularios por módulo

- [x] 3.1 Localizar los seis consumidores y las pruebas con `rg -n "from ['\"].*/forms['\"]" app lib tests`. Mover los nueve formularios de `app/ui/finance/forms.tsx` por módulo según `design.md`, actualizar sus importaciones y compartir únicamente los controles y confirmaciones reutilizados. Separar declaraciones y JSX de los componentes movidos. Verificar con `pnpm exec tsc --noEmit` y `pnpm test` que cada pantalla conserva su operación, diseño y payload.
- [x] 3.2 Extraer la función pura `categoryOptions` a un módulo sin React/JSX. Actualizar el filtro, el campo y `lib/finance/contracts.test.ts`. Probar nombres duplicados con distintos IDs, categoría desactivada y categoría nula de apartado. Conservar pruebas de cuotas, intervalo 1–12, céntimos, progreso del apartado y colores fuera de paleta. Ejecutar `pnpm exec vitest run lib/finance/contracts.test.ts tests/finance-previews.test.tsx`.
- [x] 3.3 En el formulario de corte validar y normalizar el día antes de llamar a `saveSettings`. Probar que `01`, `1` y `31` generan un entero correcto y que vacío, fracciones, cero y 32 producen error de campo y cero PUT. Verificar el cuerpo HTTP con `pnpm test:e2e tests/e2e/finance.spec.ts`.

## 4. Búsquedas, precargas, invalidación y presupuestos

- [x] 4.1 En `ListToolbar` y `useFinancialURL` de `app/ui/finance/Transactions.tsx`, agrupar pulsaciones con 300 ms de inactividad, escribir el valor visible al instante y fusionar filtros con los parámetros vigentes. Probar las dos listas con un texto nuevo de siete letras a 80 ms por letra: un GET final, URL de la primera página, resumen mensual intacto. Cubrir borrar texto, composición, sort/categoría/mes durante la espera, Atrás/Adelante, recarga y salida de la pantalla sin petición tardía.
- [x] 4.2 Propagar `request.signal` para GET en `app/api/finance/[...path]/route.ts` aprovechando el timeout existente de `lib/api/upstream.ts`. Extender `lib/api/finance-route.test.ts` con una lectura controlada cuya señal llegue al transporte. Verificar que conserva la política de timeout y que un POST pendiente nunca se reejecuta ni se trata como deshecho al cancelar una lectura. Ejecutar `pnpm exec vitest run lib/api/finance-route.test.ts lib/api/client.test.ts`.
- [x] 4.3 Ajustar `FinanceHydration` en `lib/finance/server.tsx`. Probar con un espía en `lib/finance/server.test.tsx` los conteos SSR financieros por pantalla: Resumen 6, Transacciones 2, Categorías 1, Presupuestos 1, Apartados 1 y Recurrentes 2. Un mes inválido se normaliza igual en servidor y cliente. Comprobar con un editor cerrado cero GET de categorías en Presupuestos y Recurrentes, uno al primer uso en caché fría y cero adicionales al reabrir con caché fresca. Mantener visibles los estados de carga y fallo del campo.
- [x] 4.4 Limitar la actualización posterior a `saveSettings` con las claves de cuenta de `lib/finance/queries.ts` y el resultado de `lib/finance/services.ts`. Contar GET en `tests/e2e/finance.spec.ts` después del PUT, dentro de una ventana sin sondeo ni foco: hasta dos para configuración/resumen, cero para las otras cuatro fuentes. Verificar que el resumen cambia y que movimientos de apartado, pagos, aviso de presupuesto, Deshacer y el refresco visible de 60 s conservan la coherencia entre secciones.
- [x] 4.5 Evitar la consulta de `LatestExpenses` para gasto exacto cero en `app/ui/finance/Budgets.tsx`. Probar tres presupuestos sin gasto con cero GET de historial, ingreso sin gasto, cambios cero → positivo → cero y una lectura positiva resuelta tarde. Para gasto positivo mantener el test multipágina de `lib/finance/contracts.test.ts` y los totales ante fallo de vista previa. Verificar con `pnpm exec vitest run lib/finance/contracts.test.ts lib/finance/server.test.tsx` y `pnpm test:e2e tests/e2e/finance.spec.ts`.
- [x] 4.6 Actualizar las descripciones de precarga, invalidación y vista previa en `README.md` y `docs/financial-integration.md` con los conteos comprobados. Distinguir peticiones del navegador, lecturas SSR y comprobación de sesión. Verificar que los ejemplos concuerdan con las aserciones de 4.1, 4.3, 4.4 y 4.5.

## 5. Datos visibles y accesibilidad responsive

- [x] 5.1 Desacoplar la etiqueta central de `app/ui/BudgetChart.tsx` de la existencia de sectores con gasto. En `tests/e2e/finance.spec.ts`, verificar el centro con $0.00 gastados y $100.00 de límite en Resumen y Presupuestos, cuenta vacía, gasto positivo con precisión grande, y ausencia de tooltip financiero en el anillo decorativo.
- [x] 5.2 Mostrar en el formulario de edición de transacción el origen manual, de apartado o de recurrente y el nombre vinculado disponible, como texto localizado de sólo lectura. Probar los tres tipos y un nombre introducido por el usuario; inspeccionar que abrir el editor no consulta el vínculo y que el PUT sólo contiene campos editables.
- [x] 5.3 Corregir semántica de filas/cabeceras en `app/ui/finance/Transactions.tsx`, `app/ui/finance/Recurring.tsx` y `app/ui/recurring-bills/list/`. Verificar por roles y nombres la correspondencia de cada valor a 390 y 1280 px, cuenta e invitado según la pantalla; ningún control de la representación oculta entra en la secuencia de tabulación. Comprobar a 320 px que no hay desbordamiento y que el menú de fila sigue siendo alcanzable.
- [x] 5.4 Usar la selección exclusiva disponible en `components/ui/dropdown-menu.tsx` desde `components/ui/ResponsiveSelect.tsx`. Adaptar las aserciones de `tests/e2e/audit-regressions.spec.ts` y `tests/e2e/localization.spec.ts`. Probar teclado, nombre del filtro, una única opción marcada antes y después de cambiar, textos en español e inglés, y valores de escritorio. Ejecutar ambas suites y `pnpm test:e2e tests/e2e/finance.spec.ts`.

## 6. Verificación integrada

- [x] 6.1 Ejecutar desde el frontend `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test:e2e` y `FINANCE_NEXT_DIST_DIR=.next-real pnpm build` con las versiones fijadas por el lockfile. Todas deben terminar correctamente con los nuevos casos además de la línea base; registrar conteos GET de navegador, SSR y escrituras por separado.
- [x] 6.2 Verificar `openspec validate improve-finance-interactions-and-requests --strict`, revisar el diff contra el alcance y dejar constancia de los resultados. Si mantener la exactitud del historial requiere un API nuevo, presentar la medición y una propuesta separada antes de cambiar el contrato. Las pruebas deben usar el fixture local y los commits esperan la revisión.

## Evidencia de verificación

| Comprobación | Resultado con el fixture local |
| --- | --- |
| GET del navegador | Una lectura final por cada búsqueda de siete letras. Cero lecturas de categorías con el editor cerrado, una al abrir por primera vez y cero al reabrir con datos frescos. |
| Gasto cero | Tres presupuestos con gasto cero muestran tres vistas previas vacías y emiten cero GET de historial. La vista no repone los datos de una respuesta de historial tardía cuando el gasto vuelve a cero. |
| GET después de guardar el corte | Un GET del resumen financiero. La configuración se actualiza con la respuesta confirmada del PUT. |
| GET financieros de SSR | Resumen 6, Transacciones 2, Categorías 1, Presupuestos 1, Apartados 1 y Recurrentes 2. La comprobación de sesión se mide aparte. |
| Escrituras | Un POST por guardado pendiente. Cero escrituras al recargar categorías o al observar un pago automático. Un PUT por día de corte válido y cero PUT con un valor inválido. |
| Cancelación | La señal de un GET cancelado llega al transporte. Un POST separado conserva su resultado y se ejecuta una vez. |

Con Next.js 16.4.6 pasaron 70 pruebas unitarias, 61 pruebas de Chromium,
TypeScript, ESLint y la compilación de producción. La propuesta pasó
`openspec validate improve-finance-interactions-and-requests --strict`.
