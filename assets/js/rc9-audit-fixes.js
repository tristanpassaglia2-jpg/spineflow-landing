(()=>{
'use strict';

/*
  SpineFlow V9 — RC9 Audit Fixes
  Capa reversible de correcciones sobre RC8.1.
  No modifica Supabase.
*/

const previousFetch = window.fetch.bind(window);

const STEP_LABELS = ['Paso 1','Paso 2','Paso 3','Paso 4','Paso 5'];

function setText(el, value){
  if(el && el.textContent !== value) el.textContent = value;
}

/* Algunos sprites antiguos no tienen una correspondencia visual 1:1 con el paso textual.
   Mapeamos el paso clínico al panel visual que realmente representa esa acción. */
const VISUAL_PANEL_MAP = {
  k3: [0,0,3,3,4], // Dead Bug: extensión completa está en el panel 4 del sprite.
  k4: [0,0,1,2,4]  // Bird Dog: activación es sutil; extensión/sostén están en paneles 2-3.
};

function patchExerciseData(data){
  const x = data && typeof data === 'object' ? data : {};

  if(x.k4){
    x.k4.steps = [
      'En cuatro apoyos: manos debajo de hombros y rodillas debajo de caderas. Espalda en posición neutra.',
      'Activá suavemente el core sin contener la respiración y mantené la pelvis estable.',
      'Exhalá y extendé UN BRAZO hacia adelante y la PIERNA CONTRARIA hacia atrás. Ambos quedan aproximadamente a la altura del tronco, sin rotar la pelvis.',
      'Mantené 3–5 segundos respirando. La pelvis no rota ni se inclina.',
      'Volvé al inicio de forma controlada y alterná con el otro brazo y la pierna contraria.'
    ];
    x.k4.warning = 'Brazo y pierna deben ser OPUESTOS (movimiento contralateral). Si perdés la alineación de pelvis o columna, reducí el rango.';
  }

  if(x.c6){
    x.c6.steps = [
      'Sentate erguido/a. Con la mano del lado a estirar, sujetá el borde del asiento para mantener ese hombro descendido.',
      'Para trapecio superior, incliná suavemente la cabeza alejándola del hombro que permanece fijo.',
      'Mantené el cuello largo y aplicá solo una presión suave con la mano contraria; no tires de la cabeza.',
      'Para enfatizar elevador de la escápula, rotá la cabeza aproximadamente 45° ALEJÁNDOLA del lado a estirar y llevá el mentón suavemente hacia el pecho.',
      'Mantené 20–30 segundos sin dolor y repetí del otro lado.'
    ];
    x.c6.variants = 'Trapecio superior: inclinación contralateral con rotación mínima. Elevador de la escápula: rotación contralateral + flexión cervical suave.';
  }

  /* Corrige una técnica rotulada como "slider" que en RC8 cargaba ambos extremos
     del sistema neural simultáneamente (tensioner). */
  if(x.s2){
    x.s2.steps = [
      'Sentado/a al borde de una silla firme, espalda cómoda y manos apoyadas.',
      'POSICIÓN A: extendé lentamente la rodilla mientras llevás el cuello hacia una extensión cómoda (mirada ligeramente hacia arriba). Mantené el tobillo relajado.',
      'POSICIÓN B: flexioná la rodilla mientras llevás suavemente el mentón hacia el pecho.',
      'Alterná A y B de forma fluida y lenta, sin sostener el final del recorrido.',
      'Realizá 8–10 repeticiones por lado. El objetivo es DESLIZAR, no provocar un estiramiento intenso del nervio.'
    ];
    x.s2.warning = 'Debe sentirse como un movimiento suave, no como un estiramiento fuerte. Suspendé si aumenta el dolor irradiado, aparece latigazo eléctrico, hormigueo persistente o debilidad.';
    x.s2.variants = 'Más suave: menor extensión de rodilla y rango cervical. No agregues tensión de tobillo si los síntomas son irritables.';
  }

  if(x.p7){
    x.p7.steps = [
      'Sentado/a en una silla, espalda cómoda y apoyada.',
      'Extendé lentamente una pierna mientras llevás el cuello hacia una extensión cómoda (mirada ligeramente hacia arriba). Mantené el tobillo relajado.',
      'Luego flexioná la rodilla mientras llevás suavemente el mentón hacia el pecho.',
      'Alterná ambos movimientos de forma fluida, sin mantener tensión al final.',
      'Realizá 8–10 repeticiones por pierna solo dentro del rango autorizado por tu equipo tratante.'
    ];
    x.p7.warning = 'Movilización neural postoperatoria: realizar SOLO si fue autorizada por el cirujano o kinesiólogo. No debe provocar dolor irradiado, latigazo, hormigueo persistente ni debilidad.';
    x.p7.variants = 'Regresión: menor rango de rodilla y sin componente cervical. La progresión depende del procedimiento y de la evolución clínica.';
  }

  if(x.em){
    x.em.muscles = 'Extensores lumbares, multífidos, estabilizadores del tronco';
    x.em.warning = 'Usá extensión solo si es una dirección tolerada o indicada. Suspendé si los síntomas se desplazan más hacia la pierna, aumentan claramente o aparecen signos neurológicos.';
    x.em.variants = 'Progresión: extensión sobre manos si centraliza o reduce síntomas. Regresión: decúbito prono o apoyo en antebrazos. La respuesta clínica, no una supuesta “recolocación” del disco, guía la progresión.';
  }

  if(x.s3){
    x.s3.muscles = 'Extensores lumbares, multífidos, estabilizadores del tronco';
    x.s3.warning = 'Realizá el ejercicio solo en un rango tolerado. Si el dolor se irradia más distalmente o aparecen síntomas neurológicos, suspendé y consultá.';
  }

  if(x.p1){
    x.p1.warning = 'Ejercicio de fase temprana postoperatoria: iniciar solo con autorización del equipo tratante. Favorece el movimiento del tobillo y el retorno venoso, pero NO reemplaza la profilaxis de trombosis indicada por el médico.';
  }

  if(x.p4){
    x.p4.warning = 'Usá la técnica de log-roll durante el período que indique tu cirujano o equipo de rehabilitación. La duración depende del procedimiento realizado y de la evolución individual.';
  }

  if(x.p5 && Array.isArray(x.p5.steps) && x.p5.steps.length >= 5){
    x.p5.steps[3] = 'Caminá con pasos cortos y controlados, usando el dispositivo de asistencia indicado. Mantené postura cómoda y estable.';
    x.p5.steps[4] = 'Comenzá con caminatas breves y frecuentes según tolerancia y aumentá gradualmente siguiendo el protocolo de tu equipo tratante. No existe una progresión semanal única para todos los pacientes.';
  }

  if(x.p6){
    x.p6.warning = 'Ejercicio de fase subaguda: iniciar únicamente cuando el cirujano o kinesiólogo lo autorice. El momento de comienzo varía según el tipo de cirugía, la evolución y las restricciones específicas.';
  }

  if(x.p8){
    x.p8.variants = 'Progresiones de equilibrio (apoyo unipodal, transferencia de peso o superficies desafiantes) solo cuando exista buen control y, en el postoperatorio, según autorización profesional. Evitá ojos cerrados o superficies inestables sin supervisión.';
  }

  return x;
}

/* El loader +60 ya intercepta data/exercises.json. Este segundo wrapper recibe
   el objeto combinado (46 originales + 15 +60) y aplica la auditoría clínica. */
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  const response = await previousFetch(input, init);

  if(url && url.endsWith('data/exercises.json') && response.ok){
    try{
      const data = await response.clone().json();
      const patched = patchExerciseData(data);
      return new Response(JSON.stringify(patched), {
        status: response.status,
        statusText: response.statusText,
        headers: {'Content-Type':'application/json'}
      });
    }catch(_){
      return response;
    }
  }
  return response;
};

const style = document.createElement('style');
style.textContent = `
/* === RC9: secuencia visual ===
   Se elimina el sombreado gigante que oscurecía ~80% de la lámina y hacía
   que el recuadro activo pareciera incompleto. */
.phase-focus{
  top:0!important;
  bottom:0!important;
  width:20%!important;
  height:100%!important;
  border:4px solid #18a89f!important;
  background:rgba(24,168,159,.10)!important;
  box-shadow:0 0 0 2px rgba(255,255,255,.42), 0 0 22px rgba(24,168,159,.42)!important;
  border-radius:4px!important;
  pointer-events:none!important;
}
.phase-dot.active{
  background:#18a89f!important;
  color:#042328!important;
  box-shadow:0 0 0 2px rgba(24,168,159,.22), 0 7px 18px rgba(24,168,159,.18)!important;
}

/* +60: el póster completo ya trae sus 5 fases internas; se destaca el botón Paso 1–5. */
.plus60-phase-frame .phase-focus,
.plus60-phase-frame .phase-caption{
  display:none!important;
}

/* +60: el QR generado por IA se elimina del bitmap mostrado usando Canvas.
   El PNG fuente no se altera en GitHub; el usuario nunca ve el QR dentro del ejercicio. */

/* Bird Dog: hasta reemplazar el asset fotográfico, la instrucción contralateral
   se marca de forma imposible de pasar por alto. */
.sf-birddog-note{
  margin:0 0 10px;
  padding:10px 12px;
  border-radius:12px;
  background:#fff4d8;
  color:#5e4300;
  border:1px solid #efd28a;
  font-size:12px;
  font-weight:800;
}
.sf-birddog-note strong{color:#7a2600}

/* 4 módulos: distribución equilibrada en desktop. */
.sf-module-grid{
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
}

/* Accesibilidad / confort */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}
}
@media(max-width:1100px){
  .sf-module-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:780px){
  .sf-module-grid{grid-template-columns:1fr!important}
}
`;
document.head.appendChild(style);

function currentExerciseId(){
  const strip = document.querySelector('#phaseStrip');
  if(!strip) return null;
  if(strip.dataset.exerciseId) return strip.dataset.exerciseId;
  const src = strip.getAttribute('src') || '';
  const m1 = src.match(/media\/exercises\/([a-z0-9_-]+)\.webp/i);
  if(m1) return m1[1];
  const m2 = src.match(/(s60_\d{2})/i);
  if(m2) return m2[1];
  return null;
}

function currentStepIndex(){
  const dots = [...document.querySelectorAll('.phase-dot')];
  const active = dots.findIndex(b => b.classList.contains('active'));
  return active >= 0 ? active : 0;
}

function syncPhaseUI(){
  const dots = [...document.querySelectorAll('.phase-dot')];
  if(!dots.length) return;

  const activeIndex = currentStepIndex();
  dots.forEach((b,i)=>{
    setText(b, STEP_LABELS[i]);
    b.setAttribute('aria-label', `${STEP_LABELS[i]} de 5`);
    b.setAttribute('aria-pressed', i === activeIndex ? 'true' : 'false');
  });

  const stepLabel = document.querySelector('#stepLabel');
  setText(stepLabel, `Indicación · paso ${activeIndex+1}`);

  const id = currentExerciseId();
  const isPlus60 = id && /^s60_/.test(id);

  if(!isPlus60){
    const map = VISUAL_PANEL_MAP[id] || [0,1,2,3,4];
    const visualIndex = map[activeIndex] ?? activeIndex;
    const focus = document.querySelector('#phaseFocus');
    const caption = document.querySelector('#phaseCaption');
    if(focus) focus.style.left = `${visualIndex*20}%`;
    if(caption){
      setText(caption, STEP_LABELS[activeIndex]);
      caption.style.left = `calc(${visualIndex*20}% + 9px)`;
    }
  }
}

function cleanPlus60Qr(){
  const strip = document.querySelector('#phaseStrip');
  const id = currentExerciseId();
  if(!strip || !id || !/^s60_/.test(id) || strip.dataset.qrCleaned === '1') return;

  strip.dataset.exerciseId = id;

  const run = ()=>{
    if(strip.dataset.qrCleaned === '1' || !strip.naturalWidth || !strip.naturalHeight) return;
    try{
      const w = strip.naturalWidth, h = strip.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(strip,0,0,w,h);

      /* La plantilla +60 ubica QR + leyenda en el bloque inferior derecho.
         Se limpia el bloque y se reemplaza por información real. */
      const x = Math.round(w * 0.825);
      const y = Math.round(h * 0.748);
      const cw = Math.round(w * 0.165);
      const ch = Math.round(h * 0.185);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x,y,cw,ch);
      ctx.strokeStyle = '#dfe8e6';
      ctx.lineWidth = Math.max(2, Math.round(w*0.0012));
      ctx.strokeRect(x+1,y+1,cw-2,ch-2);

      ctx.fillStyle = '#087f79';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.max(18,Math.round(h*0.018))}px Arial, sans-serif`;
      ctx.fillText('SPINEFLOW +60', x+cw/2, y+ch*0.43);

      ctx.fillStyle = '#40565c';
      ctx.font = `500 ${Math.max(13,Math.round(h*0.012))}px Arial, sans-serif`;
      ctx.fillText('Demostración integrada', x+cw/2, y+ch*0.59);
      ctx.fillText('en la app', x+cw/2, y+ch*0.70);

      strip.dataset.qrCleaned = '1';
      strip.src = canvas.toDataURL('image/png');
    }catch(_){
      /* Si Canvas fallara, el resto de la app sigue funcionando. */
    }
  };

  if(strip.complete) run();
  else strip.addEventListener('load',run,{once:true});
}

function birdDogClinicalNote(){
  const id = currentExerciseId();
  const player = document.querySelector('.player');
  if(id !== 'k4' || !player) return;

  if(!player.querySelector('.sf-birddog-note')){
    const note = document.createElement('div');
    note.className = 'sf-birddog-note';
    note.innerHTML = '<strong>CLAVE TÉCNICA:</strong> extendé siempre un brazo y la pierna OPUESTA. Movimiento contralateral.';
    const frame = player.querySelector('.phase-frame');
    if(frame) frame.before(note);
  }
}

function updateLandingAndModules(){
  const heroP = document.querySelector('.hero-copy > p:not(.eyebrow)');
  if(heroP && heroP.textContent.includes('cervical, dorsal o lumbar')){
    heroP.textContent = 'Un programa clínico claro para acompañar la recuperación cervical, dorsal y lumbar, junto con un módulo +60 de fuerza funcional, equilibrio, core y postura.';
  }

  const badgeText = document.querySelector('.coach-badge div > span');
  if(badgeText && /46 ejercicios/.test(badgeText.textContent)){
    setText(badgeText, 'Tu guía en 61 ejercicios');
  }

  const proof = [...document.querySelectorAll('.proof-strip > div')];
  if(proof.length === 4){
    const values = [
      ['61','ejercicios específicos'],
      ['4','módulos SpineFlow'],
      ['16','programas y bloques'],
      ['5','pasos visuales']
    ];
    proof.forEach((box,i)=>{
      const strong = box.querySelector('strong');
      const span = box.querySelector('span');
      setText(strong, values[i][0]);
      setText(span, values[i][1]);
    });
  }

  document.querySelectorAll('.section-title h2').forEach(h=>{
    if(h.textContent.trim() === 'Módulos de columna') setText(h, 'Módulos SpineFlow');
  });

  const modulePage = document.querySelector('.page-head h1');
  if(modulePage && modulePage.textContent.trim() === 'Elegí tu módulo'){
    const p = modulePage.parentElement?.querySelector('p:not(.eyebrow)');
    if(p && p.textContent.includes('Cervical, dorsal y lumbar')){
      setText(p, 'Cervical, dorsal y lumbar conservan sus programas clínicos; +60 agrega fuerza funcional, equilibrio, core y postura.');
    }
  }

  document.querySelectorAll('.grid.grid-3').forEach(grid=>{
    if(grid.querySelectorAll('.module-card').length >= 4) grid.classList.add('sf-module-grid');
  });

  document.querySelectorAll('.module-card').forEach(card=>{
    const title = card.querySelector('h3')?.textContent || '';
    const p = card.querySelector('p');
    if(title.includes('+60') && p){
      const updated = p.textContent.replace(/·\s*4 patologías/i,'· 4 bloques funcionales');
      setText(p, updated);
    }
  });
}

/* SpeechSynthesis del core usa nombres genéricos de fase.
   Antes de hablar, los sustituimos por "Paso N" para que la voz coincida con la interfaz. */
if(window.speechSynthesis && typeof window.speechSynthesis.speak === 'function'){
  const nativeSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = utterance => {
    try{
      const idx = currentStepIndex();
      if(utterance && typeof utterance.text === 'string'){
        utterance.text = utterance.text.replace(
          /^(Posición inicial|Movimiento|Pausa|Retorno|Repetición)\.\s*/i,
          `${STEP_LABELS[idx]}. `
        );
      }
    }catch(_){}
    return nativeSpeak(utterance);
  };
}

let scheduled = false;
function scan(){
  if(scheduled) return;
  scheduled = true;
  requestAnimationFrame(()=>{
    scheduled = false;
    syncPhaseUI();
    cleanPlus60Qr();
    birdDogClinicalNote();
    updateLandingAndModules();
  });
}

new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
window.addEventListener('DOMContentLoaded',scan);
scan();

})();
