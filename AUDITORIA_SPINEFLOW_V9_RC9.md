# SpineFlow V9 — Auditoría integral RC9

## Resumen ejecutivo

Se auditó la estructura activa de `v9-clean-rebuild`, la lógica de navegación, el sistema Gratis/Premium, el reproductor de cinco pasos, los datos clínicos cargados por `data/exercises.json`, el módulo +60, PWA/service worker y los archivos residuales del repositorio.

### Bloqueadores antes de `main`
1. **Bird Dog (k4):** el texto clínico exige movimiento contralateral; la lámina fotografiada es visualmente ambigua/inconsistente. El RC9 corrige el texto y coloca una advertencia imposible de ignorar, pero **el asset `media/exercises/k4.webp` debe reemplazarse por una secuencia contralateral inequívoca antes de producción**.
2. **Secuencias:** las etiquetas fijas “Posición inicial / Movimiento / Pausa / Retorno / Repetición” no describen los pasos reales de muchos ejercicios. RC9 las reemplaza por **Paso 1–5**.
3. **QR +60:** los 15 QR fueron generados como parte de la imagen y no tienen destino funcional. RC9 genera en tiempo de ejecución un bitmap limpio con Canvas, elimina el QR de la imagen mostrada y coloca “Demostración integrada en la app”. Los PNG fuente siguen intactos en GitHub.
4. **Postoperatorio:** había tiempos absolutos y progresiones demasiado universales para una población heterogénea. RC9 los hace dependientes del procedimiento y del equipo tratante.

## Hallazgos clínicos prioritarios

- **k3 Dead Bug:** el panel visual de extensión no coincide con el tercer panel del sprite. RC9 mapea el Paso 3 al panel visual que realmente muestra la extensión.
- **k4 Bird Dog:** debe ejecutarse con brazo y pierna opuestos; se corrige la redacción y se marca como bloqueo visual pendiente.
- **c6 Trapecio/elevador:** existía contradicción interna entre el paso y la variante sobre la dirección de rotación. RC9 unifica la técnica.
- **s2 Slider ciático:** la versión previa combinaba extensión de rodilla + flexión cervical, patrón de carga neural tipo tensioner, a pesar de llamarlo slider. RC9 coordina extensión de rodilla con extensión cervical y el retorno con flexión, manteniendo el tobillo relajado.
- **p7 Slider neural postoperatorio:** se corrige por el mismo motivo y se mantiene condicionado a autorización profesional.
- **em / s3 extensión tipo McKenzie:** se eliminan afirmaciones anatómicas de “migración anterior/retracción del material discal”; la progresión pasa a basarse en preferencia direccional y respuesta de síntomas.
- **p1 ankle pumps:** ya no se afirma que el ejercicio por sí mismo “previene TVP”; se aclara que no reemplaza la profilaxis indicada.
- **p4/p5/p6/p8 postoperatorio:** se eliminan reglas temporales universales y progresiones de equilibrio no supervisadas.

## Hallazgos de UX / producto

- Landing desactualizada: decía 46 ejercicios / 3 módulos / 12 programas. Debe decir **61 / 4 / 16**.
- El módulo +60 aparecía como “4 patologías”; se corrige a **4 bloques funcionales**.
- El grid estaba preparado para 3 módulos; RC9 lo adapta a 4.
- El sombreado de `.phase-focus` oscurecía el resto de la lámina con un `box-shadow` de 999 px. RC9 lo reemplaza por borde y halo limitado al panel activo.
- Los nombres fijos de fase también eran pronunciados por voz; RC9 los convierte a Paso 1–5.
- Falta `aria-pressed` en la navegación por pasos; RC9 lo agrega.

## Hallazgo de exposición pública de contenido heredado

La auditoría detectó páginas HTML antiguas todavía desplegables por URL directa. Por ejemplo, `pages/escoliosis.html` conserva textos como “Valen · guía clínica”, “Monetización sugerida” y referencias a una estética anterior; `login.html` también usa `assets/images/valen.png`. Aunque estas páginas no forman parte de la navegación actual, Vercel puede servirlas si alguien conoce o indexa la URL.

**RC9 las neutraliza en Preview mediante redirects de Vercel**:
- `/pages/*` → `/`
- `/login` y `/login.html` → `/`
- `/assets/images/valen.png` → `/media/coach/mi-profe.webp`

Después de validar RC9, conviene borrar físicamente esos archivos heredados en una rama de limpieza separada.

## Hallazgos técnicos / mantenimiento

- La rama contiene varias generaciones antiguas de datos y código (`app.js`, `assets/app.js`, `assets/js/app.js`; `exercises.json`, `assets/exercises.json`, `data/exercises.json`). La app activa usa `assets/js/app.js` y `data/exercises.json`. Recomiendo limpieza en una rama posterior, no durante esta corrección clínica.
- Persisten archivos heredados como `assets/images/valen.png` y páginas/rutinas antiguas de “mayores de 70”; no se cargan en la app actual, pero aumentan confusión y peso del repositorio.
- `VALIDATION_REPORT.md` valida estructura técnica, no coherencia biomecánica de cada imagen; no debe interpretarse como validación clínica visual.
- El temporizador del reproductor es global (30 s) y no está adaptado a repeticiones/holds de cada ejercicio. Requiere una fase posterior de producto si se quiere que el tiempo sea prescriptivo.
- El “Objetivo terapéutico” del panel derecho es actualmente genérico para todos los ejercicios. Conviene convertirlo en campo específico por ejercicio antes del lanzamiento comercial.
- El service worker anterior era cache-first incluso para HTML/JS/JSON. RC9 usa `skipWaiting()`, `clients.claim()` y network-first para navegación, JavaScript y datos, reduciendo previews obsoletos.
- `vercel.json` tiene `nosniff` y política de referrer, pero no una CSP/Permissions-Policy completa. Recomendación técnica futura, con prueba cuidadosa por la conexión prevista a Supabase.

## Evidencia usada para las correcciones clínicas

- La movilización neural tipo **slider** descarga un extremo mientras carga el otro; en sedestación, la extensión de rodilla se combina con extensión cervical para reducir carga craneal. Véase Ellis et al., estudio ecográfico de excursión del ciático, y ensayos de slider/tensioner.
- La **centralización/preferencia direccional** es un fenómeno clínico útil, pero no justifica afirmar que un ejercicio “recoloca” físicamente el disco.
- Los protocolos postoperatorios de fusión de centros de referencia subrayan que la progresión es individual y depende de la cirugía, restricciones y órdenes del cirujano.
- Para +60, OMS y CDC STEADI respaldan programas multicomponente con fuerza funcional, equilibrio y prevención de caídas.

## Criterio de salida a producción

No fusionar a `main` hasta:
1. validar RC9 en Vercel Preview;
2. reemplazar la imagen de Bird Dog por una secuencia contralateral inequívoca;
3. comprobar al menos un ejercicio por cada programa con Paso 1–5;
4. revisar móvil/tablet/desktop;
5. confirmar que no aparece ningún QR falso;
6. confirmar que Gratis/Premium sigue intacto.
