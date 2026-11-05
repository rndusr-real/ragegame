# ragegame

Szülinapi rage game böngészőbe, Cat Mario-stílusban. Ártatlan üdvözlőoldalnak indul, aztán maga az oldal lesz a pálya. A végén zsákutca vár, és semmit sem nyersz.

## Személyre szabás

Csak a `js/config.js` fájlt kell átírni: név, életkor, az osztálycsoport üzenetei (belső poénok), a stáblista és extra csúfolódások. A buborékokba rövid, kb. 30 karakteres szövegek férnek ki.

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
5. Videómegosztó: kétkörös átugorhatatlan reklám, pufferelő lejátszósáv, töltés-pörgettyű, összeomló ajánlott videók
6. E-napló: leszakadó egyesek, 24 másodperces beadási határidő, fegyelmi intő, szülői értesítő
7. Beállítások és 404: felcserélt irányok, holdgravitáció, sötét mód, csúszka, láthatatlan padló

Utána jön a befejezés: hamis győzelem, gyilkos stáblista, 99%-on megálló töltés, doboz a dobozban, végül a zsákutca. A zsákutca frissítés után is megmarad.

## Teszteléshez

- `?reset=1`: törli a mentést, elölről kezdi
- `?debug=1&level=3`: hibakereső mód (nem ment), egy adott pályától
- `?debug=1&level=0`, majd a konzolban `RG.test.runAll()`: a bot halál nélkül végigjátssza az összes pályát, így bizonyítja, hogy megoldhatók

## Közzététel

GitHub Pages: Settings → Pages → Deploy from branch → `main` / root. Ingyenes csomagban a repónak nyilvánosnak kell lennie, ezért a `config.js` tartalma bárki számára látható.
