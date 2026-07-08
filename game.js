/* EuroLeague guessing game — engine + UI.
 * Depends on window.PLAYERS and window.TEAMS from players.js (loaded first). */
(function () {
  "use strict";

  var MAX_GUESSES = 8;
  var REVEAL_STAGGER = 0.06;          // per-cell flip delay (s); snappier than the original 0.09
  var BANNER_DELAY = 900;             // ms — let the last row finish flipping before the answer shows
  var PLAYERS = window.PLAYERS || [];
  var LEGENDS = window.LEGENDS || [];
  var TEAMS = window.TEAMS || {};

  // "Close" thresholds for numeric attributes (yellow instead of grey).
  var NEAR = { height: 5, age: 2, number: 3 };

  // Per-state glyph so exact/close/none reads without relying on colour
  // (colour-blind support); shape-distinct + monochrome, mirrors the share grid.
  var GLYPH = { green: "✓", yellow: "~", grey: "·" }; // check / tilde / middot
  // Column order produced by evaluate(), used for screen-reader labels.
  var COLS = ["Team", "Nationality", "Position", "Height", "Age", "Number"];
  var STATE_WORD = { green: "exact", yellow: "close", grey: "no match" };

  // Age is derived from birthYear so the database never goes stale.
  var CURRENT_YEAR = new Date().getFullYear();
  function ageOf(p) { return CURRENT_YEAR - p.birthYear; }

  // --- State -----------------------------------------------------------------
  var mode = "daily";       // "daily" | "practice" | "legends" | "endless"
  var target = null;        // the mystery player
  var guesses = [];         // player objects guessed this game (in order)
  var over = false;
  var won = false;
  var activeIndex = -1;     // highlighted row in the autocomplete dropdown
  var matches = [];         // current autocomplete matches
  var countdownTimer = null;
  var dailyDealtFor = null;   // date the in-memory daily target was dealt for (rollover guard)
  var lastFocus = null;       // element to restore focus to when a modal closes
  var hardMode = false;       // when on, autocomplete only offers players that fit all clues
  var hintsUsed = 0;          // hints revealed this game (Practice/Legends)
  var giveUpArmed = false;    // "Give up" needs a confirming second click
  var giveUpTimer = null;
  var fxOn = false;           // sound + vibration feedback (off by default)
  var audioCtx = null;
  var challengeTarget = null;  // set while playing a one-off "challenge a friend" link (transient, never persisted)

  var els = {};
  function $(id) { return document.getElementById(id); }

  // --- localStorage ----------------------------------------------------------
  function lsGet(key, fallback) {
    try { var v = window.localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function lsSet(key, val) {
    try { window.localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  var K = {
    mode: "elg:mode",
    stats: "elg:stats",
    hard: "elg:hard",
    daily: function (d) { return "elg:daily:" + d; },
    game: function (m) { return "elg:game:" + m; },     // practice / legends saved game
    mstats: function (m) { return "elg:mstats:" + m; },  // practice / legends stats
    fx: "elg:fx",
    endless: "elg:endless",      // endless run + best + record
    ach: "elg:ach",              // unlocked achievement ids
    wonModes: "elg:wonmodes",    // which modes have been won (for the All-Rounder badge)
    seenHelp: "elg:seenhelp",    // "How to play" has been shown once (auto or manual)
  };

  // --- Dates & daily seed ----------------------------------------------------
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }

  // Deterministic index from the date (FNV-1a hash) -> same player for everyone.
  function hashStr(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function dailyTarget() { return PLAYERS[hashStr(todayStr()) % PLAYERS.length]; }
  function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  // Legends can be narrowed to a birth-decade "era"; "all" = the whole pool.
  var legendEra = "all";
  function legendPool() {
    if (legendEra === "all") return LEGENDS;
    var d = parseInt(legendEra, 10);
    return LEGENDS.filter(function (p) { return Math.floor(p.birthYear / 10) * 10 === d; });
  }
  function pool() { return mode === "legends" ? legendPool() : PLAYERS; }
  // Fold case + diacritics so a typed "Nunez"/"Nuñez" both match the ASCII data.
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  // Initials avatar for the autocomplete rows (deterministic colour from the name).
  function initials(name) { var p = String(name).trim().split(/\s+/); return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || ""); }
  function avatarColor(name) { var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return "hsl(" + (h % 360) + ",45%,42%)"; }
  // Honour the OS "reduce motion" setting — skip the flip reveal and its banner delay.
  function reducedMotion() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }

  // --- Comparison helpers ----------------------------------------------------
  function teamResult(guess, tgt) {
    if (guess.team === tgt.team) return { state: "green", text: guess.team };
    var gc = (TEAMS[guess.team] || {}).country;
    var tc = (TEAMS[tgt.team] || {}).country;
    var state = gc && tc && gc === tc ? "yellow" : "grey";
    return { state: state, text: guess.team };
  }
  function exactResult(value, isMatch) {
    return { state: isMatch ? "green" : "grey", text: value };
  }
  function numericResult(guessVal, targetVal, threshold) {
    if (guessVal === targetVal) return { state: "green", text: String(guessVal) };
    var state = Math.abs(guessVal - targetVal) <= threshold ? "yellow" : "grey";
    var arrow = targetVal > guessVal ? " ↑" : " ↓"; // ↑ means answer is higher
    return { state: state, text: guessVal + arrow };
  }

  // Ordered cells for one guess against any hypothetical answer (Team, Nat, Pos, Height, Age, #).
  function evaluateVs(guess, tgt) {
    return [
      teamResult(guess, tgt),
      exactResult(guess.nationality, guess.nationality === tgt.nationality),
      exactResult(guess.position, guess.position === tgt.position),
      numericResult(guess.height, tgt.height, NEAR.height),
      numericResult(ageOf(guess), ageOf(tgt), NEAR.age),
      numericResult(guess.number, tgt.number, NEAR.number),
    ].map(function (r) { r.glyph = GLYPH[r.state]; return r; });
  }
  function evaluate(guess) { return evaluateVs(guess, target); }

  // Hard mode: a player is still viable iff every past guess would show the same
  // colours against it as it actually did against the real target.
  function statesOf(cells) { return cells.map(function (r) { return r.state; }).join(""); }
  function consistent(p) {
    return guesses.every(function (g) {
      return statesOf(evaluateVs(g, p)) === statesOf(evaluateVs(g, target));
    });
  }

  // --- Rendering -------------------------------------------------------------
  function makeCell(className, text, glyph) {
    var d = document.createElement("div");
    d.className = "cell " + className;
    if (glyph) {
      var g = document.createElement("span");
      g.className = "cell-glyph";
      g.setAttribute("aria-hidden", "true"); // state is conveyed by the cell's aria-label
      g.textContent = glyph;
      d.appendChild(g);
    }
    var t = document.createElement("span");
    t.className = "cell-text";
    t.textContent = text;
    d.appendChild(t);
    return d;
  }

  function renderGuess(guess, animate) {
    var row = document.createElement("div");
    row.className = "row";

    var cells = [makeCell("name", guess.name)];
    evaluate(guess).forEach(function (r, i) {
      var dir = /↑/.test(r.text) ? ", answer higher" : /↓/.test(r.text) ? ", answer lower" : "";
      var cell = makeCell(r.state, r.text, r.glyph);
      cell.setAttribute("role", "img");
      cell.setAttribute("aria-label",
        COLS[i] + " " + r.text.replace(/\s*[↑↓]/, "") + ", " + STATE_WORD[r.state] + dir);
      cells.push(cell);
    });

    cells.forEach(function (c, i) {
      if (animate !== false && !reducedMotion()) { c.classList.add("flip"); c.style.animationDelay = (i * REVEAL_STAGGER) + "s"; }
      row.appendChild(c);
    });

    els.board.insertBefore(row, els.board.firstChild); // newest on top
    updateScrollShadow();
  }

  // One-line screen-reader summary of a freshly submitted guess (not used on restore).
  function announceGuess(player) {
    if (!els.srStatus) return;
    var parts = evaluate(player).map(function (r, i) {
      var dir = /↑/.test(r.text) ? " higher" : /↓/.test(r.text) ? " lower" : "";
      return COLS[i] + " " + STATE_WORD[r.state] + dir;
    });
    els.srStatus.textContent = player.name + ": " + parts.join(", ") + ".";
  }

  function modeLabel() {
    return mode === "daily" ? "Daily" : mode === "legends" ? "Legends"
         : mode === "endless" ? "Endless" : "Practice";
  }

  function updateCounter() {
    var label = challengeTarget ? "Challenge" : modeLabel();
    var runNote = (mode === "endless" && !challengeTarget) ? endlessRunNote() : "";
    if (over) {
      els.counter.textContent = label + " · " + (won ? "Solved! 🎉" : "So close — the answer's below") + runNote;
      return;
    }
    var left = MAX_GUESSES - guesses.length;
    els.counter.textContent = label + " · Guess " + (guesses.length + 1) +
      " of " + MAX_GUESSES + " · " + (left === 1 ? "last one — make it count!" : left + " left") + runNote;
  }

  // Graded titles: the fewer guesses, the bigger the fireworks (8 = buzzer-beater).
  var WIN_TITLES = {
    1: "🎯 Unbelievable — first try!",
    2: "🔥 Outstanding!",
    3: "⭐ Brilliant!",
    4: "🏆 Great read!",
    5: "🏆 Well played!",
    6: "👏 Got there!",
    7: "😅 Cutting it close!",
    8: "🚨 Buzzer-beater!"
  };
  function showBanner(winFlag) {
    els.banner.className = "banner " + (winFlag ? "win" : "lose");
    els.banner.innerHTML = "";

    var title = document.createElement("div");
    title.className = "banner-title";
    title.textContent = winFlag
      ? (WIN_TITLES[guesses.length] || "🏆 Correct!") + " " + guesses.length + "/" + MAX_GUESSES
      : "😔 He got away…";

    var sub = document.createElement("div");
    sub.className = "banner-sub";
    sub.innerHTML = "It was " +
      "<span class='pname'>" + target.name + "</span> — " + target.team + "<br>" +
      target.nationality + " · " + target.position + " · " + target.height +
      " cm · age " + ageOf(target) + " · #" + target.number;

    if (mode === "endless" && !challengeTarget) {
      var er = getEndless();
      sub.innerHTML += winFlag
        ? "<br><strong>Run: " + er.run + "</strong> · Best: " + er.best
        : "<br>The run ends at <strong>best " + er.best + "</strong> — another go?";
    }
    if (mode === "daily" && !challengeTarget) {
      var ds = getStats();
      sub.innerHTML += winFlag
        ? (ds.curStreak >= 2
            ? "<br>🔥 <strong>" + ds.curStreak + "-day streak</strong> — see you tomorrow!"
            : "<br>Come back tomorrow for a new mystery player. 👋")
        : "<br>A new mystery player lands at midnight — come back for revenge!";
    }

    var actions = document.createElement("div");
    actions.className = "banner-actions";
    if (mode !== "daily") {
      var again = document.createElement("button");
      again.type = "button";
      again.textContent = challengeTarget ? "New game" : (mode === "endless" ? "Next player" : "Play again");
      again.addEventListener("click", newGame);
      actions.appendChild(again);
    }
    var share = document.createElement("button");
    share.type = "button";
    share.textContent = "Share result";
    share.addEventListener("click", function () { copyShare(share); });
    actions.appendChild(share);

    var chal = document.createElement("button");
    chal.type = "button";
    chal.textContent = "Challenge a friend";
    chal.addEventListener("click", function () { copyChallenge(chal); });
    actions.appendChild(chal);

    els.banner.appendChild(title);
    els.banner.appendChild(sub);
    els.banner.appendChild(actions);
    els.banner.hidden = false;
  }

  // --- Autocomplete ----------------------------------------------------------
  function alreadyGuessed(name) {
    var key = name.toLowerCase();
    return guesses.some(function (g) { return g.name.toLowerCase() === key; });
  }

  function closeDropdown() {
    els.dropdown.hidden = true;
    els.dropdown.innerHTML = "";
    matches = [];
    activeIndex = -1;
    els.input.setAttribute("aria-expanded", "false");
    els.input.removeAttribute("aria-activedescendant");
  }

  function renderDropdown() {
    els.dropdown.innerHTML = "";

    if (!matches.length) {
      // Typed something that matched nothing → explain WHY instead of a blunt dead end.
      if (els.input.value.trim()) {
        var q = norm(els.input.value.trim());
        var guessedHit = pool().some(function (p) { return norm(p.name).indexOf(q) >= 0 && alreadyGuessed(p.name); });
        var empty = document.createElement("div");
        empty.className = "dropdown-empty";
        empty.textContent = guessedHit ? "Already guessed — try someone new"
          : (hardMode && guesses.length ? "Hard mode: nobody fits every clue so far — re-read your greens & yellows"
          : (mode === "legends" ? "No legend found — try another spelling" : "No player found — try another spelling"));
        els.dropdown.appendChild(empty);
        els.dropdown.hidden = false;
        els.input.setAttribute("aria-expanded", "true");
      } else {
        els.dropdown.hidden = true;
        els.input.setAttribute("aria-expanded", "false");
      }
      els.input.removeAttribute("aria-activedescendant");
      return;
    }

    matches.forEach(function (p, i) {
      var item = document.createElement("div");
      item.className = "option" + (i === activeIndex ? " active" : "");
      item.id = "opt-" + i;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      item.innerHTML = "<span class='opt-avatar' style='background:" + avatarColor(p.name) + "'>" + initials(p.name) + "</span>" +
        "<span class='opt-main'><span class='opt-name'>" + p.name + "</span>" +
        "<span class='opt-team'>" + p.team + " · " + p.position + "</span></span>";
      item.addEventListener("pointerdown", function (e) {
        e.preventDefault(); // keep focus on the input (also reliable on touch)
        submitGuess(p);
      });
      els.dropdown.appendChild(item);
    });
    els.dropdown.hidden = false;
    els.input.setAttribute("aria-expanded", "true");
    els.input.setAttribute("aria-activedescendant", activeIndex >= 0 ? "opt-" + activeIndex : "");
  }

  function refreshMatches() {
    var q = norm(els.input.value.trim());
    if (!q) { closeDropdown(); return; }
    var hard = hardMode && guesses.length > 0;   // no constraints before the first guess
    matches = pool().filter(function (p) {
      if (norm(p.name).indexOf(q) === -1 || alreadyGuessed(p.name)) return false;
      return hard ? consistent(p) : true;
    }).slice(0, 8);
    activeIndex = matches.length ? 0 : -1;
    renderDropdown();
  }

  // --- Game flow -------------------------------------------------------------
  function submitGuess(player) {
    if (over || !player || alreadyGuessed(player.name)) return;

    disarmGiveUp();
    guesses.push(player);
    renderGuess(player, true);
    announceGuess(player);
    els.input.value = "";
    closeDropdown();
    saveState();

    if (player.name === target.name) {
      endGame(true, true);
    } else if (guesses.length >= MAX_GUESSES) {
      endGame(false, true);
    } else {
      var greens = evaluate(player).filter(function (r) { return r.state === "green"; }).length;
      playGuess(greens); vibrate(15);
      updateCounter();
      els.input.focus();
    }
  }

  // deferBanner: wait for the final row's flip to finish before revealing the answer
  // (true after a guess, false on give-up where nothing new is animating).
  function endGame(winFlag, deferBanner) {
    over = true;
    won = winFlag;
    els.input.disabled = true;
    els.giveUp.disabled = true;
    disarmGiveUp();
    saveState();   // persist the finished game for every mode (Practice/Legends resume too)

    var streak = 0, run = 0;
    if (challengeTarget) {
      /* challenge games are transient — nothing recorded */
    } else if (mode === "daily") {
      streak = recordDaily(won, guesses.length).curStreak;
    } else if (mode === "endless") {
      run = recordEndless(won, guesses.length).run;
    } else {
      recordModeResult(mode, won, guesses.length);
    }
    if (won) checkAchievements(streak, run);
    updateCounter();

    var delay = (deferBanner && !reducedMotion()) ? BANNER_DELAY : 0;
    setTimeout(function () {
      if (!over) return;               // user navigated away during the reveal
      showBanner(won);
      if (won) { confettiBurst(); playWin(); vibrate([0, 40, 40, 90]); }
      else { playLose(); vibrate(160); }
    }, delay);
    if (mode === "daily") setTimeout(openStatsAuto, delay + 600);
  }

  // --- Per-mode persistence --------------------------------------------------
  // Each mode keeps its own saved game so switching tabs / refreshing resumes it.
  // Daily's answer is derived from the date; Practice & Legends store the target.
  function savedKey() { return mode === "daily" ? K.daily(todayStr()) : K.game(mode); }

  function saveState() {
    if (challengeTarget) return;   // challenge games are transient — never persist / clobber a saved game
    var data = { guesses: guesses.map(function (g) { return g.name; }), done: over, won: won };
    if (mode !== "daily") data.target = target ? target.name : null;
    lsSet(savedKey(), data);
  }

  function findInPool(name) {
    return pool().find(function (p) { return p.name === name; });
  }

  function applySaved(saved) {
    (saved.guesses || []).forEach(function (name) {
      var p = findInPool(name);
      if (p) { guesses.push(p); renderGuess(p, false); }
    });
    if (saved.done) {
      over = true; won = !!saved.won;
      els.input.disabled = true; els.giveUp.disabled = true;
      showBanner(won);
    }
  }

  // Resume the saved game for the current mode, if one exists. Daily's target is
  // derived from the date; Practice & Legends restore their stored mystery player.
  // Returns true if a saved game was applied.
  function restoreState() {
    var saved = lsGet(savedKey(), null);
    if (!saved) return false;
    if (mode !== "daily") {
      var t = findInPool(saved.target);
      if (!t) return false;            // saved target no longer in the pool — start fresh
      target = t;
    }
    applySaved(saved);
    return true;
  }

  // --- Stats -----------------------------------------------------------------
  function defaultStats() {
    return { played: 0, wins: 0, curStreak: 0, maxStreak: 0,
             dist: [0, 0, 0, 0, 0, 0, 0, 0], lastDate: null, lastWon: false, lastGuessCount: 0 };
  }
  function getStats() { return lsGet(K.stats, null) || defaultStats(); }

  // Practice & Legends keep their own lightweight stats (no streaks — unlimited play).
  function defaultModeStats() { return { played: 0, wins: 0, best: 0, dist: [0, 0, 0, 0, 0, 0, 0, 0] }; }
  function getModeStats(m) { return lsGet(K.mstats(m), null) || defaultModeStats(); }
  function recordModeResult(m, winFlag, numGuesses) {
    var s = getModeStats(m);
    s.played++;
    if (winFlag) {
      s.wins++;
      s.dist[numGuesses - 1]++;
      if (!s.best || numGuesses < s.best) s.best = numGuesses; // fewest guesses to a win
    }
    lsSet(K.mstats(m), s);
    return s;
  }

  // --- Endless mode ----------------------------------------------------------
  // Solve players back-to-back; one loss ends the run. Tracks the live run + best.
  function defaultEndless() { return { run: 0, best: 0, played: 0, wins: 0, dist: [0, 0, 0, 0, 0, 0, 0, 0] }; }
  function getEndless() { return lsGet(K.endless, null) || defaultEndless(); }
  function recordEndless(winFlag, numGuesses) {
    var s = getEndless();
    s.played++;
    if (winFlag) {
      s.wins++;
      s.dist[numGuesses - 1]++;
      s.run++;
      if (s.run > s.best) s.best = s.run;
    } else {
      s.run = 0;
    }
    lsSet(K.endless, s);
    return s;
  }
  function endlessRunNote() {
    var s = getEndless();
    return " · Run " + s.run + (s.best ? " (best " + s.best + ")" : "");
  }

  // --- Achievements ----------------------------------------------------------
  var ACHIEVEMENTS = [
    { id: "first-win",   icon: "⭐", name: "First Win",          desc: "Win your first game." },
    { id: "bullseye",    icon: "🎯", name: "Bullseye",           desc: "Win in a single guess." },
    { id: "sharp",       icon: "🏹", name: "Sharpshooter",       desc: "Win in 3 guesses or fewer." },
    { id: "clutch",      icon: "⏱️", name: "Clutch",             desc: "Win on your very last guess." },
    { id: "on-fire",     icon: "🔥", name: "On Fire",            desc: "Reach a 5-day Daily streak." },
    { id: "marathon",    icon: "🏃", name: "Marathon",           desc: "Reach an Endless run of 10." },
    { id: "historian",   icon: "📜", name: "Historian",          desc: "Win a Legends game." },
    { id: "all-rounder", icon: "🌍", name: "All-Rounder",        desc: "Win in all four game modes." },
    { id: "hard-won",    icon: "💪", name: "Hard-Won",           desc: "Win with Hard mode on." },
    { id: "challenger",  icon: "🤝", name: "Challenge Accepted", desc: "Win a friend's challenge." }
  ];
  function getAch() { return lsGet(K.ach, null) || {}; }
  function unlock(bag, id) {
    if (bag[id]) return false;
    bag[id] = true;
    lsSet(K.ach, bag);
    queueToast(id);
    return true;
  }
  // Called only after a win (see endGame); streak/run come from the just-updated stats.
  function checkAchievements(streak, run) {
    var bag = getAch();
    unlock(bag, "first-win");
    if (guesses.length === 1) unlock(bag, "bullseye");
    if (guesses.length <= 3) unlock(bag, "sharp");
    if (guesses.length >= MAX_GUESSES) unlock(bag, "clutch");
    if (hardMode) unlock(bag, "hard-won");
    if (mode === "legends") unlock(bag, "historian");
    if (challengeTarget) { unlock(bag, "challenger"); return; }  // challenge wins don't feed streaks / completion
    if (mode === "daily" && streak >= 5) unlock(bag, "on-fire");
    if (mode === "endless" && run >= 10) unlock(bag, "marathon");
    var wm = lsGet(K.wonModes, null) || {};
    if (!wm[mode]) { wm[mode] = true; lsSet(K.wonModes, wm); }
    if (wm.daily && wm.practice && wm.legends && wm.endless) unlock(bag, "all-rounder");
  }
  function renderAchievementsHTML() {
    var bag = getAch(), got = 0;
    ACHIEVEMENTS.forEach(function (a) { if (bag[a.id]) got++; });
    var h = "<h3>Achievements <span class='ach-count'>" + got + " / " + ACHIEVEMENTS.length + "</span></h3>";
    h += "<div class='ach-grid'>";
    ACHIEVEMENTS.forEach(function (a) {
      var on = !!bag[a.id];
      h += "<div class='ach" + (on ? "" : " locked") + "' title='" + a.name + " — " + a.desc + "'>" +
        "<div class='ach-ico'>" + (on ? a.icon : "🔒") + "</div>" +
        "<div class='ach-name'>" + a.name + "</div></div>";
    });
    return h + "</div>";
  }

  // Achievement toasts, shown one after another so several unlocks don't overlap.
  var toastQueue = [], toastShowing = false;
  function queueToast(id) { toastQueue.push(id); if (!toastShowing) showNextToast(); }
  function showNextToast() {
    if (!toastQueue.length) { toastShowing = false; return; }
    toastShowing = true;
    var id = toastQueue.shift(), a = null;
    ACHIEVEMENTS.forEach(function (x) { if (x.id === id) a = x; });
    if (!a || !els.toast) { showNextToast(); return; }
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.innerHTML = "<span class='toast-ico'>" + a.icon + "</span>" +
      "<span><span class='toast-h'>Achievement unlocked</span><br>" + a.name + "</span>";
    els.toast.appendChild(t);
    if (els.srStatus) els.srStatus.textContent = "Achievement unlocked: " + a.name + ". " + a.desc;
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); showNextToast(); }, 3200);
  }

  function recordDaily(winFlag, numGuesses) {
    var s = getStats();
    if (s.lastDate === todayStr()) return s;   // guard: only once per day
    s.played++;
    if (winFlag) {
      s.wins++;
      s.dist[numGuesses - 1]++;
      s.lastGuessCount = numGuesses;
      s.curStreak = (s.lastDate === yesterdayStr() && s.lastWon) ? s.curStreak + 1 : 1;
      if (s.curStreak > s.maxStreak) s.maxStreak = s.curStreak;
    } else {
      s.curStreak = 0;
    }
    s.lastDate = todayStr();
    s.lastWon = winFlag;
    lsSet(K.stats, s);
    return s;
  }

  function dailyDoneToday() {
    var saved = lsGet(K.daily(todayStr()), null);
    return !!(saved && saved.done);
  }

  function statTile(num, lbl) {
    return "<div class='stat'><div class='stat-num'>" + num + "</div>" +
           "<div class='stat-lbl'>" + lbl + "</div></div>";
  }

  function renderStats() {
    var daily = (mode === "daily");
    var endless = (mode === "endless");
    var s = daily ? getStats() : endless ? getEndless() : getModeStats(mode);
    var winPct = s.played ? Math.round((s.wins / s.played) * 100) : 0;

    var html = "<div class='stat-mode'>" + modeLabel() + (daily ? "" : " mode") + "</div>";
    if (daily) {
      // Show the streak as broken if the last win wasn't today or yesterday.
      var live = (s.lastDate === todayStr() || s.lastDate === yesterdayStr()) ? s.curStreak : 0;
      html += "<div class='stat-row'>" +
        statTile(s.played, "Played") + statTile(winPct, "Win %") +
        statTile(live, "Streak") + statTile(s.maxStreak, "Max streak") + "</div>";
    } else if (endless) {
      html += "<div class='stat-row'>" +
        statTile(s.run, "Run") + statTile(s.best, "Best run") +
        statTile(s.played, "Played") + statTile(winPct, "Win %") + "</div>";
    } else {
      html += "<div class='stat-row'>" +
        statTile(s.played, "Played") + statTile(winPct, "Win %") +
        statTile(s.wins, "Wins") + statTile(s.best || "—", "Best") + "</div>";
    }

    html += "<h3>Guess distribution</h3>";
    if (!s.played) {
      html += "<p class='hint'>" + (daily
        ? "Play the daily challenge to start tracking your stats. Other modes are tracked separately."
        : "Win a " + modeLabel() + " game to start tracking these.") + "</p>";
    } else {
      var max = Math.max.apply(null, s.dist.concat([1]));
      var hl = daily
        ? ((s.lastDate === todayStr() && s.lastWon) ? s.lastGuessCount : -1)
        : (over && won ? guesses.length : -1);
      html += "<div class='dist'>";
      for (var i = 1; i <= MAX_GUESSES; i++) {
        var c = s.dist[i - 1] || 0;
        var w = Math.max(8, Math.round((c / max) * 100));
        html += "<div class='dist-row'><span class='dist-i'>" + i + "</span>" +
          "<span class='dist-bar" + (i === hl ? " hl" : "") + "' style='width:" + w + "%'>" + c + "</span></div>";
      }
      html += "</div>";
    }

    var shareBtn = "<button type='button' class='share-btn' id='share-stats'>Share result</button>";
    var chalBtn = "<button type='button' class='share-btn alt' id='challenge-stats'>Challenge a friend</button>";
    if (daily && dailyDoneToday()) {
      html += "<div class='next'>Next player in <span id='countdown'>--:--:--</span></div>" + shareBtn + chalBtn;
    } else if (!daily && over) {
      html += shareBtn + chalBtn;
    }

    html += renderAchievementsHTML();
    els.statsBody.innerHTML = html;

    var sb = $("share-stats");
    if (sb) sb.addEventListener("click", function () { copyShare(sb); });
    var cb = $("challenge-stats");
    if (cb) cb.addEventListener("click", function () { copyChallenge(cb); });
  }

  // --- Share -----------------------------------------------------------------
  function shareText() {
    var emoji = { green: "🟩", yellow: "🟨", grey: "⬛" };
    var head = "EuroLeague Guesser 🏀 " + (mode === "daily" ? todayStr() : modeLabel());
    var score = won ? (guesses.length + "/" + MAX_GUESSES) : ("X/" + MAX_GUESSES);
    var rows = guesses.map(function (g) {
      return evaluate(g).map(function (r) { return emoji[r.state]; }).join("");
    });
    return head + "\n" + score + "\n" + rows.join("\n");
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.top = "-1000px";
      document.body.appendChild(ta); ta.focus(); ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copyShare(btn) {
    var text = shareText();
    var flash = function () {
      var orig = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(function () { btn.textContent = orig; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, function () { if (legacyCopy(text)) flash(); });
    } else if (legacyCopy(text)) {
      flash();
    }
  }

  // --- Challenge a friend ----------------------------------------------------
  // A challenge is encoded entirely in the URL hash (#c=…) — no backend. Opening
  // such a link deals that exact player as a one-off, transient game.
  function encodeChallenge(flag, name) {
    return btoa(unescape(encodeURIComponent(flag + ":" + name)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");  // URL-safe base64
  }
  function parseChallengeToken(token) {
    try {
      var b64 = String(token).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var raw = decodeURIComponent(escape(atob(b64)));
      var i = raw.indexOf(":");
      if (i < 1) return null;
      var flag = raw.slice(0, i), name = raw.slice(i + 1);
      if (flag !== "a" && flag !== "l") return null;
      return { flag: flag, name: name };
    } catch (e) { return null; }
  }
  function challengeURL() {
    var flag = (mode === "legends") ? "l" : "a";           // legends draw from LEGENDS, everything else from PLAYERS
    var loc = window.location || {};
    var origin = (loc.origin && loc.origin !== "null") ? loc.origin : "";
    return origin + (loc.pathname || "") + "#c=" + encodeChallenge(flag, target.name);
  }
  function copyChallenge(btn) {
    var text = "🏀 Can you guess this EuroLeague player? " + challengeURL();
    var flash = function () {
      var orig = btn.textContent;
      btn.textContent = "Link copied!";
      setTimeout(function () { btn.textContent = orig; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, function () { if (legacyCopy(text)) flash(); });
    } else if (legacyCopy(text)) { flash(); }
  }
  function showChallengeNote(on) {
    if (els.challengeNote) els.challengeNote.hidden = !on;
  }
  // Read a #c=… token from the URL and, if valid, deal that player as a challenge.
  function applyChallengeFromHash() {
    var h = (window.location && window.location.hash) || "";
    var m = /(?:^#|[#&])c=([^&]+)/.exec(h);
    if (!m) return false;
    var parsed = parseChallengeToken(m[1]);
    if (!parsed) return false;
    var arr = parsed.flag === "l" ? LEGENDS : PLAYERS;
    var p = arr.filter(function (x) { return x.name === parsed.name; })[0];
    if (!p) return false;
    challengeTarget = p;
    setMode(parsed.flag === "l" ? "legends" : "practice", true);  // true = entering via a challenge link
    return true;
  }
  // Leave challenge mode: clear the transient target and strip #c=… so a refresh starts fresh.
  function exitChallenge() {
    if (!challengeTarget) return;
    challengeTarget = null;
    showChallengeNote(false);
    try {
      var loc = window.location;
      if (loc && /(?:^#|[#&])c=/.test(loc.hash || "")) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", (loc.pathname || "") + (loc.search || ""));
        } else { loc.hash = ""; }
      }
    } catch (e) {}
  }

  // --- Countdown to next daily ----------------------------------------------
  function startCountdown() {
    stopCountdown();
    function tick() {
      var el = $("countdown");
      if (!el) return;
      var now = new Date();
      var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      var ms = Math.max(0, midnight - now);
      if (ms <= 0) { checkDailyRollover(); return; } // date rolled over while open
      el.textContent = pad(Math.floor(ms / 3600000)) + ":" +
        pad(Math.floor((ms % 3600000) / 60000)) + ":" + pad(Math.floor((ms % 60000) / 1000));
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }
  function stopCountdown() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }

  // --- Modals ----------------------------------------------------------------
  function focusables(c) {
    return c.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  }
  function openModal(overlay, dialog) {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    var f = focusables(dialog);
    (f.length ? f[0] : dialog).focus();
  }
  function closeModal(overlay) {
    overlay.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }
  function trapTab(e, dialog) {
    if (e.key !== "Tab") return;
    var f = focusables(dialog);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function setInfo(open) {
    if (open) {
      lsSet(K.seenHelp, true);       // seen it (auto or manual) → never auto-open again
      openModal(els.infoModal, els.infoModal.firstElementChild);
    } else closeModal(els.infoModal);
  }
  // First visit to this game → open "How to play" once, so newcomers aren't lost.
  function maybeFirstHelp() {
    if (lsGet(K.seenHelp, false)) return false;
    setInfo(true);
    return true;
  }
  function openStats() {
    renderStats();
    openModal(els.statsModal, els.statsModal.firstElementChild);
    if (mode === "daily" && dailyDoneToday()) startCountdown();
  }
  function closeStats() { closeModal(els.statsModal); stopCountdown(); }
  // Auto-open after a finished daily — but never over an open modal or a reset board.
  function openStatsAuto() {
    if (!over || !els.infoModal.hidden || !els.statsModal.hidden) return;
    openStats();
  }

  // --- Mode + new game -------------------------------------------------------
  function tabFor(m) {
    return m === "practice" ? els.tabPractice
         : m === "legends" ? els.tabLegends
         : m === "endless" ? els.tabEndless
         : els.tabDaily;
  }

  function setMode(m, fromChallenge) {
    if (!fromChallenge) exitChallenge();   // a real tab switch leaves any active challenge
    mode = (m === "practice" || m === "legends" || m === "endless") ? m : "daily";
    if (!fromChallenge) lsSet(K.mode, mode);
    var active = tabFor(mode);
    [els.tabDaily, els.tabPractice, els.tabLegends, els.tabEndless].forEach(function (btn) {
      var sel = (btn === active);
      btn.classList.toggle("active", sel);
      btn.setAttribute("aria-selected", sel ? "true" : "false");
      btn.tabIndex = sel ? 0 : -1;   // roving tabindex (ARIA tabs pattern)
    });
    // Daily is one-per-day (no give up / hint). Endless advances via the banner, so it
    // hides the New game "skip" button too — but keeps Give up (ends the run) + Hint.
    var hideNew = (mode === "daily" || mode === "endless");
    var oneShot = (mode === "daily");
    els.newGame.style.display = hideNew ? "none" : "";
    els.giveUp.style.display = oneShot ? "none" : "";
    els.hint.style.display = oneShot ? "none" : "";
    els.eraWrap.hidden = (mode !== "legends");   // era filter is Legends-only
    startGame();
  }

  function resetBoard() {
    guesses = []; over = false; won = false; matches = []; activeIndex = -1;
    hintsUsed = 0;
    els.board.innerHTML = "";
    els.banner.hidden = true;
    els.input.disabled = false; els.input.value = "";
    els.giveUp.disabled = false;
    if (els.hints) els.hints.innerHTML = "";
    if (els.hint) els.hint.disabled = false;
    disarmGiveUp();
    closeDropdown();
    updateScrollShadow();
  }

  // Resume-or-start: replays a saved game for this mode, or deals a new player.
  // Runs on load and on every tab switch, so progress in each mode is preserved.
  function startGame() {
    resetBoard();

    if (challengeTarget) {             // a friend's link — deal that exact player, don't touch saved games
      target = challengeTarget;
      showChallengeNote(true);
      updateCounter();
      els.input.focus();
      return;
    }
    showChallengeNote(false);

    if (mode === "daily") {
      target = dailyTarget();
      dailyDealtFor = todayStr();      // remember the day this target belongs to (rollover guard)
      restoreState();                  // replay today's guesses if it was already played
    } else if (!restoreState()) {
      target = randomFrom(pool());     // no saved game — deal a fresh mystery player
      saveState();                     // persist it now so a refresh resumes the same one
    }

    updateCounter();
    if (!over) els.input.focus();
  }

  // "New game" / "Play again": force a fresh mystery player (Practice & Legends only;
  // Daily is fixed for the day, so it just resumes the saved game).
  function newGame() {
    exitChallenge();                   // "New game" / "Next player" always leaves a challenge
    if (mode === "daily") { startGame(); return; }
    resetBoard();
    showChallengeNote(false);
    target = randomFrom(pool());
    saveState();
    updateCounter();
    els.input.focus();
  }

  // If the local date rolled over while the tab stayed open, re-deal today's daily.
  // Safe: re-dealing only replays via restoreState and never calls recordDaily.
  function checkDailyRollover() {
    if (mode !== "daily" || dailyDealtFor === todayStr()) return;
    closeStats();   // yesterday's countdown / share are now stale
    startGame();
  }

  // Toggle a right-edge fade hinting the board scrolls to more columns (mobile).
  function updateScrollShadow() {
    var s = els.boardScroll, w = els.boardWrap;
    if (!s || !w) return;
    w.classList.toggle("can-scroll-right", s.scrollWidth - s.clientWidth - s.scrollLeft > 1);
  }

  // Populate the Legends era filter with the birth-decades that have enough legends.
  function buildEraOptions() {
    var counts = {};
    LEGENDS.forEach(function (p) { var d = Math.floor(p.birthYear / 10) * 10; counts[d] = (counts[d] || 0) + 1; });
    var html = "<option value='all'>All eras</option>";
    Object.keys(counts).map(Number).filter(function (d) { return counts[d] >= 4; })
      .sort(function (a, b) { return a - b; })
      .forEach(function (d) { html += "<option value='" + d + "'>Born in the " + d + "s</option>"; });
    els.eraSelect.innerHTML = html;
  }

  // --- Feedback: sound (synth, no assets), vibration, confetti ---------------
  function vibrate(pattern) { if (fxOn && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} } }
  function ensureAudio() {
    if (audioCtx || !fxOn) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { try { audioCtx = new AC(); } catch (e) { audioCtx = null; } }
  }
  function tone(freq, startMs, durMs, gainMax) {
    if (!audioCtx) return;
    var t0 = audioCtx.currentTime + startMs / 1000, t1 = t0 + durMs / 1000;
    var osc = audioCtx.createOscillator(), g = audioCtx.createGain();
    osc.type = "sine"; osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gainMax, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(t0); osc.stop(t1 + 0.02);
  }
  function playGuess(greens) { if (!fxOn) return; ensureAudio(); tone(280 + greens * 90, 0, 130, 0.05); } // brighter the closer you are
  function playWin() { if (!fxOn) return; ensureAudio(); [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 95, 340, 0.06); }); }
  function playLose() { if (!fxOn) return; ensureAudio(); tone(196, 0, 360, 0.05); tone(165, 130, 440, 0.05); }

  // Lightweight DOM confetti, no deps; skipped under reduce-motion.
  function confettiBurst() {
    if (reducedMotion() || !document.body) return;
    var colors = ["#ff7a00", "#ff8d24", "#4c9a52", "#c9a22b", "#f1f2f4"];
    var box = document.createElement("div");
    box.className = "confetti";
    for (var i = 0; i < 44; i++) {
      var p = document.createElement("span");
      p.style.left = (Math.random() * 100) + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.25).toFixed(2) + "s";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 2200);
  }

  // --- Give up (two-click confirm) -------------------------------------------
  function disarmGiveUp() {
    giveUpArmed = false;
    if (giveUpTimer) { clearTimeout(giveUpTimer); giveUpTimer = null; }
    if (els.giveUp) { els.giveUp.textContent = "Give up"; els.giveUp.classList.remove("armed"); }
  }
  function onGiveUp() {
    if (over) return;
    if (!giveUpArmed) {                       // first click arms; second click confirms
      giveUpArmed = true;
      els.giveUp.textContent = "Sure?";
      els.giveUp.classList.add("armed");
      giveUpTimer = setTimeout(disarmGiveUp, 3000);
      return;
    }
    disarmGiveUp();
    endGame(false);                           // immediate banner (nothing new animating)
  }

  // --- Hint (Practice / Legends only) ----------------------------------------
  var MAX_HINTS = 3;
  function hintList() {                       // escalating clues; each press reveals the next
    return [
      "Position: " + target.position,
      "Nationality: " + target.nationality,
      "Plays in: " + ((TEAMS[target.team] || {}).country || "—"),
      "Born in the " + (Math.floor(target.birthYear / 10) * 10) + "s",
    ];
  }
  function onHint() {
    if (over || mode === "daily") return;
    var hints = hintList();
    var cap = Math.min(MAX_HINTS, hints.length);
    if (hintsUsed >= cap) return;
    var text = hints[hintsUsed++];
    var li = document.createElement("div");
    li.className = "hint-item";
    li.textContent = "💡 " + text;
    els.hints.appendChild(li);
    if (els.srStatus) els.srStatus.textContent = "Hint. " + text;
    if (hintsUsed >= cap) els.hint.disabled = true;
    els.input.focus();
  }

  // --- Events ----------------------------------------------------------------
  function onKeyDown(e) {
    if (els.dropdown.hidden) {
      if (e.key === "Enter") refreshMatches();
      return;
    }
    if (!matches.length) { if (e.key === "Escape") closeDropdown(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % matches.length;
      renderDropdown();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + matches.length) % matches.length;
      renderDropdown();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && matches[activeIndex]) submitGuess(matches[activeIndex]);
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  }

  // Arrow/Home/End move between mode tabs (activation follows focus, ARIA pattern).
  function onTabKey(e) {
    var order = ["daily", "practice", "legends", "endless"], n = order.length;
    var i = order.indexOf(mode), next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order[(i + n - 1) % n];
    else if (e.key === "Home") next = order[0];
    else if (e.key === "End") next = order[n - 1];
    if (!next) return;
    e.preventDefault();
    setMode(next);
    tabFor(next).focus();
  }

  function cacheEls() {
    els.input = $("guess-input");
    els.dropdown = $("dropdown");
    els.board = $("board");
    els.counter = $("counter");
    els.banner = $("banner");
    els.newGame = $("new-game");
    els.giveUp = $("give-up");
    els.hint = $("hint");
    els.hints = $("hints");
    els.infoBtn = $("info-btn");
    els.infoModal = $("info-modal");
    els.infoClose = $("info-close");
    els.statsBtn = $("stats-btn");
    els.statsModal = $("stats-modal");
    els.statsClose = $("stats-close");
    els.statsBody = $("stats-body");
    els.tabDaily = $("tab-daily");
    els.tabPractice = $("tab-practice");
    els.tabLegends = $("tab-legends");
    els.tabEndless = $("tab-endless");
    els.challengeNote = $("challenge-note");
    els.toast = $("toast");
    els.srStatus = $("sr-status");
    els.hardToggle = $("hard-toggle");
    els.fxToggle = $("fx-toggle");
    els.eraWrap = $("era-wrap");
    els.eraSelect = $("era-select");
    els.modes = document.querySelector(".modes");
    els.boardWrap = document.querySelector(".board-wrap");
    els.boardScroll = document.querySelector(".board-scroll");
  }

  function init() {
    cacheEls();
    if (!PLAYERS.length) {
      els.counter.textContent = "No player data loaded.";
      return;
    }

    els.input.addEventListener("input", refreshMatches);
    els.input.addEventListener("keydown", onKeyDown);
    els.input.addEventListener("focus", refreshMatches);
    document.addEventListener("click", function (e) {
      if (e.target !== els.input && !els.dropdown.contains(e.target)) closeDropdown();
    });
    els.newGame.addEventListener("click", newGame);
    els.giveUp.addEventListener("click", onGiveUp);
    els.hint.addEventListener("click", onHint);

    // `|| challengeTarget` so re-clicking the current tab during a challenge returns to normal play.
    els.tabDaily.addEventListener("click", function () { if (mode !== "daily" || challengeTarget) setMode("daily"); });
    els.tabPractice.addEventListener("click", function () { if (mode !== "practice" || challengeTarget) setMode("practice"); });
    els.tabLegends.addEventListener("click", function () { if (mode !== "legends" || challengeTarget) setMode("legends"); });
    els.tabEndless.addEventListener("click", function () { if (mode !== "endless" || challengeTarget) setMode("endless"); });
    els.modes.addEventListener("keydown", onTabKey);

    // Info modal
    els.infoBtn.addEventListener("click", function () { setInfo(true); });
    els.infoClose.addEventListener("click", function () { setInfo(false); });
    els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) setInfo(false); });
    els.infoModal.addEventListener("keydown", function (e) { trapTab(e, els.infoModal.firstElementChild); });
    // Stats modal
    els.statsBtn.addEventListener("click", openStats);
    els.statsClose.addEventListener("click", closeStats);
    els.statsModal.addEventListener("click", function (e) { if (e.target === els.statsModal) closeStats(); });
    els.statsModal.addEventListener("keydown", function (e) { trapTab(e, els.statsModal.firstElementChild); });
    // Esc closes whichever modal is open (closeModal restores focus to the opener).
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!els.infoModal.hidden) setInfo(false);
      if (!els.statsModal.hidden) closeStats();
    });

    // Re-deal the daily if the local date changed while the tab was backgrounded.
    document.addEventListener("visibilitychange", function () { if (!document.hidden) checkDailyRollover(); });
    window.addEventListener("focus", checkDailyRollover);

    // Mobile board horizontal-scroll affordance.
    els.boardScroll.addEventListener("scroll", updateScrollShadow);
    window.addEventListener("resize", updateScrollShadow);

    // Hard-mode toggle (persisted across sessions).
    hardMode = !!lsGet(K.hard, false);
    if (els.hardToggle) {
      els.hardToggle.checked = hardMode;
      els.hardToggle.addEventListener("change", function () {
        hardMode = els.hardToggle.checked;
        lsSet(K.hard, hardMode);
        refreshMatches();
      });
    }

    // Legends era filter (deals a fresh legend from the chosen decade).
    buildEraOptions();
    els.eraSelect.addEventListener("change", function () {
      legendEra = els.eraSelect.value;
      if (mode === "legends") newGame();
    });

    // Sound + vibration toggle (off by default).
    fxOn = !!lsGet(K.fx, false);
    if (els.fxToggle) {
      els.fxToggle.checked = fxOn;
      els.fxToggle.addEventListener("change", function () {
        fxOn = els.fxToggle.checked;
        lsSet(K.fx, fxOn);
        if (fxOn) { ensureAudio(); vibrate(10); }   // unlock audio within the user gesture
      });
    }

    // A #c=… link opens straight into that challenge; otherwise resume the last mode.
    window.addEventListener("hashchange", function () { applyChallengeFromHash(); });
    if (!applyChallengeFromHash()) setMode(lsGet(K.mode, "daily"));
  }

  // Exposed for the hub: tiles/deep-links → onShow (resume last mode), goDaily / goPractice force a mode.
  window.Mystery = {
    goDaily: function () { setMode("daily"); },
    goPractice: function () { setMode("practice"); },
    onShow: function () {
      if (maybeFirstHelp()) return;          // focus stays in the how-to modal
      if (!over && els.input) els.input.focus();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
