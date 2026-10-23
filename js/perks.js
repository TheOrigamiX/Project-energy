/* การ์ดทุก Wave, เหตุการณ์บอส, แผนที่, เป้าหมายย่อย */
const MAPS = [
  { n: '🏜 ทะเลทราย', lv: 1, inc: { solar: 1.6, hydro: .6 }, dem: 1.08 },
  { n: '⛰ ภูเขา', lv: 3, inc: { hydro: 1.6, wind: 1.3, solar: .7 }, dem: 1 },
  { n: '🌊 ชายฝั่ง', lv: 5, inc: { wind: 1.5, gas: .85 }, dem: 1.05 }];
let CUR_MAP = 0, SEL_MAP = 0, CT = 0;
const PERKS = [
  { ic: '💰', n: 'ธุรกิจรุ่ง', d: 'รายได้ +15%', k: 'inc', v: 1.15 }, { ic: '🛠', n: 'ซ่อมบำรุงดี', d: 'ค่าเดินเครื่อง −15%', k: 'cost', v: .85 },
  { ic: '🛡', n: 'ระบบนิรภัย', d: 'โอกาสระเบิด −20%', k: 'haz', v: .8 }, { ic: '🏙', n: 'ประหยัดไฟ', d: 'ดีมานด์เมือง −6%', k: 'dem', v: .94 },
  { ic: '🔋', n: 'แบตจุเพิ่ม', d: 'ความจุแบต +25%', k: 'bat', v: 1.25 }, { ic: '🎁', n: 'เงินก้อน', d: 'รับ 120 💰 ทันที', cash: 120 }, { ic: '💎', n: 'เงินก้อนใหญ่', d: 'รับ 200 💰 ทันที', cash: 200 }];
const BOSS = [{ n: '🌪 พายุใหญ่', k: 'dem', v: 1.35 }, { n: '🔥 คลื่นความร้อน', k: 'haz', v: 2.5 }];
const perkMul = k => ((state && state.perks) || []).reduce((m, p) => p.k === k ? m * p.v : m, 1);
const bossMul = k => state && state.boss && BOSS[state.boss.t].k === k ? BOSS[state.boss.t].v : 1;
const curMap = () => MAPS[(state && state.map != null) ? state.map : CUR_MAP];
const mapDem = () => curMap().dem;
wrap('getEffective', (o, a) => {
  const r = Object.assign({}, o(...a)), f = ((curMap().inc[a[0].key]) || 1) * perkMul('inc');
  if (r.income != null) r.income = Math.round(r.income * f * 10) / 10;
  if (r.runCost != null) r.runCost = Math.round(r.runCost * perkMul('cost') * 10) / 10;
  return r;
});
wrap('getBatteryEffective', (o, a) => { const r = Object.assign({}, o(...a)); if (r.capacity != null) r.capacity = Math.round(r.capacity * perkMul('bat')); return r; });
wrap('upgradePlant', (o, a) => { const m = state.money, r = o(...a); if (state.money < m) state.upg = (state.upg || 0) + 1; return r; });
(function () { const c = document.createElement('div'); c.id = 'cardTray'; c.className = 'hidden'; document.body.appendChild(c); })();
function hideCards() { clearInterval(CT); byId('cardTray').classList.add('hidden'); }
function showCards(offer) {
  const t = byId('cardTray'); t.innerHTML = '<div class="ct-h">🎴 เลือกการ์ด 1 ใบ <b id="ctT">15</b></div><div class="ct-row"></div>';
  const row = t.querySelector('.ct-row');
  offer.forEach(p => {
    const b = document.createElement('button'); b.innerHTML = '<span>' + p.ic + '</span><b>' + p.n + '</b><small>' + p.d + '</small>';
    b.onclick = () => { if (p.cash) state.money += p.cash; else (state.perks = state.perks || []).push(p); fxBurst(FX.pt.x, FX.pt.y, 40, ['#ffd166', '#b388ff', '#fff']); hideCards(); showToast(p.ic + ' ได้รับ: ' + p.n); };
    row.appendChild(b);
  });
  t.classList.remove('hidden'); let s = 15; clearInterval(CT);
  CT = setInterval(() => { s--; const e = byId('ctT'); if (e) e.textContent = s; if (s <= 0) hideCards(); }, 1000);
}
function onWave(w) {
  if (!state) return;
  if (w % 6 === 0) { state.boss = { t: Math.floor(rng() * BOSS.length), left: 20 }; showToast('⚠️ บอส: ' + BOSS[state.boss.t].n + ' นาน 20 วิ!'); fxShake(); }
  const pool = PERKS.slice(), offer = []; while (offer.length < 3) offer.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
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
  const g = state.goal; if (goalVal(g) >= g.need) { state.money += g.rew; showToast('🎯 เป้าหมายสำเร็จ! +' + g.rew + ' 💰'); fxConfetti(); state.goal = newGoal(); }
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
