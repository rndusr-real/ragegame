// Scriptelt végigjátszás: bizonyítja, hogy minden pálya halál nélkül megoldható.
// Futtatás: nyisd meg az oldalt ?debug=1&level=0 címmel, majd a konzolban: RG.test.runAll()
(function (RG) {
  'use strict';
  var G = RG.G;

  function fail(msg) {
    var p = G.player;
    throw new Error(msg + ' @ x=' + p.x.toFixed(0) + ' y=' + p.y.toFixed(0) + ' level=' + G.level.id + ' frame=' + G.levelFrame);
  }
  function check() { if (G.dead) fail('Halál'); }
  function tick(inp) { RG.step(inp || {}); check(); }

  function wait(n) { for (var i = 0; i < n; i++) tick({}); }

  function waitUntil(fn, max, what) {
    for (var i = 0; i < (max || 2000); i++) {
      if (fn()) return;
      tick({});
    }
    fail('Időtúllépés: ' + (what || fn));
  }

  // Bemenet a kívánt irányból; felcserélt irányoknál a bot is fordítva nyom.
  function dirInput(dir, jump) {
    var d = G.mods.invert ? -dir : dir;
    return { left: d < 0, right: d > 0, jump: !!jump };
  }

  function settle() {
    for (var i = 0; i < 300; i++) {
      if (G.player.grounded && Math.abs(G.player.vx) < 0.2) return;
      tick({});
    }
    fail('Nem áll meg');
  }

  // Elmegy az adott x-ig a földön.
  function go(x, opts) {
    opts = opts || {};
    var p = G.player, start = p.x, dir = x > p.x ? 1 : -1, level = G.level;
    for (var i = 0; i < 3000; i++) {
      if (G.transition || G.level !== level) return;
      if ((dir > 0 && p.x >= x) || (dir < 0 && p.x <= x)) {
        if (!opts.keep) settle();
        return;
      }
      tick(dirInput(dir));
    }
    fail('go(' + x + ') nem ért oda, indult: ' + start);
  }

  // Ugrás a toX célig, teljes vagy rövidített magassággal. Földet érésig tart.
  function jump(toX, opts) {
    opts = opts || {};
    var p = G.player, dir = toX > p.x ? 1 : -1, hold = opts.hold === undefined ? 22 : opts.hold;
    var level = G.level, airborne = false;
    for (var i = 0; i < 400; i++) {
      if (G.transition || G.level !== level) return;
      var reached = dir > 0 ? p.x >= toX : p.x <= toX;
      var pressing = i < hold;
      var brake = reached && p.vx * dir > 0.3;
      tick(dirInput(brake ? -dir : (reached ? 0 : dir), pressing));
      if (!p.grounded) airborne = true;
      if (airborne && p.grounded) {
        if (!opts.keep) settle();
        return;
      }
    }
    fail('jump(' + toX + ') nem ért földet');
  }

  // Addig megy, amíg a feltétel nem teljesül.
  function runUntil(fn, dir) {
    for (var i = 0; i < 800; i++) {
      if (fn()) return;
      tick(dirInput(dir));
    }
    fail('runUntil időtúllépés');
  }

  // Addig megy, amíg egy felugró ablak meg nem állítja a játékot.
  function runUntilPaused(dir) {
    for (var i = 0; i < 800; i++) {
      if (G.paused) return;
      tick(dirInput(dir));
    }
    fail('Nem jelent meg az ablak');
  }

  function find(tag) {
    for (var i = 0; i < G.ents.length; i++) if (G.ents[i].tag === tag) return G.ents[i];
    fail('Nincs elem: ' + tag);
  }

  var curIndex = 0;
  function finish() {
    waitUntil(function () { return G.levelIndex === curIndex + 1 && !G.transition; }, 400, 'következő pálya');
  }

  /* ---------- pályánkénti megoldások ---------- */

  var SOLUTIONS = [
    // 1. pálya
    function () {
      G.flags.intro = true; G.freeze = false; G.hidePlayer = false; G.paused = false; RG.ui.clearOverlay();
      settle();
      go(440);
      jump(590);                     // kiugró tüske felett
      go(600);
      jump(650);                     // Kezdőlap
      jump(780, { keep: true });     // Rólunk (leszakad)
      hopTo(905);                    // Almenü
      jump(1050);                    // Kapcsolat
      jump(1180);                    // padló
      go(1345, { keep: true });      // kiváltja a lehulló képet
      for (var i = 0; i < 26; i++) tick(dirInput(-1));
      waitUntil(function () { return G.ents.some(function (e) { return e.landed; }); }, 200, 'kép földet ér');
      settle();
      go(1370);
      jump(1420);                    // fel a képre
      go(1505);
      jump(1640);                    // le a képről, a tüske fölött
      go(1655, { keep: true });
      jump(1765);                    // a hamis padlódarab felett
      go(1870);
      go(1905, { keep: true });
      jump(2050);                    // szakadék a láthatatlan blokk előtt
      go(2120, { keep: true });
      jump(2245);                    // két tüske felett
      wait(50);                      // megvárja, amíg a Lorem leesik
      // Egy lendülettel át a szétomló szavakon
      for (var j = 0; j < 90 && G.player.x < 2620; j++) tick(dirInput(1));
      go(2680, { keep: true });
      finish();
    },

    // 2. pálya
    function () {
      var p = G.player;
      go(200);
      // Süti-ablak: elfogadás
      document.querySelector('.cookie-accept').click();
      if (!G.flags.cookie) fail('Süti nem fogadva');
      go(370);
      jump(480);                     // kiugró tüske felett
      go(505);
      var w1 = find('w1');
      waitUntil(function () { return w1.x < 560; }, 500, 'w1 balra');
      jump(w1.x + 30);
      waitUntil(function () { return w1.x > 660 && w1.dir > 0; }, 500, 'w1 jobbra');
      var w2 = find('w2');
      // Ráállás a w2-re, amikor lent van
      waitUntil(function () { return w2.y > 380 && w1.x > 680; }, 900, 'w2 lent');
      go(w1.x + 110, { keep: true });
      jump(960);
      if (G.player.ground !== w2) fail('nem w2-n áll');
      var w3 = find('w3');
      waitUntil(function () { return w2.y > 360 && w3.x < 1140; }, 1400, 'w3 közel');
      go(1060, { keep: true });
      jump(1150);
      go(G.player.x + 60, { keep: true });
      waitUntil(function () { return w3.x > 1170; }, 500, 'w3 jobbra');
      jump(1320);                    // padló
      go(1345);
      var ads = G.ents.filter(function (e) { return e.cls.indexOf('n-ad') >= 0; });
      go(1450);
      waitUntil(function () { return ads[0].y + ads[0].h < 260 && ads[0].dy !== 1e9 && (ads[0].y + ads[0].h) < 240; }, 400, 'reklám fent');
      go(1620);
      waitUntil(function () { return ads[1].y + ads[1].h < 240; }, 400, 'reklám 2 fent');
      go(1775);
      jump(1850);                    // a hamis mentés felett
      runUntilPaused(1);
      // Hírlevél: a kis link enged tovább
      document.querySelector('.nl-no').click();
      if (!G.flags.newsletter) fail('Hírlevél nyitva');
      go(2010);
      go(2075);
      jump(2190);                    // tüske felett
      wait(50);                      // megvárja a BREAKING NEWS-t
      go(2285);
      jump(2370);                    // Első!
      hopTo(2530);                   // Ki kérdezte?
      var bell = G.ents.filter(function (e) { return e.cls.indexOf('n-bell') >= 0; })[0];
      waitUntil(function () { return bell.y > 290 && bell.dir > 0; }, 300, 'csengő lefelé');
      go(2600, { keep: true });
      jump(2700, { keep: true });
      jump(2830);
      go(p.x + 60, { keep: true });
      waitUntil(function () { return !G.ents.some(function (e) { return e.type === 'goal' && e.anim; }); }, 100, 'ajándék megáll');
      go(2880, { keep: true });
      finish();
    },

    // 3. pálya
    function () {
      go(240);
      jump(300);                     // Zokni kártya
      go(385, { keep: true });
      jump(470);                     // Ajándék kártya
      go(600, { keep: true });
      go(640, { keep: true });       // kiváltja a kocsit
      var cart = G.ents.filter(function (e) { return e.cls.indexOf('s-cart') >= 0; })[0];
      waitUntil(function () { return cart.x - G.player.x < 120; }, 200, 'kocsi közel');
      jump(740);                     // a kocsi fölött
      go(790);
      jump(930);                     // a -50% rugó felett
      go(1012, { keep: true });      // a -99% rugó
      // A rugó kilő: jobbra sodródva fel a falra
      for (var i = 0; i < 120 && !(G.player.grounded && G.player.y < 300); i++) tick(dirInput(1));
      if (G.player.y > 300) fail('nem jutott fel a falra');
      go(1165, { keep: true });
      settle();
      runUntilPaused(1);
      // CAPTCHA
      if (!G.paused) fail('Nincs CAPTCHA');
      var check = document.querySelector('.captcha-check');
      check.click(); check.click(); check.click();
      check.click();
      if (G.paused || !G.flags.captcha) fail('CAPTCHA nem engedett');
      go(1560);
      jump(1695, { keep: true });    // tüske felett a szalagon
      jump(1800);                    // második tüske
      go(1985);
      go(2010, { keep: true });
      jump(2060, { keep: true });    // Név
      jump(2190, { keep: true });    // Cím
      hopTo(2340);                   // Ez jó
      hopTo(2490);                   // Megjegyzés
      go(2570);
      jump(2660);
      go(2845);
      jump(2960);                    // kiugró tüske
      var carts = G.ents.filter(function (e) { return e.cls.indexOf('s-cart') >= 0; });
      var c2 = carts[1];
      waitUntil(function () { return c2.armed && c2.x - G.player.x < 60; }, 200, 'második kocsi');
      jump(3040, { keep: true });
      go(3075, { keep: true });
      finish();
    },

    // 4. pálya
    function () {
      var route = [[130, 2160], [420, 2080], [720, 2000], [520, 1920]];
      route.forEach(function (c) { hopTo(c[0], c[1]); });
      // Balra a lájk rugóra, onnan jobbra fel
      var p = G.player, launched = false, i;
      go(486, { keep: true });       // a törlődő buborék széléig
      for (i = 0; i < 240; i++) {
        if (!launched && p.vy < -12 && i > 3) launched = true;
        if (launched && p.grounded) break;
        tick(launched ? dirInput(p.x < 500 ? 1 : 0) : dirInput(p.x > 425 ? -1 : 1, i < 20));
      }
      if (p.y + p.h > 1621) fail('nem ért a rugós buborékra');
      settle();
      go(500);                       // ellenőrzőpont
      var bell = G.ents.filter(function (e) { return e.cls.indexOf('c-bell') >= 0; });
      waitBell(bell[0], 150, 600);
      hopTo(300, 1540);
      waitBell(bell[0], 150, 600);
      hopTo(450, 1460);
      hopTo(660, 1380);
      hopTo(760, 1300);
      hopTo(560, 1220);
      hopTo(320, 1140);
      hopTo(480, 1060);
      go(530);
      waitBell(bell[1], 150, 800);
      hopTo(760, 980);
      waitBell(bell[1], 150, 800);
      hopTo(600, 900);
      hopTo(400, 820);
      var mover = G.ents.filter(function (e) { return e.from && e.cls.indexOf('c-bubble') >= 0 && e.from[1] === 800; })[0];
      waitUntil(function () { return mover.y > 780; }, 300, 'mozgó lent');
      hopTo(620);
      if (p.ground !== mover) fail('nem a mozgó buborékon');
      waitUntil(function () { return mover.y < 712; }, 300, 'mozgó fent');
      waitBell(bell[2], 150, 800);
      hopTo(720, 660);
      waitBell(bell[2], 150, 800);
      hopTo(520, 580);
      // Balra a második lájk rugóra, onnan jobbra fel
      go(424, { keep: true });
      launched = false;
      for (i = 0; i < 300; i++) {
        if (!launched && p.vy < -12 && i > 3) launched = true;
        if (launched && p.grounded) break;
        tick(launched ? dirInput(p.x < 480 ? 1 : 0) : dirInput(p.x > 320 ? -1 : 1, i < 20));
      }
      if (p.y > 270) fail('nem ért a felső buborékra');
      settle();
      hopTo(720, 190);
      hopTo(640, 110);
      if (!G.transition) {
        go(560, { keep: true });     // az ajándék elugrik
        waitUntil(function () { return !G.ents.some(function (e) { return e.type === 'goal' && e.anim; }); }, 100, 'ajándék');
        go(650, { keep: true });
      }
      finish();
    },

    // Minijáték: gyertyák
    function () {
      for (var i = 0; i < 600 && !document.querySelector('.cake-panel .mg-btn'); i++) {
        document.querySelectorAll('.candle.lit').forEach(function (c) { c.click(); });
        tick({});
      }
      var btn = document.querySelector('.cake-panel .mg-btn');
      if (!btn) fail('Nem aludt ki minden gyertya');
      btn.click();
      finish();
    },

    // 6. pálya: videó
    function () {
      var p = G.player, lvl = G.level;
      go(380, { keep: true });
      runUntil(function () { return lvl.ad; }, 1);
      settle();
      waitUntil(function () { return document.querySelector('.v-skip'); }, 400, 'átugrás gomb 1');
      document.querySelector('.v-skip').click();
      waitUntil(function () { return document.querySelector('.v-skip'); }, 300, 'átugrás gomb 2');
      document.querySelector('.v-skip').click();
      if (!G.flags.ad) fail('Hirdetés nem tűnt el');
      go(612, { keep: true });
      jump(770);                     // kiugró tüske
      go(870);
      var buf = find('buffer');
      waitUntil(function () { return buf.w >= buf.maxW; }, 1500, 'pufferelés kész');
      go(1180);
      var dot = G.ents.filter(function (e) { return e.reason === 'spinner'; })[0];
      waitUntil(function () {
        var a = ((dot.a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        return a > 2.9 && a < 3.3;
      }, 400, 'pörgettyű bal oldalt');
      go(1720);
      go(1950, { keep: true });
      jump(2110);                    // kiugró tüske, késleltetéssel
      go(2262);
      hopTo(2340);                   // ajánlott videók
      hopTo(2500);
      hopTo(2640);
      hopTo(2800);
      go(2945, { keep: true });
      finish();
    },

    // Minijáték: kvíz (egy rossz válasszal, hogy a visszaugrás is ki legyen próbálva)
    function () {
      function opt(k) { return document.querySelector('.quiz-opt[data-k="' + k + '"]'); }
      opt(1).click();                // 1. kérdés: életkor
      opt(0).click();                // 2. kérdés: a név
      opt(0).click();                // 3. kérdés: 4 -> rossz, vissza az elejére
      if (document.querySelector('.quiz-count').textContent.indexOf('1/') < 0) fail('Rossz válasz után nem ugrott vissza');
      opt(1).click();
      opt(2).click();
      opt(2).click();                // 5
      opt(1).click();                // élvezed? nem
      var btn = document.querySelector('.quiz-panel .mg-btn');
      if (!btn) fail('Kvíz nem ért véget');
      btn.click();
      finish();
    },

    // 8. pálya: e-napló
    function () {
      var p = G.player;
      go(560, { keep: true });
      jump(640, { keep: true });     // ötös
      jump(790, { keep: true });     // egyes: azonnal tovább
      jump(870);                     // ötös
      go(895, { keep: true });
      jump(1040);                    // hiányzó jegy felett a négyesre
      jump(1110, { keep: true });    // egyes
      jump(1190);                    // ötös
      jump(1300);                    // padló
      go(1360);                      // indul a határidő
      if (!G.level.deadline) fail('Nem indult a határidő');
      go(1475);
      var mover = G.ents.filter(function (e) { return e.cls.indexOf('g-row') >= 0; })[0];
      waitUntil(function () { return mover.x < 1530 && mover.dir < 0; }, 300, 'órarend balra');
      jump(mover.x + 30, { keep: true });
      if (p.ground !== mover) fail('nem az órarenden');
      waitUntil(function () { return mover.x > 1630; }, 300, 'órarend jobbra');
      jump(1770);
      go(1790);
      var into = find('into');
      waitUntil(function () {
        var ph = (into.t % into.period) / into.period * 2 * Math.PI;
        return Math.sin(ph) < -0.5 && Math.cos(ph) < 0;
      }, 300, 'intő felmegy');
      go(1975, { keep: true });
      jump(2110);                    // szakadék
      go(2122);
      go(2145, { keep: true });      // leejti a dolgozatot
      for (var i = 0; i < 14; i++) tick(dirInput(-1));
      wait(40);
      go(2320);                      // beadás
      if (G.level.deadline) fail('Nem sikerült beadni');
      go(2515, { keep: true });      // fejjel lefelé szakasz
      if (!G.mods.flip) fail('Nem fordult meg a kép');
      jump(2620);
      go(2700);
      var letter = find('letter');
      go(2745);
      waitUntil(function () { return letter.y < 262 && letter.dir < 0; }, 400, 'levél fent');
      jump(2900);
      go(2905, { keep: true });
      jump(3050);                    // kiugró tüske
      go(3150, { keep: true });
      finish();
    },

    // Minijáték: kő-papír-olló
    function () {
      for (var i = 0; i < 10 && !document.querySelector('.rps-panel .mg-btn'); i++) {
        document.querySelectorAll('.rps-move')[i % 3].click();
      }
      var btn = document.querySelector('.rps-panel .mg-btn');
      if (!btn) fail('Nem lehetett nyerni');
      btn.click();
      finish();
    },

    // 10. pálya: beállítások
    function () {
      go(595);                       // felcserélt irányokkal
      jump(720);
      go(850);
      jump(960);                     // tüske
      go(985);
      jump(1100, { keep: true });    // kiugró tüske
      jump(1215);                    // tüske az ellenőrzőpont előtt
      // Hold: rövid ugrások
      go(1470);
      jump(1610, { hold: 4 });
      go(1690);
      jump(1835, { hold: 4 });
      go(2040);
      go(2220);
      jump(2320, { hold: 22 });      // sötétben tüske
      go(2375);
      jump(2510);
      go(2570);
      jump(2670);
      go(2730);
      jump(2850);
      go(2870, { keep: true });
      // Csúszka
      jump(2925);
      if (G.player.ground && G.player.ground.cls.indexOf('set-knob') < 0) fail('nem a csúszkán áll');
      waitUntil(function () { return G.player.ground && G.player.ground.x > 3130; }, 200, 'csúszka vége');
      jump(3320, { keep: true });
      settle();
      go(3365);
      jump(3400);                    // lépcső
      jump(3480);                    // első 4
      go(3585);
      jump(3690);                    // 0
      go(3770, { keep: true });
      jump(3890);                    // második 4
      go(3905, { keep: true });
      jump(4040);                    // a hamis link felett, a láthatatlan padlóra
      go(4570, { keep: true });
      finish();
    },

    // Hamis győzelem: a stáblista mindenképp megöl
    function () {
      var start = G.deaths;
      for (var i = 0; i < 1500 && G.level.id === 'credits'; i++) RG.step({});
      if (G.deaths !== start + 1) fail('A stáblista nem ölt meg');
      if (G.level.id !== 'loading') fail('Nem ment tovább a töltőre');
    },

    // Töltőképernyő és dobozok
    function () {
      waitUntil(function () { return document.querySelector('.load-btn'); }, 700, 'első hiba');
      if (document.querySelector('.load-pct').textContent !== '99%') fail('Nem 99%-on állt meg');
      document.querySelector('.load-btn').click();
      waitUntil(function () { return document.querySelector('.load-btn'); }, 400, 'második hiba');
      document.querySelector('.load-btn').click();
      for (var i = 0; i < 5; i++) document.querySelector('.gift-box').click();
      if (document.querySelector('.gift-box')) fail('Maradt doboz');
      document.querySelector('.load-btn').click();
      finish();
    },

    // Zsákutca: nincs kijárat
    function () {
      if (G.level.id !== 'deadend') fail('Nem a zsákutcában vagyunk');
      for (var i = 0; i < 300; i++) tick({ right: true, jump: i % 40 === 0 });
      var maxX = G.player.x;
      for (i = 0; i < 400; i++) tick({ left: true, jump: i % 40 === 0 });
      if (G.level.id !== 'deadend') fail('Kijutott a zsákutcából');
      if (maxX > 920 || G.player.x < 40) fail('Átment a falon');
      if (!document.querySelector('.d-restart')) fail('Nincs újrakezdés gomb');
    }
  ];

  function hopTo(x, topY) {
    // Nekifut a jelenlegi buborék széléig, majd felugrik a következőre.
    var p = G.player, g = p.ground;
    if (g) {
      var dir = x > p.x ? 1 : -1;
      var inside = x >= g.x && x + p.w <= g.x + g.w;
      var edge = dir > 0 ? g.x + g.w - p.w - 4 : g.x + 4;
      if (!inside) {
        // Nekifutás: ha túl közel áll a szélhez, előbb hátrál egy kicsit.
        if (g.delay === undefined && (dir > 0 ? edge - p.x : p.x - edge) < 50 && p.vx * dir < 2) {
          var back = Math.max(g.x + 2, Math.min(g.x + g.w - p.w - 2, edge - dir * 70));
          go(back, { keep: true });
        }
        if (dir > 0 ? p.x < edge : p.x > edge) go(edge, { keep: true });
      }
    }
    jump(x, { hold: 24, keep: true });
    if (G.transition) return;
    if (topY !== undefined && Math.abs(G.player.y + G.player.h - topY) > 2 && G.player.y + G.player.h > topY + 2) {
      fail('Nem ért fel ide: ' + x + ',' + topY + ' (talaj: ' + (G.player.ground ? G.player.ground.cls + '@' + G.player.ground.y : 'nincs') + ', vy=' + G.player.vy.toFixed(1) + ')');
    }
  }

  function waitBell(bell, minDist, max) {
    waitUntil(function () {
      var d = bell.x - G.player.x, away = (d > 0 && bell.dir > 0) || (d < 0 && bell.dir < 0);
      return Math.abs(d) > 450 || (Math.abs(d) > 90 && away);
    }, max || 300, 'csengő távol');
  }

  RG.test = {
    h: { go: go, jump: jump, wait: wait, settle: settle, tick: tick, hopTo: hopTo, waitUntil: waitUntil },
    runLevel: function (i) {
      RG.holdLoop = true;
      G.god = false;
      G.loadLevel(i);
      curIndex = i;
      var deaths = G.deaths;
      SOLUTIONS[i]();
      if (RG.levels[i].id !== 'credits' && G.deaths !== deaths) fail('Halál történt');
      RG.render();
      return 'OK: ' + RG.levels[i].id + ' (' + G.playFrames + ' képkocka összesen)';
    },
    runAll: function () {
      var results = [];
      G.playFrames = 0;
      for (var i = 0; i < SOLUTIONS.length; i++) {
        try {
          results.push(RG.test.runLevel(i));
        } catch (e) {
          results.push('HIBA: pálya ' + i + ': ' + e.message);
        }
      }
      return results;
    }
  };
})(window.RG);
