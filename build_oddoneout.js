/*
 * Builds oddones.js — rounds for the "Odd One Out" game (4 names, 3 share something,
 * tap the intruder). Zero deps. Reads the REAL generated data (players.js, legends.js,
 * careers.js, lineups.js) and DERIVES rounds, so every name exists and every round has
 * a UNIQUE, defensible answer.
 *
 *   Run:  node build_oddoneout.js   (idempotent; regenerates oddones.js)
 *
 * Convention: NEVER hand-edit oddones.js — tune the knobs below and re-run.
 *
 * Each round: three players share ONE theme (a career club / nationality / jersey
 * number / one Final Four starting five) and a fourth does not.
 *
 * FAIRNESS + UNIQUENESS guarantee (the whole point — don't regress): all four names
 * are drawn from PROFILE ∩ CAREERS, so every fact a player might reason about
 * (nationality, position, birth decade, jersey number, every career club, every Final
 * Four five) is KNOWN for all four. A round is accepted only if EVERY attribute that is
 * shared by exactly three of the four excludes the SAME name — the intended intruder.
 * So whatever axis the solver reasons on, the odd one out is the same. (Reuses the exact
 * predicate helpers from build_puzzles.js.)
 */
const fs = require("fs");

// Load the real data the same way build_puzzles.js / test.js do.
var window = {};
eval(fs.readFileSync("players.js", "utf8"));
eval(fs.readFileSync("legends.js", "utf8"));
eval(fs.readFileSync("careers.js", "utf8"));
eval(fs.readFileSync("lineups.js", "utf8"));
var PLAYERS = window.PLAYERS || [];
var LEGENDS = window.LEGENDS || [];
var CAREERS = window.CAREERS || [];
var LINEUPS = window.LINEUPS || [];

var TARGET = 180;         // stop once we have this many distinct rounds
var MAX_USE = { club: 14, nat: 12, number: 3, f4: 6 };   // cap per theme for variety

// Only iconic numbers make a "3 share a jersey number" round feel memorable rather
// than arbitrary — everything else is excluded from the number theme (it still counts
// for the uniqueness check, it just never becomes the shown connection).
var MEMORABLE_NUMBERS = { "3": 1, "6": 1, "7": 1, "8": 1, "9": 1, "11": 1, "13": 1, "23": 1, "24": 1, "33": 1, "77": 1 };

