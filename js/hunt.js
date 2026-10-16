/* VoltRush — js/hunt.js : L1 ตัวละครถาวร + ออกล่า (เก็บใน localStorage ก่อน ย้ายขึ้น server ตามหัวข้อ 27) */
const HUNT_ZONES = [
  { name: 'โรงไฟฟ้าเก่าชานเมือง', lv: 1, hp: 30, atk: 1.2, mon: ['⚡', '🤖'], boss: '🦾', grade: ['D'] },
  { name: 'ทุ่งโซลาร์ร้าง', lv: 10, hp: 90, atk: 2.4, mon: ['☀️', '🪲'], boss: '🌞', grade: ['D', 'C'] },
  { name: 'เหมืองถ่านหินใต้ดิน', lv: 20, hp: 220, atk: 4.5, mon: ['🌫️', '⛏️'], boss: '🐛', grade: ['C'] }
];
const GEAR_SLOTS = { weapon: 'อาวุธ', turbine: 'กังหัน', line: 'สายส่ง', core: 'แกนเตา', chip: 'ชิปควบคุม' };
const GRADE_BASE = { D: 4, C: 9 }, GRADE_LV = { D: 1, C: 20 }, GRADE_PRICE = { D: 15, C: 40 }, SCROLL_PRICE = { D: 30, C: 90 };
const SAFE_ENCH = 3, ENCH_RATE = 0.66, MAX_ENCH = 16, BAG_MAX = 100;
const DROP_ITEM = 0.03, DROP_SCROLL = 0.05;   // ค่าทดสอบให้เห็นผลเร็ว (เอกสาร: 0.008 และ 0.04)
const PROFILE_KEY = 'voltrushProfileV1';
let huntZone = 0, pendingHunt = false, huntPrevDuration = 180;

function loadProfile() {
  try { const p = JSON.parse(localStorage.getItem(PROFILE_KEY)); if (p && p.v === 1) return p; } catch (e) {}
  return { v: 1, level: 1, exp: 0, coins: 0, scrolls: { D: 2, C: 0 }, items: [], equip: {}, nextId: 1, kills: 0, best: 0 };
}
let profile = loadProfile();
function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {} }
function expNeed(l) { return Math.round(60 * Math.pow(l, 1.35)); }
function addExp(n) { let up = 0; profile.exp += n; while (profile.level < 99 && profile.exp >= expNeed(profile.level)) { profile.exp -= expNeed(profile.level); profile.level++; up++; } return up; }
function findItem(id) { return profile.items.find(i => i.id === id); }
function isEquipped(it) { return profile.equip[it.slot] === it.id; }
function itemPow(it) { return it.base * (1 + Math.min(it.enchant, SAFE_ENCH) * 0.03 + Math.max(0, it.enchant - SAFE_ENCH) * 0.06); }
function itemLabel(it) { return '<span class="hh-g hh-' + it.grade + '">' + it.grade + '</span> ' + GEAR_SLOTS[it.slot] + (it.enchant ? ' +' + it.enchant : '') + ' <small>พลัง ' + itemPow(it).toFixed(1) + '%</small>'; }
function gearPower() { let s = 0; for (const k in profile.equip) { const it = findItem(profile.equip[k]); if (it) s += itemPow(it); } return s; }
function playerPower() { return (1 + profile.level * 0.06) * (1 + gearPower() / 100); }
function makeItem(grade) {
  const slots = Object.keys(GEAR_SLOTS);
  return { slot: slots[Math.floor(Math.random() * slots.length)], grade: grade, base: Math.round(GRADE_BASE[grade] * (0.8 + Math.random() * 0.4) * 10) / 10, enchant: 0 };
}
function itemValue(it) { return Math.round(GRADE_PRICE[it.grade] * (1 + it.enchant * 0.3)); }

