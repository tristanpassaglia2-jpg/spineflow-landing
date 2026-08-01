(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const app = $('#app');
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(`sf9_${key}`); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { localStorage.setItem(`sf9_${key}`, JSON.stringify(value)); }
  };
  const state = {
    exercises: {}, regions: [], view: store.get('session', false) ? 'dashboard' : 'landing',
    currentRegion: null, currentPath: null, currentExercise: null, phase: 0,
    premium: store.get('premium', false), dark: store.get('dark', false),
    favorites: store.get('favorites', []), history: store.get('history', []),
    scores: store.get('scores', { eva: 3, odi: 18, ndi: 14 }), player: null, seconds: 30
  };
  const phases = ['Posición inicial', 'Movimiento', 'Pausa', 'Retorno', 'Repetición'];
  const icons = { dashboard:'⌂', modules:'◫', progress:'↗', calendar:'▦', education:'◇', favorites:'♡' };
  const labels = { dashboard:'Inicio', modules:'Mi programa', progress:'Progreso clínico', calendar:'Calendario', education:'Biblioteca', favorites:'Favoritos' };

  async function init() {
    document.body.classList.toggle('dark', state.dark);
    try {
      const [e, r] = await Promise.all([fetch('data/exercises.json'), fetch('data/regions.json')]);
      if (!e.ok || !r.ok) throw new Error('No se pudieron cargar los datos clínicos');
      state.exercises = await e.json(); state.regions = await r.json();
      render();
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
    } catch (error) {
      app.innerHTML = `<div class="boot"><span class="boot-mark">!</span><h2>No pudimos iniciar SpineFlow</h2><p>${error.message}. Usá un servidor local o Vercel, no abras el HTML con doble clic.</p></div>`;
    }
  }

  function go(view, params = {}) {
    clearPlayer(); Object.assign(state, params); state.view = view; window.scrollTo({ top: 0, behavior: 'smooth' }); render();
  }
  function render() {
    if (state.view === 'landing') return renderLanding();
    if (state.view === 'login') return renderLogin();
    app.innerHTML = shell(page()); bindShell(); bindPage();
  }
  function renderLanding() {
    app.innerHTML = `<div class="landing">
      <nav class="landing-nav"><div class="brand"><span class="brand-mark">SF</span>SpineFlow</div><div class="landing-actions"><button class="btn btn-light" data-action="login">Ingresar</button><button class="btn btn-primary" data-action="enter">Comenzar</button></div></nav>
      <main class="hero"><div class="hero-copy"><p class="eyebrow">Rehabilitación de columna · Guiada y progresiva</p><h1>Volvé a moverte con <span>confianza.</span></h1><p>Un programa clínico claro para acompañar tu recuperación cervical, dorsal o lumbar. Ejercicios específicos, seguimiento y una guía humana en cada paso.</p><div class="hero-actions"><button class="btn btn-primary" data-action="enter">Explorar mi programa →</button><button class="btn btn-light" data-action="login">Ya tengo una cuenta</button></div><div class="trust-row"><span>Diseño clínico</span><span>Progreso medible</span><span>En casa o consultorio</span></div></div>
      <div class="hero-visual"><img class="hero-photo" src="media/coach/mi-profe.webp" alt="Mi Profe, instructora de SpineFlow"><div class="coach-badge"><span class="coach-dot"></span><div><strong>Mi Profe</strong><span>Tu guía en los 46 ejercicios</span></div></div></div></main>
      <section class="proof-strip"><div><strong>46</strong><span>ejercicios específicos</span></div><div><strong>3</strong><span>módulos de columna</span></div><div><strong>12</strong><span>programas por patología</span></div><div><strong>5</strong><span>fases visuales por ejercicio</span></div></section>
    </div>`;
    app.addEventListener('click', landingClick, { once: true });
  }
  function landingClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'login') go('login');
    if (action === 'enter') { store.set('session', true); go('dashboard'); }
    else if (state.view === 'landing') app.addEventListener('click', landingClick, { once: true });
  }
  function renderLogin() {
    app.innerHTML = `<div class="login-wrap"><div class="login-visual"><h2>Tu recuperación merece claridad, constancia y acompañamiento.</h2></div><div class="login-form"><form class="login-box" id="loginForm"><button type="button" class="btn btn-ghost" data-back>← Volver</button><div class="brand"><span class="brand-mark">SF</span>SpineFlow</div><h1>Bienvenido/a</h1><p class="muted">Ingresá para continuar con tu programa.</p><div class="field"><label>Correo electrónico</label><input type="email" required placeholder="nombre@correo.com"></div><div class="field"><label>Contraseña</label><input type="password" required minlength="4" placeholder="••••••••"></div><button class="btn btn-primary btn-wide">Ingresar</button><p class="safe-note">Modo de demostración seguro: este paquete no contiene claves ni modifica usuarios de Supabase. La conexión real se habilita al configurar las variables del proyecto.</p></form></div></div>`;
    $('[data-back]').onclick = () => go('landing');
    $('#loginForm').onsubmit = e => { e.preventDefault(); store.set('session', true); go('dashboard'); toast('Sesión de demostración iniciada'); };
  }

  function shell(content) {
    const nav = Object.keys(labels).map(v => `<button class="nav-item ${state.view===v?'active':''}" data-view="${v}"><span class="nav-icon">${icons[v]}</span>${labels[v]}</button>`).join('');
    return `<div class="shell"><aside class="sidebar" id="sidebar"><div class="brand"><span class="brand-mark">SF</span>SpineFlow</div><nav class="nav-list">${nav}</nav><div class="side-plan"><small>Plan actual</small><strong>${state.premium?'Premium activo':'Plan gratuito'}</strong><button class="btn ${state.premium?'btn-light':'btn-gold'} btn-wide" data-premium>${state.premium?'Gestionar plan':'Ver Premium'}</button></div></aside><main class="main"><header class="topbar"><button class="btn btn-light mobile-menu" data-menu>☰</button><div><strong>${labels[state.view] || 'SpineFlow'}</strong></div><div class="top-actions"><button class="btn btn-light" data-dark title="Cambiar tema">${state.dark?'☀':'☾'}</button><div class="profile-dot">TP</div></div></header><div class="content">${content}</div></main></div>`;
  }
  function bindShell() {
    document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => go(b.dataset.view));
    $('[data-menu]')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('[data-dark]')?.addEventListener('click', () => { state.dark=!state.dark; store.set('dark',state.dark); document.body.classList.toggle('dark',state.dark); render(); });
    $('[data-premium]')?.addEventListener('click', premiumModal);
  }
  function page() {
    switch (state.view) {
      case 'dashboard': return dashboard(); case 'modules': return modules(); case 'pathology': return pathology();
      case 'exercise': return exercise(); case 'progress': return progress(); case 'calendar': return calendarPage();
      case 'education': return education(); case 'favorites': return favorites(); default: return dashboard();
    }
  }

  function dashboard() {
    const completed = new Set(state.history.map(h => h.id)).size;
    const adherence = Math.min(100, Math.round((state.history.filter(h => Date.now()-h.at<7*864e5).length/5)*100));
    return `<div class="page-head"><div><p class="eyebrow">Panel del paciente</p><h1>Hola, Tristán</h1><p>Tu plan está listo. Movete con control y registrá cómo te sentís.</p></div><button class="btn btn-primary" data-open-first>Continuar programa →</button></div>
      <div class="grid grid-4"><div class="card metric"><div class="metric-top"><span>Adherencia semanal</span><span>◎</span></div><strong>${adherence}%</strong><span class="trend">Objetivo: 80%</span></div><div class="card metric"><div class="metric-top"><span>Ejercicios realizados</span><span>✓</span></div><strong>${state.history.length}</strong><span class="trend">${completed} diferentes</span></div><div class="card metric"><div class="metric-top"><span>Dolor EVA</span><span>↘</span></div><strong>${state.scores.eva}/10</strong><span class="trend">Registro actual</span></div><div class="card metric"><div class="metric-top"><span>Favoritos</span><span>♡</span></div><strong>${state.favorites.length}</strong><span class="trend">Acceso rápido</span></div></div>
      <section class="card dashboard-hero"><div class="dashboard-copy"><span class="pill">Sesión recomendada</span><h2>Una secuencia clara, acompañada por Mi Profe.</h2><p>Cada ejercicio tiene cinco fases fotográficas propias, indicaciones clínicas, respiración, advertencias y control de tiempo.</p><button class="btn btn-gold" data-open-first>Empezar sesión</button></div><div class="dashboard-photo" role="img" aria-label="Mi Profe, instructora de SpineFlow"></div></section>
      <div class="section-title"><h2>Módulos de columna</h2><button class="btn btn-ghost" data-view="modules">Ver todos →</button></div>${moduleGrid()}`;
  }
  function moduleGrid() {
    return `<div class="grid grid-3">${state.regions.map((r,i)=>`<article class="card module-card" style="--module-light:${r.light}"><span class="module-number">0${i+1}</span><div class="module-orb">${r.icon}</div><h3>Módulo ${r.label}</h3><p>${r.subtitle} · ${r.pathologies.length} patologías</p><button class="btn btn-light" data-region="${r.id}">Explorar módulo</button></article>`).join('')}</div>`;
  }
  function modules() {
    return `<div class="page-head"><div><p class="eyebrow">Arquitectura clínica</p><h1>Elegí tu módulo</h1><p>Cervical, dorsal y lumbar conservan sus programas y progresiones específicas.</p></div></div>${moduleGrid()}`;
  }
  function pathology() {
    const region = regionById(state.currentRegion) || state.regions[0];
    if (!state.currentPath) return `<button class="btn btn-dark back-button" data-view="modules">← Volver a módulos</button><div class="page-head"><div><p class="eyebrow">Módulo ${region.label}</p><h1>Seleccioná tu programa</h1><p>${region.subtitle}</p></div></div><div class="grid grid-2">${region.pathologies.map(p=>`<article class="card path-card"><span class="pill">${p.ex.length} ejercicios</span><h3>${p.title}</h3><p>${p.desc}</p><div class="path-meta"><span class="free-badge">2 gratuitos · ${p.ex.length-2} Premium</span><button class="btn btn-primary" data-path="${p.id}">Abrir</button></div></article>`).join('')}</div>`;
    const path = pathById(state.currentPath); if (!path) return modules();
    return `<button class="btn btn-dark back-button" data-back-path>← Volver a patologías</button><div class="page-head"><div><p class="eyebrow">Módulo ${region.label}</p><h1>${path.title}</h1><p>${path.desc}. Los dos primeros ejercicios son de acceso gratuito.</p></div></div><div class="exercise-list">${path.ex.map((id,i)=>exerciseRow(id,i,path)).join('')}</div>`;
  }
  function exerciseRow(id,index,path) {
    const ex=state.exercises[id], locked=index>=path.free_count&&!state.premium;
    return `<article class="exercise-row"><div class="exercise-thumb" style="background-image:url('media/exercises/${id}.webp')"></div><div><div class="exercise-tags"><span class="pill">${ex.level}</span>${index<path.free_count?'<span class="pill free">Gratis</span>':'<span class="pill pill-premium">Premium</span>'}</div><h3>${ex.name}</h3><p>${ex.position} · ${ex.reps}</p></div><div class="exercise-status"><span class="lock ${locked?'':'free'}">${locked?'🔒':'✓'}</span><button class="btn ${locked?'btn-light':'btn-primary'}" data-exercise="${id}" data-locked="${locked}">${locked?'Ver Premium':'Comenzar'}</button></div></article>`;
  }
  function exercise() {
    const ex=state.exercises[state.currentExercise]; if(!ex) return modules();
    const fav=state.favorites.includes(state.currentExercise); const step=ex.steps[state.phase]||ex.steps[ex.steps.length-1];
    return `<button class="btn btn-dark back-button" data-exercise-back>← Volver al programa</button><div class="exercise-layout"><section class="card exercise-main"><div class="exercise-title-row"><div><p class="eyebrow">Ejercicio guiado por Mi Profe</p><h1>${ex.name}</h1></div><button class="btn btn-light" data-favorite>${fav?'♥ Guardado':'♡ Favorito'}</button></div><div class="exercise-tags"><span class="pill">${ex.level}</span><span class="pill">${ex.series}</span><span class="pill">${ex.reps}</span></div>
      <div class="player"><div class="player-head"><div class="coach-mini"><img src="media/coach/mi-profe.webp" alt="Mi Profe"><div><strong>Mi Profe</strong><span>Guía de movimiento</span></div></div><div class="timer" id="timer">00:${String(state.seconds).padStart(2,'0')}</div></div><div class="phase-frame"><img id="phaseStrip" class="phase-strip" src="media/exercises/${state.currentExercise}.webp" alt="Lámina fotográfica de cinco fases de ${ex.name}"><span class="phase-focus" id="phaseFocus" style="left:${state.phase*20}%"></span><span class="phase-caption" id="phaseCaption" style="left:calc(${state.phase*20}% + 9px)">${phases[state.phase]}</span></div><div class="phase-dots">${phases.map((p,i)=>`<button class="phase-dot ${i===state.phase?'active':''}" data-phase="${i}">${p}</button>`).join('')}</div><div class="player-controls"><button class="btn btn-light" data-play>▶ Iniciar</button><button class="btn btn-light" data-voice>◉ Voz guiada</button><button class="btn btn-primary" data-complete>✓ Completar</button></div></div><div class="instruction"><small id="stepLabel">Indicación · fase ${state.phase+1}</small><p id="stepText">${step}</p></div></section>
      <aside class="card clinical-panel"><div class="muscle-map"><p class="eyebrow">Lámina clínica</p><h3>Músculos y estructuras implicadas</h3>${muscleChips(ex.muscles)}</div><div class="info-box"><h3>◎ Objetivo terapéutico</h3><p>Mejorar el control del movimiento y la tolerancia funcional respetando el rango indicado.</p></div><div class="info-box"><h3>↗ Consejos del fisioterapeuta</h3><p>${ex.variants}</p></div><div class="info-box"><h3>≋ Respiración</h3><p>${ex.breathing}</p></div><div class="info-box warn"><h3>△ Advertencia clínica</h3><p>${ex.warning}</p></div><div class="info-box"><h3>Pasos completos</h3><div class="steps-list">${ex.steps.map(s=>`<div class="step-item">${s}</div>`).join('')}</div></div></aside></div>`;
  }
  function muscleChips(text) { return text.split(/,|—|\(|\)/).map(x=>x.trim()).filter(Boolean).slice(0,6).map(x=>`<span class="muscle-chip">${x}</span>`).join(''); }

  function progress() {
    const adherence=Math.min(100,Math.round((state.history.filter(h=>Date.now()-h.at<7*864e5).length/5)*100));
    return `<div class="page-head"><div><p class="eyebrow">Resultados reportados por el paciente</p><h1>Progreso clínico</h1><p>Registrá tus valores y compartilos con tu profesional tratante.</p></div></div><div class="grid grid-3"><div class="card score-card"><h3>Dolor EVA</h3><p class="muted">0 sin dolor · 10 máximo</p><div class="range-row"><input type="range" min="0" max="10" value="${state.scores.eva}" data-score="eva"><span class="range-value">${state.scores.eva}</span></div></div><div class="card score-card"><h3>ODI</h3><p class="muted">Discapacidad lumbar</p><div class="range-row"><input type="range" min="0" max="100" value="${state.scores.odi}" data-score="odi"><span class="range-value">${state.scores.odi}%</span></div></div><div class="card score-card"><h3>NDI</h3><p class="muted">Discapacidad cervical</p><div class="range-row"><input type="range" min="0" max="100" value="${state.scores.ndi}" data-score="ndi"><span class="range-value">${state.scores.ndi}%</span></div></div></div><div class="section-title"><h2>Resumen de adherencia</h2></div><div class="grid grid-2"><div class="card metric"><div class="metric-top"><span>Últimos 7 días</span></div><strong>${adherence}%</strong><div style="height:10px;background:#e6efed;border-radius:10px;overflow:hidden"><div style="height:100%;width:${adherence}%;background:var(--teal)"></div></div></div><div class="card metric"><div class="metric-top"><span>Sesiones registradas</span></div><strong>${state.history.length}</strong><span class="muted">Los datos se guardan localmente en este Release Candidate.</span></div></div>`;
  }
  function calendarPage() {
    const doneDays=new Set(state.history.map(h=>new Date(h.at).getDate())); const now=new Date(); const y=now.getFullYear(),m=now.getMonth(), days=new Date(y,m+1,0).getDate(), first=(new Date(y,m,1).getDay()+6)%7;
    const cells=Array(first).fill('<span></span>').concat(Array.from({length:days},(_,i)=>`<span class="day ${doneDays.has(i+1)?'done':''} ${i+1===now.getDate()?'today':''}">${i+1}</span>`));
    return `<div class="page-head"><div><p class="eyebrow">Planificación</p><h1>Calendario</h1><p>Los días verdes contienen actividad completada.</p></div></div><section class="card calendar"><div class="section-title"><h2>${now.toLocaleDateString('es-AR',{month:'long',year:'numeric'})}</h2><span class="pill">${doneDays.size} días activos</span></div><div class="calendar-grid">${['L','M','X','J','V','S','D'].map(d=>`<span class="day head">${d}</span>`).join('')}${cells.join('')}</div></section>`;
  }
  function education() {
    const articles=[['Dolor no siempre significa daño','Cómo interpretar las señales del cuerpo durante una recuperación progresiva.',''],['Respirar para moverse mejor','La coordinación respiratoria como herramienta de control y relajación.','alt'],['Adherencia: el factor silencioso','Pequeñas sesiones sostenidas suelen ser más útiles que esfuerzos aislados.','gold']];
    return `<div class="page-head"><div><p class="eyebrow">Educación del paciente</p><h1>Biblioteca SpineFlow</h1><p>Contenido breve para tomar decisiones más claras durante tu recuperación.</p></div></div><div class="grid grid-3">${articles.map((a,i)=>`<article class="card article-card"><div class="article-cover ${a[2]}"><span>Lectura · ${4+i} min</span></div><div class="article-body"><h3>${a[0]}</h3><p>${a[1]}</p><button class="btn btn-light" data-article>Leer resumen</button></div></article>`).join('')}</div>`;
  }
  function favorites() {
    if(!state.favorites.length) return `<div class="page-head"><div><p class="eyebrow">Acceso rápido</p><h1>Favoritos</h1><p>Todavía no guardaste ejercicios.</p></div></div><button class="btn btn-primary" data-view="modules">Explorar módulos</button>`;
    return `<div class="page-head"><div><p class="eyebrow">Acceso rápido</p><h1>Favoritos</h1><p>Tus ejercicios guardados.</p></div></div><div class="exercise-list">${state.favorites.map(id=>{const ctx=contextForExercise(id);return exerciseRow(id,ctx.index,ctx.path)}).join('')}</div>`;
  }

  function bindPage() {
    document.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>go('pathology',{currentRegion:b.dataset.region,currentPath:null}));
    document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{state.currentPath=b.dataset.path;render()});
    $('[data-back-path]')?.addEventListener('click',()=>{state.currentPath=null;render()});
    document.querySelectorAll('[data-exercise]').forEach(b=>b.onclick=()=>{ if(b.dataset.locked==='true') return premiumModal(); const id=b.dataset.exercise,ctx=contextForExercise(id); go('exercise',{currentExercise:id,currentRegion:state.currentRegion||ctx.region.id,currentPath:state.currentPath||ctx.path.id,phase:0,seconds:30}); });
    document.querySelectorAll('[data-open-first]').forEach(b=>b.onclick=()=>{const r=state.regions[0],p=r.pathologies[0];go('exercise',{currentRegion:r.id,currentPath:p.id,currentExercise:p.ex[0],phase:0,seconds:30})});
    $('[data-exercise-back]')?.addEventListener('click',()=>go('pathology'));
    document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>setPhase(Number(b.dataset.phase)));
    $('[data-play]')?.addEventListener('click',togglePlayer); $('[data-voice]')?.addEventListener('click',speakCurrent); $('[data-complete]')?.addEventListener('click',completeExercise); $('[data-favorite]')?.addEventListener('click',toggleFavorite);
    document.querySelectorAll('[data-score]').forEach(input=>input.oninput=()=>{state.scores[input.dataset.score]=Number(input.value);store.set('scores',state.scores);input.nextElementSibling.textContent=input.value+(input.dataset.score==='eva'?'':'%')});
    document.querySelectorAll('[data-article]').forEach(b=>b.onclick=()=>toast('Artículo educativo disponible en esta versión de demostración'));
  }
  function regionById(id){return state.regions.find(r=>r.id===id)}
  function pathById(id){for(const r of state.regions){const p=r.pathologies.find(x=>x.id===id);if(p)return p}return null}
  function contextForExercise(id){for(const region of state.regions){for(const path of region.pathologies){const index=path.ex.indexOf(id);if(index>=0)return{region,path,index}}}return{region:state.regions[0],path:state.regions[0].pathologies[0],index:0}}
  function setPhase(n){state.phase=n;const focus=$('#phaseFocus'),caption=$('#phaseCaption');if(focus)focus.style.left=`${n*20}%`;if(caption){caption.style.left=`calc(${n*20}% + 9px)`;caption.replaceChildren(document.createTextNode(phases[n]))}document.querySelectorAll('.phase-dot').forEach((b,i)=>b.classList.toggle('active',i===n));const ex=state.exercises[state.currentExercise];if($('#stepText'))$('#stepText').textContent=ex.steps[n]||ex.steps.at(-1);if($('#stepLabel'))$('#stepLabel').textContent=`Indicación · fase ${n+1}`}
  function togglePlayer(){if(state.player){clearPlayer();$('[data-play]').textContent='▶ Continuar';return}$('[data-play]').textContent='Ⅱ Pausar';state.player=setInterval(()=>{state.seconds--;if(state.seconds<=0){state.seconds=30;setPhase((state.phase+1)%5);beep(540,.08)}updateTimer()},1000)}
  function updateTimer(){const el=$('#timer');if(el)el.textContent=`00:${String(state.seconds).padStart(2,'0')}`}
  function clearPlayer(){if(state.player){clearInterval(state.player);state.player=null}}
  function speakCurrent(){if(!('speechSynthesis'in window))return toast('La voz guiada no está disponible en este navegador');speechSynthesis.cancel();const ex=state.exercises[state.currentExercise];const u=new SpeechSynthesisUtterance(`${phases[state.phase]}. ${ex.steps[state.phase]||ex.steps.at(-1)}`);u.lang='es-AR';u.rate=.92;speechSynthesis.speak(u);toast('Voz guiada activada')}
  function beep(freq=720,duration=.18){try{const C=window.AudioContext||window.webkitAudioContext,a=new C(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.12,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+duration);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+duration)}catch{}}
  function completeExercise(){const item={id:state.currentExercise,at:Date.now()};state.history.push(item);store.set('history',state.history);clearPlayer();beep(760,.18);setTimeout(()=>beep(980,.25),170);toast('Ejercicio completado y guardado en tu historial')}
  function toggleFavorite(){const id=state.currentExercise,i=state.favorites.indexOf(id);if(i>=0)state.favorites.splice(i,1);else state.favorites.push(id);store.set('favorites',state.favorites);render();toast(i>=0?'Eliminado de favoritos':'Guardado en favoritos')}
  function premiumModal(){const layer=document.createElement('div');layer.className='modal-layer';layer.innerHTML=`<div class="modal"><span class="pill pill-premium">SpineFlow Premium</span><h2>Desbloqueá el programa completo</h2><p class="muted">Accedé a todos los ejercicios de las 12 patologías, seguimiento e historial completo. En este Release Candidate podés activar la vista Premium de demostración.</p><div class="modal-actions"><button class="btn btn-gold" data-activate>${state.premium?'Desactivar demostración':'Activar Premium demo'}</button><button class="btn btn-light" data-close>Ahora no</button></div></div>`;document.body.append(layer);$('[data-close]',layer).onclick=()=>layer.remove();$('[data-activate]',layer).onclick=()=>{state.premium=!state.premium;store.set('premium',state.premium);layer.remove();render();toast(state.premium?'Premium de demostración activado':'Premium de demostración desactivado')}}
  function toast(message){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.append(el);setTimeout(()=>el.remove(),2800)}
  init();
})();
