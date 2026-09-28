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
 * THE NUMBERS.
 *
 * Every count the copy quotes is worked out here, from the data files, at
 * build time, and the copy says {players} or {puzzles} rather than a figure.
 * Hand-typed numbers went stale the moment the data moved: the Connections
 * FAQ said "94 puzzles" long after the bank reached 128, and Career Order
 * quoted 85 careers out of 379. test.js fails if a {placeholder} is left over.
 * ------------------------------------------------------------------------- */
var STATS = (function () {
  var w = {};
  ["clubs.js", "players.js", "legends.js", "careers.js", "lineups.js", "puzzles.js", "grids.js", "paths.js", "oddones.js",
   "eurocup_players.js", "eurocup_careers.js", "eurocup_grids.js", "eurocup_paths.js"].forEach(function (f) {
    new Function("window", fs.readFileSync(path.join(ROOT, f), "utf8"))(w);
  });
  var canon = w.CLUBS.canonical;
  function distinct(c) { var s = {}; for (var i = 0; i < c.career.length; i++) { if (s[c.career[i].team]) return false; s[c.career[i].team] = 1; } return true; }
  function count(a, f) { return a.filter(f).length; }
  var elTeams = {}; w.PLAYERS.forEach(function (p) { elTeams[p.team] = 1; });
  var nats = {}; w.PLAYERS.forEach(function (p) { nats[p.nationality] = 1; });
  var careerClubs = {}; w.CAREERS.forEach(function (c) { c.career.forEach(function (s) { careerClubs[canon(s.team)] = 1; }); });
  // Common Club's answer set, the same rule as clubreveal.js answerClubs():
  // today's EuroLeague clubs plus any club with four or more non-active players filed under it.
  var answers = {}, legCount = {};
  w.PLAYERS.forEach(function (p) { answers[canon(p.team)] = 1; });
  w.LEGENDS.forEach(function (p) { var c = canon(p.team); legCount[c] = (legCount[c] || 0) + 1; });
  Object.keys(legCount).forEach(function (c) { if (legCount[c] >= 4) answers[c] = 1; });
  var seasons = {}; w.LINEUPS.forEach(function (l) { seasons[l.season] = 1; });
  var ss = Object.keys(seasons).map(Number).sort(), gaps = [];
  for (var y = ss[0]; y <= ss[ss.length - 1]; y++) if (!seasons[y] && y !== 2020) gaps.push(y);
  var suit = w.CAREERS.filter(function (c) { return c.career.length >= 3 && distinct(c); });
  var ecSuit = w.EUROCUP_CAREERS.filter(function (c) { return c.career.length >= 3 && distinct(c); });
  function par(list, k) { return count(list, function (p) { return p.par === k; }); }
  return {
    players: w.PLAYERS.length, legends: w.LEGENDS.length, careers: w.CAREERS.length,
    elClubs: Object.keys(elTeams).length, nats: Object.keys(nats).length,
    pidPool: count(w.CAREERS, function (c) { return c.career.length >= 2; }),
    pidDaily: count(w.CAREERS, function (c) { return c.career.length >= 4; }),
    coSuit: suit.length, coDaily: count(suit, function (c) { return c.career.length >= 4 && c.career.length <= 7; }),
    careerClubs: Object.keys(careerClubs).length, answerClubs: Object.keys(answers).length,
    lineups: w.LINEUPS.length, f4seasons: ss.length, f4first: ss[0], f4last: ss[ss.length - 1],
    f4gapNote: gaps.length ? "; " + gaps.join(" and ") + (gaps.length === 1 ? " isn't" : " aren't") + " in the archive yet" : "",
    puzzles: w.PUZZLES.length, grids: w.GRIDS.length, oddones: w.ODDONES.length,
    paths: w.PATHS.length, par2: par(w.PATHS, 2), par3: par(w.PATHS, 3), par4: par(w.PATHS, 4),
    ecPlayers: w.EUROCUP_PLAYERS.length, ecClubs: Object.keys(w.EUROCUP_TEAMS).length, ecCareers: w.EUROCUP_CAREERS.length,
    ecCoSuit: ecSuit.length, ecGrids: w.EUROCUP_GRIDS.length,
    ecPaths: w.EUROCUP_PATHS.length, ecPar2: par(w.EUROCUP_PATHS, 2), ecPar3: par(w.EUROCUP_PATHS, 3), ecPar4: par(w.EUROCUP_PATHS, 4)
  };
})();
function fill(s) {
  return String(s).replace(/\{([a-zA-Z0-9]+)\}/g, function (m, k) { return k in STATS ? String(STATS[k]) : m; });
}

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
    intro: "A Wordle for European basketball. One hidden player from the 2026–27 EuroLeague, eight tries, and a grid that tells you a little more each time. Guess a name and six columns light up at once: club, nationality, position, height, age and shirt number. Nothing is random — every colour narrows the field.",
    how: [
      "Type any EuroLeague player's name and pick him from the list. The row fills in immediately.",
      "Green means an exact match. Yellow means close — a club in the same country, a height within 5&nbsp;cm, an age within 2 years, a number within 3. Grey means no match at all.",
      "On height, age and number an arrow points the way: ↑ says the answer is higher than your guess, ↓ says lower.",
      "You have eight guesses. Solve it and your hub streak survives another day."
    ],
    faq: [
      ["How many guesses do I get?", "Eight. Every guess returns a full row of clues, so a deliberate opening guess — a player from a country and position you want to rule out — is worth more than a wild one."],
      ["What does a yellow square mean?", "Close, but the meaning depends on the column. On club it means a different club in the same country. On height it means within 5&nbsp;cm, on age within 2 years, and on shirt number within 3."],
      ["Which players can be the answer?", "The Daily and Practice draw from the current 2026–27 EuroLeague rosters. Non-active mode draws from players no longer on a current roster (retired greats included) instead, and Endless mixes everyone."],
      ["Is there a new one every day?", "Yes. The Daily resets at midnight in your own timezone and is the same player for everyone. Practice, Non-active and Endless are unlimited if you want to keep going."]
    ]
  },
  {
    view: "playerid", slug: "player-id", name: "Player ID",
    title: "Player ID — guess the player from his career path | Euroball",
    desc: "A EuroLeague player's whole career laid out club by club, with the years. Name him in two guesses. Daily puzzle plus unlimited practice with active players, non-active players, or both.",
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
      ["What is the difference between Active, Non-active and Both?", "Active draws only from players on a 2026–27 EuroLeague roster. Non-active draws from players no longer on a current roster, retired greats included. Both mixes them, which is the hardest because the era is no longer a hint."],
      ["How many careers are in the game?", "{careers} full career timelines, compiled from official club rosters, Wikipedia, FIBA and Proballers, and cross-checked against the official 2026–27 EuroLeague rosters."]
    ]
  },
  {
    view: "completefive", slug: "complete-the-five", name: "Complete the Five",
    title: "Complete the Five — EuroLeague Final Four lineups | Euroball",
    desc: "A real EuroLeague Final Four starting five with one starter hidden. Name him in two guesses, from the club, the season, his position and his four teammates. {lineups} lineups, 2010–2025.",
    h1: "Complete the Five — name the missing Final Four starter",
    intro: "A real EuroLeague Final Four starting five, set out on a half-court in the positions they played — with one man missing. You get the club, the season, the hole he left, and the four teammates who stood beside him. Name him in two guesses.",
    how: [
      "Look at where the gap is. The position on the floor tells you what kind of player is missing before you have thought about a single name.",
      "The four teammates date the lineup precisely. Once you know the season and the club, the fifth man is usually a memory away.",
      "A 🏆 beside the team means they went on to win the title that year.",
      "Two guesses. Type a name and pick it from the list."
    ],
    faq: [
      ["Which seasons are covered?", "{f4seasons} seasons of Final Four basketball, 2010 through 2025 — {lineups} starting fives in all. 2020 is absent because the season was cancelled and no Final Four was played."],
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
      ["Is every puzzle solvable in only one way?", "Yes, and that is enforced rather than assumed. All {puzzles} puzzles are machine-generated and then verified to have exactly one valid solution, with fairness checks that keep every group independently recognisable."],
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
      ["How many careers can appear?", "{coSuit} careers are long and varied enough to make a fair ordering puzzle, drawn from the same {careers}-career database the rest of the site plays by."]
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
      ["Why was my answer rejected when the player really did fit?", "The Grid only accepts well-travelled players, current and non-active, whose full career is in the database. A newcomer still at his first club will be turned down even when he genuinely fits — a rule that keeps every offered name accurately checkable in both directions."],
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
      ["What if I can think of two clubs they share?", "Then one of them is not in the database. A pair only becomes a puzzle if it shares exactly one club out of all {careerClubs} clubs on record — not merely one of the {answerClubs} you would think to name — so the guarantee of a single right answer holds."],
      ["Can the answer be an NBA team?", "No. The answer is always a EuroLeague club or a club with genuine retired greats, even though the database knows about NBA and other stints and uses them elsewhere."],
      ["Do the two players have to be from the same era?", "No, and Both mode leans on exactly that: a current EuroLeague player can be paired with a non-active player who played for the same club decades earlier."],
      ["Why is one player in the Daily always familiar?", "The Daily is anchored on a Final Four starter so there is always one name you can hold on to. Active, Non-active and Both drop that guarantee, and Both reaches widest of all."]
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
      "The pool mixes today's EuroLeague players with non-active ones, so eras collide and instinct is worth as much as knowledge.",
      "Daily is ten matchups, the same for everyone. Seven or more right is a pass and keeps your hub streak alive.",
      "Endless ends on your first wrong answer. Your best run is kept."
    ],
    faq: [
      ["Where do the heights and ages come from?", "The same database the rest of the site plays by — heights, birth years and shirt numbers compiled from official club rosters and cross-checked against the official 2026–27 EuroLeague rosters."],
      ["Can two players tie?", "No. A matchup is only used when there is a genuine gap between the values, so there is always a right answer."],
      ["How many do I need to pass the Daily?", "Seven out of ten. It was eased from eight once real scores showed eight was too steep for a ten-round game with non-active players in the pool."],
      ["Does Endless affect my streak?", "No. Only the Daily feeds the hub streak; Endless keeps its own best-run record on the Records page."]
    ]
  },
  {
    view: "rostermaster", slug: "roster-master", name: "Roster Master",
    title: "Roster Master — name every 2026-27 EuroLeague roster | Euroball",
    desc: "The long game: name every player on all twenty 2026-27 EuroLeague rosters from memory. No autocomplete, no hints. Progress saves per club and a full roster turns the club gold for good.",
    h1: "Roster Master — all twenty rosters, from memory",
    intro: "The big one, and the only game here with no daily. Twenty clubs, {players} players, and nothing but empty slots under Guards, Forwards and Centers. No autocomplete, no suggestions, no hints — pure recall. Name a full roster and that club turns gold permanently.",
    how: [
      "Pick a club. Its board shows empty slots by position, so you always know exactly how many you are missing.",
      "Type a name. A match fills its slot instantly. A surname is enough when it is unique on that roster, and accents and dots do not matter.",
      "Progress saves automatically, per club. Come back whenever — this is not a single sitting.",
      "Clear board starts a club over, but your best percentage survives on the club's card. Complete a roster once and the gold ★ is yours even if you clear it.",
      "Stuck? Reveal missing shows the players you have not named yet. They earn nothing, not the score, not the gold ★, and Clear board lets you try the club again."
    ],
    faq: [
      ["Why is there no autocomplete?", "Because the game is recall. Every other game on the site offers a name list so you do not have to spell Spanoulis; here a list would let you walk the roster instead of remembering it, which is the entire puzzle."],
      ["How current are the rosters?", "They are the 2026–27 EuroLeague squads, cross-checked club by club against the official rosters at the start of the season. Transfers made after that check are not reflected."],
      ["Does Roster Master affect my hub streak?", "No. It has no daily, so it sits outside the streak entirely. Your best score per club is kept on the Records page."],
      ["What happens if I clear a board by accident?", "You lose the filled slots but not your record. The best percentage stays on the club card, and a gold ★ once earned is permanent."]
    ]
  }
];

