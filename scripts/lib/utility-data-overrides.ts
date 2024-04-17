/**
 * Utility codes (number) or utility names (string) to exclude from
 * consideration. These must be exactly as they appear in the spreadsheet.
 * Not every utility has a code, which is why names can also be used here.
 */
export const EXCLUSIONS: Set<string | number> = new Set([
  // AZ
  25060, // Wellton-Mohawk; no electric
  60772, // Buckeye; no electric
  62264, // Hohokam; no electric
  78679, // Ocotillo; no electric

  // CA
  // Not a utility, but a network of local governments to promote efficiency
  'Bay Area Regional Energy Network (BayREN)',

  // CO
  6752, // Town of Frederick; now served by United Power

  // CT
  9734, // City of Jewett City; no electric

  // DC
  'Washington Gas', // no electric; Utility Code "Not Available"

  // FL
  15776, // Reedy Creek Improvement District (basically Disney World); dissolved

  // IL
  'Nicor Gas',
  'Peoples Gas',

  // MN
  // Multi-state gas company, in IN, LA, MN, MS, OH, TX. They also provide
  // electricity in Houston area, but the dataset uses a different name there.
  'CenterPoint Energy',
  'District Energy St. Paul', // district heating!

  // NH
  20913, // Town of Wolfeboro; no electric

  // NJ
  'Elizabethtown Gas',
  'New Jersey Natural Gas',
  'South Jersey Gas',

  // PA
  'Philadelphia Gas Works',

  // VA
  8198, // City of Harrisonburg; no electric

  // WY
  'Dominion Energy (formerly Questar Gas)',
]);

/**
 * Map from utility codes (numbers) or utility names (string) to replacement
 * names. The keys must be exactly as they appear in the spreadsheet. The
 * replacement names will be treated as if they were the name in the sheet.
 * (Not every utility has a code, which is why names can also be used here.)
 *
 * The aim of these replacements is to identify a utility by the name most
 * recognizable to its customers. For example, the dataset commonly lists
 * municipal utilities as "Town of XYZ", but often those utilities use the
 * branding "XYZ Public Utilities" or similar. In some cases it's also to deal
 * with unusual abbreviations, or a complete name change that the dataset hasn't
 * picked up on yet, or the dataset referring to the same utility with different
 * abbreviations (e.g. "XYZ Rural Electric Cooperative" and "XYZ R E C").
 */
