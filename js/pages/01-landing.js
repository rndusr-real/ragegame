// 1. pálya: a giccses üdvözlőoldal, itt derül ki, hogy az oldal maga a pálya.
(function (RG) {
  'use strict';
  var E = RG.E;

  RG.levels.push({
    id: 'landing', url: 'udvozlet', theme: 'kitsch', w: 2720, h: 540,
    spawn: { x: 110, y: 430 },

    build: function (G) {
      var name = RG.esc(RG.cfg.name);
      var bang = G.flags.intro ? '' : RG.cfg.face
        ? '<span id="bang" class="bang-face" style="background-image:url(&quot;' + RG.esc(RG.cfg.face) + '&quot;)"></span>'
        : '<span id="bang">!</span>';
      return [
        E.deco(40, 62, 880, 76, { cls: 'k-title', html: 'Boldog szülinapot, ' + name + '! ' + bang }),
        E.deco(44, 144, 620, 30, { cls: 'k-sub', html: 'Sok boldogságot kívánok! Az ajándékodat lentebb találod.' }),
        E.deco(40, 186, 280, 34, { cls: 'k-hint', html: '<span class="hint-key">← → mozgás, szóköz: ugrás</span><span class="hint-touch">◀ ▶ mozgás, ▲ ugrás</span>' }),

        // 1. szakasz: bemelegítés
        E.block(0, 460, 620, 80, { cls: 'k-floor' }),
        E.deco(302, 330, 36, 36, { cls: 'emoji', html: '🎈' }),
        E.hidden(296, 372, 48, 22, { cls: 'k-block', html: 'Bocsi' }),
        E.popspike(520, 460, { trigger: [468, 560] }),

        // 2. szakasz: a menüsor
        E.platform(640, 440, 80, 24, { cls: 'k-nav', html: 'Kezdőlap' }),
        E.collapse(770, 440, 80, 24, { cls: 'k-nav', html: 'Rólunk', delay: 22 }),
        E.fake(900, 440, 80, 24, { cls: 'k-nav', html: 'Galéria' }),
        E.platform(895, 366, 64, 22, { cls: 'k-nav', html: 'Almenü' }),
        E.platform(1030, 440, 80, 24, { cls: 'k-nav', html: 'Kapcsolat' }),

        // 3. szakasz: a kép, ami rád esik
        E.block(1160, 460, 520, 80, { cls: 'k-floor' }),
        E.fake(1680, 460, 60, 80, { cls: 'k-floor' }),
        E.block(1740, 460, 220, 80, { cls: 'k-floor' }),
        E.checkpoint('l1a', 1190, 460),
        E.dropper(1400, 110, 120, 80, {
          cls: 'k-image', html: '🖼️<small>szulinap.jpg</small>',
          trigger: [1340, 1540], solidAfter: true
        }),
        E.popspike(1600, 460, { trigger: [1548, 1650] }),

        // 4. szakasz: fejbe vágó láthatatlan blokk a szakadék fölött
        E.deco(1800, 400, 130, 44, { cls: 'k-sign', html: 'Ugorj nyugodtan!<br>Itt biztonságos.' }),
        E.hidden(1958, 370, 44, 22, { cls: 'k-block', html: 'Vagy nem' }),
        E.block(2030, 460, 330, 80, { cls: 'k-floor' }),
        E.checkpoint('l1b', 2060, 460),
        E.popspike(2170, 460, { trigger: [2118, 2240] }),
        E.popspike(2200, 460, { trigger: [2118, 2240] }),
        E.dropper(2290, 120, 60, 40, {
          cls: 'k-image', html: 'Lorem', trigger: [2262, 2340], floorY: 470
        }),

        // 5. szakasz: szétomló szövegsor
        E.collapse(2360, 460, 50, 30, { cls: 'k-word', html: 'Sok', delay: 18 }),
        E.collapse(2410, 460, 50, 30, { cls: 'k-word', html: 'boldog', delay: 18 }),
        E.collapse(2460, 460, 50, 30, { cls: 'k-word', html: 'ságot', delay: 18 }),
        E.collapse(2510, 460, 50, 30, { cls: 'k-word', html: 'kívá', delay: 18 }),
        E.collapse(2560, 460, 50, 30, { cls: 'k-word', html: 'nok', delay: 18 }),
        E.block(2610, 460, 110, 80, { cls: 'k-floor' }),

        E.goal(1800, 426, {
          hops: [
            { x: 2300, y: 426, say: 'Az ajándék félénk.' },
            { x: 2670, y: 426, say: 'Nagyon félénk.' }
          ]
        })
      ];
    },

    onUpdate: function (G) {
      var drift = G.flags.introDrift;
      if (drift === undefined) return;
      var p = G.player;
      if (p.grounded) { delete G.flags.introDrift; return; }
      p.x += (drift - p.x) * 0.12;
    },

    onStart: function (G) {
      if (G.flags.intro) return;
      G.freeze = true;
      G.hidePlayer = true;
      var btn = RG.ui.make('button', 'intro-btn', 'Ajándékom megnyitása 🎁');
      btn.type = 'button';
      btn.setAttribute('tabindex', '-1');
      btn.addEventListener('click', function () {
        var bang = document.getElementById('bang');
        var r = bang.getBoundingClientRect();
        var at = G.toStage(r.left + r.width / 2, r.top + r.height / 2);
        at.x -= G.player.w / 2;
        at.y -= G.player.h / 2;
        var p = G.player;
        p.x = at.x + G.cam.x;
        p.y = at.y + G.cam.y;
        p.vx = 0;
        p.vy = 0;
        // Hosszú névnél a felkiáltójel a szakadék fölé esne: zuhanás közben a biztonságos részre sodródik.
        G.flags.introDrift = Math.min(p.x, 400);
        bang.remove();
        G.flags.intro = true;
        G.freeze = false;
        G.hidePlayer = false;
        btn.classList.add('fall');
        RG.ui.sfx('trap');
        RG.ui.say(RG.cfg.face ? 'Hoppá. Kiestél a címből. Most már te vagy a főszereplő.' : 'Hoppá. Kiesett a felkiáltójel a címből. Most már te vagy az.', 4000);
        setTimeout(function () { btn.remove(); }, 900);
        G.save();
      });
      RG.ui.addOverlay(btn);
      var askMusic = function () { if (!G.meta.music && RG.cfg.music) RG.ui.askMusic(); };
      var askCode = function () { if (!G.meta.codeOk) RG.ui.askCode(askMusic); else askMusic(); };
      if (!G.meta.tos) RG.ui.showTos(askCode);
      else askCode();
    }
  });
})(window.RG);
