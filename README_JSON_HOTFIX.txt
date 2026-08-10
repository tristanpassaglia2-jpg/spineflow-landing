SpineFlow — HOTFIX landing / exercises.json
============================================

CAUSA
El commit 78a187a dejó data/exercises.json inválido en el límite l5 -> bp:
"variants": "Más suave: menor"bp": {

QUÉ HACE ESTE PATCH
1. Carga assets/js/exercises-json-hotfix.js ANTES de plus60-loader.js.
2. Intercepta solamente data/exercises.json.
3. Repara exactamente ese límite roto.
4. Valida JSON.parse() antes de entregarlo a la app.
5. Si el archivo ya fue corregido, no modifica nada.
6. Bump del Service Worker para evitar caché vieja.

NO MODIFICA
- Supabase
- main
- lógica Gratis/Premium
- ejercicios fuera de la reparación sintáctica

DESTINO
Subir únicamente a v9-clean-rebuild.

ARCHIVOS
index.html
sw.js
assets/js/exercises-json-hotfix.js

Después del deploy:
- abrir Preview
- Ctrl+Shift+R
- comprobar landing
- comprobar Cervical, Dorsal, Lumbar y +60

Este hotfix es TEMPORAL. Luego conviene corregir físicamente data/exercises.json y retirar este wrapper.
