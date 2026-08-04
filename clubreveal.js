/* Common Club — two players, exactly one club in common. Name it.
 *
 * Was "Club Reveal", which revealed a roster name by name and asked which club
 * it was. Same question, better puzzle: you now get TWO players whose career
 * paths cross at precisely one club, and that club is the answer. 3 wrong
 * guesses lose; the score is how few guesses it took.
 *
 * THE GUARANTEE — one right answer. A pair only becomes a puzzle if it shares
 * exactly one club across EVERY club in careers.js (465 of them), not merely
 * one of the answerable ones. Checking only the answerable ones would be the
 * easy mistake: two players who also crossed at some second-division club still
 * have two crossings, and a player who remembers the obscure one is right.
 *
 * That's also why names go through clubs.js first — "Paris-Levallois" and
 * "Levallois Metropolitans" are one club, and left unmerged, Poirier+Prepelic
 * would ship as "sole shared club: Real Madrid" while the two of them also
 * shared Levallois. Two puzzles hang on that today.
 *
 * Eras do NOT have to overlap: both merely wore the shirt. (Overlapping stints
 * are Path Between's business — that game is about teammates.)
 *
 * Modes: Daily (date-seeded, anchored on a Final Four starter so it's always
 * gettable, streak) + Active (both current) / Legends (both retired) / Both
 * (any pair, including a legend paired with a current player).
 *
 * NO data file of its own: pairs are derived from careers.js at deal time,
 * indexed by club so only one club's members are ever paired up (~2ms) rather
 * than all 108,000 combinations (~90ms, a visible hitch on a phone).
 * Self-contained IIFE; exposes window.ClubReveal. */
