// 4. pálya: osztálycsoport. Felfelé kell mászni, alulról jönnek az olvasatlan üzenetek.
(function (RG) {
  'use strict';
  var E = RG.E;

  var chatIndex = 0;
  function message(index) {
    var list = RG.cfg.chat;
    return list[index % list.length];
  }
  function bubbleHtml(index) {
    var m = message(index);
    return '<small>' + RG.esc(m.from) + '</small><span>' + RG.fmt(m.text) + '</span>';
  }
  function longCls(index) { return message(index).text.length > 30 ? ' long' : ''; }
  function side(x) { return x + 100 > 480 ? 'me' : ''; }

  function bubble(x, y, w) {
    var i = chatIndex++;
    return E.platform(x, y, w, 44, { cls: 'c-bubble ' + side(x) + longCls(i), html: bubbleHtml(i) });
  }
  function deleted(x, y, w) {
    return E.collapse(x, y, w, 44, { cls: 'c-bubble ' + side(x), html: '<small>Valaki</small><i>Ez az üzenet törölve lesz</i>', delay: 80 });
  }
  function typing(x, y, w) {
    return E.fake(x, y, w, 44, { cls: 'c-bubble typing ' + side(x), html: '<small>Valaki</small>gépel…' });
  }
  function moving(x, y, w, toY) {
    var i = chatIndex++;
    return E.mover(x, y, w, 44, { from: [x, y], to: [x, toY], speed: 1, cls: 'c-bubble ' + side(x) + longCls(i), html: bubbleHtml(i) });
  }
  function bell(y, from, to, speed) {
    return E.patrol(from, y, 34, 34, { axis: 'x', from: from, to: to, speed: speed, cls: 'emoji c-bell', html: '🔔' });
  }

  RG.levels.push({
    id: 'chat', url: 'osztalycsoport', theme: 'chat', w: 960, h: 2300,
    spawn: { x: 100, y: 2210 },

    build: function (G) {
      chatIndex = 0;
      var at = G.checkpoint || this.spawn;
      var rising = E.hazard(0, at.y + 280, 960, 900, {
        cls: 'c-unread', html: '<b>Olvasatlan üzenetek: 999+</b>', inset: 0, z: 5, reason: 'zone', delay: 150,
        update: function (G, e) {
          if (e.delay > 0) { e.delay--; return; }
          e.y -= 0.65;
        }
      });

      return [
        E.deco(40, 2110, 460, 30, { cls: 'c-sys', html: RG.fmt('{name} csatlakozott a csoporthoz. Innen nincs kilépés.') }),
        E.block(0, 2240, 960, 60, { cls: 'c-floor' }),

        bubble(120, 2160, 220),
        bubble(400, 2080, 220),
        bubble(700, 2000, 200),
        deleted(480, 1920, 160),
        bubble(250, 1840, 220),
        E.spring(410, 1824, 50, 16, { cls: 'c-like', html: '👍' }),
        bubble(420, 1620, 240),
        E.checkpoint('l4a', 500, 1620),

        bubble(150, 1540, 220),
        bell(1468, 60, 860, 3.8),
        bubble(400, 1460, 200),
        bubble(620, 1380, 200),
        typing(400, 1300, 200),
        bubble(720, 1300, 130),
        bubble(460, 1220, 200),
        bubble(200, 1140, 220),
        bubble(440, 1060, 220),
        E.checkpoint('l4b', 520, 1060),

        bubble(720, 980, 180),
        bell(906, 300, 860, 3.1),
        deleted(540, 900, 140),
        bubble(300, 820, 220),
        moving(580, 800, 180, 700),
        bubble(680, 660, 200),
        bell(588, 300, 860, 3.8),
        bubble(420, 580, 200),
        bubble(160, 500, 220),
        E.spring(300, 484, 50, 16, { cls: 'c-like', html: '👍' }),
        bubble(400, 270, 240),
        bubble(700, 190, 200),

        E.platform(300, 110, 400, 30, { cls: 'c-leave', html: 'Csoport elhagyása' }),
        E.goal(470, 76, { hops: [{ x: 640, y: 76, say: 'Te tényleg kilépnél a csoportból?' }], range: 90 }),

        rising
      ];
    }
  });
})(window.RG);
