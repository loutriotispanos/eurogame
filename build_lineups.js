/*
 * Builds lineups.js — EuroLeague Final Four starting fives for the "Complete the
 * Five" game (a starter is hidden; the user guesses him). Zero deps.
 *
 * SOURCE (2026-09-30): each lineup is the five a team started in its Final Four
 * SEMI-FINAL, per the official EuroLeague box score (api-live.euroleague.net
 * .../games/<code>/stats, startFive). Every existing five was audited against it:
 * 39 of 60 matched, 21 were corrected (4 were final-day fives, 17 matched no
 * Final Four game at all), and 2002-2009 were added from the same feed. The feed
 * spells some names differently; they are mapped to ours (Ali Muhammed = Bobby
 * Dixon, Sasha = Alexandros Vezenkov, Walter = Edy Tavares, Emanuel = Manu
 * Ginobili…). Court positions and fame are set by hand.
 *
 *   Run:  node build_lineups.js   (idempotent; regenerates lineups.js)
 *
 * Convention: NEVER hand-edit lineups.js — edit RAW below and re-run. Each lineup
 * is a Final Four team for one season with its five starters; per player: court
 * `pos` (PG/SG/SF/PF/C, each used once) + `fame` rank (1 = biggest star/easiest to
 * guess … 5 = hardest), which drives the Easy/Medium/Hard difficulty.
 */
const fs = require("fs");

// Canonicalise player names to match the rest of the app where it's the same person.
const NAME_FIX = {
  "Walter Tavares": "Edy Tavares", "Sasha Vezenkov": "Alexandros Vezenkov",
  "Boniface N'Dong": "Boniface Ndong", "Nando De Colo": "Nando de Colo", "Victor Khryapa": "Viktor Khryapa"
};
function fixName(n) { n = String(n).trim(); return NAME_FIX[n] || n; }

