/* Higher or Lower — two EuroLeague players, one rotating question: who is taller,
 * who is older, whose jersey number is higher? Tap your answer, the values are
 * revealed. Endless: one wrong answer ends the run — chase your best streak.
 * Daily: ten date-seeded matchups (same for everyone), 8+ right = solved, feeds
 * the hub streak. Zero data files — reads window.PLAYERS + window.LEGENDS
 * directly. Exposes window.HigherLower. */
(function () {
  "use strict";

  var PER_DAY = 10, PASS = 8;

  // Pool: every distinct player/legend whose height, birth year AND number we
  // hold — all three questions must be answerable for any pool member.
  var POOL = (function () {
    var seen = {}, out = [];
    (window.PLAYERS || []).concat(window.LEGENDS || []).forEach(function (p) {
      if (seen[p.name]) return; seen[p.name] = 1;
      if (typeof p.height === "number" && typeof p.birthYear === "number" && typeof p.number === "number") out.push(p);
    });
    return out;
  })();

  // The three questions. `wins` says which value takes it; minGap keeps coin-flip
  // matchups (players 1 cm apart) out of the deck. Ties are impossible by build.
  var Q = {
    height: { label: "Who is <b>taller</b>?", get: function (p) { return p.height; }, fmt: function (v) { return (v / 100).toFixed(2) + " m"; }, wins: "higher", minGap: 2 },
    age:    { label: "Who is <b>older</b>?", get: function (p) { return p.birthYear; }, fmt: function (v) { return "born " + v; }, wins: "lower", minGap: 1 },
    number: { label: "Whose <b>jersey number</b> is higher?", get: function (p) { return p.number; }, fmt: function (v) { return "#" + v; }, wins: "higher", minGap: 1 }
  };
  var DAY_MIX = ["height", "height", "height", "height", "age", "age", "age", "age", "number", "number"];
  var ENDLESS_MIX = ["height", "height", "age", "age", "number"];   // numbers are the deep cut — keep them occasional

  var K = {
    mode: "elg:hl:mode", stats: "elg:hl:stats", dstats: "elg:hl:dstats",
    seen: "elg:hl:seenhelp",
    daily: function (d) { return "elg:hl:daily:" + d; }
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // Dates + seeds (same matchups, same left/right order for everyone on a day).
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffleSeeded(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var els = {};
  function $(id) { return document.getElementById(id); }

  var mode = "daily";        // "daily" | "endless"
  var dayKey = todayStr();   // the date the Daily engine is playing (Archive replays a past one)
  var isArchive = false, pendingArchive = null;
  function dailyLabel() { return isArchive ? "Archive " + dayKey : "Daily"; }
  var lastFocus = null;
  var dayMatchups = [];      // the 10 matchups for today's Daily
  var results = [];          // per-matchup correctness (Daily)
  var matchup = null;        // current { qkey, a, b }
  var picked = null;         // 0 | 1
  var revealed = false;
  var over = false, won = false, dealt = false;
  var streak = 0;            // endless: current run

  // --- Matchup generation ------------------------------------------------------
  // Seeded rejection sampling: with a 465-strong pool and loose gap constraints
  // (>=91% of random pairs pass) this terminates in a couple of tries.
  function pickPair(qkey, rnd, used) {
    var q = Q[qkey], t, i, j, a, b;
    for (t = 0; t < 400; t++) {
      i = Math.floor(rnd() * POOL.length); j = Math.floor(rnd() * POOL.length);
      if (i === j) continue;
      a = POOL[i]; b = POOL[j];
      if (used && (used[a.name] || used[b.name])) continue;
      if (Math.abs(q.get(a) - q.get(b)) < q.minGap) continue;
      if (used) { used[a.name] = 1; used[b.name] = 1; }
      return { qkey: qkey, a: a, b: b };
    }
    for (t = 0; t < 400; t++) {                       // fallback: allow repeats, never ties
      i = Math.floor(rnd() * POOL.length); j = Math.floor(rnd() * POOL.length);
      if (i === j) continue;
      a = POOL[i]; b = POOL[j];
      if (Math.abs(q.get(a) - q.get(b)) < q.minGap) continue;
      return { qkey: qkey, a: a, b: b };
    }
    return null;
  }
  function seededDayMatchups() {
    var rnd = mulberry32(hashStr(dayKey + "#hl"));
    var seq = shuffleSeeded(DAY_MIX.slice(), rnd);
    var used = {}, out = [];
    for (var i = 0; i < PER_DAY; i++) out.push(pickPair(seq[i], rnd, used));
    return out;
  }
  function winnerIdx() {
    var q = Q[matchup.qkey], va = q.get(matchup.a), vb = q.get(matchup.b);
    return ((q.wins === "higher") === (va > vb)) ? 0 : 1;
  }

  // --- Stats -----------------------------------------------------------------
  function defaultStats() { return { runs: 0, best: 0 }; }
  function getStats() { return lsGet(K.stats, null) || defaultStats(); }
  function recordBest() { var s = getStats(); if (streak > s.best) { s.best = streak; lsSet(K.stats, s); } }
  function recordRun() { var s = getStats(); s.runs++; lsSet(K.stats, s); return s; }
  function defaultDStats() { return { played: 0, solved: 0, curStreak: 0, maxStreak: 0, lastDate: null, lastWon: false }; }
  function getDStats() { return lsGet(K.dstats, null) || defaultDStats(); }
  function recordDaily(winFlag) {
    var s = getDStats();
    if (isArchive) return s;                   // archive replays never touch streaks
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
      els.stats.textContent = "Endless · Best streak " + p.best + " · Runs " + p.runs;
    }
  }

  // --- Rendering -------------------------------------------------------------
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
  function renderQuestion() {
    if (!els.q) return;
    els.q.innerHTML = matchup ? Q[matchup.qkey].label : "";
  }
  function renderCards() {
    if (!els.cards) return;
    els.cards.innerHTML = "";
    if (!matchup) return;
    var q = Q[matchup.qkey], winI = revealed ? winnerIdx() : -1;
    [matchup.a, matchup.b].forEach(function (p, idx) {
      var b = document.createElement("button");
      b.type = "button";
      var cls = "hl-card";
      if (revealed) {
        cls += " revealed" + (idx === winI ? " win" : (idx === picked ? " lose" : " dim"));
        b.disabled = true;
      } else if (over) { b.disabled = true; }
      else b.addEventListener("click", function () { pick(idx); });
      b.className = cls;
      b.innerHTML = "<span class='hl-name'>" + esc(p.name) + "</span>" +
        "<span class='hl-team'>" + esc(p.team) + "</span>" +
        "<span class='hl-val'>" + (revealed ? esc(q.fmt(q.get(p))) : "") + "</span>";
      els.cards.appendChild(b);
      if (idx === 0) { var vs = document.createElement("div"); vs.className = "hl-vs"; vs.textContent = "vs"; els.cards.appendChild(vs); }
    });
  }
  function renderCounter() {
    if (!els.counter) return;
    if (mode === "daily") {
      if (over) { els.counter.textContent = dailyLabel() + " · done — " + scoreSoFar() + "/" + PER_DAY; return; }
      var n = Math.min(revealed ? results.length : results.length + 1, PER_DAY);
      els.counter.textContent = dailyLabel() + " · matchup " + n + " of " + PER_DAY;
    } else {
      els.counter.textContent = over ? "Endless · run over — streak " + streak : "Endless · streak " + streak;
    }
  }
  function updateButtons() {
    if (!els.next) return;
    els.next.hidden = !revealed || over;
    els.next.textContent = (mode === "daily" && results.length >= PER_DAY) ? "See results" : "Next matchup";
  }

  function dailyBannerNote() {
    if (isArchive) return " That was the " + dayKey + " edition.";
    var s = getDStats();
    if (won) return s.curStreak >= 2 ? " 🔥 " + s.curStreak + "-day streak — see you tomorrow!" : " Come back tomorrow for ten fresh ones. 👋";
    return " Ten new matchups land at midnight — come back for revenge!";
  }
  function bannerHTML(title, sub, btnLabel, btnFn, hint) {
    els.banner.innerHTML = "";
    var t = document.createElement("div"); t.className = "banner-title"; t.textContent = title;
    var s = document.createElement("div"); s.className = "banner-sub"; s.textContent = sub;
    var actions = document.createElement("div"); actions.className = "banner-actions";
    var btn = document.createElement("button"); btn.type = "button"; btn.textContent = btnLabel;
    btn.addEventListener("click", btnFn); actions.appendChild(btn);
    els.banner.appendChild(t); els.banner.appendChild(s); els.banner.appendChild(actions);
    if (hint) { var h = document.createElement("div"); h.className = "banner-hint"; h.textContent = hint; els.banner.appendChild(h); }
    els.banner.hidden = false;
    return actions;
  }
  function shareText() {
    var rows = results.map(function (r) { return r ? "🟩" : "🟥"; }).join("");
    return "Higher or Lower 🏀 " + dayKey + "\n" + scoreSoFar() + "/" + PER_DAY + "\n" + rows +
      (window.ELG ? "\n" + window.ELG.shareURL("higherlower") : "");
  }
  function addShareBtn(actions) {
    if (!actions) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "share-btn alt";
    b.textContent = "Share result";
    b.addEventListener("click", function () { if (window.ELG) window.ELG.copyShare(shareText(), b); });
    actions.appendChild(b);
  }
  function showDailyBanner() {
    if (!els.banner) return;
    var sc = scoreSoFar();
    els.banner.className = "banner " + (won ? "win" : "lose");
    var title = sc === PER_DAY ? "🤩 Perfect 10!" : won ? "🎉 Nice — " + sc + "/" + PER_DAY : "😅 " + sc + "/" + PER_DAY + " today";
    var sub = (sc === PER_DAY ? "Ten out of ten. Scouting-department stuff." : won ? "Sharp eye — that's a solve." : "Gut let you down today.") + dailyBannerNote();
    addShareBtn(bannerHTML(title, sub, "Endless mode", function () { setMode("endless"); }));
  }
  function showRunBanner() {
    if (!els.banner) return;
    var s = getStats();
    els.banner.className = "banner " + (streak >= s.best && streak > 0 ? "win" : "lose");
    var title = streak > 0 ? "🏁 Run over — streak " + streak : "🏁 Run over";
    var sub = (streak >= s.best && streak > 0 ? "That ties or sets your best. " : "") + "Best " + s.best + " · Runs " + s.runs + ".";
    bannerHTML(title, sub, "New run", deal, "or press Space for a new run");
  }
  function say(msg) { if (els.sr) els.sr.textContent = msg; }

  // --- Interaction -------------------------------------------------------------
  function saveDaily() { lsSet(K.daily(dayKey), { results: results.slice(), done: over, won: won }); }

  function pick(idx) {
    if (revealed || over || !matchup) return;
    picked = idx; revealed = true;
    var q = Q[matchup.qkey];
    var ok = idx === winnerIdx();
    won = ok;
    say((ok ? "Right — " : "Wrong — ") + matchup.a.name + " " + q.fmt(q.get(matchup.a)) + ", " + matchup.b.name + " " + q.fmt(q.get(matchup.b)) + ".");
    if (mode === "daily") { results.push(ok); saveDaily(); }
    else if (ok) { streak++; recordBest(); }
    renderCards(); renderPips(); renderCounter(); updateButtons();
    if (mode === "endless" && !ok) { over = true; recordRun(); renderStats(); renderCounter(); updateButtons(); showRunBanner(); }
  }
  function next() {
    if (mode === "endless") { if (over) deal(); else dealEndlessRound(); return; }
    if (results.length >= PER_DAY) { finishDaily(); return; }
    dealDailyRound();
  }
  function finishDaily() {
    over = true; won = scoreSoFar() >= PASS;
    recordDaily(won); saveDaily();
    renderStats(); renderPips(); renderCounter(); updateButtons(); showDailyBanner();
    say("Daily complete — " + scoreSoFar() + " of " + PER_DAY + " right.");
  }

  // --- Deal ------------------------------------------------------------------
  function clearRound() { picked = null; revealed = false; if (els.banner) els.banner.hidden = true; say(""); }
  function renderRound() { renderQuestion(); renderCards(); renderPips(); renderCounter(); updateButtons(); }
  function dealDailyRound() {
    matchup = dayMatchups[results.length];
    clearRound(); renderRound();
  }
  function dealEndlessRound() {
    matchup = pickPair(ENDLESS_MIX[Math.floor(Math.random() * ENDLESS_MIX.length)], Math.random, null);
    clearRound(); renderRound();
  }
  function dealDaily() {
    dayMatchups = seededDayMatchups();
    over = false; won = false; results = []; dealt = true;
    var saved = lsGet(K.daily(dayKey), null);
    if (saved && saved.results) {
      results = saved.results.slice();
      if (results.length >= PER_DAY || saved.done) {
        matchup = dayMatchups[PER_DAY - 1]; clearRound();
        if (saved.done) { over = true; won = !!saved.won; renderRound(); renderStats(); showDailyBanner(); }
        else { finishDaily(); renderRound(); }     // answered all ten, never clicked "See results"
        return;
      }
    }
    dealDailyRound(); renderStats();
  }
  function deal() {
    if (mode === "daily") { dealDaily(); return; }
    if (!POOL.length) { if (els.counter) els.counter.textContent = "No players loaded."; return; }
    dealt = true; over = false; won = false; streak = 0; results = [];
    dealEndlessRound(); renderStats();
  }

  function setMode(m) {
    mode = (m === "endless") ? "endless" : "daily";
    if (mode === "daily") { dayKey = pendingArchive || todayStr(); isArchive = !!pendingArchive; pendingArchive = null; }
    lsSet(K.mode, mode);
    [["daily", els.tabDaily], ["endless", els.tabEndless]].forEach(function (pr) {
      if (!pr[1]) return;
      var sel = pr[0] === mode;
      pr[1].classList.toggle("active", sel);
      pr[1].setAttribute("aria-selected", sel ? "true" : "false");
      pr[1].tabIndex = sel ? 0 : -1;
    });
    deal();
  }

  // --- How-to modal ------------------------------------------------------------
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

  // --- Events / init -----------------------------------------------------------
  function onModeKey(e) {
    var ord = ["daily", "endless"], i = ord.indexOf(mode), n = ord.length, nx = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") nx = ord[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") nx = ord[(i + n - 1) % n];
    else if (e.key === "Home") nx = ord[0]; else if (e.key === "End") nx = ord[n - 1];
    if (!nx) return;
    e.preventDefault(); setMode(nx);
    ({ daily: els.tabDaily, endless: els.tabEndless })[nx].focus();
  }
  function onGlobalKey(e) {
    if (els.infoModal && !els.infoModal.hidden) return;
    if (els.view && els.view.hidden) return;
    if (e.key !== " " && e.code !== "Space" && e.keyCode !== 32) return;
    var t = e.target; if (t && t.tagName && t.tagName.toUpperCase() === "BUTTON") return;
    if (!revealed) return;
    if (mode === "daily" && over) return;          // Daily is one-per-day
    if (e.preventDefault) e.preventDefault();
    next();
  }

  function init() {
    els.view = $("higherlower-view"); els.cards = $("hl-cards"); els.q = $("hl-q");
    els.pips = $("hl-pips"); els.counter = $("hl-counter"); els.sr = $("hl-sr");
    els.banner = $("hl-banner"); els.stats = $("hl-stats"); els.next = $("hl-next");
    els.modeRow = $("hl-modes"); els.tabDaily = $("hl-daily"); els.tabEndless = $("hl-endless");
    els.infoBtn = $("hl-info-btn"); els.infoModal = $("hl-info-modal"); els.infoClose = $("hl-info-close");
    if (!els.cards || POOL.length < 20) return;

    if (els.next) els.next.addEventListener("click", next);
    if (els.tabDaily) els.tabDaily.addEventListener("click", function () { if (mode !== "daily" || isArchive) setMode("daily"); });
    if (els.tabEndless) els.tabEndless.addEventListener("click", function () { if (mode !== "endless") setMode("endless"); });
    if (els.modeRow) els.modeRow.addEventListener("keydown", onModeKey);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);
    document.addEventListener("keydown", onGlobalKey);

    setMode(lsGet(K.mode, "daily"));
  }

  window.HigherLower = {
    onShow: function () { if (isArchive) setMode("daily"); else if (!dealt) deal(); maybeFirstHelp(); },   // a hub open always lands on TODAY's edition
    goDaily: function () { setMode("daily"); },
    goPractice: function () { setMode("endless"); },
    goArchive: function (d) { pendingArchive = /^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? String(d) : null; setMode("daily"); },
    _peek: function () {
      var q = matchup && Q[matchup.qkey];
      return { mode: mode, day: dayKey, archive: isArchive, streak: streak, results: results.slice(), over: over, won: won, revealed: revealed,
        matchup: matchup ? { qkey: matchup.qkey, wins: q.wins, aName: matchup.a.name, bName: matchup.b.name, aVal: q.get(matchup.a), bVal: q.get(matchup.b) } : null };
    },
    _deal: deal, _setMode: setMode, _next: next,
    _pick: function (idx) { pick(idx); },
    _shareText: shareText
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
