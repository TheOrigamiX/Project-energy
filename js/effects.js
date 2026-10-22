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
  const cols = ['#ffd166', '#ff6b6b', '#38b6ff', '#6ee7a8', '#b388ff'], o = [];
  for (let i = 0; i < 140; i++) o.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * 200, vx: Math.random() * 4 - 2, vy: 1 + Math.random() * 3, g: .05, s: 4 + Math.random() * 4, c: cols[i % 5], life: 200 + Math.random() * 100, r: Math.random() * 6, spin: Math.random() * .3 - .15, rect: true });
  fxAdd(o);
}
function fxFloat(t, x, y, col) {
  const e = document.createElement('div'); e.className = 'fx-float'; e.textContent = t;
  e.style.cssText = 'left:' + x + 'px;top:' + y + 'px;color:' + (col || '#ffd166'); document.body.appendChild(e); setTimeout(() => e.remove(), 1300);
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
_spend('upgradePlant', 26, ['#6ee7a8', '#ffd166', '#fff']);
_spend('buyPlant', 36, ['#ffd166', '#ff7b54', '#fff']);
_spend('upgradeCity', 40, ['#ffd166', '#38b6ff', '#fff'], true);
wrap('explodeNow', (o, a) => { fxShake(); fxBurst(innerWidth / 2, innerHeight / 2, 90, ['#ff6b6b', '#ff9f4a', '#ffd166']); return o(...a); });
wrap('sndHazard', (o, a) => { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); return o(...a); });
wrap('sndBlackout', (o, a) => { if (navigator.vibrate) navigator.vibrate(400); return o(...a); });
wrap('endGame', (o, a) => { closeSheets(); const r = o(...a); if (!a[0]) setTimeout(fxConfetti, 300); return r; });
