/* Club pages: /clubs/ and one page per 2026-27 EuroLeague and EuroCup club.
 *
 * WHY. Every game page is the app, so its words are mostly the app's own, the
 * same on every page. These pages are the opposite: reference pages about one
 * club each (its roster, its legends, its Final Four fives and every career in
 * the database that passed through it), which is what people search for at the
 * start of a season ("real madrid roster 2026-27").
 *
 * WHERE THE WORDS COME FROM. Only from the game data: players.js,
 * eurocup_players.js, legends.js, careers.js, eurocup_careers.js and
 * lineups.js. Nothing here is written by hand about a club (no arena, no
 * founding year, no trophy count), because nothing here could check it. Every
 * sentence is a count or a list the data already vouches for, and changes when
 * the data does. The only hand-kept facts are the three COUNTRY fixes below.
 *
 * GENERATED FILES. Never hand-edit the output: re-run `node build_clubs.js`
 * after the data changes (a roster update, new careers). test.js fails if the
 * pages have drifted from the data.
 */
"use strict";
var fs = require("fs");
var path = require("path");
var info = require("./build_info.js");
var esc = info.esc;

var ROOT = __dirname;
var ORIGIN = info.ORIGIN;
var SEASON = "2026-27";
var SEASON_TXT = "2026–27";

function load() {
  var w = {};
  ["players.js", "legends.js", "careers.js", "lineups.js", "clubs.js", "eurocup_players.js", "eurocup_careers.js"].forEach(function (f) {
    new Function("window", fs.readFileSync(path.join(ROOT, f), "utf8"))(w);
  });
  return w;
}
var W = load();

/* The Final Fours the lineup archive covers. 2020 was never played; any other
 * missing year is a gap in the archive, and the pages say so rather than
 * count a club's Final Fours from an incomplete list. */
var F4_SEASONS = {};
W.LINEUPS.forEach(function (l) { F4_SEASONS[l.season] = true; });
var F4_FIRST = Math.min.apply(null, Object.keys(F4_SEASONS).map(Number));
var F4_LAST = Math.max.apply(null, Object.keys(F4_SEASONS).map(Number));
var F4_GAPS = [];
for (var y = F4_FIRST; y <= F4_LAST; y++) if (!F4_SEASONS[y] && y !== 2020) F4_GAPS.push(y);

/* The game data files Serbia's two clubs and Dubai under "ABA League", because
 * in the games "same country" means "same league" (it lights Mystery Player's
 * yellow). A page about the club should say where it is. */
var COUNTRY = { "Crvena Zvezda": "Serbia", "Partizan": "Serbia", "Dubai BC": "United Arab Emirates" };

/* Career lines use whatever name each source used. clubs.js folds them: the
 * sponsor eras the games need (Tau Ceramica = Baskonia), plus the older names of
 * a few EuroCup sides that matter only here (CLUBS.PAGE_ALIAS). The same file
 * gives the slug, so a page's address and the games' links to it are one
 * definition (CLUBS.page), not two that could drift. */
function canon(team) { return W.CLUBS.pageName(team); }
var slugify = W.CLUBS.slug;

/* The crest, on a light plate so a black crest still reads in night mode.
 * crests/<slug>.webp is 128x128 (see crests/SOURCES.json for where each came
 * from). A club without a file gets its initials instead of a broken image. */
function crest(c, up, size, alt) {
  var file = "crests/" + c.slug + ".webp";
  if (!fs.existsSync(path.join(ROOT, file))) {
    var ini = c.name.split(/[\s-]+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 3).toUpperCase();
    return '<span class="plate' + (size > 64 ? " big" : "") + '" aria-hidden="true"><span class="ini">' + esc(ini) + "</span></span>";
  }
  return '<span class="plate' + (size > 64 ? " big" : "") + '"><img src="' + up + file + '" width="' + size + '" height="' + size + '" alt="' + esc(alt || "") + '"' +
    (size > 64 ? "" : ' loading="lazy"') + ' decoding="async"></span>';
}
var CREST_NOTE = '<p class="muted">Club crests belong to their clubs and are shown only to identify them.</p>';

