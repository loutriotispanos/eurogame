/*
 * Build script: consolidates the 2025-26 EuroLeague roster data (gathered from
 * official club pages, Wikipedia season articles, FIBA, Proballers, Eurohoops)
 * into players.js.
 *
 * Run:  node build_players.js
 *
 * It dedupes mid-season transfers (keeps first occurrence in team order),
 * drops development players born 2007+ (unguessable), validates every team
 * against TEAMS, and writes a clean players.js.
 */
const fs = require("fs");

// Club -> country (used for the "same country" yellow hint).
const TEAMS = {
  "Real Madrid":      { country: "Spain" },
  "FC Barcelona":     { country: "Spain" },
  "Baskonia":         { country: "Spain" },
  "Valencia":         { country: "Spain" },
  "Panathinaikos":    { country: "Greece" },
  "Olympiacos":       { country: "Greece" },
  "Fenerbahce":       { country: "Turkey" },
  "Anadolu Efes":     { country: "Turkey" },
  "Besiktas":         { country: "Turkey" },     // joined for 2026-27 (replaced AS Monaco)
  "Maccabi Tel Aviv": { country: "Israel" },
  "Hapoel Tel Aviv":  { country: "Israel" },
  "Olimpia Milano":   { country: "Italy" },
  "Virtus Bologna":   { country: "Italy" },
  "ASVEL":            { country: "France" },
  "Paris Basketball": { country: "France" },
  "Bayern Munich":    { country: "Germany" },
  "Crvena Zvezda":    { country: "ABA League" },   // CZ + Partizan play the ABA (Adriatic) League, not a purely national one
  "Partizan":         { country: "ABA League" },
  "Zalgiris Kaunas":  { country: "Lithuania" },
  "Dubai BC":         { country: "ABA League" },    // Dubai BC also competes in the ABA League → group with CZ / Partizan
};

// Output / dedup order: first occurrence of a name wins.
const TEAM_ORDER = Object.keys(TEAMS);

// --- Raw research output (verbatim JSON from the 5 research agents) ----------
const raw = [];

raw.push({"players":[{"name":"Trey Lyles","team":"Real Madrid","nationality":"Canada","position":"Forward","height":206,"birthYear":1995,"number":0},{"name":"David Kramer","team":"Real Madrid","nationality":"Germany","position":"Guard","height":196,"birthYear":1997,"number":1},{"name":"Mady Sissoko","team":"Real Madrid","nationality":"Mali","position":"Center","height":206,"birthYear":2000,"number":5},{"name":"Alberto Abalde","team":"Real Madrid","nationality":"Spain","position":"Guard","height":202,"birthYear":1995,"number":6},{"name":"Facundo Campazzo","team":"Real Madrid","nationality":"Argentina","position":"Guard","height":178,"birthYear":1991,"number":7},{"name":"Chuma Okeke","team":"Real Madrid","nationality":"USA","position":"Forward","height":201,"birthYear":1998,"number":8},{"name":"Gabriele Procida","team":"Real Madrid","nationality":"Italy","position":"Guard","height":198,"birthYear":2002,"number":9},{"name":"Mario Hezonja","team":"Real Madrid","nationality":"Croatia","position":"Forward","height":206,"birthYear":1995,"number":11},{"name":"Theo Maledon","team":"Real Madrid","nationality":"France","position":"Guard","height":193,"birthYear":2001,"number":12},{"name":"Izan Almansa","team":"Real Madrid","nationality":"Spain","position":"Forward","height":208,"birthYear":2005,"number":13},{"name":"Gabriel Deck","team":"Real Madrid","nationality":"Argentina","position":"Forward","height":198,"birthYear":1995,"number":14},{"name":"Usman Garuba","team":"Real Madrid","nationality":"Spain","position":"Forward","height":203,"birthYear":2002,"number":16},{"name":"Edy Tavares","team":"Real Madrid","nationality":"Cape Verde","position":"Center","height":220,"birthYear":1992,"number":22},{"name":"Sergio Llull","team":"Real Madrid","nationality":"Spain","position":"Guard","height":190,"birthYear":1987,"number":23},{"name":"Andres Feliz","team":"Real Madrid","nationality":"Dominican Republic","position":"Guard","height":186,"birthYear":1997,"number":24},{"name":"Alex Len","team":"Real Madrid","nationality":"Ukraine","position":"Center","height":213,"birthYear":1993,"number":25},{"name":"Omer Yurtseven","team":"Real Madrid","nationality":"Turkey","position":"Center","height":213,"birthYear":1998,"number":77},{"name":"Kevin Punter","team":"FC Barcelona","nationality":"USA","position":"Guard","height":193,"birthYear":1993,"number":0},{"name":"Juani Marcos","team":"FC Barcelona","nationality":"Argentina","position":"Guard","height":190,"birthYear":2000,"number":2},{"name":"Myles Cale","team":"FC Barcelona","nationality":"USA","position":"Forward","height":198,"birthYear":1999,"number":3},{"name":"Miles Norris","team":"FC Barcelona","nationality":"USA","position":"Forward","height":206,"birthYear":2000,"number":5},{"name":"Jan Vesely","team":"FC Barcelona","nationality":"Czech Republic","position":"Forward","height":213,"birthYear":1990,"number":6},{"name":"Dario Brizuela","team":"FC Barcelona","nationality":"Spain","position":"Guard","height":188,"birthYear":1994,"number":8},{"name":"Tomas Satoransky","team":"FC Barcelona","nationality":"Czech Republic","position":"Guard","height":200,"birthYear":1991,"number":13},{"name":"Willy Hernangomez","team":"FC Barcelona","nationality":"Spain","position":"Center","height":210,"birthYear":1994,"number":14},{"name":"Juan Nunez","team":"FC Barcelona","nationality":"Spain","position":"Guard","height":194,"birthYear":2004,"number":17},{"name":"Youssoupha Fall","team":"FC Barcelona","nationality":"Senegal","position":"Center","height":222,"birthYear":1995,"number":19},{"name":"Nicolas Laprovittola","team":"FC Barcelona","nationality":"Argentina","position":"Guard","height":191,"birthYear":1990,"number":20},{"name":"Will Clyburn","team":"FC Barcelona","nationality":"USA","position":"Forward","height":201,"birthYear":1990,"number":21},{"name":"Tornike Shengelia","team":"FC Barcelona","nationality":"Georgia","position":"Forward","height":206,"birthYear":1991,"number":23},{"name":"Sayon Keita","team":"FC Barcelona","nationality":"Mali","position":"Center","height":212,"birthYear":2008,"number":41},{"name":"Joel Parra","team":"FC Barcelona","nationality":"Spain","position":"Forward","height":203,"birthYear":2000,"number":44},{"name":"Markus Howard","team":"Baskonia","nationality":"USA","position":"Guard","height":179,"birthYear":1999,"number":0},{"name":"Mamadi Diakite","team":"Baskonia","nationality":"Guinea","position":"Center","height":206,"birthYear":1997,"number":1},{"name":"Kobi Simmons","team":"Baskonia","nationality":"USA","position":"Guard","height":196,"birthYear":1997,"number":2},{"name":"Markquis Nowell","team":"Baskonia","nationality":"USA","position":"Guard","height":170,"birthYear":1999,"number":3},{"name":"Rafa Villar","team":"Baskonia","nationality":"Spain","position":"Guard","height":191,"birthYear":2004,"number":4},{"name":"Rodions Kurucs","team":"Baskonia","nationality":"Latvia","position":"Forward","height":206,"birthYear":1998,"number":7},{"name":"Tadas Sedekerskis","team":"Baskonia","nationality":"Lithuania","position":"Forward","height":206,"birthYear":1998,"number":8},{"name":"Timothe Luwawu-Cabarrot","team":"Baskonia","nationality":"France","position":"Forward","height":198,"birthYear":1995,"number":9},{"name":"Matteo Spagnolo","team":"Baskonia","nationality":"Italy","position":"Guard","height":192,"birthYear":2003,"number":10},{"name":"Jesse Edwards","team":"Baskonia","nationality":"Netherlands","position":"Center","height":213,"birthYear":2000,"number":14},{"name":"Khalifa Diop","team":"Baskonia","nationality":"Senegal","position":"Center","height":215,"birthYear":2002,"number":18},{"name":"Clement Frisch","team":"Baskonia","nationality":"France","position":"Forward","height":201,"birthYear":2002,"number":25},{"name":"Stefan Joksimovic","team":"Baskonia","nationality":"Slovenia","position":"Guard","height":201,"birthYear":2008,"number":77},{"name":"Brancou Badio","team":"Valencia","nationality":"Senegal","position":"Guard","height":191,"birthYear":1999,"number":0},{"name":"Kameron Taylor","team":"Valencia","nationality":"USA","position":"Guard","height":198,"birthYear":1994,"number":1},{"name":"Josep Puerto","team":"Valencia","nationality":"Spain","position":"Guard","height":200,"birthYear":1999,"number":2},{"name":"Nate Reuvers","team":"Valencia","nationality":"USA","position":"Forward","height":211,"birthYear":1998,"number":3},{"name":"Jaime Pradilla","team":"Valencia","nationality":"Spain","position":"Forward","height":205,"birthYear":2001,"number":4},{"name":"Sergio de Larrea","team":"Valencia","nationality":"Spain","position":"Guard","height":198,"birthYear":2005,"number":5},{"name":"Xabier Lopez-Arostegui","team":"Valencia","nationality":"Spain","position":"Forward","height":200,"birthYear":1997,"number":6},{"name":"Braxton Key","team":"Valencia","nationality":"USA","position":"Forward","height":203,"birthYear":1997,"number":7},{"name":"Jean Montero","team":"Valencia","nationality":"Dominican Republic","position":"Guard","height":190,"birthYear":2003,"number":8},{"name":"Omari Moore","team":"Valencia","nationality":"USA","position":"Guard","height":198,"birthYear":2000,"number":10},{"name":"Neal Sako","team":"Valencia","nationality":"France","position":"Center","height":211,"birthYear":1998,"number":12},{"name":"Darius Thompson","team":"Valencia","nationality":"USA","position":"Guard","height":193,"birthYear":1995,"number":13},{"name":"Matt Costello","team":"Valencia","nationality":"USA","position":"Forward","height":208,"birthYear":1993,"number":24},{"name":"Isaac Nogues","team":"Valencia","nationality":"Spain","position":"Guard","height":196,"birthYear":2004,"number":32},{"name":"Yankuba Sima","team":"Valencia","nationality":"Spain","position":"Center","height":211,"birthYear":1996,"number":77}]});

