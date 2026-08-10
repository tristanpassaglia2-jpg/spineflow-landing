(() => {
  'use strict';

  // SpineFlow JSON HOTFIX V2
  // Repair only data/exercises.json before any loader/app parses it.
  // Handles:
  // 1) malformed l5 -> bp boundary from commit 78a187a
  // 2) missing commas between top-level exercise objects (e.g. g3 -> g6)
  // Then validates the ENTIRE document with JSON.parse.

  const nativeFetch = window.fetch.bind(window);

  function repairExercisesJson(raw) {
    let fixed = raw;

    // Exact malformed l5 boundary.
    fixed = fixed.replace(
      /"variants"\s*:\s*"Más suave:\s*menor"\s*"bp"\s*:\s*\{/,
      '"variants": "Más suave: menor rango o menor tracción.",\n' +
      '  "muscles": "Glúteo mayor, piriforme y rotadores externos de cadera"\n' +
      '},\n' +
      '"bp": {'
    );

    // Missing comma between TOP-LEVEL exercise blocks:
    //   }
    //   "g6": {
    // becomes:
    //   },
    //   "g6": {
    // Restrict to exactly 2-space indentation so nested objects are untouched.
    fixed = fixed.replace(
      /^  }\s*\n  "([A-Za-z0-9_]+)"\s*:\s*\{/gm,
      '  },\n  "$1": {'
    );

    return fixed;
  }

  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const response = await nativeFetch(input, init);

    if (!/data\/exercises\.json(?:\?|$)/.test(url)) {
      return response;
    }

    const raw = await response.text();
    const repaired = repairExercisesJson(raw);

    try {
      JSON.parse(repaired);
    } catch (err) {
      console.error('[SpineFlow] exercises.json inválido incluso después del HOTFIX V2', err);
      throw new Error(
        'SpineFlow HOTFIX V2 no pudo validar exercises.json: ' + (err?.message || err)
      );
    }

    if (repaired !== raw) {
      console.warn('[SpineFlow] HOTFIX V2 reparó data/exercises.json y validó el documento completo.');
    }

    return new Response(repaired, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  };
})();