// The clubs: the EuroLeague's 20 (a club counts if it has a roster) and the EuroCup's 32.
var CLUBS = [];
Object.keys(W.TEAMS).forEach(function (t) {
  var roster = W.PLAYERS.filter(function (p) { return p.team === t; });
  if (roster.length) CLUBS.push({ name: t, comp: "euroleague", country: COUNTRY[t] || W.TEAMS[t].country, roster: roster });
});
Object.keys(W.EUROCUP_TEAMS).forEach(function (t) {
  var roster = W.EUROCUP_PLAYERS.filter(function (p) { return p.team === t; });
  if (roster.length) CLUBS.push({ name: t, comp: "eurocup", country: COUNTRY[t] || W.EUROCUP_TEAMS[t].country, roster: roster });
});
CLUBS.forEach(function (c) { c.slug = slugify(c.name); c.path = "clubs/" + c.slug + "/"; });
var BY_CANON = {};
CLUBS.forEach(function (c) { BY_CANON[canon(c.name)] = c; });

// Where everyone is now: a 2026-27 roster place, EuroLeague first.
var NOW = {};
W.EUROCUP_PLAYERS.forEach(function (p) { NOW[p.name] = p.team; });
W.PLAYERS.forEach(function (p) { NOW[p.name] = p.team; });

// One career per player. Twenty-odd players are in both files; keep the fuller line.
var CAREER = {};
W.CAREERS.concat(W.EUROCUP_CAREERS).forEach(function (c) {
  if (!CAREER[c.name] || c.career.length > CAREER[c.name].career.length) CAREER[c.name] = c;
});

