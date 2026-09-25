/*
 * Builds eurocup_players.js, the EuroCup roster database.
 *
 *   Run:  node build_eurocup.js
 *
 * The EuroCup is Euroball's second competition. Its rosters are kept apart from
 * the EuroLeague's (players.js) because the two are different games' worth of
 * players: the switcher on the hub picks one, and competition.js hands the
 * chosen one to every game as window.PLAYERS / window.TEAMS.
 *
 * TEAMS and PLAYERS below are the source, filled in club by club from the
 * official rosters (same routine as the EuroLeague season update). Records use
 * players.js's shape: name, team, nationality, position (Guard/Forward/Center),
 * height (cm), birthYear, number. Until OPEN is set the EuroCup stays a
 * "coming soon" page and nothing on the site changes.
 *
 * A player the EuroLeague database already has (players.js or legends.js) is
 * listed with just { name, team, number } — his nationality, position, height
 * and birth year are read from there at build time, so a fix to his EuroLeague
 * record reaches the EuroCup too. Give a `position` only to override ours.
 * Players new to Euroball wait in PENDING until they are researched.
 */
const fs = require("fs");

const SEASON = "2026-27";

// Flip to true once every club is in and researched. Until then the EuroCup
// stays the coming-soon page even though this file already has players, so a
// half-built roster can never go live.
const OPEN = false;

// club name → { country }
const TEAMS = {
  "Aris Thessaloniki": { country: "Greece" },
  "Derthona Tortona": { country: "Italy" },
  "Bahcesehir College": { country: "Turkey" },
  "Balkan Botevgrad": { country: "Bulgaria" },
  "Bosna Sarajevo": { country: "Bosnia and Herzegovina" },
  "Buducnost": { country: "Montenegro" },
  "Cedevita Olimpija": { country: "Slovenia" },
  "JL Bourg-en-Bresse": { country: "France" },
  "Trento": { country: "Italy" },
  "Hapoel Jerusalem": { country: "Israel" },
  "Manresa": { country: "Spain" },
  "La Laguna Tenerife": { country: "Spain" },
  "Le Mans": { country: "France" },
  "Lietkabelis": { country: "Lithuania" },
  "London Lions": { country: "United Kingdom" },
  "Maxima Roma": { country: "Italy" },
  "Napoli Basketball": { country: "Italy" },
  "Neptunas": { country: "Lithuania" },
  "Niners Chemnitz": { country: "Germany" },
  "PAOK": { country: "Greece" },
  "Ratiopharm Ulm": { country: "Germany" },
  "San Pablo Burgos": { country: "Spain" },
  "Riga Zelli": { country: "Latvia" },
  "Roma Basketball": { country: "Italy" },
  "Rostock Seawolves": { country: "Germany" },
  "Siauliai": { country: "Lithuania" },
  "Skyliners Frankfurt": { country: "Germany" },
  "Slask Wroclaw": { country: "Poland" },
  "Tofas": { country: "Turkey" }
};

// { name, team, number } for a known player, or the full record for a new one
const PLAYERS = [
  // Aris Thessaloniki
  { name: "Vassilis Toliopoulos", team: "Aris Thessaloniki", number: 4 },
  { name: "Neno Dimitrijevic",    team: "Aris Thessaloniki", number: 7 },
  { name: "Stefan Jovic",         team: "Aris Thessaloniki", number: 24 },
  { name: "Matt Morgan",          team: "Aris Thessaloniki", number: 30 },
  { name: "Khem Birch",           team: "Aris Thessaloniki", number: 92 },
  // Derthona Tortona
  { name: "Paul Eboua", team: "Derthona Tortona", number: 0 },
  { name: "Karim Jallow", team: "Derthona Tortona", number: 35 },
  // Bahcesehir College
  { name: "Aleksa Avramovic", team: "Bahcesehir College", number: 4 },
  { name: "Isiaha Mike", team: "Bahcesehir College", number: 24 },
  // Cedevita Olimpija
  { name: "Jaka Blazic", team: "Cedevita Olimpija", number: 11 },
  // Hapoel Jerusalem
  { name: "Shake Milton", team: "Hapoel Jerusalem", number: 9 },
  // Manresa
  { name: "Rafa Villar", team: "Manresa", number: 44 },
  // La Laguna Tenerife
  { name: "Xabier Lopez-Arostegui", team: "La Laguna Tenerife", number: 7 },
  // Le Mans
  { name: "Melvin Ajinca", team: "Le Mans", number: 8 },
  // Napoli Basketball
  { name: "Zac Seljaas", team: "Napoli Basketball", number: 1 },
  { name: "Jeffrey Dowtin Jr.", team: "Napoli Basketball", number: 3 },
  // PAOK
  { name: "Cedi Osman", team: "PAOK", number: 6 },
  { name: "Nick Calathes", team: "PAOK", number: 33 },
  // Ratiopharm Ulm
  { name: "Armel Traore", team: "Ratiopharm Ulm", number: 94 },
  // Roma Basketball
  { name: "Nico Mannion", team: "Roma Basketball", number: 1 }
];

