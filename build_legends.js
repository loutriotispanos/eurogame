/*
 * Build script: consolidates retired EuroLeague LEGENDS (researched from
 * Wikipedia, euroleaguebasketball.net, club sites, FIBA) into legends.js.
 *
 * Run:  node build_legends.js
 *
 * Dedupes cross-group duplicates (first occurrence wins, in A..E order),
 * drops known alias duplicates, applies a couple of verified jersey-number
 * corrections, derives the club->country map (adds historic clubs like CSKA
 * Moscow), and writes legends.js (window.LEGENDS + TEAMS additions).
 */
const fs = require("fs");

// Names to drop entirely (alias duplicate of another entry kept under proper name).
const EXCLUDE_NAMES = { "Sasha Danilovic": true };       // = Predrag Danilovic (kept)

// Verified jersey-number corrections applied after dedupe.
const NUMBER_OVERRIDES = { "Trajan Langdon": 21 };       // CSKA #21 (one source returned 0)

const raw = [];

// --- Group A: Greek / Greek-club legends ---
raw.push([{"name":"Dimitris Diamantidis","team":"Panathinaikos","teamCountry":"Greece","nationality":"Greece","position":"Guard","height":196,"birthYear":1980,"number":13},{"name":"Vassilis Spanoulis","team":"Olympiacos","teamCountry":"Greece","nationality":"Greece","position":"Guard","height":193,"birthYear":1982,"number":7},{"name":"Theodoros Papaloukas","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Greece","position":"Guard","height":201,"birthYear":1977,"number":44},{"name":"Fragiskos Alvertis","team":"Panathinaikos","teamCountry":"Greece","nationality":"Greece","position":"Forward","height":205,"birthYear":1974,"number":4},{"name":"Antonis Fotsis","team":"Panathinaikos","teamCountry":"Greece","nationality":"Greece","position":"Forward","height":209,"birthYear":1981,"number":9},{"name":"Georgios Printezis","team":"Olympiacos","teamCountry":"Greece","nationality":"Greece","position":"Forward","height":205,"birthYear":1985,"number":15},{"name":"Ioannis Bourousis","team":"Real Madrid","teamCountry":"Spain","nationality":"Greece","position":"Center","height":215,"birthYear":1983,"number":30},{"name":"Nikos Zisis","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Greece","position":"Guard","height":197,"birthYear":1983,"number":6},{"name":"Sofoklis Schortsanitis","team":"Maccabi Tel Aviv","teamCountry":"Israel","nationality":"Greece","position":"Center","height":208,"birthYear":1985,"number":21},{"name":"Kostas Tsartsaris","team":"Panathinaikos","teamCountry":"Greece","nationality":"Greece","position":"Forward","height":210,"birthYear":1979,"number":12},{"name":"Mike Batiste","team":"Panathinaikos","teamCountry":"Greece","nationality":"USA","position":"Forward","height":203,"birthYear":1977,"number":8}]);

// --- Group B: Spanish / Iberian-club legends ---
raw.push([{"name":"Juan Carlos Navarro","team":"FC Barcelona","teamCountry":"Spain","nationality":"Spain","position":"Guard","height":193,"birthYear":1980,"number":11},{"name":"Felipe Reyes","team":"Real Madrid","teamCountry":"Spain","nationality":"Spain","position":"Forward","height":206,"birthYear":1980,"number":9},{"name":"Rudy Fernandez","team":"Real Madrid","teamCountry":"Spain","nationality":"Spain","position":"Guard","height":196,"birthYear":1985,"number":5},{"name":"Jorge Garbajosa","team":"Baskonia","teamCountry":"Spain","nationality":"Spain","position":"Forward","height":207,"birthYear":1977,"number":15},{"name":"Roberto Duenas","team":"FC Barcelona","teamCountry":"Spain","nationality":"Spain","position":"Center","height":221,"birthYear":1975,"number":0},{"name":"Luis Scola","team":"Baskonia","teamCountry":"Spain","nationality":"Argentina","position":"Forward","height":206,"birthYear":1980,"number":4},{"name":"Tiago Splitter","team":"Baskonia","teamCountry":"Spain","nationality":"Brazil","position":"Center","height":211,"birthYear":1985,"number":21},{"name":"Fabricio Oberto","team":"Baskonia","teamCountry":"Spain","nationality":"Argentina","position":"Center","height":208,"birthYear":1975,"number":0},{"name":"Sergio Rodriguez","team":"Real Madrid","teamCountry":"Spain","nationality":"Spain","position":"Guard","height":191,"birthYear":1986,"number":13},{"name":"Pau Gasol","team":"FC Barcelona","teamCountry":"Spain","nationality":"Spain","position":"Center","height":213,"birthYear":1980,"number":16}]);

