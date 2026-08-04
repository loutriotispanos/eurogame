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
 * Measured, not assumed: of the fifteen entries below, only the Metropolitans 92
 * franchise currently has TWO forms live in careers.js (Poirier is filed under
 * "Paris-Levallois", Prepelic under "Levallois Metropolitans"). Merging them
 * rejects exactly 2 pairs that would otherwise ship as one-answer puzzles —
 * Poirier+Prepelic and Prepelic+Sako, both of which would have claimed a single
 * shared club while quietly sharing a second. The other thirteen entries are
 * defensive: only one of their two spellings appears today, and they cost
 * nothing until a roster update introduces the other.
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
