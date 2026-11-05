// Felhasználási feltételek: a játékos vállalja, hogy élőben megosztja magát és a játékot Discordon.
// Végig kell görgetni, be kell pipálni, alá kell írni. Elutasítani nem lehet.
(function (RG) {
  'use strict';

  var ui = RG.ui;

  var CLAUSES = [
    ['1. § Felek',
      'Jelen szerződés létrejött egyrészről a szulinap-ajandek.hu (a továbbiakban: Szolgáltató), másrészről {name} (a továbbiakban: Ünnepelt, Játékos vagy Áldozat) között.'],
    ['2. § A szerződés tárgya',
      'A Szolgáltató egy ajándékot ígér. A Szolgáltató nem vállal felelősséget az ajándék létezéséért, állapotáért és hollétéért.'],
    ['3. § ÉLŐ KÖZVETÍTÉSI KÖTELEZETTSÉG',
      'A Játékos köteles a játék teljes időtartama alatt <b>élőben, Discordon megosztani</b> a baráti társasággal <b>(a) saját magát</b> bekapcsolt kamerával és mikrofonnal, különös tekintettel az arcára, a hangjára és minden elhangzó szóra, valamint <b>(b) a képernyőjét, a játékkal együtt</b>. A közvetítés megszakítása, a kamera „véletlen” kikapcsolása vagy a mikrofon némítása a szerződés súlyos megszegésének minősül.',
      true],
    ['4. § Halálozás',
      'A Játékos tudomásul veszi, hogy meg fog halni. Sokszor. A halálok számát a Szolgáltató rögzíti, és a lehető legrosszabb pillanatban nyilvánosságra hozza.'],
    ['5. § Az eszközök épsége',
      'A Játékos vállalja, hogy nem vágja földhöz a telefont, a billentyűzetet vagy az egeret. Ha mégis, ennek is élőben kell történnie, a kamera előtt (lásd 3. §).'],
    ['6. § Panaszkezelés',
      'Panaszt kizárólag írásban, faxon vagy galambpostán lehet benyújtani. Az ügyintézési határidő 3–5 évszázad.'],
    ['7. § Elutasítás',
      'Jelen feltételek elutasítása technikailag nem lehetséges. Kérjük, ne próbálkozz.'],
    ['8. § Záró rendelkezések',
      'Az elfogadással a Játékos kijelenti, hogy {age} éves, beszámítható, és ezt a döntést önként hozta meg. (Nem.)']
  ];

  ui.showTos = function (onDone) {
    var G = RG.G;
    var html =
      '<div class="tos-head"><div class="tos-title">Felhasználási Feltételek és Játékszerződés</div>' +
      '<div class="tos-sub">Hatályos mától, örökre. Kérjük, figyelmesen olvasd el (úgysem fogod).</div></div>' +
      '<div class="tos-text">' +
      CLAUSES.map(function (c) {
        return '<div class="tos-clause' + (c[2] ? ' key' : '') + '"><b>' + c[0] + '</b><p>' + RG.fmt(c[1]).replace(/&lt;(\/?)b&gt;/g, '<$1b>') + '</p></div>';
      }).join('') +
      '<div class="tos-end">— A dokumentum vége. Gratulálunk, te vagy az első, aki idáig eljutott. —</div>' +
      '</div>' +
      '<label class="tos-check disabled"><input type="checkbox" disabled> Elolvastam, megértettem, és vállalom az élő Discord-megosztást (3. §)</label>' +
      '<div class="tos-sign"><span>Aláírás:</span><button type="button" class="tos-pad" tabindex="-1">kattints az aláíráshoz</button></div>' +
      '<div class="tos-hint">Görgess le a végéig az elfogadáshoz.</div>';

    var m = ui.modal({
      cls: 'tos',
      html: html,
      buttons: [{
        label: 'Elfogadom, és élőben megosztom 📡',
        cls: 'tos-accept',
        onClick: function (close, btn) {
          if (btn.classList.contains('off')) {
            ui.say(!read ? 'Előbb olvasd végig. Igen, az egészet.' : (!checked ? 'Pipáld be, hogy vállalod az élő megosztást.' : 'Az aláírás hiányzik.'));
            return;
          }
          G.meta.tos = true;
          G.save();
          document.body.classList.add('rec');
          close();
          decline.remove();
          ui.say('Köszönjük. Remélhetőleg már élőben nézünk.', 3500);
          if (onDone) onDone();
        }
      }]
    });

    var box = m.box, text = box.querySelector('.tos-text'), label = box.querySelector('.tos-check');
    var check = label.querySelector('input'), pad = box.querySelector('.tos-pad');
    var accept = box.querySelector('.tos-accept');
    var read = false, checked = false, signed = false;

    function update() {
      var ok = read && checked && signed;
      accept.classList.toggle('off', !ok);
      if (ok) box.querySelector('.tos-hint').textContent = 'Kész. Lépj be a Discord-hívásba, oszd meg a képernyőt, kapcsold be a kamerát, aztán nyomd meg a zöld gombot.';
    }
    function onScroll() {
      if (read) return;
      if (text.scrollTop + text.clientHeight >= text.scrollHeight - 8) {
        read = true;
        check.disabled = false;
        label.classList.remove('disabled');
        box.querySelector('.tos-hint').textContent = 'Most pipáld be és írd alá.';
        update();
      }
    }
    text.addEventListener('scroll', onScroll);
    check.addEventListener('change', function () { checked = check.checked; update(); });
    pad.addEventListener('click', function () {
      if (signed) return;
      signed = true;
      pad.classList.add('signed');
      pad.textContent = RG.cfg.name;
      update();
    });
    update();

    // Az elutasítás gomb elmenekül, és ha mégis elkapod, akkor sem működik.
    var decline = ui.make('button', 'tos-decline', 'Nem fogadom el');
    decline.type = 'button';
    decline.style.left = '808px';
    decline.style.top = '300px';
    ui.addOverlay(decline);
    ui.flee(decline, {
      hops: 3,
      region: [806, 110, 4, 300],
      onClick: function () { ui.say('Az elutasítás nem lehetséges (lásd 7. §).', 3500); }
    });

    return { box: box, text: text, check: check, pad: pad, accept: accept, scrolled: onScroll };
  };
})(window.RG);