raw.push({"players":[{"name":"T.J. Shorts","team":"Panathinaikos","nationality":"North Macedonia","position":"Guard","height":175,"birthYear":1997,"number":0},{"name":"Panagiotis Kalaitzakis","team":"Panathinaikos","nationality":"Greece","position":"Forward","height":200,"birthYear":1999,"number":5},{"name":"Cedi Osman","team":"Panathinaikos","nationality":"Turkey","position":"Forward","height":207,"birthYear":1995,"number":6},{"name":"Richaun Holmes","team":"Panathinaikos","nationality":"USA","position":"Center","height":206,"birthYear":1993,"number":8},{"name":"Kostas Sloukas","team":"Panathinaikos","nationality":"Greece","position":"Guard","height":190,"birthYear":1990,"number":10},{"name":"Nigel Hayes-Davis","team":"Panathinaikos","nationality":"USA","position":"Forward","height":201,"birthYear":1994,"number":11},{"name":"Nikos Rogkavopoulos","team":"Panathinaikos","nationality":"Greece","position":"Forward","height":203,"birthYear":2001,"number":17},{"name":"Alexandros Samodurov","team":"Panathinaikos","nationality":"Greece","position":"Forward","height":210,"birthYear":2005,"number":20},{"name":"Jerian Grant","team":"Panathinaikos","nationality":"USA","position":"Guard","height":193,"birthYear":1992,"number":22},{"name":"Ioannis Kouzeloglou","team":"Panathinaikos","nationality":"Greece","position":"Center","height":207,"birthYear":1995,"number":24},{"name":"Kendrick Nunn","team":"Panathinaikos","nationality":"Greece","position":"Guard","height":190,"birthYear":1995,"number":25},{"name":"Mathias Lessort","team":"Panathinaikos","nationality":"France","position":"Center","height":206,"birthYear":1995,"number":26},{"name":"Vassilis Toliopoulos","team":"Panathinaikos","nationality":"Greece","position":"Guard","height":188,"birthYear":1996,"number":27},{"name":"Kenneth Faried","team":"Panathinaikos","nationality":"USA","position":"Forward","height":203,"birthYear":1989,"number":35},{"name":"Marius Grigonis","team":"Panathinaikos","nationality":"Lithuania","position":"Forward","height":198,"birthYear":1994,"number":40},{"name":"Juancho Hernangomez","team":"Panathinaikos","nationality":"Spain","position":"Forward","height":206,"birthYear":1995,"number":41},{"name":"Dinos Mitoglou","team":"Panathinaikos","nationality":"Greece","position":"Forward","height":210,"birthYear":1996,"number":44},{"name":"Omer Yurtseven","team":"Panathinaikos","nationality":"Turkey","position":"Center","height":213,"birthYear":1998,"number":77},{"name":"Thomas Walkup","team":"Olympiacos","nationality":"USA","position":"Guard","height":195,"birthYear":1992,"number":0},{"name":"Keenan Evans","team":"Olympiacos","nationality":"USA","position":"Guard","height":191,"birthYear":1996,"number":2},{"name":"Tyson Ward","team":"Olympiacos","nationality":"USA","position":"Forward","height":198,"birthYear":1997,"number":3},{"name":"Giorgos Bourneles","team":"Olympiacos","nationality":"Greece","position":"Guard","height":189,"birthYear":2007,"number":4},{"name":"Giannoulis Larentzakis","team":"Olympiacos","nationality":"Greece","position":"Guard","height":196,"birthYear":1993,"number":5},{"name":"Monte Morris","team":"Olympiacos","nationality":"USA","position":"Guard","height":188,"birthYear":1995,"number":11},{"name":"Alexandros Vezenkov","team":"Olympiacos","nationality":"Bulgaria","position":"Forward","height":206,"birthYear":1995,"number":14},{"name":"Kostas Papanikolaou","team":"Olympiacos","nationality":"Greece","position":"Forward","height":203,"birthYear":1990,"number":16},{"name":"Omiros Netzipoglou","team":"Olympiacos","nationality":"Greece","position":"Guard","height":195,"birthYear":2002,"number":21},{"name":"Tyler Dorsey","team":"Olympiacos","nationality":"USA","position":"Guard","height":196,"birthYear":1996,"number":22},{"name":"Alec Peters","team":"Olympiacos","nationality":"USA","position":"Forward","height":206,"birthYear":1995,"number":25},{"name":"Nikola Milutinov","team":"Olympiacos","nationality":"Serbia","position":"Center","height":212,"birthYear":1994,"number":33},{"name":"Cory Joseph","team":"Olympiacos","nationality":"Canada","position":"Guard","height":191,"birthYear":1991,"number":34},{"name":"Donta Hall","team":"Olympiacos","nationality":"Azerbaijan","position":"Center","height":208,"birthYear":1997,"number":45},{"name":"Shaquielle McKissic","team":"Olympiacos","nationality":"USA","position":"Forward","height":196,"birthYear":1990,"number":77},{"name":"Tyrique Jones","team":"Olympiacos","nationality":"USA","position":"Center","height":206,"birthYear":1997,"number":88},{"name":"Evan Fournier","team":"Olympiacos","nationality":"France","position":"Guard","height":198,"birthYear":1992,"number":94},{"name":"Armando Bacot","team":"Fenerbahce","nationality":"USA","position":"Center","height":208,"birthYear":2000,"number":0},{"name":"Metecan Birsen","team":"Fenerbahce","nationality":"Turkey","position":"Forward","height":208,"birthYear":1995,"number":1},{"name":"Wade Baldwin IV","team":"Fenerbahce","nationality":"USA","position":"Guard","height":193,"birthYear":1996,"number":2},{"name":"Nicolo Melli","team":"Fenerbahce","nationality":"Italy","position":"Forward","height":205,"birthYear":1991,"number":4},{"name":"Mert Emre Eksioglu","team":"Fenerbahce","nationality":"Turkey","position":"Guard","height":188,"birthYear":2002,"number":5},{"name":"Talen Horton-Tucker","team":"Fenerbahce","nationality":"USA","position":"Guard","height":193,"birthYear":2000,"number":8},{"name":"Melih Mahmutoglu","team":"Fenerbahce","nationality":"Turkey","position":"Guard","height":191,"birthYear":1990,"number":10},{"name":"Brandon Boston Jr.","team":"Fenerbahce","nationality":"USA","position":"Guard","height":198,"birthYear":2001,"number":11},{"name":"Nando de Colo","team":"Fenerbahce","nationality":"France","position":"Guard","height":196,"birthYear":1987,"number":12},{"name":"Tarik Biberovic","team":"Fenerbahce","nationality":"Turkey","position":"Forward","height":201,"birthYear":2001,"number":13},{"name":"Onuralp Bitim","team":"Fenerbahce","nationality":"Turkey","position":"Forward","height":198,"birthYear":1999,"number":17},{"name":"Mikael Jantunen","team":"Fenerbahce","nationality":"Finland","position":"Forward","height":203,"birthYear":2000,"number":18},{"name":"Devon Hall","team":"Fenerbahce","nationality":"USA","position":"Guard","height":196,"birthYear":1995,"number":20},{"name":"Yigit Hamza Mestoglu","team":"Fenerbahce","nationality":"Turkey","position":"Forward","height":203,"birthYear":2004,"number":22},{"name":"Chris Silva","team":"Fenerbahce","nationality":"Gabon","position":"Forward","height":203,"birthYear":1996,"number":30},{"name":"Arturs Zagars","team":"Fenerbahce","nationality":"Latvia","position":"Guard","height":190,"birthYear":2000,"number":32},{"name":"Jilson Bango","team":"Fenerbahce","nationality":"Angola","position":"Forward","height":208,"birthYear":1999,"number":44},{"name":"Bonzie Colson","team":"Fenerbahce","nationality":"USA","position":"Forward","height":198,"birthYear":1996,"number":50},{"name":"Khem Birch","team":"Fenerbahce","nationality":"Canada","position":"Center","height":206,"birthYear":1992,"number":92},{"name":"Shane Larkin","team":"Anadolu Efes","nationality":"Turkey","position":"Guard","height":180,"birthYear":1992,"number":0},{"name":"Rodrigue Beaubois","team":"Anadolu Efes","nationality":"France","position":"Guard","height":185,"birthYear":1988,"number":1},{"name":"Sehmus Hazer","team":"Anadolu Efes","nationality":"Turkey","position":"Guard","height":191,"birthYear":1999,"number":2},{"name":"Jordan Loyd","team":"Anadolu Efes","nationality":"Poland","position":"Guard","height":193,"birthYear":1993,"number":3},{"name":"Saben Lee","team":"Anadolu Efes","nationality":"USA","position":"Guard","height":188,"birthYear":1999,"number":5},{"name":"Nick Weiler-Babb","team":"Anadolu Efes","nationality":"USA","position":"Guard","height":196,"birthYear":1995,"number":8},{"name":"Georgios Papagiannis","team":"Anadolu Efes","nationality":"Greece","position":"Center","height":220,"birthYear":1997,"number":9},{"name":"Isaia Cordinier","team":"Anadolu Efes","nationality":"France","position":"Guard","height":196,"birthYear":1996,"number":10},{"name":"Rolands Smits","team":"Anadolu Efes","nationality":"Latvia","position":"Forward","height":208,"birthYear":1995,"number":11},{"name":"Brice Dessert","team":"Anadolu Efes","nationality":"France","position":"Center","height":211,"birthYear":2003,"number":13},{"name":"P.J. Dozier","team":"Anadolu Efes","nationality":"USA","position":"Guard","height":198,"birthYear":1996,"number":15},{"name":"Vincent Poirier","team":"Anadolu Efes","nationality":"France","position":"Center","height":213,"birthYear":1993,"number":17},{"name":"Burak Can Yildizli","team":"Anadolu Efes","nationality":"Turkey","position":"Forward","height":203,"birthYear":1994,"number":19},{"name":"Cole Swider","team":"Anadolu Efes","nationality":"USA","position":"Forward","height":208,"birthYear":1999,"number":21},{"name":"David Mutaf","team":"Anadolu Efes","nationality":"Turkey","position":"Guard","height":197,"birthYear":2002,"number":23},{"name":"Ercan Osmani","team":"Anadolu Efes","nationality":"Turkey","position":"Forward","height":211,"birthYear":1998,"number":24},{"name":"Erkan Yilmaz","team":"Anadolu Efes","nationality":"Turkey","position":"Forward","height":192,"birthYear":1997,"number":33},{"name":"Kai Jones","team":"Anadolu Efes","nationality":"Bahamas","position":"Center","height":211,"birthYear":2001,"number":88}]});

