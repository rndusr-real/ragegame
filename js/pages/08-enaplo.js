// 8. pálya: e-napló. Az egyesek leszakadnak, a házi feladatot határidőre be kell adni.
(function (RG) {
  'use strict';
  var E = RG.E;

  var DEADLINE = 20 * 60;

  function grade(x, mark) {
    var o = { cls: 'g-cell g' + mark, html: mark };
    if (mark === '1') return E.collapse(x, 420, 60, 40, Object.assign(o, { delay: 14 }));
    if (mark === '-') return E.fake(x, 420, 60, 40, { cls: 'g-cell gmiss', html: 'hiányzik' });
    return E.block(x, 420, 60, 40, o);
  }

  var level = {
    id: 'enaplo', url: 'enaplo/jegyek', theme: 'school', w: 3200, h: 540,
    spawn: { x: 60, y: 430 },

    build: function () {
      return [
        E.deco(20, 46, 400, 34, { cls: 'g-logo', html: '📘 E-Napló' }),
        E.deco(20, 86, 600, 28, { cls: 'g-meta', html: RG.fmt('Tanuló: {name} · Átlag: 1,2 · Magatartás: kérdéses') }),
        E.deco(20, 118, 560, 26, { cls: 'g-meta', html: 'Tipp: az egyesen ne állj sokáig.' }),

        E.block(0, 460, 600, 80, { cls: 'g-floor' }),
        grade(620, '5'), grade(700, '1'), grade(780, '1'), grade(860, '5'),
        grade(940, '-'), grade(1020, '4'), grade(1100, '1'), grade(1180, '5'),

        // Házi feladat: határidőre
        E.block(1280, 460, 220, 80, { cls: 'g-floor' }),
        E.checkpoint('l6a', 1300, 460),
        E.zone(1350, function (G) { level.startDeadline(G); }),
        E.mover(1520, 430, 80, 22, { from: [1520, 430], to: [1640, 430], speed: 1, cls: 'g-row', html: 'Órarend' }),
        E.block(1740, 460, 260, 80, { cls: 'g-floor' }),
        E.crusher(1850, 70, { h: 300, mid: 20, amp: 140, period: 150, phase: 0, cls: 'g-warn', html: 'FEGYELMI<br>INTŐ', tag: 'into' }),
        E.block(2090, 460, 690, 80, { cls: 'g-floor' }),
        E.dropper(2180, 120, 90, 40, { cls: 'g-paper', html: '📄 Dolgozat', trigger: [2140, 2240] }),
        E.deco(2290, 360, 60, 100, { cls: 'g-submit', html: '📤<br>Beadás' }),
        E.sensor(2300, 360, 40, 100, function (G) { level.stopDeadline(G); }),
        E.checkpoint('l6b', 2380, 460),
        E.zone(2430, function (G) {
          G.mods.flip = true;
          RG.ui.say('Szülői nézet bekapcsolva. Fejjel lefelé.', 3000);
          RG.ui.sfx('trap');
        }),
        E.spike(2560, 436, 30, 24),
        E.zone(2700, function (G) { G.mods.flip = false; }),

        // Szülői értesítő a szakadék felett
        E.patrol(2815, 250, 40, 30, { axis: 'y', from: 250, to: 420, speed: 1.6, cls: 'emoji g-letter', html: '✉️', tag: 'letter' }),
        E.block(2880, 460, 320, 80, { cls: 'g-floor' }),
        E.popspike(2980, 460, { trigger: [2930, 3030] }),

        E.goal(2600, 426, { hops: [{ x: 3150, y: 426, say: 'Az ajándék igazoltan hiányzik.' }] })
      ];
    },

    onStart: function () { this.deadline = null; },

    startDeadline: function (G) {
      if (this.deadline || G.flags.submitted) return;
      var el = RG.ui.make('div', 'g-timer', '');
      RG.ui.addOverlay(el);
      this.deadline = { t: DEADLINE, el: el };
      RG.ui.say('Beadási határidő: ' + DEADLINE / 60 + ' másodperc. Futás!', 3000);
    },

    stopDeadline: function (G) {
      if (!this.deadline) return;
      this.deadline.el.remove();
      this.deadline = null;
      G.flags.submitted = true;
      RG.ui.say('Beadva. Értékelés: 2-es. Gratulálunk?', 3000);
      RG.ui.sfx('checkpoint');
    },

    onUpdate: function (G) {
      var d = this.deadline;
      if (!d) return;
      d.t--;
      var s = Math.ceil(d.t / 60);
      if (s !== d.shown) {
        d.shown = s;
        d.el.textContent = '⏰ Beadási határidő: ' + s + ' mp';
        d.el.classList.toggle('hurry', s <= 5);
      }
      if (d.t <= 0) G.kill('deadline');
    }
  };

  RG.levels.push(level);
})(window.RG);
