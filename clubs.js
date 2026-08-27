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

  window.CLUBS = {
    ALIAS: ALIAS,
    canonical: function (team) { return ALIAS[team] || team; }
  };
})();
