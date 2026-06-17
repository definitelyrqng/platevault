// Germany Kfz-Kennzeichen — district codes, plate categories & special types

// ── Region codes ──────────────────────────────────────────────────────────────
export interface GermanyRegion {
  code: string;
  name: string;
  active: boolean; // false = historical / expired, reissuable since 2012
}

export const GERMANY_REGIONS: GermanyRegion[] = [
  // A
  { code: "A",    name: "Augsburg",                            active: true  },
  { code: "AA",   name: "Ostalbkreis (Aalen)",                 active: true  },
  { code: "AB",   name: "Aschaffenburg",                       active: true  },
  { code: "ABG",  name: "Altenburger Land",                    active: true  },
  { code: "ABI",  name: "Anhalt-Bitterfeld",                   active: true  },
  { code: "ABN",  name: "Abensberg (hist. → KEH)",             active: false },
  { code: "AC",   name: "Aachen (Städteregion)",               active: true  },
  { code: "AIC",  name: "Aichach-Friedberg",                   active: true  },
  { code: "AK",   name: "Altenkirchen (Westerwald)",           active: true  },
  { code: "ALN",  name: "Altentreptow (hist. → MSE)",          active: false },
  { code: "ALT",  name: "Altötting (hist. → AÖ)",              active: false },
  { code: "ALZ",  name: "Alzenau (hist. → AB)",                active: false },
  { code: "AM",   name: "Amberg (Stadt)",                      active: true  },
  { code: "AN",   name: "Ansbach",                             active: true  },
  { code: "ANA",  name: "Annaberg (hist. → ERZ)",              active: false },
  { code: "ANK",  name: "Anklam (hist. → VG)",                 active: false },
  { code: "AÖ",   name: "Altötting",                           active: true  },
  { code: "AP",   name: "Weimarer Land (Apolda)",              active: true  },
  { code: "APD",  name: "Apolda (hist. → AP)",                 active: false },
  { code: "AR",   name: "Arnsberg (hist. → HSK)",              active: false },
  { code: "ARN",  name: "Arnstadt (hist. → IK)",               active: false },
  { code: "AS",   name: "Amberg-Sulzbach",                     active: true  },
  { code: "ASD",  name: "Aschendorf-Hümmling (hist. → EL)",   active: false },
  { code: "ASL",  name: "Aschersleben (hist. → SLK)",          active: false },
  { code: "ASZ",  name: "Aue-Schwarzenberg (hist. → ERZ)",     active: false },
  { code: "AUR",  name: "Aurich",                              active: true  },
  { code: "AW",   name: "Ahrweiler (Bad Neuenahr)",            active: true  },
  { code: "AZ",   name: "Alzey-Worms",                         active: true  },
  { code: "AZE",  name: "Anhalt-Zerbst (hist. → ABI)",         active: false },
  // B
  { code: "B",    name: "Berlin",                              active: true  },
  { code: "BA",   name: "Bamberg",                             active: true  },
  { code: "BAD",  name: "Baden-Baden",                         active: true  },
  { code: "BAL",  name: "Bad Liebenwerda (hist. → EE)",        active: false },
  { code: "BAR",  name: "Barnim",                              active: true  },
  { code: "BAS",  name: "Bad Saulgau (hist. → SIG)",           active: false },
  { code: "BAT",  name: "Bad Tölz (hist. → TÖL)",             active: false },
  { code: "BB",   name: "Böblingen",                           active: true  },
  { code: "BC",   name: "Biberach an der Riß",                 active: true  },
  { code: "BEI",  name: "Beilngries (hist. → EI)",             active: false },
  { code: "BEL",  name: "Belzig (hist. → PM)",                 active: false },
  { code: "BER",  name: "Bernburg (hist. → SLK)",              active: false },
  { code: "BGD",  name: "Berchtesgaden (hist. → BGL)",         active: false },
  { code: "BGL",  name: "Berchtesgadener Land",                active: true  },
  { code: "BI",   name: "Bielefeld",                           active: true  },
  { code: "BIN",  name: "Bingen am Rhein (hist.)",             active: false },
  { code: "BIR",  name: "Birkenfeld",                          active: true  },
  { code: "BIT",  name: "Bitburg-Prüm (Eifelkreis)",          active: true  },
  { code: "BK",   name: "Backnang (hist. → WN)",               active: false },
  { code: "BL",   name: "Zollernalbkreis (Balingen)",          active: true  },
  { code: "BLB",  name: "Bad Berleburg (hist. → SI)",          active: false },
  { code: "BM",   name: "Bergheim",                            active: true  },
  { code: "BN",   name: "Bonn",                                active: true  },
  { code: "BOG",  name: "Bogen (hist. → SR)",                  active: false },
  { code: "BOR",  name: "Borken",                              active: true  },
  { code: "BOT",  name: "Bottrop",                             active: true  },
  { code: "BRA",  name: "Brandenburg an der Havel",            active: true  },
  { code: "BS",   name: "Braunschweig",                        active: true  },
  { code: "BSK",  name: "Bad Schwalbach (hist. → RÜD)",        active: false },
  { code: "BT",   name: "Bayreuth",                            active: true  },
  { code: "BTF",  name: "Bitterfeld-Wolfen (hist. → ABI)",     active: false },
  { code: "BÜD",  name: "Büdingen (hist. → VB/MKK)",          active: false },
  { code: "BÜS",  name: "Büsingen (Sondergebiet)",             active: true  },
  { code: "BUL",  name: "Burglengenfeld (hist. → SAD)",        active: false },
  { code: "BZ",   name: "Bautzen",                             active: true  },
  // C
  { code: "C",    name: "Chemnitz",                            active: true  },
  { code: "CA",   name: "Calw",                                active: true  },
  { code: "CE",   name: "Celle",                               active: true  },
  { code: "CHA",  name: "Cham",                                active: true  },
  { code: "CLP",  name: "Cloppenburg",                         active: true  },
  { code: "CO",   name: "Coburg",                              active: true  },
  { code: "COC",  name: "Cochem-Zell",                         active: true  },
  { code: "COE",  name: "Coesfeld",                            active: true  },
  { code: "CUX",  name: "Cuxhaven",                            active: true  },
  // D
  { code: "D",    name: "Düsseldorf",                          active: true  },
  { code: "DA",   name: "Darmstadt",                           active: true  },
  { code: "DAH",  name: "Dachau",                              active: true  },
  { code: "DAN",  name: "Lüchow-Dannenberg",                   active: true  },
  { code: "DAU",  name: "Daun (hist. → VUL)",                  active: false },
  { code: "DBR",  name: "Bad Doberan (hist. → NWM)",           active: false },
  { code: "DD",   name: "Dresden",                             active: true  },
  { code: "DE",   name: "Dessau-Roßlau",                       active: true  },
  { code: "DEG",  name: "Deggendorf",                          active: true  },
  { code: "DEL",  name: "Delmenhorst",                         active: true  },
  { code: "DGF",  name: "Dingolfing-Landau",                   active: true  },
  { code: "DH",   name: "Diepholz",                            active: true  },
  { code: "DI",   name: "Dieburg (hist. → DA)",                active: false },
  { code: "DIL",  name: "Dillenburg (hist. → LDK)",            active: false },
  { code: "DIN",  name: "Dinslaken (hist. → WES)",             active: false },
  { code: "DKB",  name: "Dinkelsbühl (hist. → AN)",            active: false },
  { code: "DL",   name: "Döbeln (hist. → MT)",                 active: false },
  { code: "DLG",  name: "Dillingen an der Donau",              active: true  },
  { code: "DN",   name: "Düren",                               active: true  },
  { code: "DO",   name: "Dortmund",                            active: true  },
  { code: "DON",  name: "Donau-Ries",                          active: true  },
  { code: "DU",   name: "Duisburg",                            active: true  },
  { code: "DUD",  name: "Duderstadt (hist. → GÖ)",             active: false },
  { code: "DÜW",  name: "Bad Dürkheim",                        active: true  },
  // E
  { code: "E",    name: "Essen",                               active: true  },
  { code: "EA",   name: "Eisenach / Wartburgkreis",            active: true  },
  { code: "EBE",  name: "Ebersberg",                           active: true  },
  { code: "ED",   name: "Erding",                              active: true  },
  { code: "EI",   name: "Eichstätt",                           active: true  },
  { code: "EIC",  name: "Eichsfeld",                           active: true  },
  { code: "EIH",  name: "Eichstätt (hist. → EI)",              active: false },
  { code: "EIL",  name: "Eilenburg (hist. → NL)",              active: false },
  { code: "EIN",  name: "Einbeck (hist. → NOM)",               active: false },
  { code: "EIS",  name: "Eisenberg Pfalz (hist. → KIB)",       active: false },
  { code: "EL",   name: "Emsland",                             active: true  },
  { code: "ELD",  name: "Eldena (hist. → LUP)",                active: false },
  { code: "EM",   name: "Emmendingen",                         active: true  },
  { code: "EMD",  name: "Emden",                               active: true  },
  { code: "EN",   name: "Ennepe-Ruhr-Kreis",                   active: true  },
  { code: "ENZ",  name: "Enzkreis",                            active: true  },
  { code: "ER",   name: "Erlangen",                            active: true  },
  { code: "ERB",  name: "Odenwaldkreis (Erbach)",              active: true  },
  { code: "ERH",  name: "Erlangen-Höchstadt",                  active: true  },
  { code: "ERZ",  name: "Erzgebirgskreis",                     active: true  },
  { code: "ESB",  name: "Eschenbach i.d.Opf. (hist. → NEW)",  active: false },
  { code: "ESW",  name: "Werra-Meißner-Kreis",                 active: true  },
  { code: "EU",   name: "Euskirchen",                          active: true  },
  // F
  { code: "F",    name: "Frankfurt am Main",                   active: true  },
  { code: "FAL",  name: "Falkenstein (hist. → V)",             active: false },
  { code: "FD",   name: "Fulda",                               active: true  },
  { code: "FDS",  name: "Freudenstadt",                        active: true  },
  { code: "FEU",  name: "Feuchtwangen (hist. → AN)",           active: false },
  { code: "FFB",  name: "Fürstenfeldbruck",                    active: true  },
  { code: "FL",   name: "Flensburg",                           active: true  },
  { code: "FN",   name: "Bodenseekreis (Friedrichshafen)",     active: true  },
  { code: "FO",   name: "Forchheim",                           active: true  },
  { code: "FR",   name: "Freiburg im Breisgau",                active: true  },
  { code: "FRG",  name: "Freyung-Grafenau",                    active: true  },
  { code: "FRI",  name: "Friesland",                           active: true  },
  { code: "FS",   name: "Freising",                            active: true  },
  { code: "FT",   name: "Frankenthal (Pfalz)",                 active: true  },
  { code: "FÜ",   name: "Fürth",                               active: true  },
  { code: "FÜS",  name: "Füssen (hist. → OAL)",               active: false },
  // G
  { code: "G",    name: "Gera",                                active: true  },
  { code: "GAP",  name: "Garmisch-Partenkirchen",              active: true  },
  { code: "GE",   name: "Gelsenkirchen",                       active: true  },
  { code: "GF",   name: "Gifhorn",                             active: true  },
  { code: "GG",   name: "Groß-Gerau",                          active: true  },
  { code: "GI",   name: "Gießen",                              active: true  },
  { code: "GL",   name: "Rheinisch-Bergischer Kreis",          active: true  },
  { code: "GM",   name: "Oberbergischer Kreis (Gummersbach)",  active: true  },
  { code: "GN",   name: "Gelnhausen (hist. → MKK)",            active: false },
  { code: "GÖ",   name: "Göttingen",                           active: true  },
  { code: "GOS",  name: "Goslar",                              active: true  },
  { code: "GP",   name: "Göppingen",                           active: true  },
  { code: "GR",   name: "Görlitz (Landkreis)",                 active: true  },
  { code: "GRZ",  name: "Greiz",                               active: true  },
  { code: "GT",   name: "Gütersloh",                           active: true  },
  { code: "GW",   name: "Greifswald (hist. → VG)",             active: false },
  // H
  { code: "H",    name: "Hannover (Region)",                   active: true  },
  { code: "HA",   name: "Hagen",                               active: true  },
  { code: "HAL",  name: "Halle (Saale)",                       active: true  },
  { code: "HAM",  name: "Hamm",                                active: true  },
  { code: "HAS",  name: "Haßberge",                            active: true  },
  { code: "HB",   name: "Bremen (Hansestadt)",                  active: true  },
  { code: "HBN",  name: "Hildburghausen",                      active: true  },
  { code: "HBS",  name: "Halberstadt (hist. → HZ)",            active: false },
  { code: "HD",   name: "Heidelberg / Rhein-Neckar-Kreis",     active: true  },
  { code: "HE",   name: "Helmstedt",                           active: true  },
  { code: "HEF",  name: "Hersfeld-Rotenburg",                  active: true  },
  { code: "HEI",  name: "Dithmarschen (Heide)",                active: true  },
  { code: "HER",  name: "Herne",                               active: true  },
  { code: "HGW",  name: "Greifswald (Hansestadt)",             active: true  },
  { code: "HH",   name: "Hamburg",                             active: true  },
  { code: "HI",   name: "Hildesheim",                          active: true  },
  { code: "HK",   name: "Heidekreis",                          active: true  },
  { code: "HL",   name: "Hansestadt Lübeck",                   active: true  },
  { code: "HMÜ",  name: "Hann. Münden (hist. → GÖ)",          active: false },
  { code: "HN",   name: "Heilbronn",                           active: true  },
  { code: "HO",   name: "Hof",                                 active: true  },
  { code: "HOL",  name: "Holzminden",                          active: true  },
  { code: "HOM",  name: "Saarpfalz-Kreis (Homburg)",           active: true  },
  { code: "HP",   name: "Bergstraße (Heppenheim)",             active: true  },
  { code: "HRO",  name: "Hansestadt Rostock",                  active: true  },
  { code: "HS",   name: "Heinsberg",                           active: true  },
  { code: "HSK",  name: "Hochsauerlandkreis",                  active: true  },
  { code: "HST",  name: "Stralsund / Vorpommern-Rügen",        active: true  },
  { code: "HU",   name: "Main-Kinzig-Kreis (Hanau)",           active: true  },
  { code: "HVL",  name: "Havelland",                           active: true  },
  { code: "HX",   name: "Höxter",                              active: true  },
  { code: "HZ",   name: "Harz",                                active: true  },
  // I
  { code: "I",    name: "Ingolstadt",                          active: true  },
  { code: "IGB",  name: "St. Ingbert",                         active: true  },
  { code: "IK",   name: "Ilm-Kreis (Arnstadt)",               active: true  },
  { code: "IZ",   name: "Steinburg (Itzehoe)",                 active: true  },
  // J
  { code: "J",    name: "Jena",                                active: true  },
  { code: "JL",   name: "Jerichower Land",                     active: true  },
  // K
  { code: "K",    name: "Köln",                                active: true  },
  { code: "KA",   name: "Karlsruhe",                           active: true  },
  { code: "KB",   name: "Waldeck-Frankenberg (Korbach)",        active: true  },
  { code: "KC",   name: "Kronach",                             active: true  },
  { code: "KEH",  name: "Kelheim",                             active: true  },
  { code: "KEM",  name: "Kemnath",                             active: true  },
  { code: "KF",   name: "Kaufbeuren",                          active: true  },
  { code: "KG",   name: "Bad Kissingen",                       active: true  },
  { code: "KH",   name: "Bad Kreuznach",                       active: true  },
  { code: "KI",   name: "Kiel",                                active: true  },
  { code: "KIB",  name: "Donnersbergkreis (Kirchheimbolanden)", active: true  },
  { code: "KL",   name: "Kaiserslautern",                      active: true  },
  { code: "KLE",  name: "Kleve",                               active: true  },
  { code: "KN",   name: "Konstanz",                            active: true  },
  { code: "KO",   name: "Koblenz",                             active: true  },
  { code: "KR",   name: "Krefeld",                             active: true  },
  { code: "KS",   name: "Kassel",                              active: true  },
  { code: "KT",   name: "Kitzingen",                           active: true  },
  { code: "KU",   name: "Kulmbach",                            active: true  },
  { code: "KÜN",  name: "Hohenlohekreis (Künzelsau)",          active: true  },
  { code: "KÜS",  name: "Kusel",                               active: true  },
  // L
  { code: "L",    name: "Leipzig",                             active: true  },
  { code: "LA",   name: "Landshut",                            active: true  },
  { code: "LAU",  name: "Nürnberger Land (Lauf/Pegnitz)",      active: true  },
  { code: "LB",   name: "Ludwigsburg",                         active: true  },
  { code: "LD",   name: "Landau in der Pfalz",                 active: true  },
  { code: "LDK",  name: "Lahn-Dill-Kreis",                     active: true  },
  { code: "LDS",  name: "Dahme-Spreewald",                     active: true  },
  { code: "LE",   name: "Leer (Ostfriesland)",                 active: true  },
  { code: "LEV",  name: "Leverkusen",                          active: true  },
  { code: "LG",   name: "Lüneburg",                            active: true  },
  { code: "LI",   name: "Lindau (Bodensee)",                   active: true  },
  { code: "LIF",  name: "Lichtenfels",                         active: true  },
  { code: "LIM",  name: "Limburg-Weilburg",                    active: true  },
  { code: "LIP",  name: "Lippe (Detmold)",                     active: true  },
  { code: "LL",   name: "Landsberg am Lech",                   active: true  },
  { code: "LM",   name: "Limburg-Weilburg (Landkreis)",        active: true  },
  { code: "LOS",  name: "Oder-Spree",                          active: true  },
  { code: "LU",   name: "Ludwigshafen am Rhein",               active: true  },
  { code: "LUP",  name: "Ludwigslust-Parchim",                 active: true  },
  // M
  { code: "M",    name: "München (Stadt)",                     active: true  },
  { code: "MA",   name: "Mannheim",                            active: true  },
  { code: "MB",   name: "Miesbach",                            active: true  },
  { code: "MEI",  name: "Meißen",                              active: true  },
  { code: "MER",  name: "Saalekreis (Merseburg)",              active: true  },
  { code: "MG",   name: "Mönchengladbach",                     active: true  },
  { code: "MGN",  name: "Schmalkalden-Meiningen",              active: true  },
  { code: "MH",   name: "Mülheim an der Ruhr",                 active: true  },
  { code: "MI",   name: "Minden-Lübbecke",                     active: true  },
  { code: "MIL",  name: "Miltenberg",                          active: true  },
  { code: "MK",   name: "Märkischer Kreis",                    active: true  },
  { code: "MKK",  name: "Main-Kinzig-Kreis",                   active: true  },
  { code: "MN",   name: "Unterallgäu (Mindelheim)",            active: true  },
  { code: "MOL",  name: "Märkisch-Oderland",                   active: true  },
  { code: "MOS",  name: "Neckar-Odenwald-Kreis",               active: true  },
  { code: "MR",   name: "Marburg-Biedenkopf",                  active: true  },
  { code: "MS",   name: "Münster",                             active: true  },
  { code: "MSE",  name: "Mecklenburgische Seenplatte",          active: true  },
  { code: "MSP",  name: "Main-Spessart",                       active: true  },
  { code: "MÜ",   name: "Mühldorf am Inn",                     active: true  },
  { code: "MYK",  name: "Mayen-Koblenz",                       active: true  },
  { code: "MZ",   name: "Mainz / Mainz-Bingen",               active: true  },
  { code: "MZG",  name: "Merzig-Wadern",                       active: true  },
  // N
  { code: "N",    name: "Nürnberg (Stadt)",                    active: true  },
  { code: "NEA",  name: "Neustadt a.d. Aisch-Bad Windsheim",   active: true  },
  { code: "NES",  name: "Rhön-Grabfeld (Bad Neustadt/Saale)",  active: true  },
  { code: "NEU",  name: "Neuburg-Schrobenhausen",              active: true  },
  { code: "NEW",  name: "Neustadt an der Waldnaab",            active: true  },
  { code: "NF",   name: "Nordfriesland",                       active: true  },
  { code: "NK",   name: "Neunkirchen",                         active: true  },
  { code: "NL",   name: "Nordsachsen (Eilenburg/Torgau)",      active: true  },
  { code: "NMS",  name: "Neumünster",                          active: true  },
  { code: "NOH",  name: "Grafschaft Bentheim (Nordhorn)",      active: true  },
  { code: "NOM",  name: "Northeim",                            active: true  },
  { code: "NR",   name: "Neuwied (Rhein)",                     active: true  },
  { code: "NU",   name: "Neu-Ulm",                             active: true  },
  { code: "NW",   name: "Neustadt an der Weinstraße",          active: true  },
  { code: "NWM",  name: "Nordwestmecklenburg",                  active: true  },
  // O
  { code: "OA",   name: "Oberallgäu",                          active: true  },
  { code: "OAL",  name: "Ostallgäu (Marktoberdorf)",           active: true  },
  { code: "OB",   name: "Oberhausen",                          active: true  },
  { code: "OD",   name: "Stormarn",                            active: true  },
  { code: "OE",   name: "Olpe",                                active: true  },
  { code: "OF",   name: "Offenbach am Main",                   active: true  },
  { code: "OG",   name: "Ortenaukreis",                        active: true  },
  { code: "OH",   name: "Ostholstein",                         active: true  },
  { code: "OHA",  name: "Osterode am Harz",                    active: true  },
  { code: "OHZ",  name: "Osterholz",                           active: true  },
  { code: "OL",   name: "Oldenburg",                           active: true  },
  { code: "OS",   name: "Osnabrück",                           active: true  },
  { code: "OSL",  name: "Oberspreewald-Lausitz",               active: true  },
  // P
  { code: "P",    name: "Potsdam",                             active: true  },
  { code: "PA",   name: "Passau",                              active: true  },
  { code: "PAF",  name: "Pfaffenhofen an der Ilm",             active: true  },
  { code: "PAN",  name: "Rottal-Inn (Pfarrkirchen)",           active: true  },
  { code: "PB",   name: "Paderborn",                           active: true  },
  { code: "PE",   name: "Peine",                               active: true  },
  { code: "PEG",  name: "Neumarkt i.d. Opf.",                  active: true  },
  { code: "PIN",  name: "Pinneberg",                           active: true  },
  { code: "PIR",  name: "Sächsische Schweiz-Osterzgebirge",    active: true  },
  { code: "PLÖ",  name: "Plön",                                active: true  },
  { code: "PM",   name: "Potsdam-Mittelmark",                  active: true  },
  { code: "PR",   name: "Prignitz",                            active: true  },
  // R
  { code: "R",    name: "Regensburg",                          active: true  },
  { code: "RA",   name: "Rastatt",                             active: true  },
  { code: "RE",   name: "Recklinghausen",                      active: true  },
  { code: "REG",  name: "Regen",                               active: true  },
  { code: "REM",  name: "Remscheid",                           active: true  },
  { code: "RH",   name: "Roth",                                active: true  },
  { code: "RHL",  name: "Rhein-Lahn-Kreis",                    active: true  },
  { code: "RO",   name: "Rosenheim",                           active: true  },
  { code: "ROW",  name: "Rotenburg (Wümme)",                   active: true  },
  { code: "RP",   name: "Rhein-Pfalz-Kreis",                   active: true  },
  { code: "RT",   name: "Reutlingen",                          active: true  },
  { code: "RÜD",  name: "Rheingau-Taunus-Kreis",               active: true  },
  { code: "RW",   name: "Rottweil",                            active: true  },
  // S
  { code: "S",    name: "Stuttgart",                           active: true  },
  { code: "SAD",  name: "Schwandorf",                          active: true  },
  { code: "SAW",  name: "Salzwedel (Altmarkkreis)",            active: true  },
  { code: "SB",   name: "Saarbrücken (Regionalverband)",        active: true  },
  { code: "SDL",  name: "Stendal",                             active: true  },
  { code: "SE",   name: "Segeberg",                            active: true  },
  { code: "SG",   name: "Solingen",                            active: true  },
  { code: "SHG",  name: "Schaumburg",                          active: true  },
  { code: "SI",   name: "Siegen-Wittgenstein",                 active: true  },
  { code: "SIG",  name: "Sigmaringen",                         active: true  },
  { code: "SK",   name: "Saalekreis (Merseburg/Querfurt)",     active: true  },
  { code: "SL",   name: "Schleswig-Flensburg",                 active: true  },
  { code: "SLF",  name: "Saalfeld-Rudolstadt",                 active: true  },
  { code: "SLK",  name: "Salzlandkreis",                       active: true  },
  { code: "SLS",  name: "Saarlouis",                           active: true  },
  { code: "SN",   name: "Schwerin (Stadt)",                    active: true  },
  { code: "SOK",  name: "Saale-Orla-Kreis",                    active: true  },
  { code: "SON",  name: "Sonneberg",                           active: true  },
  { code: "SPE",  name: "Speyer",                              active: true  },
  { code: "SPN",  name: "Spree-Neiße",                         active: true  },
  { code: "SR",   name: "Straubing-Bogen",                     active: true  },
  { code: "ST",   name: "Steinfurt",                           active: true  },
  { code: "STA",  name: "Starnberg",                           active: true  },
  { code: "STD",  name: "Stade",                               active: true  },
  { code: "SÜ",   name: "Südliche Weinstraße",                 active: true  },
  { code: "SW",   name: "Schweinfurt",                         active: true  },
  { code: "SZ",   name: "Salzgitter",                          active: true  },
  // T
  { code: "TBB",  name: "Main-Tauber-Kreis (Tauberbischofsheim)", active: true },
  { code: "TF",   name: "Teltow-Fläming",                      active: true  },
  { code: "TIR",  name: "Tirschenreuth",                       active: true  },
  { code: "TÖL",  name: "Bad Tölz-Wolfratshausen",             active: true  },
  { code: "TR",   name: "Trier",                               active: true  },
  { code: "TRS",  name: "Trier-Saarburg",                      active: true  },
  { code: "TS",   name: "Traunstein",                          active: true  },
  { code: "TÜ",   name: "Tübingen",                            active: true  },
  { code: "TUT",  name: "Tuttlingen",                          active: true  },
  // U
  { code: "UE",   name: "Uelzen",                              active: true  },
  { code: "UH",   name: "Unstrut-Hainich-Kreis",               active: true  },
  { code: "UL",   name: "Ulm / Alb-Donau-Kreis",              active: true  },
  { code: "UM",   name: "Uckermark",                           active: true  },
  { code: "UN",   name: "Unna",                                active: true  },
  // V
  { code: "V",    name: "Vogtlandkreis (Plauen)",               active: true  },
  { code: "VB",   name: "Vogelsbergkreis",                     active: true  },
  { code: "VEC",  name: "Vechta",                              active: true  },
  { code: "VER",  name: "Verden",                              active: true  },
  { code: "VG",   name: "Vorpommern-Greifswald",               active: true  },
  { code: "VIE",  name: "Viersen",                             active: true  },
  { code: "VR",   name: "Vorpommern-Rügen",                    active: true  },
  { code: "VS",   name: "Schwarzwald-Baar-Kreis (Villingen)",  active: true  },
  { code: "VUL",  name: "Vulkaneifel (Daun)",                  active: true  },
  // W
  { code: "W",    name: "Wuppertal",                           active: true  },
  { code: "WAF",  name: "Warendorf",                           active: true  },
  { code: "WAK",  name: "Wartburgkreis",                       active: true  },
  { code: "WB",   name: "Wittenberg (Lutherstadt)",            active: true  },
  { code: "WEN",  name: "Weiden in der Oberpfalz",             active: true  },
  { code: "WES",  name: "Wesel",                               active: true  },
  { code: "WHV",  name: "Wilhelmshaven",                       active: true  },
  { code: "WI",   name: "Wiesbaden",                           active: true  },
  { code: "WIL",  name: "Bernkastel-Wittlich",                 active: true  },
  { code: "WIN",  name: "Winsen (Luhe)",                       active: true  },
  { code: "WL",   name: "Wolfenbüttel (Landkreis)",            active: true  },
  { code: "WM",   name: "Weilheim-Schongau",                   active: true  },
  { code: "WN",   name: "Rems-Murr-Kreis",                     active: true  },
  { code: "WND",  name: "St. Wendel",                          active: true  },
  { code: "WO",   name: "Worms",                               active: true  },
  { code: "WOB",  name: "Wolfsburg",                           active: true  },
  { code: "WT",   name: "Waldshut",                            active: true  },
  { code: "WUG",  name: "Weißenburg-Gunzenhausen",             active: true  },
  { code: "WUN",  name: "Wunsiedel im Fichtelgebirge",         active: true  },
  { code: "WW",   name: "Westerwaldkreis",                     active: true  },
  { code: "WZL",  name: "Wanzleben (hist. → BK/SLK)",         active: false },
  // X
  { code: "X",    name: "NATO / Intern. Headquarters",         active: true  },
  // Y
  { code: "Y",    name: "Bundeswehr",                          active: true  },
  // Z
  { code: "Z",    name: "Zwickau",                             active: true  },
  { code: "ZE",   name: "Anhalt-Bitterfeld (Zerbst/Anhalt)",   active: true  },
  { code: "ZI",   name: "Ziesar (hist. → PM)",                 active: false },
  { code: "ZW",   name: "Zweibrücken",                         active: true  },
  { code: "ZWI",  name: "Zwickau (hist. → Z)",                 active: false },
];

