/* ลูกเล่น: อนุภาค, confetti, ตัวเลขลอย, จอสั่น, ripple/glow/tilt, เส้นไฟไหล */
const FX = { cv: null, cx: null, ps: [], run: false, pt: { x: innerWidth / 2, y: innerHeight / 2 } };
const wrap = (n, fn) => { const o = window[n]; window[n] = function (...a) { return fn(o, a); }; };
(function () {
  const c = document.createElement('canvas'); c.id = 'fxCanvas'; document.body.appendChild(c);
  FX.cv = c; FX.cx = c.getContext('2d');
  const f = () => { c.width = innerWidth; c.height = innerHeight; }; f(); addEventListener('resize', f);
  const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sv.id = 'flowSvg'; document.body.appendChild(sv);
})();
function fxLoop() {
  const { cx, cv, ps } = FX; cx.clearRect(0, 0, cv.width, cv.height);
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.life--; p.r += p.spin;
    if (p.life <= 0 || p.y > cv.height + 20) { ps.splice(i, 1); continue; }
    cx.globalAlpha = Math.min(1, p.life / 20); cx.fillStyle = p.c;
    if (p.rect) { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillRect(-p.s, -p.s / 2, p.s * 2, p.s); cx.restore(); }
    else { cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 6.3); cx.fill(); }
  }
  if (ps.length) requestAnimationFrame(fxLoop); else { FX.run = false; cx.clearRect(0, 0, cv.width, cv.height); }
}
function fxAdd(a) { FX.ps.push(...a); if (!FX.run) { FX.run = true; requestAnimationFrame(fxLoop); } }
function fxBurst(x, y, n, cols) {
  const o = [];
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 2 + Math.random() * 5; o.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: .18, s: 1.5 + Math.random() * 2.5, c: cols[i % cols.length], life: 30 + Math.random() * 30, r: 0, spin: 0 }); }
  fxAdd(o);
}
function fxConfetti() {
  const cols = ['#ffe3a3', '#ffa8b5', '#9bd7ff', '#b5f0cf', '#cdb8ff'], o = [];
  for (let i = 0; i < 140; i++) o.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * 200, vx: Math.random() * 4 - 2, vy: 1 + Math.random() * 3, g: .05, s: 4 + Math.random() * 4, c: cols[i % 5], life: 200 + Math.random() * 100, r: Math.random() * 6, spin: Math.random() * .3 - .15, rect: true });
  fxAdd(o);
}
function fxFloat(t, x, y, col) {
  const e = document.createElement('div'); e.className = 'fx-float'; e.textContent = t;
  e.style.cssText = 'left:' + x + 'px;top:' + y + 'px;color:' + (col || '#ffe3a3'); document.body.appendChild(e); setTimeout(() => e.remove(), 1300);
}
function fxShake() {
  document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 700); if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
}
function fxFlow() {
  const svg = byId('flowSvg'), city = byId('cityVisual'); if (!svg || !city) return;
  if (!gameInProgress || !state || HUD.open) { svg.innerHTML = ''; return; }
  const c = city.getBoundingClientRect(), ex = c.left + c.width / 2, ey = c.bottom - 6; let h = '';
  document.querySelectorAll('#plantStrip .chip.on').forEach(ch => {
    const p = state.plants[ch.dataset.k], out = p ? p.output : 0; if (!out) return;
    const r = ch.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top;
    h += '<path d="M' + x + ' ' + y + ' C' + x + ' ' + (y - 50) + ' ' + ex + ' ' + (ey + 50) + ' ' + ex + ' ' + ey + '" stroke="' + ch.dataset.c + '" stroke-width="' + (1.5 + out / 14) + '"/>';
  });
  svg.innerHTML = h;
}
addEventListener('pointerdown', e => {
  FX.pt = { x: e.clientX, y: e.clientY };
  const b = e.target.closest && e.target.closest('button');
  if (b && !b.disabled) { const r = b.getBoundingClientRect(), s = document.createElement('span'); s.className = 'ripple'; s.style.left = (e.clientX - r.left) + 'px'; s.style.top = (e.clientY - r.top) + 'px'; b.appendChild(s); setTimeout(() => s.remove(), 650); }
});
addEventListener('pointermove', e => {
  const b = e.target.closest && e.target.closest('button');
  if (b) { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
  const t = e.target.closest && e.target.closest('.start-card,.end-card,.room-card');
  if (t) { const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; t.style.transform = 'perspective(900px) rotateY(' + x * 6 + 'deg) rotateX(' + (-y * 6) + 'deg)'; }
});
document.addEventListener('pointerout', e => { const t = e.target.closest && e.target.closest('.start-card,.end-card,.room-card'); if (t && !t.contains(e.relatedTarget)) t.style.transform = ''; });
const _spend = (fn, n, cols, conf) => wrap(fn, (o, a) => { const m = state.money; const r = o(...a); if (state.money < m) { fxBurst(FX.pt.x, FX.pt.y, n, cols); if (conf) fxConfetti(); } return r; });
_spend('upgradePlant', 26, ['#b5f0cf', '#ffe3a3', '#fff']);
_spend('buyPlant', 36, ['#ffe3a3', '#ffb4a2', '#fff']);
_spend('upgradeCity', 40, ['#ffe3a3', '#9bd7ff', '#fff'], true);
wrap('explodeNow', (o, a) => { fxShake(); fxBurst(innerWidth / 2, innerHeight / 2, 90, ['#ffa8b5', '#ffc98f', '#ffe3a3']); return o(...a); });
wrap('sndHazard', (o, a) => { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); return o(...a); });
wrap('sndBlackout', (o, a) => { if (navigator.vibrate) navigator.vibrate(400); return o(...a); });
wrap('endGame', (o, a) => { const r = o(...a); hudHide(); if (!a[0]) setTimeout(fxConfetti, 300); return r; });

/* ลูกเล่นเมาส์/การแตะ: แสงตามเมาส์ + ประกายตามรอย + คลื่นและประกายตอนกด */
(function () {
  const fine = matchMedia('(pointer:fine)').matches, calm = matchMedia('(prefers-reduced-motion: reduce)').matches, PC = ['#cdb8ff', '#b5f0cf', '#9bd7ff', '#ffe3a3', '#ffb4a2'];
  let tx = -99, ty = -99, gx = -99, gy = -99, last = 0;
  if (fine && !calm) {
    const g = document.createElement('div'); g.id = 'cursorGlow'; document.body.appendChild(g);
    (function loop() { gx += (tx - gx) * .18; gy += (ty - gy) * .18; g.style.transform = 'translate(' + (gx - 22) + 'px,' + (gy - 22) + 'px)'; requestAnimationFrame(loop); })();
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY; const n = performance.now(); if (n - last < 45) return; last = n;
      fxAdd([{ x: tx, y: ty, vx: (Math.random() - .5) * .9, vy: (Math.random() - .5) * .9 + .2, g: .02, s: 1.2 + Math.random() * 1.6, c: PC[Math.floor(Math.random() * 5)], life: 22 + Math.random() * 16, r: 0, spin: 0 }]);
    });
    addEventListener('pointerover', e => g.classList.toggle('on', !!(e.target.closest && e.target.closest('button,.chip,.lbrow,.tab,.pbtn,.mchip,.switch,#profileBar,.avwrap'))));
  }
  addEventListener('pointerdown', e => {
    if (calm) return; const r = document.createElement('i'); r.className = 'click-ring'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 650);
    fxBurst(e.clientX, e.clientY, 12, PC);
  });
})();