// New to Euroball: researched in batches once every club is in, then moved to
// PLAYERS as full records. Official position and number from the roster page.
const PENDING = [
  // Aris Thessaloniki
  { name: "Elijah Mitrou-Long",        team: "Aris Thessaloniki", position: "Guard",   number: 0 },
  { name: "Chrysostomos Chatzilamprou", team: "Aris Thessaloniki", position: "Guard",  number: 10 },
  { name: "Stylianos Poulianitis",     team: "Aris Thessaloniki", position: "Guard",   number: 11 },
  { name: "Eleftherios Bochoridis",    team: "Aris Thessaloniki", position: "Guard",   number: 13 },
  { name: "Jeremiah Robinson-Earl",    team: "Aris Thessaloniki", position: "Forward", number: 3 },
  { name: "E.J. Liddell",              team: "Aris Thessaloniki", position: "Forward", number: 32 },
  { name: "Vasilis Charalampopoulos",  team: "Aris Thessaloniki", position: "Forward", number: 33 },
  { name: "Thanasis Antetokounmpo",    team: "Aris Thessaloniki", position: "Forward", number: 43 },
  { name: "Adam Mokoka",               team: "Aris Thessaloniki", position: "Forward", number: 95 },
  { name: "Kostas Antetokounmpo",      team: "Aris Thessaloniki", position: "Center",  number: 37 },
  { name: "Georgios Tanoulis",         team: "Aris Thessaloniki", position: "Center",  number: 50 },
  // Derthona Tortona
  { name: "Prentiss Hubb", team: "Derthona Tortona", position: "Guard", number: 3 },
  { name: "Andrea Pecchia", team: "Derthona Tortona", position: "Guard", number: 6 },
  { name: "Edoardo Di Meo", team: "Derthona Tortona", position: "Guard", number: 9 },
  { name: "Giordano Bortolani", team: "Derthona Tortona", position: "Guard", number: 12 },
  { name: "Dante Maddox Jr.", team: "Derthona Tortona", position: "Guard", number: 21 },
  { name: "Aljami Durham", team: "Derthona Tortona", position: "Guard", number: 42 },
  { name: "Justin Gorham", team: "Derthona Tortona", position: "Forward", number: 4 },
  { name: "Amar Alibegovic", team: "Derthona Tortona", position: "Forward", number: 7 },
  { name: "Brayden Zumstein", team: "Derthona Tortona", position: "Forward", number: 10 },
  { name: "Giulio Gazzotti", team: "Derthona Tortona", position: "Forward", number: 24 },
  { name: "Dominik Olejniczak", team: "Derthona Tortona", position: "Center", number: 17 },
  // Bahcesehir College
  { name: "Marcquise Reed", team: "Bahcesehir College", position: "Guard", number: 0 },
  { name: "Ismet Akpinar", team: "Bahcesehir College", position: "Guard", number: 5 },
  { name: "Malachi Flynn", team: "Bahcesehir College", position: "Guard", number: 22 },
  { name: "Kenan Sipahi", team: "Bahcesehir College", position: "Guard", number: 55 },
  { name: "Maxim Mutaf", team: "Bahcesehir College", position: "Forward", number: 17 },
  { name: "Tyler Cavanaugh", team: "Bahcesehir College", position: "Forward", number: 34 },
  { name: "Mateusz Ponitka", team: "Bahcesehir College", position: "Forward", number: 38 },
  { name: "David DiLeo", team: "Bahcesehir College", position: "Forward", number: 51 },
  { name: "Damien Inglis", team: "Bahcesehir College", position: "Center", number: 7 },
  { name: "Furkan Haltali", team: "Bahcesehir College", position: "Center", number: 14 },
  { name: "Trevion Williams", team: "Bahcesehir College", position: "Center", number: 50 },
  // Balkan Botevgrad
  { name: "Darnell Edge", team: "Balkan Botevgrad", position: "Guard", number: 1 },
  { name: "Aleksandar Stoimenov", team: "Balkan Botevgrad", position: "Guard", number: 3 },
  { name: "Pavlin Ivanov", team: "Balkan Botevgrad", position: "Guard", number: 10 },
  { name: "Javante McCoy", team: "Balkan Botevgrad", position: "Guard", number: 13 },
  { name: "Konstantin Toshkov", team: "Balkan Botevgrad", position: "Guard", number: 22 },
  { name: "David Okwera", team: "Balkan Botevgrad", position: "Forward", number: 0 },
  { name: "Gael Bonilla", team: "Balkan Botevgrad", position: "Forward", number: 2 },
  { name: "Alex Ducas", team: "Balkan Botevgrad", position: "Forward", number: 8 },
  { name: "Nikolay Grozev", team: "Balkan Botevgrad", position: "Forward", number: 33 },
  { name: "Dimitar Dimitrov", team: "Balkan Botevgrad", position: "Forward", number: 34 },
  { name: "Ivan Alipiev", team: "Balkan Botevgrad", position: "Forward", number: 35 },
  { name: "Martin Sotirov", team: "Balkan Botevgrad", position: "Forward", number: 44 },
  { name: "Ivan Spirov", team: "Balkan Botevgrad", position: "Forward", number: 91 },
  { name: "Ulrich Chomche", team: "Balkan Botevgrad", position: "Center", number: 14 },
  // Bosna Sarajevo
  { name: "Miljan Kljestan", team: "Bosna Sarajevo", position: "Guard", number: 0 },
  { name: "Shawn Pipes Jr.", team: "Bosna Sarajevo", position: "Guard", number: 2 },
  { name: "Marcus Domask", team: "Bosna Sarajevo", position: "Guard", number: 3 },
  { name: "DeAndre Gholston", team: "Bosna Sarajevo", position: "Guard", number: 4 },
  { name: "Edin Atic", team: "Bosna Sarajevo", position: "Guard", number: 5 },
  { name: "Adin Vrabac", team: "Bosna Sarajevo", position: "Guard", number: 7 },
  { name: "Gary Browne", team: "Bosna Sarajevo", position: "Guard", number: 14 },
  { name: "Darko Talic", team: "Bosna Sarajevo", position: "Guard", number: 19 },
  { name: "Ryan Hawkins", team: "Bosna Sarajevo", position: "Forward", number: 44 },
  { name: "James Banks", team: "Bosna Sarajevo", position: "Center", number: 1 },
  { name: "Reginald Perry", team: "Bosna Sarajevo", position: "Center", number: 11 },
  { name: "Nikola Popovic", team: "Bosna Sarajevo", position: "Center", number: 21 },
  { name: "Daut Livadic", team: "Bosna Sarajevo", position: "Center", number: 22 },
  { name: "Alija Islamovic", team: "Bosna Sarajevo", position: "Center", number: 33 },
  // Buducnost
  { name: "Fletcher Magee", team: "Buducnost", position: "Guard", number: 3 },
  { name: "Iverson Molinar", team: "Buducnost", position: "Guard", number: 10 },
  { name: "Yogi Ferrell", team: "Buducnost", position: "Guard", number: 11 },
  { name: "Marial Shayok", team: "Buducnost", position: "Forward", number: 1 },
  { name: "Andrija Slavkovic", team: "Buducnost", position: "Forward", number: 7 },
  { name: "Emir Hadzibegovic", team: "Buducnost", position: "Forward", number: 8 },
  { name: "Dordije Jovanovic", team: "Buducnost", position: "Forward", number: 13 },
  { name: "Juwan Morgan", team: "Buducnost", position: "Forward", number: 15 },
  { name: "Oleksandr Kovliar", team: "Buducnost", position: "Forward", number: 50 },
  { name: "Axel Bouteille", team: "Buducnost", position: "Forward", number: 83 },
  { name: "Justin Smith", team: "Buducnost", position: "Center", number: 0 },
  { name: "Jerry Boutsiele", team: "Buducnost", position: "Center", number: 16 },
  { name: "Stefan Dordevic", team: "Buducnost", position: "Center", number: 45 },
  // Cedevita Olimpija
  { name: "Anthony Cowan Jr.", team: "Cedevita Olimpija", position: "Guard", number: 1 },
  { name: "Jordan Gainey", team: "Cedevita Olimpija", position: "Guard", number: 4 },
  { name: "Rihards Lomazs", team: "Cedevita Olimpija", position: "Guard", number: 6 },
  { name: "Derin Can Ustun", team: "Cedevita Olimpija", position: "Guard", number: 7 },
  { name: "Urban Kroflic", team: "Cedevita Olimpija", position: "Guard", number: 23 },
  { name: "Rok Radovic", team: "Cedevita Olimpija", position: "Forward", number: 3 },
  { name: "Miha Cerkvenik", team: "Cedevita Olimpija", position: "Forward", number: 20 },
  { name: "Matthew Hurt", team: "Cedevita Olimpija", position: "Forward", number: 21 },
  { name: "Noah Kirkwood", team: "Cedevita Olimpija", position: "Forward", number: 22 },
  { name: "Cameron Houindo", team: "Cedevita Olimpija", position: "Center", number: 8 },
  { name: "Osayi Osifo", team: "Cedevita Olimpija", position: "Center", number: 14 },
  { name: "David Skara", team: "Cedevita Olimpija", position: "Center", number: 24 },
  { name: "Jayce Johnson", team: "Cedevita Olimpija", position: "Center", number: 34 },
  // JL Bourg-en-Bresse
  { name: "Keith Jordan Jr.", team: "JL Bourg-en-Bresse", position: "Guard", number: 2 },
  { name: "Assemian Moulare", team: "JL Bourg-en-Bresse", position: "Guard", number: 3 },
  { name: "Antony Labanca", team: "JL Bourg-en-Bresse", position: "Guard", number: 8 },
  { name: "Tyson Walker", team: "JL Bourg-en-Bresse", position: "Guard", number: 12 },
  { name: "Trey Woodbury", team: "JL Bourg-en-Bresse", position: "Guard", number: 22 },
  { name: "Morgan Selebangue", team: "JL Bourg-en-Bresse", position: "Guard", number: 23 },
  { name: "Leni Monnet", team: "JL Bourg-en-Bresse", position: "Guard", number: 55 },
  { name: "Hugo Robineau", team: "JL Bourg-en-Bresse", position: "Guard", number: 87 },
  { name: "Adrian Nelson", team: "JL Bourg-en-Bresse", position: "Forward", number: 4 },
  { name: "Tyrese Samuel", team: "JL Bourg-en-Bresse", position: "Forward", number: 5 },
  { name: "Nathan Soliman", team: "JL Bourg-en-Bresse", position: "Forward", number: 14 },
  { name: "Lionel Gaudoux", team: "JL Bourg-en-Bresse", position: "Center", number: 13 },
  { name: "Kadin Shedrick", team: "JL Bourg-en-Bresse", position: "Center", number: 21 },
  // Trento
  { name: "Darius Brown II", team: "Trento", position: "Guard", number: 0 },
  { name: "Giulio Vergnaghi", team: "Trento", position: "Guard", number: 6 },
  { name: "Cheickh Niang", team: "Trento", position: "Guard", number: 7 },
  { name: "Quincy Olivari", team: "Trento", position: "Guard", number: 8 },
  { name: "Cosimo Flauto", team: "Trento", position: "Guard", number: 9 },
  { name: "Toto Forray", team: "Trento", position: "Guard", number: 10 },
  { name: "Federico Cattapan", team: "Trento", position: "Guard", number: 11 },
  { name: "Patrick Hassan", team: "Trento", position: "Guard", number: 68 },
  { name: "Charlie Brown Jr.", team: "Trento", position: "Forward", number: 4 },
  { name: "Alessandro Bertini", team: "Trento", position: "Forward", number: 5 },
  { name: "Vittorio Triggiani", team: "Trento", position: "Forward", number: 12 },
  { name: "Antonio Barra", team: "Trento", position: "Forward", number: 13 },
  { name: "Mansour Bayo", team: "Trento", position: "Forward", number: 15 },
  { name: "Isaiah Bigelow", team: "Trento", position: "Forward", number: 24 },
  { name: "Jose Medina Bouza", team: "Trento", position: "Forward", number: 30 },
  { name: "Selom Mawugbe", team: "Trento", position: "Center", number: 21 },
  { name: "Jordan Bayehe", team: "Trento", position: "Center", number: 26 },
  { name: "Oumar Fall", team: "Trento", position: "Center", number: 29 },
  // Hapoel Jerusalem
  { name: "Jared Harper", team: "Hapoel Jerusalem", position: "Guard", number: 1 },
  { name: "Jaleen Smith", team: "Hapoel Jerusalem", position: "Guard", number: 3 },
  { name: "Shachar Loberboum", team: "Hapoel Jerusalem", position: "Guard", number: 7 },
  { name: "Roi Huber", team: "Hapoel Jerusalem", position: "Guard", number: 13 },
  { name: "Ethan Burg", team: "Hapoel Jerusalem", position: "Guard", number: 35 },
  { name: "Yovel Zoosman", team: "Hapoel Jerusalem", position: "Guard", number: 50 },
  { name: "Kenny Lofton Jr.", team: "Hapoel Jerusalem", position: "Forward", number: 2 },
  { name: "Nimrod Levi", team: "Hapoel Jerusalem", position: "Forward", number: 15 },
  { name: "David Roddy", team: "Hapoel Jerusalem", position: "Forward", number: 21 },
  { name: "DeVontae Cacok", team: "Hapoel Jerusalem", position: "Center", number: 0 },
  { name: "Yotam Hanochi", team: "Hapoel Jerusalem", position: "Center", number: 8 },
  { name: "Dusan Miletic", team: "Hapoel Jerusalem", position: "Center", number: 11 },
  { name: "Gabriel Chachashvili", team: "Hapoel Jerusalem", position: "Center", number: 33 },
  // Manresa
  { name: "Lukasz Kolenda", team: "Manresa", position: "Guard", number: 1 },
  { name: "Hugo Benitez", team: "Manresa", position: "Guard", number: 2 },
  { name: "Lucas Beaufort", team: "Manresa", position: "Guard", number: 5 },
  { name: "Ferran Bassas", team: "Manresa", position: "Guard", number: 6 },
  { name: "JD Notae", team: "Manresa", position: "Guard", number: 13 },
  { name: "Gerard Fernandez", team: "Manresa", position: "Guard", number: 17 },
  { name: "Lucas Sanchez", team: "Manresa", position: "Guard", number: 18 },
  { name: "Timmy Allen", team: "Manresa", position: "Forward", number: 0 },
  { name: "Eric Vila", team: "Manresa", position: "Forward", number: 4 },
  { name: "Pablo Tamba", team: "Manresa", position: "Forward", number: 8 },
  { name: "Chibuzo Agbo", team: "Manresa", position: "Forward", number: 11 },
  { name: "Guillem Naspler", team: "Manresa", position: "Forward", number: 19 },
  { name: "Gustav Drejer Erichsen", team: "Manresa", position: "Forward", number: 21 },
  { name: "Yordan Minchev", team: "Manresa", position: "Forward", number: 91 },
  { name: "Nick Ongenda", team: "Manresa", position: "Center", number: 14 },
  { name: "Michael Enabulele", team: "Manresa", position: "Center", number: 20 },
  { name: "Pierre Oriola", team: "Manresa", position: "Center", number: 29 },
  // La Laguna Tenerife
  { name: "Jaime Fernandez", team: "La Laguna Tenerife", position: "Guard", number: 3 },
  { name: "Bruno Fitipaldo", team: "La Laguna Tenerife", position: "Guard", number: 6 },
  { name: "Marcelinho Huertas", team: "La Laguna Tenerife", position: "Guard", number: 9 },
  { name: "Arturs Kurucs", team: "La Laguna Tenerife", position: "Guard", number: 47 },
  { name: "Bamba Cisse", team: "La Laguna Tenerife", position: "Forward", number: 1 },
  { name: "Kyle Guy", team: "La Laguna Tenerife", position: "Forward", number: 2 },
  { name: "Wesley van Beck", team: "La Laguna Tenerife", position: "Forward", number: 4 },
  { name: "Hector Alderete", team: "La Laguna Tenerife", position: "Forward", number: 33 },
  { name: "Tim Abromaitis", team: "La Laguna Tenerife", position: "Center", number: 21 },
  { name: "Ethan Happ", team: "La Laguna Tenerife", position: "Center", number: 22 },
  { name: "Vince Hunter", team: "La Laguna Tenerife", position: "Center", number: 32 },
  // Le Mans
  { name: "Carlos Stewart Jr.", team: "Le Mans", position: "Guard", number: 0 },
  { name: "Bastien Grasshoff", team: "Le Mans", position: "Guard", number: 1 },
  { name: "Jordan King", team: "Le Mans", position: "Guard", number: 2 },
  { name: "Afeny Cognet", team: "Le Mans", position: "Guard", number: 3 },
  { name: "Leopold Delaunay", team: "Le Mans", position: "Guard", number: 9 },
  { name: "Ugo Doumbia Niang", team: "Le Mans", position: "Guard", number: 10 },
  { name: "Moses Wood", team: "Le Mans", position: "Forward", number: 23 },
  { name: "Lucas Dufeal", team: "Le Mans", position: "Forward", number: 32 },
  { name: "Madiba Diaby-Cisse", team: "Le Mans", position: "Forward", number: 88 },
  { name: "Swann Penda", team: "Le Mans", position: "Forward", number: 93 },
  { name: "Wilfried Yeguete", team: "Le Mans", position: "Center", number: 15 },
  { name: "Tyler Beracou", team: "Le Mans", position: "Center", number: 26 },
  { name: "Tashawn Thomas", team: "Le Mans", position: "Center", number: 35 },
  // Lietkabelis
  { name: "Alexander Schumacher", team: "Lietkabelis", position: "Guard", number: 2 },
  { name: "Nojus Radzius", team: "Lietkabelis", position: "Guard", number: 5 },
  { name: "Ognjen Jaramaz", team: "Lietkabelis", position: "Guard", number: 10 },
  { name: "Titas Katauskas", team: "Lietkabelis", position: "Guard", number: 72 },
  { name: "Marius Valinskas", team: "Lietkabelis", position: "Guard", number: 99 },
  { name: "Keondre Kennedy", team: "Lietkabelis", position: "Forward", number: 0 },
  { name: "Zygimantas Simonis", team: "Lietkabelis", position: "Forward", number: 3 },
  { name: "Daniel Baslyk", team: "Lietkabelis", position: "Forward", number: 9 },
  { name: "Milos Ilic", team: "Lietkabelis", position: "Forward", number: 11 },
  { name: "Ivan Fevrier", team: "Lietkabelis", position: "Forward", number: 23 },
  { name: "Gytis Nemeiksa", team: "Lietkabelis", position: "Forward", number: 50 },
  { name: "Veljko Ilic", team: "Lietkabelis", position: "Center", number: 8 },
  { name: "Gabrielius Maldunas", team: "Lietkabelis", position: "Center", number: 12 },
  // London Lions
  { name: "Devante Jones", team: "London Lions", position: "Guard", number: 3 },
  { name: "Mo Soluade", team: "London Lions", position: "Guard", number: 6 },
  { name: "Tarik Phillip", team: "London Lions", position: "Guard", number: 22 },
  { name: "Landrius Horton", team: "London Lions", position: "Guard", number: 23 },
  { name: "Joel Scott", team: "London Lions", position: "Forward", number: 1 },
  { name: "Maxwell Lewis III", team: "London Lions", position: "Forward", number: 2 },
  { name: "Joshua O'Garro", team: "London Lions", position: "Forward", number: 7 },
  { name: "Emilis Zibuda", team: "London Lions", position: "Forward", number: 8 },
  { name: "Ethan Price", team: "London Lions", position: "Forward", number: 10 },
  { name: "Keenan Evans", team: "London Lions", position: "Forward", number: 12 },
  { name: "Aaryn Rai", team: "London Lions", position: "Forward", number: 21 },
  { name: "Deane Williams", team: "London Lions", position: "Forward", number: 31 },
  { name: "Thomas Kennedy", team: "London Lions", position: "Center", number: 54 },
  // Maxima Roma
  { name: "Aaron Holiday", team: "Maxima Roma", position: "Guard", number: 3 },
  { name: "Mirza Alibegovic", team: "Maxima Roma", position: "Guard", number: 5 },
  { name: "Francesco Carnevale", team: "Maxima Roma", position: "Guard", number: 8 },
  { name: "Brynton Lemar", team: "Maxima Roma", position: "Guard", number: 11 },
  { name: "Xavier Moon", team: "Maxima Roma", position: "Guard", number: 17 },
  { name: "Federico Bonacini", team: "Maxima Roma", position: "Guard", number: 23 },
  { name: "Carl Wheatle", team: "Maxima Roma", position: "Forward", number: 10 },
  { name: "Giovanni Veronesi", team: "Maxima Roma", position: "Forward", number: 16 },
  { name: "Matt Ryan", team: "Maxima Roma", position: "Forward", number: 32 },
  { name: "Andrija Dozic", team: "Maxima Roma", position: "Forward", number: 77 },
  { name: "John Brown III", team: "Maxima Roma", position: "Center", number: 0 },
  { name: "Miro Bilan", team: "Maxima Roma", position: "Center", number: 2 },
  { name: "Gora Camara", team: "Maxima Roma", position: "Center", number: 29 },
  // Napoli Basketball
  { name: "Marco Spissu", team: "Napoli Basketball", position: "Guard", number: 0 },
  { name: "John Petrucelli", team: "Napoli Basketball", position: "Guard", number: 11 },
  { name: "Markel Brown", team: "Napoli Basketball", position: "Guard", number: 22 },
  { name: "Jahmi'us Ramsey", team: "Napoli Basketball", position: "Guard", number: 37 },
  { name: "Leonardo Faggian", team: "Napoli Basketball", position: "Forward", number: 10 },
  { name: "Jack White", team: "Napoli Basketball", position: "Forward", number: 14 },
  { name: "Andrej Jakimovski", team: "Napoli Basketball", position: "Forward", number: 23 },
  { name: "Assane Sankare", team: "Napoli Basketball", position: "Center", number: 12 },
  { name: "Kaleb Tarczewski", team: "Napoli Basketball", position: "Center", number: 25 },
  { name: "Guglielmo Caruso", team: "Napoli Basketball", position: "Center", number: 30 },
  { name: "Leonardo Tote", team: "Napoli Basketball", position: "Center", number: 35 },
  // Neptunas
  { name: "Yannick Franke", team: "Neptunas", position: "Guard", number: 5 },
  { name: "Simas Sarakauskas", team: "Neptunas", position: "Guard", number: 7 },
  { name: "Mindaugas Girdziunas", team: "Neptunas", position: "Guard", number: 8 },
  { name: "Elvar Fridriksson", team: "Neptunas", position: "Guard", number: 10 },
  { name: "Rytis Sakaitis", team: "Neptunas", position: "Guard", number: 12 },
  { name: "Kristupas Zemaitis", team: "Neptunas", position: "Guard", number: 13 },
  { name: "Henri Drell", team: "Neptunas", position: "Forward", number: 0 },
  { name: "Donatas Tarolis", team: "Neptunas", position: "Forward", number: 1 },
  { name: "Arnas Berucka", team: "Neptunas", position: "Forward", number: 21 },
  { name: "Einaras Tubutis", team: "Neptunas", position: "Forward", number: 37 },
  { name: "Lukas Kreismontas", team: "Neptunas", position: "Forward", number: 88 },
  { name: "Martynas Echodas", team: "Neptunas", position: "Center", number: 14 },
  { name: "Raymond Somerville", team: "Neptunas", position: "Center", number: 17 },
  // Niners Chemnitz
  { name: "Phlandrous Fleming Jr.", team: "Niners Chemnitz", position: "Guard", number: 1 },
  { name: "Stefan Smith", team: "Niners Chemnitz", position: "Guard", number: 2 },
  { name: "Yohan Choupas", team: "Niners Chemnitz", position: "Guard", number: 6 },
  { name: "Luca Kellig", team: "Niners Chemnitz", position: "Guard", number: 13 },
  { name: "Cobe Williams", team: "Niners Chemnitz", position: "Guard", number: 24 },
  { name: "Elias Roedl", team: "Niners Chemnitz", position: "Forward", number: 11 },
  { name: "Alfons Milatz", team: "Niners Chemnitz", position: "Forward", number: 19 },
  { name: "Urald King", team: "Niners Chemnitz", position: "Forward", number: 20 },
  { name: "Mateo Seric", team: "Niners Chemnitz", position: "Forward", number: 21 },
  { name: "Ben Burnham", team: "Niners Chemnitz", position: "Forward", number: 25 },
  { name: "Jannis von Seckendorff", team: "Niners Chemnitz", position: "Forward", number: 90 },
  { name: "Alexander Richardson", team: "Niners Chemnitz", position: "Center", number: 9 },
  { name: "Darion Atkins", team: "Niners Chemnitz", position: "Center", number: 17 },
  { name: "Nighael Ceaser", team: "Niners Chemnitz", position: "Center", number: 22 },
  { name: "Anton Bock", team: "Niners Chemnitz", position: "Center", number: 27 },
  // PAOK
  { name: "Naz Mitrou-Long", team: "PAOK", position: "Guard", number: 1 },
  { name: "Georgios Charalampidis", team: "PAOK", position: "Guard", number: 2 },
  { name: "Breein Tyree", team: "PAOK", position: "Guard", number: 5 },
  { name: "Trevor Hudgins", team: "PAOK", position: "Guard", number: 12 },
  { name: "Marcus Foster", team: "PAOK", position: "Guard", number: 17 },
  { name: "Georgios Fillios", team: "PAOK", position: "Guard", number: 25 },
  { name: "Athanasios Bazinas", team: "PAOK", position: "Guard", number: 77 },
  { name: "Raiquan Gray", team: "PAOK", position: "Forward", number: 0 },
  { name: "Nikos Chougkaz", team: "PAOK", position: "Forward", number: 9 },
  { name: "Ioannis Spanos", team: "PAOK", position: "Forward", number: 10 },
  { name: "Nikolaos Persidis", team: "PAOK", position: "Forward", number: 18 },
  { name: "Kyle Alexander", team: "PAOK", position: "Center", number: 8 },
  { name: "Clifford Omoruyi", team: "PAOK", position: "Center", number: 11 },
  { name: "Dimitrios Kaklamanakis", team: "PAOK", position: "Center", number: 14 },
  { name: "Ben Moore", team: "PAOK", position: "Center", number: 26 },
  // Ratiopharm Ulm
  { name: "Adam Atamna", team: "Ratiopharm Ulm", position: "Guard", number: 0 },
  { name: "Namori Omog", team: "Ratiopharm Ulm", position: "Guard", number: 1 },
  { name: "Ibi Watson", team: "Ratiopharm Ulm", position: "Guard", number: 2 },
  { name: "Teo Milicic", team: "Ratiopharm Ulm", position: "Guard", number: 4 },
  { name: "Devin Schmidt", team: "Ratiopharm Ulm", position: "Guard", number: 8 },
  { name: "CJ Anthony Jr.", team: "Ratiopharm Ulm", position: "Guard", number: 25 },
  { name: "Jaylen Sims", team: "Ratiopharm Ulm", position: "Guard", number: 30 },
  { name: "Lucas Fischer", team: "Ratiopharm Ulm", position: "Guard", number: 43 },
  { name: "Marvin Heckel", team: "Ratiopharm Ulm", position: "Guard", number: 47 },
  { name: "Dwayne Koroma", team: "Ratiopharm Ulm", position: "Forward", number: 3 },
  { name: "Meissa Faye", team: "Ratiopharm Ulm", position: "Forward", number: 11 },
  { name: "Michael Rataj", team: "Ratiopharm Ulm", position: "Forward", number: 12 },
  { name: "Lenny Liedtke", team: "Ratiopharm Ulm", position: "Forward", number: 55 },
  { name: "Simisola Shittu", team: "Ratiopharm Ulm", position: "Center", number: 45 },
  // San Pablo Burgos
  { name: "Chase Audige", team: "San Pablo Burgos", position: "Guard", number: 1 },
  { name: "DJ Steward", team: "San Pablo Burgos", position: "Guard", number: 4 },
  { name: "Ziga Samar", team: "San Pablo Burgos", position: "Guard", number: 5 },
  { name: "Retin Obasohan", team: "San Pablo Burgos", position: "Guard", number: 32 },
  { name: "Raul Lobaco", team: "San Pablo Burgos", position: "Guard", number: 55 },
  { name: "Joaquin Taboada", team: "San Pablo Burgos", position: "Guard", number: 59 },
  { name: "Pablo Almazan", team: "San Pablo Burgos", position: "Forward", number: 8 },
  { name: "Daniel Diez", team: "San Pablo Burgos", position: "Forward", number: 11 },
  { name: "Dusan Radosavljevic", team: "San Pablo Burgos", position: "Forward", number: 15 },
  { name: "Christian Sengfelder", team: "San Pablo Burgos", position: "Forward", number: 43 },
  { name: "Balsa Koprivica", team: "San Pablo Burgos", position: "Center", number: 7 },
  { name: "Ruben Guerrero", team: "San Pablo Burgos", position: "Center", number: 12 },
  { name: "Sekou Doumbouya", team: "San Pablo Burgos", position: "Center", number: 45 },
  // Riga Zelli
  { name: "Tony Perkins", team: "Riga Zelli", position: "Guard", number: 1 },
  { name: "Benjamin Shungu", team: "Riga Zelli", position: "Guard", number: 2 },
  { name: "Toms Skuja", team: "Riga Zelli", position: "Guard", number: 3 },
  { name: "Gustavs Kampuss", team: "Riga Zelli", position: "Guard", number: 6 },
  { name: "Rolands Sulcs", team: "Riga Zelli", position: "Guard", number: 10 },
  { name: "Tyler Wahl", team: "Riga Zelli", position: "Forward", number: 5 },
  { name: "Kristians Feierbergs", team: "Riga Zelli", position: "Forward", number: 11 },
  { name: "Kristers Kikusts", team: "Riga Zelli", position: "Forward", number: 12 },
  { name: "Martynas Varnas", team: "Riga Zelli", position: "Forward", number: 13 },
  { name: "Tomas Talcis", team: "Riga Zelli", position: "Forward", number: 22 },
  { name: "Janis Berzins", team: "Riga Zelli", position: "Forward", number: 31 },
  { name: "Ivan Tkachenko", team: "Riga Zelli", position: "Forward", number: 55 },
  { name: "Klavs Cavars", team: "Riga Zelli", position: "Center", number: 15 },
  { name: "Isaac Johnson", team: "Riga Zelli", position: "Center", number: 33 },
  // Roma Basketball
  { name: "Corey Davis Jr.", team: "Roma Basketball", position: "Guard", number: 5 },
  { name: "Erik Stevenson", team: "Roma Basketball", position: "Guard", number: 10 },
  { name: "Gerald Ayayi", team: "Roma Basketball", position: "Guard", number: 11 },
  { name: "Michael Iuzzolino", team: "Roma Basketball", position: "Guard", number: 33 },
  { name: "Valerio Ciotoli", team: "Roma Basketball", position: "Guard", number: 37 },
  { name: "Paul Watson Jr.", team: "Roma Basketball", position: "Forward", number: 3 },
  { name: "Trentyn Flowers", team: "Roma Basketball", position: "Forward", number: 9 },
  { name: "Arturs Strautins", team: "Roma Basketball", position: "Forward", number: 12 },
  { name: "Giannis Odzebe", team: "Roma Basketball", position: "Forward", number: 13 },
  { name: "Andrea Mezzanotte", team: "Roma Basketball", position: "Forward", number: 24 },
  { name: "Giovanni Emejuru", team: "Roma Basketball", position: "Center", number: 7 },
  { name: "Marko Simonovic", team: "Roma Basketball", position: "Center", number: 19 },
  // Rostock Seawolves
  { name: "TJ Crockett Jr.", team: "Rostock Seawolves", position: "Guard", number: 0 },
  { name: "Zach Copeland", team: "Rostock Seawolves", position: "Guard", number: 2 },
  { name: "Elias Baggette", team: "Rostock Seawolves", position: "Guard", number: 4 },
  { name: "Isayah Owens", team: "Rostock Seawolves", position: "Guard", number: 6 },
  { name: "DeAndre Lansdowne", team: "Rostock Seawolves", position: "Guard", number: 9 },
  { name: "Johnathan Stove", team: "Rostock Seawolves", position: "Guard", number: 22 },
  { name: "Dominic Lockhart", team: "Rostock Seawolves", position: "Forward", number: 3 },
  { name: "Robin Amaize", team: "Rostock Seawolves", position: "Forward", number: 15 },
  { name: "Matthes Tilsen", team: "Rostock Seawolves", position: "Forward", number: 31 },
  { name: "Todd Withers", team: "Rostock Seawolves", position: "Forward", number: 33 },
  { name: "Artur Konontsuk", team: "Rostock Seawolves", position: "Forward", number: 34 },
  { name: "Philipp Hartwich", team: "Rostock Seawolves", position: "Center", number: 7 },
  { name: "Bruno Loll", team: "Rostock Seawolves", position: "Center", number: 20 },
  { name: "Owen Klassen", team: "Rostock Seawolves", position: "Center", number: 29 },
  { name: "Bent Leuchten", team: "Rostock Seawolves", position: "Center", number: 51 },
  // Siauliai
  { name: "Cedric Henderson Jr.", team: "Siauliai", position: "Guard", number: 2 },
  { name: "Selim Fofana", team: "Siauliai", position: "Guard", number: 7 },
  { name: "Karolis Lukosiunas", team: "Siauliai", position: "Guard", number: 16 },
  { name: "Dayvion McKnight", team: "Siauliai", position: "Guard", number: 20 },
  { name: "Michael Caffey", team: "Siauliai", position: "Guard", number: 55 },
  { name: "Simas Jarumbauskas", team: "Siauliai", position: "Forward", number: 17 },
  { name: "Erikas Venskus", team: "Siauliai", position: "Forward", number: 21 },
  { name: "Tauras Jogela", team: "Siauliai", position: "Forward", number: 22 },
  { name: "Dovydas Romancenko", team: "Siauliai", position: "Forward", number: 25 },
  { name: "Rokas Civilis", team: "Siauliai", position: "Forward", number: 77 },
  { name: "Martynas Pacevicius", team: "Siauliai", position: "Center", number: 9 },
  { name: "Efton Reid", team: "Siauliai", position: "Center", number: 15 },
  // Skyliners Frankfurt
  { name: "Jamie Edoka", team: "Skyliners Frankfurt", position: "Guard", number: 0 },
  { name: "Isaiah Swope", team: "Skyliners Frankfurt", position: "Guard", number: 1 },
  { name: "Nahiem Alleyne", team: "Skyliners Frankfurt", position: "Guard", number: 4 },
  { name: "William Christmas", team: "Skyliners Frankfurt", position: "Guard", number: 8 },
  { name: "Judah Mintz", team: "Skyliners Frankfurt", position: "Guard", number: 10 },
  { name: "Dusan Nikolic", team: "Skyliners Frankfurt", position: "Guard", number: 14 },
  { name: "Thomas Klepeisz", team: "Skyliners Frankfurt", position: "Guard", number: 22 },
  { name: "Lenny Benczak", team: "Skyliners Frankfurt", position: "Guard", number: 24 },
  { name: "Lukas Smazak", team: "Skyliners Frankfurt", position: "Guard", number: 44 },
  { name: "Ryan Arcidiacono", team: "Skyliners Frankfurt", position: "Guard", number: 51 },
  { name: "Julius Messer", team: "Skyliners Frankfurt", position: "Forward", number: 3 },
  { name: "Ivan Crnjac", team: "Skyliners Frankfurt", position: "Forward", number: 13 },
  { name: "Radii Caisin", team: "Skyliners Frankfurt", position: "Forward", number: 15 },
  { name: "Till Pape", team: "Skyliners Frankfurt", position: "Forward", number: 19 },
  { name: "Maximilian Peters", team: "Skyliners Frankfurt", position: "Forward", number: 21 },
  { name: "Race Thompson", team: "Skyliners Frankfurt", position: "Center", number: 5 },
  { name: "Moses Poelking", team: "Skyliners Frankfurt", position: "Center", number: 6 },
  { name: "Jacob Knauf", team: "Skyliners Frankfurt", position: "Center", number: 25 },
  { name: "Roman Bedime", team: "Skyliners Frankfurt", position: "Center", number: 35 },
  // Slask Wroclaw
  { name: "Anthony Hickey", team: "Slask Wroclaw", position: "Guard", number: 2 },
  { name: "Malik Parsons", team: "Slask Wroclaw", position: "Guard", number: 3 },
  { name: "Kyrell Luc", team: "Slask Wroclaw", position: "Guard", number: 4 },
  { name: "Anthony Wrzeszcz", team: "Slask Wroclaw", position: "Guard", number: 8 },
  { name: "Blazej Kulikowski", team: "Slask Wroclaw", position: "Guard", number: 11 },
  { name: "Blazej Czerniewicz", team: "Slask Wroclaw", position: "Guard", number: 27 },
  { name: "Devin Robinson", team: "Slask Wroclaw", position: "Forward", number: 5 },
  { name: "Tymoteusz Sternicki", team: "Slask Wroclaw", position: "Forward", number: 22 },
  { name: "Jakub Niziol", team: "Slask Wroclaw", position: "Forward", number: 35 },
  { name: "Isaih Moore", team: "Slask Wroclaw", position: "Center", number: 13 },
  { name: "John Egbunu", team: "Slask Wroclaw", position: "Center", number: 15 },
  { name: "Leon Dunin-Wasowicz", team: "Slask Wroclaw", position: "Center", number: 17 },
  // Tofas
  { name: "Kerem Corumlular", team: "Tofas", position: "Guard", number: 4 },
  { name: "Zach Nutall", team: "Tofas", position: "Guard", number: 10 },
  { name: "Efe Postel", team: "Tofas", position: "Guard", number: 22 },
  { name: "Bryce Jones", team: "Tofas", position: "Guard", number: 32 },
  { name: "Shavar Reynolds Jr.", team: "Tofas", position: "Guard", number: 33 },
  { name: "Berkay Gonul", team: "Tofas", position: "Forward", number: 2 },
  { name: "Yigitcan Saybir", team: "Tofas", position: "Forward", number: 3 },
  { name: "Sadik Kabaca", team: "Tofas", position: "Forward", number: 6 },
  { name: "Tre'Shawn Thurman", team: "Tofas", position: "Forward", number: 15 },
  { name: "Poyraz Pasaoglu", team: "Tofas", position: "Forward", number: 35 },
  { name: "Gabriel Brown", team: "Tofas", position: "Forward", number: 44 },
  { name: "Leon Apaydin", team: "Tofas", position: "Forward", number: 55 },
  { name: "Terrell Carter II", team: "Tofas", position: "Center", number: 5 },
  { name: "Jamuni McNeace", team: "Tofas", position: "Center", number: 8 },
  { name: "Emirhan Serbest", team: "Tofas", position: "Center", number: 24 }
];