GERMANY_REGIONS.sort((a, b) => a.code.localeCompare(b.code, "de"));

// ─────────────────────────────────────────────────────────────────────────────
// PLATE CATEGORY TYPES — format examples shown per category
// ─────────────────────────────────────────────────────────────────────────────
export type GermanyCategoryId =
  | "regular"         // REGION-AB1234            (max 8 total chars incl. region)
  | "din"             // REGION-AB1234            (same, DIN black plate)
  | "transit-5day"    // REGION-123456 DD.MM.YY
  | "export"          // REGION-ABC123-A DD.MM.YY
  | "oldtimer"        // REGION-AB1234H
  | "seasonal"        // REGION-AB1234 MM/MM
  | "seasonal-h"      // REGION-AB1234H MM/MM
  | "electric"        // REGION-AB1234E
  | "transferable"    // REGION-AB1234-0  (suffix 0–9, 0H–9H, 0E–9E)
  | "red"             // REGION-XX1234    (XX = 04/05/06/07)
  | "official"        // REGION-123456    (official services & consulates)
  | "state-authority" // STATECODE-123456 (BBL-123456, THL-123456…)
  | "federal"         // BD XX-123456 / BP XA-123456 / BW XB-123456 / THW-123456
  | "diplomatic";     // 0-XX-123456A / B-XX-123456A / BN-XX-123456A