/* ---------------------------------------------------------------------------
 * THE EUROCUP'S COPY.
 *
 * The EuroCup plays seven of the games on its own players, so it gets its own
 * pages: a hub at /eurocup/ and one page per game at /eurocup/<slug>/, same
 * slugs as the EuroLeague's. Each declares its competition in its <head>
 * (window.__ELG_COMP__), so a visitor arriving from a search plays the EuroCup
 * with nothing stored. Written separately rather than templated off the
 * EuroLeague copy: the numbers, the modes and the pools all differ, and a page
 * that half-describes the other competition is worse than no page.
 * ------------------------------------------------------------------------- */
var EC_DIR = "eurocup";
var EC_HUB = {
  view: "home", name: "EuroCup",
  title: "EuroCup games — daily EuroCup basketball puzzles | Euroball",
  desc: "Seven free daily puzzle games about the 2026–27 EuroCup: guess the mystery player, name him from his career path, fill the grid, link two players through their teammates, and more. 32 clubs, 391 players.",
  ogTitle: "Euroball 🏀 EuroCup"
};
var EC_PAGES = [
  {
    view: "mystery", slug: "mystery-player", name: "Mystery Player",
    title: "Mystery Player — the daily EuroCup Wordle | Euroball",
    desc: "Guess the mystery EuroCup player in 8 tries. Every guess colour-codes club, nationality, position, height, age and jersey number. A new player from the 2026–27 EuroCup daily — free, no sign-up.",
    h1: "Mystery Player — the daily EuroCup Wordle",
    intro: "A Wordle for the EuroCup. One hidden player from the 2026–27 EuroCup, eight tries, and a grid that tells you a little more each time. Guess a name and six columns light up at once: club, nationality, position, height, age and shirt number. Thirty-two clubs across Europe make the club and country columns work harder than they do in the EuroLeague.",
    how: [
      "Type any EuroCup player's name and pick him from the list. The row fills in immediately.",
      "Green means an exact match. Yellow means close — a club in the same country, a height within 5&nbsp;cm, an age within 2 years, a number within 3. Grey means no match at all.",
      "On height, age and number an arrow points the way: ↑ says the answer is higher than your guess, ↓ says lower.",
      "You have eight guesses. Solve it and your hub streak survives another day."
    ],
    faq: [
      ["Which players can be the answer?", "Anyone on a 2026–27 EuroCup roster: {ecPlayers} players across {ecClubs} clubs, researched club by club from the official rosters. Nationality is the national team a player has played for."],
      ["What does a yellow square mean?", "Close, but the meaning depends on the column. On club it means a different club in the same country — Trento for Reyer Venezia, say. On height it means within 5&nbsp;cm, on age within 2 years, and on shirt number within 3."],
      ["Is it separate from the EuroLeague Mystery Player?", "Yes. The EuroCup keeps its own daily, its own stats and its own streaks, so playing one competition never touches the other. Switch between them from the competition menu at the top of the hub."],
      ["Is there a new one every day?", "Yes. The Daily resets at midnight in your own timezone and is the same player for everyone. Practice and Endless are unlimited if you want to keep going."]
    ]
  },
  {
    view: "playerid", slug: "player-id", name: "Player ID",
    title: "Player ID — guess the EuroCup player from his career path | Euroball",
    desc: "A EuroCup player's whole career laid out club by club, with the years. Name him in two guesses. A daily puzzle plus unlimited practice across the 2026–27 EuroCup rosters.",
    h1: "Player ID — name the EuroCup player from his career path",
    intro: "Every club he has played for, in order, with the years he was there — and nothing else. No stats, no photo, no nationality. The last stop is always his 2026–27 EuroCup club; everything before it is the route that got him there. Two guesses to say whose career you are looking at.",
    how: [
      "Read the path from his first club to his current one. The countries, the leagues and the length of each stop tell you most of what you need.",
      "Start typing and pick a name from the list. The list gives names only — no club hints, which would give the game away.",
      "You get two guesses. A near-miss costs the same as a wild one, so read the whole path before committing."
    ],
    faq: [
      ["How many careers are in the game?", "{ecCareers} of the EuroCup's {ecPlayers} players have a full career timeline, built from the official EuroCup player biographies. The Daily sticks to careers of four clubs or more so the route tells a story."],
      ["Do NBA years show up in the path?", "Yes. Sixty-one EuroCup careers pass through the NBA, and those stints appear in the timeline like any other club. College, G League and third-division stops are left out."],
      ["Why is there no Non-active mode?", "Because every EuroCup puzzle is a current player. The EuroLeague version adds retired and non-active players; the EuroCup plays on this season's rosters only."],
      ["Why only two guesses?", "Because the career path is a very strong clue once you read it properly. Two guesses keeps it a test of recognition rather than a process of elimination."]
    ]
  },
  {
    view: "careerorder", slug: "career-order", name: "Career Order",
    title: "Career Order — put a EuroCup career back in order | Euroball",
    desc: "A EuroCup player's clubs, shuffled. Drag them back into the order he played for them, earliest to latest, in three checks. Daily puzzle plus Easy, Medium and Hard.",
    h1: "Career Order — put the EuroCup career back in order",
    intro: "You are given a EuroCup player and every club he has played for, scrambled. Put them back into the order he actually played for them, earliest at the top, latest at the bottom. The years stay hidden until you are done, so there is nothing to read off — only what you know about how the career went.",
    how: [
      "Drag a club by its ≡ handle, or move it with the ▲ / ▼ buttons if you would rather not drag.",
      "Hit Check order. Clubs in the right spot lock green and stay green until you move them yourself.",
      "You get three checks. Solve it before they run out or the answer is revealed.",
      "Easy, Medium and Hard are simply shorter and longer careers — more clubs means more ways to be wrong."
    ],
    faq: [
      ["How many careers can appear?", "{ecCoSuit} EuroCup careers are long enough, with three or more different clubs, to make a fair ordering puzzle."],
      ["Is the last club always his EuroCup club?", "Yes — the 2026–27 club is always the latest stop, which is a free anchor. The work is everything before it."],
      ["How do I play without dragging?", "Every club has ▲ and ▼ buttons beside it that move it one place. The whole puzzle is solvable with those alone, which also makes it keyboard- and screen-reader-friendly."],
      ["Do NBA years count as separate stops?", "Yes. Anything recorded as a distinct stint in the career database appears as its own club, in the order it happened."]
    ]
  },
  {
    view: "thegrid", slug: "the-grid", name: "The Grid",
    title: "The Grid — the daily EuroCup basketball grid game | Euroball",
    desc: "A 3×3 grid of clubs, nationalities and positions for the EuroCup. Name a EuroCup player who fits both the row and the column in every cell, with twelve guesses for nine cells. New grid daily.",
    h1: "The Grid — nine cells, twelve guesses, EuroCup players only",
    intro: "Three rows, three columns, and nine cells where they cross. Each cell wants one 2026–27 EuroCup player who satisfies both sides at once — played for Olympiacos and is American, say. The headers can be EuroCup clubs or EuroLeague ones, because EuroCup careers run through both. Twelve guesses for nine cells, no player twice.",
    how: [
      "Tap a cell, then name any EuroCup player who fits its row and its column together.",
      "Twelve guesses cover nine cells, so you can afford three misses. Right or wrong, every guess costs one.",
      "A player counts for a club if it appears anywhere in his career — short stints and NBA spells included.",
      "Each player can be used only once on the board, so spend your flexible names carefully. Every cell has at least two right answers."
    ],
    faq: [
      ["Who counts as an answer?", "Any of the {ecCareers} EuroCup players whose full career is in the database. A player without a recorded career is not accepted even if he fits, which keeps every name the game offers accurately checkable."],
      ["Why are there EuroLeague clubs on a EuroCup grid?", "Because that is where many EuroCup careers have been. Olympiacos, Partizan or Fenerbahce in a header asks who in this season's EuroCup once played there."],
      ["How many grids are there?", "{ecGrids} EuroCup boards, each verified to have enough answers per cell and a way to fill all nine cells with nine different players."],
      ["Is it separate from the EuroLeague Grid?", "Yes: different boards, its own daily and its own streak. Switch competitions from the menu at the top of the hub."]
    ]
  },
  {
    view: "pathbetween", slug: "path-between", name: "Path Between",
    title: "Path Between — link two EuroCup players through teammates | Euroball",
    desc: "Six degrees of the EuroCup. Connect two EuroCup players through men who were actually teammates — same club, overlapping seasons — inside a budget of par plus three. New pair daily.",
    h1: "Path Between — six degrees of the EuroCup",
    intro: "Two EuroCup players at either end and a chain to build between them. Every name you add must be another EuroCup player who was a real teammate of the one before — the same club in the same seasons. Par is the shortest chain that exists; you get par plus three guesses, and every guess costs one whether it lands or not.",
    how: [
      "The career lines under your current player and the target are the map. Find where two paths crossed in the same years.",
      "This season's teammates count: two players on the same EuroCup roster are linked. So do old teammates from anywhere in their careers, NBA included.",
      "Each player can appear in the chain only once, so it is possible to route yourself into a corner. A dead end loses the round.",
      "Names suggest themselves as you type, and the list never marks which of them actually links."
    ],
    faq: [
      ["What exactly counts as a teammate?", "A shared club with overlapping stint years, judged on the EuroCup players' careers. Two players who wore the same shirt in different seasons are not teammates here."],
      ["How many puzzles are there?", "{ecPaths} EuroCup pairs: {ecPar2} Easy (one player in between), {ecPar3} Medium, which is also the Daily's pool, and {ecPar4} Hard (three in between). Each has more than one shortest route."],
      ["What is par?", "The length of the shortest chain that actually exists between the two players, computed in advance. Your budget is par plus three."],
      ["What happens if I give up?", "The game reveals one shortest route. On the Daily it asks once before committing and records a loss, but the round still counts as played, so your hub streak survives."]
    ]
  },
  {
    view: "higherlower", slug: "higher-or-lower", name: "Higher or Lower",
    title: "Higher or Lower — the EuroCup stats game | Euroball",
    desc: "Two EuroCup players, one question: who is taller, who is older, whose shirt number is higher? Ten matchups a day, or an endless run that ends on your first mistake.",
    h1: "Higher or Lower — taller, older, bigger number? (EuroCup)",
    intro: "Two players from the 2026–27 EuroCup side by side and one question about them. Who is taller? Who is older? Whose shirt number is higher? Tap your answer and both values are revealed. Ten matchups make a Daily; Endless runs until you get one wrong.",
    how: [
      "Every matchup has a real gap between the two values — no ties and no one-centimetre coin flips.",
      "Both players are on a current EuroCup roster, from any of the 32 clubs.",
      "Daily is ten matchups, the same for everyone. Seven or more right is a pass and keeps your hub streak alive.",
      "Endless ends on your first wrong answer. Your best run is kept."
    ],
    faq: [
      ["Where do the heights and ages come from?", "The official 2026–27 EuroCup rosters, researched club by club: heights, birth years and shirt numbers for all {ecPlayers} players."],
      ["Can two players tie?", "No. A matchup is only used when there is a genuine gap between the values, so there is always a right answer."],
      ["How many do I need to pass the Daily?", "Seven out of ten."],
      ["Does Endless affect my streak?", "No. Only the Daily feeds the hub streak; Endless keeps its own best-run record on the Records page."]
    ]
  },
  {
    view: "rostermaster", slug: "roster-master", name: "Roster Master",
    title: "Roster Master — name every 2026-27 EuroCup roster | Euroball",
    desc: "The long game: name every player on all thirty-two 2026-27 EuroCup rosters from memory. No autocomplete, no hints. Progress saves per club and a full roster turns the club gold for good.",
    h1: "Roster Master — all thirty-two EuroCup rosters, from memory",
    intro: "The only game here with no daily. Thirty-two EuroCup clubs, {ecPlayers} players, and nothing but empty slots under Guards, Forwards and Centers. No autocomplete, no suggestions, no hints — pure recall. Name a full roster and that club turns gold permanently.",
    how: [
      "Pick a club. Its board shows empty slots by position, so you always know exactly how many you are missing.",
      "Type a name. A match fills its slot instantly. A surname is enough when it is unique on that roster, and accents and dots do not matter.",
      "Progress saves automatically, per club. Come back whenever — this is not a single sitting.",
      "Clear board starts a club over, but your best percentage survives on the club's card. Complete a roster once and the gold ★ is yours even if you clear it.",
      "Stuck? Reveal missing shows the players you have not named yet. They earn nothing, not the score, not the gold ★, and Clear board lets you try the club again."
    ],
    faq: [
      ["How current are the rosters?", "They are the 2026–27 EuroCup squads, taken club by club from the official rosters at the start of the season. Transfers made after that are not reflected."],
      ["Which clubs are in it?", "All {ecClubs} EuroCup clubs, from Aris Thessaloniki and Turk Telekom to London Lions, Reyer Venezia and Slask Wroclaw."],
      ["Why is there no autocomplete?", "Because the game is recall. A name list would let you walk the roster instead of remembering it, which is the entire puzzle."],
      ["Is my EuroLeague progress affected?", "No. The EuroCup keeps its own boards, best scores and gold stars, separate from the EuroLeague's."]
    ]
  }
];