raw.push({"players":[{"name":"Gabriel Lundberg","team":"Maccabi Tel Aviv","nationality":"Denmark","position":"Guard","height":193,"birthYear":1994,"number":0},{"name":"Jaylen Hoard","team":"Maccabi Tel Aviv","nationality":"France","position":"Forward","height":203,"birthYear":1999,"number":1},{"name":"Jimmy Clark III","team":"Maccabi Tel Aviv","nationality":"USA","position":"Guard","height":191,"birthYear":2001,"number":2},{"name":"Marcio Santos","team":"Maccabi Tel Aviv","nationality":"Brazil","position":"Center","height":204,"birthYear":2002,"number":3},{"name":"Gur Lavy","team":"Maccabi Tel Aviv","nationality":"Israel","position":"Forward","height":198,"birthYear":2001,"number":4},{"name":"Amit Ebo","team":"Maccabi Tel Aviv","nationality":"Israel","position":"Guard","height":184,"birthYear":1999,"number":5},{"name":"Lonnie Walker IV","team":"Maccabi Tel Aviv","nationality":"USA","position":"Guard","height":193,"birthYear":1998,"number":8},{"name":"Roman Sorkin","team":"Maccabi Tel Aviv","nationality":"Israel","position":"Forward","height":208,"birthYear":1996,"number":9},{"name":"Oshae Brissett","team":"Maccabi Tel Aviv","nationality":"Canada","position":"Forward","height":201,"birthYear":1998,"number":10},{"name":"Will Rayman","team":"Maccabi Tel Aviv","nationality":"Israel","position":"Forward","height":203,"birthYear":1997,"number":11},{"name":"John DiBartolomeo","team":"Maccabi Tel Aviv","nationality":"Israel","position":"Guard","height":183,"birthYear":1991,"number":12},{"name":"TJ Leaf","team":"Maccabi Tel Aviv","nationality":"Israel","position":"Forward","height":208,"birthYear":1997,"number":22},{"name":"Zach Hankins","team":"Maccabi Tel Aviv","nationality":"USA","position":"Center","height":211,"birthYear":1996,"number":35},{"name":"Tamir Blatt","team":"Maccabi Tel Aviv","nationality":"Israel","position":"Guard","height":178,"birthYear":1997,"number":45},{"name":"Johnathan Motley","team":"Hapoel Tel Aviv","nationality":"USA","position":"Forward","height":206,"birthYear":1995,"number":0},{"name":"Antonio Blakeney","team":"Hapoel Tel Aviv","nationality":"USA","position":"Guard","height":193,"birthYear":1996,"number":2},{"name":"Elijah Bryant","team":"Hapoel Tel Aviv","nationality":"USA","position":"Guard","height":196,"birthYear":1995,"number":3},{"name":"Itay Segev","team":"Hapoel Tel Aviv","nationality":"Israel","position":"Forward","height":205,"birthYear":1995,"number":6},{"name":"Guy Palatin","team":"Hapoel Tel Aviv","nationality":"Israel","position":"Guard","height":192,"birthYear":2000,"number":9},{"name":"Bar Timor","team":"Hapoel Tel Aviv","nationality":"Israel","position":"Guard","height":190,"birthYear":1992,"number":10},{"name":"Tyler Ennis","team":"Hapoel Tel Aviv","nationality":"Canada","position":"Guard","height":191,"birthYear":1994,"number":11},{"name":"Oz Blayzer","team":"Hapoel Tel Aviv","nationality":"Israel","position":"Forward","height":200,"birthYear":1992,"number":14},{"name":"Collin Malcolm","team":"Hapoel Tel Aviv","nationality":"USA","position":"Forward","height":201,"birthYear":1997,"number":17},{"name":"Levi Randolph","team":"Hapoel Tel Aviv","nationality":"USA","position":"Forward","height":198,"birthYear":1992,"number":20},{"name":"Tai Odiase","team":"Hapoel Tel Aviv","nationality":"Puerto Rico","position":"Center","height":206,"birthYear":1995,"number":21},{"name":"Vasilije Micic","team":"Hapoel Tel Aviv","nationality":"Serbia","position":"Guard","height":191,"birthYear":1994,"number":22},{"name":"Keandre Cook","team":"Hapoel Tel Aviv","nationality":"USA","position":"Guard","height":196,"birthYear":1997,"number":23},{"name":"Ish Wainright","team":"Hapoel Tel Aviv","nationality":"Uganda","position":"Forward","height":196,"birthYear":1994,"number":24},{"name":"Daniel Oturu","team":"Hapoel Tel Aviv","nationality":"USA","position":"Center","height":208,"birthYear":1999,"number":25},{"name":"Yam Madar","team":"Hapoel Tel Aviv","nationality":"Israel","position":"Guard","height":190,"birthYear":2000,"number":26},{"name":"Tomer Ginat","team":"Hapoel Tel Aviv","nationality":"Israel","position":"Forward","height":202,"birthYear":1994,"number":41},{"name":"Vlatko Cancar","team":"Olimpia Milano","nationality":"Slovenia","position":"Forward","height":203,"birthYear":1997,"number":0},{"name":"Nico Mannion","team":"Olimpia Milano","nationality":"Italy","position":"Guard","height":188,"birthYear":2001,"number":1},{"name":"Lorenzo Brown","team":"Olimpia Milano","nationality":"Spain","position":"Guard","height":196,"birthYear":1990,"number":2},{"name":"Devin Booker","team":"Olimpia Milano","nationality":"USA","position":"Center","height":206,"birthYear":1991,"number":6},{"name":"Stefano Tonut","team":"Olimpia Milano","nationality":"Italy","position":"Guard","height":194,"birthYear":1993,"number":7},{"name":"Leandro Bolmaro","team":"Olimpia Milano","nationality":"Argentina","position":"Guard","height":198,"birthYear":2000,"number":10},{"name":"Armoni Brooks","team":"Olimpia Milano","nationality":"USA","position":"Guard","height":191,"birthYear":1998,"number":12},{"name":"Zach LeDay","team":"Olimpia Milano","nationality":"Azerbaijan","position":"Forward","height":202,"birthYear":1994,"number":16},{"name":"Giampaolo Ricci","team":"Olimpia Milano","nationality":"Italy","position":"Forward","height":202,"birthYear":1991,"number":17},{"name":"Diego Flaccadori","team":"Olimpia Milano","nationality":"Italy","position":"Guard","height":195,"birthYear":1996,"number":21},{"name":"Marko Guduric","team":"Olimpia Milano","nationality":"Serbia","position":"Guard","height":198,"birthYear":1995,"number":23},{"name":"Ousmane Diop","team":"Olimpia Milano","nationality":"Senegal","position":"Center","height":204,"birthYear":2000,"number":25},{"name":"Shavon Shields","team":"Olimpia Milano","nationality":"Denmark","position":"Forward","height":201,"birthYear":1994,"number":31},{"name":"Josh Nebo","team":"Olimpia Milano","nationality":"Slovenia","position":"Center","height":206,"birthYear":1997,"number":32},{"name":"Bryant Dunston","team":"Olimpia Milano","nationality":"Armenia","position":"Center","height":203,"birthYear":1986,"number":42},{"name":"Nate Sestina","team":"Olimpia Milano","nationality":"USA","position":"Forward","height":206,"birthYear":1997,"number":77},{"name":"Luca Vildoza","team":"Virtus Bologna","nationality":"Argentina","position":"Guard","height":191,"birthYear":1995,"number":1},{"name":"Carsen Edwards","team":"Virtus Bologna","nationality":"USA","position":"Guard","height":180,"birthYear":1998,"number":3},{"name":"Alessandro Pajola","team":"Virtus Bologna","nationality":"Italy","position":"Guard","height":194,"birthYear":1999,"number":6},{"name":"Saliou Niang","team":"Virtus Bologna","nationality":"Italy","position":"Forward","height":199,"birthYear":2004,"number":7},{"name":"Alen Smailagic","team":"Virtus Bologna","nationality":"Serbia","position":"Forward","height":208,"birthYear":2000,"number":9},{"name":"Derrick Alston Jr.","team":"Virtus Bologna","nationality":"USA","position":"Forward","height":206,"birthYear":1997,"number":21},{"name":"Daniel Hackett","team":"Virtus Bologna","nationality":"Italy","position":"Guard","height":196,"birthYear":1987,"number":23},{"name":"Matt Morgan","team":"Virtus Bologna","nationality":"USA","position":"Guard","height":193,"birthYear":1997,"number":30},{"name":"Aliou Diarra","team":"Virtus Bologna","nationality":"Mali","position":"Center","height":208,"birthYear":2001,"number":31},{"name":"Karim Jallow","team":"Virtus Bologna","nationality":"Germany","position":"Forward","height":198,"birthYear":1997,"number":34},{"name":"Mouhamet Diouf","team":"Virtus Bologna","nationality":"Italy","position":"Center","height":208,"birthYear":2001,"number":35},{"name":"Nicola Akele","team":"Virtus Bologna","nationality":"Italy","position":"Forward","height":203,"birthYear":1995,"number":45},{"name":"Yago dos Santos","team":"Virtus Bologna","nationality":"Brazil","position":"Guard","height":173,"birthYear":1999,"number":99}]});

