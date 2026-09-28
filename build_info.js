/* The site's standing pages: /about/, /contact/ and /privacy/.
 *
 * WHY THEY EXIST. AdSense reviews a site before it will serve ads on it, and its
 * checklist asks for an About page and a Contact page ("necessary for user trust
 * and transparency"). Its program policies also require a privacy policy that
 * names Google's advertising cookies. Until now, Euroball had none of the three.
 * Feedback was a modal that only JavaScript can open, so to a crawler the site
 * gave no way to contact anyone.
 *
 * WHY THEY ARE NOT COPIES OF THE APP, unlike the game pages build_pages.js
 * writes: there's nothing to play here. Each one is a short, plain document in
 * the site's own newsprint grammar (same tokens, same night mode, same elg:theme
 * key), with no scripts beyond the pre-paint theme line. They load no analytics
 * of their own. Cloudflare's cookie-free beacon is injected at the edge on every
 * page anyway, and Google Analytics stays with the app, behind its consent bar.
 *
 * GENERATED FILES. Never hand-edit the output: change the copy below and re-run
 * `node build_info.js`. test.js fails if the files have drifted.
 *
 * THE ADDRESS. The contact address appears as "name [at] domain" text and is
 * assembled into a mailto by a one-line script, for the same reason app.js
 * splits it (FB): nothing that scrapes page sources for addresses finds one.
 * test.js checks that for every page.
 */
"use strict";
var fs = require("fs");
var path = require("path");
var games = require("./build_pages.js");

var ORIGIN = "https://euroballgames.com";
var ROOT = __dirname;
var UPDATED = "28 September 2026";          // the privacy policy's effective date
var MAIL = ["loutriotispanos", "gmail.com"]; // the same inbox app.js's FB names

/* One line per game for the About page: the first sentence of each game page's
 * own meta description, so the two can never describe a game differently. */
function gameList() {
  return "<ul class=\"games\">\n" + games.PAGES.map(function (p) {
    var first = games.plain(p.desc).split(/(?<=\.)\s/)[0];
    return '      <li><a href="../' + p.slug + '/">' + p.name + "</a>: " + esc(first) + "</li>";
  }).join("\n") + "\n    </ul>";
}

var ADDR_HTML = '<a class="mail" data-u="' + MAIL[0] + '" data-d="' + MAIL[1] + '">' +
                MAIL[0] + " [at] " + MAIL[1].replace(".", " [dot] ") + "</a>";

