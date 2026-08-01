# Informe de validación — SpineFlow V9 RC

Fecha: 31 de julio de 2026

## Contenido

- Ejercicios únicos: **46**
- Láminas hiperrealistas específicas: **46**
- Fases por ejercicio: **5**
- Módulos: **3** (`cervical`, `dorsal`, `lumbar`)
- Patologías: **12**
- Regla gratuita/Premium: **2 gratuitos por patología; restantes Premium**

## Pruebas realizadas

- Validación sintáctica de `assets/js/app.js`.
- Carga correcta de `exercises.json` y `regions.json`.
- Correspondencia exacta entre los 46 IDs clínicos y los 46 archivos visuales.
- Lectura individual correcta de las 46 imágenes WebP.
- Flujo DOM automatizado: landing → dashboard → módulo → patología → ejercicio.
- Cambio real entre las cinco fases del reproductor.
- Registro de ejercicio completado.
- Apertura del bloqueo/diálogo Premium.
- Solicitud HTTP de las 46 imágenes: 46 respuestas correctas, 0 fallas.
- 0 errores de JavaScript durante la prueba DOM.
- 0 rutas HTTP con respuesta 4xx/5xx durante la prueba.
- Verificación de integridad del ZIP después del empaquetado.

## Límite deliberado

Supabase no fue modificado y no se incluyen claves. La autenticación y el progreso funcionan en modo local de demostración. La integración productiva debe configurarse en Vercel con las credenciales autorizadas después de aprobar el Preview Deployment.

## Recomendación de publicación

Publicar primero en la rama `v9-clean-rebuild`, revisar el Preview Deployment de Vercel en escritorio y móvil, y fusionar a `main` únicamente después de la aprobación clínica y visual.
