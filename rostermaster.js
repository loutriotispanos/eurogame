/* Roster Master — the completion board, not a daily game. Every EuroLeague
 * roster since 2000-01: pick a SEASON, then a club, and name its whole roster
 * from memory into an empty grid headed Guards / Forwards / Centers. Pure
 * RECALL: one input, NO autocomplete (typing a match auto-fills its slot; a
 * unique surname is enough). Each club-season board saves on its own; Clear
 * wipes a board but your best score (%) survives. A full board is gold ★ for
 * good; every board of a season, or every season of a club, turns it royal
 * purple; all of them is the crown. This season's boards are window.PLAYERS
 * (the cross-checked rosters); the completed seasons load on demand from
 * history.js. The EuroCup has this season only. Exposes window.RosterMaster. */
(function () {
  "use strict";

  var PLAYERS = window.PLAYERS || [];
  var TEAMS = (function () { var s = {}; PLAYERS.forEach(function (p) { s[p.team] = 1; }); return Object.keys(s).sort(); })();

  // Club colours + the official 3-letter code. Since v101 the tiles show each
  // club's crest (crests/<slug>.webp, owner's choice; see crests/SOURCES.json),
  // and this badge is what a tile falls back to if a crest can't load, or for
  // a club with no crest file.
  var CLUB_META = {
    "Anadolu Efes":     { code: "EFS", bg: "#003268", fg: "#ffffff" },
    "ASVEL":            { code: "ASV", bg: "#58585a", fg: "#ffffff" },
    "Baskonia":         { code: "BAS", bg: "#002a5c", fg: "#ffffff" },
    "Bayern Munich":    { code: "MUN", bg: "#dc052d", fg: "#ffffff" },
    "Besiktas":         { code: "BJK", bg: "#000000", fg: "#ffffff" },
    "Crvena Zvezda":    { code: "CZV", bg: "#e2231a", fg: "#ffffff" },
    "Dubai BC":         { code: "DUB", bg: "#101820", fg: "#c9a22b" },
    "FC Barcelona":     { code: "BAR", bg: "#154284", fg: "#ffffff" },
    "Fenerbahce":       { code: "FEN", bg: "#163962", fg: "#ffd100" },
    "Hapoel Tel Aviv":  { code: "HTA", bg: "#e2231a", fg: "#ffffff" },
    "Maccabi Tel Aviv": { code: "MTA", bg: "#ffcd00", fg: "#003a70" },
    "Olimpia Milano":   { code: "MIL", bg: "#ed1c24", fg: "#ffffff" },
    "Olympiacos":       { code: "OLY", bg: "#d5121e", fg: "#ffffff" },
    "Panathinaikos":    { code: "PAO", bg: "#007a33", fg: "#ffffff" },
    "Paris Basketball": { code: "PRS", bg: "#3d3d3d", fg: "#ffffff" },
    "Partizan":         { code: "PAR", bg: "#1d1a14", fg: "#ffffff" },
    "Real Madrid":      { code: "MAD", bg: "#eeb211", fg: "#1d1a14" },
    "Valencia":         { code: "VAL", bg: "#ee7623", fg: "#1d1a14" },
    "Virtus Bologna":   { code: "VIR", bg: "#1d1a14", fg: "#ffd100" },
    "Zalgiris Kaunas":  { code: "ZAL", bg: "#00685e", fg: "#ffffff" },
    // EuroCup clubs: the official three-letter codes (PAOK is PAK, since PAO is
    // Panathinaikos), on the club colour, text only
    "Aris Thessaloniki":  { code: "ARI", bg: "#ffd200", fg: "#1d1a14" },
    "Derthona Tortona":   { code: "TRT", bg: "#1f3f8f", fg: "#ffffff" },
    "Bahcesehir College": { code: "BAH", bg: "#0d1f5c", fg: "#ffffff" },
    "Balkan Botevgrad":   { code: "BLK", bg: "#008c45", fg: "#ffffff" },
    "Bosna Sarajevo":     { code: "BOS", bg: "#1c2b5a", fg: "#ffffff" },
    "Buducnost":          { code: "BUD", bg: "#004a99", fg: "#ffffff" },
    "Cedevita Olimpija":  { code: "LJU", bg: "#00843d", fg: "#ffffff" },
    "JL Bourg-en-Bresse": { code: "BOU", bg: "#d6001c", fg: "#ffffff" },
    "Trento":             { code: "TRN", bg: "#1d1a14", fg: "#ffffff" },
    "Hapoel Jerusalem":   { code: "JER", bg: "#d71920", fg: "#ffffff" },
    "Manresa":            { code: "MAN", bg: "#c8102e", fg: "#ffffff" },
    "La Laguna Tenerife": { code: "TNF", bg: "#ffcc00", fg: "#1d1a14" },
    "Le Mans":            { code: "LEM", bg: "#f15a24", fg: "#ffffff" },
    "Lietkabelis":        { code: "LKB", bg: "#7a1f3d", fg: "#ffffff" },
    "London Lions":       { code: "LLI", bg: "#1d1a14", fg: "#ffffff" },
    "Maxima Roma":        { code: "MRO", bg: "#e6a532", fg: "#1d1a14" },
    "Napoli Basketball":  { code: "NAP", bg: "#12a0d7", fg: "#ffffff" },
    "Neptunas":           { code: "KLA", bg: "#1f3a7a", fg: "#ffffff" },
    "Niners Chemnitz":    { code: "NIN", bg: "#1d1a14", fg: "#ffffff" },
    "PAOK":               { code: "PAK", bg: "#000000", fg: "#ffffff" },
    "Ratiopharm Ulm":     { code: "ULM", bg: "#ef7d00", fg: "#ffffff" },
    "San Pablo Burgos":   { code: "BGS", bg: "#1e4fa3", fg: "#ffffff" },
    "Riga Zelli":         { code: "RIG", bg: "#e6007e", fg: "#ffffff" },
    "Roma Basketball":    { code: "BCR", bg: "#3d3d3d", fg: "#ffffff" },
    "Rostock Seawolves":  { code: "RTK", bg: "#1b2a5c", fg: "#ffffff" },
    "Siauliai":           { code: "SIA", bg: "#f0a030", fg: "#1d1a14" },
    "Skyliners Frankfurt":{ code: "FRA", bg: "#005aa9", fg: "#ffffff" },
    "Slask Wroclaw":      { code: "WRO", bg: "#00843d", fg: "#ffffff" },
    "Tofas":              { code: "BUR", bg: "#3dbb3d", fg: "#1d1a14" },
    "Turk Telekom":       { code: "TTK", bg: "#1a8fc7", fg: "#ffffff" },
    "Cluj-Napoca":        { code: "CLU", bg: "#1d1a14", fg: "#ffffff" },
    "Reyer Venezia":      { code: "VNC", bg: "#7a1c2e", fg: "#ffffff" }
  };
  // An archive club with no colours here gets the feed's own code (CSK, TRE…).
  function clubMeta(t, feedCode) {
    if (CLUB_META[t]) return CLUB_META[t];
    var code = feedCode || t.split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 3).toUpperCase();
    return { code: code || "?", bg: "#6e6656", fg: "#ffffff" };
  }
  function badgeHTML(t, feedCode) {
    var m = clubMeta(t, feedCode);
    var url = crestURL(t);
    if (!url) return "<span class='rm-badge' style='background:" + m.bg + ";color:" + m.fg + "' aria-hidden='true'>" + m.code + "</span>";
    // The club's crest (crests/<slug>.webp, the same files as the club pages),
    // on a light plate so black crests read in night mode. If the file ever
    // fails to load, the plate turns into the colour badge above: its colours
    // and code ride along as CSS variables and a data attribute.
    return "<span class='rm-crest' style='--bb:" + m.bg + ";--bf:" + m.fg + "' data-code='" + m.code + "' aria-hidden='true'>" +
      "<img src='" + url + "' alt='' decoding='async' onerror=\"this.parentNode.className+=' off'\"></span>";
  }
  // Where a club's crest lives, from the site root that app.js fixes at load.
  // Clubs with a page have a crest (test.js checks every one); others get null.
  function crestURL(t) {
    var C = window.CLUBS, p = C && C.page ? C.page(t) : null;
    if (!p) return null;
    var root = (window.Hub && window.Hub._siteRoot) ? window.Hub._siteRoot() : "/";
    return root + "crests/" + p.slice("clubs/".length, -1) + ".webp";
  }

  // --- Full-screen picker -----------------------------------------------------
  // The tiles (seasons, or a season's clubs) fill what the viewport has left
  // under the header, the way the hub's game tiles do: try every column count,
  // keep the one whose tiles are largest while every tile stays readable (min
  // width and height per kind), and centre a short last row. Tracks are
  // half-columns (each tile spans two) so a partial row can start half a tile
  // in. On a screen too small to fit them all at the floor, the picker takes
  // the most columns that fit and scrolls.
  var MIN = { clubs: { w: 104, h: 118 }, seasons: { w: 84, h: 64 } }, GAP = 10;
  function layoutPicker() {
    var g = els.picker;
    if (!g || g.hidden || !g.getBoundingClientRect || !window.innerHeight) return;
    var n = g.children.length, W = g.clientWidth;
    if (!n || !W) return;
    var lim = MIN[view === "seasons" ? "seasons" : "clubs"], MIN_W = lim.w, MIN_H = lim.h;
    var top = g.getBoundingClientRect().top + (window.scrollY || 0);
    var below = els.pickerActions && !els.pickerActions.hidden && els.pickerActions.offsetHeight ? els.pickerActions.offsetHeight + 28 : 28;
    var H = window.innerHeight - top - below;
    var best = null;
    for (var c = 1; c <= n; c++) {
      var r = Math.ceil(n / c), tw = (W - GAP * (c - 1)) / c, th = (H - GAP * (r - 1)) / r;
      if (c > 1 && tw < MIN_W) break;
      var fits = th >= MIN_H, size = Math.min(tw, th);
      var better = !best || (fits !== best.fits ? fits
        : fits ? (size > best.size * 1.05 || (size >= best.size * 0.95 && c > best.c)) : c > best.c);
      if (better) best = { c: c, r: r, fits: fits, size: size, th: fits ? th : MIN_H, tw: tw };
    }
    g.style.gridTemplateColumns = "repeat(" + best.c * 2 + ", minmax(0, 1fr))";
    g.style.gridAutoRows = best.th.toFixed(1) + "px";
    g.style.setProperty("--rm-tile-h", best.th.toFixed(1) + "px");
    g.style.setProperty("--rm-tile-w", best.tw.toFixed(1) + "px");
    var rem = n % best.c;
    for (var i = 0; i < n; i++) g.children[i].style.gridColumnStart = "";
    if (rem) g.children[n - rem].style.gridColumnStart = String(best.c - rem + 1);
  }

  // --- The boards ----------------------------------------------------------------
  // One board per club per season. The current season is ours (players.js, the
  // cross-checked rosters every game plays by); every completed EuroLeague season
  // since 2000-01 comes from history.js, the official rosters, loaded on demand the
  // first time Roster Master opens (it is the one file here that's heavy, and no
  // other game needs it yet). The EuroCup has no history: one season, as before.
  var CURRENT = "2026-27";
  var HISTORIC = !(window.ELG_COMP && window.ELG_COMP.id === "eurocup");
  var POS_ORDER = ["Guard", "Forward", "Center", ""];
  var POS_LABEL = { Guard: "Guards", Forward: "Forwards", Center: "Centers", "": "Position not listed" };

  var BOARDS = {};                    // id → { id, season, club, title, code, roster }
  var BY_SEASON = {};                 // season → [ids], by title
  var BY_CLUB = {};                   // club → [ids], every season it played
  var SEASONS = [CURRENT];            // newest first
  function bid(season, c) { return season + "|" + c; }
  function byNumber(a, b) {
    var x = a.number == null ? 999 : a.number, y = b.number == null ? 999 : b.number;
    return x - y || (a.name < b.name ? -1 : 1);
  }
  function addBoard(season, c, title, code, roster) {
    var id = bid(season, c);
    BOARDS[id] = { id: id, season: season, club: c, title: title || c, code: code || null, roster: roster.sort(byNumber) };
    (BY_SEASON[season] = BY_SEASON[season] || []).push(id);
    (BY_CLUB[c] = BY_CLUB[c] || []).push(id);
  }
  TEAMS.forEach(function (t) {
    addBoard(CURRENT, t, t, null, PLAYERS.filter(function (p) { return p.team === t; })
      .map(function (p) { return { name: p.name, number: p.number, position: p.position }; }));
  });
  var TOTAL = PLAYERS.length;         // the current season's names (hub chip, records)

  // history.js: people once, boards pointing at them by index (build_history.js).
  var hist = { state: HISTORIC ? "idle" : "none", waiting: [] };   // idle → loading → ready | failed
  function ingest(H) {
    if (hist.state === "ready") return;
    H.boards.forEach(function (b) {
      var season = H.seasons[b[0]];
      if (season === CURRENT || BOARDS[bid(season, b[1])]) return;      // the current season is always ours
      addBoard(season, b[1], b[2], b[4], b[3].map(function (x) {
        var p = H.people[x[0]];
        return { name: p[0], number: x[1], position: p[2] || "" };
      }));
    });
    H.seasons.slice().reverse().forEach(function (s) { if (s !== CURRENT && BY_SEASON[s]) SEASONS.push(s); });
    Object.keys(BY_SEASON).forEach(function (s) { BY_SEASON[s].sort(function (a, b) { return BOARDS[a].title < BOARDS[b].title ? -1 : 1; }); });
    hist.state = "ready";
  }
  // The file itself comes through the shared loader (competition.js), so The
  // Grid and Six of a Kind use the same copy.
  function ensureHistory(cb) {
    if (hist.state === "none" || hist.state === "ready" || hist.state === "failed") { cb(); return; }
    if (window.HISTORY) { ingest(window.HISTORY); cb(); return; }
    hist.waiting.push(cb);
    if (hist.state === "loading") return;
    hist.state = "loading";
    function done() {
      if (window.HISTORY) ingest(window.HISTORY); else hist.state = "failed";
      var w = hist.waiting; hist.waiting = [];
      w.forEach(function (f) { f(); });
    }
    if (window.ELG_HISTORY && window.ELG_HISTORY.load) window.ELG_HISTORY.load(done); else done();
  }
  // Purple and the crown are about the whole archive, so they wait for it.
  function whole() { return hist.state === "ready" || hist.state === "none"; }

  // --- Forgiving name matching -------------------------------------------------
  // A guess hits when its normalised form equals one of a player's aliases:
  // the full name, the name without a Jr/II suffix, the surname, the last two
  // tokens ("dos santos"), and initials merged ("T.J." → "tj"). Case, accents,
  // dots, hyphens and apostrophes never matter. Namesakes in the archive carry
  // their birth year ("Petar Popovic (b. 1979)"); that is never typed.
  var SUFFIX = { jr: 1, sr: 1, ii: 1, iii: 1, iv: 1 };
  function norm(s) {
    s = String(s).toLowerCase();
    try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {}
    return s.replace(/['’]/g, "").replace(/[.\-]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  }
  function mergeInitials(tokens) {    // ["t","j","shorts"] → ["tj","shorts"]
    var out = [], buf = "";
    tokens.forEach(function (t) { if (t.length === 1) buf += t; else { if (buf) { out.push(buf); buf = ""; } out.push(t); } });
    if (buf) out.push(buf);
    return out;
  }
  function aliasesOf(name) {
    var full = norm(String(name).replace(/\s*\(b\. \d{4}\)$/, "")), toks = full.split(" ");
    var base = toks.slice();
    while (base.length > 1 && SUFFIX[base[base.length - 1]]) base.pop();
    var out = {};
    out[full] = 1;
    out[base.join(" ")] = 1;
    out[base[base.length - 1]] = 1;                              // surname
    if (base.length >= 2) out[base.slice(-2).join(" ")] = 1;     // "dos santos"
    out[mergeInitials(toks).join(" ")] = 1;
    out[mergeInitials(base).join(" ")] = 1;
    return out;
  }
  var ALIAS = {};
  function alias(name) { return ALIAS[name] || (ALIAS[name] = aliasesOf(name)); }

  // --- Storage -------------------------------------------------------------------
  // One save per board, keyed by season and club. Before the archive the keys had
  // no season (elg:rm:board:<club>); those are this season's and move over once.
  var K = {
    board: function (id) { return "elg:rm:board:" + id.replace("|", ":"); },
    best: function (id) { return "elg:rm:best:" + id.replace("|", ":"); },
    revealed: function (id) { return "elg:rm:rev:" + id.replace("|", ":"); },
    open: "elg:rm:open", seen: "elg:rm:seenhelp", tally: "elg:rm:tally"
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function migrate() {
    var ls; try { ls = window.localStorage; } catch (e) { return; }
    if (!ls) return;
    TEAMS.forEach(function (t) {
      var id = bid(CURRENT, t);
      [["elg:rm:board:" + t, K.board(id)], ["elg:rm:best:" + t, K.best(id)], ["elg:rm:rev:" + t, K.revealed(id)]].forEach(function (m) {
        try {
          var old = ls.getItem(m[0]);
          if (old == null) return;
          if (ls.getItem(m[1]) == null) ls.setItem(m[1], old);
          ls.removeItem(m[0]);
        } catch (e) {}
      });
    });
    var open = lsGet(K.open, null);
    if (typeof open === "string") lsSet(K.open, { s: CURRENT, c: open });
  }

  var els = {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var view = "seasons";               // "seasons" | "clubs" | "board"
  var season = CURRENT;               // the season whose clubs are listed
  var board = null;                   // the open board, or null
  var named = {};                     // names filled on the open board
  var revealed = {};                  // …and the ones given away by Reveal missing (they never count)
  var lastFocus = null, inited = false;

  function roster(id) { return BOARDS[id].roster; }
  function validNames(id) { var v = {}; roster(id).forEach(function (p) { v[p.name] = 1; }); return v; }
  function loadList(key, id) {        // roster edits drop stale names silently
    var v = validNames(id), out = {};
    (lsGet(key, []) || []).forEach(function (n) { if (v[n]) out[n] = 1; });
    return out;
  }
  function saveBoard() { if (board) lsSet(K.board(board.id), Object.keys(named)); }
  // Revealed names are kept with the board, so a reload can't un-reveal them and
  // let them be typed in for credit. Clear board is the way to start over.
  function saveRevealed() { if (board) lsSet(K.revealed(board.id), Object.keys(revealed)); }
  function savedCount(id) {
    if (board && id === board.id) return Object.keys(named).length;
    var v = validNames(id), n = 0;
    (lsGet(K.board(id), []) || []).forEach(function (x) { if (v[x]) n++; });
    return n;
  }
  function getBest(id) { var b = lsGet(K.best(id), null); return (b && typeof b.n === "number" && b.of) ? b : { n: 0, of: roster(id).length }; }
  function pct(b) { return Math.min(100, Math.round(100 * b.n / b.of)); }
  function bumpBest() {
    var n = Object.keys(named).length, b = getBest(board.id);
    if (n > b.n) lsSet(K.best(board.id), { n: n, of: roster(board.id).length });
  }
  // Gold ★ = this board was ever named in full (keys off best, so it SURVIVES a Clear).
  function everGold(id) { return getBest(id).n >= roster(id).length && roster(id).length > 0; }
  // Royal purple = every board of a season, or every season of a club, gold.
  function allGold(ids) { return ids.length > 0 && ids.every(everGold); }
  function seasonPurple(s) { return whole() && SEASONS.length > 1 && allGold(BY_SEASON[s] || []); }
  function clubPurple(c) { return whole() && SEASONS.length > 1 && allGold(BY_CLUB[c] || []); }

  // The archive-wide count. Kept in storage too, so the hub chip and the Records
  // page can show it without loading the archive.
  function tally() {
    var ids = Object.keys(BOARDS), gold = ids.filter(everGold).length;
    var clubs = Object.keys(BY_CLUB);
    var t = { boards: ids.length, gold: gold, seasons: SEASONS.length,
      seasonsDone: SEASONS.filter(function (s) { return allGold(BY_SEASON[s]); }).length,
      clubs: clubs.length, clubsDone: clubs.filter(function (c) { return allGold(BY_CLUB[c]); }).length };
    t.crown = whole() && gold === ids.length;
    if (whole()) lsSet(K.tally, t);
    return t;
  }
  function storedTally() { var t = lsGet(K.tally, null); return t && typeof t.gold === "number" ? t : null; }

  // --- Guessing -------------------------------------------------------------------
  // Returns "hit" | "dup" | "ambiguous" | "miss" | "empty". `loud` flashes feedback
  // for misses too (Enter); silent probing (while typing) only reacts to a hit.
  function numTag(p) { return p.number == null ? "" : " · #" + p.number; }
  function tryGuess(text, loud) {
    if (!board) return "empty";
    var g = norm(text);
    if (!g) return "empty";
    var fresh = [], done = [], given = [];
    board.roster.forEach(function (p) {
      if (!alias(p.name)[g]) return;
      (named[p.name] ? done : revealed[p.name] ? given : fresh).push(p);
    });
    if (fresh.length === 1) {
      var p = fresh[0];
      named[p.name] = 1;
      saveBoard(); bumpBest();
      renderBoard();
      var n = Object.keys(named).length, tot = board.roster.length;
      flash(n === tot ? "🎉 Full roster — " + tot + "/" + tot + "!" : "✓ " + p.name + numTag(p), "ok");
      say(p.name + " filled. " + n + " of " + tot + " named.");
      return "hit";
    }
    if (fresh.length > 1) { if (loud) flash("Two players match — be more specific.", "err"); return "ambiguous"; }
    if (done.length) { if (loud) flash("Already named.", "err"); return "dup"; }
    if (given.length) { if (loud) flash("Revealed, so that one doesn't count. Clear board to try the club again.", "err"); return "revealed"; }
    if (loud) flash("No match on this roster.", "err");
    return "miss";
  }

  // --- Clear (two-click arm, best survives) ----------------------------------------
  var armed = false;
  function disarmClear() { armed = false; if (els.clear) { els.clear.classList.remove("armed"); els.clear.textContent = "Clear board"; } }
  function onClear() {
    if (!board) return;
    if (!armed) { armed = true; els.clear.classList.add("armed"); els.clear.textContent = "Really clear?"; return; }
    performClear();
  }
  function performClear() {
    var b = getBest(board.id);
    named = {}; saveBoard(); revealed = {}; saveRevealed();
    disarmClear(); disarmReveal(); renderBoard();
    flash(b.n > 0 ? "Board cleared — best " + pct(b) + "% kept." : "Board cleared.", "ok");
    say("Board cleared.");
  }

  // --- Reveal missing (two-click arm) -------------------------------------------------
  // For when you are stuck: shows the players not yet named, in their slots, set
  // apart from the ones you got. They earn nothing (no points, no best, no gold),
  // and they stay shown until Clear board starts the club over.
  var armedReveal = false;
  function missing() { return board.roster.filter(function (p) { return !named[p.name] && !revealed[p.name]; }); }
  function disarmReveal() { armedReveal = false; if (els.reveal) { els.reveal.classList.remove("armed"); els.reveal.textContent = "Reveal missing"; } }
  function onReveal() {
    if (!board) return;
    var m = missing();
    if (!m.length) return;
    if (!armedReveal) { armedReveal = true; els.reveal.classList.add("armed"); els.reveal.textContent = "Show all " + m.length + "?"; return; }
    performReveal();
  }
  function performReveal() {
    var m = missing();
    m.forEach(function (p) { revealed[p.name] = 1; });
    saveRevealed(); disarmReveal(); disarmClear(); renderBoard();
    flash(m.length ? "Revealed " + m.length + ". They don't count; Clear board to try again." : "", "ok");
    say(m.length + " players revealed.");
  }

  // Clear ALL boards of the listed season — same contract: bests (and gold) survive.
  var armedAll = false;
  function disarmClearAll() { armedAll = false; if (els.clearAll) { els.clearAll.classList.remove("armed"); els.clearAll.textContent = "Clear all boards"; } }
  function onClearAll() {
    if (!armedAll) { armedAll = true; els.clearAll.classList.add("armed"); els.clearAll.textContent = "Really clear all " + (BY_SEASON[season] || []).length + "?"; return; }
    performClearAll();
  }
  function performClearAll() {
    (BY_SEASON[season] || []).forEach(function (id) { lsSet(K.board(id), []); lsSet(K.revealed(id), []); });
    if (board && board.season === season) { named = {}; revealed = {}; }
    disarmClearAll();
    renderPicker(); renderSummary();
    say("All " + season + " boards cleared. Best scores kept.");
  }

  // --- Rendering --------------------------------------------------------------------
  function flash(msg, cls) { if (!els.flash) return; els.flash.textContent = msg || ""; els.flash.className = "rm-flash" + (cls ? " " + cls : ""); }
  function say(msg) { if (els.sr) els.sr.textContent = msg; }
  function multi() { return SEASONS.length > 1 || hist.state === "loading" || hist.state === "failed"; }

  function renderSummary() {
    if (!els.summary) return;
    els.summary.className = "pid-stats";
    if (view === "seasons") {
      var t = tally();
      if (t.crown) { els.summary.textContent = "👑 Every roster, every season: Roster Master complete."; els.summary.className += " rm-crown-line"; return; }
      els.summary.textContent = hist.state === "loading" ? "Loading every season since 2000-01…"
        : hist.state === "failed" ? "The older seasons need a connection the first time. This season is here."
        : "Boards ★ " + t.gold + "/" + t.boards + " · Seasons complete " + t.seasonsDone + "/" + t.seasons +
          " · Clubs complete " + t.clubsDone + "/" + t.clubs;
      return;
    }
    var ids = BY_SEASON[season] || [], total = 0, of = 0, bestTotal = 0, full = 0;
    ids.forEach(function (id) {
      var n = savedCount(id), tot = roster(id).length; total += n; of += tot;
      bestTotal += Math.min(getBest(id).n, tot);
      if (n >= tot) full++;
    });
    var pcNow = Math.round(100 * total / of), pcBest = Math.round(100 * bestTotal / of);
    els.summary.textContent = (multi() ? season + " · " : "") + "Named " + total + "/" + of + " (" + pcNow + "%)" +
      (pcBest > pcNow ? " · Best " + pcBest + "%" : "") +
      " · Clubs complete " + full + "/" + ids.length;
  }
  function renderSeasons() {
    SEASONS.forEach(function (s) {
      var ids = BY_SEASON[s], gold = ids.filter(everGold).length;
      var started = gold > 0 || ids.some(function (id) { return savedCount(id) > 0 || getBest(id).n > 0; });
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rm-chip rm-season" + (seasonPurple(s) ? " purple" : started ? " started" : "");
      btn.innerHTML = "<span class='rm-chip-text'><span class='rm-chip-club'>" + esc(s) + "</span>" +
        "<span class='rm-chip-meta'>" + (s === CURRENT ? "Now · " : "") + gold + "/" + ids.length + " ★</span></span>";
      btn.setAttribute("aria-label", s + (s === CURRENT ? ", this season" : "") + ": " + gold + " of " + ids.length + " clubs complete");
      btn.addEventListener("click", function () { showClubs(s); });
      els.picker.appendChild(btn);
    });
    if (hist.state === "loading") {
      var w = document.createElement("div"); w.className = "rm-chip rm-season rm-wait"; w.textContent = "Loading…";
      els.picker.appendChild(w);
    }
  }
  function renderClubs() {
    (BY_SEASON[season] || []).forEach(function (id) {
      var B = BOARDS[id], n = savedCount(id), tot = B.roster.length, b = getBest(id);
      var btn = document.createElement("button");
      btn.type = "button";
      // Purple = the club is complete in every season; gold = this board is.
      btn.className = "rm-chip" + (clubPurple(B.club) ? " purple" : everGold(id) ? " gold" : n > 0 ? " started" : "");
      btn.innerHTML = badgeHTML(B.club, B.code) +
        "<span class='rm-chip-text'><span class='rm-chip-club'>" + esc(B.title) + "</span>" +
        "<span class='rm-chip-meta'>" + n + "/" + tot + (b.n > 0 ? " · best " + pct(b) + "%" : "") + "</span></span>";
      if (B.title !== B.club) btn.title = B.club;
      btn.addEventListener("click", function () { openClub(B.club, false, B.season); });
      els.picker.appendChild(btn);
    });
  }
  function renderPicker() {
    if (!els.picker) return;
    els.picker.innerHTML = "";
    els.picker.className = "rm-picker" + (view === "seasons" ? " rm-seasons" : "");
    els.picker.setAttribute("aria-label", view === "seasons" ? "Pick a season" : "Pick a club");
    if (view === "seasons") renderSeasons(); else renderClubs();
    if (els.seasonHead) els.seasonHead.hidden = view !== "clubs" || !multi();
    if (els.seasonTitle) els.seasonTitle.textContent = season + (season === CURRENT ? " · this season" : "");
    if (els.pickerActions) els.pickerActions.hidden = view !== "clubs";
    layoutPicker();
  }
  function renderBoard() {
    if (!els.groups || !board) return;
    var id = board.id, tot = board.roster.length, n = Object.keys(named).length, b = getBest(id), r = Object.keys(revealed).length;
    if (els.clubName) {
      var sub = [];
      if (multi()) sub.push(board.season);
      if (board.title !== board.club) sub.push(board.club);
      els.clubName.innerHTML = badgeHTML(board.club, board.code) + "<span>" + esc(board.title) +
        (sub.length ? "<small class='rm-sub'>" + esc(sub.join(" · ")) + "</small>" : "") + "</span>";
    }
    if (els.back) els.back.textContent = multi() ? "← " + board.season : "← All clubs";
    if (els.progress) {
      var line = n + "/" + tot + " named" + (b.n > 0 ? " · Best " + pct(b) + "%" : "") +
        (r ? " · " + r + " revealed" : "") + (n === tot ? " — 🏆 complete!" : everGold(id) ? " ★" : "");
      // The club page lists the whole roster, so it's offered only once the
      // board is full: before that it would be the answer key.
      if (n + r >= tot && window.CLUBS && window.CLUBS.page && window.CLUBS.page(board.club)) {   // every slot filled, named or revealed
        els.progress.innerHTML = esc(line) + " · " + window.CLUBS.link(board.club, "Club page →");
      } else {
        els.progress.textContent = line;
      }
      els.progress.className = "counter" + (everGold(id) ? " rm-gold-line" : "");
    }
    els.groups.innerHTML = "";
    POS_ORDER.forEach(function (pos) {
      var members = board.roster.filter(function (p) { return (p.position || "") === pos; });
      if (!members.length) return;
      var got = members.filter(function (p) { return named[p.name]; });
      var sec = document.createElement("div"); sec.className = "rm-group";
      var head = document.createElement("div"); head.className = "rm-ghead";
      head.innerHTML = "<span>" + POS_LABEL[pos] + "</span><span class='rm-gcount'>" + got.length + "/" + members.length + "</span>";
      sec.appendChild(head);
      var list = document.createElement("div"); list.className = "rm-slots";
      function slot(p, cls) {
        var d = document.createElement("div"); d.className = "rm-slot " + cls;
        d.innerHTML = (p.number == null ? "" : "<span class='rm-num'>#" + p.number + "</span>") + esc(p.name);
        return d;
      }
      got.forEach(function (p) { list.appendChild(slot(p, "filled")); });
      var shown = members.filter(function (p) { return !named[p.name] && revealed[p.name]; });
      shown.forEach(function (p) { var d = slot(p, "revealed"); d.title = "Revealed, not named"; list.appendChild(d); });
      for (var i = got.length + shown.length; i < members.length; i++) { var e = document.createElement("div"); e.className = "rm-slot"; e.innerHTML = "&nbsp;"; list.appendChild(e); }
      sec.appendChild(list);
      els.groups.appendChild(sec);
    });
    // The reveal is offered only while something is still missing.
    if (els.reveal) els.reveal.hidden = n + r >= tot;
    renderSummary();
  }

  // --- Navigation --------------------------------------------------------------------
  // seasons → clubs → board hops are real history entries, so the browser Back
  // button walks out the way the user walked in. `fromHist` skips the push when
  // the hop IS the history navigation (driven by app.js popstate via _nav).
  function pushNav(state) { try { if (window.history && window.history.pushState) window.history.pushState(state, "", ""); } catch (e) {} }
  function leaveBoard() {
    saveBoard();
    board = null; named = {}; revealed = {};
    disarmClear(); disarmClearAll(); disarmReveal(); flash("");
    if (els.board) els.board.hidden = true;
    if (els.picker) els.picker.hidden = false;
  }
  function showSeasons(fromHist) {
    if (!multi()) { showClubs(CURRENT, fromHist); return; }   // one season: its clubs are the start
    if (!fromHist && view !== "seasons") pushNav({ v: "rostermaster" });
    leaveBoard(); view = "seasons";
    lsSet(K.open, null);
    renderPicker(); renderSummary();
  }
  function showClubs(s, fromHist) {
    if (!BY_SEASON[s]) s = CURRENT;
    if (!fromHist && (view !== "clubs" || season !== s)) pushNav({ v: "rostermaster", season: s });
    leaveBoard(); view = "clubs"; season = s;
    lsSet(K.open, { s: s });
    renderPicker(); renderSummary();
  }
  function openClub(t, fromHist, s) {
    s = s || CURRENT;
    var id = bid(s, t);
    if (!BOARDS[id]) return;
    if (!fromHist) pushNav({ v: "rostermaster", season: s, club: t });
    board = BOARDS[id]; season = s; view = "board";
    named = loadList(K.board(id), id); revealed = loadList(K.revealed(id), id); bumpBest();   // reconcile best with any pre-existing board
    lsSet(K.open, { s: s, c: t });
    disarmClear(); disarmClearAll(); disarmReveal(); flash("");
    if (els.picker) els.picker.hidden = true;
    if (els.seasonHead) els.seasonHead.hidden = true;
    if (els.pickerActions) els.pickerActions.hidden = true;
    if (els.board) els.board.hidden = false;
    if (els.input) { els.input.value = ""; if (els.input.focus) els.input.focus(); }
    renderBoard();
  }
  // Back from a board: that season's clubs.
  function backToPicker(fromHist) { showClubs(board ? board.season : season, fromHist); }
  // Where a history entry points (app.js popstate). Older seasons may still be loading.
  function nav(st) {
    st = st || {};
    ensureHistory(function () {
      if (st.club) openClub(st.club, true, st.season);
      else if (st.season) showClubs(st.season, true);
      else showSeasons(true);
    });
  }

  function chipLabel() {               // hub tile: recall instead of a daily chip
    var t = hist.state === "ready" ? tally() : storedTally();
    if (t && t.crown) return "👑 Complete";
    var n = 0; (BY_SEASON[CURRENT] || []).forEach(function (id) { n += savedCount(id); });
    var parts = [];
    if (n) parts.push(Math.min(100, Math.round(100 * n / TOTAL)) + "% named");
    if (t && t.gold) parts.push(t.gold + " ★");
    return parts.join(" · ");
  }
  // For the Records page: this season's recall, and the archive-wide count when known.
  function records() {
    var ids = BY_SEASON[CURRENT] || [], n = 0, gold = 0;
    ids.forEach(function (id) { n += Math.min(getBest(id).n, roster(id).length); if (everGold(id)) gold++; });
    return { named: n, of: TOTAL, gold: gold, clubs: ids.length, season: CURRENT,
      all: HISTORIC ? (hist.state === "ready" ? tally() : storedTally()) : null };
  }

  // --- How-to modal ---------------------------------------------------------------------
  function openInfo() { if (!els.infoModal) return; lsSet(K.seen, true); lastFocus = document.activeElement; els.infoModal.hidden = false; var d = els.infoModal.firstElementChild; if (d && d.focus) d.focus(); }
  function maybeFirstHelp() { if (lsGet(K.seen, false)) return false; openInfo(); return true; }
  function closeInfo() { if (!els.infoModal) return; els.infoModal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); lastFocus = null; }
  function onModalKey(e) {
    if (!els.infoModal || els.infoModal.hidden) return;
    if (e.key === "Escape") { if (e.preventDefault) e.preventDefault(); closeInfo(); return; }
    if (e.key !== "Tab") return;
    var dlg = els.infoModal.firstElementChild; if (!dlg) return;
    var f = dlg.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // --- Init --------------------------------------------------------------------------------
  function init() {
    els.view = $("rostermaster-view"); els.summary = $("rm-summary");
    els.picker = $("rm-picker"); els.pickerActions = $("rm-picker-actions"); els.clearAll = $("rm-clear-all");
    els.seasonHead = $("rm-season-head"); els.seasonsBack = $("rm-seasons-back"); els.seasonTitle = $("rm-season-title");
    els.board = $("rm-board");
    els.back = $("rm-back"); els.clubName = $("rm-club"); els.clear = $("rm-clear");
    els.progress = $("rm-progress"); els.input = $("rm-input");
    els.flash = $("rm-flash"); els.sr = $("rm-sr"); els.groups = $("rm-groups");
    els.infoBtn = $("rm-info-btn"); els.infoModal = $("rm-info-modal"); els.infoClose = $("rm-info-close");
    els.tagline = $("rm-tagline");
    if (!els.picker || !PLAYERS.length) return;
    inited = true;
    migrate();
    if (!HISTORIC && els.tagline) els.tagline.textContent = "Name every player on every " + CURRENT + " roster";

    if (els.input) {
      els.input.addEventListener("input", function () {
        disarmClear();
        if (tryGuess(els.input.value, false) === "hit") els.input.value = "";
      });
      els.input.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        if (e.preventDefault) e.preventDefault();
        if (tryGuess(els.input.value, true) === "hit") els.input.value = "";
      });
    }
    if (els.back) els.back.addEventListener("click", function () { backToPicker(); });
    if (els.seasonsBack) els.seasonsBack.addEventListener("click", function () { showSeasons(); });
    if (els.clear) els.clear.addEventListener("click", onClear);
    els.reveal = $("rm-reveal");
    if (els.reveal) els.reveal.addEventListener("click", onReveal);
    if (els.clearAll) els.clearAll.addEventListener("click", onClearAll);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);
    if (window.addEventListener) window.addEventListener("resize", layoutPicker);   // no-op while a board is open

    view = HISTORIC ? "seasons" : "clubs";
    renderPicker(); renderSummary();
  }

  var restoredOnce = false;
  window.RosterMaster = {
    onShow: function () {
      if (!inited) return;
      maybeFirstHelp();
      if (!restoredOnce) {                       // first show per load: reopen where the user left off
        restoredOnce = true;
        var last = lsGet(K.open, null) || {};
        ensureHistory(function () {
          if (last.c && BOARDS[bid(last.s, last.c)]) openClub(last.c, true, last.s);
          else if (last.s && BY_SEASON[last.s]) showClubs(last.s, true);
          else showSeasons(true);
        });
        if (hist.state === "loading" && view === "seasons") { renderPicker(); renderSummary(); }   // the seasons, as they arrive
      } else {                                   // later shows keep the in-memory state (Back drives the rest)
        ensureHistory(function () { if (board) renderBoard(); else { renderPicker(); renderSummary(); } });
      }
    },
    chipLabel: chipLabel, records: records,
    _open: openClub, _back: backToPicker, _seasons: showSeasons, _season: showClubs, _nav: nav,
    _guess: function (t) { return tryGuess(t, true); },
    _clear: performClear, _clearAll: performClearAll, _meta: clubMeta, _reveal: performReveal,
    _history: function () { return { state: hist.state, seasons: SEASONS.slice(), boards: Object.keys(BOARDS).length }; },
    _tally: tally, _purple: { season: seasonPurple, club: clubPurple }, _migrate: migrate,
    _peek: function () {
      return { view: view, season: board ? board.season : season, club: board ? board.club : null, teams: (BY_SEASON[CURRENT] || []).length,
        total: board ? board.roster.length : 0, roster: board ? board.roster.slice() : [],
        named: board ? Object.keys(named).length : 0, revealed: board ? Object.keys(revealed).length : 0, best: board ? getBest(board.id) : null };
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
