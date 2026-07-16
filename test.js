/*
 * EuroLeague Guesser — headless regression test.
 *
 *   Run:  node test.js     (exit 0 = all passed, 1 = a failure)
 *
 * No build step / no deps. It stubs a minimal DOM, loads the REAL players.js,
 * legends.js and game.js, and drives the engine the way a user would (typing,
 * picking suggestions, switching modes, opening modals). Add a case whenever you
 * touch game.js so behaviour stays pinned.
 */
const fs = require("fs");

function El(tag) {
  this.tagName = tag; this.children = []; this._attrs = {}; this._listeners = {};
  this.className = ""; this.id = ""; this.textContent = ""; this._html = "";
  this.hidden = false; this.value = ""; this.disabled = false; this.checked = false;
  this.style = {}; this.tabIndex = 0;
  var classes = {};
  this.classList = {
    add: function (c) { classes[c] = true; },
    remove: function (c) { delete classes[c]; },
    toggle: function (c, f) { var on = (f === undefined) ? !classes[c] : f; if (on) classes[c] = true; else delete classes[c]; return on; },
    contains: function (c) { return !!classes[c]; }
  };
}
El.prototype.appendChild = function (c) { this.children.push(c); c.parentNode = this; return c; };
El.prototype.insertBefore = function (c) { this.children.unshift(c); c.parentNode = this; return c; };
El.prototype.removeChild = function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); if (c) c.parentNode = null; return c; };
El.prototype.remove = function () { if (this.parentNode) this.parentNode.removeChild(this); };
Object.defineProperty(El.prototype, "firstChild", { get: function () { return this.children[0] || null; } });
Object.defineProperty(El.prototype, "firstElementChild", { get: function () { return this.children[0] || null; } });
Object.defineProperty(El.prototype, "innerHTML", { get: function () { return this._html; }, set: function (v) { this._html = v; if (v === "") this.children = []; } });
El.prototype.setAttribute = function (k, v) { this._attrs[k] = String(v); };
El.prototype.getAttribute = function (k) { return k in this._attrs ? this._attrs[k] : null; };
El.prototype.removeAttribute = function (k) { delete this._attrs[k]; };
El.prototype.addEventListener = function (t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); };
El.prototype.removeEventListener = function () {};
El.prototype.querySelectorAll = function () { return []; };
El.prototype.contains = function () { return false; };
El.prototype.focus = function () { doc.activeElement = this; };

var byKey = {};
function mk(key) { var e = new El("stub"); e.id = key; byKey[key] = e; return e; }
var doc = {
  readyState: "complete", activeElement: null, hidden: false, body: new El("body"), documentElement: new El("html"),
  _listeners: {},
  getElementById: function (id) { return byKey[id] || mk(id); },
  querySelector: function (sel) { return byKey["sel:" + sel] || mk("sel:" + sel); },
  querySelectorAll: function () { return []; },
  createElement: function (tag) { return new El(tag); },
  addEventListener: function (t, fn) { (doc._listeners[t] = doc._listeners[t] || []).push(fn); }
};
["info-modal", "stats-modal", "cn-info-modal", "co-info-modal", "pid-info-modal", "c5-info-modal", "gr-info-modal", "cv-info-modal", "pb-info-modal", "oo-info-modal", "hl-info-modal", "rm-info-modal"].forEach(function (id) { var m = mk(id); m.hidden = true; m.appendChild(new El("div")); }); // modals start hidden + need a dialog child

var store = {}, captured = "", reduceMotion = false;
var win = {
  _listeners: {},
  addEventListener: function (t, fn) { (win._listeners[t] = win._listeners[t] || []).push(fn); },
  removeEventListener: function () {},
  matchMedia: function (q) { return { matches: /reduce/.test(q) ? reduceMotion : false }; },
  // URL stub so challenge links (#c=…) can be built and parsed.
  location: { origin: "https://elg.test", pathname: "/", search: "", hash: "", href: "https://elg.test/" },
  history: { replaceState: function (s, t, url) { win.location.hash = (typeof url === "string" && url.indexOf("#") >= 0) ? url.slice(url.indexOf("#")) : ""; } },
  localStorage: {
    getItem: function (k) { return k in store ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  }
};
global.window = win; global.document = doc;
try { Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true, writable: true }); } catch (e) {}
try { navigator.clipboard = { writeText: function (t) { captured = t; return Promise.resolve(); } }; } catch (e) {}

eval(fs.readFileSync("players.js", "utf8"));
eval(fs.readFileSync("legends.js", "utf8"));
eval(fs.readFileSync("careers.js", "utf8"));
eval(fs.readFileSync("lineups.js", "utf8"));
eval(fs.readFileSync("puzzles.js", "utf8"));
eval(fs.readFileSync("oddones.js", "utf8"));
eval(fs.readFileSync("game.js", "utf8"));
eval(fs.readFileSync("playerid.js", "utf8"));
eval(fs.readFileSync("completefive.js", "utf8"));
eval(fs.readFileSync("connections.js", "utf8"));
eval(fs.readFileSync("careerorder.js", "utf8"));
eval(fs.readFileSync("grids.js", "utf8"));
eval(fs.readFileSync("thegrid.js", "utf8"));
eval(fs.readFileSync("clubreveal.js", "utf8"));
eval(fs.readFileSync("paths.js", "utf8"));
eval(fs.readFileSync("pathbetween.js", "utf8"));
eval(fs.readFileSync("oddoneout.js", "utf8"));
eval(fs.readFileSync("higherlower.js", "utf8"));
eval(fs.readFileSync("rostermaster.js", "utf8"));
win.__ELG_NO_WIRE__ = true;   // drive window.Hub directly; skip app.js DOM wiring
eval(fs.readFileSync("app.js", "utf8"));

