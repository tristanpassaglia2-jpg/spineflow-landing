(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const app = $('#app');

  /* ── Supabase ── */
  const SB_URL = 'https://atefklvwshuwrmeasrnq.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0ZWZrbHZ3c2h1d3JtZWFzcm5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjgxMTQsImV4cCI6MjEwMTAwNDExNH0.R7r_tagPkqAmdxI2JYhkQ_s4Gzt7ZA1Q2QbzvtOi2kI';
  const sb = supabase.createClient(SB_URL, SB_KEY);

  /* ── Local cache (dark mode + offline fallback) ── */
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(`sf9_${key}`); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { localStorage.setItem(`sf9_${key}`, JSON.stringify(value)); }
  };

  /* ── Dispositivo: máx 2 por cuenta ── */
  const MAX_DEVICES = 2;
  function getDeviceId() {
    let id = store.get('device_id', null);
    if (!id) { id = crypto.randomUUID(); store.set('device_id', id); }
    return id;
  }
  function getDeviceName() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad/.test(ua)) return 'iPhone/iPad';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua)) return 'PC Windows';
    if (/Mac/.test(ua)) return 'Mac';
    return 'Navegador';
  }
  async function checkDeviceLimit(userId) {
    const deviceId = getDeviceId();
    // Registrar/actualizar este dispositivo
    await sb.from('user_devices').upsert({
      user_id: userId, device_id: deviceId,
      device_name: getDeviceName(), last_seen_at: new Date().toISOString()
    }, { onConflict: 'user_id,device_id' });
    // Contar dispositivos activos (vistos en los últimos 30 días)
    const since = new Date(Date.now() - 30*24*60*60*1000).toISOString();
    const { data } = await sb.from('user_devices')
      .select('device_id, device_name, last_seen_at')
      .eq('user_id', userId)
      .gte('last_seen_at', since)
      .order('last_seen_at', { ascending: false });
    if (data && data.length > MAX_DEVICES) {
      const mine = data.find(d => d.device_id === deviceId);
      const isAllowed = data.slice(0, MAX_DEVICES).some(d => d.device_id === deviceId);
      if (!isAllowed) return false; // este dispositivo es el 3°+
    }
    return true;
  }

  /* ── State ── */
  const state = {
    user: null, displayName: '', exercises: {}, regions: [], sequences: {}, programs: {}, view: 'landing',
    currentRegion: null, currentPath: null, currentExercise: null, currentWeek: null, currentSession: null, sessionQueue: [], sessionIndex: 0, phase: 0,
    premium: false, trialPathologies: [], dark: store.get('dark', false),
    favorites: [], history: [], completedSessions: [],
    scores: { eva: 3, odi: 18, ndi: 14 },
    player: null, seconds: 30, authView: 'login', scoreTimer: null, voiceOn: true, loopTimer: null
  };
  const phases = ['Posición inicial', 'Movimiento', 'Pausa', 'Retorno', 'Repetición'];
  const icons = { dashboard:'⌂', modules:'◫', progress:'↗', calendar:'▦', education:'◇', favorites:'♡' };
  const labels = { dashboard:'Inicio', modules:'Mi programa', progress:'Progreso clínico', calendar:'Calendario', education:'Biblioteca', favorites:'Favoritos' };

  /* ══════════════════════════════════════
     INIT
  ══════════════════════════════════════ */
  async function init() {
    document.body.classList.toggle('dark', state.dark);
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        state.user = session.user;
        await loadUserData();
        state.view = 'dashboard';
      }
      const [e, r, seq, prg] = await Promise.all([
        fetch('data/exercises.json'),
        fetch('data/regions.json'),
        fetch('data/v11-static-sequences.json').catch(() => null),
        fetch('data/programs.json').catch(() => null)
      ]);
      if (!e.ok || !r.ok) throw new Error('No se pudieron cargar los datos clínicos');
      state.exercises = await e.json(); state.regions = await r.json();
      try { if (seq && seq.ok) state.sequences = await seq.json(); } catch { state.sequences = {}; }
      try { if (prg && prg.ok) { const p = await prg.json(); state.programs = p.programs || {}; } } catch { state.programs = {}; }
      render();
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
    } catch (error) {
      app.innerHTML = `<div class="boot"><span class="boot-mark">!</span><h2>No pudimos iniciar SpineFlow</h2><p>${error.message}. Usá un servidor local o Vercel, no abras el HTML con doble clic.</p></div>`;
    }
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !state.user) {
        state.user = session.user;
        loadUserData().then(() => { state.view = 'dashboard'; render(); toast('¡Bienvenido/a!'); });
      }
    });
  }

  /* ══════════════════════════════════════
     USER DATA — SYNC CON SUPABASE
  ══════════════════════════════════════ */
  async function loadUserData() {
    try {
      /* ── Chequeo de dispositivos (máx 2) ── */
      const deviceOk = await checkDeviceLimit(state.user.id);
      if (!deviceOk) {
        state.deviceBlocked = true;
        return;
      }
      state.deviceBlocked = false;

      const { data: profile } = await sb.from('profiles').select('favorites, scores, is_premium, display_name, completed_sessions').eq('id', state.user.id).single();
      if (profile) {
        state.favorites = profile.favorites || [];
        state.scores = profile.scores || { eva: 3, odi: 18, ndi: 14 };
        state.premium = profile.is_premium || false;
        state.displayName = profile.display_name || state.user.user_metadata?.display_name || '';
        state.completedSessions = profile.completed_sessions || [];
      }
      /* ── Verificar suscripción MP activa ── */
      if (!state.premium) {
        const { data: sub } = await sb.from('subscriptions').select('status').eq('user_id', state.user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (sub && sub.status === 'authorized') state.premium = true;
      }
      /* ── Verificar acceso por QR médico (trial_access): desbloquea SOLO las patologías del código, no toda la app ── */
      state.trialPathologies = [];
      if (!state.premium) {
        const { data: trial } = await sb.from('trial_access').select('pathology').eq('user_id', state.user.id).gt('expires_at', new Date().toISOString());
        if (trial && trial.length > 0) {
          state.trialPathologies = trial.map(t => t.pathology).filter(Boolean);
        }
      }

      const { data: progress } = await sb.from('exercise_progress').select('exercise_id, completed_at').eq('user_id', state.user.id).order('completed_at', { ascending: false }).limit(500);
      if (progress) {
        state.history = progress.map(p => ({ id: p.exercise_id, at: new Date(p.completed_at).getTime() }));
      }
      store.set('favorites', state.favorites);
      store.set('history', state.history);
      store.set('scores', state.scores);
      store.set('premium', state.premium);
      store.set('completedSessions', state.completedSessions);
    } catch {
      state.favorites = store.get('favorites', []);
      state.history = store.get('history', []);
      state.scores = store.get('scores', { eva: 3, odi: 18, ndi: 14 });
      state.premium = store.get('premium', false);
      state.completedSessions = store.get('completedSessions', []);
      state.displayName = '';
    }
  }
  async function saveProfile(fields) {
    if (!state.user) return;
    try { await sb.from('profiles').update(fields).eq('id', state.user.id); } catch {}
  }

  /* ══════════════════════════════════════
     AUTH — LOGIN / REGISTRO / RECUPERAR
  ══════════════════════════════════════ */
  function translateError(msg) {
    if (!msg) return 'Ocurrió un error. Intentá de nuevo.';
    const m = msg.toLowerCase();
    if (m.includes('invalid login')) return 'Email o contraseña incorrectos.';
    if (m.includes('email not confirmed')) return 'Revisá tu email y confirmá tu cuenta antes de entrar.';
    if (m.includes('user already registered')) return 'Ya existe una cuenta con ese email. ¿Querés entrar?';
    if (m.includes('password') && m.includes('6')) return 'La contraseña tiene que tener al menos 6 caracteres.';
    if (m.includes('rate limit')) return 'Demasiados intentos. Esperá un momento.';
    if (m.includes('email')) return 'Revisá que el email esté bien escrito.';
    return msg;
  }
  function showAuthMsg(text, type) {
    const el = $('#authMsg');
    if (!el) return;
    el.innerHTML = `<div style="padding:10px 14px;border-radius:8px;font-size:.85rem;margin:0 0 16px;background:${type === 'error' ? '#fff5f5' : '#f0fff4'};color:${type === 'error' ? '#c53030' : '#276749'};border:1px solid ${type === 'error' ? '#feb2b2' : '#9ae6b4'}">${text}</div>`;
  }
  function setAuthLoading(on) {
    const btn = $('#authBtn');
    if (!btn) return;
    btn.disabled = on;
    if (on) { btn.dataset.text = btn.textContent; btn.textContent = 'Cargando…'; }
    else btn.textContent = btn.dataset.text || 'OK';
  }

  async function doLogin() {
    const email = $('#authEmail')?.value.trim();
    const pass = $('#authPass')?.value;
    if (!email || !pass) return showAuthMsg('Completá email y contraseña.', 'error');
    setAuthLoading(true);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    setAuthLoading(false);
    if (error) return showAuthMsg(translateError(error.message), 'error');
    state.user = data.user;
    await loadUserData();
    go('dashboard');
    toast('¡Bienvenido/a!');
  }
  async function doRegister() {
    const name = $('#authName')?.value.trim();
    const email = $('#authEmail')?.value.trim();
    const pass = $('#authPass')?.value;
    if (!email || !pass) return showAuthMsg('Completá email y contraseña.', 'error');
    if (pass.length < 6) return showAuthMsg('La contraseña tiene que tener al menos 6 caracteres.', 'error');
    setAuthLoading(true);
    const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { display_name: name || email.split('@')[0] } } });
    setAuthLoading(false);
    if (error) return showAuthMsg(translateError(error.message), 'error');
    if (data.user && !data.user.email_confirmed_at && !data.session) {
      showAuthMsg('✅ ¡Cuenta creada! Revisá tu email y hacé clic en el enlace de confirmación para entrar.', 'success');
    } else {
      state.user = data.user;
      if (name) await saveProfile({ display_name: name });
      await loadUserData();
      go('dashboard');
      toast('¡Cuenta creada! Bienvenido/a');
    }
  }
  async function doForgot() {
    const email = $('#authEmail')?.value.trim();
    if (!email) return showAuthMsg('Poné tu email.', 'error');
    setAuthLoading(true);
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login' });
    setAuthLoading(false);
    if (error) return showAuthMsg(translateError(error.message), 'error');
    showAuthMsg('✅ Si esa cuenta existe, te mandamos un email para resetear tu contraseña.', 'success');
  }
  async function logout() {
    await sb.auth.signOut();
    state.user = null; state.displayName = '';
    state.favorites = []; state.history = [];
    state.scores = { eva: 3, odi: 18, ndi: 14 }; state.premium = false; state.trialPathologies = [];
    go('landing');
    toast('Sesión cerrada');
  }

  /* ══════════════════════════════════════
     NAVIGATION & RENDER
  ══════════════════════════════════════ */
  function go(view, params = {}) {
    clearPlayer(); Object.assign(state, params); state.view = view; window.scrollTo({ top: 0, behavior: 'smooth' }); render();
  }
  function render() {
    if (state.view === 'landing') return renderLanding();
    if (state.view === 'login') return renderLogin();
    if (!state.user) { state.view = 'login'; return renderLogin(); }
    if (state.deviceBlocked) return renderDeviceBlocked();
    app.innerHTML = shell(page()); bindShell(); bindPage();
  }
  function renderDeviceBlocked() {
    app.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f0fafa"><div style="background:#fff;border-radius:20px;box-shadow:0 8px 32px rgba(0,128,128,0.10);max-width:480px;width:100%;text-align:center;padding:48px 32px"><div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:1.8rem">⚠️</div><h1 style="font-size:1.4rem;color:#92400e;margin-bottom:12px">Límite de dispositivos</h1><p style="color:#475569;line-height:1.6;margin-bottom:24px">Ya tenés <strong>2 dispositivos</strong> conectados a tu cuenta.<br>Para usar SpineFlow acá, cerrá sesión en otro dispositivo.</p><button class="btn btn-primary" style="padding:14px 32px;border-radius:12px;font-size:1rem" onclick="location.reload()">Reintentar</button><br><button class="btn btn-light" style="margin-top:12px;padding:10px 24px;font-size:.9rem" id="btnLogoutDevice">Cerrar sesión acá</button></div></div>`;
    document.getElementById('btnLogoutDevice')?.addEventListener('click', logout);
  }

  /* ── Landing ── */
  function renderLanding() {
    app.innerHTML = `<div class="landing">
      <nav class="landing-nav"><div class="brand"><span class="brand-mark">SF</span>SpineFlow</div><div class="landing-actions"><button class="btn btn-light" data-action="login">Ingresar</button><button class="btn btn-primary" data-action="register">Comenzar</button></div></nav>
      <main class="hero"><div class="hero-copy"><p class="eyebrow">Rehabilitación de columna · Guiada y progresiva</p><h1>Volvé a moverte con <span>confianza.</span></h1><p>Un programa clínico claro para acompañar tu recuperación cervical, dorsal, lumbar o adultos +60. 100 ejercicios específicos, seguimiento y una guía humana en cada paso.</p><div class="hero-actions"><button class="btn btn-primary" data-action="register">Crear mi cuenta gratis →</button><button class="btn btn-light" data-action="login">Ya tengo una cuenta</button></div><div class="trust-row"><span>Diseño clínico</span><span>Progreso medible</span><span>En casa o consultorio</span></div></div>
      <div class="hero-visual"><img class="hero-photo" src="media/coach/mi-profe.webp" alt="Mis profes, guías de SpineFlow"><div class="coach-badge"><span class="coach-dot"></span><div><strong>Mis profes</strong><span>Tu guía en los 100 ejercicios</span></div></div></div></main>
      <section class="proof-strip"><div><strong>100</strong><span>ejercicios específicos</span></div><div><strong>4</strong><span>módulos SpineFlow</span></div><div><strong>14</strong><span>programas por patología</span></div><div><strong>1-5</strong><span>fases visuales por ejercicio</span></div></section>
    </div>`;
    app.addEventListener('click', landingClick, { once: true });
  }
  function landingClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'login') { state.authView = 'login'; go('login'); }
    else if (action === 'register') { state.authView = 'register'; go('login'); }
    else if (state.view === 'landing') app.addEventListener('click', landingClick, { once: true });
  }

  /* ── Login / Registro / Recuperar ── */
  function renderLogin() {
    const v = state.authView || 'login';
    let inner;
    if (v === 'register') {
      inner = `<button type="button" class="btn btn-ghost" data-auth-back>← Volver</button>
        <div class="brand"><span class="brand-mark">SF</span>SpineFlow</div>
        <h1>Crear cuenta</h1><p class="muted">La Sesión 1 de tu patología es gratis, para siempre.</p>
        <div id="authMsg"></div>
        <div class="field"><label>Nombre</label><input type="text" id="authName" placeholder="Tu nombre" autocomplete="name"></div>
        <div class="field"><label>Email</label><input type="email" id="authEmail" required placeholder="tu@email.com" autocomplete="email"></div>
        <div class="field"><label>Contraseña</label><input type="password" id="authPass" required minlength="6" placeholder="Mínimo 6 caracteres" autocomplete="new-password"></div>
        <button class="btn btn-primary btn-wide" id="authBtn">Crear mi cuenta</button>
        <p class="muted" style="text-align:center;margin-top:16px">¿Ya tenés cuenta? <a href="#" class="auth-link" data-to="login">Entrar</a></p>`;
    } else if (v === 'forgot') {
      inner = `<button type="button" class="btn btn-ghost" data-auth-back>← Volver</button>
        <div class="brand"><span class="brand-mark">SF</span>SpineFlow</div>
        <h1>Recuperar contraseña</h1><p class="muted">Te mandamos un email para resetearla.</p>
        <div id="authMsg"></div>
        <div class="field"><label>Email de tu cuenta</label><input type="email" id="authEmail" required placeholder="tu@email.com" autocomplete="email"></div>
        <button class="btn btn-primary btn-wide" id="authBtn">Enviar enlace</button>
        <p class="muted" style="text-align:center;margin-top:16px"><a href="#" class="auth-link" data-to="login">← Volver al login</a></p>`;
    } else {
      inner = `<button type="button" class="btn btn-ghost" data-auth-back>← Volver</button>
        <div class="brand"><span class="brand-mark">SF</span>SpineFlow</div>
        <h1>Bienvenido/a</h1><p class="muted">Ingresá para continuar con tu programa.</p>
        <div id="authMsg"></div>
        <div class="field"><label>Correo electrónico</label><input type="email" id="authEmail" required placeholder="tu@email.com" autocomplete="email"></div>
        <div class="field"><label>Contraseña</label><input type="password" id="authPass" required minlength="4" placeholder="••••••••" autocomplete="current-password"></div>
        <p style="text-align:right;margin:-8px 0 12px"><a href="#" class="auth-link" data-to="forgot" style="font-size:.85rem">¿Olvidaste tu contraseña?</a></p>
        <button class="btn btn-primary btn-wide" id="authBtn">Ingresar</button>
        <p class="muted" style="text-align:center;margin-top:16px">¿No tenés cuenta? <a href="#" class="auth-link" data-to="register">Registrate gratis</a></p>`;
    }
    app.innerHTML = `<div class="login-wrap"><div class="login-visual"><h2>Tu recuperación merece claridad, constancia y acompañamiento.</h2></div><div class="login-form"><div class="login-box">${inner}</div></div></div>`;
    $('[data-auth-back]')?.addEventListener('click', () => { state.authView = 'login'; go('landing'); });
    document.querySelectorAll('.auth-link').forEach(a => a.addEventListener('click', e => { e.preventDefault(); state.authView = a.dataset.to; renderLogin(); }));
    const btn = $('#authBtn');
    if (v === 'login') btn.onclick = doLogin;
    else if (v === 'register') btn.onclick = doRegister;
    else if (v === 'forgot') btn.onclick = doForgot;
    document.querySelectorAll('#authEmail,#authPass,#authName').forEach(input => {
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } });
    });
  }

  /* ══════════════════════════════════════
     SHELL & PAGES
  ══════════════════════════════════════ */
  function shell(content) {
    const nav = Object.keys(labels).map(v => `<button class="nav-item ${state.view===v?'active':''}" data-view="${v}"><span class="nav-icon">${icons[v]}</span>${labels[v]}</button>`).join('');
    const name = state.displayName || state.user?.email?.split('@')[0] || '';
    const initial = name.charAt(0).toUpperCase() || 'U';
    const hasTrial = state.trialPathologies.length > 0;
    const planLabel = state.premium ? 'Premium activo' : (hasTrial ? 'Acceso prescrito' : 'Plan gratuito');
    const planCta = state.premium ? 'Gestionar plan' : (hasTrial ? 'Suscribirme' : 'Ver Premium');
    const planClass = state.premium ? 'btn-light' : 'btn-gold';
    return `<div class="shell"><aside class="sidebar" id="sidebar"><div class="brand"><span class="brand-mark">SF</span>SpineFlow</div><nav class="nav-list">${nav}</nav><div class="side-plan"><small>Plan actual</small><strong>${planLabel}</strong><button class="btn ${planClass} btn-wide" data-premium>${planCta}</button><button class="btn btn-light btn-wide" data-logout style="margin-top:8px;font-size:.8rem;opacity:.7">Cerrar sesión</button></div></aside><main class="main"><header class="topbar"><button class="btn btn-light mobile-menu" data-menu>☰</button><div><strong>${labels[state.view] || 'SpineFlow'}</strong></div><div class="top-actions"><button class="btn btn-light" data-dark title="Cambiar tema">${state.dark?'☀':'☾'}</button><div class="profile-dot" aria-label="Perfil" title="${name}">${initial}</div></div></header><div class="content">${content}</div></main></div>`;
  }
  function bindShell() {
    document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => go(b.dataset.view));
    $('[data-menu]')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('[data-dark]')?.addEventListener('click', () => { state.dark=!state.dark; store.set('dark',state.dark); document.body.classList.toggle('dark',state.dark); render(); });
    $('[data-premium]')?.addEventListener('click', premiumModal);
    $('[data-logout]')?.addEventListener('click', logout);
  }
  function page() {
    switch (state.view) {
      case 'dashboard': return dashboard(); case 'modules': return modules(); case 'pathology': return pathology();
      case 'exercise': return exercise(); case 'progress': return progress(); case 'calendar': return calendarPage();
      case 'education': return education(); case 'favorites': return favorites(); default: return dashboard();
    }
  }

  /* ── Dashboard ── */
  function dashboard() {
    const completed = new Set(state.history.map(h => h.id)).size;
    const adherence = Math.min(100, Math.round((state.history.filter(h => Date.now()-h.at<7*864e5).length/5)*100));
    const name = state.displayName || state.user?.email?.split('@')[0] || '';
    return `<div class="page-head"><div><p class="eyebrow">Panel del paciente</p><h1>Hola${name ? ', ' + name : ''}</h1><p>Tu plan está listo. Movete con control y registrá cómo te sentís.</p></div><button class="btn btn-primary" data-open-first>Continuar programa →</button></div>
      <div class="alert-banner"><h3>⚠ Detené la rutina y pedí ayuda</h3><p>Frená ante dolor u opresión en el pecho, falta de aire intensa o desproporcionada, mareo, sensación de desmayo, confusión, palpitaciones con malestar, debilidad repentina, pérdida de equilibrio o agotamiento extremo.</p><p>Sentate o recostate en un lugar seguro, no continúes la rutina, avisá a un familiar o persona cercana y solicitá asistencia médica de emergencia si los síntomas son intensos o no mejoran rápidamente.</p></div>
      <div class="grid grid-4"><div class="card metric"><div class="metric-top"><span>Adherencia semanal</span><span>◎</span></div><strong>${adherence}%</strong><span class="trend">Objetivo: 80%</span></div><div class="card metric"><div class="metric-top"><span>Ejercicios realizados</span><span>✓</span></div><strong>${state.history.length}</strong><span class="trend">${completed} diferentes</span></div><div class="card metric"><div class="metric-top"><span>Dolor EVA</span><span>↘</span></div><strong>${state.scores.eva}/10</strong><span class="trend">Registro actual</span></div><div class="card metric"><div class="metric-top"><span>Favoritos</span><span>♡</span></div><strong>${state.favorites.length}</strong><span class="trend">Acceso rápido</span></div></div>
      <section class="card dashboard-hero"><div class="dashboard-copy"><span class="pill">Sesión recomendada</span><h2>Una secuencia clara, acompañada por Mis profes.</h2><p>Cada ejercicio tiene hasta cinco fases fotográficas propias, indicaciones clínicas, respiración, advertencias y control de tiempo.</p><button class="btn btn-gold" data-open-first>Empezar sesión</button></div><div class="dashboard-photo" role="img" aria-label="Mis profes, guías de SpineFlow"></div></section>
      <div class="section-title"><h2>Módulos SpineFlow</h2><button class="btn btn-ghost" data-view="modules">Ver todos →</button></div>${moduleGrid()}`;
  }
  function moduleGrid() {
    return `<div class="grid grid-3">${state.regions.map((r,i)=>`<article class="card module-card" style="--module-light:${r.light}"><span class="module-number">0${i+1}</span><div class="module-orb">${r.icon}</div><h3>Módulo ${r.label}</h3><p>${r.subtitle} · ${r.pathologies.length} patologías</p><button class="btn btn-light" data-region="${r.id}">Explorar módulo</button></article>`).join('')}</div>`;
  }
  function modules() {
    return `<div class="page-head"><div><p class="eyebrow">Arquitectura clínica</p><h1>Elegí tu módulo</h1><p>Cervical, dorsal, lumbar y adultos +60 conservan sus programas y progresiones específicas.</p></div></div>${moduleGrid()}`;
  }
  function pathology() {
    const region = regionById(state.currentRegion) || state.regions[0];
    if (!state.currentPath) return `<button class="btn btn-dark back-button" data-view="modules">← Volver a módulos</button><div class="page-head"><div><p class="eyebrow">Módulo ${region.label}</p><h1>Seleccioná tu programa</h1><p>${region.subtitle}</p></div></div><div class="grid grid-2">${region.pathologies.map(p=>`<article class="card path-card"><span class="pill">${p.ex.length} ejercicios</span><h3>${p.title}</h3><p>${p.desc}</p><div class="path-meta"><span class="free-badge">Semana 1 gratis · resto Premium</span><button class="btn btn-primary" data-path="${p.id}">Abrir</button></div></article>`).join('')}</div>`;
    const path = pathById(state.currentPath); if (!path) return modules();
    const program = state.programs[state.currentPath];
    if (program) return renderProgram(region, path, program);
    // Sin programa: modo lista de ejercicios (backwards compat, ej: módulo +60)
    return `<button class="btn btn-dark back-button" data-back-path>← Volver a patologías</button><div class="page-head"><div><p class="eyebrow">Módulo ${region.label}</p><h1>${path.title}</h1><p>${path.desc}. Los dos primeros ejercicios son de acceso gratuito.</p></div></div><div class="exercise-list">${path.ex.map((id,i)=>exerciseRow(id,i,path)).join('')}</div>`;
  }
  function isSessionUnlocked(session, week) {
    // Semana 1 completa gratis, resto Premium (a menos que tenga trial o suscripción)
    if (week.number === 1) return true;
    if (state.premium) return true;
    if (state.trialPathologies.includes(state.currentPath)) return true;
    return false;
  }
  function isSessionCompleted(sessionId) {
    return state.completedSessions.includes(sessionId);
  }
  function weekCompleted(week) {
    return week.sessions.every(s => isSessionCompleted(s.id));
  }
  function renderProgram(region, path, program) {
    const totalSessions = program.weeks.reduce((n,w)=>n+w.sessions.length, 0);
    const doneCount = program.weeks.reduce((n,w)=>n+w.sessions.filter(s=>isSessionCompleted(s.id)).length, 0);
    const pct = Math.round((doneCount/totalSessions)*100);
    const weeksHtml = program.weeks.map((w,wi) => {
      const prevDone = wi === 0 || weekCompleted(program.weeks[wi-1]);
      const sessionsHtml = w.sessions.map(s => {
        const unlocked = isSessionUnlocked(s, w);
        const done = isSessionCompleted(s.id);
        const badge = done ? '<span class="pill free">✓ Completada</span>' : (unlocked ? '<span class="pill free">Disponible</span>' : '<span class="pill pill-premium">Premium</span>');
        const btnClass = unlocked ? 'btn-primary' : 'btn-light';
        const btnText = done ? 'Volver a hacer' : (unlocked ? 'Comenzar' : 'Ver Premium');
        return `<article class="exercise-row"><div style="width:44px;height:44px;border-radius:50%;background:var(--teal,#0f8b84);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;flex-shrink:0">${s.number}</div><div style="flex:1"><div class="exercise-tags">${badge}<span class="pill">${s.duration_min} min</span><span class="pill">${s.exercises.length} ejercicios</span></div><h3 style="margin:6px 0 2px">${s.title}</h3></div><div class="exercise-status"><button class="btn ${btnClass}" data-session="${s.id}" data-week="${w.number}" data-unlocked="${unlocked}" data-warn="${!prevDone && wi>0}">${btnText}</button></div></article>`;
      }).join('');
      return `<section class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap"><div><span class="pill">Semana ${w.number} · ${w.title}</span><h2 style="margin:8px 0 4px">${w.goal}</h2><p class="muted" style="margin:0">${w.dose}</p></div>${weekCompleted(w)?'<span class="pill free">✓ Semana completada</span>':''}</div>${w.note?`<div class="info-box" style="margin-top:12px"><p style="margin:0"><strong>Nota:</strong> ${w.note}</p></div>`:''}<div class="exercise-list" style="margin-top:14px">${sessionsHtml}</div>${w.pacing?`<p class="muted" style="margin-top:14px;font-size:.85rem;font-style:italic">${w.pacing}</p>`:''}</section>`;
    }).join('');
    return `<button class="btn btn-dark back-button" data-back-path>← Volver a patologías</button>
      <div class="page-head"><div><p class="eyebrow">Módulo ${region.label}</p><h1>${path.title}</h1><p>${program.intro}</p></div></div>
      <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,#0f8b84,#0d7772);color:#fff"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><div><p style="opacity:.85;font-size:.85rem;margin:0">Tu progreso</p><h2 style="margin:4px 0;color:#fff">${doneCount} de ${totalSessions} sesiones</h2></div><div style="min-width:120px"><div style="height:8px;background:rgba(255,255,255,.25);border-radius:10px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#fff;transition:width .3s"></div></div><p style="margin:6px 0 0;font-size:.8rem;opacity:.9;text-align:right">${pct}%</p></div></div></div>
      ${weeksHtml}`;
  }
  /* Miniatura: usa la 1ª fase del loop si existe; si no, la lámina suelta. */
  function thumbFor(id) {
    const imgs = imagesFor(id);
    if (imgs && imgs.length) return imgs[0];
    return `media/exercises/${id}.webp`;
  }
  /* Voz: lee sólo la 1ª oración del paso (el texto completo queda en el panel). */
  function firstSentence(txt) {
    if (!txt) return '';
    const m = String(txt).match(/^[\s\S]*?[.!?](\s|$)/);
    let out = (m ? m[0] : String(txt)).trim();
    if (out.length > 140) out = out.slice(0, 140).replace(/\s+\S*$/, '') + '.';
    return out;
  }
  function exerciseRow(id,index,path) {
    const ex=state.exercises[id];
    const hasTrialForThisPath = state.trialPathologies.includes(path.id);
    const locked=index>=path.free_count&&!state.premium&&!hasTrialForThisPath;
    return `<article class="exercise-row"><div class="exercise-thumb" style="background-image:url('${thumbFor(id)}')"></div><div><div class="exercise-tags"><span class="pill">${ex.level}</span>${index<path.free_count?'<span class="pill free">Gratis</span>':(hasTrialForThisPath?'<span class="pill free">Prescrito</span>':'<span class="pill pill-premium">Premium</span>')}</div><h3>${ex.name}</h3><p>${ex.position}${ex.reps ? ' · ' + ex.reps : ''}</p></div><div class="exercise-status"><span class="lock ${locked?'':'free'}">${locked?'🔒':'✓'}</span><button class="btn ${locked?'btn-light':'btn-primary'}" data-exercise="${id}" data-locked="${locked}">${locked?'Ver Premium':'Comenzar'}</button></div></article>`;
  }
  /* Resuelve las láminas de secuencia (loop) de un ejercicio.
     Formato del JSON: {"l1":{files:[...]}} o alias {"p2":{type:"alias",alias_of:"k8"}} */
  function imagesFor(id) {
    const seq = state.sequences;
    let node = seq[id];
    if (node && node.type === 'alias' && node.alias_of) node = seq[node.alias_of];
    if (node && Array.isArray(node.files) && node.files.length) return node.files.slice();
    return null; // sin secuencia → fallback lámina vieja
  }

  function exercise() {
    const ex=state.exercises[state.currentExercise]; if(!ex) return modules();
    const fav=state.favorites.includes(state.currentExercise);
    const imgs = imagesFor(state.currentExercise);
    const firstImg = imgs ? imgs[0] : `media/exercises/${state.currentExercise}.webp`;
    return `<button class="btn btn-dark back-button" data-exercise-back>← Volver al programa</button><div class="exercise-layout"><section class="card exercise-main"><div class="exercise-title-row"><div><p class="eyebrow">Ejercicio guiado por Mis profes</p><h1>${ex.name}</h1></div><button class="btn btn-light" data-favorite>${fav?'♥ Guardado':'♡ Favorito'}</button></div><div class="exercise-tags"><span class="pill">${ex.level}</span>${ex.series?`<span class="pill">${ex.series}</span>`:''}${ex.reps?`<span class="pill">${ex.reps}</span>`:''}</div>
      <div class="player"><div class="player-head"><div class="coach-mini"><span class="coach-avatar"><img src="media/coach/mi-profe.webp" alt="Retrato de Mis profes"></span><div><strong>Mis profes</strong><span>Guía de movimiento</span></div></div><span class="speak-badge" id="speakBadge">● GUÍA</span></div>
        <div class="loop-stage" id="loopStage"><div class="loop-layer on" id="loopA"><img src="${firstImg}" alt="${ex.name}" onerror="this.style.opacity=0"></div><div class="loop-layer" id="loopB"><img src="" alt=""></div><div class="loop-dots" id="loopDots"></div></div>
        <div class="player-controls"><button class="btn btn-light" data-play>Ⅱ Pausar</button><button class="btn btn-light" data-voice>🔊 Voz</button><button class="btn btn-primary" data-complete>✓ Completar</button></div></div><div class="instruction"><small id="stepLabel">Indicación · fase 1</small><p id="stepText">${ex.steps[0]||ex.position||''}</p></div></section>
      <aside class="card clinical-panel"><div class="muscle-map"><p class="eyebrow">Lámina clínica</p><h3>Músculos y estructuras implicadas</h3>${muscleChips(ex.muscles)}</div><div class="info-box"><h3>◎ Objetivo terapéutico</h3><p>Mejorar el control del movimiento y la tolerancia funcional respetando el rango indicado.</p></div><div class="info-box"><h3>↗ Consejos del fisioterapeuta</h3><p>${ex.variants}</p></div><div class="info-box"><h3>≋ Respiración</h3><p>${ex.breathing}</p></div><div class="info-box warn"><h3>△ Advertencia clínica</h3><p>${ex.warning}</p></div><div class="info-box"><h3>Pasos completos</h3><div class="steps-list">${ex.steps.map(s=>`<div class="step-item">${s}</div>`).join('')}</div></div></aside></div>`;
  }
  function muscleChips(text) { return text.split(/,|—|\(|\)/).map(x=>x.trim()).filter(Boolean).slice(0,6).map(x=>`<span class="muscle-chip">${x}</span>`).join(''); }

  function progress() {
    const adherence=Math.min(100,Math.round((state.history.filter(h=>Date.now()-h.at<7*864e5).length/5)*100));
    return `<div class="page-head"><div><p class="eyebrow">Resultados reportados por el paciente</p><h1>Progreso clínico</h1><p>Registrá tus valores y compartilos con tu profesional tratante.</p></div></div><div class="grid grid-3"><div class="card score-card"><h3>Dolor EVA</h3><p class="muted">0 sin dolor · 10 máximo</p><div class="range-row"><input type="range" min="0" max="10" value="${state.scores.eva}" data-score="eva"><span class="range-value">${state.scores.eva}</span></div></div><div class="card score-card"><h3>ODI</h3><p class="muted">Discapacidad lumbar</p><div class="range-row"><input type="range" min="0" max="100" value="${state.scores.odi}" data-score="odi"><span class="range-value">${state.scores.odi}%</span></div></div><div class="card score-card"><h3>NDI</h3><p class="muted">Discapacidad cervical</p><div class="range-row"><input type="range" min="0" max="100" value="${state.scores.ndi}" data-score="ndi"><span class="range-value">${state.scores.ndi}%</span></div></div></div><div class="section-title"><h2>Resumen de adherencia</h2></div><div class="grid grid-2"><div class="card metric"><div class="metric-top"><span>Últimos 7 días</span></div><strong>${adherence}%</strong><div style="height:10px;background:#e6efed;border-radius:10px;overflow:hidden"><div style="height:100%;width:${adherence}%;background:var(--teal)"></div></div></div><div class="card metric"><div class="metric-top"><span>Sesiones registradas</span></div><strong>${state.history.length}</strong><span class="muted">Datos sincronizados con tu cuenta.</span></div></div>`;
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

  /* ══════════════════════════════════════
     BIND PAGE EVENTS
  ══════════════════════════════════════ */
  function bindPage() {
    document.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>go('pathology',{currentRegion:b.dataset.region,currentPath:null}));
    document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{state.currentPath=b.dataset.path;render()});
    $('[data-back-path]')?.addEventListener('click',()=>{state.currentPath=null;render()});
    document.querySelectorAll('[data-exercise]').forEach(b=>b.onclick=()=>{ if(b.dataset.locked==='true') return premiumModal(); const id=b.dataset.exercise,ctx=contextForExercise(id); go('exercise',{currentExercise:id,currentRegion:state.currentRegion||ctx.region.id,currentPath:state.currentPath||ctx.path.id,phase:0,seconds:30}); });
    document.querySelectorAll('[data-session]').forEach(b=>b.onclick=()=>{
      if(b.dataset.unlocked==='false') return premiumModal();
      const sessionId = b.dataset.session;
      const weekNum = parseInt(b.dataset.week);
      const program = state.programs[state.currentPath];
      const week = program?.weeks.find(w => w.number === weekNum);
      const session = week?.sessions.find(s => s.id === sessionId);
      if (!session) return;
      if (b.dataset.warn === 'true') {
        if (!confirm('Recomendamos completar la semana anterior antes de esta. ¿Querés continuar igual?')) return;
      }
      startSession(session, week);
    });
    document.querySelectorAll('[data-open-first]').forEach(b=>b.onclick=()=>{const r=state.regions[0],p=r.pathologies[0];go('exercise',{currentRegion:r.id,currentPath:p.id,currentExercise:p.ex[0],phase:0,seconds:30})});
    $('[data-exercise-back]')?.addEventListener('click',()=>{ if(state.sessionQueue.length){state.sessionQueue=[];state.sessionIndex=0;state.currentSession=null;} go('pathology'); });
    $('[data-play]')?.addEventListener('click',toggleLoop); $('[data-voice]')?.addEventListener('click',toggleVoice); $('[data-complete]')?.addEventListener('click',completeExercise); $('[data-favorite]')?.addEventListener('click',toggleFavorite);
    if(state.view==='exercise') startLoop();
    document.querySelectorAll('[data-score]').forEach(input=>input.oninput=()=>{
      state.scores[input.dataset.score]=Number(input.value);
      store.set('scores',state.scores);
      input.nextElementSibling.textContent=input.value+(input.dataset.score==='eva'?'':'%');
      clearTimeout(state.scoreTimer);
      state.scoreTimer=setTimeout(()=>saveProfile({scores:state.scores}),1000);
    });
    document.querySelectorAll('[data-article]').forEach(b=>b.onclick=()=>toast('Artículo educativo disponible próximamente'));
  }
  function startSession(session, week) {
    state.sessionQueue = session.exercises.slice();
    state.sessionIndex = 0;
    state.currentSession = session;
    state.currentWeek = week;
    const firstExId = state.sessionQueue[0];
    go('exercise', { currentExercise: firstExId, phase: 0, seconds: 30 });
  }

  /* ══════════════════════════════════════
     HELPERS (sin cambios)
  ══════════════════════════════════════ */
  function regionById(id){return state.regions.find(r=>r.id===id)}
  function pathById(id){for(const r of state.regions){const p=r.pathologies.find(x=>x.id===id);if(p)return p}return null}
  function contextForExercise(id){for(const region of state.regions){for(const path of region.pathologies){const index=path.ex.indexOf(id);if(index>=0)return{region,path,index}}}return{region:state.regions[0],path:state.regions[0].pathologies[0],index:0}}
  /* ══════ MOTOR DEL REPRODUCTOR EN LOOP (crossfade + voz sincronizada) ══════ */
  const LOOP_MIN_MS = 3200;   // tiempo mínimo por fase
  const LOOP_HOLD_MS = 2600;  // pausa después de la voz (para ejecutar)
  const LOOP_RATE = 0.78;     // velocidad de voz (lenta, público +60)
  let loopUseA = true, loopToken = 0;

  function loopPhases() {
    const ex = state.exercises[state.currentExercise];
    const imgs = imagesFor(state.currentExercise) || [`media/exercises/${state.currentExercise}.webp`];
    return imgs.map((src, i) => ({
      img: src,
      cap: ex.steps?.[i] || ex.position || ex.name || '',
      voice: firstSentence(ex.steps?.[i] || ex.position || '')
    }));
  }
  function paintPhase() {
    const ph = loopPhases()[state.phase];
    if (!ph) return;
    const a = $('#loopA'), b = $('#loopB');
    if (!a || !b) return;
    const back = loopUseA ? b : a, front = loopUseA ? a : b;
    const img = back.querySelector('img');
    if (img) { img.src = ph.img; img.style.opacity = 1; }
    back.classList.add('on'); front.classList.remove('on');
    loopUseA = !loopUseA;
    const dots = $('#loopDots');
    if (dots) dots.innerHTML = loopPhases().map((_,i)=>`<span class="loop-dot ${i===state.phase?'act':''}"></span>`).join('');
    if ($('#stepText')) $('#stepText').textContent = ph.cap;
    if ($('#stepLabel')) $('#stepLabel').textContent = `Indicación · fase ${state.phase+1}`;
  }
  function runLoopPhase() {
    const my = ++loopToken;
    paintPhase();
    const seq = loopPhases();
    const ph = seq[state.phase];
    const t0 = Date.now();
    const next = () => {
      if (my !== loopToken || !state.player) return;
      const wait = Math.max(LOOP_HOLD_MS, LOOP_MIN_MS - (Date.now()-t0));
      state.loopTimer = setTimeout(() => {
        if (my !== loopToken || !state.player) return;
        state.phase = (state.phase + 1) % seq.length;
        runLoopPhase();
      }, wait);
    };
    const badge = $('#speakBadge');
    if (state.voiceOn && 'speechSynthesis' in window && ph.voice) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(ph.voice);
      u.lang='es-AR'; u.rate=LOOP_RATE; u.pitch=1;
      if (badge) badge.classList.add('on');
      u.onend = () => { if(badge) badge.classList.remove('on'); next(); };
      u.onerror = () => { if(badge) badge.classList.remove('on'); next(); };
      speechSynthesis.speak(u);
      setTimeout(() => { if (my===loopToken && !speechSynthesis.speaking) next(); }, 400);
    } else next();
  }
  function startLoop() {
    if (state.voiceOn === undefined) state.voiceOn = true;
    state.phase = 0; loopUseA = true; state.player = true;
    const btn = $('[data-play]');
    if (btn) btn.textContent = 'Ⅱ Pausar';
    runLoopPhase();
  }
  function toggleLoop() {
    const btn = $('[data-play]');
    if (state.player) {
      clearPlayer();
      if (btn) btn.textContent = '▶ Reanudar';
    } else {
      state.player = true;
      if (btn) btn.textContent = 'Ⅱ Pausar';
      runLoopPhase();
    }
  }
  function toggleVoice() {
    state.voiceOn = state.voiceOn === undefined ? false : !state.voiceOn;
    const btn = $('[data-voice]');
    if (btn) btn.textContent = state.voiceOn ? '🔊 Voz' : '🔇 Voz';
    if (!state.voiceOn) speechSynthesis.cancel();
    if (state.player) { loopToken++; clearTimeout(state.loopTimer); runLoopPhase(); }
  }
  function clearPlayer(){ state.player=false; loopToken++; clearTimeout(state.loopTimer); if('speechSynthesis'in window)speechSynthesis.cancel(); const badge=$('#speakBadge'); if(badge)badge.classList.remove('on'); }
  function beep(freq=720,duration=.18){try{const C=window.AudioContext||window.webkitAudioContext,a=new C(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.12,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+duration);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+duration)}catch{}}
  async function completeExercise(){
    const item={id:state.currentExercise,at:Date.now()};
    state.history.push(item);store.set('history',state.history);
    if(state.user){try{await sb.from('exercise_progress').insert({user_id:state.user.id,exercise_id:state.currentExercise,pathology_id:state.currentPath||'',duration_seconds:Math.max(0,30-state.seconds)})}catch{}}
    clearPlayer();beep(760,.18);setTimeout(()=>beep(980,.25),170);
    // ¿Estamos dentro de una sesión guiada?
    if (state.sessionQueue.length > 0 && state.currentSession) {
      state.sessionIndex++;
      if (state.sessionIndex < state.sessionQueue.length) {
        const next = state.sessionIndex + 1;
        const total = state.sessionQueue.length;
        showSessionModal(`Ejercicio ${state.sessionIndex} de ${total} completado`, `Siguiente: ejercicio ${next} de ${total}`, [
          {text: 'Pasar al siguiente', primary: true, action: () => { const nextId = state.sessionQueue[state.sessionIndex]; go('exercise', {currentExercise: nextId, phase: 0, seconds: 30}); }},
          {text: 'Pausar sesión', action: () => { /* queda parado en este ejercicio */ }}
        ]);
      } else {
        // Sesión completa
        const doneSessionId = state.currentSession.id;
        if (!state.completedSessions.includes(doneSessionId)) {
          state.completedSessions.push(doneSessionId);
          store.set('completedSessions', state.completedSessions);
          if (state.user) { try { await saveProfile({ completed_sessions: state.completedSessions }); } catch {} }
        }
        state.sessionQueue = []; state.sessionIndex = 0; state.currentSession = null; state.currentWeek = null;
        showSessionModal('✅ ¡Sesión completada!', 'Buen trabajo. Descansá y volvé mañana para la próxima.', [
          {text: 'Volver al programa', primary: true, action: () => go('pathology')}
        ]);
      }
    } else {
      toast('Ejercicio completado y guardado');
    }
  }
  function showSessionModal(title, text, actions) {
    const layer = document.createElement('div'); layer.className = 'modal-layer';
    const btns = actions.map((a,i)=>`<button class="btn ${a.primary?'btn-primary':'btn-light'}" data-action="${i}">${a.text}</button>`).join('');
    layer.innerHTML = `<div class="modal"><h2>${title}</h2><p class="muted">${text}</p><div class="modal-actions">${btns}</div></div>`;
    document.body.append(layer);
    layer.querySelectorAll('[data-action]').forEach(b => b.onclick = () => { const i = parseInt(b.dataset.action); layer.remove(); actions[i].action(); });
  }
  async function toggleFavorite(){
    const id=state.currentExercise,i=state.favorites.indexOf(id);
    if(i>=0)state.favorites.splice(i,1);else state.favorites.push(id);
    store.set('favorites',state.favorites);
    if(state.user) await saveProfile({favorites:state.favorites});
    render();toast(i>=0?'Eliminado de favoritos':'Guardado en favoritos');
  }
  function premiumModal(){
    if(state.premium){
      const layer=document.createElement('div');layer.className='modal-layer';
      layer.innerHTML=`<div class="modal"><span class="pill pill-premium">SpineFlow Premium</span><h2>Tu plan está activo</h2><p class="muted">Tenés acceso completo a los 100 ejercicios y las 14 patologías. Si necesitás gestionar tu suscripción, ingresá a tu cuenta de Mercado Pago.</p><div class="modal-actions"><button class="btn btn-light" data-close>Cerrar</button></div></div>`;
      document.body.append(layer);$('[data-close]',layer).onclick=()=>layer.remove();
    } else {
      window.location.href='/planes.html';
    }
  }
  function toast(message){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.append(el);setTimeout(()=>el.remove(),2800)}
  init();
})();
