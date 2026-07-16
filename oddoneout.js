/* Odd One Out — four EuroLeague names, three share something (a club, a nationality, a
 * jersey number, a Final Four five); tap the one that doesn't belong. Every round has a
 * UNIQUE answer (guaranteed by build_oddoneout.js). Modes: Daily (5 date-seeded rounds,
 * same for everyone, feeds the hub streak) and Practice (endless, best-streak). Depends
 * on window.ODDONES (oddones.js). Exposes window.OddOneOut. */
(function () {
  "use strict";

  var ROUNDS = window.ODDONES || [];
  var PER_DAY = 5;           // rounds in a Daily
  var PASS = 4;              // Daily "solved" (✓) at 4/5 or better

  var K = {
    mode: "elg:oo:mode", stats: "elg:oo:stats", dstats: "elg:oo:dstats",
    seen: "elg:oo:seenhelp",
    daily: function (d) { return "elg:oo:daily:" + d; }
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // Dates + seeds (same rounds + same tile order for everyone on a given day).
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffleSeeded(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }

  var els = {};
  function $(id) { return document.getElementById(id); }

  var mode = "daily";        // "daily" | "practice"
  var lastFocus = null;
  var dayRounds = [];        // the 5 rounds for today's Daily
  var results = [];          // per-round correctness (Daily) — length == rounds answered
  var round = null;          // current round { names, odd, theme, axis }
  var order = [];            // display order (names)
  var picked = null;         // the name tapped this round
  var revealed = false;      // has the current round been answered?
  var over = false, won = false, dealt = false;

  // --- Round selection -------------------------------------------------------
  function seededDayRounds() {                       // 5 distinct rounds for today
    var idx = []; for (var i = 0; i < ROUNDS.length; i++) idx.push(i);
    shuffleSeeded(idx, mulberry32(hashStr(todayStr() + "#oo")));
    return idx.slice(0, PER_DAY).map(function (i) { return ROUNDS[i]; });
  }
  function orderFor(r, seed) {
    var a = r.names.slice();
    if (seed != null) shuffleSeeded(a, mulberry32(seed)); else shuffleSeeded(a, Math.random);
    return a;
  }

  // --- Stats -----------------------------------------------------------------
  function defaultStats() { return { played: 0, correct: 0, curStreak: 0, maxStreak: 0 }; }
  function getStats() { return lsGet(K.stats, null) || defaultStats(); }
  function recordPractice(ok) {
    var s = getStats(); s.played++;
    if (ok) { s.correct++; s.curStreak++; if (s.curStreak > s.maxStreak) s.maxStreak = s.curStreak; } else s.curStreak = 0;
    lsSet(K.stats, s); return s;
  }
  function defaultDStats() { return { played: 0, solved: 0, curStreak: 0, maxStreak: 0, lastDate: null, lastWon: false }; }
  function getDStats() { return lsGet(K.dstats, null) || defaultDStats(); }
  function recordDaily(winFlag) {
    var s = getDStats();
    if (s.lastDate === todayStr()) return s;
    s.played++;
    if (winFlag) { s.solved++; s.curStreak = (s.lastDate === yesterdayStr() && s.lastWon) ? s.curStreak + 1 : 1; if (s.curStreak > s.maxStreak) s.maxStreak = s.curStreak; }
    else s.curStreak = 0;
    s.lastDate = todayStr(); s.lastWon = winFlag;
    lsSet(K.dstats, s); return s;
  }
  function renderStats() {
    if (!els.stats) return;
    if (mode === "daily") {
      var s = getDStats();
      var live = (s.lastDate === todayStr() || s.lastDate === yesterdayStr()) ? s.curStreak : 0;
      els.stats.textContent = "Daily · Solved " + s.solved + "/" + s.played + " · Streak " + live + " · Best " + s.maxStreak;
    } else {
      var p = getStats();
      els.stats.textContent = "Practice · " + p.correct + "/" + p.played + " right · Streak " + p.curStreak + " · Best " + p.maxStreak;
    }
  }

  // --- Rendering -------------------------------------------------------------
  function modeLabel() { return mode === "daily" ? "Daily" : "Practice"; }
  function scoreSoFar() { return results.filter(function (x) { return x; }).length; }

  function renderPips() {
    if (!els.pips) return;
    if (mode !== "daily") { els.pips.innerHTML = ""; return; }
    var html = "";
    for (var i = 0; i < PER_DAY; i++) {
      var cls = "oo-pip";
      if (i < results.length) cls += results[i] ? " ok" : " miss";
      else if (i === results.length && !over) cls += " now";
      html += "<span class='" + cls + "'></span>";
    }
    els.pips.innerHTML = html;
  }
  function renderCounter() {
    if (!els.counter) return;
    if (over) { els.counter.textContent = modeLabel() + " · done"; return; }
    if (mode === "daily") els.counter.textContent = "Daily · round " + (results.length + 1) + " of " + PER_DAY + " — tap the odd one out";
    else els.counter.textContent = "Practice · which one doesn't belong?";
  }
  function renderTiles() {
    if (!els.tiles) return;
    els.tiles.innerHTML = "";
    order.forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "oo-tile";
      b.textContent = name;
      if (revealed) {
        if (name === round.odd) b.className += " correct";
        else if (name === picked) b.className += " wrong";
        else b.className += " dim";
        b.disabled = true;
      } else {
        b.addEventListener("click", function () { pick(name); });
      }
      els.tiles.appendChild(b);
    });
  }
  function renderReveal() {
    if (!els.reveal) return;
    if (!revealed) { els.reveal.hidden = true; els.reveal.textContent = ""; return; }
    var ok = picked === round.odd;
    els.reveal.className = "oo-reveal " + (ok ? "ok" : "miss");
    els.reveal.innerHTML = "<b>" + (ok ? "✅ Correct!" : "❌ Not quite.") + "</b> The three share one thing: they all <b>" +
      round.theme + "</b>. <b>" + round.odd + "</b> is the odd one out.";
    els.reveal.hidden = false;
  }
  function updateButtons() {
    if (els.next) {
      els.next.hidden = !revealed || over;
      els.next.textContent = (mode === "daily" && results.length >= PER_DAY - 1) ? "See results" : "Next round";
    }
  }

  function dailyBannerNote() {
    if (mode !== "daily") return "";
    var s = getDStats();
    if (won) return s.curStreak >= 2 ? " 🔥 " + s.curStreak + "-day streak — see you tomorrow!" : " Come back tomorrow for five fresh ones. 👋";
    return " Five new rounds land at midnight — come back for revenge!";
  }
  function showBanner() {              // Daily results only — Practice never shows a banner
    if (!els.banner) return;
    var sc = scoreSoFar();
    won = sc >= PASS;
    els.banner.className = "banner " + (won ? "win" : "lose");
    var title = sc === PER_DAY ? "🤩 Flawless — " + sc + "/" + PER_DAY + "!" : won ? "🎉 Nice — " + sc + "/" + PER_DAY : "😅 " + sc + "/" + PER_DAY + " today";
    var sub = (sc === PER_DAY ? "A perfect five. Ice in the veins." : won ? "Solid round of spotting the intruder." : "The intruders got the better of you today.") + dailyBannerNote();
    bannerHTML(title, sub, "Practice mode", function () { setMode("practice"); });
    els.banner.hidden = false;
  }
  function bannerHTML(title, sub, btnLabel, btnFn) {
    els.banner.innerHTML = "";
    var t = document.createElement("div"); t.className = "banner-title"; t.textContent = title;
    var s = document.createElement("div"); s.className = "banner-sub"; s.textContent = sub;
    var actions = document.createElement("div"); actions.className = "banner-actions";
    var btn = document.createElement("button"); btn.type = "button"; btn.textContent = btnLabel;
    btn.addEventListener("click", btnFn); actions.appendChild(btn);
    els.banner.appendChild(t); els.banner.appendChild(s); els.banner.appendChild(actions);
    if (mode === "practice") { var h = document.createElement("div"); h.className = "banner-hint"; h.textContent = "or press Space for the next round"; els.banner.appendChild(h); }
  }
  function say(msg) { if (els.sr) els.sr.textContent = msg; if (els.flash) { els.flash.textContent = msg; els.flash.hidden = !msg; } }

  // --- Interaction -----------------------------------------------------------
  function saveDaily() { lsSet(K.daily(todayStr()), { results: results.slice(), done: over, won: won }); }

  function pick(name) {
    if (revealed || over || !round) return;
    picked = name; revealed = true;
    var ok = name === round.odd;
    won = ok;                          // per-round outcome (Daily's aggregate grade is set in finishDaily)
    results.push(ok);
    if (mode === "daily") saveDaily(); else recordPractice(ok);
    say(ok ? "Correct. " + round.odd + " is the odd one out." : "Wrong — the odd one out is " + round.odd + ".");
    // Both modes reveal the connection, then the player advances with Next (or Space) —
    // no competing banner, so the reason is always the primary feedback.
    renderStats(); renderTiles(); renderReveal(); renderPips(); renderCounter(); updateButtons();
  }
  function next() {
    if (mode === "practice") { deal(); return; }
    if (results.length >= PER_DAY) { finishDaily(); return; }
    dealDailyRound();
  }
  function finishDaily() {
    over = true; won = scoreSoFar() >= PASS;
    recordDaily(won); saveDaily();
    renderStats(); renderPips(); renderCounter(); updateButtons(); showBanner();
    say("Daily complete — " + scoreSoFar() + " of " + PER_DAY + " correct.");
  }

  // --- Deal ------------------------------------------------------------------
  function clearRound() { picked = null; revealed = false; if (els.banner) els.banner.hidden = true; if (els.reveal) els.reveal.hidden = true; }
  function dealDailyRound() {
    round = dayRounds[results.length];
    order = orderFor(round, hashStr(todayStr() + "#" + results.length));
    clearRound();
    renderTiles(); renderReveal(); renderPips(); renderCounter(); updateButtons();
  }
  function dealDaily() {
    dayRounds = seededDayRounds();
    over = false; won = false; results = []; dealt = true;
    var saved = lsGet(K.daily(todayStr()), null);
    if (saved && saved.results) {
      results = saved.results.slice();
      if (saved.done || results.length >= PER_DAY) { over = true; won = !!saved.won; clearRound(); round = dayRounds[PER_DAY - 1]; renderTiles(); renderReveal(); renderPips(); renderCounter(); updateButtons(); renderStats(); showBanner(); return; }
    }
    dealDailyRound(); renderStats();
  }
  function deal() {
    if (mode === "daily") { dealDaily(); return; }
    if (!ROUNDS.length) { if (els.counter) els.counter.textContent = "No rounds loaded."; return; }
    dealt = true; over = false; won = false; results = [];
    round = ROUNDS[Math.floor(Math.random() * ROUNDS.length)];
    order = orderFor(round, null);
    clearRound();
    renderTiles(); renderReveal(); renderPips(); renderCounter(); updateButtons(); renderStats();
  }

  function setMode(m) {
    mode = (m === "practice") ? "practice" : "daily";
    lsSet(K.mode, mode);
    [["daily", els.tabDaily], ["practice", els.tabPractice]].forEach(function (pr) {
      if (!pr[1]) return;
      var sel = pr[0] === mode;
      pr[1].classList.toggle("active", sel);
      pr[1].setAttribute("aria-selected", sel ? "true" : "false");
      pr[1].tabIndex = sel ? 0 : -1;
    });
    deal();
  }

  // --- How-to modal ----------------------------------------------------------
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

  // --- Events / init ---------------------------------------------------------
  function onModeKey(e) {
    var ord = ["daily", "practice"], i = ord.indexOf(mode), n = ord.length, nx = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") nx = ord[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") nx = ord[(i + n - 1) % n];
    else if (e.key === "Home") nx = ord[0]; else if (e.key === "End") nx = ord[n - 1];
    if (!nx) return;
    e.preventDefault(); setMode(nx);
    ({ daily: els.tabDaily, practice: els.tabPractice })[nx].focus();
  }
  function onGlobalKey(e) {
    if (els.infoModal && !els.infoModal.hidden) return;
    if (els.view && els.view.hidden) return;
    if (e.key !== " " && e.code !== "Space" && e.keyCode !== 32) return;
    var t = e.target; if (t && t.tagName && t.tagName.toUpperCase() === "BUTTON") return;
    if (!revealed) return;
    if (mode === "daily" && over) return;      // Daily is one-per-day
    if (e.preventDefault) e.preventDefault();
    next();
  }

  function init() {
    els.view = $("oddoneout-view"); els.tiles = $("oo-tiles"); els.reveal = $("oo-reveal");
    els.pips = $("oo-pips"); els.counter = $("oo-counter"); els.sr = $("oo-sr"); els.flash = $("oo-flash");
    els.banner = $("oo-banner"); els.stats = $("oo-stats"); els.next = $("oo-next");
    els.modeRow = $("oo-modes"); els.tabDaily = $("oo-daily"); els.tabPractice = $("oo-practice");
    els.infoBtn = $("oo-info-btn"); els.infoModal = $("oo-info-modal"); els.infoClose = $("oo-info-close");
    if (!els.tiles || !ROUNDS.length) return;

    if (els.next) els.next.addEventListener("click", next);
    if (els.tabDaily) els.tabDaily.addEventListener("click", function () { if (mode !== "daily") setMode("daily"); });
    if (els.tabPractice) els.tabPractice.addEventListener("click", function () { if (mode !== "practice") setMode("practice"); });
    if (els.modeRow) els.modeRow.addEventListener("keydown", onModeKey);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);
    document.addEventListener("keydown", onGlobalKey);

    setMode(lsGet(K.mode, "daily"));
  }

  window.OddOneOut = {
    onShow: function () { if (!dealt) deal(); maybeFirstHelp(); },
    goDaily: function () { setMode("daily"); },
    goPractice: function () { setMode("practice"); },
    _peek: function () { return { mode: mode, results: results.slice(), over: over, won: won, revealed: revealed, round: round }; },
    _deal: deal, _setMode: setMode, _next: next,
    _pick: function (name) { pick(name); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
