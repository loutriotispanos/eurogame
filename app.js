/* Hub router — switches between the home lobby (a grid of game tiles) and the games.
 * Views are #home-view / #mystery-view / #playerid-view / #completefive-view /
 * #connections-view / #careerorder-view. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }

  var VIEWS = ["home", "mystery", "playerid", "completefive", "connections", "careerorder"];
  var els = { home: $("home-view"), mystery: $("mystery-view"), playerid: $("playerid-view"), completefive: $("completefive-view"), connections: $("connections-view"), careerorder: $("careerorder-view") };

  // mode: "practice" | "daily" (force a mode) | undefined (plain open → resume last mode)
  function showView(name, mode) {
    if (VIEWS.indexOf(name) === -1) name = "home";
    VIEWS.forEach(function (v) { if (els[v]) els[v].hidden = (v !== name); });
    document.body.className = "view-" + name;
    if (name === "home") refreshDailyChips();   // daily-done ticks may have changed while playing
    var api = name === "mystery" ? window.Mystery : name === "playerid" ? window.PlayerID : name === "completefive" ? window.CompleteFive : name === "connections" ? window.Connections : name === "careerorder" ? window.CareerOrder : null;
    if (api) {
      if (mode === "daily" && api.goDaily) api.goDaily();
      else if (mode === "practice" && api.goPractice) api.goPractice();
      else if (api.onShow) api.onShow();
    }
    if (window.scrollTo) window.scrollTo(0, 0);
  }

  // --- "Daily ✓ / Daily ready" chips on the lobby tiles -----------------------
  // Each game stores its finished daily under a per-game key; the hub only peeks.
  var DAILY_KEY = { mystery: "elg:daily:", playerid: "elg:pid:daily:", completefive: "elg:c5:daily:", connections: "elg:cn:daily:", careerorder: "elg:co:daily:" };
  function todayStr() {
    var d = new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function dailyState(game) {           // "ready" (not finished) | "won" | "lost"
    try {
      var v = JSON.parse(window.localStorage.getItem(DAILY_KEY[game] + todayStr()));
      if (!v || !v.done) return "ready";
      return v.won ? "won" : "lost";
    } catch (e) { return "ready"; }
  }
  function refreshDailyChips() {
    Array.prototype.forEach.call(document.querySelectorAll(".game-card"), function (c) {
      var chip = c.querySelector(".gc-daily");
      if (!chip) return;
      var st = dailyState(c.getAttribute("data-game"));
      chip.textContent = st === "won" ? "Daily ✓" : st === "lost" ? "Daily ✗" : "Daily ready";
      chip.classList.toggle("done", st === "won");
      chip.classList.toggle("lost", st === "lost");
      chip.hidden = false;
    });
  }

  function hasChallenge() { return /[#&]c=/.test(window.location.hash || ""); }
  // Deep link: ?game=<name> opens that game directly (in Practice), e.g. share a game.
  function linkedGame() {
    var m = /[?&]game=([a-z]+)/i.exec(window.location.search || "");
    var g = m && m[1].toLowerCase();
    return (g && VIEWS.indexOf(g) > 0) ? g : null;   // any view except "home"
  }

  function wire() {
    var cards = document.querySelectorAll(".game-card");
    Array.prototype.forEach.call(cards, function (c) {
      // Plain open: each game resumes its last-used mode (Daily for first-timers).
      c.addEventListener("click", function () { showView(c.getAttribute("data-game")); });
    });
    var hb = $("home-btn");
    if (hb) hb.addEventListener("click", function () { showView("home"); });
    window.addEventListener("hashchange", function () { if (hasChallenge()) showView("mystery"); });
    var linked = linkedGame();
    // A ?game= deep link opens that game ONCE, then we strip it from the URL so a
    // refresh returns to the lobby (home) instead of re-entering the game.
    if (linked && !hasChallenge() && window.history && window.history.replaceState) {
      try { window.history.replaceState(null, "", window.location.pathname); } catch (e) {}
    }
    showView(hasChallenge() ? "mystery" : (linked || "home"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