// --- Group C: Italian / French-club / USA-import legends ---
raw.push([{"name":"Manu Ginobili","team":"Virtus Bologna","teamCountry":"Italy","nationality":"Argentina","position":"Guard","height":198,"birthYear":1977,"number":6},{"name":"Antoine Rigaudeau","team":"Virtus Bologna","teamCountry":"Italy","nationality":"France","position":"Guard","height":199,"birthYear":1971,"number":14},{"name":"Marco Belinelli","team":"Virtus Bologna","teamCountry":"Italy","nationality":"Italy","position":"Guard","height":196,"birthYear":1986,"number":3},{"name":"Gianluca Basile","team":"FC Barcelona","teamCountry":"Spain","nationality":"Italy","position":"Guard","height":192,"birthYear":1975,"number":5},{"name":"David Andersen","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Australia","position":"Center","height":211,"birthYear":1980,"number":13},{"name":"Mike Batiste","team":"Panathinaikos","teamCountry":"Greece","nationality":"USA","position":"Forward","height":204,"birthYear":1977,"number":8},{"name":"Drew Nicholas","team":"Panathinaikos","teamCountry":"Greece","nationality":"USA","position":"Guard","height":193,"birthYear":1981,"number":11},{"name":"Lynn Greer","team":"Olympiacos","teamCountry":"Greece","nationality":"USA","position":"Guard","height":185,"birthYear":1979,"number":11},{"name":"Anthony Parker","team":"Maccabi Tel Aviv","teamCountry":"Israel","nationality":"USA","position":"Guard","height":198,"birthYear":1975,"number":8},{"name":"Marcus Brown","team":"Maccabi Tel Aviv","teamCountry":"Israel","nationality":"USA","position":"Guard","height":191,"birthYear":1974,"number":0},{"name":"Trajan Langdon","team":"CSKA Moscow","teamCountry":"Russia","nationality":"USA","position":"Guard","height":193,"birthYear":1976,"number":0},{"name":"Sasha Danilovic","team":"Virtus Bologna","teamCountry":"Italy","nationality":"Serbia","position":"Guard","height":196,"birthYear":1970,"number":5}]);

// --- Group D: Balkan legends ---
raw.push([{"name":"Dejan Bodiroga","team":"Panathinaikos","teamCountry":"Greece","nationality":"Serbia","position":"Forward","height":205,"birthYear":1973,"number":10},{"name":"Aleksandar Djordjevic","team":"Partizan","teamCountry":"Serbia","nationality":"Serbia","position":"Guard","height":188,"birthYear":1967,"number":5},{"name":"Igor Rakocevic","team":"Baskonia","teamCountry":"Spain","nationality":"Serbia","position":"Guard","height":194,"birthYear":1978,"number":8},{"name":"Dejan Tomasevic","team":"Panathinaikos","teamCountry":"Greece","nationality":"Serbia","position":"Center","height":208,"birthYear":1973,"number":15},{"name":"Milos Teodosic","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Serbia","position":"Guard","height":196,"birthYear":1987,"number":4},{"name":"Nikola Vujcic","team":"Maccabi Tel Aviv","teamCountry":"Israel","nationality":"Croatia","position":"Center","height":211,"birthYear":1978,"number":7},{"name":"Nenad Krstic","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Serbia","position":"Center","height":213,"birthYear":1983,"number":12},{"name":"Jaka Lakovic","team":"Panathinaikos","teamCountry":"Greece","nationality":"Slovenia","position":"Guard","height":186,"birthYear":1978,"number":5},{"name":"Bo McCalebb","team":"Montepaschi Siena","teamCountry":"Italy","nationality":"USA","position":"Guard","height":183,"birthYear":1985,"number":4},{"name":"Sani Becirovic","team":"Panathinaikos","teamCountry":"Greece","nationality":"Slovenia","position":"Guard","height":196,"birthYear":1981,"number":7},{"name":"Predrag Danilovic","team":"Virtus Bologna","teamCountry":"Italy","nationality":"Serbia","position":"Guard","height":196,"birthYear":1970,"number":5},{"name":"Marko Jaric","team":"Virtus Bologna","teamCountry":"Italy","nationality":"Serbia","position":"Guard","height":201,"birthYear":1978,"number":19}]);

