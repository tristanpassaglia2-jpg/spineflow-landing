SPINEFLOW V9 — RC9 AUDIT FIXES

DESTINO
- Subir SOLO a la rama: v9-clean-rebuild
- NO tocar main
- NO modifica Supabase

ARCHIVOS DEL PARCHE
1. index.html
2. assets/js/rc9-audit-fixes.js
3. sw.js
4. vercel.json

CORRECCIONES IMPLEMENTADAS
- Secuencia visual: Paso 1–5 reemplaza etiquetas genéricas que no coincidían con muchos ejercicios.
- El recuadro activo ahora cubre exactamente el 20% del strip y ya no oscurece el resto de la lámina.
- Dead Bug (k3): mapeo visual corregido para que el paso de extensión ilumine el panel de extensión real.
- Bird Dog (k4): texto corregido a movimiento CONTRALATERAL y aviso técnico visible.
  IMPORTANTE: el asset fotográfico k4.webp todavía debe reemplazarse por una lámina inequívocamente contralateral antes de main.
- +60: el QR generado por IA se elimina del bitmap que muestra la app mediante Canvas y se reemplaza por “Demostración integrada en la app”. Los PNG fuente originales no se modifican en este parche.
- Landing: 61 ejercicios, 4 módulos, 16 programas/bloques.
- +60: “4 patologías” pasa a “4 bloques funcionales”.
- Grid de módulos: 4 columnas desktop / 2 tablet / 1 móvil.
- Accesibilidad: aria-pressed en pasos y reduced-motion.
- Voz guiada: Paso 1–5 en lugar de etiquetas genéricas.
- Correcciones clínicas de texto:
  * c6: estiramiento elevador/trapecio coherente.
  * s2: verdadero slider neural (no tensioner rotulado como slider).
  * p7: slider neural postoperatorio solo con autorización.
  * em y s3: eliminadas afirmaciones no justificadas de “recolocación/retracción” discal.
  * p1: ankle pumps no se presentan como sustituto de profilaxis de TVP.
  * p4/p5/p6/p8: tiempos y progresiones postoperatorias dejan de ser universales y pasan a depender del procedimiento/equipo tratante.

CACHE
spineflow-v9-rc9-audit-fixes

VALIDAR EN VERCEL PREVIEW ANTES DE MAIN
- Dead Bug: Paso 3 debe iluminar el panel de extensión.
- Bird Dog: debe mostrar aviso de movimiento contralateral. NO fusionar a main hasta reemplazar k4.webp.
- +60: ningún QR debe ser visible dentro del ejercicio.
- Secuencia: el recuadro debe cubrir una quinta parte completa, sin oscurecer 4/5 de la lámina.
- Cervical/Dorsal/Lumbar/+60: navegación, Gratis/Premium, voz y completar.

- Se bloquean/redirectan las páginas heredadas `/pages/*` y el antiguo `/login.html`, que todavía contenían la identidad “Valen” y textos comerciales obsoletos.
- La URL directa de `assets/images/valen.png` se redirige a `media/coach/mi-profe.webp`.

- Service worker reforzado: `skipWaiting()` + `clients.claim()` y estrategia network-first para navegación, JavaScript y JSON. Esto reduce el riesgo de ver un Preview viejo por caché.
