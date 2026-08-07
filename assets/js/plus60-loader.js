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
  if(E&&R&&T) return;
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
    const x = await nf(input, init); await loadPlus60();
    const base = await x.clone().json();
    return new Response(JSON.stringify({...base, ...E}), {status:x.status, headers:{'Content-Type':'application/json'}});
  }
  if(url.endsWith('data/regions.json')){
    const x = await nf(input, init); await loadPlus60();
    const base = await x.clone().json();
    return new Response(JSON.stringify([...base, R]), {status:x.status, headers:{'Content-Type':'application/json'}});
  }
  return nf(input, init);
};
const style = document.createElement('style');
style.textContent = `
.module-plus60{border:1px solid rgba(124,58,237,.28);background:linear-gradient(145deg,#fff,#f5f3ff)}
.plus60-banner{margin-bottom:22px;border-left:5px solid #dc2626;background:#fff7f7}
.routine-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.routine-card{padding:18px;border:1px solid #ddd6fe;border-radius:18px;background:#faf8ff}
.plus60-thumb-ready{background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;position:relative;overflow:hidden}
.plus60-thumb-ready::after{content:'+60 · ver lámina';position:absolute;left:8px;bottom:8px;background:rgba(7,21,26,.72);color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px}
.plus60-sheet-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;padding:8px 12px;border:1px solid #0f766e;border-radius:999px;background:#f0fdfa;color:#0f4c5c;font-weight:700;font-size:12px;cursor:pointer}
.plus60-sheet-btn:hover{background:#ccfbf1}
.plus60-modal{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:24px;z-index:9999}
.plus60-modal.open{display:flex}
.plus60-modal-card{background:#fff;max-width:min(1400px,96vw);max-height:92vh;border-radius:18px;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:16px}
.plus60-modal-header{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:12px}
.plus60-modal-title{font-size:18px;font-weight:800;color:#07151a}
.plus60-close{border:0;background:#eef2ff;color:#1e3a8a;border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer}
.plus60-modal img{display:block;max-width:100%;height:auto;border-radius:12px}
@media(max-width:760px){.routine-grid{grid-template-columns:1fr}.plus60-modal{padding:12px}.plus60-modal-card{padding:12px}}
`;
document.head.appendChild(style);
function routineCard(title, r){
  return `<article class="routine-card"><span class="pill">${r.exercise_count} ejercicios</span><h3>${title}</h3><p><strong>Entrada en calor:</strong> ${r.warmup_minutes} min</p><p><strong>Descanso:</strong> ${r.rest_seconds} s</p><p><strong>Hidratación:</strong> ${r.hydration}</p></article>`;
}
function ensureModal(){
  let modal = document.querySelector('.plus60-modal');
  if(modal) return modal;
  modal = document.createElement('div');
  modal.className = 'plus60-modal';
  modal.innerHTML = `<div class="plus60-modal-card"><div class="plus60-modal-header"><div class="plus60-modal-title">Lámina +60</div><button class="plus60-close" type="button">Cerrar</button></div><img alt="Lámina SpineFlow +60"></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => {
    if(e.target === modal || e.target.closest('.plus60-close')) modal.classList.remove('open');
  });
  document.addEventListener('keydown', e => { if(e.key==='Escape') modal.classList.remove('open'); });
  return modal;
}
function openSheet(id, title){
  const path = SHEETS[id]; if(!path) return;
  const modal = ensureModal();
  modal.querySelector('.plus60-modal-title').textContent = title || 'Lámina +60';
  const img = modal.querySelector('img');
  img.src = path; img.alt = title || 'Lámina +60';
  modal.classList.add('open');
}
function upgradeThumbs(){
  document.querySelectorAll('[data-exercise^="s60_"]').forEach(node => {
    const id = node.getAttribute('data-exercise');
    const row = node.closest('.exercise-row') || node.closest('[data-exercise]');
    const thumb = row?.querySelector('.exercise-thumb');
    const title = E?.[id]?.name || node.textContent?.trim() || 'Lámina +60';
    if(thumb && SHEETS[id] && !thumb.dataset.plus60Bound){
      thumb.dataset.plus60Bound = '1';
      thumb.classList.add('plus60-thumb-ready');
      thumb.style.backgroundImage = `url(${SHEETS[id]})`;
    }
    if(row && !row.querySelector('.plus60-sheet-btn') && SHEETS[id]){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plus60-sheet-btn';
      btn.textContent = 'Ver lámina';
      btn.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); openSheet(id, title); });
      row.appendChild(btn);
    }
  });
}
function scan(){
  document.querySelectorAll('[data-region="+60"]').forEach(n => n.closest('.module-card')?.classList.add('module-plus60'));
  upgradeThumbs();
  const on = document.querySelector('[data-region="+60"], [data-path^="plus60_"], [data-exercise^="s60_"]');
  if(!on) return;
  const c = document.querySelector('.content');
  if(c && !document.querySelector('.plus60-banner')){
    const q = document.createElement('section');
    q.className = 'card plus60-banner';
    q.innerHTML = '<h3>⚠ Detené la rutina y pedí ayuda</h3><p>Frená ante dolor u opresión en el pecho, falta de aire intensa o desproporcionada, mareo, sensación de desmayo, confusión, palpitaciones con malestar, debilidad repentina, pérdida de equilibrio o agotamiento extremo.</p><p>Sentate o recostate en un lugar seguro, no continúes la rutina, avisá a un familiar o persona cercana y solicitá asistencia médica de emergencia si los síntomas son intensos o no mejoran rápidamente.</p>';
    c.firstElementChild?.after(q);
  }
  if(c && !document.querySelector('.plus60-routines') && window.SPINEFLOW_PLUS60_ROUTINES){
    const q = document.createElement('section');
    q.className = 'plus60-routines';
    q.innerHTML = '<div class="section-title"><h2>Rutinas sugeridas</h2></div><div class="routine-grid">'+routineCard(T.express_10.title,T.express_10)+routineCard(T.complete_20.title,T.complete_20)+'</div><p class="muted">Tené agua disponible. Tomá pequeños sorbos según necesidad, salvo que tu médico te haya indicado restricción de líquidos.</p>';
    document.querySelector('.plus60-banner')?.after(q);
  }
}
new MutationObserver(scan).observe(document.documentElement, {subtree:true, childList:true});
window.addEventListener('DOMContentLoaded', async ()=>{ await loadPlus60(); scan(); });
})();
