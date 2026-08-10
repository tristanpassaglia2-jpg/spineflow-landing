(() => {
  'use strict';

  const nativeFetch = window.fetch.bind(window);

  const VALID_L5 = `"l5": {
  "name": "Estiramiento de glúteo mayor supino",
  "level": "Inicial",
  "reps": "45 seg cada lado",
  "series": "3 rep × lado",
  "position": "Acostado/a boca arriba, rodillas flexionadas",
  "breathing": "Respiración profunda y relajada. El estiramiento se profundiza con cada exhalación.",
  "warning": "El estiramiento debe sentirse en el glúteo, no en la rodilla. Si duele la rodilla, ajustá el agarre.",
  "steps": [
    "Acostado/a boca arriba, rodillas flexionadas, pies apoyados en el piso.",
    "Llevá una rodilla al pecho, tomándola con ambas manos por detrás del muslo.",
    "Cruzá el tobillo de la otra pierna sobre la rodilla elevada (figura 4 invertida).",
    "Traccioná suavemente hacia vos hasta sentir estiramiento profundo en el glúteo cruzado.",
    "Mantené 45 segundos respirando profundo. Cambiá de lado. 3 repeticiones por lado."
  ],
  "variants": "Más suave: menor rango o menor tracción.",
  "muscles": "Glúteo mayor, piriforme y rotadores externos de cadera"
},
"bp": {`;

  function replaceBrokenL5(raw) {
    const start = raw.indexOf('"l5": {');
    const bp = raw.indexOf('"bp": {', start);
    if (start === -1 || bp === -1) return raw;

    // Replace EVERYTHING from l5 start through the bp opening marker.
    return raw.slice(0, start) + VALID_L5 + raw.slice(bp + '"bp": {'.length);
  }

  function fixTopLevelMissingCommas(raw) {
    // Known confirmed error: g3 closes and g6 begins without comma.
    let fixed = raw.replace(
      /("muscles"\s*:\s*"Extensores torácicos[\s\S]*?movilidad de columna torácica en extensión"\s*\n\s*})\s*\n\s*("g6"\s*:\s*\{)/,
      '$1,\n  $2'
    );

    // Generic safety for top-level object transitions:
    // exactly two spaces + } then exactly two spaces + "id": {
    fixed = fixed.replace(
      /^  }\s*\n  "([A-Za-z0-9_]+)"\s*:\s*\{/gm,
      '  },\n  "$1": {'
    );
    return fixed;
  }

  function repair(raw) {
    let fixed = replaceBrokenL5(raw);
    fixed = fixTopLevelMissingCommas(fixed);
    return fixed;
  }

  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const response = await nativeFetch(input, init);

    if (!/data\/exercises\.json(?:\?|$)/.test(url)) return response;

    const raw = await response.text();
    const repaired = repair(raw);

    try {
      JSON.parse(repaired);
    } catch (err) {
      console.error('[SpineFlow] HOTFIX V3 - JSON final inválido', err);
      throw new Error('SpineFlow HOTFIX V3: ' + (err?.message || err));
    }

    console.warn('[SpineFlow] HOTFIX V3 aplicado. exercises.json validado por completo.');
    return new Response(repaired, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  };
})();