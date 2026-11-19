/* =====================================================================
   VoltRush — settings.js
   ระบบตั้งค่า + แกนพลังงาน 3D + Credit
   ออกแบบและพัฒนาโดย นาย นันทภพ หนูประดับ / Nanthapop Nupradub
   ต้องโหลดหลัง audio.js / engine.js / effects.js / hud.js (วางท้ายสุดของ <body> ได้เลย)
   ===================================================================== */
(function () {
  'use strict';

  const KEY = 'voltrushSettings';
  const CREDIT_TH = 'นาย นันทภพ หนูประดับ';
  const CREDIT_EN = 'Nanthapop Nupradub';
  const root = document.documentElement;

  /* ---------- ค่าเริ่มต้น: เครื่องช้าหรือเปิดโหมดลดการเคลื่อนไหว จะเริ่มที่ระดับเบาลง ---------- */
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2;
  const DEF = { fx: calm ? 'off' : (lowEnd ? 'low' : 'high'), d3: !calm, ptr: true, shake: true, haptic: true };
  const FX_LEVELS = ['off', 'low', 'high'];

  function load() {
    let o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { o = {}; }
    const s = Object.assign({}, DEF, o);
    if (FX_LEVELS.indexOf(s.fx) < 0) s.fx = DEF.fx;
    ['d3', 'ptr', 'shake', 'haptic'].forEach(k => { s[k] = !!s[k]; });
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  let S = load();

  /* ---------- ใช้ค่าตั้งกับหน้าเว็บ ---------- */
  function apply() {
    root.dataset.fx = S.fx;
    root.dataset.d3 = (S.d3 && S.fx !== 'off') ? 'on' : 'off';
    root.dataset.ptr = (S.ptr && S.fx !== 'off') ? 'on' : 'off';
  }
  apply();

  /* ---------- ครอบฟังก์ชันเอฟเฟกต์เดิมใน effects.js ให้เคารพค่าตั้ง ---------- */
  const fromPointer = { on: false };
  ['pointermove', 'pointerdown'].forEach(t => addEventListener(t, () => {
    fromPointer.on = true; setTimeout(() => { fromPointer.on = false; }, 0);
  }, true));

  function wrapFn(name, make) {
    const orig = window[name];
    if (typeof orig === 'function') window[name] = make(orig);
  }
  wrapFn('fxAdd', o => function () {
    if (S.fx === 'off') return;
    if (fromPointer.on && !S.ptr) return;
    return o.apply(this, arguments);
  });
  wrapFn('fxBurst', o => function (x, y, n, cols) {
    if (S.fx === 'off') return;
    if (S.fx === 'low') n = Math.ceil(n * 0.5);
    return o.call(this, x, y, n, cols);
  });
  wrapFn('fxConfetti', o => function () { if (S.fx === 'off') return; return o.apply(this, arguments); });
  wrapFn('fxShake', o => function () { if (S.fx === 'off' || !S.shake) return; return o.apply(this, arguments); });

  if (typeof navigator.vibrate === 'function') {
    const vib = navigator.vibrate.bind(navigator);
    try { navigator.vibrate = function (p) { return S.haptic ? vib(p) : false; }; } catch (e) {}
  }

  /* ---------- แกนพลังงาน 3D บนหน้าแรก + credit ---------- */
  function mountStartDecor() {
    const card = document.querySelector('#startScreen .start-card');
    if (!card) return;
    if (!card.querySelector('.vr-core')) {
      const core = document.createElement('div');
      core.className = 'vr-core';
      core.setAttribute('aria-hidden', 'true');
      core.innerHTML = '<div class="vr-floor"></div><div class="vr-scene"><div class="vr-spin">' +
        '<div class="vr-cube"><i>⚡</i><i>⚡</i><i>⚡</i><i>⚡</i><i>⚡</i><i>⚡</i></div>' +
        '<b class="vr-ring r1"></b><b class="vr-ring r2"></b><b class="vr-ring r3"></b></div></div>';
      card.insertBefore(core, card.querySelector('h1') || card.firstChild);
    }
    if (!card.querySelector('.vr-credit')) {
      const c = document.createElement('p');
      c.className = 'vr-credit';
      c.innerHTML = 'ออกแบบและพัฒนาโดย <b>' + CREDIT_TH + '</b><br>' + CREDIT_EN;
      card.appendChild(c);
    }
  }

  /* แกนเอียงตามเมาส์ (เฉพาะเมาส์จริง เมื่อเปิดฉาก 3D) */
  let rafId = 0;
  addEventListener('pointermove', e => {
    if (root.dataset.d3 !== 'on' || e.pointerType === 'touch' || rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      document.querySelectorAll('.vr-core').forEach(c => {
        c.style.setProperty('--vr-ry', (x * 38).toFixed(1) + 'deg');
        c.style.setProperty('--vr-rx', (-y * 24).toFixed(1) + 'deg');
      });
    });
  }, { passive: true });

  /* ---------- หน้าต่าง Settings ---------- */
  const flag = (name) => (typeof window[name] === 'function');
  const getSound = () => { try { return !!soundEnabled; } catch (e) { return true; } };
  const getMusic = () => { try { return !!musicEnabled; } catch (e) { return true; } };

  const TOGGLES = [
    { g: 'เสียง', id: 'sound', l: 'เสียงเอฟเฟกต์', get: getSound, set: v => { if (v !== getSound() && flag('toggleSound')) toggleSound(); } },
    { g: 'เสียง', id: 'music', l: 'ดนตรีพื้นหลัง', get: getMusic, set: v => { if (v !== getMusic() && flag('toggleMusic')) toggleMusic(); } },
    { g: 'ภาพและการเคลื่อนไหว', id: 'fx', seg: true },
    { g: 'ภาพและการเคลื่อนไหว', id: 'd3', l: 'ฉาก 3D', s: 'แกนพลังงานหน้าแรก และเมืองที่เอียงเป็นมุม 3D', get: () => S.d3, set: v => { S.d3 = v; } },
    { g: 'ภาพและการเคลื่อนไหว', id: 'ptr', l: 'แสงและประกายตามเมาส์/นิ้ว', s: 'วงแสงตามเมาส์ และประกายตอนแตะ', get: () => S.ptr, set: v => { S.ptr = v; } },
    { g: 'ภาพและการเคลื่อนไหว', id: 'shake', l: 'จอสั่นตอนเกิดเหตุ', s: 'เช่น โรงไฟฟ้าระเบิด', get: () => S.shake, set: v => { S.shake = v; } }
  ];
  if (typeof navigator.vibrate === 'function') {
    TOGGLES.push({ g: 'ภาพและการเคลื่อนไหว', id: 'haptic', l: 'สั่นเครื่อง', s: 'สั่นตอนเกิดเหตุฉุกเฉิน (มือถือที่รองรับ)', get: () => S.haptic, set: v => { S.haptic = v; } });
  }
  const FX_LABEL = { off: 'ปิด', low: 'ต่ำ', high: 'สูง' };

  function panelHTML() {
    let html = '<div class="vr-card" role="dialog" aria-modal="true" aria-labelledby="vrTitle">' +
      '<div class="vr-head"><h2 id="vrTitle">⚙️ ตั้งค่า</h2><button class="vr-x" type="button" data-act="close" aria-label="ปิด">✕</button></div>';
    let lastG = '';
    TOGGLES.forEach(t => {
      if (t.g !== lastG) { html += '<h3>' + t.g + '</h3>'; lastG = t.g; }
      if (t.seg) {
        html += '<div class="vr-row"><div class="vr-lab">คุณภาพเอฟเฟกต์<span class="vr-sub">ถ้าเครื่องกระตุก ให้ลดระดับลง</span></div>' +
          '<div class="vr-seg" role="group" aria-label="คุณภาพเอฟเฟกต์">' +
          FX_LEVELS.map(k => '<button type="button" data-fx="' + k + '" aria-pressed="' + (S.fx === k) + '">' + FX_LABEL[k] + '</button>').join('') +
          '</div></div>';
      } else {
        html += '<div class="vr-row"><div class="vr-lab">' + t.l + (t.s ? '<span class="vr-sub">' + t.s + '</span>' : '') + '</div>' +
          '<button type="button" class="vr-sw" role="switch" data-id="' + t.id + '" aria-checked="' + !!t.get() + '" aria-label="' + t.l + '"></button></div>';
      }
    });
    html += '<button type="button" class="vr-reset" data-act="reset">คืนค่าภาพและเอฟเฟกต์เป็นค่าเริ่มต้น</button>' +
      '<div class="vr-about">VoltRush<b>' + CREDIT_TH + '</b>' + CREDIT_EN + '<br>© 2026 ผู้พัฒนาและเจ้าของเกม</div></div>';
    return html;
  }

  const overlay = document.createElement('div');
  overlay.id = 'vrSettings';
  document.body.appendChild(overlay);

  let isOpen = false, wasRunning = false, lastFocus = null;

  function render() { overlay.innerHTML = panelHTML(); }

  function openSettings() {
    if (isOpen) return;
    isOpen = true; lastFocus = document.activeElement;
    try { wasRunning = !!gameTimerId; } catch (e) { wasRunning = false; }
    if (wasRunning && flag('pauseGame')) pauseGame();
    render(); overlay.classList.add('on');
    const x = overlay.querySelector('.vr-x'); if (x) x.focus();
  }
  function closeSettings() {
    if (!isOpen) return;
    isOpen = false; overlay.classList.remove('on');
    if (wasRunning && flag('resumeGame')) resumeGame();
    wasRunning = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) return closeSettings();
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.act === 'close') return closeSettings();
    if (b.dataset.act === 'reset') { S = Object.assign({}, DEF); save(); apply(); return render(); }
    if (b.dataset.fx) { S.fx = b.dataset.fx; save(); apply(); return render(); }
    if (b.dataset.id) {
      const t = TOGGLES.find(x => x.id === b.dataset.id); if (!t) return;
      t.set(!t.get()); save(); apply(); render();
      const again = overlay.querySelector('.vr-sw[data-id="' + b.dataset.id + '"]'); if (again) again.focus();
    }
  });
  addEventListener('keydown', e => {
    if (!isOpen) return;
    if (e.key === 'Escape') return closeSettings();
    if (e.key === 'Tab') {   /* ล็อกโฟกัสไว้ในหน้าต่าง */
      const f = overlay.querySelectorAll('button'); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- ปุ่มเฟือง: ลอยมุมซ้ายล่าง (นอกเกม) + ในแถบบนของเกม ---------- */
  function mountGears() {
    if (!document.getElementById('vrGear')) {
      const g = document.createElement('button');
      g.id = 'vrGear'; g.type = 'button'; g.className = 'vr-gear'; g.setAttribute('aria-label', 'ตั้งค่า'); g.textContent = '⚙️';
      g.addEventListener('click', openSettings);
      document.body.appendChild(g);
    }
    const music = document.getElementById('musicToggleBtn');
    if (music && !document.getElementById('vrGearTop')) {
      const t = document.createElement('button');
      t.id = 'vrGearTop'; t.type = 'button'; t.className = 'env-chip vr-gear-top'; t.setAttribute('aria-label', 'ตั้งค่า'); t.textContent = '⚙️';
      t.addEventListener('click', openSettings);
      music.insertAdjacentElement('afterend', t);
    }
  }

  /* ---------- credit ในโค้ด/แท็บเบราว์เซอร์ ---------- */
  if (!document.querySelector('meta[name="author"]')) {
    const m = document.createElement('meta'); m.name = 'author'; m.content = CREDIT_TH + ' / ' + CREDIT_EN;
    document.head.appendChild(m);
  }
  try { console.log('%c⚡ VoltRush%c  by ' + CREDIT_EN + ' (' + CREDIT_TH + ')', 'color:#ffe3a3;font-weight:800;font-size:14px', 'color:#9bd7ff'); } catch (e) {}

  mountStartDecor();
  mountGears();
  window.VoltRushSettings = { open: openSettings, close: closeSettings, get: () => Object.assign({}, S) };
})();