const RAW = [
  // ===== 2025 Final Four (Abu Dhabi) =====
  { team: "Fenerbahce", season: 2025, champion: true, five: [
    { name: "Devon Hall", pos: "PG", fame: 3 }, { name: "Marko Guduric", pos: "SG", fame: 2 },
    { name: "Nigel Hayes-Davis", pos: "SF", fame: 1 }, { name: "Bonzie Colson", pos: "PF", fame: 4 },
    { name: "Khem Birch", pos: "C", fame: 5 } ] },
  { team: "AS Monaco", season: 2025, champion: false, five: [
    { name: "Mike James", pos: "PG", fame: 1 }, { name: "Matthew Strazel", pos: "SG", fame: 4 },
    { name: "Alpha Diallo", pos: "SF", fame: 3 }, { name: "Jaron Blossomgame", pos: "PF", fame: 5 },
    { name: "Daniel Theis", pos: "C", fame: 2 } ] },
  { team: "Olympiacos", season: 2025, champion: false, five: [
    { name: "Nigel Williams-Goss", pos: "PG", fame: 3 }, { name: "Evan Fournier", pos: "SG", fame: 1 },
    { name: "Kostas Papanikolaou", pos: "SF", fame: 4 }, { name: "Sasha Vezenkov", pos: "PF", fame: 2 },
    { name: "Moustapha Fall", pos: "C", fame: 5 } ] },
  { team: "Panathinaikos", season: 2025, champion: false, five: [
    { name: "Kendrick Nunn", pos: "PG", fame: 1 }, { name: "Jerian Grant", pos: "SG", fame: 4 },
    { name: "Cedi Osman", pos: "SF", fame: 2 }, { name: "Juancho Hernangomez", pos: "PF", fame: 3 },
    { name: "Wenyen Gabriel", pos: "C", fame: 5 } ] },

  // ===== 2024 Final Four (Berlin) =====
  { team: "Panathinaikos", season: 2024, champion: true, five: [
    { name: "Jerian Grant", pos: "PG", fame: 3 }, { name: "Kendrick Nunn", pos: "SG", fame: 1 },
    { name: "Ioannis Papapetrou", pos: "SF", fame: 5 }, { name: "Dinos Mitoglou", pos: "PF", fame: 4 },
    { name: "Mathias Lessort", pos: "C", fame: 2 } ] },
  { team: "Real Madrid", season: 2024, champion: false, five: [
    { name: "Facundo Campazzo", pos: "PG", fame: 1 }, { name: "Dzanan Musa", pos: "SG", fame: 4 },
    { name: "Mario Hezonja", pos: "SF", fame: 2 }, { name: "Eli Ndiaye", pos: "PF", fame: 5 },
    { name: "Walter Tavares", pos: "C", fame: 3 } ] },
  { team: "Fenerbahce", season: 2024, champion: false, five: [
    { name: "Nick Calathes", pos: "PG", fame: 1 }, { name: "Scottie Wilbekin", pos: "SG", fame: 2 },
    { name: "Dyshawn Pierre", pos: "SF", fame: 5 }, { name: "Nigel Hayes-Davis", pos: "PF", fame: 3 },
    { name: "Johnathan Motley", pos: "C", fame: 4 } ] },
  { team: "Olympiacos", season: 2024, champion: false, five: [
    { name: "Thomas Walkup", pos: "PG", fame: 4 }, { name: "Isaiah Canaan", pos: "SG", fame: 1 },
    { name: "Kostas Papanikolaou", pos: "SF", fame: 2 }, { name: "Alec Peters", pos: "PF", fame: 5 },
    { name: "Moustapha Fall", pos: "C", fame: 3 } ] },

  // ===== 2023 Final Four (Kaunas) =====
  { team: "Real Madrid", season: 2023, champion: true, five: [
    { name: "Nigel Williams-Goss", pos: "PG", fame: 3 }, { name: "Dzanan Musa", pos: "SG", fame: 2 },
    { name: "Adam Hanga", pos: "SF", fame: 4 }, { name: "Eli Ndiaye", pos: "PF", fame: 5 },
    { name: "Edy Tavares", pos: "C", fame: 1 } ] },
  { team: "Olympiacos", season: 2023, champion: false, five: [
    { name: "Isaiah Canaan", pos: "PG", fame: 2 }, { name: "Thomas Walkup", pos: "SG", fame: 5 },
    { name: "Kostas Papanikolaou", pos: "SF", fame: 3 }, { name: "Sasha Vezenkov", pos: "PF", fame: 1 },
    { name: "Moustapha Fall", pos: "C", fame: 4 } ] },
  { team: "FC Barcelona", season: 2023, champion: false, five: [
    { name: "Tomas Satoransky", pos: "PG", fame: 2 }, { name: "Nicolas Laprovittola", pos: "SG", fame: 4 },
    { name: "Alex Abrines", pos: "SF", fame: 3 }, { name: "Nikola Mirotic", pos: "PF", fame: 1 },
    { name: "Sertac Sanli", pos: "C", fame: 5 } ] },
  { team: "AS Monaco", season: 2023, champion: false, five: [
    { name: "Mike James", pos: "PG", fame: 1 }, { name: "Jordan Loyd", pos: "SG", fame: 3 },
    { name: "Yakuba Ouattara", pos: "SF", fame: 4 }, { name: "John Brown", pos: "PF", fame: 5 },
    { name: "Donatas Motiejunas", pos: "C", fame: 2 } ] },

  // ===== 2010 Final Four (Paris) =====
  { team: "FC Barcelona", season: 2010, champion: true, five: [
    { name: "Ricky Rubio", pos: "PG", fame: 2 }, { name: "Juan Carlos Navarro", pos: "SG", fame: 1 },
    { name: "Pete Mickeal", pos: "SF", fame: 4 }, { name: "Terence Morris", pos: "PF", fame: 5 },
    { name: "Erazem Lorbek", pos: "C", fame: 3 } ] },
  { team: "Olympiacos", season: 2010, champion: false, five: [
    { name: "Milos Teodosic", pos: "PG", fame: 3 }, { name: "Scoonie Penn", pos: "SG", fame: 5 },
    { name: "Josh Childress", pos: "SF", fame: 2 }, { name: "Linas Kleiza", pos: "PF", fame: 1 },
    { name: "Sofoklis Schortsanitis", pos: "C", fame: 4 } ] },
  { team: "CSKA Moscow", season: 2010, champion: false, five: [
    { name: "Zoran Planinic", pos: "PG", fame: 5 }, { name: "Trajan Langdon", pos: "SG", fame: 2 },
    { name: "Ramunas Siskauskas", pos: "SF", fame: 1 }, { name: "Viktor Khryapa", pos: "PF", fame: 3 },
    { name: "Sasha Kaun", pos: "C", fame: 4 } ] },
  { team: "Partizan", season: 2010, champion: false, five: [
    { name: "Bo McCalebb", pos: "PG", fame: 2 }, { name: "Dusan Kecman", pos: "SG", fame: 4 },
    { name: "Lawrence Roberts", pos: "SF", fame: 3 }, { name: "Jan Vesely", pos: "PF", fame: 1 },
    { name: "Slavko Vranes", pos: "C", fame: 5 } ] },

  // ===== 2011 Final Four (Barcelona) =====
  { team: "Panathinaikos", season: 2011, champion: true, five: [
    { name: "Dimitris Diamantidis", pos: "PG", fame: 1 }, { name: "Nick Calathes", pos: "SG", fame: 2 },
    { name: "Romain Sato", pos: "SF", fame: 4 }, { name: "Antonis Fotsis", pos: "PF", fame: 3 },
    { name: "Ian Vougioukas", pos: "C", fame: 5 } ] },
  { team: "Maccabi Tel Aviv", season: 2011, champion: false, five: [
    { name: "Jeremy Pargo", pos: "PG", fame: 2 }, { name: "Chuck Eidson", pos: "SG", fame: 4 },
    { name: "Guy Pnini", pos: "SF", fame: 5 }, { name: "Lior Eliyahu", pos: "PF", fame: 3 },
    { name: "Sofoklis Schortsanitis", pos: "C", fame: 1 } ] },
  { team: "Real Madrid", season: 2011, champion: false, five: [
    { name: "Pablo Prigioni", pos: "PG", fame: 3 }, { name: "Sergio Llull", pos: "SG", fame: 1 },
    { name: "Carlos Suarez", pos: "SF", fame: 5 }, { name: "Felipe Reyes", pos: "PF", fame: 2 },
    { name: "Ante Tomic", pos: "C", fame: 4 } ] },
  { team: "Montepaschi Siena", season: 2011, champion: false, five: [
    { name: "Marko Jaric", pos: "PG", fame: 1 }, { name: "David Moss", pos: "SG", fame: 4 },
    { name: "Malik Hairston", pos: "SF", fame: 3 }, { name: "Ksistof Lavrinovic", pos: "PF", fame: 2 },
    { name: "Milovan Rakovic", pos: "C", fame: 5 } ] },

  // ===== 2012 Final Four (Istanbul) =====
  { team: "Olympiacos", season: 2012, champion: true, five: [
    { name: "Vangelis Mantzaris", pos: "PG", fame: 4 }, { name: "Vassilis Spanoulis", pos: "SG", fame: 1 },
    { name: "Marko Keselj", pos: "SF", fame: 5 }, { name: "Pero Antic", pos: "PF", fame: 2 },
    { name: "Joey Dorsey", pos: "C", fame: 3 } ] },
  { team: "CSKA Moscow", season: 2012, champion: false, five: [
    { name: "Milos Teodosic", pos: "PG", fame: 2 }, { name: "Ramunas Siskauskas", pos: "SG", fame: 4 },
    { name: "Andrei Kirilenko", pos: "SF", fame: 1 }, { name: "Viktor Khryapa", pos: "PF", fame: 5 },
    { name: "Nenad Krstic", pos: "C", fame: 3 } ] },
  { team: "FC Barcelona", season: 2012, champion: false, five: [
    { name: "Marcelinho Huertas", pos: "PG", fame: 2 }, { name: "Juan Carlos Navarro", pos: "SG", fame: 1 },
    { name: "Chuck Eidson", pos: "SF", fame: 5 }, { name: "Erazem Lorbek", pos: "PF", fame: 3 },
    { name: "Boniface Ndong", pos: "C", fame: 4 } ] },
  { team: "Panathinaikos", season: 2012, champion: false, five: [
    { name: "Sarunas Jasikevicius", pos: "PG", fame: 2 }, { name: "Dimitris Diamantidis", pos: "SG", fame: 1 },
    { name: "Romain Sato", pos: "SF", fame: 4 }, { name: "Kostas Kaimakoglou", pos: "PF", fame: 5 },
    { name: "Aleks Maric", pos: "C", fame: 3 } ] },

  // ===== 2013 Final Four (London) =====
  { team: "Olympiacos", season: 2013, champion: true, five: [
    { name: "Acie Law", pos: "PG", fame: 4 }, { name: "Vassilis Spanoulis", pos: "SG", fame: 1 },
    { name: "Kostas Papanikolaou", pos: "SF", fame: 2 }, { name: "Georgios Printezis", pos: "PF", fame: 3 },
    { name: "Josh Powell", pos: "C", fame: 5 } ] },
  { team: "Real Madrid", season: 2013, champion: false, five: [
    { name: "Sergio Llull", pos: "PG", fame: 2 }, { name: "Rudy Fernandez", pos: "SG", fame: 1 },
    { name: "Carlos Suarez", pos: "SF", fame: 5 }, { name: "Nikola Mirotic", pos: "PF", fame: 3 },
    { name: "Mirza Begic", pos: "C", fame: 4 } ] },
  { team: "CSKA Moscow", season: 2013, champion: false, five: [
    { name: "Milos Teodosic", pos: "PG", fame: 1 }, { name: "Aaron Jackson", pos: "SG", fame: 5 },
    { name: "Sonny Weems", pos: "SF", fame: 2 }, { name: "Viktor Khryapa", pos: "PF", fame: 3 },
    { name: "Sasha Kaun", pos: "C", fame: 4 } ] },
  { team: "FC Barcelona", season: 2013, champion: false, five: [
    { name: "Marcelinho Huertas", pos: "PG", fame: 3 }, { name: "Juan Carlos Navarro", pos: "SG", fame: 1 },
    { name: "C.J. Wallace", pos: "SF", fame: 5 }, { name: "Erazem Lorbek", pos: "PF", fame: 4 },
    { name: "Ante Tomic", pos: "C", fame: 2 } ] },

  // ===== 2014 Final Four (Milan) =====
  { team: "Maccabi Tel Aviv", season: 2014, champion: true, five: [
    { name: "Yogev Ohayon", pos: "PG", fame: 3 }, { name: "Ricky Hickman", pos: "SG", fame: 2 },
    { name: "Devin Smith", pos: "SF", fame: 1 }, { name: "Guy Pnini", pos: "PF", fame: 4 },
    { name: "Andrija Zizic", pos: "C", fame: 5 } ] },
  { team: "Real Madrid", season: 2014, champion: false, five: [
    { name: "Sergio Llull", pos: "PG", fame: 2 }, { name: "Rudy Fernandez", pos: "SG", fame: 1 },
    { name: "Tremmell Darden", pos: "SF", fame: 5 }, { name: "Nikola Mirotic", pos: "PF", fame: 3 },
    { name: "Ioannis Bourousis", pos: "C", fame: 4 } ] },
  { team: "FC Barcelona", season: 2014, champion: false, five: [
    { name: "Marcelinho Huertas", pos: "PG", fame: 3 }, { name: "Brad Oleson", pos: "SG", fame: 5 },
    { name: "Kostas Papanikolaou", pos: "SF", fame: 4 }, { name: "Erazem Lorbek", pos: "PF", fame: 2 },
    { name: "Ante Tomic", pos: "C", fame: 1 } ] },
  { team: "CSKA Moscow", season: 2014, champion: false, five: [
    { name: "Milos Teodosic", pos: "PG", fame: 1 }, { name: "Sonny Weems", pos: "SG", fame: 3 },
    { name: "Viktor Khryapa", pos: "SF", fame: 4 }, { name: "Andrey Vorontsevich", pos: "PF", fame: 5 },
    { name: "Sasha Kaun", pos: "C", fame: 2 } ] },

  // ===== 2015 Final Four (Madrid) =====
  { team: "Real Madrid", season: 2015, champion: true, five: [
    { name: "Sergio Llull", pos: "PG", fame: 2 }, { name: "Jaycee Carroll", pos: "SG", fame: 4 },
    { name: "Rudy Fernandez", pos: "SF", fame: 1 }, { name: "Felipe Reyes", pos: "PF", fame: 3 },
    { name: "Gustavo Ayon", pos: "C", fame: 5 } ] },
  { team: "Olympiacos", season: 2015, champion: false, five: [
    { name: "Vangelis Mantzaris", pos: "PG", fame: 5 }, { name: "Vassilis Spanoulis", pos: "SG", fame: 1 },
    { name: "Tremmell Darden", pos: "SF", fame: 4 }, { name: "Georgios Printezis", pos: "PF", fame: 2 },
    { name: "Bryant Dunston", pos: "C", fame: 3 } ] },
  { team: "CSKA Moscow", season: 2015, champion: false, five: [
    { name: "Milos Teodosic", pos: "PG", fame: 1 }, { name: "Sonny Weems", pos: "SG", fame: 3 },
    { name: "Andrei Kirilenko", pos: "SF", fame: 2 }, { name: "Andrey Vorontsevich", pos: "PF", fame: 4 },
    { name: "Sasha Kaun", pos: "C", fame: 5 } ] },
  { team: "Fenerbahce", season: 2015, champion: false, five: [
    { name: "Kenan Sipahi", pos: "PG", fame: 5 }, { name: "Andrew Goudelock", pos: "SG", fame: 2 },
    { name: "Bogdan Bogdanovic", pos: "SF", fame: 1 }, { name: "Jan Vesely", pos: "PF", fame: 3 },
    { name: "Luka Zoric", pos: "C", fame: 4 } ] },

  // ===== 2016 Final Four (Berlin) =====
  { team: "CSKA Moscow", season: 2016, champion: true, five: [
    { name: "Nando de Colo", pos: "PG", fame: 1 }, { name: "Cory Higgins", pos: "SG", fame: 3 },
    { name: "Nikita Kurbanov", pos: "SF", fame: 5 }, { name: "Andrey Vorontsevich", pos: "PF", fame: 4 },
    { name: "Kyle Hines", pos: "C", fame: 2 } ] },
  { team: "Fenerbahce", season: 2016, champion: false, five: [
    { name: "Bobby Dixon", pos: "PG", fame: 5 }, { name: "Bogdan Bogdanovic", pos: "SG", fame: 1 },
    { name: "Luigi Datome", pos: "SF", fame: 2 }, { name: "Pero Antic", pos: "PF", fame: 4 },
    { name: "Ekpe Udoh", pos: "C", fame: 3 } ] },
  { team: "Lokomotiv Kuban", season: 2016, champion: false, five: [
    { name: "Malcolm Delaney", pos: "PG", fame: 1 }, { name: "Evgeny Voronov", pos: "SG", fame: 5 },
    { name: "Ryan Broekhoff", pos: "SF", fame: 4 }, { name: "Victor Claver", pos: "PF", fame: 3 },
    { name: "Anthony Randolph", pos: "C", fame: 2 } ] },
  { team: "Baskonia", season: 2016, champion: false, five: [
    { name: "Darius Adams", pos: "PG", fame: 3 }, { name: "Adam Hanga", pos: "SG", fame: 1 },
    { name: "Davis Bertans", pos: "SF", fame: 2 }, { name: "Kim Tillie", pos: "PF", fame: 4 },
    { name: "Darko Planinic", pos: "C", fame: 5 } ] },

  // ===== 2017 Final Four (Istanbul) =====
  { team: "Fenerbahce", season: 2017, champion: true, five: [
    { name: "Bobby Dixon", pos: "PG", fame: 5 }, { name: "Bogdan Bogdanovic", pos: "SG", fame: 1 },
    { name: "Nikola Kalinic", pos: "SF", fame: 4 }, { name: "Jan Vesely", pos: "PF", fame: 3 },
    { name: "Ekpe Udoh", pos: "C", fame: 2 } ] },
  { team: "Real Madrid", season: 2017, champion: false, five: [
    { name: "Luka Doncic", pos: "PG", fame: 1 }, { name: "Sergio Llull", pos: "SG", fame: 2 },
    { name: "Jonas Maciulis", pos: "SF", fame: 5 }, { name: "Anthony Randolph", pos: "PF", fame: 4 },
    { name: "Gustavo Ayon", pos: "C", fame: 3 } ] },
  { team: "Olympiacos", season: 2017, champion: false, five: [
    { name: "Vangelis Mantzaris", pos: "PG", fame: 4 }, { name: "Vassilis Spanoulis", pos: "SG", fame: 1 },
    { name: "Kostas Papanikolaou", pos: "SF", fame: 3 }, { name: "Georgios Printezis", pos: "PF", fame: 2 },
    { name: "Nikola Milutinov", pos: "C", fame: 5 } ] },
  { team: "CSKA Moscow", season: 2017, champion: false, five: [
    { name: "Nando De Colo", pos: "PG", fame: 1 }, { name: "Aaron Jackson", pos: "SG", fame: 5 },
    { name: "Nikita Kurbanov", pos: "SF", fame: 3 }, { name: "Andrey Vorontsevich", pos: "PF", fame: 4 },
    { name: "Kyle Hines", pos: "C", fame: 2 } ] },

  // ===== 2018 Final Four (Belgrade) =====
  { team: "Real Madrid", season: 2018, champion: true, five: [
    { name: "Facundo Campazzo", pos: "PG", fame: 2 }, { name: "Luka Doncic", pos: "SG", fame: 1 },
    { name: "Jeffery Taylor", pos: "SF", fame: 5 }, { name: "Felipe Reyes", pos: "PF", fame: 4 },
    { name: "Gustavo Ayon", pos: "C", fame: 3 } ] },
  { team: "Fenerbahce", season: 2018, champion: false, five: [
    { name: "Brad Wanamaker", pos: "PG", fame: 2 }, { name: "Marko Guduric", pos: "SG", fame: 4 },
    { name: "Nikola Kalinic", pos: "SF", fame: 5 }, { name: "Jan Vesely", pos: "PF", fame: 1 },
    { name: "Ahmet Duverioglu", pos: "C", fame: 3 } ] },
  { team: "CSKA Moscow", season: 2018, champion: false, five: [
    { name: "Sergio Rodriguez", pos: "PG", fame: 1 }, { name: "Cory Higgins", pos: "SG", fame: 3 },
    { name: "Nikita Kurbanov", pos: "SF", fame: 4 }, { name: "Semyon Antonov", pos: "PF", fame: 5 },
    { name: "Othello Hunter", pos: "C", fame: 2 } ] },
  { team: "Zalgiris Kaunas", season: 2018, champion: false, five: [
    { name: "Kevin Pangos", pos: "PG", fame: 2 }, { name: "Edgaras Ulanovas", pos: "SG", fame: 4 },
    { name: "Axel Toupane", pos: "SF", fame: 3 }, { name: "Paulius Jankunas", pos: "PF", fame: 5 },
    { name: "Brandon Davies", pos: "C", fame: 1 } ] },

  // ===== 2019 Final Four (Vitoria) =====
  { team: "CSKA Moscow", season: 2019, champion: true, five: [
    { name: "Nando De Colo", pos: "PG", fame: 1 }, { name: "Daniel Hackett", pos: "SG", fame: 4 },
    { name: "Will Clyburn", pos: "SF", fame: 3 }, { name: "Nikita Kurbanov", pos: "PF", fame: 5 },
    { name: "Othello Hunter", pos: "C", fame: 2 } ] },
  { team: "Anadolu Efes", season: 2019, champion: false, five: [
    { name: "Shane Larkin", pos: "PG", fame: 1 }, { name: "Vasilije Micic", pos: "SG", fame: 2 },
    { name: "Krunoslav Simon", pos: "SF", fame: 5 }, { name: "Adrien Moerman", pos: "PF", fame: 4 },
    { name: "Bryant Dunston", pos: "C", fame: 3 } ] },
  { team: "Real Madrid", season: 2019, champion: false, five: [
    { name: "Facundo Campazzo", pos: "PG", fame: 2 }, { name: "Rudy Fernandez", pos: "SG", fame: 1 },
    { name: "Jeffery Taylor", pos: "SF", fame: 5 }, { name: "Anthony Randolph", pos: "PF", fame: 4 },
    { name: "Edy Tavares", pos: "C", fame: 3 } ] },
  { team: "Fenerbahce", season: 2019, champion: false, five: [
    { name: "Bobby Dixon", pos: "PG", fame: 3 }, { name: "Erick Green", pos: "SG", fame: 5 },
    { name: "Marko Guduric", pos: "SF", fame: 2 }, { name: "Nicolo Melli", pos: "PF", fame: 1 },
    { name: "Ahmet Duverioglu", pos: "C", fame: 4 } ] },

  // ===== 2022 Final Four (Belgrade) =====
  // Added 2026-09-28, the season the archive was missing. Each team's starting
  // five in its SEMI-FINAL (19 May 2022), every five confirmed by two sources:
  // Wikipedia's 2022 EuroLeague Final Four box scores, plus Gigantes' live report
  // ("El Barça sale con Calathes, Laprovittola, Exum, Mirotic, Sanli"; "Pablo
  // Laso apuesta por Williams-Goss, Causeur, Hanga, Deck y Yabusele", Tavares
  // from the bench) and Fotomaç ("Walkup, Dorsey, Papanikolaou, Vezenkov and
  // Fall ilk beşiyle başladı"; Efes "Larkin, Micic, Anderson, Moerman and Pleiss").
  // Positions as the box scores list them. Efes beat Real Madrid 58-57 in the final.
  { team: "Anadolu Efes", season: 2022, champion: true, five: [
    { name: "Shane Larkin", pos: "PG", fame: 2 }, { name: "Vasilije Micic", pos: "SG", fame: 1 },
    { name: "James Anderson", pos: "SF", fame: 4 }, { name: "Adrien Moerman", pos: "PF", fame: 5 },
    { name: "Tibor Pleiss", pos: "C", fame: 3 } ] },
  { team: "Real Madrid", season: 2022, champion: false, five: [
    { name: "Nigel Williams-Goss", pos: "PG", fame: 4 }, { name: "Fabien Causeur", pos: "SG", fame: 3 },
    { name: "Adam Hanga", pos: "SF", fame: 5 }, { name: "Gabriel Deck", pos: "PF", fame: 2 },
    { name: "Guerschon Yabusele", pos: "C", fame: 1 } ] },
  { team: "FC Barcelona", season: 2022, champion: false, five: [
    { name: "Nick Calathes", pos: "PG", fame: 2 }, { name: "Nicolas Laprovittola", pos: "SG", fame: 3 },
    { name: "Dante Exum", pos: "SF", fame: 4 }, { name: "Nikola Mirotic", pos: "PF", fame: 1 },
    { name: "Sertac Sanli", pos: "C", fame: 5 } ] },
  { team: "Olympiacos", season: 2022, champion: false, five: [
    { name: "Thomas Walkup", pos: "PG", fame: 3 }, { name: "Tyler Dorsey", pos: "SG", fame: 5 },
    { name: "Kostas Papanikolaou", pos: "SF", fame: 2 }, { name: "Sasha Vezenkov", pos: "PF", fame: 1 },
    { name: "Moustapha Fall", pos: "C", fame: 4 } ] },

  // ===== 2021 Final Four (Cologne) =====
  { team: "Anadolu Efes", season: 2021, champion: true, five: [
    { name: "Vasilije Micic", pos: "PG", fame: 1 }, { name: "Rodrigue Beaubois", pos: "SG", fame: 2 },
    { name: "Krunoslav Simon", pos: "SF", fame: 3 }, { name: "Chris Singleton", pos: "PF", fame: 4 },
    { name: "Sertac Sanli", pos: "C", fame: 5 } ] },
  { team: "FC Barcelona", season: 2021, champion: false, five: [
    { name: "Nick Calathes", pos: "PG", fame: 2 }, { name: "Cory Higgins", pos: "SG", fame: 4 },
    { name: "Alex Abrines", pos: "SF", fame: 3 }, { name: "Nikola Mirotic", pos: "PF", fame: 1 },
    { name: "Brandon Davies", pos: "C", fame: 5 } ] },
  { team: "Olimpia Milano", season: 2021, champion: false, five: [
    { name: "Malcolm Delaney", pos: "PG", fame: 3 }, { name: "Vladimir Micov", pos: "SG", fame: 5 },
    { name: "Shavon Shields", pos: "SF", fame: 1 }, { name: "Zach LeDay", pos: "PF", fame: 4 },
    { name: "Kyle Hines", pos: "C", fame: 2 } ] },
  { team: "CSKA Moscow", season: 2021, champion: false, five: [
    { name: "Daniel Hackett", pos: "PG", fame: 2 }, { name: "Darrun Hilliard", pos: "SG", fame: 4 },
    { name: "Nikita Kurbanov", pos: "SF", fame: 3 }, { name: "Tornike Shengelia", pos: "PF", fame: 1 },
    { name: "Michael Eric", pos: "C", fame: 5 } ] },
  // ===== 2009 Final Four (Berlin) =====
  // 2002-2009: each team's five in its SEMI-FINAL, from the official EuroLeague box scores
  // (api-live.euroleague.net game stats, startFive). Court positions and fame set by hand.
  { team: "Panathinaikos", season: 2009, champion: true, five: [
    { name: "Vassilis Spanoulis", pos: "PG", fame: 1 }, { name: "Drew Nicholas", pos: "SG", fame: 5 },
    { name: "Stratos Perperoglou", pos: "SF", fame: 4 }, { name: "Antonis Fotsis", pos: "PF", fame: 3 },
    { name: "Nikola Pekovic", pos: "C", fame: 2 } ] },
  { team: "Olympiacos", season: 2009, champion: false, five: [
    { name: "Jannero Pargo", pos: "PG", fame: 4 }, { name: "Yotam Halperin", pos: "SG", fame: 5 },
    { name: "Josh Childress", pos: "SF", fame: 2 }, { name: "Georgios Printezis", pos: "PF", fame: 1 },
    { name: "Nikola Vujcic", pos: "C", fame: 3 } ] },
  { team: "FC Barcelona", season: 2009, champion: false, five: [
    { name: "Jaka Lakovic", pos: "PG", fame: 4 }, { name: "Juan Carlos Navarro", pos: "SG", fame: 1 },
    { name: "Gianluca Basile", pos: "SF", fame: 2 }, { name: "David Andersen", pos: "PF", fame: 3 },
    { name: "Daniel Santiago", pos: "C", fame: 5 } ] },
  { team: "CSKA Moscow", season: 2009, champion: false, five: [
    { name: "J.R. Holden", pos: "PG", fame: 3 }, { name: "Trajan Langdon", pos: "SG", fame: 1 },
    { name: "Viktor Khryapa", pos: "SF", fame: 2 }, { name: "Matjaz Smodis", pos: "PF", fame: 4 },
    { name: "Erazem Lorbek", pos: "C", fame: 5 } ] },
  // ===== 2008 Final Four (Madrid) =====
  { team: "CSKA Moscow", season: 2008, champion: true, five: [
    { name: "J.R. Holden", pos: "PG", fame: 3 }, { name: "Trajan Langdon", pos: "SG", fame: 1 },
    { name: "Ramunas Siskauskas", pos: "SF", fame: 2 }, { name: "Matjaz Smodis", pos: "PF", fame: 4 },
    { name: "David Andersen", pos: "C", fame: 5 } ] },
  { team: "Baskonia", season: 2008, champion: false, five: [
    { name: "Zoran Planinic", pos: "PG", fame: 4 }, { name: "Igor Rakocevic", pos: "SG", fame: 1 },
    { name: "Pete Mickeal", pos: "SF", fame: 3 }, { name: "Mirza Teletovic", pos: "PF", fame: 2 },
    { name: "Will McDonald", pos: "C", fame: 5 } ] },
  { team: "Montepaschi Siena", season: 2008, champion: false, five: [
    { name: "Terrell McIntyre", pos: "PG", fame: 1 }, { name: "Bootsy Thornton", pos: "SG", fame: 4 },
    { name: "Romain Sato", pos: "SF", fame: 2 }, { name: "Shaun Stonerook", pos: "PF", fame: 3 },
    { name: "Benjamin Eze", pos: "C", fame: 5 } ] },
  { team: "Maccabi Tel Aviv", season: 2008, champion: false, five: [
    { name: "Yotam Halperin", pos: "PG", fame: 4 }, { name: "Vonteego Cummings", pos: "SG", fame: 5 },
    { name: "Omri Casspi", pos: "SF", fame: 1 }, { name: "Terence Morris", pos: "PF", fame: 3 },
    { name: "Nikola Vujcic", pos: "C", fame: 2 } ] },
  // ===== 2007 Final Four (Athens) =====
  { team: "Panathinaikos", season: 2007, champion: true, five: [
    { name: "Dimitris Diamantidis", pos: "PG", fame: 1 }, { name: "Sani Becirovic", pos: "SG", fame: 4 },
    { name: "Ramunas Siskauskas", pos: "SF", fame: 2 }, { name: "Dimos Dikoudis", pos: "PF", fame: 5 },
    { name: "Mike Batiste", pos: "C", fame: 3 } ] },
  { team: "Baskonia", season: 2007, champion: false, five: [
    { name: "Pablo Prigioni", pos: "PG", fame: 3 }, { name: "Igor Rakocevic", pos: "SG", fame: 4 },
    { name: "Fred House", pos: "SF", fame: 5 }, { name: "Luis Scola", pos: "PF", fame: 1 },
    { name: "Tiago Splitter", pos: "C", fame: 2 } ] },
  { team: "CSKA Moscow", season: 2007, champion: false, five: [
    { name: "J.R. Holden", pos: "PG", fame: 2 }, { name: "Trajan Langdon", pos: "SG", fame: 1 },
    { name: "Oscar Torres", pos: "SF", fame: 5 }, { name: "Matjaz Smodis", pos: "PF", fame: 3 },
    { name: "Aleksey Savrasenko", pos: "C", fame: 4 } ] },
  { team: "Unicaja", season: 2007, champion: false, five: [
    { name: "Carlos Cabezas", pos: "PG", fame: 4 }, { name: "Marcus Brown", pos: "SG", fame: 3 },
    { name: "Jiri Welsch", pos: "SF", fame: 2 }, { name: "Carlos Jimenez", pos: "PF", fame: 1 },
    { name: "Ignacio de Miguel", pos: "C", fame: 5 } ] },
  // ===== 2006 Final Four (Prague) =====
  { team: "CSKA Moscow", season: 2006, champion: true, five: [
    { name: "J.R. Holden", pos: "PG", fame: 2 }, { name: "Trajan Langdon", pos: "SG", fame: 1 },
    { name: "David Vanterpool", pos: "SF", fame: 4 }, { name: "Matjaz Smodis", pos: "PF", fame: 3 },
    { name: "Aleksey Savrasenko", pos: "C", fame: 5 } ] },
  { team: "FC Barcelona", season: 2006, champion: false, five: [
    { name: "Shammond Williams", pos: "PG", fame: 5 }, { name: "Juan Carlos Navarro", pos: "SG", fame: 1 },
    { name: "Rodrigo de la Fuente", pos: "SF", fame: 4 }, { name: "Gregor Fucka", pos: "PF", fame: 2 },
    { name: "Denis Marconato", pos: "C", fame: 3 } ] },
  { team: "Maccabi Tel Aviv", season: 2006, champion: false, five: [
    { name: "Willie Solomon", pos: "PG", fame: 5 }, { name: "Anthony Parker", pos: "SG", fame: 1 },
    { name: "Tal Burstein", pos: "SF", fame: 3 }, { name: "Maceo Baston", pos: "PF", fame: 4 },
    { name: "Nikola Vujcic", pos: "C", fame: 2 } ] },
  { team: "Baskonia", season: 2006, champion: false, five: [
    { name: "Pablo Prigioni", pos: "PG", fame: 3 }, { name: "Travis Hansen", pos: "SG", fame: 5 },
    { name: "Casey Jacobsen", pos: "SF", fame: 4 }, { name: "Luis Scola", pos: "PF", fame: 1 },
    { name: "Tiago Splitter", pos: "C", fame: 2 } ] },
  // ===== 2005 Final Four (Moscow) =====
  { team: "Maccabi Tel Aviv", season: 2005, champion: true, five: [
    { name: "Sarunas Jasikevicius", pos: "PG", fame: 1 }, { name: "Anthony Parker", pos: "SG", fame: 2 },
    { name: "Tal Burstein", pos: "SF", fame: 4 }, { name: "Maceo Baston", pos: "PF", fame: 5 },
    { name: "Nikola Vujcic", pos: "C", fame: 3 } ] },
  { team: "CSKA Moscow", season: 2005, champion: false, five: [
    { name: "J.R. Holden", pos: "PG", fame: 1 }, { name: "Marcus Brown", pos: "SG", fame: 4 },
    { name: "Antonio Granger", pos: "SF", fame: 5 }, { name: "Dimos Dikoudis", pos: "PF", fame: 3 },
    { name: "David Andersen", pos: "C", fame: 2 } ] },
  { team: "Baskonia", season: 2005, champion: false, five: [
    { name: "Jose Calderon", pos: "PG", fame: 2 }, { name: "Arvydas Macijauskas", pos: "SG", fame: 3 },
    { name: "Travis Hansen", pos: "SF", fame: 4 }, { name: "Luis Scola", pos: "PF", fame: 1 },
    { name: "Kornel David", pos: "C", fame: 5 } ] },
  { team: "Panathinaikos", season: 2005, champion: false, five: [
    { name: "Jaka Lakovic", pos: "PG", fame: 2 }, { name: "Vlado Scepanovic", pos: "SG", fame: 5 },
    { name: "Ibrahim Kutluay", pos: "SF", fame: 1 }, { name: "Mike Batiste", pos: "PF", fame: 3 },
    { name: "Kostas Tsartsaris", pos: "C", fame: 4 } ] },
  // ===== 2004 Final Four (Tel Aviv) =====
  { team: "Maccabi Tel Aviv", season: 2004, champion: true, five: [
    { name: "Sarunas Jasikevicius", pos: "PG", fame: 1 }, { name: "Anthony Parker", pos: "SG", fame: 2 },
    { name: "Tal Burstein", pos: "SF", fame: 4 }, { name: "Maceo Baston", pos: "PF", fame: 5 },
    { name: "Nikola Vujcic", pos: "C", fame: 3 } ] },
  { team: "CSKA Moscow", season: 2004, champion: false, five: [
    { name: "J.R. Holden", pos: "PG", fame: 1 }, { name: "Marcus Brown", pos: "SG", fame: 2 },
    { name: "Sergei Monia", pos: "SF", fame: 4 }, { name: "Mirsad Turkcan", pos: "PF", fame: 3 },
    { name: "Dragan Tarlac", pos: "C", fame: 5 } ] },
  { team: "Montepaschi Siena", season: 2004, champion: false, five: [
    { name: "Vrbica Stefanov", pos: "PG", fame: 3 }, { name: "Bootsy Thornton", pos: "SG", fame: 2 },
    { name: "Mindaugas Zukauskas", pos: "SF", fame: 4 }, { name: "Giacomo Galanda", pos: "PF", fame: 1 },
    { name: "Roberto Chiacig", pos: "C", fame: 5 } ] },
  { team: "Fortitudo Bologna", season: 2004, champion: false, five: [
    { name: "Milos Vujanic", pos: "PG", fame: 3 }, { name: "Gianluca Basile", pos: "SG", fame: 1 },
    { name: "Carlos Delfino", pos: "SF", fame: 2 }, { name: "Matjaz Smodis", pos: "PF", fame: 4 },
    { name: "Erazem Lorbek", pos: "C", fame: 5 } ] },
  // ===== 2003 Final Four (Barcelona) =====
  { team: "FC Barcelona", season: 2003, champion: true, five: [
    { name: "Sarunas Jasikevicius", pos: "PG", fame: 2 }, { name: "Rodrigo de la Fuente", pos: "SG", fame: 4 },
    { name: "Dejan Bodiroga", pos: "SF", fame: 1 }, { name: "Gregor Fucka", pos: "PF", fame: 3 },
    { name: "Roberto Duenas", pos: "C", fame: 5 } ] },
  { team: "CSKA Moscow", season: 2003, champion: false, five: [
    { name: "J.R. Holden", pos: "PG", fame: 2 }, { name: "Nikos Chatzivrettas", pos: "SG", fame: 3 },
    { name: "Viktor Khryapa", pos: "SF", fame: 1 }, { name: "Sergey Panov", pos: "PF", fame: 4 },
    { name: "Victor Alexander", pos: "C", fame: 5 } ] },
  { team: "Montepaschi Siena", season: 2003, champion: false, five: [
    { name: "Vrbica Stefanov", pos: "PG", fame: 3 }, { name: "Alphonso Ford", pos: "SG", fame: 2 },
    { name: "Dusan Vukcevic", pos: "SF", fame: 4 }, { name: "Mirsad Turkcan", pos: "PF", fame: 1 },
    { name: "Roberto Chiacig", pos: "C", fame: 5 } ] },
  { team: "Treviso", season: 2003, champion: false, five: [
    { name: "Tyus Edney", pos: "PG", fame: 4 }, { name: "Trajan Langdon", pos: "SG", fame: 2 },
    { name: "Riccardo Pittis", pos: "SF", fame: 5 }, { name: "Jorge Garbajosa", pos: "PF", fame: 1 },
    { name: "Denis Marconato", pos: "C", fame: 3 } ] },
  // ===== 2002 Final Four (Bologna) =====
  { team: "Panathinaikos", season: 2002, champion: true, five: [
    { name: "Damir Mulaomerovic", pos: "PG", fame: 5 }, { name: "Ibrahim Kutluay", pos: "SG", fame: 3 },
    { name: "Dejan Bodiroga", pos: "SF", fame: 1 }, { name: "Fragiskos Alvertis", pos: "PF", fame: 2 },
    { name: "Darryl Middleton", pos: "C", fame: 4 } ] },
  { team: "Treviso", season: 2002, champion: false, five: [
    { name: "Tyus Edney", pos: "PG", fame: 3 }, { name: "Charlie Bell", pos: "SG", fame: 5 },
    { name: "Bostjan Nachbar", pos: "SF", fame: 2 }, { name: "Jorge Garbajosa", pos: "PF", fame: 1 },
    { name: "Denis Marconato", pos: "C", fame: 4 } ] },
  { team: "Virtus Bologna", season: 2002, champion: false, five: [
    { name: "Marko Jaric", pos: "PG", fame: 2 }, { name: "Antoine Rigaudeau", pos: "SG", fame: 3 },
    { name: "Manu Ginobili", pos: "SF", fame: 1 }, { name: "Matjaz Smodis", pos: "PF", fame: 4 },
    { name: "Rashard Griffith", pos: "C", fame: 5 } ] },
  { team: "Maccabi Tel Aviv", season: 2002, champion: false, five: [
    { name: "Arriel McDonald", pos: "PG", fame: 3 }, { name: "Derrick Sharp", pos: "SG", fame: 2 },
    { name: "Anthony Parker", pos: "SF", fame: 1 }, { name: "Nadav Henefeld", pos: "PF", fame: 5 },
    { name: "Nate Huffman", pos: "C", fame: 4 } ] },
];