var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log("  ok   " + m); } else { fail++; console.log("  FAIL " + m); } }
function fire(el, type, ev) { (el._listeners[type] || []).forEach(function (fn) { fn(ev || { preventDefault: function () {}, key: "" }); }); }
function fireWin(type, ev) { (win._listeners[type] || []).forEach(function (fn) { fn(ev || {}); }); }
function fireDoc(type, ev) { (doc._listeners[type] || []).forEach(function (fn) { fn(ev || {}); }); }
function freshEndless() { fire(byId("tab-endless"), "click"); fire(byId("new-game"), "click"); }
function b64urlDecode(t) { var b = String(t).replace(/-/g, "+").replace(/_/g, "/"); while (b.length % 4) b += "="; return Buffer.from(b, "base64").toString("utf8"); }
function b64urlEncode(s) { return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
var byId = doc.getElementById, input = byId("guess-input"), dd = byId("dropdown");
function freshPractice() { fire(byId("tab-practice"), "click"); fire(byId("new-game"), "click"); }
function countOpts(q) {
  input.value = q; fire(input, "input");
  if (dd.hidden) return 0;
  var n = 0; dd.children.forEach(function (c) { if (c.className && c.className.indexOf("option") === 0) n++; });
  return n;
}
function submitByName(name) {
  input.value = name; fire(input, "input");
  var opt = null;
  dd.children.forEach(function (c) { if (!opt && (c._html || "").indexOf(">" + name + "</span>") >= 0) opt = c; });
  if (!opt) return false;
  fire(opt, "pointerdown", { preventDefault: function () {} });
  return true;
}

console.log("data + init");
ok(window.PLAYERS && window.PLAYERS.length === 293, "293 players loaded");
ok(window.LEGENDS && window.LEGENDS.length === 172, "172 legends loaded");
ok(window.LEGENDS.every(function (p) { return ["Guard", "Forward", "Center"].indexOf(p.position) >= 0; }), "all legend positions valid");
ok(window.LEGENDS.every(function (p) { return window.TEAMS[p.team]; }), "every legend team resolves in TEAMS");
ok(window.TEAMS["AS Monaco"] && window.TEAMS["AS Monaco"].country === "France", "AS Monaco counts as France (plays in the French league)");
ok(window.TEAMS["AS Monaco"].country === window.TEAMS["ASVEL"].country, "AS Monaco shares a country with FR clubs → yellow team clue");
ok(window.TEAMS["Dubai BC"] && window.TEAMS["Dubai BC"].country === "ABA League", "Dubai BC counts as ABA League");
ok(window.TEAMS["Dubai BC"].country === window.TEAMS["Crvena Zvezda"].country &&
   window.TEAMS["Crvena Zvezda"].country === window.TEAMS["Partizan"].country, "Dubai groups with Crvena Zvezda + Partizan (ABA → yellow)");
ok(byId("counter").textContent.indexOf("Daily") === 0, "counter shows Daily on load");

console.log("search: basic / accent-insensitive / not-found");
freshPractice();
ok(countOpts("lyles") > 0, "basic search matches");
var nm = window.PLAYERS[0].name, accented = nm.slice(0, 1) + "́" + nm.slice(1);
ok(countOpts(accented) > 0, "diacritic-insensitive search matches " + JSON.stringify(accented));
input.value = "zzzzzzz"; fire(input, "input");
ok(!dd.hidden && dd.children[0].className === "dropdown-empty", "no-match shows hint");
fire(input, "keydown", { key: "Enter", preventDefault: function () {} });
ok(true, "Enter on empty dropdown does not throw (NaN guard)");

console.log("glyphs + a11y labels");
freshPractice();
var saved = JSON.parse(store["elg:game:practice"]);
ok(submitByName(saved.target), "submitted the saved target (win)");
var rc = byId("board").children[0].children[1];
ok(rc.children[0].className === "cell-glyph" && ["✓", "~", "·"].indexOf(rc.children[0].textContent) >= 0, "result cell has a state glyph");
ok(rc.getAttribute("role") === "img" && /(exact|close|no match)/.test(rc.getAttribute("aria-label") || ""), "result cell has state aria-label");
ok((byId("sr-status").textContent || "").indexOf(":") > 0, "guess announced to live region");

console.log("per-mode stats + Practice share");
var ms = JSON.parse(store["elg:mstats:practice"]);
ok(ms.played >= 1 && ms.wins >= 1 && ms.best === 1, "per-mode stats recorded a 1-guess win");
fire(byId("stats-btn"), "click");
captured = "";
fire(byId("share-stats"), "click");
ok(captured.indexOf("EuroLeague Guesser") === 0 && /Practice/.test(captured) && captured.indexOf("1/8") >= 0, "Practice share text correct");
fire(byId("stats-close"), "click");

console.log("hint (Practice only)");
freshPractice();
var hintBtn = byId("hint");
ok(hintBtn.style.display !== "none", "hint visible in Practice");
fire(hintBtn, "click"); fire(hintBtn, "click"); fire(hintBtn, "click"); fire(hintBtn, "click");
ok(byId("hints").children.length === 3 && hintBtn.disabled, "hint reveals up to 3 then disables");
fire(byId("tab-daily"), "click");
ok(byId("hint").style.display === "none", "hint hidden in Daily");

console.log("give-up two-click confirm");
freshPractice();
var gu = byId("give-up");
fire(gu, "click");
ok(gu.textContent === "Sure?", "first click arms");
fire(gu, "click");
ok(gu.textContent === "Give up" && byId("counter").textContent.indexOf("Solved") < 0, "second click ends + resets label");

console.log("hard mode pruning");
freshPractice();
var soft = countOpts("a");
input.value = "a"; fire(input, "input");
if (dd.children[0]) fire(dd.children[0], "pointerdown", { preventDefault: function () {} });
var ht = byId("hard-toggle"); ht.checked = true; fire(ht, "change");
ok(countOpts("a") <= soft, "hard mode never increases the suggestion set");
ht.checked = false; fire(ht, "change");

console.log("legends mode + era filter");
fire(byId("tab-legends"), "click");
ok(byId("era-wrap").hidden === false, "era filter shown in Legends");
ok((byId("era-select")._html || "").indexOf("All eras") >= 0 && /Born in the \d+s/.test(byId("era-select")._html || ""), "era options built from data");
ok(countOpts("sabonis") > 0, "legend search works (Sabonis)");
var es = byId("era-select"); es.value = "1980"; fire(es, "change");
var legSaved = JSON.parse(store["elg:game:legends"]);
var legTarget = window.LEGENDS.filter(function (p) { return p.name === legSaved.target; })[0];
ok(legTarget && Math.floor(legTarget.birthYear / 10) * 10 === 1980, "era filter deals a legend from the chosen decade");
es.value = "all"; fire(es, "change");
fire(byId("tab-practice"), "click");
ok(byId("era-wrap").hidden === true, "era filter hidden outside Legends");

console.log("reduced motion");
reduceMotion = true;
freshPractice();
input.value = "a"; fire(input, "input");
if (dd.children[0]) fire(dd.children[0], "pointerdown", { preventDefault: function () {} });
ok(byId("board").children[0].children[1].classList.contains("flip") === false, "no flip class when reduce-motion is on");
reduceMotion = false;

console.log("stale streak display");
fire(byId("tab-daily"), "click");
store["elg:stats"] = JSON.stringify({ played: 10, wins: 8, curStreak: 5, maxStreak: 9, dist: [0, 1, 2, 3, 1, 1, 0, 0], lastDate: "2020-01-01", lastWon: true, lastGuessCount: 4 });
fire(byId("stats-btn"), "click");
var body = byId("stats-body")._html || "";
ok(body.indexOf("<div class='stat-num'>0</div><div class='stat-lbl'>Streak</div>") >= 0, "stale streak renders as 0");
fire(byId("stats-close"), "click");

console.log("sound/vibration toggle");
var fxchk = byId("fx-toggle");
fxchk.checked = true; fire(fxchk, "change");
ok(store["elg:fx"] === "true", "sound/vibration toggle persists when on");
fxchk.checked = false; fire(fxchk, "change");
ok(store["elg:fx"] === "false", "toggle persists when off");

console.log("endless mode");
fire(byId("tab-endless"), "click");
ok(byId("counter").textContent.indexOf("Endless") === 0, "counter shows Endless");
ok(byId("new-game").style.display === "none", "new game (skip) button hidden in endless");
ok(byId("give-up").style.display !== "none", "give up shown in endless");
delete store["elg:endless"];
freshEndless();
var eSaved = JSON.parse(store["elg:game:endless"]);
ok(submitByName(eSaved.target), "won an endless game");
var er = JSON.parse(store["elg:endless"]);
ok(er.run === 1 && er.best >= 1 && er.wins === 1, "endless run increments on a win");
fire(byId("new-game"), "click");                       // advance to the next player
var egu = byId("give-up"); fire(egu, "click"); fire(egu, "click");  // give up → loss
ok(JSON.parse(store["elg:endless"]).run === 0, "endless run resets to 0 on a loss");
fire(byId("stats-btn"), "click");
ok(/Best run/.test(byId("stats-body")._html || ""), "endless stats show Run + Best run");
fire(byId("stats-close"), "click");

console.log("challenge a friend");
freshPractice();
var cSaved = JSON.parse(store["elg:game:practice"]);
ok(submitByName(cSaved.target), "won a practice game to challenge from");
fire(byId("stats-btn"), "click");
captured = "";
fire(byId("challenge-stats"), "click");
ok(captured.indexOf("#c=") >= 0, "challenge link copied to clipboard");
var ctok = (captured.match(/#c=([^\s]+)/) || [])[1] || "";
ok(b64urlDecode(ctok) === "a:" + cSaved.target, "token encodes the played active player");
fire(byId("stats-close"), "click");
// Opening a #c= link deals exactly that player as a transient challenge.
var legend = window.LEGENDS[0];
var legendsBefore = store["elg:game:legends"];
win.location.hash = "#c=" + b64urlEncode("l:" + legend.name);
fireWin("hashchange");
ok(byId("challenge-note").hidden === false, "challenge note shown when a link is opened");
ok(submitByName(legend.name), "can guess the challenged legend");
ok(store["elg:game:legends"] === legendsBefore, "a challenge never clobbers the saved game");
ok(JSON.parse(store["elg:ach"] || "{}")["challenger"] === true, "winning a challenge unlocks Challenge Accepted");
fire(byId("new-game"), "click");
ok(byId("challenge-note").hidden === true && (win.location.hash || "") === "", "New game exits challenge + clears the hash");

console.log("achievements");
ok(JSON.parse(store["elg:ach"] || "{}")["first-win"] === true, "first win is unlocked");
freshPractice();
var aSaved = JSON.parse(store["elg:game:practice"]);
submitByName(aSaved.target);                            // one-guess win
var abag = JSON.parse(store["elg:ach"]);
ok(abag["bullseye"] === true && abag["sharp"] === true, "a 1-guess win unlocks Bullseye + Sharpshooter");
fire(byId("stats-btn"), "click");
ok((byId("stats-body")._html || "").indexOf("Achievements") >= 0, "achievements section renders in stats");
fire(byId("stats-close"), "click");

console.log("careers data (Player ID)");
ok(window.CAREERS && window.CAREERS.length >= 20, "careers dataset loaded (" + (window.CAREERS || []).length + ")");
ok(window.CAREERS.every(function (c) { return c.career.length >= 1; }), "every career has at least 1 club");
ok(window.CAREERS.filter(function (c) { return c.career.length >= 2; }).length >= 100, "plenty of multi-club careers for Player ID");
ok(window.CAREERS.some(function (c) { return c.active; }) && window.CAREERS.some(function (c) { return !c.active; }), "careers include both active + retired");
var rosterNames = {}; window.PLAYERS.concat(window.LEGENDS).forEach(function (p) { rosterNames[p.name] = 1; });
ok(window.CAREERS.every(function (c) { return rosterNames[c.name]; }), "every career name resolves in the roster");

console.log("careers integrity (consistency invariants)");
var pbRosterTeam = {}; window.PLAYERS.forEach(function (p) { pbRosterTeam[p.name] = p.team; });
var pbBirthOf = {}; window.PLAYERS.concat(window.LEGENDS).forEach(function (p) { pbBirthOf[p.name] = p.birthYear; });
ok(window.CAREERS.filter(function (c) { return c.active; }).every(function (c) {
  var last = c.career[c.career.length - 1];
  return last.to === null && last.team === pbRosterTeam[c.name];
}), "every active career ends open (to:null) at the player's current roster club");
ok(window.CAREERS.filter(function (c) { return !c.active; }).every(function (c) {
  var last = c.career[c.career.length - 1];
  return last.to !== null;
}), "every retired career is fully closed");
ok(window.CAREERS.every(function (c) {
  for (var ci = 0; ci < c.career.length; ci++) {
    var s = c.career[ci];
    if (s.to != null && s.from > s.to) return false;
    if (ci && s.from < c.career[ci - 1].from) return false;
    if (s.to === null && ci !== c.career.length - 1) return false;
  }
  return true;
}), "every career is chronological and only the last stint may be open");
ok(window.CAREERS.every(function (c) {
  var b = pbBirthOf[c.name];
  return !b || c.career.every(function (s) { return s.from >= b + 14; });
}), "no stint starts before age 14");
(function () {
  var variants = ["Elan Chalon", "JSF Nanterre", "Nanterre 92", "CB Estudiantes", "Antibes Sharks",
    "Joventut Badalona", "Buducnost Podgorica", "Baxi Manresa", "Aquila Basket Trento", "Benetton Treviso",
    "Pallacanestro Varese", "Union Olimpija", "Wollongong Hawks", "Mega Vizura", "Mega Basket", "Crvena zvezda", "Valencia Basket"];
  var found = [];
  window.CAREERS.forEach(function (c) { c.career.forEach(function (s) { if (variants.indexOf(s.team) >= 0) found.push(c.name + ":" + s.team); }); });
  ok(found.length === 0, "no known club-name variants survive in careers.js" + (found.length ? " — FOUND " + found.join(", ") : " (normalized at source)"));
})();

console.log("Player ID game");
var pidInput = byId("pid-input"), pidDd = byId("pid-dropdown");
function pidSubmit(name) {
  pidInput.value = name; fire(pidInput, "input");
  var opt = null;
  pidDd.children.forEach(function (c) { if (!opt && (c._html || "").indexOf(">" + name + "</span>") >= 0) opt = c; });
  if (!opt) return false;
  fire(opt, "pointerdown", { preventDefault: function () {} });
  return true;
}
delete store["elg:pid:stats"];
window.PlayerID._setFilter("both");
var pt = window.PlayerID._peek();
ok(pt && pt.career && pt.career.length >= 2, "a player with a career was dealt");
var others = window.PLAYERS.concat(window.LEGENDS).map(function (p) { return p.name; }).filter(function (n) { return n !== pt.name; });
ok(pidSubmit(others[0]), "submitted a wrong guess");
ok(byId("pid-guesses").children.length === 1 && byId("pid-banner").hidden === true && /1 guess left/.test(byId("pid-counter").textContent),
   "1 wrong guess: game continues with 1 left");
pidSubmit(others[1]);
ok(byId("pid-banner").hidden === false, "second wrong guess ends the game (reveal banner)");
ok(JSON.parse(store["elg:pid:stats"]).played >= 1, "Player ID stats recorded the played game");
window.PlayerID._deal();
var pt2 = window.PlayerID._peek();
ok(pidSubmit(pt2.name), "submitted the correct player");
ok(byId("pid-banner").hidden === false, "correct guess ends the game");
var ps = JSON.parse(store["elg:pid:stats"]);
ok(ps.solved >= 1 && ps.curStreak >= 1, "win recorded as solved + streak");
window.PlayerID._setFilter("retired");
ok(window.PlayerID._peek().active === false, "Retired filter deals a retired player");
window.PlayerID._setFilter("active");
ok(window.PlayerID._peek().active === true, "Active filter deals an active player");

console.log("Player ID — Daily");
delete store["elg:pid:dstats"];
window.PlayerID._setFilter("daily");
var dt = window.PlayerID._peek();
ok(dt && dt.career && dt.career.length >= 2, "Daily deals a player");
ok(dt.career.length >= 4, "Daily only deals well-travelled paths (>= 4 clubs)");
ok(byId("pid-next").style.display === "none", "New-player button hidden in Daily (one per day)");
ok(pidSubmit(dt.name), "solved the daily");
var ds = JSON.parse(store["elg:pid:dstats"]);
ok(ds.solved >= 1 && ds.curStreak >= 1 && ds.lastDate, "daily win recorded with streak");
window.PlayerID._setFilter("both");
window.PlayerID._setFilter("daily");
ok(window.PlayerID._peek().name === dt.name && byId("pid-banner").hidden === false, "returning to Daily restores the finished player");

console.log("avatar dropdown");
freshPractice();
input.value = "lyl"; fire(input, "input");
var opt0 = byId("dropdown").children[0];
ok(opt0 && (opt0._html || "").indexOf("opt-avatar") >= 0, "Mystery dropdown renders initials avatars");
window.PlayerID._setFilter("both");
pidInput.value = "a"; fire(pidInput, "input");
var pidOpt0 = pidDd.children[0];
ok(pidOpt0 && (pidOpt0._html || "").indexOf("opt-name") >= 0 && (pidOpt0._html || "").indexOf("opt-team") < 0,
   "Player ID dropdown shows name only (no club clue)");

console.log("Player ID — Space advances");
window.PlayerID._setFilter("both");
var spT = window.PlayerID._peek();
var spO = window.PLAYERS.concat(window.LEGENDS).map(function (p) { return p.name; }).filter(function (n) { return n !== spT.name; });
pidSubmit(spO[0]); pidSubmit(spO[1]);
ok(byId("pid-banner").hidden === false, "practice game over (banner shown)");
fireDoc("keydown", { key: " ", code: "Space", target: doc.body, preventDefault: function () {} });
ok(byId("pid-banner").hidden === true, "Space deals the next player when the game is over");
window.PlayerID._setFilter("daily");
fireDoc("keydown", { key: " ", code: "Space", target: doc.body, preventDefault: function () {} });
ok(true, "Space in Daily does not throw");

console.log("lineups data (Complete the Five)");
ok(window.LINEUPS && window.LINEUPS.length >= 12, "lineups loaded (" + (window.LINEUPS || []).length + ")");
ok(window.LINEUPS.every(function (L) { return L.five.length === 5; }), "every lineup has 5 starters");
ok(window.LINEUPS.every(function (L) { var f = {}; L.five.forEach(function (p) { f[p.fame] = 1; }); return [1, 2, 3, 4, 5].every(function (n) { return f[n]; }); }), "every five has fame ranks 1-5");
var c5seasons = {}; window.LINEUPS.forEach(function (L) { c5seasons[L.season] = 1; });
ok(window.LINEUPS.filter(function (L) { return L.champion; }).length === Object.keys(c5seasons).length, "exactly one champion per season");
ok(window.LINEUPS.every(function (L) { var p = {}; L.five.forEach(function (x) { p[x.pos] = 1; }); return Object.keys(p).length === 5; }), "every five has 5 distinct positions");

console.log("Complete the Five game");
var c5In = byId("c5-input"), c5Dd = byId("c5-dropdown");
function c5Submit(name) {
  c5In.value = name; fire(c5In, "input");
  var opt = null;
  c5Dd.children.forEach(function (c) { if (!opt && (c._html || "").indexOf(">" + name + "</span>") >= 0) opt = c; });
  if (!opt) return false;
  fire(opt, "pointerdown", { preventDefault: function () {} });
  return true;
}
window.CompleteFive._setDiff("easy");
var c5e = window.CompleteFive._peek();
ok(window.LINEUPS.some(function (L) { return L.five.some(function (p) { return p.name === c5e.target && p.fame === 1; }); }), "Easy hides the star (fame 1)");
window.CompleteFive._setDiff("hard");
var c5h = window.CompleteFive._peek();
ok(window.LINEUPS.some(function (L) { return L.five.some(function (p) { return p.name === c5h.target && p.fame >= 4; }); }), "Hard hides an obscure starter (fame 4-5)");
delete store["elg:c5:stats"];
window.CompleteFive._deal();
var c5t = window.CompleteFive._peek();
ok(c5t.hiddenPos && c5t.target, "a five is dealt with a missing starter");
var c5wrong = window.PLAYERS.map(function (p) { return p.name; }).filter(function (n) { return n !== c5t.target; })[0];
c5Submit(c5wrong);
ok(byId("c5-guesses").children.length === 1 && byId("c5-banner").hidden === true, "wrong guess: game continues");
ok(c5Submit(c5t.target), "submitted the correct missing player");
ok(byId("c5-banner").hidden === false, "correct guess ends the game");
ok(JSON.parse(store["elg:c5:stats"]).solved >= 1, "Complete the Five win recorded");
fireDoc("keydown", { key: " ", code: "Space", target: doc.body, preventDefault: function () {} });
ok(byId("c5-banner").hidden === true, "Space deals the next five when over");

console.log("Complete the Five — Daily");
function c5TodayKey() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : "" + n; } return "elg:c5:daily:" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
delete store["elg:c5:dstats"]; delete store[c5TodayKey()];
window.CompleteFive._setDiff("daily");
var cdy = window.CompleteFive._peek();
ok(cdy.target && cdy.hiddenPos, "Daily CT5 deals a five");
ok(byId("c5-next").style.display === "none", "New-five button hidden in Daily (one per day)");
ok(c5Submit(cdy.target), "solved the daily five");
var cds = JSON.parse(store["elg:c5:dstats"]);
ok(cds.solved >= 1 && cds.curStreak >= 1 && cds.lastDate, "daily CT5 win recorded with streak");
window.CompleteFive._setDiff("hard");
window.CompleteFive._setDiff("daily");
ok(window.CompleteFive._peek().target === cdy.target && byId("c5-banner").hidden === false, "returning to Daily restores the finished five");

console.log("Complete the Five — Give up + goDaily hooks");
window.CompleteFive._setDiff("easy");
window.CompleteFive._deal();
ok(byId("c5-giveup").style.display !== "none", "Give up shown in CT5 practice");
fire(byId("c5-giveup"), "click");
ok(byId("c5-banner").hidden === false, "Give up reveals the answer (ends the game)");
window.CompleteFive._setDiff("daily");
ok(byId("c5-giveup").style.display === "none", "Give up hidden in CT5 Daily");
window.CompleteFive.goDaily();
ok(window.CompleteFive._peek().diff === "daily", "CompleteFive.goDaily switches to Daily");
window.PlayerID.goDaily();
ok(byId("pid-counter").textContent.indexOf("Daily") === 0, "PlayerID.goDaily switches to Daily");
window.Mystery.goDaily();
ok(byId("counter").textContent.indexOf("Daily") === 0, "Mystery.goDaily switches to Daily");
window.CompleteFive.goPractice();
ok(window.CompleteFive._peek().diff === "medium", "CompleteFive.goPractice → practice (medium)");
window.PlayerID.goPractice();
ok(byId("pid-counter").textContent.indexOf("Both") === 0, "PlayerID.goPractice → practice (Both)");
window.Mystery.goPractice();
ok(byId("counter").textContent.indexOf("Practice") === 0, "Mystery.goPractice → Practice");

console.log("identity hygiene — no near-duplicate names across data sources");
// One real player spelled two ways (e.g. Victor/Viktor Khryapa, legends vs lineups)
// can appear as two tiles in one Connections puzzle. Guard the whole dataset.
(function () {
  var all = {};
  window.PLAYERS.forEach(function (p) { all[p.name] = 1; });
  window.LEGENDS.forEach(function (p) { all[p.name] = 1; });
  window.CAREERS.forEach(function (c) { all[c.name] = 1; });
  window.LINEUPS.forEach(function (L) { L.five.forEach(function (p) { all[p.name] = 1; }); });
  var names = Object.keys(all);
  function nrm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, ""); }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 9;
    var m = [];
    for (var i = 0; i <= a.length; i++) m[i] = [i];
    for (var j = 1; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  var dupes = [];
  for (var i = 0; i < names.length; i++) for (var j = i + 1; j < names.length; j++) {
    if (lev(nrm(names[i]), nrm(names[j])) <= 1) dupes.push(names[i] + " ~ " + names[j]);
  }
  ok(dupes.length === 0, "no near-duplicate names" + (dupes.length ? " — FOUND: " + dupes.join("; ") : " (" + names.length + " distinct names checked)"));
})();

console.log("puzzles data (Connections)");
ok(window.PUZZLES && window.PUZZLES.length >= 20, "puzzles loaded (" + (window.PUZZLES || []).length + ")");
ok(window.PUZZLES.every(function (p) { return p.groups.length === 4; }), "every puzzle has 4 groups");
ok(window.PUZZLES.every(function (p) { return p.groups.every(function (g) { return g.members.length === 4; }); }), "every group has 4 members");
ok(window.PUZZLES.every(function (p) { var lv = {}; p.groups.forEach(function (g) { lv[g.level] = 1; }); return [1, 2, 3, 4].every(function (n) { return lv[n]; }); }), "every puzzle has levels 1-4");
ok(window.PUZZLES.every(function (p) { var s = {}, t = 0; p.groups.forEach(function (g) { g.members.forEach(function (m) { if (!s[m]) { s[m] = 1; t++; } }); }); return t === 16; }), "every puzzle has 16 distinct names");
var known = {}; window.PLAYERS.concat(window.LEGENDS).forEach(function (p) { known[p.name] = 1; }); window.LINEUPS.forEach(function (L) { L.five.forEach(function (p) { known[p.name] = 1; }); });
ok(window.PUZZLES.every(function (p) { return p.groups.every(function (g) { return g.members.every(function (m) { return known[m]; }); }); }), "every puzzle name resolves to a real player / legend / F4 starter");

console.log("Connections game");
delete store["elg:cn:stats"];
window.Connections._setMode("practice");
var cn = window.Connections._peek();
ok(cn.mode === "practice" && cn.over === false && cn.groups && cn.groups.length === 4, "practice puzzle dealt");
window.Connections._submitNames(cn.groups[0].members);
ok(window.Connections._peek().solved.indexOf(0) >= 0 && window.Connections._peek().mistakes === 0, "correct group solves with no mistake");
window.Connections._submitNames([cn.groups[1].members[0], cn.groups[1].members[1], cn.groups[2].members[0], cn.groups[3].members[0]]);
ok(window.Connections._peek().mistakes === 1 && window.Connections._peek().over === false, "wrong guess costs a mistake, game continues");
window.Connections._submitNames([cn.groups[1].members[0], cn.groups[1].members[1], cn.groups[2].members[0], cn.groups[3].members[0]]);
ok(window.Connections._peek().mistakes === 1, "duplicate guess does not cost another mistake");
window.Connections._submitNames(cn.groups[1].members);
window.Connections._submitNames(cn.groups[2].members);
window.Connections._submitNames(cn.groups[3].members);
var cnw = window.Connections._peek();
ok(cnw.won === true && cnw.over === true && cnw.solved.length === 4, "solving all four groups wins");
ok(JSON.parse(store["elg:cn:stats"]).solved >= 1, "practice win recorded");

console.log("Connections — loss reveals the board");
window.Connections._deal();
var cl = window.Connections._peek(), g = cl.groups;
window.Connections._submitNames([g[0].members[0], g[0].members[1], g[0].members[2], g[1].members[0]]);
ok(window.Connections._peek().over === false, "1 mistake: game continues");
window.Connections._submitNames([g[0].members[0], g[0].members[1], g[0].members[2], g[2].members[0]]);
ok(window.Connections._peek().over === false, "2 mistakes: game continues");
window.Connections._submitNames([g[0].members[0], g[0].members[1], g[0].members[2], g[3].members[0]]);
var cll = window.Connections._peek();
ok(cll.over === true && cll.won === false && cll.mistakes === 3, "3 mistakes ends the game (loss)");
ok(cll.solved.length === 4, "loss reveals all four groups");

console.log("Connections — Daily");
function cnTodayKey() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : "" + n; } return "elg:cn:daily:" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
delete store["elg:cn:dstats"]; delete store[cnTodayKey()];
window.Connections._setMode("daily");
var cd = window.Connections._peek();
ok(cd.mode === "daily" && byId("cn-next").style.display === "none", "Daily deals a puzzle, New-puzzle hidden");
cd.groups.forEach(function (gr) { window.Connections._submitNames(gr.members); });
var cds = window.Connections._peek();
ok(cds.won === true && cds.over === true, "solved the daily");
var cdstats = JSON.parse(store["elg:cn:dstats"]);
ok(cdstats.solved >= 1 && cdstats.curStreak >= 1 && cdstats.lastDate, "daily win recorded with streak");
window.Connections._setMode("practice");
window.Connections._setMode("daily");
ok(window.Connections._peek().over === true, "returning to Daily restores the finished puzzle");

