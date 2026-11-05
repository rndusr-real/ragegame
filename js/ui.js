// A játékon kívüli "weboldal" réteg: narrátor, címsor, hangok, hamis süti-ablak, CAPTCHA, menekülő gombok.
(function (RG) {
  'use strict';

  var ui = RG.ui = {};
  var G, overlay, narrator, urlEl, deathsEl, muteBtn, pageload, pageloadUrl;
  var fleers = [], sayTimer = null;

  ui.init = function (game) {
    G = game;
    overlay = document.getElementById('overlay');
    narrator = document.getElementById('narrator');
    urlEl = document.getElementById('url');
    deathsEl = document.getElementById('deaths');
    muteBtn = document.getElementById('mute');
    pageload = document.getElementById('pageload');
    pageloadUrl = document.getElementById('pageload-url');

    muteBtn.addEventListener('click', onMuteClick);
    addEventListener('pointerdown', ui.unlockAudio);

    document.getElementById('stage').addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var at = G.toStage(e.clientX, e.clientY);
      fleers.slice().forEach(function (f) { f.check(at); });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) document.title = 'Visszajössz?';
      else ui.updateTitle();
    });
    ui.updateDeaths();
  };

  ui.tick = function (g) {
    ui.updateDeaths();
    if (g.playFrames % 3600 === 0) ui.updateTitle();
  };

  ui.updateDeaths = function () {
    deathsEl.textContent = 'Halálok: ' + G.deaths;
  };

  var TITLES = ['Még mindig játszol?', 'Anyukád hív', 'Nincs új üzenet', 'Feladnád?', 'Az ajándék vár. Vagy nem.'];
  ui.updateTitle = function () {
    var n = Math.floor(G.playFrames / 3600);
    document.title = n === 0 ? 'Boldog szülinapot!' : TITLES[(n - 1) % TITLES.length];
  };

  ui.setUrl = function (path) {
    urlEl.textContent = 'szulinap-ajandek.hu/' + path;
  };

  ui.showPageLoad = function (path) {
    pageloadUrl.textContent = 'Betöltés: szulinap-ajandek.hu/' + path;
    pageload.classList.add('on');
  };
  ui.hidePageLoad = function () { pageload.classList.remove('on'); };

  /* ---------- narrátor ---------- */

  ui.say = function (text, ms) {
    narrator.innerHTML = RG.fmt(text);
    narrator.classList.add('on');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { narrator.classList.remove('on'); }, ms || 2800);
  };

  var BY_COUNT = {
    1: 'Ez csak az első volt.',
    5: 'Ötödször. Ügyes.',
    10: 'Tíz. Már majdnem érted, hogyan működik a gravitáció.',
    25: 'Huszonöt halál. Az ajándék már unatkozik.',
    50: 'Ötven. Ilyenkor szoktak a többiek feladni.',
    75: 'Hetvenöt. Ez most már hobbi.',
    100: 'SZÁZ! Oklevelet nem kapsz.',
    150: 'Százötven. Tudod, hogy ez csak egy weboldal, ugye?',
    200: 'Kétszáz. Kezdek aggódni érted.'
  };
  var BY_REASON = {
    fall: ['A lábléc alatt nincs semmi.', 'Ez az oldal alja volt.'],
    popspike: ['Ott eddig nem volt tüske. Most már van.', 'Váratlan, mi?'],
    dropper: ['Kép betöltve.', 'Ez a kép rád esett.'],
    fakecheckpoint: ['Mentés sikertelen.', 'Nem minden mentés ment meg.'],
    roller: ['Kosárba téve.', 'Rendelésed úton van.'],
    crusher: ['Ez egy hirdetés volt.', 'Hirdetés. Átugorható 5 mp múlva. Kivéve téged.'],
    patrol: ['Új értesítésed érkezett.', 'Nem kértél értesítést, de megkaptad.'],
    zone: ['Elmaradtál az üzenetekkel.', 'Olvasatlan maradtál.'],
    coin: ['Nem nyertél iPhone-t.', 'Mégsem te vagy az egymilliomodik látogató.'],
    credits: ['Spoiler: a stáblista veszélyes.'],
    spinner: ['Pufferelés…', 'A töltés is tud ölni.'],
    deadline: ['Késve beadva. Elégtelen.', 'A határidő az határidő.']
  };
  ui.onDeath = function (reason) {
    ui.updateDeaths();
    var line = BY_COUNT[G.deaths];
    if (!line) {
      var extra = RG.cfg.taunts || [];
      if (extra.length && G.deaths % 7 === 0) {
        line = extra[Math.floor(G.deaths / 7) % extra.length];
      } else {
        var list = BY_REASON[reason];
        if (list) line = list[G.deaths % list.length];
      }
    }
    if (line) ui.say(line);
  };

  /* ---------- hangok ---------- */

  var audio = null, muted = false, muteClicks = 0;
  ui.unlockAudio = function () {
    if (audio) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try { audio = new Ctx(); } catch (e) { audio = null; }
  };
  var SOUNDS = {
    jump: [[420, 0.07, 'square', 0.03]],
    die: [[220, 0.1, 'sawtooth', 0.05], [140, 0.16, 'sawtooth', 0.05]],
    bonk: [[110, 0.08, 'square', 0.05]],
    trap: [[700, 0.05, 'square', 0.03], [320, 0.07, 'square', 0.03]],
    spring: [[300, 0.06, 'triangle', 0.06], [700, 0.1, 'triangle', 0.06]],
    checkpoint: [[660, 0.07, 'triangle', 0.05], [880, 0.1, 'triangle', 0.05]],
    win: [[523, 0.08, 'triangle', 0.05], [659, 0.08, 'triangle', 0.05], [784, 0.14, 'triangle', 0.05]]
  };
  ui.sfx = function (name) {
    if (!audio || muted || RG.holdLoop) return;
    var t = audio.currentTime;
    (SOUNDS[name] || []).forEach(function (s) {
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = s[2];
      o.frequency.value = s[0];
      g.gain.setValueAtTime(s[3], t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + s[1]);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + s[1]);
      t += s[1];
    });
  };
  ui.isMuted = function () { return muted; };
  ui.setMuted = function (v) {
    muted = v;
    if (v) muteClicks = 2;
    muteBtn.textContent = v ? '🔇' : '🔊';
  };
  function onMuteClick() {
    muteClicks++;
    if (muteClicks === 1) {
      ui.say('Hangerő növelve. Szívesen.');
      return;
    }
    ui.setMuted(!muted);
    ui.say(muted ? 'Jó, legyen csend.' : 'Visszakapcsolva.');
    G.save();
  }

  /* ---------- rétegek ---------- */

  ui.clearOverlay = function () {
    overlay.innerHTML = '';
    fleers = [];
  };

  function make(tag, cls, html) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html) el.innerHTML = html;
    return el;
  }
  ui.make = make;
  ui.addOverlay = function (el) { overlay.appendChild(el); return el; };

  // A gomb elmenekül a kurzor elől (érintésnél az első koppintásokra).
  // hops: hányszor menekül, utána megnyomható. forever: sosem lehet megnyomni.
  ui.flee = function (el, o) {
    o = o || {};
    var left = o.hops === undefined ? 3 : o.hops;
    var region = o.region || [190, 60, 560, 320];
    var lastHop = 0, skipClick = false;
    el.setAttribute('tabindex', '-1');

    function canFlee() { return o.forever || left > 0; }
    function hop() {
      lastHop = Date.now();
      left--;
      var x = region[0], y = region[1];
      // Mindig távolabb ugrik attól, ahol most van.
      var cx = parseFloat(el.style.left) || 0, cy = parseFloat(el.style.top) || 0;
      for (var i = 0; i < 12; i++) {
        x = region[0] + Math.random() * region[2];
        y = region[1] + Math.random() * region[3];
        if (Math.hypot(x - cx, y - cy) > 140) break;
      }
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      if (o.onHop) o.onHop();
    }

    var entry = {
      el: el,
      check: function (at) {
        if (!canFlee() || !el.isConnected || Date.now() - lastHop < 120) return;
        var bx = parseFloat(el.style.left) || 0, by = parseFloat(el.style.top) || 0;
        var bw = el.offsetWidth, bh = el.offsetHeight;
        var dx = Math.max(bx - at.x, 0, at.x - (bx + bw));
        var dy = Math.max(by - at.y, 0, at.y - (by + bh));
        if (Math.hypot(dx, dy) < 34) hop();
      }
    };
    fleers.push(entry);

    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' && canFlee()) {
        e.preventDefault();
        skipClick = true;
        hop();
      }
    });
    el.addEventListener('click', function (e) {
      if (skipClick) { skipClick = false; return; }
      if (o.forever) {
        if (o.onDenied) o.onDenied();
        return;
      }
      if (o.onClick) o.onClick(e);
    });
    return el;
  };

  // Hamis süti-ablak. Kitakarja a képernyő alját, amíg el nem fogadod.
  ui.cookieBanner = function (onAccept) {
    var banner = make('div', 'cookie', '<b>🍪 Ez az oldal sütiket használ</b><br>Süteményt nem, csak sütiket. Elfogadod, hogy elfogadod?');
    var reject = make('button', 'cookie-reject', 'Elutasítás');
    reject.type = 'button';
    reject.setAttribute('tabindex', '-1');
    reject.addEventListener('click', function () { ui.say('Az elutasítást elutasítottuk.'); });
    banner.appendChild(reject);
    overlay.appendChild(banner);

    var accept = make('button', 'cookie-accept', 'Elfogadom');
    accept.type = 'button';
    accept.style.left = '620px';
    accept.style.top = '440px';
    overlay.appendChild(accept);
    ui.flee(accept, {
      hops: 3,
      region: [200, 410, 540, 80],
      onClick: function () {
        banner.remove();
        accept.remove();
        fleers = fleers.filter(function (f) { return f.el !== accept; });
        onAccept();
      }
    });
    return accept;
  };

  // Középre nyíló ablak gombokkal. A játék addig áll.
  ui.modal = function (o) {
    G.paused = true;
    var box = make('div', 'modal ' + (o.cls || ''), o.html);
    var wrap = make('div', 'modal-wrap');
    wrap.appendChild(box);
    overlay.appendChild(wrap);
    function close() {
      wrap.remove();
      fleers = fleers.filter(function (f) { return f.el.isConnected; });
      G.paused = false;
    }
    (o.buttons || []).forEach(function (b) {
      var btn = make('button', b.cls || '', b.label);
      btn.type = 'button';
      btn.setAttribute('tabindex', '-1');
      btn.addEventListener('click', function () { b.onClick(close, btn); });
      box.appendChild(btn);
    });
    return { box: box, wrap: wrap, close: close };
  };

  // Hamis CAPTCHA, amelyre nincs jó válasz. A harmadik kör után mindig átenged.
  ui.captcha = function (onPass) {
    var EMOJI = ['🦆', '🧀', '🪑', '🧦', '🥔', '🚜', '🧻', '🐌', '🪣'];
    var round = 0;
    var m = ui.modal({
      cls: 'captcha',
      html: '<div class="captcha-head">Jelöld be azokat a képeket, amelyeken van értelme ennek a játéknak.</div>' +
        '<div class="captcha-grid">' + EMOJI.map(function (x) { return '<button type="button" tabindex="-1">' + x + '</button>'; }).join('') + '</div>' +
        '<div class="captcha-msg"></div>',
      buttons: [{
        label: 'Ellenőrzés',
        cls: 'captcha-check',
        onClick: function (close, btn) {
          var msg = m.box.querySelector('.captcha-msg');
          var cells = m.box.querySelectorAll('.captcha-grid button');
          round++;
          if (round === 1) {
            msg.textContent = 'Helytelen. Egyik képen sincs értelme.';
          } else if (round === 2) {
            msg.textContent = 'Helytelen. Mindegyiken volt. Próbáld újra.';
          } else {
            msg.textContent = 'Rendben. Robot vagy, de mehetsz.';
            btn.textContent = 'Tovább';
            btn.onclick = function () { close(); onPass(); };
            btn.classList.add('pass');
            return;
          }
          cells.forEach(function (c) { c.classList.remove('on'); });
        }
      }]
    });
    m.box.querySelectorAll('.captcha-grid button').forEach(function (c) {
      c.addEventListener('click', function () { c.classList.toggle('on'); });
    });
    return m;
  };
})(window.RG);
