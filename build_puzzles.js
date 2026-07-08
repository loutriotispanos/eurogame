/*
 * Builds puzzles.js — the group puzzles for the "Connections" game (find the four
 * hidden groups of four). Zero deps. It reads the REAL generated data (players.js,
 * legends.js, careers.js, lineups.js) and DERIVES puzzles from it, so every name is
 * guaranteed to exist and every puzzle has a UNIQUE solution.
 *
 *   Run:  node build_puzzles.js   (idempotent; regenerates puzzles.js)
 *
 * Convention: NEVER hand-edit puzzles.js — tune the knobs below and re-run.
 *
 * Each puzzle is four groups of four, one per difficulty level so the colours form a
 * fixed easy→hard gradient — but the CATEGORY TYPE at each level now varies:
 *   level 1  a club's current roster                       ("Current Real Madrid")
 *   level 2  nationality | position                        ("France", "Centers")
 *   level 3  one F4 five | one whole Final Four | birth decade
 *   level 4  club legends | ex-players of a club | shared jersey number
 *            | 2.10 m or taller | played for 6+ clubs
 *
 * Uniqueness guarantee: a name is only used in a group if it matches THAT group's
 * predicate and none of the other three predicates in the same puzzle. Since the
 * four predicates are then mutually exclusive over the 16 chosen names, the intended
 * partition is the only valid one.
 *
 * FAIRNESS guarantee (don't regress): a category may only judge names whose facts we
 * actually hold, otherwise a knowledgeable player can make a factually-correct pick
 * that the data rejects. Attribute categories (nationality, decade, height, number)
 * set fullProfileOnly → every name in that puzzle must exist in PLAYERS/LEGENDS
 * (no lineup-only names with unknown attributes). Career categories (ex-club,
 * journeymen) set careersOnly → every name in that puzzle must have a CAREERS entry
 * (so "never played for X" is verifiable). Positions are total knowledge already:
 * roster position, or the lineup slot (PG/SG→Guard, SF/PF→Forward, C→Center).
 */
const fs = require("fs");

// Load the real data the same way test.js does (browser files assign to window.*).
var window = {};
eval(fs.readFileSync("players.js", "utf8"));
eval(fs.readFileSync("legends.js", "utf8"));
eval(fs.readFileSync("careers.js", "utf8"));
eval(fs.readFileSync("lineups.js", "utf8"));
var PLAYERS = window.PLAYERS || [];
var LEGENDS = window.LEGENDS || [];
var CAREERS = window.CAREERS || [];
var LINEUPS = window.LINEUPS || [];

var TARGET = 140;         // stop once we have this many distinct puzzles
var GROUP = 4;            // members per group
var MAX_USE = {           // cap how often one THEME can appear across puzzles (variety)
  club: 8, nat: 7, pos: 8, f4: 2, f4season: 3, decade: 7,
  legend: 7, exclub: 5, number: 2, tall: 6, journeys: 6
};