console.log("Connections — Space advances + goDaily/goPractice hooks");
window.Connections._setMode("practice");
window.Connections._peek().groups.forEach(function (gr) { window.Connections._submitNames(gr.members); });
ok(window.Connections._peek().over === true, "practice game finished");
fireDoc("keydown", { key: " ", code: "Space", target: doc.body, preventDefault: function () {} });
ok(window.Connections._peek().over === false, "Space deals a new puzzle when practice game over");
window.Connections.goDaily();
ok(window.Connections._peek().mode === "daily", "Connections.goDaily switches to Daily");
window.Connections.goPractice();
ok(window.Connections._peek().mode === "practice", "Connections.goPractice → practice");

console.log("Connections — how-to modal");
fire(byId("cn-info-btn"), "click");
ok(byId("cn-info-modal").hidden === false, "info button opens the how-to modal");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });
ok(byId("cn-info-modal").hidden === true, "Escape closes the how-to modal");
fire(byId("cn-info-btn"), "click");
fire(byId("cn-info-close"), "click");
ok(byId("cn-info-modal").hidden === true, "close button hides the how-to modal");

console.log("careers suitable for ordering (Career Order)");
ok(window.CAREERS.filter(function (c) { var s = {}; if (c.career.length < 3) return false; for (var i = 0; i < c.career.length; i++) { if (s[c.career[i].team]) return false; s[c.career[i].team] = 1; } return true; }).length >= 20,
   "enough distinct-club careers (>=3 clubs) for Career Order");

