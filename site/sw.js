// Rede primeiro: abre sempre a versão mais recente; sem internet usa a última cópia guardada.
// Os dados (Supabase) nunca passam por aqui.
const CACHE = "amatec-oficina-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await caches.match("./") : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