export interface GermanyCategory {
  id: GermanyCategoryId;
  label: string;
  emoji: string;
  desc: string;
  group: "standard" | "temporary" | "special" | "official";
}

export const GERMANY_CATEGORIES: GermanyCategory[] = [
  // Standard
  { id: "regular",         label: "Regular",             emoji: "🟦", desc: "Standard euroband — single-line, two-line, US, motorcycle",             group: "standard"  },
  { id: "din",             label: "Historical DIN",       emoji: "⬛", desc: "Pre-1994 black DIN plates — single-line, two-line, US format",          group: "standard"  },
  // Temporary / transfer
  { id: "transit-5day",    label: "5-Day Transit",        emoji: "🟡", desc: "Kurzzeitkennzeichen — yellow, valid up to 5 days",                      group: "temporary" },
  { id: "export",          label: "Export",               emoji: "🔴", desc: "Ausfuhrkennzeichen — red plate with expiry date for export",            group: "temporary" },
  { id: "transferable",    label: "Transferable",         emoji: "🔄", desc: "Wechselkennzeichen — one plate shared between two vehicles",            group: "temporary" },
  // Special
  { id: "oldtimer",        label: "Oldtimer (H)",         emoji: "🏛️", desc: "H-Kennzeichen — historic vehicle 30+ years old",                       group: "special"   },
  { id: "seasonal",        label: "Seasonal",             emoji: "📅", desc: "Saisonkennzeichen — valid only certain months per year",                group: "special"   },
  { id: "seasonal-h",      label: "Seasonal Oldtimer",    emoji: "🗓️", desc: "Seasonal H-Kennzeichen — seasonal historic vehicle plate",              group: "special"   },
  { id: "electric",        label: "Electric (E)",         emoji: "⚡", desc: "E-Kennzeichen — electric or hydrogen vehicle, E suffix",                group: "special"   },
  { id: "red",             label: "Red Plate",            emoji: "🔴", desc: "Rotes Kennzeichen — dealer / inspection / trade / oldtimer collector",  group: "special"   },
  { id: "official",        label: "Official / Consulate", emoji: "🏢", desc: "Official services & consulates — REGION-123456",                        group: "special"   },
  // Official
  { id: "state-authority", label: "State Authority",      emoji: "🏛️", desc: "State parliament / government vehicles (BBL, THL, NRW…)",              group: "official"  },
  { id: "federal",         label: "Federal Agencies",     emoji: "🦅", desc: "BD / BP / BW / THW — federal ministry & agency vehicles",               group: "official"  },
  { id: "diplomatic",      label: "Diplomatic",           emoji: "🌐", desc: "Diplomatic corps — 0-XX-123456A / B-XX / BN-XX format",                 group: "official"  },
];