var PAGES = [
  {
    slug: "about", name: "About",
    title: "About Euroball: free daily European basketball puzzles",
    desc: "Euroball is a free, independent set of daily puzzle games about European basketball, built by a fan. What it is, where the data comes from, and who makes it.",
    body: function () { return [
      "<p class=\"lede\">Euroball is a free set of daily puzzle games about European basketball: the EuroLeague first, and the EuroCup too. Every game has a new puzzle each day, the same one for everyone, and unlimited practice if one a day isn't enough.</p>",
      "<h2>The games</h2>",
      gameList(),
      "<p>Seven of them can also be played on EuroCup players, from the <a href=\"../eurocup/\">EuroCup hub</a>.</p>",
      "<h2>Where the data comes from</h2>",
      "<p>Every player, club, career and lineup in the games was compiled by hand: from official club rosters and the official EuroLeague and EuroCup rosters, Wikipedia, FIBA and Proballers, then cross-checked source against source. Rosters are updated club by club at the start of each season. Transfers in the middle of a season aren't reflected until the next update.</p>",
      "<p>The puzzles are built from that data by scripts that check each one before it ships. A Connections board has exactly one solution, a Path Between pair has a real route through teammates, and a Grid square has at least one right answer.</p>",
      "<p>Found a wrong club, a missing season, a misspelt name? <a href=\"../contact/\">Send a correction</a>. Corrections from players of the game have already fixed real mistakes.</p>",
      "<h2>Who makes it</h2>",
      "<p>Euroball is made by one basketball fan in Greece, in their spare time, for the love of the European game. There is no company behind it, no account to create and nothing to buy. It works offline once it has loaded, and it can be installed on a phone like an app.</p>",
      "<h2>Not affiliated</h2>",
      "<p>Euroball is an independent fan project. It is not affiliated with, endorsed by or connected to Euroleague Basketball, the EuroLeague, the EuroCup or any club. Club and competition names are used only to describe the players who played there.</p>"
    ]; }
  },
  {
    slug: "contact", name: "Contact",
    title: "Contact Euroball",
    desc: "How to reach Euroball: report a wrong fact in a puzzle, a bug or an idea for a new game, by email or with the feedback form in the app.",
    body: function () { return [
      "<p class=\"lede\">Euroball is made by one person, and every message is read by that person.</p>",
      "<h2>Email</h2>",
      "<p class=\"addr\">" + ADDR_HTML + "</p>",
      "<h2>The feedback form</h2>",
      "<p>On the <a href=\"../\">home page</a>, the feedback button beside the night-mode switch (or the <em>Send feedback</em> link at the bottom) opens a form that sends straight to the same inbox, with no mail app needed. It attaches the app version and your screen size, which makes a bug much quicker to find.</p>",
      "<h2>What helps</h2>",
      "<ul>",
      "  <li><strong>A wrong fact:</strong> the player, what the game says, what it should say, and where you saw it (a club site, Wikipedia, a box score). Every correction is checked against a source before it goes in.</li>",
      "  <li><strong>A bug:</strong> which game, which mode, and what you did just before it happened.</li>",
      "  <li><strong>An idea:</strong> a new game, a missing player, a club that deserves more puzzles. All welcome.</li>",
      "</ul>",
      "<p>Privacy questions, including a request to delete a message you sent, go to the same address. See the <a href=\"../privacy/\">privacy policy</a>.</p>"
    ]; }
  },
  {
    slug: "privacy", name: "Privacy",
    title: "Privacy policy | Euroball",
    desc: "What Euroball stores, what it sends and to whom: your progress stays in your browser, page counts are cookie-free, Google Analytics runs only with consent, and how Google ads use cookies.",
    body: function () { return [
      "<p class=\"lede\">Short version: Euroball has no accounts and keeps your game progress in your own browser. It counts page views without cookies. Google Analytics, which does use cookies, runs only if you allow it.</p>",
      "<p class=\"updated\">Last updated " + UPDATED + ".</p>",

      "<h2>What stays on your device</h2>",
      "<p>Your scores, streaks, daily results, chosen theme and game modes are saved in your browser's local storage, under keys starting <code>elg:</code>. They never leave your device. Nothing on a server knows your streak, and clearing your browser's site data deletes all of it. The app also saves its own files for offline play (a service worker cache), which holds no personal data.</p>",

      "<h2>Page counts: Cloudflare Web Analytics</h2>",
      "<p>The site is hosted by Cloudflare, which counts visits with its Web Analytics. That uses no cookies and no local storage, and does not fingerprint you or follow you to other sites. It records the page, the referring site, and your country, browser and device type. Like any web host, Cloudflare also processes your IP address to deliver the page. See <a href=\"https://www.cloudflare.com/privacypolicy/\" rel=\"noopener\">Cloudflare's privacy policy</a>.</p>",

      "<h2>Usage statistics: Google Analytics, only if you say yes</h2>",
      "<p>On your first visit, a bar at the bottom of the screen asks whether you'll allow anonymous usage statistics from Google Analytics. Until you say yes, nothing from Google is loaded at all. If you do say yes, Google Analytics sets cookies (<code>_ga</code>) and receives information about how the games are used, such as which pages are opened and roughly where visitors come from. Euroball uses this only to see which games people play. You can change your mind at any time with <em>Stats settings</em> at the bottom of the home page. Saying no also deletes any Google Analytics cookie set earlier. See <a href=\"https://policies.google.com/technologies/partner-sites\" rel=\"noopener\">how Google uses data from sites that use its services</a>.</p>",

      "<h2>Advertising: Google AdSense</h2>",
      "<p>Euroball is free, and may show ads served by Google AdSense to cover its costs. <strong>No ads are served today.</strong> This section describes how they will work once they are.</p>",
      "<ul>",
      "  <li>Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this site and other sites.</li>",
      "  <li>Google's use of advertising cookies lets it and its partners serve ads to you based on your visits to this site and/or other sites on the internet.</li>",
      "  <li>You can opt out of personalised advertising in <a href=\"https://adssettings.google.com/\" rel=\"noopener\">Google's Ads Settings</a>, and opt out of some third-party vendors' use of cookies for personalised advertising at <a href=\"https://www.aboutads.info/choices/\" rel=\"noopener\">aboutads.info</a> (or <a href=\"https://www.youronlinechoices.eu/\" rel=\"noopener\">youronlinechoices.eu</a> in Europe).</li>",
      "  <li>Visitors in the European Economic Area, the UK and Switzerland will be asked first, through Google's consent message, and can refuse as easily as they accept.</li>",
      "</ul>",
      "<p>See <a href=\"https://policies.google.com/technologies/ads\" rel=\"noopener\">how Google uses cookies in advertising</a>.</p>",

      "<h2>When you send feedback</h2>",
      "<p>The feedback form sends your message, the name you typed (optional) and a few technical details (app version, which screen you were on, theme, screen size and browser) by email, through the form service <a href=\"https://web3forms.com/\" rel=\"noopener\">Web3Forms</a>. It is kept only as an email in the Euroball inbox, used only to answer and fix things, and deleted on request. The form also keeps an unsent draft and your name in your own browser so they aren't lost if you close it.</p>",

      "<h2>What Euroball does not do</h2>",
      "<ul>",
      "  <li>No accounts, no sign-up, no passwords.</li>",
      "  <li>No selling or sharing of personal data.</li>",
      "  <li>No web fonts or other outside requests just to show a page. The type comes from your device.</li>",
      "</ul>",

      "<h2>Children</h2>",
      "<p>Euroball is a general-audience site about professional basketball. It is not directed at children under 13 and does not knowingly collect personal information from them.</p>",

      "<h2>Your rights</h2>",
      "<p>Under the GDPR you can ask to see, correct or delete personal data held about you, and you can complain to your data protection authority (in Greece, the <a href=\"https://www.dpa.gr/\" rel=\"noopener\">Hellenic DPA</a>). Almost everything Euroball keeps is already under your control in your own browser. For anything else, a feedback message for example, <a href=\"../contact/\">get in touch</a>.</p>",

      "<h2>Changes</h2>",
      "<p>If this policy changes, the date at the top changes with it. Anything that would start collecting more about you will be asked for first, not only written here.</p>"
    ]; }
  }
];

