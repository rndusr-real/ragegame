// 6. pálya: videómegosztó. Átugorhatatlan reklám, pufferelő lejátszósáv, összeomló ajánlott videók.
(function (RG) {
  'use strict';
  var E = RG.E;

  // A lejátszósáv betöltött része: ezen lehet járni. Félúton egyszer visszaugrik.
  function bufferBar(x, y, maxW) {
    return E.block(x, y, 40, 12, {
      oneway: true, cls: 'v-buffer', tag: 'buffer', maxW: maxW, grow: 1.6, rebuffered: false, shrinkTo: 0,
      update: function (G, e) {
        var w = e.w;
        if (e.shrinkTo) {
          w = Math.max(e.shrinkTo, w - 14);
          if (w === e.shrinkTo) e.shrinkTo = 0;
        } else if (w < e.maxW) {
          w = Math.min(e.maxW, w + e.grow);
          if (!e.rebuffered && w >= e.maxW * 0.55) {
            e.rebuffered = true;
            e.shrinkTo = e.maxW * 0.22;
            RG.ui.say('Pufferelés…');
            RG.ui.sfx('trap');
          }
        }
        if (w !== e.w) {
          e.w = w;
          e.el.style.width = w + 'px';
        }
      }
    });
  }

  function thumb(kind, x, y, title) {
    var o = { cls: 'v-thumb', html: '<i>▶</i><span>' + title + '</span>' };
    if (kind === 'fake') return E.fake(x, y, 110, 56, o);
    return E.collapse(x, y, 110, 56, Object.assign(o, { delay: 32 }));
  }

  var level = {
    id: 'video', url: 'videok/szulinapi-meglepetes', theme: 'video', w: 3000, h: 540,
    spawn: { x: 60, y: 430 },

    build: function (G) {
      var list = [
        E.deco(20, 46, 300, 34, { cls: 'v-logo', html: '<b>▶</b> CsőTube' }),
        E.deco(20, 88, 900, 34, { cls: 'v-title', html: RG.fmt('Szülinapi meglepetés {name} részére (NEM KAMU!!!)') }),
        E.deco(20, 122, 600, 24, { cls: 'v-meta', html: '3 megtekintés · 1 perce · 0 tetszik' }),

        E.block(0, 460, 900, 80, { cls: 'v-floor' }),
        E.popspike(700, 460, { trigger: [650, 750] }),

        // Lejátszósáv a szakadék felett, közepén a töltés-pörgettyűvel
        E.deco(900, 462, 800, 8, { cls: 'v-track' }),
        bufferBar(900, 460, 800),
        E.deco(1250, 350, 140, 140, { cls: 'v-ring' }),
        E.orbit(1320, 420, 70, { cls: 'v-dot', a: Math.PI }),

        E.block(1700, 460, 600, 80, { cls: 'v-floor' }),
        E.checkpoint('l5a', 1730, 460),
        E.deco(1780, 300, 220, 30, { cls: 'v-meta', html: '📶 Kapcsolat: 1 pálcika' }),
        E.zone(1770, function (G) {
          G.mods.lag = 12;
          RG.ui.say('Gyenge internetkapcsolat. Minden kicsit később történik.', 3500);
          RG.ui.sfx('trap');
        }),
        E.zone(2272, function (G) {
          G.mods.lag = 0;
          RG.ui.say('Kapcsolat helyreállt.');
        }),
        E.popspike(2050, 460, { trigger: [1930, 2100] }),

        // Ajánlott videók: összeomlanak, az egyik nem is létezik
        E.deco(2320, 250, 300, 24, { cls: 'v-meta', html: 'Következő videók' }),
        thumb('real', 2320, 420, '10 ok, amiért ezt nem éred el'),
        thumb('real', 2470, 370, 'Hogyan ugorj? (oktatóvideó)'),
        thumb('fake', 2620, 370, 'A videó nem elérhető'),
        thumb('real', 2610, 300, 'Rage game speedrun'),

        E.block(2780, 460, 220, 80, { cls: 'v-floor' }),
        E.deco(2800, 360, 140, 36, { cls: 'v-sub', html: '🔔 Feliratkozás' }),

        E.goal(2150, 426, { hops: [{ x: 2940, y: 426, say: 'Ugorj a következő videóra. Ha bírsz.' }] })
      ];

      if (!G.flags.ad) {
        list.push(E.block(460, 40, 40, 420, { cls: 'v-adwall', tag: 'adwall', html: 'HIRDETÉS' }));
        list.push(E.zone(392, function () { level.startAd(); }));
      }
      return list;
    },

    onStart: function () { this.ad = null; },

    startAd: function () {
      var panel = RG.ui.make('div', 'v-adpanel', '<b>Hirdetés · 1/2</b><span class="v-adtext"></span>');
      RG.ui.addOverlay(panel);
      this.ad = { t: 300, round: 1, panel: panel, btn: null };
    },

    onUpdate: function (G) {
      var a = this.ad;
      if (!a) return;
      if (a.t > 0) {
        a.t--;
        var s = Math.ceil(a.t / 60);
        if (s !== a.shown) {
          a.shown = s;
          a.panel.querySelector('.v-adtext').textContent = 'A hirdetés ' + s + ' mp múlva átugorható';
        }
        return;
      }
      if (a.btn) return;
      a.panel.querySelector('.v-adtext').textContent = '';
      var btn = RG.ui.make('button', 'v-skip', 'Hirdetés átugrása ⏭');
      btn.type = 'button';
      btn.style.left = '700px';
      btn.style.top = '300px';
      RG.ui.addOverlay(btn);
      a.btn = btn;
      var self = this;
      RG.ui.flee(btn, {
        hops: a.round === 1 ? 2 : 0,
        region: [260, 160, 440, 140],
        onClick: function () {
          btn.remove();
          if (a.round === 1) {
            a.round = 2;
            a.t = 180;
            a.btn = null;
            a.shown = null;
            a.panel.querySelector('b').textContent = 'Hirdetés · 2/2';
            RG.ui.say('Még egy. Bocsi.');
            return;
          }
          a.panel.remove();
          self.ad = null;
          G.flags.ad = true;
          G.ents.forEach(function (e) { if (e.tag === 'adwall') e.active = false; });
          G.save();
        }
      });
    }
  };

  RG.levels.push(level);
})(window.RG);
