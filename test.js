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
  readyState: "complete", activeElement: null, hidden: false, body: new El("body"),
  _listeners: {},
  getElementById: function (id) { return byKey[id] || mk(id); },
  querySelector: function (sel) { return byKey["sel:" + sel] || mk("sel:" + sel); },
  createElement: function (tag) { return new El(tag); },
  addEventListener: function (t, fn) { (doc._listeners[t] = doc._listeners[t] || []).push(fn); }
};
["info-modal", "stats-modal", "cn-info-modal", "co-info-modal", "pid-info-modal", "c5-info-modal"].forEach(function (id) { var m = mk(id); m.hidden = true; m.appendChild(new El("div")); }); // modals start hidden + need a dialog child

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
eval(fs.readFileSync("game.js", "utf8"));
eval(fs.readFileSync("playerid.js", "utf8"));
eval(fs.readFileSync("completefive.js", "utf8"));
eval(fs.readFileSync("connections.js", "utf8"));
eval(fs.readFileSync("careerorder.js", "utf8"));

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
ok(window.PLAYERS && window.PLAYERS.length === 303, "303 players loaded");
ok(window.LEGENDS && window.LEGENDS.length === 87, "87 legends loaded");
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
ok(window.CAREERS.every(function (c) { return c.career.length >= 2; }), "every career has >= 2 clubs");
ok(window.CAREERS.some(function (c) { return c.active; }) && window.CAREERS.some(function (c) { return !c.active; }), "careers include both active + retired");
var rosterNames = {}; window.PLAYERS.concat(window.LEGENDS).forEach(function (p) { rosterNames[p.name] = 1; });
ok(window.CAREERS.every(function (c) { return rosterNames[c.name]; }), "every career name resolves in the roster");

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

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
