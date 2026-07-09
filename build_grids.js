/*
 * Generates grids.js (window.GRIDS) for The Grid — run `node build_grids.js`.
 *
 * Each puzzle = 3 row criteria + 3 col criteria; every one of the 9 cells must
 * be answerable. Rows are always clubs; columns mix clubs / nationalities /
 * positions (recipes rotate so puzzles vary).
 *
 * IMPORTANT: this loads the REAL thegrid.js and generates through its exposed
 * _fits/_answers/_universe hooks, so the generator and the game share ONE
 * definition of "played for club X" — they can never disagree.
 *
 * Guarantees per cell:
 *   - club × club  ≥ MIN_CC known answers
 *   - club × nat   ≥ MIN_CN known answers
 *   - club × pos   ≥ MIN_CP known answers
 *   - the whole board has a perfect matching of 9 DISTINCT players
 *     (each player may only be used once, so "9 answerable cells" alone
 *     isn't enough — the same guy must not be the only answer to two cells).
 */
"use strict";
const fs = require("fs");

// --- Minimal browser stubs so the data files + thegrid.js load ---------------
global.window = {
  addEventListener: function () {},
  localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} }
};
global.document = {
  readyState: "complete",
  addEventListener: function () {},
  getElementById: function () { return null; },
  createElement: function () { return {}; },
  querySelector: function () { return null; }
};
eval(fs.readFileSync("players.js", "utf8"));
eval(fs.readFileSync("legends.js", "utf8"));
eval(fs.readFileSync("careers.js", "utf8"));
eval(fs.readFileSync("lineups.js", "utf8"));
window.GRIDS = [];                       // not built yet — thegrid.js only needs the data
eval(fs.readFileSync("thegrid.js", "utf8"));
const G = window.TheGrid;

// --- Tuning knobs -------------------------------------------------------------
const TARGET = 80;                       // stop once we have this many puzzles
const ATTEMPTS = 400000;                 // hard cap on tries
const MIN_CC = 2, MIN_CN = 2, MIN_CP = 4;
const MAX_USE = 22;                      // per criterion value, keeps variety
const SEED = 20260709;

// Column recipes (rows are always 3 clubs). Rotated per generated puzzle.
const RECIPES = [
  ["club", "nat", "pos"],
  ["club", "club", "nat"],
  ["club", "nat", "nat"],
  ["club", "club", "pos"]
];

// --- Seeded RNG (deterministic output) ----------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);

// --- Candidate criteria --------------------------------------------------------
const U = G._universe();
const clubCount = {}, natCount = {};
for (const name in U) {
  const e = U[name];
  for (const c in e.clubs) clubCount[c] = (clubCount[c] || 0) + 1;
  if (e.nat) natCount[e.nat] = (natCount[e.nat] || 0) + 1;
}
// Criteria use EuroLeague clubs only (window.TEAMS is the league registry), so
// grids stay on-theme — answer players may still carry NBA/other clubs in their
// careers, those just aren't used as row/column headers.
const TEAMS = window.TEAMS || {};
const CLUBS = Object.keys(clubCount).filter(c => TEAMS[c] && clubCount[c] >= 6).sort();
const NATS = Object.keys(natCount).filter(n => natCount[n] >= 6).sort();
const POSITIONS = ["Guard", "Forward", "Center"];
console.log("candidates: " + CLUBS.length + " EuroLeague clubs, " + NATS.length + " nationalities");

const used = {};                          // per criterion value → times used
function useKey(c) { return c.t + ":" + c.v; }
// Uniform pick among under-cap, not-yet-on-this-board values. (A least-used-first
// bias deadlocks here: impossible combos never succeed, so their usage never
// rises, and they hog the front of the queue forever — the same trap
// build_puzzles.js hit. The MAX_USE cap alone spreads variety.)
function pickRandom(list, taken) {
  const open = list.filter(v => !taken[v.t + ":" + v.v] && (used[v.t + ":" + v.v] || 0) < MAX_USE);
  if (!open.length) return null;
  return open[Math.floor(rnd() * open.length)];
}

function minFor(a, b) {
  if (a.t === "club" && b.t === "club") return MIN_CC;
  if (b.t === "pos" || a.t === "pos") return MIN_CP;
  return MIN_CN;
}