// Deterministic shuffle (fixed seed) so rebuilds are stable.
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffled(arr, seed) { var a = arr.slice(), r = mulberry32(seed); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// --- Fact lookups (total over the names we allow) ---------------------------
var PROFILE = {};                     // name → {nationality, height, birthYear, number, team, position}
PLAYERS.concat(LEGENDS).forEach(function (p) { if (!PROFILE[p.name]) PROFILE[p.name] = p; });
var CAREER_BY = {};                   // name → CAREERS entry
CAREERS.forEach(function (c) { CAREER_BY[c.name] = c; });

function playedFor(name, club) { var c = CAREER_BY[name]; return !!(c && c.career.some(function (e) { return e.team === club; })); }
function clubsOf(name) { var c = CAREER_BY[name], s = {}, out = []; if (!c) return out; c.career.forEach(function (e) { if (!s[e.team]) { s[e.team] = 1; out.push(e.team); } }); return out; }
function inFive(name, L) { return L.five.some(function (p) { return p.name === name; }); }
function decadeOf(name) { var p = PROFILE[name]; return p ? Math.floor(p.birthYear / 10) * 10 : null; }

// POOL = names with BOTH a full profile and a career (so every axis is verifiable).
var POOL = Object.keys(PROFILE).filter(function (n) { return CAREER_BY[n]; });

// --- Uniqueness engine ------------------------------------------------------
// Every name shared by exactly 3 of the 4 (on ANY axis) must exclude the same one.
function excludedForValue(S, keyFn) {   // single-valued attributes (nat/pos/decade/number)
  var by = {}; S.forEach(function (n) { var k = keyFn(n); if (k == null) return; (by[k] = by[k] || []).push(n); });
  var out = [];
  Object.keys(by).forEach(function (k) { if (by[k].length === 3) out.push(S.filter(function (n) { return by[k].indexOf(n) < 0; })[0]); });
  return out;
}
function excludedForMembership(S, members) {  // set-membership attributes (each club / each five)
  var inC = S.filter(function (n) { return members(n); });
  return inC.length === 3 ? [S.filter(function (n) { return inC.indexOf(n) < 0; })[0]] : [];
}
function allExcluded(S) {                // every name isolated by an exactly-3 split, any axis
  var ex = [];
  ex = ex.concat(excludedForValue(S, function (n) { return PROFILE[n].nationality; }));
  ex = ex.concat(excludedForValue(S, function (n) { return PROFILE[n].position; }));
  ex = ex.concat(excludedForValue(S, function (n) { return decadeOf(n); }));
  ex = ex.concat(excludedForValue(S, function (n) { return PROFILE[n].number; }));
  var clubSet = {}; S.forEach(function (n) { clubsOf(n).forEach(function (c) { clubSet[c] = 1; }); });
  Object.keys(clubSet).forEach(function (c) { ex = ex.concat(excludedForMembership(S, function (n) { return playedFor(n, c); })); });
  LINEUPS.forEach(function (L) { ex = ex.concat(excludedForMembership(S, function (n) { return inFive(n, L); })); });
  return ex;
}
// Accept iff the theme isolates `odd` AND no axis isolates anyone else.
function isUnique(S, odd) { var ex = allExcluded(S); return ex.length > 0 && ex.every(function (n) { return n === odd; }); }

// --- Build candidate themes (pools of ≥3 sharers) ---------------------------
function tallyPools(keyer) { var m = {}; POOL.forEach(function (n) { keyer(n).forEach(function (k) { (m[k] = m[k] || []).push(n); }); }); return m; }

var clubPools = tallyPools(function (n) { return clubsOf(n); });                        // "played for X"
var natPools = tallyPools(function (n) { return [PROFILE[n].nationality]; });
var numPools = tallyPools(function (n) { return [PROFILE[n].number]; });
var f4Pools = {};                                                                       // lineup id → five ∩ POOL
LINEUPS.forEach(function (L, i) { var pool = L.five.map(function (p) { return p.name; }).filter(function (n) { return POOL.indexOf(n) >= 0; }); if (pool.length >= 3) f4Pools[i] = pool; });

function themesFrom(pools, type, label) {
  return Object.keys(pools).filter(function (k) { return pools[k].length >= 3; })
    .map(function (k) { return { type: type, key: k, pool: pools[k], theme: label(k) }; });
}
var CLUB_THEMES = themesFrom(clubPools, "club", function (c) { return "played for " + c; });
var NAT_THEMES = themesFrom(natPools, "nat", function (n) { return "represent " + n; });
var numPoolsMem = {}; Object.keys(numPools).forEach(function (k) { if (MEMORABLE_NUMBERS[k]) numPoolsMem[k] = numPools[k]; });
var NUM_THEMES = themesFrom(numPoolsMem, "number", function (n) { return "wore #" + n; });
var F4_THEMES = Object.keys(f4Pools).map(function (i) { var L = LINEUPS[i]; return { type: "f4", key: "f4" + i, pool: f4Pools[i], theme: "started at the " + L.season + " " + L.team + " Final Four" }; });

var BUCKETS = { club: CLUB_THEMES, nat: NAT_THEMES, number: NUM_THEMES, f4: F4_THEMES };
// bias hard toward clubs + nationalities; Final Four fives are occasional; jersey numbers
// are a rare treat (1 slot in 12 → ~8% of rounds) and only the memorable ones.
var ROTATE = ["club", "nat", "club", "f4", "nat", "club", "number", "club", "nat", "f4", "club", "nat"];

// --- Generate ---------------------------------------------------------------
var rounds = [], sigSeen = {}, use = {};
function used(t) { return use[t.type + "|" + t.key] || 0; }
function bump(t) { use[t.type + "|" + t.key] = used(t) + 1; }

var barren = 0;
for (var round = 0; rounds.length < TARGET && barren < 400; round++) {
  var type = ROTATE[round % ROTATE.length];
  var themes = shuffled(BUCKETS[type], 100 + round).filter(function (t) { return used(t) < MAX_USE[t.type]; }).sort(function (a, b) { return used(a) - used(b); });
  if (!themes.length) { barren++; continue; }
  var made = false;
  for (var ti = 0; ti < themes.length && !made; ti++) {
    var th = themes[ti];
    var trioSrc = shuffled(th.pool, 200 + round * 7 + ti);
    // intruders: names NOT matching this theme (seeded, capped scan for speed)
    var intruders = shuffled(POOL, 900 + round * 13 + ti).filter(function (n) { return th.pool.indexOf(n) < 0; }).slice(0, 120);
    for (var a = 0; a < trioSrc.length - 2 && !made; a++)
      for (var b = a + 1; b < trioSrc.length - 1 && !made; b++)
        for (var c = b + 1; c < trioSrc.length && !made; c++) {
          var trio = [trioSrc[a], trioSrc[b], trioSrc[c]];
          for (var k = 0; k < intruders.length && !made; k++) {
            var odd = intruders[k], S = trio.concat([odd]);
            var sig = S.slice().sort().join("|");
            if (sigSeen[sig]) continue;
            if (!isUnique(S, odd)) continue;
            sigSeen[sig] = 1;
            rounds.push({ names: shuffled(S, 5 + rounds.length * 3), odd: odd, theme: th.theme, axis: th.type });
            bump(th); made = true;
          }
        }
  }
  barren = made ? 0 : barren + 1;
}

if (rounds.length < 40) { console.error("ERROR: only produced " + rounds.length + " rounds"); process.exit(1); }

// --- Emit oddones.js --------------------------------------------------------
var lines = ["/* AUTO-GENERATED by build_oddoneout.js — do not edit by hand. Rounds for Odd One Out. */",
             "window.ODDONES = ["];
rounds.forEach(function (r) { lines.push("  " + JSON.stringify(r) + ","); });
lines.push("];");
fs.writeFileSync("oddones.js", lines.join("\n") + "\n");

console.log("Wrote oddones.js — " + rounds.length + " rounds");
var mix = {}; Object.keys(use).forEach(function (k) { var t = k.split("|")[0]; mix[t] = (mix[t] || 0) + use[k]; });
console.log("Axis mix:", JSON.stringify(mix));
console.log("Sample:");
rounds.slice(0, 6).forEach(function (r, i) { console.log("  #" + (i + 1) + " [" + r.axis + "] 3 " + r.theme + " — odd: " + r.odd + "  {" + r.names.join(", ") + "}"); });
