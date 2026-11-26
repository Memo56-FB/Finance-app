# Tasks

## 1. Estado de sesión y primer presupuesto optimista

- [x] 1.1 Ampliar las operaciones de `common.tsx` con intenciones tipadas y claves locales estables. Verificar en pruebas unitarias envío único, cancelación sin efectos, dos operaciones independientes y limpieza al cambiar de sesión.
- [x] 1.2 Integrar alta, edición y baja de presupuesto en las tarjetas, gráfico, cuatro categorías de Resumen y selector de categoría. Retener un POST en Playwright y comprobar tarjeta, color, límite, suma y categoría reservada antes de liberarlo, también después de navegar. Cubrir gasto histórico desconocido y lista inicialmente vacía.
- [x] 1.3 Conciliar por secuencia e ID con la respuesta canónica y las lecturas posteriores. Forzar una lectura vieja, una lectura que alcanza al POST, una respuesta con valores corregidos y un fallo de refresco. Verificar una sola tarjeta durante todas las transiciones y cero escrituras durante el reintento de lectura.
- [x] 1.4 Retirar franja y etiquetas pendientes para las operaciones ya proyectadas. Mantener errores y revisión de borrador. Probar dos escrituras con resultados en orden inverso, un 409, timeout después de aplicar el cambio y lectura sin evidencia concluyente.

## 2. Proyección de las demás operaciones financieras

- [x] 2.1 Aplicar las operaciones de Categorías a lista, selectores y nombres relacionados. Probar nombres duplicados, alta aún sin ID utilizable y rechazo de baja por dependencia.
- [x] 2.2 Aplicar altas, ediciones y bajas de Transacciones a historial, Resumen y gasto presupuestado según fecha efectiva, signo, origen, categoría y corte. Probar cambio de mes y de categoría, búsqueda, cuatro filas por página y cálculo exacto con importes grandes sin inferir totales de una página parcial.
- [x] 2.3 Integrar tarjetas y total de Apartados, depósitos, retiros, bajas y restauraciones. Verificar saldo conocido de $100 a $125 antes de la respuesta, navegación a Resumen, un único movimiento al confirmar, reversión tras rechazo y plazo real de deshacer.
- [x] 2.4 Integrar definición, baja y pago de recurrentes en filas e indicadores por mes. Probar pago visible, actualización de cuotas e importes, prevención de doble pago y recepción posterior del movimiento canónico.
- [x] 2.5 Proyectar los ajustes de corte y resolver por separado los datos del periodo. Verificar que un cambio de corte conserva los paneles independientes, usa el periodo correcto y revierte sólo sus propios efectos si se rechaza.
- [x] 2.6 Actualizar las pruebas de `finance.spec.ts` que esperan la franja pendiente o cifras congeladas. Cambiar también el helper de guardado para que las pruebas que necesitan confirmación esperen una respuesta u otro efecto canónico. Comprobar que una sesión B, invitado, recarga o respuesta tardía nunca recuperan ni reenvían la operación de A.

## 3. Skeleton en entradas, controles y regiones

- [x] 3.1 Incorporar el Skeleton local de shadcn Base y las composiciones compartidas para campos, filas, tarjetas e importes. Verificar que usan tokens del proyecto, carecen de foco y animación con movimiento reducido, y que cada región comunica una única espera localizada.
- [x] 3.2 Cubrir hidratación en `FinanceView`, espera sensible de sesión y Suspense de transacciones de invitado. Verificar que las entradas directas resuelvan el acceso en el servidor, que el HTML público sea visible sin JavaScript y que las esperas dentro de la interfaz conserven redirección, privacidad y navegación.
- [x] 3.3 Integrar controles ocupados en `AccountForm`, `SessionControls` y `PreferencesBar`. Probar acceso, registro, invitado, salida y transición de idioma con demoras. Verificar foco, nombre accesible, borrador y un solo envío.
- [x] 3.4 Reemplazar la presentación de carga de `QueryMessage` donde corresponda y componer Resumen, Transacciones y Categorías. Retener cada lectura por separado y verificar sus regiones, paginación y filtro dependiente tanto en primera carga como con caché utilizable.
- [x] 3.5 Componer los bloques de Presupuestos (incluidos gráfico, leyenda y gastos recientes), Apartados, Pagos recurrentes y campos dependientes de los editores. Verificar que cada bloque resuelva individualmente a éxito, vacío o error con reintento y que los bloques con datos se mantengan durante la revalidación.

## 4. Verificación integrada

- [x] 4.1 Recorrer las seis secciones con el backend de pruebas retenido en lectura y escritura. Verificar presupuesto creado durante el arranque en frío, navegación, ausencia de parpadeo o duplicados y que un Skeleton no oculte la tarjeta optimista. Repetir en móvil y escritorio, en español e inglés y con movimiento reducido.
- [x] 4.2 Ejecutar TypeScript, ESLint, Vitest y las pruebas Playwright de finanzas, acceso y localización. Verificar los recuentos de peticiones existentes, ausencia de reenvíos y aislamiento de datos al salir durante un guardado.
