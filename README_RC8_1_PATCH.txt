SPINEFLOW V9 — RC8.1 PATCH

CORRECCIÓN
Las láminas +60 pasan a mostrarse DENTRO de cada ejercicio, en el área del reproductor.

Qué corrige:
- Elimina el botón externo "Ver lámina".
- Mantiene la miniatura en la lista de ejercicios.
- Al pulsar "Comenzar", la lámina completa aparece dentro del ejercicio.
- Corrige la ruta rota media/exercises/s60_XX.webp usando assets/img/plus60/.
- Mantiene indicaciones, fases, voz, temporizador y botón completar.
- No modifica Cervical, Dorsal ni Lumbar.
- No modifica Supabase ni datos de usuarios.
- Cache nueva: spineflow-v9-rc8-1-plus60-lamina-dentro

SUBIR SOLO A v9-clean-rebuild:
1) assets/js/plus60-loader.js
2) sw.js

No tocar main.