console.log("Career Order game");
function idStr(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a.join(","); }
function rot(n) { var a = []; for (var i = 0; i < n; i++) a.push((i + 1) % n); return a; }   // all-wrong permutation
delete store["elg:co:stats"];
window.CareerOrder._setDiff("easy");
var co = window.CareerOrder._peek();
ok(co.name && co.len >= 3 && co.over === false, "Career Order dealt an easy player (" + co.name + ", " + co.len + " clubs)");
ok(co.order.slice().sort(function (a, b) { return a - b; }).join(",") === idStr(co.len), "the shuffled order is a valid permutation");
ok(!co.order.every(function (v, i) { return v === i; }), "clubs start scrambled (not already solved)");
var coRow0 = byId("co-list").children[0];
ok(coRow0 && coRow0.getAttribute("data-oi") != null, "each row carries its original index (data-oi) for drag reorder");
ok(coRow0 && coRow0.children[0] && coRow0.children[0].className === "co-grip", "each row has a drag handle (grip)");
window.CareerOrder._setOrder(rot(co.len));
window.CareerOrder._check();
var c1 = window.CareerOrder._peek();
ok(c1.over === false && c1.tries === 1, "a wrong order costs a check, game continues");
window.CareerOrder._solve();
var c2 = window.CareerOrder._peek();
ok(c2.won === true && c2.over === true, "the correct order wins");
ok(JSON.parse(store["elg:co:stats"]).solved >= 1, "practice win recorded");

console.log("Career Order — anchored greens (3 checks)");
window.CareerOrder._setDiff("easy");
window.CareerOrder._deal();
var cg = window.CareerOrder._peek(), gn = cg.len;
var almost = []; for (var i = 0; i < gn; i++) almost.push(i);            // correct except the last two swapped
var sw = almost[gn - 1]; almost[gn - 1] = almost[gn - 2]; almost[gn - 2] = sw;
window.CareerOrder._setOrder(almost);
window.CareerOrder._check();
var g1 = window.CareerOrder._peek();
ok(g1.confirmed.length === gn - 2 && g1.over === false, "a check locks the correctly-placed clubs green");
window.CareerOrder._move(gn - 1, -1);                                    // move an UNLOCKED club — greens must NOT change
var g2 = window.CareerOrder._peek();
ok(g2.confirmed.length === g1.confirmed.length && g2.confirmed.indexOf(0) >= 0,
   "a green club stays green when OTHER clubs are moved");
window.CareerOrder._move(0, 1);                                          // move the green club at slot 0 itself
var g3 = window.CareerOrder._peek();
ok(g3.confirmed.length === g2.confirmed.length - 1 && g3.confirmed.indexOf(0) < 0,
   "moving a green club clears ONLY that club's green");

console.log("Career Order — running out of checks loses (3 checks)");
window.CareerOrder._deal();
var cl = window.CareerOrder._peek(), m = cl.len;
for (var kk = 0; kk < 12 && !window.CareerOrder._peek().over; kk++) { window.CareerOrder._setOrder(rot(m)); window.CareerOrder._check(); }
var clp = window.CareerOrder._peek();
ok(clp.over === true && clp.won === false && clp.tries === 3, "loss after exactly 3 wrong checks");

console.log("Career Order — Daily");
function coTodayKey() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : "" + n; } return "elg:co:daily:" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
delete store["elg:co:dstats"]; delete store[coTodayKey()];
window.CareerOrder._setDiff("daily");
var cd = window.CareerOrder._peek();
ok(cd.name && byId("co-next").style.display === "none", "Daily deals a player, New-player hidden");
window.CareerOrder._solve();
var cds = JSON.parse(store["elg:co:dstats"]);
ok(cds.solved >= 1 && cds.curStreak >= 1 && cds.lastDate, "daily win recorded with streak");
window.CareerOrder._setDiff("easy");
window.CareerOrder._setDiff("daily");
ok(window.CareerOrder._peek().over === true, "returning to Daily restores the finished player");

console.log("Career Order — Give up + Space + hooks");
window.CareerOrder._setDiff("easy");
window.CareerOrder._deal();
ok(byId("co-giveup").style.display !== "none", "Give up shown in practice");
fire(byId("co-giveup"), "click");
ok(window.CareerOrder._peek().over === true && window.CareerOrder._peek().won === false, "Give up reveals the answer (loss)");
window.CareerOrder._setDiff("daily");
ok(byId("co-giveup").style.display === "none", "Give up hidden in Daily");
window.CareerOrder._setDiff("easy");
window.CareerOrder._solve();
ok(window.CareerOrder._peek().over === true, "practice game finished");
fireDoc("keydown", { key: " ", code: "Space", target: doc.body, preventDefault: function () {} });
ok(window.CareerOrder._peek().over === false, "Space deals a new player when practice game over");
window.CareerOrder.goDaily();
ok(window.CareerOrder._peek().diff === "daily", "CareerOrder.goDaily → daily");
window.CareerOrder.goPractice();
ok(window.CareerOrder._peek().diff === "medium", "CareerOrder.goPractice → medium");

console.log("Career Order — how-to modal");
fire(byId("co-info-btn"), "click");
ok(byId("co-info-modal").hidden === false, "info button opens the how-to modal");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });
ok(byId("co-info-modal").hidden === true, "Escape closes the how-to modal");

console.log("already-guessed dropdown hint");
freshPractice();
var agSaved = JSON.parse(store["elg:game:practice"]);
var agName = window.PLAYERS.map(function (p) { return p.name; }).filter(function (n) {
  return n !== agSaved.target && window.PLAYERS.every(function (q) { return q.name === n || q.name.toLowerCase().indexOf(n.toLowerCase()) < 0; });
})[0];
ok(submitByName(agName), "made a wrong guess to re-type");
input.value = agName; fire(input, "input");
ok(!dd.hidden && dd.children[0].className === "dropdown-empty" && /Already guessed/.test(dd.children[0].textContent),
   "re-typing a guessed name explains it was already guessed");

console.log("Player ID — how-to modal + first-visit help");
delete store["elg:pid:seenhelp"];
window.PlayerID.onShow();
ok(byId("pid-info-modal").hidden === false, "first onShow auto-opens the how-to");
ok(store["elg:pid:seenhelp"] === "true", "help marked as seen");
fire(byId("pid-info-close"), "click");
ok(byId("pid-info-modal").hidden === true, "close button hides it");
window.PlayerID.onShow();
ok(byId("pid-info-modal").hidden === true, "second onShow stays quiet");
fire(byId("pid-info-btn"), "click");
ok(byId("pid-info-modal").hidden === false, "info button re-opens it manually");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });
ok(byId("pid-info-modal").hidden === true, "Escape closes it");

console.log("Complete the Five — how-to modal + first-visit help");
delete store["elg:c5:seenhelp"];
window.CompleteFive.onShow();
ok(byId("c5-info-modal").hidden === false, "first onShow auto-opens the how-to");
fire(byId("c5-info-close"), "click");
window.CompleteFive.onShow();
ok(byId("c5-info-modal").hidden === true, "second onShow stays quiet");
fire(byId("c5-info-btn"), "click");
ok(byId("c5-info-modal").hidden === false, "info button re-opens it manually");
fire(byId("c5-info-close"), "click");

console.log("Mystery — first-visit help");
delete store["elg:seenhelp"];
window.Mystery.onShow();
ok(byId("info-modal").hidden === false, "first onShow auto-opens the how-to");
fire(byId("info-close"), "click");
window.Mystery.onShow();
ok(byId("info-modal").hidden === true, "second onShow stays quiet");

