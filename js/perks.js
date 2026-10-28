/* การ์ดทุก Wave, เหตุการณ์บอส, แผนที่, เป้าหมายย่อย */
const MAPS = [
  { n: '🏜 ทะเลทราย', lv: 1, inc: { solar: 1.6, hydro: .6 }, dem: 1.08 },
  { n: '⛰ ภูเขา', lv: 3, inc: { hydro: 1.6, wind: 1.3, solar: .7 }, dem: 1 },
  { n: '🌊 ชายฝั่ง', lv: 5, inc: { wind: 1.5, gas: .85 }, dem: 1.05 }];
let CUR_MAP = 0, SEL_MAP = 0, CT = 0;
const PERKS = [
  { ic: '💰', n: 'ธุรกิจรุ่ง', d: 'รายได้ +15%', k: 'inc', v: 1.15 }, { ic: '🛠', n: 'ซ่อมบำรุงดี', d: 'ค่าเดินเครื่อง −15%', k: 'cost', v: .85, max: 4 },
  { ic: '🛡', n: 'ระบบนิรภัย', d: 'โอกาสระเบิด −20%', k: 'haz', v: .8, max: 3 }, { ic: '🏙', n: 'ประหยัดไฟ', d: 'ดีมานด์เมือง −6%', k: 'dem', v: .94, max: 5 },
  { ic: '🔋', n: 'แบตจุเพิ่ม', d: 'ความจุแบต +25%', k: 'bat', v: 1.25 }, { ic: '🎁', n: 'เงินก้อน', d: 'รับ 120 💰 ทันที', cash: 120 }, { ic: '💎', n: 'เงินก้อนใหญ่', d: 'รับ 200 💰 ทันที', cash: 200 }];
const BOSS = [{ n: '🌪 พายุใหญ่', k: 'dem', v: 1.35 }, { n: '🔥 คลื่นความร้อน', k: 'haz', v: 2.5 }];
const perkMul = k => ((state && state.perks) || []).reduce((m, p) => p.k === k && p.v ? m * p.v : m, 1) * (typeof chMul === 'function' ? chMul(k) : 1);
const bossMul = k => state && state.boss && BOSS[state.boss.t].k === k ? bossAdj(k, BOSS[state.boss.t].v) : 1;
const curMap = () => MAPS[(state && state.map != null) ? state.map : CUR_MAP];
const mapDem = () => curMap().dem;
wrap('getEffective', (o, a) => {
  const r = Object.assign({}, o(...a)), f = ((curMap().inc[a[0].key]) || 1) * perkMul('inc');
  if (r.income != null) r.income = Math.round(r.income * f * 10) / 10;
  if (r.runCost != null) r.runCost = Math.round(r.runCost * perkMul('cost') * 10) / 10;
  return r;
});
wrap('getBatteryEffective', (o, a) => { const r = Object.assign({}, o(...a)); if (r.capacity != null) r.capacity = Math.round(r.capacity * perkMul('bat')); if (r.chargeRate != null) r.chargeRate = Math.round(r.chargeRate * perkMul('charge')); return r; });
wrap('upgradePlant', (o, a) => { const m = state.money, r = o(...a); if (state.money < m) state.upg = (state.upg || 0) + 1; return r; });
(function () { const c = document.createElement('div'); c.id = 'cardTray'; c.className = 'hidden'; document.body.appendChild(c); })();
function hideCards() { clearInterval(CT); byId('cardTray').classList.add('hidden'); }
function showCards(offer) {
  const t = byId('cardTray'); t.innerHTML = '<div class="ct-h">🎴 เลือกการ์ด 1 ใบ <b id="ctT">15</b></div><div class="ct-row"></div>';
  const row = t.querySelector('.ct-row');
  offer.forEach(p => {
    const b = document.createElement('button'); b.innerHTML = '<span>' + p.ic + '</span><b>' + p.n + '</b><small>' + p.d + '</small>';
    b.onclick = () => { if (p.cash) state.money += p.cash; else (state.perks = state.perks || []).push(p); fxBurst(FX.pt.x, FX.pt.y, 40, ['#ffe3a3', '#cdb8ff', '#fff']); hideCards(); showToast(p.ic + ' ได้รับ: ' + p.n); };
    row.appendChild(b);
  });
  t.classList.remove('hidden'); let s = 15; clearInterval(CT);
  CT = setInterval(() => { s--; const e = byId('ctT'); if (e) e.textContent = s; if (s <= 0) hideCards(); }, 1000);
}
function onWave(w) {
  if (!state) return;
  if (w % 6 === 0) { state.boss = { t: Math.floor(rng() * BOSS.length), left: 20 }; showToast('⚠️ บอส: ' + BOSS[state.boss.t].n + ' นาน 20 วิ!'); fxShake(); }
  const pool = PERKS.filter(p => !p.max || stacksOf(p.k) < p.max), offer = []; while (offer.length < 3 && pool.length) offer.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  showCards(offer);
}
function newGoal() {
  const w = state.wave || 0, m = Math.floor(rng() * 3);
  if (m === 0) { const n = 12 + Math.floor(w * 1.5); return { t: 'str', need: n, rew: 60 + n * 3, lab: 'คอมโบถึง ' + n }; }
  if (m === 1) { const n = Math.round((state.money + 150 + w * 40) / 10) * 10; return { t: 'mon', need: n, rew: 90, lab: 'มีเงินถึง ' + n + ' 💰' }; }
  return { t: 'upg', need: (state.upg || 0) + 1, rew: 70, lab: 'อัพเกรดโรงไฟฟ้า 1 ครั้ง' };
}
const goalVal = g => g.t === 'str' ? (state.streak || 0) : g.t === 'mon' ? Math.round(state.money) : (state.upg || 0);
function checkGoal() {
  const g = state.goal; if (goalVal(g) >= g.need) { state.money += Math.round(g.rew * perkMul('goal')); showToast('🎯 เป้าหมายสำเร็จ! +' + g.rew + ' 💰'); fxConfetti(); state.goal = newGoal(); }
}
wrap('gameTick', (o, a) => {
  if (state && !state.prepping) {
    state.perks = state.perks || []; if (state.map == null) state.map = CUR_MAP; if (state.goal === undefined) state.goal = newGoal();
    state.maxStreak = Math.max(state.maxStreak || 0, state.streak || 0);
    if (state.boss && --state.boss.left <= 0) { state.boss = null; showToast('✅ เหตุการณ์บอสจบแล้ว'); }
  }
  const r = o(...a); if (state && !state.prepping && state.goal) checkGoal(); return r;
});
wrap('renderGame', (o, a) => {
  o(...a); if (!state || !state.goal) return;
  let c = byId('goalChip'); if (!c) { c = document.createElement('div'); c.id = 'goalChip'; byId('forecastChip').after(c); }
  const g = state.goal; c.textContent = '🎯 ' + g.lab + ' (' + Math.min(goalVal(g), g.need) + '/' + g.need + ') → +' + g.rew + ' 💰';
});

