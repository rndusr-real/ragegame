// Pályaelemek és csapdák. Minden elem egy sima objektum, a motor frissíti és rajzolja ki.
(function (RG) {
  'use strict';

  var E = RG.E = {};

  function base(type, x, y, w, h, o) {
    return Object.assign({
      type: type, x: x, y: y, w: w, h: h, dx: 0, dy: 0,
      active: true, solid: false, oneway: false, hazard: false, cls: '', html: ''
    }, o || {});
  }

  function near(G, x1, x2) {
    var p = G.player;
    return p.x + p.w >= x1 && p.x <= x2;
  }

  // Dísz, nincs ütközése.
  E.deco = function (x, y, w, h, o) { return base('deco', x, y, w, h, o); };

  // Tömör elem.
  E.block = function (x, y, w, h, o) { return base('block', x, y, w, h, Object.assign({ solid: true }, o)); };

  // Alulról átugorható, felülről rááll.
  E.platform = function (x, y, w, h, o) { return base('block', x, y, w, h, Object.assign({ solid: true, oneway: true }, o)); };

  // Úgy néz ki, mint egy platform, de átesel rajta.
  E.fake = function (x, y, w, h, o) { return base('block', x, y, w, h, o); };

  // Ráállás után leszakad.
  E.collapse = function (x, y, w, h, o) {
    return base('block', x, y, w, h, Object.assign({
      solid: true, oneway: true, delay: 18, timer: -1, vy: 0, falling: false,
      onLand: function (G, e) {
        if (e.timer < 0) {
          e.timer = e.delay;
          e.el.classList.add('shake');
        }
      },
      update: function (G, e) {
        if (e.timer > 0 && --e.timer === 0) {
          e.solid = false;
          e.falling = true;
          e.el.classList.remove('shake');
        }
        if (e.falling) {
          e.vy += 0.6;
          e.y += e.vy;
          if (e.y > G.level.h + 200) e.active = false;
        }
      }
    }, o));
  };

  // Láthatatlan blokk: alulról fejbe vág, utána látható és tömör.
  E.hidden = function (x, y, w, h, o) {
    return base('block', x, y, w, h, Object.assign({
      hiddenBlock: true,
      cls: 'invisible ' + ((o && o.cls) || ''),
      reveal: function (G, e) {
        e.solid = true;
        e.el.classList.remove('invisible');
      }
    }, o, { cls: 'invisible ' + ((o && o.cls) || '') }));
  };

  // Láthatatlan, de végig tömör padló.
  E.invisibleFloor = function (x, y, w, h) {
    return base('block', x, y, w, h, { solid: true, cls: 'invisible' });
  };

  // Álló tüske.
  E.spike = function (x, y, w, h, o) { return base('spike', x, y, w, h, Object.assign({ hazard: true }, o)); };

  // Bármi, ami megöl (reklám, értesítés), de nem tüskének néz ki.
  E.hazard = function (x, y, w, h, o) { return base('hazard', x, y, w, h, Object.assign({ hazard: true }, o)); };

  // A földből kiugró tüske, ha közel érsz.
  E.popspike = function (x, groundY, o) {
    o = o || {};
    var h = o.h || 24;
    return base('spike', x, groundY, o.w || 24, h, {
      z: -1, trigger: o.trigger, top: groundY - h, armed: false, reason: 'popspike',
      update: function (G, e) {
        if (!e.armed && near(G, e.trigger[0], e.trigger[1])) {
          e.armed = true;
          RG.ui.sfx('trap');
        }
        if (e.armed && e.y > e.top) {
          e.y = Math.max(e.top, e.y - 4);
          if (groundY - e.y >= 8) e.hazard = true;
        }
      }
    });
  };

  // Lezuhanó elem. Ha földet ért, tömör lesz (ha kéred).
  E.dropper = function (x, y, w, h, o) {
    return base('hazard', x, y, w, h, Object.assign({
      hazard: true, vy: 0, armed: false, floorY: 460, solidAfter: false, reason: 'dropper', inset: 4,
      update: function (G, e) {
        if (!e.armed && near(G, e.trigger[0], e.trigger[1])) {
          e.armed = true;
          RG.ui.sfx('trap');
        }
        if (!e.armed || e.landed) return;
        e.vy = Math.min(14, e.vy + 0.8);
        e.y += e.vy;
        if (e.y + e.h >= e.floorY) {
          e.y = e.floorY - e.h;
          e.landed = true;
          e.hazard = false;
          if (e.solidAfter) e.solid = true; else e.active = false;
        }
      }
    }, o));
  };

  // Vízszintesen végigguruló veszély (bevásárlókocsi).
  E.roller = function (x, y, w, h, o) {
    return base('hazard', x, y, w, h, Object.assign({
      hazard: true, armed: false, vx: -5, reason: 'roller',
      update: function (G, e) {
        if (!e.armed && near(G, e.trigger[0], e.trigger[1])) {
          e.armed = true;
          RG.ui.sfx('trap');
        }
        if (!e.armed) return;
        e.x += e.vx;
        if (e.x < e.endX || e.x > G.level.w + 100) e.active = false;
      }
    }, o));
  };

  // Két pont között járőröző veszély (értesítés).
  E.patrol = function (x, y, w, h, o) {
    return base('hazard', x, y, w, h, Object.assign({
      hazard: true, speed: 2, axis: 'x', from: x, to: x, dir: 1, reason: 'patrol',
      update: function (G, e) {
        e[e.axis] += e.speed * e.dir;
        if (e[e.axis] >= e.to) { e[e.axis] = e.to; e.dir = -1; }
        if (e[e.axis] <= e.from) { e[e.axis] = e.from; e.dir = 1; }
      }
    }, o));
  };

  // Le-fel mozgó veszély (reklámsáv).
  E.crusher = function (x, w, o) {
    return base('hazard', x, 0, w, o.h, Object.assign({
      hazard: true, t: o.phase || 0, reason: 'crusher', inset: 2,
      update: function (G, e) {
        e.t++;
        e.y = e.mid + e.amp * Math.sin(e.t / e.period * Math.PI * 2);
      }
    }, o));
  };

  // Körbe forgó veszély (töltés-pörgettyű).
  E.orbit = function (cx, cy, r, o) {
    return base('hazard', cx - 12, cy - 12, 24, 24, Object.assign({
      hazard: true, a: 0, speed: 0.03, reason: 'spinner',
      update: function (G, e) {
        e.a += e.speed;
        e.x = cx + Math.cos(e.a) * r - e.w / 2;
        e.y = cy + Math.sin(e.a) * r - e.h / 2;
      }
    }, o));
  };

  // Két pont között mozgó platform.
  E.mover = function (x, y, w, h, o) {
    return base('block', x, y, w, h, Object.assign({
      solid: true, oneway: true, speed: 1, to: [x, y], from: [x, y], u: 0, dir: 1,
      update: function (G, e) {
        var len = Math.hypot(e.to[0] - e.from[0], e.to[1] - e.from[1]) || 1;
        e.u += e.dir * e.speed / len;
        if (e.u >= 1) { e.u = 1; e.dir = -1; }
        if (e.u <= 0) { e.u = 0; e.dir = 1; }
        var nx = e.from[0] + (e.to[0] - e.from[0]) * e.u;
        var ny = e.from[1] + (e.to[1] - e.from[1]) * e.u;
        e.dx = nx - e.x;
        e.dy = ny - e.y;
        e.x = nx;
        e.y = ny;
      }
    }, o));
  };

  // Rugó: felülről érintve kilő.
  E.spring = function (x, y, w, h, o) {
    return base('spring', x, y, w, h, Object.assign({
      power: 17,
      onTouch: function (G, e) {
        var p = G.player;
        if (p.vy >= 0 || p.grounded) {
          p.vy = -e.power;
          p.jumping = false;
          p.grounded = false;
          p.ground = null;
          p.coyote = 0;
          RG.ui.sfx('spring');
          e.el.classList.remove('boing');
          void e.el.offsetWidth;
          e.el.classList.add('boing');
        }
      }
    }, o));
  };

  // Futószalag: tömör, és visz magával.
  E.conveyor = function (x, y, w, h, o) {
    return base('block', x, y, w, h, Object.assign({ solid: true, conveyor: -2, cls: 'conveyor' }, o));
  };

  // Láthatatlan érzékelő. Építésenként egyszer szól.
  E.sensor = function (x, y, w, h, fn) {
    return base('sensor', x, y, w, h, { once: true, onTouch: fn });
  };

  // Teljes magasságú érzékelő egy x pozícióban.
  E.zone = function (x, fn) { return E.sensor(x, -2000, 12, 6000, fn); };

  // Ellenőrzőpont. A hamis ugyanúgy néz ki, de felrobban.
  E.checkpoint = function (id, x, groundY, o) {
    o = o || {};
    return base('checkpoint', x, groundY - 44, 28, 44, {
      html: '<span>Mentés</span>',
      cls: 'cp',
      onTouch: function (G, e) {
        if (o.fake) { G.kill('fakecheckpoint'); return; }
        if (!(G.checkpoint && G.checkpoint.id === id)) {
          G.setCheckpoint(id, x + 4, groundY - G.player.h);
          RG.ui.say(o.say || 'Mentve.');
        }
        e.el.classList.add('on');
      },
      update: function (G, e) {
        if (!e.marked && G.checkpoint && G.checkpoint.id === id) {
          e.marked = true;
          e.el.classList.add('on');
        }
      }
    });
  };

  // Az elfutó ajándék. A már megtett ugrásait halál után is megtartja.
  E.goal = function (x, y, o) {
    o = o || {};
    var hops = o.hops || [];
    var range = o.range || 110;
    return base('goal', x, y, 34, 34, {
      html: '<span>🎁</span>',
      anim: null,
      update: function (G, e) {
        var idx = G.flags.goalHop || 0;
        if (!e.placed) {
          e.placed = true;
          if (idx > 0) { e.x = hops[idx - 1].x; e.y = hops[idx - 1].y; }
        }
        if (e.anim) {
          var a = e.anim;
          a.t++;
          var u = a.t / a.n;
          e.x = a.x0 + (a.x1 - a.x0) * u;
          e.y = a.y0 + (a.y1 - a.y0) * u - Math.sin(u * Math.PI) * 120;
          if (a.t >= a.n) { e.x = a.x1; e.y = a.y1; e.anim = null; }
          return;
        }
        var p = G.player;
        var dx = (p.x + p.w / 2) - (e.x + e.w / 2);
        var dy = (p.y + p.h / 2) - (e.y + e.h / 2);
        if (idx < hops.length) {
          if (Math.abs(dx) < range && Math.abs(dy) < 130) {
            var h = hops[idx];
            G.flags.goalHop = idx + 1;
            e.anim = { t: 0, n: 40, x0: e.x, y0: e.y, x1: h.x, y1: h.y };
            RG.ui.sfx('trap');
            if (h.say) RG.ui.say(h.say);
            G.save();
          }
        } else if (G.overlap(p, e)) {
          if (o.onCatch) o.onCatch(G, e); else G.completeLevel();
        }
      }
    });
  };
})(window.RG);
