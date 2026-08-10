(() => {
  'use strict';
  // ============================================================
  // exercises-json-hotfix.js — V4 NEUTRALIZED (2026-08-10)
  //
  // Este hotfix era un parche histórico para reparar errores de
  // sintaxis JSON en versiones antiguas de exercises.json (comas
  // faltantes, l5 mal escrito, etc.).
  //
  // A partir de V11 con biblioteca de 100 ejercicios, exercises.json
  // se genera desde Python con validación estricta antes de cada
  // commit, por lo tanto el archivo ya no necesita reparación.
  //
  // Además el patch anterior tenía un bug: al reemplazar el bloque
  // "l5" ... "bp" en el JSON, borraba silenciosamente l6, l7, l8,
  // l9, l10, l11 y l12 en cada carga, rompiendo Lumbalgia mecánica,
  // Facetario, Hernia lumbar y otras patologías.
  //
  // Esta versión NO modifica nada: deja que exercises.json se cargue
  // tal cual está en el servidor. Se mantiene el archivo para no
  // romper la referencia <script> en index.html.
  // ============================================================
  console.info('[SpineFlow] hotfix V4 activo (modo no-op — exercises.json se carga sin modificaciones)');
})();
