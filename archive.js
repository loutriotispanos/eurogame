/* Archive — replay the recent editions. Every daily is date-seeded and stores
 * its state under a per-date key, so any past day's puzzles can be re-dealt
 * exactly as they ran. This view lists the last 14 days × all ten dailies with
 * their played state; tapping one opens that game in archive mode (via each
 * game's goArchive) — archive replays never touch streaks or daily stats.
 * Exposes window.Archive. */
(function () {
  "use strict";
  var DAYS = 14;                     // recent editions listed (yesterday first)

  var GAMES = [
    { id: "mystery",      name: "Mystery Player",    k: "elg:daily:" },
    { id: "playerid",     name: "Player ID",         k: "elg:pid:daily:" },
    { id: "completefive", name: "Complete the Five", k: "elg:c5:daily:" },
    { id: "connections",  name: "Connections",       k: "elg:cn:daily:" },
    { id: "careerorder",  name: "Career Order",      k: "elg:co:daily:" },
    { id: "thegrid",      name: "The Grid",          k: "elg:gr:daily:" },
    { id: "clubreveal",   name: "Club Reveal",       k: "elg:cv:daily:" },
    { id: "pathbetween",  name: "Path Between",      k: "elg:pb:daily:" },
    { id: "oddoneout",    name: "Odd One Out",       k: "elg:oo:daily:" },
    { id: "higherlower",  name: "Higher or Lower",   k: "elg:hl:daily:" }
  ];

  function $(id) { return document.getElementById(id); }
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  function dates() {                 // yesterday back through DAYS days
    var out = [];
    for (var i = 1; i <= DAYS; i++) { var d = new Date(); d.setDate(d.getDate() - i); out.push(dateStr(d)); }
    return out;
  }
  function niceDate(iso) {
    try {
      var p = iso.split("-");
      return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    } catch (e) { return iso; }
  }
  function stateFor(key, d) {        // "ready" | "playing" | "won" | "lost"
    var v = lsGet(key + d, null);
    if (!v) return "ready";
    if (!v.done) return "playing";
    return v.won ? "won" : "lost";
  }

  function render() {
    var el = $("archive-body"); if (!el) return;
    el.innerHTML = "";
    dates().forEach(function (d) {
      var head = document.createElement("div");
      head.className = "rec-sect";
      head.textContent = niceDate(d);
      el.appendChild(head);
      var row = document.createElement("div");
      row.className = "arch-row";
      GAMES.forEach(function (g) {
        var st = stateFor(g.k, d);
        var b = document.createElement("button");
        b.type = "button";
        b.className = "arch-chip " + st;
        b.innerHTML = "<span class='arch-name'>" + g.name + "</span>" +
          "<span class='arch-st'>" + (st === "won" ? "✓" : st === "lost" ? "✗" : st === "playing" ? "…" : "·") + "</span>";
        b.setAttribute("aria-label", g.name + " — " + niceDate(d) + " — " +
          (st === "won" ? "solved" : st === "lost" ? "missed" : st === "playing" ? "in progress" : "not played"));
        b.addEventListener("click", function () {
          if (window.Hub && window.Hub._openArchive) window.Hub._openArchive(g.id, d);
        });
        row.appendChild(b);
      });
      el.appendChild(row);
    });
  }

  window.Archive = {
    onShow: render,
    _dates: dates,
    _stateFor: stateFor,
    _render: render
  };
})();