/* ---- แท็บการ์ด/สถานะรวม + จัดโซน HUD ---- */
const stacksOf = k => ((state && state.perks) || []).filter(p => p.k === k).length;
(function () {
  const p = document.createElement('div'); p.className = 'panel sheet'; p.id = 'cardsPanel';
  p.innerHTML = '<div class="sheet-grip"></div><button class="sheet-x" onclick="closeSheets()">✕</button><h3>🎴 การ์ดและสถานะรวม</h3><div id="cardsBody"></div>';
  document.querySelector('.main-grid').appendChild(p); SHEETS.cards = 'cardsPanel';
  const b = document.createElement('button'); b.id = 'dock-cards'; b.dataset.k = 'cards'; b.textContent = '🎴 การ์ด'; b.onclick = () => toggleSheet('cards');
  byId('dock').insertBefore(b, byId('dock-battery'));
})();
const pct = m => (m >= 1 ? '+' : '') + Math.round((m - 1) * 100) + '%';
function renderCards() {
  const body = byId('cardsBody'); if (!body || !state) return;
  const rows = PERKS.filter(p => p.k).map(p => {
    const n = stacksOf(p.k), full = p.max && n >= p.max;
    return '<div class="crow' + (full ? ' full' : '') + '"><span class="ci">' + p.ic + '</span><div><b>' + p.n + '</b><small>' + p.d + ' ต่อชั้น</small><div class="pips">' +
      (p.max ? Array.from({ length: p.max }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') : '<span>' + n + ' ชั้น (ไม่จำกัด)</span>') +
      '</div></div><strong>' + (n ? pct(Math.pow(p.v, n)) : '—') + (full ? '<small>เต็ม</small>' : '') + '</strong></div>';
  }).join('');
  const inc = perkMul('inc'), cost = perkMul('cost'), haz = perkMul('haz') * bossMul('haz'), dem = perkMul('dem') * bossMul('dem') * mapDem() * (1 + .04 * (state.wave || 0)), bat = perkMul('bat');
  body.innerHTML = '<div class="sumgrid"><div>💰 รายได้<b>' + pct(inc) + '</b></div><div>🛠 ค่าเดินเครื่อง<b>' + pct(cost) + '</b></div><div>💥 โอกาสระเบิด<b>' + pct(haz) + '</b></div><div>🏙 ดีมานด์เมือง<b>' + pct(dem) + '</b></div><div>🔋 ความจุแบต<b>' + pct(bat) + '</b></div><div>🌊 Wave<b>' + (state.wave || 0) + '</b></div><div>🗺 แผนที่<b>' + curMap().n + '</b></div><div>🔥 คอมโบสูงสุด<b>' + (state.maxStreak || 0) + '</b></div></div><h3>การ์ดที่เลือก</h3>' + rows;
}
function hudZones() {
  if (byId('hudZones') || !byId('hudMeter') || !byId('forecastChip') || !byId('goalChip')) return;
  const z = document.createElement('div'); z.id = 'hudZones';
  [['สถานะ', 'hudMeter'], ['สถานการณ์', 'forecastChip'], ['เป้าหมาย', 'goalChip']].forEach(([t, id]) => { const c = document.createElement('div'); c.className = 'zone'; c.innerHTML = '<em>' + t + '</em>'; c.appendChild(byId(id)); z.appendChild(c); });
  document.querySelector('.status-panel').before(z);
}
wrap('renderGame', (o, a) => { o(...a); if (!state) return; hudZones(); if (HUD.open === 'cards') renderCards(); });
