/* พื้นหลังหลายชั้น: ออโรร่า (CSS) + เมืองพาราแลกซ์ + วงจรไฟฟ้า/อนุภาค + ฟ้าแลบนานๆ ครั้ง */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, rnd = (a, b) => a + Math.random() * (b - a);
  const L = document.createElement('div'); L.id = 'bgLayer';
  L.innerHTML = '<i class="aur a1"></i><i class="aur a2"></i><i class="aur a3"></i><svg id="bgCity" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice"></svg><canvas id="bgCv"></canvas><div id="bgFlash"></div>';
  document.body.prepend(L);
  /* เมือง 3 ชั้น (ไกล → ใกล้) */
  const svg = L.querySelector('#bgCity'), cols = ['#4a4f87', '#393e73', '#292d58'], depth = [6, 14, 26];
  cols.forEach((c, k) => {
    let x = -80, h = '';
    while (x < 1300) {
      const w = rnd(34, 78), ht = rnd(60, 150) + (2 - k) * 40;
      h += '<rect x="' + x + '" y="' + (600 - ht) + '" width="' + w + '" height="' + ht + '" fill="' + c + '"/>';
      if (k > 0) for (let wy = 600 - ht + 10; wy < 590; wy += 16) for (let wx = x + 6; wx < x + w - 8; wx += 12) if (Math.random() < .16) h += '<rect x="' + wx + '" y="' + wy + '" width="5" height="7" fill="#ffe3a3" opacity="' + rnd(.25, .7).toFixed(2) + '"/>';
      x += w + rnd(2, 10);
    }
    svg.insertAdjacentHTML('beforeend', '<g class="cl" data-d="' + depth[k] + '" style="opacity:' + (.55 + k * .2) + '">' + h + '</g>');
  });
  const gs = [...svg.querySelectorAll('.cl')]; let mx = 0, my = 0, px = 0, py = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  /* วงจร + อนุภาค + ฟ้าแลบ บน canvas */
  const cv = L.querySelector('#bgCv'), ctx = cv.getContext('2d'), stat = document.createElement('canvas'), COL = ['#b5f0cf', '#cdb8ff', '#9bd7ff', '#ffb4a2'];
  let W, H, D, paths = [], pulses = [], parts = [], bolt = null;
  function build() {
    D = Math.min(devicePixelRatio || 1, 1.5); W = cv.width = stat.width = innerWidth * D; H = cv.height = stat.height = innerHeight * D;
    const sc = stat.getContext('2d'), g = 48 * D, n = Math.max(8, Math.round(innerWidth / 90)); paths = [];
    sc.strokeStyle = 'rgba(190,175,255,.14)'; sc.lineWidth = 1.5 * D; sc.fillStyle = 'rgba(190,175,255,.28)';
    for (let i = 0; i < n; i++) {
      let x = Math.round(rnd(0, W / g)) * g, y = Math.round(rnd(0, H / g * .8)) * g, hz = Math.random() < .5; const pts = [[x, y]];
      for (let s = 0, m = Math.round(rnd(4, 8)); s < m; s++) { const len = Math.round(rnd(2, 6)) * g * (Math.random() < .5 ? -1 : 1); if (hz) x += len; else y += len; pts.push([x, y]); hz = !hz; }
      paths.push(pts); sc.beginPath(); pts.forEach((p, j) => j ? sc.lineTo(p[0], p[1]) : sc.moveTo(p[0], p[1])); sc.stroke();
      pts.forEach(p => { sc.beginPath(); sc.arc(p[0], p[1], 3 * D, 0, 6.3); sc.fill(); });
    }
    pulses = paths.map(p => ({ p, d: rnd(0, 600), v: rnd(.8, 2.2) * D, c: COL[Math.floor(rnd(0, 4))] }));
    parts = Array.from({ length: Math.round(innerWidth / 22) }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(1, 3) * D, s: rnd(.2, .7) * D, ph: rnd(0, 6.3), c: ['#ffe3a3', '#cdb8ff', '#b5f0cf', '#ffffff'][Math.floor(rnd(0, 4))] }));
  }
  const at = (p, dist) => { let rem = dist; for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], l = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]); if (rem <= l) { const t = rem / l; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; } rem -= l; } return null; };
  function strike() {
    if (document.hidden || reduce) return; let x = rnd(.15, .85) * W, y = 0; const pts = [[x, y]], k = W / innerWidth;
    while (y < H * rnd(.45, .75)) { y += rnd(18, 40) * k; x += rnd(-30, 30) * k; pts.push([x, y]); }
    bolt = { pts, life: 22 }; const f = L.querySelector('#bgFlash');
    f.style.opacity = .35; setTimeout(() => f.style.opacity = 0, 90); setTimeout(() => { f.style.opacity = .2; setTimeout(() => f.style.opacity = 0, 100); }, 180);
  }
  (function nxt() { setTimeout(() => { strike(); nxt(); }, rnd(18000, 42000)); })();
  function frame(t) {
    requestAnimationFrame(frame); if (document.hidden || document.body.classList.contains('ingame')) return;
    px += (mx - px) * .06; py += (my - py) * .06; gs.forEach(g => { const d = +g.dataset.d; g.style.transform = 'translate(' + (-px * d * 2) + 'px,' + (-py * d) + 'px)'; });
    ctx.clearRect(0, 0, W, H); ctx.drawImage(stat, 0, 0); ctx.globalCompositeOperation = 'lighter';
    pulses.forEach(u => {
      u.d += u.v; const head = at(u.p, u.d); if (!head) { u.d = -rnd(0, 300); return; }
      for (let k = 0; k < 7; k++) { const q = at(u.p, u.d - k * 7 * D); if (!q) break; ctx.globalAlpha = .75 - k * .1; ctx.fillStyle = u.c; ctx.beginPath(); ctx.arc(q[0], q[1], (3.2 - k * .3) * D, 0, 6.3); ctx.fill(); }
    });
    parts.forEach(q => { q.y -= q.s; q.x += Math.sin(t / 1800 + q.ph) * .3 * D; if (q.y < -10) { q.y = H + 10; q.x = rnd(0, W); } ctx.globalAlpha = .3 + .3 * Math.sin(t / 700 + q.ph); ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.fill(); });
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (bolt) {
      const a = bolt.life / 22; ctx.shadowColor = '#cdb8ff'; ctx.shadowBlur = 26 * D; ctx.strokeStyle = 'rgba(240,232,255,' + a + ')'; ctx.lineWidth = 3 * D; ctx.lineJoin = 'round';
      ctx.beginPath(); bolt.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.shadowBlur = 0; if (--bolt.life <= 0) bolt = null;
    }
  }
  build(); addEventListener('resize', build);
  if (reduce) ctx.drawImage(stat, 0, 0); else requestAnimationFrame(frame);
  setInterval(() => document.body.classList.toggle('ingame', typeof gameInProgress !== 'undefined' && !!gameInProgress), 600);
})();