console.log("grids data (The Grid)");
ok(window.GRIDS && window.GRIDS.length >= 30, "grids loaded (" + (window.GRIDS || []).length + ")");
ok(window.GRIDS.every(function (g) { return g.rows.length === 3 && g.cols.length === 3; }), "every grid has 3 rows + 3 cols");
ok(window.GRIDS.every(function (g) { return g.rows.every(function (c) { return c.t === "club"; }); }), "rows are always clubs");
ok(window.GRIDS.every(function (g) {
  var vals = {}; return g.rows.concat(g.cols).every(function (c) { var k = c.t + ":" + c.v; if (vals[k]) return false; vals[k] = 1; return true; });
}), "no repeated criterion on one board");
ok(window.GRIDS.every(function (g) {
  return g.rows.every(function (r) { return g.cols.every(function (c) { return window.TheGrid._answers(r, c).length >= 2; }); });
}), "every cell of every grid has at least 2 known answers");
// each board must be fillable with 9 DISTINCT players (players can be used once)
function grDistinctFill(g) {
  var cellAns = [];
  g.rows.forEach(function (r) { g.cols.forEach(function (c) { cellAns.push(window.TheGrid._answers(r, c)); }); });
  cellAns.sort(function (a, b) { return a.length - b.length; });
  var taken = {};
  function bt(k) {
    if (k === cellAns.length) return true;
    for (var i = 0; i < cellAns[k].length; i++) {
      var n = cellAns[k][i];
      if (taken[n]) continue;
      taken[n] = 1;
      if (bt(k + 1)) return true;
      delete taken[n];
    }
    return false;
  }
  return bt(0);
}
ok(window.GRIDS.every(grDistinctFill), "every grid is fillable with 9 distinct players");

console.log("The Grid game");
// distinct assignment of one answer per cell, used to actually solve a board
function grAssignment(g) {
  var cells = [];
  g.rows.forEach(function (r) { g.cols.forEach(function (c) { cells.push(window.TheGrid._answers(r, c)); }); });
  var order = cells.map(function (a, i) { return { i: i, a: a }; }).sort(function (x, y) { return x.a.length - y.a.length; });
  var taken = {}, out = [];
  function bt(k) {
    if (k === order.length) return true;
    for (var i = 0; i < order[k].a.length; i++) {
      var n = order[k].a[i];
      if (taken[n]) continue;
      taken[n] = 1; out[order[k].i] = n;
      if (bt(k + 1)) return true;
      delete taken[n]; out[order[k].i] = null;
    }
    return false;
  }
  bt(0);
  return out;
}
delete store["elg:gr:stats"];
window.TheGrid._setMode("practice");
var gr = window.TheGrid._peek();
ok(gr.mode === "practice" && gr.over === false && gr.puzzle && gr.left === 12, "practice grid dealt with 12 guesses");
ok(gr.selected === 0, "first empty cell auto-selected");
var grU = window.TheGrid._universe();
var grBad = null;
for (var grN in grU) { if (!window.TheGrid._fits(grN, gr.puzzle.rows[0]) && !window.TheGrid._fits(grN, gr.puzzle.cols[0])) { grBad = grN; break; } }
window.TheGrid._submit(grBad);
var gr1 = window.TheGrid._peek();
ok(gr1.left === 11 && gr1.wrong === 1 && !gr1.cells[0], "a miss burns a guess, cell stays empty");
var grAns = grAssignment(gr.puzzle);
ok(grAns.every(function (n) { return !!n; }), "test found a distinct 9-player fill");
window.TheGrid._select(0);
window.TheGrid._submit(grAns[0]);
var gr2 = window.TheGrid._peek();
ok(gr2.cells[0] && gr2.cells[0].name === grAns[0] && gr2.left === 10, "a fitting player fills the cell (and costs a guess)");
window.TheGrid._select(1);
window.TheGrid._submit(grAns[0]);
var gr2b = window.TheGrid._peek();
ok(gr2b.left === 10 && !gr2b.cells[1], "a name already on the board does not burn a guess");
for (var gi = 1; gi < 9; gi++) { window.TheGrid._select(gi); window.TheGrid._submit(grAns[gi]); }
var gr3 = window.TheGrid._peek();
ok(gr3.over === true && gr3.won === true, "filling all 9 cells wins");
ok(JSON.parse(store["elg:gr:stats"]).solved >= 1, "practice win recorded");
fireDoc("keydown", { key: " ", code: "Space", target: doc.body, preventDefault: function () {} });
ok(window.TheGrid._peek().over === false, "Space deals a new grid when practice game over");

console.log("The Grid — remembers misses per cell");
window.TheGrid._deal();
var grm = window.TheGrid._peek(), grmBad = null;
for (var grmN in grU) { if (!window.TheGrid._fits(grmN, grm.puzzle.rows[0]) && !window.TheGrid._fits(grmN, grm.puzzle.cols[0])) { grmBad = grmN; break; } }
window.TheGrid._select(0);
window.TheGrid._submit(grmBad);
ok(window.TheGrid._peek().misses[0].indexOf(grmBad) >= 0, "a wrong guess is remembered on its cell");
window.TheGrid._select(1);
ok(byId("gr-flash").textContent.indexOf(grmBad) < 0, "switching cells clears the miss reminder");
window.TheGrid._select(0);
ok(byId("gr-flash").textContent.indexOf(grmBad) >= 0, "returning to the cell shows what was tried there");

console.log("The Grid — losing reveals answers");
window.TheGrid._deal();
var grl = window.TheGrid._peek(), grlBad = null;
for (var grM in grU) { if (!window.TheGrid._fits(grM, grl.puzzle.rows[0]) && !window.TheGrid._fits(grM, grl.puzzle.cols[0])) { grlBad = grM; break; } }
var grlPool = Object.keys(grU).filter(function (n) { return !window.TheGrid._fits(n, grl.puzzle.rows[0]) || !window.TheGrid._fits(n, grl.puzzle.cols[0]); });
for (var gk = 0; gk < 12; gk++) { window.TheGrid._select(0); window.TheGrid._submit(grlPool[gk]); }
var grl2 = window.TheGrid._peek();
ok(grl2.over === true && grl2.won === false && grl2.left === 0, "12 misses end the game (loss)");
ok(grl2.cells.every(function (c) { return !!c; }), "loss reveals an answer in every empty cell");

console.log("The Grid — Give up (practice only)");
window.TheGrid._deal();
ok(byId("gr-giveup").style.display !== "none", "Give up shown in practice");
fire(byId("gr-giveup"), "click");
ok(window.TheGrid._peek().over === true && window.TheGrid._peek().won === false, "Give up ends the game (loss)");

console.log("The Grid — Daily");
function grTodayKey() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : "" + n; } return "elg:gr:daily:" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
delete store["elg:gr:dstats"]; delete store[grTodayKey()];
window.TheGrid._setMode("daily");
var grd = window.TheGrid._peek();
ok(grd.mode === "daily" && grd.puzzle && grd.over === false, "Daily deals a grid");
ok(byId("gr-next").style.display === "none" && byId("gr-giveup").style.display === "none", "New-grid + Give-up hidden in Daily");
var grdAns = grAssignment(grd.puzzle);
for (var gd = 0; gd < 9; gd++) { window.TheGrid._select(gd); window.TheGrid._submit(grdAns[gd]); }
ok(window.TheGrid._peek().won === true, "solved the daily grid");
var grds = JSON.parse(store["elg:gr:dstats"]);
ok(grds.solved >= 1 && grds.curStreak >= 1 && grds.lastDate, "daily win recorded with streak");
window.TheGrid._setMode("practice");
window.TheGrid._setMode("daily");
ok(window.TheGrid._peek().over === true && window.TheGrid._peek().won === true, "returning to Daily restores the finished grid");
window.TheGrid.goPractice();
ok(window.TheGrid._peek().mode === "practice", "TheGrid.goPractice → practice");
window.TheGrid.goDaily();
ok(window.TheGrid._peek().mode === "daily", "TheGrid.goDaily → daily");

console.log("The Grid — how-to modal + first-visit help");
delete store["elg:gr:seenhelp"];
window.TheGrid.onShow();
ok(byId("gr-info-modal").hidden === false, "first onShow auto-opens the how-to");
fire(byId("gr-info-close"), "click");
window.TheGrid.onShow();
ok(byId("gr-info-modal").hidden === true, "second onShow stays quiet");
fire(byId("gr-info-btn"), "click");
ok(byId("gr-info-modal").hidden === false, "info button re-opens it manually");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });
ok(byId("gr-info-modal").hidden === true, "Escape closes it");

console.log("Club Reveal — pools + reveal order");
var cvPools = window.ClubReveal._pools();
ok(Object.keys(cvPools.active).length >= 18, "active pool has all current clubs (" + Object.keys(cvPools.active).length + ")");
ok(Object.keys(cvPools.active).every(function (c) { return cvPools.active[c].length >= 6; }), "every current roster has at least 6 players");
ok(Object.keys(cvPools.legends).length >= 10, "legends pool has enough clubs (" + Object.keys(cvPools.legends).length + ")");
ok(Object.keys(cvPools.legends).every(function (c) { return cvPools.legends[c].length >= 4; }), "every legends club has at least 4 names");

console.log("Club Reveal — game flow");
delete store["elg:cv:stats"];
window.ClubReveal._setMode("active");
var cv = window.ClubReveal._peek();
ok(cv.club && cv.order.length >= 6 && cv.revealed === 1 && cv.over === false, "a club is dealt with one name showing");
ok(window.ClubReveal._recog(cv.order[0].name) <= window.ClubReveal._recog(cv.order[cv.order.length - 1].name),
   "reveal order is obscure-first (first name no more famous than last)");
window.ClubReveal._reveal();
ok(window.ClubReveal._peek().revealed === 2, "Reveal next shows another name (free)");
var cvWrong = Object.keys(cvPools.active).filter(function (c) { return c !== cv.club; });
window.ClubReveal._guess(cvWrong[0]);
var cv2 = window.ClubReveal._peek();
ok(cv2.guesses.length === 1 && cv2.revealed === 3 && cv2.over === false, "a wrong guess burns a life AND forces a reveal");
window.ClubReveal._guess(cvWrong[0]);
ok(window.ClubReveal._peek().guesses.length === 1, "repeating the same wrong club costs nothing");
window.ClubReveal._guess(cv.club);
var cv3 = window.ClubReveal._peek();
ok(cv3.over === true && cv3.won === true, "naming the club wins");
ok(JSON.parse(store["elg:cv:stats"]).solved >= 1, "practice win recorded");
fireDoc("keydown", { key: " ", code: "Space", target: doc.body, preventDefault: function () {} });
ok(window.ClubReveal._peek().over === false, "Space deals the next club when practice game over");
var cvL = window.ClubReveal._peek();
var cvLwrong = Object.keys(cvPools.active).filter(function (c) { return c !== cvL.club; });
window.ClubReveal._guess(cvLwrong[0]); window.ClubReveal._guess(cvLwrong[1]); window.ClubReveal._guess(cvLwrong[2]);
var cvL2 = window.ClubReveal._peek();
ok(cvL2.over === true && cvL2.won === false, "three wrong guesses lose");
fire(byId("cv-next"), "click");
fire(byId("cv-giveup"), "click");
ok(window.ClubReveal._peek().over === true && window.ClubReveal._peek().won === false, "Give up ends the round (loss)");
window.ClubReveal._setMode("legends");
var cvLeg = window.ClubReveal._peek();
ok(cvPools.legends[cvLeg.club] && cvPools.legends[cvLeg.club].some(function (p) { return p.name === cvLeg.order[0].name; }),
   "Legends mode deals a club's retired greats");