/* ---------------------------------------------------------------------------
 * THE LONGER COPY: tips, what's inside, a worked example, and related games.
 *
 * Each game page carried ~270 words of its own under ~2,500 shared with every
 * other page (the app itself), which is thin by any search engine's measure,
 * and thin is the most common reason AdSense turns a game site down. These
 * sections are the page's own: how to get better at this game, what it is
 * built from (in numbers from STATS), and one example worked through on real
 * data. The examples use pairs and players that are not puzzles in the banks
 * (the Path Between route below is checked against paths.js), or facts the
 * club pages already show, so no copy gives away a daily.
 * ------------------------------------------------------------------------- */
var EXTRA = {
  mystery: {
    tips: [
      "Open with a player who splits the field. A guard from a big basketball country tells you something whichever way it lands; an obscure centre from a small nation mostly tells you who it isn't.",
      "A yellow club square is a gift. It means the answer plays in the same country as your guess, and in a twenty-club league that leaves one or two rosters. The ABA League clubs, Crvena Zvezda, Partizan and Dubai, count as one country here.",
      "Use the arrows as a bracket. One guess taller than the answer and one shorter pins the height inside a few centimetres, and the same trick works for age and shirt number.",
      "Don't spend guesses confirming what you know. Once position is green, every later guess should play that position. Hard mode enforces it, offering only names that fit every clue so far."
    ],
    inside: "The Daily and Practice draw from the {players} players on the {elClubs} 2026–27 EuroLeague rosters, from {nats} countries. Non-active mode swaps in the {legends} players who are no longer on a current roster, from all-time greats to last season's departures. Endless mixes both pools and keeps going until you miss. Nationality always means the national team a player has played for, not his passport or birthplace.",
    example: "Say the answer were Kendrick Nunn and you opened with Evan Fournier. Club turns yellow: Fournier's Olympiacos is a different club in the same country, and the only other Greek club in the EuroLeague is Panathinaikos. Nationality is grey, because Fournier plays for France. Position is green, since both are guards. Height is grey with a ↓, because the answer is more than 5&nbsp;cm shorter than Fournier's 198&nbsp;cm. Age is grey with a ↓ too, and so is the shirt number, Fournier's 94 against something much lower. One guess in, you are looking for a younger, shorter Panathinaikos guard who isn't French, with a low number.",
    related: ["playerid", "higherlower", "thegrid"]
  },
  playerid: {
    tips: [
      "Read the path from the end. The last club is where he is now or where he finished, and in the Active pool that alone leaves one roster to think about.",
      "Look for the NBA gap. A run of American clubs in the middle of a European career dates it, and usually says he was rated highly at the time.",
      "Count the countries. A career that never leaves Spain or Greece belongs to a different kind of player from one that crosses six leagues.",
      "Use the era. A path that starts in the 1990s rules out every current player at once, and switching to Both mode is what makes that clue matter."
    ],
    inside: "{careers} career timelines, club by club with the years, compiled from official club rosters, Wikipedia, FIBA and Proballers. Practice draws from every career with at least two clubs ({pidPool} of them), and the Daily from the {pidDaily} with four or more, so the route always has a story in it.",
    example: "Maroussi 2001–2005, Panathinaikos 2005–2006, Houston Rockets 2006–2007, Panathinaikos 2007–2010, Olympiacos 2010–2021. A Greek start, one NBA season, a return, and then a move straight across Greek basketball's great rivalry, where he stayed eleven years. Nobody else has that route. It's Vassilis Spanoulis.",
    related: ["careerorder", "mystery", "pathbetween"]
  },
  completefive: {
    tips: [
      "Start with where the gap is. A missing centre in a Final Four five is a short list; a missing small forward can be almost anyone.",
      "Date the five from the teammates you recognise. Two names usually fix the season, and the season fixes the roster.",
      "Remember that starters aren't always the stars. Coaches start defenders and bigs who played twenty minutes, and the famous sixth man is often not in the five at all.",
      "On Easy the hidden man is the headline name. If the four on the floor feel like a supporting cast, the answer is probably the team's best player."
    ],
    inside: "{lineups} real starting fives from {f4seasons} Final Fours between {f4first} and {f4last} (2020 was cancelled{f4gapNote}), set out on a half-court in the positions they started. The Final Four fives of today's EuroLeague clubs are also listed on their club pages.",
    example: "2018, Real Madrid, champions. Facundo Campazzo at the point, Fabien Causeur at shooting guard, Felipe Reyes at power forward and Gustavo Ayón at centre, with the small forward's spot empty. A Madrid title team from 2018 with a hole at the three has one answer fans remember: Luka Dončić, the EuroLeague's MVP that season.",
    related: ["connections", "oddoneout", "playerid"]
  },
  connections: {
    tips: [
      "Find the group that can't be anything else first, then work outwards. The hardest group usually hides among the other three.",
      "When a name fits two groups, ask which group needs it. Each group has exactly four members, so a group that already has four candidates without him lets him go.",
      "Treat “One away” as information, not a failure. Three of your four are right, and the wrong one is usually the most obvious name.",
      "Shuffle when you stall. Seeing the names in a new order breaks the pairings your eye keeps making."
    ],
    inside: "{puzzles} boards, each built from the site's data and checked for exactly one solution. The categories run from current rosters and nationalities to Final Four starting fives, birth decades, shared shirt numbers, the 2.10&nbsp;m club and players who have played for six or more clubs. Every board is checked again whenever the data changes, so a transfer can't quietly give a board a second answer.",
    example: "Kostas Sloukas is Greek, a guard, a former Olympiacos player and a current Panathinaikos one, all at once. A board never lets him fit two of its groups, so on the day he appears the question is only which of those facts this board is asking about. That is the whole game: every name is true in several ways, and only one of them is on the board.",
    related: ["oddoneout", "thegrid", "completefive"]
  },
  careerorder: {
    tips: [
      "Place the anchors first. The club he is at now goes last, and a youth or hometown club usually goes first.",
      "NBA spells tend to come in the middle of a European career, or at the start for players who were drafted young.",
      "Use each check to learn. A club that locks green is fixed, so every check makes the problem smaller.",
      "Think in eras. Clubs change their sponsor names, and knowing when a team was called what can place a stint on its own."
    ],
    inside: "{coSuit} careers are long and varied enough to make a fair puzzle: three or more clubs, and no club twice, since two identical tiles would make the order ambiguous. The Daily uses the {coDaily} with four to seven clubs. Easy has up to four, Medium five or six, and Hard seven or more.",
    example: "Mike James: KK Zagreb, Paffoni Omegna, Baskonia, Panathinaikos, Phoenix Suns, Olimpia Milano, CSKA Moscow, AS Monaco, Anadolu Efes. Nine clubs is a Hard puzzle, but it comes apart quickly once you place the ends. He has just joined Efes, so that goes last, after the years at Monaco. The two small Croatian and Italian clubs are where it started. The NBA season in Phoenix sits between Panathinaikos and Milano.",
    related: ["playerid", "pathbetween", "clubreveal"]
  },
  thegrid: {
    tips: [
      "Fill the hardest cells first. A small club crossed with a rare nationality may have a single answer; save your well-travelled names for the easy cells.",
      "Journeymen are gold. A player who has been at eight clubs can answer cells nobody else can.",
      "Short stints and NBA spells count, so think about loans and one-season stops, not just the clubs a player is known for.",
      "Twelve guesses for nine cells makes a miss affordable. Using a player in the wrong cell is not, because each player can only go on the board once."
    ],
    inside: "{grids} daily grids built from the {careers} careers in the database. Every cell is checked to have at least one right answer, and most have several. Rows and columns mix clubs, nationalities and positions, and a player counts for a club if it appears anywhere in his career.",
    example: "Take the cell where Olympiacos meets France. Evan Fournier is the obvious answer, but the database knows three more: Frank Ntilikina, Moustapha Fall and Kim Tillie. Since each player can be used only once, look at the rest of the board before you spend the famous one. A France or guard cell elsewhere may need him more.",
    related: ["connections", "clubreveal", "pathbetween"]
  },
  clubreveal: {
    tips: [
      "Read the shorter career first. The fewer clubs a player had, the fewer candidates there are.",
      "Keep the answer set in mind. It is always a current EuroLeague club or one with a real contingent of club greats, never an NBA team or a small stop along the way.",
      "Think country, then era. Two careers that both run through one country usually cross there.",
      "A miss still helps. The club you tried drops out of the list, and there are only {answerClubs} possible answers to begin with."
    ],
    inside: "Every one of the {careers} careers is read as a set of clubs, each counted once however many stints a player had there, across {careerClubs} clubs in all. A pair becomes a puzzle only if their sets meet at exactly one club, and only if that club is one of the {answerClubs} a fan could fairly be asked to name.",
    example: "Vassilis Spanoulis (Maroussi, Panathinaikos, Houston Rockets, Olympiacos) and Dimitris Diamantidis (Iraklis, Panathinaikos). They were teammates at Panathinaikos from 2007 to 2010, but that isn't what makes it the answer here. What matters is that Panathinaikos is the only club on both lists.",
    related: ["pathbetween", "thegrid", "careerorder"]
  },
  pathbetween: {
    tips: [
      "Work from both ends. Look at where the target has played and ask who from your side could have been there at the same time.",
      "Big clubs are hubs. A long-serving player at Real Madrid, Olympiacos or CSKA Moscow links to a huge number of teammates.",
      "Check the years, not just the badge. Two stints at the same club only link if they overlap.",
      "Don't spend guesses on long shots. Par plus three is a small budget, and a dead end loses the round."
    ],
    inside: "{paths} pairs, each with its par worked out in advance by a shortest-route search over the teammate graph: {par2} Easy pairs at par 2, {par3} Medium at par 3, which is also the Daily's pool, and {par4} Hard at par 4. Clubs that changed their names are merged, so an Elan Chalon stint links to a Chalon one.",
    example: "Sergio Llull to Kostas Sloukas takes two steps. Llull has only ever played for Manresa and Real Madrid; Sloukas for Olympiacos, Fenerbahce and Panathinaikos. They never shared a club, so you need someone who crossed from one side to the other: Guerschon Yabusele played with Llull at Real Madrid from 2021 to 2024 and joined Sloukas at Panathinaikos in 2026.",
    related: ["clubreveal", "careerorder", "thegrid"]
  },
  oddoneout: {
    tips: [
      "Look for what three names share and one conspicuously lacks: a club, a country, a shirt number or a Final Four five.",
      "If you spot two different connections, check they point at the same name. The game guarantees they do, so if yours don't, one of them isn't the real link.",
      "Watch for nationality traps. Naturalised players count for the national team they play for, not for where they were born.",
      "A wrong tap still teaches you something, because the shared link is revealed either way."
    ],
    inside: "{oddones} rounds, each checked so that every connection among the four names singles out the same intruder. They draw on four kinds of link, a shared club, a nationality, a shirt number and a Final Four starting five, judged against the same data as Connections.",
    related: ["connections", "higherlower", "completefive"]
  },
  higherlower: {
    tips: [
      "Position is the best height clue. A centre is almost always taller than a guard, and the exceptions are worth remembering.",
      "For age, think about career stage. A player on his sixth club is probably older than one still at his first.",
      "Non-active players keep getting older: a retired great's age counts to today, so he is usually the older of the two.",
      "In Endless, bank the easy ones quickly and slow down on the close calls. One miss ends the run."
    ],
    inside: "Matchups come from the {players} current and {legends} non-active players, compared on height, age or shirt number. A matchup is only used when there is a real gap between the two values, so a one-centimetre difference never decides a round.",
    example: "Edy Tavares against Facundo Campazzo on height is the easy end of the scale: 220&nbsp;cm against 178. The hard end is two guards of similar build, and that is where knowing Campazzo is one of the shortest players in the league starts to pay.",
    related: ["mystery", "oddoneout", "rostermaster"]
  },
  rostermaster: {
    tips: [
      "Go position by position. The board tells you exactly how many guards, forwards and centres you are missing.",
      "Start from last season's roster and subtract. Most clubs keep a core, and the gaps are the summer's signings.",
      "A surname is enough when it is unique on the roster, so type “Tavares”, not the full name.",
      "Come back later. A name you couldn't recall today often turns up while you are watching a game."
    ],
    inside: "{elClubs} clubs and {players} players, cross-checked against the official 2026–27 rosters at the start of the season. Every club also has its own page with the full roster, the squad in numbers and its former players: see <a href=\"../clubs/\">the clubs</a>.",
    related: ["mystery", "thegrid", "higherlower"]
  }
};

