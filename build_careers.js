/*
 * Builds careers.js — career timelines for the "Player ID" game (guess the player
 * from his clubs + years). Zero deps. Career data was researched from Wikipedia /
 * Proballers (clubs + season-span years; to:null = present for active players).
 *
 *   Run:  node build_careers.js   (idempotent; regenerates careers.js)
 *
 * Convention (like players.js / legends.js): NEVER hand-edit careers.js — edit the
 * RAW data below and re-run. Every name must already exist in PLAYERS or LEGENDS so
 * the Player ID autocomplete can resolve it; nationality/position/active are pulled
 * from there. A clean() pass drops loan / cup-of-coffee overlaps so each path reads
 * as a tidy chronological sequence.
 */
const fs = require("fs");
global.window = {};
require("./players.js");
require("./legends.js");
const PLAYERS = window.PLAYERS || [], LEGENDS = window.LEGENDS || [];

// Display-name normalisation so the same club reads consistently across careers.
const TEAM_FIX = {
  "Crvena zvezda": "Crvena Zvezda",
  "Valencia Basket": "Valencia",
  "Barcelona": "FC Barcelona",
  "Saski Baskonia": "Baskonia",
  "Lietuvos rytas": "Lietuvos Rytas",
  "Mens Sana Siena": "Montepaschi Siena",
  "Efes": "Anadolu Efes",
  "Efes Pilsen": "Anadolu Efes",
  "Unicaja Malaga": "Unicaja",
  "Malaga": "Unicaja",
  "Pamesa Valencia": "Valencia",
  "TAU Ceramica": "Tau Ceramica",
  "Fenerbahce Ulker": "Fenerbahce",
  "Monaco": "AS Monaco",
  "Zalgiris": "Zalgiris Kaunas",
  "ratiopharm Ulm": "Ratiopharm Ulm",
  "Pallacanestro Cantù": "Pallacanestro Cantu",
  "Cantù": "Pallacanestro Cantu",
  "Sidigas Avellino": "Avellino",
  "Málaga": "Unicaja",
  "Žalgiris Kaunas": "Zalgiris Kaunas",
  "Fenerbahçe": "Fenerbahce",
  "Budućnost": "Buducnost",
  "Murcia": "UCAM Murcia",
  "Strasbourg": "SIG Strasbourg",
  "LA Clippers": "Los Angeles Clippers",
  // Same club, sponsor-era name variants — one canonical spelling each, so
  // teammate edges (Path Between) and career displays never split a club.
  // (The Paris-Levallois → Levallois Metropolitans → Metropolitans 92 lineage
  // stays era-accurate here; pathbetween.js merges it for the graph.)
  "Elan Chalon": "Chalon",
  "JSF Nanterre": "Nanterre",
  "Nanterre 92": "Nanterre",
  "CB Estudiantes": "Estudiantes",
  "Antibes Sharks": "Antibes",
  "Joventut Badalona": "Joventut",
  "Buducnost Podgorica": "Buducnost",
  "Baxi Manresa": "Manresa",
  "Aquila Basket Trento": "Trento",
  "Benetton Treviso": "Treviso",
  "Pallacanestro Varese": "Varese",
  "Union Olimpija": "Olimpija Ljubljana",
  "Wollongong Hawks": "Illawarra Hawks",
  "Mega Vizura": "Mega", "Mega Basket": "Mega", "Mega Leks": "Mega",
  "Mega Bemax": "Mega", "Mega Soccerbet": "Mega", "Mega MIS": "Mega",
  // Same-club spelling variants introduced by the researched legends batch,
  // folded onto the spelling already used elsewhere in this file so one real
  // club never splits into two nodes (matters for The Grid / Path Between).
  "Brose Baskets": "Brose Bamberg",
  "Sevilla": "CB Sevilla",
  "Stefanel Milano": "Olimpia Milano",
  "BC Khimki": "Khimki",
  "Zaragoza": "Basket Zaragoza",
  "New Basket Brindisi": "Brindisi",
  "Reggio Emilia": "Pallacanestro Reggiana",
  "Reggiana": "Pallacanestro Reggiana",
  "Taugres": "Tau Ceramica",
  "Akasvayu Girona": "Girona",
  "CB Girona": "Girona",
  "CB Valladolid": "Forum Valladolid",
  "Blancos de Rueda Valladolid": "Forum Valladolid",
  "Il Messaggero Roma": "Virtus Roma",
  "Snaidero Udine": "Udine",
  "Olympique Antibes": "Antibes",
  "KK Zadar": "Zadar",
  "Orlandina": "Orlandina Basket",
  // Sponsor-era name variants folded to the canonical spelling used elsewhere
  // in this file (active-roster batch: Maccabi Tel Aviv + Fenerbahce).
  "Frutti Extra Bursaspor": "Bursaspor",
  "Coviran Granada": "Granada",
  "Lowen Braunschweig": "Braunschweig",
  "U-BT Cluj-Napoca": "Cluj-Napoca",
  "KK Nevezis": "Nevezis", "Nevezis Kedainiai": "Nevezis",
  // Batch 2 (Olimpia Milano + Panathinaikos) sponsor/variant folds.
  "Iberostar Tenerife": "CB Canarias", "Lenovo Tenerife": "CB Canarias",
  "Merkezefendi Denizli": "Merkezefendi Belediyesi", "Merkezefendi Denizli Basket": "Merkezefendi Belediyesi",
  "Zhejiang Guangsha Lions": "Zhejiang Lions", "Pallacanestro Udine": "Udine",
  "Aris Thessaloniki": "Aris",
  // Batch 3 (Anadolu Efes + Real Madrid) variant folds.
  "La Laguna Tenerife": "CB Canarias", "Iberostar Canarias": "CB Canarias",
  "Zenit St Petersburg": "Zenit Saint Petersburg", "CB Manresa": "Manresa",
  "Riesen Ludwigsburg": "MHP Riesen Ludwigsburg",
  "Basketball Lowen Braunschweig": "Braunschweig", "ALBA Berlin": "Alba Berlin"
};
function fixTeam(t) { t = String(t).trim(); return TEAM_FIX[t] || t; }

