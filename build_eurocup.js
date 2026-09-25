/*
 * Builds eurocup_players.js, the EuroCup roster database.
 *
 *   Run:  node build_eurocup.js
 *
 * The EuroCup is Euroball's second competition. Its rosters are kept apart from
 * the EuroLeague's (players.js) because the two are different games' worth of
 * players: the switcher on the hub picks one, and competition.js hands the
 * chosen one to every game as window.PLAYERS / window.TEAMS.
 *
 * TEAMS and PLAYERS below are the source, filled in club by club from the
 * official rosters (same routine as the EuroLeague season update). Records use
 * players.js's shape: name, team, nationality, position (Guard/Forward/Center),
 * height (cm), birthYear, number. Until OPEN is set the EuroCup stays a
 * "coming soon" page and nothing on the site changes.
 *
 * A player the EuroLeague database already has (players.js or legends.js) is
 * listed with just { name, team, number } — his nationality, position, height
 * and birth year are read from there at build time, so a fix to his EuroLeague
 * record reaches the EuroCup too. Give a `position` only to override ours.
 * Players new to Euroball wait in PENDING until they are researched.
 */
const fs = require("fs");

const SEASON = "2026-27";

// Flip to true once every club is in and researched. Until then the EuroCup
// stays the coming-soon page even though this file already has players, so a
// half-built roster can never go live.
const OPEN = false;

// club name → { country }
const TEAMS = {
  "Aris Thessaloniki": { country: "Greece" }
};

// { name, team, number } for a known player, or the full record for a new one
const PLAYERS = [
  // Aris Thessaloniki
  { name: "Vassilis Toliopoulos", team: "Aris Thessaloniki", number: 4 },
  { name: "Neno Dimitrijevic",    team: "Aris Thessaloniki", number: 7 },
  { name: "Stefan Jovic",         team: "Aris Thessaloniki", number: 24 },
  { name: "Matt Morgan",          team: "Aris Thessaloniki", number: 30 },
  { name: "Khem Birch",           team: "Aris Thessaloniki", number: 92 }
];

// New to Euroball: researched in batches once every club is in, then moved to
// PLAYERS as full records. Official position and number from the roster page.
const PENDING = [
  // Aris Thessaloniki
  { name: "Elijah Mitrou-Long",        team: "Aris Thessaloniki", position: "Guard",   number: 0 },
  { name: "Chrysostomos Chatzilamprou", team: "Aris Thessaloniki", position: "Guard",  number: 10 },
  { name: "Stylianos Poulianitis",     team: "Aris Thessaloniki", position: "Guard",   number: 11 },
  { name: "Eleftherios Bochoridis",    team: "Aris Thessaloniki", position: "Guard",   number: 13 },
  { name: "Jeremiah Robinson-Earl",    team: "Aris Thessaloniki", position: "Forward", number: 3 },
  { name: "E.J. Liddell",              team: "Aris Thessaloniki", position: "Forward", number: 32 },
  { name: "Vasilis Charalampopoulos",  team: "Aris Thessaloniki", position: "Forward", number: 33 },
  { name: "Thanasis Antetokounmpo",    team: "Aris Thessaloniki", position: "Forward", number: 43 },
  { name: "Adam Mokoka",               team: "Aris Thessaloniki", position: "Forward", number: 95 },
  { name: "Georgios Tanoulis",         team: "Aris Thessaloniki", position: "Center",  number: 50 }
];

// The EuroLeague records a known player's bio is read from.
function euroleagueRecords() {
  const win = {};
  new Function("window", fs.readFileSync("players.js", "utf8") + ";\n" + fs.readFileSync("legends.js", "utf8"))(win);
  const byName = {};
  (win.LEGENDS || []).concat(win.PLAYERS || []).forEach(function (p) { byName[p.name] = p; });   // active wins a tie
  return byName;
}
const EL = euroleagueRecords();
const problems = [];
const filled = PLAYERS.map(function (p) {
  if (p.nationality) return p;                     // a full record
  const src = EL[p.name];
  if (!src) { problems.push(p.name + ": not in players.js or legends.js, so it needs a full record"); return p; }
  return { name: p.name, team: p.team, nationality: src.nationality, position: p.position || src.position,
           height: src.height, birthYear: src.birthYear, number: p.number };
});

const POSITIONS = { Guard: 1, Forward: 1, Center: 1 };
const seen = {};
filled.forEach(function (p, i) {
  const at = (p && p.name) || "#" + i;
  ["name", "team", "nationality", "position"].forEach(function (k) {
    if (typeof p[k] !== "string" || !p[k]) problems.push(at + ": missing " + k);
  });
  if (!TEAMS[p.team]) problems.push(at + ": club '" + p.team + "' is not in TEAMS");
  if (!POSITIONS[p.position]) problems.push(at + ": position '" + p.position + "' is not Guard/Forward/Center");
  if (!(p.height >= 160 && p.height <= 235)) problems.push(at + ": height " + p.height);
  if (!(p.birthYear >= 1975 && p.birthYear <= 2010)) problems.push(at + ": birthYear " + p.birthYear);
  if (!(p.number >= 0 && p.number <= 99)) problems.push(at + ": number " + p.number);
  if (seen[p.name]) problems.push(at + ": listed twice");
  seen[p.name] = 1;
});
if (problems.length) {
  console.error("eurocup_players.js NOT written:\n  " + problems.join("\n  "));
  process.exit(1);
}

const players = filled.slice().sort(function (a, b) {
  return a.team === b.team ? a.name.localeCompare(b.name) : a.team.localeCompare(b.team);
}).map(function (p) {
  return { name: p.name, team: p.team, nationality: p.nationality, position: p.position,
           height: p.height, birthYear: p.birthYear, number: p.number };
});

const out = "/*\n" +
  " * EuroCup " + SEASON + " player database (auto-generated by build_eurocup.js — do not edit).\n" +
  " * Same record shape as players.js. Until EUROCUP_OPEN is true the EuroCup stays\n" +
  " * a coming-soon page.\n" +
  " */\n\n" +
  "window.EUROCUP_OPEN = " + OPEN + ";\n\n" +
  "window.EUROCUP_TEAMS = " + JSON.stringify(TEAMS, null, 2) + ";\n\n" +
  "window.EUROCUP_PLAYERS = " + JSON.stringify(players, null, 2) + ";\n";
fs.writeFileSync("eurocup_players.js", out);
console.log("eurocup_players.js: " + Object.keys(TEAMS).length + " clubs, " + players.length + " players, " + PENDING.length + " pending research");
