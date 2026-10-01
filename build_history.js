/*
 * Builds history.js (window.HISTORY) from the frozen feed snapshots in
 * history_raw/ — run `node build_history.js` after fetch_history.js.
 *
 * WHAT IT HOLDS: every completed EuroLeague season since 2000-01, as club-season
 * boards (who was on each roster, with his shirt number), over one shared list
 * of people. THE ROSTER RULE (the owner's): a player who played at least one
 * EuroLeague game anywhere counts for every official roster he was on, 0 minutes
 * there included; someone registered who never played a EuroLeague game is out.
 *
 * It also writes history_stints.json: EuroLeague club-seasons our hand-built
 * careers are missing, as "stint" (fits the career's empty years) or "also" (inside
 * another club's years: a mid-season move or a loan). build_careers.js adds them.
 * The current season is NOT here: it stays players.js, our approved data.
 *
 * HOW IT JOINS OUR DATA: a person the feed knows is matched to our database by
 * name (accents, dots and case ignored). Where our spelling differs, the answer
 * lives in history_decisions.json, which this script reads on every run, so a
 * question is only ever asked once:
 *   aliases   { feedCode: "Our Name" }   same person, use our name
 *   notSame   [ feedCode, … ]            looks like ours, but isn't
 *   names     { feedCode: "Display" }    fix the feed's spelling
 * Our NATIONALITY_OVERRIDES (via players.js / legends.js) beat the feed's country.
 *
 * WHAT IT REPORTS: history_report.md — only the things a person must decide.
 * Nothing loads history.js yet (step 0 of the expansion): no game changes.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const RAW = path.join(__dirname, "history_raw");

// --- feed club → our club name --------------------------------------------------
// Most clubs match our names on their own (through clubs.js); these are the ones
// that don't. Eldo Napoli (2006-07) is the old Basket Napoli, folded in 2008 —
// NOT today's Napoli Basketball.
const CLUB_MAP = {
  FOR: "Fortitudo Bologna", FRA: "Skyliners Frankfurt", LON: "London Towers", LUG: "Lugano",
  OVA: "Ovarense", PET: "Saint Petersburg Lions", VER: "Scaligera Verona", IST: "Anadolu Efes",
  OOS: "Oostende", PEM: "Ural Great Perm", TEL: "Maccabi Tel Aviv", WRO: "Slask Wroclaw",
  MIL: "Olimpia Milano", STR: "SIG Strasbourg", COL: "Koln 99ers", NAP: "Basket Napoli",
  BIL: "Bilbao Basket", CTU: "Pallacanestro Cantu", ZAG: "KK Zagreb", MUN: "Bayern Munich",
  NIK: "Budivelnyk Kyiv", TIV: "Lokomotiv Kuban", SAS: "Dinamo Sassari", ZGO: "Turow Zgorzelec",
  DYR: "Zenit Saint Petersburg", DUB: "Dubai BC"
};

// The feed files two clubs under ULK: Ulkerspor (2000-2006, its own Istanbul club)
// and Fenerbahce Ulker (from 2006). The season's name tells them apart.
const CLUB_BY_NAME = { "Ulker": "Ulkerspor" };

global.window = {};
["clubs.js", "players.js", "legends.js", "careers.js", "lineups.js", "eurocup_players.js", "eurocup_careers.js"].forEach(f => eval(fs.readFileSync(path.join(__dirname, f), "utf8")));
const canon = window.CLUBS.canonical;
// Our clubs: every club in our careers (EuroLeague + EuroCup), the current teams and the Final Four clubs.
const KNOWN = new Set();
[].concat(window.CAREERS, window.EUROCUP_CAREERS || []).forEach(c => c.career.forEach(e => KNOWN.add(canon(e.team))));
Object.keys(window.TEAMS).forEach(t => KNOWN.add(canon(t))); window.LINEUPS.forEach(l => KNOWN.add(canon(l.team)));
function clubNorm(n) { return String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim(); }
const KNOWN_BY_NORM = {}; KNOWN.forEach(k => { KNOWN_BY_NORM[clubNorm(k)] = k; });
const UNMAPPED = {};
function clubFor(c) {
  if (CLUB_BY_NAME[c.name]) return CLUB_BY_NAME[c.name];
  if (CLUB_MAP[c.code]) return CLUB_MAP[c.code];
  for (const n of [c.name, c.editorial, c.alias]) {
    if (!n) continue;
    const k = canon(n); if (KNOWN.has(k)) return k;
    const nn = clubNorm(n);
    if (KNOWN_BY_NORM[nn]) return KNOWN_BY_NORM[nn];
  }
  if (BY_CODE[c.code]) return BY_CODE[c.code];     // the same club under a season name we can't read
  UNMAPPED[c.code] = c.name;                       // reported, never guessed
  return c.name;
}
// First pass: a club code resolved in ANY season holds for all its seasons (the
// feed calls Zalgiris "Zalgiris Kaunas" one year and "Zalgiris" the next).
const BY_CODE = {};
fs.readdirSync(RAW).filter(f => /^E\d{4}\.json$/.test(f)).forEach(f => {
  JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8")).clubs.forEach(c => {
    if (CLUB_BY_NAME[c.name] || BY_CODE[c.code]) return;
    const saved = Object.assign({}, UNMAPPED), r = clubFor(c);
    if (!UNMAPPED[c.code] || saved[c.code]) BY_CODE[c.code] = r;
    Object.keys(UNMAPPED).forEach(k => { if (!saved[k]) delete UNMAPPED[k]; });
  });
});
const DEC = fs.existsSync(path.join(__dirname, "history_decisions.json"))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, "history_decisions.json"), "utf8")) : {};
const ALIASES = DEC.aliases || {}, NOT_SAME = new Set(DEC.notSame || []), NAMES = DEC.names || {};

function norm(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’.]/g, "")
    .replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim().replace(/ (jr|sr|ii|iii|iv)$/, "");
}
// "DE COLO, NANDO" → "Nando de Colo"
function display(feed) {
  const i = feed.indexOf(",");
  let first = i < 0 ? "" : feed.slice(i + 1).trim(), last = i < 0 ? feed.trim() : feed.slice(0, i).trim();
  // "JR" / "J.R." / "CJ" → "J.R." — but only known initial pairs: Ed Cota, Ty Lawson, Mo Soluade, Oz Blayzer
  const INITIALS = { AJ: 1, BJ: 1, CJ: 1, DJ: 1, JJ: 1, JP: 1, JR: 1, KC: 1, KJ: 1, PJ: 1, RJ: 1, TJ: 1 };
  let initials = /^([A-Z])\.?([A-Z])\.?$/.exec(first);
  if (initials && !INITIALS[initials[1] + initials[2]] && first.indexOf(".") < 0) initials = null;
  const tc = s => s.toLowerCase().replace(/(^|[\s\-.])([a-zà-ɏ])/g, (m, a, b) => a + b.toUpperCase())
    .replace(/\b([a-z])['’]([a-zà-ɏ])/gi, (m, a, b) => a.toUpperCase() + "'" + b.toUpperCase())   // O'Connor, D'Alessio — not Amar'e
    .replace(/['’]$/, "")                                                     // "D'INCA'" → D'Inca
    .replace(/\bMc([a-z])/g, (m, a) => "Mc" + a.toUpperCase()).replace(/\b(Iii|Ii|Iv)\b/g, m => m.toUpperCase()).replace(/\bJr\b\.?/g, "Jr.");
  let out = ((initials ? initials[1] + "." + initials[2] + "." : tc(first)) + " " + tc(last)).trim();
  out = out.replace(/\b(De|Da|Del|Della|Di|Van|Von|Der|Den|La|Le|Dos|Das)\b(?= \S)/g, (m, w, off) => off === 0 ? m : w.toLowerCase());
  return out.replace(/^([A-Z])([A-Z])\b/, "$1.$2.");        // "JR Holden" → "J.R. Holden"
}

// --- our people -----------------------------------------------------------------
const OURS = {};                                   // norm name → our record
[].concat(window.PLAYERS, window.LEGENDS).forEach(p => { if (!OURS[norm(p.name)]) OURS[norm(p.name)] = p; });
const OUR_CAREER = {}; window.CAREERS.forEach(c => { OUR_CAREER[c.name] = c; });

// --- read every frozen season -----------------------------------------------------
const files = fs.readdirSync(RAW).filter(f => /^E\d{4}\.json$/.test(f)).sort();
const seasons = [], people = {}, boards = [], clubNames = {};
const EVER_PLAYED = {};
files.forEach(f => JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8")).players.forEach(p => { if (p.games) EVER_PLAYED[p.code] = 1; }));
files.forEach((f, si) => {
  const s = JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8"));
  seasons.push(s.label);
  const byClub = {};
  s.clubs.forEach(c => {
    const ours = clubFor(c);
    clubNames[c.code] = clubNames[c.code] || { ours, seen: {} };
    clubNames[c.code].seen[c.name] = 1;
    byClub[c.code] = { s: si, club: ours, name: c.name, code: c.code, players: [] };
  });
  s.players.forEach(p => {
    // The owner's rule: a player who played at least one EuroLeague game ANYWHERE counts for
    // every roster he was on, 0 minutes there included. Registered-only, never played: out.
    if (!EVER_PLAYED[p.code]) return;
    // A player released and re-signed in one season is listed once per contract
    // (Quino Colom: three UNICS rows in 2016-17), each with the season's games. One spot.
    if (byClub[p.club].players.some(x => x.code === p.code)) return;
    const P = people[p.code] = people[p.code] || { code: p.code, feed: p.name, height: p.height, birth: p.birth, country: p.country, pos: {}, seasons: [], clubs: {}, spots: [] };
    P.pos[p.position] = (P.pos[p.position] || 0) + p.games + 0.01;
    P.seasons.push(si); P.clubs[byClub[p.club].club] = 1;
    P.spots.push({ y: +s.label.slice(0, 4), club: byClub[p.club].club, games: p.games });
    if (!P.height && p.height) P.height = p.height;
    if (!P.birth && p.birth) P.birth = p.birth;
    byClub[p.club].players.push({ code: p.code, dorsal: p.dorsal, games: p.games });
  });
  Object.values(byClub).forEach(b => { if (b.players.length) boards.push(b); });
});

// --- identity: feed person → our person (or a new one) ----------------------------
const report = { unmatchedOurs: [], collisions: [], oddNames: [], contradictions: [], autoAliases: [], confirm: [], sameNameNotSame: [] };
const all = Object.values(people);
const yearOf = P => P.birth ? +P.birth.slice(0, 4) : null;
all.forEach(P => {
  const d = display(P.feed);
  P.display = NAMES[P.code] || d;
  if (ALIASES[P.code]) { P.ours = ALIASES[P.code]; return; }
  const o = NOT_SAME.has(P.code) ? null : OURS[norm(P.display)];
  if (!o) return;
  // one name, two people: a father and son, or two Derrick Alston Jr.s — the birth year decides
  if (o.birthYear && yearOf(P) && Math.abs(o.birthYear - yearOf(P)) > 1) { report.sameNameNotSame.push(P.display + " (b. " + yearOf(P) + ") is not our " + o.name + " (b. " + o.birthYear + ")"); return; }
  P.ours = o.name;
});
// which clubs were in the EuroLeague which season (canonical club | season start year)
const CLUB_SEASON = new Set();
boards.forEach(b => { CLUB_SEASON.add(canon(b.club) + "|" + (+seasons[b.s].slice(0, 4))); });
// Our players the feed should know (a stint at a feed club in a covered season) but no match was found:
// look for a same-surname candidate on that club in those seasons; confirm it automatically when the
// birth year agrees, otherwise ask.
const matched = new Set(all.filter(P => P.ours).map(P => P.ours));
const bySurname = {}; all.forEach(P => { const sn = norm(P.display).split(" ").pop(); (bySurname[sn] = bySurname[sn] || []).push(P); });
const firstSeason = +seasons[0].slice(0, 4), lastSeason = +seasons[seasons.length - 1].slice(0, 4);
[].concat(window.PLAYERS, window.LEGENDS).forEach(o => {
  if (matched.has(o.name)) return;
  const c = OUR_CAREER[o.name];
  // covered = he was at a club in a season that club played in the EuroLeague (from 2020 = 2020-21)
  const covered = c && c.career.some(e => {
    const end = e.to == null ? 9999 : Math.max(e.to, e.from + 1);
    for (let y = Math.max(e.from, firstSeason); y < end && y <= lastSeason; y++) if (CLUB_SEASON.has(canon(e.team) + "|" + y)) return true;
    return false;
  });
  if (!covered) return;                              // pre-2000, or his clubs weren't in the EuroLeague those years
  const sn = norm(o.name).split(" ").pop();
  const cands = (bySurname[sn] || []).filter(P => !P.ours && Object.keys(P.clubs).some(cl => c.career.some(e => canon(e.team) === canon(cl))));
  const byYear = cands.filter(P => P.birth && o.birthYear && +P.birth.slice(0, 4) === o.birthYear);
  if (byYear.length === 1) {
    const P = byYear[0];
    // same surname + club + birth year is strong, but not proof: John Brown III is not Anthony Brown.
    // Same first initial → take it; a different one (Sasha = Alexandros, Iffe = Gabriel) → ask once.
    if (norm(P.display)[0] === norm(o.name)[0]) { P.ours = o.name; matched.add(o.name); report.autoAliases.push(P.display + " = " + o.name); }
    else report.confirm.push({ code: P.code, feed: P.display, ours: o.name, why: "b. " + o.birthYear + ", " + Object.keys(P.clubs).join("/") });
    return;
  }
  const near = cands.filter(P => !(o.birthYear && yearOf(P) && Math.abs(o.birthYear - yearOf(P)) > 1));
  if (!near.length && cands.length) return;          // only namesakes a generation apart: he simply isn't in the feed
  report.unmatchedOurs.push({ ours: o.name, team: o.team, born: o.birthYear, candidates: near.map(P => P.code + " " + P.display + " (b. " + (P.birth || "?").slice(0, 4) + ", " + Object.keys(P.clubs).join("/") + ")") });
});
// the name each person is shown under; different people with one name get their birth year
// (an exact-spelling clash: "John Brown" and "John Brown III" are already told apart)
const same = n => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const byName = {}; all.forEach(P => { P.name = P.ours || P.display; (byName[same(P.name)] = byName[same(P.name)] || []).push(P); });
Object.values(byName).filter(g => g.length > 1).forEach(g => {
  report.collisions.push(g.map(P => P.name + " (b. " + (P.birth || "?").slice(0, 4) + ", " + Object.keys(P.clubs).join("/") + ")").join("  ≠  "));
  g.forEach(P => { if (!P.ours) P.name = P.name + " (b. " + (P.birth || "?").slice(0, 4) + ")"; });
});
// a new name only needs a look when the automatic casing may have guessed wrong
const NAMES_OK = new Set(DEC.namesOk || []);      // checked by a person and right as they are
all.filter(P => !P.ours && !NAMES[P.code] && !NAMES_OK.has(P.code)).forEach(P => {
  if (/[A-Z]{2}|\b[a-z]{2,}\b.*\b[a-z]{2,}\b|'|’|\bMac|\bVan |\bDe |\bDi |\bLe |\bSaint|\./.test(P.name.replace(/\b(de|da|del|della|di|van|von|der|den|la|le|dos|das)\b/g, "")))
    report.oddNames.push(P.code + " " + P.feed + " → " + P.name);
});
// our careers vs the feed: a EuroLeague season at a club our career doesn't have at all
all.filter(P => P.ours && OUR_CAREER[P.ours]).forEach(P => {
  const ours = new Set(OUR_CAREER[P.ours].career.map(e => canon(e.team)));
  Object.keys(P.clubs).forEach(cl => { if (!ours.has(canon(cl))) report.contradictions.push(P.ours + ": the feed has him at " + cl + ", his career doesn't"); });
});

// --- write history.js (compact: people once, boards point at them by index) ------
const order = all.slice().sort((a, b) => a.name < b.name ? -1 : 1);
const idx = {}; order.forEach((P, i) => { idx[P.code] = i; });
const ourProfile = n => [].concat(window.PLAYERS, window.LEGENDS).find(p => p.name === n);
const PEOPLE = order.map(P => {
  const o = P.ours ? ourProfile(P.ours) : null;
  const pos = Object.keys(P.pos).sort((a, b) => P.pos[b] - P.pos[a])[0] || "";
  return [P.name, o ? o.nationality : P.country, o ? o.position : pos, o ? o.height : P.height, o ? o.birthYear : (P.birth ? +P.birth.slice(0, 4) : null), o ? 1 : 0];
});
const BOARDS = boards.map(b => [b.s, b.club, b.name, b.players.map(p => [idx[p.code], p.dorsal === "" ? null : +p.dorsal]), b.code]);
const out = "/* AUTO-GENERATED by build_history.js from history_raw/ (the EuroLeague's public feed) — do not edit by hand.\n" +
  " * Every completed EuroLeague season since 2000-01: club-season rosters over one list of people.\n" +
  " * people[i] = [name, nationality, position, height, birthYear, inOurDatabase]; boards[j] = [season, club, seasonName, [[person, number]…], feedClubCode] */\n" +
  "window.HISTORY = " + JSON.stringify({ seasons: seasons, people: PEOPLE, boards: BOARDS }) + ";\n";