// --- Validate + canonicalise ----------------------------------------------
var POS = { PG: 1, SG: 1, SF: 1, PF: 1, C: 1 };
var errors = [];
RAW.forEach(function (L) {
  var tag = L.season + " " + L.team;
  if (L.five.length !== 5) errors.push(tag + ": not 5 players");
  var fames = {}, poss = {};
  L.five.forEach(function (p) {
    p.name = fixName(p.name);
    if (!POS[p.pos]) errors.push(tag + ": bad pos " + p.pos);
    fames[p.fame] = (fames[p.fame] || 0) + 1;
    poss[p.pos] = (poss[p.pos] || 0) + 1;
  });
  if ([1, 2, 3, 4, 5].some(function (f) { return fames[f] !== 1; })) errors.push(tag + ": fame must be 1-5 once each");
  if (Object.keys(poss).length !== 5) errors.push(tag + ": positions must be 5 distinct");
});
var bySeason = {};
RAW.forEach(function (L) { (bySeason[L.season] = bySeason[L.season] || []).push(L); });
Object.keys(bySeason).forEach(function (s) {
  var ts = bySeason[s];
  if (ts.length !== 4) errors.push(s + ": expected 4 Final Four teams, got " + ts.length);
  if (ts.filter(function (t) { return t.champion; }).length !== 1) errors.push(s + ": expected exactly 1 champion");
});
if (errors.length) { console.error("ERRORS:\n  " + errors.join("\n  ")); process.exit(1); }

// --- Emit lineups.js --------------------------------------------------------
var lines = ["/* AUTO-GENERATED by build_lineups.js — do not edit by hand. F4 starting fives for Complete the Five. */",
             "window.LINEUPS = ["];
RAW.forEach(function (L) { lines.push("  " + JSON.stringify(L) + ","); });
lines.push("];");
fs.writeFileSync("lineups.js", lines.join("\n") + "\n");

console.log("Wrote lineups.js — " + RAW.length + " lineups");
RAW.forEach(function (L) {
  console.log("  " + L.season + " " + L.team + (L.champion ? " 🏆" : "") + ": " +
    L.five.map(function (p) { return p.pos + " " + p.name + "(f" + p.fame + ")"; }).join(", "));
});
