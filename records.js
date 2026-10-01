/* Records — the agate page. Every number the hub keeps, set on one
 * rule-separated sheet: the unified streak, each game's daily record
 * (played / solved / win % / best run), the endless & practice bests,
 * and the Roster Master recall totals. Reads localStorage only — no
 * game code runs and nothing is ever written. Exposes window.Records. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function lsGet(k, f) { try { var v = window.localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  // Daily games in home-tile order. `d` = the daily-stats key each game keeps;
  // the shape is {played, solved, curStreak, maxStreak, …} everywhere except
  // Mystery, whose older elg:stats counts wins under `wins`.
  var GAMES = [
    { id: "mystery",      name: "Mystery Player",    d: "elg:stats", winKey: "wins" },
    { id: "playerid",     name: "Player ID",         d: "elg:pid:dstats" },
    { id: "completefive", name: "Complete the Five", d: "elg:c5:dstats" },
    { id: "connections",  name: "Connections",       d: "elg:cn:dstats" },
    { id: "careerorder",  name: "Career Order",      d: "elg:co:dstats" },
    { id: "thegrid",      name: "The Grid",          d: "elg:gr:dstats" },
    { id: "clubreveal",   name: "Common Club",       d: "elg:cv:dstats" },
    { id: "pathbetween",  name: "Path Between",      d: "elg:pb:dstats" },
    { id: "oddoneout",    name: "Odd One Out",       d: "elg:oo:dstats" },
    { id: "higherlower",  name: "Higher or Lower",   d: "elg:hl:dstats" },
    { id: "sixofakind",   name: "Six of a Kind",     d: "elg:sk:dstats" }
  ];

  function dailyRow(g) {
    var s = lsGet(g.d, null) || {};
    var won = s[g.winKey || "solved"] || 0, played = s.played || 0;
    return { id: g.id, name: g.name, played: played, won: won,
             pct: played ? Math.round((won / played) * 100) : 0, best: s.maxStreak || 0 };
  }

  // Endless / practice bests that live outside the daily table.
  function extras() {
    var out = [];
    var me = lsGet("elg:endless", null) || {};
    if (me.played) out.push({ name: "Mystery Player", line: "Endless — best run " + (me.best || 0) + " · " + (me.wins || 0) + "/" + me.played + " solved" });
    var hl = lsGet("elg:hl:stats", null) || {};
    if (hl.runs) out.push({ name: "Higher or Lower", line: "Endless — best streak " + (hl.best || 0) + " · " + hl.runs + (hl.runs === 1 ? " run" : " runs") });
    var oo = lsGet("elg:oo:stats", null) || {};
    if (oo.played) out.push({ name: "Odd One Out", line: "Practice — " + (oo.correct || 0) + "/" + oo.played + " right · best streak " + (oo.maxStreak || 0) });
    return out;
  }

  // Roster Master: this season's surviving bests and gold clubs, plus the
  // every-season count when known. Asked of Roster Master itself, which owns
  // the save keys (one per season and club).
  function rosterMaster() {
    var R = window.RosterMaster;
    return R && R.records ? R.records() : { named: 0, of: 0, gold: 0, clubs: 0, all: null };
  }

  function collect() {
    var hub = { cur: 0, best: 0, done: false, freeze: false };
    if (window.Hub && window.Hub._reconcile) { window.Hub._reconcile(); hub = window.Hub._info(); }
    var C = window.ELG_COMP;   // only the games the current competition offers
    return { hub: hub, dailies: GAMES.filter(function (g) { return !C || C.plays(g.id); }).map(dailyRow), extras: extras(), rm: rosterMaster() };
  }

  function render() {
    var el = $("records-body"); if (!el) return;
    var d = collect(), h = "";

    h += "<div class='rec-streak'>" +
      (d.hub.cur > 0
        ? "🔥 <b>" + d.hub.cur + "-day</b> hub streak · best " + d.hub.best +
          (d.hub.freeze ? " · ❄️ freeze ready" : "") +
          (d.hub.done ? " · safe today ✓" : " · play a daily to keep it alive")
        : "No live streak — play any daily to start one." + (d.hub.best ? " Best so far: " + d.hub.best + "." : "")) +
      "</div>";

    h += "<div class='rec-sect'>Dailies</div>";
    h += "<div class='rec-head rec-grid'><span>Game</span><span>P</span><span>W</span><span>Win %</span><span>Best</span></div>";
    d.dailies.forEach(function (r) {
      h += "<div class='rec-row rec-grid'><span>" + esc(r.name) + "</span><span>" + r.played + "</span><span>" + r.won +
        "</span><span>" + (r.played ? r.pct + "%" : "—") + "</span><span>" + (r.best || "—") + "</span></div>";
    });
    if (!d.dailies.some(function (r) { return r.played > 0; })) {
      h += "<div class='rec-empty'>Nothing on the sheet yet — play any daily and your numbers land here.</div>";
    }

    if (d.extras.length) {
      h += "<div class='rec-sect'>Endless &amp; practice</div>";
      d.extras.forEach(function (x) { h += "<div class='rec-row rec-line'><b>" + esc(x.name) + "</b> — " + esc(x.line) + "</div>"; });
    }

    h += "<div class='rec-sect'>Roster Master</div>";
    var pct = d.rm.of ? Math.round((d.rm.named / d.rm.of) * 100) : 0;
    h += "<div class='rec-row rec-line'>Named <b>" + d.rm.named + "/" + d.rm.of + "</b> (" + pct + "%) · <b>" + d.rm.gold +
      "</b> of " + d.rm.clubs + " clubs gold ★" + (d.rm.season ? " · " + d.rm.season : "") + "</div>";
    var all = d.rm.all;
    if (all && all.crown) h += "<div class='rec-row rec-line'>👑 <b>Every roster, every season</b>: Roster Master complete</div>";
    else if (all && all.gold) h += "<div class='rec-row rec-line'>Every season since 2000-01: <b>" + all.gold + "/" + all.boards + "</b> boards ★ · <b>" +
      all.seasonsDone + "</b> seasons and <b>" + all.clubsDone + "</b> clubs complete</div>";

    el.innerHTML = h;
  }

  window.Records = {
    onShow: render,
    _collect: collect,
    _render: render
  };
})();
