/* Complete the Five — a EuroLeague Final Four team's starting five is shown on a
 * half-court with one starter hidden; guess him in 2 tries. Modes: Daily (date-
 * seeded — same five + same hidden man for everyone, streak) + Easy/Medium/Hard
 * practice (who's hidden, by fame rank). Depends on window.LINEUPS (lineups.js) +
 * PLAYERS / LEGENDS for the guess pool. Exposes window.CompleteFive. */
(function () {
  "use strict";

  var LINEUPS = window.LINEUPS || [];
  var PLAYERS = window.PLAYERS || [];
  var LEGENDS = window.LEGENDS || [];
  var MAX = 2;
  var POS_ORDER = ["PG", "SG", "SF", "PF", "C"];

  var K = {
    diff: "elg:c5:diff", stats: "elg:c5:stats", dstats: "elg:c5:dstats",
    seen: "elg:c5:seenhelp",
    daily: function (d) { return "elg:c5:daily:" + d; }
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function randomFrom(a) { return a[Math.floor(Math.random() * a.length)]; }
  function initials(n) { var p = String(n).trim().split(/\s+/); return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || ""); }
  function avatarColor(n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return "hsl(" + (h % 360) + ",45%,42%)"; }

  // Dates + daily seed (same puzzle for everyone on a given day).
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  var els = {};
  function $(id) { return document.getElementById(id); }

  var diff = "daily";              // "daily" | "easy" | "medium" | "hard"
  var lineup = null, hiddenPos = null, target = null;
  var guesses = [], over = false, won = false, dealt = false;
  var matches = [], activeIndex = -1, POOL = [];

  function buildPool() {
    var seen = {}, pool = [];
    function add(n) { if (n && !seen[n]) { seen[n] = 1; pool.push(n); } }
    PLAYERS.forEach(function (p) { add(p.name); });
    LEGENDS.forEach(function (p) { add(p.name); });
    LINEUPS.forEach(function (L) { L.five.forEach(function (p) { add(p.name); }); });
    return pool;
  }
  function diffLabel() { return diff === "daily" ? "Daily" : diff === "easy" ? "Easy" : diff === "hard" ? "Hard" : "Medium"; }
  // Easy hides the star (fame 1); Medium a 2nd/3rd option; Hard the hardest (4/5).
  function fameBucket() { return diff === "easy" ? [1] : diff === "hard" ? [4, 5] : [2, 3]; }
  function pickHidden(five) {
    var allowed = fameBucket();
    var cands = five.filter(function (p) { return allowed.indexOf(p.fame) >= 0; });
    return (cands.length ? randomFrom(cands) : five[0]).pos;
  }
  function dailyLineup() { return LINEUPS[hashStr(todayStr()) % LINEUPS.length]; }
  function dailyHiddenPos(five) { return five[hashStr(todayStr() + "#5") % five.length].pos; }

  // --- Stats: practice (simple) + daily (streak) -----------------------------
  function defaultStats() { return { played: 0, solved: 0, curStreak: 0, maxStreak: 0 }; }
  function getStats() { return lsGet(K.stats, null) || defaultStats(); }
  function record(winFlag) {
    var s = getStats(); s.played++;
    if (winFlag) { s.solved++; s.curStreak++; if (s.curStreak > s.maxStreak) s.maxStreak = s.curStreak; } else s.curStreak = 0;
    lsSet(K.stats, s); return s;
  }
  function defaultDStats() { return { played: 0, solved: 0, curStreak: 0, maxStreak: 0, lastDate: null, lastWon: false }; }
  function getDStats() { return lsGet(K.dstats, null) || defaultDStats(); }
  function recordDaily(winFlag) {
    var s = getDStats();
    if (s.lastDate === todayStr()) return s;                 // once per day
    s.played++;
    if (winFlag) { s.solved++; s.curStreak = (s.lastDate === yesterdayStr() && s.lastWon) ? s.curStreak + 1 : 1; if (s.curStreak > s.maxStreak) s.maxStreak = s.curStreak; }
    else s.curStreak = 0;
    s.lastDate = todayStr(); s.lastWon = winFlag;
    lsSet(K.dstats, s); return s;
  }
  function renderStats() {
    if (diff === "daily") {
      var s = getDStats();
      var live = (s.lastDate === todayStr() || s.lastDate === yesterdayStr()) ? s.curStreak : 0;
      els.stats.textContent = "Daily · Solved " + s.solved + "/" + s.played + " · Streak " + live + " · Best " + s.maxStreak;
    } else {
      var p = getStats();
      els.stats.textContent = "Solved " + p.solved + "/" + p.played + " · Streak " + p.curStreak + " · Best " + p.maxStreak;
    }
  }

  // --- Rendering -------------------------------------------------------------
  function teamLabel(L) { return L.team + " · " + L.season + " Final Four" + (L.champion ? " 🏆" : ""); }
  function renderHeader() { els.header.textContent = teamLabel(lineup); }
  function renderCourt() {
    els.court.innerHTML = "";
    POS_ORDER.forEach(function (pos) {
      var p = lineup.five.filter(function (x) { return x.pos === pos; })[0];
      var hidden = (pos === hiddenPos);
      var slot = document.createElement("div");
      slot.className = "c5-slot pos-" + pos + (hidden ? " missing" : "") +
        (hidden && over ? (won ? " reveal-win" : " reveal-lose") : "");
      var lbl = document.createElement("div"); lbl.className = "c5-pos"; lbl.textContent = pos;
      var av = document.createElement("div"); av.className = "c5-av";
      var nm = document.createElement("div"); nm.className = "c5-name";
      if (hidden && !over) { av.textContent = "?"; nm.textContent = "?"; }
      else { av.style.background = avatarColor(p.name); av.textContent = initials(p.name); nm.textContent = p.name; }
      slot.appendChild(lbl); slot.appendChild(av); slot.appendChild(nm);
      els.court.appendChild(slot);
    });
  }
  function renderGuesses() {
    els.guesses.innerHTML = "";
    guesses.forEach(function (g) { var d = document.createElement("div"); d.className = "pid-wrong"; d.textContent = "✗ " + g; els.guesses.appendChild(d); });
  }
  function updateCounter() {
    if (over) { els.counter.textContent = diffLabel() + " · " + (won ? "Solved! 🎉" : "It was " + target); return; }
    var left = MAX - guesses.length;
    els.counter.textContent = diffLabel() + " · Who's the " + hiddenPos + "? · " + left + (left === 1 ? " guess left — make it count!" : " guesses left");
  }
  function updateNextBtn() {
    var practice = (diff !== "daily");                  // Daily is one-per-day: no New-five / Give-up
    if (els.next) els.next.style.display = practice ? "" : "none";
    if (els.giveup) els.giveup.style.display = practice ? "" : "none";
  }

  function dailyBannerNote() {          // warm closing line for the Daily banner
    if (diff !== "daily") return "";
    if (!won) return "<br>A new five takes the floor at midnight — come back for revenge!";
    var s = getDStats();
    return s.curStreak >= 2 ? "<br>🔥 <strong>" + s.curStreak + "-day streak</strong> — see you tomorrow!"
                            : "<br>Come back tomorrow for a new five. 👋";
  }
  function shareText() {
    var row = "", i;
    for (i = 0; i < guesses.length; i++) row += "🟥";
    if (won) row += "🟩";
    var score = won ? (guesses.length + 1) + "/" + MAX : "X/" + MAX;
    return "Complete the Five 🏀 " + todayStr() + "\n" + score + "\n" + row +
      (window.ELG ? "\n" + window.ELG.shareURL("completefive") : "");
  }
  function addShareBtn(actions) {
    if (!actions) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "share-btn alt";
    b.textContent = "Share result";
    b.addEventListener("click", function () { if (window.ELG) window.ELG.copyShare(shareText(), b); });
    actions.appendChild(b);
  }
  function showBanner() {
    els.banner.className = "banner " + (won ? "win" : "lose");
    els.banner.innerHTML = "";
    var title = document.createElement("div"); title.className = "banner-title";
    title.textContent = won ? (guesses.length === 0 ? "🎯 First try!" : "🏆 That's him!") : "😔 He got away…";
    var sub = document.createElement("div"); sub.className = "banner-sub";
    sub.innerHTML = "<span class='pname'>" + target + "</span> — " + hiddenPos + ", " + teamLabel(lineup) +
      dailyBannerNote();
    var actions = document.createElement("div"); actions.className = "banner-actions";
    var btn = document.createElement("button"); btn.type = "button";
    if (diff === "daily") { btn.textContent = "Practice mode"; btn.addEventListener("click", function () { setDiff("medium"); }); }
    else { btn.textContent = "Next five"; btn.addEventListener("click", deal); }
    actions.appendChild(btn);
    if (diff === "daily") addShareBtn(actions);
    els.banner.appendChild(title); els.banner.appendChild(sub); els.banner.appendChild(actions);
    if (diff !== "daily") {
      var hint = document.createElement("div"); hint.className = "banner-hint";
      hint.textContent = "or just press Space for the next five";
      els.banner.appendChild(hint);
    }
    els.banner.hidden = false;
  }

  // --- Autocomplete (name only) ----------------------------------------------
  function closeDropdown() {
    els.dropdown.hidden = true; els.dropdown.innerHTML = ""; matches = []; activeIndex = -1;
    els.input.setAttribute("aria-expanded", "false"); els.input.removeAttribute("aria-activedescendant");
  }
  function renderDropdown() {
    els.dropdown.innerHTML = "";
    if (!matches.length) {
      if (els.input.value.trim()) {
        var e = document.createElement("div"); e.className = "dropdown-empty"; e.textContent = "No player found — try another spelling";
        els.dropdown.appendChild(e); els.dropdown.hidden = false; els.input.setAttribute("aria-expanded", "true");
      } else closeDropdown();
      return;
    }
    matches.forEach(function (name, i) {
      var item = document.createElement("div");
      item.className = "option" + (i === activeIndex ? " active" : "");
      item.id = "c5-opt-" + i; item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      item.innerHTML = "<span class='opt-avatar' style='background:" + avatarColor(name) + "'>" + initials(name) +
        "</span><span class='opt-name'>" + name + "</span>";
      item.addEventListener("pointerdown", function (ev) { ev.preventDefault(); submitGuess(name); });
      els.dropdown.appendChild(item);
    });
    els.dropdown.hidden = false; els.input.setAttribute("aria-expanded", "true");
    els.input.setAttribute("aria-activedescendant", activeIndex >= 0 ? "c5-opt-" + activeIndex : "");
  }
  function refreshMatches() {
    if (over) { closeDropdown(); return; }
    var q = norm(els.input.value.trim());
    if (!q) { closeDropdown(); return; }
    matches = POOL.filter(function (n) { return norm(n).indexOf(q) >= 0; }).slice(0, 8);
    activeIndex = matches.length ? 0 : -1;
    renderDropdown();
  }

  // --- Game flow -------------------------------------------------------------
  function saveDaily() { lsSet(K.daily(todayStr()), { guesses: guesses, done: over, won: won }); }
  function submitGuess(name) {
    if (over || !name) return;
    els.input.value = ""; closeDropdown();
    if (name === target) { won = true; over = true; finish(); return; }
    guesses.push(name); renderGuesses();
    if (guesses.length >= MAX) { won = false; over = true; finish(); }
    else { if (diff === "daily") saveDaily(); updateCounter(); if (els.sr) els.sr.textContent = "Not quite. " + (MAX - guesses.length) + " guess left."; els.input.focus(); }
  }
  function finish() {
    els.input.disabled = true;
    if (diff === "daily") { recordDaily(won); saveDaily(); } else record(won);
    renderStats(); renderCourt(); updateCounter(); showBanner();
    if (els.sr) els.sr.textContent = (won ? "Correct! " : "Out of guesses. ") + target + ".";
  }

  function setupTarget() { target = lineup.five.filter(function (p) { return p.pos === hiddenPos; })[0].name; }
  function resetRound() {
    guesses = []; over = false; won = false; dealt = true;
    els.input.disabled = false; els.input.value = ""; els.banner.hidden = true;
  }
  function dealDaily() {
    lineup = dailyLineup();
    hiddenPos = dailyHiddenPos(lineup.five);
    setupTarget();
    resetRound();
    var saved = lsGet(K.daily(todayStr()), null);
    if (saved) { (saved.guesses || []).forEach(function (n) { guesses.push(n); }); over = !!saved.done; won = !!saved.won; }
    renderHeader(); renderCourt(); renderGuesses(); closeDropdown(); updateNextBtn();
    if (over) { els.input.disabled = true; showBanner(); updateCounter(); }
    else { updateCounter(); els.input.focus(); }
  }
  function deal() {
    if (diff === "daily") { dealDaily(); return; }
    if (!LINEUPS.length) { els.counter.textContent = "No lineups loaded."; return; }
    lineup = randomFrom(LINEUPS);
    hiddenPos = pickHidden(lineup.five);
    setupTarget();
    resetRound();
    renderHeader(); renderCourt(); renderGuesses(); updateCounter(); updateNextBtn(); closeDropdown();
    els.input.focus();
  }
  function giveUp() { if (over || diff === "daily") return; won = false; over = true; finish(); }   // reveal the answer (practice only)
  function setDiff(d) {
    diff = ({ daily: 1, easy: 1, medium: 1, hard: 1 })[d] ? d : "daily";
    lsSet(K.diff, diff);
    [["daily", els.tabDaily], ["easy", els.tabEasy], ["medium", els.tabMedium], ["hard", els.tabHard]].forEach(function (pr) {
      if (!pr[1]) return;
      var sel = pr[0] === diff;
      pr[1].classList.toggle("active", sel);
      pr[1].setAttribute("aria-selected", sel ? "true" : "false");
      pr[1].tabIndex = sel ? 0 : -1;
    });
    renderStats(); deal();
  }

  // --- How-to modal ------------------------------------------------------------
  var lastFocus = null;
  function openInfo() {
    if (!els.infoModal) return;
    lsSet(K.seen, true);                                   // seen it → never auto-open again
    lastFocus = document.activeElement;
    els.infoModal.hidden = false;
    var d = els.infoModal.firstElementChild; if (d && d.focus) d.focus();
  }
  function closeInfo() {
    if (!els.infoModal) return;
    els.infoModal.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }
  function maybeFirstHelp() {                              // first visit → show the rules once
    if (lsGet(K.seen, false)) return false;
    openInfo();
    return true;
  }
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
  function onKeyDown(e) {
    if (els.dropdown.hidden) return;
    if (!matches.length) { if (e.key === "Escape") closeDropdown(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = (activeIndex + 1) % matches.length; renderDropdown(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = (activeIndex - 1 + matches.length) % matches.length; renderDropdown(); }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIndex >= 0 && matches[activeIndex]) submitGuess(matches[activeIndex]); }
    else if (e.key === "Escape") closeDropdown();
  }
  function onDiffKey(e) {
    var order = ["daily", "easy", "medium", "hard"], i = order.indexOf(diff), n = order.length, next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order[(i + n - 1) % n];
    else if (e.key === "Home") next = order[0];
    else if (e.key === "End") next = order[n - 1];
    if (!next) return;
    e.preventDefault(); setDiff(next);
    ({ daily: els.tabDaily, easy: els.tabEasy, medium: els.tabMedium, hard: els.tabHard })[next].focus();
  }
  // Space → next five once a PRACTICE game is over (not Daily — one per day).
  function onGlobalKey(e) {
    if (els.infoModal && !els.infoModal.hidden) return;
    if (!over || diff === "daily") return;
    if (e.key !== " " && e.code !== "Space" && e.keyCode !== 32) return;
    if (els.view && els.view.hidden) return;
    var t = e.target;
    if (t && t.tagName && t.tagName.toUpperCase() === "BUTTON") return;
    if (e.preventDefault) e.preventDefault();
    deal();
  }

  function init() {
    els.input = $("c5-input"); els.dropdown = $("c5-dropdown"); els.court = $("c5-court");
    els.header = $("c5-header"); els.counter = $("c5-counter"); els.banner = $("c5-banner");
    els.guesses = $("c5-guesses"); els.stats = $("c5-stats"); els.sr = $("c5-sr"); els.next = $("c5-next"); els.giveup = $("c5-giveup");
    els.diffRow = $("c5-diff"); els.tabDaily = $("c5-daily"); els.tabEasy = $("c5-easy");
    els.tabMedium = $("c5-medium"); els.tabHard = $("c5-hard"); els.view = $("completefive-view");
    els.infoBtn = $("c5-info-btn"); els.infoModal = $("c5-info-modal"); els.infoClose = $("c5-info-close");
    if (!els.input || !LINEUPS.length) return;

    POOL = buildPool();
    els.input.addEventListener("input", refreshMatches);
    els.input.addEventListener("keydown", onKeyDown);
    els.input.addEventListener("focus", refreshMatches);
    document.addEventListener("click", function (e) { if (e.target !== els.input && els.dropdown && !els.dropdown.contains(e.target)) closeDropdown(); });
    els.next.addEventListener("click", deal);
    if (els.giveup) els.giveup.addEventListener("click", giveUp);
    els.tabDaily.addEventListener("click", function () { if (diff !== "daily") setDiff("daily"); });
    els.tabEasy.addEventListener("click", function () { if (diff !== "easy") setDiff("easy"); });
    els.tabMedium.addEventListener("click", function () { if (diff !== "medium") setDiff("medium"); });
    els.tabHard.addEventListener("click", function () { if (diff !== "hard") setDiff("hard"); });
    if (els.diffRow) els.diffRow.addEventListener("keydown", onDiffKey);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);
    document.addEventListener("keydown", onGlobalKey);

    setDiff(lsGet(K.diff, "daily"));   // also deals the first puzzle
  }

  window.CompleteFive = {
    onShow: function () { if (!dealt) deal(); if (maybeFirstHelp()) return; if (els.input && !over) els.input.focus(); },
    goDaily: function () { setDiff("daily"); },
    goPractice: function () { setDiff("medium"); },
    _peek: function () { return { team: lineup && lineup.team, hiddenPos: hiddenPos, target: target, diff: diff }; },
    _deal: deal,
    _setDiff: setDiff,
    _guess: submitGuess,
    _shareText: shareText
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