// --- Group E: Lithuanian / Russian-CSKA / Turkish / Israeli legends ---
raw.push([{"name":"Sarunas Jasikevicius","team":"Maccabi Tel Aviv","teamCountry":"Israel","nationality":"Lithuania","position":"Guard","height":194,"birthYear":1976,"number":13},{"name":"Ramunas Siskauskas","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Lithuania","position":"Forward","height":198,"birthYear":1978,"number":8},{"name":"Arvydas Sabonis","team":"Zalgiris Kaunas","teamCountry":"Lithuania","nationality":"Lithuania","position":"Center","height":221,"birthYear":1964,"number":11},{"name":"J.R. Holden","team":"CSKA Moscow","teamCountry":"Russia","nationality":"USA","position":"Guard","height":185,"birthYear":1976,"number":10},{"name":"Trajan Langdon","team":"CSKA Moscow","teamCountry":"Russia","nationality":"USA","position":"Guard","height":193,"birthYear":1976,"number":21},{"name":"Andrei Kirilenko","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Russia","position":"Forward","height":206,"birthYear":1981,"number":47},{"name":"Viktor Khryapa","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Russia","position":"Forward","height":206,"birthYear":1982,"number":31},{"name":"Mirsad Turkcan","team":"Fenerbahce","teamCountry":"Turkey","nationality":"Turkey","position":"Forward","height":206,"birthYear":1976,"number":6},{"name":"Ibrahim Kutluay","team":"Panathinaikos","teamCountry":"Greece","nationality":"Turkey","position":"Guard","height":198,"birthYear":1974,"number":12},{"name":"Oded Kattash","team":"Maccabi Tel Aviv","teamCountry":"Israel","nationality":"Israel","position":"Guard","height":194,"birthYear":1974,"number":0},{"name":"Theodoros Papaloukas","team":"CSKA Moscow","teamCountry":"Russia","nationality":"Greece","position":"Guard","height":200,"birthYear":1977,"number":7},{"name":"Dejan Bodiroga","team":"FC Barcelona","teamCountry":"Spain","nationality":"Serbia","position":"Forward","height":205,"birthYear":1973,"number":8}]);

