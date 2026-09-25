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
  // --- Napoli Basketball ("Napoli Basket" in the bios is today's club)
  "Andrej Jakimovski": [["Basket Torino", 2019, 2020], ["Trento", 2025, 2026], ["Napoli Basketball", 2026, null]],
  "Guglielmo Caruso": [["Napoli Basketball", 2017, 2018], ["Pallacanestro Varese", 2021, 2023], ["Olimpia Milano", 2023, 2025], ["Napoli Basketball", 2025, null]],
  "Jack White": [["Cairns Taipans", 2015, 2016], ["Melbourne United", 2020, 2022], ["Denver Nuggets", 2022, 2023], ["Memphis Grizzlies", 2023, 2024], ["Melbourne United", 2024, 2025], ["Mersin BB", 2025, 2026], ["Napoli Basketball", 2026, null]],
  "Jahmi'us Ramsey": [["Sacramento Kings", 2020, 2022], ["Oklahoma City Thunder", 2023, 2024], ["Toronto Raptors", 2023, 2024], ["Pallacanestro Trieste", 2025, 2026], ["Napoli Basketball", 2026, null]],
  "John Petrucelli": [["Iskra Svit", 2014, 2016], ["Hapoel Beer Sheva", 2019, 2020], ["Ratiopharm Ulm", 2020, 2021], ["Brescia", 2021, 2024], ["Trapani Shark", 2024, 2026], ["Galatasaray", 2025, 2026], ["Napoli Basketball", 2026, null]],
  "Kaleb Tarczewski": [["Olimpia Milano", 2016, 2022], ["Gunma Crane Thunders", 2022, 2023], ["Napoli Basketball", 2026, null]],
  "Leonardo Faggian": [["Treviso", 2020, 2024], ["Scaligera Verona", 2024, 2025], ["Napoli Basketball", 2025, null]],
  "Leonardo Tote": [["Reyer Venezia", 2014, 2015], ["Brescia", 2015, 2016], ["Scaligera Verona", 2016, 2018], ["Jesi", 2018, 2019], ["Pesaro", 2019, 2020], ["Fortitudo Bologna", 2020, 2022], ["Pesaro", 2022, 2024], ["Napoli Basketball", 2024, 2025], ["Olimpia Milano", 2025, 2026], ["Napoli Basketball", 2026, null]],
  "Marco Spissu": [["Dinamo Sassari", 2011, 2013], ["Bari", 2013, 2014], ["Assigeco Casalpusterlengo", 2013, 2014], ["Viola Reggio Calabria", 2014, 2015], ["Derthona Tortona", 2015, 2016], ["Virtus Bologna", 2016, 2017], ["Dinamo Sassari", 2017, 2021], ["UNICS Kazan", 2021, 2022], ["Reyer Venezia", 2022, 2024], ["Basket Zaragoza", 2024, 2026], ["Napoli Basketball", 2026, null]],
  "Markel Brown": [["Brooklyn Nets", 2014, 2016], ["Khimki", 2016, 2017], ["Houston Rockets", 2017, 2018], ["Darussafaka", 2018, 2019], ["Hapoel Eilat", 2020, 2021], ["Antwerp Giants", 2021, 2022], ["Pallacanestro Varese", 2022, 2023], ["Napoli Basketball", 2023, 2024], ["Pallacanestro Trieste", 2024, 2026], ["Napoli Basketball", 2025, null]],
  // --- Neptunas (Franke, Tubutis: stale bios)
  "Arnas Berucka": [["Perlas Vilnius", 2015, 2018], ["Juventus Utena", 2018, 2020], ["Inter Bratislava", 2020, 2021], ["Pieno Zvaigzdes", 2021, 2022], ["BC Wolves", 2022, 2024], ["Neptunas", 2024, null]],
  "Donatas Tarolis": [["Gargzdai", 2011, 2013], ["Zalgiris Kaunas", 2013, 2015], ["Traiskirchen Lions", 2015, 2016], ["Lietkabelis", 2016, 2019], ["Cluj-Napoca", 2019, 2021], ["Buducnost", 2021, 2022], ["Afyon Belediyespor", 2021, 2022], ["CSM Oradea", 2022, 2025], ["Neptunas", 2025, null]],
  "Einaras Tubutis": [["Perlas Vilnius", 2017, 2019], ["Neptunas", 2026, null]],
  "Henri Drell": [["Brose Bamberg", 2016, 2019], ["Pesaro", 2019, 2022], ["Chorale Roanne", 2022, 2023], ["Chicago Bulls", 2023, 2024], ["La Laguna Tenerife", 2024, 2025], ["Joventut", 2025, 2026], ["Neptunas", 2026, null]],
  "Kristupas Zemaitis": [["Siauliai", 2017, 2020], ["Dzukija Alytus", 2020, 2021], ["Lietkabelis", 2021, 2022], ["BC Wolves", 2022, 2023], ["Neptunas", 2026, null]],
  "Martynas Echodas": [["Siauliai", 2016, 2017], ["Lietuvos Rytas", 2017, 2021], ["Reyer Venezia", 2021, 2022], ["Lietuvos Rytas", 2022, 2024], ["Manisa BB", 2024, 2025], ["Alba Berlin", 2025, 2026], ["Neptunas", 2026, null]],
  "Mindaugas Girdziunas": [["Neptunas", 2009, 2012], ["Nevezis", 2012, 2013], ["Neptunas", 2013, 2017], ["Lietuvos Rytas", 2017, 2018], ["Neptunas", 2022, null]],
  "Yannick Franke": [["ZZ Leiden", 2013, 2014], ["Rotterdam", 2014, 2015], ["Donar Groningen", 2015, 2016], ["Promitheas Patras", 2016, 2017], ["Trento", 2017, 2018], ["Neptunas", 2026, null]],
  // --- Niners Chemnitz (German third division stints left out)
  "Alexander Richardson": [["Skyliners Frankfurt", 2021, 2023], ["ART Giants Dusseldorf", 2023, 2025], ["Niners Chemnitz", 2026, null]],
  "Ben Burnham": [["Artland Dragons", 2025, 2026], ["Niners Chemnitz", 2026, null]],
  "Cobe Williams": [["Spirou Charleroi", 2024, 2025], ["Brose Bamberg", 2025, 2026], ["Niners Chemnitz", 2026, null]],
  "Darion Atkins": [["Hapoel Holon", 2016, 2017], ["SIG Strasbourg", 2017, 2018], ["Hapoel Holon", 2018, 2019], ["La Laguna Tenerife", 2019, 2020], ["Fethiye Belediyespor", 2020, 2021], ["Niners Chemnitz", 2021, 2022], ["Trento", 2022, 2023], ["Pallacanestro Reggiana", 2023, 2025], ["Maccabi Ramat Gan", 2025, 2026], ["Niners Chemnitz", 2026, null]],
  "Elias Roedl": [["Niners Chemnitz", 2026, null]],
  "Jannis von Seckendorff": [["RheinStars Koln", 2021, 2025], ["Eisbaren Bremerhaven", 2025, 2026], ["Niners Chemnitz", 2026, null]],
  "Luca Kellig": [["Niners Chemnitz", 2023, null]],
  "Mateo Seric": [["MHP Riesen Ludwigsburg", 2015, 2018], ["Brose Bamberg", 2018, 2021], ["Tigers Tubingen", 2021, 2024], ["Academics Heidelberg", 2024, 2026], ["Niners Chemnitz", 2026, null]],
  "Nighael Ceaser": [["Pyrinto Tampere", 2023, 2024], ["Nymburk", 2024, 2025], ["Igokea", 2025, 2026], ["Niners Chemnitz", 2026, null]],
  "Phlandrous Fleming Jr.": [["Vitoria Guimaraes", 2022, 2023], ["Le Portel", 2023, 2024], ["Telekom Baskets Bonn", 2024, 2025], ["SLUC Nancy", 2025, 2026], ["Niners Chemnitz", 2026, null]],
  "Stefan Smith": [["Kolubara", 2022, 2023], ["Orleans Loiret", 2023, 2024], ["Cholet Basket", 2024, 2025], ["MHP Riesen Ludwigsburg", 2025, 2026], ["Niners Chemnitz", 2026, null]],
  "Urald King": [["Valur", 2017, 2018], ["Tindastoll", 2018, 2019], ["Boulogne-sur-Mer", 2019, 2020], ["KTP Basket", 2021, 2022], ["Maccabi Ma'ale Adumim", 2022, 2023], ["KB Peja", 2023, 2024], ["Bakken Bears", 2024, 2025], ["Gladiators Trier", 2025, 2026], ["Niners Chemnitz", 2026, null]],
  "Yohan Choupas": [["Pau-Orthez", 2018, 2020], ["AS Monaco", 2020, 2021], ["Lille", 2021, 2022], ["Angers", 2022, 2023], ["Alliance Sport Alsace", 2023, 2024], ["Chalon", 2024, 2025], ["Niners Chemnitz", 2026, null]],
  // --- PAOK
  "Athanasios Bazinas": [["Promitheas Patras", 2019, 2026], ["PAOK", 2026, null]],
  "Ben Moore": [["Indiana Pacers", 2017, 2018], ["Galatasaray", 2019, 2020], ["South East Melbourne Phoenix", 2020, 2022], ["Hapoel Beer Sheva", 2022, 2023], ["Bodrumspor", 2023, 2024], ["Hapoel Gilboa Galil", 2024, 2025], ["PAOK", 2025, null]],
  "Breein Tyree": [["Oostende", 2022, 2023], ["Dinamo Sassari", 2023, 2024], ["Petkim Spor", 2024, 2025], ["Igokea", 2024, 2025], ["PAOK", 2025, null]],
  "Clifford Omoruyi": [["Maccabi Tel Aviv", 2025, 2026], ["PAOK", 2026, null]],
  "Dimitrios Kaklamanakis": [["Peristeri", 2013, 2014], ["Ilysiakos", 2014, 2015], ["Lavrio", 2015, 2019], ["AEK Athens", 2019, 2020], ["PAOK", 2020, 2021], ["Lavrio", 2021, 2022], ["Promitheas Patras", 2022, 2023], ["Panionios", 2023, 2025], ["Peristeri", 2025, 2026], ["PAOK", 2026, null]],
  "Georgios Fillios": [["Iraklis", 2018, 2022], ["Aris Thessaloniki", 2022, 2024], ["AEK Athens", 2024, 2025], ["PAOK", 2025, null]],
  "Kyle Alexander": [["Miami Heat", 2019, 2020], ["Fuenlabrada", 2020, 2022], ["Valencia", 2022, 2023], ["Hapoel Tel Aviv", 2023, 2024], ["Turk Telekom", 2024, 2026], ["PAOK", 2026, null]],
  "Marcus Foster": [["DB Promy", 2018, 2019], ["Hapoel Holon", 2019, 2020], ["Panathinaikos", 2020, 2021], ["Turk Telekom", 2020, 2021], ["Lietuvos Rytas", 2022, 2023], ["Shandong Golden Stars", 2023, 2024], ["Hapoel Tel Aviv", 2024, 2025], ["Alvark Tokyo", 2025, 2026], ["PAOK", 2026, null]],
  "Naz Mitrou-Long": [["Utah Jazz", 2017, 2019], ["Indiana Pacers", 2019, 2021], ["Brescia", 2021, 2022], ["Olimpia Milano", 2022, 2023], ["Olympiacos", 2023, 2024], ["Napoli Basketball", 2025, 2026], ["PAOK", 2026, null]],
  "Nikolaos Persidis": [["Ionikos Nikaias", 2016, 2017], ["Ethnikos Piraeus", 2017, 2018], ["Diagoras Dryopideon", 2018, 2019], ["Panathinaikos", 2019, 2020], ["Lavrio", 2020, 2022], ["AEK Athens", 2022, 2023], ["Aris Thessaloniki", 2023, 2024], ["PAOK", 2024, null]],
  "Nikos Chougkaz": [["Panionios", 2018, 2019], ["Ionikos Nikaias", 2020, 2021], ["Panathinaikos", 2021, 2023], ["Peristeri", 2023, 2024], ["Andorra", 2024, 2025], ["Cedevita Olimpija", 2025, 2026], ["PAOK", 2026, null]],
  "Raiquan Gray": [["Brooklyn Nets", 2022, 2023], ["San Antonio Spurs", 2023, 2024], ["AEK Athens", 2024, 2026], ["PAOK", 2026, null]],
  "Trevor Hudgins": [["Houston Rockets", 2022, 2023], ["Le Mans", 2023, 2026], ["PAOK", 2026, null]],
  // --- Ratiopharm Ulm
  "Devin Schmidt": [["L'Hospitalet", 2017, 2018], ["Lucentum Alicante", 2018, 2020], ["Caceres", 2020, 2022], ["Palencia", 2022, 2023], ["Valladolid", 2023, 2024], ["Estudiantes", 2024, 2025], ["Phoenix Hagen", 2025, 2026], ["Ratiopharm Ulm", 2026, null]],
  "Dwayne Koroma": [["Ratiopharm Ulm", 2026, null]],
  "Ibi Watson": [["Boras Basket", 2023, 2024], ["Brose Bamberg", 2024, 2026], ["Ratiopharm Ulm", 2026, null]],
  "Jaylen Sims": [["Charlotte Hornets", 2024, 2025], ["Ratiopharm Ulm", 2026, null]],
  "Lenny Liedtke": [["Bayreuth", 2023, 2026], ["Ratiopharm Ulm", 2026, null]],
  "Lucas Fischer": [["Nanterre", 2022, 2025], ["Le Portel", 2025, 2026], ["Ratiopharm Ulm", 2026, null]],
  "Michael Rataj": [["Ratiopharm Ulm", 2021, 2022], ["Ratiopharm Ulm", 2026, null]],
  "Namori Omog": [["Ratiopharm Ulm", 2025, null]],
  "Simisola Shittu": [["Chicago Bulls", 2019, 2020], ["Ironi Ness Ziona", 2021, 2022], ["Limoges", 2023, 2024], ["Merkezefendi", 2024, 2025], ["Ilirija", 2025, 2026], ["Ratiopharm Ulm", 2026, null]],
  // --- San Pablo Burgos (Doumbouya's bio stops at Limoges 2019; the gap is left)
  "Balsa Koprivica": [["Partizan", 2021, 2025], ["Bahcesehir College", 2025, 2026], ["San Pablo Burgos", 2026, null]],
  "Chase Audige": [["Oostende", 2024, 2025], ["Unicaja", 2025, 2026], ["Bosna Sarajevo", 2025, 2026], ["San Pablo Burgos", 2026, null]],
  "Christian Sengfelder": [["Ehingen Urspring", 2013, 2014], ["Braunschweig", 2018, 2019], ["Brose Bamberg", 2019, 2023], ["Telekom Baskets Bonn", 2023, 2024], ["JDA Dijon", 2024, 2025], ["Ratiopharm Ulm", 2025, 2026], ["San Pablo Burgos", 2026, null]],
  "Daniel Diez": [["Gipuzkoa Basket", 2012, 2013], ["Real Madrid", 2013, 2014], ["Gipuzkoa Basket", 2014, 2015], ["Unicaja", 2015, 2019], ["La Laguna Tenerife", 2019, 2021], ["San Pablo Burgos", 2021, 2022], ["Baskonia", 2022, 2023], ["San Pablo Burgos", 2026, null]],
  "DJ Steward": [["Chicago Bulls", 2024, 2025], ["Trento", 2025, 2026], ["San Pablo Burgos", 2026, null]],
  "Dusan Radosavljevic": [["Metalac Valjevo", 2020, 2021], ["Dynamic", 2021, 2023], ["Spartak Subotica", 2023, 2024], ["FMP", 2024, 2026], ["San Pablo Burgos", 2026, null]],
  "Pablo Almazan": [["Clinicas Rincon", 2007, 2008], ["Jerez", 2008, 2009], ["Plasencia", 2009, 2010], ["Unicaja", 2010, 2011], ["Basket Zaragoza", 2011, 2012], ["Basquet Coruna", 2012, 2013], ["Breogan", 2013, 2014], ["Basket Navarra", 2014, 2015], ["Melilla", 2015, 2018], ["Real Betis", 2018, 2024], ["San Pablo Burgos", 2024, null]],
  "Raul Lobaco": [["Oviedo", 2021, 2022], ["Basket Navarra", 2022, 2023], ["Oviedo", 2023, 2026], ["San Pablo Burgos", 2026, null]],
  "Retin Obasohan": [["Scandone Avellino", 2016, 2017], ["Rockets Gotha", 2017, 2018], ["Brose Bamberg", 2019, 2020], ["Nymburk", 2020, 2021], ["Hapoel Jerusalem", 2021, 2022], ["ASVEL", 2022, 2023], ["Derthona Tortona", 2023, 2024], ["Manresa", 2024, 2025], ["San Pablo Burgos", 2026, null]],
  "Ruben Guerrero": [["Clinicas Rincon", 2011, 2013], ["Unicaja", 2019, 2022], ["Obradoiro", 2022, 2024], ["Granada", 2024, 2025], ["Andorra", 2025, 2026], ["San Pablo Burgos", 2026, null]],
  "Sekou Doumbouya": [["Poitiers", 2016, 2018], ["Limoges", 2018, 2019], ["San Pablo Burgos", 2026, null]],
  "Ziga Samar": [["Fuenlabrada", 2020, 2022], ["Hamburg Towers", 2022, 2023], ["Alba Berlin", 2023, 2025], ["Gran Canaria", 2024, 2026], ["San Pablo Burgos", 2026, null]],
  // --- Riga Zelli
  "Gustavs Kampuss": [["Latvijas Universitate", 2018, 2023], ["BK Ogre", 2023, 2026], ["Riga Zelli", 2026, null]],
  "Ivan Tkachenko": [["Cherkasy Monkeys", 2014, 2022], ["Prometey", 2022, 2023], ["Riga Zelli", 2026, null]],
  "Janis Berzins": [["Valmiera", 2009, 2011], ["VEF Riga", 2011, 2016], ["Orlandina Basket", 2016, 2018], ["Ventspils", 2018, 2020], ["Zielona Gora", 2020, 2021], ["Manresa", 2021, 2022], ["Legia Warszawa", 2022, 2023], ["Sokol Lancut", 2023, 2024], ["Gornik Walbrzych", 2024, 2025], ["Riga Zelli", 2025, null]],
  "Klavs Cavars": [["BK Liepaja", 2015, 2016], ["ITU", 2016, 2017], ["VEF Riga", 2017, 2019], ["Ventspils", 2019, 2020], ["Tsmoki-Minsk", 2020, 2021], ["Astoria Bydgoszcz", 2021, 2022], ["Start Lublin", 2022, 2023], ["Yokohama Excellence", 2023, 2024], ["BC Sabah", 2024, 2026], ["Riga Zelli", 2026, null]],
  "Kristians Feierbergs": [["BK Liepaja", 2025, 2026], ["Riga Zelli", 2026, null]],
  "Martynas Varnas": [["Zalgiris Kaunas", 2016, 2017], ["Pieno Zvaigzdes", 2017, 2018], ["Nevezis", 2018, 2019], ["Prienai", 2019, 2020], ["Siauliai", 2020, 2023], ["Lietkabelis", 2023, 2025], ["Riga Zelli", 2026, null]],
  "Rolands Sulcs": [["Gulbenes Buki", 2022, 2024], ["Riga Zelli", 2024, null]],
  "Toms Skuja": [["Valmiera", 2017, 2018], ["CB Sant Antoni", 2020, 2022], ["Latvijas Universitate", 2022, 2023], ["Riga Zelli", 2023, 2025], ["MHP Riesen Ludwigsburg", 2025, 2026], ["Riga Zelli", 2026, null]],
  "Tony Perkins": [["Nevezis", 2025, 2026], ["Riga Zelli", 2026, null]],
  "Tyler Wahl": [["Zadar", 2024, 2025], ["Panionios", 2025, 2026], ["Riga Zelli", 2026, null]],
  // --- Roma Basketball
  "Andrea Mezzanotte": [["Treviglio", 2015, 2018], ["Trento", 2018, 2022], ["Brindisi", 2022, 2023], ["Treviso", 2023, 2025], ["Dinamo Sassari", 2025, 2026], ["Roma Basketball", 2026, null]],
  "Arturs Strautins": [["Pallacanestro Reggiana", 2014, 2017], ["Orlandina Basket", 2017, 2018], ["Pallacanestro Trieste", 2018, 2020], ["Varese", 2020, 2021], ["Pallacanestro Reggiana", 2021, 2023], ["Derthona Tortona", 2023, 2026], ["Roma Basketball", 2026, null]],
  "Corey Davis Jr.": [["Afyon Belediyespor", 2019, 2020], ["Gravelines-Dunkerque", 2020, 2021], ["Mornar Bar", 2021, 2022], ["Pallacanestro Trieste", 2022, 2023], ["Girona", 2023, 2024], ["Vanoli Cremona", 2024, 2025], ["Niners Chemnitz", 2025, 2026], ["Roma Basketball", 2026, null]],
  "Erik Stevenson": [["Cholet Basket", 2023, 2024], ["Washington Wizards", 2024, 2025], ["Basket Zaragoza", 2025, 2026], ["Roma Basketball", 2026, null]],
  "Gerald Ayayi": [["Pau-Orthez", 2019, 2023], ["Cholet Basket", 2023, 2026], ["Roma Basketball", 2026, null]],
  "Giovanni Emejuru": [["Roma Basketball", 2026, null]],
  "Marko Simonovic": [["Olimpija Ljubljana", 2018, 2019], ["Mega", 2019, 2021], ["Chicago Bulls", 2021, 2023], ["Crvena Zvezda", 2023, 2024], ["Besiktas", 2023, 2024], ["Bahcesehir College", 2024, 2025], ["Turk Telekom", 2025, 2026], ["Roma Basketball", 2026, null]],
  "Michael Iuzzolino": [["Roma Basketball", 2026, null]],
  "Paul Watson Jr.": [["BG Gottingen", 2017, 2018], ["Toronto Raptors", 2019, 2021], ["Atlanta Hawks", 2019, 2020], ["Oklahoma City Thunder", 2021, 2022], ["Roma Basketball", 2026, null]],
  "Trentyn Flowers": [["Adelaide 36ers", 2023, 2024], ["Los Angeles Clippers", 2024, 2025], ["Chicago Bulls", 2025, 2026], ["Roma Basketball", 2026, null]],
  // --- Rostock Seawolves
  "Artur Konontsuk": [["Parnu Sadam", 2017, 2018], ["Parnu Sadam", 2021, 2022], ["Kalev/Cramo", 2022, 2023], ["Granada", 2023, 2024], ["Oldenburg", 2024, 2025], ["Bursaspor", 2025, 2026], ["Rostock Seawolves", 2026, null]],
  "Bent Leuchten": [["Rostock Seawolves", 2025, null]],
  "DeAndre Lansdowne": [["Pioneros de Delicias", 2014, 2015], ["Braunschweig", 2015, 2016], ["Hamburg Towers", 2016, 2017], ["Braunschweig", 2017, 2019], ["Brescia", 2019, 2020], ["SIG Strasbourg", 2020, 2023], ["Niners Chemnitz", 2023, 2025], ["Rostock Seawolves", 2025, null]],
  "Dominic Lockhart": [["Giessen Pointers", 2011, 2013], ["Oldenburg", 2013, 2017], ["Gottingen", 2017, 2020], ["Brose Bamberg", 2020, 2022], ["Niners Chemnitz", 2022, 2024], ["Rostock Seawolves", 2024, null]],
  "Elias Baggette": [["Baunach Young Pikes", 2018, 2020], ["BBC Coburg", 2020, 2021], ["Brose Bamberg", 2021, 2022], ["Crailsheim Merlins", 2022, 2024], ["Rostock Seawolves", 2024, null]],
  "Isayah Owens": [["Rostock Seawolves", 2026, null]],
  "Johnathan Stove": [["Vllaznia", 2021, 2022], ["BC Nokia", 2022, 2023], ["Mitteldeutscher BC", 2023, 2024], ["Maroussi", 2024, 2025], ["Wurzburg", 2025, 2026], ["Rostock Seawolves", 2026, null]],
  "Matthes Tilsen": [["Rostock Seawolves", 2026, null]],
  "Owen Klassen": [["MZT Skopje", 2014, 2015], ["Phoenix Hagen", 2015, 2017], ["PAOK", 2017, 2018], ["MHP Riesen Ludwigsburg", 2018, 2019], ["Antwerp Giants", 2019, 2020], ["Boulazac", 2020, 2021], ["Braunschweig", 2021, 2022], ["Oldenburg", 2022, 2023], ["Wurzburg", 2023, 2025], ["Rostock Seawolves", 2025, null]],
  "Philipp Hartwich": [["Penas Huesca", 2018, 2019], ["Melilla", 2019, 2020], ["Mitteldeutscher BC", 2020, 2021], ["Gottingen", 2021, 2022], ["Wurzburg", 2022, 2023], ["Gottingen", 2023, 2024], ["Rostock Seawolves", 2024, 2025], ["Braunschweig", 2025, 2026], ["Rostock Seawolves", 2026, null]],
  "Robin Amaize": [["Giessen 46ers", 2012, 2013], ["Braunschweig", 2013, 2016], ["Medi Bayreuth", 2016, 2018], ["Bayern Munich", 2018, 2019], ["Oldenburg", 2019, 2020], ["Bayern Munich", 2020, 2021], ["Braunschweig", 2021, 2023], ["Rostock Seawolves", 2023, null]],
  "TJ Crockett Jr.": [["CB Prat", 2021, 2022], ["Antalya Gunesi", 2022, 2023], ["Braunschweig", 2023, 2025], ["Rostock Seawolves", 2025, null]],
  "Todd Withers": [["Fortitudo Bologna", 2020, 2021], ["Adelaide 36ers", 2021, 2022], ["Darussafaka", 2023, 2024], ["Perth Wildcats", 2024, 2025], ["Hapoel Holon", 2025, 2026], ["Rostock Seawolves", 2026, null]],
  "Zach Copeland": [["Bristol Flyers", 2020, 2021], ["Kryvbas", 2021, 2022], ["Pistoia", 2022, 2023], ["Brose Bamberg", 2023, 2024], ["Napoli Basketball", 2024, 2025], ["Brindisi", 2025, 2026], ["Rostock Seawolves", 2026, null]],
  // --- Siauliai
  "Cedric Henderson Jr.": [["CSM Constanta", 2023, 2024], ["PAOK", 2024, 2025], ["Siauliai", 2025, null]],
  "Dayvion McKnight": [["Siauliai", 2025, null]],
  "Dovydas Romancenko": [["Neptunas", 2021, 2022], ["Juventus Utena", 2022, 2023], ["Siauliai", 2023, null]],
  "Efton Reid": [["Kobrat", 2025, 2026], ["Siauliai", 2026, null]],
  "Erikas Venskus": [["Zalgiris Kaunas", 2018, 2020], ["Lietkabelis", 2020, 2021], ["Prienai", 2021, 2022], ["ZZ Leiden", 2022, 2023], ["Spirou Charleroi", 2023, 2024], ["Jonava", 2024, 2025], ["Juventus Utena", 2025, 2026], ["Siauliai", 2026, null]],
  "Karolis Lukosiunas": [["Siauliai", 2017, 2019], ["Zalgiris Kaunas", 2019, 2024], ["Juventus Utena", 2024, 2025], ["London Lions", 2025, 2026], ["Siauliai", 2026, null]],
  "Martynas Pacevicius": [["Suduva", 2016, 2017], ["Jonava", 2017, 2020], ["Lietuvos Rytas", 2020, 2022], ["Pieno Zvaigzdes", 2022, 2023], ["Neptunas", 2023, 2026], ["Siauliai", 2026, null]],
  "Michael Caffey": [["Jaszbereny", 2015, 2016], ["Trikala", 2016, 2017], ["Helsinki Seagulls", 2017, 2018], ["BKM Lucenec", 2018, 2019], ["Zaporizhya", 2019, 2021], ["Kyiv Basket", 2021, 2022], ["MZT Skopje", 2022, 2023], ["Czarni Slupsk", 2023, 2024], ["CSO Voluntari", 2024, 2026], ["Siauliai", 2026, null]],
  "Rokas Civilis": [["Jyvaskyla", 2023, 2025], ["Siauliai", 2025, null]],
  "Selim Fofana": [["Union Neuchatel", 2018, 2022], ["KK Podgorica", 2022, 2023], ["Medi Bayreuth", 2023, 2024], ["Sopron", 2024, 2025], ["Corona Brasov", 2025, 2026], ["Siauliai", 2026, null]],
  "Simas Jarumbauskas": [["Perlas Vilnius", 2017, 2020], ["Prienai", 2020, 2021], ["Pieno Zvaigzdes", 2021, 2022], ["Caceres", 2022, 2023], ["Pieno Zvaigzdes", 2023, 2024], ["Jonava", 2024, 2025], ["BC Vienna", 2025, 2026], ["Siauliai", 2026, null]],
  "Tauras Jogela": [["Lietkabelis", 2012, 2013], ["Zalgiris Kaunas", 2013, 2014], ["Pieno Zvaigzdes", 2014, 2015], ["Arges Pitesti", 2015, 2016], ["Barons Riga", 2016, 2017], ["King Szczecin", 2017, 2019], ["Sopron", 2019, 2021], ["BC Vienna", 2021, 2022], ["Prienai", 2022, 2023], ["Jonava", 2023, 2024], ["Siauliai", 2024, 2025], ["Gornik Walbrzych", 2025, 2026], ["Siauliai", 2026, null]],
  // --- Skyliners Frankfurt (Pape: stale bio)
  "Isaiah Swope": [["Skyliners Frankfurt", 2025, null]],
  "Judah Mintz": [["Manisa BB", 2025, 2026], ["Skyliners Frankfurt", 2026, null]],
  "Nahiem Alleyne": [["AEK Athens", 2024, 2025], ["Skyliners Frankfurt", 2025, null]],
  "Race Thompson": [["Legia Warszawa", 2025, 2026], ["Skyliners Frankfurt", 2026, null]],
  "Roman Bedime": [["Rasta Vechta", 2022, 2024], ["Niners Chemnitz", 2024, 2026], ["Skyliners Frankfurt", 2026, null]],
  "Ryan Arcidiacono": [["Chicago Bulls", 2017, 2021], ["New York Knicks", 2021, 2024], ["Trapani Shark", 2025, 2026], ["Skyliners Frankfurt", 2026, null]],
  "Thomas Klepeisz": [["Gussing Knights", 2007, 2016], ["Braunschweig", 2016, 2020], ["Ratiopharm Ulm", 2019, 2026], ["Skyliners Frankfurt", 2026, null]],
  "Till Pape": [["Paderborn", 2014, 2015], ["Ratiopharm Ulm", 2016, 2017], ["Skyliners Frankfurt", 2026, null]],
  "William Christmas": [["Dragons Rhondorf", 2021, 2022], ["Artland Dragons", 2022, 2023], ["Hamburg Towers", 2023, 2024], ["Niners Chemnitz", 2024, 2025], ["Skyliners Frankfurt", 2025, null]],
  // --- Slask Wroclaw
  "Anthony Hickey": [["Asseco Prokom", 2015, 2016], ["Apollon Patras", 2016, 2017], ["Enosis Neon Paralimni", 2017, 2018], ["Spojnia Stargard", 2018, 2019], ["Skyliners Frankfurt", 2019, 2020], ["CSO Voluntari", 2020, 2021], ["Astana", 2021, 2022], ["Hapoel Haifa", 2022, 2023], ["Pallacanestro Cantu", 2023, 2024], ["Udine", 2024, 2026], ["Slask Wroclaw", 2026, null]],
  "Anthony Wrzeszcz": [["Slask Wroclaw", 2026, null]],
  "Blazej Czerniewicz": [["Zak Koszalin", 2023, 2024], ["Slask Wroclaw", 2024, null]],
  "Blazej Kulikowski": [["Trefl Sopot", 2019, 2020], ["Czarni Slupsk", 2020, 2022], ["Trefl Sopot", 2022, 2024], ["Slask Wroclaw", 2024, null]],
  "Devin Robinson": [["Washington Wizards", 2017, 2019], ["Taoyuan Pilots", 2021, 2022], ["Ratiopharm Ulm", 2022, 2023], ["Manresa", 2023, 2024], ["Cedevita Olimpija", 2024, 2025], ["Basket Zaragoza", 2025, 2026], ["Slask Wroclaw", 2026, null]],
  "Jakub Niziol": [["Legia Warszawa", 2019, 2020], ["Astoria Bydgoszcz", 2020, 2022], ["Slask Wroclaw", 2022, null]],
  "John Egbunu": [["KT Sonicboom", 2020, 2021], ["Varese", 2020, 2021], ["Hapoel Jerusalem", 2021, 2022], ["Gaziantep Basketbol", 2022, 2023], ["ASVEL", 2023, 2024], ["Shanghai Sharks", 2024, 2025], ["Ulsan Mobis", 2025, 2026], ["Slask Wroclaw", 2026, null]],
  "Malik Parsons": [["Bakken Bears", 2023, 2024], ["Skyliners Frankfurt", 2024, 2025], ["Bursaspor", 2025, 2026], ["Slask Wroclaw", 2026, null]],
  "Tymoteusz Sternicki": [["Slask Wroclaw", 2025, null]],
  // --- Tofas
  "Bryce Jones": [["Ulcinjska Riviera", 2018, 2019], ["Borac Cacak", 2019, 2021], ["FMP", 2021, 2022], ["Limoges", 2022, 2023], ["Cluj-Napoca", 2023, 2024], ["Igokea", 2024, 2025], ["Aris Thessaloniki", 2025, 2026], ["Tofas", 2026, null]],
  "Efe Postel": [["Tofas", 2025, null]],
  "Gabriel Brown": [["Varese", 2023, 2024], ["Trapani Shark", 2024, 2025], ["SIG Strasbourg", 2025, 2026], ["Tofas", 2026, null]],
  "Jamuni McNeace": [["Salon Vilpas", 2019, 2020], ["Crailsheim Merlins", 2020, 2021], ["Vanoli Cremona", 2021, 2022], ["Yalova", 2022, 2023], ["PAOK", 2023, 2024], ["Cholet Basket", 2024, 2026], ["Tofas", 2026, null]],
  "Leon Apaydin": [["Yesilgiresun", 2017, 2018], ["Besiktas", 2018, 2020], ["Afyon Belediyespor", 2020, 2021], ["Gaziantep Basketbol", 2021, 2023], ["Buyukcekmece Basketbol", 2023, 2024], ["Manisa BB", 2024, 2025], ["Mersin BB", 2025, 2026], ["Tofas", 2026, null]],
  "Sadik Kabaca": [["Bandirma Kirmizi", 2016, 2019], ["Banvit", 2019, 2020], ["Besiktas", 2020, 2021], ["Galatasaray", 2021, 2025], ["Basket Zaragoza", 2025, 2026], ["Tofas", 2026, null]],
  "Shavar Reynolds Jr.": [["Feyenoord", 2022, 2023], ["Keravnos", 2023, 2024], ["PAOK", 2024, 2025], ["London Lions", 2025, 2026], ["Tofas", 2026, null]],
  "Terrell Carter II": [["Island Storm", 2018, 2019], ["Anadolu Basket", 2019, 2020], ["Oliveirense", 2020, 2021], ["Steaua Bucuresti", 2021, 2022], ["Benfica", 2022, 2024], ["Igokea", 2024, 2025], ["Parma Perm", 2025, 2026], ["Tofas", 2026, null]],
  "Tre'Shawn Thurman": [["Oostende", 2022, 2023], ["BC Wolves", 2023, 2024], ["Esenler Erokspor", 2025, 2026], ["Tofas", 2026, null]],
  "Yigitcan Saybir": [["Anadolu Efes", 2017, 2022], ["Bursaspor", 2022, 2023], ["Turk Telekom", 2023, 2024], ["Tofas", 2024, null]],
  // --- Turk Telekom (Schneider: stale bio)
  "Anthony Lamb": [["Houston Rockets", 2020, 2021], ["San Antonio Spurs", 2021, 2022], ["Golden State Warriors", 2022, 2023], ["New Zealand Breakers", 2023, 2024], ["Trento", 2024, 2025], ["Hapoel Jerusalem", 2025, 2026], ["Turk Telekom", 2026, null]],
  "Ata Kahraman": [["Bahcesehir College", 2017, 2018], ["Bursaspor", 2018, 2019], ["Bornova Belediyesi", 2019, 2021], ["Besiktas", 2021, 2022], ["Manisa BB", 2022, 2023], ["Buyukcekmece Basketbol", 2023, 2025], ["Turk Telekom", 2025, null]],
  "Dogus Ozdemiroglu": [["Darussafaka", 2013, 2016], ["Yesilgiresun", 2016, 2017], ["Darussafaka", 2017, 2023], ["Anadolu Efes", 2023, 2025], ["Turk Telekom", 2025, null]],
  "Emircan Kosut": [["Pertevniyal", 2011, 2013], ["Anadolu Efes", 2013, 2016], ["Yesilgiresun", 2016, 2017], ["Darussafaka", 2017, 2021], ["Merkezefendi", 2021, 2022], ["Turk Telekom", 2022, 2023], ["Buyukcekmece Basketbol", 2023, 2025], ["Turk Telekom", 2025, null]],
  "Goktug Bas": [["Turk Telekom", 2020, 2021], ["Samsunspor", 2021, 2024], ["Bahcesehir College", 2024, 2026], ["Turk Telekom", 2026, null]],
  "Ismael Bako": [["Leuven Bears", 2012, 2017], ["Antwerp Giants", 2017, 2019], ["ASVEL", 2019, 2021], ["Manresa", 2021, 2022], ["Virtus Bologna", 2022, 2023], ["UNICS Kazan", 2023, 2025], ["Paris Basketball", 2025, 2026], ["Zenit St Petersburg", 2025, 2026], ["Turk Telekom", 2026, null]],
  "Jerrick Harding": [["Nymburk", 2020, 2022], ["Manresa", 2022, 2023], ["Andorra", 2023, 2025], ["Lietuvos Rytas", 2025, 2026], ["Turk Telekom", 2026, null]],
  "Kris Bankston": [["Aris Thessaloniki", 2023, 2024], ["Hapoel Beer Sheva", 2023, 2024], ["Tofas", 2024, 2025], ["Turk Telekom", 2025, null]],
  "Mete Tekcevik": [["Kolejliler", 2020, 2022], ["Kocaeli Kagitspor", 2022, 2024], ["Turk Telekom", 2024, null]],
  "Tim Schneider": [["Alba Berlin", 2016, 2017], ["Veltex Shizuoka", 2025, 2026], ["Turk Telekom", 2026, null]],
  "Tony Taylor": [["Turow Zgorzelec", 2013, 2015], ["Enisey Krasnoyarsk", 2015, 2017], ["Banvit", 2017, 2018], ["Virtus Bologna", 2018, 2019], ["Pinar Karsiyaka", 2019, 2022], ["Turk Telekom", 2022, 2023], ["Bahcesehir College", 2023, 2024], ["UNICS Kazan", 2024, 2025], ["Trabzonspor", 2025, 2026], ["Turk Telekom", 2026, null]],
  "Uros Trifunovic": [["Partizan", 2018, 2019], ["Mega", 2019, 2020], ["Partizan", 2019, 2024], ["Tofas", 2024, 2025], ["Maccabi Tel Aviv", 2025, 2026], ["Turk Telekom", 2026, null]],
  // --- Cluj-Napoca
  "Bobe Nicolescu": [["CSM Oradea", 2015, 2026], ["Cluj-Napoca", 2026, null]],
  "Christian Bishop": [["AEK Larnaca", 2023, 2024], ["Nymburk", 2024, 2025], ["Galatasaray", 2025, 2026], ["Cluj-Napoca", 2026, null]],
  "Dusan Beslac": [["Smederevo", 2015, 2016], ["Dynamic", 2016, 2020], ["Vojvodina", 2020, 2023], ["Avtodor Saratov", 2023, 2026], ["Cluj-Napoca", 2026, null]],
  "Jalyn McCreary": [["Rapla", 2024, 2025], ["Siroki", 2025, 2026], ["Cluj-Napoca", 2026, null]],
  "Javon Bess": [["Tindastoll", 2021, 2022], ["Gottingen", 2022, 2023], ["Wurzburg", 2023, 2024], ["Turk Telekom", 2024, 2025], ["Igokea", 2025, 2026], ["Cluj-Napoca", 2026, null]],
  "Javonte Smart": [["Milwaukee Bucks", 2021, 2022], ["Crvena Zvezda", 2023, 2024], ["Philadelphia 76ers", 2023, 2024], ["Cluj-Napoca", 2026, null]],
  "Kristian Kullamae": [["Audentes", 2014, 2016], ["Oettinger Rockets", 2016, 2018], ["Baunach Young Pikes", 2018, 2019], ["Real Canoe", 2019, 2020], ["Palma", 2020, 2021], ["San Pablo Burgos", 2021, 2022], ["Lietkabelis", 2022, 2023], ["Bilbao Basket", 2023, 2025], ["Lietkabelis", 2025, 2026], ["Cluj-Napoca", 2026, null]],
  "Malcolm Hill": [["Telekom Baskets Bonn", 2017, 2018], ["MHP Riesen Ludwigsburg", 2018, 2019], ["Astana", 2019, 2020], ["Hapoel Jerusalem", 2020, 2021], ["Atlanta Hawks", 2021, 2022], ["Chicago Bulls", 2022, 2023], ["New Orleans Pelicans", 2023, 2024], ["Cluj-Napoca", 2026, null]],
  "Otis Livingston II": [["Horsens IC", 2019, 2020], ["Kumanovo", 2020, 2021], ["Mladost Zemun", 2021, 2022], ["Crailsheim Merlins", 2022, 2023], ["Wurzburg", 2023, 2024], ["Galatasaray", 2024, 2025], ["Girona", 2025, 2026], ["Cluj-Napoca", 2026, null]],
  "Patrick Richard": [["Magixx Wijchen", 2013, 2014], ["Mitteldeutscher BC", 2014, 2015], ["Chalons-Reims", 2015, 2016], ["Maccabi Rishon LeZion", 2016, 2017], ["Joventut", 2017, 2018], ["New Zealand Breakers", 2018, 2019], ["Cluj-Napoca", 2019, null]],
  "Uros Plavsic": [["Smederevo", 2016, 2017], ["Mega", 2023, 2024], ["Crvena Zvezda", 2024, 2026], ["Cluj-Napoca", 2026, null]],
  // --- Reyer Venezia (Green, Grant: stale bios)
  "Amedeo Tessitori": [["Libertas Forli", 2012, 2013], ["Dinamo Sassari", 2013, 2014], ["Juve Caserta", 2014, 2015], ["Pallacanestro Cantu", 2015, 2016], ["Pallacanestro Biella", 2016, 2018], ["Treviso", 2018, 2020], ["Virtus Bologna", 2020, 2022], ["Reyer Venezia", 2022, null]],
  "Erick Green": [["Mens Sana Siena", 2013, 2014], ["Denver Nuggets", 2014, 2016], ["Olympiacos", 2016, 2017], ["Valencia", 2017, 2018], ["Fenerbahce", 2018, 2019], ["Real Betis", 2019, 2020], ["Bahcesehir College", 2020, 2021], ["Zhejiang Golden Bulls", 2021, 2022], ["Buducnost", 2022, 2023], ["Hapoel Holon", 2022, 2023], ["Reyer Venezia", 2026, null]],
  "Giga Janelidze": [["Assigeco Casalpusterlengo", 2012, 2013], ["Urania Milano", 2013, 2014], ["Roseto Sharks", 2014, 2015], ["Jesi", 2015, 2017], ["Pallacanestro Trieste", 2017, 2020], ["Avellino", 2020, 2021], ["Orzinuovi", 2021, 2022], ["Mantova", 2022, 2023], ["Reyer Venezia", 2023, null]],
  "Giovanni De Nicolao": [["Casale Monferrato", 2015, 2016], ["Fortitudo Agrigento", 2019, 2020], ["Varese", 2020, 2023], ["Napoli Basketball", 2023, 2025], ["Reyer Venezia", 2025, null]],
  "Jordan Parks": [["Pallacanestro Trieste", 2015, 2017], ["Telekom Baskets Bonn", 2017, 2018], ["Orlandina Basket", 2018, 2019], ["Treviso", 2019, 2020], ["Napoli Basketball", 2020, 2022], ["Reyer Venezia", 2022, null]],
  "Ky Bowman": [["Golden State Warriors", 2019, 2020], ["Brindisi", 2022, 2023], ["Treviso", 2023, 2025], ["Reyer Venezia", 2025, null]],
  "Kyle Wiltjer": [["Houston Rockets", 2016, 2017], ["Olympiacos", 2017, 2018], ["Unicaja", 2018, 2019], ["Turk Telekom", 2019, 2021], ["La Laguna Tenerife", 2021, 2022], ["Zhejiang Lions", 2022, 2023], ["Reyer Venezia", 2023, null]],
  "Leonardo Candi": [["Fortitudo Bologna", 2013, 2017], ["Pallacanestro Reggiana", 2017, 2022], ["Derthona Tortona", 2022, 2025], ["Reyer Venezia", 2025, null]],
  "Louis Olinde": [["Brose Bamberg", 2016, 2020], ["Alba Berlin", 2020, 2025], ["Manresa", 2025, 2026], ["Reyer Venezia", 2026, null]],
  "Sasha Grant": [["Bayern Munich", 2019, 2020], ["Reyer Venezia", 2026, null]],
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
  "Bodrumspor": "Cagdas Bodrumspor", "Orleans Loiret": "Orleans", "Pallacanestro Varese": "Varese",
  "BG Gottingen": "Gottingen", "Bayreuth": "Medi Bayreuth", "Ehingen Urspring": "Erdgas Ehingen", "Rockets Gotha": "Oettinger Rockets",
  "Scandone Avellino": "Avellino", "BC Nokia": "Nokia", "Jonava": "CBet Jonava", "KT Sonicboom": "Suwon KT Sonicboom", "Ulsan Mobis": "Mobis Phoebus",
  "Juve Caserta": "Juvecaserta", "Mens Sana Siena": "Montepaschi Siena", "Palma": "Palma Air Europa", "Parma Perm": "Parma Basket",
  "Yesilgiresun": "Yesilgiresun Belediye",
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
