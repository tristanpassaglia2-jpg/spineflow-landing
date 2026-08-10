SpineFlow JSON HOTFIX V3

Este V3 NO intenta arreglar solo una frase:
- reemplaza completo el bloque roto l5 por un bloque JSON válido;
- corrige la transición confirmada g3 -> g6;
- corrige otras comas faltantes entre bloques top-level;
- valida TODO exercises.json con JSON.parse antes de entregarlo a la app.

Subir solo a v9-clean-rebuild:
- index.html
- sw.js
- assets/js/exercises-json-hotfix.js
- README_JSON_HOTFIX_V3.txt

Después:
1. esperar Vercel Ready
2. Visit
3. Ctrl+Shift+R
4. si persiste cache: cerrar la pestaña Preview y abrirla de nuevo

No toca main, Supabase ni lógica Gratis/Premium.