/* ---------- การล่า (ทำงานใน gameTick ผ่านเครื่องยนต์โรงไฟฟ้าเดิม) ---------- */
function initHunt() {
  selectedDuration = huntPrevDuration;
  const z = HUNT_ZONES[huntZone];
  const max = 100 + profile.level * 5;
  state.hunt = { zone: huntZone, wave: 0, mons: [], cd: 0, shield: max, shieldMax: max, done: false, gain: { exp: 0, coins: 0, kills: 0, items: [], scrolls: { D: 0, C: 0 } } };
  showToast('⚔️ ออกล่าที่ ' + z.name + ' ไฟยิ่งแรง ยิ่งสร้างความเสียหายมาก');
  renderHunt();
}
function spawnWave() {
  const h = state.hunt, z = HUNT_ZONES[h.zone], s = 1 + 0.10 * h.wave, boss = h.wave % 10 === 0;
  const n = boss ? 1 : Math.min(9, 3 + Math.floor(h.wave / 3));
  h.mons = [];
  for (let i = 0; i < n; i++) {
    const hp = z.hp * s * (boss ? 8 : 1);
    h.mons.push({ e: boss ? z.boss : z.mon[i % z.mon.length], hp: hp, max: hp, atk: z.atk * (1 + 0.05 * h.wave) * (boss ? 3 : 1), boss: boss });
  }
  if (boss) showToast('👑 บอสปรากฏ! เวฟ ' + h.wave);
}
function onKill(m) {
  const h = state.hunt, z = HUNT_ZONES[h.zone], g = h.gain;
  g.exp += Math.round((6 + h.zone * 5) * (m.boss ? 8 : 1));
  g.coins += Math.round((3 + h.zone * 4) * (m.boss ? 6 : 1) * (0.8 + Math.random() * 0.4));
  g.kills++;
  const gr = z.grade[Math.floor(Math.random() * z.grade.length)];
  if (m.boss || Math.random() < DROP_ITEM) { g.items.push(makeItem(gr)); if (m.boss) showToast('📦 บอสดรอปของเกรด ' + gr); }
  if (Math.random() < DROP_SCROLL) g.scrolls[gr]++;
}
function huntTick() {   // คืน true ถ้าการล่าจบแล้ว
  const h = state.hunt;
  if (!h || h.done) return false;
  if (h.mons.length === 0) { if (h.cd > 0) h.cd--; else { h.wave++; spawnWave(); h.cd = 2; } }
  let dmg = state.netSupply * 0.45 * playerPower() * (state.blackoutActive ? 0.3 : 1);
  for (const m of h.mons) { if (dmg <= 0) break; const d = Math.min(m.hp, dmg); m.hp -= d; dmg -= d; }
  h.mons = h.mons.filter(m => { if (m.hp > 0) return true; onKill(m); return false; });
  h.shield -= h.mons.reduce((s, m) => s + m.atk, 0) * (state.blackoutActive ? 2 : 1);
  if (!state.blackoutActive && state.netSupply >= state.demand) h.shield = Math.min(h.shieldMax, h.shield + 2);
  if (h.shield <= 0) { h.shield = 0; renderHunt(); if (gameTimerId) { clearInterval(gameTimerId); gameTimerId = null; } endGame('💀 เมืองล่ม! โล่ป้องกันแตก'); return true; }
  renderHunt();
  return false;
}
function renderHunt() {
  let hud = document.getElementById('huntHud');
  const h = state && state.hunt;
  if (!h) { if (hud) hud.classList.add('hidden'); return; }
  if (!hud) { hud = document.createElement('div'); hud.id = 'huntHud'; document.body.appendChild(hud); }
  hud.classList.remove('hidden');
  const z = HUNT_ZONES[h.zone], g = h.gain;
  hud.innerHTML = '<div><b>' + z.name + '</b> · เวฟ ' + h.wave + ' · พลังตัวละคร ×' + playerPower().toFixed(2) + '</div>' +
    '<div class="hb"><i style="width:' + Math.max(0, 100 * h.shield / h.shieldMax) + '%"></i></div>' +
    '<div>' + h.mons.slice(0, 9).map(m => m.e + Math.ceil(100 * m.hp / m.max) + '%').join(' ') + '</div>' +
    '<div class="hh-dim">EXP +' + g.exp + ' · 🪙' + g.coins + ' · ⚔️' + g.kills + ' · 📦' + g.items.length + '</div>';
}
function huntFinish(msg) {
  const h = state.hunt;
  if (!h || h.done) return;
  h.done = true;
  if (gameTimerId) { clearInterval(gameTimerId); gameTimerId = null; }
  gameInProgress = false; state.finished = true; stopBackgroundMusic(); stopShootingStars();
  const g = h.gain, dead = !!msg;
  let sold = 0, soldN = 0;
  g.items.forEach(it => { if (profile.items.length >= BAG_MAX) { sold += itemValue(it); soldN++; } else { it.id = profile.nextId++; profile.items.push(it); } });
  profile.coins += g.coins + sold; profile.kills += g.kills;
  for (const k in g.scrolls) profile.scrolls[k] = (profile.scrolls[k] || 0) + g.scrolls[k];
  const ups = addExp(g.exp);
  let loss = 0;
  if (dead) { loss = Math.round(expNeed(profile.level) * 0.03); profile.exp = Math.max(0, profile.exp - loss); }
  profile.best = Math.max(profile.best, h.wave);
  saveProfile();
  ['gameScreen', 'skyBackground'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('startScreen').classList.remove('hidden');
  renderHunt();
  const gem = g.items.length - soldN;
  openHub((dead ? '💀 เมืองล่มที่เวฟ ' + h.wave + ' (เสีย EXP ' + loss + ')' : '✅ จบการล่าที่เวฟ ' + h.wave) +
    ' · EXP +' + g.exp + (ups ? ' · เลเวลอัพ ×' + ups + '!' : '') + ' · 🪙' + g.coins + ' · ได้ของ ' + gem + ' ชิ้น' + (sold ? ' (กระเป๋าเต็ม ขายอัตโนมัติ ' + sold + ')' : ''));
}
function startHunt() { closeHub(); pendingHunt = true; huntPrevDuration = selectedDuration; selectedDuration = 0; startGame(); }

/* ---------- ฐานทัพ: โปรไฟล์ ของ ตีบวก ร้านม้วน ---------- */
function hubAct(d) {
  const p = profile, it = d.id ? findItem(+d.id) : null;
  let msg = '';
  if (d.a === 'zone') huntZone = +d.z;
  else if (d.a === 'go') return startHunt();
  else if (d.a === 'eq' && it) { if (p.level < GRADE_LV[it.grade]) msg = 'ต้องเลเวล ' + GRADE_LV[it.grade] + ' ถึงจะสวมเกรด ' + it.grade + ' ได้'; else p.equip[it.slot] = it.id; }
  else if (d.a === 'un') delete p.equip[d.s];
  else if (d.a === 'sell' && it) { if (isEquipped(it)) delete p.equip[it.slot]; p.coins += itemValue(it); p.items = p.items.filter(i => i !== it); msg = 'ขายได้ ' + itemValue(it) + ' เหรียญ'; }
  else if (d.a === 'buy') { const g = d.g; if (p.coins < SCROLL_PRICE[g]) msg = 'เหรียญไม่พอ'; else { p.coins -= SCROLL_PRICE[g]; p.scrolls[g] = (p.scrolls[g] || 0) + 1; } }
  else if (d.a === 'ench' && it) {
    if (it.enchant >= MAX_ENCH) msg = 'ตีบวกถึงขีดสูงสุดแล้ว (+' + MAX_ENCH + ')';
    else if (!(p.scrolls[it.grade] > 0)) msg = 'ไม่มีม้วนตีบวกเกรด ' + it.grade;
    else if (it.enchant >= 6 && !confirm('เสี่ยงของพัง ' + Math.round((1 - ENCH_RATE) * 100) + '% ต้องการตีบวกต่อหรือไม่?')) msg = 'ยกเลิก';
    else {
      p.scrolls[it.grade]--;
      if (it.enchant < SAFE_ENCH || Math.random() < ENCH_RATE) { it.enchant++; msg = '✨ ตีบวกสำเร็จ +' + it.enchant; }
      else { const back = Math.round(itemValue(it) / 2); if (isEquipped(it)) delete p.equip[it.slot]; p.items = p.items.filter(i => i !== it); p.coins += back; msg = '💥 ของพัง! ได้ผลึกคืนเป็น ' + back + ' เหรียญ'; }
    }
  } else if (d.a === 'close') return closeHub();
  saveProfile(); renderHub(msg);
}
function hubHTML(msg) {
  const p = profile, pct = Math.round(100 * p.exp / expNeed(p.level));
  const zones = HUNT_ZONES.map((z, i) => '<button data-a="zone" data-z="' + i + '"' + (p.level < z.lv ? ' disabled' : '') + (i === huntZone ? ' class="on"' : '') + '>' + z.name + ' <small>Lv' + z.lv + '+</small></button>').join('');
  const eq = Object.keys(GEAR_SLOTS).map(s => { const it = findItem(p.equip[s]); return '<div class="hh-row"><b>' + GEAR_SLOTS[s] + '</b> ' + (it ? itemLabel(it) + ' <button data-a="un" data-s="' + s + '">ถอด</button>' : '<span class="hh-dim">ว่าง</span>') + '</div>'; }).join('');
  const bag = p.items.filter(it => !isEquipped(it)).map(it => '<div class="hh-row">' + itemLabel(it) + ' <button data-a="eq" data-id="' + it.id + '">สวม</button> <button data-a="ench" data-id="' + it.id + '">ตีบวก' + (it.enchant >= SAFE_ENCH ? ' ' + Math.round(ENCH_RATE * 100) + '%' : ' ปลอดภัย') + '</button> <button data-a="sell" data-id="' + it.id + '">ขาย ' + itemValue(it) + '</button></div>').join('') || '<div class="hh-dim">ยังไม่มีของ ออกล่าเพื่อเก็บของ</div>';
  return '<div class="hh-card">' + (msg ? '<div class="hh-msg">' + msg + '</div>' : '') +
    '<h2>⚔️ ฐานทัพ · Lv ' + p.level + '</h2><div class="hb"><i style="width:' + pct + '%"></i></div><div>EXP ' + p.exp + '/' + expNeed(p.level) + ' · 🪙 ' + p.coins + ' · ม้วน D ×' + (p.scrolls.D || 0) + ' C ×' + (p.scrolls.C || 0) + ' · พลัง ×' + playerPower().toFixed(2) + ' · เวฟสูงสุด ' + p.best + '</div>' +
    '<h3>ที่ล่า</h3><div class="hh-zones">' + zones + '</div><button class="primary-btn" data-a="go">🚀 ออกล่า</button>' +
    '<h3>สวมใส่</h3>' + eq + '<h3>กระเป๋า (' + p.items.length + '/' + BAG_MAX + ')</h3>' + bag +
    '<h3>ร้านม้วนตีบวก</h3><button data-a="buy" data-g="D">ม้วน D · ' + SCROLL_PRICE.D + '🪙</button> <button data-a="buy" data-g="C">ม้วน C · ' + SCROLL_PRICE.C + '🪙</button>' +
    '<div class="hh-dim" style="margin-top:8px">ตีบวกได้ปลอดภัยถึง +' + SAFE_ENCH + ' เกินนั้นล้มเหลวของพัง (ได้เหรียญคืนครึ่งหนึ่ง) · เมืองล่มเสีย EXP 3%</div>' +
    '<button class="secondary-btn" data-a="close" style="margin-top:12px">ปิด</button></div>';
}
function renderHub(msg) { const el = document.getElementById('huntHub'); if (el) el.innerHTML = hubHTML(msg); }
function openHub(msg) {
  let el = document.getElementById('huntHub');
  if (!el) { el = document.createElement('div'); el.id = 'huntHub'; el.onclick = function (e) { const b = e.target.closest('button'); if (b && !b.disabled) hubAct(b.dataset); }; document.body.appendChild(el); }
  el.classList.remove('hidden'); renderHub(msg);
}
function closeHub() { const el = document.getElementById('huntHub'); if (el) el.classList.add('hidden'); }

(function initHuntUi() {
  const st = document.createElement('style');
  st.textContent = '#huntHub{position:fixed;inset:0;z-index:1100;overflow:auto;background:rgba(8,14,28,.96);color:#e8f0ff;padding:12px}#huntHub.hidden,#huntHud.hidden{display:none}' +
    '.hh-card{max-width:560px;margin:0 auto}.hh-card h2,.hh-card h3{margin:10px 0 6px}.hh-row{padding:5px 0;border-bottom:1px solid rgba(255,255,255,.08)}.hh-row button,.hh-zones button,.hh-card>button{margin:2px 4px 2px 0;padding:6px 10px;border-radius:8px;border:1px solid #3a5a8a;background:#17284a;color:#e8f0ff}' +
    '.hh-zones button.on{background:#2f6bd6}.hh-zones button:disabled{opacity:.4}.hh-dim{color:#8fa3c4;font-size:.85em}.hh-msg{background:#17305a;padding:8px;border-radius:8px;margin-bottom:8px}.hh-g{font-weight:700;padding:0 5px;border-radius:4px;background:#355}.hh-C{background:#2b6}' +
    '.hb{height:8px;background:#223;border-radius:4px;overflow:hidden;margin:4px 0}.hb i{display:block;height:100%;background:#4fd1c5}' +
    '#huntHud{position:fixed;left:50%;transform:translateX(-50%);bottom:8px;width:calc(100% - 16px);max-width:560px;z-index:800;pointer-events:none;background:rgba(8,14,28,.82);color:#e8f0ff;padding:6px 10px;border-radius:10px;font-size:.85em}';
  document.head.appendChild(st);
  const row = document.querySelector('#startScreen .start-actions');
  if (row) row.insertAdjacentHTML('beforebegin', '<div class="start-actions" style="margin-bottom:10px;"><button class="primary-btn" onclick="openHub()">⚔️ ฐานทัพ / ออกล่า</button></div>');
})();