console.log("Club Reveal — Daily");
function cvTodayKey() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : "" + n; } return "elg:cv:daily:" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
delete store["elg:cv:dstats"]; delete store[cvTodayKey()];
window.ClubReveal._setMode("daily");
var cvd = window.ClubReveal._peek();
ok(cvd.club && cvd.revealed === 1 && cvd.over === false, "Daily deals a club");
ok(byId("cv-next").style.display === "none" && byId("cv-giveup").style.display === "none", "New-club + Give-up hidden in Daily");
window.ClubReveal._setMode("active");
window.ClubReveal._setMode("daily");
ok(window.ClubReveal._peek().club === cvd.club, "Daily is deterministic (same club on re-deal)");
window.ClubReveal._guess(cvd.club);
ok(window.ClubReveal._peek().won === true, "solved the daily");
var cvds = JSON.parse(store["elg:cv:dstats"]);
ok(cvds.solved >= 1 && cvds.curStreak >= 1 && cvds.lastDate, "daily win recorded with streak");
window.ClubReveal._setMode("active");
window.ClubReveal._setMode("daily");
ok(window.ClubReveal._peek().over === true && window.ClubReveal._peek().won === true, "returning to Daily restores the finished round");
window.ClubReveal.goPractice();
ok(window.ClubReveal._peek().mode === "both", "ClubReveal.goPractice → Both");
window.ClubReveal.goDaily();
ok(window.ClubReveal._peek().mode === "daily", "ClubReveal.goDaily → daily");
window.ClubReveal._setMode("both");
var cvB = window.ClubReveal._peek();
ok(!!(cvPools.active[cvB.club] || cvPools.legends[cvB.club]), "Both mode deals from either pool");
ok(cvB.over === false && cvB.revealed === 1, "Both round starts fresh with one name");

console.log("Club Reveal — how-to modal + first-visit help");
delete store["elg:cv:seenhelp"];
window.ClubReveal.onShow();
ok(byId("cv-info-modal").hidden === false, "first onShow auto-opens the how-to");
fire(byId("cv-info-close"), "click");
window.ClubReveal.onShow();
ok(byId("cv-info-modal").hidden === true, "second onShow stays quiet");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });

console.log("paths data (Path Between)");
ok(window.PATHS && window.PATHS.length >= 100, "paths loaded (" + (window.PATHS || []).length + ")");
ok(window.PATHS.every(function (p) { return p.a && p.b && p.a !== p.b && [2, 3, 4].indexOf(p.par) >= 0; }), "every puzzle has two distinct endpoints + par 2-4");
var pbCareerNames = {}; window.CAREERS.forEach(function (c) { pbCareerNames[c.name] = 1; });
ok(window.PATHS.every(function (p) { return pbCareerNames[p.a] && pbCareerNames[p.b]; }), "every endpoint resolves in careers.js");
ok(window.PATHS.every(function (p) { return !window.PathBetween._link(p.a, p.b); }), "no pair is direct teammates (par >= 2 by construction)");
ok(window.PATHS.every(function (p) { return window.PathBetween._bfs(p.a).dist[p.b] === p.par; }), "every stored par matches an independent BFS re-check");
(function () {
  var sigs = {}, dup = false;
  window.PATHS.forEach(function (p) { var s = [p.a, p.b].sort().join("|"); if (sigs[s]) dup = true; sigs[s] = 1; });
  ok(!dup, "no duplicate pairs across the bands");
})();
var pbPools = window.PathBetween._pools();
ok(pbPools[2].length >= 30 && pbPools[3].length >= 50 && pbPools[4].length >= 20,
   "all bands populated (easy " + pbPools[2].length + ", medium " + pbPools[3].length + ", hard " + pbPools[4].length + ")");

console.log("teammate graph (Path Between)");
ok(window.PathBetween._link("Nicolas Laprovittola", "Juancho Hernangomez") != null,
   "club aliases merge stored name variants (Estudiantes = CB Estudiantes)");
ok(window.PathBetween._link("Kostas Sloukas", "Jan Vesely") != null, "overlapping years at one club → teammates (Fenerbahce)");
ok(window.PathBetween._link("Kostas Sloukas", "Evan Fournier") == null, "same club in different eras → NOT teammates (Olympiacos)");
(function () {
  var names = window.CAREERS.map(function (c) { return c.name; });
  var sym = names.every(function (a) {
    return window.PathBetween._teammates(a).every(function (b) { return window.PathBetween._teammates(b).indexOf(a) >= 0; });
  });
  ok(sym, "teammate graph is symmetric");
})();

console.log("Path Between game");
var pbInput = byId("pb-input"), pbDd = byId("pb-dropdown");
function pbSubmit(name) {
  pbInput.value = name; fire(pbInput, "input");
  var opt = null;
  pbDd.children.forEach(function (c) { if (!opt && (c._html || "").indexOf(">" + name + "</span>") >= 0) opt = c; });
  if (!opt) return false;
  fire(opt, "pointerdown", { preventDefault: function () {} });
  return true;
}
delete store["elg:pb:stats"];
window.PathBetween._setMode("easy");
var pb = window.PathBetween._peek();
ok(pb.mode === "easy" && pb.par === 2 && pb.left === 5 && pb.chain.length === 1 && pb.chain[0] === pb.a,
   "easy pair dealt: par 2 → 5 guesses, chain starts at A");
var pbRoute = window.PathBetween._route(pb.a, pb.b);
ok(pbRoute && pbRoute.length === pb.par + 1 && pbRoute[0] === pb.a && pbRoute[pbRoute.length - 1] === pb.b,
   "_route returns a shortest chain A→…→B");
var pbAdjA = {}; window.PathBetween._teammates(pb.a).forEach(function (n) { pbAdjA[n] = 1; });
var pbBad = window.CAREERS.map(function (c) { return c.name; }).filter(function (n) { return n !== pb.a && n !== pb.b && !pbAdjA[n]; })[0];
ok(pbSubmit(pbBad), "submitted a non-teammate through the dropdown");
var pb1 = window.PathBetween._peek();
ok(pb1.left === 4 && pb1.wrong === 1 && pb1.chain.length === 1 && pb1.misses.indexOf(pbBad) >= 0,
   "a miss burns a guess, chain unchanged, miss remembered");
window.PathBetween._guess(pb.a);
ok(window.PathBetween._peek().left === 4, "re-guessing a player already in the chain costs nothing");
ok(pbSubmit(pbRoute[1]), "linked the first hop through the dropdown");
var pb2 = window.PathBetween._peek();
ok(pb2.chain.length === 2 && pb2.chain[1] === pbRoute[1] && pb2.left === 3 && pb2.misses.length === 0,
   "a valid link extends the chain (costs a guess, clears the miss list)");
window.PathBetween._guess(pbRoute[2]);
var pb3 = window.PathBetween._peek();
ok(pb3.over === true && pb3.won === true, "reaching the target wins");
ok(JSON.parse(store["elg:pb:stats"]).solved >= 1, "practice win recorded");
fireDoc("keydown", { key: " ", code: "Space", target: doc.body, preventDefault: function () {} });
ok(window.PathBetween._peek().over === false, "Space deals a new pair when practice game over");

console.log("Path Between — running out of guesses loses");
window.PathBetween._deal();
var pbl = window.PathBetween._peek();
var pblAdj = {}; window.PathBetween._teammates(pbl.a).forEach(function (n) { pblAdj[n] = 1; });
var pblBads = window.CAREERS.map(function (c) { return c.name; }).filter(function (n) { return n !== pbl.a && n !== pbl.b && !pblAdj[n]; });
for (var pk = 0; pk < 12 && !window.PathBetween._peek().over; pk++) window.PathBetween._guess(pblBads[pk]);
var pbl2 = window.PathBetween._peek();
ok(pbl2.over === true && pbl2.won === false && pbl2.left === 0, "misses drain the budget → loss");
var pbSubEl = byId("pb-banner").children[1];
ok(pbSubEl && (pbSubEl._html || "").indexOf("One route:") >= 0, "loss banner reveals a shortest route");

console.log("Path Between — Give up + hooks");
window.PathBetween._deal();
ok(byId("pb-giveup").style.display !== "none", "Give up shown in practice");
fire(byId("pb-giveup"), "click");
ok(window.PathBetween._peek().over === true && window.PathBetween._peek().won === false, "Give up ends the round (loss)");
window.PathBetween.goDaily();
ok(window.PathBetween._peek().mode === "daily", "PathBetween.goDaily → daily");
window.PathBetween.goPractice();
ok(window.PathBetween._peek().mode === "medium", "PathBetween.goPractice → medium");

console.log("Path Between — Daily");
function pbTodayKey() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : "" + n; } return "elg:pb:daily:" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
delete store["elg:pb:dstats"]; delete store[pbTodayKey()];
window.PathBetween._setMode("daily");
var pbd = window.PathBetween._peek();
ok(pbd.mode === "daily" && pbd.par === 3 && pbd.over === false, "Daily deals a par-3 pair");
ok(byId("pb-next").style.display === "none" && byId("pb-giveup").style.display === "none", "New-pair + Give-up hidden in Daily");
window.PathBetween._setMode("medium");
window.PathBetween._setMode("daily");
ok(window.PathBetween._peek().a === pbd.a && window.PathBetween._peek().b === pbd.b, "Daily is deterministic (same pair on re-deal)");
var pbdR = window.PathBetween._route(pbd.a, pbd.b);
for (var pd = 1; pd < pbdR.length; pd++) window.PathBetween._guess(pbdR[pd]);
ok(window.PathBetween._peek().won === true, "solved the daily");
var pbds = JSON.parse(store["elg:pb:dstats"]);
ok(pbds.solved >= 1 && pbds.curStreak >= 1 && pbds.lastDate, "daily win recorded with streak");
var pbSaved = JSON.parse(store[pbTodayKey()]);
ok(pbSaved.done === true && pbSaved.won === true, "daily state saved in the shape the hub chip reads");
window.PathBetween._setMode("medium");
window.PathBetween._setMode("daily");
ok(window.PathBetween._peek().over === true && window.PathBetween._peek().won === true, "returning to Daily restores the finished pair");