// --- Raw researched careers (senior pro clubs; from/to = season-span years) -----
const RAW = [
  // ===== Active (in PLAYERS) =====
  { name: "Mike James", career: [
    { team: "KK Zagreb", from: 2012, to: 2013 }, { team: "Hapoel Galil Elyon", from: 2013, to: 2013 },
    { team: "Paffoni Omegna", from: 2013, to: 2014 }, { team: "Kolossos Rodou", from: 2014, to: 2014 },
    { team: "Baskonia", from: 2014, to: 2016 }, { team: "Panathinaikos", from: 2016, to: 2017 },
    { team: "Phoenix Suns", from: 2017, to: 2018 }, { team: "New Orleans Pelicans", from: 2018, to: 2018 },
    { team: "Panathinaikos", from: 2018, to: 2018 }, { team: "Olimpia Milano", from: 2018, to: 2019 },
    { team: "CSKA Moscow", from: 2019, to: 2021 }, { team: "Brooklyn Nets", from: 2021, to: 2021 },
    { team: "AS Monaco", from: 2021, to: null } ] },
  { name: "Nando de Colo", career: [
    { team: "Cholet Basket", from: 2006, to: 2009 }, { team: "Valencia Basket", from: 2009, to: 2012 },
    { team: "San Antonio Spurs", from: 2012, to: 2014 }, { team: "Toronto Raptors", from: 2014, to: 2014 },
    { team: "CSKA Moscow", from: 2014, to: 2019 }, { team: "Fenerbahce", from: 2019, to: 2022 },
    { team: "ASVEL", from: 2022, to: 2025 }, { team: "Fenerbahce", from: 2025, to: null } ] },
  { name: "Nick Calathes", career: [
    { team: "Panathinaikos", from: 2009, to: 2012 }, { team: "Lokomotiv Kuban", from: 2012, to: 2013 },
    { team: "Memphis Grizzlies", from: 2013, to: 2015 }, { team: "Panathinaikos", from: 2015, to: 2020 },
    { team: "FC Barcelona", from: 2020, to: 2022 }, { team: "Fenerbahce", from: 2022, to: 2024 },
    { team: "AS Monaco", from: 2024, to: 2025 }, { team: "Partizan", from: 2025, to: null } ] },
  { name: "Vasilije Micic", career: [
    { team: "Mega Vizura", from: 2010, to: 2014 }, { team: "Bayern Munich", from: 2014, to: 2016 },
    { team: "Crvena zvezda", from: 2015, to: 2016 }, { team: "Tofas", from: 2016, to: 2017 },
    { team: "Zalgiris Kaunas", from: 2017, to: 2018 }, { team: "Anadolu Efes", from: 2018, to: 2023 },
    { team: "Oklahoma City Thunder", from: 2023, to: 2024 }, { team: "Charlotte Hornets", from: 2024, to: 2025 },
    { team: "Phoenix Suns", from: 2025, to: 2025 }, { team: "Hapoel Tel Aviv", from: 2025, to: null } ] },
  { name: "Shane Larkin", career: [
    { team: "Dallas Mavericks", from: 2013, to: 2014 }, { team: "New York Knicks", from: 2014, to: 2015 },
    { team: "Brooklyn Nets", from: 2015, to: 2016 }, { team: "Baskonia", from: 2016, to: 2017 },
    { team: "Boston Celtics", from: 2017, to: 2018 }, { team: "Anadolu Efes", from: 2018, to: null } ] },
  { name: "Nikola Mirotic", career: [
    { team: "Real Madrid", from: 2008, to: 2014 }, { team: "Chicago Bulls", from: 2014, to: 2018 },
    { team: "New Orleans Pelicans", from: 2018, to: 2019 }, { team: "Milwaukee Bucks", from: 2019, to: 2019 },
    { team: "FC Barcelona", from: 2019, to: 2023 }, { team: "Olimpia Milano", from: 2023, to: 2025 },
    { team: "AS Monaco", from: 2025, to: null } ] },
  { name: "Joffrey Lauvergne", career: [
    { team: "Elan Chalon", from: 2009, to: 2012 }, { team: "Valencia", from: 2012, to: 2012 },
    { team: "Partizan", from: 2012, to: 2014 }, { team: "Khimki", from: 2014, to: 2015 },
    { team: "Denver Nuggets", from: 2015, to: 2016 }, { team: "Oklahoma City Thunder", from: 2016, to: 2017 },
    { team: "Chicago Bulls", from: 2017, to: 2017 }, { team: "San Antonio Spurs", from: 2017, to: 2018 },
    { team: "Fenerbahce", from: 2018, to: 2020 }, { team: "Zalgiris Kaunas", from: 2020, to: 2022 },
    { team: "ASVEL", from: 2022, to: 2025 }, { team: "Kuwait SC", from: 2025, to: 2026 },
    { team: "Partizan", from: 2026, to: null } ] },
  { name: "Daniel Theis", career: [
    { team: "Phantoms Braunschweig", from: 2010, to: 2012 }, { team: "Ratiopharm Ulm", from: 2012, to: 2014 },
    { team: "Brose Bamberg", from: 2014, to: 2017 }, { team: "Boston Celtics", from: 2017, to: 2021 },
    { team: "Chicago Bulls", from: 2021, to: 2021 }, { team: "Houston Rockets", from: 2021, to: 2022 },
    { team: "Indiana Pacers", from: 2022, to: 2023 }, { team: "Los Angeles Clippers", from: 2023, to: 2024 },
    { team: "New Orleans Pelicans", from: 2024, to: 2025 }, { team: "AS Monaco", from: 2025, to: null } ] },
  { name: "Cedi Osman", career: [
    { team: "Anadolu Efes", from: 2011, to: 2017 }, { team: "Cleveland Cavaliers", from: 2017, to: 2023 },
    { team: "San Antonio Spurs", from: 2023, to: 2024 }, { team: "Panathinaikos", from: 2024, to: null } ] },
  { name: "Kostas Sloukas", career: [
    { team: "Olympiacos", from: 2008, to: 2015 }, { team: "Fenerbahce", from: 2015, to: 2020 },
    { team: "Olympiacos", from: 2020, to: 2023 }, { team: "Panathinaikos", from: 2023, to: null } ] },
  { name: "Evan Fournier", career: [
    { team: "JSF Nanterre", from: 2009, to: 2010 }, { team: "Poitiers Basket 86", from: 2010, to: 2012 },
    { team: "Denver Nuggets", from: 2012, to: 2014 }, { team: "Orlando Magic", from: 2014, to: 2021 },
    { team: "Boston Celtics", from: 2020, to: 2021 }, { team: "New York Knicks", from: 2021, to: 2024 },
    { team: "Detroit Pistons", from: 2023, to: 2024 }, { team: "Olympiacos", from: 2024, to: null } ] },
  { name: "Jan Vesely", career: [
    { team: "Geoplin Slovan", from: 2007, to: 2008 }, { team: "Partizan", from: 2008, to: 2011 },
    { team: "Washington Wizards", from: 2011, to: 2014 }, { team: "Denver Nuggets", from: 2013, to: 2014 },
    { team: "Fenerbahce", from: 2014, to: 2022 }, { team: "FC Barcelona", from: 2022, to: null } ] },
  { name: "Tomas Satoransky", career: [
    { team: "USK Praha", from: 2007, to: 2009 }, { team: "CB Sevilla", from: 2009, to: 2014 },
    { team: "FC Barcelona", from: 2014, to: 2016 }, { team: "Washington Wizards", from: 2016, to: 2019 },
    { team: "Chicago Bulls", from: 2019, to: 2021 }, { team: "New Orleans Pelicans", from: 2021, to: 2022 },
    { team: "San Antonio Spurs", from: 2021, to: 2022 }, { team: "Washington Wizards", from: 2021, to: 2022 },
    { team: "FC Barcelona", from: 2022, to: null } ] },
  { name: "Facundo Campazzo", career: [
    { team: "Penarol", from: 2008, to: 2014 }, { team: "Real Madrid", from: 2014, to: 2015 },
    { team: "UCAM Murcia", from: 2015, to: 2017 }, { team: "Real Madrid", from: 2017, to: 2020 },
    { team: "Denver Nuggets", from: 2020, to: 2022 }, { team: "Crvena zvezda", from: 2022, to: 2023 },
    { team: "Real Madrid", from: 2023, to: null } ] },
  { name: "Kostas Papanikolaou", career: [
    { team: "Aris", from: 2008, to: 2009 }, { team: "Olympiacos", from: 2009, to: 2013 },
    { team: "FC Barcelona", from: 2013, to: 2014 }, { team: "Houston Rockets", from: 2014, to: 2015 },
    { team: "Denver Nuggets", from: 2015, to: 2016 }, { team: "Olympiacos", from: 2016, to: null } ] },
  { name: "Tornike Shengelia", career: [
    { team: "Valencia", from: 2008, to: 2010 }, { team: "Spirou Charleroi", from: 2010, to: 2012 },
    { team: "Verviers-Pepinster", from: 2010, to: 2011 }, { team: "Brooklyn Nets", from: 2012, to: 2014 },
    { team: "Chicago Bulls", from: 2014, to: 2014 }, { team: "Baskonia", from: 2014, to: 2020 },
    { team: "CSKA Moscow", from: 2020, to: 2022 }, { team: "Virtus Bologna", from: 2022, to: 2025 },
    { team: "FC Barcelona", from: 2025, to: null } ] },
  { name: "Marko Guduric", career: [
    { team: "Crvena Zvezda", from: 2013, to: 2017 }, { team: "FMP", from: 2013, to: 2015 },
    { team: "Fenerbahce", from: 2017, to: 2019 }, { team: "Memphis Grizzlies", from: 2019, to: 2020 },
    { team: "Fenerbahce", from: 2020, to: 2025 }, { team: "Olimpia Milano", from: 2025, to: null } ] },
  { name: "Nemanja Nedovic", career: [
    { team: "Crvena Zvezda", from: 2008, to: 2012 }, { team: "Lietuvos rytas", from: 2012, to: 2013 },
    { team: "Golden State Warriors", from: 2013, to: 2014 }, { team: "Valencia", from: 2014, to: 2015 },
    { team: "Unicaja Malaga", from: 2015, to: 2018 }, { team: "Olimpia Milano", from: 2018, to: 2020 },
    { team: "Panathinaikos", from: 2020, to: 2022 }, { team: "Crvena Zvezda", from: 2022, to: 2025 },
    { team: "AS Monaco", from: 2025, to: null } ] },
  { name: "Mario Hezonja", career: [
    { team: "FC Barcelona", from: 2012, to: 2015 }, { team: "Orlando Magic", from: 2015, to: 2018 },
    { team: "New York Knicks", from: 2018, to: 2019 }, { team: "Portland Trail Blazers", from: 2019, to: 2020 },
    { team: "Panathinaikos", from: 2020, to: 2021 }, { team: "UNICS Kazan", from: 2021, to: 2022 },
    { team: "Real Madrid", from: 2022, to: null } ] },
  { name: "Kevin Punter", career: [
    { team: "Lavrio", from: 2016, to: 2017 }, { team: "Antwerp Giants", from: 2017, to: 2017 },
    { team: "Rosa Radom", from: 2017, to: 2018 }, { team: "AEK Athens", from: 2018, to: 2018 },
    { team: "Virtus Bologna", from: 2018, to: 2019 }, { team: "Crvena Zvezda", from: 2019, to: 2020 },
    { team: "Olimpia Milano", from: 2020, to: 2021 }, { team: "Partizan", from: 2021, to: 2024 },
    { team: "FC Barcelona", from: 2024, to: null } ] },
  { name: "Thomas Heurtel", career: [
    { team: "Pau-Orthez", from: 2007, to: 2009 }, { team: "ASVEL", from: 2009, to: 2011 },
    { team: "Baskonia", from: 2011, to: 2014 }, { team: "Anadolu Efes", from: 2014, to: 2017 },
    { team: "FC Barcelona", from: 2017, to: 2021 }, { team: "Real Madrid", from: 2021, to: 2022 },
    { team: "Zenit Saint Petersburg", from: 2022, to: 2024 }, { team: "Basquet Coruna", from: 2025, to: 2025 },
    { team: "ASVEL", from: 2025, to: null } ] },
  { name: "Alexandros Vezenkov", career: [
    { team: "Aris", from: 2011, to: 2015 }, { team: "FC Barcelona", from: 2015, to: 2018 },
    { team: "Olympiacos", from: 2018, to: 2023 }, { team: "Sacramento Kings", from: 2023, to: 2024 },
    { team: "Olympiacos", from: 2024, to: null } ] },
  { name: "Nikola Kalinic", career: [
    { team: "Vojvodina Srbijagas", from: 2011, to: 2013 }, { team: "Radnicki Kragujevac", from: 2013, to: 2014 },
    { team: "Crvena Zvezda", from: 2014, to: 2015 }, { team: "Fenerbahce", from: 2015, to: 2020 },
    { team: "Valencia", from: 2020, to: 2021 }, { team: "Crvena Zvezda", from: 2021, to: 2022 },
    { team: "FC Barcelona", from: 2022, to: 2024 }, { team: "Crvena Zvezda", from: 2024, to: null } ] },
  { name: "Daniel Hackett", career: [
    { team: "Treviso", from: 2009, to: 2010 }, { team: "Pesaro", from: 2010, to: 2012 },
    { team: "Mens Sana Siena", from: 2012, to: 2013 }, { team: "Olimpia Milano", from: 2013, to: 2015 },
    { team: "Olympiacos", from: 2015, to: 2017 }, { team: "Brose Bamberg", from: 2017, to: 2018 },
    { team: "CSKA Moscow", from: 2018, to: 2022 }, { team: "Virtus Bologna", from: 2022, to: null } ] },
  { name: "Rodrigue Beaubois", career: [
    { team: "Cholet Basket", from: 2006, to: 2009 }, { team: "Dallas Mavericks", from: 2009, to: 2013 },
    { team: "Le Mans", from: 2014, to: 2015 }, { team: "SIG Strasbourg", from: 2015, to: 2016 },
    { team: "Baskonia", from: 2016, to: 2018 }, { team: "Anadolu Efes", from: 2018, to: null } ] },
  { name: "Cory Joseph", career: [
    { team: "San Antonio Spurs", from: 2011, to: 2015 }, { team: "Toronto Raptors", from: 2015, to: 2017 },
    { team: "Indiana Pacers", from: 2017, to: 2019 }, { team: "Sacramento Kings", from: 2019, to: 2021 },
    { team: "Detroit Pistons", from: 2021, to: 2023 }, { team: "Golden State Warriors", from: 2023, to: 2024 },
    { team: "Orlando Magic", from: 2024, to: 2025 }, { team: "Olympiacos", from: 2025, to: null } ] },
  { name: "Will Clyburn", career: [
    { team: "Ratiopharm Ulm", from: 2013, to: 2015 }, { team: "Hapoel Holon", from: 2015, to: 2016 },
    { team: "Darussafaka", from: 2016, to: 2017 }, { team: "CSKA Moscow", from: 2017, to: 2022 },
    { team: "Anadolu Efes", from: 2022, to: 2024 }, { team: "Virtus Bologna", from: 2024, to: 2025 },
    { team: "FC Barcelona", from: 2025, to: null } ] },
  { name: "Wade Baldwin IV", career: [
    { team: "Memphis Grizzlies", from: 2016, to: 2017 }, { team: "Portland Trail Blazers", from: 2017, to: 2019 },
    { team: "Olympiacos", from: 2019, to: 2020 }, { team: "Bayern Munich", from: 2020, to: 2021 },
    { team: "Baskonia", from: 2021, to: 2022 }, { team: "Maccabi Tel Aviv", from: 2022, to: 2024 },
    { team: "Fenerbahce", from: 2024, to: null } ] },
  { name: "Mathias Lessort", career: [
    { team: "Chalon", from: 2014, to: 2016 }, { team: "Nanterre", from: 2016, to: 2017 },
    { team: "Crvena Zvezda", from: 2017, to: 2018 }, { team: "Malaga", from: 2018, to: 2019 },
    { team: "Bayern Munich", from: 2019, to: 2020 }, { team: "Monaco", from: 2020, to: 2021 },
    { team: "Partizan", from: 2021, to: 2023 }, { team: "Panathinaikos", from: 2023, to: null } ] },
  { name: "Stefan Jovic", career: [
    { team: "Sloga", from: 2010, to: 2012 }, { team: "Radnicki Kragujevac", from: 2012, to: 2014 },
    { team: "Crvena Zvezda", from: 2014, to: 2017 }, { team: "Bayern Munich", from: 2017, to: 2019 },
    { team: "Khimki", from: 2019, to: 2021 }, { team: "Panathinaikos", from: 2021, to: 2022 },
    { team: "Basket Zaragoza", from: 2022, to: 2023 }, { team: "Valencia", from: 2023, to: 2025 },
    { team: "Bayern Munich", from: 2025, to: null } ] },
  { name: "Vincent Poirier", career: [
    { team: "Paris-Levallois", from: 2012, to: 2017 }, { team: "Baskonia", from: 2017, to: 2019 },
    { team: "Boston Celtics", from: 2019, to: 2020 }, { team: "Philadelphia 76ers", from: 2020, to: 2021 },
    { team: "Real Madrid", from: 2021, to: 2024 }, { team: "Anadolu Efes", from: 2024, to: null } ] },
  { name: "Nigel Williams-Goss", career: [
    { team: "Partizan", from: 2017, to: 2018 }, { team: "Olympiacos", from: 2018, to: 2019 },
    { team: "Utah Jazz", from: 2019, to: 2020 }, { team: "Lokomotiv Kuban", from: 2020, to: 2021 },
    { team: "Real Madrid", from: 2021, to: 2023 }, { team: "Olympiacos", from: 2023, to: 2025 },
    { team: "Zalgiris", from: 2025, to: null } ] },
  { name: "Davis Bertans", career: [
    { team: "Olimpija Ljubljana", from: 2010, to: 2012 }, { team: "Partizan", from: 2012, to: 2014 },
    { team: "Baskonia", from: 2014, to: 2016 }, { team: "San Antonio Spurs", from: 2016, to: 2019 },
    { team: "Washington Wizards", from: 2019, to: 2022 }, { team: "Dallas Mavericks", from: 2022, to: 2023 },
    { team: "Oklahoma City Thunder", from: 2023, to: 2024 }, { team: "Dubai BC", from: 2024, to: null } ] },
  { name: "Dzanan Musa", career: [
    { team: "Cedevita", from: 2015, to: 2018 }, { team: "Brooklyn Nets", from: 2018, to: 2020 },
    { team: "Anadolu Efes", from: 2021, to: 2021 }, { team: "Rio Breogan", from: 2021, to: 2022 },
    { team: "Real Madrid", from: 2022, to: 2025 }, { team: "Dubai BC", from: 2025, to: null } ] },
  { name: "Klemen Prepelic", career: [
    { team: "Union Olimpija", from: 2012, to: 2013 }, { team: "Banvit", from: 2013, to: 2014 },
    { team: "Union Olimpija", from: 2014, to: 2015 }, { team: "Oldenburg", from: 2015, to: 2016 },
    { team: "Limoges", from: 2016, to: 2017 }, { team: "Levallois Metropolitans", from: 2017, to: 2018 },
    { team: "Real Madrid", from: 2018, to: 2020 }, { team: "Valencia", from: 2020, to: 2023 },
    { team: "Cedevita Olimpija", from: 2023, to: 2023 }, { team: "Galatasaray", from: 2023, to: 2024 },
    { team: "Dubai BC", from: 2024, to: null } ] },
  { name: "Vladimir Lucic", career: [
    { team: "FMP", from: 2006, to: 2008 }, { team: "Partizan", from: 2008, to: 2013 },
    { team: "Valencia", from: 2013, to: 2016 }, { team: "Bayern Munich", from: 2016, to: null } ] },
  { name: "Lorenzo Brown", career: [
    { team: "Philadelphia 76ers", from: 2013, to: 2014 }, { team: "Minnesota Timberwolves", from: 2014, to: 2015 },
    { team: "Phoenix Suns", from: 2015, to: 2016 }, { team: "Zhejiang Golden Bulls", from: 2016, to: 2017 },
    { team: "Toronto Raptors", from: 2017, to: 2019 }, { team: "Crvena Zvezda", from: 2019, to: 2020 },
    { team: "Fenerbahce", from: 2020, to: 2021 }, { team: "UNICS Kazan", from: 2021, to: 2022 },
    { team: "Maccabi Tel Aviv", from: 2022, to: 2024 }, { team: "Panathinaikos", from: 2024, to: 2025 },
    { team: "Olimpia Milano", from: 2025, to: null } ] },
  { name: "Edy Tavares", career: [
    { team: "Gran Canaria", from: 2009, to: 2015 }, { team: "Atlanta Hawks", from: 2015, to: 2016 },
    { team: "Cleveland Cavaliers", from: 2017, to: 2017 }, { team: "Real Madrid", from: 2017, to: null } ] },
  { name: "Theo Maledon", career: [
    { team: "ASVEL", from: 2017, to: 2020 }, { team: "Oklahoma City Thunder", from: 2020, to: 2022 },
    { team: "Charlotte Hornets", from: 2022, to: 2023 }, { team: "Phoenix Suns", from: 2023, to: 2024 },
    { team: "ASVEL", from: 2024, to: 2025 }, { team: "Real Madrid", from: 2025, to: null } ] },
  { name: "Gabriel Deck", career: [
    { team: "Quimsa", from: 2010, to: 2016 }, { team: "San Lorenzo", from: 2016, to: 2018 },
    { team: "Real Madrid", from: 2018, to: 2021 }, { team: "Oklahoma City Thunder", from: 2021, to: 2022 },
    { team: "Real Madrid", from: 2022, to: null } ] },
  { name: "Willy Hernangomez", career: [
    { team: "Real Madrid", from: 2013, to: 2016 }, { team: "CB Sevilla", from: 2013, to: 2015 },
    { team: "New York Knicks", from: 2016, to: 2018 }, { team: "Charlotte Hornets", from: 2018, to: 2020 },
    { team: "New Orleans Pelicans", from: 2020, to: 2023 }, { team: "FC Barcelona", from: 2023, to: null } ] },
  { name: "Nicolas Laprovittola", career: [
    { team: "Lanus", from: 2007, to: 2013 }, { team: "Flamengo", from: 2013, to: 2015 },
    { team: "Estudiantes", from: 2015, to: 2016 }, { team: "San Antonio Spurs", from: 2016, to: 2017 },
    { team: "Zenit Saint Petersburg", from: 2017, to: 2018 }, { team: "Joventut Badalona", from: 2018, to: 2019 },
    { team: "Real Madrid", from: 2019, to: 2021 }, { team: "FC Barcelona", from: 2021, to: null } ] },
  { name: "Kendrick Nunn", career: [
    { team: "Miami Heat", from: 2019, to: 2021 }, { team: "Los Angeles Lakers", from: 2021, to: 2023 },
    { team: "Washington Wizards", from: 2022, to: 2023 }, { team: "Panathinaikos", from: 2023, to: null } ] },
  { name: "Juancho Hernangomez", career: [
    { team: "CB Estudiantes", from: 2012, to: 2016 }, { team: "Denver Nuggets", from: 2016, to: 2020 },
    { team: "Minnesota Timberwolves", from: 2020, to: 2021 }, { team: "Boston Celtics", from: 2021, to: 2022 },
    { team: "Toronto Raptors", from: 2022, to: 2023 }, { team: "Panathinaikos", from: 2023, to: null } ] },
  { name: "Nigel Hayes-Davis", career: [
    { team: "Los Angeles Lakers", from: 2017, to: 2018 }, { team: "Galatasaray", from: 2018, to: 2019 },
    { team: "Zalgiris Kaunas", from: 2019, to: 2021 }, { team: "Barcelona", from: 2021, to: 2022 },
    { team: "Fenerbahce", from: 2022, to: 2025 }, { team: "Phoenix Suns", from: 2025, to: 2026 },
    { team: "Panathinaikos", from: 2026, to: null } ] },
  { name: "Thomas Walkup", career: [
    { team: "MHP Riesen Ludwigsburg", from: 2017, to: 2018 }, { team: "Zalgiris Kaunas", from: 2018, to: 2021 },
    { team: "Olympiacos", from: 2021, to: null } ] },
  { name: "Nikola Milutinov", career: [
    { team: "Hemofarm", from: 2011, to: 2012 }, { team: "Partizan", from: 2012, to: 2015 },
    { team: "Olympiacos", from: 2015, to: 2020 }, { team: "CSKA Moscow", from: 2020, to: 2023 },
    { team: "Olympiacos", from: 2023, to: null } ] },
  { name: "Nicolo Melli", career: [
    { team: "Pallacanestro Reggiana", from: 2007, to: 2010 }, { team: "Olimpia Milano", from: 2010, to: 2015 },
    { team: "Brose Bamberg", from: 2015, to: 2017 }, { team: "Fenerbahce", from: 2017, to: 2019 },
    { team: "New Orleans Pelicans", from: 2019, to: 2021 }, { team: "Olimpia Milano", from: 2021, to: 2024 },
    { team: "Fenerbahce", from: 2024, to: null } ] },
  { name: "Talen Horton-Tucker", career: [
    { team: "Los Angeles Lakers", from: 2019, to: 2022 }, { team: "Utah Jazz", from: 2022, to: 2024 },
    { team: "Chicago Bulls", from: 2024, to: 2025 }, { team: "Fenerbahce", from: 2025, to: null } ] },
  { name: "Isaia Cordinier", career: [
    { team: "Antibes Sharks", from: 2012, to: 2014 }, { team: "ALM Evreux", from: 2014, to: 2015 },
    { team: "Denain-Voltaire", from: 2015, to: 2016 }, { team: "Antibes Sharks", from: 2016, to: 2019 },
    { team: "Nanterre 92", from: 2019, to: 2021 }, { team: "Virtus Bologna", from: 2021, to: 2025 },
    { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Rolands Smits", career: [
    { team: "Fuenlabrada", from: 2012, to: 2018 }, { team: "FC Barcelona", from: 2018, to: 2022 },
    { team: "Zalgiris Kaunas", from: 2022, to: 2024 }, { team: "Anadolu Efes", from: 2024, to: null } ] },
  { name: "Elie Okobo", career: [
    { team: "Elan Bearnais", from: 2015, to: 2018 }, { team: "Phoenix Suns", from: 2018, to: 2020 },
    { team: "ASVEL", from: 2021, to: 2022 }, { team: "AS Monaco", from: 2022, to: null } ] },
  { name: "Shavon Shields", career: [
    { team: "Skyliners Frankfurt", from: 2016, to: 2017 }, { team: "Aquila Basket Trento", from: 2017, to: 2018 },
    { team: "Baskonia", from: 2018, to: 2020 }, { team: "Olimpia Milano", from: 2020, to: null } ] },
  { name: "Zach LeDay", career: [
    { team: "Hapoel Gilboa Galil", from: 2017, to: 2018 }, { team: "Olympiacos", from: 2018, to: 2019 },
    { team: "Zalgiris Kaunas", from: 2019, to: 2020 }, { team: "Olimpia Milano", from: 2020, to: 2021 },
    { team: "Partizan", from: 2021, to: 2024 }, { team: "Olimpia Milano", from: 2024, to: null } ] },

  // --- Valencia starting five ---
  { name: "Darius Thompson", career: [
    { team: "ZZ Leiden", from: 2017, to: 2019 }, { team: "Brindisi", from: 2019, to: 2021 },
    { team: "Lokomotiv Kuban", from: 2021, to: 2022 }, { team: "Baskonia", from: 2022, to: 2023 },
    { team: "Anadolu Efes", from: 2023, to: 2025 }, { team: "Valencia", from: 2025, to: null } ] },
  { name: "Jean Montero", career: [
    { team: "Gran Canaria", from: 2019, to: 2024 }, { team: "Valencia", from: 2024, to: null } ] },
  { name: "Xabier Lopez-Arostegui", career: [
    { team: "Joventut", from: 2015, to: 2021 }, { team: "Valencia", from: 2021, to: null } ] },
  { name: "Matt Costello", career: [
    { team: "San Antonio Spurs", from: 2017, to: 2018 }, { team: "Sidigas Avellino", from: 2018, to: 2019 },
    { team: "Gran Canaria", from: 2019, to: 2021 }, { team: "Baskonia", from: 2021, to: 2024 },
    { team: "Valencia", from: 2024, to: null } ] },
  { name: "Brancou Badio", career: [
    { team: "FC Barcelona", from: 2019, to: 2021 }, { team: "Skyliners Frankfurt", from: 2021, to: 2022 },
    { team: "Manresa", from: 2022, to: 2024 }, { team: "Valencia", from: 2024, to: null } ] },

  // --- Hapoel Tel Aviv starting five (Micic already above) ---
  { name: "Antonio Blakeney", career: [
    { team: "Chicago Bulls", from: 2017, to: 2019 }, { team: "Jiangsu Dragons", from: 2019, to: 2020 },
    { team: "Jiangsu Dragons", from: 2022, to: 2023 }, { team: "Nanjing Monkey Kings", from: 2023, to: 2024 },
    { team: "Hapoel Tel Aviv", from: 2024, to: null } ] },
  { name: "Elijah Bryant", career: [
    { team: "Hapoel Eilat", from: 2018, to: 2019 }, { team: "Maccabi Tel Aviv", from: 2019, to: 2021 },
    { team: "Milwaukee Bucks", from: 2021, to: 2021 }, { team: "Anadolu Efes", from: 2021, to: 2025 },
    { team: "Hapoel Tel Aviv", from: 2025, to: null } ] },
  { name: "Johnathan Motley", career: [
    { team: "Dallas Mavericks", from: 2017, to: 2018 }, { team: "Los Angeles Clippers", from: 2018, to: 2020 },
    { team: "Incheon ET Land Elephants", from: 2021, to: 2021 }, { team: "Lokomotiv Kuban", from: 2021, to: 2022 },
    { team: "Fenerbahce", from: 2022, to: 2024 }, { team: "Hapoel Tel Aviv", from: 2024, to: null } ] },
  { name: "Tyler Ennis", career: [
    { team: "Phoenix Suns", from: 2014, to: 2015 }, { team: "Milwaukee Bucks", from: 2015, to: 2016 },
    { team: "Houston Rockets", from: 2016, to: 2017 }, { team: "Los Angeles Lakers", from: 2017, to: 2018 },
    { team: "Fenerbahce", from: 2018, to: 2019 }, { team: "Turk Telekom", from: 2020, to: 2022 },
    { team: "Tofas", from: 2022, to: 2023 }, { team: "Napoli Basket", from: 2023, to: 2024 },
    { team: "Reyer Venezia", from: 2024, to: 2025 }, { team: "Hapoel Tel Aviv", from: 2025, to: null } ] },
  { name: "Yam Madar", career: [
    { team: "Hapoel Tel Aviv", from: 2018, to: 2021 }, { team: "Partizan", from: 2021, to: 2023 },
    { team: "Fenerbahce", from: 2023, to: 2024 }, { team: "Hapoel Tel Aviv", from: 2024, to: null } ] },

  // --- Crvena Zvezda starting five (Kalinic already above) ---
  { name: "Jordan Nwora", career: [
    { team: "Milwaukee Bucks", from: 2020, to: 2023 }, { team: "Indiana Pacers", from: 2023, to: 2024 },
    { team: "Anadolu Efes", from: 2024, to: 2025 }, { team: "Crvena Zvezda", from: 2025, to: null } ] },
  { name: "Jared Butler", career: [
    { team: "Utah Jazz", from: 2021, to: 2022 }, { team: "Oklahoma City Thunder", from: 2022, to: 2023 },
    { team: "Washington Wizards", from: 2023, to: 2025 }, { team: "Crvena Zvezda", from: 2025, to: null } ] },
  { name: "Semi Ojeleye", career: [
    { team: "Boston Celtics", from: 2017, to: 2021 }, { team: "Milwaukee Bucks", from: 2021, to: 2022 },
    { team: "Virtus Bologna", from: 2022, to: 2023 }, { team: "Valencia", from: 2023, to: 2025 },
    { team: "Crvena Zvezda", from: 2025, to: null } ] },
  { name: "Chris Jones", career: [
    { team: "Tuv Ajmag", from: 2015, to: 2016 }, { team: "Starwings Basel", from: 2016, to: 2017 },
    { team: "Mons-Hainaut", from: 2017, to: 2019 }, { team: "Bursaspor", from: 2019, to: 2020 },
    { team: "Maccabi Tel Aviv", from: 2020, to: 2021 }, { team: "ASVEL", from: 2021, to: 2022 },
    { team: "Valencia", from: 2022, to: 2025 }, { team: "Hapoel Tel Aviv", from: 2025, to: 2026 },
    { team: "Crvena Zvezda", from: 2026, to: null } ] },
  { name: "Tyson Carter", career: [
    { team: "Lavrio", from: 2020, to: 2021 }, { team: "Zenit Saint Petersburg", from: 2021, to: 2022 },
    { team: "Unicaja", from: 2022, to: 2025 }, { team: "Crvena Zvezda", from: 2025, to: null } ] },

  // --- Zalgiris ---
  { name: "Sylvain Francisco", career: [
    { team: "Metropolitans 92", from: 2017, to: 2018 }, { team: "Paris Basketball", from: 2018, to: 2020 },
    { team: "Chorale Roanne", from: 2020, to: 2021 }, { team: "Baxi Manresa", from: 2021, to: 2022 },
    { team: "Peristeri", from: 2022, to: 2023 }, { team: "Bayern Munich", from: 2023, to: 2024 },
    { team: "Zalgiris Kaunas", from: 2024, to: null } ] },
  { name: "Ignas Brazdeikis", career: [
    { team: "New York Knicks", from: 2019, to: 2021 }, { team: "Philadelphia 76ers", from: 2021, to: 2021 },
    { team: "Orlando Magic", from: 2021, to: 2022 }, { team: "Zalgiris Kaunas", from: 2022, to: 2023 },
    { team: "Olympiacos", from: 2023, to: 2024 }, { team: "Zalgiris Kaunas", from: 2024, to: null } ] },
  { name: "Maodo Lo", career: [
    { team: "Brose Bamberg", from: 2016, to: 2018 }, { team: "Bayern Munich", from: 2018, to: 2020 },
    { team: "Alba Berlin", from: 2020, to: 2023 }, { team: "Olimpia Milano", from: 2023, to: 2024 },
    { team: "Paris Basketball", from: 2024, to: 2025 }, { team: "Zalgiris Kaunas", from: 2025, to: null } ] },
  { name: "Moses Wright", career: [
    { team: "Zhejiang Golden Bulls", from: 2022, to: 2023 }, { team: "Shanxi Loongs", from: 2023, to: 2023 },
    { team: "Merkezefendi Belediyesi", from: 2023, to: 2024 }, { team: "Olympiacos", from: 2024, to: 2025 },
    { team: "Zalgiris Kaunas", from: 2025, to: null } ] },

  // --- Partizan ---
  { name: "Carlik Jones", career: [
    { team: "Dallas Mavericks", from: 2021, to: 2022 }, { team: "Chicago Bulls", from: 2022, to: 2023 },
    { team: "Zhejiang Golden Bulls", from: 2023, to: 2024 }, { team: "Partizan", from: 2024, to: null } ] },
  { name: "Shake Milton", career: [
    { team: "Philadelphia 76ers", from: 2018, to: 2023 }, { team: "Minnesota Timberwolves", from: 2023, to: 2024 },
    { team: "Los Angeles Lakers", from: 2024, to: 2025 }, { team: "Partizan", from: 2025, to: null } ] },
  { name: "Sterling Brown", career: [
    { team: "Milwaukee Bucks", from: 2017, to: 2020 }, { team: "Houston Rockets", from: 2020, to: 2021 },
    { team: "Dallas Mavericks", from: 2021, to: 2022 }, { team: "Alba Berlin", from: 2023, to: 2024 },
    { team: "Partizan", from: 2024, to: null } ] },
  { name: "Bruno Fernando", career: [
    { team: "Atlanta Hawks", from: 2019, to: 2021 }, { team: "Boston Celtics", from: 2021, to: 2022 },
    { team: "Houston Rockets", from: 2022, to: 2023 }, { team: "Atlanta Hawks", from: 2023, to: 2024 },
    { team: "Toronto Raptors", from: 2024, to: 2025 }, { team: "Partizan", from: 2025, to: null } ] },

  // --- Bayern Munich ---
  { name: "Andreas Obst", career: [
    { team: "Brose Bamberg", from: 2014, to: 2016 }, { team: "Giessen 46ers", from: 2016, to: 2017 },
    { team: "Oettinger Rockets", from: 2017, to: 2018 }, { team: "Monbus Obradoiro", from: 2018, to: 2019 },
    { team: "Ratiopharm Ulm", from: 2019, to: 2021 }, { team: "Bayern Munich", from: 2021, to: null } ] },
  { name: "Niels Giffey", career: [
    { team: "Alba Berlin", from: 2014, to: 2021 }, { team: "Zalgiris Kaunas", from: 2021, to: 2022 },
    { team: "UCAM Murcia", from: 2022, to: 2022 }, { team: "Bayern Munich", from: 2022, to: null } ] },
  { name: "Oscar da Silva", career: [
    { team: "Ludwigsburg", from: 2021, to: 2021 }, { team: "Alba Berlin", from: 2021, to: 2022 },
    { team: "FC Barcelona", from: 2022, to: 2024 }, { team: "Bayern Munich", from: 2024, to: null } ] },
  { name: "Rokas Jokubaitis", career: [
    { team: "Zalgiris", from: 2017, to: 2021 }, { team: "FC Barcelona", from: 2021, to: 2024 },
    { team: "Maccabi Tel Aviv", from: 2024, to: 2025 }, { team: "Bayern Munich", from: 2025, to: null } ] },

  // --- ASVEL ---
  { name: "Edwin Jackson", career: [
    { team: "ASVEL", from: 2007, to: 2014 }, { team: "Nanterre", from: 2008, to: 2009 },
    { team: "Rouen", from: 2009, to: 2010 }, { team: "Barcelona", from: 2014, to: 2015 },
    { team: "Málaga", from: 2015, to: 2016 }, { team: "Estudiantes", from: 2016, to: 2017 },
    { team: "Guangdong", from: 2017, to: 2018 }, { team: "Budućnost", from: 2018, to: 2019 },
    { team: "ASVEL", from: 2019, to: 2020 }, { team: "Estudiantes", from: 2020, to: 2022 },
    { team: "Menorca", from: 2022, to: 2023 }, { team: "ASVEL", from: 2023, to: null } ] },
  { name: "Shaquille Harrison", career: [
    { team: "Phoenix Suns", from: 2017, to: 2018 }, { team: "Chicago Bulls", from: 2018, to: 2020 },
    { team: "Utah Jazz", from: 2020, to: 2021 }, { team: "Brooklyn Nets", from: 2021, to: 2022 },
    { team: "Portland Trail Blazers", from: 2022, to: 2023 }, { team: "Memphis Grizzlies", from: 2023, to: 2024 },
    { team: "ASVEL", from: 2024, to: null } ] },
  { name: "David Lighty", career: [
    { team: "Cantù", from: 2011, to: 2011 }, { team: "Vanoli Cremona", from: 2011, to: 2012 },
    { team: "Nanterre", from: 2012, to: 2014 }, { team: "ASVEL", from: 2014, to: 2016 },
    { team: "Trento", from: 2016, to: 2017 }, { team: "ASVEL", from: 2017, to: null } ] },
  { name: "Melvin Ajinca", career: [
    { team: "Saint-Quentin", from: 2022, to: 2024 }, { team: "ASVEL", from: 2024, to: null } ] },

  // --- Virtus Bologna ---
  { name: "Carsen Edwards", career: [
    { team: "Boston Celtics", from: 2019, to: 2021 }, { team: "Detroit Pistons", from: 2022, to: 2022 },
    { team: "Fenerbahçe", from: 2022, to: 2023 }, { team: "Bayern Munich", from: 2023, to: 2025 },
    { team: "Virtus Bologna", from: 2025, to: null } ] },
  { name: "Luca Vildoza", career: [
    { team: "Quilmes", from: 2012, to: 2017 }, { team: "Baskonia", from: 2017, to: 2021 },
    { team: "Milwaukee Bucks", from: 2021, to: 2022 }, { team: "Crvena Zvezda", from: 2022, to: 2023 },
    { team: "Panathinaikos", from: 2023, to: 2024 }, { team: "Olympiacos", from: 2024, to: 2025 },
    { team: "Virtus Bologna", from: 2025, to: null } ] },
  { name: "Alen Smailagic", career: [
    { team: "Beko", from: 2017, to: 2018 }, { team: "Golden State Warriors", from: 2019, to: 2021 },
    { team: "Partizan", from: 2021, to: 2024 }, { team: "Žalgiris Kaunas", from: 2024, to: 2025 },
    { team: "Virtus Bologna", from: 2025, to: null } ] },

  // --- Baskonia ---
  { name: "Markus Howard", career: [
    { team: "Denver Nuggets", from: 2020, to: 2022 }, { team: "Baskonia", from: 2022, to: null } ] },
  { name: "Mamadi Diakite", career: [
    { team: "Milwaukee Bucks", from: 2020, to: 2021 }, { team: "Oklahoma City Thunder", from: 2021, to: 2022 },
    { team: "Cleveland Cavaliers", from: 2022, to: 2023 }, { team: "San Antonio Spurs", from: 2023, to: 2024 },
    { team: "Baskonia", from: 2025, to: null } ] },
  { name: "Rodions Kurucs", career: [
    { team: "VEF Riga", from: 2012, to: 2015 }, { team: "Barcelona", from: 2015, to: 2018 },
    { team: "Brooklyn Nets", from: 2018, to: 2021 }, { team: "Partizan", from: 2021, to: 2022 },
    { team: "Strasbourg", from: 2022, to: 2023 }, { team: "Murcia", from: 2023, to: 2025 },
    { team: "Baskonia", from: 2025, to: null } ] },
  { name: "Timothe Luwawu-Cabarrot", career: [
    { team: "Antibes", from: 2012, to: 2015 }, { team: "Mega", from: 2015, to: 2016 },
    { team: "Philadelphia 76ers", from: 2016, to: 2018 }, { team: "Oklahoma City Thunder", from: 2018, to: 2019 },
    { team: "Brooklyn Nets", from: 2019, to: 2021 }, { team: "Atlanta Hawks", from: 2021, to: 2022 },
    { team: "Olimpia Milano", from: 2022, to: 2023 }, { team: "ASVEL", from: 2023, to: 2024 },
    { team: "Baskonia", from: 2024, to: null } ] },

  // --- Dubai BC ---
  { name: "Filip Petrusev", career: [
    { team: "Mega Basket", from: 2020, to: 2021 }, { team: "Anadolu Efes", from: 2021, to: 2022 },
    { team: "Crvena Zvezda", from: 2022, to: 2023 }, { team: "Olympiacos", from: 2023, to: 2025 },
    { team: "Dubai BC", from: 2025, to: null } ] },
  { name: "Aleksa Avramovic", career: [
    { team: "Borac Cacak", from: 2013, to: 2014 }, { team: "OKK Beograd", from: 2014, to: 2015 },
    { team: "Borac Cacak", from: 2015, to: 2016 }, { team: "Pallacanestro Varese", from: 2016, to: 2019 },
    { team: "Unicaja", from: 2019, to: 2020 }, { team: "Estudiantes", from: 2020, to: 2021 },
    { team: "Partizan", from: 2021, to: 2024 }, { team: "CSKA Moscow", from: 2024, to: 2025 },
    { team: "Dubai BC", from: 2025, to: null } ] },
  { name: "Mfiondu Kabengele", career: [
    { team: "Los Angeles Clippers", from: 2019, to: 2020 }, { team: "Cleveland Cavaliers", from: 2020, to: 2021 },
    { team: "Boston Celtics", from: 2022, to: 2023 }, { team: "Reyer Venezia", from: 2023, to: 2025 },
    { team: "Dubai BC", from: 2025, to: null } ] },
  { name: "Dwayne Bacon", career: [
    { team: "Charlotte Hornets", from: 2017, to: 2020 }, { team: "Orlando Magic", from: 2020, to: 2021 },
    { team: "AS Monaco", from: 2021, to: 2022 }, { team: "Panathinaikos", from: 2022, to: 2023 },
    { team: "Shanghai Sharks", from: 2023, to: 2024 }, { team: "Zenit Saint Petersburg", from: 2024, to: 2025 },
    { team: "Dubai BC", from: 2025, to: null } ] },

  // --- Paris Basketball ---
  { name: "Nadir Hifi", career: [
    { team: "Le Portel", from: 2020, to: 2023 }, { team: "Paris Basketball", from: 2023, to: null } ] },
  { name: "Justin Robinson", career: [
    { team: "Washington Wizards", from: 2019, to: 2020 }, { team: "Detroit Pistons", from: 2021, to: 2022 },
    { team: "Illawarra Hawks", from: 2022, to: 2024 }, { team: "Breogan", from: 2024, to: 2024 },
    { team: "Trapani Shark", from: 2024, to: 2025 }, { team: "Paris Basketball", from: 2025, to: null } ] },
  { name: "Jared Rhoden", career: [
    { team: "Detroit Pistons", from: 2022, to: 2024 }, { team: "Charlotte Hornets", from: 2024, to: 2025 },
    { team: "Paris Basketball", from: 2025, to: null } ] },
  { name: "Lamar Stevens", career: [
    { team: "Cleveland Cavaliers", from: 2020, to: 2023 }, { team: "Boston Celtics", from: 2023, to: 2024 },
    { team: "Memphis Grizzlies", from: 2024, to: 2025 }, { team: "Paris Basketball", from: 2025, to: null } ] },

  // --- Maccabi Tel Aviv ---
  { name: "Gabriel Lundberg", career: [
    { team: "Falcon", from: 2013, to: 2014 }, { team: "Herlev Wolfpack", from: 2014, to: 2015 },
    { team: "Horsens IC", from: 2015, to: 2017 }, { team: "Manresa", from: 2017, to: 2019 },
    { team: "CB Canarias", from: 2019, to: 2020 }, { team: "Zielona Gora", from: 2020, to: 2021 },
    { team: "CSKA Moscow", from: 2021, to: 2022 }, { team: "Virtus Bologna", from: 2022, to: 2024 },
    { team: "Partizan", from: 2024, to: 2025 }, { team: "Maccabi Tel Aviv", from: 2025, to: null } ] },
  { name: "Lonnie Walker IV", career: [
    { team: "San Antonio Spurs", from: 2018, to: 2022 }, { team: "Los Angeles Lakers", from: 2022, to: 2023 },
    { team: "Brooklyn Nets", from: 2023, to: 2024 }, { team: "Zalgiris Kaunas", from: 2024, to: 2025 },
    { team: "Maccabi Tel Aviv", from: 2025, to: null } ] },
  { name: "Oshae Brissett", career: [
    { team: "Toronto Raptors", from: 2019, to: 2020 }, { team: "Indiana Pacers", from: 2020, to: 2023 },
    { team: "Boston Celtics", from: 2023, to: 2024 }, { team: "Philadelphia 76ers", from: 2024, to: 2025 },
    { team: "Maccabi Tel Aviv", from: 2025, to: null } ] },
  { name: "John DiBartolomeo", career: [
    { team: "Palma Air Europa", from: 2013, to: 2015 }, { team: "Maccabi Haifa", from: 2015, to: 2017 },
    { team: "Maccabi Tel Aviv", from: 2017, to: null } ] },
  { name: "Jaylen Hoard", career: [
    { team: "Portland Trail Blazers", from: 2019, to: 2020 }, { team: "Oklahoma City Thunder", from: 2020, to: 2022 },
    { team: "Hapoel Tel Aviv", from: 2022, to: 2024 }, { team: "Maccabi Tel Aviv", from: 2024, to: null } ] },
  { name: "Roman Sorkin", career: [
    { team: "Maccabi Haifa", from: 2018, to: 2021 }, { team: "Maccabi Tel Aviv", from: 2021, to: null } ] },
  { name: "Will Rayman", career: [
    { team: "Tartu", from: 2020, to: 2020 }, { team: "Gottingen", from: 2020, to: 2020 },
    { team: "Ventspils", from: 2020, to: 2021 }, { team: "Hapoel Haifa", from: 2021, to: 2023 },
    { team: "Saint-Quentin", from: 2023, to: 2024 }, { team: "Maccabi Tel Aviv", from: 2024, to: null } ] },
  { name: "TJ Leaf", career: [
    { team: "Indiana Pacers", from: 2017, to: 2020 }, { team: "Oklahoma City Thunder", from: 2020, to: 2021 },
    { team: "Guangzhou Loong Lions", from: 2022, to: 2022 }, { team: "Beijing Ducks", from: 2022, to: 2024 },
    { team: "Nanjing Monkey Kings", from: 2024, to: 2025 }, { team: "Maccabi Tel Aviv", from: 2025, to: null } ] },
  { name: "Tamir Blatt", career: [
    { team: "Ramat HaSharon", from: 2014, to: 2015 }, { team: "Hapoel Tel Aviv", from: 2015, to: 2017 },
    { team: "Hapoel Holon", from: 2017, to: 2018 }, { team: "Hapoel Jerusalem", from: 2018, to: 2021 },
    { team: "Alba Berlin", from: 2021, to: 2023 }, { team: "Maccabi Tel Aviv", from: 2023, to: null } ] },
  { name: "Gur Lavy", career: [
    { team: "Hapoel Haifa", from: 2020, to: 2021 }, { team: "Ironi Kiryat Ata", from: 2021, to: 2022 },
    { team: "Hapoel Haifa", from: 2022, to: 2024 }, { team: "Hapoel Gilboa Galil", from: 2024, to: 2025 },
    { team: "Maccabi Tel Aviv", from: 2025, to: null } ] },
  { name: "Jimmy Clark III", career: [
    { team: "Bnei Herzliya", from: 2024, to: 2025 }, { team: "Maccabi Tel Aviv", from: 2025, to: null } ] },
  { name: "Marcio Santos", career: [
    { team: "Franca", from: 2018, to: 2024 }, { team: "Ratiopharm Ulm", from: 2024, to: 2025 },
    { team: "Maccabi Tel Aviv", from: 2025, to: null } ] },
  { name: "Amit Ebo", career: [
    { team: "Hapoel Eilat", from: 2017, to: 2018 }, { team: "Maccabi Rishon LeZion", from: 2018, to: 2019 },
    { team: "Maccabi Ashdod", from: 2019, to: 2020 }, { team: "Ironi Ness Ziona", from: 2020, to: 2021 },
    { team: "Hapoel Ramat Gan", from: 2021, to: 2022 }, { team: "Ramat HaSharon", from: 2022, to: 2023 },
    { team: "Komarno", from: 2023, to: 2024 }, { team: "Nevezis", from: 2024, to: 2025 },
    { team: "Boulazac", from: 2025, to: 2026 }, { team: "Maccabi Tel Aviv", from: 2026, to: null } ] },
  { name: "Zach Hankins", career: [
    { team: "Nymburk", from: 2019, to: 2020 }, { team: "Maccabi Rishon LeZion", from: 2020, to: 2021 },
    { team: "Hapoel Jerusalem", from: 2022, to: 2024 }, { team: "Cluj-Napoca", from: 2024, to: 2025 },
    { team: "Granada", from: 2025, to: 2025 }, { team: "Maccabi Tel Aviv", from: 2025, to: null } ] },

  // --- Fenerbahce ---
  { name: "Khem Birch", career: [
    { team: "Usak Sportif", from: 2015, to: 2016 }, { team: "Olympiacos", from: 2016, to: 2017 },
    { team: "Orlando Magic", from: 2017, to: 2021 }, { team: "Toronto Raptors", from: 2021, to: 2023 },
    { team: "Girona", from: 2023, to: 2024 }, { team: "Fenerbahce", from: 2024, to: null } ] },
  { name: "Metecan Birsen", career: [
    { team: "Eskisehir Basket", from: 2014, to: 2015 }, { team: "Istanbul BB", from: 2015, to: 2017 },
    { team: "Sakarya BB", from: 2017, to: 2018 }, { team: "Anadolu Efes", from: 2018, to: 2019 },
    { team: "Pinar Karsiyaka", from: 2019, to: 2021 }, { team: "Fenerbahce", from: 2021, to: null } ] },
  { name: "Melih Mahmutoglu", career: [
    { team: "Pertevniyal", from: 2007, to: 2008 }, { team: "Darussafaka", from: 2008, to: 2010 },
    { team: "Galatasaray", from: 2010, to: 2011 }, { team: "Antalya BB", from: 2011, to: 2012 },
    { team: "Erdemirspor", from: 2012, to: 2013 }, { team: "Fenerbahce", from: 2013, to: null } ] },
  { name: "Brandon Boston Jr.", career: [
    { team: "Los Angeles Clippers", from: 2021, to: 2024 }, { team: "New Orleans Pelicans", from: 2024, to: 2025 },
    { team: "Fenerbahce", from: 2025, to: null } ] },
  { name: "Tarik Biberovic", career: [
    { team: "OKK Spars", from: 2016, to: 2018 }, { team: "Fenerbahce", from: 2018, to: null } ] },
  { name: "Onuralp Bitim", career: [
    { team: "Anadolu Efes", from: 2017, to: 2019 }, { team: "Pinar Karsiyaka", from: 2019, to: 2021 },
    { team: "Bursaspor", from: 2021, to: 2023 }, { team: "Chicago Bulls", from: 2023, to: 2024 },
    { team: "Bayern Munich", from: 2024, to: 2025 }, { team: "Fenerbahce", from: 2025, to: null } ] },
  { name: "Mikael Jantunen", career: [
    { team: "Helsinki Seagulls", from: 2016, to: 2019 }, { team: "Oostende", from: 2021, to: 2022 },
    { team: "Treviso", from: 2022, to: 2023 }, { team: "Paris Basketball", from: 2023, to: 2025 },
    { team: "Fenerbahce", from: 2025, to: null } ] },
  { name: "Devon Hall", career: [
    { team: "Cairns Taipans", from: 2018, to: 2019 }, { team: "Oklahoma City Thunder", from: 2019, to: 2020 },
    { team: "Brose Bamberg", from: 2020, to: 2021 }, { team: "Olimpia Milano", from: 2021, to: 2024 },
    { team: "Fenerbahce", from: 2024, to: null } ] },
  { name: "Chris Silva", career: [
    { team: "Miami Heat", from: 2019, to: 2021 }, { team: "Bnei Herzliya", from: 2024, to: 2025 },
    { team: "AEK Athens", from: 2025, to: 2026 }, { team: "Fenerbahce", from: 2026, to: null } ] },
  { name: "Arturs Zagars", career: [
    { team: "Joventut", from: 2017, to: 2018 }, { team: "CB Prat", from: 2018, to: 2019 },
    { team: "Joventut", from: 2019, to: 2022 }, { team: "Nevezis", from: 2022, to: 2023 },
    { team: "BC Wolves", from: 2023, to: 2024 }, { team: "Fenerbahce", from: 2024, to: null } ] },
  { name: "Bonzie Colson", career: [
    { team: "Milwaukee Bucks", from: 2018, to: 2019 }, { team: "Darussafaka", from: 2019, to: 2020 },
    { team: "SIG Strasbourg", from: 2020, to: 2021 }, { team: "Pinar Karsiyaka", from: 2021, to: 2022 },
    { team: "Maccabi Tel Aviv", from: 2022, to: 2024 }, { team: "Fenerbahce", from: 2024, to: null } ] },

  // --- Olimpia Milano ---
  { name: "Vlatko Cancar", career: [
    { team: "LTH Castings", from: 2014, to: 2015 }, { team: "Olimpija Ljubljana", from: 2015, to: 2016 },
    { team: "Mega", from: 2016, to: 2018 }, { team: "San Pablo Burgos", from: 2018, to: 2019 },
    { team: "Denver Nuggets", from: 2019, to: 2025 }, { team: "Olimpia Milano", from: 2025, to: null } ] },
  { name: "Devin Booker", career: [
    { team: "SLUC Nancy", from: 2013, to: 2013 }, { team: "JL Bourg-en-Bresse", from: 2013, to: 2015 },
    { team: "Chalon", from: 2015, to: 2016 }, { team: "Bayern Munich", from: 2016, to: 2019 },
    { team: "Khimki", from: 2019, to: 2021 }, { team: "Fenerbahce", from: 2021, to: 2023 },
    { team: "Bayern Munich", from: 2023, to: 2025 }, { team: "Olimpia Milano", from: 2025, to: null } ] },
  { name: "Bryant Dunston", career: [
    { team: "Mobis Phoebus", from: 2009, to: 2010 }, { team: "Aris", from: 2010, to: 2011 },
    { team: "Bnei Herzliya", from: 2011, to: 2011 }, { team: "Hapoel Holon", from: 2011, to: 2012 },
    { team: "Varese", from: 2012, to: 2013 }, { team: "Olympiacos", from: 2013, to: 2015 },
    { team: "Anadolu Efes", from: 2015, to: 2023 }, { team: "Virtus Bologna", from: 2023, to: 2024 },
    { team: "Zalgiris Kaunas", from: 2024, to: 2025 }, { team: "Olimpia Milano", from: 2025, to: null } ] },
  { name: "Stefano Tonut", career: [
    { team: "Pallacanestro Trieste", from: 2012, to: 2015 }, { team: "Reyer Venezia", from: 2015, to: 2022 },
    { team: "Olimpia Milano", from: 2022, to: null } ] },
  { name: "Giampaolo Ricci", career: [
    { team: "Stella Azzurra Roma", from: 2009, to: 2011 }, { team: "Assigeco Casalpusterlengo", from: 2011, to: 2015 },
    { team: "Scaligera Verona", from: 2015, to: 2016 }, { team: "Derthona Basket", from: 2016, to: 2017 },
    { team: "Vanoli Cremona", from: 2017, to: 2019 }, { team: "Virtus Bologna", from: 2019, to: 2021 },
    { team: "Olimpia Milano", from: 2021, to: null } ] },
  { name: "Nico Mannion", career: [
    { team: "Golden State Warriors", from: 2020, to: 2021 }, { team: "Virtus Bologna", from: 2021, to: 2023 },
    { team: "Baskonia", from: 2023, to: 2024 }, { team: "Olimpia Milano", from: 2024, to: null } ] },
  { name: "Leandro Bolmaro", career: [
    { team: "Estudiantes de Bahia Blanca", from: 2017, to: 2018 }, { team: "FC Barcelona", from: 2018, to: 2021 },
    { team: "Minnesota Timberwolves", from: 2021, to: 2022 }, { team: "Utah Jazz", from: 2022, to: 2023 },
    { team: "Bayern Munich", from: 2023, to: 2024 }, { team: "Olimpia Milano", from: 2024, to: null } ] },
  { name: "Armoni Brooks", career: [
    { team: "Houston Rockets", from: 2020, to: 2022 }, { team: "Brooklyn Nets", from: 2023, to: 2024 },
    { team: "Olimpia Milano", from: 2024, to: null } ] },
  { name: "Diego Flaccadori", career: [
    { team: "Trento", from: 2014, to: 2019 }, { team: "Bayern Munich", from: 2019, to: 2021 },
    { team: "Trento", from: 2021, to: 2023 }, { team: "Olimpia Milano", from: 2023, to: null } ] },
  { name: "Josh Nebo", career: [
    { team: "Hapoel Eilat", from: 2020, to: 2021 }, { team: "Zalgiris Kaunas", from: 2021, to: 2022 },
    { team: "Maccabi Tel Aviv", from: 2022, to: 2024 }, { team: "Olimpia Milano", from: 2024, to: null } ] },
  { name: "Ousmane Diop", career: [
    { team: "Udine", from: 2016, to: 2018 }, { team: "Dinamo Cagliari", from: 2018, to: 2019 },
    { team: "Basket Torino", from: 2019, to: 2021 }, { team: "Dinamo Sassari", from: 2021, to: 2024 },
    { team: "Olimpia Milano", from: 2024, to: null } ] },
  { name: "Nate Sestina", career: [
    { team: "Kyiv-Basket", from: 2020, to: 2020 }, { team: "Nizhny Novgorod", from: 2020, to: 2021 },
    { team: "Hapoel Holon", from: 2021, to: 2021 }, { team: "Merkezefendi Belediyesi", from: 2021, to: 2022 },
    { team: "Turk Telekom", from: 2022, to: 2023 }, { team: "Fenerbahce", from: 2023, to: 2024 },
    { team: "Valencia", from: 2024, to: 2025 }, { team: "Olimpia Milano", from: 2025, to: null } ] },

  // --- Panathinaikos ---
  { name: "Kenneth Faried", career: [
    { team: "Denver Nuggets", from: 2011, to: 2018 }, { team: "Brooklyn Nets", from: 2018, to: 2019 },
    { team: "Zhejiang Lions", from: 2019, to: 2020 }, { team: "CSKA Moscow", from: 2021, to: 2022 },
    { team: "Pallacanestro Reggiana", from: 2024, to: 2025 }, { team: "Panathinaikos", from: 2025, to: null } ] },
  { name: "Richaun Holmes", career: [
    { team: "Philadelphia 76ers", from: 2015, to: 2018 }, { team: "Phoenix Suns", from: 2018, to: 2019 },
    { team: "Sacramento Kings", from: 2019, to: 2023 }, { team: "Dallas Mavericks", from: 2023, to: 2024 },
    { team: "Washington Wizards", from: 2024, to: 2025 }, { team: "Panathinaikos", from: 2025, to: null } ] },
  { name: "Jerian Grant", career: [
    { team: "New York Knicks", from: 2015, to: 2016 }, { team: "Chicago Bulls", from: 2016, to: 2018 },
    { team: "Orlando Magic", from: 2018, to: 2019 }, { team: "Washington Wizards", from: 2020, to: 2020 },
    { team: "Promitheas Patras", from: 2020, to: 2021 }, { team: "Olimpia Milano", from: 2021, to: 2022 },
    { team: "Turk Telekom", from: 2022, to: 2023 }, { team: "Panathinaikos", from: 2023, to: null } ] },
  { name: "T.J. Shorts", career: [
    { team: "Ventspils", from: 2019, to: 2020 }, { team: "Hamburg Towers", from: 2020, to: 2021 },
    { team: "Crailsheim Merlins", from: 2021, to: 2022 }, { team: "Telekom Baskets Bonn", from: 2022, to: 2023 },
    { team: "Paris Basketball", from: 2023, to: 2025 }, { team: "Panathinaikos", from: 2025, to: null } ] },
  { name: "Marius Grigonis", career: [
    { team: "Penas Huesca", from: 2013, to: 2014 }, { team: "Manresa", from: 2014, to: 2016 },
    { team: "CB Canarias", from: 2016, to: 2017 }, { team: "Alba Berlin", from: 2017, to: 2018 },
    { team: "Zalgiris Kaunas", from: 2018, to: 2021 }, { team: "CSKA Moscow", from: 2021, to: 2022 },
    { team: "Panathinaikos", from: 2022, to: null } ] },
  { name: "Dinos Mitoglou", career: [
    { team: "Aris", from: 2013, to: 2014 }, { team: "Panathinaikos", from: 2017, to: 2021 },
    { team: "Olimpia Milano", from: 2021, to: 2022 }, { team: "Panathinaikos", from: 2023, to: null } ] },
  { name: "Ioannis Kouzeloglou", career: [
    { team: "Partizan", from: 2014, to: 2015 }, { team: "Apollon Patras", from: 2015, to: 2017 },
    { team: "Lavrio", from: 2017, to: 2020 }, { team: "Aris", from: 2020, to: 2021 },
    { team: "AEK Athens", from: 2021, to: 2022 }, { team: "Lavrio", from: 2022, to: 2023 },
    { team: "AEK Athens", from: 2023, to: 2025 }, { team: "Panathinaikos", from: 2025, to: null } ] },
  { name: "Vassilis Toliopoulos", career: [
    { team: "Ikaros Kallitheas", from: 2013, to: 2014 }, { team: "Kolossos Rodou", from: 2014, to: 2015 },
    { team: "Olympiacos", from: 2015, to: 2019 }, { team: "AEK Athens", from: 2019, to: 2021 },
    { team: "PAOK", from: 2021, to: 2022 }, { team: "Aris", from: 2022, to: 2025 },
    { team: "Panathinaikos", from: 2025, to: null } ] },
  { name: "Panagiotis Kalaitzakis", career: [
    { team: "Aris", from: 2016, to: 2018 }, { team: "Holargos", from: 2018, to: 2019 },
    { team: "Nevezis", from: 2019, to: 2021 }, { team: "Lietkabelis", from: 2021, to: 2022 },
    { team: "Panathinaikos", from: 2022, to: null } ] },
  { name: "Nikos Rogkavopoulos", career: [
    { team: "Doukas", from: 2016, to: 2017 }, { team: "AEK Athens", from: 2017, to: 2021 },
    { team: "Promitheas Patras", from: 2021, to: 2022 }, { team: "Merkezefendi Belediyesi", from: 2022, to: 2023 },
    { team: "Baskonia", from: 2023, to: 2025 }, { team: "Panathinaikos", from: 2025, to: null } ] },
  { name: "Alexandros Samodurov", career: [
    { team: "Panathinaikos", from: 2022, to: 2023 }, { team: "Panerythraikos", from: 2023, to: 2024 },
    { team: "Panathinaikos", from: 2024, to: null } ] },

  // --- Anadolu Efes ---
  { name: "Georgios Papagiannis", career: [
    { team: "Peristeri", from: 2011, to: 2013 }, { team: "Panathinaikos", from: 2014, to: 2016 },
    { team: "Sacramento Kings", from: 2016, to: 2017 }, { team: "Portland Trail Blazers", from: 2017, to: 2018 },
    { team: "Panathinaikos", from: 2018, to: 2023 }, { team: "Fenerbahce", from: 2023, to: 2024 },
    { team: "AS Monaco", from: 2024, to: 2025 }, { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Cole Swider", career: [
    { team: "Los Angeles Lakers", from: 2022, to: 2023 }, { team: "Miami Heat", from: 2023, to: 2024 },
    { team: "Detroit Pistons", from: 2024, to: 2025 }, { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Kai Jones", career: [
    { team: "Charlotte Hornets", from: 2021, to: 2023 }, { team: "Los Angeles Clippers", from: 2024, to: 2025 },
    { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "P.J. Dozier", career: [
    { team: "Oklahoma City Thunder", from: 2017, to: 2018 }, { team: "Boston Celtics", from: 2018, to: 2019 },
    { team: "Denver Nuggets", from: 2019, to: 2022 }, { team: "Sacramento Kings", from: 2022, to: 2023 },
    { team: "Partizan", from: 2023, to: 2024 }, { team: "Minnesota Timberwolves", from: 2024, to: 2025 },
    { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Saben Lee", career: [
    { team: "Detroit Pistons", from: 2020, to: 2022 }, { team: "Philadelphia 76ers", from: 2022, to: 2023 },
    { team: "Phoenix Suns", from: 2023, to: 2024 }, { team: "Olympiacos", from: 2024, to: 2025 },
    { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Jordan Loyd", career: [
    { team: "Hapoel Eilat", from: 2017, to: 2018 }, { team: "Toronto Raptors", from: 2018, to: 2019 },
    { team: "Valencia", from: 2019, to: 2020 }, { team: "Crvena Zvezda", from: 2020, to: 2021 },
    { team: "Zenit Saint Petersburg", from: 2021, to: 2022 }, { team: "AS Monaco", from: 2022, to: 2025 },
    { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Nick Weiler-Babb", career: [
    { team: "MHP Riesen Ludwigsburg", from: 2019, to: 2020 }, { team: "Bayern Munich", from: 2020, to: 2025 },
    { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Sehmus Hazer", career: [
    { team: "Banvit", from: 2017, to: 2019 }, { team: "Teksut Bandirma", from: 2019, to: 2020 },
    { team: "Besiktas", from: 2020, to: 2021 }, { team: "Fenerbahce", from: 2021, to: 2024 },
    { team: "Bahcesehir Koleji", from: 2024, to: 2025 }, { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Burak Can Yildizli", career: [
    { team: "Pertevniyal", from: 2012, to: 2015 }, { team: "Buyukcekmece Basketbol", from: 2015, to: 2018 },
    { team: "Besiktas", from: 2018, to: 2020 }, { team: "Bahcesehir Koleji", from: 2020, to: 2021 },
    { team: "Pinar Karsiyaka", from: 2021, to: 2022 }, { team: "Besiktas", from: 2022, to: 2023 },
    { team: "Anadolu Efes", from: 2023, to: null } ] },
  { name: "David Mutaf", career: [
    { team: "Gran Canaria II", from: 2020, to: 2022 }, { team: "Gran Canaria", from: 2022, to: 2023 },
    { team: "Bursaspor", from: 2023, to: 2025 }, { team: "Anadolu Efes", from: 2025, to: null } ] },
  { name: "Ercan Osmani", career: [
    { team: "Bandirma Kirmizi", from: 2014, to: 2018 }, { team: "Teksut Bandirma", from: 2018, to: 2020 },
    { team: "Besiktas", from: 2020, to: 2022 }, { team: "Darussafaka", from: 2022, to: 2023 },
    { team: "Anadolu Efes", from: 2023, to: null } ] },
  { name: "Erkan Yilmaz", career: [
    { team: "Antalyaspor", from: 2013, to: 2015 }, { team: "Banvit", from: 2015, to: 2016 },
    { team: "Bandirma Kirmizi", from: 2016, to: 2017 }, { team: "Yesilgiresun Belediye", from: 2017, to: 2018 },
    { team: "Yeni Mamak", from: 2018, to: 2019 }, { team: "Bandirma", from: 2019, to: 2020 },
    { team: "Bahcesehir Koleji", from: 2020, to: 2022 }, { team: "Turk Telekom", from: 2022, to: 2023 },
    { team: "Anadolu Efes", from: 2023, to: null } ] },
  { name: "Brice Dessert", career: [
    { team: "Rouen", from: 2021, to: 2022 }, { team: "Ada Blois", from: 2022, to: 2024 },
    { team: "SIG Strasbourg", from: 2024, to: 2025 }, { team: "Anadolu Efes", from: 2025, to: null } ] },

  // --- Real Madrid ---
  { name: "Trey Lyles", career: [
    { team: "Utah Jazz", from: 2015, to: 2017 }, { team: "Denver Nuggets", from: 2017, to: 2019 },
    { team: "San Antonio Spurs", from: 2019, to: 2021 }, { team: "Detroit Pistons", from: 2021, to: 2022 },
    { team: "Sacramento Kings", from: 2022, to: 2025 }, { team: "Real Madrid", from: 2025, to: null } ] },
  { name: "Alex Len", career: [
    { team: "BC Dnipro", from: 2010, to: 2011 }, { team: "Phoenix Suns", from: 2013, to: 2018 },
    { team: "Atlanta Hawks", from: 2018, to: 2020 }, { team: "Sacramento Kings", from: 2020, to: 2020 },
    { team: "Toronto Raptors", from: 2020, to: 2021 }, { team: "Washington Wizards", from: 2021, to: 2021 },
    { team: "Sacramento Kings", from: 2021, to: 2025 }, { team: "Los Angeles Lakers", from: 2025, to: 2025 },
    { team: "Real Madrid", from: 2025, to: null } ] },
  { name: "Omer Yurtseven", career: [
    { team: "Fenerbahce", from: 2014, to: 2016 }, { team: "Miami Heat", from: 2021, to: 2023 },
    { team: "Utah Jazz", from: 2023, to: 2024 }, { team: "Panathinaikos", from: 2024, to: 2026 },
    { team: "Real Madrid", from: 2026, to: null } ] },
  { name: "Chuma Okeke", career: [
    { team: "Orlando Magic", from: 2020, to: 2024 }, { team: "Philadelphia 76ers", from: 2024, to: 2025 },
    { team: "Real Madrid", from: 2025, to: null } ] },
  { name: "Usman Garuba", career: [
    { team: "Real Madrid", from: 2018, to: 2021 }, { team: "Houston Rockets", from: 2021, to: 2023 },
    { team: "Golden State Warriors", from: 2023, to: 2024 }, { team: "Real Madrid", from: 2024, to: null } ] },
  { name: "Sergio Llull", career: [
    { team: "Manresa", from: 2005, to: 2007 }, { team: "Real Madrid", from: 2007, to: null } ] },
  { name: "Alberto Abalde", career: [
    { team: "Joventut", from: 2013, to: 2017 }, { team: "Valencia", from: 2017, to: 2020 },
    { team: "Real Madrid", from: 2020, to: null } ] },
  { name: "Andres Feliz", career: [
    { team: "CB Prat", from: 2020, to: 2021 }, { team: "Joventut", from: 2021, to: 2024 },
    { team: "Real Madrid", from: 2024, to: null } ] },
  { name: "Gabriele Procida", career: [
    { team: "Pallacanestro Cantu", from: 2019, to: 2021 }, { team: "Fortitudo Bologna", from: 2021, to: 2022 },
    { team: "Alba Berlin", from: 2022, to: 2025 }, { team: "Real Madrid", from: 2025, to: null } ] },
  { name: "Mady Sissoko", career: [
    { team: "Pallacanestro Trieste", from: 2025, to: 2026 }, { team: "Real Madrid", from: 2026, to: null } ] },
  { name: "David Kramer", career: [
    { team: "Oberwart Gunners", from: 2013, to: 2014 }, { team: "Ratiopharm Ulm", from: 2014, to: 2019 },
    { team: "Bayern Munich", from: 2020, to: 2021 }, { team: "Braunschweig", from: 2021, to: 2023 },
    { team: "Granada", from: 2023, to: 2024 }, { team: "CB Canarias", from: 2024, to: 2025 },
    { team: "Real Madrid", from: 2025, to: null } ] },
  { name: "Izan Almansa", career: [
    { team: "Overtime Elite", from: 2021, to: 2023 }, { team: "G League Ignite", from: 2023, to: 2024 },
    { team: "Perth Wildcats", from: 2024, to: 2025 }, { team: "Real Madrid", from: 2025, to: null } ] },

  // ===== Retired legends (in LEGENDS) =====
  { name: "Arvydas Sabonis", career: [
    { team: "Zalgiris Kaunas", from: 1981, to: 1989 }, { team: "Forum Valladolid", from: 1989, to: 1992 },
    { team: "Real Madrid", from: 1992, to: 1995 }, { team: "Portland Trail Blazers", from: 1995, to: 2001 },
    { team: "Zalgiris Kaunas", from: 2001, to: 2002 }, { team: "Portland Trail Blazers", from: 2002, to: 2003 },
    { team: "Zalgiris Kaunas", from: 2003, to: 2004 } ] },
  { name: "Sarunas Jasikevicius", career: [
    { team: "Lietuvos rytas", from: 1998, to: 1999 }, { team: "Union Olimpija", from: 1999, to: 2000 },
    { team: "Barcelona", from: 2000, to: 2003 }, { team: "Maccabi Tel Aviv", from: 2003, to: 2005 },
    { team: "Indiana Pacers", from: 2005, to: 2007 }, { team: "Golden State Warriors", from: 2007, to: 2007 },
    { team: "Panathinaikos", from: 2007, to: 2010 }, { team: "Lietuvos rytas", from: 2010, to: 2011 },
    { team: "Fenerbahce", from: 2011, to: 2011 }, { team: "Panathinaikos", from: 2011, to: 2012 },
    { team: "Barcelona", from: 2012, to: 2013 }, { team: "Zalgiris Kaunas", from: 2013, to: 2014 } ] },
  { name: "Dejan Bodiroga", career: [
    { team: "Zadar", from: 1990, to: 1991 }, { team: "Stefanel Trieste", from: 1992, to: 1994 },
    { team: "Olimpia Milano", from: 1994, to: 1996 }, { team: "Real Madrid", from: 1996, to: 1998 },
    { team: "Panathinaikos", from: 1998, to: 2002 }, { team: "Barcelona", from: 2002, to: 2005 },
    { team: "Lottomatica Roma", from: 2005, to: 2007 } ] },
  { name: "Theodoros Papaloukas", career: [
    { team: "Dafni", from: 1997, to: 1999 }, { team: "Panionios", from: 1999, to: 2001 },
    { team: "Olympiacos", from: 2001, to: 2002 }, { team: "CSKA Moscow", from: 2002, to: 2008 },
    { team: "Olympiacos", from: 2008, to: 2011 }, { team: "Maccabi Tel Aviv", from: 2011, to: 2012 },
    { team: "CSKA Moscow", from: 2012, to: 2013 } ] },
  { name: "Vassilis Spanoulis", career: [
    { team: "Maroussi", from: 2001, to: 2005 }, { team: "Panathinaikos", from: 2005, to: 2006 },
    { team: "Houston Rockets", from: 2006, to: 2007 }, { team: "Panathinaikos", from: 2007, to: 2010 },
    { team: "Olympiacos", from: 2010, to: 2021 } ] },
  { name: "Manu Ginobili", career: [
    { team: "Andino de La Rioja", from: 1995, to: 1996 }, { team: "Estudiantes de Bahia Blanca", from: 1996, to: 1998 },
    { team: "Viola Reggio Calabria", from: 1998, to: 2000 }, { team: "Virtus Bologna", from: 2000, to: 2002 },
    { team: "San Antonio Spurs", from: 2002, to: 2018 } ] },
  { name: "Pau Gasol", career: [
    { team: "FC Barcelona", from: 1998, to: 2001 }, { team: "Memphis Grizzlies", from: 2001, to: 2008 },
    { team: "Los Angeles Lakers", from: 2008, to: 2014 }, { team: "Chicago Bulls", from: 2014, to: 2016 },
    { team: "San Antonio Spurs", from: 2016, to: 2019 }, { team: "Milwaukee Bucks", from: 2019, to: 2019 },
    { team: "Portland Trail Blazers", from: 2019, to: 2019 }, { team: "FC Barcelona", from: 2021, to: 2021 } ] },
  { name: "Luis Scola", career: [
    { team: "Ferro Carril Oeste", from: 1995, to: 1998 }, { team: "Tau Ceramica", from: 1998, to: 2007 },
    { team: "Houston Rockets", from: 2007, to: 2012 },
    { team: "Phoenix Suns", from: 2012, to: 2013 }, { team: "Indiana Pacers", from: 2013, to: 2015 },
    { team: "Toronto Raptors", from: 2015, to: 2016 }, { team: "Brooklyn Nets", from: 2016, to: 2017 },
    { team: "Shanxi Brave Dragons", from: 2017, to: 2018 }, { team: "Shanghai Sharks", from: 2018, to: 2019 },
    { team: "Olimpia Milano", from: 2019, to: 2020 }, { team: "Pallacanestro Varese", from: 2020, to: 2021 } ] },
  { name: "Sergio Rodriguez", career: [
    { team: "Estudiantes", from: 2003, to: 2006 }, { team: "Portland Trail Blazers", from: 2006, to: 2009 },
    { team: "Sacramento Kings", from: 2009, to: 2010 }, { team: "New York Knicks", from: 2010, to: 2010 },
    { team: "Real Madrid", from: 2010, to: 2016 }, { team: "Philadelphia 76ers", from: 2016, to: 2017 },
    { team: "CSKA Moscow", from: 2017, to: 2019 }, { team: "Olimpia Milano", from: 2019, to: 2022 },
    { team: "Real Madrid", from: 2022, to: 2024 } ] },
  { name: "Milos Teodosic", career: [
    { team: "FMP", from: 2004, to: 2007 }, { team: "Borac Cacak", from: 2005, to: 2006 },
    { team: "Olympiacos", from: 2007, to: 2011 }, { team: "CSKA Moscow", from: 2011, to: 2017 },
    { team: "Los Angeles Clippers", from: 2017, to: 2019 }, { team: "Virtus Bologna", from: 2019, to: 2023 },
    { team: "Crvena zvezda", from: 2023, to: 2025 } ] },
  { name: "Marco Belinelli", career: [
    { team: "Virtus Bologna", from: 2002, to: 2003 }, { team: "Fortitudo Bologna", from: 2003, to: 2007 },
    { team: "Golden State Warriors", from: 2007, to: 2009 }, { team: "Toronto Raptors", from: 2009, to: 2010 },
    { team: "New Orleans Hornets", from: 2010, to: 2012 }, { team: "Chicago Bulls", from: 2012, to: 2013 },
    { team: "San Antonio Spurs", from: 2013, to: 2015 }, { team: "Sacramento Kings", from: 2015, to: 2016 },
    { team: "Charlotte Hornets", from: 2016, to: 2017 }, { team: "Atlanta Hawks", from: 2017, to: 2018 },
    { team: "Philadelphia 76ers", from: 2018, to: 2018 }, { team: "San Antonio Spurs", from: 2018, to: 2020 },
    { team: "Virtus Bologna", from: 2020, to: 2025 } ] },
  { name: "Andrei Kirilenko", career: [
    { team: "Spartak St. Petersburg", from: 1997, to: 1998 }, { team: "CSKA Moscow", from: 1998, to: 2001 },
    { team: "Partizan", from: 2001, to: 2001 }, { team: "Utah Jazz", from: 2001, to: 2011 },
    { team: "CSKA Moscow", from: 2011, to: 2012 }, { team: "Minnesota Timberwolves", from: 2012, to: 2013 },
    { team: "Brooklyn Nets", from: 2013, to: 2014 }, { team: "CSKA Moscow", from: 2015, to: 2015 } ] },
  { name: "Tiago Splitter", career: [
    { team: "Ipiranga", from: 1999, to: 2000 }, { team: "Saski Baskonia", from: 2000, to: 2001 },
    { team: "Bilbao Basket", from: 2001, to: 2003 }, { team: "Saski Baskonia", from: 2003, to: 2010 },
    { team: "San Antonio Spurs", from: 2010, to: 2015 }, { team: "Atlanta Hawks", from: 2015, to: 2017 },
    { team: "Philadelphia 76ers", from: 2017, to: 2017 } ] },
  { name: "Predrag Danilovic", career: [
    { team: "Partizan", from: 1988, to: 1992 }, { team: "Virtus Bologna", from: 1992, to: 1995 },
    { team: "Miami Heat", from: 1995, to: 1997 }, { team: "Dallas Mavericks", from: 1997, to: 1997 },
    { team: "Virtus Bologna", from: 1997, to: 2000 } ] },
  { name: "Ioannis Bourousis", career: [
    { team: "AEK Athens", from: 2001, to: 2006 }, { team: "Olympiacos", from: 2006, to: 2011 },
    { team: "Olimpia Milano", from: 2011, to: 2013 }, { team: "Real Madrid", from: 2013, to: 2015 },
    { team: "Baskonia", from: 2015, to: 2016 }, { team: "Panathinaikos", from: 2016, to: 2017 },
    { team: "Zhejiang Lions", from: 2017, to: 2019 }, { team: "Gran Canaria", from: 2019, to: 2020 },
    { team: "Peristeri", from: 2020, to: 2021 }, { team: "ASK Karditsa", from: 2021, to: 2022 } ] },
  { name: "Rudy Fernandez", career: [
    { team: "Joventut Badalona", from: 2002, to: 2008 }, { team: "Portland Trail Blazers", from: 2008, to: 2011 },
    { team: "Denver Nuggets", from: 2011, to: 2012 }, { team: "Real Madrid", from: 2012, to: 2024 } ] },
  { name: "Nenad Krstic", career: [
    { team: "Partizan", from: 2000, to: 2004 }, { team: "New Jersey Nets", from: 2004, to: 2008 },
    { team: "Oklahoma City Thunder", from: 2008, to: 2011 }, { team: "CSKA Moscow", from: 2011, to: 2014 },
    { team: "Anadolu Efes", from: 2014, to: 2016 } ] },
  { name: "Marko Jaric", career: [
    { team: "Radnicki Belgrade", from: 1995, to: 1996 }, { team: "Peristeri", from: 1996, to: 1998 },
    { team: "Fortitudo Bologna", from: 1998, to: 2000 }, { team: "Virtus Bologna", from: 2000, to: 2002 },
    { team: "Los Angeles Clippers", from: 2002, to: 2005 }, { team: "Minnesota Timberwolves", from: 2005, to: 2008 },
    { team: "Memphis Grizzlies", from: 2008, to: 2009 }, { team: "Real Madrid", from: 2009, to: 2010 },
    { team: "Montepaschi Siena", from: 2010, to: 2011 } ] },
  { name: "Igor Rakocevic", career: [
    { team: "Crvena Zvezda", from: 1994, to: 2000 }, { team: "Buducnost", from: 2000, to: 2002 },
    { team: "Minnesota Timberwolves", from: 2002, to: 2003 }, { team: "Crvena Zvezda", from: 2003, to: 2004 },
    { team: "Valencia", from: 2004, to: 2005 }, { team: "Real Madrid", from: 2005, to: 2006 },
    { team: "Baskonia", from: 2006, to: 2009 }, { team: "Anadolu Efes", from: 2009, to: 2011 },
    { team: "Montepaschi Siena", from: 2011, to: 2012 }, { team: "Crvena Zvezda", from: 2012, to: 2013 } ] },
  { name: "Ramunas Siskauskas", career: [
    { team: "Sakalai Vilnius", from: 1996, to: 1998 }, { team: "Lietuvos Rytas", from: 1998, to: 2004 },
    { team: "Benetton Treviso", from: 2004, to: 2006 }, { team: "Panathinaikos", from: 2006, to: 2007 },
    { team: "CSKA Moscow", from: 2007, to: 2012 } ] },
  { name: "Jorge Garbajosa", career: [
    { team: "Baskonia", from: 1994, to: 2000 }, { team: "Benetton Treviso", from: 2000, to: 2004 },
    { team: "Unicaja", from: 2004, to: 2006 }, { team: "Toronto Raptors", from: 2006, to: 2008 },
    { team: "Khimki", from: 2008, to: 2009 }, { team: "Real Madrid", from: 2009, to: 2011 },
    { team: "Unicaja", from: 2011, to: 2012 } ] },
  { name: "Mirsad Turkcan", career: [
    { team: "Anadolu Efes", from: 1994, to: 1999 }, { team: "New York Knicks", from: 1999, to: 2000 },
    { team: "Anadolu Efes", from: 2000, to: 2001 }, { team: "CSKA Moscow", from: 2001, to: 2002 },
    { team: "Montepaschi Siena", from: 2002, to: 2003 }, { team: "CSKA Moscow", from: 2003, to: 2004 },
    { team: "Dynamo Moscow", from: 2004, to: 2005 }, { team: "Ulkerspor", from: 2005, to: 2006 },
    { team: "Fenerbahce", from: 2006, to: 2012 } ] },
  { name: "Trajan Langdon", career: [
    { team: "Cleveland Cavaliers", from: 1999, to: 2002 }, { team: "Benetton Treviso", from: 2002, to: 2003 },
    { team: "Anadolu Efes", from: 2003, to: 2004 }, { team: "Dynamo Moscow", from: 2004, to: 2005 },
    { team: "CSKA Moscow", from: 2005, to: 2011 } ] },
  { name: "Nikola Vujcic", career: [
    { team: "KK Split", from: 1995, to: 2001 }, { team: "Maccabi Tel Aviv", from: 2001, to: 2008 },
    { team: "Olympiacos", from: 2008, to: 2010 }, { team: "Anadolu Efes", from: 2010, to: 2011 },
    { team: "KK Split", from: 2011, to: 2013 } ] },
  { name: "Bo McCalebb", career: [
    { team: "Mersin BB", from: 2008, to: 2009 }, { team: "Partizan", from: 2009, to: 2010 },
    { team: "Montepaschi Siena", from: 2010, to: 2012 }, { team: "Fenerbahce", from: 2012, to: 2014 },
    { team: "Bayern Munich", from: 2014, to: 2015 }, { team: "Limoges CSP", from: 2016, to: 2016 },
    { team: "Gran Canaria", from: 2016, to: 2017 }, { team: "Basket Zaragoza", from: 2017, to: 2019 } ] },
  { name: "Jaka Lakovic", career: [
    { team: "Geoplin Slovan", from: 1996, to: 2001 }, { team: "Krka", from: 2001, to: 2002 },
    { team: "Panathinaikos", from: 2002, to: 2006 }, { team: "FC Barcelona", from: 2006, to: 2011 },
    { team: "Galatasaray", from: 2011, to: 2013 }, { team: "Avellino", from: 2013, to: 2014 },
    { team: "Royal Hali Gaziantep", from: 2014, to: 2015 }, { team: "FC Barcelona B", from: 2015, to: 2016 } ] },
  { name: "Nikos Zisis", career: [
    { team: "AEK Athens", from: 2000, to: 2005 }, { team: "Benetton Treviso", from: 2005, to: 2007 },
    { team: "CSKA Moscow", from: 2007, to: 2009 }, { team: "Montepaschi Siena", from: 2009, to: 2012 },
    { team: "Bilbao Basket", from: 2012, to: 2013 }, { team: "UNICS Kazan", from: 2013, to: 2014 },
    { team: "Fenerbahce", from: 2014, to: 2015 }, { team: "Brose Bamberg", from: 2015, to: 2019 },
    { team: "Joventut Badalona", from: 2019, to: 2020 }, { team: "AEK Athens", from: 2020, to: 2021 } ] },
  { name: "Antonis Fotsis", career: [
    { team: "Ilysiakos", from: 1996, to: 1997 }, { team: "Panathinaikos", from: 1997, to: 2001 },
    { team: "Memphis Grizzlies", from: 2001, to: 2002 }, { team: "Panathinaikos", from: 2002, to: 2003 },
    { team: "Real Madrid", from: 2003, to: 2005 }, { team: "Dynamo Moscow", from: 2005, to: 2008 },
    { team: "Panathinaikos", from: 2008, to: 2011 }, { team: "Olimpia Milano", from: 2011, to: 2013 },
    { team: "Panathinaikos", from: 2013, to: 2017 }, { team: "Ilysiakos", from: 2017, to: 2019 } ] },
  { name: "Dejan Tomasevic", career: [
    { team: "Borac Cacak", from: 1990, to: 1991 }, { team: "Crvena Zvezda", from: 1991, to: 1995 },
    { team: "Partizan", from: 1995, to: 1999 }, { team: "Buducnost Podgorica", from: 1999, to: 2001 },
    { team: "TAU Ceramica", from: 2001, to: 2002 }, { team: "Pamesa Valencia", from: 2002, to: 2005 },
    { team: "Panathinaikos", from: 2005, to: 2008 }, { team: "PAOK", from: 2008, to: 2009 } ] },
  { name: "Predrag Drobnjak", career: [
    { team: "Partizan", from: 1992, to: 1998 }, { team: "Anadolu Efes", from: 1998, to: 2001 },
    { team: "Seattle SuperSonics", from: 2001, to: 2003 }, { team: "Los Angeles Clippers", from: 2003, to: 2004 },
    { team: "Atlanta Hawks", from: 2004, to: 2005 }, { team: "Baskonia", from: 2005, to: 2006 },
    { team: "Partizan", from: 2006, to: 2007 }, { team: "Besiktas", from: 2007, to: 2008 },
    { team: "Efes Pilsen", from: 2008, to: 2009 }, { team: "PAOK", from: 2009, to: 2010 },
    { team: "Iraklis", from: 2010, to: 2011 } ] },
  { name: "Sofoklis Schortsanitis", career: [
    { team: "Iraklis", from: 2000, to: 2003 }, { team: "Pallacanestro Cantu", from: 2003, to: 2004 },
    { team: "Aris", from: 2004, to: 2005 }, { team: "Olympiacos", from: 2005, to: 2010 },
    { team: "Maccabi Tel Aviv", from: 2010, to: 2012 }, { team: "Panathinaikos", from: 2012, to: 2013 },
    { team: "Maccabi Tel Aviv", from: 2013, to: 2015 }, { team: "PAOK", from: 2015, to: 2016 },
    { team: "Apollon Patras", from: 2016, to: 2017 }, { team: "Ionikos Nikaias", from: 2019, to: 2020 } ] },
  { name: "Roko Ukic", career: [
    { team: "KK Split", from: 2000, to: 2005 }, { team: "Tau Ceramica", from: 2005, to: 2006 },
    { team: "FC Barcelona", from: 2006, to: 2007 }, { team: "Lottomatica Roma", from: 2007, to: 2008 },
    { team: "Toronto Raptors", from: 2008, to: 2009 }, { team: "Milwaukee Bucks", from: 2009, to: 2010 },
    { team: "Fenerbahce", from: 2010, to: 2012 }, { team: "Panathinaikos", from: 2012, to: 2014 },
    { team: "Cedevita", from: 2014, to: 2015 }, { team: "AEK Athens", from: 2016, to: 2017 },
    { team: "Levallois Metropolitans", from: 2018, to: 2019 }, { team: "KK Split", from: 2021, to: 2023 } ] },
  { name: "David Andersen", career: [
    { team: "Wollongong Hawks", from: 1998, to: 1999 }, { team: "Virtus Bologna", from: 1999, to: 2003 },
    { team: "Montepaschi Siena", from: 2003, to: 2004 }, { team: "CSKA Moscow", from: 2004, to: 2008 },
    { team: "FC Barcelona", from: 2008, to: 2009 }, { team: "Houston Rockets", from: 2009, to: 2010 },
    { team: "New Orleans Hornets", from: 2010, to: 2011 }, { team: "Montepaschi Siena", from: 2011, to: 2012 },
    { team: "Fenerbahce", from: 2012, to: 2013 }, { team: "ASVEL", from: 2014, to: 2016 },
    { team: "Melbourne United", from: 2016, to: 2018 }, { team: "Illawarra Hawks", from: 2018, to: 2020 } ] },
  { name: "Drew Nicholas", career: [
    { team: "Fabriano Basket", from: 2003, to: 2004 }, { team: "Basket Livorno", from: 2004, to: 2005 },
    { team: "Benetton Treviso", from: 2005, to: 2006 }, { team: "Efes Pilsen", from: 2006, to: 2008 },
    { team: "Panathinaikos", from: 2008, to: 2011 }, { team: "Olimpia Milano", from: 2011, to: 2012 },
    { team: "CSKA Moscow", from: 2012, to: 2012 } ] },
  { name: "Marcus Brown", career: [
    { team: "Portland Trail Blazers", from: 1996, to: 1997 }, { team: "Pau-Orthez", from: 1998, to: 1998 },
    { team: "Detroit Pistons", from: 1999, to: 1999 }, { team: "Limoges", from: 1999, to: 2000 },
    { team: "Benetton Treviso", from: 2000, to: 2001 }, { team: "Efes Pilsen", from: 2001, to: 2003 },
    { team: "CSKA Moscow", from: 2003, to: 2005 }, { team: "Unicaja Malaga", from: 2005, to: 2007 },
    { team: "Zalgiris Kaunas", from: 2007, to: 2008 }, { team: "Maccabi Tel Aviv", from: 2008, to: 2009 },
    { team: "Zalgiris Kaunas", from: 2009, to: 2011 } ] },
  { name: "Sani Becirovic", career: [
    { team: "Union Olimpija", from: 1999, to: 2001 }, { team: "Virtus Bologna", from: 2001, to: 2002 },
    { team: "Krka", from: 2003, to: 2004 }, { team: "Varese", from: 2004, to: 2005 },
    { team: "Fortitudo Bologna", from: 2005, to: 2006 }, { team: "Panathinaikos", from: 2006, to: 2008 },
    { team: "Virtus Roma", from: 2008, to: 2009 }, { team: "Olimpia Milano", from: 2010, to: 2010 },
    { team: "Turk Telekom", from: 2010, to: 2011 }, { team: "CSKA Moscow", from: 2011, to: 2011 },
    { team: "Benetton Treviso", from: 2011, to: 2012 } ] },
  { name: "Lynn Greer", career: [
    { team: "Slask Wroclaw", from: 2003, to: 2004 }, { team: "Dynamo Moscow", from: 2004, to: 2005 },
    { team: "Carpisa Napoli", from: 2005, to: 2006 }, { team: "Milwaukee Bucks", from: 2006, to: 2007 },
    { team: "Olympiacos", from: 2007, to: 2009 }, { team: "Fenerbahce Ulker", from: 2009, to: 2011 },
    { team: "Olimpia Milano", from: 2011, to: 2011 }, { team: "UNICS Kazan", from: 2011, to: 2012 },
    { team: "Azovmash", from: 2012, to: 2013 }, { team: "Darussafaka", from: 2013, to: 2015 } ] },
  { name: "Gianluca Basile", career: [
    { team: "Pallacanestro Reggiana", from: 1995, to: 1999 }, { team: "Fortitudo Bologna", from: 1999, to: 2005 },
    { team: "FC Barcelona", from: 2005, to: 2011 }, { team: "Pallacanestro Cantu", from: 2011, to: 2012 },
    { team: "Olimpia Milano", from: 2012, to: 2013 }, { team: "Orlandina Basket", from: 2013, to: 2016 } ] }
];

// Merge researched expansion careers (retired legends). Each name resolves in
// LEGENDS via legends_extra.json (build_legends.js loads the same file into
// legends.js), so find() will tag these active:false and validate them.
if (fs.existsSync("legends_extra.json")) {
  JSON.parse(fs.readFileSync("legends_extra.json", "utf8")).forEach(function (p) {
    RAW.push({ name: p.name, career: p.career });
  });
}

// --- clean(): tidy each timeline into a non-overlapping chronological path -------
const PRESENT = 9999;
function eff(to) { return to == null ? PRESENT : to; }
function clean(career) {
  var c = career.map(function (e) { return { team: fixTeam(e.team), from: e.from, to: e.to }; });
  c.sort(function (a, b) { return a.from - b.from || eff(b.to) - eff(a.to); }); // longer stint first → same-year loans get absorbed
  var out = [];
  c.forEach(function (e) {
    var last = out[out.length - 1];
    if (last) {
      if (last.team === e.team && e.from <= eff(last.to)) {        // merge consecutive same club
        if (eff(e.to) > eff(last.to)) last.to = e.to; return;
      }
      if (e.from >= last.from && eff(e.to) <= eff(last.to)) return; // contained loan / cameo → drop
    }
    out.push({ team: e.team, from: e.from, to: e.to });
  });
  return out;
}

// --- Build + validate -------------------------------------------------------
function find(name) {
  var p = PLAYERS.filter(function (x) { return x.name === name; })[0];
  if (p) return { p: p, active: true };
  var l = LEGENDS.filter(function (x) { return x.name === name; })[0];
  if (l) return { p: l, active: false };
  return null;
}
var CAREERS = [], errors = [], seen = {};
RAW.forEach(function (r) {
  var f = find(r.name);
  if (!f) { errors.push(r.name + " (not found in PLAYERS/LEGENDS)"); return; }
  if (seen[r.name]) { errors.push(r.name + " (duplicate RAW entry)"); return; }
  seen[r.name] = 1;
  var career = clean(r.career);
  if (career.length < 1) { errors.push(r.name + " (empty career after clean)"); return; }
  // Consistency invariants (the audit caught real bugs here — keep them fatal):
  // an active player's path must END at his current players.js club, still open;
  // a retired player's path must be fully closed.
  var last = career[career.length - 1];
  if (f.active) {
    if (last.to !== null) errors.push(r.name + " (active but last stint ends " + last.to + ")");
    if (last.team !== f.p.team) errors.push(r.name + " (last stint '" + last.team + "' != roster club '" + f.p.team + "')");
  } else if (last.to === null) {
    errors.push(r.name + " (retired but last stint is open-ended)");
  }
  for (var i = 0; i < career.length; i++) {
    var s = career[i];
    if (s.to != null && s.from > s.to) errors.push(r.name + " (stint " + s.team + " " + s.from + ">" + s.to + ")");
    if (i && s.from < career[i - 1].from) errors.push(r.name + " (out of order at " + s.team + ")");
    if (f.p.birthYear && s.from < f.p.birthYear + 14) errors.push(r.name + " (stint " + s.team + " starts at age " + (s.from - f.p.birthYear) + ")");
  }
  CAREERS.push({ name: r.name, nationality: f.p.nationality, position: f.p.position, active: f.active, career: career });
});
if (errors.length) { console.error("ERRORS:\n  " + errors.join("\n  ")); process.exit(1); }

// --- Emit careers.js --------------------------------------------------------
var lines = ["/* AUTO-GENERATED by build_careers.js — do not edit by hand. Career paths for the Player ID game. */",
             "window.CAREERS = ["];
CAREERS.forEach(function (c) { lines.push("  " + JSON.stringify(c) + ","); });
lines.push("];");
fs.writeFileSync("careers.js", lines.join("\n") + "\n");

var nA = CAREERS.filter(function (c) { return c.active; }).length;
console.log("Wrote careers.js — " + CAREERS.length + " players (" + nA + " active, " + (CAREERS.length - nA) + " legends)\n");
CAREERS.forEach(function (c) {
  console.log("  " + (c.active ? "A" : "L") + "  " + c.name + "  [" + c.career.length + "]: " +
    c.career.map(function (e) { return e.team + " " + e.from + "-" + (e.to || "now"); }).join("  |  "));
});
