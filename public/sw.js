self.addEventListener('install', (e)=>{ e.waitUntil(caches.open('td-v1').then(c=>c.addAll(['/','/offline']))); });
self.addEventListener('fetch', (e)=>{
e.respondWith(
caches.match(e.request).then(res=> res || fetch(e.request).then(r=>{ const copy=r.clone(); caches.open('td-v1').then(c=>c.put(e.request, copy)); return r; }).catch(()=>caches.match('/offline')) )
);
});