export const CATEGORY_GROUPS: { id: GermanyCategory["group"]; label: string }[] = [
  { id: "standard",  label: "Standard" },
  { id: "temporary", label: "Temporary / Transfer" },
  { id: "special",   label: "Special" },
  { id: "official",  label: "Official" },
];

// ── Plate format (sub-type within regular / din) ──────────────────────────────
export interface GermanyPlateFormat {
  id: string;
  label: string;
  desc: string;
  group: "regular" | "din";
}

export const GERMANY_PLATE_FORMATS: GermanyPlateFormat[] = [
  { id: "single",     label: "Single-line",     desc: "520×110 mm · most common",         group: "regular" },
  { id: "double",     label: "Two-line",         desc: "280×200 mm · tight spaces",        group: "regular" },
  { id: "us",         label: "US-Style",         desc: "305×152 mm · wider import format", group: "regular" },
  { id: "moto",       label: "Motorcycle",       desc: "180×200 mm · rear-only",           group: "regular" },
  { id: "din-single", label: "Single-line DIN",  desc: "Pre-1994 black/white · single row",group: "din"     },
  { id: "din-double", label: "Two-line DIN",     desc: "Pre-1994 black/white · two rows",  group: "din"     },
  { id: "din-us",     label: "US-style DIN",     desc: "Pre-1994 black/white · US size",   group: "din"     },
];