// `node build_history.js --check` (run by test.js): rebuild in memory, compare, write nothing.
if (process.argv.indexOf("--check") >= 0) {
  const cur = fs.existsSync(path.join(__dirname, "history.js")) ? fs.readFileSync(path.join(__dirname, "history.js"), "utf8").replace(/\r\n/g, "\n") : "";
  if (cur !== out) { console.log("history.js is stale — run `node build_history.js`"); process.exit(1); }
  console.log("history.js is current"); process.exit(0);
}
fs.writeFileSync(path.join(__dirname, "history.js"), out);

// --- the report: only what a person must decide -----------------------------------
const L = [];
L.push("# History import — what needs a decision", "",
  "Generated by `node build_history.js`. " + seasons.length + " seasons (" + seasons[0] + " to " + seasons[seasons.length - 1] + "), " +
  order.length + " players with at least one game, " + boards.length + " club-season rosters. " +
  order.filter(P => P.ours).length + " of them are already in our database.", "",
  "Answers go in `history_decisions.json`; the next build reads them, so nothing is asked twice.", "");
L.push("## 0. Clubs the script could not map (" + Object.keys(UNMAPPED).length + ")", "", "Each needs a line in CLUB_MAP (build_history.js).", "");
Object.keys(UNMAPPED).forEach(k => L.push("- " + k + " " + UNMAPPED[k]));
L.push("");
L.push("## 1a. Same person? (different first name, same surname, club and birth year) (" + report.confirm.length + ")", "",
  "Yes → add `\"code\": \"Our Name\"` to `aliases`. No → add the code to `notSame`.", "");
