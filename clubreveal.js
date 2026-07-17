/* Club Reveal — whose roster is this? Names appear one at a time (least
 * recognisable first) and you name the club in as few reveals as possible.
 * 3 wrong guesses lose; a wrong guess also forces the next name out.
 * Modes: Daily (date-seeded club + reveal order, same for everyone, streak) +
 * Active (random current roster) / Legends (guess the club from its retired
 * greats). NO data file of its own — rosters come from players.js/legends.js,
 * and "recognisability" is derived from careers.js/lineups.js membership
 * (well-travelled players and F4 starters are the famous ones → revealed last).
 * Self-contained IIFE; exposes window.ClubReveal. */
(function () {
  "use strict";

  var PLAYERS = window.PLAYERS || [];
  var LEGENDS = window.LEGENDS || [];
  var CAREERS = window.CAREERS || [];
  var LINEUPS = window.LINEUPS || [];
  var MAX = 3;                       // wrong guesses allowed

  var K = {
    mode: "elg:cv:mode", stats: "elg:cv:stats", dstats: "elg:cv:dstats",
    seen: "elg:cv:seenhelp",
    daily: function (d) { return "elg:cv:daily:" + d; }
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seededShuffle(arr, seed) {          // deterministic Fisher–Yates
    var a = arr.slice(), s = seed >>> 0;
    function rnd() { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function initials(name) { var p = String(name).trim().split(/\s+/); return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || ""); }
  function avatarColor(name) { var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return "hsl(" + (h % 360) + ",45%,42%)"; }

  // --- Pools + recognisability -------------------------------------------------
  var POOLS = null;                  // { active: {club: [player,...]}, legends: {...} }
  function pools() {
    if (POOLS) return POOLS;
    var act = {}, leg = {};
    PLAYERS.forEach(function (p) { (act[p.team] = act[p.team] || []).push(p); });
    LEGENDS.forEach(function (p) { (leg[p.team] = leg[p.team] || []).push(p); });
    // a Legends round needs enough names to be a game
    Object.keys(leg).forEach(function (c) { if (leg[c].length < 4) delete leg[c]; });
    POOLS = { active: act, legends: leg };
    return POOLS;
  }
  var RECOG = null;                  // name → fame-ish score (careers + F4 fives)
  function recog(name) {
    if (!RECOG) {
      RECOG = {};
      CAREERS.forEach(function (c) { RECOG[c.name] = (RECOG[c.name] || 0) + 2; });
      LINEUPS.forEach(function (L) { L.five.forEach(function (p) { RECOG[p.name] = (RECOG[p.name] || 0) + 2; }); });
    }
    return RECOG[name] || 0;
  }
  // Obscure names first, stars last — the ramp that makes early guesses brave.
  function orderRoster(list, seed) {
    return seededShuffle(list, seed).sort(function (a, b) { return recog(a.name) - recog(b.name); });
  }

  var els = {};
  function $(id) { return document.getElementById(id); }

  var mode = "daily";                // "daily" | "active" | "legends"
  var club = null, order = [], revealed = 1, guesses = [];
  var over = false, won = false, dealt = false;
  var matches = [], activeIndex = -1;

  // Practice rounds for a mode: Active = current rosters, Legends = retired greats,
  // Both = the union (each round is one OR the other; a club can appear as both).
  function roundsFor(m) {
    var p = pools(), out = [];
    if (m !== "legends") Object.keys(p.active).forEach(function (c) { out.push({ club: c, list: p.active[c] }); });
    if (m === "legends" || m === "both") Object.keys(p.legends).forEach(function (c) { out.push({ club: c, list: p.legends[c] }); });
    return out;
  }
  function clubNames() {              // dropdown pool for the current mode (no impossible guesses)
    var seen = {};
    roundsFor(mode === "daily" ? "active" : mode).forEach(function (r) { seen[r.club] = 1; });
    return Object.keys(seen).sort();
  }

  // --- Stats: practice (simple) + daily (streak) -------------------------------
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
      els.stats.textContent = "Solved " + p.solved + "/" + p.played + " · Streak " + p.curStreak + " · Best " + p.maxStreak;
    }
  }

  // --- Rendering ----------------------------------------------------------------
  function renderList() {
    els.list.innerHTML = "";
    for (var i = 0; i < revealed && i < order.length; i++) {
      var p = order[i];
      var row = document.createElement("div"); row.className = "cv-row";
      var rank = document.createElement("span"); rank.className = "cv-rank"; rank.textContent = String(i + 1);
      var nm = document.createElement("span"); nm.className = "cv-name"; nm.textContent = p.name;
      var meta = document.createElement("span"); meta.className = "cv-meta"; meta.textContent = p.position || "";
      row.appendChild(rank); row.appendChild(nm); row.appendChild(meta);
      els.list.appendChild(row);
    }
  }
  function renderGuesses() {
    els.guesses.innerHTML = "";
    guesses.forEach(function (g) { var d = document.createElement("div"); d.className = "pid-wrong"; d.textContent = "✗ " + g; els.guesses.appendChild(d); });
  }
  function updateCounter() {
    if (over) { els.counter.textContent = won ? "Solved with " + revealed + (revealed === 1 ? " name! 🎉" : " names! 🎉") : "It was " + club; return; }
    var left = MAX - guesses.length;
    els.counter.textContent = left + (left === 1 ? " guess left — make it count!" : " guesses left");
  }
  function updateButtons() {
    if (els.next) els.next.style.display = (mode === "daily") ? "none" : "";
    if (els.giveup) els.giveup.style.display = (mode === "daily") ? "none" : "";
    if (els.reveal) els.reveal.disabled = over || revealed >= order.length;
  }

  function dailyBannerNote() {
    if (mode !== "daily") return "";
    if (!won) return "<br>A new roster lands at midnight — come back for revenge!";
    var s = getDStats();
    return s.curStreak >= 2 ? "<br>🔥 <strong>" + s.curStreak + "-day streak</strong> — see you tomorrow!"
                            : "<br>Come back tomorrow for a new roster. 👋";
  }
  function shareText() {
    var row = "", i;
    for (i = 0; i < revealed; i++) row += "🟦";
    row += won ? "🟩" : "🟥";
    var score = won
      ? "Named after " + revealed + " of " + order.length + (guesses.length ? " · " + guesses.length + (guesses.length === 1 ? " miss" : " misses") : "")
      : "X — it stayed hidden";
    return "Club Reveal 🏀 " + todayStr() + "\n" + score + "\n" + row +
      (window.ELG ? "\n" + window.ELG.shareURL("clubreveal") : "");
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
    title.textContent = won
      ? (revealed === 1 ? "🤯 One name — scout's eye!" : revealed <= 3 ? "🎯 Sharp — just " + revealed + " names" : "🏆 Got it!")
      : "😔 The roster kept its secret…";
    var sub = document.createElement("div"); sub.className = "banner-sub";
    sub.innerHTML = "<span class='pname'>" + club + "</span> — " + (won ? "named after " + revealed + " of " + order.length + " players" +
      (guesses.length ? ", " + guesses.length + (guesses.length === 1 ? " miss" : " misses") : ", no misses") + "." : "that was the club.") +
      dailyBannerNote();
    var actions = document.createElement("div"); actions.className = "banner-actions";
    var btn = document.createElement("button"); btn.type = "button";
    if (mode === "daily") { btn.textContent = "Practice mode"; btn.addEventListener("click", function () { setMode("both"); }); }
    else { btn.textContent = "Next club"; btn.addEventListener("click", deal); }
    actions.appendChild(btn);
    if (mode === "daily") addShareBtn(actions);
    els.banner.appendChild(title); els.banner.appendChild(sub); els.banner.appendChild(actions);
    if (mode !== "daily") {
      var hint = document.createElement("div"); hint.className = "banner-hint";
      hint.textContent = "or just press Space for the next club";
      els.banner.appendChild(hint);
    }
    els.banner.hidden = false;
  }

  // --- Autocomplete (clubs of the current mode) ----------------------------------
  function closeDropdown() {
    els.dropdown.hidden = true; els.dropdown.innerHTML = ""; matches = []; activeIndex = -1;
    els.input.setAttribute("aria-expanded", "false"); els.input.removeAttribute("aria-activedescendant");
  }
  function optionHTML(name) {
    return "<span class='opt-avatar' style='background:" + avatarColor(name) + "'>" + initials(name) + "</span>" +
      "<span class='opt-name'>" + name + "</span>";
  }
  function renderDropdown() {
    els.dropdown.innerHTML = "";
    if (!matches.length) {
      if (els.input.value.trim()) {
        var q = els.input.value.trim();
        var empty = document.createElement("div"); empty.className = "dropdown-empty";
        empty.textContent = guesses.some(function (g) { return norm(g) === norm(q); })
          ? "Already guessed — try another club" : "No club found — try another spelling";
        els.dropdown.appendChild(empty); els.dropdown.hidden = false; els.input.setAttribute("aria-expanded", "true");
      } else closeDropdown();
      return;
    }
    matches.forEach(function (name, i) {
      var item = document.createElement("div");
      item.className = "option" + (i === activeIndex ? " active" : "");
      item.id = "cv-opt-" + i; item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      item.innerHTML = optionHTML(name);
      item.addEventListener("pointerdown", function (e) { e.preventDefault(); submitGuess(name); });
      els.dropdown.appendChild(item);
    });
    els.dropdown.hidden = false; els.input.setAttribute("aria-expanded", "true");
    els.input.setAttribute("aria-activedescendant", activeIndex >= 0 ? "cv-opt-" + activeIndex : "");
  }
  function refreshMatches() {
    if (over) { closeDropdown(); return; }
    var q = norm(els.input.value.trim());
    if (!q) { closeDropdown(); return; }
    var guessed = {};
    guesses.forEach(function (g) { guessed[g] = 1; });
    matches = clubNames().filter(function (n) { return !guessed[n] && norm(n).indexOf(q) !== -1; }).slice(0, 8);
    activeIndex = matches.length ? 0 : -1;
    renderDropdown();
  }

  // --- Game flow ------------------------------------------------------------------
  function saveDaily() {
    lsSet(K.daily(todayStr()), { club: club, revealed: revealed, guesses: guesses, done: over, won: won });
  }
  function revealNext() {
    if (over || revealed >= order.length) return;
    revealed++;
    renderList(); updateCounter(); updateButtons();
    if (mode === "daily") saveDaily();
    if (els.sr) els.sr.textContent = order[revealed - 1].name + " revealed.";
  }
  function finish() {
    over = true;
    els.input.disabled = true; closeDropdown();
    if (mode === "daily") { recordDaily(won); saveDaily(); } else record(won);
    renderStats(); updateCounter(); updateButtons(); showBanner();
    if (els.sr) els.sr.textContent = (won ? "Correct! " : "Out of guesses. ") + "It was " + club + ".";
  }
  function submitGuess(name) {
    if (over || !name) return;
    if (guesses.some(function (g) { return g === name; })) return;   // repeat costs nothing
    els.input.value = ""; closeDropdown();
    if (name === club) { won = true; finish(); return; }
    guesses.push(name);
    if (revealed < order.length) revealed++;          // a miss forces the next name out
    renderGuesses(); renderList();
    if (guesses.length >= MAX) { won = false; finish(); return; }
    if (mode === "daily") saveDaily();
    updateCounter(); updateButtons();
    if (els.sr) els.sr.textContent = "Not " + name + ". " + (MAX - guesses.length) + " guesses left.";
    els.input.focus();
  }
  function giveUp() {
    if (over || mode === "daily") return;
    won = false; finish();
  }

  function resetState() {
    revealed = 1; guesses = []; over = false; won = false; dealt = true;
    els.input.value = ""; els.input.disabled = false; els.banner.hidden = true;
  }
  function dealDaily() {
    var pool = pools().active, clubs = Object.keys(pool).sort();
    if (!clubs.length) { els.counter.textContent = "No rosters available."; return; }
    club = clubs[hashStr("cv:" + todayStr()) % clubs.length];
    order = orderRoster(pool[club], hashStr("cv:" + todayStr() + ":" + club));
    resetState();
    var saved = lsGet(K.daily(todayStr()), null);
    if (saved && saved.club === club) {
      revealed = Math.min(Math.max(saved.revealed || 1, 1), order.length);
      guesses = (saved.guesses || []).slice(0, MAX);
      over = !!saved.done; won = !!saved.won;
    }
    renderList(); renderGuesses(); closeDropdown(); updateButtons();
    if (over) { els.input.disabled = true; showBanner(); updateCounter(); }
    else { updateCounter(); els.input.focus(); }
  }
  function deal() {
    if (mode === "daily") { dealDaily(); return; }
    var rounds = roundsFor(mode);
    if (!rounds.length) { els.counter.textContent = "No rosters for this mode."; return; }
    var i = Math.floor(Math.random() * rounds.length);
    if (rounds.length > 1 && rounds[i].club === club) i = (i + 1) % rounds.length;
    club = rounds[i].club;
    order = orderRoster(rounds[i].list, (Math.random() * 4294967296) >>> 0);
    resetState();
    renderList(); renderGuesses(); updateCounter(); updateButtons(); closeDropdown(); els.input.focus();
  }

  function setMode(m) {
    mode = ({ daily: 1, active: 1, legends: 1, both: 1 })[m] ? m : "daily";
    lsSet(K.mode, mode);
    [["daily", els.tabDaily], ["active", els.tabActive], ["legends", els.tabLegends], ["both", els.tabBoth]].forEach(function (pr) {
      if (!pr[1]) return;
      var sel = pr[0] === mode;
      pr[1].classList.toggle("active", sel);
      pr[1].setAttribute("aria-selected", sel ? "true" : "false");
      pr[1].tabIndex = sel ? 0 : -1;
    });
    renderStats(); deal();
  }

  // --- How-to modal -----------------------------------------------------------------
  var lastFocus = null;
  function openInfo() {
    if (!els.infoModal) return;
    lsSet(K.seen, true);
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
  function maybeFirstHelp() {
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

  // --- Events / init -----------------------------------------------------------------
  function onKeyDown(e) {
    if (els.dropdown.hidden) return;
    if (!matches.length) { if (e.key === "Escape") closeDropdown(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = (activeIndex + 1) % matches.length; renderDropdown(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = (activeIndex - 1 + matches.length) % matches.length; renderDropdown(); }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIndex >= 0 && matches[activeIndex]) submitGuess(matches[activeIndex]); }
    else if (e.key === "Escape") closeDropdown();
  }
  function onModeKey(e) {
    var order_ = ["daily", "active", "legends", "both"], i = order_.indexOf(mode), n = order_.length, next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order_[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order_[(i + n - 1) % n];
    else if (e.key === "Home") next = order_[0];
    else if (e.key === "End") next = order_[n - 1];
    if (!next) return;
    e.preventDefault(); setMode(next);
    ({ daily: els.tabDaily, active: els.tabActive, legends: els.tabLegends, both: els.tabBoth })[next].focus();
  }
  function onGlobalKey(e) {
    if (els.infoModal && !els.infoModal.hidden) return;
    if (!over || mode === "daily") return;
    if (e.key !== " " && e.code !== "Space" && e.keyCode !== 32) return;
    if (els.view && els.view.hidden) return;
    var t = e.target;
    if (t && t.tagName && t.tagName.toUpperCase() === "BUTTON") return;
    if (e.preventDefault) e.preventDefault();
    deal();
  }

  function init() {
    els.input = $("cv-input"); els.dropdown = $("cv-dropdown"); els.list = $("cv-list");
    els.counter = $("cv-counter"); els.banner = $("cv-banner"); els.guesses = $("cv-guesses");
    els.reveal = $("cv-reveal"); els.next = $("cv-next"); els.giveup = $("cv-giveup");
    els.stats = $("cv-stats"); els.sr = $("cv-sr"); els.modeRow = $("cv-modes");
    els.tabDaily = $("cv-daily"); els.tabActive = $("cv-active"); els.tabLegends = $("cv-legends"); els.tabBoth = $("cv-both");
    els.view = $("clubreveal-view");
    els.infoBtn = $("cv-info-btn"); els.infoModal = $("cv-info-modal"); els.infoClose = $("cv-info-close");
    if (!els.input || !PLAYERS.length) return;

    els.input.addEventListener("input", refreshMatches);
    els.input.addEventListener("keydown", onKeyDown);
    els.input.addEventListener("focus", refreshMatches);
    document.addEventListener("click", function (e) { if (e.target !== els.input && els.dropdown && !els.dropdown.contains(e.target)) closeDropdown(); });
    els.reveal.addEventListener("click", revealNext);
    els.next.addEventListener("click", deal);
    if (els.giveup) els.giveup.addEventListener("click", giveUp);
    els.tabDaily.addEventListener("click", function () { if (mode !== "daily") setMode("daily"); });
    els.tabActive.addEventListener("click", function () { if (mode !== "active") setMode("active"); });
    els.tabLegends.addEventListener("click", function () { if (mode !== "legends") setMode("legends"); });
    if (els.tabBoth) els.tabBoth.addEventListener("click", function () { if (mode !== "both") setMode("both"); });
    if (els.modeRow) els.modeRow.addEventListener("keydown", onModeKey);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);
    document.addEventListener("keydown", onGlobalKey);

    setMode(lsGet(K.mode, "daily"));
  }

  window.ClubReveal = {
    onShow: function () { if (!dealt) deal(); if (maybeFirstHelp()) return; if (els.input && !over) els.input.focus(); },
    goDaily: function () { setMode("daily"); },
    goPractice: function () { setMode("both"); },
    // internal hooks used by test.js
    _peek: function () { return { mode: mode, club: club, order: order, revealed: revealed, guesses: guesses, over: over, won: won }; },
    _deal: deal,
    _setMode: setMode,
    _reveal: revealNext,
    _guess: submitGuess,
    _shareText: shareText,
    _recog: recog,
    _pools: pools
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
