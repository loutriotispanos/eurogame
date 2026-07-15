/*
 * Service worker — caches the whole app so it runs OFFLINE once installed
 * (works with your PC off, even if the host is down).
 *
 * IMPORTANT: bump CACHE (e.g. elg-v2) whenever you change any cached file,
 * otherwise installed phones keep serving the old version from cache.
 *
 * Note: service workers only run over HTTPS (or localhost) — not over a plain
 * http:// LAN address. So offline install works on the hosted (https) site.
 */
var CACHE = "elg-v43";  /* Active careers batch: +25 researched paths (Maccabi Tel Aviv 14 + Fenerbahce 11); careers 223->248; regenerated paths/grids/puzzles */
var ASSETS = [
  "./", "index.html", "players.js", "legends.js", "careers.js", "lineups.js", "puzzles.js", "grids.js", "paths.js",
  "game.js", "playerid.js", "completefive.js", "connections.js", "careerorder.js", "thegrid.js", "clubreveal.js", "pathbetween.js", "app.js",
  "manifest.webmanifest", "icon-192.png", "icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function putCache(req, resp) { var copy = resp.clone(); caches.open(CACHE).then(function (c) { try { c.put(req, copy); } catch (err) {} }); return resp; }

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var path = new URL(e.request.url).pathname;
  // App shell (HTML/JS/CSS + navigations) → NETWORK-FIRST so a plain reload always
  // shows the latest code when online; fall back to cache only when offline.
  var isShell = e.request.mode === "navigate" || path === "/" || /\.(?:html|js|css)$/.test(path);
  if (isShell) {
    e.respondWith(
      fetch(e.request).then(function (resp) { return putCache(e.request, resp); })
        .catch(function () { return caches.match(e.request).then(function (hit) { return hit || caches.match("index.html"); }); })
    );
    return;
  }
  // Static assets (images, manifest, icons) → CACHE-FIRST (they rarely change).
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (resp) { return putCache(e.request, resp); })
        .catch(function () { return caches.match("index.html"); });
    })
  );
});
