/* ตัวละคร 11 ตัว + การ์ด 24 ใบ + ผลต่อเกม (ทดลองเล่น: ทุกอย่างปลดล็อกหมด ยังไม่มีตู้สุ่ม) */
const TM_SAVE = 'voltrushTeam', STARTER = ['mint', 'latte', 'fasai'], ADM = { god: false, cd: 1 };
const isTester = () => !!(typeof AUTH !== 'undefined' && AUTH.p && ['tester', 'admin'].includes(AUTH.p.role)), isAdmin = () => !!(typeof AUTH !== 'undefined' && AUTH.p && AUTH.p.role === 'admin');
const ownsChar = id => isTester() || STARTER.includes(id), ownsCard = id => isTester() || !!(CARD_BY[id] && CARD_BY[id].base);
const CH = { active: null, T: null, run: { cdLeft: 0, watt: 0, buf: [], uses: 0, sigSeen: false, lastFs: 0, gc: 0, buff: null } };
const CHARS = {
  mint: { n: 'มิ้นต์', role: 'ช่างซ่อมบำรุง', rar: 'N', kind: 'auto', hair: '#7ee3c4', hair2: '#3fb998', eye: '#27a58b', cloth: '#ffd84d', cloth2: '#e8a900', acc: 'helmet', style: 'short', pass: { haz: .88, inc: .95 }, downs: ['inc'], ptxt: 'โอกาสระเบิด −12% • รายได้ −5%', stxt: 'อัตโนมัติ: เมื่อโรงเกิดเหตุอันตราย เวลาปิดฉุกเฉิน +4 วิ', sig: 'wrench', lines: ['ตรวจครบทุกจุดแล้ว ปลอดภัยค่ะ!', 'ประแจคู่ใจพร้อมเสมอ~'] },
  latte: { n: 'ลาเต้', role: 'นักธุรกิจ', rar: 'N', kind: 'auto', hair: '#c89b6d', hair2: '#a9774a', eye: '#d9822b', cloth: '#455a64', cloth2: '#263238', acc: 'none', style: 'twin', pass: { inc: 1.12, haz: 1.08 }, downs: ['haz'], ptxt: 'รายได้ +12% • โอกาสระเบิด +8%', stxt: 'อัตโนมัติ: ต้นทุก Wave ได้เงิน 25 + 5×Wave (สูงสุด 100)', sig: 'deal', lines: ['ดีลนี้ไม่ขาดทุนแน่นอน!', 'เดือนนี้กำไรเกินเป้าค่ะ'] },
  fasai: { n: 'ฟ้าใส', role: 'นักอนุรักษ์', rar: 'N', kind: 'auto', hair: '#a8e6a1', hair2: '#5fbf6a', eye: '#3aa86a', cloth: '#e8f5e9', cloth2: '#81c784', acc: 'leaf', style: 'long', pass: { clean: 1.15 }, downs: ['unlock_fossil'], ptxt: 'คะแนนพลังงานสะอาด +15% • โรงฟอสซิลปลดล็อกแพงขึ้น 15%', stxt: 'อัตโนมัติ: คอมโบครบทุก 10 ได้โบนัสคะแนน +40', sig: 'sprout', lines: ['ลมสะอาดจังเลยนะ~', 'ช่วยกันรักษาโลกค่ะ!'] },
  storm: { n: 'สตอร์ม', role: 'นักล่าพายุ', rar: 'R', kind: 'active', hair: '#cfe3f5', hair2: '#8fb7dc', eye: '#2f8fd8', cloth: '#4a78a8', cloth2: '#2c4a6e', acc: 'hood', style: 'bob', pass: {}, downs: [], ptxt: 'ผลสภาพอากาศแย่และบอสพายุ/ความร้อน −50%', stxt: 'กด: สายล่อฟ้า ยกเลิกสภาพอากาศปัจจุบัน (รอ 45 วิ)', sig: 'rod', lines: ['ฟ้าผ่ากลัวฉันก่อนแหละ!', 'พายุมาก็ไม่หวั่นหรอก'] },
  watt: { n: 'วัตต์', role: 'นักฟิสิกส์แบต', rar: 'R', kind: 'active', hair: '#b39ddb', hair2: '#7e57c2', eye: '#7e57c2', cloth: '#ffffff', cloth2: '#cfd8dc', acc: 'glasses', style: 'bob', pass: { bat: 1.3, charge: .85 }, downs: ['charge'], ptxt: 'ความจุแบต +30% • ชาร์จช้าลง 15%', stxt: 'กด: ปล่อยประจุ แบตจ่ายไฟเร็ว ×2.5 นาน 8 วิ (รอ 60 วิ)', sig: 'cap', lines: ['ประจุเต็มแล้ว… ลองต่อไหม?', 'ทฤษฎีนี้ต้องทดลองสักหน่อย'] },
  sunny: { n: 'ซันนี่', role: 'ชาวสวนโซลาร์', rar: 'E', kind: 'rule', hair: '#ffbf5e', hair2: '#ff9a2e', eye: '#ef7d1a', cloth: '#7cb342', cloth2: '#558b2f', acc: 'strawhat', style: 'long', pass: { o_wind: .85 }, downs: ['wind'], ptxt: 'โซลาร์ผลิตกลางคืนได้ 40% • ลมผลิตลดลง 15%', stxt: 'กฎเฉพาะ: แผงโซลาร์เก็บแสงไว้ใช้ตอนกลางคืน', sig: 'sunpanel', lines: ['แดดวันนี้กำลังดีเลย~', 'กลางคืนก็ยังมีแสงนะ'] },
  iron: { n: 'ไอรอน', role: 'วิศวกรถ่านหินสะอาด', rar: 'E', kind: 'rule', hair: '#b0bec5', hair2: '#78909c', eye: '#ff7043', cloth: '#607d8b', cloth2: '#37474f', acc: 'goggles', style: 'short', pass: {}, downs: ['unlock_clean'], ptxt: 'ถ่านหิน/ก๊าซปล่อยคาร์บอนครึ่งเดียว • โรงพลังงานสะอาดปลดล็อกแพงขึ้น 20%', stxt: 'กฎเฉพาะ: ตัวกรองไอเสีย', sig: 'filter', lines: ['ควันน้อยลงแล้วใช่ไหม!', 'เหล็กกล้าต้องผ่านไฟ'] },
  nami: { n: 'นามิ', role: 'นักประดาน้ำ', rar: 'E', kind: 'rule', hair: '#80deea', hair2: '#26a6c8', eye: '#0288d1', cloth: '#0277bd', cloth2: '#01579b', acc: 'diver', style: 'long', pass: {}, downs: ['hydro'], ptxt: 'พลังน้ำ/คลื่น ผลิต ×1.30 เมื่อไฟขาด แต่ ×0.80 เมื่อไฟเกิน', stxt: 'กฎเฉพาะ: ผลิตตามจังหวะดีมานด์', sig: 'gate', lines: ['น้ำขึ้นแล้ว พร้อมลุย!', 'คลื่นลูกนี้เป็นของเรา~'] },
  nucleia: { n: 'นิวเคลีย', role: 'หมอปรมาณู', rar: 'SSR', kind: 'rule', hair: '#e8f4ff', hair2: '#b3d4f5', eye: '#5aa9ff', cloth: '#eceff1', cloth2: '#90a4ae', acc: 'mask', style: 'long', pass: {}, downs: ['unlock_nuke'], ptxt: 'นิวเคลียร์/ฟิวชันไม่เกิดเหตุอันตราย • ปลดล็อกสองโรงนี้แพงขึ้น 10%', stxt: 'กฎเฉพาะ: เสถียรภาพสมบูรณ์', sig: 'rodc', lines: ['…ค่าอยู่ในเกณฑ์ปกติ', 'ความเสี่ยง… ศูนย์'] },
  chrono: { n: 'โครโน', role: 'นักเดินทางเวลา', rar: 'SSR', kind: 'active', hair: '#d1b3ff', hair2: '#ffd166', eye: '#ffb300', cloth: '#5e35b1', cloth2: '#311b92', acc: 'cape', style: 'short', pass: {}, downs: [], ptxt: 'ไม่มีโบนัสถาวร', stxt: 'กด: ย้อนเวลา กลับ 10 วิ รวมคะแนน (1 ครั้ง/รอบ)', sig: 'watch', lines: ['…เวลาไม่รอเรานะ', 'ฉันเห็นอนาคตแล้ว… คงไม่ดีนัก'] },
  aurora: { n: 'ออโรร่า', role: 'เจ้าหญิงแสงเหนือ (Limited)', rar: 'SSR', kind: 'active', hair: '#7ef0c8', hair2: '#b388ff', eye: '#b388ff', cloth: '#4527a0', cloth2: '#7e57c2', acc: 'aurora', style: 'long', pass: { cost: 1.05 }, downs: ['cost'], ptxt: 'ต้นทุก Wave ได้บัฟสุ่ม 15 วิ • ค่าเดินเครื่อง +5%', stxt: 'กด: แสงนำทาง ดูเหตุการณ์ถัดไป + สุ่มการ์ดใหม่ 1 ครั้ง (รอ 50 วิ)', sig: 'prism', lines: ['แสงเหนือนำทางเธออยู่นะ ✨', 'วันนี้โชคจะดีเป็นพิเศษ~'] }
};
const SIG = {
  wrench: { ic: '🔧', n: 'ประแจทอง', d: 'โอกาสระเบิด −10% และเวลาปิดฉุกเฉิน +2 วิ ต่อชั้น', max: 2, mul: { haz: .9 }, add: { hx: 2 } },
  deal: { ic: '📝', n: 'สัญญาพิเศษ', d: 'รายได้ +10% แต่ค่าเดินเครื่อง +5% ต่อชั้น', max: 2, mul: { inc: 1.1, cost: 1.05 } },
  sprout: { ic: '🌱', n: 'ต้นกล้า', d: 'โทษคาร์บอน −15% ต่อชั้น', max: 2, mul: { carbon: .85 } },
  rod: { ic: '⚡', n: 'สายล่อฟ้าสำรอง', d: 'เวลารอสกิล −10% ต่อชั้น', max: 3, mul: { skillcd: .9 } },
  cap: { ic: '🔋', n: 'ตัวเก็บประจุ', d: 'ความจุแบต +15% ต่อชั้น', max: 2, mul: { bat: 1.15 } },
  sunpanel: { ic: '☀️', n: 'แผงสะสมแสง', d: 'โซลาร์ +10% และกลางคืนเพิ่ม +10% ต่อชั้น', max: 2, mul: { o_solar: 1.1 }, add: { night: .1 } },
  rodc: { ic: '☢️', n: 'แท่งควบคุม', d: 'ผลผลิตนิวเคลียร์/ฟิวชัน +8% ต่อชั้น', max: 3, mul: { o_nuclear: 1.08, o_fusion: 1.08 } },
  watch: { ic: '⏳', n: 'นาฬิกาพก', d: 'ย้อนเวลาได้เพิ่ม 1 ครั้ง', max: 1, add: { rewind: 1 } },
  filter: { ic: '🧪', n: 'ตัวกรองไอเสีย', d: 'โทษคาร์บอน −10% ต่อชั้น', max: 3, mul: { carbon: .9 } },
  gate: { ic: '🚪', n: 'ประตูน้ำ', d: 'พลังน้ำ/คลื่น +10% ต่อชั้น', max: 2, mul: { o_hydro: 1.1, o_tidal: 1.1 } },
  prism: { ic: '🌈', n: 'ปริซึมแสง', d: 'บัฟสุ่มนานขึ้น +5 วิ ต่อชั้น', max: 2, add: { buffdur: 5 } }
};
const CARDS = [
  { id: 'biz', ic: '💰', n: 'ธุรกิจรุ่ง', d: 'รายได้ +15%', fam: 'econ', rar: 'C', k: 'inc', v: 1.15, base: 1 }, { id: 'maint', ic: '🛠', n: 'ซ่อมบำรุงดี', d: 'ค่าเดินเครื่อง −15%', fam: 'econ', rar: 'C', k: 'cost', v: .85, max: 4, base: 1 },
  { id: 'cash', ic: '🎁', n: 'เงินก้อน', d: 'รับ 120 💰 ทันที', fam: 'econ', rar: 'C', cash: 120, base: 1 }, { id: 'cash2', ic: '💎', n: 'เงินก้อนใหญ่', d: 'รับ 200 💰 ทันที', fam: 'econ', rar: 'R', cash: 200 },
  { id: 'contract', ic: '📜', n: 'สัญญาระยะยาว', d: 'รายได้ +2% ต่อ Wave (สูงสุด +20%)', fam: 'econ', rar: 'R', k: 'contract', max: 2 }, { id: 'tax', ic: '🧾', n: 'ลดหย่อนภาษี', d: 'ค่าอัพเกรดเมือง −10%', fam: 'econ', rar: 'E', k: 'city', v: .9, max: 2 },
  { id: 'safety', ic: '🛡', n: 'ระบบนิรภัย', d: 'โอกาสระเบิด −20%', fam: 'safe', rar: 'C', k: 'haz', v: .8, max: 3, base: 1 }, { id: 'quick', ic: '⏱', n: 'ปิดฉุกเฉินไว', d: 'เวลาปิดฉุกเฉิน +3 วิ', fam: 'safe', rar: 'R', k: 'hx', max: 3 },
  { id: 'inspect', ic: '🔍', n: 'ตรวจประจำวัน', d: 'เวลารอหลังเหตุ −20%', fam: 'safe', rar: 'R', k: 'cdn', v: .8, max: 2 }, { id: 'insul', ic: '🧯', n: 'ฉนวนกันไฟ', d: 'ผลบอสคลื่นความร้อน −30%', fam: 'safe', rar: 'R', k: 'heat', v: .7, max: 2 },
  { id: 'backup', ic: '🔌', n: 'เครื่องสำรอง', d: 'ทนไฟดับเพิ่ม +1 วิ', fam: 'safe', rar: 'E', k: 'tol', max: 3 }, { id: 'warn', ic: '📡', n: 'สัญญาณเตือน', d: 'ไฮไลต์โรงที่เสี่ยงเกิดเหตุสูงสุด', fam: 'safe', rar: 'E', k: 'warn', max: 1 },
  { id: 'batcap', ic: '🔋', n: 'แบตจุเพิ่ม', d: 'ความจุแบต +25%', fam: 'grid', rar: 'C', k: 'bat', v: 1.25, base: 1 }, { id: 'saver', ic: '🏙', n: 'ประหยัดไฟ', d: 'ดีมานด์เมือง −6%', fam: 'grid', rar: 'C', k: 'dem', v: .94, max: 5, base: 1 },
  { id: 'fast', ic: '⚡', n: 'ชาร์จไว', d: 'ชาร์จแบตเร็ว +25%', fam: 'grid', rar: 'R', k: 'charge', v: 1.25, max: 3 }, { id: 'solar', ic: '☀️', n: 'โซลาร์เสริม', d: 'โซลาร์ +10%', fam: 'grid', rar: 'R', k: 'o_solar', v: 1.1, max: 3 },
  { id: 'wind', ic: '💨', n: 'ลมแรง', d: 'พลังงานลม +10%', fam: 'grid', rar: 'R', k: 'o_wind', v: 1.1, max: 3 }, { id: 'hydro', ic: '💧', n: 'หม้อน้ำ', d: 'พลังน้ำ/คลื่น +10%', fam: 'grid', rar: 'E', k: 'o_hydro', v: 1.1, max: 3 },
  { id: 'combo', ic: '🔥', n: 'คอมโบทน', d: 'คอมโบเพิ่มคะแนนเร็วขึ้น', fam: 'score', rar: 'C', k: 'combo', max: 3 }, { id: 'cleanp', ic: '🌿', n: 'พลังงานสะอาด+', d: 'คะแนนสะอาด +15%', fam: 'score', rar: 'R', k: 'clean', v: 1.15, max: 3 },
  { id: 'lowc', ic: '🍃', n: 'คาร์บอนต่ำ', d: 'โทษคาร์บอน −20%', fam: 'score', rar: 'R', k: 'carbon', v: .8, max: 3 }, { id: 'fans', ic: '👏', n: 'ผู้ชมประทับใจ', d: 'คะแนนพึงพอใจ +10%', fam: 'score', rar: 'R', k: 'sat', v: 1.1, max: 3 },
  { id: 'goal', ic: '🎯', n: 'เป้าหมายเด่น', d: 'โบนัสเป้าหมายย่อย +25%', fam: 'score', rar: 'E', k: 'goal', v: 1.25, max: 3 }, { id: 'gcombo', ic: '👑', n: 'คอมโบทองคำ', d: 'คอมโบ 30 ได้โบนัสก้อนใหญ่', fam: 'score', rar: 'E', k: 'gcombo', max: 1 }
];
const CARD_BY = {}; CARDS.forEach(c => CARD_BY[c.id] = c);
PERKS.length = 0; PERKS.push(...CARDS);
const AURORA_BUFFS = [{ n: 'รายได้ ×1.25', mul: { inc: 1.25 } }, { n: 'โอกาสระเบิด ×0.6', mul: { haz: .6 } }, { n: 'ดีมานด์ ×0.92', mul: { dem: .92 } }, { n: 'ชาร์จแบต ×1.5', mul: { charge: 1.5 } }, { n: 'โซลาร์/ลม ×1.2', mul: { o_solar: 1.2, o_wind: 1.2 } }];
const DOWNK = { inc: 1, charge: 1, o_wind: 1 };
/* ---------- ตัวช่วยคำนวณ ---------- */
const stacksOfId = id => ((state && state.perks) || []).filter(p => p.id === id).length;
const hasMain = id => !!(CH.active && CH.active.main === id), hasHelp = id => !!(CH.active && CH.active.helpers.includes(id));
const sigOf = () => CH.active && CHARS[CH.active.main] ? SIG[CHARS[CH.active.main].sig] : null;
const sigN = () => CH.active ? stacksOfId('sig_' + CH.active.main) : 0;
const sigAdd = k => { const s = sigOf(); return s && s.add && s.add[k] ? s.add[k] * sigN() : 0; };
function chMul(k) {
  const a = CH.active; if (!a || !CHARS[a.main]) return 1; let m = 1; const c = CHARS[a.main];
  if (c.pass[k]) m *= c.pass[k]; a.helpers.forEach(h => { const x = CHARS[h]; if (x && x.pass[k]) m *= Math.pow(x.pass[k], .4); });
  if (DOWNK[k] && m < .85) m = .85;
  const s = SIG[c.sig]; if (s && s.mul && s.mul[k]) m *= Math.pow(s.mul[k], sigN());
  const b = CH.run.buff; if (b && state && state.elapsed < b.until && b.mul[k]) m *= b.mul[k];
  if (k === 'inc' && state) m *= 1 + Math.min(.2, .02 * (state.wave || 0)) * stacksOf('contract');
  return m;
}
const mitStorm = () => hasMain('storm') ? .5 : hasHelp('storm') ? .8 : 1;
const stormMit = x => 1 - (1 - x) * mitStorm();
const bossAdj = (k, v) => 1 + (v - 1) * mitStorm() * (k === 'haz' ? perkMul('heat') : 1);
const NUKE = k => k === 'nuclear' || k === 'fusion';
const hazKey = k => ADM.god ? 0 : !NUKE(k) ? 1 : hasMain('nucleia') ? 0 : hasHelp('nucleia') ? .6 : 1;
const carbKey = key => { const d = PLANT_MAP[key]; if (!d || !(d.carbonRate > 0)) return 1; return hasMain('iron') ? .5 : hasHelp('iron') ? Math.pow(.5, .4) : 1; };
function nightSolar() { return Math.min(.7, (hasMain('sunny') ? .4 : 0) + (hasHelp('sunny') ? .16 : 0) + (hasMain('sunny') ? sigAdd('night') : 0)); }
function outMul(key) {
  let m = perkMul('o_' + key); if (key === 'tidal') m *= perkMul('o_hydro');
  if (key === 'hydro' || key === 'tidal') { const r = state.netSupply < state.demand ? 1.3 : .8; if (hasMain('nami')) m *= r; if (hasHelp('nami')) m *= Math.pow(r, .4); }
  return m;
}
function hazExtra() { return Math.round((hasMain('mint') ? 4 : 0) + (hasHelp('mint') ? 1.6 : 0) + 3 * stacksOf('hx') + sigAdd('hx')); }
const wattOn = () => CH.run.watt > 0;
const tolAdd = () => stacksOf('backup');
const _gcu = getCityUpgradeCost; window.getCityUpgradeCost = l => Math.round(_gcu(l) * perkMul('city'));
const _gbt = getEffectiveBlackoutThreshold; window.getEffectiveBlackoutThreshold = () => _gbt() + tolAdd();
wrap('emergencyShutdown', (o, a) => { const r = o(...a); const p = state.plants[a[0]]; if (p && p.cooldown) p.cooldown = Math.max(1, Math.round(p.cooldown * perkMul('cdn'))); return r; });
/* ---------- ทีมและเด็ค ---------- */
const BASE_IDS = CARDS.filter(c => c.base).map(c => c.id);
const DEFAULT_DECK = ['quick', 'inspect', 'solar', 'wind', 'fast', 'cleanp', 'lowc', 'fans', 'combo', 'contract', 'cash2', 'insul'];
function deckSlots() { if (isTester()) return 12; const l = typeof lvOf === 'function' && AUTH.p ? lvOf(AUTH.p.xp) : 1; return l >= 16 ? 12 : l >= 12 ? 11 : l >= 8 ? 10 : l >= 4 ? 9 : 8; }
function loadTeam() {
  let t = null; try { t = JSON.parse(localStorage.getItem(TM_SAVE) || 'null'); } catch (e) {}
  if (!t) return { main: 'mint', helpers: ['', ''], deck: DEFAULT_DECK.filter(ownsCard) };
  t.main = CHARS[t.main] && ownsChar(t.main) ? t.main : 'mint'; t.helpers = (t.helpers || ['', '']).map(h => CHARS[h] && h !== t.main && ownsChar(h) ? h : '').slice(0, 2); while (t.helpers.length < 2) t.helpers.push('');
  t.deck = (t.deck || DEFAULT_DECK).filter(i => CARD_BY[i] && !CARD_BY[i].base && ownsCard(i)); return t;
}
const teamDowns = t => [...new Set([t.main, ...t.helpers].filter(Boolean).flatMap(i => CHARS[i].downs))];
function dailyKit(seed) {
  const ids = Object.keys(CHARS).filter(i => i !== 'aurora'), r = mulberry32(seed), pool = CARDS.filter(c => !c.base).map(c => c.id);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { main: ids[seed % ids.length], helpers: [], deck: pool.slice(0, 12) };
}
function computeActive() {
  if (DAILY && DAILY_SEED) return dailyKit(DAILY_SEED);
  const t = loadTeam(); return { main: t.main, helpers: t.helpers.filter(h => h && h !== t.main), deck: t.deck.slice(0, deckSlots()) };
}
function applyCosts() {
  PLANT_DEFS.forEach(d => {
    if (d.baseCost == null) d.baseCost = d.cost; let m = 1; const a = CH.active; if (!a) { d.cost = d.baseCost; return; }
    [[a.main, 1], ...a.helpers.map(h => [h, .4])].forEach(([id, p]) => {
      if (id === 'fasai' && d.carbonRate > 0) m *= Math.pow(1.15, p); if (id === 'iron' && d.carbonRate === 0) m *= Math.pow(1.2, p); if (id === 'nucleia' && NUKE(d.key)) m *= Math.pow(1.1, p);
    });
    d.cost = Math.round(d.baseCost * m);
  });
}
const newRun = () => ({ cdLeft: 0, watt: 0, buf: [], uses: 0, sigSeen: false, lastFs: 0, gc: 0, buff: null });
wrap('startGame', (o, a) => {
  if (!RESUME) { CH.active = computeActive(); CH.run = newRun(); applyCosts(); if (DAILY && CHARS[CH.active.main]) setTimeout(() => showToast('📅 Daily: ตัวละครวันนี้ ' + CHARS[CH.active.main].n + ' + เด็คที่จัดให้'), 4500); }
  return o(...a);
});
/* ---------- การ์ดในรอบ ---------- */
const WEIGHT = { C: 3, R: 2, E: 1 };
const canTake = c => !c.max || stacksOf(c.k || '__') < c.max || (c.sig && stacksOfId(c.id) < c.max);
function sigCard() { const k = CH.active.main, s = SIG[CHARS[k].sig]; return { id: 'sig_' + k, ic: s.ic, n: s.n + ' (ประจำตัว)', d: s.d, rar: 'E', sig: 1, max: s.max }; }
function deckPool() {
  const ids = [...new Set([...BASE_IDS, ...CH.active.deck])], pool = [];
  ids.forEach(i => { const c = CARD_BY[i]; if (c && (c.cash || !c.max || stacksOf(c.k) < c.max)) for (let n = 0; n < WEIGHT[c.rar]; n++) pool.push(c); });
  return pool;
}
function makeOffer(w) {
  const pool = deckPool(), offer = [];
  const sg = sigCard(), sgOk = stacksOfId(sg.id) < sg.max;
  if (sgOk && CH.run.sigSeen) for (let n = 0; n < 2; n++) pool.push(sg);
  if (sgOk && w >= 4 && !CH.run.sigSeen) { offer.push(sg); CH.run.sigSeen = true; }
  while (offer.length < 3 && pool.length) { const p = pool.splice(Math.floor(rng() * pool.length), 1)[0]; if (!offer.includes(p)) { offer.push(p); for (let i = pool.length - 1; i >= 0; i--) if (pool[i] === p) pool.splice(i, 1); } }
  if (!offer.length) offer.push(CARD_BY.cash); return offer;
}
window.onWave = function (w) {
  if (!state) return;
  if (w % 6 === 0) { state.boss = { t: Math.floor(rng() * BOSS.length), left: 20 }; showToast('⚠️ บอส: ' + BOSS[state.boss.t].n + ' นาน 20 วิ!'); fxShake(); }
  charOnWave(w); showCards(makeOffer(w));
};
function charOnWave(w) {
  const a = CH.active; if (!a) return;
  const lt = (hasMain('latte') ? 1 : 0) + (hasHelp('latte') ? .4 : 0); if (lt) { const g = Math.round(Math.min(100, 25 + 5 * w) * lt); state.money += g; showToast('📝 ดีลเด็ด +' + g + ' 💰'); }
  const au = hasMain('aurora') ? 1 : hasHelp('aurora') ? .4 : 0;
  if (au) { const b = AURORA_BUFFS[Math.floor(rng() * AURORA_BUFFS.length)], dur = Math.round((15 + sigAdd('buffdur')) * au); CH.run.buff = { mul: b.mul, until: state.elapsed + dur }; showToast('✨ ออโรร่า: บัฟสุ่ม ' + b.n + ' นาน ' + dur + ' วิ'); }
}
/* ---------- สกิลกด ---------- */
const SKILLS = {
  storm: { n: 'สายล่อฟ้า', ic: '⛈', cd: 45, run() { state.weather = 'clear'; state.nextWeatherIn = Math.max(state.nextWeatherIn, 20); showToast('⛈ สายล่อฟ้า! ยกเลิกสภาพอากาศแล้ว'); fxBurst(FX.pt.x, FX.pt.y, 40, ['#9bd7ff', '#fff']); } },
  watt: { n: 'ปล่อยประจุ', ic: '🔋', cd: 60, run() { CH.run.watt = 8; showToast('🔋 ปล่อยประจุ 8 วินาที!'); } },
  chrono: { n: 'ย้อนเวลา', ic: '⏳', cd: 5 },
  aurora: { n: 'แสงนำทาง', ic: '✨', cd: 50, run() {
    const k = Math.max(0, 6 - (state.wave || 0) % 6);
    showToast('🔮 Peak อีก ' + state.nextPeakIn + ' วิ • อากาศถัดไป ' + weatherLabel(state.nextWeatherValue) + ' ใน ' + state.nextWeatherIn + ' วิ • บอสอีก ' + k + ' Wave');
    if (!byId('cardTray').classList.contains('hidden')) showCards(makeOffer(state.wave || 0));
  } }
};
function skillKey() { const a = CH.active; if (!a) return null; const c = CHARS[a.main]; return c && c.kind === 'active' ? a.main : null; }
function rewind() {
  if (CH.run.buf.length < 3) { showToast('ย้อนยังไม่ได้ ต้องเล่นอย่างน้อย 3 วินาที'); return false; }
  const snap = JSON.parse(CH.run.buf[0]); state = snap; CH.run.buf = []; renderGame(); showToast('⏳ ย้อนเวลา! กลับไป ' + (snap.elapsed || 0) + ' วินาที'); fxBurst(innerWidth / 2, innerHeight / 2, 60, ['#ffd166', '#b388ff', '#fff']); return true;
}
function useSkill() {
  if (!state || !gameInProgress || state.prepping) return; const k = skillKey(); if (!k) return; const S = SKILLS[k], R = CH.run;
  if (R.cdLeft > 0) return;
  if (k === 'chrono') { if (R.uses >= 1 + sigAdd('rewind') && ADM.cd >= 1) { showToast('ใช้ย้อนเวลาครบแล้ว'); return; } if (!rewind()) return; R.uses++; R.cdLeft = 5; return; }
  S.run(); R.cdLeft = Math.max(1, Math.round(S.cd * chMul('skillcd') * ADM.cd));
}
(function () { const b = document.createElement('button'); b.id = 'skillBtn'; b.className = 'hidden'; b.onclick = useSkill; document.body.appendChild(b); addEventListener('keydown', e => { if ((e.key === 'q' || e.key === 'Q') && !/INPUT|TEXTAREA/.test(e.target.tagName)) useSkill(); }); })();
function chAfterTick() {
  const R = CH.run, a = CH.active; if (R.cdLeft > 0) R.cdLeft--; if (R.watt > 0) R.watt--;
  if (!state.streak) R.lastFs = 0;
  const fs = (hasMain('fasai') ? 40 : 0) + (hasHelp('fasai') ? 16 : 0);
  if (fs && state.streak > 0 && state.streak % 10 === 0 && R.lastFs !== state.streak) { R.lastFs = state.streak; state.breakdown.cleanBonus += fs; showToast('🌱 โบนัสคอมโบ +' + fs); }
  if (stacksOf('gcombo') && state.streak === 30 && !R.gc) { R.gc = 1; state.breakdown.cleanBonus += 150; state.money += 150; showToast('👑 คอมโบทองคำ! +150 คะแนน +150 💰'); }
  R.buf.push(JSON.stringify(state)); if (R.buf.length > 11) R.buf.shift();
}
wrap('gameTick', (o, a) => {
  if (state && state.ch) CH.active = state.ch; else if (state && CH.active) state.ch = CH.active;
  const r = o(...a); if (state && gameInProgress && !state.prepping) chAfterTick(); return r;
});
wrap('renderGame', (o, a) => {
  o(...a); const b = byId('skillBtn'); if (!b) return; const k = state && gameInProgress ? skillKey() : null;
  b.classList.toggle('hidden', !k); if (k) { const S = SKILLS[k], R = CH.run, left = k === 'chrono' ? (R.uses >= 1 + sigAdd('rewind') && ADM.cd >= 1 ? -1 : R.cdLeft) : R.cdLeft; b.className = left > 0 || left < 0 ? 'cd' : 'rdy'; b.textContent = S.ic + ' ' + S.n + (left > 0 ? ' (' + left + ')' : left < 0 ? ' (ใช้แล้ว)' : ' [Q]'); }
  if (state) { document.querySelectorAll('#plantStrip .chip').forEach(c => c.classList.remove('risk')); if (stacksOf('warn')) { let best = null, lv = -1; Object.keys(EVENT_DEFS).forEach(kk => { const p = state.plants[kk]; if (p && p.on && p.unlocked && hazKey(kk) > 0 && p.level > lv) { lv = p.level; best = kk; } }); const c = best && document.querySelector('#plantStrip .chip[data-k="' + best + '"]'); if (c) c.classList.add('risk'); } }
});
/* ---------- แท็บการ์ด/ทีมในรอบ ---------- */
window.renderCards = function () {
  const body = byId('cardsBody'); if (!body || !state || !CH.active) return; const a = CH.active, c = CHARS[a.main];
  const inc = perkMul('inc'), cost = perkMul('cost'), haz = perkMul('haz') * bossMul('haz'), dem = perkMul('dem') * bossMul('dem') * mapDem() * (1 + .04 * (state.wave || 0)), bat = perkMul('bat');
  const picked = {}; (state.perks || []).forEach(p => { (picked[p.id] = picked[p.id] || { p, n: 0 }).n++; });
  const rows = Object.values(picked).map(({ p, n }) => '<div class="crow"><span class="ci">' + p.ic + '</span><div><b>' + p.n + '</b><small>' + p.d + '</small>' + (p.max ? '<div class="pips">' + Array.from({ length: p.max }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div>' : '') + '</div><strong>×' + n + (p.max && n >= p.max ? '<small>เต็ม</small>' : '') + '</strong></div>').join('') || '<div class="crow"><div>ยังไม่ได้เลือกการ์ด</div></div>';
  body.innerHTML = '<div class="teamrow"><div class="tbox">' + charSvg(c, { bust: true, still: true }) + '<b>' + c.n + '</b><small>' + c.stxt + '</small></div>' + a.helpers.map(h => '<div class="tbox h">' + charSvg(CHARS[h], { bust: true, still: true }) + '<b>' + CHARS[h].n + '</b><small>ผู้ช่วย 40%</small></div>').join('') + '</div>' +
    '<div class="sumgrid"><div>💰 รายได้<b>' + pct(inc) + '</b></div><div>🛠 ค่าเดินเครื่อง<b>' + pct(cost) + '</b></div><div>💥 โอกาสระเบิด<b>' + pct(haz) + '</b></div><div>🏙 ดีมานด์เมือง<b>' + pct(dem) + '</b></div><div>🔋 ความจุแบต<b>' + pct(bat) + '</b></div><div>🌊 Wave<b>' + (state.wave || 0) + '</b></div><div>🗺 แผนที่<b>' + curMap().n + '</b></div><div>🔥 คอมโบสูงสุด<b>' + (state.maxStreak || 0) + '</b></div></div><h3>การ์ดที่เลือกในรอบนี้</h3>' + rows;
};
