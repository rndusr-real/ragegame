// Minijáték: fújd el a gyertyákat. Amit elfújsz, az néha visszagyullad.
(function (RG) {
  'use strict';

  RG.levels.push({
    id: 'candles', url: 'torta', theme: 'cake', w: 960, h: 540,
    spawn: { x: 0, y: 0 },

    build: function () { return []; },

    onStart: function (G) {
      G.freeze = true;
      G.hidePlayer = true;
      var n = Math.max(5, Math.min(20, parseInt(RG.cfg.age, 10) || 18));
      var panel = RG.ui.make('div', 'mg-panel cake-panel',
        '<div class="mg-title">Fújd el a gyertyákat!</div>' +
        '<div class="mg-sub">Kattints a lángokra. Mind a ' + n + ' darabra.</div>' +
        '<div class="cake"><div class="candles"></div><div class="cake-body"><span>' + RG.fmt('Boldog szülinapot, {name}!') + '</span></div></div>' +
        '<div class="mg-msg"></div>');
      var row = panel.querySelector('.candles');
      for (var i = 0; i < n; i++) {
        var c = RG.ui.make('button', 'candle lit', '<i></i>');
        c.type = 'button';
        c.setAttribute('tabindex', '-1');
        c.addEventListener('click', onCandle);
        row.appendChild(c);
      }
      RG.ui.addOverlay(panel);
      var st = this.st = { panel: panel, timer: 45, gap: 45, done: false };

      function onCandle(e) {
        var c = e.currentTarget;
        if (st.done || !c.classList.contains('lit')) return;
        c.classList.remove('lit');
        RG.ui.sfx('jump');
        if (!panel.querySelector('.candle.lit')) finish();
      }
      function finish() {
        st.done = true;
        panel.querySelector('.mg-msg').textContent = 'Kívánj valamit! … Nem fog teljesülni.';
        var btn = RG.ui.make('button', 'mg-btn', 'Tovább');
        btn.type = 'button';
        btn.setAttribute('tabindex', '-1');
        btn.addEventListener('click', function () { G.completeLevel(); });
        panel.appendChild(btn);
        RG.ui.sfx('win');
      }
    },

    // Néha visszagyújt egy elfújt gyertyát, de egyre ritkábban.
    onUpdate: function () {
      var st = this.st;
      if (!st || st.done) return;
      if (--st.timer > 0) return;
      var out = st.panel.querySelectorAll('.candle:not(.lit)');
      if (out.length) {
        out[Math.floor(Math.random() * out.length)].classList.add('lit');
        st.panel.querySelector('.mg-msg').textContent = ['Trükkös gyertya!', 'Visszagyulladt. Hupsz.', 'Ez ilyen fajta.', 'Fújj erősebben!'][Math.floor(Math.random() * 4)];
        RG.ui.sfx('trap');
      }
      st.gap += 8;
      st.timer = st.gap;
    }
  });
})(window.RG);
