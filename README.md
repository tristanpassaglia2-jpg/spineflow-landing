# SpineFlow V9 — Release Candidate

Aplicación web/PWA de rehabilitación de columna. Incluye 46 ejercicios, 3 módulos, 12 patologías y una secuencia fotográfica específica de cinco fases para cada ejercicio.

## Publicar en GitHub

1. Crear la rama `v9-clean-rebuild` desde `main`.
2. Descomprimir este ZIP.
3. Subir **el contenido interno** de la carpeta a la raíz de la rama: `index.html`, `assets/`, `data/`, `media/`, etc.
4. Confirmar el commit y esperar el Preview Deployment de Vercel.
5. Probar en la URL Preview antes de fusionar a `main`.

## Prueba local

No abrir `index.html` con doble clic, porque los navegadores bloquean los archivos JSON locales. Ejecutar desde esta carpeta:

```bash
python3 -m http.server 8080
```

Luego visitar `http://localhost:8080`.

## Supabase

La interfaz está preparada para integrar Auth y persistencia, pero este paquete no contiene claves ni modifica el proyecto `atefklvwshuwrmeasrnq`. La sesión de demostración y el progreso se guardan en `localStorage` hasta conectar el cliente oficial con autorización.

## Regla clínica conservada

En cada patología, los primeros dos ejercicios son gratuitos y los restantes se muestran como Premium. No se deben reordenar los arrays de `data/regions.json` sin revisar esa regla.
