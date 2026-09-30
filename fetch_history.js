/*
 * Downloads every completed EuroLeague season from the league's public data
 * feed into history_raw/ — run `node fetch_history.js`.
 *
 * One snapshot per season (history_raw/E2005.json = 2005-06), trimmed to what
 * the games use: each player's person record (name, height, birth date,
 * country), his club, shirt number, position and games played. Completed seasons are
 * FROZEN: a snapshot on disk is never fetched again unless you pass
 * `--refresh E2005` (or `--refresh all`). build_history.js turns the snapshots
 * into history.js; history_raw/MANIFEST.json holds each snapshot's hash so
 * test.js can tell if a frozen season ever changes.
 *
 * The current season is NOT fetched here: it stays our own approved data
 * (players.js). The last completed season is LAST_SEASON below — move it on at
 * the end of each season, then run this.
 *
 * Source: api-live.euroleague.net (the feed behind euroleaguebasketball.net).
 * Two requests per season, two seconds apart.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FIRST_SEASON = 2000;             // E2000 = 2000-01, the first season of today's EuroLeague
const LAST_SEASON = 2025;              // E2025 = 2025-26, the last completed season
const DIR = path.join(__dirname, "history_raw");
const API = "https://api-live.euroleague.net";
const UA = { headers: { "User-Agent": "EuroballResearch/1.0 (euroballgames.com)" } };

const args = process.argv.slice(2);
const ri = args.indexOf("--refresh");
const refresh = ri >= 0 ? (args[ri + 1] || "") : "";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJSON(url) {
  for (let tries = 0; tries < 4; tries++) {
    await sleep(2000 * (tries + 1));
    const r = await fetch(url, UA);
    const t = await r.text();
    if (r.ok && t.charAt(0) === "{") return JSON.parse(t);
    console.log("  retry " + (tries + 1) + " (HTTP " + r.status + ") " + url);
  }
  throw new Error("feed unavailable: " + url);
}
function day(d) { return d && d.slice(0, 4) !== "0001" ? d.slice(0, 10) : null; }

async function season(y) {
  const code = "E" + y;
  const people = await getJSON(API + "/v2/competitions/E/seasons/" + code + "/people?personType=J&limit=2000");
  const stats = await getJSON(API + "/v3/competitions/E/statistics/players/traditional?seasonMode=Single&seasonCode=" + code + "&statisticMode=accumulated&limit=2000");
  const gp = {};
  // A player who moved mid-season has ONE stats row for both clubs ("OLY;IST",
  // games combined): each club he's listed under gets the count. It's only used
  // to tell "played" from "registered, never played".
  (stats.players || []).forEach(s => {
    String((s.player.team || {}).code || "").split(";").forEach(tc => {
      const k = s.player.code + "|" + tc.trim();
      gp[k] = (gp[k] || 0) + (s.gamesPlayed || 0);
    });
  });
  const clubs = {}, rows = [];
  (people.data || []).forEach(m => {
    const p = m.person, c = m.club || {};
    clubs[c.code] = { code: c.code, name: c.name, alias: c.abbreviatedName || "", editorial: c.editorialName || "" };
    rows.push({
      code: p.code, name: p.name, height: p.height || null, birth: day(p.birthDate),
      country: (p.country || {}).name || null, birthCountry: (p.birthCountry || {}).name || null,
      club: c.code, dorsal: m.dorsal || "", position: m.positionName || "",
      from: day(m.startDate), to: day(m.endDate),
      games: gp[p.code + "|" + c.code] || 0
    });
  });
  rows.sort((a, b) => a.club < b.club ? -1 : a.club > b.club ? 1 : (a.name < b.name ? -1 : 1));
  return { season: code, label: y + "-" + String(y + 1).slice(2), clubs: Object.values(clubs).sort((a, b) => a.code < b.code ? -1 : 1), players: rows };
}

(async () => {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
  for (let y = FIRST_SEASON; y <= LAST_SEASON; y++) {
    const code = "E" + y, file = path.join(DIR, code + ".json");
    if (fs.existsSync(file) && refresh !== "all" && refresh !== code) continue;
    process.stdout.write(code + "… ");
    const s = await season(y);
    fs.writeFileSync(file, JSON.stringify(s, null, 0) + "\n");
    console.log(s.clubs.length + " clubs, " + s.players.length + " players, " + s.players.filter(p => p.games > 0).length + " with a game");
  }
  const manifest = {};
  fs.readdirSync(DIR).filter(f => /^E\d{4}\.json$/.test(f)).sort().forEach(f => {
    // hashed with line endings normalised: a CRLF checkout (core.autocrlf) must not look like a change
    manifest[f] = crypto.createHash("sha256").update(fs.readFileSync(path.join(DIR, f), "utf8").replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
  });
  fs.writeFileSync(path.join(DIR, "MANIFEST.json"), JSON.stringify(manifest, null, 1) + "\n");
  console.log("manifest: " + Object.keys(manifest).length + " frozen seasons");
})();
