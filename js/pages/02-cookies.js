// 2. pálya: hírportál felugró ablakokkal, sütikkel és hírlevéllel.
(function (RG) {
  'use strict';
  var E = RG.E;

  // Mozgó felugró ablak. Ha hozzáérsz az X-hez, bezárul alattad.
  function popup(x, y, w, o) {
    var m = E.mover(x, y, w, 80, {
      from: [x, y], to: o.to, speed: o.speed || 1, cls: 'popup', tag: o.tag,
      html: '<div class="pop-bar"><span>' + o.title + '</span><b>✕</b></div><div class="pop-body">' + o.body + '</div>'
    });
    var move = m.update, closing = -1;
    m.update = function (G, e) {
      move(G, e);
      if (closing < 0 && G.overlap(G.player, { x: e.x + e.w - 24, y: e.y - 2, w: 24, h: 20 })) {
        closing = 8;
        RG.ui.sfx('trap');
        e.el.classList.add('closing');
      }
      if (closing > 0 && --closing === 0) e.active = false;
    };
    return m;
  }

  RG.levels.push({
    id: 'cookies', url: 'hirek', theme: 'news', w: 2960, h: 540,
    spawn: { x: 60, y: 430 },

    build: function (G) {
      var name = RG.esc(RG.cfg.name);
      var list = [
        E.deco(30, 50, 900, 40, { cls: 'n-logo', html: 'HÍRPORTÁL<b>24</b>' }),
        E.deco(30, 96, 560, 90, { cls: 'n-head', html: 'Szakértők szerint ' + name + ' idősebb lett' }),
        E.deco(30, 190, 440, 60, { cls: 'n-text', html: 'A jelenség évente egyszer fordul elő. A részletekért kattints a hírek között bújkáló ajándékra.' }),

        E.block(0, 460, 520, 80, { cls: 'n-floor' }),
        E.popspike(430, 460, { trigger: [385, 470] }),

        popup(540, 390, 170, { to: [700, 390], speed: 1, title: 'Figyelem!', body: 'A gépe sebességét csökkentettük.', tag: 'w1' }),
        popup(930, 310, 170, { to: [930, 420], speed: 1, title: 'Gratulálunk!', body: 'Ön a 999 999. látogató.', tag: 'w2' }),
        E.hazard(1000, 196, 74, 44, { cls: 'n-coin', html: '🎉 iPhone', reason: 'coin' }),
        popup(1120, 380, 150, { to: [1190, 380], speed: 0.8, title: 'Frissítés', body: 'Újraindítás 3 óra múlva.', tag: 'w3' }),

        E.block(1300, 460, 620, 80, { cls: 'n-floor' }),
        E.checkpoint('l2a', 1330, 460),
        E.crusher(1500, 90, { h: 300, mid: 20, amp: 140, period: 180, phase: 0, cls: 'n-ad', html: 'HIRDETÉS<br><small>Átugorható 5 mp múlva</small>' }),
        E.crusher(1660, 90, { h: 300, mid: 20, amp: 140, period: 180, phase: 70, cls: 'n-ad', html: 'HIRDETÉS<br><small>Fogyj 10 kilót, most</small>' }),
        E.checkpoint('l2fake', 1810, 460, { fake: true }),

        E.block(1920, 460, 380, 80, { cls: 'n-floor' }),
        E.checkpoint('l2b', 1990, 460),
        E.popspike(2130, 460, { trigger: [2078, 2190] }),
        E.dropper(2230, 110, 110, 40, { cls: 'n-breaking', html: 'BREAKING NEWS', trigger: [2200, 2290] }),

        // Kommentszekció: lépcső az ajándékhoz
        E.deco(2330, 330, 300, 30, { cls: 'n-text', html: 'Kommentek (412)' }),
        E.platform(2340, 420, 120, 22, { cls: 'n-comment', html: 'Első!' }),
        E.platform(2500, 360, 120, 22, { cls: 'n-comment', html: 'Ki kérdezte?' }),
        E.patrol(2630, 230, 34, 34, { axis: 'y', from: 230, to: 370, speed: 2, cls: 'emoji n-bell', html: '🔔' }),
        E.collapse(2670, 300, 90, 22, { cls: 'n-comment', html: 'Ez fake.', delay: 24 }),
        E.block(2790, 300, 170, 240, { cls: 'n-floor' }),

        E.goal(2230, 426, {
          hops: [{ x: 2880, y: 266, say: 'Szerinted ezt hagyom?' }]
        })
      ];

      if (!G.flags.newsletter) {
        list.push(E.block(1920, 40, 40, 420, { cls: 'n-wall', tag: 'nlwall', html: 'HÍRLEVÉL' }));
        list.push(E.zone(1895, function () {
          RG.ui.modal({
            cls: 'newsletter',
            html: '<div class="nl-title">Iratkozz fel a hírlevelünkre!</div><div class="nl-sub">Csak napi 40 levelet küldünk.</div><div class="nl-field">pelda@levelcim.hu</div>',
            buttons: [
              {
                label: 'Feliratkozom!', cls: 'nl-yes',
                onClick: function () { RG.ui.say('Már fel vagy iratkozva. Örökre.'); }
              },
              {
                label: 'Nem, köszönöm, utálom a szülinapokat', cls: 'nl-no',
                onClick: function (close) {
                  G.flags.newsletter = true;
                  G.ents.forEach(function (e) { if (e.tag === 'nlwall') e.active = false; });
                  close();
                  G.save();
                }
              }
            ]
          });
        }));
      }

      if (!G.flags.cookie) {
        list.push(E.zone(190, function () {
          RG.ui.cookieBanner(function () {
            G.flags.cookie = true;
            RG.ui.say('Köszönjük. Ezt megjegyeztük.');
            G.save();
          });
        }));
      }

      return list;
    }
  });
})(window.RG);
