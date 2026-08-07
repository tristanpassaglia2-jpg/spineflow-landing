(()=>{
'use strict';

const nf = window.fetch.bind(window);
let E, R, T;

const SHEETS = {
  s60_01:'assets/img/plus60/s60_01_sentarse_con_apoyo.png',
  s60_02:'assets/img/plus60/s60_02_sentarse_sin_manos.png',
  s60_03:'assets/img/plus60/s60_03_mini_sentadilla_con_apoyo.png',
  s60_04:'assets/img/plus60/s60_04_estocada_asistida.png',
  s60_05:'assets/img/plus60/s60_05_step_up_escalon_bajo.png',
  s60_06:'assets/img/plus60/s60_06_abduccion_cadera_con_apoyo.png',
  s60_07:'assets/img/plus60/s60_07_elevacion_bilateral_talones.png',
  s60_08:'assets/img/plus60/s60_08_marcha_elevacion_rodillas.png',
  s60_09:'assets/img/plus60/s60_09_transferencia_peso_lateral.png',
  s60_10:'assets/img/plus60/s60_10_equilibrio_unipodal_asistido.png',
  s60_11:'assets/img/plus60/s60_11_abdominal_isometrico_en_silla.png',
  s60_12:'assets/img/plus60/s60_12_elevacion_alternada_rodillas_sentado.png',
  s60_13:'assets/img/plus60/s60_13_retraccion_escapular_apertura_toracica.png',
  s60_14:'assets/img/plus60/s60_14_wall_slide.png',
  s60_15:'assets/img/plus60/s60_15_rotacion_toracica_controlada.png'
};

async function loadPlus60(){
  if(E && R && T) return;
  const [ex, reg, rut] = await Promise.all([
    nf('data/plus60-exercises.json'),
    nf('data/plus60-region.json'),
    nf('data/plus60-routines.json')
  ]);
  E = await ex.json();
  R = await reg.json();
  T = await rut.json();
  window.SPINEFLOW_PLUS60_ROUTINES = T;
}

window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if(url.endsWith('data/exercises.json')){
    const x = await nf(input, init);
    await loadPlus60();
    const base = await x.clone().json();
    return new Response(JSON.stringify({...base, ...E}), {
      status:x.status,
      headers:{'Content-Type':'application/json'}
    });
  }
  if(url.endsWith('data/regions.json')){
    const x = await nf(input, init);
    await loadPlus60();
    const base = await x.clone().json();
    return new Response(JSON.stringify([...base, R]), {
      status:x.status,
      headers:{'Content-Type':'application/json'}
    });
  }
  return nf(input, init);
};

const style = document.createElement('style');
style.textContent = `
.module-plus60{
  border:1px solid rgba(124,58,237,.28);
  background:linear-gradient(145deg,#fff,#f5f3ff)
}
.plus60-banner{
  margin-bottom:22px;
  border-left:5px solid #dc2626;
  background:#fff7f7
}
.routine-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:16px
}
.routine-card{
  padding:18px;
  border:1px solid #ddd6fe;
  border-radius:18px;
  background:#faf8ff
}
.plus60-thumb-ready{
  background-size:cover!important;
  background-position:center!important;
  background-repeat:no-repeat!important
}

/* RC8.1: la lámina completa vive DENTRO del ejercicio */
.phase-frame.plus60-phase-frame{
  width:100%!important;
  max-width:100%!important;
  aspect-ratio:3/2!important;
  background:#fff!important;
  border-radius:18px;
  overflow:hidden
}
.phase-strip.plus60-sheet-in-player{
  width:100%!important;
  height:100%!important;
  max-width:100%!important;
  object-fit:contain!important;
  object-position:center!important;
  transition:none!important;
  transform:none!important;
  background:#fff!important
}
.plus60-phase-frame .phase-focus,
.plus60-phase-frame .phase-caption{
  display:none!important
}
.plus60-inside-label{
  display:flex;
  align-items:center;
  gap:8px;
  margin:0 0 12px;
  color:#c9e8e4;
  font-size:12px;
  font-weight:800
}
.plus60-inside-label::before{
  content:"✦";
  color:#59d3bd
}

/* Elimina el botón externo "Ver lámina": se entra por Comenzar */
.plus60-sheet-btn{
  display:none!important
}

@media(max-width:760px){
  .routine-grid{grid-template-columns:1fr}
  .phase-frame.plus60-phase-frame{aspect-ratio:3/2!important}
}
`;
document.head.appendChild(style);

function routineCard(title, r){
  return `<article class="routine-card">
    <span class="pill">${r.exercise_count} ejercicios</span>
    <h3>${title}</h3>
    <p><strong>Entrada en calor:</strong> ${r.warmup_minutes} min</p>
    <p><strong>Descanso:</strong> ${r.rest_seconds} s</p>
    <p><strong>Hidratación:</strong> ${r.hydration}</p>
  </article>`;
}

function plus60IdFromExerciseView(){
  const strip = document.querySelector('#phaseStrip');
  if(!strip) return null;
  const src = strip.getAttribute('src') || '';
  const match = src.match(/(s60_\d{2})/);
  return match ? match[1] : null;
}

function upgradeThumbs(){
  document.querySelectorAll('[data-exercise^="s60_"]').forEach(node => {
    const id = node.getAttribute('data-exercise');
    const row = node.closest('.exercise-row') || node.closest('[data-exercise]');
    const thumb = row?.querySelector('.exercise-thumb');

    if(thumb && SHEETS[id]){
      thumb.classList.add('plus60-thumb-ready');
      thumb.style.backgroundImage = `url(${SHEETS[id]})`;
    }

    /* RC8.1: retirar cualquier botón viejo "Ver lámina" */
    row?.querySelectorAll('.plus60-sheet-btn').forEach(btn => btn.remove());
  });
}

function upgradeExerciseView(){
  const id = plus60IdFromExerciseView();
  if(!id || !SHEETS[id]) return false;

  const strip = document.querySelector('#phaseStrip');
  const frame = strip?.closest('.phase-frame');
  const player = strip?.closest('.player');

  if(!strip || !frame) return false;

  /* Sustituye la ruta inexistente media/exercises/s60_XX.webp
     por la lámina real generada en assets/img/plus60/ */
  if(strip.getAttribute('src') !== SHEETS[id]){
    strip.setAttribute('src', SHEETS[id]);
  }
  strip.classList.add('plus60-sheet-in-player');
  frame.classList.add('plus60-phase-frame');

  if(player && !player.querySelector('.plus60-inside-label')){
    const label = document.createElement('div');
    label.className = 'plus60-inside-label';
    label.textContent = 'Lámina clínica completa · 5 fases';
    frame.before(label);
  }

  return true;
}

function scan(){
  document.querySelectorAll('[data-region="+60"]').forEach(n => {
    n.closest('.module-card')?.classList.add('module-plus60');
  });

  upgradeThumbs();
  const isPlus60Exercise = upgradeExerciseView();

  const plus60Context =
    isPlus60Exercise ||
    !!document.querySelector('[data-region="+60"], [data-path^="plus60_"], [data-exercise^="s60_"]');

  if(!plus60Context) return;

  const c = document.querySelector('.content');
  if(!c) return;

  if(!document.querySelector('.plus60-banner')){
    const q = document.createElement('section');
    q.className = 'card plus60-banner';
    q.innerHTML =
      '<h3>⚠ Detené la rutina y pedí ayuda</h3>' +
      '<p>Frená ante dolor u opresión en el pecho, falta de aire intensa o desproporcionada, mareo, sensación de desmayo, confusión, palpitaciones con malestar, debilidad repentina, pérdida de equilibrio o agotamiento extremo.</p>' +
      '<p>Sentate o recostate en un lugar seguro, no continúes la rutina, avisá a un familiar o persona cercana y solicitá asistencia médica de emergencia si los síntomas son intensos o no mejoran rápidamente.</p>';
    c.firstElementChild?.after(q);
  }

  /* Las rutinas se muestran en las pantallas del módulo, no dentro del ejercicio */
  if(!isPlus60Exercise &&
     !document.querySelector('.plus60-routines') &&
     window.SPINEFLOW_PLUS60_ROUTINES &&
     document.querySelector('[data-path^="plus60_"], [data-exercise^="s60_"]')){
    const q = document.createElement('section');
    q.className = 'plus60-routines';
    q.innerHTML =
      '<div class="section-title"><h2>Rutinas sugeridas</h2></div>' +
      '<div class="routine-grid">' +
      routineCard(T.express_10.title,T.express_10) +
      routineCard(T.complete_20.title,T.complete_20) +
      '</div>' +
      '<p class="muted">Tené agua disponible. Tomá pequeños sorbos según necesidad, salvo que tu médico te haya indicado restricción de líquidos.</p>';
    document.querySelector('.plus60-banner')?.after(q);
  }
}

new MutationObserver(scan).observe(document.documentElement, {
  subtree:true,
  childList:true
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadPlus60();
  scan();
});
})();
