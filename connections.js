/* Connections — 16 EuroLeague names hide four groups of four; find them all with at
 * most 3 mistakes. Modes: Daily (date-seeded — same board + layout for everyone, streak)
 * and Practice (random puzzle, replayable). Selection-based (no typing): tap up to four
 * tiles, Submit. Depends on window.PUZZLES (puzzles.js). Exposes window.Connections. */
(function () {
  "use strict";

  var PUZZLES = window.PUZZLES || [];
  var GROUP = 4;             // members per group
  var MAX_MIST = 3;          // mistakes allowed before the game ends

  var K = {
    mode: "elg:cn:mode", stats: "elg:cn:stats", dstats: "elg:cn:dstats",
    seen: "elg:cn:seenhelp",
    daily: function (d) { return "elg:cn:daily:" + d; }
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // Dates + daily seed (same puzzle + same tile layout for everyone on a given day).
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
  var lastFocus = null;      // restored when the how-to modal closes
  var puzzle = null;         // { groups: [ {theme, level, members[]} x4 ] }
  var cells = [];            // 16 tiles in display order: { name, g }
  var selected = [];         // display indices currently selected
  var solvedG = [];          // solved group indices, in solve order
  var mistakes = 0, over = false, won = false, dealt = false;
  var tried = [];            // signatures of guesses already made (block dup submits)
  var hist = [];             // per-guess group levels, e.g. [[1,3,1,1], …] — the share rows

  // --- Puzzle selection ------------------------------------------------------
  function dailyPuzzle() { return PUZZLES[hashStr(todayStr()) % PUZZLES.length]; }
  function buildCells(p, seededOrder) {
    var flat = [];
    p.groups.forEach(function (g, gi) { g.members.forEach(function (name) { flat.push({ name: name, g: gi }); }); });
    var order = [];
    for (var i = 0; i < flat.length; i++) order.push(i);
    if (seededOrder != null) shuffleSeeded(order, mulberry32(seededOrder));
    else shuffleSeeded(order, Math.random);
    return order.map(function (i) { return flat[i]; });
  }

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

  // --- Rendering -------------------------------------------------------------
  function modeLabel() { return mode === "daily" ? "Daily" : "Practice"; }
  function isSolved(gi) { return solvedG.indexOf(gi) >= 0; }

  function renderSolved() {
    els.solved.innerHTML = "";
    solvedG.forEach(function (gi) {
      var g = puzzle.groups[gi];
      var bar = document.createElement("div");
      bar.className = "cn-solved-bar cn-l" + g.level + (over && !won ? " revealed" : "");
      bar.innerHTML = "<div class='cn-bar-theme'>" + g.theme + "</div><div class='cn-bar-names'>" + g.members.join(", ") + "</div>";
      els.solved.appendChild(bar);
    });
  }
  function renderGrid() {
    els.grid.innerHTML = "";
    cells.forEach(function (cell, i) {
      if (isSolved(cell.g)) return;                          // solved tiles move up into the bars
      var b = document.createElement("button");
      b.type = "button"; b.className = "cn-tile" + (selected.indexOf(i) >= 0 ? " sel" : "");
      b.setAttribute("data-i", i);
      b.setAttribute("aria-pressed", selected.indexOf(i) >= 0 ? "true" : "false");
      b.textContent = cell.name;
      if (!over) b.addEventListener("click", function () { toggle(i); });
      else b.disabled = true;
      els.grid.appendChild(b);
    });
  }
  function renderMistakes() {
    if (!els.mist) return;
    els.mist.innerHTML = "";
    var left = MAX_MIST - mistakes;
    var lbl = document.createElement("span"); lbl.className = "cn-mist-lbl"; lbl.textContent = "Mistakes:";
    els.mist.appendChild(lbl);
    for (var i = 0; i < MAX_MIST; i++) { var d = document.createElement("span"); d.className = "cn-dot" + (i < left ? "" : " used"); els.mist.appendChild(d); }
  }
  function updateCounter() {
    if (!els.counter) return;
    if (over) { els.counter.textContent = modeLabel() + " · " + (won ? "Solved it! 🎉" : "So close — all groups revealed"); return; }
    els.counter.textContent = modeLabel() + " · find the four groups of four";
  }
  function updateButtons() {
    if (els.submit) els.submit.disabled = over || selected.length !== GROUP;
    if (els.deselect) els.deselect.disabled = over || selected.length === 0;
    if (els.shuffle) els.shuffle.disabled = over;
    if (els.next) els.next.style.display = (mode === "practice") ? "" : "none";      // Daily is one-per-day
  }

  function dailyBannerNote() {          // warm closing line for the Daily banner
    if (mode !== "daily") return "";
    if (!won) return " A new puzzle lands at midnight — come back for revenge!";
    var s = getDStats();
    return s.curStreak >= 2 ? " 🔥 " + s.curStreak + "-day streak — see you tomorrow!"
                            : " Come back tomorrow for a new puzzle. 👋";
  }
  function shareText() {
    var em = { 1: "🟨", 2: "🟩", 3: "🟦", 4: "🟪" };
    var rows = hist.length
      ? hist.map(function (g) { return g.map(function (lv) { return em[lv] || "⬜"; }).join(""); })
      : solvedG.map(function (gi) { var e = em[puzzle.groups[gi].level] || "⬜"; return e + e + e + e; });
    var score = won ? (mistakes === 0 ? "Flawless!" : mistakes + (mistakes === 1 ? " mistake" : " mistakes")) : "X — " + MAX_MIST + " mistakes";
    return "Connections 🏀 " + todayStr() + "\n" + score + "\n" + rows.join("\n") +
      (window.ELG ? "\n" + window.ELG.shareURL("connections") : "");
  }
  function addShareBtn(actions) {
    if (!actions) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "share-btn alt";
    b.textContent = "Share result";
    b.addEventListener("click", function () { if (window.ELG) window.ELG.copyShare(shareText(), b); });
    actions.appendChild(b);
  }
  function showBanner() {
    if (!els.banner) return;
    els.banner.className = "banner " + (won ? "win" : "lose");
    els.banner.innerHTML = "";
    var title = document.createElement("div"); title.className = "banner-title";
    title.textContent = won ? (mistakes === 0 ? "🤩 Flawless!" : "🎉 All four groups!") : "😅 Next time!";
    var sub = document.createElement("div"); sub.className = "banner-sub";
    sub.textContent = (won ? (mistakes === 0 ? "A perfect solve — zero mistakes. Take a bow!"
                                             : "Solved with " + mistakes + " mistake" + (mistakes === 1 ? "" : "s") + ".")
                          : "The four groups are revealed above — see the connections?") + dailyBannerNote();
    var actions = document.createElement("div"); actions.className = "banner-actions";
    var btn = document.createElement("button"); btn.type = "button";
    if (mode === "daily") { btn.textContent = "Practice mode"; btn.addEventListener("click", function () { setMode("practice"); }); }
    else { btn.textContent = "New puzzle"; btn.addEventListener("click", deal); }
    actions.appendChild(btn);
    if (mode === "daily") addShareBtn(actions);
    els.banner.appendChild(title); els.banner.appendChild(sub); els.banner.appendChild(actions);
    if (mode === "practice") {
      var hint = document.createElement("div"); hint.className = "banner-hint"; hint.textContent = "or just press Space for a new puzzle";
      els.banner.appendChild(hint);
    }
    els.banner.hidden = false;
  }

  function say(msg) { if (els.sr) els.sr.textContent = msg; if (els.flash) { els.flash.textContent = msg; els.flash.hidden = !msg; } }

  // --- Interaction -----------------------------------------------------------
  function toggle(i) {
    if (over) return;
    var at = selected.indexOf(i);
    if (at >= 0) selected.splice(at, 1);
    else { if (selected.length >= GROUP) return; selected.push(i); }
    say("");
    renderGrid(); updateButtons();
  }
  function deselectAll() { if (over) return; selected = []; say(""); renderGrid(); updateButtons(); }
  function shuffleBoard() {
    if (over) return;
    // reshuffle only the unsolved tiles' positions; keep selection by name
    var selNames = selected.map(function (i) { return cells[i].name; });
    shuffleSeeded(cells, Math.random);
    selected = [];
    cells.forEach(function (c, i) { if (selNames.indexOf(c.name) >= 0) selected.push(i); });
    renderGrid(); updateButtons();
  }

  function saveDaily() { lsSet(K.daily(todayStr()), { solved: solvedG.slice(), mistakes: mistakes, hist: hist.slice(), done: over, won: won }); }

  function submit() {
    if (over || selected.length !== GROUP) return;
    var picks = selected.map(function (i) { return cells[i]; });
    var sig = picks.map(function (c) { return c.name; }).sort().join("|");
    if (tried.indexOf(sig) >= 0) { say("Already tried that group."); return; }
    tried.push(sig);
    hist.push(picks.map(function (c) { return puzzle.groups[c.g].level; }));

    // Count how many of the four share the most-common group.
    var byG = {}; picks.forEach(function (c) { byG[c.g] = (byG[c.g] || 0) + 1; });
    var topG = null, top = 0;
    Object.keys(byG).forEach(function (g) { if (byG[g] > top) { top = byG[g]; topG = +g; } });

    if (top === GROUP && !isSolved(topG)) {                  // correct group
      solvedG.push(topG);
      selected = [];
      say(puzzle.groups[topG].theme + " — got it!");
      renderSolved(); renderGrid(); updateButtons();
      if (mode === "daily") saveDaily();
      if (solvedG.length === puzzle.groups.length) { won = true; over = true; finish(); }
      return;
    }
    // wrong
    mistakes++;
    renderMistakes();
    say(top === GROUP - 1 ? "One away…" : "Not a group. " + (MAX_MIST - mistakes) + " mistake" + (MAX_MIST - mistakes === 1 ? "" : "s") + " left.");
    if (els.grid) { els.grid.className = "cn-grid shake"; }   // brief shake
    if (mode === "daily") saveDaily();
    if (mistakes >= MAX_MIST) { won = false; over = true; finish(); return; }
    updateButtons();
  }

  function revealRemaining() {
    puzzle.groups.forEach(function (g, gi) { if (!isSolved(gi)) solvedG.push(gi); });
  }
  function finish() {
    selected = [];
    if (!won) revealRemaining();
    if (mode === "daily") { recordDaily(won); saveDaily(); } else record(won);
    renderStats(); renderSolved(); renderGrid(); renderMistakes(); updateCounter(); updateButtons(); showBanner();
    say((won ? "Solved! " : "Out of guesses. ") + "All groups revealed.");
  }

  // --- Deal ------------------------------------------------------------------
  function resetRound() { selected = []; solvedG = []; mistakes = 0; over = false; won = false; tried = []; hist = []; dealt = true; if (els.banner) els.banner.hidden = true; say(""); }
  function dealDaily() {
    puzzle = dailyPuzzle();
    cells = buildCells(puzzle, hashStr(todayStr() + "#board"));
    resetRound();
    var saved = lsGet(K.daily(todayStr()), null);
    if (saved) { solvedG = (saved.solved || []).slice(); mistakes = saved.mistakes || 0; hist = (saved.hist || []).slice(); over = !!saved.done; won = !!saved.won; }
    renderAll();
    if (over) showBanner();
  }
  function deal() {
    if (mode === "daily") { dealDaily(); return; }
    if (!PUZZLES.length) { if (els.counter) els.counter.textContent = "No puzzles loaded."; return; }
    puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
    cells = buildCells(puzzle, null);
    resetRound();
    renderAll();
  }
  function renderAll() { renderSolved(); renderGrid(); renderMistakes(); updateCounter(); updateButtons(); renderStats(); }

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
  function openInfo() {
    if (!els.infoModal) return;
    lsSet(K.seen, true);                                   // seen it → never auto-open again
    lastFocus = document.activeElement;
    els.infoModal.hidden = false;
    var dlg = els.infoModal.firstElementChild;
    if (dlg && dlg.focus) dlg.focus();
  }
  function maybeFirstHelp() {                              // first visit → show the rules once
    if (lsGet(K.seen, false)) return false;
    openInfo();
    return true;
  }
  function closeInfo() {
    if (!els.infoModal) return;
    els.infoModal.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
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
  function onModeKey(e) {
    var order = ["daily", "practice"], i = order.indexOf(mode), n = order.length, next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order[(i + n - 1) % n];
    else if (e.key === "Home") next = order[0];
    else if (e.key === "End") next = order[n - 1];
    if (!next) return;
    e.preventDefault(); setMode(next);
    ({ daily: els.tabDaily, practice: els.tabPractice })[next].focus();
  }
  // Space → new puzzle once a PRACTICE game is over (not Daily — one per day).
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
    els.view = $("connections-view"); els.grid = $("cn-grid"); els.solved = $("cn-solved");
    els.mist = $("cn-mistakes"); els.counter = $("cn-counter"); els.sr = $("cn-sr"); els.flash = $("cn-flash");
    els.banner = $("cn-banner"); els.stats = $("cn-stats");
    els.submit = $("cn-submit"); els.deselect = $("cn-deselect"); els.shuffle = $("cn-shuffle"); els.next = $("cn-next");
    els.modeRow = $("cn-modes"); els.tabDaily = $("cn-daily"); els.tabPractice = $("cn-practice");
    els.infoBtn = $("cn-info-btn"); els.infoModal = $("cn-info-modal"); els.infoClose = $("cn-info-close");
    if (!els.grid || !PUZZLES.length) return;

    if (els.submit) els.submit.addEventListener("click", submit);
    if (els.deselect) els.deselect.addEventListener("click", deselectAll);
    if (els.shuffle) els.shuffle.addEventListener("click", shuffleBoard);
    if (els.next) els.next.addEventListener("click", deal);
    if (els.tabDaily) els.tabDaily.addEventListener("click", function () { if (mode !== "daily") setMode("daily"); });
    if (els.tabPractice) els.tabPractice.addEventListener("click", function () { if (mode !== "practice") setMode("practice"); });
    if (els.modeRow) els.modeRow.addEventListener("keydown", onModeKey);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);
    document.addEventListener("keydown", onGlobalKey);

    setMode(lsGet(K.mode, "daily"));   // also deals the first puzzle
  }

  window.Connections = {
    onShow: function () { if (!dealt) deal(); maybeFirstHelp(); },
    goDaily: function () { setMode("daily"); },
    goPractice: function () { setMode("practice"); },
    _peek: function () { return { mode: mode, solved: solvedG.slice(), mistakes: mistakes, over: over, won: won, groups: puzzle && puzzle.groups }; },
    _deal: deal,
    _setMode: setMode,
    _shareText: shareText,
    // test hook: select the four tiles matching these names, then submit.
    _submitNames: function (names) {
      selected = [];
      names.forEach(function (nm) { for (var i = 0; i < cells.length; i++) { if (cells[i].name === nm && selected.indexOf(i) < 0) { selected.push(i); break; } } });
      submit();
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
