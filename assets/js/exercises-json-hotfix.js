(() => {
  'use strict';

  // TEMPORARY HOTFIX for commit 78a187a:
  // data/exercises.json was left syntactically invalid at the l5 -> bp boundary.
  // This wrapper repairs ONLY that exact malformed boundary at runtime.
  // Remove this file after data/exercises.json is permanently corrected.

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const response = await nativeFetch(input, init);

    if (!/data\/exercises\.json(?:\?|$)/.test(url)) {
      return response;
    }

    const raw = await response.text();
    const broken = '"variants": "Más suave: menor"bp": {';

    if (!raw.includes(broken)) {
      // File is already fixed, preserve it untouched.
      return new Response(raw, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    const repaired = raw.replace(
      broken,
      '"variants": "Más suave: menor rango o menor tracción.",\n' +
      '  "muscles": "Glúteo mayor, piriforme y rotadores externos de cadera"\n' +
      '},\n"bp": {'
    );

    // Fail loudly if the expected repair did not happen.
    if (repaired === raw) {
      throw new Error('SpineFlow hotfix: no se pudo reparar data/exercises.json');
    }

    // Validate before returning it to app.js / plus60-loader.
    try {
      JSON.parse(repaired);
    } catch (err) {
      console.error('[SpineFlow] exercises.json sigue inválido después del hotfix', err);
      throw err;
    }

    console.warn('[SpineFlow] Hotfix temporal aplicado a data/exercises.json');
    return new Response(repaired, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  };
})();