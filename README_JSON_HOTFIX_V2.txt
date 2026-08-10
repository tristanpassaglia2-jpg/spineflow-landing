SpineFlow — JSON HOTFIX V2
===========================

Detectados dos errores sintácticos reales en data/exercises.json:
1) l5 quedó pegado a bp:
   "variants": "Más suave: menor"bp": {
2) Después de g3 falta una coma antes de g6.

Este V2:
- repara ambos casos antes de que la app lea exercises.json;
- además corrige comas faltantes entre bloques TOP-LEVEL de ejercicios;
- valida TODO el archivo con JSON.parse;
- si el documento no queda válido, detiene el arranque con un mensaje explícito;
- cambia el nombre de caché del Service Worker para evitar la versión anterior.

ARCHIVOS A SUBIR:
- index.html
- sw.js
- assets/js/exercises-json-hotfix.js
- README_JSON_HOTFIX_V2.txt

SUBIR SOLO A: v9-clean-rebuild
NO TOCAR main.
NO TOCA Supabase.

Después del deploy:
1. Esperar Ready.
2. Abrir Visit.
3. Ctrl+Shift+R.
4. Si persiste caché vieja, cerrar pestaña y volver a abrir el Preview.
