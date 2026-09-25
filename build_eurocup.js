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
  "Tofas": { country: "Turkey" },
  "Turk Telekom": { country: "Turkey" },
  "Cluj-Napoca": { country: "Romania" },
  "Reyer Venezia": { country: "Italy" }
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
  { name: "Nico Mannion", team: "Roma Basketball", number: 1 },
  // Turk Telekom
  { name: "Shaquielle McKissic", team: "Turk Telekom", number: 77 },
  // Reyer Venezia
  { name: "Glynn Watson Jr.", team: "Reyer Venezia", number: 30 },
  { name: "Elijah Mitrou-Long", team: "Aris Thessaloniki", nationality: "Greece", position: "Guard", height: 187, birthYear: 1996, number: 0 },
  { name: "Stylianos Poulianitis", team: "Aris Thessaloniki", nationality: "Greece", position: "Guard", height: 190, birthYear: 1995, number: 11 },
  { name: "Eleftherios Bochoridis", team: "Aris Thessaloniki", nationality: "Greece", position: "Guard", height: 196, birthYear: 1994, number: 13 },
  { name: "Jeremiah Robinson-Earl", team: "Aris Thessaloniki", nationality: "USA", position: "Forward", height: 206, birthYear: 2000, number: 3 },
  { name: "E.J. Liddell", team: "Aris Thessaloniki", nationality: "USA", position: "Forward", height: 198, birthYear: 2000, number: 32 },
  { name: "Vasilis Charalampopoulos", team: "Aris Thessaloniki", nationality: "Greece", position: "Forward", height: 204, birthYear: 1997, number: 33 },
  { name: "Thanasis Antetokounmpo", team: "Aris Thessaloniki", nationality: "Greece", position: "Forward", height: 201, birthYear: 1992, number: 43 },
  { name: "Adam Mokoka", team: "Aris Thessaloniki", nationality: "France", position: "Forward", height: 196, birthYear: 1998, number: 95 },
  { name: "Kostas Antetokounmpo", team: "Aris Thessaloniki", nationality: "Greece", position: "Center", height: 208, birthYear: 1997, number: 37 },
  { name: "Georgios Tanoulis", team: "Aris Thessaloniki", nationality: "Greece", position: "Center", height: 210, birthYear: 2002, number: 50 },
  { name: "Prentiss Hubb", team: "Derthona Tortona", nationality: "USA", position: "Guard", height: 191, birthYear: 1999, number: 3 },
  { name: "Andrea Pecchia", team: "Derthona Tortona", nationality: "Italy", position: "Guard", height: 196, birthYear: 1997, number: 6 },
  { name: "Giordano Bortolani", team: "Derthona Tortona", nationality: "Italy", position: "Guard", height: 193, birthYear: 2000, number: 12 },
  { name: "Dante Maddox Jr.", team: "Derthona Tortona", nationality: "USA", position: "Guard", height: 188, birthYear: 2002, number: 21 },
  { name: "Aljami Durham", team: "Derthona Tortona", nationality: "USA", position: "Guard", height: 193, birthYear: 1998, number: 42 },
  { name: "Justin Gorham", team: "Derthona Tortona", nationality: "USA", position: "Forward", height: 201, birthYear: 1998, number: 4 },
  { name: "Amar Alibegovic", team: "Derthona Tortona", nationality: "Bosnia and Herzegovina", position: "Forward", height: 206, birthYear: 1995, number: 7 },
  { name: "Giulio Gazzotti", team: "Derthona Tortona", nationality: "Italy", position: "Forward", height: 203, birthYear: 1991, number: 24 },
  { name: "Dominik Olejniczak", team: "Derthona Tortona", nationality: "Poland", position: "Center", height: 213, birthYear: 1996, number: 17 },
  { name: "Marcquise Reed", team: "Bahcesehir College", nationality: "Georgia", position: "Guard", height: 191, birthYear: 1995, number: 0 },
  { name: "Ismet Akpinar", team: "Bahcesehir College", nationality: "Germany", position: "Guard", height: 191, birthYear: 1995, number: 5 },
  { name: "Malachi Flynn", team: "Bahcesehir College", nationality: "Turkey", position: "Guard", height: 185, birthYear: 1998, number: 22 },
  { name: "Kenan Sipahi", team: "Bahcesehir College", nationality: "Turkey", position: "Guard", height: 197, birthYear: 1995, number: 55 },
  { name: "Maxim Mutaf", team: "Bahcesehir College", nationality: "Turkey", position: "Forward", height: 193, birthYear: 1991, number: 17 },
  { name: "Tyler Cavanaugh", team: "Bahcesehir College", nationality: "USA", position: "Forward", height: 206, birthYear: 1994, number: 34 },
  { name: "Mateusz Ponitka", team: "Bahcesehir College", nationality: "Poland", position: "Forward", height: 198, birthYear: 1993, number: 38 },
  { name: "David DiLeo", team: "Bahcesehir College", nationality: "USA", position: "Forward", height: 203, birthYear: 1997, number: 51 },
  { name: "Damien Inglis", team: "Bahcesehir College", nationality: "France", position: "Center", height: 203, birthYear: 1995, number: 7 },
  { name: "Furkan Haltali", team: "Bahcesehir College", nationality: "Turkey", position: "Center", height: 211, birthYear: 2002, number: 14 },
  { name: "Trevion Williams", team: "Bahcesehir College", nationality: "USA", position: "Center", height: 206, birthYear: 2000, number: 50 },
  { name: "Darnell Edge", team: "Balkan Botevgrad", nationality: "USA", position: "Guard", height: 185, birthYear: 1997, number: 1 },
  { name: "Aleksandar Stoimenov", team: "Balkan Botevgrad", nationality: "Bulgaria", position: "Guard", height: 198, birthYear: 2001, number: 3 },
  { name: "Pavlin Ivanov", team: "Balkan Botevgrad", nationality: "Bulgaria", position: "Guard", height: 196, birthYear: 1993, number: 10 },
  { name: "Javante McCoy", team: "Balkan Botevgrad", nationality: "USA", position: "Guard", height: 196, birthYear: 1998, number: 13 },
  { name: "Konstantin Toshkov", team: "Balkan Botevgrad", nationality: "Bulgaria", position: "Guard", height: 186, birthYear: 2002, number: 22 },
  { name: "David Okwera", team: "Balkan Botevgrad", nationality: "Australia", position: "Forward", height: 208, birthYear: 2002, number: 0 },
  { name: "Gael Bonilla", team: "Balkan Botevgrad", nationality: "Mexico", position: "Forward", height: 203, birthYear: 2003, number: 2 },
  { name: "Alex Ducas", team: "Balkan Botevgrad", nationality: "Australia", position: "Forward", height: 201, birthYear: 2000, number: 8 },
  { name: "Nikolay Grozev", team: "Balkan Botevgrad", nationality: "Bulgaria", position: "Forward", height: 198, birthYear: 1994, number: 33 },
  { name: "Dimitar Dimitrov", team: "Balkan Botevgrad", nationality: "Bulgaria", position: "Forward", height: 203, birthYear: 1993, number: 34 },
  { name: "Ivan Alipiev", team: "Balkan Botevgrad", nationality: "Bulgaria", position: "Forward", height: 200, birthYear: 1999, number: 35 },
  { name: "Martin Sotirov", team: "Balkan Botevgrad", nationality: "Bulgaria", position: "Forward", height: 201, birthYear: 1999, number: 44 },
  { name: "Ivan Spirov", team: "Balkan Botevgrad", nationality: "Bulgaria", position: "Forward", height: 203, birthYear: 2003, number: 91 },
  { name: "Ulrich Chomche", team: "Balkan Botevgrad", nationality: "Cameroon", position: "Center", height: 211, birthYear: 2005, number: 14 },
  { name: "Shawn Pipes Jr.", team: "Bosna Sarajevo", nationality: "USA", position: "Guard", height: 188, birthYear: 1999, number: 2 },
  { name: "Marcus Domask", team: "Bosna Sarajevo", nationality: "USA", position: "Guard", height: 198, birthYear: 2000, number: 3 },
  { name: "DeAndre Gholston", team: "Bosna Sarajevo", nationality: "USA", position: "Guard", height: 196, birthYear: 2000, number: 4 },
  { name: "Edin Atic", team: "Bosna Sarajevo", nationality: "Bosnia and Herzegovina", position: "Guard", height: 201, birthYear: 1997, number: 5 },
  { name: "Adin Vrabac", team: "Bosna Sarajevo", nationality: "Bosnia and Herzegovina", position: "Guard", height: 206, birthYear: 1994, number: 7 },
  { name: "Gary Browne", team: "Bosna Sarajevo", nationality: "Puerto Rico", position: "Guard", height: 185, birthYear: 1993, number: 14 },
  { name: "Darko Talic", team: "Bosna Sarajevo", nationality: "Bosnia and Herzegovina", position: "Guard", height: 192, birthYear: 1998, number: 19 },
  { name: "Ryan Hawkins", team: "Bosna Sarajevo", nationality: "USA", position: "Forward", height: 201, birthYear: 1997, number: 44 },
  { name: "James Banks", team: "Bosna Sarajevo", nationality: "USA", position: "Center", height: 208, birthYear: 1998, number: 1 },
  { name: "Reginald Perry", team: "Bosna Sarajevo", nationality: "USA", position: "Center", height: 203, birthYear: 2000, number: 11 },
  { name: "Nikola Popovic", team: "Bosna Sarajevo", nationality: "Serbia", position: "Center", height: 211, birthYear: 1997, number: 21 },
  { name: "Alija Islamovic", team: "Bosna Sarajevo", nationality: "Bosnia and Herzegovina", position: "Center", height: 207, birthYear: 2001, number: 33 },
  { name: "Fletcher Magee", team: "Buducnost", nationality: "USA", position: "Guard", height: 193, birthYear: 1996, number: 3 },
  { name: "Iverson Molinar", team: "Buducnost", nationality: "Panama", position: "Guard", height: 191, birthYear: 1999, number: 10 },
  { name: "Yogi Ferrell", team: "Buducnost", nationality: "USA", position: "Guard", height: 183, birthYear: 1993, number: 11 },
  { name: "Marial Shayok", team: "Buducnost", nationality: "South Sudan", position: "Forward", height: 196, birthYear: 1995, number: 1 },
  { name: "Andrija Slavkovic", team: "Buducnost", nationality: "Montenegro", position: "Forward", height: 201, birthYear: 1999, number: 7 },
  { name: "Emir Hadzibegovic", team: "Buducnost", nationality: "Montenegro", position: "Forward", height: 206, birthYear: 1996, number: 8 },
  { name: "Dordije Jovanovic", team: "Buducnost", nationality: "Montenegro", position: "Forward", height: 197, birthYear: 2003, number: 13 },
  { name: "Juwan Morgan", team: "Buducnost", nationality: "USA", position: "Forward", height: 201, birthYear: 1997, number: 15 },
  { name: "Oleksandr Kovliar", team: "Buducnost", nationality: "Ukraine", position: "Forward", height: 191, birthYear: 2002, number: 50 },
  { name: "Axel Bouteille", team: "Buducnost", nationality: "France", position: "Forward", height: 201, birthYear: 1995, number: 83 },
  { name: "Justin Smith", team: "Buducnost", nationality: "USA", position: "Center", height: 201, birthYear: 1999, number: 0 },
  { name: "Jerry Boutsiele", team: "Buducnost", nationality: "France", position: "Center", height: 208, birthYear: 1992, number: 16 },
  { name: "Stefan Dordevic", team: "Buducnost", nationality: "Serbia", position: "Center", height: 206, birthYear: 1998, number: 45 },
  { name: "Anthony Cowan Jr.", team: "Cedevita Olimpija", nationality: "USA", position: "Guard", height: 183, birthYear: 1997, number: 1 },
  { name: "Jordan Gainey", team: "Cedevita Olimpija", nationality: "USA", position: "Guard", height: 193, birthYear: 2002, number: 4 },
  { name: "Rihards Lomazs", team: "Cedevita Olimpija", nationality: "Latvia", position: "Guard", height: 193, birthYear: 1996, number: 6 },
  { name: "Urban Kroflic", team: "Cedevita Olimpija", nationality: "Slovenia", position: "Guard", height: 198, birthYear: 2006, number: 23 },
  { name: "Rok Radovic", team: "Cedevita Olimpija", nationality: "Slovenia", position: "Forward", height: 201, birthYear: 2001, number: 3 },
  { name: "Miha Cerkvenik", team: "Cedevita Olimpija", nationality: "Slovenia", position: "Forward", height: 201, birthYear: 2001, number: 20 },
  { name: "Matthew Hurt", team: "Cedevita Olimpija", nationality: "USA", position: "Forward", height: 206, birthYear: 2000, number: 21 },
  { name: "Noah Kirkwood", team: "Cedevita Olimpija", nationality: "Canada", position: "Forward", height: 201, birthYear: 1999, number: 22 },
  { name: "Osayi Osifo", team: "Cedevita Olimpija", nationality: "South Africa", position: "Center", height: 206, birthYear: 2000, number: 14 },
  { name: "David Skara", team: "Cedevita Olimpija", nationality: "Croatia", position: "Center", height: 203, birthYear: 1995, number: 24 },
  { name: "Jayce Johnson", team: "Cedevita Olimpija", nationality: "USA", position: "Center", height: 213, birthYear: 1997, number: 34 },
  { name: "Keith Jordan Jr.", team: "JL Bourg-en-Bresse", nationality: "USA", position: "Guard", height: 198, birthYear: 1998, number: 2 },
  { name: "Assemian Moulare", team: "JL Bourg-en-Bresse", nationality: "Ivory Coast", position: "Guard", height: 186, birthYear: 2003, number: 3 },
  { name: "Antony Labanca", team: "JL Bourg-en-Bresse", nationality: "France", position: "Guard", height: 192, birthYear: 1994, number: 8 },
  { name: "Tyson Walker", team: "JL Bourg-en-Bresse", nationality: "USA", position: "Guard", height: 185, birthYear: 2000, number: 12 },
  { name: "Trey Woodbury", team: "JL Bourg-en-Bresse", nationality: "USA", position: "Guard", height: 193, birthYear: 1999, number: 22 },
  { name: "Leni Monnet", team: "JL Bourg-en-Bresse", nationality: "France", position: "Guard", height: 194, birthYear: 2006, number: 55 },
  { name: "Hugo Robineau", team: "JL Bourg-en-Bresse", nationality: "France", position: "Guard", height: 192, birthYear: 2000, number: 87 },
  { name: "Adrian Nelson", team: "JL Bourg-en-Bresse", nationality: "USA", position: "Forward", height: 203, birthYear: 1999, number: 4 },
  { name: "Tyrese Samuel", team: "JL Bourg-en-Bresse", nationality: "Canada", position: "Forward", height: 206, birthYear: 2000, number: 5 },
  { name: "Lionel Gaudoux", team: "JL Bourg-en-Bresse", nationality: "France", position: "Center", height: 198, birthYear: 1995, number: 13 },
  { name: "Kadin Shedrick", team: "JL Bourg-en-Bresse", nationality: "USA", position: "Center", height: 211, birthYear: 2001, number: 21 },
  { name: "Darius Brown II", team: "Trento", nationality: "USA", position: "Guard", height: 188, birthYear: 1999, number: 0 },
  { name: "Quincy Olivari", team: "Trento", nationality: "USA", position: "Guard", height: 191, birthYear: 2001, number: 8 },
  { name: "Toto Forray", team: "Trento", nationality: "Argentina", position: "Guard", height: 187, birthYear: 1986, number: 10 },
  { name: "Charlie Brown Jr.", team: "Trento", nationality: "USA", position: "Forward", height: 198, birthYear: 1997, number: 4 },
  { name: "Alessandro Bertini", team: "Trento", nationality: "Italy", position: "Forward", height: 195, birthYear: 2002, number: 5 },
  { name: "Isaiah Bigelow", team: "Trento", nationality: "USA", position: "Forward", height: 201, birthYear: 2000, number: 24 },
  { name: "Selom Mawugbe", team: "Trento", nationality: "USA", position: "Center", height: 208, birthYear: 1998, number: 21 },
  { name: "Jordan Bayehe", team: "Trento", nationality: "Cameroon", position: "Center", height: 206, birthYear: 1999, number: 26 },
  { name: "Jared Harper", team: "Hapoel Jerusalem", nationality: "USA", position: "Guard", height: 178, birthYear: 1997, number: 1 },
  { name: "Jaleen Smith", team: "Hapoel Jerusalem", nationality: "USA", position: "Guard", height: 193, birthYear: 1994, number: 3 },
  { name: "Roi Huber", team: "Hapoel Jerusalem", nationality: "Israel", position: "Guard", height: 188, birthYear: 1997, number: 13 },
  { name: "Ethan Burg", team: "Hapoel Jerusalem", nationality: "Israel", position: "Guard", height: 191, birthYear: 2002, number: 35 },
  { name: "Yovel Zoosman", team: "Hapoel Jerusalem", nationality: "Israel", position: "Guard", height: 200, birthYear: 1998, number: 50 },
  { name: "Kenny Lofton Jr.", team: "Hapoel Jerusalem", nationality: "USA", position: "Forward", height: 198, birthYear: 2002, number: 2 },
  { name: "Nimrod Levi", team: "Hapoel Jerusalem", nationality: "Israel", position: "Forward", height: 208, birthYear: 1995, number: 15 },
  { name: "David Roddy", team: "Hapoel Jerusalem", nationality: "USA", position: "Forward", height: 196, birthYear: 2001, number: 21 },
  { name: "DeVontae Cacok", team: "Hapoel Jerusalem", nationality: "USA", position: "Center", height: 201, birthYear: 1996, number: 0 },
  { name: "Yotam Hanochi", team: "Hapoel Jerusalem", nationality: "Israel", position: "Center", height: 208, birthYear: 2000, number: 8 },
  { name: "Dusan Miletic", team: "Hapoel Jerusalem", nationality: "Serbia", position: "Center", height: 215, birthYear: 1998, number: 11 },
  { name: "Gabriel Chachashvili", team: "Hapoel Jerusalem", nationality: "Israel", position: "Center", height: 210, birthYear: 1999, number: 33 },
  { name: "Lukasz Kolenda", team: "Manresa", nationality: "Poland", position: "Guard", height: 196, birthYear: 1999, number: 1 },
  { name: "Hugo Benitez", team: "Manresa", nationality: "France", position: "Guard", height: 192, birthYear: 2001, number: 2 },
  { name: "Lucas Beaufort", team: "Manresa", nationality: "France", position: "Guard", height: 193, birthYear: 2002, number: 5 },
  { name: "Ferran Bassas", team: "Manresa", nationality: "Spain", position: "Guard", height: 181, birthYear: 1992, number: 6 },
  { name: "JD Notae", team: "Manresa", nationality: "USA", position: "Guard", height: 188, birthYear: 1998, number: 13 },
  { name: "Timmy Allen", team: "Manresa", nationality: "USA", position: "Forward", height: 198, birthYear: 2000, number: 0 },
  { name: "Eric Vila", team: "Manresa", nationality: "Spain", position: "Forward", height: 211, birthYear: 1998, number: 4 },
  { name: "Pablo Tamba", team: "Manresa", nationality: "Spain", position: "Forward", height: 201, birthYear: 2003, number: 8 },
  { name: "Chibuzo Agbo", team: "Manresa", nationality: "USA", position: "Forward", height: 200, birthYear: 2001, number: 11 },
  { name: "Yordan Minchev", team: "Manresa", nationality: "Bulgaria", position: "Forward", height: 203, birthYear: 1998, number: 91 },
  { name: "Nick Ongenda", team: "Manresa", nationality: "Canada", position: "Center", height: 211, birthYear: 2000, number: 14 },
  { name: "Michael Enabulele", team: "Manresa", nationality: "Spain", position: "Center", height: 206, birthYear: 2006, number: 20 },
  { name: "Pierre Oriola", team: "Manresa", nationality: "Spain", position: "Center", height: 208, birthYear: 1992, number: 29 },
  { name: "Jaime Fernandez", team: "La Laguna Tenerife", nationality: "Spain", position: "Guard", height: 186, birthYear: 1993, number: 3 },
  { name: "Bruno Fitipaldo", team: "La Laguna Tenerife", nationality: "Uruguay", position: "Guard", height: 184, birthYear: 1991, number: 6 },
  { name: "Marcelinho Huertas", team: "La Laguna Tenerife", nationality: "Brazil", position: "Guard", height: 191, birthYear: 1983, number: 9 },
  { name: "Arturs Kurucs", team: "La Laguna Tenerife", nationality: "Latvia", position: "Guard", height: 193, birthYear: 2000, number: 47 },
  { name: "Bamba Cisse", team: "La Laguna Tenerife", nationality: "USA", position: "Forward", height: 196, birthYear: 2001, number: 1 },
  { name: "Kyle Guy", team: "La Laguna Tenerife", nationality: "USA", position: "Forward", height: 185, birthYear: 1997, number: 2 },
  { name: "Wesley van Beck", team: "La Laguna Tenerife", nationality: "Azerbaijan", position: "Forward", height: 193, birthYear: 1996, number: 4 },
  { name: "Hector Alderete", team: "La Laguna Tenerife", nationality: "Spain", position: "Forward", height: 203, birthYear: 2002, number: 33 },
  { name: "Tim Abromaitis", team: "La Laguna Tenerife", nationality: "USA", position: "Center", height: 203, birthYear: 1989, number: 21 },
  { name: "Ethan Happ", team: "La Laguna Tenerife", nationality: "USA", position: "Center", height: 208, birthYear: 1996, number: 22 },
  { name: "Vince Hunter", team: "La Laguna Tenerife", nationality: "USA", position: "Center", height: 203, birthYear: 1994, number: 32 },
  { name: "Carlos Stewart Jr.", team: "Le Mans", nationality: "USA", position: "Guard", height: 185, birthYear: 2003, number: 0 },
  { name: "Jordan King", team: "Le Mans", nationality: "Jamaica", position: "Guard", height: 183, birthYear: 2001, number: 2 },
  { name: "Leopold Delaunay", team: "Le Mans", nationality: "France", position: "Guard", height: 193, birthYear: 2001, number: 9 },
  { name: "Ugo Doumbia Niang", team: "Le Mans", nationality: "France", position: "Guard", height: 193, birthYear: 2003, number: 10 },
  { name: "Moses Wood", team: "Le Mans", nationality: "USA", position: "Forward", height: 203, birthYear: 1999, number: 23 },
  { name: "Lucas Dufeal", team: "Le Mans", nationality: "France", position: "Forward", height: 204, birthYear: 2003, number: 32 },
  { name: "Wilfried Yeguete", team: "Le Mans", nationality: "France", position: "Center", height: 202, birthYear: 1991, number: 15 },
  { name: "Tyler Beracou", team: "Le Mans", nationality: "France", position: "Center", height: 202, birthYear: 2006, number: 26 },
  { name: "Tashawn Thomas", team: "Le Mans", nationality: "USA", position: "Center", height: 203, birthYear: 1993, number: 35 },
  { name: "Alexander Schumacher", team: "Lietkabelis", nationality: "Switzerland", position: "Guard", height: 190, birthYear: 2001, number: 2 },
  { name: "Nojus Radzius", team: "Lietkabelis", nationality: "Lithuania", position: "Guard", height: 184, birthYear: 2005, number: 5 },
  { name: "Ognjen Jaramaz", team: "Lietkabelis", nationality: "Serbia", position: "Guard", height: 193, birthYear: 1995, number: 10 },
  { name: "Marius Valinskas", team: "Lietkabelis", nationality: "Lithuania", position: "Guard", height: 189, birthYear: 1999, number: 99 },
  { name: "Keondre Kennedy", team: "Lietkabelis", nationality: "USA", position: "Forward", height: 198, birthYear: 2000, number: 0 },
  { name: "Zygimantas Simonis", team: "Lietkabelis", nationality: "Lithuania", position: "Forward", height: 194, birthYear: 1995, number: 3 },
  { name: "Daniel Baslyk", team: "Lietkabelis", nationality: "Lithuania", position: "Forward", height: 198, birthYear: 2001, number: 9 },
  { name: "Milos Ilic", team: "Lietkabelis", nationality: "Serbia", position: "Forward", height: 205, birthYear: 2002, number: 11 },
  { name: "Ivan Fevrier", team: "Lietkabelis", nationality: "France", position: "Forward", height: 205, birthYear: 1999, number: 23 },
  { name: "Gytis Nemeiksa", team: "Lietkabelis", nationality: "Lithuania", position: "Forward", height: 201, birthYear: 2001, number: 50 },
  { name: "Veljko Ilic", team: "Lietkabelis", nationality: "Serbia", position: "Center", height: 208, birthYear: 2002, number: 8 },
  { name: "Gabrielius Maldunas", team: "Lietkabelis", nationality: "Lithuania", position: "Center", height: 206, birthYear: 1993, number: 12 },
  { name: "Devante Jones", team: "London Lions", nationality: "USA", position: "Guard", height: 183, birthYear: 1998, number: 3 },
  { name: "Mo Soluade", team: "London Lions", nationality: "United Kingdom", position: "Guard", height: 196, birthYear: 1995, number: 6 },
  { name: "Tarik Phillip", team: "London Lions", nationality: "United Kingdom", position: "Guard", height: 191, birthYear: 1993, number: 22 },
  { name: "Landrius Horton", team: "London Lions", nationality: "USA", position: "Guard", height: 193, birthYear: 1998, number: 23 },
  { name: "Joel Scott", team: "London Lions", nationality: "USA", position: "Forward", height: 201, birthYear: 2001, number: 1 },
  { name: "Maxwell Lewis III", team: "London Lions", nationality: "USA", position: "Forward", height: 201, birthYear: 2002, number: 2 },
  { name: "Ethan Price", team: "London Lions", nationality: "United Kingdom", position: "Forward", height: 206, birthYear: 2001, number: 10 },
  { name: "Keenan Evans", team: "London Lions", nationality: "USA", position: "Forward", height: 191, birthYear: 1996, number: 12 },
  { name: "Aaryn Rai", team: "London Lions", nationality: "United Kingdom", position: "Forward", height: 197, birthYear: 1998, number: 21 },
  { name: "Deane Williams", team: "London Lions", nationality: "United Kingdom", position: "Forward", height: 203, birthYear: 1996, number: 31 },
  { name: "Thomas Kennedy", team: "London Lions", nationality: "Ireland", position: "Center", height: 207, birthYear: 2000, number: 54 },
  { name: "Aaron Holiday", team: "Maxima Roma", nationality: "USA", position: "Guard", height: 183, birthYear: 1996, number: 3 },
  { name: "Mirza Alibegovic", team: "Maxima Roma", nationality: "Italy", position: "Guard", height: 195, birthYear: 1992, number: 5 },
  { name: "Brynton Lemar", team: "Maxima Roma", nationality: "USA", position: "Guard", height: 191, birthYear: 1995, number: 11 },
  { name: "Xavier Moon", team: "Maxima Roma", nationality: "USA", position: "Guard", height: 183, birthYear: 1995, number: 17 },
  { name: "Federico Bonacini", team: "Maxima Roma", nationality: "Italy", position: "Guard", height: 190, birthYear: 1999, number: 23 },
  { name: "Carl Wheatle", team: "Maxima Roma", nationality: "United Kingdom", position: "Forward", height: 200, birthYear: 1998, number: 10 },
  { name: "Giovanni Veronesi", team: "Maxima Roma", nationality: "Italy", position: "Forward", height: 197, birthYear: 1998, number: 16 },
  { name: "Matt Ryan", team: "Maxima Roma", nationality: "USA", position: "Forward", height: 198, birthYear: 1997, number: 32 },
  { name: "John Brown III", team: "Maxima Roma", nationality: "USA", position: "Center", height: 203, birthYear: 1992, number: 0 },
  { name: "Miro Bilan", team: "Maxima Roma", nationality: "Croatia", position: "Center", height: 213, birthYear: 1989, number: 2 },
  { name: "Gora Camara", team: "Maxima Roma", nationality: "Senegal", position: "Center", height: 214, birthYear: 2001, number: 29 },
  { name: "Marco Spissu", team: "Napoli Basketball", nationality: "Italy", position: "Guard", height: 182, birthYear: 1995, number: 0 },
  { name: "John Petrucelli", team: "Napoli Basketball", nationality: "Italy", position: "Guard", height: 193, birthYear: 1992, number: 11 },
  { name: "Markel Brown", team: "Napoli Basketball", nationality: "USA", position: "Guard", height: 191, birthYear: 1992, number: 22 },
  { name: "Jahmi'us Ramsey", team: "Napoli Basketball", nationality: "USA", position: "Guard", height: 192, birthYear: 2001, number: 37 },
  { name: "Leonardo Faggian", team: "Napoli Basketball", nationality: "Italy", position: "Forward", height: 195, birthYear: 2004, number: 10 },
  { name: "Jack White", team: "Napoli Basketball", nationality: "Australia", position: "Forward", height: 195, birthYear: 1997, number: 14 },
  { name: "Andrej Jakimovski", team: "Napoli Basketball", nationality: "Bulgaria", position: "Forward", height: 203, birthYear: 2001, number: 23 },
  { name: "Kaleb Tarczewski", team: "Napoli Basketball", nationality: "USA", position: "Center", height: 213, birthYear: 1993, number: 25 },
  { name: "Guglielmo Caruso", team: "Napoli Basketball", nationality: "Italy", position: "Center", height: 204, birthYear: 1999, number: 30 },
  { name: "Leonardo Tote", team: "Napoli Basketball", nationality: "Italy", position: "Center", height: 212, birthYear: 1997, number: 35 },
  { name: "Yannick Franke", team: "Neptunas", nationality: "Netherlands", position: "Guard", height: 194, birthYear: 1996, number: 5 },
  { name: "Mindaugas Girdziunas", team: "Neptunas", nationality: "Lithuania", position: "Guard", height: 188, birthYear: 1989, number: 8 },
  { name: "Elvar Fridriksson", team: "Neptunas", nationality: "Iceland", position: "Guard", height: 183, birthYear: 1994, number: 10 },
  { name: "Rytis Sakaitis", team: "Neptunas", nationality: "Lithuania", position: "Guard", height: 193, birthYear: 2004, number: 12 },
  { name: "Kristupas Zemaitis", team: "Neptunas", nationality: "Lithuania", position: "Guard", height: 191, birthYear: 1996, number: 13 },
  { name: "Henri Drell", team: "Neptunas", nationality: "Estonia", position: "Forward", height: 205, birthYear: 2000, number: 0 },
  { name: "Donatas Tarolis", team: "Neptunas", nationality: "Lithuania", position: "Forward", height: 202, birthYear: 1994, number: 1 },
  { name: "Arnas Berucka", team: "Neptunas", nationality: "Lithuania", position: "Forward", height: 196, birthYear: 1997, number: 21 },
  { name: "Einaras Tubutis", team: "Neptunas", nationality: "Lithuania", position: "Forward", height: 204, birthYear: 1998, number: 37 },
  { name: "Lukas Kreismontas", team: "Neptunas", nationality: "Lithuania", position: "Forward", height: 197, birthYear: 2001, number: 88 },
  { name: "Martynas Echodas", team: "Neptunas", nationality: "Lithuania", position: "Center", height: 204, birthYear: 1997, number: 14 },
  { name: "Raymond Somerville", team: "Neptunas", nationality: "USA", position: "Center", height: 208, birthYear: 2000, number: 17 },
  { name: "Phlandrous Fleming Jr.", team: "Niners Chemnitz", nationality: "USA", position: "Guard", height: 193, birthYear: 1998, number: 1 },
  { name: "Stefan Smith", team: "Niners Chemnitz", nationality: "Canada", position: "Guard", height: 188, birthYear: 1999, number: 2 },
  { name: "Yohan Choupas", team: "Niners Chemnitz", nationality: "Germany", position: "Guard", height: 193, birthYear: 2000, number: 6 },
  { name: "Luca Kellig", team: "Niners Chemnitz", nationality: "Germany", position: "Guard", height: 192, birthYear: 2006, number: 13 },
  { name: "Cobe Williams", team: "Niners Chemnitz", nationality: "USA", position: "Guard", height: 183, birthYear: 2000, number: 24 },
  { name: "Elias Roedl", team: "Niners Chemnitz", nationality: "Germany", position: "Forward", height: 198, birthYear: 2002, number: 11 },
  { name: "Urald King", team: "Niners Chemnitz", nationality: "USA", position: "Forward", height: 198, birthYear: 1990, number: 20 },
  { name: "Mateo Seric", team: "Niners Chemnitz", nationality: "Germany", position: "Forward", height: 204, birthYear: 1999, number: 21 },
  { name: "Ben Burnham", team: "Niners Chemnitz", nationality: "USA", position: "Forward", height: 201, birthYear: 2002, number: 25 },
  { name: "Jannis von Seckendorff", team: "Niners Chemnitz", nationality: "Germany", position: "Forward", height: 204, birthYear: 2002, number: 90 },
  { name: "Alexander Richardson", team: "Niners Chemnitz", nationality: "Germany", position: "Center", height: 206, birthYear: 2003, number: 9 },
  { name: "Darion Atkins", team: "Niners Chemnitz", nationality: "USA", position: "Center", height: 203, birthYear: 1992, number: 17 },
  { name: "Nighael Ceaser", team: "Niners Chemnitz", nationality: "USA", position: "Center", height: 203, birthYear: 2000, number: 22 },
  { name: "Naz Mitrou-Long", team: "PAOK", nationality: "Canada", position: "Guard", height: 193, birthYear: 1993, number: 1 },
  { name: "Breein Tyree", team: "PAOK", nationality: "USA", position: "Guard", height: 188, birthYear: 1998, number: 5 },
  { name: "Trevor Hudgins", team: "PAOK", nationality: "USA", position: "Guard", height: 180, birthYear: 1999, number: 12 },
  { name: "Marcus Foster", team: "PAOK", nationality: "USA", position: "Guard", height: 191, birthYear: 1995, number: 17 },
  { name: "Georgios Fillios", team: "PAOK", nationality: "Greece", position: "Guard", height: 195, birthYear: 2002, number: 25 },
  { name: "Athanasios Bazinas", team: "PAOK", nationality: "Greece", position: "Guard", height: 194, birthYear: 2003, number: 77 },
  { name: "Raiquan Gray", team: "PAOK", nationality: "USA", position: "Forward", height: 203, birthYear: 1999, number: 0 },
  { name: "Nikos Chougkaz", team: "PAOK", nationality: "Greece", position: "Forward", height: 204, birthYear: 2000, number: 9 },
  { name: "Nikolaos Persidis", team: "PAOK", nationality: "Greece", position: "Forward", height: 201, birthYear: 1995, number: 18 },
  { name: "Kyle Alexander", team: "PAOK", nationality: "Canada", position: "Center", height: 208, birthYear: 1996, number: 8 },
  { name: "Clifford Omoruyi", team: "PAOK", nationality: "Nigeria", position: "Center", height: 211, birthYear: 2001, number: 11 },
  { name: "Dimitrios Kaklamanakis", team: "PAOK", nationality: "Greece", position: "Center", height: 206, birthYear: 1994, number: 14 },
  { name: "Ben Moore", team: "PAOK", nationality: "USA", position: "Center", height: 203, birthYear: 1995, number: 26 }
];