// ── Red plate sub-types ───────────────────────────────────────────────────────
export const RED_PLATE_CODES = [
  { code: "04", label: "04 — Dealer Plate" },
  { code: "05", label: "05 — Technical Inspection" },
  { code: "06", label: "06 — Trade Plates" },
  { code: "07", label: "07 — Oldtimer Collector" },
] as const;

export type RedPlateCode = "04" | "05" | "06" | "07";

// ── Transferable plate suffixes ───────────────────────────────────────────────
export const TRANSFERABLE_SUFFIXES: string[] = [
  ...Array.from({ length: 10 }, (_, i) => String(i)),        // 0-9
  ...Array.from({ length: 10 }, (_, i) => `${i}H`),          // 0H-9H
  ...Array.from({ length: 10 }, (_, i) => `${i}E`),          // 0E-9E
];

// ── State authority codes ─────────────────────────────────────────────────────
export interface GermanyStateAuthority {
  code: string;
  name: string;
  state: string;
}

export const GERMANY_STATE_AUTHORITIES: GermanyStateAuthority[] = [
  { code: "B",   name: "Berlin Senate & Mayor's Office",                      state: "Berlin" },
  { code: "BBL", name: "Brandenburg Landtag (State Government & Parliament)", state: "Brandenburg" },
  { code: "BWL", name: "Baden-Württemberg Landtag (State Government)",        state: "Baden-Württemberg" },
  { code: "BYL", name: "Bayern Landtag (Bavaria State Government)",           state: "Bavaria" },
  { code: "HB",  name: "Bremen Senate (Hanseatic City)",                      state: "Bremen" },
  { code: "HEL", name: "Hessen Landtag (Hesse State Government)",             state: "Hesse" },
  { code: "HH",  name: "Hamburg Senate (Hanseatic City)",                     state: "Hamburg" },
  { code: "LSA", name: "Land Sachsen-Anhalt (State Government)",              state: "Saxony-Anhalt" },
  { code: "LSN", name: "Land Sachsen (Saxony State Government)",              state: "Saxony" },
  { code: "MVL", name: "Mecklenburg-Vorpommern Landtag (State Government)",   state: "Mecklenburg-Vorpommern" },
  { code: "NL",  name: "Niedersachsen Landtag (Lower Saxony Government)",     state: "Lower Saxony" },
  { code: "NRW", name: "Nordrhein-Westfalen (State Government)",              state: "NRW" },
  { code: "RPL", name: "Rheinland-Pfalz Landtag (State Government)",          state: "Rhineland-Palatinate" },
  { code: "SAL", name: "Saarland (State Government)",                         state: "Saarland" },
  { code: "SH",  name: "Schleswig-Holstein (State Government)",               state: "Schleswig-Holstein" },
  { code: "THL", name: "Thüringen Landtag (Thuringia State Government)",      state: "Thuringia" },
];

