/* Hub router — switches between the home lobby (a grid of game tiles) and the games.
 * Views are #home-view / #mystery-view / #playerid-view / #completefive-view /
 * #connections-view / #careerorder-view. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }

  var VIEWS = ["home", "mystery", "playerid", "completefive", "connections", "careerorder", "thegrid", "clubreveal", "pathbetween", "oddoneout"];
  var els = { home: $("home-view"), mystery: $("mystery-view"), playerid: $("playerid-view"), completefive: $("completefive-view"), connections: $("connections-view"), careerorder: $("careerorder-view"), thegrid: $("thegrid-view"), clubreveal: $("clubreveal-view"), pathbetween: $("pathbetween-view"), oddoneout: $("oddoneout-view") };

  // mode: "practice" | "daily" (force a mode) | undefined (plain open → resume last mode)
  function showView(name, mode) {
    if (VIEWS.indexOf(name) === -1) name = "home";
    VIEWS.forEach(function (v) { if (els[v]) els[v].hidden = (v !== name); });
    document.body.className = "view-" + name;
    if (name === "home") { refreshDailyChips(); renderHubStreak(); layoutHome(); }   // state may have changed while playing
    var api = name === "mystery" ? window.Mystery : name === "playerid" ? window.PlayerID : name === "completefive" ? window.CompleteFive : name === "connections" ? window.Connections : name === "careerorder" ? window.CareerOrder : name === "thegrid" ? window.TheGrid : name === "clubreveal" ? window.ClubReveal : name === "pathbetween" ? window.PathBetween : name === "oddoneout" ? window.OddOneOut : null;
    if (api) {
      if (mode === "daily" && api.goDaily) api.goDaily();
      else if (mode === "practice" && api.goPractice) api.goPractice();
      else if (api.onShow) api.onShow();
    }
    if (window.scrollTo) window.scrollTo(0, 0);
  }

  // --- Lobby grid packing ------------------------------------------------------
  // The tile grid fills the whole viewport below the header. Pick the column
  // count that gives the largest (most square) tiles for the current viewport
  // and tile count, so adding games shrinks the tiles instead of causing scroll.
  var HOME_GAP = 14;   // keep in sync with the .game-cards gap in index.html
  function layoutHome() {
    var grid = document.querySelector("#home-view .game-cards");
    if (!grid || els.home.hidden) return;
    var n = grid.children.length;
    var W = grid.clientWidth, H = grid.clientHeight;
    if (!n || !W || !H) return;
    var best = 1, bestSize = 0;
    for (var c = 1; c <= n; c++) {
      var r = Math.ceil(n / c);
      var tw = (W - HOME_GAP * (c - 1)) / c;
      var th = (H - HOME_GAP * (r - 1)) / r;
      var size = Math.min(tw, th);            // the square that fits the cell
      if (size > bestSize) { bestSize = size; best = c; }
    }
    grid.style.setProperty("--home-cols", best);
    grid.style.setProperty("--home-rows", Math.ceil(n / best));
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
  var DAILY_KEY = { mystery: "elg:daily:", playerid: "elg:pid:daily:", completefive: "elg:c5:daily:", connections: "elg:cn:daily:", careerorder: "elg:co:daily:", thegrid: "elg:gr:daily:", clubreveal: "elg:cv:daily:", pathbetween: "elg:pb:daily:", oddoneout: "elg:oo:daily:" };
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
      var st = dailyState(c.getAttribute("data-game"));
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
  // Deep link: ?game=<name> opens that game directly (in Practice), e.g. share a game.
  function linkedGame() {
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
      c.addEventListener("click", function () { showView(c.getAttribute("data-game")); });
    });
    var hb = $("home-btn");
    if (hb) hb.addEventListener("click", function () { showView("home"); });
    window.addEventListener("resize", layoutHome);   // no-op while a game is open
    window.addEventListener("hashchange", function () { if (hasChallenge()) showView("mystery"); });
    var linked = linkedGame();
    // A ?game= deep link opens that game ONCE, then we strip it from the URL so a
    // refresh returns to the lobby (home) instead of re-entering the game.
    if (linked && !hasChallenge() && window.history && window.history.replaceState) {
      try { window.history.replaceState(null, "", window.location.pathname); } catch (e) {}
    }
    showView(hasChallenge() ? "mystery" : (linked || "home"));
  }

  // Test hooks + programmatic refresh (the headless harness drives these directly).
  window.Hub = {
    refresh: function () { refreshDailyChips(); renderHubStreak(); },
    _reconcile: reconcileHub, _info: hubInfo, _isTodayDone: isTodayDone,
    _getHub: getHub, _setHub: setHub,
    _getTheme: getTheme, _applyTheme: applyTheme, _toggleTheme: toggleTheme
  };

  // Auto-wire on load, unless a harness asked to drive Hub without DOM wiring.
  if (!window.__ELG_NO_WIRE__) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
    else wire();
  }
})();
