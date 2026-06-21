const cacheName = "pure-grow-farm-v1";
const filesToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./app/icon-192.png",
  "./app/icon-512.png",
  "./mushroom/pgf logo.png",
  "./mushroom/home.png",
  "./mushroom/farm.jpeg",
  "./mushroom/bulk.png",
  "./mushroom/oyster powder.png",
  "./mushroom/oyst dry.webp",
  "./mushroom/7.jpg",
  "./mushroom/8.jpg",
  "./mushroom/9.jpg",
  "./mushroom/10.jpg",
  "./mushroom/11.jpg",
  "./mushroom/12.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(filesToCache)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