(function () {
  "use strict";

  var PLAYERS = window.PLAYERS || [];
  var LEGENDS = window.LEGENDS || [];
  var CAREERS = window.CAREERS || [];
  var LINEUPS = window.LINEUPS || [];
  var MAX = 3;                       // wrong guesses allowed

  // Keys stay on the cv: namespace — records.js and archive.js read these
  // prefixes, and there's no reason to churn them for a rename. The daily save
  // validates the PAIR it holds, so a save left by the old roster game simply
  // fails to match and the day starts fresh.
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

  function canon(t) { return window.CLUBS ? window.CLUBS.canonical(t) : t; }

  // --- The answer set ----------------------------------------------------------
  // Clubs a fan could fairly be asked to name: the current EuroLeague twenty,
  // plus clubs with a real retired-legend contingent (CSKA, Treviso). careers.js
  // knows 465 clubs including Paffoni Omegna and the Phoenix Suns — asking for
  // those would be a memory test, not a puzzle. Every mode shares this one set,
  // so the answer space never shifts under the player.
  var ANSWERS = null, ANSWER_SET = null;
  function answerClubs() {
    if (ANSWERS) return ANSWERS;
    var seen = {}, legCount = {};
    PLAYERS.forEach(function (p) { seen[canon(p.team)] = 1; });
    LEGENDS.forEach(function (p) { var c = canon(p.team); legCount[c] = (legCount[c] || 0) + 1; });
    Object.keys(legCount).forEach(function (c) { if (legCount[c] >= 4) seen[c] = 1; });
    ANSWERS = Object.keys(seen).sort();
    ANSWER_SET = seen;
    return ANSWERS;
  }

  // --- Players, as club sets ---------------------------------------------------
  var UNI = null, BY_NAME = null;
  function universe() {
    if (UNI) return UNI;
    UNI = []; BY_NAME = {};
    CAREERS.forEach(function (c) {
      var set = {}, list = [];
      c.career.forEach(function (s) {
        var k = canon(s.team);
        if (!set[k]) { set[k] = 1; list.push(k); }     // one stint or three, it's one club
      });
      var p = { name: c.name, nat: c.nationality || "", pos: c.position || "", active: !!c.active, clubs: list, set: set };
      UNI.push(p); BY_NAME[c.name] = p;
    });
    return UNI;
  }
  function byName(n) { universe(); return BY_NAME[n] || null; }

  // club → the players who played there, for answerable clubs only
  var MEMBERS = null;
  function members() {
    if (MEMBERS) return MEMBERS;
    MEMBERS = {};
    answerClubs();
    universe().forEach(function (p) {
      p.clubs.forEach(function (c) { if (ANSWER_SET[c]) (MEMBERS[c] = MEMBERS[c] || []).push(p); });
    });
    return MEMBERS;
  }

  // A Final Four starter is, by definition, a name a EuroLeague fan has met.
  // The Daily requires one of the two to be one, so the puzzle always has an
  // anchor; practice drops the requirement and gets the deep cuts.
  var FAMOUS = null;
  function famous(name) {
    if (!FAMOUS) { FAMOUS = {}; LINEUPS.forEach(function (L) { L.five.forEach(function (p) { FAMOUS[p.name] = 1; }); }); }
    return !!FAMOUS[name];
  }

  // --- The core guarantee -------------------------------------------------------
  // Returns the pair's ONLY shared club, or null if they share none or several.
  // Checked across every club either player ever had, which is what makes the
  // answer unique rather than merely plausible.
  function soleSharedClub(a, b) {
    var found = null;
    for (var i = 0; i < a.clubs.length; i++) {
      if (!b.set[a.clubs[i]]) continue;
      if (found) return null;                 // a second crossing → two right answers
      found = a.clubs[i];
    }
    return found;
  }

  function fits(m, a, b) {
    if (m === "active") return a.active && b.active;
    if (m === "legends") return !a.active && !b.active;
    return true;                              // daily / both: any era, mixed included
  }
  var PCACHE = {};
  // Only pairs INSIDE one club are considered — two members of a club always
  // share it, so this asks the cheap question (do they share anything ELSE?)
  // instead of scanning every pair of careers.
  function pairsFor(clubName, m, anchored) {
    var key = m + "|" + (anchored ? 1 : 0) + "|" + clubName;
    if (PCACHE[key]) return PCACHE[key];
    var list = members()[clubName] || [], out = [];
    for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
      var a = list[i], b = list[j];
      if (!fits(m, a, b)) continue;
      if (anchored && !famous(a.name) && !famous(b.name)) continue;
      if (soleSharedClub(a, b) !== clubName) continue;
      out.push([a, b]);
    }
    PCACHE[key] = out;
    return out;
  }
  // Walks forward from a starting club so a club with no pairs for this mode
  // (Legends has nothing at Dubai BC) is skipped deterministically rather than
  // dealing an empty round.
  function pickClub(m, anchored, start) {
    var all = answerClubs(), n = all.length;
    for (var k = 0; k < n; k++) {
      var c = all[(start + k) % n], ps = pairsFor(c, m, anchored);
      if (ps.length) return { club: c, pairs: ps };
    }
    return null;
  }

  var els = {};
  function $(id) { return document.getElementById(id); }

  var mode = "daily";                // "daily" | "active" | "legends" | "both"
  var dayKey = todayStr();           // the date the Daily engine is playing (Archive replays a past one)
  var isArchive = false, pendingArchive = null;
  var club = null, pair = null, guesses = [];
  var over = false, won = false, dealt = false;
  var giveArmed = false, giveTimer = null;   // the daily asks once before it commits

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
      els.stats.textContent = "Solved " + p.solved + "/" + p.played + " · Streak " + p.curStreak + " · Best " + p.maxStreak;
    }
  }

  // --- Rendering ----------------------------------------------------------------
  function meta(p) { return [p.nat, p.pos].filter(function (x) { return x; }).join(" · "); }
  function renderPair() {
    els.list.innerHTML = "";
    if (!pair) return;
    [pair[0], null, pair[1]].forEach(function (p) {
      if (!p) {                                // the connector, between the two names
        var j = document.createElement("div"); j.className = "cv-join";
        j.textContent = "one club in common";
        els.list.appendChild(j);
        return;
      }
      var row = document.createElement("div"); row.className = "cv-row";
      var nm = document.createElement("span"); nm.className = "cv-name"; nm.textContent = p.name;
      var mt = document.createElement("span"); mt.className = "cv-meta"; mt.textContent = meta(p);
      row.appendChild(nm); row.appendChild(mt);
      els.list.appendChild(row);
    });
  }
  function renderGuesses() {
    els.guesses.innerHTML = "";
    guesses.forEach(function (g) { var d = document.createElement("div"); d.className = "pid-wrong"; d.textContent = "✗ " + g; els.guesses.appendChild(d); });
  }
  function scoreLine() {
    return guesses.length === 0 ? "first guess" : guesses.length + (guesses.length === 1 ? " miss" : " misses");
  }
  function updateCounter() {
    if (over) { els.counter.textContent = won ? "Solved — " + scoreLine() + "! 🎉" : "It was " + club; return; }
    var left = MAX - guesses.length;
    els.counter.textContent = left + (left === 1 ? " guess left — make it count!" : " guesses left");
  }
  function updateButtons() {
    if (els.next) els.next.style.display = (mode === "daily") ? "none" : "";
    // Offered on the daily too, to concede it — but never after the round is
    // settled, where it was a dead button sitting under a finished banner.
    if (els.giveup) els.giveup.style.display = over ? "none" : "";
  }

  function dailyBannerNote() {
    if (mode !== "daily") return "";
    if (isArchive) return "<br>That was the " + dayKey + " edition.";
    if (!won) return "<br>A new pair lands at midnight — come back for revenge!";
    var s = getDStats();
    return s.curStreak >= 2 ? "<br>🔥 <strong>" + s.curStreak + "-day streak</strong> — see you tomorrow!"
                            : "<br>Come back tomorrow for a new pair. 👋";
  }
  function shareText() {
    var row = "", i;
    for (i = 0; i < guesses.length; i++) row += "🟥";
    if (won) row += "🟩";
    var score = won ? (guesses.length === 0 ? "Named it first guess" : "Named it after " + scoreLine()) : "X — it stayed hidden";
    return "Common Club 🏀 " + dayKey + "\n" + score + "\n" + row +
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
      ? (guesses.length === 0 ? "🤯 First guess — scout's eye!" : guesses.length === 1 ? "🎯 Sharp — one miss" : "🏆 Got it!")
      : "😔 That crossing stayed hidden…";
    var sub = document.createElement("div"); sub.className = "banner-sub";
    // Naming the shared club is the answer; naming WHEN each of them was there is
    // the satisfying part, and it's the thing a player can't look up in the UI.
    var when = pair ? stintLine(pair[0]) + " · " + stintLine(pair[1]) : "";
    sub.innerHTML = "<span class='pname'>" + club + "</span> — " +
      (won ? "named after " + scoreLine() + "." : "that was the club.") +
      (when ? "<br>" + when : "") + dailyBannerNote();
    var actions = document.createElement("div"); actions.className = "banner-actions";
    var btn = document.createElement("button"); btn.type = "button";
    if (mode === "daily") { btn.textContent = "Practice mode"; btn.addEventListener("click", function () { setMode("both"); }); }
    else { btn.textContent = "Next pair"; btn.addEventListener("click", deal); }
    actions.appendChild(btn);
    if (mode === "daily") addShareBtn(actions);
    els.banner.appendChild(title); els.banner.appendChild(sub); els.banner.appendChild(actions);
    if (mode !== "daily") {
      var hint = document.createElement("div"); hint.className = "banner-hint";
      hint.textContent = "or just press Space for the next pair";
      els.banner.appendChild(hint);
    }
    els.banner.hidden = false;
  }
  // "Mike James 2021–" — every stint that player had at the answer club, so a
  // solved puzzle teaches something rather than just closing.
  function stintLine(p) {
    var src = null;
    CAREERS.forEach(function (c) { if (c.name === p.name) src = c; });
    if (!src) return p.name;
    var spans = src.career.filter(function (s) { return canon(s.team) === club; })
      .map(function (s) { return s.from + "–" + (s.to == null ? "" : String(s.to).slice(2)); });
    return p.name + " " + spans.join(", ");
  }

  // --- Guess resolution (no suggestions — pure recall) --------------------------
  // The autocomplete listed the answerable clubs, which in a game about naming
  // the club is close to printing the answer. Gone. Typed text resolves on its
  // own — exact, or a partial only one club matches, so "pana" is enough — and
  // anything else is reported without costing a guess.
  function flash(msg) { if (els.flash) { els.flash.textContent = msg; els.flash.hidden = !msg; } }
  function resolve(text) {
    var raw = String(text == null ? "" : text).trim(), q = norm(raw);
    if (!q) return null;
    var pool = answerClubs();
    var exact = pool.filter(function (n) { return norm(n) === q; });
    if (exact.length) return { name: exact[0] };
    var hits = pool.filter(function (n) { return norm(n).indexOf(q) !== -1; });
    if (!hits.length) return { miss: "✗ No club called “" + raw + "” in this game" };
    if (hits.length > 1) return { miss: "↔ " + hits.length + " clubs match “" + raw + "” — type more of the name" };
    return { name: hits[0] };
  }
  function submitTyped() {
    if (over) return;
    var r = resolve(els.input.value);
    if (!r) return;
    if (r.miss) { flash(r.miss); return; }        // a typo is not a guess
    if (guesses.some(function (g) { return g === r.name; })) { flash("↺ You've already tried " + r.name); return; }
    flash("");
    submitGuess(r.name);
  }

  // --- Game flow ------------------------------------------------------------------
  function saveDaily() {
    lsSet(K.daily(dayKey), {
      a: pair ? pair[0].name : null, b: pair ? pair[1].name : null,
      club: club, guesses: guesses, done: over, won: won
    });
  }
  function finish() {
    over = true;
    els.input.disabled = true; flash("");
    if (mode === "daily") { recordDaily(won); saveDaily(); } else record(won);
    renderStats(); updateCounter(); updateButtons(); showBanner();
    if (els.sr) els.sr.textContent = (won ? "Correct! " : "Out of guesses. ") + "It was " + club + ".";
  }
  function submitGuess(name) {
    if (over || !name) return;
    disarmGiveUp();                    // playing on withdraws a half-pressed concession
    if (guesses.some(function (g) { return g === name; })) return;   // repeat costs nothing
    els.input.value = "";
    if (name === club) { won = true; finish(); return; }
    guesses.push(name);
    renderGuesses();
    if (guesses.length >= MAX) { won = false; finish(); return; }
    if (mode === "daily") saveDaily();
    updateCounter(); updateButtons();
    if (els.sr) els.sr.textContent = "Not " + name + ". " + (MAX - guesses.length) + " guesses left.";
    els.input.focus();
  }
  function disarmGiveUp() {
    giveArmed = false;
    if (giveTimer) { clearTimeout(giveTimer); giveTimer = null; }
    if (els.giveup) { els.giveup.textContent = "Give up"; els.giveup.classList.remove("armed"); }
  }
  // Conceding the daily records the loss and reveals the answer, exactly as
  // running out of guesses does. It costs this game its own daily record but
  // NOT the hub streak: isTodayDone() counts a lost daily as played.
  //
  // Daily arms first (there is no second pair today); practice stays one tap,
  // where nothing is irreversible.
  function giveUp() {
    if (over) return;
    if (mode === "daily" && !giveArmed) {
      giveArmed = true;
      if (els.giveup) { els.giveup.textContent = "Sure?"; els.giveup.classList.add("armed"); }
      giveTimer = setTimeout(disarmGiveUp, 3000);
      return;
    }
    disarmGiveUp();
    won = false; finish();
  }

  function resetState() {
    guesses = []; over = false; won = false; dealt = true;
    disarmGiveUp();
    els.input.value = ""; els.input.disabled = false; els.banner.hidden = true;
  }
  function dealDaily() {
    var seed = "cc:" + dayKey;
    var picked = pickClub("both", true, hashStr(seed) % answerClubs().length);
    if (!picked) { els.counter.textContent = "No pairs available."; return; }
    club = picked.club;
    pair = picked.pairs[hashStr(seed + ":" + club) % picked.pairs.length];
    resetState();
    // Only restores a save that holds THIS pair — a save left by the old roster
    // game, or by a different day, can't accidentally match.
    var saved = lsGet(K.daily(dayKey), null);
    if (saved && saved.club === club && saved.a === pair[0].name && saved.b === pair[1].name) {
      guesses = (saved.guesses || []).slice(0, MAX);
      over = !!saved.done; won = !!saved.won;
    }
    renderPair(); renderGuesses(); flash(""); updateButtons();
    if (over) { els.input.disabled = true; showBanner(); updateCounter(); }
    else { updateCounter(); els.input.focus(); }
  }
  function deal() {
    if (mode === "daily") { dealDaily(); return; }
    var all = answerClubs(), n = all.length;
    var picked = null, prev = club;
    // Two passes: the first refuses to repeat the club just played, the second
    // accepts it rather than dealing nothing when a mode has only one club left.
    for (var attempt = 0; attempt < 2 && !picked; attempt++) {
      for (var k = 0; k < n; k++) {
        var c = all[(Math.floor(Math.random() * n) + k) % n];
        if (attempt === 0 && c === prev) continue;
        var ps = pairsFor(c, mode, false);
        if (ps.length) { picked = { club: c, pairs: ps }; break; }
      }
    }
    if (!picked) { els.counter.textContent = "No pairs for this mode."; return; }
    club = picked.club;
    pair = picked.pairs[Math.floor(Math.random() * picked.pairs.length)];
    resetState();
    renderPair(); renderGuesses(); updateCounter(); updateButtons(); flash(""); els.input.focus();
  }

  function setMode(m) {
    mode = ({ daily: 1, active: 1, legends: 1, both: 1 })[m] ? m : "daily";
    if (mode === "daily") { dayKey = pendingArchive || todayStr(); isArchive = !!pendingArchive; pendingArchive = null; }
    lsSet(K.mode, mode);
    if (window.ELG && window.ELG.modeURL) window.ELG.modeURL("clubreveal", mode);   // keep ?mode= honest
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
    if (e.key === "Enter") { e.preventDefault(); submitTyped(); }
    else if (e.key === "Escape") { els.input.value = ""; flash(""); }
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
    els.input = $("cv-input"); els.flash = $("cv-flash"); els.list = $("cv-list");
    els.counter = $("cv-counter"); els.banner = $("cv-banner"); els.guesses = $("cv-guesses");
    els.next = $("cv-next"); els.giveup = $("cv-giveup");
    els.stats = $("cv-stats"); els.sr = $("cv-sr"); els.modeRow = $("cv-modes");
    els.tabDaily = $("cv-daily"); els.tabActive = $("cv-active"); els.tabLegends = $("cv-legends"); els.tabBoth = $("cv-both");
    els.view = $("clubreveal-view");
    els.infoBtn = $("cv-info-btn"); els.infoModal = $("cv-info-modal"); els.infoClose = $("cv-info-close");
    if (!els.input || !CAREERS.length) return;

    els.input.addEventListener("keydown", onKeyDown);
    els.next.addEventListener("click", deal);
    if (els.giveup) els.giveup.addEventListener("click", giveUp);
    els.tabDaily.addEventListener("click", function () { if (mode !== "daily" || isArchive) setMode("daily"); });
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
    onShow: function () { if (isArchive) setMode("daily"); else if (!dealt) deal(); if (maybeFirstHelp()) return; if (els.input && !over) els.input.focus(); },   // a hub open always lands on TODAY's edition
    goDaily: function () { setMode("daily"); },
    goPractice: function () { setMode("both"); },
    goMode: setMode,
    goArchive: function (d) { pendingArchive = /^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? String(d) : null; setMode("daily"); },
    // internal hooks used by test.js
    _peek: function () { return { mode: mode, day: dayKey, archive: isArchive, club: club, pair: pair, guesses: guesses, over: over, won: won }; },
    _deal: deal,
    _setMode: setMode,
    _guess: submitGuess,
    _resolve: resolve,
    _shareText: shareText,
    _famous: famous,
    _answerClubs: answerClubs,
    _members: members,
    _pairsFor: pairsFor,
    _soleShared: soleSharedClub,
    _byName: byName
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