// --- Group F: fill out under-represented active clubs (researched 2026; USA used for nationality to match the DB) ---
raw.push([
  {"name":"Petar Naumoski","team":"Anadolu Efes","teamCountry":"Turkey","nationality":"North Macedonia","position":"Guard","height":195,"birthYear":1968,"number":7},
  {"name":"Ufuk Sarica","team":"Anadolu Efes","teamCountry":"Turkey","nationality":"Turkey","position":"Guard","height":194,"birthYear":1972,"number":15},
  {"name":"Huseyin Besok","team":"Anadolu Efes","teamCountry":"Turkey","nationality":"Turkey","position":"Center","height":211,"birthYear":1975,"number":12},
  {"name":"Mehmet Okur","team":"Anadolu Efes","teamCountry":"Turkey","nationality":"Turkey","position":"Forward","height":211,"birthYear":1979,"number":13},
  {"name":"Omer Onan","team":"Fenerbahce","teamCountry":"Turkey","nationality":"Turkey","position":"Guard","height":194,"birthYear":1978,"number":7},
  {"name":"Bobby Dixon","team":"Fenerbahce","teamCountry":"Turkey","nationality":"USA","position":"Guard","height":178,"birthYear":1983,"number":35},
  {"name":"Semih Erden","team":"Fenerbahce","teamCountry":"Turkey","nationality":"Turkey","position":"Center","height":211,"birthYear":1986,"number":9},
  {"name":"Roko Ukic","team":"Fenerbahce","teamCountry":"Turkey","nationality":"Croatia","position":"Guard","height":196,"birthYear":1984,"number":4},
  {"name":"Branko Lazic","team":"Crvena Zvezda","teamCountry":"Serbia","nationality":"Serbia","position":"Guard","height":195,"birthYear":1989,"number":10},
  {"name":"Marko Keselj","team":"Crvena Zvezda","teamCountry":"Serbia","nationality":"Serbia","position":"Forward","height":208,"birthYear":1988,"number":4},
  {"name":"Stefan Markovic","team":"Crvena Zvezda","teamCountry":"Serbia","nationality":"Serbia","position":"Guard","height":197,"birthYear":1988,"number":27},
  {"name":"Zoran Slavnic","team":"Crvena Zvezda","teamCountry":"Serbia","nationality":"Serbia","position":"Guard","height":180,"birthYear":1949,"number":15},
  {"name":"Zarko Paspalj","team":"Partizan","teamCountry":"Serbia","nationality":"Serbia","position":"Forward","height":207,"birthYear":1966,"number":14},
  {"name":"Predrag Drobnjak","team":"Partizan","teamCountry":"Serbia","nationality":"Montenegro","position":"Center","height":211,"birthYear":1975,"number":18},
  {"name":"Dusan Kecman","team":"Partizan","teamCountry":"Serbia","nationality":"Serbia","position":"Guard","height":197,"birthYear":1977,"number":7},
  {"name":"Mike D'Antoni","team":"Olimpia Milano","teamCountry":"Italy","nationality":"USA","position":"Guard","height":191,"birthYear":1951,"number":8},
  {"name":"Dino Meneghin","team":"Olimpia Milano","teamCountry":"Italy","nationality":"Italy","position":"Center","height":206,"birthYear":1950,"number":11},
  {"name":"Antonello Riva","team":"Olimpia Milano","teamCountry":"Italy","nationality":"Italy","position":"Forward","height":196,"birthYear":1962,"number":12},
  {"name":"Bob McAdoo","team":"Olimpia Milano","teamCountry":"Italy","nationality":"USA","position":"Center","height":206,"birthYear":1951,"number":15},
  {"name":"Demond Greene","team":"Bayern Munich","teamCountry":"Germany","nationality":"Germany","position":"Guard","height":185,"birthYear":1979,"number":24},
  {"name":"Steffen Hamann","team":"Bayern Munich","teamCountry":"Germany","nationality":"Germany","position":"Guard","height":194,"birthYear":1981,"number":6},
  {"name":"Malcolm Delaney","team":"Bayern Munich","teamCountry":"Germany","nationality":"USA","position":"Guard","height":191,"birthYear":1989,"number":23},
  {"name":"Victor Luengo","team":"Valencia","teamCountry":"Spain","nationality":"Spain","position":"Forward","height":196,"birthYear":1974,"number":15},
  {"name":"Nacho Rodilla","team":"Valencia","teamCountry":"Spain","nationality":"Spain","position":"Guard","height":192,"birthYear":1974,"number":11},
  {"name":"Rafa Martinez","team":"Valencia","teamCountry":"Spain","nationality":"Spain","position":"Guard","height":190,"birthYear":1982,"number":17},
  {"name":"Matthew Nielsen","team":"Valencia","teamCountry":"Spain","nationality":"Australia","position":"Forward","height":208,"birthYear":1978,"number":44},
  {"name":"Alain Gilles","team":"ASVEL","teamCountry":"France","nationality":"France","position":"Guard","height":188,"birthYear":1945,"number":4},
  {"name":"Delaney Rudd","team":"ASVEL","teamCountry":"France","nationality":"USA","position":"Guard","height":188,"birthYear":1962,"number":4},
  {"name":"Amara Sy","team":"ASVEL","teamCountry":"France","nationality":"France","position":"Forward","height":202,"birthYear":1981,"number":5},
  {"name":"Sergii Gladyr","team":"AS Monaco","teamCountry":"France","nationality":"Ukraine","position":"Guard","height":196,"birthYear":1988,"number":8},
  {"name":"Ali Traore","team":"AS Monaco","teamCountry":"France","nationality":"France","position":"Center","height":208,"birthYear":1985,"number":24},
  {"name":"Tyus Edney","team":"Zalgiris Kaunas","teamCountry":"Lithuania","nationality":"USA","position":"Guard","height":178,"birthYear":1973,"number":4},
  {"name":"Saulius Stombergas","team":"Zalgiris Kaunas","teamCountry":"Lithuania","nationality":"Lithuania","position":"Forward","height":204,"birthYear":1973,"number":7},
  {"name":"Eurelijus Zukauskas","team":"Zalgiris Kaunas","teamCountry":"Lithuania","nationality":"Lithuania","position":"Center","height":218,"birthYear":1973,"number":11},
  {"name":"Raviv Limonad","team":"Hapoel Tel Aviv","teamCountry":"Israel","nationality":"Israel","position":"Guard","height":191,"birthYear":1984,"number":6}
]);