console.log("Path Between — how-to modal + first-visit help");
delete store["elg:pb:seenhelp"];
window.PathBetween.onShow();
ok(byId("pb-info-modal").hidden === false, "first onShow auto-opens the how-to");
fire(byId("pb-info-close"), "click");
window.PathBetween.onShow();
ok(byId("pb-info-modal").hidden === true, "second onShow stays quiet");
fire(byId("pb-info-btn"), "click");
ok(byId("pb-info-modal").hidden === false, "info button re-opens it manually");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });
ok(byId("pb-info-modal").hidden === true, "Escape closes it");

console.log("oddones data (Odd One Out)");
ok(window.ODDONES && window.ODDONES.length >= 40, "odd-one-out rounds loaded (" + (window.ODDONES || []).length + ")");
ok(window.ODDONES.every(function (r) { return r.names.length === 4 && r.names.indexOf(r.odd) >= 0; }), "every round has 4 names incl. the odd one");
ok(window.ODDONES.every(function (r) { var s = {}; return r.names.every(function (n) { if (s[n]) return false; s[n] = 1; return true; }); }), "every round has 4 distinct names");
ok(window.ODDONES.every(function (r) { return r.theme && r.axis; }), "every round has a theme + axis");
(function () {   // re-verify the whole fairness guarantee: the odd one must be uniquely determined
  var PROF = {}; window.PLAYERS.concat(window.LEGENDS).forEach(function (p) { if (!PROF[p.name]) PROF[p.name] = p; });
  var CB = {}; window.CAREERS.forEach(function (c) { CB[c.name] = c; });
  var LU = window.LINEUPS;
  function playedFor(n, c) { var x = CB[n]; return !!(x && x.career.some(function (e) { return e.team === c; })); }
  function clubsOf(n) { var x = CB[n], s = {}, o = []; if (!x) return o; x.career.forEach(function (e) { if (!s[e.team]) { s[e.team] = 1; o.push(e.team); } }); return o; }
  function inFive(n, L) { return L.five.some(function (p) { return p.name === n; }); }
  function dec(n) { return PROF[n] ? Math.floor(PROF[n].birthYear / 10) * 10 : null; }
  function exVal(S, f) { var by = {}; S.forEach(function (n) { var k = f(n); if (k == null) return; (by[k] = by[k] || []).push(n); }); var o = []; Object.keys(by).forEach(function (k) { if (by[k].length === 3) o.push(S.filter(function (n) { return by[k].indexOf(n) < 0; })[0]); }); return o; }
  function exMem(S, m) { var i = S.filter(m); return i.length === 3 ? [S.filter(function (n) { return i.indexOf(n) < 0; })[0]] : []; }
  function allEx(S) {
    var e = exVal(S, function (n) { return PROF[n].nationality; }).concat(exVal(S, function (n) { return PROF[n].position; }), exVal(S, function (n) { return dec(n); }), exVal(S, function (n) { return PROF[n].number; }));
    var cs = {}; S.forEach(function (n) { clubsOf(n).forEach(function (c) { cs[c] = 1; }); });
    Object.keys(cs).forEach(function (c) { e = e.concat(exMem(S, function (n) { return playedFor(n, c); })); });
    LU.forEach(function (L) { e = e.concat(exMem(S, function (n) { return inFive(n, L); })); });
    return e;
  }
  ok(window.ODDONES.every(function (r) { return r.names.every(function (n) { return PROF[n] && CB[n]; }); }), "every name has a full profile + career (facts verifiable)");
  var bad = 0;
  window.ODDONES.forEach(function (r) { var ex = allEx(r.names); if (!(ex.length > 0 && ex.every(function (n) { return n === r.odd; }))) bad++; });
  ok(bad === 0, "every round's odd one is uniquely determined (no ambiguity)");
})();

console.log("Odd One Out game — Practice");
delete store["elg:oo:stats"];
window.OddOneOut._setMode("practice");
var oo = window.OddOneOut._peek();
ok(oo.mode === "practice" && oo.over === false && oo.revealed === false && oo.round, "practice round dealt");
window.OddOneOut._pick(oo.round.odd);
var oow = window.OddOneOut._peek();
ok(oow.revealed === true && oow.won === true && oow.results[0] === true, "tapping the odd one reveals the reason (round won)");
ok(byId("oo-reveal").hidden === false && byId("oo-reveal").innerHTML.indexOf(oo.round.odd) >= 0, "correct pick shows the connection");
ok(JSON.parse(store["elg:oo:stats"]).correct >= 1, "practice correct recorded");
window.OddOneOut._deal();
var oo2 = window.OddOneOut._peek();
var ooWrong = oo2.round.names.filter(function (n) { return n !== oo2.round.odd; })[0];
window.OddOneOut._pick(ooWrong);
var ool = window.OddOneOut._peek();
ok(ool.results[0] === false && ool.won === false && ool.revealed === true, "tapping a belonger loses the round");
ok(byId("oo-reveal").hidden === false && byId("oo-reveal").innerHTML.indexOf(oo2.round.odd) >= 0, "WRONG practice pick still shows the reason (the connection)");

console.log("Odd One Out — Daily");
function ooTodayKey() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : "" + n; } return "elg:oo:daily:" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
delete store["elg:oo:dstats"]; delete store[ooTodayKey()];
window.OddOneOut._setMode("daily");
var od = window.OddOneOut._peek();
ok(od.mode === "daily" && od.over === false && od.results.length === 0, "Daily starts at round 1 of 5");
for (var ooI = 0; ooI < 5; ooI++) { var opk = window.OddOneOut._peek(); window.OddOneOut._pick(opk.round.odd); window.OddOneOut._next(); }
var odf = window.OddOneOut._peek();
ok(odf.over === true && odf.won === true && odf.results.length === 5, "playing all five perfectly wins the Daily");
ok(JSON.parse(store[ooTodayKey()]).done === true, "Daily saved as done (feeds hub streak)");
ok(JSON.parse(store["elg:oo:dstats"]).solved >= 1, "Daily solve recorded");
window.OddOneOut._setMode("practice");
window.OddOneOut._setMode("daily");
ok(window.OddOneOut._peek().over === true, "returning to Daily restores the finished round");

console.log("Odd One Out — hooks + how-to modal");
window.OddOneOut.goPractice();
ok(window.OddOneOut._peek().mode === "practice", "goPractice → practice");
window.OddOneOut.goDaily();
ok(window.OddOneOut._peek().mode === "daily", "goDaily → daily");
delete store["elg:oo:seenhelp"];
window.OddOneOut.onShow();
ok(byId("oo-info-modal").hidden === false, "first onShow auto-opens the how-to");
fire(byId("oo-info-close"), "click");
window.OddOneOut.onShow();
ok(byId("oo-info-modal").hidden === true, "second onShow stays quiet");
fire(byId("oo-info-btn"), "click");
ok(byId("oo-info-modal").hidden === false, "info button re-opens it manually");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });
ok(byId("oo-info-modal").hidden === true, "Escape closes it");
delete store[ooTodayKey()];   // don't leak a finished daily into the hub-streak block

console.log("Higher or Lower — pool + endless");
(function () {
  var seen = {}, n = 0;
  window.PLAYERS.concat(window.LEGENDS).forEach(function (p) {
    if (seen[p.name]) return; seen[p.name] = 1;
    if (typeof p.height === "number" && typeof p.birthYear === "number" && typeof p.number === "number") n++;
  });
  ok(n >= 100, "fully-profiled pool for all three questions (" + n + ")");
})();
function hlWinIdx(m) { return ((m.wins === "higher") === (m.aVal > m.bVal)) ? 0 : 1; }
delete store["elg:hl:stats"];
window.HigherLower._setMode("endless");
var hl = window.HigherLower._peek();
ok(hl.mode === "endless" && !hl.over && !hl.revealed && hl.matchup !== null, "endless matchup dealt");
ok(hl.matchup.aVal !== hl.matchup.bVal, "no ties by construction");
window.HigherLower._pick(hlWinIdx(hl.matchup));
hl = window.HigherLower._peek();
ok(hl.revealed && hl.streak === 1 && !hl.over, "correct pick reveals the values + streak 1");
window.HigherLower._next();
hl = window.HigherLower._peek();
ok(!hl.revealed && hl.matchup !== null && hl.streak === 1, "next matchup dealt, streak carried");
window.HigherLower._pick(1 - hlWinIdx(hl.matchup));
hl = window.HigherLower._peek();
ok(hl.over && hl.revealed && hl.won === false, "wrong pick ends the run");
var hlStats = JSON.parse(store["elg:hl:stats"]);
ok(hlStats.best >= 1 && hlStats.runs >= 1, "best streak + run recorded");

console.log("Higher or Lower — Daily");
function hlTodayKey() { var d = new Date(); function p(n) { return n < 10 ? "0" + n : "" + n; } return "elg:hl:daily:" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
delete store["elg:hl:dstats"]; delete store[hlTodayKey()];
window.HigherLower._setMode("daily");
var hld = window.HigherLower._peek();
ok(hld.mode === "daily" && !hld.over && hld.results.length === 0 && hld.matchup !== null, "Daily starts at matchup 1 of 10");
for (var hlI = 0; hlI < 10; hlI++) { var hp = window.HigherLower._peek(); window.HigherLower._pick(hlWinIdx(hp.matchup)); window.HigherLower._next(); }
hld = window.HigherLower._peek();
ok(hld.over === true && hld.won === true && hld.results.length === 10, "ten perfect answers win the Daily");
ok(JSON.parse(store[hlTodayKey()]).done === true, "Daily saved as done (feeds hub streak)");
ok(JSON.parse(store["elg:hl:dstats"]).solved >= 1, "Daily solve recorded");
window.HigherLower._setMode("endless");
window.HigherLower._setMode("daily");
ok(window.HigherLower._peek().over === true, "returning to Daily restores the finished state");

console.log("Higher or Lower — hooks + how-to modal");
window.HigherLower.goPractice();
ok(window.HigherLower._peek().mode === "endless", "goPractice → endless");
window.HigherLower.goDaily();
ok(window.HigherLower._peek().mode === "daily", "goDaily → daily");
delete store["elg:hl:seenhelp"];
window.HigherLower.onShow();
ok(byId("hl-info-modal").hidden === false, "first onShow auto-opens the how-to");
fire(byId("hl-info-close"), "click");
window.HigherLower.onShow();
ok(byId("hl-info-modal").hidden === true, "second onShow stays quiet");
fire(byId("hl-info-btn"), "click");
ok(byId("hl-info-modal").hidden === false, "info button re-opens it manually");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });
ok(byId("hl-info-modal").hidden === true, "Escape closes it");
delete store[hlTodayKey()];   // don't leak a finished daily into the hub-streak block