raw.push({"players":[{"name":"Mike James","team":"AS Monaco","nationality":"USA","position":"Guard","height":185,"birthYear":1990,"number":55},{"name":"Elie Okobo","team":"AS Monaco","nationality":"France","position":"Guard","height":191,"birthYear":1997,"number":0},{"name":"Matthew Strazel","team":"AS Monaco","nationality":"France","position":"Guard","height":182,"birthYear":2002,"number":32},{"name":"Nemanja Nedovic","team":"AS Monaco","nationality":"Serbia","position":"Guard","height":192,"birthYear":1991,"number":26},{"name":"Juhann Begarin","team":"AS Monaco","nationality":"France","position":"Guard","height":196,"birthYear":2002,"number":23},{"name":"Nikola Mirotic","team":"AS Monaco","nationality":"Montenegro","position":"Forward","height":208,"birthYear":1991,"number":33},{"name":"Daniel Theis","team":"AS Monaco","nationality":"Germany","position":"Center","height":203,"birthYear":1992,"number":10},{"name":"Alpha Diallo","team":"AS Monaco","nationality":"Guinea","position":"Forward","height":201,"birthYear":1997,"number":11},{"name":"Jaron Blossomgame","team":"AS Monaco","nationality":"USA","position":"Forward","height":201,"birthYear":1993,"number":4},{"name":"Terry Tarpey","team":"AS Monaco","nationality":"France","position":"Forward","height":196,"birthYear":1994,"number":22},{"name":"Yoan Makoundou","team":"AS Monaco","nationality":"France","position":"Center","height":207,"birthYear":2000,"number":5},{"name":"Kevarrius Hayes","team":"AS Monaco","nationality":"USA","position":"Center","height":206,"birthYear":1997,"number":13},{"name":"Maxim Klitschko","team":"AS Monaco","nationality":"Ukraine","position":"Center","height":216,"birthYear":2005,"number":6},{"name":"Nando De Colo","team":"ASVEL","nationality":"France","position":"Guard","height":196,"birthYear":1987,"number":12},{"name":"Thomas Heurtel","team":"ASVEL","nationality":"France","position":"Guard","height":188,"birthYear":1989,"number":7},{"name":"Glynn Watson Jr.","team":"ASVEL","nationality":"USA","position":"Guard","height":183,"birthYear":1997,"number":30},{"name":"Shaquille Harrison","team":"ASVEL","nationality":"USA","position":"Guard","height":193,"birthYear":1993,"number":3},{"name":"Edwin Jackson","team":"ASVEL","nationality":"France","position":"Guard","height":190,"birthYear":1989,"number":11},{"name":"Braian Angola","team":"ASVEL","nationality":"Colombia","position":"Guard","height":198,"birthYear":1994,"number":6},{"name":"David Lighty","team":"ASVEL","nationality":"USA","position":"Forward","height":196,"birthYear":1988,"number":23},{"name":"Zac Seljaas","team":"ASVEL","nationality":"USA","position":"Forward","height":201,"birthYear":1997,"number":1},{"name":"Melvin Ajinca","team":"ASVEL","nationality":"France","position":"Forward","height":202,"birthYear":2004,"number":8},{"name":"Mbaye Ndiaye","team":"ASVEL","nationality":"Senegal","position":"Forward","height":203,"birthYear":1999,"number":24},{"name":"Paul Eboua","team":"ASVEL","nationality":"Cameroon","position":"Forward","height":203,"birthYear":2000,"number":0},{"name":"Armel Traore","team":"ASVEL","nationality":"France","position":"Forward","height":205,"birthYear":2003,"number":94},{"name":"Bastien Vautier","team":"ASVEL","nationality":"France","position":"Center","height":210,"birthYear":1998,"number":32},{"name":"Bodian Massa","team":"ASVEL","nationality":"France","position":"Center","height":208,"birthYear":1997,"number":10},{"name":"Nadir Hifi","team":"Paris Basketball","nationality":"France","position":"Guard","height":184,"birthYear":2002,"number":2},{"name":"Justin Robinson","team":"Paris Basketball","nationality":"USA","position":"Guard","height":188,"birthYear":1997,"number":5},{"name":"Sebastian Herrera","team":"Paris Basketball","nationality":"Chile","position":"Guard","height":193,"birthYear":1997,"number":7},{"name":"Jared Rhoden","team":"Paris Basketball","nationality":"USA","position":"Guard","height":196,"birthYear":1999,"number":8},{"name":"Joel Ayayi","team":"Paris Basketball","nationality":"France","position":"Guard","height":196,"birthYear":2000,"number":11},{"name":"Jeremy Morgan","team":"Paris Basketball","nationality":"USA","position":"Guard","height":198,"birthYear":1995,"number":20},{"name":"Yakuba Ouattara","team":"Paris Basketball","nationality":"France","position":"Guard","height":192,"birthYear":1992,"number":24},{"name":"Lamar Stevens","team":"Paris Basketball","nationality":"USA","position":"Forward","height":201,"birthYear":1997,"number":9},{"name":"Amath M'Baye","team":"Paris Basketball","nationality":"France","position":"Forward","height":206,"birthYear":1989,"number":22},{"name":"Daulton Hommes","team":"Paris Basketball","nationality":"USA","position":"Forward","height":203,"birthYear":1996,"number":34},{"name":"Derek Willis","team":"Paris Basketball","nationality":"USA","position":"Forward","height":206,"birthYear":1995,"number":35},{"name":"Leopold Cavaliere","team":"Paris Basketball","nationality":"France","position":"Forward","height":203,"birthYear":1996,"number":4},{"name":"Allan Dokossi","team":"Paris Basketball","nationality":"Central African Republic","position":"Center","height":203,"birthYear":1999,"number":13},{"name":"Mouhamed Faye","team":"Paris Basketball","nationality":"Senegal","position":"Center","height":205,"birthYear":2005,"number":15},{"name":"Enzo Shahrvin","team":"Paris Basketball","nationality":"France","position":"Center","height":201,"birthYear":2003,"number":18},{"name":"Vladimir Lucic","team":"Bayern Munich","nationality":"Serbia","position":"Forward","height":204,"birthYear":1989,"number":11},{"name":"Andreas Obst","team":"Bayern Munich","nationality":"Germany","position":"Guard","height":191,"birthYear":1996,"number":13},{"name":"Rokas Jokubaitis","team":"Bayern Munich","nationality":"Lithuania","position":"Guard","height":193,"birthYear":2000,"number":31},{"name":"Justus Hollatz","team":"Bayern Munich","nationality":"Germany","position":"Guard","height":195,"birthYear":2001,"number":21},{"name":"Stefan Jovic","team":"Bayern Munich","nationality":"Serbia","position":"Guard","height":198,"birthYear":1990,"number":16},{"name":"Xavier Rathan-Mayes","team":"Bayern Munich","nationality":"Canada","position":"Guard","height":191,"birthYear":1994,"number":4},{"name":"Kamar Baldwin","team":"Bayern Munich","nationality":"USA","position":"Guard","height":185,"birthYear":1997,"number":44},{"name":"Justinian Jessup","team":"Bayern Munich","nationality":"USA","position":"Guard","height":198,"birthYear":1998,"number":10},{"name":"Niels Giffey","team":"Bayern Munich","nationality":"Germany","position":"Forward","height":200,"birthYear":1991,"number":5},{"name":"Oscar da Silva","team":"Bayern Munich","nationality":"Germany","position":"Forward","height":206,"birthYear":1998,"number":1},{"name":"Isiaha Mike","team":"Bayern Munich","nationality":"Canada","position":"Forward","height":203,"birthYear":1997,"number":22},{"name":"Elias Harris","team":"Bayern Munich","nationality":"Germany","position":"Forward","height":203,"birthYear":1989,"number":20},{"name":"Johannes Voigtmann","team":"Bayern Munich","nationality":"Germany","position":"Center","height":211,"birthYear":1992,"number":7},{"name":"Johannes Thiemann","team":"Bayern Munich","nationality":"Germany","position":"Center","height":206,"birthYear":1994,"number":0},{"name":"Leon Kratzer","team":"Bayern Munich","nationality":"Germany","position":"Center","height":212,"birthYear":1997,"number":8},{"name":"David McCormack","team":"Bayern Munich","nationality":"USA","position":"Center","height":208,"birthYear":1999,"number":33},{"name":"Wenyen Gabriel","team":"Bayern Munich","nationality":"South Sudan","position":"Center","height":206,"birthYear":1997,"number":32}]});

