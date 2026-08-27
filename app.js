/* Hub router — switches between the home lobby (a grid of game tiles) and the games.
 * Views are #home-view / #mystery-view / #playerid-view / #completefive-view /
 * #connections-view / #careerorder-view. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }

  var VIEWS = ["home", "mystery", "playerid", "completefive", "connections", "careerorder", "thegrid", "clubreveal", "pathbetween", "oddoneout", "higherlower", "rostermaster", "records", "archive"];
  var els = { home: $("home-view"), mystery: $("mystery-view"), playerid: $("playerid-view"), completefive: $("completefive-view"), connections: $("connections-view"), careerorder: $("careerorder-view"), thegrid: $("thegrid-view"), clubreveal: $("clubreveal-view"), pathbetween: $("pathbetween-view"), oddoneout: $("oddoneout-view"), higherlower: $("higherlower-view"), rostermaster: $("rostermaster-view"), records: $("records-view"), archive: $("archive-view") };

  // Every in-app navigation pushes a history entry (URL untouched) so the
  // browser arrows retrace the user's own path.
  // Writes the view's URL as well as its state. A challenge link (#c=…) is left
  // strictly alone — its hash IS the payload, and rewriting the URL would drop it.
  function pushNav(state) {
    try {
      if (!window.history || !window.history.pushState) return;
      if (hasChallenge()) { window.history.pushState(state, "", ""); return; }
      window.history.pushState(state, "", urlFor(state && state.v, state && state.mode));
    } catch (e) {}
  }

  // Nothing tied a dialog's lifetime to the view that owns it. The how-to
  // auto-opens on a game's first visit, so going Back without dismissing it left
  // the modal floating over the hub — the game underneath was gone, the dialog
  // wasn't. Closing them here covers every modal, including ones added later,
  // and runs BEFORE the view's onShow so a fresh auto-open still works.
  function closeAllModals() {
    var open = document.querySelectorAll(".modal-overlay");
    for (var i = 0; i < open.length; i++) open[i].hidden = true;
  }

  // A generated game page carries one standing prose section, written for that
  // game (build_pages.js). It ships VISIBLE in the served HTML — the entire point
  // is to be there for something that never runs a script — and this only ever
  // takes it away, once the visitor has navigated off the game it describes. The
  // hub has no such section, so on index.html this does nothing at all.
  function showSeoCopy(name) {
    var seo = document.querySelector(".seo-copy");
    if (seo) seo.hidden = (seo.getAttribute("data-seo-view") !== name);
  }

  // mode: "practice" | "daily" (force a mode) | "archive:<YYYY-MM-DD>" (replay a
  // past daily) | undefined (plain open → resume last mode)
  function showView(name, mode) {
    if (VIEWS.indexOf(name) === -1) name = "home";
    VIEWS.forEach(function (v) { if (els[v]) els[v].hidden = (v !== name); });
    document.body.className = "view-" + name;
    curView = name;
    closeAllModals();                            // a view's dialogs leave with it
    showSeoCopy(name);                           // …and so does the standing copy under it
    // Provisional: when no mode was asked for, the game resumes its last one and
    // reports back through modeURL, which refines the title and URL.
    updateHead(name, isMode(name, mode) ? mode : null);
    updateFeedbackHref();                        // so the report names the screen they were on
    if (name === "home") { refreshDailyChips(); renderHubStreak(); layoutHome(); }   // state may have changed while playing
    var api = name === "mystery" ? window.Mystery : name === "playerid" ? window.PlayerID : name === "completefive" ? window.CompleteFive : name === "connections" ? window.Connections : name === "careerorder" ? window.CareerOrder : name === "thegrid" ? window.TheGrid : name === "clubreveal" ? window.ClubReveal : name === "pathbetween" ? window.PathBetween : name === "oddoneout" ? window.OddOneOut : name === "higherlower" ? window.HigherLower : name === "rostermaster" ? window.RosterMaster : name === "records" ? window.Records : name === "archive" ? window.Archive : null;
    if (api) {
      if (mode && mode.indexOf("archive:") === 0 && api.goArchive) api.goArchive(mode.slice(8));
      else if (mode === "daily" && api.goDaily) api.goDaily();
      // Any other real mode of this game — legends, endless, easy, retired…
      else if (isMode(name, mode) && api.goMode) api.goMode(mode);
      // "practice" stays a concept the hub can ask for even where it isn't a
      // literal mode: Player ID calls it "both", Higher or Lower calls it "endless".
      else if (mode === "practice" && api.goPractice) api.goPractice();
      else if (api.onShow) api.onShow();
    }
    if (window.scrollTo) window.scrollTo(0, 0);
  }

  // --- Lobby grid packing ------------------------------------------------------
  // The tile grid fills the whole viewport below the header. Pick the column
  // count that gives the largest (most square) tiles for the current viewport
  // and tile count, so adding games shrinks the tiles instead of causing scroll.
  //
  // Squareness alone isn't enough. On a 375px phone the old scoring chose four
  // columns of 76px, and "Complete the Five" cannot be set in that at any
  // legible size — the title pushed its track 5px past the viewport. So a tile
  // has a floor in BOTH directions: narrower than MIN_TILE_W and it can't hold a
  // game's name, shorter than ROW_MIN and it can't hold a name plus a status
  // line. ROW_MIN is also the row floor in the stylesheet, which is what lets a
  // genuinely cramped viewport scroll a little instead of squashing every tile
  // into an unreadable strip.
  var MIN_TILE_W = 104;
  var ROW_MIN = 58;    // keep in step with the minmax() row floor in .game-cards
  function layoutHome() {
    var grid = document.querySelector("#home-view .game-cards");
    if (!grid || els.home.hidden) return;
    var n = grid.children.length;
    var W = grid.clientWidth, H = grid.clientHeight;
    if (!n || !W || !H) return;
    // Read the gap instead of restating it; the copy here and the one in the
    // stylesheet had already drifted apart (14 vs 12).
    var gap = 12;
    try { var g = parseFloat(window.getComputedStyle(grid).columnGap); if (g >= 0) gap = g; } catch (e) {}
    var best = 0, bestFits = false, bestSize = -1;
    for (var c = 1; c <= n; c++) {
      var r = Math.ceil(n / c);
      var tw = (W - gap * (c - 1)) / c;
      if (c > 1 && tw < MIN_TILE_W) continue;            // too narrow to read
      var th = Math.max(ROW_MIN, (H - gap * (r - 1)) / r);
      var fits = (r * th + gap * (r - 1)) <= H + 0.5;    // …without the page scrolling
      var size = Math.min(tw, th);
      // Fitting beats size; size beats everything else. Two layouts within 5% of
      // each other count as a tie, and a tie goes to the one with more columns —
      // fewer rows, and a fuller last row. (At 1100px the six-column pack scores
      // 0.4% under the five-column one, and five columns leaves a single tile
      // marooned in row three.)
      var better;
      if (!best) better = true;
      else if (fits !== bestFits) better = fits;
      else if (size > bestSize * 1.05) better = true;
      else if (size >= bestSize * 0.95) better = (c > best);
      else better = false;
      if (better) { best = c; bestFits = fits; bestSize = size; }
    }
    if (!best) best = 1;                                 // narrower than one tile
    var rows = Math.ceil(n / best);
    grid.style.setProperty("--home-cols", best);
    grid.style.setProperty("--home-rows", rows);
    // Publish the tile box the pack settled on. A tile can't size its own
    // padding off container-query units — a container is not allowed to query
    // itself, so cqmin inside .game-card silently falls back to the viewport and
    // a 58px tile was getting 16px of padding top and bottom. The packer already
    // knows the answer, so it says it out loud instead.
    grid.style.setProperty("--home-tile-w", ((W - gap * (best - 1)) / best).toFixed(2) + "px");
    grid.style.setProperty("--home-tile-h", Math.max(ROW_MIN, (H - gap * (rows - 1)) / rows).toFixed(2) + "px");
    // Centre a partial last row: tracks are half columns (each card spans 2),
    // so nudging the row's first tile right by (cols - remainder) half-tracks
    // centres the whole row; the rest auto-flow after it.
    var rem = n % best;
    for (var i = 0; i < n; i++) grid.children[i].style.gridColumnStart = "";
    if (rem) grid.children[n - rem].style.gridColumnStart = String(best - rem + 1);
  }

  // --- localStorage + date helpers -------------------------------------------
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function daysAgoStr(n) { var d = new Date(); d.setDate(d.getDate() - n); return dateStr(d); }

  // --- Night mode (persisted; OS preference is the first-run default) ---------
  function prefersDark() { try { return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); } catch (e) { return false; } }
  function getTheme() { var t = lsGet("elg:theme", null); return (t === "dark" || t === "light") ? t : (prefersDark() ? "dark" : "light"); }
  function applyTheme(t) {
    var root = document.documentElement; if (root && root.setAttribute) root.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m && m.setAttribute) m.setAttribute("content", t === "dark" ? "#15120d" : "#f7f3ea");
    var btn = $("theme-btn");
    if (btn && btn.setAttribute) { var toDay = t === "dark"; btn.setAttribute("aria-label", toDay ? "Switch to day mode" : "Switch to night mode"); btn.setAttribute("title", toDay ? "Day mode" : "Night mode"); }
  }
  function toggleTheme() { var t = getTheme() === "dark" ? "light" : "dark"; lsSet("elg:theme", t); applyTheme(t); }

  // --- Per-tile daily status --------------------------------------------------
  // Each game stores its daily under a per-game key; the hub only peeks.
  var DAILY_KEY = { mystery: "elg:daily:", playerid: "elg:pid:daily:", completefive: "elg:c5:daily:", connections: "elg:cn:daily:", careerorder: "elg:co:daily:", thegrid: "elg:gr:daily:", clubreveal: "elg:cv:daily:", pathbetween: "elg:pb:daily:", oddoneout: "elg:oo:daily:", higherlower: "elg:hl:daily:" };
  function dailyState(game) {           // "ready" | "playing" (started, not done) | "won" | "lost"
    var v = lsGet(DAILY_KEY[game] + todayStr(), null);
    if (!v) return "ready";
    if (!v.done) return "playing";
    return v.won ? "won" : "lost";
  }
  function refreshDailyChips() {
    Array.prototype.forEach.call(document.querySelectorAll(".game-card"), function (c) {
      var chip = c.querySelector(".gc-daily");
      if (!chip) return;
      var game = c.getAttribute("data-game");
      if (game === "rostermaster") {           // completion board, not a daily — chip shows overall recall
        var lbl = (window.RosterMaster && window.RosterMaster.chipLabel && window.RosterMaster.chipLabel()) || "";
        chip.textContent = lbl || "Play";
        chip.classList.toggle("done", lbl.indexOf("100%") === 0);
        chip.classList.remove("lost");
        chip.classList.toggle("playing", !!lbl && lbl.indexOf("100%") !== 0);
        chip.hidden = false;
        return;
      }
      var st = dailyState(game);
      // NYT-style progress cards: a tile shows where you are and pulls you back to finish.
      chip.textContent = st === "won" ? "✓ Solved" : st === "lost" ? "✗ Missed" : st === "playing" ? "Resume" : "Play";
      chip.classList.toggle("done", st === "won");
      chip.classList.toggle("lost", st === "lost");
      chip.classList.toggle("playing", st === "playing");
      chip.hidden = false;
    });
  }

  // --- Unified hub streak (Duolingo-style, entirely local) --------------------
  // "Daily done" = you finished at least ONE game's daily today (win or loss).
  // The streak counts consecutive days you did that. One automatic streak freeze
  // forgives a single missed day so a long run survives one slip; it recharges
  // after 7 more days. No accounts, no server — just localStorage + loss aversion.
  var HUB_KEY = "elg:hub";
  function defaultHub() { return { cur: 0, best: 0, last: null, freeze: true, freezeAt: 0 }; }
  function getHub() { var h = lsGet(HUB_KEY, null); return (h && typeof h.cur === "number") ? h : defaultHub(); }
  function setHub(h) { lsSet(HUB_KEY, h); }
  function isTodayDone() {
    return Object.keys(DAILY_KEY).some(function (g) { var s = dailyState(g); return s === "won" || s === "lost"; });
  }
  function reconcileHub() {              // advance / bridge / reset based on today
    var h = getHub();
    if (isTodayDone() && h.last !== todayStr()) {
      if (h.last === daysAgoStr(1)) h.cur += 1;                                            // consecutive day
      else if (h.last === daysAgoStr(2) && h.freeze) { h.cur += 1; h.freeze = false; h.freezeAt = h.cur; }  // freeze bridges one missed day
      else h.cur = 1;                                                                       // gap too big → fresh streak
      if (h.cur > h.best) h.best = h.cur;
      h.last = todayStr();
    }
    if (!h.freeze && h.freezeAt && h.cur - h.freezeAt >= 7) { h.freeze = true; h.freezeAt = 0; }  // recharge
    setHub(h);
    return h;
  }
  function hubInfo() {                   // display state (call AFTER reconcile)
    var h = getHub(), done = isTodayDone();
    var alive = h.last === todayStr() || h.last === daysAgoStr(1) || (h.last === daysAgoStr(2) && h.freeze);
    return { cur: alive ? h.cur : 0, best: h.best, done: done, atRisk: alive && !done, freeze: h.freeze };
  }
  function renderHubStreak() {
    var el = $("hub-streak"); if (!el) return;
    reconcileHub();
    var info = hubInfo(), n = info.cur, parts = [];
    if (n > 0) {
      parts.push("<div class='hs-main'>" +
        "<span class='hs-flame'><svg viewBox='0 0 24 24'><use href='#ico-flame'/></svg></span>" +
        "<span class='hs-num'>" + n + "</span>" +
        "<span class='hs-lbl'>" + (n === 1 ? "day" : "days") + "<br>streak</span></div>");
      var meta = ["Best " + info.best];
      if (info.freeze) meta.push("<span class='hs-freeze'><svg viewBox='0 0 24 24'><use href='#ico-freeze'/></svg>Freeze ready</span>");
      parts.push("<div class='hs-meta'>" + meta.join("<span class='hs-dot'>·</span>") + "</div>");
      parts.push("<div class='hs-sub'>" + (info.done
        ? "Nice — you're safe for today. See you tomorrow 👋"
        : "Play any daily today to keep it alive.") + "</div>");
    } else {
      parts.push("<div class='hs-main'>" +
        "<span class='hs-flame off'><svg viewBox='0 0 24 24'><use href='#ico-flame'/></svg></span>" +
        "<span class='hs-lbl big'>Start your streak</span></div>");
      parts.push("<div class='hs-sub'>Play any daily to begin — one puzzle is enough." +
        (info.best ? " Best so far: " + info.best + "." : "") + "</div>");
    }
    el.className = "hub-streak" + (n > 0 ? " on" : "") + (info.done ? " safe" : "");
    el.innerHTML = parts.join("");
  }

  function hasChallenge() { return /[#&]c=/.test(window.location.hash || ""); }

  // --- Addressable views --------------------------------------------------------
  // Every game now KEEPS its ?game= in the address bar. It used to be stripped on
  // load so a refresh returned to the lobby, which meant eleven games shared one
  // URL: nothing to copy, nothing for a search engine to tell apart. The trade is
  // deliberate — refreshing now reopens the game you were on, because that's what
  // the URL says.
  var TITLES = {
    mystery: "Mystery Player", playerid: "Player ID", completefive: "Complete the Five",
    connections: "Connections", careerorder: "Career Order", thegrid: "The Grid",
    clubreveal: "Common Club", pathbetween: "Path Between", oddoneout: "Odd One Out",
    higherlower: "Higher or Lower", rostermaster: "Roster Master",
    records: "Records", archive: "Archive"
  };
  var CANON = "https://euroballgames.com/";

  // Each game's own directory, written by build_pages.js. These replaced
  // ?game=<view> as the address of a game, because a query string over one
  // shared document was exactly the problem: eleven URLs served byte-identical
  // HTML and were told apart only by script, so a crawler saw one thin page
  // eleven times. Now each slug is a real file with its own <head> and its own
  // prose, and this map is what keeps the router pointing at them.
  //
  // The keys are still the ORIGINAL view ids — every localStorage key, every
  // saved daily and every old ?game= link speaks them, and renaming those to
  // match the slugs would strand real people's streaks. clubreveal → common-club
  // is where the two visibly disagree: the game was renamed in v76 and the
  // address a person reads should say what it is called now, while the storage
  // key must not move.
  //
  // Records and Archive are deliberately ABSENT. They show nothing but the
  // visitor's own saved scores, so they are not worth indexing and have no
  // generated page — and a view with no file behind it must keep the query form,
  // or a refresh on a path that doesn't exist would 404.
  var SLUGS = {
    mystery: "mystery-player", playerid: "player-id", completefive: "complete-the-five",
    connections: "connections", careerorder: "career-order", thegrid: "the-grid",
    clubreveal: "common-club", pathbetween: "path-between", oddoneout: "odd-one-out",
    higherlower: "higher-or-lower", rostermaster: "roster-master"
  };

  // Where the site root is, as an absolute path. Each document declares its own
  // depth (window.__ELG_ROOT__ — "./" on the hub, "../" on a generated game
  // page) and this resolves that against the current URL, so the answer is "/"
  // on euroballgames.com and "/eurogame/" on the github.io mirror WITHOUT either
  // being hardcoded. That is the whole reason the mirror still works off one
  // build; hardcoding "/" here would break every link on it.
  function siteRoot() {
    var rel = (typeof window.__ELG_ROOT__ === "string" && window.__ELG_ROOT__) || "./";
    try { return new URL(rel, window.location.href).pathname; } catch (e) { return "/"; }
  }

  // Modes are addressable too (?game=thegrid&mode=practice). The lists live here
  // because the strings are NOT uniform across games — daily/practice,
  // daily/endless, daily/easy/medium/hard, daily/active/retired/both — and an
  // unknown one must be ignored rather than handed to a game that would choke on
  // it. Roster Master is absent on purpose: it has no modes, it has a chosen club.
  var MODES = {
    mystery: ["daily", "practice", "legends", "endless"],
    playerid: ["daily", "active", "retired", "both"],
    completefive: ["daily", "easy", "medium", "hard"],
    connections: ["daily", "practice"],
    careerorder: ["daily", "easy", "medium", "hard"],
    thegrid: ["daily", "practice"],
    clubreveal: ["daily", "active", "legends", "both"],
    pathbetween: ["daily", "easy", "medium", "hard"],
    oddoneout: ["daily", "practice"],
    higherlower: ["daily", "endless"]
  };
  function isMode(view, mode) { return !!(mode && MODES[view] && MODES[view].indexOf(mode) >= 0); }
  function linkedMode(view) {
    var m = /[?&]mode=([a-z]+)/i.exec(window.location.search || "");
    var mode = m && m[1].toLowerCase();
    return isMode(view, mode) ? mode : null;
  }
  function pageTitle(view, mode) {
    if (!TITLES[view]) return "Euroball 🏀 — daily European basketball puzzles";
    // "Daily" is the default reading of a game, so it doesn't earn a suffix.
    var label = (isMode(view, mode) && mode !== "daily") ? mode.charAt(0).toUpperCase() + mode.slice(1) : "";
    return TITLES[view] + (label ? " · " + label : "") + " 🏀 Euroball";
  }
  // Built off siteRoot(), so it still works on github.io and on a Pages preview
  // build. A game gets its directory; the two viewer-only views (Records,
  // Archive) keep the query form because no file exists at a path for them.
  //
  // Mode stays a QUERY on top of the path — ?mode=practice — and not a second
  // directory, for the same reason it is left out of the canonical: all ~32 mode
  // URLs serve the same document, so they are states of a page, not pages. Only
  // things worth being a page get a path.
  function urlFor(view, mode) {
    var root = siteRoot();
    if (!TITLES[view]) return root;
    var q = isMode(view, mode) ? "?mode=" + mode : "";
    if (SLUGS[view]) return root + SLUGS[view] + "/" + q;
    return root + "?game=" + view + (isMode(view, mode) ? "&mode=" + mode : "");
  }
  // Self-referencing canonical: dedupes the github.io copy against the real
  // domain, and — crucially — points each game URL at ITSELF rather than at the
  // hub. A single hardcoded canonical would have told Google to discard all
  // eleven game URLs, which is the opposite of the point.
  // The title a generated page was BUILT with, read before anything overwrites
  // it. It is not the same kind of string as the one pageTitle composes: that
  // one is for a browser tab and is deliberately short, this one was written to
  // be a search result and carries what the game is actually about ("The Grid —
  // the daily EuroLeague basketball grid game"). Without this, app.js replaced
  // the second with the first the moment it booted, and since Google renders the
  // page before reading it, the built title would never have been the one seen.
  var SEO_TITLE = "";
  function readSeoTitle() { try { SEO_TITLE = document.title || ""; } catch (e) { SEO_TITLE = ""; } }
  readSeoTitle();

  function updateHead(view, mode) {
    var t = pageTitle(view, mode);
    // Keep the built title while we are on the game that page is about — but
    // hand back to the composed one as soon as a real mode is showing, because
    // then the tab has something to say that the built title cannot ("· Practice").
    if (SEO_TITLE && view === window.__ELG_VIEW__ && !(isMode(view, mode) && mode !== "daily")) t = SEO_TITLE;
    try { document.title = t; } catch (e) {}
    var c = $("canonical");
    // The canonical deliberately DROPS the mode. Every mode of a game serves the
    // same HTML, so ~32 self-canonicalising mode URLs would be 32 duplicates
    // competing with each other for the same content — the classic faceted-
    // navigation mistake. A mode is a state OF the game's page, not a page. The
    // sitemap lists the eleven games only, for the same reason.
    // Always the LIVE domain, never siteRoot() — the canonical's job is to point
    // the github.io mirror and any preview build at the one real address, so it
    // is the single URL here that must not be relative.
    if (c) c.href = CANON + (SLUGS[view] ? SLUGS[view] + "/" : TITLES[view] ? "?game=" + view : "");
  }

  // Called by every game whenever its mode changes — a tab click, the keyboard
  // arrows, or restoring the last-used mode — so the address can never disagree
  // with what's on screen. replaceState, not push: flicking between tabs
  // shouldn't stack up Back entries.
  //
  // The curView guard is load-bearing. Every game's init ends with
  // setMode(lsGet(...)), so at page load all ten fire this while invisible; without
  // the guard the last one to initialise would stamp its mode on the URL.
  var curView = "home";
  function modeURL(view, mode) {
    if (!isMode(view, mode) || view !== curView) return;
    updateHead(view, mode);
    try {
      if (hasChallenge()) return;
      if (window.history && window.history.replaceState)
        window.history.replaceState({ v: view, mode: mode }, "", urlFor(view, mode));
    } catch (e) {}
  }
  // Which game this document is. Two ways in, in priority order:
  //
  //   1. __ELG_VIEW__ — a generated page stating what it is. No parsing, and it
  //      cannot disagree with the prose baked into that file.
  //   2. ?game=<view> — the OLD address of every game, and the reason this
  //      branch stays forever. Those links are out in the world, in the sitemap
  //      Google already crawled, and in people's bookmarks. They still open the
  //      right game; boot then rewrites the address to the new path, which
  //      quietly consolidates the old URL onto the new one instead of leaving
  //      two live addresses for one game.
  function linkedGame() {
    var v = window.__ELG_VIEW__;
    if (typeof v === "string" && VIEWS.indexOf(v) > 0) return v;
    var m = /[?&]game=([a-z]+)/i.exec(window.location.search || "");
    var g = m && m[1].toLowerCase();
    return (g && VIEWS.indexOf(g) > 0) ? g : null;   // any view except "home"
  }

  function wire() {
    applyTheme(getTheme());                              // reconcile the pre-paint theme + set the toggle label
    var tb = $("theme-btn");
    if (tb) tb.addEventListener("click", toggleTheme);
    // Newspaper dateline under the masthead (e.g. "Wednesday, 9 July 2026").
    var dl = $("dateline");
    if (dl) {
      try { dl.textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
      catch (e) { dl.textContent = todayStr(); }
    }
    var cards = document.querySelectorAll(".game-card");
    Array.prototype.forEach.call(cards, function (c) {
      // Plain open: each game resumes its last-used mode (Daily for first-timers).
      //
      // The tile is a real <a href="the-grid/"> now, so this has to say which
      // clicks it is taking. An ordinary click is handled in-app — no reload, no
      // flash, the SPA behaviour people already have. A MODIFIED click is left
      // entirely alone, because ctrl/cmd/shift/middle-click mean "not here", and
      // swallowing them is the classic way a scripted link ends up feeling
      // broken. Letting them through costs nothing: the href they follow is a
      // real page that opens on the same game.
      c.addEventListener("click", function (e) {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        var v = c.getAttribute("data-game");
        pushNav({ v: v });
        showView(v);
      });
    });
    var hb = $("home-btn");
    if (hb) hb.addEventListener("click", function () { pushNav({ v: "home" }); showView("home"); });
    var rb = $("records-btn");
    if (rb) rb.addEventListener("click", function () { pushNav({ v: "records" }); showView("records"); });
    var ab = $("archive-btn");
    if (ab) ab.addEventListener("click", function () { pushNav({ v: "archive" }); showView("archive"); });
    // The colophon's "Send feedback". readVersion is async and refreshes the href
    // itself once Cache Storage answers, so a slow reply can't leave a stale link.
    readVersion();
    updateFeedbackHref();
    // …and the corner icon, which is the one people actually find: the colophon
    // sits at the bottom of a hub built to fill the viewport, so on a phone the
    // link was below the fold. A button navigates rather than carrying an href.
    var fbb = $("feedback-btn");
    if (fbb) fbb.addEventListener("click", openFeedback);
    // The colophon link keeps its mailto href (so right-click → copy still works)
    // but opens the modal on a plain click, same as the icon.
    var fbl = $("feedback-link");
    if (fbl) fbl.addEventListener("click", function (e) {
      if (e && e.preventDefault) e.preventDefault();
      openFeedback();
    });
    // The form is the route now. Listening for submit rather than the button's
    // click means Enter in the fields works for free, and only one handler can run
    // per attempt.
    var fbf = $("feedback-form");
    if (fbf) fbf.addEventListener("submit", function (e) {
      if (e && e.preventDefault) e.preventDefault();
      sendFeedback();
    });
    // Typing is the signal that a complaint is being acted on, so a stale message
    // — the empty-field scolding, or a send that failed — clears itself.
    var fbt = $("feedback-text");
    if (fbt) fbt.addEventListener("input", function () { if (!fbSending) fbSay("", ""); });
    var fbcx = $("feedback-cancel");
    if (fbcx) fbcx.addEventListener("click", closeFeedback);
    var fbc = $("feedback-copy");
    if (fbc) fbc.addEventListener("click", function () { copyAddress(fbc); });
    var fbm = $("feedback-mail");
    if (fbm) fbm.addEventListener("click", sendMail);
    var fbx = $("feedback-close");
    if (fbx) fbx.addEventListener("click", closeFeedback);
    var fbo = $("feedback-modal");
    if (fbo) fbo.addEventListener("click", function (e) { if (e && e.target === fbo) closeFeedback(); });
    document.addEventListener("keydown", function (e) {
      if (e && e.key === "Escape" && fbo && fbo.hidden === false) closeFeedback();
    });
    window.addEventListener("resize", layoutHome);   // no-op while a game is open
    window.addEventListener("hashchange", function () { if (hasChallenge()) showView("mystery"); });
    window.addEventListener("popstate", function (e) {
      if (hasChallenge()) { showView("mystery"); return; }
      var st = e.state || { v: "home" };
      showView(st.v || "home", st.archive ? "archive:" + st.archive : (st.mode || undefined));
      if (st.v === "rostermaster" && window.RosterMaster) {   // sub-state: picker vs a club board
        if (st.club) window.RosterMaster._open(st.club, true);
        else window.RosterMaster._back(true);
      }
    });
    var linked = linkedGame();
    var initial = hasChallenge() ? "mystery" : (linked || "home");
    var initialMode = linked ? linkedMode(linked) : null;
    // The deep link is now KEPT, normalised to this view's canonical URL, so the
    // address bar always names what you're looking at and the link survives a
    // copy-paste. A challenge link keeps its hash untouched.
    try {
      if (window.history && window.history.replaceState)
        window.history.replaceState({ v: initial, mode: initialMode }, "", hasChallenge() ? "" : urlFor(initial, initialMode));
    } catch (e) {}
    showView(initial, initialMode || undefined);
  }

  // --- Share plumbing ----------------------------------------------------------
  // Every game builds its own emoji share text; this copies it and flashes the
  // button. Lives here (not per game) so all ten dailies share one clipboard path.
  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.top = "-1000px";
      document.body.appendChild(ta); ta.focus(); ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }
  function copyShare(text, btn) {
    var flash = function () {
      var orig = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(function () { btn.textContent = orig; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, function () { if (legacyCopy(text)) flash(); });
    } else if (legacyCopy(text)) flash();
  }
  // --- Feedback ---------------------------------------------------------------
  // Split so the finished address never appears in the page source: a scraper
  // lifting mailto: addresses out of the HTML finds nothing. test.js enforces it.
  var FB = ["loutriotispanos", "gmail.com"];

  // The relay that makes "Send" actually send. This site has no backend — it's
  // static files on Pages — so a typed message needs somewhere to go, and asking
  // the reporter to write the mail themselves is what kept failing: a mailto
  // resolves to nothing at all on a machine with no default mail app.
  //
  // Web3Forms is a form-to-email endpoint: paste the access key from
  // web3forms.com (they email you one; no account) and posts land in the inbox.
  // The key is PUBLIC by design and safe in the source — it names the
  // destination inbox without revealing the address, so the scraper guard above
  // survives intact. Until it's set, the form says so and offers the mailto
  // instead of pretending to have sent something.
  var FB_KEY = "0a2e9025-08d8-45a5-be6e-607bcccf7746";
  var FB_ENDPOINT = "https://api.web3forms.com/submit";
  function hasRelay() { return typeof FB_KEY === "string" && FB_KEY.length > 10; }

  // Which build the reporter is ACTUALLY on, read from Cache Storage rather than
  // kept as a constant. The service worker caches under its own CACHE name, so
  // this reports the version their phone is really running — which for an
  // offline-first PWA is frequently not the newest one, and is the first thing
  // worth knowing about a bug report. Nothing extra to remember to bump.
  var swVersion = "";
  function readVersion() {
    try {
      if (!window.caches || !window.caches.keys) return;
      window.caches.keys().then(function (keys) {
        var vs = keys.filter(function (k) { return /^elg-v\d+$/.test(k); })
          .sort(function (a, b) { return parseInt(a.slice(5), 10) - parseInt(b.slice(5), 10); });
        if (vs.length) { swVersion = vs[vs.length - 1]; updateFeedbackHref(); }
      }, function () {});
    } catch (e) {}
  }

  // The context that turns "it's broken" into something reproducible. Gathered
  // once here so the POST and the mailto fallback can never disagree about what
  // they're reporting.
  function diagnostics() {
    var d = { version: swVersion || "(version unknown)", view: "home", theme: "", display: "", ua: "" };
    try { d.view = (document.body.className || "").replace(/^view-/, "") || "home"; } catch (e) {}
    try { d.theme = getTheme(); } catch (e) {}
    try { d.display = window.screen.width + "x" + window.screen.height; } catch (e) {}
    try { d.ua = navigator.userAgent || ""; } catch (e) {}
    return d;
  }
  function fieldValue(id) {
    var el = $(id);
    return (el && typeof el.value === "string") ? el.value.replace(/^\s+|\s+$/g, "") : "";
  }

  function feedbackURL() {
    var d = diagnostics(), name = fieldValue("feedback-name"), msg = fieldValue("feedback-text");
    // The diagnostics sit under a divider so they read as a footer, and the
    // sender sees every word of them before deciding to send. Whatever was typed
    // into the form rides along, so falling back to mail loses nothing.
    var sig = ["Euroball " + d.version, "screen: " + d.view + (d.theme ? " / " + d.theme : "")];
    if (d.display) sig.push("display: " + d.display);
    if (d.ua) sig.push(d.ua);
    if (name) sig.unshift("from: " + name);
    return "mailto:" + FB[0] + "@" + FB[1] +
      "?subject=" + encodeURIComponent("Euroball feedback") +
      "&body=" + encodeURIComponent(msg + "\n\n--\n" + sig.join("\n") + "\n");
  }
  function updateFeedbackHref() {
    var fb = $("feedback-link");
    if (fb) fb.href = feedbackURL();
  }
  // Navigating straight to the mailto was the whole bug: mailto: resolves only if
  // the OS has a default mail app, and a machine whose mail lives in a browser tab
  // has none — so the click did nothing, silently, with no way to tell. It's kept
  // as the fallback for a send that can't go out, never as the first route.
  function sendMail() {
    try { window.location.href = feedbackURL(); } catch (e) {}
  }
  // The route that works no matter what the OS has installed, so it gets a test.
  function copyAddress(btn) { copyShare(FB[0] + "@" + FB[1], btn || $("feedback-copy")); }

  function fbSay(text, kind) {
    var m = $("feedback-msg");
    if (!m) return;
    m.textContent = text || "";
    m.className = "fb-msg" + (kind ? " " + kind : "");
    m.hidden = !text;
  }
  // Reveals the mail route. Only ever called after a send has actually failed —
  // offline, relay down, or no key configured — because the lesson of the silent
  // mailto is that there must always be a second way out, not that it goes first.
  function fbFallback() {
    var f = $("feedback-fallback");
    if (f) f.hidden = false;
    // Stop advertising the route that just failed — "sent via a relay" reads as a
    // contradiction directly above "that didn't get through".
    var n = $("feedback-note");
    if (n) n.hidden = true;
    updateFeedbackHref();               // carries whatever is in the fields
  }
  var fbSending = false;
  function sendFeedback() {
    if (fbSending) return;
    var msg = fieldValue("feedback-text"), name = fieldValue("feedback-name");
    if (!msg) { fbSay("Add a few words first — the name is optional, this isn't.", "err"); focusField("feedback-text"); return; }
    var bot = $("feedback-bot");
    if (bot && bot.checked) { fbSay("Thanks — that's landed.", "good"); return; }   // honeypot: swallowed, never sent
    lsSet("elg:fbname", name);          // so a second report doesn't retype it
    if (!hasRelay() || !window.fetch) {
      fbSay("Sending isn't switched on yet. Mail it instead — the message is already prefilled.", "err");
      fbFallback();
      return;
    }
    var d = diagnostics(), btn = $("feedback-send");
    fbSending = true;
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    fbSay("", "");
    var done = function (okd) {
      fbSending = false;
      if (btn) { btn.disabled = false; btn.textContent = "Send"; }
      if (okd) {
        lsSet("elg:fbdraft", "");
        var t = $("feedback-text");
        if (t) t.value = "";
        fbSay("Thanks — that's landed. It's read by a person, not a queue.", "good");
      } else {
        // Keep the text exactly where it is and stash it, so a failed send
        // survives both the modal closing and the tab closing.
        lsSet("elg:fbdraft", msg);
        fbSay("That didn't get through — you may be offline. Your words are saved; mail them instead.", "err");
        fbFallback();
      }
    };
    try {
      window.fetch(FB_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: FB_KEY,
          subject: "Euroball feedback" + (name ? " from " + name : ""),
          from_name: "Euroball",
          name: name || "(no name given)",
          message: msg,
          version: d.version,
          screen: d.view + (d.theme ? " / " + d.theme : ""),
          display: d.display,
          user_agent: d.ua
        })
      }).then(function (res) {
        if (!res || !res.ok) { done(false); return; }
        // A 200 with success:false is still a refusal (bad key, spam filter), so
        // the body decides — not the status code.
        var after = function (body) { done(!body || body.success !== false); };
        if (res.json) res.json().then(after, function () { after(null); });
        else after(null);
      }, function () { done(false); });
    } catch (e) { done(false); }
  }
  function focusField(id) {
    var el = $(id);
    if (el && el.focus) { try { el.focus(); } catch (e) {} }
  }

  var fbLastFocus = null;
  function openFeedback() {
    var ov = $("feedback-modal");
    if (!ov) { sendMail(); return; }          // no modal in the DOM → old behaviour
    var addr = $("feedback-addr");
    if (addr) addr.textContent = FB[0] + "@" + FB[1];   // written on open, never in the source
    var f = $("feedback-fallback");
    if (f) f.hidden = true;                   // a previous failure doesn't haunt a fresh open
    var n = $("feedback-note");
    if (n) n.hidden = false;
    fbSay("", "");
    var n = $("feedback-name");
    if (n && !n.value) n.value = lsGet("elg:fbname", "") || "";
    var t = $("feedback-text");
    if (t && !t.value) t.value = lsGet("elg:fbdraft", "") || "";
    fbLastFocus = document.activeElement;
    ov.hidden = false;
    // Straight to the message: the name is optional and often already filled, and
    // the point of the modal is the sentence they came to write.
    focusField("feedback-text");
  }
  function closeFeedback() {
    var ov = $("feedback-modal");
    if (ov) ov.hidden = true;
    // Unsent words are kept. Closing the modal by accident — Escape, a stray tap
    // on the overlay — used to cost nothing because there was nothing to lose;
    // now there is.
    lsSet("elg:fbdraft", fieldValue("feedback-text"));
    if (fbLastFocus && fbLastFocus.focus) fbLastFocus.focus();
    fbLastFocus = null;
  }

  window.ELG = {
    copyShare: copyShare,
    shareURL: function (game) {
      try { return window.location.origin + window.location.pathname + "?game=" + game; }
      catch (e) { return "?game=" + game; }
    },
    feedbackURL: feedbackURL,
    // Every game calls this from its mode setter. On ELG rather than Hub because
    // Hub is the test surface; this one is real plumbing the games depend on.
    modeURL: modeURL
  };

  // Test hooks + programmatic refresh (the headless harness drives these directly).
  window.Hub = {
    refresh: function () { refreshDailyChips(); renderHubStreak(); },
    // The Archive page routes through this: open a game straight into a past
    // day's daily (the game's goArchive replays that edition, streak-free).
    _openArchive: function (game, date) { pushNav({ v: game, archive: date }); showView(game, "archive:" + date); },
    _reconcile: reconcileHub, _info: hubInfo, _isTodayDone: isTodayDone,
    _getHub: getHub, _setHub: setHub,
    _getTheme: getTheme, _applyTheme: applyTheme, _toggleTheme: toggleTheme,
    _sendMail: sendMail, _openFeedback: openFeedback, _closeFeedback: closeFeedback,
    _copyAddress: copyAddress, _showView: showView, _pushNav: pushNav, _urlFor: urlFor,
    _isMode: isMode, _pageTitle: pageTitle, _modes: MODES,
    _slugs: SLUGS, _siteRoot: siteRoot, _titles: TITLES, _canon: CANON, _linkedGame: linkedGame,
    // The built title is captured once, at load. The harness needs to restate it
    // to drive both branches, since in tests the document is always index.html.
    _readSeoTitle: readSeoTitle,
    // The form. _setKey lets the harness drive both branches — with a relay
    // configured and without — since the shipped key is empty until it's pasted in.
    _sendFeedback: sendFeedback, _hasRelay: hasRelay, _endpoint: FB_ENDPOINT,
    _setKey: function (k) { FB_KEY = k; }
  };

  // Auto-wire on load, unless a harness asked to drive Hub without DOM wiring.
  if (!window.__ELG_NO_WIRE__) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
    else wire();
  }
})();