// The EuroCup pages: their own numbers and their own links (only games the
// EuroCup plays), no examples, since those would need EuroCup-specific checks.
var EC_EXTRA = {
  mystery: {
    tips: [
      "With {ecClubs} clubs, the club column is harder than in the EuroLeague. A yellow square still narrows it to the clubs of one country, but Italy alone has six, and Germany four.",
      "Use the arrows as a bracket: one guess taller than the answer and one shorter pins the height inside a few centimetres.",
      "Once position is green, keep every guess in that position. Hard mode will even enforce it."
    ],
    inside: "Every one of the {ecPlayers} players on the {ecClubs} 2026–27 EuroCup rosters can be the answer, researched club by club from the official rosters.",
    related: ["playerid", "higherlower", "thegrid"]
  },
  playerid: {
    tips: [
      "The last club is always his 2026–27 EuroCup club, so start there and read backwards.",
      "NBA stints appear like any other club, and in EuroCup careers they usually come early, right after college.",
      "Count the countries. EuroCup careers often cross four or five leagues, and the order they come in says a lot."
    ],
    inside: "{ecCareers} of the EuroCup's {ecPlayers} players have a full career timeline, built from the official EuroCup player biographies.",
    related: ["careerorder", "mystery", "pathbetween"]
  },
  careerorder: {
    tips: [
      "His 2026–27 EuroCup club is always last, so that tile is free. Work backwards from it.",
      "Place NBA stints early or in the middle, and use each check to lock in what you know.",
      "More clubs means more ways to be wrong, so start on Easy if the Daily feels long."
    ],
    inside: "{ecCoSuit} EuroCup careers have three or more different clubs, enough to make a fair ordering puzzle.",
    related: ["playerid", "pathbetween", "thegrid"]
  },
  thegrid: {
    tips: [
      "Fill the hardest cells first and keep your most-travelled players for the easy ones.",
      "EuroLeague clubs in a header are asking about the past: who in this season's EuroCup once played there.",
      "Each player can go on the board once, so check the whole grid before spending an obvious name."
    ],
    inside: "{ecGrids} EuroCup boards, each checked to have enough answers in every cell and a way to fill all nine with nine different players.",
    related: ["pathbetween", "playerid", "careerorder"]
  },
  pathbetween: {
    tips: [
      "This season's teammates count, so two players on the same EuroCup roster are always linked.",
      "Big clubs from anywhere in a career are hubs, NBA teams included.",
      "Check the years: two stints at the same club link only if they overlap."
    ],
    inside: "{ecPaths} EuroCup pairs: {ecPar2} Easy at par 2, {ecPar3} Medium at par 3, which is also the Daily's pool, and {ecPar4} Hard at par 4.",
    related: ["careerorder", "thegrid", "playerid"]
  },
  higherlower: {
    tips: [
      "Position is the best height clue: centres are almost always taller than guards.",
      "For age, think about how far into a career a player is.",
      "In Endless, bank the easy ones and slow down on the close calls."
    ],
    inside: "Matchups come from the {ecPlayers} players on the {ecClubs} 2026–27 EuroCup rosters, compared on height, age or shirt number, and only where there is a real gap.",
    related: ["mystery", "rostermaster", "playerid"]
  },
  rostermaster: {
    tips: [
      "Go position by position: the board shows exactly how many you are missing.",
      "A surname is enough when it is unique on the roster.",
      "Progress saves per club, so come back to a roster over several sittings."
    ],
    inside: "{ecClubs} clubs and {ecPlayers} players, taken club by club from the official 2026–27 EuroCup rosters. Every club also has its own page: see <a href=\"../../clubs/\">the clubs</a>.",
    related: ["mystery", "higherlower", "thegrid"]
  }
};
PAGES.forEach(function (p) { Object.assign(p, EXTRA[p.view] || {}); });
EC_PAGES.forEach(function (p) { Object.assign(p, EC_EXTRA[p.view] || {}); });