raw.push({"players":[{"name":"Chris Jones","team":"Crvena Zvezda","nationality":"USA","position":"Guard","height":188,"birthYear":1993,"number":1},{"name":"Stefan Miljenovic","team":"Crvena Zvezda","nationality":"Serbia","position":"Guard","height":193,"birthYear":2001,"number":2},{"name":"Aleksej Nedeljkovic","team":"Crvena Zvezda","nationality":"Serbia","position":"Forward","height":200,"birthYear":2008,"number":5},{"name":"Jared Butler","team":"Crvena Zvezda","nationality":"USA","position":"Guard","height":191,"birthYear":2000,"number":6},{"name":"Dejan Davidovac","team":"Crvena Zvezda","nationality":"Serbia","position":"Forward","height":203,"birthYear":1995,"number":7},{"name":"Tyson Carter","team":"Crvena Zvezda","nationality":"USA","position":"Guard","height":193,"birthYear":1998,"number":11},{"name":"Nikola Kalinic","team":"Crvena Zvezda","nationality":"Serbia","position":"Forward","height":203,"birthYear":1991,"number":12},{"name":"Ognjen Dobric","team":"Crvena Zvezda","nationality":"Serbia","position":"Forward","height":200,"birthYear":1994,"number":13},{"name":"Jasiel Rivero","team":"Crvena Zvezda","nationality":"Cuba","position":"Center","height":206,"birthYear":1993,"number":14},{"name":"Ebuka Izundu","team":"Crvena Zvezda","nationality":"Nigeria","position":"Center","height":208,"birthYear":1996,"number":15},{"name":"Sava Djuric","team":"Crvena Zvezda","nationality":"Serbia","position":"Center","height":209,"birthYear":2007,"number":16},{"name":"Ognjen Simjanovski","team":"Crvena Zvezda","nationality":"Serbia","position":"Guard","height":191,"birthYear":2009,"number":19},{"name":"Nikola Djurisic","team":"Crvena Zvezda","nationality":"Serbia","position":"Forward","height":203,"birthYear":2004,"number":23},{"name":"Jordan Nwora","team":"Crvena Zvezda","nationality":"Nigeria","position":"Forward","height":203,"birthYear":1998,"number":33},{"name":"Semi Ojeleye","team":"Crvena Zvezda","nationality":"Nigeria","position":"Forward","height":198,"birthYear":1994,"number":37},{"name":"Ognjen Radosic","team":"Crvena Zvezda","nationality":"Serbia","position":"Guard","height":197,"birthYear":2006,"number":44},{"name":"Chima Moneke","team":"Crvena Zvezda","nationality":"Nigeria","position":"Forward","height":199,"birthYear":1995,"number":95},{"name":"Carlik Jones","team":"Partizan","nationality":"South Sudan","position":"Guard","height":183,"birthYear":1997,"number":1},{"name":"Shake Milton","team":"Partizan","nationality":"USA","position":"Guard","height":196,"birthYear":1996,"number":2},{"name":"Miikka Muurinen","team":"Partizan","nationality":"Finland","position":"Forward","height":210,"birthYear":2007,"number":3},{"name":"Duane Washington Jr.","team":"Partizan","nationality":"USA","position":"Guard","height":188,"birthYear":2000,"number":4},{"name":"Dylan Osetkowski","team":"Partizan","nationality":"USA","position":"Forward","height":206,"birthYear":1996,"number":5},{"name":"Mario Nakic","team":"Partizan","nationality":"Serbia","position":"Forward","height":202,"birthYear":2001,"number":7},{"name":"Mitar Bosnjakovic","team":"Partizan","nationality":"Serbia","position":"Forward","height":201,"birthYear":2006,"number":8},{"name":"Vanja Marinkovic","team":"Partizan","nationality":"Serbia","position":"Guard","height":199,"birthYear":1997,"number":9},{"name":"Aleksej Pokusevski","team":"Partizan","nationality":"Serbia","position":"Forward","height":213,"birthYear":2001,"number":11},{"name":"Sterling Brown","team":"Partizan","nationality":"USA","position":"Guard","height":196,"birthYear":1995,"number":12},{"name":"Aleksa Radanov","team":"Partizan","nationality":"Serbia","position":"Forward","height":201,"birthYear":1998,"number":13},{"name":"Isaac Bonga","team":"Partizan","nationality":"Germany","position":"Forward","height":203,"birthYear":1999,"number":17},{"name":"Arijan Lakic","team":"Partizan","nationality":"Serbia","position":"Guard","height":198,"birthYear":2000,"number":19},{"name":"Tonye Jekiri","team":"Partizan","nationality":"Nigeria","position":"Center","height":213,"birthYear":1994,"number":23},{"name":"Bruno Fernando","team":"Partizan","nationality":"Angola","position":"Center","height":208,"birthYear":1998,"number":24},{"name":"Nick Calathes","team":"Partizan","nationality":"Greece","position":"Guard","height":198,"birthYear":1989,"number":33},{"name":"Joffrey Lauvergne","team":"Partizan","nationality":"France","position":"Center","height":211,"birthYear":1991,"number":77},{"name":"Nigel Williams-Goss","team":"Zalgiris Kaunas","nationality":"USA","position":"Guard","height":188,"birthYear":1994,"number":1},{"name":"Sylvain Francisco","team":"Zalgiris Kaunas","nationality":"France","position":"Guard","height":186,"birthYear":1997,"number":3},{"name":"Moses Wright","team":"Zalgiris Kaunas","nationality":"USA","position":"Center","height":206,"birthYear":1998,"number":7},{"name":"Ignas Brazdeikis","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Forward","height":201,"birthYear":1999,"number":8},{"name":"Dovydas Giedraitis","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Guard","height":193,"birthYear":2000,"number":9},{"name":"Azuolas Tubelis","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Forward","height":208,"birthYear":2002,"number":10},{"name":"Maodo Lo","team":"Zalgiris Kaunas","nationality":"Germany","position":"Guard","height":191,"birthYear":1992,"number":12},{"name":"Dustin Sleva","team":"Zalgiris Kaunas","nationality":"USA","position":"Forward","height":203,"birthYear":1995,"number":14},{"name":"Laurynas Birutis","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Center","height":213,"birthYear":1997,"number":15},{"name":"Mantas Rubstavicius","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Guard","height":198,"birthYear":2002,"number":17},{"name":"Arnas Butkevicius","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Forward","height":197,"birthYear":1992,"number":51},{"name":"Deividas Sirvydis","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Forward","height":204,"birthYear":2000,"number":91},{"name":"Edgaras Ulanovas","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Forward","height":199,"birthYear":1992,"number":92},{"name":"Nemanja Dangubic","team":"Dubai BC","nationality":"Serbia","position":"Forward","height":204,"birthYear":1993,"number":2},{"name":"Dwayne Bacon","team":"Dubai BC","nationality":"USA","position":"Forward","height":198,"birthYear":1995,"number":3},{"name":"Aleksa Avramovic","team":"Dubai BC","nationality":"Serbia","position":"Guard","height":193,"birthYear":1994,"number":4},{"name":"Awudu Abass","team":"Dubai BC","nationality":"Italy","position":"Forward","height":198,"birthYear":1993,"number":5},{"name":"Klemen Prepelic","team":"Dubai BC","nationality":"Slovenia","position":"Guard","height":191,"birthYear":1992,"number":7},{"name":"Davis Bertans","team":"Dubai BC","nationality":"Latvia","position":"Forward","height":208,"birthYear":1992,"number":8},{"name":"Justin Anderson","team":"Dubai BC","nationality":"USA","position":"Forward","height":196,"birthYear":1993,"number":10},{"name":"Kosta Kondic","team":"Dubai BC","nationality":"Serbia","position":"Guard","height":193,"birthYear":2001,"number":11},{"name":"Dzanan Musa","team":"Dubai BC","nationality":"Bosnia and Herzegovina","position":"Forward","height":205,"birthYear":1999,"number":13},{"name":"Mam Jaiteh","team":"Dubai BC","nationality":"France","position":"Center","height":211,"birthYear":1994,"number":14},{"name":"Mfiondu Kabengele","team":"Dubai BC","nationality":"Canada","position":"Center","height":206,"birthYear":1997,"number":17},{"name":"McKinley Wright IV","team":"Dubai BC","nationality":"USA","position":"Guard","height":185,"birthYear":1998,"number":25},{"name":"Filip Petrusev","team":"Dubai BC","nationality":"Serbia","position":"Center","height":211,"birthYear":2000,"number":30},{"name":"Kenan Kamenjas","team":"Dubai BC","nationality":"Bosnia and Herzegovina","position":"Center","height":207,"birthYear":2000,"number":34}]});

// --- Consolidation ----------------------------------------------------------
const YOUNGEST_BIRTH_YEAR = 2006;   // drop development players born 2007+

// Nationality convention: "where the player is from" (birthplace / passport),
// NOT an adopted senior national team. The research captured FIBA national
// teams, so these naturalized/heritage players are corrected to their origin.
const NATIONALITY_OVERRIDES = {
  "Kendrick Nunn":  "USA",   // plays for Greece
  "Shane Larkin":   "USA",   // plays for Turkey
  "T.J. Shorts":    "USA",   // plays for North Macedonia
  "Jordan Loyd":    "USA",   // plays for Poland
  "Donta Hall":     "USA",   // plays for Azerbaijan
  "Zach LeDay":     "USA",   // plays for Azerbaijan
  "Josh Nebo":      "USA",   // plays for Slovenia
  "Bryant Dunston": "USA",   // plays for Armenia
  "Lorenzo Brown":  "USA",   // plays for Spain
  "Ish Wainright":  "USA",   // plays for Uganda
  "Tai Odiase":     "USA",   // plays for Puerto Rico
  "Jordan Nwora":   "USA",   // plays for Nigeria
  "Semi Ojeleye":   "USA",   // plays for Nigeria
  "Carlik Jones":   "USA",   // plays for South Sudan
  "Nick Calathes":  "USA",   // plays for Greece
  "Terry Tarpey":   "USA",   // plays for France
  "Alpha Diallo":   "France",// born/raised France, plays for Guinea
};

// --- 2025-26 official-roster cross-check corrections -------------------------
// Verified team-by-team against the official euroleaguebasketball.net
// ?season=2025-26 roster pages. (1) remove players not on the official roster
// (or rostered but never played a EuroLeague game); (2) fix positions only where
// ours was clearly wrong; (3) move a misassigned player; adds are appended below.
const ROSTER_REMOVE = new Set([
  "Maxim Klitschko",                                             // AS Monaco (Makoundou restored for 2026-27)
  "Jesse Edwards",                                               // Baskonia
  "Ognjen Radosic",                                              // Crvena Zvezda (Djurisic restored for 2026-27)
  "Mam Jaiteh",                                                  // Dubai BC
  "Mert Emre Eksioglu", "Yigit Hamza Mestoglu", "Jilson Bango",  // Fenerbahce
  "Itay Segev", "Tyler Ennis", "Oz Blayzer", "Keandre Cook",     // Hapoel Tel Aviv
  "Vlatko Cancar",                                               // Olimpia Milano (contract terminated Oct 2025, 2 EL games)
  "Keenan Evans",                                                // Olympiacos (Netzipoglou restored for 2026-27)
  "Richaun Holmes", "Ioannis Kouzeloglou",                       // Panathinaikos
  "Mady Sissoko",                                                // Real Madrid (Omer Yurtseven kept per user)
  "Yago dos Santos",                                             // Virtus Bologna
].map(n => n.toLowerCase()));

// Positions fixed only where ours was clearly wrong and the official page better.
const ROSTER_POSITION = { "Juhann Begarin": "Forward", "Jan Vesely": "Center", "Chris Silva": "Center" };

