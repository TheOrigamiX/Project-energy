/* HUD ค้างบน + แผงเลื่อนขึ้นจากล่าง + dock + ปุ่ม SOS + แถบโรงไฟฟ้าแตะเปิด/ปิดเร็ว */
const HUD = { open: null, st: null, st2: null, prevMoney: undefined };
(function () {
  ['plantsPanel', 'statsPanel'].forEach(id => { const p = byId(id); p.classList.add('sheet'); p.insertAdjacentHTML('afterbegin', '<div class="sheet-grip"></div><button class="sheet-x" onclick="closeSheets()">✕</button>');
    const g = p.querySelector('.sheet-grip'); let y0 = null;
    g.onpointerdown = e => { y0 = e.clientY; p.style.transition = 'none'; g.setPointerCapture(e.pointerId); };
    g.onpointermove = e => { if (y0 !== null) p.style.transform = 'translate(-50%,' + Math.max(0, e.clientY - y0) + 'px)'; };
    g.onpointerup = g.onpointercancel = e => { if (y0 === null) return; const d = e.clientY - y0; y0 = null; p.style.transition = ''; p.style.transform = ''; if (d > 90) closeSheets(); };
  });
  const bk = document.createElement('div'); bk.id = 'sheetBack'; bk.onclick = () => closeSheets(); byId('gameShell').appendChild(bk);
  const d = document.createElement('div'); d.id = 'dock'; d.className = 'hidden';
  [['plants', '🎛️ โรงไฟฟ้า'], ['stats', '📊 สถิติ']].forEach(([k, t]) => { const b = document.createElement('button'); b.textContent = t; b.dataset.k = k; b.id = 'dock-' + k; b.onclick = () => toggleSheet(k); d.appendChild(b); });
  const bb = document.createElement('button'); bb.id = 'dock-battery'; bb.className = 'hidden';
  bb.onclick = () => { const m = state.battery.mode; setBatteryMode(m === 'off' ? 'charge' : m === 'charge' ? 'discharge' : 'off'); }; d.appendChild(bb);
  document.body.appendChild(d);
  const sos = document.createElement('button'); sos.id = 'sosBtn'; sos.className = 'hidden';
  sos.onclick = () => { if (state && state.activeHazard) emergencyShutdown(state.activeHazard.key); }; document.body.appendChild(sos);
})();
const SHEETS = { plants: 'plantsPanel', stats: 'statsPanel' };
function dockSync() { document.querySelectorAll('#dock button').forEach(b => b.classList.toggle('on', b.dataset.k === HUD.open)); }
function closeSheets() { document.querySelectorAll('.sheet.open').forEach(p => p.classList.remove('open')); byId('sheetBack').classList.remove('show'); HUD.open = null; dockSync(); }
function openSheet(k) { closeSheets(); byId(SHEETS[k]).classList.add('open'); byId('sheetBack').classList.add('show'); HUD.open = k; dockSync(); }
function toggleSheet(k) { HUD.open === k ? closeSheets() : openSheet(k); }
addEventListener('keydown', e => {
  if (!gameInProgress || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === '1') toggleSheet('plants'); else if (e.key === '2') toggleSheet('stats'); else if (e.key === 'Escape') closeSheets();
});
function hudStrip() {
  let s = byId('plantStrip'); if (!s) { s = document.createElement('div'); s.id = 'plantStrip'; byId('cityVisual').after(s); }
  const keys = PLANT_DEFS.filter(d => state.plants[d.key].unlocked).map(d => d.key), sig = keys.join();
  if (s.dataset.sig !== sig || HUD.st2 !== state) {
    HUD.st2 = state; s.dataset.sig = sig; s.innerHTML = '';
    keys.forEach(k => { const d = PLANT_MAP[k], b = document.createElement('button'); b.className = 'chip'; b.dataset.k = k; b.dataset.c = d.accent; b.style.setProperty('--c', d.accent); b.onclick = () => togglePlant(k); s.appendChild(b); });
  }
  s.querySelectorAll('.chip').forEach(b => {
    const p = state.plants[b.dataset.k], d = PLANT_MAP[b.dataset.k];
    b.classList.toggle('on', p.on && p.cooldown === 0); b.classList.toggle('cd', p.cooldown > 0);
    const t = d.icon + ' ' + (p.cooldown > 0 ? p.cooldown + ' วิ' : p.output + ' MW'); if (b.textContent !== t) b.textContent = t;
  });
}
function hudRender() {
  if (HUD.st !== state) { HUD.st = state; HUD.prevMoney = undefined; }
  byId('dock').classList.toggle('hidden', !gameInProgress);
  let m = byId('hudMeter');
  if (!m) { m = document.createElement('div'); m.id = 'hudMeter'; m.innerHTML = '<div class="hm-bar"><i id="hmFill"></i><b></b></div><span id="hmTxt"></span>'; document.querySelector('.status-panel').before(m);
    const f = document.createElement('div'); f.id = 'forecastChip'; m.after(f);
    const al = document.createElement('div'); al.id = 'alertBar'; f.after(al); }
  const sup = state.netSupply || 0, dem = state.demand || 1, ok = sup >= dem;
  byId('hmFill').style.width = Math.min(100, sup / dem / 1.5 * 100) + '%'; m.classList.toggle('bad', !ok);
  byId('hmTxt').textContent = '⚡ ผลิต ' + sup + ' / ต้องการ ' + dem + ' MW — ' + (ok ? 'ไฟพอ' : 'ขาด ' + (dem - sup) + ' MW');
  const h = state.activeHazard, sos = byId('sosBtn'); sos.classList.toggle('hidden', !h || !gameInProgress);
  if (h) sos.textContent = '🚨 ปิด ' + PLANT_MAP[h.key].name + ' (' + h.timeLeft + ')';
  if (HUD.prevMoney !== undefined && state.money > HUD.prevMoney) { const r = byId('moneyChip').getBoundingClientRect(); fxFloat('+' + Math.round(state.money - HUD.prevMoney) + ' 💰', r.left + r.width / 2, r.bottom + 4); }
  HUD.prevMoney = state.money;
  const bt = state.battery, bb = byId('dock-battery'); bb.className = bt.unlocked ? 'bat-' + bt.mode : 'hidden';
  if (bt.unlocked) bb.textContent = ({ off: '🔋 ปิด', charge: '⚡ ชาร์จ', discharge: '🔌 จ่ายไฟ' })[bt.mode] + ' ' + Math.round(bt.current / getBatteryEffective(bt.level).capacity * 100) + '%';
  const fc = byId('forecastChip'), pk = state.peakActive ? '⚡ Peak เหลือ ' + state.peakTimer + ' วิ' : '⏱ Peak อีก ' + state.nextPeakIn + ' วิ';
  fc.textContent = pk + '  •  🌦 อากาศเปลี่ยนอีก ' + state.nextWeatherIn + ' วิ  •  🌊 Wave ' + (state.wave || 0);
  fc.classList.toggle('hot', !!state.peakActive || state.nextPeakIn <= 5);
  hudStrip(); fxFlow();
}
wrap('renderGame', (o, a) => { o(...a); if (state) hudRender(); });

function waveBanner(w) {
  const e = document.createElement('div'); e.className = 'wave-banner'; e.innerHTML = '🌊 WAVE ' + w + '<small>ยากขึ้นแล้ว!</small>';
  document.body.appendChild(e); setTimeout(() => e.remove(), 2400); if (navigator.vibrate) navigator.vibrate(150);
}
wrap('showToast', (o, a) => {
  const bar = byId('alertBar'); if (!gameInProgress || !bar || !state) return o(...a);
  const e = document.createElement('div'); e.className = 'alert-item'; e.textContent = a[0]; bar.prepend(e);
  while (bar.children.length > 3) bar.lastChild.remove();
  setTimeout(() => { e.classList.add('out'); setTimeout(() => e.remove(), 400); }, 5000);
});
function hudHide() {
  closeSheets(); byId('dock').classList.add('hidden'); byId('sosBtn').classList.add('hidden'); byId('liveRank').classList.add('hidden');
  const f = byId('flowSvg'); if (f) f.innerHTML = '';
  document.querySelectorAll('.fx-float,.wave-banner').forEach(e => e.remove());
  const al = byId('alertBar'); if (al) al.innerHTML = '';
}
