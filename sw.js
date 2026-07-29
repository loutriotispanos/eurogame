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
var CACHE = "elg-v69";  /* Four fixes. (1) Path Between and Club Reveal lose their autocomplete — in a game about naming the link, a list of candidate players (or of the twenty-odd clubs) was close to printing the answer. Typed text now resolves on its own: exact, or a partial only one name matches; anything else is reported and costs NO guess, since only a resolved name reaches the board. (2) Leaving a view now closes its dialogs — the how-to auto-opens on a game's first visit, and going Back without dismissing it left the modal floating over the hub. (3) Higher or Lower daily passes at 7/10 (was 8). (4) Odd One Out daily passes at 3/5 (was 4). Previously, v68 — Feedback opens a small modal instead of navigating straight to a mailto:. The bare mailto was a silent dead end — it only resolves if the OS has a default mail app registered, and a machine whose mail lives in a browser tab has none, so clicking did nothing at all with no way to tell. The modal always shows the address, with Copy address (works regardless of what's installed) alongside Open mail app (still prefills version + screen). Previously, v67 — Feedback gets a corner icon on the hub, because the colophon link alone was unfindable: the home view is built to FILL the viewport, so its footer sat at or below the fold — on a phone you had to scroll a screen that is designed not to scroll. The icon takes the free LEFT slot beside the theme toggle rather than becoming a third right-hand icon, which at 375px reaches the centred masthead. Previously, v66 — "Send feedback" in the colophon — a prefilled mailto whose diagnostic footer reports the version read from Cache Storage, i.e. the build the reporter's phone is ACTUALLY running, which for an offline-first PWA is often not the newest. The address is assembled at runtime so it never sits in the page source for scrapers; a test enforces that. Previously, v65 — Renamed the site to Euroball, ahead of euroballgames.com: masthead, <title>, apple-mobile-web-app-title, and the PWA manifest — which still installed to the home screen as "EuroGuess" and described a single Wordle-style game long after the site became an eleven-game hub, so every shared link undersold it. Mystery Player's share line now names the GAME, like the other ten do, rather than the site. og-image.png regenerated: "EUROBALL" sets on one line, and the card lists games instead of one game's modes. Also carries the v64 typographic pass if you skipped it: */
/* v64, if you skipped it — Typographic pass over the whole sheet: one type scale (--t-*) with tracking in em, one red and one green instead of five near-shades, 2px corners everywhere, and night mode re-inked from those tokens rather than forty hand-patched overrides. Fixes the tab underline (a 999px button radius was bending it into a swash), the emoji in the search field and colophon, the hub pack squashing tiles below a legible size on small phones, Connections' square tiles, the mid-word masthead splits (Rec|ords, Connect|ions), and grid heads breaking to "PANATHIN / AIKOS". Also fills in career timelines for 52 players who had none (49 rostered legends + 3 actives), which re-deals the generated Grid, Path Between, Connections and Odd One Out sets. */
var ASSETS = [
  "./", "index.html", "players.js", "legends.js", "careers.js", "lineups.js", "puzzles.js", "oddones.js", "grids.js", "paths.js",
  "game.js", "playerid.js", "completefive.js", "connections.js", "careerorder.js", "thegrid.js", "clubreveal.js", "pathbetween.js", "oddoneout.js", "higherlower.js", "rostermaster.js", "records.js", "archive.js", "app.js",
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