function esc(s) {
  return String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* The sheet, cut down from index.html's to what prose needs. The colours are
 * index.html's own tokens, light and dark, so these pages sit in the same paper
 * and follow the same toggle. */
var CSS = [
  ":root {",
  "  --paper: #f7f3ea; --ink: #1d1a14; --muted: #6e6656; --rule: #d8cfbc; --rule-strong: #1d1a14;",
  "  --paper-2: #efe9db; --accent: #c65611;",
  "  --font-display: \"Rockwell\", \"Roboto Slab\", \"Bookman Old Style\", \"Iowan Old Style\", Charter, Georgia, \"Times New Roman\", serif;",
  "  --font-sans: system-ui, -apple-system, \"Segoe UI\", Roboto, Arial, sans-serif;",
  "  color-scheme: light;",
  "}",
  ":root[data-theme=\"dark\"] {",
  "  --paper: #15120c; --ink: #e6dfd0; --muted: #a29881; --rule: #4a4133; --rule-strong: #897f6b;",
  "  --paper-2: #2c2618; --accent: #cf7b41;",
  "  color-scheme: dark;",
  "}",
  "* { box-sizing: border-box; }",
  "body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--font-sans); font-size: 17px; line-height: 1.6; }",
  ".wrap { max-width: 680px; margin: 0 auto; padding: 28px 16px 48px; }",
  ".brand { display: block; text-align: center; font-family: var(--font-display); font-weight: 700; font-size: 20px; letter-spacing: .02em; color: var(--ink); text-decoration: none; }",
  "nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 20px; margin: 10px 0 0; font-weight: 700; font-size: 14px; }",
  "nav a { color: var(--ink); text-decoration: none; padding: 4px 0; border-bottom: 2px solid transparent; }",
  "nav a:hover { border-bottom-color: var(--rule); }",
  "nav a[aria-current] { border-bottom-color: var(--accent); }",
  "h1 { font-family: var(--font-display); font-size: clamp(30px, 7vw, 44px); line-height: 1.1; text-align: center; margin: 22px 0 0; padding-bottom: 14px;",
  "     border-bottom: 3px double var(--rule-strong); text-wrap: balance; }",
  "h2 { font-family: var(--font-display); font-size: 22px; line-height: 1.25; margin: 34px 0 8px; padding-top: 12px; border-top: 1px solid var(--rule); }",
  ".lede { font-family: var(--font-display); font-style: italic; font-size: 19px; color: var(--muted); margin-top: 20px; }",
  ".updated { color: var(--muted); font-size: 14px; }",
  "a { color: var(--ink); text-underline-offset: 2px; }",
  "a:hover { color: var(--accent); }",
  "ul { padding-left: 1.2em; } li { margin: 6px 0; }",
  "code { font-size: .9em; background: var(--paper-2); padding: 1px 4px; border-radius: 2px; }",
  ".addr { font-size: 19px; font-weight: 700; overflow-wrap: anywhere; }",
  "footer { margin-top: 44px; padding-top: 12px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 14px; text-align: center; }",
  "footer a { color: var(--muted); }"
].join("\n  ");

function nav(current) {
  return [["../", "Play the games"], ["../about/", "About"], ["../contact/", "Contact"], ["../privacy/", "Privacy"]]
    .map(function (l) {
      var here = l[0] === "../" + current + "/";
      return '<a href="' + l[0] + '"' + (here ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
    }).join("\n      ");
}

function buildInfo(p) {
  var url = ORIGIN + "/" + p.slug + "/";
  var crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Euroball", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: p.name, item: url }
    ]
  };
  return [
    "<!DOCTYPE html>",
    "<!-- GENERATED by build_info.js — do not edit. Change the copy in build_info.js",
    "     and re-run `node build_info.js`. -->",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"UTF-8\" />",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />",
    // The same pre-paint line as index.html, cut to the theme: no flash of the
    // wrong paper on a visitor who plays in night mode.
    "<script>(function(){try{var t=localStorage.getItem(\"elg:theme\");if(t)t=JSON.parse(t);if(t!==\"dark\"&&t!==\"light\")t=(window.matchMedia&&window.matchMedia(\"(prefers-color-scheme: dark)\").matches)?\"dark\":\"light\";document.documentElement.setAttribute(\"data-theme\",t);}catch(e){}})();</script>",
    "<title>" + esc(p.title) + "</title>",
    "<meta name=\"description\" content=\"" + esc(p.desc) + "\" />",
    "<link rel=\"canonical\" href=\"" + url + "\" />",
    "<meta name=\"theme-color\" content=\"#f7f3ea\" />",
    "<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Ctext%20y='.9em'%20font-size='90'%3E%F0%9F%8F%80%3C/text%3E%3C/svg%3E\" />",
    "<link rel=\"apple-touch-icon\" href=\"../icon-192.png\" />",
    "<meta property=\"og:type\" content=\"website\" />",
    "<meta property=\"og:site_name\" content=\"Euroball\" />",
    "<meta property=\"og:title\" content=\"" + esc(p.name) + " — Euroball\" />",
    "<meta property=\"og:description\" content=\"" + esc(p.desc) + "\" />",
    "<meta property=\"og:url\" content=\"" + url + "\" />",
    "<meta property=\"og:image\" content=\"" + ORIGIN + "/og-image.png\" />",
    "<script type=\"application/ld+json\">\n" + JSON.stringify(crumbs, null, 2).replace(/<\//g, "<\\/") + "\n</script>",
    "<style>\n  " + CSS + "\n</style>",
    "</head>",
    "<body>",
    "  <div class=\"wrap\">",
    "    <a class=\"brand\" href=\"../\">🏀 Euroball</a>",
    "    <nav aria-label=\"Site\">",
    "      " + nav(p.slug),
    "    </nav>",
    "    <main>",
    "    <h1>" + esc(p.name === "Privacy" ? "Privacy policy" : p.name === "About" ? "About Euroball" : "Contact") + "</h1>",
    "    " + p.body().join("\n    "),
    "    </main>",
    "    <footer>",
    "      Euroball · daily European basketball puzzles · <a href=\"../\">euroballgames.com</a><br />",
    "      An independent fan project, not affiliated with Euroleague Basketball.",
    "    </footer>",
    "  </div>",
    // Turns "name [at] domain" into a working link, for a person. Pages without
    // an address simply find nothing to do.
    "<script>document.querySelectorAll(\"a.mail\").forEach(function(a){var m=a.getAttribute(\"data-u\")+\"@\"+a.getAttribute(\"data-d\");a.href=\"mailto:\"+m;a.textContent=m;});</script>",
    "</body>",
    "</html>",
    ""
  ].join("\n");
}

function main() {
  PAGES.forEach(function (p) {
    var dir = path.join(ROOT, p.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), buildInfo(p));
    console.log("  " + p.slug + "/index.html");
  });
  console.log("build_info: wrote " + PAGES.length + " pages");
}

module.exports = { PAGES: PAGES, buildInfo: buildInfo, MAIL: MAIL };
if (require.main === module) main();
