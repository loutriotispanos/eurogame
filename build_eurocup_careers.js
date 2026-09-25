/*
 * Builds eurocup_careers.js — career timelines for the EuroCup players, the same
 * shape as careers.js ({ name, nationality, position, active, career: [{ team,
 * from, to }] }), so the career games can play on the EuroCup too.
 *
 *   Run:  node build_eurocup_careers.js      (after build_eurocup.js)
 *
 * Sources: the official EuroCup player biographies (euroleague feed), read club
 * by club. Conventions are careers.js's: a season is its first year (2026 =
 * 2026-27), `to` is exclusive and null means "still there"; senior clubs only —
 * no college, G League, summer leagues or third divisions; NBA stints count;
 * a short stint inside a longer one is dropped by clean(), so where two clubs
 * share a season the better-known one is listed first.
 *
 * A player the EuroLeague careers already cover is not written here: his career
 * is read from careers.js at build time, its open stint closed at 2026, and his
 * EuroCup club appended.
 */
const fs = require("fs");

// name → [[team, from, to], ...]
const RAW = {
  // --- Aris Thessaloniki
  "Adam Mokoka": [["Gravelines-Dunkerque", 2015, 2018], ["Mega Basket", 2018, 2019], ["Chicago Bulls", 2019, 2021], ["Nanterre 92", 2021, 2022], ["Reyer Venezia", 2022, 2023], ["Cluj-Napoca", 2023, 2025], ["JL Bourg-en-Bresse", 2025, 2026], ["Aris Thessaloniki", 2026, null]],
  "E.J. Liddell": [["New Orleans Pelicans", 2023, 2024], ["Chicago Bulls", 2024, 2025], ["Brooklyn Nets", 2025, 2026], ["Aris Thessaloniki", 2026, null]],
  "Eleftherios Bochoridis": [["Aris Thessaloniki", 2011, 2014], ["Panathinaikos", 2014, 2017], ["Aris Thessaloniki", 2017, 2020], ["Panathinaikos", 2020, 2023], ["Aris Thessaloniki", 2023, null]],
  "Elijah Mitrou-Long": [["PAOK", 2020, 2021], ["Levski Sofia", 2021, 2022], ["Apollon Patras", 2021, 2022], ["Aris Thessaloniki", 2022, 2023], ["Peristeri", 2023, 2024], ["Hapoel Holon", 2024, 2025], ["Aris Thessaloniki", 2025, null]],
  "Georgios Tanoulis": [["PAOK", 2018, 2020], ["Promitheas Patras", 2020, 2023], ["Olympiacos", 2023, 2024], ["Maroussi", 2024, 2025], ["Aris Thessaloniki", 2025, null]],
  "Jeremiah Robinson-Earl": [["Oklahoma City Thunder", 2021, 2023], ["New Orleans Pelicans", 2022, 2025], ["Indiana Pacers", 2025, 2026], ["Dallas Mavericks", 2025, 2026], ["Aris Thessaloniki", 2026, null]],
  "Stylianos Poulianitis": [["Aris Thessaloniki", 2013, 2015], ["Koroivos Amaliadas", 2015, 2016], ["Trikala", 2016, 2017], ["Aris Thessaloniki", 2017, 2018], ["Kymi", 2018, 2019], ["Kolossos Rodou", 2019, 2020], ["Apollon Patras", 2020, 2021], ["Aris Thessaloniki", 2021, 2022], ["Peristeri", 2022, 2025], ["Aris Thessaloniki", 2025, null]],
  "Thanasis Antetokounmpo": [["Filathlitikos", 2011, 2013], ["New York Knicks", 2015, 2016], ["Andorra", 2016, 2017], ["Panathinaikos", 2017, 2019], ["Milwaukee Bucks", 2019, 2026], ["Aris Thessaloniki", 2026, null]],
  "Vasilis Charalampopoulos": [["Panathinaikos", 2012, 2018], ["Lavrio", 2018, 2019], ["Olympiacos", 2019, 2021], ["Ionikos Nikaias", 2019, 2020], ["Reyer Venezia", 2021, 2022], ["Fortitudo Bologna", 2021, 2022], ["Victoria Libertas Pesaro", 2022, 2023], ["Dinamo Sassari", 2023, 2024], ["Turk Telekom", 2024, 2025], ["AEK Athens", 2025, 2026], ["Aris Thessaloniki", 2026, null]],
  // --- Derthona Tortona
  "Aljami Durham": [["Lavrio", 2022, 2023], ["Caledonia Gladiators", 2022, 2023], ["Hamburg Towers", 2023, 2024], ["Girona", 2024, 2025], ["Vanoli Cremona", 2025, 2026], ["Derthona Tortona", 2026, null]],
  "Amar Alibegovic": [["Virtus Roma", 2018, 2020], ["Virtus Bologna", 2020, 2022], ["Cedevita Olimpija", 2022, 2023], ["Bodrumspor", 2023, 2024], ["Trapani Shark", 2023, 2026], ["Granada", 2025, 2026], ["Derthona Tortona", 2026, null]],
  "Andrea Pecchia": [["Olimpia Milano", 2015, 2016], ["Treviglio", 2016, 2019], ["Pallacanestro Cantu", 2019, 2021], ["Vanoli Cremona", 2021, 2024], ["Trento", 2024, 2025], ["Derthona Tortona", 2025, null]],
  "Dante Maddox Jr.": [["Okapi Aalst", 2025, 2026], ["Derthona Tortona", 2026, null]],
  "Giordano Bortolani": [["Olimpia Milano", 2017, 2018], ["Legnano Knights", 2018, 2019], ["Pallacanestro Biella", 2019, 2020], ["Germani Brescia", 2020, 2021], ["Treviso Basket", 2021, 2022], ["Manresa", 2022, 2023], ["Scaligera Verona", 2022, 2023], ["Olimpia Milano", 2023, 2025], ["Pallacanestro Cantu", 2025, 2026], ["Derthona Tortona", 2026, null]],
  "Giulio Gazzotti": [["Virtus Bologna", 2008, 2010], ["Gira Ozzano", 2010, 2011], ["Latina Basket", 2011, 2012], ["Pallacanestro Lucca", 2012, 2013], ["Virtus Bologna", 2013, 2014], ["Vanoli Cremona", 2014, 2015], ["Victoria Libertas Pesaro", 2015, 2017], ["Vanoli Cremona", 2017, 2019], ["APU Udine", 2019, 2020], ["Derthona Tortona", 2020, 2021], ["Basket Ravenna", 2021, 2022], ["Pallacanestro Forli", 2022, 2023], ["Scaligera Verona", 2023, 2025], ["Pallacanestro Forli", 2025, 2026], ["Derthona Tortona", 2026, null]],
  "Justin Gorham": [["Telekom Baskets Bonn", 2021, 2022], ["Hapoel Gilboa Galil", 2022, 2023], ["Rytas Vilnius", 2022, 2024], ["Derthona Tortona", 2024, null]],
  "Prentiss Hubb": [["MHP Riesen Ludwigsburg", 2022, 2023], ["Trento", 2023, 2024], ["AEK Athens", 2024, 2025], ["Derthona Tortona", 2025, null]],
  // --- Bahcesehir College
  "Damien Inglis": [["Chorale Roanne", 2013, 2014], ["Milwaukee Bucks", 2014, 2016], ["Orlandina", 2017, 2018], ["SIG Strasbourg", 2017, 2018], ["Limoges CSP", 2018, 2019], ["SIG Strasbourg", 2019, 2020], ["AS Monaco", 2020, 2021], ["Bilbao Basket", 2021, 2022], ["Gran Canaria", 2022, 2023], ["Valencia", 2023, 2024], ["Yokohama B-Corsairs", 2024, 2026], ["Bahcesehir College", 2026, null]],
  "Furkan Haltali": [["Banvit", 2017, 2020], ["Besiktas", 2020, 2022], ["Anadolu Efes", 2022, 2023], ["Pinar Karsiyaka", 2023, 2024], ["Bahcesehir College", 2024, null]],
  "Ismet Akpinar": [["ALBA Berlin", 2013, 2017], ["Ratiopharm Ulm", 2017, 2019], ["Besiktas", 2019, 2020], ["Bayern Munich", 2019, 2020], ["Bahcesehir College", 2020, 2021], ["Fenerbahce", 2021, 2023], ["Galatasaray", 2023, 2024], ["Turk Telekom", 2024, 2026], ["Bahcesehir College", 2026, null]],
  "Kenan Sipahi": [["Tofas", 2010, 2013], ["Fenerbahce", 2013, 2015], ["Pinar Karsiyaka", 2015, 2016], ["Besiktas", 2016, 2019], ["Real Betis", 2019, 2020], ["Fenerbahce", 2020, 2021], ["Zaragoza", 2021, 2022], ["Besiktas", 2021, 2022], ["Pinar Karsiyaka", 2022, 2025], ["Bahcesehir College", 2024, null]],
  "Malachi Flynn": [["Toronto Raptors", 2020, 2023], ["New York Knicks", 2023, 2024], ["Detroit Pistons", 2023, 2024], ["Charlotte Hornets", 2024, 2025], ["Bahcesehir College", 2025, null]],
  "Marcquise Reed": [["Chorale Roanne", 2019, 2020], ["Prometey", 2020, 2021], ["Nanterre 92", 2020, 2021], ["Gravelines-Dunkerque", 2021, 2022], ["Happy Casa Brindisi", 2022, 2023], ["Buyukcekmece", 2023, 2024], ["Tofas", 2024, 2025], ["Trabzonspor", 2025, 2026], ["Bahcesehir College", 2026, null]],
  "Mateusz Ponitka": [["AZS Politechnika Warszawska", 2009, 2012], ["Asseco Gdynia", 2011, 2013], ["BC Oostende", 2013, 2015], ["Zielona Gora", 2015, 2016], ["Pinar Karsiyaka", 2016, 2017], ["CB Canarias", 2017, 2018], ["Lokomotiv Kuban", 2018, 2019], ["Zenit St Petersburg", 2019, 2022], ["Panathinaikos", 2022, 2023], ["Partizan", 2023, 2024], ["Bahcesehir College", 2024, null]],
  "Maxim Mutaf": [["Fenerbahce", 2006, 2011], ["Mersin BB", 2011, 2012], ["Fenerbahce", 2012, 2013], ["Pinar Karsiyaka", 2012, 2013], ["Trabzonspor", 2013, 2014], ["Banvit", 2014, 2017], ["Anadolu Efes", 2016, 2017], ["Besiktas", 2017, 2019], ["Bursaspor", 2019, 2021], ["Darussafaka", 2021, 2022], ["Buyukcekmece", 2022, 2023], ["Bahcesehir College", 2023, null]],
  "Trevion Williams": [["Ratiopharm Ulm", 2023, 2024], ["Maccabi Tel Aviv", 2024, 2025], ["ALBA Berlin", 2024, 2025], ["Bahcesehir College", 2025, null]],
  "Tyler Cavanaugh": [["Atlanta Hawks", 2017, 2018], ["Utah Jazz", 2018, 2019], ["ALBA Berlin", 2019, 2020], ["CB Canarias", 2020, 2021], ["Zalgiris Kaunas", 2021, 2023], ["Bahcesehir College", 2023, null]],
  // --- Balkan Botevgrad
  "Aleksandar Stoimenov": [["Terme Olimia Podcetrtek", 2022, 2025], ["Vojvodina", 2025, 2026], ["Balkan Botevgrad", 2026, null]],
  "Alex Ducas": [["Oklahoma City Thunder", 2024, 2025], ["Brisbane Bullets", 2025, 2026], ["Balkan Botevgrad", 2026, null]],
  "Darnell Edge": [["Starogard Gdanski", 2019, 2020], ["Mykolaiv", 2020, 2021], ["Gemlik", 2021, 2022], ["Dinamo Bucuresti", 2022, 2023], ["Mersin BB", 2022, 2023], ["Trepca", 2023, 2024], ["Ironi Nes Ziona", 2024, 2025], ["Keravnos", 2025, 2026], ["Balkan Botevgrad", 2026, null]],
  "David Okwera": [["Melbourne United", 2021, 2023], ["Perth Wildcats", 2023, 2026], ["Balkan Botevgrad", 2026, null]],
  "Dimitar Dimitrov": [["Rimini", 2008, 2012], ["Levski Sofia", 2012, 2013], ["Traiskirchen Lions", 2013, 2014], ["Levski Sofia", 2014, 2015], ["Lukoil Academic", 2015, 2016], ["Traiskirchen Lions", 2016, 2017], ["Akademik Plovdiv", 2017, 2018], ["Balkan Botevgrad", 2018, 2024], ["Palencia", 2024, 2025], ["Balkan Botevgrad", 2025, null]],
  "Gael Bonilla": [["FC Barcelona", 2021, 2022], ["Caceres", 2023, 2024], ["Diablos Rojos del Mexico", 2024, 2025], ["Balkan Botevgrad", 2026, null]],
  "Ivan Alipiev": [["Levski Sofia", 2015, 2017], ["BUBA Basketball", 2017, 2018], ["Latina Basket", 2022, 2024], ["Antwerp Giants", 2024, 2025], ["Basket Mestre", 2025, 2026], ["Balkan Botevgrad", 2026, null]],
  "Ivan Spirov": [["Cherno More Varna", 2020, 2025], ["Balkan Botevgrad", 2026, null]],
  "Javante McCoy": [["Elitzur Netanya", 2025, 2026], ["Balkan Botevgrad", 2026, null]],
  "Konstantin Toshkov": [["Levski Sofia", 2020, 2021], ["Yambol", 2021, 2022], ["Balkan Botevgrad", 2022, 2023], ["Spartak Pleven", 2023, 2024], ["Balkan Botevgrad", 2024, null]],
  "Pavlin Ivanov": [["Benetton Treviso", 2011, 2012], ["Buducnost", 2012, 2013], ["Yambol", 2013, 2014], ["Levski Sofia", 2014, 2015], ["Lukoil Academic", 2015, 2017], ["Levski Sofia", 2017, 2018], ["Balkan Botevgrad", 2018, 2019], ["Treviglio", 2019, 2020], ["Rilski Sportist", 2020, 2022], ["Balkan Botevgrad", 2022, 2023], ["CSU Sibiu", 2023, 2024], ["CB Menorca", 2024, 2025], ["New Taipei CTBC", 2025, 2026], ["Balkan Botevgrad", 2026, null]],
  "Ulrich Chomche": [["Toronto Raptors", 2024, 2025], ["Balkan Botevgrad", 2026, null]],
  // --- Bosna Sarajevo (Vrabac, Atic, Banks: the bios stop early; the gap is left, not guessed)
  "Adin Vrabac": [["Spars Sarajevo", 2009, 2013], ["Banvit", 2013, 2014], ["Bosna Sarajevo", 2026, null]],
  "Edin Atic": [["Spars Sarajevo", 2013, 2015], ["AEK Athens", 2015, 2016], ["Trikala", 2016, 2017], ["AEK Athens", 2017, 2018], ["Mega", 2018, 2020], ["Igokea", 2020, 2021], ["Buducnost", 2021, 2022], ["Bosna Sarajevo", 2026, null]],
  "James Banks": [["Hapoel Beer Sheva", 2020, 2021], ["Aris Thessaloniki", 2024, 2025], ["Bosna Sarajevo", 2026, null]],
  "Nikola Popovic": [["Chemidor Tehran", 2020, 2021], ["Okapi Aalst", 2021, 2023], ["Lietkabelis", 2022, 2026], ["Bosna Sarajevo", 2026, null]],
  // --- Buducnost
  "Andrija Slavkovic": [["Centar Bijelo Polje", 2013, 2015], ["Buducnost", 2015, 2016], ["Lovcen Cetinje", 2016, 2018], ["Studentski Centar", 2018, 2021], ["SC Derby", 2021, 2023], ["Buducnost", 2023, null]],
  "Axel Bouteille": [["Elan Chalon", 2013, 2017], ["Limoges CSP", 2017, 2019], ["Unicaja Malaga", 2019, 2022], ["Bilbao Basket", 2019, 2020], ["Turk Telekom", 2022, 2023], ["Bahcesehir College", 2023, 2025], ["Buducnost", 2025, null]],
  "Dordije Jovanovic": [["Danilovgrad", 2018, 2019], ["Mladost Zemun", 2019, 2020], ["Partizan", 2020, 2021], ["Dunav Stari Banovci", 2021, 2022], ["Partizan", 2022, 2023], ["Buducnost", 2024, null]],
  "Emir Hadzibegovic": [["Mornar Bar", 2015, 2018], ["Sutjeska Niksic", 2018, 2019], ["Lovcen Cetinje", 2019, 2020], ["Studentski Centar", 2020, 2025], ["Buducnost", 2026, null]],
  "Fletcher Magee": [["Obradoiro", 2019, 2020], ["Studentski Centar", 2020, 2021], ["SC Derby", 2021, 2023], ["Buducnost", 2023, null]],
  "Iverson Molinar": [["Hapoel Beer Sheva", 2024, 2025], ["Cluj-Napoca", 2025, 2026], ["Buducnost", 2026, null]],
  "Jerry Boutsiele": [["Rouen", 2013, 2014], ["Denain", 2014, 2016], ["Cholet Basket", 2016, 2018], ["Limoges CSP", 2018, 2021], ["AS Monaco", 2021, 2022], ["Bahcesehir College", 2022, 2024], ["Dubai BC", 2024, 2025], ["Pinar Karsiyaka", 2024, 2025], ["Buducnost", 2025, null]],
  "Justin Smith": [["Hapoel Holon", 2023, 2024], ["Hapoel Jerusalem", 2024, 2025], ["Buducnost", 2026, null]],
  "Juwan Morgan": [["Utah Jazz", 2019, 2021], ["Toronto Raptors", 2021, 2022], ["Boston Celtics", 2021, 2022], ["Zenit St Petersburg", 2023, 2024], ["Runa Basket", 2023, 2024], ["Buducnost", 2024, null]],
  "Marial Shayok": [["Philadelphia 76ers", 2019, 2020], ["Bursaspor", 2020, 2021], ["Fenerbahce", 2021, 2022], ["Shandong Heroes", 2023, 2024], ["Maccabi Tel Aviv", 2024, 2025], ["Liaoning Flying Leopards", 2024, 2025], ["Altiri Chiba", 2025, 2026], ["Buducnost", 2026, null]],
  "Oleksandr Kovliar": [["Tartu Ulikool", 2021, 2022], ["Kalev/Cramo", 2022, 2023], ["Obradoiro", 2023, 2024], ["Lietkabelis", 2024, 2025], ["Buducnost", 2025, null]],
  "Stefan Dordevic": [["FMP", 2017, 2021], ["Igokea", 2021, 2023], ["Girona", 2023, 2024], ["Arka Gdynia", 2024, 2025], ["Slask Wroclaw", 2025, 2026], ["Buducnost", 2026, null]],
  "Yogi Ferrell": [["Brooklyn Nets", 2016, 2017], ["Dallas Mavericks", 2016, 2018], ["Sacramento Kings", 2018, 2020], ["Utah Jazz", 2020, 2021], ["Panathinaikos", 2021, 2022], ["Cedevita Olimpija", 2021, 2023], ["Shanghai Sharks", 2023, 2024], ["Buducnost", 2023, null]],
  // --- Cedevita Olimpija (a mid-season arrival starts the next season when it would erase the club before)
  "Anthony Cowan Jr.": [["Aris Thessaloniki", 2021, 2022], ["Promitheas Patras", 2022, 2024], ["BC Wolves", 2024, 2025], ["Mersin MSK", 2025, 2026], ["Cedevita Olimpija", 2026, null]],
  "David Skara": [["Huesca", 2019, 2020], ["Denain", 2020, 2021], ["Le Portel", 2021, 2022], ["SLUC Nancy", 2021, 2022], ["Chalons-Reims", 2022, 2024], ["KK Split", 2024, 2025], ["Cedevita Olimpija", 2025, null]],
  "Jayce Johnson": [["CSU Sibiu", 2020, 2022], ["Trieste", 2024, 2025], ["Manisa BB", 2025, 2026], ["Cedevita Olimpija", 2026, null]],
  "Jordan Gainey": [["Cedevita Junior", 2025, 2026], ["Cedevita Olimpija", 2026, null]],
  "Matthew Hurt": [["Memphis Grizzlies", 2023, 2024], ["South East Melbourne Phoenix", 2024, 2025], ["Trapani Shark", 2025, 2026], ["Cedevita Olimpija", 2026, null]],
  "Miha Cerkvenik": [["Ilirija", 2020, 2022], ["Krka Novo Mesto", 2022, 2025], ["Cedevita Olimpija", 2025, null]],
  "Noah Kirkwood": [["Telekom Baskets Bonn", 2023, 2024], ["Saint-Quentin", 2024, 2025], ["Slask Wroclaw", 2025, 2026], ["Cedevita Olimpija", 2026, null]],
  "Rihards Lomazs": [["Jurmala", 2014, 2015], ["BK Ventspils", 2015, 2019], ["ASVEL", 2019, 2021], ["Merkezefendi", 2021, 2022], ["Basket Zaragoza", 2022, 2023], ["Virtus Bologna", 2023, 2024], ["Merkezefendi", 2024, 2025], ["Neptunas", 2025, 2026], ["Cedevita Olimpija", 2026, null]],
  "Rok Radovic": [["Mladost Cacinci", 2017, 2018], ["Cedevita Zagreb", 2018, 2019], ["OKK Beograd", 2019, 2020], ["Cedevita Olimpija", 2020, null]],
  "Urban Kroflic": [["OKK Beograd", 2023, 2024], ["Mega", 2024, 2026], ["Cedevita Olimpija", 2026, null]],
  // --- JL Bourg-en-Bresse (French third division stints left out)
  "Adrian Nelson": [["Brose Bamberg", 2023, 2024], ["JL Bourg-en-Bresse", 2024, null]],
  "Antony Labanca": [["SIG Strasbourg", 2013, 2015], ["JA Vichy", 2016, 2017], ["Souffelweyersheim", 2017, 2020], ["SLUC Nancy", 2020, 2025], ["JL Bourg-en-Bresse", 2025, null]],
  "Assemian Moulare": [["Metropolitans 92", 2020, 2022], ["JA Vichy", 2022, 2025], ["JL Bourg-en-Bresse", 2025, null]],
  "Hugo Robineau": [["Cholet Basket", 2019, 2020], ["Alliance Sport Alsace", 2020, 2021], ["Cholet Basket", 2021, 2023], ["Boulazac", 2023, 2026], ["JL Bourg-en-Bresse", 2026, null]],
  "Kadin Shedrick": [["Hapoel HaEmek", 2025, 2026], ["JL Bourg-en-Bresse", 2026, null]],
  "Keith Jordan Jr.": [["Sligo All-Stars", 2020, 2022], ["Skallagrimur", 2022, 2023], ["Breidablik", 2023, 2024], ["BC Prievidza", 2024, 2025], ["BC Sabah", 2025, 2026], ["JL Bourg-en-Bresse", 2026, null]],
  "Leni Monnet": [["JL Bourg-en-Bresse", 2025, null]],
  "Lionel Gaudoux": [["Boulazac", 2016, 2017], ["Saint-Quentin", 2021, 2022], ["Elan Chalon", 2022, 2026], ["JL Bourg-en-Bresse", 2026, null]],
  "Trey Woodbury": [["Brose Bamberg", 2023, 2024], ["Aris Thessaloniki", 2024, 2025], ["Cluj-Napoca", 2025, 2026], ["JL Bourg-en-Bresse", 2026, null]],
  "Tyrese Samuel": [["JL Bourg-en-Bresse", 2026, null]],
  "Tyson Walker": [["Melbourne United", 2025, 2026], ["JL Bourg-en-Bresse", 2026, null]],
  // --- Trento
  "Alessandro Bertini": [["Brescia", 2020, 2021], ["San Severo", 2021, 2022], ["Brianza Casa", 2022, 2023], ["Orzinuovi", 2023, 2025], ["Pesaro", 2025, 2026], ["Trento", 2026, null]],
  "Charlie Brown Jr.": [["Atlanta Hawks", 2019, 2020], ["Minnesota Timberwolves", 2020, 2021], ["Oklahoma City Thunder", 2020, 2021], ["Philadelphia 76ers", 2021, 2022], ["Dallas Mavericks", 2021, 2022], ["New York Knicks", 2023, 2024], ["Trento", 2026, null]],
  "Isaiah Bigelow": [["Zalakeramia ZTE", 2024, 2025], ["Alba Fehervar", 2025, 2026], ["Trento", 2026, null]],
  "Jordan Bayehe": [["Roseto Sharks", 2018, 2020], ["Pallacanestro Cantu", 2020, 2022], ["Brindisi", 2022, 2024], ["Trento", 2024, null]],
  "Quincy Olivari": [["Los Angeles Lakers", 2024, 2025], ["Trento", 2026, null]],
  "Selom Mawugbe": [["Rostock Seawolves", 2022, 2023], ["Le Mans", 2023, 2024], ["Manresa", 2023, 2024], ["Trento", 2024, null]],
  "Toto Forray": [["Virtus Padova", 2004, 2005], ["San Dona", 2005, 2008], ["Libertas Forli", 2008, 2011], ["Trento", 2010, null]],
  // --- Hapoel Jerusalem
  "David Roddy": [["Memphis Grizzlies", 2022, 2024], ["Phoenix Suns", 2023, 2024], ["Atlanta Hawks", 2024, 2025], ["Philadelphia 76ers", 2024, 2025], ["Hapoel Jerusalem", 2026, null]],
  "DeVontae Cacok": [["Los Angeles Lakers", 2019, 2021], ["San Antonio Spurs", 2021, 2022], ["CSKA Moscow", 2022, 2023], ["Virtus Bologna", 2023, 2025], ["UCAM Murcia", 2025, 2026], ["Hapoel Jerusalem", 2026, null]],
  "Dusan Miletic": [["Sloga Kraljevo", 2017, 2019], ["Partizan", 2019, 2020], ["Borac Cacak", 2019, 2020], ["Partizan", 2020, 2022], ["Girona", 2022, 2023], ["Slask Wroclaw", 2023, 2024], ["Spartak Subotica", 2024, 2025], ["Cluj-Napoca", 2025, 2026], ["Hapoel Jerusalem", 2026, null]],
  "Ethan Burg": [["Maccabi Shoham", 2020, 2021], ["Elitzur Netanya", 2021, 2023], ["Bnei Herzliya", 2023, 2025], ["Hapoel Jerusalem", 2026, null]],
  "Gabriel Chachashvili": [["Sparta Prague", 2018, 2020], ["Hapoel Upper Galilee", 2020, 2021], ["Hapoel Galil Elion", 2021, 2022], ["Brose Bamberg", 2022, 2023], ["Hapoel Jerusalem", 2023, null]],
  "Jaleen Smith": [["Academics Heidelberg", 2017, 2019], ["MHP Riesen Ludwigsburg", 2019, 2021], ["Alba Berlin", 2021, 2023], ["Partizan", 2023, 2024], ["Virtus Bologna", 2023, 2024], ["Bahcesehir College", 2024, 2025], ["Turk Telekom", 2025, 2026], ["Hapoel Jerusalem", 2026, null]],
  "Jared Harper": [["Phoenix Suns", 2019, 2020], ["New York Knicks", 2020, 2021], ["New Orleans Pelicans", 2021, 2022], ["Valencia", 2022, 2024], ["Hapoel Jerusalem", 2024, null]],
  "Kenny Lofton Jr.": [["Memphis Grizzlies", 2022, 2024], ["Philadelphia 76ers", 2023, 2024], ["Shanghai Sharks", 2024, 2026], ["Hapoel Jerusalem", 2026, null]],
  "Nimrod Levi": [["Maccabi Tel Aviv", 2016, 2017], ["Maccabi Rishon LeZion", 2016, 2017], ["Maccabi Ashdod", 2017, 2018], ["Maccabi Tel Aviv", 2018, 2019], ["Hapoel Jerusalem", 2019, 2020], ["Ironi Ness Ziona", 2020, 2022], ["Hapoel Galil Elion", 2022, 2023], ["Samsunspor", 2023, 2024], ["Hapoel Jerusalem", 2024, null]],
  "Roi Huber": [["Ramat HaSharon", 2015, 2016], ["Hapoel Holon", 2016, 2017], ["Maccabi Haifa", 2017, 2018], ["Hapoel Holon", 2018, 2020], ["Hapoel Eilat", 2020, 2022], ["Hapoel Galil Elion", 2022, 2024], ["Maccabi Ramat Gan", 2024, 2025], ["Hapoel Jerusalem", 2025, null]],
  "Yovel Zoosman": [["Maccabi Tel Aviv", 2015, 2016], ["Maccabi Raanana", 2016, 2017], ["Maccabi Tel Aviv", 2017, 2021], ["Alba Berlin", 2021, 2023], ["Hapoel Jerusalem", 2023, null]],
  // --- Manresa
  "Chibuzo Agbo": [["Cholet Basket", 2025, 2026], ["Manresa", 2026, null]],
  "Ferran Bassas": [["Joventut Badalona", 2011, 2012], ["Oviedo", 2013, 2016], ["La Laguna Tenerife", 2016, 2019], ["San Pablo Burgos", 2019, 2020], ["Joventut Badalona", 2020, 2022], ["Gran Canaria", 2022, 2024], ["Andorra", 2024, 2026], ["Manresa", 2025, null]],
  "Hugo Benitez": [["JL Bourg-en-Bresse", 2019, 2025], ["Manresa", 2025, null]],
  "JD Notae": [["Aris Thessaloniki", 2022, 2023], ["Trapani Shark", 2023, 2026], ["Manresa", 2026, null]],
  "Lukasz Kolenda": [["Trefl Sopot", 2015, 2021], ["Slask Wroclaw", 2021, 2024], ["Arka Gdynia", 2024, 2025], ["Rostock Seawolves", 2025, 2026], ["Manresa", 2026, null]],
  "Pablo Tamba": [["Manresa", 2026, null]],
  "Pierre Oriola": [["Manresa", 2010, 2012], ["Lleida", 2012, 2013], ["Penas Huesca", 2013, 2014], ["Baloncesto Sevilla", 2014, 2016], ["Valencia", 2016, 2017], ["FC Barcelona", 2017, 2022], ["Girona", 2022, 2023], ["Manresa", 2023, 2024], ["Lleida", 2024, 2025], ["Manresa", 2025, null]],
  "Timmy Allen": [["Memphis Grizzlies", 2023, 2024], ["Oostende", 2024, 2025], ["PAOK", 2025, 2026], ["Trapani Shark", 2025, 2026], ["Manresa", 2026, null]],
  "Yordan Minchev": [["Levski Sofia", 2014, 2016], ["Fenerbahce", 2016, 2017], ["MZT Skopje", 2017, 2018], ["Istanbul BSB", 2018, 2019], ["Levski Sofia", 2019, 2021], ["OSE Lions", 2021, 2022], ["Rilski Sportist", 2022, 2023], ["CSU Sibiu", 2023, 2024], ["Spirou Charleroi", 2024, 2025], ["Niners Chemnitz", 2025, 2026], ["Manresa", 2026, null]],
  // --- La Laguna Tenerife (Huertas, Fitipaldo, Fernandez, Abromaitis, Happ: stale bios, gaps left)
  "Arturs Kurucs": [["Baskonia", 2018, 2019], ["VEF Riga", 2019, 2020], ["Baskonia", 2020, 2023], ["Promitheas Patras", 2023, 2024], ["UCAM Murcia", 2024, 2025], ["Breogan", 2025, 2026], ["La Laguna Tenerife", 2026, null]],
  "Bruno Fitipaldo": [["Malvin", 2006, 2014], ["Obras Sanitarias", 2014, 2016], ["Galatasaray", 2016, 2017], ["Orlandina Basket", 2016, 2017], ["La Laguna Tenerife", 2026, null]],
  "Ethan Happ": [["Vanoli Cremona", 2019, 2020], ["Fortitudo Bologna", 2020, 2021], ["Dinamo Sassari", 2020, 2021], ["MHP Riesen Ludwigsburg", 2021, 2022], ["Breogan", 2022, 2023], ["Gran Canaria", 2023, 2024], ["Valencia", 2024, 2025], ["La Laguna Tenerife", 2026, null]],
  "Jaime Fernandez": [["Estudiantes", 2010, 2017], ["Andorra", 2017, 2018], ["Unicaja", 2018, 2019], ["La Laguna Tenerife", 2026, null]],
  "Kyle Guy": [["Sacramento Kings", 2019, 2021], ["Miami Heat", 2021, 2022], ["Joventut Badalona", 2022, 2023], ["Panathinaikos", 2023, 2024], ["Shanxi Loongs", 2025, 2026], ["La Laguna Tenerife", 2026, null]],
  "Marcelinho Huertas": [["Pinheiros", 2002, 2003], ["Joventut Badalona", 2004, 2007], ["Bilbao Basket", 2007, 2008], ["Fortitudo Bologna", 2008, 2009], ["Baskonia", 2009, 2011], ["FC Barcelona", 2011, 2015], ["Los Angeles Lakers", 2015, 2017], ["Baskonia", 2017, 2018], ["La Laguna Tenerife", 2026, null]],
  "Tim Abromaitis": [["ASVEL", 2012, 2013], ["SIG Strasbourg", 2013, 2014], ["Basket Lowen Braunschweig", 2014, 2015], ["La Laguna Tenerife", 2015, 2019], ["Zenit St Petersburg", 2019, 2020], ["Unicaja", 2020, 2021], ["La Laguna Tenerife", 2026, null]],
  // --- Le Mans
  "Carlos Stewart Jr.": [["Hamburg Towers", 2025, 2026], ["Le Mans", 2026, null]],
  "Jordan King": [["Lucentum Alicante", 2024, 2025], ["Maroussi", 2025, 2026], ["Le Mans", 2026, null]],
  "Leopold Delaunay": [["Cholet Basket", 2020, 2021], ["JA Vichy", 2021, 2023], ["Le Mans", 2023, null]],
  "Lucas Dufeal": [["Cholet Basket", 2022, 2023], ["JA Vichy", 2023, 2025], ["Le Mans", 2025, null]],
  "Moses Wood": [["Alba Berlin", 2025, 2026], ["Le Mans", 2026, null]],
  "Tashawn Thomas": [["Mitteldeutscher BC", 2015, 2016], ["Vanoli Cremona", 2016, 2017], ["Hapoel Holon", 2017, 2018], ["Hapoel Jerusalem", 2018, 2021], ["Le Mans", 2021, 2022], ["Perth Wildcats", 2022, 2023], ["Derthona Tortona", 2023, 2024], ["Le Mans", 2024, null]],
  "Tyler Beracou": [["Le Mans", 2025, null]],
  "Ugo Doumbia Niang": [["Chartres", 2020, 2023], ["Champagne Basket", 2023, 2024], ["JA Vichy", 2024, 2025], ["Le Mans", 2025, null]],
  "Wilfried Yeguete": [["Le Havre", 2014, 2015], ["Pau-Orthez", 2015, 2016], ["Le Mans", 2016, 2019], ["AS Monaco", 2019, 2022], ["Limoges", 2022, 2023], ["Le Mans", 2023, null]],
  // --- Lietkabelis
  "Alexander Schumacher": [["Lietkabelis", 2026, null]],
  "Daniel Baslyk": [["Siauliai", 2020, 2024], ["BC Wolves", 2024, 2025], ["Siauliai", 2025, 2026], ["Lietkabelis", 2026, null]],
  "Gabrielius Maldunas": [["Penas Huesca", 2015, 2016], ["Palencia", 2016, 2017], ["Nevezis", 2017, 2019], ["Lietkabelis", 2019, null]],
  "Gytis Nemeiksa": [["Lietkabelis", 2026, null]],
  "Ivan Fevrier": [["Metropolitans 92", 2017, 2020], ["Nanterre", 2020, 2021], ["Lietkabelis", 2026, null]],
  "Keondre Kennedy": [["Basket Torino", 2023, 2024], ["Hamburg Towers", 2024, 2025], ["Kolossos Rodou", 2025, 2026], ["Lietkabelis", 2026, null]],
  "Marius Valinskas": [["Lietkabelis", 2019, 2021], ["Nevezis", 2021, 2023], ["Juventus Utena", 2023, 2024], ["Siauliai", 2024, 2026], ["Lietkabelis", 2026, null]],
  "Milos Ilic": [["Lietkabelis", 2026, null]],
  "Nojus Radzius": [["Telsiai", 2023, 2025], ["Lietkabelis", 2025, null]],
  "Ognjen Jaramaz": [["Mega", 2012, 2013], ["Smederevo", 2013, 2014], ["Mega", 2014, 2018], ["San Pablo Burgos", 2018, 2019], ["Partizan", 2019, 2021], ["Bayern Munich", 2021, 2023], ["Partizan", 2023, 2024], ["Baskonia", 2024, 2025], ["Cedevita Olimpija", 2025, 2026], ["Ilirija", 2025, 2026], ["Lietkabelis", 2026, null]],
  "Veljko Ilic": [["Lietkabelis", 2026, null]],
  "Zygimantas Simonis": [["Lietkabelis", 2012, 2014], ["Delikatesas", 2014, 2015], ["Palangos Kursiai", 2015, 2017], ["Suduva", 2017, 2026], ["Lietkabelis", 2026, null]],
  // --- London Lions (Canadian summer-league stints left out)
  "Aaryn Rai": [["Hemel Storm", 2022, 2023], ["Cheshire Phoenix", 2023, 2024], ["London Lions", 2024, null]],
  "Deane Williams": [["Keflavik", 2019, 2021], ["Saint-Quentin", 2021, 2022], ["Telekom Baskets Bonn", 2022, 2023], ["Baskets Oldenburg", 2023, 2024], ["Napoli Basketball", 2024, 2025], ["London Lions", 2025, null]],
  "Devante Jones": [["Metropolitans 92", 2022, 2023], ["Le Mans", 2023, 2024], ["Cedevita Olimpija", 2024, 2025], ["Trento", 2025, 2026], ["London Lions", 2026, null]],
  "Ethan Price": [["London Lions", 2025, null]],
  "Joel Scott": [["MHP Riesen Ludwigsburg", 2024, 2025], ["London Lions", 2025, null]],
  "Joshua O'Garro": [["London Lions", 2026, null]],
  "Keenan Evans": [["Igokea", 2019, 2020], ["Hapoel Haifa", 2020, 2021], ["Maccabi Tel Aviv", 2021, 2022], ["Zalgiris Kaunas", 2022, 2024], ["Olympiacos", 2024, 2026], ["London Lions", 2026, null]],
  "Landrius Horton": [["TFT Skopje", 2020, 2022], ["Jamtland", 2022, 2023], ["Anorthosis", 2023, 2024], ["Keravnos", 2024, 2025], ["Dziki Warszawa", 2025, 2026], ["London Lions", 2026, null]],
  "Maxwell Lewis III": [["Los Angeles Lakers", 2023, 2024], ["Brooklyn Nets", 2024, 2025], ["Tofas", 2025, 2026], ["London Lions", 2026, null]],
  "Mo Soluade": [["Clinicas Rincon", 2011, 2015], ["Gipuzkoa", 2015, 2016], ["San Pablo Burgos", 2016, 2017], ["Unicaja", 2017, 2018], ["Legia Warszawa", 2018, 2019], ["Breogan", 2019, 2021], ["Basquet Coruna", 2021, 2022], ["London Lions", 2022, 2024], ["Tizona Burgos", 2024, 2025], ["London Lions", 2025, null]],
  "Tarik Phillip": [["Szolnok", 2017, 2018], ["Tofas", 2019, 2021], ["Reyer Venezia", 2021, 2022], ["San Pablo Burgos", 2021, 2022], ["London Lions", 2022, 2024], ["Hapoel Jerusalem", 2024, 2025], ["Trefl Sopot", 2024, 2025], ["London Lions", 2025, null]],
  "Thomas Kennedy": [["Telekom Baskets Bonn", 2023, 2025], ["Cedevita Olimpija", 2025, 2026], ["London Lions", 2026, null]],
  // --- Maxima Roma
  "Aaron Holiday": [["Indiana Pacers", 2018, 2021], ["Washington Wizards", 2021, 2022], ["Phoenix Suns", 2021, 2022], ["Atlanta Hawks", 2022, 2023], ["Houston Rockets", 2023, 2026], ["Maxima Roma", 2026, null]],
  "Brynton Lemar": [["SLUC Nancy", 2017, 2018], ["Sopron", 2018, 2019], ["Start Lublin", 2019, 2020], ["Gaziantep", 2020, 2021], ["Enisey", 2021, 2022], ["Le Mans", 2022, 2023], ["Hapoel Jerusalem", 2023, 2024], ["Cedevita Olimpija", 2024, 2025], ["Besiktas", 2025, 2026], ["Maxima Roma", 2026, null]],
  "Carl Wheatle": [["Pallacanestro Biella", 2016, 2019], ["Pistoia", 2019, 2024], ["Reyer Venezia", 2024, 2026], ["Maxima Roma", 2026, null]],
  "Federico Bonacini": [["Reggiana", 2015, 2017], ["Rieti", 2018, 2019], ["Trapani", 2019, 2020], ["Reggiana", 2020, 2022], ["Basket Ravenna", 2022, 2023], ["UCC Piacenza", 2023, 2025], ["Gemini Mestre", 2025, 2026], ["Maxima Roma", 2026, null]],
  "Giovanni Veronesi": [["Brescia", 2017, 2018], ["JuVi Cremona", 2018, 2019], ["Fortitudo Agrigento", 2019, 2021], ["Latina Basket", 2021, 2022], ["Mantova", 2022, 2023], ["UCC Piacenza", 2023, 2024], ["Dinamo Sassari", 2024, 2025], ["Vanoli Cremona", 2025, 2026], ["Maxima Roma", 2026, null]],
  "Gora Camara": [["Virtus Bologna", 2018, 2019], ["Junior Casale", 2019, 2021], ["Pesaro", 2021, 2022], ["Virtus Bologna", 2022, 2023], ["Treviso", 2023, 2024], ["Basket Rimini", 2024, 2026], ["Maxima Roma", 2026, null]],
  "John Brown III": [["Virtus Roma", 2016, 2017], ["Treviso", 2017, 2018], ["Brindisi", 2018, 2020], ["UNICS Kazan", 2020, 2022], ["AS Monaco", 2022, 2024], ["Crvena Zvezda", 2024, 2025], ["South East Melbourne Phoenix", 2025, 2026], ["Maxima Roma", 2026, null]],
  "Matt Ryan": [["Boston Celtics", 2021, 2022], ["Los Angeles Lakers", 2022, 2023], ["Minnesota Timberwolves", 2022, 2023], ["New Orleans Pelicans", 2023, 2024], ["New York Knicks", 2024, 2025], ["Dubai BC", 2025, 2026], ["Maxima Roma", 2026, null]],
  "Miro Bilan": [["Sibenik", 2005, 2010], ["Zadar", 2009, 2011], ["Cedevita Zagreb", 2011, 2017], ["SIG Strasbourg", 2017, 2018], ["ASVEL", 2018, 2019], ["Dinamo Sassari", 2019, 2021], ["Prometey", 2021, 2022], ["Peristeri", 2022, 2023], ["Brescia", 2023, 2024], ["Maxima Roma", 2026, null]],
  "Mirza Alibegovic": [["Udine", 2009, 2010], ["Fortitudo Budrio", 2010, 2011], ["Pesaro", 2011, 2012], ["Pistoia", 2012, 2013], ["Mantova", 2013, 2014], ["Brescia", 2014, 2016], ["Auxilium Torino", 2016, 2017], ["Orlandina Basket", 2017, 2018], ["Derthona Tortona", 2018, 2019], ["Basket Torino", 2019, 2022], ["Vanoli Cremona", 2022, 2023], ["Udine", 2023, 2026], ["Maxima Roma", 2026, null]],
  "Xavier Moon": [["ALM Evreux", 2017, 2018], ["Maccabi Hod HaSharon", 2020, 2021], ["Los Angeles Clippers", 2021, 2024], ["Zenit St Petersburg", 2024, 2026], ["Maxima Roma", 2026, null]],
  "Vince Hunter": [["Panathinaikos", 2015, 2016], ["Avtodor Saratov", 2016, 2017], ["Memphis Grizzlies", 2017, 2018], ["AEK Athens", 2018, 2019], ["Virtus Bologna", 2019, 2021], ["Metropolitans 92", 2021, 2022], ["UNICS Kazan", 2022, 2023], ["Zenit St Petersburg", 2023, 2025], ["Lokomotiv Kuban", 2025, 2026], ["La Laguna Tenerife", 2026, null]],
};