export const OVERRIDES = new Map<string | number, string>([
  // AK
  [26616, 'North Slope Borough'],

  // AR
  [17540, 'South Central Arkansas Electric Cooperative'],
  [17671, 'Southwest Arkansas Electric Cooperative'],

  // AZ
  [1241, 'DixiePower'],
  [15048, 'Electrical District No 2 Pinal County'],
  [30518, 'Electrical District No 3 Pinal County'],
  [15049, 'Electrical District No 4 Pinal County'],
  [18280, 'Sulphur Springs Valley Electric Cooperative'],
  [19728, 'UniSource Energy Services'],
  [40165, 'DixiePower'],
  [62683, "Tohono O'odham Utility Authority"],
  [606953, 'UniSource Energy Services'],

  // CA
  [207, 'Alameda Municipal Power'],
  [16088, 'Riverside Public Utilities'],
  [16655, 'Silicon Valley Power'],
  [19229, 'Truckee Donner Public Utility District'],
  [14534, 'Pasadena Water and Power'],
  [16295, 'Roseville Electric'],
  [11124, 'Lodi Electric Utility'],
  [7294, 'Glendale Water and Power'],
  [590, 'Anaheim Public Utilities'],
  [2507, 'Burbank Water and Power'],

  // CO
  [5997, 'Estes Park Power and Communications'],
  [7300, 'Glenwood Springs Electric'],
  [10066, 'K.C. Electric Association'],
  [11256, 'Loveland Water and Power'],
  [12860, 'Morgan County REA'],
  [15257, 'Poudre Valley REA'],
  [16603, 'San Luis Valley REC'],
  [16616, 'San Isabel Electric'],

  // DE
  [13424, 'New Castle Municipal Services Commission'],

  // FL
  [6443, 'Florida Keys Electric Cooperative'],
  [6455, 'Duke Energy Florida'],
  [14610, 'Orlando Utilities Commission'],
  [20371, 'West Florida Electric Cooperative'],
  [31833, 'Okefenoke REMC'],

  // GA
  [9689, 'Jefferson Energy Cooperative'],

  // CT
  [7716, 'Groton Utilities'],
  [13831, 'Norwich Public Utilities'],
  [17569, 'South Norwalk Electric and Water'],

  // DC
  [1143, 'Pepco'], // Potomac Electric Power

  // HI
  [8287, 'Hawaiian Electric'], // Hawai'i Electric Light, part of HECO
  [10071, 'Kauai Island Utility Cooperative'],
  [11843, 'Hawaiian Electric'], // Maui Electric, part of HECO
  [19547, 'Hawaiian Electric'], // HECO

  // IA
  [7750, 'Guthrie County REC'],
  [8283, 'Harrison County REC'],
  [8298, 'MiEnergy'],
  [12642, 'Maquoketa Valley Electric Cooperative'],
  [13675, 'Nishabotna Valley REC'],
  [18446, 'T.I.P. Rural Electric Cooperative'],
  [20951, 'Woodbury County REC'],

  // IL
  [14840, 'Peru Municipal Electric Department'],
  [15686, 'Rantoul Utilities'],
  [4362, 'Corn Belt Energy'],
  [16420, 'Rural Electric Convenience Cooperative'],
  [56697, 'Ameren Illinois'],
  [61678, 'Corn Belt Energy'],

  // IN
  [1119, 'NIPSCO'], // Northern Indiana Public Service Company
  [4508, 'Crawfordsville Electric Light & Power'],
  [13756, 'NIPSCO'],
  [18942, 'Tipton Municipal Utilities'],
  [19667, 'Utilities District of Western Indiana REMC'],

  // KS
  [10801, 'Leavenworth-Jefferson Electric Cooperative'],

  // KY
  [1201, 'Barbourville Utility Commission'],

  // LA
  [8884, 'Terrebonne Parish Consolidated Government'],
  [11241, 'Entergy Louisiana'],
  [21567, 'Washington-St. Tammany Electric Cooperative'],
  [55936, 'Entergy Gulf States Louisiana'],
  [1135007, 'Entergy Gulf States Louisiana'],

  // MD
  [1043, 'Delmarva Power'],
  [1142, 'Potomac Edison'],
  [5625, 'Easton Utilities'],
  [15263, 'Potomac Edison'],

  // ME
  // Versant has two districts, Bangor Hydro and Maine Public. They have
  // different rates, but don't seem to offer incentives, so we can collapse
  // them for now. (The utility codes do not seem to line up with the real
  // division between districts.)
  [1011, 'Versant Power'],
  [1091, 'Versant Power'],
  [1179, 'Versant Power'],
  [10144, 'Kennebunk Light & Power District'],
  [11477, 'Madison Electric Works'],

  // MI
  [61241, 'City of Charlevoix'],
  [1366, 'Bay City Electric Light and Power'],
  [3915, 'Coldwater Board of Public Utilities'],
  [8631, 'Hillsdale Board of Public Utilities'],
  [60990, 'Marshall Municipal Utilities'],
  [18895, 'Thumb Electric Cooperative'],
  [21048, 'Wyandotte Municipal Services'],
  [19125, 'Traverse City Light & Power'],

  // MN
  [150, 'Adrian Public Utilities'],
  [1101, 'Bagley Public Utilities'],
  [4577, 'Crow Wing Power'],
  [6151, 'Fairmont Public Utilities'],
  [7292, 'Glencoe Light & Power Commission'],
  [7489, 'Grand Rapids Public Utilities'],
  [8307, 'Hawley Public Utilities'],
  [8543, 'Hibbing Public Utilities'],
  [9130, 'Hutchinson Utilities'],
  [12897, 'Moose Lake Power'],
  [13480, 'New Prague Utilities'],
  [13488, 'New Ulm Public Utilities'],
  [15387, 'Princeton Public Utilities'],
  [15793, 'Redwood Falls Public Utilities Commission'],
  [16971, 'Shakopee Public Utilities'],
  [17320, 'Sleepy Eye Public Utilities'],

  // MO
  [1051, 'Empire District Electric'],
  [3486, 'Chillicothe Municipal Utilities'],

  // MS
  [7651, 'Greenwood Utilities'],
  [13735, 'Northcentral Electric Cooperative'],
  [14563, 'Pearl River Valley Electric Power Association'],
  [21095, 'Public Service Commission of Yazoo City'],

  // MT
  [11272, 'Lower Yellowstone Rural Electric Cooperative'],
  [19545, 'Black Hills Power'],

  // NC
  [3107, 'Carteret-Craven Electric Cooperative'],
  [5416, 'Duke Energy Carolinas'],
  [6235, 'Fayetteville PWC'],
  [7639, 'Greenville Utilities Commission'],
  [9837, 'Jones-Onslow Electric Membership Corp'],

  // ND
  [55959, 'Roughrider Electric Cooperative'],

  // NH
  // Situation explained here:
  // https://www.energy.nh.gov/utilities-providers/regulated-utility-services/electric
  [1059, 'Liberty Utilities'], // Granite State Electric
  [15472, 'Eversource'], // Public Service Co of NH
  [26510, 'Liberty Utilities'], // Granite State Electric

  // NM
  [1147, 'PNM'],
  [15473, 'PNM'],
  [62472, 'Northern Rio Arriba Electric Cooperative'],

  // NV
  [13407, 'NV Energy'], // Nevada Power (became NV Energy in 2008)
  [17166, 'NV Energy'], // Sierra Pacific Power Co (became NV Energy in 2008)

  // NY
  [1036, 'Con Edison'],
  [1115, 'NYSEG'],
  [1117, 'National Grid'], // Niagara Mohawk
  [3249, 'Central Hudson Gas & Electric'],
  [4226, 'Con Edison'],
  [11811, 'Massena Electric'],
  [13511, 'NYSEG'],
  [14154, 'Orange & Rockland'],
  [16183, 'Rochester Gas & Electric'],
  [16549, 'Salamanca Board of Public Utilities'],

  // OH
  [1042, 'AES Ohio'], // Dayton Power & Light
  // Code 1175, overlaps with a rural co-op in TX
  ['Toledo Edison Co (The)', 'Toledo Edison'],
  [3755, 'The Illuminating Company'],
  [4922, 'AES Ohio'], // Dayton Power & Light
  [18997, 'Toledo Edison'],

  // OK
  [15474, 'Public Service Company of Oklahoma'],

  // OR
  [3264, 'Central Lincoln'],
  [60724, 'Central Lincoln'],
  [28541, 'Clatskanie PUD'],
  [40438, 'Columbia River PUD'],
  [40437, "Emerald People's Utility District"],
  [14109, 'Oregon Trail Electric Cooperative'],
  [18917, "Tillamook People's Utility District"],
  [1736, 'Blachly-Lane Electric Cooperative'],

  // PA
  [12390, 'Met-Ed'],
  [1096, 'Met-Ed'],
  [1135, 'PECO'],
  [14711, 'Penelec'],
  [14716, 'Penn Power'],
  [1188, 'West Penn Power Company'],

  // RI
  [1857, 'Block Island Power Company'],

  // SC
  [3804, 'City of Clinton'],
  [7654, 'Greer CPW'],

  // TN
  [20228, 'Weakley County Municipal Electric System'],

  // TX
  [20230, 'Weatherford Utility Department'],
  [61891, 'J-A-C Electric Cooperative'],
  [62653, 'Taylor Electric Cooperative'], // not to be confused with one in WI

  // UT
  [18206, 'South Utah Valley Electric Service District'], // also known as SESD

  // VA
  [1186, 'Dominion Energy'],
  [2248, 'BVU Authority'],
  [4794, 'Danville Utilities'],
  [6715, 'Franklin Municipal Power and Light'],
  [13640, 'NOVEC'],
  [15619, 'Radford Electric Department'],
  [19876, 'Dominion Energy'],
  [60762, 'BVU Authority'],

  // VT
  [1061, 'Green Mountain Power'],
  [7601, 'Green Mountain Power'],
  [8104, 'Town of Hardwick Electric Department'],
  [11305, 'Village of Ludlow Electric Light Department'],
  [11359, 'Lyndon Electric Department'],
  [12989, 'Morrisville Water & Light'],
  [13789, 'Town of Northfield Electric Department'],
  [18371, 'Swanton Electric'],
  [19791, 'Vermont Electric Coop'],
  [27316, 'Stowe Electric Department'],

  // WA
  [14505, 'Parkland Light & Water'],
  [19784, 'Vera Water and Power'],
  [62299, 'Modern Electric Water Company'],

  // WI
  [307, 'Algoma Utilities'],
  [2273, 'Brodhead Water & Light'],
  [3208, 'Cedarburg Light & Water'],
  [1776, 'Black River Falls Municipal Utilities'],
  [1997, 'Boscobel Utilities'],
  [3814, 'Clintonville Utilities'],
  [4073, 'Columbus Utilties'],
  [4607, 'Cuba City Light & Water'],
  [5777, 'Elkhorn Light & Water'],
  [6043, 'Evansville Water & Light'],
  [10056, 'Kaukauna Utilities'],
  [11125, 'Lodi Utilities'],
  [11740, 'Marshfield Utilities'],
  [12265, 'Medford Electric Utility'],
  [12298, 'Menasha Utilities'],
  [13448, 'New Holstein Utilities'],
  [13481, 'New Richmond Utilities'],
  [15159, 'Plymouth Utilities'],
  [15978, 'City Utilities Richland Center'],
  [16082, 'River Falls Municipal Utilities'],
  [17028, 'Sheboygan Falls Utilities'],
  [18181, 'Stoughton Utilities'],
  [18249, 'Sturgeon Bay Utilities'],
  [20434, 'Westby Utilities'],
  [4247, 'Consolidated Water Power Company'],
  [4715, 'Dahlberg Light & Power Company'],
  [5417, 'Dunn Energy Cooperative'],
  [5632, 'Eau Claire Energy Cooperative'],
  [6424, 'Florence Utilities'],
  [8212, 'Hartford Utilities'],
  [9936, 'Juneau Utilities'],
  [11479, 'Madison Gas and Electric'],
  [13467, 'New London Utilities'],
  [13815, 'Northwestern Wisconsin Electric Company'],
  [13964, 'Oconto Falls Municipal Utilities'],
  [15034, 'Pierce Pepin Cooperative Services'],
  [18336, 'Superior Water, Light & Power'],
  [19324, 'Two Rivers Utilities'],
  [1181, 'Bangor Municipal Utility'],
  [13036, 'Mount Horeb Utilities'],
  [13145, 'Muscoda Utilities'],
  [13438, 'New Glarus Utilities'],
  [20211, 'Waunakee Utilities'],
  [20182, 'Waterloo Utilities'],
  [40036, 'Westfield Milling and Electric Light Company'],
  [20847, 'We Energies'],
  [54921, 'Water Works & Lighting Commission'],

  // WY
  [3461, 'Black Hills Energy'],
  [61066, 'Black Hills Energy'], // Cheyenne Light Fuel & Power
]);