// Deterministic shuffle (fixed seed) so rebuilds are stable but the pool isn't
// biased toward whatever order the source data happens to be in.
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffled(arr, seed) { var a = arr.slice(), r = mulberry32(seed); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// --- Fact lookups (total over the names each category is allowed to see) ----
var PROFILE = {};                     // name → {nationality, height, birthYear, number, team}
PLAYERS.concat(LEGENDS).forEach(function (p) { if (!PROFILE[p.name]) PROFILE[p.name] = p; });
var CAREER_BY = {};                   // name → CAREERS entry
CAREERS.forEach(function (c) { CAREER_BY[c.name] = c; });
var CURRENT_TEAM = {};                // name → current club (active players only)
PLAYERS.forEach(function (p) { CURRENT_TEAM[p.name] = p.team; });
var POS_OF = {};                      // name → Guard/Forward/Center (roster first, lineup slot as fallback)
var SLOT_POS = { PG: "Guard", SG: "Guard", SF: "Forward", PF: "Forward", C: "Center" };
LINEUPS.forEach(function (L) { L.five.forEach(function (p) { if (!POS_OF[p.name]) POS_OF[p.name] = SLOT_POS[p.pos]; }); });
PLAYERS.concat(LEGENDS).forEach(function (p) { POS_OF[p.name] = p.position; });

function distinctClubs(c) { var s = {}, n = 0; c.career.forEach(function (e) { if (!s[e.team]) { s[e.team] = 1; n++; } }); return n; }
function playedFor(name, club) { var c = CAREER_BY[name]; return !!(c && c.career.some(function (e) { return e.team === club; })); }
function isEx(name, club) { return playedFor(name, club) && CURRENT_TEAM[name] !== club; }

// --- Predicate helpers (do the DATA membership tests) -----------------------
function isCurrent(name, club) { return CURRENT_TEAM[name] === club; }
function isNat(name, nat) { var p = PROFILE[name]; return !!(p && p.nationality === nat); }
function isPos(name, pos) { return POS_OF[name] === pos; }
function inFive(name, L) { return L.five.some(function (p) { return p.name === name; }); }
function inSeason(name, season) { return LINEUPS.some(function (L) { return L.season === season && inFive(name, L); }); }
function isDecade(name, d) { var p = PROFILE[name]; return !!(p && Math.floor(p.birthYear / 10) * 10 === d); }
function isLegendOf(name, club) { return LEGENDS.some(function (p) { return p.name === name && p.team === club; }); }
function isNumber(name, num) { var p = PROFILE[name]; return !!(p && p.number === num); }
function isTall(name) { var p = PROFILE[name]; return !!(p && p.height >= 210); }
function isJourney(name) { var c = CAREER_BY[name]; return !!(c && distinctClubs(c) >= 6); }

function predicate(cat) {
  if (cat.type === "club") return function (n) { return isCurrent(n, cat.value); };
  if (cat.type === "nat") return function (n) { return isNat(n, cat.value); };
  if (cat.type === "pos") return function (n) { return isPos(n, cat.value); };
  if (cat.type === "f4") return function (n) { return inFive(n, cat.lineup); };
  if (cat.type === "f4season") return function (n) { return inSeason(n, cat.value); };
  if (cat.type === "decade") return function (n) { return isDecade(n, cat.value); };
  if (cat.type === "exclub") return function (n) { return isEx(n, cat.value); };
  if (cat.type === "number") return function (n) { return isNumber(n, cat.value); };
  if (cat.type === "tall") return function (n) { return isTall(n); };
  if (cat.type === "journeys") return function (n) { return isJourney(n); };
  return function (n) { return isLegendOf(n, cat.value); };   // legend
}

// --- Build the candidate categories from data -------------------------------
function countBy(arr, key) { var m = {}; arr.forEach(function (x) { var k = x[key]; m[k] = (m[k] || 0) + 1; }); return m; }

// L1 — current club rosters (the easy, accessible anchor of every puzzle)
var clubCounts = countBy(PLAYERS, "team");
var clubCats = Object.keys(clubCounts).filter(function (c) { return clubCounts[c] >= GROUP; })
  .map(function (c) { return { type: "club", value: c, level: 1, theme: "Current " + c,
    pool: PLAYERS.filter(function (p) { return p.team === c; }).map(function (p) { return p.name; }) }; });

// L2 — nationalities (attribute → fullProfileOnly)
var natSeen = {};
PLAYERS.concat(LEGENDS).forEach(function (p) { natSeen[p.nationality] = (natSeen[p.nationality] || 0) + 1; });
var natCats = Object.keys(natSeen).filter(function (n) { return natSeen[n] >= GROUP; })
  .map(function (n) {
    var pool = [];
    PLAYERS.concat(LEGENDS).forEach(function (p) { if (p.nationality === n && pool.indexOf(p.name) < 0) pool.push(p.name); });
    return { type: "nat", value: n, level: 2, theme: n, fullProfileOnly: true, pool: pool };
  });

// L2 — positions (POS_OF is total over roster + lineup names, so no profile flag)
var posCats = ["Guard", "Forward", "Center"].map(function (pos) {
  var pool = Object.keys(POS_OF).filter(function (n) { return POS_OF[n] === pos; });
  return { type: "pos", value: pos, level: 2, theme: pos + "s", pool: pool };
});

// L3 — one Final Four starting five
var f4Cats = LINEUPS.map(function (L) {
  return { type: "f4", value: L.season + " " + L.team, level: 3, lineup: L,
    theme: L.season + " " + L.team + " · Final Four", pool: L.five.map(function (p) { return p.name; }) };
});

// L3 — everyone who started at one Final Four (across its four teams)
var seasonSeen = {};
LINEUPS.forEach(function (L) { (seasonSeen[L.season] = seasonSeen[L.season] || []).push(L); });
var f4SeasonCats = Object.keys(seasonSeen).map(function (s) {
  var pool = [];
  seasonSeen[s].forEach(function (L) { L.five.forEach(function (p) { if (pool.indexOf(p.name) < 0) pool.push(p.name); }); });
  return { type: "f4season", value: +s, level: 3, theme: "Started at the " + s + " Final Four", pool: pool };
});

// L3 — birth decades (legend-era flavour only; 1990s/2000s would be "every young guy")
var decadeCats = [];
(function () {
  var byDec = {};
  PLAYERS.concat(LEGENDS).forEach(function (p) { var d = Math.floor(p.birthYear / 10) * 10; (byDec[d] = byDec[d] || []).push(p.name); });
  Object.keys(byDec).map(Number).filter(function (d) { return d <= 1980 && byDec[d].length >= GROUP; })
    .forEach(function (d) {
      var pool = []; byDec[d].forEach(function (n) { if (pool.indexOf(n) < 0) pool.push(n); });
      decadeCats.push({ type: "decade", value: d, level: 3, theme: "Born in the " + d + "s", fullProfileOnly: true, pool: pool });
    });
})();

// L4 — club legends
var legCounts = countBy(LEGENDS, "team");
var legendCats = Object.keys(legCounts).filter(function (c) { return legCounts[c] >= GROUP; })
  .map(function (c) { return { type: "legend", value: c, level: 4, theme: c + " legends",
    pool: LEGENDS.filter(function (p) { return p.team === c; }).map(function (p) { return p.name; }) }; });

// L4 — ex-players of one club (career includes it, not currently there; careersOnly)
var exclubCats = [];
(function () {
  var byClub = {};
  CAREERS.forEach(function (c) {
    var seen = {};
    c.career.forEach(function (e) {
      if (seen[e.team]) return; seen[e.team] = 1;
      if (isEx(c.name, e.team)) (byClub[e.team] = byClub[e.team] || []).push(c.name);
    });
  });
  Object.keys(byClub).filter(function (c) { return byClub[c].length >= GROUP + 1; })   // +1 slack for exclusions
    .forEach(function (c) { exclubCats.push({ type: "exclub", value: c, level: 4, theme: "Ex-" + c, careersOnly: true, pool: byClub[c] }); });
})();

// L4 — shared jersey number (attribute → fullProfileOnly)
var numberCats = [];
(function () {
  var byNum = {};
  PLAYERS.concat(LEGENDS).forEach(function (p) { (byNum[p.number] = byNum[p.number] || []).push(p.name); });
  Object.keys(byNum).map(Number).filter(function (n) { return byNum[n].length >= GROUP + 1; })
    .forEach(function (n) {
      var pool = []; byNum[n].forEach(function (x) { if (pool.indexOf(x) < 0) pool.push(x); });
      numberCats.push({ type: "number", value: n, level: 4, theme: "#" + n + " on the jersey", fullProfileOnly: true, pool: pool });
    });
})();

// L4 — the 2.10 m club + the journeymen
var tallPool = [];
PLAYERS.concat(LEGENDS).forEach(function (p) { if (p.height >= 210 && tallPool.indexOf(p.name) < 0) tallPool.push(p.name); });
var tallCats = tallPool.length >= GROUP ? [{ type: "tall", value: 210, level: 4, theme: "2.10 m or taller", fullProfileOnly: true, pool: tallPool }] : [];
var journeyPool = CAREERS.filter(function (c) { return distinctClubs(c) >= 6; }).map(function (c) { return c.name; });
var journeyCats = journeyPool.length >= GROUP ? [{ type: "journeys", value: 6, level: 4, theme: "Played for 6+ clubs", careersOnly: true, pool: journeyPool }] : [];

// --- Try to materialise one puzzle from four chosen categories --------------
// Returns the 4 groups (with 4 clean members each) or null if it can't be made clean.
function makePuzzle(cats, seed) {
  var preds = cats.map(predicate);
  var needProfile = cats.some(function (c) { return c.fullProfileOnly; });
  var needCareers = cats.some(function (c) { return c.careersOnly; });
  var groups = [];
  for (var i = 0; i < cats.length; i++) {
    var mine = preds[i];
    var clean = cats[i].pool.filter(function (name) {
      if (needProfile && !PROFILE[name]) return false;    // attribute facts must be known for every name
      if (needCareers && !CAREER_BY[name]) return false;  // career facts must be known for every name
      if (!mine(name)) return false;
      for (var j = 0; j < preds.length; j++) if (j !== i && preds[j](name)) return false;  // matches another group → ambiguous
      return true;
    });
    if (clean.length < GROUP) return null;
    groups.push({ theme: cats[i].theme, level: cats[i].level, members: shuffled(clean, seed + i * 17).slice(0, GROUP) });
  }
  // Sanity: 16 distinct names across the four groups.
  var seen = {}, total = 0;
  groups.forEach(function (g) { g.members.forEach(function (m) { if (!seen[m]) { seen[m] = 1; total++; } }); });
  if (total !== cats.length * GROUP) return null;
  return groups;
}

// --- Generate a varied, deterministic set of puzzles ------------------------
// Level buckets — each puzzle takes ONE category per level, so the type mix varies
// (30 possible recipes) while colours keep meaning easiest→hardest.
var BUCKETS = {
  1: shuffled(clubCats, 1),
  2: shuffled(natCats.concat(posCats), 2),
  3: shuffled(f4Cats.concat(f4SeasonCats, decadeCats), 3),
  4: shuffled(legendCats.concat(exclubCats, numberCats, tallCats, journeyCats), 4)
};
var puzzles = [], sigSeen = {}, use = {};
function used(c) { return use[c.type + "|" + c.theme] || 0; }
function bump(c) { use[c.type + "|" + c.theme] = used(c) + 1; }
function ranked(level, round) {                   // under-cap cats, least-used first;
  return shuffled(BUCKETS[level], 7000 + round)   // fresh tie-break each round so hard-to-
    .filter(function (c) { return used(c) < MAX_USE[c.type]; })   // combine cats can't clog the search
    .sort(function (a, b) { return used(a) - used(b); });
}

// Seeded random sampling, biased toward the front (least-used) but able to reach any
// candidate — a fixed window deadlocks once its cats are mutually unbuildable.
// Each round also PINS the L2/L3/L4 type via a rotation, otherwise well-supplied types
// (30 number themes, 48 ex-clubs) always win the race and rare ones (tall, journeymen)
// never appear at all.
var ROTATE = {
  2: ["nat", "nat", "pos"],
  3: ["f4", "f4season", "decade"],
  4: ["legend", "exclub", "number", "tall", "legend", "exclub", "number", "journeys"]
};
var TRIES = 500;                                  // combo attempts per puzzle round
var barren = 0;                                   // consecutive rounds that built nothing
for (var round = 0; puzzles.length < TARGET && barren < 60; round++) {
  var lists = [1, 2, 3, 4].map(function (lv) {
    var all = ranked(lv, round);
    var rot = ROTATE[lv];
    if (!rot) return all;
    var want = rot[round % rot.length];
    var only = all.filter(function (c) { return c.type === want; });
    return only.length ? only : all;              // pinned type exhausted → whole bucket
  });
  if (lists.some(function (l) { return !l.length; })) break;
  var rng = mulberry32(9000 + round), made = false;
  function pick(list) { return list[Math.floor(Math.pow(rng(), 2.2) * list.length)]; }
  for (var t = 0; t < TRIES && !made; t++) {
    var cats = lists.map(pick);
    var sig = cats.map(function (x) { return x.theme; }).sort().join(" | ");
    if (sigSeen[sig]) continue;
    var groups = makePuzzle(cats, puzzles.length * 101 + 5);
    if (!groups) continue;
    sigSeen[sig] = 1;
    puzzles.push({ groups: groups });
    cats.forEach(bump);
    made = true;
  }
  barren = made ? 0 : barren + 1;
}

if (puzzles.length < 20) { console.error("ERROR: only produced " + puzzles.length + " puzzles"); process.exit(1); }

// --- Emit puzzles.js --------------------------------------------------------
var lines = ["/* AUTO-GENERATED by build_puzzles.js — do not edit by hand. Group puzzles for Connections. */",
             "window.PUZZLES = ["];
puzzles.forEach(function (p) { lines.push("  " + JSON.stringify(p) + ","); });
lines.push("];");
fs.writeFileSync("puzzles.js", lines.join("\n") + "\n");

console.log("Wrote puzzles.js — " + puzzles.length + " puzzles");
var typeMix = {};
puzzles.forEach(function (p) { p.groups.forEach(function (g) { /* recover type from theme via use map */ }); });
Object.keys(use).sort().forEach(function (k) { var t = k.split("|")[0]; typeMix[t] = (typeMix[t] || 0) + use[k]; });
console.log("Category-type mix:", JSON.stringify(typeMix));
console.log("Sample:");
puzzles.slice(0, 4).forEach(function (p, i) {
  console.log("  #" + (i + 1));
  p.groups.forEach(function (g) { console.log("    L" + g.level + " " + g.theme + ": " + g.members.join(", ")); });
});
