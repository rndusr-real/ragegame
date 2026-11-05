// Minden személyes tartalom itt van. Csak ezt a fájlt kell átírni.
// Tipp: valódi nevek helyett használj beceneveket, mert a GitHub Pages forrása nyilvános lehet.
window.RG_CONFIG = {
  // Az ünnepelt neve vagy beceneve
  name: 'NÉV',

  // Hány éves lesz
  age: 18,

  // Az osztálycsoport üzenetei (4. pálya). Ide kerülnek a belső poénok.
  // Annyit írj, amennyit szeretnél, a játék körbeforgatja őket.
  chat: [
    { from: 'Osztályfőnök', text: 'Holnap dolgozat, de csak egy kicsi.' },
    { from: 'Valaki', text: 'Van valakinek házija?' },
    { from: 'Valaki más', text: 'Boldog szülinapot, {name}!!!' },
    { from: 'Hangos Béla', text: 'Ki vitte el a tollamat?' },
    { from: 'Anyukád', text: 'Vettél kenyeret?' },
    { from: 'Valaki', text: 'Ezt a játékot még mindig játssza?' },
    { from: 'Osztályfőnök', text: 'Ez a csoport tanulmányi célokat szolgál.' },
    { from: 'Valaki más', text: '{name}, mikor lesz a buli?' },
    { from: 'Hangos Béla', text: 'NEM IS ÉN VOLTAM' },
    { from: 'Anyukád', text: 'Nem válaszolsz?' }
  ],

  // A stáblista nevei a hamis győzelemnél
  credits: [
    'Rendező: az osztály',
    'Forgatókönyv: senki',
    'Csapdák: a barátaid',
    'Ajándék: hamarosan',
    'Köszönet: türelmedért'
  ],

  // Extra narrátorszövegek halálkor. Bármikor felbukkanhatnak.
  taunts: [
    '{age} évesen már tudhatnád, hogyan kell ugrani.',
    '{name}, ezt mindenki látta.',
    'Az osztály többi tagja ezt elsőre megcsinálta. Hazudok, de akkor is.'
  ]
};