// The EuroLeague records a known player's bio is read from.
function euroleagueRecords() {
  const win = {};
  new Function("window", fs.readFileSync("players.js", "utf8") + ";\n" + fs.readFileSync("legends.js", "utf8"))(win);
  const byName = {};
  (win.LEGENDS || []).concat(win.PLAYERS || []).forEach(function (p) { byName[p.name] = p; });   // active wins a tie
  return byName;
}
const EL = euroleagueRecords();
const problems = [];
const filled = PLAYERS.map(function (p) {
  if (p.nationality) return p;                     // a full record
  const src = EL[p.name];
  if (!src) { problems.push(p.name + ": not in players.js or legends.js, so it needs a full record"); return p; }
  return { name: p.name, team: p.team, nationality: src.nationality, position: p.position || src.position,
           height: src.height, birthYear: src.birthYear, number: p.number };
});

const POSITIONS = { Guard: 1, Forward: 1, Center: 1 };
const seen = {};
filled.forEach(function (p, i) {
  const at = (p && p.name) || "#" + i;
  ["name", "team", "nationality", "position"].forEach(function (k) {
    if (typeof p[k] !== "string" || !p[k]) problems.push(at + ": missing " + k);
  });
  if (!TEAMS[p.team]) problems.push(at + ": club '" + p.team + "' is not in TEAMS");
  if (!POSITIONS[p.position]) problems.push(at + ": position '" + p.position + "' is not Guard/Forward/Center");
  if (!(p.height >= 160 && p.height <= 235)) problems.push(at + ": height " + p.height);
  if (!(p.birthYear >= 1975 && p.birthYear <= 2010)) problems.push(at + ": birthYear " + p.birthYear);
  if (!(p.number >= 0 && p.number <= 99)) problems.push(at + ": number " + p.number);
  if (seen[p.name]) problems.push(at + ": listed twice");
  seen[p.name] = 1;
});
if (problems.length) {
  console.error("eurocup_players.js NOT written:\n  " + problems.join("\n  "));
  process.exit(1);
}

const players = filled.slice().sort(function (a, b) {
  return a.team === b.team ? a.name.localeCompare(b.name) : a.team.localeCompare(b.team);
}).map(function (p) {
  return { name: p.name, team: p.team, nationality: p.nationality, position: p.position,
           height: p.height, birthYear: p.birthYear, number: p.number };
});

const out = "/*\n" +
  " * EuroCup " + SEASON + " player database (auto-generated by build_eurocup.js — do not edit).\n" +
  " * Same record shape as players.js. Until EUROCUP_OPEN is true the EuroCup stays\n" +
  " * a coming-soon page.\n" +
  " */\n\n" +
  "window.EUROCUP_OPEN = " + OPEN + ";\n\n" +
  "window.EUROCUP_TEAMS = " + JSON.stringify(TEAMS, null, 2) + ";\n\n" +
  "window.EUROCUP_PLAYERS = " + JSON.stringify(players, null, 2) + ";\n";
fs.writeFileSync("eurocup_players.js", out);
console.log("eurocup_players.js: " + Object.keys(TEAMS).length + " clubs, " + players.length + " players, " + PENDING.length + " pending research");