// Chris Jones is on Hapoel Tel Aviv's official 2025-26 roster (was misassigned to Crvena Zvezda).
const ROSTER_TEAM = { "Chris Jones": "Hapoel Tel Aviv" };

// Keep despite the born-2007+ development filter — actually played EuroLeague
// minutes and is on the official roster (user-confirmed).
const ROSTER_KEEP_YOUNG = new Set(["Sayon Keita"]);

// Official-roster players missing from our DB who DID play a EuroLeague game
// (researched careers live in build_careers.js). Sayon Keita is already in the
// raw blobs above, so he is only whitelisted (above), not re-added here.
const ROSTER_ADD = [
  {"name":"Trent Forrest","team":"Baskonia","nationality":"USA","position":"Guard","height":193,"birthYear":1998,"number":11},
  {"name":"Eugene Omoruyi","team":"Baskonia","nationality":"Nigeria","position":"Forward","height":198,"birthYear":1997,"number":5},
  {"name":"Gytis Radzevicius","team":"Baskonia","nationality":"Lithuania","position":"Forward","height":197,"birthYear":1995,"number":17},
  {"name":"Codi Miller-McIntyre","team":"Crvena Zvezda","nationality":"USA","position":"Guard","height":191,"birthYear":1994,"number":0},
  {"name":"Isaiah Canaan","team":"Crvena Zvezda","nationality":"USA","position":"Guard","height":183,"birthYear":1991,"number":3},
  {"name":"Donatas Motiejunas","team":"Crvena Zvezda","nationality":"Lithuania","position":"Center","height":213,"birthYear":1990,"number":20},
  {"name":"Joel Bolomboy","team":"Crvena Zvezda","nationality":"Ukraine","position":"Forward","height":203,"birthYear":1994,"number":21},
  {"name":"Neno Dimitrijevic","team":"Bayern Munich","nationality":"North Macedonia","position":"Guard","height":190,"birthYear":1998,"number":0},
  {"name":"Bruno Caboclo","team":"Dubai BC","nationality":"Brazil","position":"Forward","height":208,"birthYear":1995,"number":51},
  {"name":"Kessler Edwards","team":"Hapoel Tel Aviv","nationality":"USA","position":"Forward","height":203,"birthYear":2000,"number":15},
  {"name":"Jeffrey Dowtin Jr.","team":"Maccabi Tel Aviv","nationality":"USA","position":"Guard","height":191,"birthYear":1997,"number":21},
  {"name":"Quinn Ellis","team":"Olimpia Milano","nationality":"United Kingdom","position":"Guard","height":196,"birthYear":2003,"number":3},
  {"name":"Frank Ntilikina","team":"Olympiacos","nationality":"France","position":"Guard","height":193,"birthYear":1998,"number":1},
  {"name":"Moustapha Fall","team":"Olympiacos","nationality":"France","position":"Center","height":218,"birthYear":1992,"number":10},
];

// --- 2026-27 season roster update ------------------------------------------
// Applied club-by-club against the official 2026-27 roster pages. Players who
// left a club are removed; players who moved between clubs we already carry are
// re-homed (team + new jersey number). Brand-new players are researched and
// added in a later batch.
const SEASON_REMOVE = new Set([
  "Rodrigue Beaubois", "Sehmus Hazer",      // Anadolu Efes (Larkin → Fenerbahce, Saben Lee → Zalgiris)
  "Rolands Smits", "Brice Dessert", "Vincent Poirier",               // (Weiler-Babb → Crvena Zvezda)
  "Burak Can Yildizli", "Cole Swider",
  "Nico Mannion", "Lorenzo Brown", "Quinn Ellis",       // Olimpia Milano (Brooks → Valencia)
  "Bryant Dunston",    // (Nebo → FC Barcelona, Shields → Fenerbahce, LeDay → Hapoel, Sestina → ASVEL)
  "Isaiah Canaan", "Nikola Kalinic",              // Crvena Zvezda (Miller-McIntyre → Olympiacos)
  "Donatas Motiejunas",   // (Bolomboy → ASVEL, Rivero → Valencia)
  "Nemanja Dangubic", "Aleksa Avramovic", "Awudu Abass",                 // Dubai BC
  "Kenan Kamenjas",                                                      // (Caboclo → Hapoel)
  "Juani Marcos", "Jan Vesely",            // FC Barcelona (Norris → Bayern, Cale → ASVEL)
  "Willy Hernangomez", "Youssoupha Fall",   // (Satoransky → Hapoel)
  "Nicolas Laprovittola", "Sayon Keita",                                 // (Clyburn → Fenerbahce)
  "Brandon Boston Jr.", "Nando de Colo",                // Fenerbahce (Bacot, Colson → Maccabi)
  "Tarik Biberovic", "Arturs Zagars", "Khem Birch",   // (Jantunen → Real Madrid)
  "Guy Palatin", "Levi Randolph",        // Hapoel Tel Aviv (Madar → Maccabi, K. Edwards → Virtus)
  "Markquis Nowell", "Rafa Villar",           // Baskonia (Luwawu-Cabarrot → Real Madrid)
  "Gytis Radzevicius", "Khalifa Diop",
  "Paul Eboua", "Zac Seljaas", "Shaquille Harrison", "Braian Angola",    // ASVEL
  "Thomas Heurtel", "Melvin Ajinca", "Glynn Watson Jr.",   // (Ndiaye → Olympiacos)
  "Bastien Vautier", "Armel Traore",
  "Marcio Santos", "Lonnie Walker IV", "Jeffrey Dowtin Jr.",             // Maccabi Tel Aviv
  "Zach Hankins", "Tamir Blatt",
  "Giannoulis Larentzakis",         // Olympiacos (Fall → Panathinaikos, Ntilikina → Paris)
  "Monte Morris", "Shaquielle McKissic",
  "Cedi Osman", "Alexandros Samodurov",                   // Panathinaikos (Shorts → Valencia)
  "Vassilis Toliopoulos",                     // (Grigonis → Zalgiris)
  "Enzo Shahrvin", "Amath M'Baye", "Yakuba Ouattara",   // Paris Basketball (Stevens, Willis → Partizan)
  "Shake Milton", "Mitar Bosnjakovic",               // Partizan (Osetkowski → Valencia)
  "Aleksej Pokusevski", "Aleksa Radanov", "Nick Calathes",   // (Sterling Brown → Zalgiris)
  "Trey Lyles", "Mario Hezonja", "Izan Almansa", "Alex Len",             // Real Madrid
  "Omer Yurtseven",
  "Sergio de Larrea", "Xabier Lopez-Arostegui", "Matt Costello",         // Valencia
  "Isaac Nogues",
  "Saliou Niang", "Alen Smailagic", "Matt Morgan",     // Virtus Bologna (Carsen Edwards → Zalgiris)
  "Karim Jallow",
  "Ignas Brazdeikis", "Laurynas Birutis", "Mantas Rubstavicius",         // Zalgiris Kaunas
  "Neno Dimitrijevic", "Xavier Rathan-Mayes", "Leon Kratzer",            // Bayern Munich
  "Stefan Jovic", "Elias Harris", "Isiaha Mike", "David McCormack",
].map(n => n.toLowerCase()));

// Clubs that left the EuroLeague this season. Their players who aren't moved
// elsewhere (SEASON_MOVE) become season leavers automatically. The country is
// kept here because the club is no longer in TEAMS.
const SEASON_DROPPED_CLUBS = {
  "AS Monaco": { country: "France" },   // based in Monaco, plays in the French league (LNB)
};

// Non-active players (LEGENDS) back on a current roster: full record, new club.
// build_legends.js drops them from the non-active pool; build_careers.js opens
// their new stint.
const SEASON_RETURN = [
  {"name":"Scottie Wilbekin","team":"Besiktas","nationality":"USA","position":"Guard","height":188,"birthYear":1993,"number":12},
];

