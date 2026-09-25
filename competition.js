/*
 * Which competition the games play on: the EuroLeague (players.js) or the
 * EuroCup (eurocup_players.js). Loaded after both data files and before any
 * game, because every game reads window.PLAYERS once, when it loads — so the
 * choice is made here, up front, and switching competitions reloads the page.
 *
 * The choice lives in elg:comp ("euroleague" | "eurocup"); a ?comp= in the URL
 * sets it too. The EuroCup is only chosen once build_eurocup.js opens it
 * (EUROCUP_OPEN) and it has players; until then it stays the coming-soon page
 * and nothing here changes anything.
 *
 * In EuroCup mode:
 *   - window.PLAYERS / window.TEAMS become the EuroCup's, the EuroLeague's are
 *     kept as EL_PLAYERS / EL_TEAMS, and LEGENDS is emptied (the non-active
 *     pool is EuroLeague history);
 *   - only the games in COMP_GAMES.eurocup are offered — the rest need careers,
 *     lineups or puzzles the EuroCup doesn't have yet;
 *   - saves are kept apart: every elg:<key> is read and written as
 *     elg:ec:<key>, so EuroCup stats, dailies and streaks never touch the
 *     EuroLeague ones. The few settings in SHARED stay common to both.
 */
(function () {
  "use strict";
  var KEY = "elg:comp";
  var SHARED = { "elg:comp": 1, "elg:theme": 1, "elg:fbname": 1, "elg:fbdraft": 1, "elg:consent": 1,
                 "elg:seenhelp": 1, "elg:hl:seenhelp": 1, "elg:rm:seenhelp": 1 };
  var COMP_GAMES = { eurocup: ["mystery", "higherlower", "rostermaster"] };
  var NAMES = { euroleague: "EuroLeague", eurocup: "EuroCup" };

  var ls = null;
  try { ls = window.localStorage; } catch (e) {}
  function readPref() {
    try { var v = JSON.parse(ls.getItem(KEY)); return NAMES[v] ? v : null; } catch (e) { return null; }
  }
  function writePref(c) {
    try { ls.setItem(KEY, JSON.stringify(c)); } catch (e) {}
  }

  var fromURL = null;
  try { fromURL = /[?&]comp=([a-z]+)/.exec(window.location.search || ""); fromURL = fromURL && fromURL[1]; } catch (e) {}
  if (NAMES[fromURL]) writePref(fromURL);

  var ready = !!(window.EUROCUP_OPEN && window.EUROCUP_PLAYERS && window.EUROCUP_PLAYERS.length);
  var comp = (readPref() === "eurocup" && ready) ? "eurocup" : "euroleague";

  window.ELG_COMP = {
    id: comp,
    name: NAMES[comp],
    names: NAMES,
    eurocupReady: ready,
    // Is this game offered in the current competition?
    plays: function (game) { return !COMP_GAMES[comp] || COMP_GAMES[comp].indexOf(game) >= 0; },
    // Remember the choice; the caller reloads.
    set: writePref
  };

  // The EuroCup blue (index.html CSS): the head script guessed from the stored
  // choice before paint; this is the answer, since the EuroCup may not be open.
  try {
    if (comp === "eurocup") document.documentElement.setAttribute("data-comp", "eurocup");
    else document.documentElement.removeAttribute("data-comp");
  } catch (e) {}

  if (comp !== "eurocup") return;

  window.EL_PLAYERS = window.PLAYERS;
  window.EL_TEAMS = window.TEAMS;
  window.PLAYERS = window.EUROCUP_PLAYERS;
  window.TEAMS = window.EUROCUP_TEAMS || {};
  window.LEGENDS = [];

  // Namespace the saves. Every game goes through window.localStorage, so the
  // three methods are wrapped once, here, rather than in eleven files. A real
  // browser Storage can't take own properties (assigning one stores an item),
  // so it is the prototype that gets wrapped, and only for this object.
  if (!ls) return;
  function mapKey(k) {
    k = String(k);
    return (k.indexOf("elg:") === 0 && !SHARED[k]) ? "elg:ec:" + k.slice(4) : k;
  }
  var target = (window.Storage && ls instanceof window.Storage) ? window.Storage.prototype : ls;
  ["getItem", "setItem", "removeItem"].forEach(function (m) {
    var orig = target[m];
    target[m] = function (k) {
      var args = Array.prototype.slice.call(arguments);
      if (this === ls) args[0] = mapKey(k);
      return orig.apply(this, args);
    };
  });
})();
