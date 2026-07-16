/* Roster Master — the completion board, not a daily game. All twenty 2025-26
 * rosters; pick a club and name its whole roster from memory into an empty
 * grid headed Guards / Forwards / Centers. Pure RECALL: one input, NO
 * autocomplete (typing a match auto-fills its slot; a unique surname is
 * enough). Progress auto-saves per club; Clear wipes the board but your best
 * score (%) survives. Zero data files — reads window.PLAYERS directly, so it
 * always mirrors the cross-checked rosters. Exposes window.RosterMaster. */
(function () {
  "use strict";

  var PLAYERS = window.PLAYERS || [];
  var POS_ORDER = ["Guard", "Forward", "Center"];
  var POS_LABEL = { Guard: "Guards", Forward: "Forwards", Center: "Centers" };

  var TEAMS = (function () { var s = {}; PLAYERS.forEach(function (p) { s[p.team] = 1; }); return Object.keys(s).sort(); })();

  // Club badges: colours + a 3-letter code only — REAL crests are trademarked
  // artwork, so the roundels stay generic (colour + initials is safe ground).
  var CLUB_META = {
    "Anadolu Efes":     { code: "EFS", bg: "#003268", fg: "#ffffff" },
    "AS Monaco":        { code: "MCO", bg: "#e51b22", fg: "#ffffff" },
    "ASVEL":            { code: "ASV", bg: "#58585a", fg: "#ffffff" },
    "Baskonia":         { code: "BAS", bg: "#002a5c", fg: "#ffffff" },
    "Bayern Munich":    { code: "MUN", bg: "#dc052d", fg: "#ffffff" },
    "Crvena Zvezda":    { code: "CZV", bg: "#e2231a", fg: "#ffffff" },
    "Dubai BC":         { code: "DUB", bg: "#101820", fg: "#c9a22b" },
    "FC Barcelona":     { code: "BAR", bg: "#154284", fg: "#ffffff" },
    "Fenerbahce":       { code: "FEN", bg: "#163962", fg: "#ffd100" },
    "Hapoel Tel Aviv":  { code: "HTA", bg: "#e2231a", fg: "#ffffff" },
    "Maccabi Tel Aviv": { code: "MTA", bg: "#ffcd00", fg: "#003a70" },
    "Olimpia Milano":   { code: "MIL", bg: "#ed1c24", fg: "#ffffff" },
    "Olympiacos":       { code: "OLY", bg: "#d5121e", fg: "#ffffff" },
    "Panathinaikos":    { code: "PAO", bg: "#007a33", fg: "#ffffff" },
    "Paris Basketball": { code: "PRS", bg: "#3d3d3d", fg: "#ffffff" },
    "Partizan":         { code: "PAR", bg: "#1d1a14", fg: "#ffffff" },
    "Real Madrid":      { code: "MAD", bg: "#eeb211", fg: "#1d1a14" },
    "Valencia":         { code: "VAL", bg: "#ee7623", fg: "#1d1a14" },
    "Virtus Bologna":   { code: "VIR", bg: "#1d1a14", fg: "#ffd100" },
    "Zalgiris Kaunas":  { code: "ZAL", bg: "#00685e", fg: "#ffffff" }
  };
  function clubMeta(t) {
    if (CLUB_META[t]) return CLUB_META[t];
    var code = t.split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 3).toUpperCase();
    return { code: code || "?", bg: "#6e6656", fg: "#ffffff" };
  }
  function badgeHTML(t) {
    var m = clubMeta(t);
    return "<span class='rm-badge' style='background:" + m.bg + ";color:" + m.fg + "' aria-hidden='true'>" + m.code + "</span>";
  }

  var ROSTER = {};                    // club → players (sorted by jersey number)
  PLAYERS.forEach(function (p) { (ROSTER[p.team] = ROSTER[p.team] || []).push(p); });
  TEAMS.forEach(function (t) { ROSTER[t].sort(function (a, b) { return a.number - b.number; }); });
  var TOTAL = PLAYERS.length;

  // --- Forgiving name matching -------------------------------------------------
  // A guess hits when its normalised form equals one of a player's aliases:
  // the full name, the name without a Jr/II suffix, the surname, the last two
  // tokens ("dos santos"), and initials merged ("T.J." → "tj"). Case, accents,
  // dots, hyphens and apostrophes never matter.
  var SUFFIX = { jr: 1, sr: 1, ii: 1, iii: 1, iv: 1 };
  function norm(s) {
    s = String(s).toLowerCase();
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return s.replace(/['’]/g, "").replace(/[.\-]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  }
  function mergeInitials(tokens) {    // ["t","j","shorts"] → ["tj","shorts"]
    var out = [], buf = "";
    tokens.forEach(function (t) { if (t.length === 1) buf += t; else { if (buf) { out.push(buf); buf = ""; } out.push(t); } });
    if (buf) out.push(buf);
    return out;
  }
  function aliasesOf(name) {
    var full = norm(name), toks = full.split(" ");
    var base = toks.slice();
    while (base.length > 1 && SUFFIX[base[base.length - 1]]) base.pop();
    var out = {};
    out[full] = 1;
    out[base.join(" ")] = 1;
    out[base[base.length - 1]] = 1;                              // surname
    if (base.length >= 2) out[base.slice(-2).join(" ")] = 1;     // "dos santos"
    out[mergeInitials(toks).join(" ")] = 1;
    out[mergeInitials(base).join(" ")] = 1;
    return out;
  }
  var ALIAS = {}; PLAYERS.forEach(function (p) { ALIAS[p.name] = aliasesOf(p.name); });

  // --- Storage -------------------------------------------------------------------
  var K = {
    board: function (c) { return "elg:rm:board:" + c; },
    best: function (c) { return "elg:rm:best:" + c; },
    open: "elg:rm:open", seen: "elg:rm:seenhelp"
  };
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var els = {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var club = null;                    // open club, or null → picker
  var named = {};                     // canonical names filled on the open board
  var lastFocus = null, inited = false;

  function validNames(c) { var v = {}; ROSTER[c].forEach(function (p) { v[p.name] = 1; }); return v; }
  function loadBoard(c) {             // roster edits drop stale names silently
    var v = validNames(c), out = {};
    (lsGet(K.board(c), []) || []).forEach(function (n) { if (v[n]) out[n] = 1; });
    return out;
  }
  function saveBoard() { if (club) lsSet(K.board(club), Object.keys(named)); }
  function savedCount(c) {
    if (c === club) return Object.keys(named).length;
    var v = validNames(c), n = 0;
    (lsGet(K.board(c), []) || []).forEach(function (x) { if (v[x]) n++; });
    return n;
  }
  function getBest(c) { var b = lsGet(K.best(c), null); return (b && typeof b.n === "number" && b.of) ? b : { n: 0, of: ROSTER[c].length }; }
  function pct(b) { return Math.min(100, Math.round(100 * b.n / b.of)); }
  function bumpBest() {
    var n = Object.keys(named).length, b = getBest(club);
    if (n > b.n) lsSet(K.best(club), { n: n, of: ROSTER[club].length });
  }

  // --- Guessing -------------------------------------------------------------------
  // Returns "hit" | "dup" | "ambiguous" | "miss" | "empty". `loud` flashes feedback
  // for misses too (Enter); silent probing (while typing) only reacts to a hit.
  function tryGuess(text, loud) {
    if (!club) return "empty";
    var g = norm(text);
    if (!g) return "empty";
    var fresh = [], done = [];
    ROSTER[club].forEach(function (p) {
      if (!ALIAS[p.name][g]) return;
      (named[p.name] ? done : fresh).push(p);
    });
    if (fresh.length === 1) {
      var p = fresh[0];
      named[p.name] = 1;
      saveBoard(); bumpBest();
      renderBoard();
      var n = Object.keys(named).length, tot = ROSTER[club].length;
      flash(n === tot ? "🎉 Full roster — " + tot + "/" + tot + "!" : "✓ " + p.name + " · #" + p.number, "ok");
      say(p.name + " filled. " + n + " of " + tot + " named.");
      return "hit";
    }
    if (fresh.length > 1) { if (loud) flash("Two players match — be more specific.", "err"); return "ambiguous"; }
    if (done.length) { if (loud) flash("Already named.", "err"); return "dup"; }
    if (loud) flash("No match on this roster.", "err");
    return "miss";
  }

  // --- Clear (two-click arm, best survives) ----------------------------------------
  var armed = false;
  function disarmClear() { armed = false; if (els.clear) { els.clear.classList.remove("armed"); els.clear.textContent = "Clear board"; } }
  function onClear() {
    if (!club) return;
    if (!armed) { armed = true; els.clear.classList.add("armed"); els.clear.textContent = "Really clear?"; return; }
    performClear();
  }
  function performClear() {
    var b = getBest(club);
    named = {}; saveBoard();
    disarmClear(); renderBoard();
    flash(b.n > 0 ? "Board cleared — best " + pct(b) + "% kept." : "Board cleared.", "ok");
    say("Board cleared.");
  }

  // Clear ALL boards from the picker — same contract: bests (and gold) survive.
  var armedAll = false;
  function disarmClearAll() { armedAll = false; if (els.clearAll) { els.clearAll.classList.remove("armed"); els.clearAll.textContent = "Clear all boards"; } }
  function onClearAll() {
    if (!armedAll) { armedAll = true; els.clearAll.classList.add("armed"); els.clearAll.textContent = "Really clear all " + TEAMS.length + "?"; return; }
    performClearAll();
  }
  function performClearAll() {
    TEAMS.forEach(function (t) { lsSet(K.board(t), []); });
    if (club) named = {};
    disarmClearAll();
    renderPicker(); renderSummary();
    say("All boards cleared. Best scores kept.");
  }

  // --- Rendering --------------------------------------------------------------------
  function flash(msg, cls) { if (!els.flash) return; els.flash.textContent = msg || ""; els.flash.className = "rm-flash" + (cls ? " " + cls : ""); }
  function say(msg) { if (els.sr) els.sr.textContent = msg; }

  function renderSummary() {
    if (!els.summary) return;
    var total = 0, full = 0;
    TEAMS.forEach(function (t) { var n = savedCount(t); total += n; if (n >= ROSTER[t].length) full++; });
    els.summary.textContent = "Named " + total + "/" + TOTAL + " · Clubs complete " + full + "/" + TEAMS.length;
  }
  function everGold(t) { return getBest(t).n >= ROSTER[t].length && ROSTER[t].length > 0; }
  function renderPicker() {
    if (!els.picker) return;
    els.picker.innerHTML = "";
    TEAMS.forEach(function (t) {
      var n = savedCount(t), tot = ROSTER[t].length, b = getBest(t);
      var btn = document.createElement("button");
      btn.type = "button";
      // Gold = ever completed (keys off best, so it SURVIVES a Clear) — the trophy state.
      btn.className = "rm-chip" + (everGold(t) ? " gold" : n > 0 ? " started" : "");
      btn.innerHTML = badgeHTML(t) +
        "<span class='rm-chip-text'><span class='rm-chip-club'>" + esc(t) + "</span>" +
        "<span class='rm-chip-meta'>" + n + "/" + tot + (b.n > 0 ? " · best " + pct(b) + "%" : "") + "</span></span>";
      btn.addEventListener("click", function () { openClub(t); });
      els.picker.appendChild(btn);
    });
  }
  function renderBoard() {
    if (!els.groups || !club) return;
    var tot = ROSTER[club].length, n = Object.keys(named).length, b = getBest(club);
    if (els.clubName) els.clubName.innerHTML = badgeHTML(club) + "<span>" + esc(club) + "</span>";
    if (els.progress) {
      els.progress.textContent = n + "/" + tot + " named" + (b.n > 0 ? " · Best " + pct(b) + "%" : "") +
        (n === tot ? " — 🏆 complete!" : everGold(club) ? " ★" : "");
      els.progress.className = "counter" + (everGold(club) ? " rm-gold-line" : "");
    }
    els.groups.innerHTML = "";
    POS_ORDER.forEach(function (pos) {
      var members = ROSTER[club].filter(function (p) { return p.position === pos; });
      if (!members.length) return;
      var got = members.filter(function (p) { return named[p.name]; });
      var sec = document.createElement("div"); sec.className = "rm-group";
      var head = document.createElement("div"); head.className = "rm-ghead";
      head.innerHTML = "<span>" + POS_LABEL[pos] + "</span><span class='rm-gcount'>" + got.length + "/" + members.length + "</span>";
      sec.appendChild(head);
      var list = document.createElement("div"); list.className = "rm-slots";
      got.forEach(function (p) {
        var d = document.createElement("div"); d.className = "rm-slot filled";
        d.innerHTML = "<span class='rm-num'>#" + p.number + "</span>" + esc(p.name);
        list.appendChild(d);
      });
      for (var i = got.length; i < members.length; i++) { var e = document.createElement("div"); e.className = "rm-slot"; e.innerHTML = "&nbsp;"; list.appendChild(e); }
      sec.appendChild(list);
      els.groups.appendChild(sec);
    });
    renderSummary();
  }

  // --- Navigation --------------------------------------------------------------------
  function openClub(t) {
    club = t; named = loadBoard(t); bumpBest();          // reconcile best with any pre-existing board
    lsSet(K.open, t);
    disarmClear(); disarmClearAll(); flash("");
    if (els.picker) els.picker.hidden = true;
    if (els.pickerActions) els.pickerActions.hidden = true;
    if (els.board) els.board.hidden = false;
    if (els.input) { els.input.value = ""; if (els.input.focus) els.input.focus(); }
    renderBoard();
  }
  function backToPicker() {
    saveBoard();
    club = null; lsSet(K.open, null);
    disarmClear(); disarmClearAll(); flash("");
    if (els.board) els.board.hidden = true;
    if (els.picker) els.picker.hidden = false;
    if (els.pickerActions) els.pickerActions.hidden = false;
    renderPicker(); renderSummary();
  }

  function chipLabel() {               // hub tile: overall recall instead of a daily chip
    var n = 0; TEAMS.forEach(function (t) { n += savedCount(t); });
    if (!n) return "";
    return Math.min(100, Math.round(100 * n / TOTAL)) + "% named";
  }

  // --- How-to modal ---------------------------------------------------------------------
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

  // --- Init --------------------------------------------------------------------------------
  function init() {
    els.view = $("rostermaster-view"); els.summary = $("rm-summary");
    els.picker = $("rm-picker"); els.pickerActions = $("rm-picker-actions"); els.clearAll = $("rm-clear-all");
    els.board = $("rm-board");
    els.back = $("rm-back"); els.clubName = $("rm-club"); els.clear = $("rm-clear");
    els.progress = $("rm-progress"); els.input = $("rm-input");
    els.flash = $("rm-flash"); els.sr = $("rm-sr"); els.groups = $("rm-groups");
    els.infoBtn = $("rm-info-btn"); els.infoModal = $("rm-info-modal"); els.infoClose = $("rm-info-close");
    if (!els.picker || !PLAYERS.length) return;
    inited = true;

    if (els.input) {
      els.input.addEventListener("input", function () {
        disarmClear();
        if (tryGuess(els.input.value, false) === "hit") els.input.value = "";
      });
      els.input.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        if (e.preventDefault) e.preventDefault();
        if (tryGuess(els.input.value, true) === "hit") els.input.value = "";
      });
    }
    if (els.back) els.back.addEventListener("click", backToPicker);
    if (els.clear) els.clear.addEventListener("click", onClear);
    if (els.clearAll) els.clearAll.addEventListener("click", onClearAll);
    if (els.infoBtn) els.infoBtn.addEventListener("click", openInfo);
    if (els.infoClose) els.infoClose.addEventListener("click", closeInfo);
    if (els.infoModal) els.infoModal.addEventListener("click", function (e) { if (e.target === els.infoModal) closeInfo(); });
    document.addEventListener("keydown", onModalKey);

    renderPicker(); renderSummary();
  }

  window.RosterMaster = {
    onShow: function () {
      if (!inited) return;
      var last = lsGet(K.open, null);
      if (last && ROSTER[last]) openClub(last);
      else { backToPicker(); }
      maybeFirstHelp();
    },
    chipLabel: chipLabel,
    _open: openClub, _back: backToPicker,
    _guess: function (t) { return tryGuess(t, true); },
    _clear: performClear, _clearAll: performClearAll, _meta: clubMeta,
    _peek: function () {
      return { club: club, teams: TEAMS.length, total: club ? ROSTER[club].length : 0,
        named: club ? Object.keys(named).length : 0, best: club ? getBest(club) : null };
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