// ── Federal BD agencies (BD XX-NNNNNN) ───────────────────────────────────────
export interface GermanyFederalAgency { num: number; name: string; short: string; }
export const GERMANY_FEDERAL_BD: GermanyFederalAgency[] = [
  { num:  1, short: "Bundestag",  name: "Federal Diet (Bundestag)" },
  { num:  3, short: "Bundesrat",  name: "Federal Council (Bundesrat)" },
  { num:  4, short: "BVerfG",     name: "Federal Constitutional Court" },
  { num:  5, short: "BPräs",      name: "Office of the Federal President" },
  { num:  6, short: "BKAmt",      name: "Federal Chancellery" },
  { num:  7, short: "AA",         name: "Foreign Office" },
  { num:  8, short: "Zoll",       name: "Federal Customs Service" },
  { num:  9, short: "BMI",        name: "Federal Ministry of the Interior" },
  { num: 10, short: "BMJ",        name: "Federal Ministry of Justice & Consumer Protection" },
  { num: 11, short: "BMF",        name: "Federal Ministry of Finance" },
  { num: 12, short: "BMWK",       name: "Federal Ministry for Economic Affairs & Energy" },
  { num: 13, short: "BMDV",       name: "Federal Ministry of Transport & Digital Infrastructure" },
  { num: 14, short: "BMEL",       name: "Federal Ministry of Food & Agriculture" },
  { num: 15, short: "BMAS",       name: "Federal Ministry of Labour & Social Affairs" },
  { num: 16, short: "Zoll II",    name: "Federal Customs Service (2nd series)" },
  { num: 18, short: "BMVg",       name: "Federal Ministry of Defense" },
  { num: 19, short: "BMBF",       name: "Federal Ministry of Education & Research" },
  { num: 20, short: "BMUV",       name: "Federal Ministry for the Environment & Nuclear Safety" },
  { num: 21, short: "BMFSFJ",     name: "Federal Ministry of Family Affairs, Women & Youth" },
  { num: 22, short: "BMG",        name: "Federal Ministry of Health" },
  { num: 26, short: "BMZ",        name: "Federal Ministry of Economic Cooperation & Development" },
];

