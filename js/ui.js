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
    ctx();
    ui.preloadSamples();
    addEventListener('pointerdown', ui.unlockAudio);
    addEventListener('pointerdown', resumeMusic);
    addEventListener('keydown', resumeMusic);

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
    document.body.classList.toggle('rec', !!g.meta.tos);
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
    deadline: ['Késve beadva. Elégtelen.', 'A határidő az határidő.'],
    lag: ['Nem te voltál lassú. Az internet. Vagy te.']
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

  // Hamis GAME OVER egyszer, 13 halál után. Semmi nem törlődik, csak ijesztgetés.
  ui.afterRespawn = function () {
    if (G.deaths < 13 || G.meta.gameOver) return;
    G.meta.gameOver = true;
    G.save();
    ui.modal({
      cls: 'gameover',
      html: '<div class="go-title">GAME OVER</div><div class="go-sub">Elfogytak az életeid.<br>A játék az első pályától újraindul.</div>',
      buttons: [
        { label: 'Újrakezdés', cls: 'go-yes', onClick: function (close) { close(); ui.say('Vicceltem. Nincsenek is életek.', 3500); } },
        { label: 'Inkább nem', cls: 'go-no', onClick: function (close) { close(); ui.say('Jó, akkor maradsz. Úgyis vicc volt.', 3500); } }
      ]
    });
  };

  /* ---------- hangok ---------- */

  var audio = null, muted = false, muteClicks = 0;
  function ctx() {
    if (audio) return audio;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { audio = new Ctx(); } catch (e) { audio = null; }
    return audio;
  }
  // A hangkörnyezet már betöltéskor létrejön (a hangok előre dekódolódnak), az első kattintás csak elindítja.
  ui.unlockAudio = function () {
    var c = ctx();
    if (c && c.state === 'suspended' && c.resume) c.resume();
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
  // Hangfájlok: előre letöltve és dekódolva, az eleji csend levágva, így azonnal szólnak.
  // Ha ez nem megy (pl. a fájlt dupla kattintással nyitottad meg), sima <audio> a tartalék.
  var buffers = {}, fallback = {};

  function trimSilence(c, buf) {
    var start = buf.length, ch, data, i;
    for (ch = 0; ch < buf.numberOfChannels; ch++) {
      data = buf.getChannelData(ch);
      for (i = 0; i < data.length && i < start; i++) {
        if (Math.abs(data[i]) > 0.015) { start = i; break; }
      }
    }
    start = Math.max(0, start - Math.floor(buf.sampleRate * 0.004));
    if (start < buf.sampleRate * 0.01 || start >= buf.length) return buf;
    var out = c.createBuffer(buf.numberOfChannels, buf.length - start, buf.sampleRate);
    for (ch = 0; ch < buf.numberOfChannels; ch++) out.getChannelData(ch).set(buf.getChannelData(ch).subarray(start));
    return out;
  }

  function load(src) {
    if (!src || src in buffers) return;
    buffers[src] = null;
    fallback[src] = new Audio(src);
    fallback[src].preload = 'auto';
    var c = ctx();
    if (!c || !window.fetch) return;
    fetch(src)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (data) { return new Promise(function (res, rej) { c.decodeAudioData(data, res, rej); }); })
      .then(function (buf) { buffers[src] = trimSilence(c, buf); })
      .catch(function () { /* marad a tartalék <audio> */ });
  }
  ui._buffers = buffers;

  // Visszaad egy { stop } objektumot, hogy az ismétlődő hang (csengés) leállítható legyen.
  ui.playSample = function (src, opts) {
    opts = opts || {};
    if (!src || muted || RG.holdLoop) return null;
    load(src);
    var c = audio, buf = buffers[src];
    if (c && buf) {
      if (c.state === 'suspended' && c.resume) c.resume();
      var node = c.createBufferSource(), gain = c.createGain();
      node.buffer = buf;
      node.loop = !!opts.loop;
      gain.gain.value = opts.volume || 0.9;
      node.connect(gain).connect(c.destination);
      node.start();
      return { stop: function () { try { node.stop(); } catch (e) { /* már leállt */ } } };
    }
    var a = fallback[src].cloneNode();
    a.volume = opts.volume || 0.9;
    a.loop = !!opts.loop;
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function () { /* még nem volt kattintás */ });
    return { stop: function () { a.pause(); } };
  };

  ui.preloadSamples = function () {
    var s = RG.cfg.sounds || {};
    (s.death || []).concat([s.flee, s.call]).forEach(load);
  };

  ui.sfx = function (name) {
    var snd = RG.cfg.sounds || {};
    if (name === 'die' && snd.death && snd.death.length) {
      ui.playSample(snd.death[Math.floor(Math.random() * snd.death.length)]);
      return;
    }
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
    if (music) music.muted = v;
    if (v) ui.stopRing();
  };

  // Háttérzene: ismétlődve szól. A böngésző csak kattintás után engedi elindítani.
  var music = null;
  ui.startMusic = function () {
    if (!RG.cfg.music || RG.holdLoop) return;
    if (!music) {
      music = new Audio(RG.cfg.music);
      music.loop = true;
      music.volume = 0.5;
    }
    music.muted = muted;
    var pr = music.play();
    if (pr && pr.catch) pr.catch(function () { /* még nincs kattintás, a következőnél újrapróbálja */ });
    if (!G.meta.music) {
      G.meta.music = true;
      G.save();
    }
  };
  function resumeMusic() {
    if (G.meta.music && (!music || music.paused)) ui.startMusic();
  }

  // A játék elején megkérdezi, kér-e zenét. A válasz mindegy.
  ui.askMusic = function () {
    ui.modal({
      cls: 'music-ask',
      html: '<div class="ma-icon">🎵</div><div class="ma-title">Szeretnél háttérzenét?</div><div class="ma-sub">A játékélmény fokozása érdekében.</div>',
      buttons: [
        { label: 'Igen, kérek', cls: 'ma-yes', onClick: function (close) { close(); ui.startMusic(); ui.say('Remek választás.'); } },
        { label: 'Nem, köszönöm', cls: 'ma-no', onClick: function (close) { close(); ui.startMusic(); ui.say('Ezt a választ nem fogadjuk el. Zene indul.', 3500); } }
      ]
    });
  };

  function onMuteClick() {
    muteClicks++;
    if (muteClicks === 1) {
      if (music) music.volume = 1;
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
    ui.stopRing();
    callTimers.forEach(clearTimeout);
    callTimers = [];
  };

  /* ---------- hamis Discord-hívás ---------- */

  var ring = null, callTimers = [];
  ui.stopRing = function () {
    if (ring) { ring.stop(); ring = null; }
  };
  function later(fn, ms) { callTimers.push(setTimeout(fn, ms)); }

  // Bejövő hívás csengéssel. Az elutasítás gomb elmenekül, elutasítás után egyszer visszahív.
  ui.fakeCall = function (caller, opts) {
    opts = opts || {};
    var again = !!opts.again;
    var panel = make('div', 'dcall',
      '<div class="dc-avatar"><span>' + RG.esc(String(caller).charAt(0).toUpperCase()) + '</span></div>' +
      '<div class="dc-name">' + RG.esc(caller) + '</div>' +
      '<div class="dc-sub">' + (again ? 'Újra hív…' : 'Bejövő hívás…') + '</div>');
    var accept = make('button', 'dc-btn dc-accept', '📞');
    accept.type = 'button';
    accept.setAttribute('tabindex', '-1');
    panel.appendChild(accept);
    overlay.appendChild(panel);

    var decline = make('button', 'dc-btn dc-decline', '📞');
    decline.type = 'button';
    decline.style.left = '738px';
    decline.style.top = '232px';
    overlay.appendChild(decline);

    ui.stopRing();
    ring = ui.playSample((RG.cfg.sounds || {}).call, { loop: true, volume: 0.7 });
    var ended = false;

    function end(msg) {
      if (ended) return;
      ended = true;
      ui.stopRing();
      panel.classList.add('ended');
      panel.querySelector('.dc-sub').textContent = msg;
      accept.remove();
      decline.remove();
      later(function () { panel.remove(); }, 1600);
    }

    accept.addEventListener('click', function () {
      if (ended) return;
      ui.stopRing();
      accept.remove();
      decline.remove();
      panel.querySelector('.dc-sub').textContent = 'Csatlakozás…';
      later(function () { if (!ended) panel.querySelector('.dc-sub').textContent = '🔇 ' + caller + ' némítva van.'; }, 1500);
      later(function () { end('A hívás véget ért. Ennyi volt.'); }, 3600);
    });

    ui.flee(decline, {
      hops: again ? 1 : 2,
      region: [560, 120, 300, 200],
      onClick: function () {
        if (ended) return;
        end('Hívás elutasítva.');
        if (!again) later(function () { ui.fakeCall(caller, { again: true }); }, 4500);
      }
    });

    later(function () { end('Nem fogadott hívás.'); }, 15000);
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
    var hopped = false;
    function hop() {
      lastHop = Date.now();
      left--;
      // Az első elugrásnál szól a barlangos hang.
      if (!hopped) {
        hopped = true;
        ui.playSample((RG.cfg.sounds || {}).flee);
      }
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
