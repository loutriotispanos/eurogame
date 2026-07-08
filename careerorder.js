/* Career Order — a player's clubs are shown shuffled; put them in the right
 * chronological order (earliest → latest). The player's NAME is shown (this is the
 * inverse of Player ID, which hides it); years are hidden until the reveal. Move rows
 * with ▲/▼, then Check — correctly-placed clubs light green. Modes: Daily (date-seeded,
 * streak) + Easy/Medium/Hard by career length. Depends on window.CAREERS (careers.js).
 * Exposes window.CareerOrder. */
(function () {
  "use strict";

  var CAREERS = window.CAREERS || [];

  var K = {
    diff: "elg:co:diff", stats: "elg:co:stats", dstats: "elg:co:dstats",
    seen: "elg:co:seenhelp",
    daily: function (d) { return "elg:co:daily:" + d; }
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffleSeeded(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }

  // --- Suitable careers: >= 3 clubs, no repeated club (repeats make identical,
  //     ambiguous tiles). Bucketed by length for the difficulty tabs. -----------
  function distinct(c) { var s = {}; for (var i = 0; i < c.career.length; i++) { if (s[c.career[i].team]) return false; s[c.career[i].team] = 1; } return true; }
  var SUIT = CAREERS.filter(function (c) { return c.career && c.career.length >= 3 && distinct(c); });
  var POOLS = {
    easy: SUIT.filter(function (c) { return c.career.length <= 4; }),
    medium: SUIT.filter(function (c) { return c.career.length === 5 || c.career.length === 6; }),
    hard: SUIT.filter(function (c) { return c.career.length >= 7; }),
    daily: SUIT.filter(function (c) { return c.career.length >= 4 && c.career.length <= 7; })
  };
  var CHECKS = 3;                 // checks allowed before the answer is revealed

  var els = {};
  function $(id) { return document.getElementById(id); }

  var diff = "daily";            // "daily" | "easy" | "medium" | "hard"
  var lastFocus = null;
  var player = null;             // a CAREERS entry
  var segments = [];             // player's clubs, sorted chronologically (correct order)
  var order = [];                // display order: order[displayPos] = original index
  var confirmed = [];            // segment indices confirmed correct — sticky green until that club moves out of its slot
  var showYears = false;
  var tries = 0, MAX = CHECKS, over = false, won = false, dealt = false;
  function inConfirmed(s) { return confirmed.indexOf(s) >= 0; }
  function unlock(s) { confirmed = confirmed.filter(function (x) { return x !== s; }); }
  function sanitizeConfirmed() { confirmed = confirmed.filter(function (s) { return order[s] === s; }); }  // safety: greens must sit in their correct slot

  // --- Selection -------------------------------------------------------------
  function poolFor(d) { return d === "daily" ? POOLS.daily : POOLS[d] || POOLS.medium; }
  function dailyPlayer() { var p = POOLS.daily; return p[hashStr(todayStr()) % p.length]; }
  function buildSegments(c) { return c.career.slice().sort(function (a, b) { return a.from - b.from; }); }
  function identity(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function isIdentity(a) { for (var i = 0; i < a.length; i++) if (a[i] !== i) return false; return true; }
  function scramble(n, rnd) { var a = identity(n); do { shuffleSeeded(a, rnd); } while (isIdentity(a) && n > 1); return a; }

  // --- Stats -----------------------------------------------------------------
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
  function diffLabel() { return diff === "daily" ? "Daily" : diff === "easy" ? "Easy" : diff === "hard" ? "Hard" : diff === "medium" ? "Medium" : "Medium"; }
  function correctCount() { var n = 0; for (var i = 0; i < order.length; i++) if (order[i] === i) n++; return n; }
  function renderClue() {
    if (!els.clue) return;
    if (!player) { els.clue.textContent = ""; return; }
    var meta = [player.position, player.nationality, player.active ? "active" : "retired"].filter(Boolean).join(" · ");
    els.clue.innerHTML = "<span class='co-name'>" + player.name + "</span><span class='co-meta'>" + meta + "</span>";
  }
  function renderList() {
    if (!els.list) return;
    els.list.innerHTML = "";
    order.forEach(function (origIdx, i) {
      var seg = segments[origIdx];
      var row = document.createElement("div");
      var ok = inConfirmed(origIdx);                          // sticky green: confirmed + still in its slot
      row.className = "co-row" + (ok ? " co-correct" : "");
      row.setAttribute("data-oi", origIdx);                    // original segment index → rebuild order after a drag
      var grip = document.createElement("span"); grip.className = "co-grip"; grip.textContent = "≡"; grip.setAttribute("aria-hidden", "true");
      if (!over) grip.addEventListener("pointerdown", (function (r, g) { return function (e) { dragStart(e, r, g); }; })(row, grip));
      var rank = document.createElement("span"); rank.className = "co-rank"; rank.textContent = (i + 1);
      var club = document.createElement("span"); club.className = "co-club";
      club.textContent = seg.team + (showYears ? "  " + seg.from + "–" + (seg.to == null ? "now" : seg.to) : "");
      var moves = document.createElement("span"); moves.className = "co-moves";
      var up = document.createElement("button"); up.type = "button"; up.className = "co-mv"; up.textContent = "▲";
      up.setAttribute("aria-label", "Move " + seg.team + " earlier"); up.disabled = over || i === 0;
      var dn = document.createElement("button"); dn.type = "button"; dn.className = "co-mv"; dn.textContent = "▼";
      dn.setAttribute("aria-label", "Move " + seg.team + " later"); dn.disabled = over || i === order.length - 1;
      up.addEventListener("click", function () { moveRow(i, -1); });
      dn.addEventListener("click", function () { moveRow(i, 1); });
      moves.appendChild(up); moves.appendChild(dn);
      row.appendChild(grip); row.appendChild(rank); row.appendChild(club); row.appendChild(moves);
      els.list.appendChild(row);
    });
  }

  // --- Drag-and-drop reorder (pointer events → mouse + touch, no library). The
  //     ▲/▼ arrows remain the keyboard/screen-reader path. During a drag we move the
  //     real DOM node (never re-render, so pointer capture holds), then rebuild `order`
  //     from the DOM on drop. ------------------------------------------------------
  var dragRow = null, dragGrip = null, dragPid = null, dragBaseY = 0;
  function listRows() { return Array.prototype.slice.call(els.list.children); }
  function updateRanks() {
    var rows = listRows(), n = rows.length;
    rows.forEach(function (r, i) {
      var rk = r.querySelector && r.querySelector(".co-rank"); if (rk) rk.textContent = (i + 1);
      var mv = r.querySelectorAll ? r.querySelectorAll(".co-mv") : [];
      if (mv[0]) mv[0].disabled = i === 0;
      if (mv[1]) mv[1].disabled = i === n - 1;
    });
  }
  function dragStart(e, row, grip) {
    if (over || dragRow) return;
    if (e.preventDefault) e.preventDefault();
    var s = +row.getAttribute("data-oi");
    if (inConfirmed(s)) { unlock(s); row.classList.remove("co-correct"); }   // dragging a green club un-greens it
    dragRow = row; dragGrip = grip; dragPid = e.pointerId; dragBaseY = e.clientY;
    row.classList.add("co-dragging"); row.style.transition = "none";
    try { grip.setPointerCapture(e.pointerId); } catch (_) {}
  }
  function dragMove(e) {
    if (!dragRow) return;
    if (e.preventDefault) e.preventDefault();
    dragRow.style.transform = "translateY(" + (e.clientY - dragBaseY) + "px) scale(1.02)";
    var y = e.clientY, after = null;
    listRows().forEach(function (r) {
      if (r === dragRow || !r.getBoundingClientRect) return;
      var rect = r.getBoundingClientRect();
      if (y > rect.top + rect.height / 2) after = r;
    });
    var refNode = after ? after.nextSibling : els.list.firstChild;
    if (refNode !== dragRow) {                                 // crossed a neighbour → reinsert + reset baseline
      els.list.insertBefore(dragRow, refNode);
      dragBaseY = e.clientY; dragRow.style.transform = "translateY(0) scale(1.02)";
      updateRanks();
    }
  }
  function dragEnd() {
    if (!dragRow) return;
    dragRow.classList.remove("co-dragging"); dragRow.style.transform = ""; dragRow.style.transition = "";
    try { if (dragGrip) dragGrip.releasePointerCapture(dragPid); } catch (_) {}
    // Rebuild order: green (locked) clubs stay pinned to their correct slots; the
    // unlocked clubs settle into the remaining gaps in their new dropped order.
    var unlockedSeq = listRows().map(function (r) { return +r.getAttribute("data-oi"); }).filter(function (s) { return !inConfirmed(s); });
    var newOrder = [], u = 0;
    for (var i = 0; i < order.length; i++) newOrder[i] = inConfirmed(i) ? i : unlockedSeq[u++];
    order = newOrder;
    dragRow = null; dragGrip = null;
    renderList(); updateCounter(); updateButtons();
  }
  function updateCounter() {
    if (!els.counter) return;
    if (over) { els.counter.textContent = diffLabel() + " · " + (won ? "Solved it! 🎉" : "It was: " + segments.map(function (s) { return s.team; }).join(" → ")); return; }
    var left = MAX - tries;
    var extra = confirmed.length ? " · " + confirmed.length + "/" + order.length + " locked in" : "";
    els.counter.textContent = diffLabel() + " · order earliest → latest · " + left + (left === 1 ? " check left" : " checks left") + extra;
  }
  function updateButtons() {
    if (els.check) els.check.disabled = over;
    var practice = (diff !== "daily");
    if (els.next) els.next.style.display = practice ? "" : "none";
    if (els.giveup) els.giveup.style.display = practice ? "" : "none";
    if (els.giveup) els.giveup.disabled = over;
  }
  function dailyBannerNote() {          // warm closing line for the Daily banner
    if (diff !== "daily") return "";
    if (!won) return "<br>A new career lands at midnight — come back for revenge!";
    var s = getDStats();
    return s.curStreak >= 2 ? "<br>🔥 <strong>" + s.curStreak + "-day streak</strong> — see you tomorrow!"
                            : "<br>Come back tomorrow for a new career. 👋";
  }
  function showBanner() {
    if (!els.banner) return;
    els.banner.className = "banner " + (won ? "win" : "lose");
    els.banner.innerHTML = "";
    var title = document.createElement("div"); title.className = "banner-title";
    title.textContent = won ? (tries === 0 ? "🎯 First check — nailed it!" : "🎉 Correct order!") : "😅 A twisty career, that one!";
    var sub = document.createElement("div"); sub.className = "banner-sub";
    sub.innerHTML = "<span class='pname'>" + player.name + "</span> — " + segments.map(function (s) { return s.team; }).join(" → ") +
      dailyBannerNote();
    var actions = document.createElement("div"); actions.className = "banner-actions";
    var btn = document.createElement("button"); btn.type = "button";
    if (diff === "daily") { btn.textContent = "Practice mode"; btn.addEventListener("click", function () { setDiff("medium"); }); }
    else { btn.textContent = "Next player"; btn.addEventListener("click", deal); }
    actions.appendChild(btn);
    els.banner.appendChild(title); els.banner.appendChild(sub); els.banner.appendChild(actions);
    if (diff !== "daily") {
      var hint = document.createElement("div"); hint.className = "banner-hint"; hint.textContent = "or just press Space for the next player";
      els.banner.appendChild(hint);
    }
    els.banner.hidden = false;
  }
  function say(m) { if (els.sr) els.sr.textContent = m; }

  // --- Interaction -----------------------------------------------------------
  function moveRow(i, dir) {
    if (over) return;
    var n = order.length, j = i + dir;
    while (j >= 0 && j < n && inConfirmed(order[j])) j += dir;   // green (locked) clubs don't move — skip over them
    if (j < 0 || j >= n) return;                                 // nothing movable that way
    if (inConfirmed(order[i])) unlock(order[i]);                 // moving a green club un-greens ONLY that club
    var t = order[i]; order[i] = order[j]; order[j] = t;
    renderList(); updateCounter(); updateButtons();
  }
  function saveDaily() { lsSet(K.daily(todayStr()), { order: order.slice(), tries: tries, confirmed: confirmed.slice(), done: over, won: won }); }

  function check() {
    if (over) return;
    var correct = correctCount();
    for (var i = 0; i < order.length; i++) if (order[i] === i && !inConfirmed(i)) confirmed.push(i);   // lock the correct ones green (sticky)
    if (correct === order.length) { won = true; over = true; finish(); return; }
    tries++;
    say(correct + " of " + order.length + " clubs in the right spot.");
    if (diff === "daily") saveDaily();
    if (tries >= MAX) { won = false; over = true; finish(); return; }
    renderList(); updateCounter(); updateButtons();
  }
  function finish() {
    order = identity(segments.length); confirmed = identity(segments.length); showYears = true;   // reveal correct order + years
    if (diff === "daily") { recordDaily(won); saveDaily(); } else record(won);
    renderStats(); renderList(); updateCounter(); updateButtons(); showBanner();
    say((won ? "Correct! " : "Out of checks. ") + player.name + "'s clubs, earliest to latest: " + segments.map(function (s) { return s.team; }).join(", ") + ".");
  }
  function giveUp() { if (over || diff === "daily") return; won = false; over = true; finish(); }

  // --- Deal ------------------------------------------------------------------
  function resetRound() { tries = 0; confirmed = []; showYears = false; over = false; won = false; dealt = true; if (els.banner) els.banner.hidden = true; say(""); }
  function setup(c, seed) {
    player = c;
    segments = buildSegments(c);
    MAX = CHECKS;
    order = scramble(segments.length, seed == null ? Math.random : mulberry32(seed));
  }
  function dealDaily() {
    var p = POOLS.daily;
    if (!p.length) { if (els.counter) els.counter.textContent = "No players loaded."; return; }
    setup(dailyPlayer(), hashStr(todayStr() + "#order"));
    resetRound();
    var saved = lsGet(K.daily(todayStr()), null);
    if (saved && saved.order && saved.order.length === segments.length) {
      order = saved.order.slice(); tries = saved.tries || 0; confirmed = (saved.confirmed || []).slice(); over = !!saved.done; won = !!saved.won;
      if (over) { showYears = true; order = identity(segments.length); confirmed = identity(segments.length); }
      sanitizeConfirmed();
    }
    renderAll();
    if (over) showBanner();
  }
  function deal() {
    if (diff === "daily") { dealDaily(); return; }
    var p = poolFor(diff);
    if (!p.length) { if (els.counter) els.counter.textContent = "No players in this mode."; return; }
    setup(p[Math.floor(Math.random() * p.length)], null);
    resetRound();
    renderAll();
  }
  function renderAll() { renderClue(); renderList(); updateCounter(); updateButtons(); renderStats(); }

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
    deal();
  }

  // --- How-to modal ----------------------------------------------------------
  function openInfo() { if (!els.infoModal) return; lsSet(K.seen, true); lastFocus = document.activeElement; els.infoModal.hidden = false; var d = els.infoModal.firstElementChild; if (d && d.focus) d.focus(); }
  function maybeFirstHelp() { if (lsGet(K.seen, false)) return false; openInfo(); return true; }   // first visit → rules once
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
  function onDiffKey(e) {
    var o = ["daily", "easy", "medium", "hard"], i = o.indexOf(diff), n = o.length, next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = o[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = o[(i + n - 1) % n];
    else if (e.key === "Home") next = o[0];
    else if (e.key === "End") next = o[n - 1];
    if (!next) return;
    e.preventDefault(); setDiff(next);
    ({ daily: els.tabDaily, easy: els.tabEasy, medium: els.tabMedium, hard: els.tabHard })[next].focus();
  }
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
    els.view = $("careerorder-view"); els.clue = $("co-clue"); els.list = $("co-list");
    els.counter = $("co-counter"); els.sr = $("co-sr"); els.banner = $("co-banner"); els.stats = $("co-stats");
    els.check = $("co-check"); els.giveup = $("co-giveup"); els.next = $("co-next");
    els.diffRow = $("co-diff"); els.tabDaily = $("co-daily"); els.tabEasy = $("co-easy"); els.tabMedium = $("co-medium"); els.tabHard = $("co-hard");
    els.infoBtn = $("co-info-btn"); els.infoModal = $("co-info-modal"); els.infoClose = $("co-info-close");
    if (!els.list || !SUIT.length) return;

    if (els.check) els.check.addEventListener("click", check);
    if (els.giveup) els.giveup.addEventListener("click", giveUp);
    if (els.next) els.next.addEventListener("click", deal);
    if (els.tabDaily) els.tabDaily.addEventListener("click", function () { if (diff !== "daily") setDiff("daily"); });
    if (els.tabEasy) els.tabEasy.addEventListener("click", function () { if (diff !== "easy") setDiff("easy"); });
    if (els.tabMedium) els.tabMedium.addEventListener("click", function () { if (diff !== "medium") setDiff("medium"); });
    if (els.tabHard) els.tabHard.addEventListener("click", function () { if (diff !== "hard") setDiff("hard"); });
    if (els.diffRow) els.diffRow.addEventListener("keydown", onDiffKey);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);
    document.addEventListener("keydown", onGlobalKey);
    document.addEventListener("pointermove", dragMove);
    document.addEventListener("pointerup", dragEnd);
    document.addEventListener("pointercancel", dragEnd);

    setDiff(lsGet(K.diff, "daily"));   // also deals the first player
  }

  window.CareerOrder = {
    onShow: function () { if (!dealt) deal(); maybeFirstHelp(); },
    goDaily: function () { setDiff("daily"); },
    goPractice: function () { setDiff("medium"); },
    _peek: function () { return { diff: diff, name: player && player.name, len: segments.length, order: order.slice(), confirmed: confirmed.slice(), tries: tries, over: over, won: won, correct: segments.map(function (s) { return s.team; }) }; },
    _deal: deal, _setDiff: setDiff,
    _setOrder: function (arr) { if (arr && arr.length === order.length) { order = arr.slice(); sanitizeConfirmed(); renderList(); } },
    _move: moveRow,
    _check: check,
    _solve: function () { order = identity(segments.length); confirmed = []; check(); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