/* Numbers into the copy. Every string on every page goes through fill(), so a
 * {placeholder} anywhere (FAQ answers included, which also feed the JSON-LD)
 * comes out as today's count. */
(function fillAll(o) {
  Object.keys(o).forEach(function (k) {
    if (typeof o[k] === "string") o[k] = fill(o[k]);
    else if (o[k] && typeof o[k] === "object" && k !== "lineup") fillAll(o[k]);
  });
})({ a: PAGES, b: EC_PAGES, c: EC_HUB });

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
//
// up    — the way back to the SITE root: "../" from /the-grid/ or /eurocup/,
//         "../../" from /eurocup/the-grid/.
// tiles — where the hub tiles' own directory is, relative to this page: "../"
//         from any game page, "" from the EuroCup hub (whose games are its own
//         subdirectories). Defaults to up, which is right for the EuroLeague.
function reroot(html, up, tiles) {
  up = up == null ? "../" : up;
  tiles = tiles == null ? up : tiles;
  html = html.replace(/(<script\s+src=")([a-z0-9_]+\.js)(")/gi, "$1" + up + "$2$3");
  html = html.replace(/(<link\s+rel="manifest"\s+href=")(manifest\.webmanifest)(")/i, "$1" + up + "$2$3");
  html = html.replace(/(<link\s+rel="apple-touch-icon"\s+href=")(icon-\d+\.png)(")/i, "$1" + up + "$2$3");
  // The footer's two competition links are written from the site root.
  html = html.replace(/(<a class="colophon-link comp-link" href=")([^"]*)(")/g, "$1" + up + "$2$3");
  // …and so are About, Contact and Privacy (build_info.js).
  html = html.replace(/(<a class="colophon-link info-link" href=")([^"]*)(")/g, "$1" + up + "$2$3");
  // …and the clubs line under the hub tiles.
  html = html.replace(/(<a class="hub-clubs" href=")([^"]*)(")/g, "$1" + up + "$2$3");
  // The hub tiles. They are links now precisely so a crawler can walk from the
  // lobby to all eleven games — but the lobby travels INSIDE every generated
  // page, and href="the-grid/" read from /path-between/ resolves to
  // /path-between/the-grid/. Every one of those would be a 404 that the sitemap
  // never mentions, which is a worse problem than the orphaning the links fixed.
  html = html.replace(/(<a class="game-card" href=")([a-z0-9-]+\/)(")/g, "$1" + tiles + "$2$3");
  // The service worker needs NO rewrite: index.html resolves its URL from
  // __ELG_ROOT__, which this page overrides to "../" a few lines further down, so
  // it already points at the root copy. Worth stating because the obvious thing
  // to worry about — scope — is a non-issue: a worker is scoped by its OWN url,
  // so /sw.js registered from /the-grid/ still controls the whole site, with no
  // Service-Worker-Allowed header, which matters because Pages won't send one.
  return html;
}

/* A EuroCup page is the same app with the EuroCup chosen before anything runs.
 * The script would re-word it on load anyway (app.js applyCompText); doing it
 * here too means the served HTML already says EuroCup, for anything that reads
 * the page without running it. And the tiles of games the EuroCup doesn't play
 * are cut, not hidden: each would be a link to a /eurocup/ page that doesn't
 * exist. */
function eurocupify(html) {
  var ec = (function () {
    var P = [];
    try { var w = {}; new Function("window", fs.readFileSync(path.join(ROOT, "eurocup_players.js"), "utf8"))(w); P = w.EUROCUP_PLAYERS || []; } catch (e) {}
    var clubs = {};
    P.forEach(function (x) { clubs[x.team] = 1; });
    return { n: P.length, c: Object.keys(clubs).length };
  })();
  html = html.replace(/(<span class="comp-text" data-ec=")([^"]*)(">)([^<]*)(<\/span>)/g, function (m, a, ecText, b, inner, c) {
    return a + ecText + b + ecText.replace(/\{n\}/g, ec.n).replace(/\{c\}/g, ec.c) + c;
  });
  html = html.replace(/<([a-z]+) data-ec-hide>/g, "<$1 data-ec-hide hidden>");
  html = html.replace(/\s*<a class="game-card" href="(?:\.\.\/)*[a-z0-9-]+\/" data-game="([a-z]+)">[\s\S]*?<\/a>/g, function (m, view) {
    return EC_PLAYS.indexOf(view) >= 0 ? m : "";
  });
  return html;
}
var EC_PLAYS = EC_PAGES.map(function (p) { return p.view; });
EC_HUB.comp = "eurocup";
EC_PAGES.forEach(function (p) { p.comp = "eurocup"; });
var ALL_PAGES = PAGES.concat([EC_HUB], EC_PAGES);

function replaceTag(html, re, next) {
  if (!re.test(html)) throw new Error("build_pages: index.html no longer contains " + re + " — the transform is out of date");
  return html.replace(re, next);
}

/* The EuroCup hub's intro, in place of the root hub's. Same grammar, its own
 * games and numbers; its links are relative to /eurocup/. */
function ecHubIntro() {
  var out = ['  <section class="seo-copy hub-intro" data-seo-view="home">'];
  out.push('    <h2 class="seo-lede">Daily puzzles about the EuroCup</h2>');
  out.push("    <p>" + fill("Seven of Euroball's games, played on the 2026–27 EuroCup: {ecPlayers} players across {ecClubs} clubs, researched club by club from the official rosters. Each game has a new daily puzzle at midnight, the same for everyone, and its own stats and streak, separate from the EuroLeague's.") + "</p>");
  out.push("    <h3>The EuroCup games</h3>");
  out.push("    <ul>");
  EC_PAGES.forEach(function (g) { out.push('      <li><a href="' + g.slug + '/">' + esc(g.name) + "</a>: " + esc(plain(g.desc).split(/(?<=\.)\s/)[0]) + "</li>"); });
  out.push("    </ul>");
  out.push('    <p class="seo-more">Every EuroCup club has its own page, with its roster and former players. <a href="../clubs/">See the clubs →</a> · <a href="../?comp=euroleague">The EuroLeague games →</a></p>');
  out.push("  </section>");
  return out.join("\n");
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
  if (p.tips) {
    out.push("    <h3>Getting better at " + esc(p.name) + "</h3>");
    out.push("    <ul>");
    p.tips.forEach(function (li) { out.push("      <li>" + li + "</li>"); });
    out.push("    </ul>");
  }
  if (p.inside) { out.push("    <h3>What's in the game</h3>"); out.push("    <p>" + p.inside + "</p>"); }
  if (p.example) { out.push("    <h3>An example</h3>"); out.push("    <p>" + p.example + "</p>"); }
  if (p.related && p.related.length) {
    // Games that pull on the same knowledge. Links stay inside this page's
    // competition: a EuroCup page only points at games the EuroCup plays.
    var pool = p.comp === "eurocup" ? EC_PAGES : PAGES;
    var rel = p.related.map(function (v) { return pool.filter(function (x) { return x.view === v; })[0]; }).filter(Boolean);
    if (rel.length) {
      out.push("    <h3>If you like " + esc(p.name) + "</h3>");
      out.push("    <ul>");
      rel.forEach(function (r) { out.push('      <li><a href="../' + r.slug + '/">' + esc(r.name) + "</a>: " + esc(plain(r.desc).split(/(?<=\.)\s/)[0]) + "</li>"); });
      out.push("    </ul>");
    }
  }
  out.push(p.comp === "eurocup"
    ? '    <p class="seo-more">Euroball has ' + EC_PAGES.length + ' daily EuroCup puzzles, and eleven for the EuroLeague. <a href="../">See the EuroCup games →</a></p>'
    : '    <p class="seo-more">Euroball has eleven daily European basketball puzzles. <a href="../">See them all →</a></p>');
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
    about: { "@type": "SportsOrganization", name: p.comp === "eurocup" ? "EuroCup" : "EuroLeague Basketball" },
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
    itemListElement: (p.comp === "eurocup" ? [
      { "@type": "ListItem", position: 1, name: "Euroball", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "EuroCup", item: ORIGIN + "/" + EC_DIR + "/" },
      { "@type": "ListItem", position: 3, name: p.name, item: url }
    ] : [
      { "@type": "ListItem", position: 1, name: "Euroball", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: p.name, item: url }
    ])
  };
  return [game, faq, crumbs].map(function (o) {
    return '<script type="application/ld+json">\n' + jsonld(o) + "\n</script>";
  }).join("\n");
}

// The page's own address, relative to the site root.
function pagePath(p) {
  if (p.comp === "eurocup") return EC_DIR + "/" + (p.view === "home" ? "" : p.slug + "/");
  return p.slug + "/";
}

/* The EuroCup hub has no prose section — like the site's own hub, it is a
 * viewport-filling grid of tiles, and each tile already carries its game's name
 * and one line about it. What it adds for a crawler is a list of its games. */
function hubData(p, url) {
  var list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Euroball daily EuroCup games",
    numberOfItems: EC_PAGES.length,
    itemListElement: EC_PAGES.map(function (g, i) {
      return { "@type": "ListItem", position: i + 1, name: g.name, url: ORIGIN + "/" + pagePath(g) };
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
  return [list, crumbs].map(function (o) {
    return '<script type="application/ld+json">\n' + jsonld(o) + "\n</script>";
  }).join("\n");
}

function buildPage(shell, p) {
  // The transforms anchor on a bare LF. A Windows checkout (core.autocrlf)
  // hands index.html over with CRLF, and every one of them would then miss.
  shell = shell.replace(/\r\n/g, "\n");
  var url = ORIGIN + "/" + pagePath(p);
  var desc = plain(p.desc);
  var hub = p.view === "home";
  var up = p.comp === "eurocup" ? (hub ? "../" : "../../") : "../";
  var html = reroot(shell, up, p.comp === "eurocup" && hub ? "" : "../");
  if (p.comp === "eurocup") html = eurocupify(html);

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, "<title>" + esc(p.title) + "</title>");
  html = replaceTag(html, /<meta name="description" content="[\s\S]*?" \/>/,
    '<meta name="description" content="' + esc(desc) + '" />');
  html = replaceTag(html, /<link id="canonical" rel="canonical" href="[^"]*" \/>/,
    '<link id="canonical" rel="canonical" href="' + url + '" />');
  html = replaceTag(html, /<meta property="og:url" content="[^"]*" \/>/,
    '<meta property="og:url" content="' + url + '" />');
  var ogTitle = p.ogTitle || (p.name + " — Euroball" + (p.comp === "eurocup" ? " EuroCup" : ""));
  html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/,
    '<meta property="og:title" content="' + esc(ogTitle) + '" />');
  html = replaceTag(html, /<meta property="og:description" content="[^"]*" \/>/,
    '<meta property="og:description" content="' + esc(desc) + '" />');
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*" \/>/,
    '<meta name="twitter:title" content="' + esc(ogTitle) + '" />');
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
    '<script>window.__ELG_ROOT__ = ' + JSON.stringify(up) + ";" + (hub ? "" : " window.__ELG_VIEW__ = " + JSON.stringify(p.view) + ";") + "</script>");

  // Which competition this page is, stated before the pre-paint script reads
  // it and before competition.js picks the players. Every generated page says
  // so — /the-grid/ as firmly as /eurocup/the-grid/ — so the address and what
  // is on screen can never disagree. (The hub at / states nothing: it plays
  // whichever competition the visitor last chose.)
  html = replaceTag(html, /<head>\n/, "<head>\n<script>window.__ELG_COMP__ = " + JSON.stringify(p.comp || "euroleague") + ";</script>\n");

  html = replaceTag(html, /<\/head>/, (hub ? hubData(p, url) : structuredData(p, url)) + "\n</head>");
  html = replaceTag(html, /  <section class="seo-copy hub-intro"[\s\S]*?<\/section>\n\n/, hub ? ecHubIntro() + "\n\n" : "");
  if (!hub) html = replaceTag(html, /  <footer>/, seoSection(p) + "\n\n  <footer>");

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
  ALL_PAGES.forEach(function (p) {
    var rel = pagePath(p);
    var dir = path.join(ROOT, rel);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), buildPage(shell, p));
    written++;
    console.log("  " + rel + "index.html");
  });
  console.log("build_pages: wrote " + written + " page" + (written === 1 ? "" : "s"));
}

module.exports = { PAGES: PAGES, EC_PAGES: EC_PAGES, EC_HUB: EC_HUB, ALL_PAGES: ALL_PAGES, pagePath: pagePath,
                   buildPage: buildPage, reroot: reroot, plain: plain };
if (require.main === module) main();
