const CACHE='krua-flow-attendance-v7-portal';
const SHELL=['./','./index.html','./manifest.webmanifest','./config.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.pathname.endsWith('/admin.html')||u.pathname.endsWith('/register.html')||u.pathname.endsWith('/dashboard.html')||u.pathname.endsWith('/leave.html')||u.pathname.endsWith('/portal.html')||u.pathname.endsWith('/manager.html')||u.pathname.endsWith('/schedule.html')||u.pathname.endsWith('/admin-settings.html')){
    e.respondWith(fetch(new Request(e.request,{cache:'no-store'})));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
