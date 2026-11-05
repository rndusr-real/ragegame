// A befejezés: hamis győzelem, töltőképernyő, doboz a dobozban, zsákutca.
(function (RG) {
  'use strict';
  var E = RG.E;

  function minutes(frames) {
    var m = Math.floor(frames / 3600);
    var s = Math.floor(frames / 60) % 60;
    return m + ' perc ' + s + ' mp';
  }

  /* ---------- 1. hamis győzelem és gyilkos stáblista ---------- */

  RG.levels.push({
    id: 'credits', url: 'gratulalunk', theme: 'win', w: 960, h: 540,
    spawn: { x: 120, y: 430 },

    build: function () {
      return [
        E.deco(0, 70, 960, 90, { cls: 'win-title', html: 'GRATULÁLOK!' }),
        E.deco(0, 160, 960, 40, { cls: 'win-sub', html: RG.fmt('{name}, megnyerted a játékot! Az ajándék a tiéd!') }),
        E.deco(462, 400, 60, 60, { cls: 'win-gift', html: '🎁' }),
        E.block(0, 460, 960, 80, { cls: 'win-floor' })
      ];
    },

    onUpdate: function (G) {
      var f = G.levelFrame, lines = RG.cfg.credits, gap = 70, first = 170;
      if (f === 60) RG.ui.say('Köszönjük, hogy játszottál. Következik a stáblista.', 2600);
      for (var i = 0; i < lines.length; i++) {
        if (f === first + i * gap) {
          G.spawn(E.dropper(120 + ((i * 310) % 600), 30, 240, 34, {
            cls: 'win-credit', html: RG.fmt(lines[i]), trigger: [-9999, 9999], reason: 'credits'
          }));
        }
      }
      if (f === first + lines.length * gap + 50) {
        G.spawn(E.dropper(0, -70, 960, 70, {
          cls: 'win-end', html: 'VÉGE', trigger: [-9999, 9999], reason: 'credits', inset: 0
        }));
      }
    },

    // Innen nincs újraéledés: megy tovább a következő csalódásra.
    afterDeath: function (G) { G.loadLevel(G.levelIndex + 1); }
  });

  /* ---------- 2. ajándék betöltése és doboz a dobozban ---------- */

  var BOXES = [
    { size: 190, text: 'Itt egy doboz. Benne egy kisebb doboz.' },
    { size: 150, text: 'Még kisebb.' },
    { size: 112, text: 'Ez már gyanúsan könnyű.' },
    { size: 78, text: 'Megrázod. Nem zörög.' },
    { size: 48, text: 'Na, ez az utolsó.' }
  ];

  RG.levels.push({
    id: 'loading', url: 'ajandek/letoltes', theme: 'loading', w: 960, h: 540,
    spawn: { x: 0, y: 0 },

    build: function () { return []; },

    onStart: function (G) {
      G.freeze = true;
      G.hidePlayer = true;
      var panel = RG.ui.make('div', 'load-panel',
        '<div class="load-title">Ajándék betöltése…</div>' +
        '<div class="load-bar"><i></i></div><div class="load-pct">0%</div>' +
        '<div class="load-msg"></div><div class="load-actions"></div>');
      RG.ui.addOverlay(panel);
      this.panel = panel;
      this.state = { start: 0, end: 280, stall: 200, attempt: 1 };
    },

    onUpdate: function (G) {
      var st = this.state, panel = this.panel;
      if (!st || st.done) return;
      st.start++;
      var u = Math.min(1, st.start / st.end);
      var pct = Math.min(99, Math.floor(99 * (1 - Math.pow(1 - u, 2))));
      panel.querySelector('.load-bar i').style.width = pct + '%';
      panel.querySelector('.load-pct').textContent = pct + '%';
      if (st.start === st.end) RG.ui.say('Már majdnem kész!');
      if (st.start >= st.end + st.stall) {
        st.done = true;
        this.fail(G);
      }
    },

    fail: function (G) {
      var self = this, panel = this.panel, attempt = this.state.attempt;
      var msg = panel.querySelector('.load-msg'), actions = panel.querySelector('.load-actions');
      RG.ui.sfx('bonk');
      msg.textContent = attempt === 1
        ? 'Hiba: az ajándék nem található.'
        : 'Hiba: az ajándék továbbra sem található. Talán a dobozban van.';
      var btn = RG.ui.make('button', 'load-btn', attempt === 1 ? 'Újrapróbálás' : 'Doboz kinyitása');
      btn.type = 'button';
      btn.setAttribute('tabindex', '-1');
      btn.addEventListener('click', function () {
        actions.innerHTML = '';
        msg.textContent = '';
        if (attempt === 1) {
          self.state = { start: 0, end: 90, stall: 150, attempt: 2 };
        } else {
          self.showBox(G, 0);
        }
      });
      actions.appendChild(btn);
    },

    showBox: function (G, i) {
      var self = this, panel = this.panel;
      panel.innerHTML = '';
      panel.classList.add('boxes');
      var label = RG.ui.make('div', 'load-title', i < BOXES.length ? BOXES[i].text : 'Üres.');
      panel.appendChild(label);

      if (i < BOXES.length) {
        var box = RG.ui.make('button', 'gift-box', '🎁');
        box.type = 'button';
        box.setAttribute('tabindex', '-1');
        box.style.fontSize = BOXES[i].size + 'px';
        box.addEventListener('click', function () {
          RG.ui.sfx('trap');
          self.showBox(G, i + 1);
        });
        panel.appendChild(box);
        panel.appendChild(RG.ui.make('div', 'load-msg', 'Kattints a kinyitáshoz'));
      } else {
        panel.appendChild(RG.ui.make('div', 'empty-box', 'Semmi nincs benne. Még egy cetli sem.'));
        var out = RG.ui.make('button', 'load-btn', 'Kimegyek innen');
        out.type = 'button';
        out.setAttribute('tabindex', '-1');
        out.addEventListener('click', function () { G.completeLevel(); });
        panel.appendChild(out);
      }
    }
  });

  /* ---------- 3. a zsákutca ---------- */

  var IDLE = [
    'Nincs tovább.',
    'Tényleg nincs.',
    'A falak azok falak.',
    'Ennyi volt. Ezért csináltad végig.',
    'Még mindig itt vagy?',
    'Bezárhatod a lapot. Vagy maradhatsz. Mindegy.',
    'Boldog szülinapot, {name}!'
  ];

  RG.levels.push({
    id: 'deadend', url: 'zsakutca', theme: 'deadend', w: 960, h: 540,
    spawn: { x: 460, y: 430 },

    build: function (G) {
      return [
        E.block(0, 0, 40, 540, { cls: 'd-wall' }),
        E.block(920, 0, 40, 540, { cls: 'd-wall' }),
        E.block(0, 460, 960, 80, { cls: 'd-floor' }),

        E.deco(330, 62, 300, 70, { cls: 'd-sign', html: 'ZSÁKUTCA' }),
        E.deco(84, 150, 330, 170, {
          cls: 'd-stats',
          html: '<div class="d-stats-title">Végeredmény</div>' +
            '<div>Halálok: <b>' + G.deaths + '</b></div>' +
            '<div>Eltöltött idő: <b>' + minutes(G.playFrames) + '</b></div>' +
            '<div>Nyeremény: <b>semmi</b></div>' +
            '<div class="d-bday">' + RG.fmt('Boldog szülinapot, {name}!') + '</div>'
        }),

        // Festett ajtó: úgy néz ki, mint a kijárat.
        E.deco(760, 340, 90, 120, { cls: 'd-door', html: '<small>KIJÁRAT</small>' }),
        E.sensor(790, 340, 30, 120, function () { RG.ui.say('Ez csak oda van festve.'); })
      ];
    },

    onStart: function (G) {
      document.title = 'Zsákutca';
      if (G.resumed) {
        G.resumed = false;
        RG.ui.say('Frissítetted? Aranyos.', 4000);
      }
      var restart = RG.ui.make('button', 'd-restart', 'Újrakezdés');
      restart.type = 'button';
      restart.style.left = '560px';
      restart.style.top = '220px';
      RG.ui.addOverlay(restart);
      RG.ui.flee(restart, {
        forever: true,
        region: [190, 150, 560, 200],
        onDenied: function () { RG.ui.say('Nem.'); }
      });
    },

    onUpdate: function (G) {
      if (G.levelFrame % 720 === 300) {
        var i = Math.floor(G.levelFrame / 720) % IDLE.length;
        RG.ui.say(IDLE[i], 3500);
      }
    }
  });
})(window.RG);