// ----------------------------------------------------------------------------
global.window = {};
eval(fs.readFileSync("eurocup_players.js", "utf8"));
eval(fs.readFileSync("careers.js", "utf8"));
const EC = window.EUROCUP_PLAYERS, EL_CAREERS = window.CAREERS;
const byName = {}; EC.forEach(p => { byName[p.name] = p; });
const elCareer = {}; EL_CAREERS.forEach(c => { elCareer[c.name] = c; });

// bio spelling → the name careers.js already uses, so both competitions share clubs
const TEAM_FIX = {
  "ALBA Berlin": "Alba Berlin", "APU Udine": "Udine", "Asseco Gdynia": "Asseco Prokom", "BC Oostende": "Oostende",
  "Basket Mestre": "Bears Mestre", "Benetton Treviso": "Treviso", "Treviso Basket": "Treviso", "Buyukcekmece": "Buyukcekmece Basketbol",
  "CB Menorca": "Menorca", "Germani Brescia": "Brescia", "Happy Casa Brindisi": "Brindisi", "Ironi Nes Ziona": "Ironi Ness Ziona",
  "Limoges CSP": "Limoges", "Mega Basket": "Mega", "Mykolaiv": "MBC Mykolaiv", "Nanterre 92": "Nanterre", "Orlandina": "Orlandina Basket",
  "Pallacanestro Forli": "Libertas Forli", "Rimini": "Basket Rimini", "Rytas Vilnius": "Lietuvos Rytas",
  "Victoria Libertas Pesaro": "Pesaro", "Zaragoza": "Basket Zaragoza", "Zenit St Petersburg": "Zenit Saint Petersburg",
  "BK Ventspils": "Ventspils", "Denain": "Denain-Voltaire", "Elan Chalon": "Chalon", "Huesca": "Penas Huesca", "Krka Novo Mesto": "Krka",
  "Merkezefendi": "Merkezefendi Belediyesi", "Mersin MSK": "Mersin BB", "Spars Sarajevo": "OKK Spars", "Studentski Centar": "Studentski centar",
  "Trieste": "Pallacanestro Trieste", "Unicaja Malaga": "Unicaja",
  "Baloncesto Sevilla": "CB Sevilla", "Basket Lowen Braunschweig": "Braunschweig", "Istanbul BSB": "Istanbul BB", "Joventut Badalona": "Joventut",
  "Sloga Kraljevo": "KK Sloga", "Shanxi Loongs": "Shanxi Brave Dragons", "Shandong Heroes": "Shandong Golden Stars",
  "Hapoel Upper Galilee": "Hapoel Galil Elion",
  "Baskets Oldenburg": "Oldenburg", "Enisey": "Enisey Krasnoyarsk", "Gaziantep": "Gaziantep Basketbol", "Gemini Mestre": "Bears Mestre",
  "Gipuzkoa": "Gipuzkoa Basket", "Junior Casale": "Casale Monferrato", "Reggiana": "Pallacanestro Reggiana", "Trapani": "Trapani Shark",
  // careers.js names for today's EuroCup clubs → the EuroCup name, so a carried-over
  // EuroLeague career and a bio career meet at the same club (predecessor clubs such as
  // Olimpija Ljubljana or Carpisa Napoli are different clubs and stay apart)
  "Aris": "Aris Thessaloniki", "Derthona Basket": "Derthona Tortona", "Bahcesehir Koleji": "Bahcesehir College",
  "KK Bosna": "Bosna Sarajevo", "CB Canarias": "La Laguna Tenerife",
};
const fixTeam = t => TEAM_FIX[t] || t;
const eff = t => (t == null ? 9999 : t);
// careers.js's rule, copied from build_careers.js
function clean(career) {
  const c = career.map(e => ({ team: fixTeam(e.team), from: e.from, to: e.to }));
  c.sort((a, b) => a.from - b.from || eff(b.to) - eff(a.to));
  const out = [];
  c.forEach(e => {
    const last = out[out.length - 1];
    if (last) {
      if (last.team === e.team && e.from <= eff(last.to)) { if (eff(e.to) > eff(last.to)) last.to = e.to; return; }
      if (e.from >= last.from && eff(e.to) <= eff(last.to)) return;
    }
    out.push(e);
  });
  return out;
}

