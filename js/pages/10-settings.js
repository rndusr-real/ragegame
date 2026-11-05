// 10. pálya: a beállítások tényleg átírják a játékot, a végén a törött 404-es oldal.
(function (RG) {
  'use strict';
  var E = RG.E;

  function row(x, label, id) {
    return E.deco(x, 330, 250, 60, {
      cls: 'set-row', tag: id,
      html: '<span>' + label + '</span><i class="toggle"></i>'
    });
  }
  function setRow(G, id, on) {
    G.ents.forEach(function (e) {
      if (e.tag === id) e.el.querySelector('.toggle').classList.toggle('on', on);
    });
  }

  var STEPS = ['Könnyű', 'Közepes', 'Nehéz', 'Nagyon nehéz', 'Reménytelen'];

  function slider(x, y, endX, floorEnd) {
    var start = x;
    return E.block(x, y, 70, 24, {
      oneway: true, cls: 'set-knob', html: STEPS[0],
      update: function (G, e) {
        e.dx = 0;
        if (G.player.ground === e) {
          e.dx = 2;
          e.x += 2;
          var i = Math.min(STEPS.length - 1, Math.floor((e.x - start) / (endX - start) * STEPS.length));
          if (e.label !== i) { e.label = i; e.el.textContent = STEPS[i]; }
          if (e.x >= endX) {
            e.x = start;
            e.dx = 0;
            e.label = 0;
            e.el.textContent = STEPS[0];
            RG.ui.say('Nehézség visszaállítva. Szívesen.');
          }
        }
      }
    });
  }

  RG.levels.push({
    id: 'settings', url: 'beallitasok', theme: 'settings', w: 4720, h: 540,
    spawn: { x: 60, y: 430 },

    build: function () {
      return [
        E.deco(30, 50, 500, 40, { cls: 'set-title', html: '⚙️ Beállítások' }),
        E.deco(30, 92, 500, 30, { cls: 'set-sub', html: 'A módosítások azonnal, kérdés nélkül érvénybe lépnek.' }),

        // Felcserélt irányok
        E.block(0, 460, 620, 80, { cls: 'set-floor' }),
        row(210, 'Irányok felcserélése', 'invert'),
        E.zone(300, function (G) {
          G.mods.invert = true;
          setRow(G, 'invert', true);
          RG.ui.say('Beállítás mentve. Ja, és most balra van a jobb.', 3500);
          RG.ui.sfx('trap');
        }),
        E.block(700, 460, 800, 80, { cls: 'set-floor' }),
        E.spike(900, 436, 40, 24),
        E.popspike(1040, 460, { trigger: [1000, 1090] }),
        E.zone(1120, function (G) {
          G.mods.invert = false;
          setRow(G, 'invert', false);
          RG.ui.say('Visszaállítva. Most már megint jó. Vagy nem?');
        }),

        E.spike(1150, 436, 30, 24),

        // Holdgravitáció, tüskés plafon alatt
        E.checkpoint('l5a', 1200, 460),
        row(1240, 'Gravitáció: holdi', 'grav'),
        E.zone(1300, function (G) {
          G.mods.gravity = 0.22;
          setRow(G, 'grav', true);
          RG.ui.say('Csak finoman az ugrással. A plafon tüskés.', 3500);
          RG.ui.sfx('trap');
        }),
        E.spike(1380, 220, 540, 20, { cls: 'flip' }),
        E.block(1600, 460, 120, 80, { cls: 'set-floor' }),
        E.block(1820, 460, 580, 80, { cls: 'set-floor' }),
        E.zone(1930, function (G) {
          G.mods.gravity = G.PHYS.gravity;
          setRow(G, 'grav', false);
        }),

        // Sötét mód
        E.checkpoint('l5b', 2030, 460),
        row(2070, 'Sötét mód: nagyon', 'dark'),
        E.zone(2120, function (G) {
          G.mods.dark = true;
          RG.ui.say('Sötét mód bekapcsolva. A szemednek jobb így.', 3500);
          RG.ui.sfx('trap');
        }),
        E.spike(2270, 436, 30, 24),
        E.block(2490, 460, 260, 80, { cls: 'set-floor' }),
        E.spike(2620, 436, 30, 24),
        E.block(2840, 460, 60, 80, { cls: 'set-floor' }),
        E.zone(2850, function (G) { G.mods.dark = false; }),

        // A nehézségi csúszka: a gomb maga a platform
        E.deco(2930, 370, 340, 30, { cls: 'set-sub', html: 'Nehézség: húzd arra, amerre szeretnéd' }),
        E.deco(2910, 450, 370, 4, { cls: 'set-rail' }),
        slider(2910, 440, 3210),
        E.block(3300, 460, 170, 80, { cls: 'set-floor' }),
        E.checkpoint('l5c', 3320, 460),

        // Innentől elromlik az oldal
        E.zone(3370, function (G) {
          G.setTheme('broken');
          RG.ui.setUrl('beallitasok/404');
          RG.ui.say('A beállítások mentése nem sikerült. Az oldal sem.', 3500);
          RG.ui.sfx('trap');
        }),
        E.platform(3390, 380, 60, 20, { cls: 'b-step', html: 'hiba' }),
        E.block(3470, 300, 140, 240, { cls: 'b-digit', html: '4' }),
        E.collapse(3670, 300, 140, 240, { oneway: false, cls: 'b-digit', html: '0', delay: 22 }),
        E.block(3870, 300, 140, 240, { cls: 'b-digit', html: '4' }),
        E.deco(3470, 190, 540, 40, { cls: 'b-text', html: 'A keresett oldal nem található.' }),

        // Hamis link, ami visszadob
        E.sensor(3946, 268, 44, 32, function (G) {
          RG.ui.say('Rossz link. Szép próbálkozás.');
          RG.ui.sfx('trap');
          G.teleportBack();
        }),
        E.deco(3936, 266, 64, 32, { cls: 'b-link', html: 'Vissza a<br>főoldalra' }),

        // Láthatatlan padló az ajándékig
        E.invisibleFloor(4010, 300, 620, 240),
        E.deco(4020, 306, 600, 14, { cls: 'b-dots' }),
        E.deco(4120, 200, 320, 40, { cls: 'b-text', html: 'Itt nincs oldal. De padló még lehet.' }),
        E.goal(4570, 266, {})
      ];
    }
  });
})(window.RG);
