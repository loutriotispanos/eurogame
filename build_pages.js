/* Static per-game pages — the SEO fix.
 *
 * THE PROBLEM THIS SOLVES. Until now the whole site was one document. Eleven
 * games lived at ?game=mystery … ?game=rostermaster, and every one of those URLs
 * served BYTE-IDENTICAL HTML — the games were told apart only by JavaScript that
 * ran after the page loaded. To a crawler that is one thin page presented eleven
 * times, which is why the site ranked for nothing while Sportdle, whose
 * EuroLeague game sits on its own path under ~1,200 words of copy, ranks for
 * "euroleague wordle". Self-canonicalising the query URLs (v70) stopped them
 * competing with each other; it could not give them anything to say.
 *
 * WHAT THIS WRITES. One real directory per game — /mystery-player/index.html and
 * so on — each a complete, immediately playable copy of the app whose <head>,
 * <h1> and prose belong to that game alone. The page plays instantly because it
 * IS the app; nothing is a doorway that bounces you somewhere else.
 *
 * GENERATED FILE — never hand-edit the output. Edit the PAGES table below (the
 * copy) or the transform (the plumbing) and re-run `node build_pages.js`. The
 * shared shell always comes from index.html, so a change to the app reaches all
 * eleven pages on the next run, and test.js fails if they have drifted.
 *
 * WHY THE COPY LIVES HERE rather than in a generated data file like grids.js:
 * it is written, not computed. build_grids.js derives its output from careers.js
 * and could do so again tomorrow; nobody can regenerate a sentence. This table
 * is the source.
 */
"use strict";
var fs = require("fs");
var path = require("path");

var ORIGIN = "https://euroballgames.com";
var ROOT = __dirname;

/* ---------------------------------------------------------------------------
 * THE COPY.
 *
 * view  — the internal view id app.js already uses (unchanged; localStorage
 *         keys, ?game= links and the hub all still speak these).
 * slug  — the directory. Named for the GAME, not the view id, which is why
 *         clubreveal lands at /common-club/: the game was renamed in v76 and the
 *         address a person sees should say what the game is now called.
 * ------------------------------------------------------------------------- */