// ── Federal Police BP (BP XA-NNNNNN) — vehicle type codes ────────────────────
export interface BpVehicleType { code: number; label: string; }
export const GERMANY_BP_VEHICLE_TYPES: BpVehicleType[] = [
  { code: 10, label: "10 — Motorcycles" },
  { code: 11, label: "11 — Motorcycles" },
  { code: 12, label: "12 — Motorcycles" },
  { code: 15, label: "15 — Passenger Cars" },
  { code: 16, label: "16 — Passenger Cars" },
  { code: 17, label: "17 — Passenger Cars" },
  { code: 18, label: "18 — Passenger Cars" },
  { code: 19, label: "19 — Passenger Cars" },
  { code: 20, label: "20 — Offroad Cars" },
  { code: 21, label: "21 — Offroad Cars" },
  { code: 22, label: "22 — Offroad Cars" },
  { code: 23, label: "23 — Offroad Cars" },
  { code: 24, label: "24 — Offroad Cars" },
  { code: 25, label: "25 — Minivans" },
  { code: 26, label: "26 — Minivans" },
  { code: 27, label: "27 — Minivans" },
  { code: 28, label: "28 — Minivans" },
  { code: 29, label: "29 — Minivans" },
  { code: 30, label: "30 — Mid-sized Offroad" },
  { code: 31, label: "31 — Mid-sized Offroad" },
  { code: 32, label: "32 — Mid-sized Offroad" },
  { code: 33, label: "33 — Mid-sized Offroad" },
  { code: 34, label: "34 — Mid-sized Offroad" },
  { code: 35, label: "35 — Mid-sized Offroad" },
  { code: 36, label: "36 — Mid-sized Offroad" },
  { code: 37, label: "37 — Mid-sized Offroad" },
  { code: 38, label: "38 — Mid-sized Offroad" },
  { code: 39, label: "39 — Mid-sized Offroad" },
  { code: 40, label: "40 — Trucks & Buses" },
  { code: 41, label: "41 — Trucks & Buses" },
  { code: 42, label: "42 — Trucks & Buses" },
  { code: 43, label: "43 — Trucks & Buses" },
  { code: 44, label: "44 — Trucks & Buses" },
  { code: 45, label: "45 — Trucks & Buses" },
  { code: 46, label: "46 — Trucks & Buses" },
  { code: 47, label: "47 — Trucks & Buses" },
  { code: 48, label: "48 — Trucks & Buses" },
  { code: 49, label: "49 — Trucks & Buses" },
  { code: 50, label: "50 — Armored Vehicles" },
  { code: 51, label: "51 — Armored Vehicles" },
  { code: 52, label: "52 — Armored Vehicles" },
  { code: 53, label: "53 — Armored Vehicles" },
  { code: 54, label: "54 — Armored Vehicles" },
  { code: 55, label: "55 — Trailers" },
  { code: 56, label: "56 — Trailers" },
  { code: 57, label: "57 — Trailers" },
  { code: 58, label: "58 — Trailers" },
  { code: 59, label: "59 — Trailers" },
  { code: 60, label: "60 — Electric Vehicles" },
  { code: 61, label: "61 — Electric Vehicles" },
  { code: 62, label: "62 — Unidentified" },
];

// ── Federal Waterways BW (BW XB-NNNNNN) — branch offices ─────────────────────
export interface WaterwayBranch { num: number; name: string; city: string; }
export const GERMANY_BW_BRANCHES: WaterwayBranch[] = [
  { num: 1, name: "Branch Office North",       city: "Kiel" },
  { num: 2, name: "Branch Office North-West",  city: "Aurich" },
  { num: 3, name: "Branch Office Center",      city: "Hannover" },
  { num: 4, name: "Branch Office West",        city: "Münster" },
  { num: 5, name: "Branch Office South-West",  city: "Mainz" },
  { num: 6, name: "Branch Office South",       city: "Würzburg" },
  { num: 7, name: "Branch Office East",        city: "Magdeburg" },
];

// ── Season months ─────────────────────────────────────────────────────────────
export const MONTHS = [
  { num: "01", label: "Jan" }, { num: "02", label: "Feb" }, { num: "03", label: "Mar" },
  { num: "04", label: "Apr" }, { num: "05", label: "May" }, { num: "06", label: "Jun" },
  { num: "07", label: "Jul" }, { num: "08", label: "Aug" }, { num: "09", label: "Sep" },
  { num: "10", label: "Oct" }, { num: "11", label: "Nov" }, { num: "12", label: "Dec" },
];

