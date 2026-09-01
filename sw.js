const CACHE='spineflow-v14';

self.addEventListener('install',()=>self.skipWaiting());

self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);

  // Nunca interceptar Supabase ni login
  if(u.hostname.endsWith('supabase.co')||u.pathname==='/login'||u.pathname==='/login.html')return;

  // Imágenes de secuencias: cache-first (pesan y no cambian)
  if(u.pathname.startsWith('/media/sequences/')){
    e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));}return r;})));
    return;
  }

  // Todo lo demás: network-first
  e.respondWith(
    fetch(e.request,{cache:'no-store'}).then(r=>{
      if(r.ok&&!r.redirected){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
      return r;
    }).catch(()=>caches.match(e.request))
  );
});
