const CACHE='spineflow-v14';
const CORE=['/','/app','/assets/css/app.css','/assets/js/app.js','/data/exercises.json','/data/regions.json','/data/v11-static-sequences.json','/data/programs.json','/manifest.webmanifest','/media/coach/mi-profe.webp'];

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));

self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);

  // Nunca interceptar Supabase ni login: auth siempre va directo a la red.
  if(u.hostname.endsWith('supabase.co')||u.pathname==='/login'||u.pathname==='/login.html'){
    return;
  }

  // Imágenes de secuencias: cache-first (pesan y no cambian)
  if(u.pathname.startsWith('/media/sequences/')){
    e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return r;})));
    return;
  }

  // Todo lo demás: network-first (CSS, JS, data, HTML, coach, etc.)
  e.respondWith(
    fetch(e.request,{cache:'no-store'}).then(r=>{
      if(r.ok&&!r.redirected){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
      return r;
    }).catch(()=>caches.match(e.request))
  );
});
