// Minijáték: szülinapi kvíz. Rossz válasznál vissza az első kérdésre.
(function (RG) {
  'use strict';

  function questions() {
    var age = parseInt(RG.cfg.age, 10) || 18;
    return [
      { q: 'Hány éves lettél?', opts: [age - 1, age, age + 1, 'Nem tudom'], ok: [1], flee: 1 },
      { q: 'Mi a neved?', opts: ['{name}', '{name}', '{name}', 'Béla'], ok: [0, 1, 2], okMsg: 'Helyes. Mindhárom.' },
      { q: 'Mennyi 2 + 2?', opts: ['4', '22', '5', 'hal'], ok: [2], wrong: { 0: 'Helytelen. Szülinapon 5.' } },
      { q: 'Élvezed ezt a játékot?', opts: ['Igen', 'Nem'], ok: [0, 1], okMsg: 'Rossz válasz, de mindegy.' }
    ];
  }

  var SLOTS = [[230, 280], [500, 280], [230, 350], [500, 350]];

  RG.levels.push({
    id: 'quiz', url: 'kviz', theme: 'quiz', w: 960, h: 540,
    spawn: { x: 0, y: 0 },

    build: function () { return []; },

    onStart: function (G) {
      G.freeze = true;
      G.hidePlayer = true;
      var panel = RG.ui.make('div', 'mg-panel quiz-panel',
        '<div class="mg-sub quiz-count"></div><div class="mg-title quiz-q"></div><div class="mg-msg quiz-msg"></div>');
      RG.ui.addOverlay(panel);
      var Q = questions(), idx = 0, buttons = [];

      function clear() {
        buttons.forEach(function (b) { b.remove(); });
        buttons = [];
      }

      function show(i, msg) {
        idx = i;
        clear();
        var q = Q[i];
        panel.querySelector('.quiz-count').textContent = 'Szülinapi kvíz · ' + (i + 1) + '/' + Q.length;
        panel.querySelector('.quiz-q').innerHTML = RG.fmt(q.q);
        panel.querySelector('.quiz-msg').textContent = msg || '';
        q.opts.forEach(function (opt, k) {
          var b = RG.ui.make('button', 'quiz-opt', RG.fmt(String(opt)));
          b.type = 'button';
          b.dataset.k = k;
          b.style.left = SLOTS[k][0] + 'px';
          b.style.top = SLOTS[k][1] + 'px';
          RG.ui.addOverlay(b);
          buttons.push(b);
          var good = q.ok.indexOf(k) >= 0;
          var pick = function () { answer(q, k, good); };
          if (good && q.flee) RG.ui.flee(b, { hops: 3, region: [200, 250, 520, 150], onClick: pick });
          else b.addEventListener('click', pick);
        });
      }

      function answer(q, k, good) {
        if (good) {
          RG.ui.sfx('checkpoint');
          if (idx + 1 < Q.length) show(idx + 1, q.okMsg || 'Helyes!');
          else done(q.okMsg);
          return;
        }
        RG.ui.sfx('die');
        var why = (q.wrong && q.wrong[k]) || 'Rossz válasz.';
        show(0, why + ' Vissza az első kérdésre.');
      }

      function done(msg) {
        clear();
        panel.querySelector('.quiz-count').textContent = 'Szülinapi kvíz · kész';
        panel.querySelector('.quiz-q').textContent = 'Eredmény: 4/4. Jutalom: semmi.';
        panel.querySelector('.quiz-msg').textContent = msg || '';
        var btn = RG.ui.make('button', 'mg-btn', 'Tovább');
        btn.type = 'button';
        btn.setAttribute('tabindex', '-1');
        btn.addEventListener('click', function () { G.completeLevel(); });
        panel.appendChild(btn);
      }

      show(0);
    }
  });
})(window.RG);
