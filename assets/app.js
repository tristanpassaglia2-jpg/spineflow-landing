
const modules = window.SPINEFLOW_MODULES || [];
const regionMap = window.SPINEFLOW_MAP || {};
function planClass(plan){ return `plan-${plan}`; }
function renderCards(items){
  const el=document.getElementById('cards'); if(!el) return;
  el.innerHTML = items.map(m=>`<article class="card"><div class="card-head"><div><div class="card-title">${m.title}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><span class="seg-tag">${m.segment}</span><span class="plan-tag ${planClass(m.plan)}">${m.plan}</span></div></div></div><p class="card-desc">${m.summary}</p><div class="card-goals">${m.goals.map(g=>`<span class="goal-pill">${g}</span>`).join('')}</div><div class="mini-note">${m.routines.length} subpáginas disponibles</div><div class="card-actions"><a class="btn" href="pages/${m.slug}.html">Abrir módulo</a></div></article>`).join('');
}
function filterCards(){
  const q=(document.getElementById('search')?.value||'').toLowerCase();
  const seg=document.getElementById('segmentFilter')?.value||'';
  const goal=document.getElementById('goalFilter')?.value||'';
  const plan=document.getElementById('planFilter')?.value||'';
  renderCards(modules.filter(m=>{
    const hay=`${m.title} ${m.summary} ${m.segment} ${m.tagline}`.toLowerCase();
    return (!q||hay.includes(q)) && (!seg||m.segment.toLowerCase().includes(seg.toLowerCase())) && (!goal||m.goals.includes(goal)) && (!plan||m.plan===plan);
  }));
}
function renderMapResults(region){
  const box=document.getElementById('map-results'); if(!box) return;
  const slugs=regionMap[region]||[];
  if(!slugs.length){ box.innerHTML='<div class="map-placeholder">No hay módulos asignados a esta zona.</div>'; return; }
  const items=modules.filter(m=>slugs.includes(m.slug));
  box.innerHTML=items.map(m=>`<a class="map-result-item" href="pages/${m.slug}.html"><h4>${m.title}</h4><p>${m.tagline}</p></a>`).join('');
}
function initMap(){ document.querySelectorAll('.zone').forEach(z=>z.addEventListener('click',()=>{ document.querySelectorAll('.zone').forEach(n=>n.classList.remove('active')); document.querySelectorAll(`.zone[data-region="${z.dataset.region}"]`).forEach(n=>n.classList.add('active')); renderMapResults(z.dataset.region); })); }
document.getElementById('search')?.addEventListener('input', filterCards);
document.getElementById('segmentFilter')?.addEventListener('change', filterCards);
document.getElementById('goalFilter')?.addEventListener('change', filterCards);
document.getElementById('planFilter')?.addEventListener('change', filterCards);
renderCards(modules); initMap();
