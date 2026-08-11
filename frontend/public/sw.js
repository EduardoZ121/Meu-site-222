/* Limpa service workers antigos (Emergent / cache partido). */
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      self.registration.unregister(),
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      }),
    ]).then(function () {
      return self.clients.matchAll({ type: "window" }).then(function (clients) {
        clients.forEach(function (client) {
          if (client.url && client.navigate) client.navigate(client.url);
        });
      });
    })
  );
});