const problems = [], out = [];
Object.keys(RAW).forEach(name => {
  const p = byName[name];
  if (!p) { problems.push(name + ": not in eurocup_players.js"); return; }
  const career = clean(RAW[name].map(([team, from, to]) => ({ team, from, to })));
  const last = career[career.length - 1];
  if (!last || last.team !== p.team || last.to !== null) problems.push(name + ": career must end at his EuroCup club (" + p.team + ", open)");
  career.forEach(s => { if (!(s.from >= 1990 && s.from <= 2026) || (s.to !== null && s.to <= s.from)) problems.push(name + ": bad stint " + JSON.stringify(s)); });
  out.push({ name, nationality: p.nationality, position: p.position, active: true, career });
});
// the EuroCup players the EuroLeague careers already cover
EC.forEach(p => {
  const c = elCareer[p.name]; if (!c || RAW[p.name]) return;
  const career = c.career.map(s => ({ team: s.team, from: s.from, to: s.to === null ? 2026 : s.to })).filter(s => s.from < 2026);
  career.push({ team: p.team, from: 2026, to: null });
  out.push({ name: p.name, nationality: p.nationality, position: p.position, active: true, career: clean(career) });
});
if (problems.length) { console.error("eurocup_careers.js NOT written:\n  " + problems.join("\n  ")); process.exit(1); }
out.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync("eurocup_careers.js", "/*\n * EuroCup career timelines (auto-generated by build_eurocup_careers.js — do not edit).\n * Same shape as careers.js.\n */\nwindow.EUROCUP_CAREERS = [\n" + out.map(c => "  " + JSON.stringify(c)).join(",\n") + "\n];\n");
console.log("eurocup_careers.js: " + out.length + " careers (" + Object.keys(RAW).length + " from the bios, " + (out.length - Object.keys(RAW).length) + " from careers.js); " + (EC.length - out.length) + " EuroCup players still without one");
