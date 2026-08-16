const CACHE = "loft-v6";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  const url = new URL(req.url);
  // Egne sider og scripts hentes uden om browserens HTTP-cache, ellers kan iOS
  // blive ved med at levere en gammel index.html efter et deploy.
  const fresh = req.mode === "navigate" ||
    (url.origin === self.location.origin && /(\/|\.html|\.js|\.json|\.txt)$/.test(url.pathname));
  e.respondWith((async () => {
    try {
      const res = await fetch(fresh ? new Request(url.href, {cache:"reload", credentials:"same-origin"}) : req);
      if (res.ok) { const c = res.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); }
      return res;
    } catch (err) {
      const c = await caches.match(req);
      return c || new Response("Offline", {status:503});
    }
  })());
});