console.log("Roster Master — clubs + recall matching");
Object.keys(store).forEach(function (k) { if (k.indexOf("elg:rm:") === 0) delete store[k]; });
function rmSur(n) { var t = n.toLowerCase().replace(/['’]/g, "").replace(/[.\-]/g, " ").replace(/\s+/g, " ").trim().split(" "); var last = t[t.length - 1]; if (["jr", "sr", "ii", "iii", "iv"].indexOf(last) >= 0 && t.length > 1) last = t[t.length - 2]; return last; }
ok(window.RosterMaster && typeof window.RosterMaster._open === "function", "module exposed");
ok(window.RosterMaster._peek().teams === 20, "all 20 clubs on the board");
var RMC = "Olympiacos";
var rmRos = window.PLAYERS.filter(function (p) { return p.team === RMC; });
window.RosterMaster._open(RMC);
var rmp = window.RosterMaster._peek();
ok(rmp.club === RMC && rmp.named === 0 && rmp.total === rmRos.length, "club board opens empty (" + rmRos.length + " slots)");
ok(window.RosterMaster._guess(rmRos[0].name) === "hit", "full name fills a slot");
ok(window.RosterMaster._guess(rmRos[0].name.toUpperCase()) === "dup", "same player again → already named");
var rmUniq = null;
for (var rmi = 1; rmi < rmRos.length && !rmUniq; rmi++) {
  var s0 = rmSur(rmRos[rmi].name);
  if (rmRos.filter(function (p) { return rmSur(p.name) === s0; }).length === 1) rmUniq = rmRos[rmi];
}
ok(!!rmUniq, "found a unique-surname player to test");
ok(window.RosterMaster._guess(rmSur(rmUniq.name)) === "hit", "unique surname alone fills the right slot");
ok(window.RosterMaster._guess("zz nobody") === "miss", "unknown name → no match");
ok(window.RosterMaster._peek().named === 2, "two named so far");
window.RosterMaster._back();
window.RosterMaster._open(RMC);
ok(window.RosterMaster._peek().named === 2, "progress persists across close + reopen");
window.RosterMaster._clear();
var rmc2 = window.RosterMaster._peek();
ok(rmc2.named === 0 && rmc2.best && rmc2.best.n === 2, "Clear wipes the board but best (2) survives");
ok(window.RosterMaster._guess(rmRos[0].name) === "hit" && window.RosterMaster._peek().best.n === 2, "best only moves when beaten");
ok(/% named/.test(window.RosterMaster.chipLabel()), "hub chip shows overall recall %");

console.log("Roster Master — badges + gold completion");
(function () {
  var teams = {}; window.PLAYERS.forEach(function (p) { teams[p.team] = 1; });
  var bad = Object.keys(teams).filter(function (t) { var m = window.RosterMaster._meta(t); return !(m.code && m.code.length === 3 && m.bg !== "#6e6656"); });
  ok(bad.length === 0, "every club has a hand-mapped badge (code + colours)" + (bad.length ? " — missing: " + bad.join(", ") : ""));
})();
var rmSmall = null;
(function () {
  var teams = {}; window.PLAYERS.forEach(function (p) { (teams[p.team] = teams[p.team] || []).push(p); });
  Object.keys(teams).forEach(function (t) { if (!rmSmall || teams[t].length < rmSmall.ros.length) rmSmall = { team: t, ros: teams[t] }; });
})();
window.RosterMaster._open(rmSmall.team);
rmSmall.ros.forEach(function (p) { window.RosterMaster._guess(p.name); });
var rmFull = window.RosterMaster._peek();
ok(rmFull.named === rmSmall.ros.length && rmFull.best.n === rmSmall.ros.length, "naming a full roster sets best to 100% (" + rmSmall.team + ", " + rmSmall.ros.length + " players)");
window.RosterMaster._clear();
window.RosterMaster._back();
var rmGold = 0;
byId("rm-picker").children.forEach(function (c) { if (c.className && c.className.indexOf("gold") >= 0) rmGold++; });
ok(rmGold === 1, "completed club stays GOLD on the picker even after Clear");
var rmBadges = 0;
byId("rm-picker").children.forEach(function (c) { if ((c.innerHTML || "").indexOf("rm-badge") >= 0) rmBadges++; });
ok(rmBadges === 20, "every club chip carries its colour badge");

console.log("Roster Master — Clear all boards");
window.RosterMaster._open(RMC);
ok(window.RosterMaster._peek().named >= 1, "a board has progress before Clear all");
window.RosterMaster._back();
window.RosterMaster._clearAll();
window.RosterMaster._open(RMC);
var rmCA = window.RosterMaster._peek();
ok(rmCA.named === 0 && rmCA.best.n >= 2, "Clear all wipes every board — bests survive");
window.RosterMaster._back();
var rmGoldAfterAll = 0;
byId("rm-picker").children.forEach(function (c) { if (c.className && c.className.indexOf("gold") >= 0) rmGoldAfterAll++; });
ok(rmGoldAfterAll === 1, "gold clubs stay gold after Clear all");
var rmIni = window.PLAYERS.filter(function (p) { return /^([A-Z]\.){2}/.test(p.name); })[0];
if (rmIni) {
  window.RosterMaster._open(rmIni.team);
  var rmTyped = rmIni.name.split(" ")[0].replace(/\./g, "") + " " + rmIni.name.split(" ").slice(1).join(" ");
  ok(window.RosterMaster._guess(rmTyped) === "hit", "initials without dots accepted (" + rmIni.name + " ← " + rmTyped + ")");
} else ok(true, "no initials-name in pool (skip)");
var rmAmb = null;
window.PLAYERS.forEach(function (p) {
  if (rmAmb) return;
  var twin = window.PLAYERS.filter(function (q) { return q.team === p.team && rmSur(q.name) === rmSur(p.name); });
  if (twin.length === 2) rmAmb = { team: p.team, sur: rmSur(p.name) };
});
if (rmAmb) {
  window.RosterMaster._open(rmAmb.team);
  ok(window.RosterMaster._guess(rmAmb.sur) === "ambiguous", "shared surname asks to be more specific (" + rmAmb.team + ": " + rmAmb.sur + ")");
} else ok(true, "no shared-surname club in data (skip)");

console.log("Roster Master — how-to modal");
Object.keys(store).forEach(function (k) { if (k.indexOf("elg:rm:") === 0) delete store[k]; });
window.RosterMaster.onShow();
ok(byId("rm-info-modal").hidden === false, "first onShow auto-opens the how-to");
fire(byId("rm-info-close"), "click");
window.RosterMaster.onShow();
ok(byId("rm-info-modal").hidden === true, "second onShow stays quiet");
fire(byId("rm-info-btn"), "click");
ok(byId("rm-info-modal").hidden === false, "info button re-opens it manually");
fireDoc("keydown", { key: "Escape", preventDefault: function () {} });
ok(byId("rm-info-modal").hidden === true, "Escape closes it");
Object.keys(store).forEach(function (k) { if (k.indexOf("elg:rm:") === 0) delete store[k]; });

console.log("hub streak (unified, all games)");
function hpad(n) { return n < 10 ? "0" + n : "" + n; }
function hdate(off) { var d = new Date(); d.setDate(d.getDate() - off); return d.getFullYear() + "-" + hpad(d.getMonth() + 1) + "-" + hpad(d.getDate()); }
var HTODAY = hdate(0), HY = hdate(1), HY2 = hdate(2), HY3 = hdate(3);
var DAILY_PREFIXES = ["elg:daily:", "elg:pid:daily:", "elg:c5:daily:", "elg:cn:daily:", "elg:co:daily:", "elg:gr:daily:", "elg:cv:daily:", "elg:pb:daily:", "elg:oo:daily:", "elg:hl:daily:"];
function clearToday() { DAILY_PREFIXES.forEach(function (p) { delete store[p + HTODAY]; }); }
function markDoneToday() { store["elg:gr:daily:" + HTODAY] = JSON.stringify({ puzzle: 0, done: true, won: true }); }
clearToday();
ok(window.Hub._isTodayDone() === false, "nothing finished today → not done");
window.Hub._setHub({ cur: 0, best: 0, last: null, freeze: true, freezeAt: 0 });
markDoneToday();
ok(window.Hub._isTodayDone() === true, "a finished daily counts as done today");
var H1 = window.Hub._reconcile();
ok(H1.cur === 1 && H1.best === 1 && H1.last === HTODAY, "first daily starts a 1-day streak");
ok(window.Hub._reconcile().cur === 1, "replaying the same day does not double-count");
window.Hub._setHub({ cur: 5, best: 5, last: HY, freeze: true, freezeAt: 0 });
ok(window.Hub._reconcile().cur === 6, "playing the day after continues the streak");
window.Hub._setHub({ cur: 5, best: 9, last: HY2, freeze: true, freezeAt: 0 });
var H3 = window.Hub._reconcile();
ok(H3.cur === 6 && H3.freeze === false, "a single missed day is bridged by the streak freeze");
window.Hub._setHub({ cur: 8, best: 9, last: HY3, freeze: true, freezeAt: 0 });
var H4 = window.Hub._reconcile();
ok(H4.cur === 1 && H4.freeze === true, "a 2+ day gap resets the streak (freeze kept)");
window.Hub._setHub({ cur: 8, best: 9, last: HY2, freeze: false, freezeAt: 0 });
ok(window.Hub._reconcile().cur === 1, "a missed day with no freeze left resets the streak");
window.Hub._setHub({ cur: 12, best: 12, last: HY, freeze: false, freezeAt: 5 });
var H6 = window.Hub._reconcile();
ok(H6.cur === 13 && H6.freeze === true, "the streak freeze recharges after 7 more days");
clearToday();
window.Hub._setHub({ cur: 6, best: 9, last: HY, freeze: true, freezeAt: 0 });
var HI = window.Hub._info();
ok(HI.cur === 6 && HI.done === false && HI.atRisk === true, "streak stays alive but 'at risk' until you play today");
window.Hub._setHub({ cur: 4, best: 9, last: HY3, freeze: false, freezeAt: 0 });
ok(window.Hub._info().cur === 0, "a lapsed streak shows 0 until you play again");
clearToday();
store["elg:cv:daily:" + HTODAY] = JSON.stringify({ club: "x", revealed: 3, guesses: [], done: true, won: false });
ok(window.Hub._isTodayDone() === true, "a finished Club Reveal daily counts toward the hub streak");

console.log("night mode toggle");
delete store["elg:theme"];
ok(window.Hub._getTheme() === "light", "defaults to light when nothing saved (OS not dark in harness)");
window.Hub._toggleTheme();
ok(store["elg:theme"] === JSON.stringify("dark") && window.Hub._getTheme() === "dark", "toggle → dark, persisted to elg:theme");
ok(doc.documentElement.getAttribute("data-theme") === "dark", "dark theme applied to <html data-theme>");
window.Hub._toggleTheme();
ok(window.Hub._getTheme() === "light" && doc.documentElement.getAttribute("data-theme") === "light", "toggle again → back to light");
window.Hub._applyTheme("dark");
ok(byId("theme-btn").getAttribute("aria-label") === "Switch to day mode", "toggle button label reflects the switch target");
window.Hub._applyTheme("light");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
