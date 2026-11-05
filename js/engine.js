// Játékmotor: játékhurok (fix 60 Hz), bemenet, fizika, kamera, halál/újraéledés, mentés.
// A logika logikai koordinátákban fut, a DOM csak kirajzolás.
window.RG = window.RG || {};
(function (RG) {
  'use strict';

  var W = 960, H = 540, FRAME = 1000 / 60;
  var PHYS = {
    accelGround: 0.7, accelAir: 0.45, friction: 0.72, maxSpeed: 3.4,
    gravity: 0.55, jump: 10.6, maxFall: 12, coyote: 6, buffer: 7, cut: 0.45
  };
  var SAVE_KEY = 'ragegame.save.v1';
  var params = new URLSearchParams(location.search);

  RG.cfg = window.RG_CONFIG;
  RG.levels = [];
  RG.debugMode = params.has('debug');

  RG.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  RG.fmt = function (s) {
    return RG.esc(s).replace(/\{name\}/g, RG.esc(RG.cfg.name)).replace(/\{age\}/g, RG.esc(RG.cfg.age));
  };

  function defaultMods() {
    return { invert: false, gravity: PHYS.gravity, dark: false };
  }

  var G = RG.G = {
    W: W, H: H, PHYS: PHYS,
    frame: 0, levelIndex: 0, level: null, levelFrame: 0, ents: [],
    player: { x: 0, y: 0, w: 18, h: 30, vx: 0, vy: 0, grounded: false, ground: null, coyote: 0, buffer: 0, jumping: false, face: 1 },
    cam: { x: 0, y: 0 },
    checkpoint: null, flags: {}, mods: defaultMods(),
    deaths: 0, playFrames: 0,
    paused: false, freeze: false, dead: false, deadT: 0, transition: null, god: false, hidePlayer: false
  };

  var stage, world, entsEl, playerEl, darkEl;

  /* ---------- mentés ---------- */

  function storageGet() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
  }
  function storageClear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nincs tároló, nem baj */ }
  }
  G.save = function () {
    if (G.noSave) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        level: G.levelIndex, checkpoint: G.checkpoint, flags: G.flags,
        deaths: G.deaths, playFrames: G.playFrames, muted: RG.ui.isMuted()
      }));
    } catch (e) { /* nincs tároló, a játék mentés nélkül is fut */ }
  };

  /* ---------- bemenet ---------- */

  var input = RG.input = { left: false, right: false, jump: false };
  var KEYS = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Space: 'jump', ArrowUp: 'jump', KeyW: 'jump'
  };

  function bindInput() {
    addEventListener('keydown', function (e) {
      var k = KEYS[e.code];
      if (k) { input[k] = true; e.preventDefault(); RG.ui.unlockAudio(); }
    });
    addEventListener('keyup', function (e) {
      var k = KEYS[e.code];
      if (k) { input[k] = false; e.preventDefault(); }
    });
    addEventListener('blur', function () {
      input.left = input.right = input.jump = false;
    });
    // A szóköz ne kattintson rá újra az utoljára megnyomott gombra.
    document.addEventListener('click', function () {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    [['t-left', 'left'], ['t-right', 'right'], ['t-jump', 'jump']].forEach(function (pair) {
      var el = document.getElementById(pair[0]), key = pair[1];
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        input[key] = true;
        el.classList.add('on');
        RG.ui.unlockAudio();
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* nincs aktív pointer, nem baj */ }
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) {
        el.addEventListener(name, function () {
          input[key] = false;
          el.classList.remove('on');
        });
      });
    });

    function markTouch() { document.body.classList.add('touch'); }
    if (matchMedia('(pointer: coarse)').matches) markTouch();
    addEventListener('touchstart', markTouch, { once: true, passive: true });
  }

  /* ---------- skálázás ---------- */

  G.scale = 1;
  function fit() {
    var s = Math.min(innerWidth / W, innerHeight / H);
    G.scale = s;
    stage.style.transform = 'translate(' + (innerWidth - W * s) / 2 + 'px,' + (innerHeight - H * s) / 2 + 'px) scale(' + s + ')';
  }
  // Képernyő-koordináta átváltása a színpad logikai koordinátáira.
  G.toStage = function (clientX, clientY) {
    var r = stage.getBoundingClientRect();
    return { x: (clientX - r.left) / G.scale, y: (clientY - r.top) / G.scale };
  };

  /* ---------- pálya felépítése ---------- */

  function createEl(e) {
    var el = document.createElement('div');
    el.className = 'e e-' + e.type + (e.cls ? ' ' + e.cls : '');
    el.style.width = e.w + 'px';
    el.style.height = e.h + 'px';
    if (e.z) el.style.zIndex = e.z;
    if (e.html) el.innerHTML = e.html;
    if (e.onClick) {
      el.classList.add('clickable');
      el.addEventListener('click', function (ev) { e.onClick(G, e, ev); });
    }
    entsEl.appendChild(el);
    e.el = el;
    drawEnt(e);
  }

  G.spawn = function (e) {
    G.ents.push(e);
    createEl(e);
    return e;
  };

  function build() {
    var L = G.level;
    RG.ui.clearOverlay();
    entsEl.innerHTML = '';
    G.mods = defaultMods();
    G.levelFrame = 0;
    G.dead = false;
    G.paused = false;
    G.freeze = false;
    G.hidePlayer = false;
    stage.className = 'stage theme-' + L.theme;
    world.style.width = L.w + 'px';
    world.style.height = L.h + 'px';
    RG.ui.setUrl(L.url);

    G.ents = [];
    var list = [].concat.apply([], L.build(G));
    list.forEach(function (e) { G.ents.push(e); createEl(e); });

    var p = G.player, at = G.checkpoint || L.spawn;
    p.x = at.x; p.y = at.y; p.vx = 0; p.vy = 0;
    p.grounded = false; p.ground = null; p.coyote = 0; p.buffer = 0; p.jumping = false;
    if (L.onStart) L.onStart(G);
    snapCamera();
    render();
  }

  G.setTheme = function (theme) { stage.className = 'stage theme-' + theme; };

  G.loadLevel = function (index) {
    G.levelIndex = index;
    G.level = RG.levels[index];
    G.flags = {};
    G.checkpoint = null;
    G.transition = null;
    build();
    G.save();
  };

  // A következő oldal "betöltése" után vált pályát.
  G.completeLevel = function () {
    if (G.transition) return;
    var next = G.levelIndex + 1;
    G.transition = { t: 40, to: next };
    RG.ui.sfx('win');
    RG.ui.showPageLoad(RG.levels[next].url);
  };

  G.setCheckpoint = function (id, x, y) {
    if (G.checkpoint && G.checkpoint.id === id) return;
    G.checkpoint = { id: id, x: x, y: y };
    RG.ui.sfx('checkpoint');
    G.save();
  };

  G.kill = function (reason) {
    if (G.dead || G.god || G.transition) return;
    G.dead = true;
    G.deadT = 24;
    G.deaths++;
    RG.ui.sfx('die');
    RG.ui.onDeath(reason);
    burst();
    G.save();
  };

  // Halál nélkül visszarak az utolsó ellenőrzőponthoz (hamis linkek).
  G.teleportBack = function () { G.needBuild = true; };

  function burst() {
    var p = G.player;
    for (var i = 0; i < 10; i++) {
      var d = document.createElement('i');
      d.className = 'burst';
      var a = i / 10 * Math.PI * 2;
      d.style.left = p.x + p.w / 2 + 'px';
      d.style.top = p.y + p.h / 2 + 'px';
      d.style.setProperty('--dx', Math.cos(a) * 46 + 'px');
      d.style.setProperty('--dy', Math.sin(a) * 46 + 'px');
      entsEl.appendChild(d);
    }
  }

  /* ---------- fizika ---------- */

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  G.overlap = overlap;

  function solids() {
    return G.ents.filter(function (e) { return e.active && (e.solid || e.hiddenBlock); });
  }

  function updatePlayer(inp) {
    var p = G.player, m = G.mods;

    // Mozgó platform visz magával.
    if (p.ground && p.ground.active && p.ground.solid) {
      p.x += p.ground.dx || 0;
      p.y += p.ground.dy || 0;
    }

    var dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (m.invert) dir = -dir;
    if (dir) {
      p.vx += dir * (p.grounded ? PHYS.accelGround : PHYS.accelAir);
      p.face = dir;
    } else if (p.grounded) {
      p.vx *= PHYS.friction;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    } else {
      p.vx *= 0.9;
    }
    if (p.vx > PHYS.maxSpeed) p.vx = PHYS.maxSpeed;
    if (p.vx < -PHYS.maxSpeed) p.vx = -PHYS.maxSpeed;

    var pressed = inp.jump && !G.prevJump;
    G.prevJump = inp.jump;
    if (pressed) p.buffer = PHYS.buffer; else if (p.buffer > 0) p.buffer--;
    if (p.grounded) p.coyote = PHYS.coyote; else if (p.coyote > 0) p.coyote--;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -PHYS.jump;
      p.buffer = 0;
      p.coyote = 0;
      p.jumping = true;
      RG.ui.sfx('jump');
    }
    if (p.jumping && !inp.jump && p.vy < 0) { p.vy *= PHYS.cut; p.jumping = false; }
    if (p.vy >= 0) p.jumping = false;

    p.vy += m.gravity;
    if (p.vy > PHYS.maxFall) p.vy = PHYS.maxFall;

    var extra = (p.grounded && p.ground && p.ground.conveyor) || 0;
    var list = solids();

    // Vízszintes mozgás
    p.x += p.vx + extra;
    list.forEach(function (s) {
      if (!s.solid || s.oneway || !overlap(p, s)) return;
      if (p.vx + extra > 0) p.x = s.x - p.w;
      else if (p.vx + extra < 0) p.x = s.x + s.w;
      p.vx = 0;
    });
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x > G.level.w - p.w) { p.x = G.level.w - p.w; p.vx = 0; }

    // Függőleges mozgás
    var prevBottom = p.y + p.h, prevTop = p.y;
    p.y += p.vy;
    p.grounded = false;
    p.ground = null;
    list.forEach(function (s) {
      if (!overlap(p, s)) return;
      if (s.hiddenBlock && !s.solid) {
        if (p.vy < 0 && prevTop >= s.y + s.h - 1) {
          s.reveal(G, s);
          p.y = s.y + s.h;
          p.vy = 0;
          p.jumping = false;
          RG.ui.sfx('bonk');
        }
        return;
      }
      var prevSolidTop = s.y - (s.dy || 0);
      if (p.vy >= 0 && (!s.oneway || prevBottom <= prevSolidTop + 1)) {
        p.y = s.y - p.h;
        p.vy = 0;
        p.grounded = true;
        p.ground = s;
        if (s.onLand) s.onLand(G, s);
      } else if (p.vy < 0 && !s.oneway) {
        p.y = s.y + s.h;
        p.vy = 0;
        p.jumping = false;
        if (s.onBonk) s.onBonk(G, s);
      }
    });

    // Mozgó tömör elem kitolja a játékost.
    list.forEach(function (s) {
      if (!s.solid || s.oneway || !(s.dx || s.dy) || !overlap(p, s)) return;
      if (s.dx > 0) p.x = s.x + s.w;
      else if (s.dx < 0) p.x = s.x - p.w;
      else if (s.dy > 0) p.y = s.y + s.h;
      else if (s.dy < 0) { p.y = s.y - p.h; p.vy = 0; p.grounded = true; p.ground = s; }
    });

    if (p.y > G.level.h + 40) G.kill('fall');
  }

  function interactions() {
    var p = G.player;
    var hit = { x: p.x + 2, y: p.y + 2, w: p.w - 4, h: p.h - 4 };
    for (var i = 0; i < G.ents.length && !G.dead; i++) {
      var e = G.ents[i];
      if (!e.active) continue;
      if (e.hazard) {
        var ins = e.inset === undefined ? 3 : e.inset;
        if (overlap(hit, { x: e.x + ins, y: e.y + ins, w: e.w - ins * 2, h: e.h - ins * 2 })) G.kill(e.reason || e.type);
      }
      if (e.onTouch && overlap(p, e)) {
        e.onTouch(G, e);
        if (e.once) e.active = false;
      }
    }
  }

  /* ---------- lépés ---------- */

  function step(inp) {
    G.frame++;

    if (G.needBuild) {
      G.needBuild = false;
      build();
    }

    if (G.transition) {
      if (--G.transition.t <= 0) {
        var to = G.transition.to;
        G.transition = null;
        RG.ui.hidePageLoad();
        G.loadLevel(to);
      }
      return;
    }

    if (G.dead) {
      if (--G.deadT <= 0) {
        if (G.level.afterDeath) G.level.afterDeath(G);
        else build();
      }
      return;
    }

    if (G.paused) return;

    G.levelFrame++;
    G.playFrames++;
    if (G.playFrames % 300 === 0) G.save();
    RG.ui.tick(G);

    if (G.level.onUpdate) G.level.onUpdate(G);
    var list = G.ents.slice();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.update && e.active) e.update(G, e);
    }
    if (G.dead || G.transition) return;

    if (!G.freeze) {
      updatePlayer(inp);
      if (!G.dead) interactions();
    }
    moveCamera(false);
  }
  RG.step = step;

  /* ---------- kamera és rajzolás ---------- */

  function cameraTarget() {
    var p = G.player, L = G.level;
    var x = p.x + p.w / 2 - W * 0.42;
    var y = p.y + p.h / 2 - H * 0.58;
    return {
      x: Math.max(0, Math.min(L.w - W, x)),
      y: Math.max(0, Math.min(L.h - H, y))
    };
  }
  function moveCamera() {
    var t = cameraTarget();
    G.cam.x += (t.x - G.cam.x) * 0.14;
    G.cam.y += (t.y - G.cam.y) * 0.14;
  }
  function snapCamera() {
    var t = cameraTarget();
    G.cam.x = t.x;
    G.cam.y = t.y;
  }

  function drawEnt(e) {
    var el = e.el;
    if (!el) return;
    if (e._active !== e.active) {
      el.style.display = e.active ? '' : 'none';
      e._active = e.active;
    }
    if (e._rx !== e.x || e._ry !== e.y) {
      el.style.transform = 'translate(' + e.x + 'px,' + e.y + 'px)';
      e._rx = e.x;
      e._ry = e.y;
    }
  }

  function render() {
    var p = G.player;
    world.style.transform = 'translate(' + (-Math.round(G.cam.x)) + 'px,' + (-Math.round(G.cam.y)) + 'px)';
    G.ents.forEach(drawEnt);
    playerEl.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) scaleX(' + (p.face < 0 ? -1 : 1) + ')';
    playerEl.style.display = (G.dead || G.hidePlayer) ? 'none' : '';
    if (G.mods.dark) {
      darkEl.style.display = 'block';
      darkEl.style.setProperty('--px', (p.x + p.w / 2 - G.cam.x) + 'px');
      darkEl.style.setProperty('--py', (p.y + p.h / 2 - G.cam.y) + 'px');
    } else {
      darkEl.style.display = 'none';
    }
  }
  RG.render = render;

  /* ---------- főhurok ---------- */

  var last = 0, acc = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    if (!last) last = t;
    var dt = Math.min(t - last, 100);
    last = t;
    if (RG.holdLoop) { render(); return; }
    acc += dt;
    while (acc >= FRAME) {
      step(input);
      acc -= FRAME;
    }
    render();
  }

  /* ---------- indítás ---------- */

  RG.boot = function () {
    if (params.has('reset')) {
      storageClear();
      params.delete('reset');
      var q = params.toString();
      location.replace(location.pathname + (q ? '?' + q : ''));
      return;
    }

    stage = document.getElementById('stage');
    world = document.getElementById('world');
    entsEl = document.getElementById('ents');
    playerEl = document.getElementById('player');
    darkEl = document.getElementById('dark');

    bindInput();
    RG.ui.init(G);
    fit();
    addEventListener('resize', fit);
    addEventListener('orientationchange', fit);

    var save = storageGet();
    if (RG.debugMode && params.has('level')) {
      G.noSave = true;
      G.loadLevel(Math.max(0, Math.min(RG.levels.length - 1, parseInt(params.get('level'), 10) || 0)));
    } else if (save && RG.levels[save.level]) {
      G.deaths = save.deaths || 0;
      G.playFrames = save.playFrames || 0;
      RG.ui.setMuted(!!save.muted);
      G.levelIndex = save.level;
      G.level = RG.levels[save.level];
      G.flags = save.flags || {};
      G.checkpoint = save.checkpoint || null;
      G.resumed = true;
      build();
    } else {
      G.loadLevel(0);
    }

    if (RG.debugMode) setupDebug();
    requestAnimationFrame(loop);
  };

  /* ---------- hibakereső mód (?debug=1) ---------- */

  function setupDebug() {
    G.noSave = true;
    document.body.classList.add('debug');
    RG.debug = {
      hold: function (v) { RG.holdLoop = v !== false; },
      step: function (n, inp) {
        inp = inp || {};
        for (var i = 0; i < (n || 1); i++) step(inp);
        render();
      },
      load: function (i) { G.loadLevel(i); },
      god: function (v) { G.god = v !== false; }
    };
    if (params.has('god')) G.god = true;
    var s = document.createElement('script');
    s.src = 'tests/solutions.js';
    document.body.appendChild(s);
  }
})(window.RG);
