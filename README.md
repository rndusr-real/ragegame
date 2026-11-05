# ragegame

Szülinapi rage game böngészőbe, Cat Mario-stílusban. Ártatlan üdvözlőoldalnak indul, aztán maga az oldal lesz a pálya. A végén zsákutca vár, és semmit sem nyersz.

## Személyre szabás

Csak a `js/config.js` fájlt kell átírni: név, életkor, a karakter arca (`assets/face.png`, átlátszó hátterű PNG), az osztálycsoport üzenetei (belső poénok), a stáblista és extra csúfolódások. A buborékokba rövid, kb. 30 karakteres szövegek férnek ki.

## Futtatás

Dupla kattintás az `index.html`-re, vagy helyi szerverrel:

```bash
python -m http.server 5173
```

Irányítás: nyilak vagy WASD és szóköz, telefonon érintőgombok (fekvő tájolásban).

## Pályák

1. Üdvözlőoldal: leszakadó menü, rád eső kép, láthatatlan blokk
2. Hírportál: süti-ablak, felugró ablakok, hírlevél
3. Webshop: bevásárlókocsi, rugós akciós matricák, CAPTCHA, futószalag
4. Osztálycsoport: felfelé mászás az olvasatlan üzenetek elől
5. Minijáték: gyertyaelfújás (visszagyulladó gyertyákkal)
6. Videómegosztó: kétkörös reklám, pufferelő lejátszósáv, akadozó internet (késleltetett irányítás), összeomló ajánlott videók
7. Minijáték: szülinapi kvíz (rossz válasznál vissza az elejére)
8. E-napló: leszakadó egyesek, 24 másodperces beadási határidő, fejjel lefelé fordított „szülői nézet”
9. Minijáték: kő-papír-olló a csaló szerver ellen
10. Beállítások és 404: felcserélt irányok, holdgravitáció, sötét mód, csúszka, láthatatlan padló

13 halál után egyszer megjelenik egy hamis GAME OVER képernyő is (semmi nem törlődik).

Utána jön a befejezés: hamis győzelem, gyilkos stáblista, 99%-on megálló töltés, doboz a dobozban, végül a zsákutca. A zsákutca frissítés után is megmarad.

## Teszteléshez

- `?reset=1`: törli a mentést, elölről kezdi
- `?debug=1&level=3`: hibakereső mód (nem ment), egy adott pályától
- `?debug=1&level=0`, majd a konzolban `RG.test.runAll()`: a bot halál nélkül végigjátssza az összes pályát, így bizonyítja, hogy megoldhatók

## Kezdőkód (Firebase)

A feltételek elfogadása után a játék egy kódot kér, a helyes kód: `SeMmI` (kis- és nagybetű számít). A játék a Firebase Realtime Database `startCode` kulcsáról olvassa, így a nyilvános forrásban nem látszik. Ha nincs beállítva Firebase, vagy az adatbázis nem érhető el, egy beépített tartalék kód (szintén `SeMmI`) működik.

Beállítás:

1. https://console.firebase.google.com → új projekt → Build → Realtime Database → Create database.
2. A Data fülön a gyökér alá egy új kulcs: `startCode`, érték: `SeMmI`.
3. A Rules fülön:

   ```json
   {
     "rules": {
       ".read": false,
       ".write": false,
       "startCode": { ".read": true }
     }
   }
   ```

4. Az adatbázis címét (pl. `https://valami-default-rtdb.europe-west1.firebasedatabase.app`) írd be a `js/config.js` `firebase.databaseURL` mezőjébe.

Teszteléshez a `tests/fake-db/startCode.json` egy utánzott Firebase-válasz (`TesztKod`): a `databaseURL`-t ideiglenesen `http://localhost:5173/tests/fake-db`-re állítva kipróbálható.

## Közzététel

GitHub Pages: Settings → Pages → Deploy from branch → `main` / root. Ingyenes csomagban a repónak nyilvánosnak kell lennie, ezért a `config.js` tartalma bárki számára látható.
