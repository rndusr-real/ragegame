// Kezdőkód: a feltételek elfogadása után csak a barátoktól kapott kóddal indul a játék.
// A helyes kód a Firebase Realtime Database "startCode" kulcsa alatt van, így a nyilvános forrásban nem látszik.
(function (RG) {
  'use strict';

  var ui = RG.ui;
  var cached = null;

  // Tartalék, ha nincs beállítva Firebase vagy nem érhető el (base64, hogy ne legyen olvasható a forrásban).
  var FALLBACK = 'U2VNbUk=';

  function fallbackCode() {
    try { return atob(FALLBACK); } catch (e) { return ''; }
  }

  // A helyes kód lekérése a Firebase REST felületén (nincs szükség a Firebase könyvtárra).
  ui.fetchStartCode = function () {
    if (cached !== null) return Promise.resolve(cached);
    var base = ((RG.cfg.firebase || {}).databaseURL || '').replace(/\/+$/, '');
    if (!base || !window.fetch) return Promise.resolve(fallbackCode());
    var timeout = new Promise(function (res) { setTimeout(function () { res(null); }, 5000); });
    var request = fetch(base + '/startCode.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () { return null; });
    return Promise.race([request, timeout]).then(function (code) {
      if (typeof code === 'string' && code) {
        cached = code;
        return code;
      }
      return fallbackCode();
    });
  };

  ui.askCode = function (onDone) {
    var G = RG.G;
    var attempts = 0, busy = false;
    var m = ui.modal({
      cls: 'startcode',
      html:
        '<div class="sc-icon">🔐</div>' +
        '<div class="sc-title">Biztonsági ellenőrzés</div>' +
        '<div class="sc-sub">A biztonság érdekében ezt a játékot csak a barátaid által megadott kóddal kezdheted el.</div>' +
        '<input class="sc-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40" placeholder="Kód">' +
        '<div class="sc-msg"></div>',
      buttons: [{ label: 'Ellenőrzés', cls: 'sc-check', onClick: function () { check(); } }]
    });

    var input = m.box.querySelector('.sc-input'), msg = m.box.querySelector('.sc-msg');
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); check(); }
    });
    setTimeout(function () { try { input.focus(); } catch (e) { /* nem baj */ } }, 50);

    var WRONG = [
      'Hibás kód. Kérd el a barátaidtól.',
      'Ez sem az. Tényleg kérdezd meg őket.',
      'Hibás. A kis- és nagybetű számít.',
      'Még mindig nem. Írj nekik Discordon.'
    ];

    function check() {
      if (busy) return;
      var value = input.value.trim();
      if (!value) { msg.textContent = 'Írd be a kódot.'; return; }
      busy = true;
      msg.textContent = 'Ellenőrzés…';
      msg.className = 'sc-msg';
      ui.fetchStartCode().then(function (code) {
        busy = false;
        if (value === code) {
          msg.textContent = 'Kód elfogadva. Jó szórakozást (nem).';
          msg.className = 'sc-msg ok';
          G.meta.codeOk = true;
          G.save();
          ui.sfx('checkpoint');
          setTimeout(function () {
            m.close();
            if (onDone) onDone();
          }, 700);
          return;
        }
        msg.textContent = WRONG[attempts % WRONG.length];
        msg.className = 'sc-msg bad';
        attempts++;
        ui.sfx('bonk');
        m.box.classList.remove('shake-x');
        void m.box.offsetWidth;
        m.box.classList.add('shake-x');
        input.select();
      });
    }

    return { box: m.box, input: input, check: check };
  };
})(window.RG);
