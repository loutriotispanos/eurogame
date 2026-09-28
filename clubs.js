/* Club name canonicalisation — the one place that decides when two career lines
 * mean the SAME club.
 *
 * careers.js keeps whatever name each source used ("Elan Chalon" vs "Chalon",
 * "Benetton Treviso" vs "Treviso"), because that's what the sources said. Two
 * games depend on collapsing those variants, and for different reasons:
 *
 *   Path Between  — an unmerged variant silently drops a teammate edge, so a
 *                   route that exists in real life doesn't exist in the graph.
 *   Common Club   — an unmerged variant makes a pair look like it shares ONE
 *                   club when it really shares two, i.e. a puzzle whose
 *                   "only right answer" isn't.
 *
 * Measured, not assumed: three franchises currently have TWO forms live in
 * careers.js. Metropolitans 92 (Poirier is filed under "Paris-Levallois",
 * Prepelic under "Levallois Metropolitans") — merging them rejects exactly 2
 * pairs that would otherwise ship as one-answer puzzles, Poirier+Prepelic and
 * Prepelic+Sako. Baskonia (the 2000s legends are filed era-accurately under
 * "Tau Ceramica" — Scola, Splitter, Oberto, Garbajosa — while every later
 * career says "Baskonia"), which The Grid also leans on: without the merge a
 * Baskonia criterion can't see the Tau-era greats, which is a big part of why
 * its Baskonia cells felt thin. And CB Sevilla ("Caja San Fernando" is the same
 * club's sponsor-era name). The remaining entries are defensive: only one of
 * their spellings appears today, and they cost nothing until a roster update
 * introduces the other.
 *
 * This lives in its own file rather than inside either game because two copies
 * drifting apart would break Common Club's guarantee silently — Path Between
 * would keep working, so nothing would announce it. Merge KNOWN same-club
 * variants only: lookalikes like Virtus/Fortitudo Bologna, or FC Barcelona B,
 * are genuinely different teams and stay apart.
 */
(function () {
  "use strict";

  var ALIAS = {
    "Antibes Sharks": "Antibes",
    "Elan Chalon": "Chalon",
    "CB Estudiantes": "Estudiantes",            // Madrid (Bahia Blanca stays separate)
    "Joventut Badalona": "Joventut",
    "JSF Nanterre": "Nanterre",
    "Nanterre 92": "Nanterre",
    "Paris-Levallois": "Metropolitans 92",       // one franchise, three era names
    "Levallois Metropolitans": "Metropolitans 92",
    "Tau Ceramica": "Baskonia",                  // one club, four sponsor eras
    "Caja Laboral": "Baskonia",
    "Laboral Kutxa": "Baskonia",
    "Caja San Fernando": "CB Sevilla",
    "Buducnost Podgorica": "Buducnost",
    "Baxi Manresa": "Manresa",
    "Aquila Basket Trento": "Trento",
    "Benetton Treviso": "Treviso",
    "Pallacanestro Varese": "Varese",
    "Union Olimpija": "Olimpija Ljubljana",
    "Wollongong Hawks": "Illawarra Hawks"
  };

  function canonical(team) { return ALIAS[team] || team; }

  // --- Club pages (/clubs/<slug>/, written by build_clubs.js) ------------------
  // Names that are plainly the same club as a current EuroCup side, which only
  // the club pages need (the games never meet them in a way that matters).
  // Deliberately NOT merged: Cedevita / Cedevita Zagreb / Olimpija Ljubljana
  // (Cedevita Olimpija is a 2019 merger, and a stint at either half isn't a stint
  // at the merged club), Tizona Burgos (a different Burgos club), VEF Riga (not
  // Riga Zelli), Virtus Roma (folded in 2020, not today's Roma clubs).
  var PAGE_ALIAS = {
    "Aris": "Aris Thessaloniki",
    "Bahcesehir Koleji": "Bahcesehir College",
    "Derthona Basket": "Derthona Tortona",
    "KK Bosna": "Bosna Sarajevo",
    "CB Canarias": "La Laguna Tenerife"
  };
  function pageName(team) { var c = canonical(team); return PAGE_ALIAS[c] || c; }
  function slug(name) {
    return String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  // A club has a page if it has a 2026-27 roster in either competition. The
  // EuroCup mode swaps window.PLAYERS for the EuroCup's, keeping the EuroLeague
  // list as EL_PLAYERS, so both are read from wherever they are right now.
  function hasPage(name) {
    var lists = [window.EL_PLAYERS || window.PLAYERS, window.EUROCUP_PLAYERS];
    for (var i = 0; i < lists.length; i++) {
      var L = lists[i] || [];
      for (var j = 0; j < L.length; j++) if (L[j].team === name) return true;
    }
    return false;
  }
  // "clubs/real-madrid/", relative to the site root, or null for a club
  // without a page (CSKA Moscow, Unicaja, an NBA team…).
  function page(team) {
    var name = pageName(team);
    return hasPage(name) ? "clubs/" + slug(name) + "/" : null;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  // A club name as a link to its page, for an end-of-game banner, or the plain
  // name if there's no page. The root comes from app.js, which fixes it once at
  // load: the address bar moves under pushState and a relative link wouldn't.
  function link(team, label) {
    var p = page(team), text = esc(label == null ? team : label);
    if (!p) return text;
    var root = (window.Hub && window.Hub._siteRoot) ? window.Hub._siteRoot() : "/";
    return '<a class="club-link" href="' + esc(root + p) + '">' + text + "</a>";
  }

  window.CLUBS = {
    ALIAS: ALIAS,
    PAGE_ALIAS: PAGE_ALIAS,
    canonical: canonical,
    pageName: pageName,
    slug: slug,
    page: page,
    link: link
  };
})();