// Players new to the database for 2026-27 (researched in batches; careers
// live in build_careers.js under "2026-27 new arrivals").
const SEASON_ADD = [
  // batch 4 (2026-09-24)
  {"name":"RJ Cole","team":"Olimpia Milano","nationality":"USA","position":"Guard","height":185,"birthYear":1999,"number":2},
  {"name":"Jason Burnell","team":"Olimpia Milano","nationality":"USA","position":"Forward","height":201,"birthYear":1997,"number":0},
  {"name":"Umoja Gibson","team":"FC Barcelona","nationality":"USA","position":"Guard","height":183,"birthYear":1998,"number":1},
  {"name":"Justin Minaya","team":"FC Barcelona","nationality":"USA","position":"Guard","height":196,"birthYear":1999,"number":24},
  {"name":"Olek Balcerowski","team":"FC Barcelona","nationality":"Poland","position":"Center","height":216,"birthYear":2000,"number":22},
  {"name":"Austin Wiley","team":"Bayern Munich","nationality":"USA","position":"Center","height":208,"birthYear":1999,"number":50},
  {"name":"Tobias Jensen","team":"Bayern Munich","nationality":"Denmark","position":"Guard","height":198,"birthYear":2004,"number":8},
  {"name":"Sertac Sanli","team":"Fenerbahce","nationality":"Turkey","position":"Center","height":213,"birthYear":1991,"number":5},
  {"name":"Damion Baugh","team":"Baskonia","nationality":"USA","position":"Guard","height":191,"birthYear":2000,"number":12},
  {"name":"Kevin Kokila","team":"Virtus Bologna","nationality":"France","position":"Center","height":204,"birthYear":2001,"number":3},
  {"name":"Yves Pons","team":"ASVEL","nationality":"France","position":"Forward","height":198,"birthYear":1999,"number":35},
  {"name":"Both Gach","team":"ASVEL","nationality":"USA","position":"Forward","height":201,"birthYear":1999,"number":14},
  {"name":"Tyson Etienne","team":"Paris Basketball","nationality":"USA","position":"Guard","height":185,"birthYear":1999,"number":9},
  {"name":"Mouhamadou Gueye","team":"Valencia","nationality":"USA","position":"Forward","height":206,"birthYear":1998,"number":16},
  {"name":"Marek Blazevic","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Center","height":211,"birthYear":2001,"number":22},
  // batch 3 (2026-09-24)
  {"name":"Santi Yusta","team":"Anadolu Efes","nationality":"Spain","position":"Forward","height":201,"birthYear":1997,"number":4},
  {"name":"Daron Russell","team":"Anadolu Efes","nationality":"USA","position":"Guard","height":180,"birthYear":1998,"number":11},
  {"name":"Khadeen Carrington","team":"Hapoel Tel Aviv","nationality":"Trinidad and Tobago","position":"Guard","height":193,"birthYear":1995,"number":5},
  {"name":"Eugene German","team":"Hapoel Tel Aviv","nationality":"USA","position":"Guard","height":183,"birthYear":1997,"number":1},
  {"name":"Keaton Wallace","team":"Maccabi Tel Aviv","nationality":"USA","position":"Guard","height":191,"birthYear":1999,"number":17},
  {"name":"Kyle Allman","team":"Partizan","nationality":"USA","position":"Guard","height":193,"birthYear":1997,"number":0},
  {"name":"Ethan Thompson","team":"Partizan","nationality":"USA","position":"Forward","height":196,"birthYear":1999,"number":5},
  {"name":"Conor Morgan","team":"Besiktas","nationality":"Canada","position":"Center","height":206,"birthYear":1994,"number":9},
  {"name":"Daquan Jeffries","team":"Besiktas","nationality":"USA","position":"Forward","height":196,"birthYear":1997,"number":2},
  {"name":"Anthony Brown","team":"Besiktas","nationality":"USA","position":"Forward","height":201,"birthYear":1992,"number":21},
  {"name":"David DeJulius","team":"Besiktas","nationality":"USA","position":"Guard","height":183,"birthYear":1999,"number":5},
  {"name":"Tremont Waters","team":"ASVEL","nationality":"USA","position":"Guard","height":178,"birthYear":1998,"number":51},
  {"name":"Hugo Besson","team":"ASVEL","nationality":"France","position":"Guard","height":194,"birthYear":2001,"number":25},
  {"name":"Trent Frazier","team":"Virtus Bologna","nationality":"USA","position":"Guard","height":188,"birthYear":1998,"number":1},
  {"name":"Marcus Carr","team":"Virtus Bologna","nationality":"Canada","position":"Guard","height":188,"birthYear":1999,"number":2},
  // batch 2 (2026-09-24)
  {"name":"Alize Johnson","team":"Paris Basketball","nationality":"USA","position":"Forward","height":203,"birthYear":1996,"number":24},
  {"name":"Tyrese Martin","team":"FC Barcelona","nationality":"USA","position":"Forward","height":198,"birthYear":1999,"number":2},
  {"name":"Stanley Umude","team":"FC Barcelona","nationality":"USA","position":"Forward","height":198,"birthYear":1999,"number":3},
  {"name":"Tosan Evbuomwan","team":"FC Barcelona","nationality":"United Kingdom","position":"Forward","height":203,"birthYear":2001,"number":20},
  {"name":"Olivier Nkamhoua","team":"FC Barcelona","nationality":"Finland","position":"Forward","height":203,"birthYear":2000,"number":13},
  {"name":"DJ Stewart","team":"Baskonia","nationality":"USA","position":"Forward","height":196,"birthYear":1999,"number":3},
  {"name":"A.J. Lawson","team":"Baskonia","nationality":"Canada","position":"Forward","height":200,"birthYear":2000,"number":1},
  {"name":"Marjon Beauchamp","team":"Bayern Munich","nationality":"USA","position":"Forward","height":201,"birthYear":2000,"number":3},
  {"name":"Wendell Moore","team":"Virtus Bologna","nationality":"USA","position":"Guard","height":196,"birthYear":2001,"number":8},
  {"name":"Patrick Baldwin","team":"Crvena Zvezda","nationality":"USA","position":"Forward","height":208,"birthYear":2002,"number":24},
  {"name":"Jacob Toppin","team":"Hapoel Tel Aviv","nationality":"USA","position":"Forward","height":206,"birthYear":2000,"number":0},
  {"name":"Marcus Bingham","team":"Fenerbahce","nationality":"USA","position":"Center","height":213,"birthYear":2000,"number":1},
  {"name":"Davion Mintz","team":"Dubai BC","nationality":"USA","position":"Guard","height":193,"birthYear":1998,"number":6},
  {"name":"TyTy Washington Jr.","team":"ASVEL","nationality":"USA","position":"Guard","height":191,"birthYear":2001,"number":3},
  {"name":"Devon Dotson","team":"Besiktas","nationality":"USA","position":"Guard","height":185,"birthYear":1999,"number":1},
  // batch 1 (2026-09-24): the best-known veterans
  {"name":"Dario Saric","team":"Anadolu Efes","nationality":"Croatia","position":"Forward","height":208,"birthYear":1994,"number":5},
  {"name":"Jonas Valanciunas","team":"Zalgiris Kaunas","nationality":"Lithuania","position":"Center","height":211,"birthYear":1992,"number":17},
  {"name":"Guerschon Yabusele","team":"Panathinaikos","nationality":"France","position":"Forward","height":203,"birthYear":1995,"number":28},
  {"name":"Ante Zizic","team":"Besiktas","nationality":"Croatia","position":"Center","height":210,"birthYear":1997,"number":41},
  {"name":"Furkan Korkmaz","team":"Besiktas","nationality":"Turkey","position":"Forward","height":201,"birthYear":1997,"number":30},
  {"name":"Patty Mills","team":"ASVEL","nationality":"Australia","position":"Guard","height":188,"birthYear":1988,"number":8},
  {"name":"Jae Crowder","team":"ASVEL","nationality":"USA","position":"Forward","height":198,"birthYear":1990,"number":99},
  {"name":"T.J. Warren","team":"Paris Basketball","nationality":"USA","position":"Forward","height":203,"birthYear":1993,"number":1},
  {"name":"Chris Duarte","team":"Baskonia","nationality":"Dominican Republic","position":"Forward","height":196,"birthYear":1997,"number":5},
  {"name":"Jaylen Nowell","team":"Besiktas","nationality":"USA","position":"Guard","height":193,"birthYear":1999,"number":24},
  {"name":"Johnny Juzang","team":"Fenerbahce","nationality":"USA","position":"Forward","height":201,"birthYear":2001,"number":9},
  {"name":"Damian Jones","team":"Real Madrid","nationality":"USA","position":"Center","height":211,"birthYear":1995,"number":30},
  {"name":"Olivier Sarr","team":"Real Madrid","nationality":"France","position":"Center","height":208,"birthYear":1999,"number":33},
  {"name":"Amir Coffey","team":"Hapoel Tel Aviv","nationality":"USA","position":"Guard","height":201,"birthYear":1997,"number":7},
  {"name":"Garrison Mathews","team":"Olimpia Milano","nationality":"USA","position":"Guard","height":196,"birthYear":1996,"number":24},
];

