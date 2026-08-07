const CACHE='spineflow-v9-rc9-audit-fixes';
const CORE=["/", "/index.html", "/assets/css/app.css", "/assets/js/plus60-loader.js", "/assets/js/rc9-audit-fixes.js", "/assets/js/app.js", "/data/exercises.json", "/data/regions.json", "/data/plus60-exercises.json", "/data/plus60-region.json", "/data/plus60-routines.json", "/manifest.webmanifest", "/media/coach/mi-profe.webp", "/assets/img/plus60/s60_01_sentarse_con_apoyo.png", "/assets/img/plus60/s60_02_sentarse_sin_manos.png", "/assets/img/plus60/s60_03_mini_sentadilla_con_apoyo.png", "/assets/img/plus60/s60_04_estocada_asistida.png", "/assets/img/plus60/s60_05_step_up_escalon_bajo.png", "/assets/img/plus60/s60_06_abduccion_cadera_con_apoyo.png", "/assets/img/plus60/s60_07_elevacion_bilateral_talones.png", "/assets/img/plus60/s60_08_marcha_elevacion_rodillas.png", "/assets/img/plus60/s60_09_transferencia_peso_lateral.png", "/assets/img/plus60/s60_10_equilibrio_unipodal_asistido.png", "/assets/img/plus60/s60_11_abdominal_isometrico_en_silla.png", "/assets/img/plus60/s60_12_elevacion_alternada_rodillas_sentado.png", "/assets/img/plus60/s60_13_retraccion_escapular_apertura_toracica.png", "/assets/img/plus60/s60_14_wall_slide.png", "/assets/img/plus60/s60_15_rotacion_toracica_controlada.png"];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;

  const url=new URL(event.request.url);
  const isFreshCritical =
    event.request.mode==='navigate' ||
    url.pathname.startsWith('/assets/js/') ||
    url.pathname.startsWith('/data/');

  if(isFreshCritical){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          return response;
        })
        .catch(()=>caches.match(event.request).then(hit=>hit||caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit=>{
      if(hit) return hit;
      return fetch(event.request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      }).catch(()=>caches.match('/index.html'));
    })
  );
});