// --- Consolidate -----------------------------------------------------------
const all = raw.flat();

const seen = new Map();
const dropped = [];
for (const p of all) {
  if (EXCLUDE_NAMES[p.name]) { dropped.push(p.name + " (alias excluded)"); continue; }
  const key = p.name.toLowerCase();
  if (seen.has(key)) { dropped.push(p.name + " (" + p.team + " dup of " + seen.get(key).team + ")"); continue; }
  seen.set(key, p);
}

let legends = [...seen.values()];

// Verified number corrections.
for (const p of legends) if (NUMBER_OVERRIDES[p.name] != null) p.number = NUMBER_OVERRIDES[p.name];

// Club -> country map from the data (so historic clubs like CSKA Moscow exist).
const LEGEND_TEAMS = {};
for (const p of legends) if (p.teamCountry) LEGEND_TEAMS[p.team] = { country: p.teamCountry };

// Sort by team then number for a tidy file; strip teamCountry from player rows.
legends.sort(function (a, b) { return a.team.localeCompare(b.team) || (a.number - b.number); });
const rows = legends.map(function (p) {
  return { name: p.name, team: p.team, nationality: p.nationality,
           position: p.position, height: p.height, birthYear: p.birthYear, number: p.number };
});

// --- Emit legends.js -------------------------------------------------------
const out = [];
out.push("/*");
out.push(" * Retired EuroLeague legends database (auto-generated by build_legends.js).");
out.push(" * Team = the club each legend is most iconic for; nationality = where they're from");
out.push(" * (birthplace), matching the active-roster convention. Loaded after players.js;");
out.push(" * it also registers any historic clubs (e.g. CSKA Moscow) in window.TEAMS.");
out.push(" */");
out.push("");
out.push("window.LEGENDS = [");
let cur = null;
for (const p of rows) {
  if (p.team !== cur) { cur = p.team; out.push("  // --- " + cur + " ---"); }
  out.push("  " + JSON.stringify(p) + ",");
}
out.push("];");
out.push("");
out.push("// Register clubs used by legends without overwriting current-team entries.");
out.push("(function () {");
out.push("  var add = " + JSON.stringify(LEGEND_TEAMS, null, 2).replace(/\n/g, "\n  ") + ";");
out.push("  window.TEAMS = window.TEAMS || {};");
out.push("  for (var k in add) if (!window.TEAMS[k]) window.TEAMS[k] = add[k];");
out.push("})();");
out.push("");

fs.writeFileSync("legends.js", out.join("\n"));

console.log("Wrote legends.js");
console.log("  Legends:", rows.length, "| Clubs referenced:", Object.keys(LEGEND_TEAMS).length);
console.log("  Dropped (" + dropped.length + "):", dropped.join(", "));
console.log("  Number overrides:", JSON.stringify(NUMBER_OVERRIDES));
