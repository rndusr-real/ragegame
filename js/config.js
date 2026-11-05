// Minden személyes tartalom itt van. Csak ezt a fájlt kell átírni.
// Tipp: valódi nevek helyett használj beceneveket, mert a GitHub Pages forrása nyilvános lehet.
window.RG_CONFIG = {
  // Az ünnepelt neve vagy beceneve
  name: "Peti-kun",

  // A játékos karakter arca (átlátszó hátterű PNG). Ha üresre állítod (''), a felkiáltójel marad.
  face: "assets/face.png",

  // Hány éves lesz
  age: 18,

  // Háttérzene (a játék elején rákérdez, de bármit választ, elindul és ismétlődik)
  music: "assets/music.mp3",

  // Hangeffektek. Halálkor véletlenszerűen az egyik szól, a "flee" pedig akkor, amikor egy gomb először elugrik.
  sounds: {
    death: [
      "assets/sfx/aegh.mp3",
      "assets/sfx/bonk.mp3",
      "assets/sfx/thud.mp3",
      "assets/sfx/aa.mp3",
    ],
    flee: "assets/sfx/cave.mp3",
    // A hamis Discord-hívás csengőhangja
    call: "assets/sfx/discord_call.mp3",
  },

  // Az osztálycsoport üzenetei (4. pálya). Ide kerülnek a belső poénok.
  // Annyit írj, amennyit szeretnél, a játék körbeforgatja őket. Kb. 60 karakter fér egy buborékba.
  chat: [
    { from: "brassoi_", text: "Palinak mit mondhattak" },
    { from: "Axel", text: "Megkerdeztek tole hova menjen ki a mento" },
    { from: "Axel", text: "Es hat megfogta a kerdes" },
    {
      from: "Valaki",
      text: "gec hogyha ez film lett volna eskü elsírtam volna magam",
    },
    { from: "Valaki", text: "hiányzik a szexelős irodalom" },
    { from: "feltorekvonepzeneieloado", text: "Fijam🥀" },
    {
      from: "VörÖske",
      text: "Ez a baráti társaság, hogy egymást marcangoljuk belülről?",
    },
    { from: "VörÖske", text: "Szerintem NEM!" },
    { from: "Valaki más", text: "Boldog szülinapot, {name}!!!" },
    { from: "Anyukád", text: "Vettél kenyeret?" },
  ],

  // A stáblista nevei a hamis győzelemnél
  credits: [
    "Rendező: titok",
    "Forgatókönyv: senki",
    "Csapdák: én",
    "Ajándék: valamikor (soha)",
    "Köszönet: semmiért",
  ],

  // Extra narrátorszövegek halálkor. Bármikor felbukkanhatnak.
  taunts: [
    "{age} évesen már tudhatnád, hogyan kell ugrani.",
    "{name}, ezt mindenki látta.",
    "Az mások ezt elsőre megcsinálták. Hazudok, de akkor is.",
  ],
};