report.confirm.forEach(c => L.push("- `" + c.code + "` **" + c.feed + "** = our **" + c.ours + "**? (" + c.why + ")"));
L.push("");
L.push("## 1. Our players the feed should know, but no match was found (" + report.unmatchedOurs.length + ")", "",
  "For each: is one of the candidates the same person? (→ `aliases`) Or is he genuinely not in the feed?", "");
report.unmatchedOurs.forEach(u => L.push("- **" + u.ours + "** (" + u.team + ", b. " + u.born + ")" + (u.candidates.length ? ": " + u.candidates.join("; ") : ": no candidate")));
L.push("", "## 2. Our careers vs the feed (" + report.contradictions.length + ")", "",
  "The feed has the player on this club's EuroLeague roster (with games played), but his career in careers.js never mentions the club. Usually a missing stint, sometimes a wrong match.", "");
report.contradictions.forEach(c => L.push("- " + c));
L.push("", "## 3. Names the automatic casing may have got wrong (" + report.oddNames.length + ")", "", "Correct ones need nothing; wrong ones go in `names`.", "");
report.oddNames.forEach(n => L.push("- " + n));
L.push("", "## For information only", "", "### Matched automatically by birth year + club (" + report.autoAliases.length + ")", "");
report.autoAliases.forEach(a => L.push("- " + a));
L.push("", "### Same name as one of ours, but a different person (birth years apart) (" + report.sameNameNotSame.length + ")", "");
report.sameNameNotSame.forEach(a => L.push("- " + a));
L.push("", "### Different people with the same name, shown with their birth year (" + report.collisions.length + ")", "");
report.collisions.forEach(c => L.push("- " + c));
fs.writeFileSync(path.join(__dirname, "history_report.md"), L.join("\n") + "\n");

