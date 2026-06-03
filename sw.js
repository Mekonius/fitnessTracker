const CACHE = "loft-v5";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith("http")) return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const c=res.clone(); caches.open(CACHE).then(ch=>ch.put(e.request,c)); }
    return res;
  }).catch(async () => { const c=await caches.match(e.request); return c||new Response("Offline",{status:503}); }));
});
