// 3. pálya: webshop, ahol az ajándékot kellene megvenni.
(function (RG) {
  'use strict';
  var E = RG.E;

  function card(x, top, w, emoji, label, price) {
    return E.block(x, top, w, 460 - top, {
      cls: 's-card',
      html: '<div class="s-pic">' + emoji + '</div><div class="s-name">' + label + '</div><div class="s-price">' + price + '</div>'
    });
  }

  RG.levels.push({
    id: 'shop', url: 'webshop/ajandek', theme: 'shop', w: 3120, h: 540,
    spawn: { x: 60, y: 430 },

    build: function (G) {
      var list = [
        E.deco(20, 48, 900, 36, { cls: 's-top', html: '🛒 Ajándék<b>.hu</b> <small>Ingyenes szállítás, ha elkapod</small>' }),

        E.block(0, 460, 1000, 80, { cls: 's-floor' }),
        card(280, 380, 120, '🧦', 'Zokni', '9 990 Ft'),
        card(450, 340, 120, '🎁', 'Ajándék', 'Elfogyott'),
        E.roller(1010, 424, 44, 36, {
          cls: 'emoji s-cart', html: '🛒', trigger: [640, 1000], vx: -6, endX: -60
        }),

        // Két akciós matrica rugóként. Az egyik fölött tüske van.
        E.spike(820, 180, 110, 20, { cls: 'flip' }),
        E.spring(850, 444, 50, 16, { cls: 's-sticker', html: '-50%' }),
        E.spring(1010, 444, 50, 16, { cls: 's-sticker', html: '-99%' }),
        E.block(1000, 460, 100, 80, { cls: 's-floor' }),
        E.block(1100, 240, 60, 300, { cls: 's-wall', html: 'KI<br>FOGY<br>OTT' }),

        E.block(1160, 460, 320, 80, { cls: 's-floor' }),
        E.block(1780, 460, 220, 80, { cls: 's-floor' }),
        E.checkpoint('l3a', 1200, 460),

        // Futószalag tüskével
        E.conveyor(1480, 460, 300, 80, { html: '« Kosár « Kosár « Kosár «' }),
        E.spike(1620, 436, 40, 24),
        E.spike(1740, 436, 30, 24),

        // Pénztár űrlap
        E.deco(2030, 280, 260, 30, { cls: 's-formtitle', html: 'Pénztár: add meg az adataidat' }),
        E.collapse(2030, 420, 110, 24, { cls: 's-field', html: 'Név', delay: 26 }),
        E.collapse(2170, 380, 110, 24, { cls: 's-field', html: 'Cím', delay: 26 }),
        E.fake(2310, 340, 110, 24, { cls: 's-field', html: 'Kuponkód' }),
        E.platform(2320, 302, 90, 24, { cls: 's-field', html: 'Ez jó' }),
        E.platform(2470, 360, 120, 24, { cls: 's-field', html: 'Megjegyzés' }),

        E.block(2620, 460, 500, 80, { cls: 's-floor' }),
        E.checkpoint('l3b', 2650, 460),
        E.deco(2740, 380, 110, 80, { cls: 's-pay', html: 'Fizetendő:<br><b>1 db lelki sérülés</b>' }),
        E.popspike(2900, 460, { trigger: [2848, 2960] }),
        E.roller(3120, 424, 44, 36, {
          cls: 'emoji s-cart', html: '🛒', trigger: [2950, 3100], vx: -5, endX: 2620
        }),

        E.goal(1900, 426, {
          hops: [
            { x: 2790, y: 346, say: 'Levonva: 1 db lelki sérülés.' },
            { x: 3060, y: 426, say: 'Köszönjük a vásárlást! Az ajándék kifogyott.' }
          ]
        })
      ];

      if (!G.flags.call) {
        list.push(E.zone(1470, function () {
          G.flags.call = true;
          RG.ui.fakeCall('VörÖske');
        }));
      }

      if (!G.flags.captcha) {
        list.push(E.block(1400, 40, 30, 420, { cls: 's-gate', tag: 'gate', html: 'Biztonsági ellenőrzés' }));
        list.push(E.zone(1340, function () {
          RG.ui.captcha(function () {
            G.flags.captcha = true;
            G.ents.forEach(function (e) { if (e.tag === 'gate') e.active = false; });
            G.save();
          });
        }));
      }

      return list;
    }
  });
})(window.RG);
