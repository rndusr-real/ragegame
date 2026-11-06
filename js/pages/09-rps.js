// Minijáték: kő-papír-olló a szerver ellen, ami a te választásod után dönt.
(function (RG) {
  'use strict';

  var MOVES = [
    { icon: '🪨', name: 'kő' },
    { icon: '📄', name: 'papír' },
    { icon: '✂️', name: 'olló' }
  ];
  // Ki győzi le a k. lépést: papír a követ, olló a papírt, kő az ollót.
  function beats(k) { return (k + 1) % 3; }
  function losesTo(k) { return (k + 2) % 3; }

  var LINES = [
    'Vesztettél.',
    'Megint vesztettél.',
    'A szerver nem csal. Valószínűleg.',
    'Négy null. Ez már kínos.',
    'Öt null. A szerver unatkozik.',
    'Hat null. Szólni kéne valakinek.',
    'Szerencse.',
    'Na jó, ez is szerencse.'
  ];
  var WINS_NEEDED = 4;

  RG.levels.push({
    id: 'rps', url: 'ko-papir-ollo', theme: 'rps', w: 960, h: 540,
    spawn: { x: 0, y: 0 },

    build: function () { return []; },

    onStart: function (G) {
      G.freeze = true;
      G.hidePlayer = true;
      var panel = RG.ui.make('div', 'mg-panel rps-panel',
        '<div class="mg-title">Kő-papír-olló a szerver ellen</div>' +
        '<div class="mg-sub">' + WINS_NEEDED + ' győzelem kell a továbbjutáshoz.</div>' +
        '<div class="rps-score"></div><div class="rps-show"></div>' +
        '<div class="rps-moves"></div><div class="mg-msg"></div>');
      RG.ui.addOverlay(panel);
      var you = 0, server = 0, round = 0, finished = false;
      var movesEl = panel.querySelector('.rps-moves');

      function score() {
        panel.querySelector('.rps-score').textContent = 'Te: ' + you + ' · Szerver: ' + server;
      }

      MOVES.forEach(function (m, k) {
        var b = RG.ui.make('button', 'rps-move', m.icon + '<small>' + m.name + '</small>');
        b.type = 'button';
        b.setAttribute('tabindex', '-1');
        b.addEventListener('click', function () { play(k); });
        movesEl.appendChild(b);
      });

      function play(k) {
        if (finished) return;
        // Az első hat körben a szerver mindig nyer, utána "elfárad".
        var serverWins = round < 6;
        var s = serverWins ? beats(k) : losesTo(k);
        round++;
        if (serverWins) server++; else you++;
        panel.querySelector('.rps-show').innerHTML =
          'Te: ' + MOVES[k].icon + ' &nbsp;·&nbsp; Szerver: ' + MOVES[s].icon + ' <small>(utánad választott)</small>';
        score();
        RG.ui.sfx(serverWins ? 'die' : 'checkpoint');
        if (you >= WINS_NEEDED) {
          finished = true;
          panel.querySelector('.mg-msg').textContent = 'Rendben, nyertél. Szerverhiba. Ilyen többet nem lesz.';
          var btn = RG.ui.make('button', 'mg-btn', 'Tovább');
          btn.type = 'button';
          btn.setAttribute('tabindex', '-1');
          btn.addEventListener('click', function () { G.completeLevel(); });
          panel.appendChild(btn);
          return;
        }
        panel.querySelector('.mg-msg').textContent = LINES[Math.min(round - 1, LINES.length - 1)];
      }

      score();
    }
  });
})(window.RG);