// ── Plate text builder ────────────────────────────────────────────────────────
export function buildGermanyPlateText(opts: {
  category: GermanyCategoryId;
  // region-based
  regionCode?: string;
  plateSuffix?: string;    // letters+numbers combined, e.g. "AB1234"
  // transit
  date?: string;           // DD.MM.YY
  // export
  exportCheckLetter?: string;
  // seasonal
  seasonStart?: string;    // MM
  seasonEnd?: string;      // MM
  // transferable
  transferSuffix?: string; // 0–9, 0H–9H, 0E–9E
  // red
  redCode?: RedPlateCode;
  numbers?: string;        // serial digits (transit / official / red / authority)
  // state authority
  stateCode?: string;
  // federal
  federalSub?: "bd" | "bp" | "bw" | "thw";
  federalBdNum?: number | null;
  federalBpCode?: number | null;
  federalBwBranch?: number | null;
  // diplomatic
  diplomPrefix?: "0" | "B" | "BN";
  diplomCountryCode?: string;  // 10–317
  diplomSerial?: string;       // up to 6 digits
  diplomCheckLetter?: string;  // optional A–Z
}): string {
  const rc  = (opts.regionCode  ?? "").toUpperCase().trim();
  const sfx = (opts.plateSuffix ?? "").toUpperCase().trim();
  const num = (opts.numbers     ?? "").trim();

  switch (opts.category) {
    case "regular":
    case "din":
      return rc && sfx ? `${rc}-${sfx}` : rc ? `${rc}-` : "";

    case "electric":
      return rc && sfx ? `${rc}-${sfx}E` : rc ? `${rc}-` : "";

    case "oldtimer":
      return rc && sfx ? `${rc}-${sfx}H` : rc ? `${rc}-` : "";

    case "seasonal": {
      const s = opts.seasonStart && opts.seasonEnd ? ` ${opts.seasonStart}/${opts.seasonEnd}` : "";
      return rc && sfx ? `${rc}-${sfx}${s}` : rc ? `${rc}-` : "";
    }
    case "seasonal-h": {
      const s = opts.seasonStart && opts.seasonEnd ? ` ${opts.seasonStart}/${opts.seasonEnd}` : "";
      return rc && sfx ? `${rc}-${sfx}H${s}` : rc ? `${rc}-` : "";
    }
    case "transferable": {
      const t = opts.transferSuffix ? `-${opts.transferSuffix}` : "";
      return rc && sfx ? `${rc}-${sfx}${t}` : rc ? `${rc}-` : "";
    }
    case "transit-5day": {
      const d = opts.date ? ` ${opts.date}` : "";
      return rc && num ? `${rc}-${num}${d}` : rc ? `${rc}-` : "";
    }
    case "export": {
      const cl = opts.exportCheckLetter ? `-${opts.exportCheckLetter.toUpperCase()}` : "";
      const d  = opts.date ? ` ${opts.date}` : "";
      return rc && sfx ? `${rc}-${sfx}${cl}${d}` : rc ? `${rc}-` : "";
    }
    case "red": {
      const code = opts.redCode ?? "04";
      return rc && num ? `${rc}-${code}${num}` : rc ? `${rc}-${code}` : "";
    }
    case "official":
      return rc && num ? `${rc}-${num}` : rc ? `${rc}-` : "";

    case "state-authority": {
      const sc = (opts.stateCode ?? "").toUpperCase().trim();
      return sc && num ? `${sc}-${num}` : sc ? `${sc}-` : "";
    }
    case "federal": {
      const sub = opts.federalSub ?? "bd";
      if (sub === "thw") return num ? `THW-${num}` : "THW-";
      if (sub === "bd")  return opts.federalBdNum && num ? `BD ${opts.federalBdNum}-${num}` : "BD-";
      if (sub === "bp")  return opts.federalBpCode && num ? `BP ${opts.federalBpCode}-${num}` : "BP-";
      if (sub === "bw")  return opts.federalBwBranch && num ? `BW ${opts.federalBwBranch}-${num}` : "BW-";
      return "";
    }
    case "diplomatic": {
      const pre  = opts.diplomPrefix ?? "0";
      const cc   = (opts.diplomCountryCode ?? "").trim();
      const ser  = (opts.diplomSerial ?? "").trim();
      const cl   = (opts.diplomCheckLetter ?? "").toUpperCase().trim();
      return cc && ser ? `${pre}-${cc}-${ser}${cl}` : `${pre}-`;
    }
    default:
      return "";
  }
}

// ── Max suffix chars for regular/similar plates ───────────────────────────────
// Total plate text is max 8 chars; region uses 1–3, leaving 5–7 for suffix
export function maxSuffixChars(regionCode: string): number {
  return Math.max(3, 8 - (regionCode?.length ?? 0));
}

// ── Plate type labels (stored in DB) ─────────────────────────────────────────
export const PLATE_TYPE_LABELS: Record<string, string> = {
  "de-regular-single":      "Regular — Single-line (Euroband)",
  "de-regular-double":      "Regular — Two-line (Euroband)",
  "de-regular-us":          "Regular — US-Style (Euroband)",
  "de-regular-moto":        "Regular — Motorcycle (Euroband)",
  "de-din-single":          "Historical DIN — Single-line",
  "de-din-double":          "Historical DIN — Two-line",
  "de-din-us":              "Historical DIN — US-Style",
  "de-transit-5day":        "5-Day Transit (Kurzzeitkennzeichen)",
  "de-export":              "Export Plate (Ausfuhrkennzeichen)",
  "de-oldtimer":            "Oldtimer / Historic (H-Kennzeichen)",
  "de-seasonal":            "Seasonal (Saisonkennzeichen)",
  "de-seasonal-h":          "Seasonal Oldtimer (Saison-H)",
  "de-electric":            "Electric Vehicle (E-Kennzeichen)",
  "de-transferable":        "Transferable (Wechselkennzeichen)",
  "de-red-04":              "Red Plate — 04 Dealer",
  "de-red-05":              "Red Plate — 05 Technical Inspection",
  "de-red-06":              "Red Plate — 06 Trade Plates",
  "de-red-07":              "Red Plate — 07 Oldtimer Collector",
  "de-official":            "Official Services / Consulate",
  "de-state-authority":     "State Authority",
  "de-federal-bd":          "Federal Agency (BD)",
  "de-federal-bp":          "Federal Police (BP)",
  "de-federal-bw":          "Federal Waterways (BW)",
  "de-federal-thw":         "Federal Relief (THW)",
  "de-diplomatic":          "Diplomatic Plate",
};