function compName(comp) { return comp === "eurocup" ? "EuroCup" : "EuroLeague"; }
function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
function listWords(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
function years(stints) {
  return stints.map(function (s) {
    var to = s.to == null ? "" : s.to;
    return s.to === s.from ? String(s.from) : s.from + "–" + to;
  }).join(", ");
}
function clubLink(team, up) {
  var c = BY_CANON[canon(team)];
  return c ? '<a href="' + up + c.path + '">' + esc(c.name) + "</a>" : esc(team);
}
function posShort(p) { return { Guard: "G", Forward: "F", Center: "C" }[p] || p; }

/* Everything a page says about a club, worked out once, so the prose, the lists
 * and the description can never disagree about a number. */
function facts(c) {
  var key = canon(c.name);
  var roster = c.roster.slice().sort(function (a, b) { return a.number - b.number || a.name.localeCompare(b.name); });
  var nats = {};
  roster.forEach(function (p) { nats[p.nationality] = (nats[p.nationality] || 0) + 1; });
  var natList = Object.keys(nats).sort(function (a, b) { return nats[b] - nats[a] || a.localeCompare(b); });
  var home = nats[c.country] || 0;
  var avgH = Math.round(roster.reduce(function (s, p) { return s + p.height; }, 0) / roster.length);
  var tallest = roster.slice().sort(function (a, b) { return b.height - a.height || a.name.localeCompare(b.name); })[0];
  var youngest = roster.slice().sort(function (a, b) { return b.birthYear - a.birthYear || a.name.localeCompare(b.name); })[0];
  var oldest = roster.slice().sort(function (a, b) { return a.birthYear - b.birthYear || a.name.localeCompare(b.name); })[0];

  // Every career line in the database with a stint here.
  var here = [];
  Object.keys(CAREER).forEach(function (n) {
    var st = CAREER[n].career.filter(function (s) { return canon(s.team) === key; });
    if (st.length) here.push({ name: n, stints: st, career: CAREER[n] });
  });
  var onRoster = {};
  roster.forEach(function (p) { onRoster[p.name] = true; });
  // Back for another spell: on this roster, with an earlier stint here that ended.
  var returning = here.filter(function (h) {
    return onRoster[h.name] && h.stints.some(function (s) { return s.to != null; });
  }).map(function (h) { return h.name; }).sort();
  var former = here.filter(function (h) { return !onRoster[h.name]; }).sort(function (a, b) {
    var la = a.stints[a.stints.length - 1], lb = b.stints[b.stints.length - 1];
    return (lb.to || 9999) - (la.to || 9999) || lb.from - la.from || a.name.localeCompare(b.name);
  });
  var legends = W.LEGENDS.filter(function (l) { return canon(l.team) === key; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  var filed = {};
  legends.forEach(function (l) { filed[l.name] = true; });
  former = former.filter(function (h) { return !filed[h.name]; });
  var f4 = W.LINEUPS.filter(function (l) { return canon(l.team) === key; }).sort(function (a, b) { return b.season - a.season; });
  var titles = f4.filter(function (l) { return l.champion; });
  var neighbours = CLUBS.filter(function (o) { return o !== c && o.country === c.country; });
  return { roster: roster, nats: nats, natList: natList, home: home, avgH: avgH, tallest: tallest, youngest: youngest,
           oldest: oldest, former: former, returning: returning, legends: legends, f4: f4, titles: titles, neighbours: neighbours };
}

function lede(c, f) {
  var s = c.name + " play the " + SEASON_TXT + " " + compName(c.comp) + " with a " + f.roster.length + "-man squad from " +
    plural(f.natList.length, "country", "countries");
  s += f.home ? ", " + f.home + " of them from " + c.country + "." : ", none of them from " + c.country + ".";
  var more = [];
  var gone = f.former.length + f.legends.length;
  if (gone) more.push(plural(gone, "former player") + (gone === 1 ? " whose career we follow" : " whose careers we follow"));
  if (f.f4.length) more.push(plural(f.f4.length, "Final Four starting five", "Final Four starting fives"));
  if (more.length) s += " Below: the full roster, then " + listWords(more) + ".";
  return s;
}

function describe(c, f) {
  var d = c.name + " " + SEASON_TXT + " roster: all " + f.roster.length + " players with number, position, nationality and height";
  var more = [];
  if (f.f4.length) more.push("Final Four starting fives");
  if (f.former.length + f.legends.length) more.push(plural(f.former.length + f.legends.length, "former player"));
  return d + (more.length ? ", plus " + listWords(more) : "") + ". " + compName(c.comp) + ", " + c.country + ".";
}

function titleFor(c, f) {
  var tail = f.f4.length ? "Final Fours and former players" : "former players";
  return c.name + " roster " + SEASON + ": players, " + tail + " | Euroball";
}

function body(c, f, up) {
  var comp = compName(c.comp), ec = c.comp === "eurocup" ? "eurocup/" : "", out = [];
  out.push('<p class="crumbs"><a href="' + up + 'clubs/">Clubs</a> · ' + comp + " · " + esc(c.country) + "</p>");
  out.push('<p class="lede">' + esc(lede(c, f)) + "</p>");

  out.push("<h2>" + esc(c.name) + ' roster <span class="nw">' + SEASON_TXT + "</span></h2>");
  out.push('<table class="box">');
  out.push('  <thead><tr><th>#</th><th>Player</th><th>Pos</th><th class="wide">Nationality</th><th>Height</th><th class="wide">Born</th></tr></thead>');
  out.push("  <tbody>");
  f.roster.forEach(function (p) {
    out.push('    <tr><td class="n">' + p.number + "</td><td>" + esc(p.name) + '</td><td title="' + p.position + '">' + posShort(p.position) +
      '</td><td class="wide">' + esc(p.nationality) + '</td><td class="opt">' + p.height + ' cm</td><td class="wide">' + p.birthYear + "</td></tr>");
  });
  out.push("  </tbody>");
  out.push("</table>");

  out.push("<h2>The squad in numbers</h2>");
  out.push('<ul class="facts">');
  out.push("  <li><b>" + f.roster.length + "</b><span>players</span></li>");
  out.push("  <li><b>" + f.natList.length + "</b><span>" + (f.natList.length === 1 ? "nationality" : "nationalities") + "</span></li>");
  out.push("  <li><b>" + f.home + "</b><span>from " + esc(c.country) + "</span></li>");
  out.push("  <li><b>" + f.avgH + " cm</b><span>average height</span></li>");
  out.push("</ul>");
  var bits = [];
  bits.push("The tallest is " + esc(f.tallest.name) + " at " + f.tallest.height + " cm.");
  bits.push(f.youngest.name === f.oldest.name ? "" :
    "The youngest is " + esc(f.youngest.name) + " (born " + f.youngest.birthYear + ") and the most experienced " + esc(f.oldest.name) + " (born " + f.oldest.birthYear + ").");
  var top = f.natList.filter(function (n) { return n !== c.country; }).slice(0, 3).map(function (n) { return esc(n) + " (" + f.nats[n] + ")"; });
  if (top.length) bits.push("Beyond " + esc(c.country) + ", the squad draws most on " + listWords(top) + ".");
  if (f.returning.length) bits.push(listWords(f.returning.map(esc)) + (f.returning.length === 1 ? " is" : " are") + " back for another spell at the club.");
  out.push("<p>" + bits.filter(Boolean).join(" ") + "</p>");

  if (f.f4.length) {
    out.push("<h2>Final Four starting fives</h2>");
    out.push("<p>The Complete the Five archive holds " + plural(f.f4.length, "Final Four starting five", "Final Four starting fives") + " for " + esc(c.name) +
      (f.titles.length ? ", " + (f.titles.length === 1 ? "one of them a title winner (" + f.titles[0].season + ")" : f.titles.length + " of them title winners (" + listWords(f.titles.map(function (t) { return String(t.season); }).reverse()) + ")") : "") +
      ". It covers the Final Fours of " + F4_FIRST + " to " + F4_LAST + " (2020 was cancelled" + (F4_GAPS.length ? "; " + listWords(F4_GAPS.map(String)) + (F4_GAPS.length === 1 ? " isn't" : " aren't") + " in the archive yet" : "") + ").</p>");
    f.f4.forEach(function (l) {
      out.push("<h3>" + l.season + (l.champion ? " · champions 🏆" : "") + "</h3>");
      out.push('<ul class="five">' + l.five.map(function (p) { return '<li><span class="pos">' + p.pos + "</span> " + esc(p.name) + "</li>"; }).join("") + "</ul>");
    });
    out.push('<p>Can you name them with one missing? That is <a href="' + up + 'complete-the-five/">Complete the Five</a>.</p>');
  }

  if (f.legends.length) {
    out.push("<h2>Non-active players filed under " + esc(c.name) + "</h2>");
    out.push("<p>Players no longer on a EuroLeague roster whom the games file under " + esc(c.name) + ", usually the club they are best known for. From all-time greats to last season's departures, they are the answers in the Non-active modes.</p>");
    out.push('<ul class="cols">');
    f.legends.forEach(function (l) {
      var cr = CAREER[l.name], st = cr ? cr.career.filter(function (s) { return canon(s.team) === canon(c.name); }) : [];
      out.push("  <li>" + esc(l.name) + ' <span class="yrs">' + esc(l.nationality) + " · " + l.position + (st.length ? " · " + years(st) : "") + (NOW[l.name] ? " · now " + clubLink(NOW[l.name], up) : "") + "</span></li>");
    });
    out.push("</ul>");
  }

  if (f.former.length) {
    out.push("<h2>" + (f.legends.length ? "More former players" : "Former players") + "</h2>");
    out.push("<p>Every " + (f.legends.length ? "other " : "") + "career in the Euroball database that passed through " + esc(c.name) + ", most recent first, with the years at the club" +
      " and, for those still playing in the EuroLeague or EuroCup, where they are now.</p>");
    out.push('<ul class="cols">');
    f.former.forEach(function (h) {
      var now = NOW[h.name];
      out.push("  <li>" + esc(h.name) + ' <span class="yrs">' + years(h.stints) + (now ? " · now " + clubLink(now, up) : "") + "</span></li>");
    });
    out.push("</ul>");
  }

  out.push("<h2>Play " + esc(c.name) + " in the games</h2>");
  out.push("<ul>");
  out.push('  <li><a href="' + up + ec + 'roster-master/">Roster Master</a>: pick ' + esc(c.name) + " and name all " + f.roster.length + " players from memory.</li>");
  out.push('  <li><a href="' + up + ec + 'mystery-player/">Mystery Player</a>: any of them could be today\'s answer. A green club square means this club.</li>');
  out.push('  <li><a href="' + up + ec + 'the-grid/">The Grid</a> and <a href="' + up + ec + 'path-between/">Path Between</a>: the careers above are what they are built from.</li>');
  out.push("</ul>");

  if (f.neighbours.length) {
    out.push("<h2>More clubs from " + esc(c.country) + "</h2>");
    out.push("<p>" + f.neighbours.map(function (o) { return '<a href="' + up + o.path + '">' + esc(o.name) + "</a> (" + compName(o.comp) + ")"; }).join(" · ") + "</p>");
  }
  out.push('<p class="muted">Rosters are as of the start of the ' + SEASON_TXT + " season, checked against the official " + comp +
    ' rosters; transfers since then are not reflected. Spotted a mistake? <a href="' + up + 'contact/">Send a correction</a>.</p>');
  return out;
}

function buildClub(c) {
  var f = facts(c), up = "../../";
  var team = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: c.name,
    sport: "Basketball",
    url: ORIGIN + "/" + c.path,
    location: { "@type": "Country", name: c.country },
    memberOf: { "@type": "SportsOrganization", name: compName(c.comp) },
    athlete: f.roster.map(function (p) { return { "@type": "Person", name: p.name }; })
  };
  return info.renderDoc({
    path: c.path, by: "build_clubs.js", title: titleFor(c, f), desc: describe(c, f),
    ogTitle: c.name + " roster " + SEASON_TXT + " — Euroball", h1: c.name,
    crumbs: [["Clubs", "clubs/"], [c.name, c.path]], ld: [team], body: body(c, f, up).concat([CREST_NOTE]),
    pre: '<p class="crest-head">' + crest(c, up, 96, c.name + " crest") + "</p>"
  });
}

function buildHub() {
  var up = "../", out = [];
  var el = CLUBS.filter(function (c) { return c.comp === "euroleague"; }), ec = CLUBS.filter(function (c) { return c.comp === "eurocup"; });
  var players = CLUBS.reduce(function (s, c) { return s + c.roster.length; }, 0);
  out.push('<p class="lede">Every club in the ' + SEASON_TXT + " EuroLeague and EuroCup, " + CLUBS.length + " in all, with " + players +
    " players between them. Each page has the full roster, the squad in numbers, and every former player in the Euroball database; the EuroLeague's big names add their Final Four starting fives.</p>");
  [[el, "EuroLeague", ""], [ec, "EuroCup", "eurocup/"]].forEach(function (g) {
    out.push("<h2>" + g[1] + " " + SEASON_TXT + " · " + g[0].length + " clubs</h2>");
    // One grid of squares per competition, A to Z. The country is on each
    // club's own page; grouping by it here only made the list longer.
    out.push('<ul class="tiles">');
    g[0].slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (c) {
      out.push('  <li><a class="clubtile" href="' + up + c.path + '">' + crest(c, up, 64) +
        '<span class="ct-name">' + esc(c.name) + '</span><span class="ct-meta">' + c.roster.length + " players</span></a></li>");
    });
    out.push("</ul>");
    out.push('<p>Test yourself on them: <a href="' + up + g[2] + 'roster-master/">Roster Master</a> asks you to name a whole ' + g[1] + " roster from memory.</p>");
  });
  out.push(CREST_NOTE);
  var list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "EuroLeague and EuroCup clubs " + SEASON_TXT,
    numberOfItems: CLUBS.length,
    itemListElement: CLUBS.map(function (c, i) { return { "@type": "ListItem", position: i + 1, name: c.name, url: ORIGIN + "/" + c.path }; })
  };
  return info.renderDoc({
    path: "clubs/", by: "build_clubs.js",
    title: "EuroLeague and EuroCup rosters " + SEASON + ": all " + CLUBS.length + " clubs | Euroball",
    desc: "Every " + SEASON_TXT + " EuroLeague and EuroCup roster in one place: " + CLUBS.length + " clubs and " + players +
      " players, with Final Four starting fives and former players.",
    ogTitle: "Every " + SEASON_TXT + " EuroLeague and EuroCup roster — Euroball", h1: "The clubs",
    crumbs: [["Clubs", "clubs/"]], ld: [list], body: out
  });
}

function main() {
  var dir = path.join(ROOT, "clubs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "index.html"), buildHub());
  CLUBS.forEach(function (c) {
    var d = path.join(ROOT, c.path);
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, "index.html"), buildClub(c));
  });
  // A club that left both competitions leaves its old directory behind; say so
  // rather than deleting it, so a removal is always a decision.
  var stale = fs.readdirSync(dir).filter(function (n) {
    return fs.statSync(path.join(dir, n)).isDirectory() && !CLUBS.some(function (c) { return c.slug === n; });
  });
  if (stale.length) console.warn("! no longer a club, remove by hand (and from the sitemap): clubs/" + stale.join("/, clubs/") + "/");
  console.log("build_clubs: wrote clubs/ and " + CLUBS.length + " club pages");
}

module.exports = { CLUBS: CLUBS, buildClub: buildClub, buildHub: buildHub, facts: facts, canon: canon, slugify: slugify };
if (require.main === module) main();