var PAGES = [
  {
    view: "mystery", slug: "mystery-player", name: "Mystery Player",
    title: "Mystery Player — the daily EuroLeague Wordle | Euroball",
    desc: "Guess the mystery EuroLeague player in 8 tries. Every guess colour-codes club, nationality, position, height, age and jersey number. A new player daily — free, no sign-up.",
    h1: "Mystery Player — the daily EuroLeague Wordle",
    intro: "A Wordle for European basketball. One hidden player from the 2025–26 EuroLeague, eight tries, and a grid that tells you a little more each time. Guess a name and six columns light up at once: club, nationality, position, height, age and shirt number. Nothing is random — every colour narrows the field.",
    how: [
      "Type any EuroLeague player's name and pick him from the list. The row fills in immediately.",
      "Green means an exact match. Yellow means close — a club in the same country, a height within 5&nbsp;cm, an age within 2 years, a number within 3. Grey means no match at all.",
      "On height, age and number an arrow points the way: ↑ says the answer is higher than your guess, ↓ says lower.",
      "You have eight guesses. Solve it and your hub streak survives another day."
    ],
    faq: [
      ["How many guesses do I get?", "Eight. Every guess returns a full row of clues, so a deliberate opening guess — a player from a country and position you want to rule out — is worth more than a wild one."],
      ["What does a yellow square mean?", "Close, but the meaning depends on the column. On club it means a different club in the same country. On height it means within 5&nbsp;cm, on age within 2 years, and on shirt number within 3."],
      ["Which players can be the answer?", "The Daily and Practice draw from the current 2025–26 EuroLeague rosters. Legends mode draws from 173 retired greats instead, and Endless mixes everyone."],
      ["Is there a new one every day?", "Yes. The Daily resets at midnight in your own timezone and is the same player for everyone. Practice, Legends and Endless are unlimited if you want to keep going."]
    ]
  },
  {
    view: "playerid", slug: "player-id", name: "Player ID",
    title: "Player ID — guess the player from his career path | Euroball",
    desc: "A EuroLeague player's whole career laid out club by club, with the years. Name him in two guesses. Daily puzzle plus unlimited practice with active players, retired legends, or both.",
    h1: "Player ID — name the player from his career path",
    intro: "Every club he ever played for, in order, with the years he was there — and nothing else. No stats, no photo, no nationality. Just the route. Two guesses to say whose career you are looking at.",
    how: [
      "Read the path from his first club to his most recent. The countries, the era and the final destination between them tell you most of what you need.",
      "Start typing and pick a name from the list. The list gives names only — no club hints, which would give the game away.",
      "You get two guesses. A near-miss costs the same as a wild one, so read the whole path before committing."
    ],
    faq: [
      ["Why only two guesses?", "Because the career path is a very strong clue once you read it properly. Two guesses keeps it a test of recognition rather than a process of elimination."],
      ["Do NBA years show up in the path?", "Yes. Many European careers pass through the NBA, and those stints appear in the timeline like any other club — often they are the clue that fixes the era for you."],
      ["What is the difference between Active, Retired and Both?", "Active draws only from players on a 2025–26 EuroLeague roster. Retired draws from the legends database. Both mixes them, which is the hardest because the era is no longer a hint."],
      ["How many careers are in the game?", "466 full career timelines, compiled from official club rosters, Wikipedia, FIBA and Proballers, and cross-checked against the official 2025–26 EuroLeague rosters."]
    ]
  },
  {
    view: "completefive", slug: "complete-the-five", name: "Complete the Five",
    title: "Complete the Five — EuroLeague Final Four lineups | Euroball",
    desc: "A real EuroLeague Final Four starting five with one starter hidden. Name him in two guesses, from the club, the season, his position and his four teammates. 56 lineups, 2010–2025.",
    h1: "Complete the Five — name the missing Final Four starter",
    intro: "A real EuroLeague Final Four starting five, set out on a half-court in the positions they played — with one man missing. You get the club, the season, the hole he left, and the four teammates who stood beside him. Name him in two guesses.",
    how: [
      "Look at where the gap is. The position on the floor tells you what kind of player is missing before you have thought about a single name.",
      "The four teammates date the lineup precisely. Once you know the season and the club, the fifth man is usually a memory away.",
      "A 🏆 beside the team means they went on to win the title that year.",
      "Two guesses. Type a name and pick it from the list."
    ],
    faq: [
      ["Which seasons are covered?", "Fourteen seasons of Final Four basketball, 2010 through 2025 — 56 starting fives in all. 2020 is absent because the season was cancelled and no Final Four was played."],
      ["Are these the real starting fives?", "Yes. Every lineup is a genuine Final Four starting five, compiled from official box scores rather than reconstructed from memory."],
      ["What do Easy, Medium and Hard change?", "Who gets hidden. Easy hides the star of the five, the name you would list first. Hard hides the starter only a serious follower of that team would remember."],
      ["Does the Daily count towards my streak?", "Yes. Solving any daily on the site keeps the single hub streak alive — you do not have to play all eleven games to keep it."]
    ]
  },
  {
    view: "connections", slug: "connections", name: "Connections",
    title: "Basketball Connections — daily EuroLeague grouping puzzle | Euroball",
    desc: "Sixteen EuroLeague names hide four groups of four — a roster, a nationality, a Final Four five, a shared jersey number. Find all four in three mistakes. New puzzle daily.",
    h1: "Connections — find the four groups of four",
    intro: "Sixteen names from European basketball, and four hidden groups of four. One might be a club's current roster, one a nationality, one a Final Four starting five, one a shared shirt number. Three mistakes is all you get, and the overlaps are deliberate.",
    how: [
      "Tap up to four names, then Submit. Get the group right and it locks in with its theme revealed.",
      "“One away…” means three of your four belong together and one does not — usually the most obvious of the four.",
      "Colours run easiest to hardest: yellow, then green, then blue, then purple. Each puzzle has exactly one group of each.",
      "Three mistakes and the puzzle reveals itself. Shuffle rearranges the tiles if the board has stopped making sense."
    ],
    faq: [
      ["What kinds of groups appear?", "Eleven category types: a club's current roster, a nationality, all guards or forwards or centers, a Final Four starting five, everyone at one Final Four, a birth decade, club legends, a club's ex-players, a shared jersey number, the 2.10&nbsp;m club, and journeymen."],
      ["Is every puzzle solvable in only one way?", "Yes, and that is enforced rather than assumed. All 94 puzzles are machine-generated and then verified to have exactly one valid solution, with fairness checks that keep every group independently recognisable."],
      ["Why do some names look like they fit two groups?", "Because they genuinely do — a player's nationality, an old club and a shirt number can all be true at once. The single valid solution is what resolves it, and spotting which claim is the decoy is the puzzle."],
      ["Can I play more than one a day?", "Yes. The Daily is the same board for everyone and feeds your streak; Practice serves unlimited random puzzles from the same pool."]
    ]
  },
  {
    view: "careerorder", slug: "career-order", name: "Career Order",
    title: "Career Order — put a EuroLeague career back in order | Euroball",
    desc: "A player's clubs, shuffled. Drag them back into the order he played for them, earliest to latest, in three checks. Daily puzzle plus Easy, Medium and Hard.",
    h1: "Career Order — put the career back in order",
    intro: "You are given a player and every club he played for, scrambled. Put them back into the order he actually played for them, earliest at the top, latest at the bottom. The years stay hidden until you are done, so there is nothing to read off — only what you know about how the career went.",
    how: [
      "Drag a club by its ≡ handle, or move it with the ▲ / ▼ buttons if you would rather not drag.",
      "Hit Check order. Clubs in the right spot lock green and stay green until you move them yourself.",
      "You get three checks. Solve it before they run out or the answer is revealed.",
      "Easy, Medium and Hard are simply shorter and longer careers — more clubs means more ways to be wrong."
    ],
    faq: [
      ["How do I play without dragging?", "Every club has ▲ and ▼ buttons beside it that move it one place. The whole puzzle is solvable with those alone, which also makes it keyboard- and screen-reader-friendly."],
      ["What happens when a club locks green?", "It is in the right place. It stays green through later checks unless you move it again, so each check narrows the problem instead of resetting it."],
      ["Do loan spells and NBA years count as separate stops?", "Yes. Anything recorded as a distinct stint in the career database appears as its own club, in the order it happened."],
      ["How many careers can appear?", "85 careers are long and varied enough to make a fair ordering puzzle, drawn from the same 466-career database the rest of the site plays by."]
    ]
  },
  {
    view: "thegrid", slug: "the-grid", name: "The Grid",
    title: "The Grid — the daily EuroLeague basketball grid game | Euroball",
    desc: "A 3×3 grid of clubs, nationalities and positions. Name a player who fits both the row and the column in every cell, with twelve guesses for nine cells. New grid daily.",
    h1: "The Grid — nine cells, twelve guesses",
    intro: "Three rows, three columns, and nine cells where they cross. Each cell wants one player who satisfies both sides at once — played for Olympiacos and is French, say. Twelve guesses for nine cells, no player twice, and a board full of names without a single miss earns an Immaculate.",
    how: [
      "Tap a cell, then name any player who fits its row and its column together.",
      "Twelve guesses cover nine cells, so you can afford three misses. Right or wrong, every guess costs one.",
      "A player counts for a club if it appears anywhere in his career — short stints and NBA spells included.",
      "Each player can be used only once on the board, so spend your flexible names carefully. Most cells have several right answers."
    ],
    faq: [
      ["Why was my answer rejected when the player really did fit?", "The Grid only accepts well-travelled players and legends whose full career is in the database. A newcomer still at his first club will be turned down even when he genuinely fits — a rule that keeps every offered name accurately checkable in both directions."],
      ["What is an Immaculate?", "Filling all nine cells without a single wrong guess. It is a badge on the result, not a separate mode."],
      ["Can two cells take the same player?", "No. Each player can appear once on the board. That constraint is what makes the shared-answer cells hard: two neighbouring cells may have almost the same answer list between them."],
      ["Can I give up on the Daily?", "Yes. Give up fills each empty cell with one answer that would have fitted, and asks once before it commits since there is no second grid that day. It records a loss for The Grid but still counts as played, so the hub streak survives."]
    ]
  },
  {
    view: "clubreveal", slug: "common-club", name: "Common Club",
    title: "Common Club — two players, one shared club | Euroball",
    desc: "Two European basketball careers that cross at exactly one club. Name it in three guesses. They need not have been teammates — only to have worn the same shirt. New pair daily.",
    h1: "Common Club — name the club they share",
    intro: "Two players. Somewhere in their careers they wore the same shirt, at exactly one club — and that club is the answer. They may have been teammates, or they may have missed each other by twenty years. Three guesses, and the fewer you use the better the win.",
    how: [
      "Read both careers and look for the single crossing point. Only one exists.",
      "They did not have to overlap. Both simply played there at some point — overlapping years are Path Between's game, not this one.",
      "Clubs suggest themselves as you type, and part of a name is enough when it is unique. The list never says which club they shared, and clubs you have already tried drop out of it.",
      "A club we cannot place is not a guess and costs you nothing."
    ],
    faq: [
      ["What if I can think of two clubs they share?", "Then one of them is not in the database. A pair only becomes a puzzle if it shares exactly one club out of all 465 clubs on record — not merely one of the ~22 you would think to name — so the guarantee of a single right answer holds."],
      ["Can the answer be an NBA team?", "No. The answer is always a EuroLeague club or a club with genuine retired greats, even though the database knows about NBA and other stints and uses them elsewhere."],
      ["Do the two players have to be from the same era?", "No, and Both mode leans on exactly that: a current EuroLeague player can be paired with a retired legend who played for the same club decades earlier."],
      ["Why is one player in the Daily always familiar?", "The Daily is anchored on a Final Four starter so there is always one name you can hold on to. Active, Legends and Both drop that guarantee, and Both reaches widest of all."]
    ]
  },
  {
    view: "pathbetween", slug: "path-between", name: "Path Between",
    title: "Path Between — link two players through teammates | Euroball",
    desc: "Six degrees of European basketball. Connect two players through men who were actually teammates — same club, overlapping seasons — inside a budget of par plus three. New pair daily.",
    h1: "Path Between — six degrees of European basketball",
    intro: "Two players at either end and a chain to build between them. Every name you add must have been a real teammate of the one before — the same club in the same seasons, not merely the same badge at different times. Par is the shortest chain that exists; you get par plus three guesses, and every guess costs one whether it lands or not.",
    how: [
      "The career lines under your current player and the target are the map. Find where two paths crossed in the same years.",
      "Names suggest themselves as you type. The list holds every player in the database whose name matches and never marks which of them actually links — most of what it offers is a dead end.",
      "Each player can appear in the chain only once, so it is possible to route yourself into a corner. A dead end loses the round.",
      "NBA stints count. Some of the best routes go through the League."
    ],
    faq: [
      ["What exactly counts as a teammate?", "A shared club with overlapping stint years. Two players who both wore the same shirt in different decades are not teammates here — that is Common Club's puzzle."],
      ["What is par?", "The length of the shortest chain that actually exists between the two players, computed in advance. Your budget is par plus three, so there is room to explore without room to wander."],
      ["Does a name I get wrong still cost a guess?", "Yes, if we can place the player. A name the database cannot resolve at all is not treated as a guess and costs nothing, so a typo never punishes you."],
      ["What happens if I give up?", "The game reveals one shortest route between the pair. On the Daily it asks once before committing and records a loss, but the round still counts as played so your hub streak survives."]
    ]
  },
  {
    view: "oddoneout", slug: "odd-one-out", name: "Odd One Out",
    title: "Odd One Out — spot the EuroLeague intruder | Euroball",
    desc: "Four names, three with something in common and one without. Spot the intruder. Five rounds a day, or play on forever in Practice. Every round has exactly one defensible answer.",
    h1: "Odd One Out — three belong together, one does not",
    intro: "Four names from European basketball. Three of them share something — a club they all played for, a nationality, a shirt number, a Final Four starting five. One does not. Tap the intruder. Five rounds a day, and three right is a pass.",
    how: [
      "Read all four before you tap. The connection is rarely the first one you notice.",
      "Every round has exactly one defensible answer — whichever connection you spot, it points at the same intruder.",
      "After you tap, the shared connection is revealed, so a wrong answer still teaches you something.",
      "Daily is five rounds and the same for everyone; three or more right keeps your streak alive."
    ],
    faq: [
      ["Can a round have two valid answers?", "No, and that is checked rather than hoped for. A round only ships if every connection present in the four names singles out the same intruder."],
      ["What connections are used?", "A shared club, a nationality, a jersey number, and Final Four starting fives — judged against the same players, careers and lineup data that Connections plays by."],
      ["How many do I need for the Daily to count?", "Three of five. The pass mark was eased from four after the first weeks made it clear four was punishing for a five-round game."],
      ["Is there an unlimited version?", "Yes. Practice runs endless rounds and tracks your best streak separately from the Daily."]
    ]
  },
  {
    view: "higherlower", slug: "higher-or-lower", name: "Higher or Lower",
    title: "Higher or Lower — the EuroLeague stats game | Euroball",
    desc: "Two European basketball players, one question: who is taller, who is older, whose shirt number is higher? Ten matchups a day, or an endless run that ends on your first mistake.",
    h1: "Higher or Lower — taller, older, bigger number?",
    intro: "Two players side by side and one question about them. Who is taller? Who is older? Whose shirt number is higher? Tap your answer and both values are revealed. Ten matchups make a Daily; Endless runs until you get one wrong.",
    how: [
      "Every matchup has a real gap between the two values — no ties and no one-centimetre coin flips.",
      "The pool mixes today's EuroLeague players with the retired legends, so eras collide and instinct is worth as much as knowledge.",
      "Daily is ten matchups, the same for everyone. Seven or more right is a pass and keeps your hub streak alive.",
      "Endless ends on your first wrong answer. Your best run is kept."
    ],
    faq: [
      ["Where do the heights and ages come from?", "The same database the rest of the site plays by — heights, birth years and shirt numbers compiled from official club rosters and cross-checked against the official 2025–26 EuroLeague rosters."],
      ["Can two players tie?", "No. A matchup is only used when there is a genuine gap between the values, so there is always a right answer."],
      ["How many do I need to pass the Daily?", "Seven out of ten. It was eased from eight once real scores showed eight was too steep for a ten-round game with legends in the pool."],
      ["Does Endless affect my streak?", "No. Only the Daily feeds the hub streak; Endless keeps its own best-run record on the Records page."]
    ]
  },
  {
    view: "rostermaster", slug: "roster-master", name: "Roster Master",
    title: "Roster Master — name every 2025-26 EuroLeague roster | Euroball",
    desc: "The long game: name every player on all twenty 2025-26 EuroLeague rosters from memory. No autocomplete, no hints. Progress saves per club and a full roster turns the club gold for good.",
    h1: "Roster Master — all twenty rosters, from memory",
    intro: "The big one, and the only game here with no daily. Twenty clubs, 293 players, and nothing but empty slots under Guards, Forwards and Centers. No autocomplete, no suggestions, no hints — pure recall. Name a full roster and that club turns gold permanently.",
    how: [
      "Pick a club. Its board shows empty slots by position, so you always know exactly how many you are missing.",
      "Type a name. A match fills its slot instantly. A surname is enough when it is unique on that roster, and accents and dots do not matter.",
      "Progress saves automatically, per club. Come back whenever — this is not a single sitting.",
      "Clear board starts a club over, but your best percentage survives on the club's card. Complete a roster once and the gold ★ is yours even if you clear it."
    ],
    faq: [
      ["Why is there no autocomplete?", "Because the game is recall. Every other game on the site offers a name list so you do not have to spell Spanoulis; here a list would let you walk the roster instead of remembering it, which is the entire puzzle."],
      ["How current are the rosters?", "They are the 2025–26 EuroLeague squads, cross-checked club by club against the official rosters. Transfers made after that check are not reflected."],
      ["Does Roster Master affect my hub streak?", "No. It has no daily, so it sits outside the streak entirely. Your best score per club is kept on the Records page."],
      ["What happens if I clear a board by accident?", "You lose the filled slots but not your record. The best percentage stays on the club card, and a gold ★ once earned is permanent."]
    ]
  }
];