const gz = require("zlib").gzipSync(out).length;
console.log("history.js: " + order.length + " players, " + boards.length + " boards, " + (out.length / 1024).toFixed(0) + " KB (" + (gz / 1024).toFixed(0) + " KB gzipped)");
console.log("report: " + report.unmatchedOurs.length + " unmatched, " + report.contradictions.length + " career contradictions, " + report.oddNames.length + " odd names, " +
  report.autoAliases.length + " auto-matched, " + report.collisions.length + " name collisions");

// --- career gaps: EuroLeague club-seasons our hand-built careers don't have ----------
// (owner's decision: add them all). A gap in years the career leaves empty slots
// straight into the timeline; one inside another club's years (a mid-season move, a
// loan) can't be ordered, so it's kept as "also on the roster of".
if (process.argv.indexOf("--check") < 0) {
  const gaps = {};
  // careers.js already carries the stints this wrote last time (build_careers merges
  // them in), so they're taken back out first: the gaps are always measured against
  // the hand-built career, and a second run finds the same ones instead of dropping them.
  const STINTS_FILE = path.join(__dirname, "history_stints.json");
  const prev = fs.existsSync(STINTS_FILE) ? JSON.parse(fs.readFileSync(STINTS_FILE, "utf8")) : {};
  const fromUs = (n, e) => (prev[n] || []).some(g => g.kind === "stint" && g.team === e.team && g.from === e.from && g.to === e.to);
  all.filter(P => P.ours && OUR_CAREER[P.ours]).forEach(P => {
    const c = OUR_CAREER[P.ours].career.filter(e => !fromUs(P.ours, e));
    const covers = (e, y) => { const end = e.to == null ? 9999 : Math.max(e.to, e.from + 1); return y >= e.from && y < end; };
    const byClub = {};
    P.spots.forEach(sp => {
      if (c.some(e => canon(e.team) === canon(sp.club))) return;   // the club is in his career already
      (byClub[sp.club] = byClub[sp.club] || []).push(sp.y);
    });
    Object.keys(byClub).forEach(club => {
      const ys = byClub[club].sort((a, b) => a - b);
      // consecutive seasons make one stint
      const runs = []; ys.forEach(y => { const r = runs[runs.length - 1]; if (r && y === r.to) r.to = y + 1; else runs.push({ from: y, to: y + 1 }); });
      runs.forEach(r => {
        const inside = c.some(e => { for (let y = r.from; y < r.to; y++) if (covers(e, y)) return true; return false; });
        (gaps[P.ours] = gaps[P.ours] || []).push({ team: club, from: r.from, to: r.to, kind: inside ? "also" : "stint" });
      });
    });
  });
  fs.writeFileSync(path.join(__dirname, "history_stints.json"), JSON.stringify(gaps, null, 1) + "\n");
  const flat = [].concat(...Object.keys(gaps).map(n => gaps[n].map(g => Object.assign({ name: n }, g))));
  console.log("career gaps: " + flat.length + " (" + flat.filter(g => g.kind === "stint").length + " slot into the timeline, " + flat.filter(g => g.kind === "also").length + " overlap another club)");
}
