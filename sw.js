const CACHE='spineflow-v12-clean';
const CORE=['/','/index.html','/assets/css/app.css','/assets/js/app.js','/data/exercises.json','/data/regions.json','/data/v11-static-sequences.json','/manifest.webmanifest','/media/coach/mi-profe.webp','/planes.html','/gracias.html'];

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));

self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);

  // Nunca interceptar Supabase ni el login: auth siempre va directo a la red.
  if(u.hostname.endsWith('supabase.co')||u.pathname==='/login'||u.pathname==='/login.html'){
    return; // el navegador maneja la petición normalmente
  }

  const fresh=e.request.mode==='navigate'||u.pathname.startsWith('/assets/js/')||u.pathname.startsWith('/data/');

  if(fresh){
    e.respondWith(
      fetch(e.request,{cache:'no-store'}).then(r=>{
        const copy=r.clone();                                    // clonar ANTES de devolver
        caches.open(CACHE).then(c=>c.put(e.request,copy));       // guardar el clon
        return r;                                                 // devolver el original intacto
      }).catch(()=>caches.match(e.request).then(h=>h||caches.match('/index.html')))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request)));
});
