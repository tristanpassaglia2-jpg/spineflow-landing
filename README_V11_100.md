# SpineFlow V11 — 100 Ejercicios

**Versión:** V11 (arquitectura de secuencias estáticas)
**Fecha:** Agosto 2026
**Total ejercicios:** 100 (77 base + 23 módulo +60)
**Total patologías:** 14 (12 originales + 2 nuevas: sacroileítis, pubalgia)
**Módulos:** 4 (Cervical, Dorsal, Lumbar, +60)

---

## 🎯 Marketing

- **"SpineFlow — 100 ejercicios clínicamente diseñados"**
- **"14 patologías · 100 ejercicios · Programa clínico completo"**
- **"Desarrollado por un equipo médico especializado en columna vertebral"**

---

## 📐 Filosofía clínica V11

### Principios rectores
1. **Ejercicios activos > pasivos.** Priorizar fortalecimiento, movilidad activa y neurodinámica sobre estiramientos pasivos genéricos.
2. **Base científica actualizada.** Cada ejercicio referenciado a evidencia clínica reciente (INTOS 2024, Mangiarelli, revisiones sistemáticas 2022+).
3. **Sincronía triple.** Cada fase de cada ejercicio tiene 3 componentes alineados:
   - **Texto clínico** en `data/exercises.json`
   - **Voz guiada** (TTS que lee el texto)
   - **Imagen** (lámina fotorrealista en `media/sequences/[id]/0N.webp`)
4. **NO afirmar validación clínica completa** hasta que cada ejercicio esté revisado individualmente.

### Reglas transversales
- Cada ejercicio puede tener **1, 3, 4 o 5 fases** según su complejidad biomecánica
- Cada fase = archivo independiente (si falla la fase 3, se reemplaza solo `03.webp`)
- Prohibido dentro de la imagen: texto, QR, logos, diagramas
- Ambiente visual: gimnasio moderno estilo Kaia Health / Peloton (no clínica de fisio, no living hogareño)
- Consistencia dentro de un mismo ejercicio: misma persona, ropa, fondo, cámara, encuadre
- Puede rotar instructor entre ejercicios distintos

---

## 🗺️ Distribución completa

### 🔵 CERVICAL (4 patologías · 20 ejercicios)

| Patología | Ejercicios | Gratis |
|---|---|---|
| **Hernia de disco cervical** | c1, c5, c4, c3, c8, c2 | 2 |
| **Síndrome occipital (Arnold)** | n1, c6, c1, c2, c7, g8 | 2 |
| **Cervicalgia por espasmo** | n1, c6, c2, c7, c1, g2 | 2 |
| **Síndrome del desfiladero torácico** | c1, k8, c9, c10, c11, n3, c6, n2 | 2 |

**Ejercicios cervicales (c1-c11):**
- c1 — Retracción cervical (Chin Tuck)
- c2 — Estiramiento lateral cervical
- c3 — Rotación cervical activa asistida
- c4 — Flexo-extensión cervical controlada
- c5 — Isométricos cervicales multi-dirección
- c6 — Estiramiento trapecio superior y elevador
- c7 — Movilización de cintura escapular
- c8 — Retracción cervical contra resistencia elástica
- **c9 [V11]** — Retracción escapular activa con sostén isométrico
- **c10 [V11]** — Wall angel de pie con activación escapular baja
- **c11 [V11]** — Movilización de 1ª costilla con toalla

---

### 🟢 DORSAL (3 patologías · 8 ejercicios)

| Patología | Ejercicios | Gratis |
|---|---|---|
| **Espasmo dorsal** | l4, c7, g6, g3, g2, k8, bp, l3 | 2 |
| **Escoliosis** | k1, k4, k3, k8, k5, cl, g6, g4 | 2 |
| **Dorsalgia** | g3, l4, g2, c7, k8, g6, l3, g4 | 2 |

**Nota escoliosis:** La corrección específica de la curva (métodos Schroth/SEAS) requiere evaluación profesional. Este programa es de soporte general.

**Ejercicios dorsales (g-series):**
- g2 — Movilización global de cuello y hombros
- g3 — Extensión dorsal en silla
- **g4 [V11]** — Prone Y-T-I (fortalecimiento dorsal escapular)
- g6 — Rotación de tronco de pie con brazos relajados
- g8 — Relajación muscular progresiva de Jacobson

---

### 🟠 LUMBAR (7 patologías · biblioteca amplia)