const SEASON_MOVE = {
  "Mike James":      { team: "Anadolu Efes", number: 55 },   // from AS Monaco
  "Matthew Strazel": { team: "Anadolu Efes", number: 32 },   // from AS Monaco
  "Collin Malcolm":  { team: "Anadolu Efes", number: 17 },   // from Hapoel Tel Aviv
  "Bruno Fernando":  { team: "Anadolu Efes", number: 20 },   // from Partizan (was #24)
  "Darius Thompson": { team: "Olimpia Milano", number: 13 }, // from Valencia
  "Devon Hall":      { team: "Olimpia Milano", number: 22 }, // from Fenerbahce (was #20)
  "Alec Peters":     { team: "Olimpia Milano", number: 25 }, // from Olympiacos
  "Nicola Akele":    { team: "Olimpia Milano", number: 45 }, // from Virtus Bologna
  "Moses Wright":    { team: "Olimpia Milano", number: 5 },  // from Zalgiris Kaunas (was #7)
  "Devin Booker":    { team: "Olimpia Milano", number: 31 }, // stays, was #6
  "Ousmane Diop":    { team: "Olimpia Milano", number: 6 },  // stays, was #25
  "Metecan Birsen":  { team: "Besiktas", number: 11 },       // from Fenerbahce (was #1)
  "Eugene Omoruyi":  { team: "Besiktas", number: 20 },       // from Baskonia (was #5)
  "Wenyen Gabriel":  { team: "Besiktas", number: 32 },       // from Bayern Munich
  "Chris Jones":      { team: "Crvena Zvezda", number: 1 },  // from Hapoel Tel Aviv
  "Johnathan Motley": { team: "Crvena Zvezda", number: 0 },  // from Hapoel Tel Aviv
  "David Kramer":     { team: "Crvena Zvezda", number: 44 }, // from Real Madrid (was #1)
  "Nick Weiler-Babb": { team: "Crvena Zvezda", number: 3 },  // left Efes (was #8)
  "Elie Okobo":        { team: "Dubai BC", number: 0 },      // from AS Monaco (dropped club)
  "Jaron Blossomgame": { team: "Dubai BC", number: 4 },      // from AS Monaco (dropped club)
  "Tornike Shengelia": { team: "Dubai BC", number: 23 },     // from FC Barcelona
  "Mamadi Diakite":    { team: "Dubai BC", number: 21 },     // from Baskonia (was #1)
  "Thomas Walkup":     { team: "Dubai BC", number: 44 },     // from Olympiacos (was #0)
  "Justin Anderson":   { team: "Dubai BC", number: 1 },      // stays, was #10
  "Justin Robinson":   { team: "FC Barcelona", number: 5 },  // from Paris Basketball
  "Josh Nebo":         { team: "FC Barcelona", number: 32 }, // left Milano
  "Yoan Makoundou":    { team: "FC Barcelona", number: 55 }, // restored (was AS Monaco #5)
  "Duane Washington Jr.": { team: "Bayern Munich", number: 4 }, // from Partizan
  "Miles Norris":      { team: "Bayern Munich", number: 0 },  // left Barcelona
  "Johannes Thiemann": { team: "Bayern Munich", number: 32 }, // restored (was #0)
  "Shane Larkin":      { team: "Fenerbahce", number: 0 },     // left Efes
  "Will Clyburn":      { team: "Fenerbahce", number: 21 },    // left Barcelona
  "Shavon Shields":    { team: "Fenerbahce", number: 31 },    // left Milano
  "Trent Forrest":     { team: "Fenerbahce", number: 11 },    // from Baskonia
  "Braxton Key":       { team: "Fenerbahce", number: 12 },    // from Valencia (was #7)
  "Tomas Satoransky":  { team: "Hapoel Tel Aviv", number: 13 }, // left Barcelona
  "Zach LeDay":        { team: "Hapoel Tel Aviv", number: 16 }, // left Milano
  "Bruno Caboclo":     { team: "Hapoel Tel Aviv", number: 51 }, // left Dubai
  "Kenneth Faried":    { team: "Baskonia", number: 35 },        // from Panathinaikos
  "Myles Cale":        { team: "ASVEL", number: 0 },            // left Barcelona (was #3)
  "Nate Sestina":      { team: "ASVEL", number: 77 },           // left Milano
  "Joel Bolomboy":     { team: "ASVEL", number: 21 },           // left Crvena Zvezda
  "Yam Madar":         { team: "Maccabi Tel Aviv", number: 26 }, // left Hapoel
  "Bonzie Colson":     { team: "Maccabi Tel Aviv", number: 50 }, // left Fenerbahce
  "Armando Bacot":     { team: "Maccabi Tel Aviv", number: 5 },  // left Fenerbahce (was #0)
  "Daniel Theis":      { team: "Maccabi Tel Aviv", number: 23 }, // from AS Monaco (dropped club, was #10)
  "Amit Ebo":          { team: "Maccabi Tel Aviv", number: 3 },  // restored (was #5)
  "Codi Miller-McIntyre": { team: "Olympiacos", number: 0 },    // left Crvena Zvezda
  "Mbaye Ndiaye":      { team: "Olympiacos", number: 24 },      // left ASVEL
  "Jean Montero":      { team: "Olympiacos", number: 8 },       // from Valencia
  "Panagiotis Kalaitzakis": { team: "Panathinaikos", number: 0 }, // stays, was #5
  "Sylvain Francisco": { team: "Panathinaikos", number: 3 },    // from Zalgiris Kaunas
  "Brancou Badio":     { team: "Panathinaikos", number: 7 },    // from Valencia (was #0)
  "Isaac Bonga":       { team: "Panathinaikos", number: 32 },   // from Partizan (was #17)
  "Moustapha Fall":    { team: "Panathinaikos", number: 93 },   // left Olympiacos (was #10)
  "Terry Tarpey":      { team: "Paris Basketball", number: 3 }, // from AS Monaco (dropped club, was #22)
  "Frank Ntilikina":   { team: "Paris Basketball", number: 5 }, // left Olympiacos (was #1)
  "Luca Vildoza":      { team: "Partizan", number: 3 },         // from Virtus Bologna (was #1)
  "Alessandro Pajola": { team: "Partizan", number: 66 },        // from Virtus Bologna (was #6)
  "Lamar Stevens":     { team: "Partizan", number: 11 },        // left Paris (was #9)
  "Kevarrius Hayes":   { team: "Partizan", number: 13 },        // from AS Monaco (dropped club)
  "Derek Willis":      { team: "Partizan", number: 35 },        // left Paris
  "Timothe Luwawu-Cabarrot": { team: "Real Madrid", number: 3 }, // left Baskonia (was #9)
  "Jaime Pradilla":    { team: "Real Madrid", number: 4 },      // from Valencia
  "Mikael Jantunen":   { team: "Real Madrid", number: 20 },     // left Fenerbahce (was #18)
  "Neal Sako":         { team: "Valencia", number: 13 },        // stays, was #12
  "T.J. Shorts":       { team: "Valencia", number: 0 },         // left Panathinaikos
  "Armoni Brooks":     { team: "Valencia", number: 12 },        // left Milano
  "Dylan Osetkowski":  { team: "Valencia", number: 8 },         // left Partizan (was #5)
  "Nikola Mirotic":    { team: "Valencia", number: 33 },        // from AS Monaco (dropped club)
  "Jasiel Rivero":     { team: "Valencia", number: 41 },        // left Crvena Zvezda (was #14)
  "Kessler Edwards":   { team: "Virtus Bologna", number: 9 },   // left Hapoel (was #15)
  "Sterling Brown":    { team: "Zalgiris Kaunas", number: 0 },  // left Partizan (was #12)
  "Carsen Edwards":    { team: "Zalgiris Kaunas", number: 3 },  // left Virtus
  "Saben Lee":         { team: "Zalgiris Kaunas", number: 7 },  // left Efes (was #5)
  "Marius Grigonis":   { team: "Zalgiris Kaunas", number: 40 }, // left Panathinaikos
};

// Everyone at a dropped club who isn't moving elsewhere leaves with it.
for (const p of raw.flatMap(r => r.players))
  if (SEASON_DROPPED_CLUBS[p.team] && !SEASON_MOVE[p.name] && !ROSTER_REMOVE.has(p.name.trim().toLowerCase()))
    SEASON_REMOVE.add(p.name.trim().toLowerCase());

const all = raw.flatMap(r => r.players)
  .filter(p => !ROSTER_REMOVE.has(p.name.trim().toLowerCase()))
  .filter(p => !SEASON_REMOVE.has(p.name.trim().toLowerCase()));
for (const p of all) {
  if (ROSTER_POSITION[p.name]) p.position = ROSTER_POSITION[p.name];
  if (ROSTER_TEAM[p.name])     p.team     = ROSTER_TEAM[p.name];
  if (SEASON_MOVE[p.name])     Object.assign(p, SEASON_MOVE[p.name]);
}
for (const a of ROSTER_ADD) if (!SEASON_REMOVE.has(a.name.toLowerCase())) all.push({ ...a, ...SEASON_MOVE[a.name] });
for (const a of SEASON_RETURN) all.push(a);
for (const a of SEASON_ADD) all.push(a);

// Validate teams; collect unknowns.
const unknownTeams = new Set();
for (const p of all) if (!TEAMS[p.team]) unknownTeams.add(p.team);
if (unknownTeams.size) {
  console.error("UNKNOWN TEAMS:", [...unknownTeams].join(", "));
  process.exit(1);
}

// Dedupe by name (first occurrence wins), drop teens.
const seen = new Map();
const dropped = { young: [], dup: [] };
for (const p of all) {
  const key = p.name.trim().toLowerCase();
  if (p.birthYear > YOUNGEST_BIRTH_YEAR && !ROSTER_KEEP_YOUNG.has(p.name)) { dropped.young.push(p.name); continue; }
  if (seen.has(key)) { dropped.dup.push(`${p.name} (${p.team} dup of ${seen.get(key).team})`); continue; }
  seen.set(key, p);
}

let players = [...seen.values()];

// Apply the nationality convention; track what changed and flag stale entries.
const natFixes = [];
const overridePending = new Set(Object.keys(NATIONALITY_OVERRIDES));
for (const p of players) {
  const want = NATIONALITY_OVERRIDES[p.name];
  if (!want) continue;
  overridePending.delete(p.name);
  if (p.nationality !== want) { natFixes.push(`${p.name}: ${p.nationality} -> ${want}`); p.nationality = want; }
}

// Order by team (TEAM_ORDER), then jersey number, for a tidy file.
players.sort((a, b) =>
  (TEAM_ORDER.indexOf(a.team) - TEAM_ORDER.indexOf(b.team)) || (a.number - b.number)
);

// --- Emit former_players.json ---------------------------------------------
// Season leavers stay IN the game — just not on a current roster. They are
// handed to build_legends.js (the non-current pool) under their last club, and
// build_careers.js closes their open stint at the season boundary.
const former = new Map();
for (const p of [...raw.flatMap(r => r.players), ...ROSTER_ADD]) {
  const key = p.name.trim().toLowerCase();
  if (!SEASON_REMOVE.has(key) || former.has(key)) continue;
  former.set(key, { ...p, position: ROSTER_POSITION[p.name] || p.position, nationality: NATIONALITY_OVERRIDES[p.name] || p.nationality,
                    teamCountry: (TEAMS[p.team] || SEASON_DROPPED_CLUBS[p.team]).country });
}
if (former.size !== SEASON_REMOVE.size) {
  console.error("SEASON_REMOVE names not found in raw data:",
    [...SEASON_REMOVE].filter(k => !former.has(k)).join(", "));
  process.exit(1);
}
fs.writeFileSync("former_players.json", JSON.stringify([...former.values()], null, 1) + "\n");

// --- Emit players.js --------------------------------------------------------
const lines = [];
lines.push("/*");
lines.push(" * EuroLeague 2026-27 player database (auto-generated by build_players.js).");
lines.push(" * Sources: official club rosters, Wikipedia season pages, FIBA, Proballers, Eurohoops.");
lines.push(" * Stable fields (nationality, position, height, birthYear) are reliable; club and");
lines.push(" * jersey number reflect the 2026-27 season and may shift with transfers.");
lines.push(" * Age is derived from birthYear at runtime so it stays current.");
lines.push(" */");
lines.push("");
lines.push("window.TEAMS = " + JSON.stringify(TEAMS, null, 2) + ";");
lines.push("");
lines.push("window.PLAYERS = [");
let currentTeam = null;
for (const p of players) {
  if (p.team !== currentTeam) { currentTeam = p.team; lines.push("  // --- " + currentTeam + " ---"); }
  lines.push("  " + JSON.stringify(p) + ",");
}
lines.push("];");
lines.push("");

fs.writeFileSync("players.js", lines.join("\n"));

console.log("Wrote players.js");
console.log("  Players:", players.length, "| Teams:", Object.keys(TEAMS).length);
console.log("  Dropped (born 2007+):", dropped.young.length, "->", dropped.young.join(", "));
console.log("  Dropped (duplicate name):", dropped.dup.length, "->", dropped.dup.join(", "));
console.log("  Nationality fixes (" + natFixes.length + "):");
for (const f of natFixes) console.log("    " + f);
for (const n of [...overridePending]) if (SEASON_REMOVE.has(n.toLowerCase())) overridePending.delete(n);  // applied to their non-active record instead
if (overridePending.size) console.log("  WARNING: override names not found in data:", [...overridePending].join(", "));