// Perfect matching of 9 distinct players onto the 9 cells (backtracking).
function hasDistinctFill(cellAnswers) {
  const order = cellAnswers.map((a, i) => ({ i, a })).sort((x, y) => x.a.length - y.a.length);
  const taken = {};
  function bt(k) {
    if (k === order.length) return true;
    for (const name of order[k].a) {
      if (taken[name]) continue;
      taken[name] = 1;
      if (bt(k + 1)) return true;
      delete taken[name];
    }
    return false;
  }
  return bt(0);
}

// Compatibility precompute: for each possible COLUMN criterion, which row clubs
// pair with it richly enough? Columns are chosen first, rows sampled from the
// intersection of their compat sets — random construction almost never lands a
// valid board otherwise (most club×nat pairs share 0-1 players).
const compat = {};                        // useKey(col) → { rowClub: answerCount }
function compatFor(col) {
  const k = useKey(col);
  if (compat[k]) return compat[k];
  const m = {};
  for (const r of CLUBS) {
    if (col.t === "club" && col.v === r) continue;
    const n = G._answers({ t: "club", v: r }, col).length;
    if (n >= minFor({ t: "club", v: r }, col)) m[r] = n;
  }
  compat[k] = m;
  return m;
}
// Column candidates need a fighting chance: at least 6 compatible row clubs.
const MIN_COMPAT = 6;
const COL_CLUBS = CLUBS.filter(v => Object.keys(compatFor({ t: "club", v })).length >= MIN_COMPAT);
const COL_NATS = NATS.filter(v => Object.keys(compatFor({ t: "nat", v })).length >= MIN_COMPAT);
console.log("column candidates: " + COL_CLUBS.length + " clubs, " + COL_NATS.length + " nationalities (" + COL_NATS.join(", ") + ")");

const puzzles = [], sigs = {};
let attempts = 0;
while (puzzles.length < TARGET && attempts < ATTEMPTS) {
  attempts++;
  const recipe = RECIPES[puzzles.length % RECIPES.length];
  const taken = {};
  // 1) columns first
  const cols = [];
  let bad = false;
  for (const t of recipe) {
    const list = t === "club" ? COL_CLUBS.map(v => ({ t: "club", v }))
      : t === "nat" ? COL_NATS.map(v => ({ t: "nat", v }))
      : POSITIONS.map(v => ({ t: "pos", v }));
    const c = pickRandom(list, taken);
    if (!c) { bad = true; break; }
    taken[useKey(c)] = 1; cols.push(c);
  }
  if (bad) continue;
  // 2) rows = clubs compatible with ALL three columns
  const sets = cols.map(compatFor);
  const eligible = CLUBS.filter(r => !taken["club:" + r] && sets.every(s => s[r]));
  if (eligible.length < 3) continue;
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const c = pickRandom(eligible.map(v => ({ t: "club", v })), taken);
    if (!c) { bad = true; break; }
    taken[useKey(c)] = 1; rows.push(c);
  }
  if (bad) continue;

  // 3) the whole board must be fillable with 9 DISTINCT players
  const cellAnswers = [];
  for (const row of rows) for (const col of cols) cellAnswers.push(G._answers(row, col));
  if (!hasDistinctFill(cellAnswers)) continue;

  const sig = rows.concat(cols).map(useKey).sort().join("|");
  if (sigs[sig]) continue;
  sigs[sig] = 1;
  rows.concat(cols).forEach(c => { used[useKey(c)] = (used[useKey(c)] || 0) + 1; });
  puzzles.push({ rows, cols });
}
console.log("built " + puzzles.length + " grids in " + attempts + " attempts");
if (puzzles.length < 30) { console.error("too few grids — loosen the knobs"); process.exit(1); }

const out = "/* AUTO-GENERATED by build_grids.js — do not edit by hand. Puzzles for The Grid. */\n" +
  "window.GRIDS = [\n" +
  puzzles.map(p => "  " + JSON.stringify(p)).join(",\n") +
  "\n];\n";
fs.writeFileSync("grids.js", out);
console.log("wrote grids.js (" + puzzles.length + " puzzles)");
