/* Player ID — guess the player from his career path (clubs + years).
 * Modes: Daily (date-seeded, one per day, streak) + Active / Retired / Both (endless
 * practice). Depends on window.CAREERS (careers.js) + PLAYERS / LEGENDS for the guess
 * autocomplete. Self-contained IIFE; exposes window.PlayerID. */
(function () {
  "use strict";

  var CAREERS = window.CAREERS || [];
  var PLAYERS = window.PLAYERS || [];
  var LEGENDS = window.LEGENDS || [];
  var MAX = 2;                       // guesses per player

  var K = {
    filter: "elg:pid:filter", stats: "elg:pid:stats", dstats: "elg:pid:dstats",
    seen: "elg:pid:seenhelp",
    daily: function (d) { return "elg:pid:daily:" + d; }
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function randomFrom(a) { return a[Math.floor(Math.random() * a.length)]; }

  // Dates + daily seed (same player for everyone on a given day).
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // Initials avatar for dropdown rows (deterministic colour from the name).
  function initials(name) { var p = String(name).trim().split(/\s+/); return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || ""); }
  function avatarColor(name) { var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return "hsl(" + (h % 360) + ",45%,42%)"; }

  var els = {};
  function $(id) { return document.getElementById(id); }

  var filter = "daily";             // "daily" | "active" | "retired" | "both"
  var target = null, guesses = [], over = false, won = false, dealt = false;
  var matches = [], activeIndex = -1;

  function filterLabel() { return filter === "daily" ? "Daily" : filter === "active" ? "Active" : filter === "retired" ? "Retired" : "Both"; }
  // careers.js also carries 1-2 club players for The Grid / Path Between now;
  // a guess-from-the-route puzzle needs a route: practice wants >=2 clubs and
  // the Daily sticks to well-travelled paths (>=4) so the trip tells a story.
  function pool() {
    return CAREERS.filter(function (c) { return c.career.length >= 2 && (filter === "active" ? c.active : filter === "retired" ? !c.active : true); });
  }
  function dailyTarget() {
    var p = CAREERS.filter(function (c) { return c.career.length >= 4; });
    return p.length ? p[hashStr(todayStr()) % p.length] : null;
  }
  // Autocomplete suggests from the matching roster so the answer is always offered.
  function namePool() { return filter === "active" ? PLAYERS : filter === "retired" ? LEGENDS : PLAYERS.concat(LEGENDS); }

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
    if (filter === "daily") {
      var s = getDStats();
      var live = (s.lastDate === todayStr() || s.lastDate === yesterdayStr()) ? s.curStreak : 0;
      els.stats.textContent = "Daily · Solved " + s.solved + "/" + s.played + " · Streak " + live + " · Best " + s.maxStreak;
    } else {
      var p = getStats();
      els.stats.textContent = "Solved " + p.solved + "/" + p.played + " · Streak " + p.curStreak + " · Best " + p.maxStreak;
    }
  }

  // --- Rendering -------------------------------------------------------------
  function yearText(e) { return e.to == null ? e.from + "–now" : (e.from === e.to ? ("" + e.from) : (e.from + "–" + e.to)); }
  function renderCareer() {
    els.career.innerHTML = "";
    target.career.forEach(function (e) {
      var row = document.createElement("div"); row.className = "career-row";
      var y = document.createElement("span"); y.className = "cr-years"; y.textContent = yearText(e);
      var t = document.createElement("span"); t.className = "cr-team"; t.textContent = e.team;
      row.appendChild(y); row.appendChild(t); els.career.appendChild(row);
    });
  }
  function renderGuesses() {
    els.guesses.innerHTML = "";
    guesses.forEach(function (g) { var d = document.createElement("div"); d.className = "pid-wrong"; d.textContent = "✗ " + g; els.guesses.appendChild(d); });
  }
  function updateCounter() {
    if (over) { els.counter.textContent = filterLabel() + " · " + (won ? "Solved! 🎉" : "It was " + target.name); return; }
    var left = MAX - guesses.length;
    els.counter.textContent = filterLabel() + " · " + left + (left === 1 ? " guess left — make it count!" : " guesses left");
  }
  function updateNextBtn() { if (els.next) els.next.style.display = (filter === "daily") ? "none" : ""; }

  function dailyBannerNote() {          // warm closing line for the Daily banner
    if (filter !== "daily") return "";
    if (!won) return "<br>A new career lands at midnight — come back for revenge!";
    var s = getDStats();
    return s.curStreak >= 2 ? "<br>🔥 <strong>" + s.curStreak + "-day streak</strong> — see you tomorrow!"
                            : "<br>Come back tomorrow for a new career. 👋";
  }
  function shareText() {
    var row = "", i;
    for (i = 0; i < guesses.length; i++) row += "🟥";
    if (won) row += "🟩";
    var score = won ? (guesses.length + 1) + "/" + MAX : "X/" + MAX;
    return "Player ID 🏀 " + todayStr() + "\n" + score + "\n" + row +
      (window.ELG ? "\n" + window.ELG.shareURL("playerid") : "");
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
    title.textContent = won ? (guesses.length === 0 ? "🎯 First try!" : "🏆 Got him!") : "😔 He got away…";
    var sub = document.createElement("div"); sub.className = "banner-sub";
    sub.innerHTML = "<span class='pname'>" + target.name + "</span> — " + target.nationality + " · " + target.position +
      dailyBannerNote();
    var actions = document.createElement("div"); actions.className = "banner-actions";
    var btn = document.createElement("button"); btn.type = "button";
    if (filter === "daily") { btn.textContent = "Practice mode"; btn.addEventListener("click", function () { setFilter("both"); }); }
    else { btn.textContent = "Next player"; btn.addEventListener("click", deal); }
    actions.appendChild(btn);
    if (filter === "daily") addShareBtn(actions);
    els.banner.appendChild(title); els.banner.appendChild(sub); els.banner.appendChild(actions);
    if (filter !== "daily") {
      var hint = document.createElement("div"); hint.className = "banner-hint";
      hint.textContent = "or just press Space for the next player";
      els.banner.appendChild(hint);
    }
    els.banner.hidden = false;
  }

  // --- Autocomplete ----------------------------------------------------------
  function closeDropdown() {
    els.dropdown.hidden = true; els.dropdown.innerHTML = ""; matches = []; activeIndex = -1;
    els.input.setAttribute("aria-expanded", "false"); els.input.removeAttribute("aria-activedescendant");
  }
  // Name only — deliberately NOT showing the player's club (it would leak the answer).
  function optionHTML(p) {
    return "<span class='opt-avatar' style='background:" + avatarColor(p.name) + "'>" + initials(p.name) + "</span>" +
      "<span class='opt-name'>" + p.name + "</span>";
  }
  function renderDropdown() {
    els.dropdown.innerHTML = "";
    if (!matches.length) {
      if (els.input.value.trim()) {
        var empty = document.createElement("div"); empty.className = "dropdown-empty"; empty.textContent = "No player found — try another spelling";
        els.dropdown.appendChild(empty); els.dropdown.hidden = false; els.input.setAttribute("aria-expanded", "true");
      } else closeDropdown();
      return;
    }
    matches.forEach(function (p, i) {
      var item = document.createElement("div");
      item.className = "option" + (i === activeIndex ? " active" : "");
      item.id = "pid-opt-" + i; item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      item.innerHTML = optionHTML(p);
      item.addEventListener("pointerdown", function (e) { e.preventDefault(); submitGuess(p.name); });
      els.dropdown.appendChild(item);
    });
    els.dropdown.hidden = false; els.input.setAttribute("aria-expanded", "true");
    els.input.setAttribute("aria-activedescendant", activeIndex >= 0 ? "pid-opt-" + activeIndex : "");
  }
  function refreshMatches() {
    if (over) { closeDropdown(); return; }
    var q = norm(els.input.value.trim());
    if (!q) { closeDropdown(); return; }
    var seen = {};
    matches = namePool().filter(function (p) {
      if (seen[p.name] || norm(p.name).indexOf(q) === -1) return false;
      seen[p.name] = 1; return true;
    }).slice(0, 8);
    activeIndex = matches.length ? 0 : -1;
    renderDropdown();
  }

  // --- Game flow -------------------------------------------------------------
  function saveDaily() { lsSet(K.daily(todayStr()), { target: target.name, guesses: guesses, done: over, won: won }); }
  function submitGuess(name) {
    if (over || !name) return;
    els.input.value = ""; closeDropdown();
    if (name === target.name) { won = true; over = true; finish(); return; }
    guesses.push(name); renderGuesses();
    if (guesses.length >= MAX) { won = false; over = true; finish(); }
    else { if (filter === "daily") saveDaily(); updateCounter(); if (els.sr) els.sr.textContent = "Not quite. " + (MAX - guesses.length) + " guess left."; els.input.focus(); }
  }
  function finish() {
    els.input.disabled = true;
    if (filter === "daily") { recordDaily(won); saveDaily(); } else record(won);
    renderStats(); updateCounter(); showBanner();
    if (els.sr) els.sr.textContent = (won ? "Correct! " : "Out of guesses. ") + target.name + ".";
  }

  function dealDaily() {
    target = dailyTarget();
    if (!target) { els.counter.textContent = "No players available."; return; }
    guesses = []; over = false; won = false; dealt = true;
    els.input.value = ""; els.input.disabled = false; els.banner.hidden = true;
    var saved = lsGet(K.daily(todayStr()), null);
    if (saved && saved.target === target.name) {
      (saved.guesses || []).forEach(function (n) { guesses.push(n); });
      over = !!saved.done; won = !!saved.won;
    }
    renderCareer(); renderGuesses(); closeDropdown(); updateNextBtn();
    if (over) { els.input.disabled = true; showBanner(); updateCounter(); }
    else { updateCounter(); els.input.focus(); }
  }
  function deal() {
    if (filter === "daily") { dealDaily(); return; }
    var p = pool();
    if (!p.length) { els.counter.textContent = "No players for this filter."; return; }
    target = randomFrom(p);
    guesses = []; over = false; won = false; dealt = true;
    els.input.disabled = false; els.input.value = ""; els.banner.hidden = true;
    renderGuesses(); renderCareer(); updateCounter(); updateNextBtn(); closeDropdown(); els.input.focus();
  }

  function setFilter(f) {
    filter = ({ daily: 1, active: 1, retired: 1, both: 1 })[f] ? f : "daily";
    lsSet(K.filter, filter);
    [["daily", els.tabDaily], ["active", els.tabActive], ["retired", els.tabRetired], ["both", els.tabBoth]].forEach(function (pr) {
      if (!pr[1]) return;
      var sel = pr[0] === filter;
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
    else if (e.key === "Enter") { e.preventDefault(); if (activeIndex >= 0 && matches[activeIndex]) submitGuess(matches[activeIndex].name); }
    else if (e.key === "Escape") closeDropdown();
  }
  function onFilterKey(e) {
    var order = ["daily", "active", "retired", "both"], i = order.indexOf(filter), n = order.length, next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order[(i + n - 1) % n];
    else if (e.key === "Home") next = order[0];
    else if (e.key === "End") next = order[n - 1];
    if (!next) return;
    e.preventDefault(); setFilter(next);
    ({ daily: els.tabDaily, active: els.tabActive, retired: els.tabRetired, both: els.tabBoth })[next].focus();
  }

  // Press Space to deal the next player once a practice game is over (not in Daily).
  function onGlobalKey(e) {
    if (els.infoModal && !els.infoModal.hidden) return;
    if (!over || filter === "daily") return;
    if (e.key !== " " && e.code !== "Space" && e.keyCode !== 32) return;
    if (els.view && els.view.hidden) return;                              // only when Player ID is the visible view
    var t = e.target;
    if (t && t.tagName && t.tagName.toUpperCase() === "BUTTON") return;   // let the Next button handle its own Space
    if (e.preventDefault) e.preventDefault();                             // stop the page from scrolling
    deal();
  }

  function init() {
    els.input = $("pid-input"); els.dropdown = $("pid-dropdown"); els.career = $("pid-career");
    els.counter = $("pid-counter"); els.banner = $("pid-banner"); els.guesses = $("pid-guesses");
    els.next = $("pid-next"); els.stats = $("pid-stats"); els.sr = $("pid-sr"); els.filterRow = $("pid-filter");
    els.tabDaily = $("pid-daily"); els.tabActive = $("pid-active"); els.tabRetired = $("pid-retired"); els.tabBoth = $("pid-both");
    els.view = $("playerid-view");
    els.infoBtn = $("pid-info-btn"); els.infoModal = $("pid-info-modal"); els.infoClose = $("pid-info-close");
    if (!els.input || !CAREERS.length) return;

    els.input.addEventListener("input", refreshMatches);
    els.input.addEventListener("keydown", onKeyDown);
    els.input.addEventListener("focus", refreshMatches);
    document.addEventListener("click", function (e) { if (e.target !== els.input && els.dropdown && !els.dropdown.contains(e.target)) closeDropdown(); });
    els.next.addEventListener("click", deal);
    els.tabDaily.addEventListener("click", function () { if (filter !== "daily") setFilter("daily"); });
    els.tabActive.addEventListener("click", function () { if (filter !== "active") setFilter("active"); });
    els.tabRetired.addEventListener("click", function () { if (filter !== "retired") setFilter("retired"); });
    els.tabBoth.addEventListener("click", function () { if (filter !== "both") setFilter("both"); });
    if (els.filterRow) els.filterRow.addEventListener("keydown", onFilterKey);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);
    document.addEventListener("keydown", onGlobalKey);   // Space → next player (when over)

    setFilter(lsGet(K.filter, "daily"));   // also deals the first player
  }

  window.PlayerID = {
    onShow: function () { if (!dealt) deal(); if (maybeFirstHelp()) return; if (els.input && !over) els.input.focus(); },
    goDaily: function () { setFilter("daily"); },
    goPractice: function () { setFilter("both"); },
    // internal hooks used by the headless test (test.js)
    _peek: function () { return target; },
    _deal: deal,
    _setFilter: setFilter,
    _guess: submitGuess,
    _shareText: shareText
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