/* ---------------------------------------------------------------------------
 * PLUMBING.
 * ------------------------------------------------------------------------- */

function esc(s) {
  return String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/* JSON-LD is script content, not markup: the only sequence that can break out of
 * a <script> block is "</", so that is the only thing escaped. Escaping the rest
 * as HTML would put &quot; inside the JSON and make it unparseable. */
function jsonld(obj) { return JSON.stringify(obj, null, 2).replace(/<\//g, "<\\/"); }

/* Strip tags for the places a plain string is required — JSON-LD values and the
 * meta description. The copy above uses <strong> and &nbsp; freely because it is
 * written for the page; the structured data has to be told the same thing in
 * text. */
function plain(s) {
  return String(s).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

/* Every relative reference in index.html is resolved from the document, so a
 * page one directory down has to reach back up. This is an explicit allowlist
 * rather than a general "anything without a scheme" rewrite, because the head
 * also carries a data: URI favicon and dozens of href="#ico-…" sprite
 * references, and a greedy regex would happily break both. */
function reroot(html) {
  html = html.replace(/(<script\s+src=")([a-z0-9_]+\.js)(")/gi, "$1../$2$3");
  html = html.replace(/(<link\s+rel="manifest"\s+href=")(manifest\.webmanifest)(")/i, "$1../$2$3");
  html = html.replace(/(<link\s+rel="apple-touch-icon"\s+href=")(icon-\d+\.png)(")/i, "$1../$2$3");
  // The hub tiles. They are links now precisely so a crawler can walk from the
  // lobby to all eleven games — but the lobby travels INSIDE every generated
  // page, and href="the-grid/" read from /path-between/ resolves to
  // /path-between/the-grid/. Every one of those would be a 404 that the sitemap
  // never mentions, which is a worse problem than the orphaning the links fixed.
  html = html.replace(/(<a class="game-card" href=")([a-z0-9-]+\/)(")/g, "$1../$2$3");
  // The service worker needs NO rewrite: index.html resolves its URL from
  // __ELG_ROOT__, which this page overrides to "../" a few lines further down, so
  // it already points at the root copy. Worth stating because the obvious thing
  // to worry about — scope — is a non-issue: a worker is scoped by its OWN url,
  // so /sw.js registered from /the-grid/ still controls the whole site, with no
  // Service-Worker-Allowed header, which matters because Pages won't send one.
  return html;
}

function replaceTag(html, re, next) {
  if (!re.test(html)) throw new Error("build_pages: index.html no longer contains " + re + " — the transform is out of date");
  return html.replace(re, next);
}

function seoSection(p) {
  var out = [];
  out.push('  <section class="seo-copy" data-seo-view="' + p.view + '">');
  // h2, NOT h1. Every game view already carries its own <h1> masthead ("Common
  // Club"), and it is the visible one on this page — a second h1 a few lines
  // below saying nearly the same thing is two answers to "what is this page
  // about". So the masthead stays the heading of the page and this is the
  // section under it, with the descriptive phrasing that the <title> and the
  // meta description carry anyway.
  out.push('    <h2 class="seo-lede">' + esc(p.h1) + "</h2>");
  out.push("    <p>" + p.intro + "</p>");
  out.push("    <h3>How to play " + esc(p.name) + "</h3>");
  out.push("    <ul>");
  p.how.forEach(function (li) { out.push("      <li>" + li + "</li>"); });
  out.push("    </ul>");
  out.push("    <h3>Frequently asked questions</h3>");
  out.push('    <dl class="seo-faq">');
  p.faq.forEach(function (qa) {
    out.push("      <dt>" + esc(qa[0]) + "</dt>");
    out.push("      <dd>" + qa[1] + "</dd>");
  });
  out.push("    </dl>");
  out.push('    <p class="seo-more">Euroball has eleven daily European basketball puzzles. <a href="../">See them all →</a></p>');
  out.push("  </section>");
  return out.join("\n");
}

function structuredData(p, url) {
  var game = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: p.name + " — Euroball",
    url: url,
    description: plain(p.desc),
    inLanguage: "en",
    genre: ["Puzzle", "Trivia", "Sports"],
    gamePlatform: "Web browser",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    about: { "@type": "SportsOrganization", name: "EuroLeague Basketball" },
    isPartOf: { "@type": "WebSite", name: "Euroball", url: ORIGIN + "/" }
  };
  var faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faq.map(function (qa) {
      return {
        "@type": "Question",
        name: plain(qa[0]),
        acceptedAnswer: { "@type": "Answer", text: plain(qa[1]) }
      };
    })
  };
  var crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Euroball", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: p.name, item: url }
    ]
  };
  return [game, faq, crumbs].map(function (o) {
    return '<script type="application/ld+json">\n' + jsonld(o) + "\n</script>";
  }).join("\n");
}