| Patología | Ejercicios | Gratis |
|---|---|---|
| **Hernia lumbar con ciatalgia** | em, s3, s6, dp, s2, l1, s7, s4, l5, l11 | 2 |
| **Lumbalgia mecánica** | bp, l2, l4, l1, l7, k1, em, l6, l3, l8, l9, l10, l11, l12, l13, l14 | 2 |
| **Síndrome piramidal** | s1, s8, n4, cl, s5, s2, s7, l5 | 2 |
| **Síndrome facetario** | bp, l1, l4, l7, l2, k1, l6, l3, l8, l12 | 2 |
| **Sacroileítis [V11 NUEVA]** | s1, sac1, cl, s5, s6, sac2, sac3 | 2 |
| **Pubalgia [V11 NUEVA]** | sac1, pub2, s5, pub3, k5, pub4, l10, k3 | 2 |
| **Rehabilitación post cirugía** | Por fases (ver algoritmo abajo) | 2 |

**Ejercicios lumbares (l-series):**
- l1 — Rodilla al pecho unilateral
- l2 — Puente de glúteos (Hip Bridge)
- **l3 [V11]** — Superman modificado (extensión prona activa)
- l4 — Gato-Camello (Cat-Cow)
- **l5 [V11]** — Estiramiento de glúteo mayor supino
- l6 — Estiramiento de isquiotibiales activo
- l7 — Rotaciones lumbares controladas
- **l8 [V11]** — Plancha modificada desde rodillas
- **l9 [V11]** — Puente de una pierna (single-leg bridge)
- **l10 [V11]** — Estiramiento del psoas de rodillas (half-kneeling)
- **l11 [V11]** — Movilización activa lumbar en cuadrupedia
- **l12 [V11]** — Elongación en posición de niño (child's pose activa)
- **l13 [V11]** — Elongación cuadrado lumbar en decúbito lateral
- **l14 [V11]** — Estiramiento cuadrado lumbar sentado con inclinación lateral

**Ejercicios base (bp, cl, dp, em):** Báscula pélvica, Clamshell, Deslizamiento pared, Extensión McKenzie

**Serie S (ciática, piramidal):** s1-s8 (piriforme, neural floss, McKenzie, isquiotibiales, glúteo medio, 90-90, caminata, figura 4 sentado)

**Serie K (core):** k1, k3, k4, k5, k8 (transverso, dead bug, bird dog, plancha lateral, respiración diafragmática)

**Serie N (nervios/miofascial):** n1, n2, n3, n4

**🆕 Sacroileítis (sac-series):**
- **sac1** — Isométrico de aductores con pelota (compartido con Pubalgia)
- **sac2** — Puente con banda en rodillas
- **sac3** — Movilización activa de sacroilíaca

**🆕 Pubalgia (pub-series):**
- **pub2** — Estiramiento aductores en mariposa
- **pub3** — Copenhagen adductor progresivo
- **pub4** — Puente con pelota entre rodillas
- (Reutiliza sac1 y l10)

---

### 🩺 REHABILITACIÓN POST CIRUGÍA — Algoritmo por fases temporales

Único módulo con **estructura por fases** (no lineal). El paciente progresa según semana post-op y autorización del cirujano.

#### 📅 FASE 1 — Aguda (Día 1-7)
`p1, p2, p3, p4, p5`
- p1 Bombeo de tobillos (cada 2h — previene TVP)
- p2 Respiración profunda post-operatoria
- p3 Isométrico cuádriceps
- p4 Log-roll (técnica funcional)
- p5 Deambulación 5 min × 3/día

#### 📅 FASE 2 — Subaguda temprana (Semana 2-3)
`p5, p9, p10, p3, p11, p12`
- p5 Deambulación 10-15 min × 3/día
- **p9 [V11]** Elevaciones de talones (gemelos)
- **p10 [V11]** Elevación puntas del pie (tibial anterior)
- p3 Isométrico cuádriceps continuado
- **p11 [V11]** Elongación lumbar rodilla al pecho controlada
- **p12 [V11]** Activación core con báscula pélvica + transverso

#### 📅 FASE 3 — Subaguda tardía (Semana 4-8)
`p5, p6, p13, p14, p7, p15, p16`
- Caminata 20-30 min diaria
- p6 Puente de glúteos progresivo
- **p13 [V11]** Plancha modificada desde rodillas (anti-extensión)
- **p14 [V11]** Puente lateral modificado desde rodillas
- p7 Movilización neural suave
- **p15 [V11]** Gato-camello controlado post-op
- **p16 [V11]** Dead bug modificado post-op

#### 📅 FASE 4 — Reintegración funcional (>8 semanas)
`p8, p17, p18, p19, p20`
- p8 Estabilización funcional en bipedestación
- **p17 [V11]** Plancha completa desde pies
- **p18 [V11]** Bird Dog progresivo
- **p19 [V11]** Puente lateral completo
- **p20 [V11]** Sentadilla funcional con apoyo

**⚠️ Regla crítica:** cada fase requiere autorización médica del cirujano.

---

### 👵 MÓDULO +60 (23 ejercicios · calistenia + silla)

Prioridad: ejercicios funcionales seguros, con silla como apoyo/base, estilo calistenia adaptada.

**Rutinas:**
- **Express 10 min** = 3 ejercicios
- **Completa 20 min** = 6 ejercicios (con descanso e hidratación)

**Advertencias obligatorias +60:**
Dolor de pecho, disnea intensa, mareo, desmayo, confusión, palpitaciones, debilidad súbita, agotamiento extremo, pérdida de equilibrio.

**Los 15 originales:**
1. Sentarse y levantarse con apoyo
2. Sentarse y levantarse sin manos
3. Mini sentadilla con apoyo
4. Estocada asistida
5. Step-up en escalón bajo
6. Abducción de cadera con apoyo
7. Elevación bilateral de talones
8. Marcha con elevación de rodillas
9. Transferencia de peso lateral
10. Equilibrio unipodal asistido
11. Abdominal isométrico en silla
12. Elevación alternada de rodillas sentado
13. Retracción escapular y apertura torácica
14. Wall slide
15. Rotación torácica controlada

**Los 8 nuevos V11 (`s60_16` a `s60_23`):**
- **s60_16** — Sentadilla con silla (chair squat completo)
- **s60_17** — Estocada estacionaria con apoyo
- **s60_18** — Push-up de pared
- **s60_19** — Marcha estacionaria con apertura de brazos
- **s60_20** — Extensión de rodilla sentado
- **s60_21** — Elevación de rodillas sentado con banda
- **s60_22** — Puente de glúteos con pies en silla
- **s60_23** — Dead bug sentado (variante silla)

---

## 💰 Modelo freemium

**Regla obligatoria:**
En cada patología, los **primeros 2 ejercicios son gratis** (posición 1 y 2 del array `ex`), el resto son Premium.

Definido en `regions.json` mediante el campo `free_count: 2` en cada patología.

**Configuración por patología:**
```json
{
  "id": "lumbalgia",
  "title": "Lumbalgia mecánica",
  "ex": ["bp","l2","l4",...],
  "free_count": 2
}
```
- Posiciones 0, 1 → GRATIS
- Posiciones ≥ 2 → PREMIUM (paywall)

---

## 🏗️ Estructura técnica

### Archivos de datos
```
data/
├── exercises.json        # 77 ejercicios base (cervical + dorsal + lumbar + post-op)
├── plus60-exercises.json # 23 ejercicios módulo +60
├── regions.json          # 3 regiones + 14 patologías + lógica freemium
├── plus60-region.json    # configuración del módulo +60
└── plus60-routines.json  # rutinas Express 10min + Completa 20min
```

### Estructura de un ejercicio
```json
"id_ejercicio": {
  "name": "Nombre del ejercicio",
  "level": "Inicial | Intermedio | Avanzado",
  "reps": "descripción de repeticiones",
  "series": "descripción de series",
  "position": "posición inicial",
  "breathing": "instrucciones de respiración",
  "warning": "advertencias clínicas y banderas rojas",
  "steps": [
    "Paso 1 — setup",
    "Paso 2 — preparación",
    "Paso 3 — acción",
    "Paso 4 — sostén",
    "Paso 5 — retorno"
  ],
  "variants": "regresiones y progresiones",
  "muscles": "musculatura implicada"
}
```

### Estructura visual (media)
```
media/sequences/
├── g3/
│   ├── 01.webp  # Fase 1: setup neutro
│   ├── 02.webp  # Fase 2: armado brazos
│   ├── 03.webp  # Fase 3: apoyo activo
│   ├── 04.webp  # Fase 4: extensión máxima
│   └── 05.webp  # Fase 5: retorno
├── l3/
│   └── ...
└── [...]
```

Cada ejercicio en `data/v11-static-sequences.json` tiene un `status`:
- `pending` → fallback a láminas V9/RC9
- `ready` → usa las nuevas láminas V11

---

## 🎨 Diseño visual — estándar V11

### Avatar aprobado (referencia base)
- **Persona:** mujer mid-30s, físico atlético y tonificado funcional
- **Cabello:** castaño claro / light chestnut brown, cola baja
- **Ojos:** verdes
- **Piel:** fair-to-medium tono cálido
- **Ropa:** remera teal sleeveless, calzas gris carbón, zapatillas blancas low-profile

### Ambiente aprobado
- **Estilo:** gimnasio moderno (Kaia Health / Peloton / Barry's)
- **Paredes:** gris claro
- **Piso:** pulido gris mate (no parquet ni parquet residencial)
- **Luz:** ventana industrial a la izquierda, natural
- **Fondo desenfocado:** rack de pesas matte negro + banco negro + espejo
- **Prohibido:** plantas, camilla de fisio, decoración hogareña

### Cámara
- **Encuadre:** medium-close 3/4 lateral
- **Sujeto:** mirando a la izquierda del frame
- **Altura de cámara:** a nivel del pecho

### Motor de generación
- **Principal:** OpenArt Lite con **Nano Banana 2** (20 créditos/imagen 1K)
- **Alternativa premium:** Nano Banana Pro (40 créditos, para casos críticos)
- **Formato salida:** WebP para producción

---

## 📚 Referencias clínicas

### Fuentes de inspiración (no copiar contenido)
- **Fisioterapia a tu Alcance** (Marcos Sacristán) — organización por zona/patología, progresiones, enfoque activo
- **Kaia Health** — enfoque multimodal (movimiento + educación + relajación), sesiones cortas, feedback de movimiento
- **INTOS 2024** — protocolos activos desfiladero torácico
- **Mangiarelli Rehabilitation** — control cervicoescapular
- **Physiopedia** — referencia técnica multiprotocolo

### Reglas de referencia
- Tomar: tipos de ejercicios, organización, progresiones, filosofía
- NO copiar: textos verbatim, imágenes, diseño, videos propietarios

---

## 🚦 Estado de implementación V11

| Ítem | Estado |
|---|---|
| Estructura de datos (JSON) | ✅ Completo |
| Textos clínicos (100 ejercicios) | ✅ Completo |
| Voz guiada (TTS Web Speech API) | ✅ Automática desde JSON |
| Sacroileítis (nueva patología) | ✅ Agregada |
| Pubalgia (nueva patología) | ✅ Agregada |
| Algoritmo post-op por fases | ✅ Implementado |
| Láminas visuales V11 | ⏳ Pendiente generación (fallback V9/RC9 activo) |
| Actualización textos hardcoded landing (61→100) | ⏳ Pendiente |
| Integración Mercado Pago | ⏳ Pendiente |
| Google login | ⏳ Pendiente (requiere MFA en Google Cloud) |

---

## 🔄 Novedades V11 respecto de V9/RC9

### Nuevos ejercicios (28 base + 8 +60 = 36 nuevos)
- **Cervical:** c9, c10, c11 (3)
- **Lumbar:** l3, l5, l8, l9, l10, l11, l12, l13, l14 (9)
- **Dorsal:** g4 (1)
- **Post-op:** p9 → p20 (12)
- **Sacroileítis:** sac1, sac2, sac3 (3)
- **Pubalgia:** pub2, pub3, pub4 (3)
- **+60:** s60_16 → s60_23 (8)

### Nuevas patologías
- Sacroileítis (Lumbar)
- Pubalgia (Lumbar)

### Cambios arquitectónicos
- Post-cirugía convertido de módulo lineal a **algoritmo por fases temporales**
- Cada ejercicio soporta 1/3/4/5 fases (antes: forzado a 5)
- Sistema de fallback: `pending` (V9) → `ready` (V11) por ejercicio
- Corrección de errores clínicos confirmados (ej: pectoral en marco de puerta)

---

## 📞 Contacto y mantenimiento

- **Repo:** `tristanpassaglia2-jpg/spineflow-landing`
- **Rama de desarrollo:** `v9-clean-rebuild`
- **Producción:** `main` (no tocar sin autorización explícita)
- **Preview automático:** Vercel deploya de la rama `v9-clean-rebuild`

**Regla crítica:** Nunca subir a `main` sin validación completa en preview.