// New to Euroball: researched in batches once every club is in, then moved to
// PLAYERS as full records. Official position and number from the roster page.
const PENDING = [
  // Aris Thessaloniki
  // Derthona Tortona
  // Bahcesehir College
  // Balkan Botevgrad
  // Bosna Sarajevo
  // Buducnost
  // Cedevita Olimpija
  // JL Bourg-en-Bresse
  // Trento
  // Hapoel Jerusalem
  // Manresa
  // La Laguna Tenerife
  // Le Mans
  // Lietkabelis
  // London Lions
  { name: "Joshua O'Garro", team: "London Lions", position: "Forward", number: 7 },
  // Maxima Roma
  // Napoli Basketball
  // Neptunas
  // Niners Chemnitz
  // PAOK
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
  { name: "Emirhan Serbest", team: "Tofas", position: "Center", number: 24 },
  // Turk Telekom
  { name: "Ata Kahraman", team: "Turk Telekom", position: "Guard", number: 6 },
  { name: "Jerrick Harding", team: "Turk Telekom", position: "Guard", number: 7 },
  { name: "Dogus Ozdemiroglu", team: "Turk Telekom", position: "Guard", number: 18 },
  { name: "Tony Taylor", team: "Turk Telekom", position: "Guard", number: 21 },
  { name: "Mete Tekcevik", team: "Turk Telekom", position: "Guard", number: 55 },
  { name: "Anil Alyanak", team: "Turk Telekom", position: "Forward", number: 0 },
  { name: "Tim Schneider", team: "Turk Telekom", position: "Forward", number: 3 },
  { name: "Omer Can", team: "Turk Telekom", position: "Forward", number: 8 },
  { name: "Uros Trifunovic", team: "Turk Telekom", position: "Forward", number: 10 },
  { name: "Anthony Lamb", team: "Turk Telekom", position: "Forward", number: 22 },
  { name: "Goktug Bas", team: "Turk Telekom", position: "Forward", number: 57 },
  { name: "Emircan Kosut", team: "Turk Telekom", position: "Center", number: 9 },
  { name: "Ismael Bako", team: "Turk Telekom", position: "Center", number: 28 },
  { name: "Kris Bankston", team: "Turk Telekom", position: "Center", number: 30 },
  // Cluj-Napoca
  { name: "Otis Livingston II", team: "Cluj-Napoca", position: "Guard", number: 0 },
  { name: "Javonte Smart", team: "Cluj-Napoca", position: "Guard", number: 1 },
  { name: "Thomas Bernat", team: "Cluj-Napoca", position: "Guard", number: 2 },
  { name: "Andrei Cepoi", team: "Cluj-Napoca", position: "Guard", number: 7 },
  { name: "Malcolm Hill", team: "Cluj-Napoca", position: "Guard", number: 21 },
  { name: "Patrick Richard", team: "Cluj-Napoca", position: "Guard", number: 35 },
  { name: "Kristian Kullamae", team: "Cluj-Napoca", position: "Guard", number: 77 },
  { name: "Luca-Ionut Illes", team: "Cluj-Napoca", position: "Guard", number: 88 },
  { name: "Dusan Beslac", team: "Cluj-Napoca", position: "Forward", number: 3 },
  { name: "Jalyn McCreary", team: "Cluj-Napoca", position: "Forward", number: 8 },
  { name: "Alexandru Campean", team: "Cluj-Napoca", position: "Forward", number: 11 },
  { name: "Javon Bess", team: "Cluj-Napoca", position: "Forward", number: 20 },
  { name: "Bobe Nicolescu", team: "Cluj-Napoca", position: "Forward", number: 24 },
  { name: "Christian Bishop", team: "Cluj-Napoca", position: "Center", number: 13 },
  { name: "Uros Plavsic", team: "Cluj-Napoca", position: "Center", number: 22 },
  { name: "Tudor Tancau", team: "Cluj-Napoca", position: "Center", number: 32 },
  // Reyer Venezia
  { name: "Octavio Maretto", team: "Reyer Venezia", position: "Guard", number: 1 },
  { name: "Giovanni De Nicolao", team: "Reyer Venezia", position: "Guard", number: 5 },
  { name: "Leonardo Candi", team: "Reyer Venezia", position: "Guard", number: 7 },
  { name: "Ky Bowman", team: "Reyer Venezia", position: "Guard", number: 8 },
  { name: "Sir'Jabari Rice", team: "Reyer Venezia", position: "Guard", number: 10 },
  { name: "Erick Green", team: "Reyer Venezia", position: "Guard", number: 32 },
  { name: "Gabriele Sarghini", team: "Reyer Venezia", position: "Guard", number: 40 },
  { name: "Federico Fasolo", team: "Reyer Venezia", position: "Guard", number: 45 },
  { name: "Giga Janelidze", team: "Reyer Venezia", position: "Forward", number: 14 },
  { name: "Louis Olinde", team: "Reyer Venezia", position: "Forward", number: 19 },
  { name: "Jordan Parks", team: "Reyer Venezia", position: "Forward", number: 22 },
  { name: "Kyle Wiltjer", team: "Reyer Venezia", position: "Forward", number: 33 },
  { name: "Sasha Grant", team: "Reyer Venezia", position: "Forward", number: 44 },
  { name: "Amedeo Tessitori", team: "Reyer Venezia", position: "Center", number: 0 },
  { name: "Enoch Boakye", team: "Reyer Venezia", position: "Center", number: 13 }
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