function buildPage(shell, p) {
  var url = ORIGIN + "/" + p.slug + "/";
  var desc = plain(p.desc);
  var html = reroot(shell);

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, "<title>" + esc(p.title) + "</title>");
  html = replaceTag(html, /<meta name="description" content="[\s\S]*?" \/>/,
    '<meta name="description" content="' + esc(desc) + '" />');
  html = replaceTag(html, /<link id="canonical" rel="canonical" href="[^"]*" \/>/,
    '<link id="canonical" rel="canonical" href="' + url + '" />');
  html = replaceTag(html, /<meta property="og:url" content="[^"]*" \/>/,
    '<meta property="og:url" content="' + url + '" />');
  html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/,
    '<meta property="og:title" content="' + esc(p.name + " — Euroball") + '" />');
  html = replaceTag(html, /<meta property="og:description" content="[^"]*" \/>/,
    '<meta property="og:description" content="' + esc(desc) + '" />');
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*" \/>/,
    '<meta name="twitter:title" content="' + esc(p.name + " — Euroball") + '" />');
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*" \/>/,
    '<meta name="twitter:description" content="' + esc(desc) + '" />');

  // Boot hints, written over the hub's own root declaration. __ELG_ROOT__ is how
  // app.js finds the site root without hardcoding it — resolved against the
  // document, "../" is "/" on the live domain and "/eurogame/" on the github.io
  // mirror, so one build serves both. __ELG_VIEW__ saves app.js from parsing the
  // path, and cannot disagree with the prose baked into this same file.
  //
  // This runs AFTER reroot(), so it matches the rewritten "../app.js" — the
  // ordering is load-bearing and replaceTag() throws rather than silently
  // producing eleven pages that all boot to the lobby.
  html = replaceTag(html, /<script>window\.__ELG_ROOT__ = "\.\/";<\/script>/,
    '<script>window.__ELG_ROOT__ = "../"; window.__ELG_VIEW__ = ' + JSON.stringify(p.view) + ";</script>");

  html = replaceTag(html, /<\/head>/, structuredData(p, url) + "\n</head>");
  html = replaceTag(html, /  <footer>/, seoSection(p) + "\n\n  <footer>");

  html = html.replace(/^<!DOCTYPE html>/,
    "<!DOCTYPE html>\n<!-- GENERATED by build_pages.js — do not edit. Change the copy or the\n" +
    "     transform in build_pages.js and re-run `node build_pages.js`. -->");
  return html;
}

function main() {
  var shellPath = path.join(ROOT, "index.html");
  var shell = fs.readFileSync(shellPath, "utf8");
  if (/window\.__ELG_ROOT__/.test(shell) === false) {
    console.warn("! index.html does not set window.__ELG_ROOT__ — the hub will not know its own root.");
  }
  var written = 0;
  PAGES.forEach(function (p) {
    var dir = path.join(ROOT, p.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "index.html"), buildPage(shell, p));
    written++;
    console.log("  " + p.slug + "/index.html");
  });
  console.log("build_pages: wrote " + written + " page" + (written === 1 ? "" : "s"));
}

module.exports = { PAGES: PAGES, buildPage: buildPage, reroot: reroot, plain: plain };
if (require.main === module) main();
