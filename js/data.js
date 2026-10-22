let TOTAL_TIME = 180;
let selectedDuration = 180;
const LB_PREFIX = 'energyMgmtScoresV7_';
const START_MONEY = 260;
const BLACKOUT_THRESHOLD = 6;
const PREP_TIME = 15;
const GRACE_PERIOD = 22;

let selectedFreqKey = 'normal'; // เลิกใช้แล้ว (ความยากตามเวลาแทน)
let EVENT_FREQ_MULT = 1; // ปรับอัตโนมัติตาม wave ใน difficulty.js

const tips = {
  coal: "โรงไฟฟ้าถ่านหิน: ผลิตไฟฟ้าได้เยอะและเสถียร แต่ปล่อยคาร์บอนไดออกไซด์สูงมาก มีผลต่อภาวะโลกร้อน",
  solar: "โซลาร์เซลล์: พลังงานสะอาด ไม่มีคาร์บอน แต่ผลิตไฟได้เฉพาะช่วงกลางวันเท่านั้น",
  wind: "กังหันลม: พลังงานสะอาด ไม่มีคาร์บอน แต่กำลังผลิตขึ้นอยู่กับความแรงของลมที่ไม่แน่นอน",
  gas: "ก๊าซธรรมชาติ: ปล่อยคาร์บอนน้อยกว่าถ่านหินและเปิด-ปิดได้รวดเร็ว เหมาะเสริมช่วงความต้องการพุ่งสูง",
  hydro: "พลังน้ำ: พลังงานสะอาดที่ผลิตไฟฟ้าได้สม่ำเสมอตลอดเวลา ไม่ขึ้นกับแดดหรือลม แต่ต้นทุนก่อสร้างสูง",
  geothermal: "พลังงานความร้อนใต้พิภพ: ดึงความร้อนจากใต้ดินมาผลิตไฟฟ้าได้ตลอด 24 ชั่วโมง สะอาดและเสถียร แต่สร้างได้เฉพาะพื้นที่ที่มีความร้อนใต้ดินสูง",
  biomass: "พลังงานชีวมวล: ผลิตไฟจากวัสดุเหลือใช้ทางการเกษตร เป็นพลังงานหมุนเวียนแต่ยังปล่อยคาร์บอนบ้างจากการเผาไหม้",
  tidal: "พลังงานคลื่นและน้ำขึ้นน้ำลง: ใช้แรงจากมหาสมุทรผลิตไฟฟ้าได้อย่างสม่ำเสมอ เป็นเทคโนโลยีที่กำลังพัฒนาในหลายประเทศ",
  nuclear: "พลังงานนิวเคลียร์: ปล่อยคาร์บอนต่ำมากและผลิตไฟได้มหาศาลอย่างสม่ำเสมอ แต่ต้องจัดการกากกัมมันตรังสีและความปลอดภัยอย่างระมัดระวัง",
  hydrogen: "เซลล์เชื้อเพลิงไฮโดรเจน: เปลี่ยนไฮโดรเจนเป็นไฟฟ้าโดยปล่อยแค่น้ำ ถือเป็นพลังงานสะอาดแห่งอนาคต แต่ก๊าซไฮโดรเจนติดไฟง่าย",
  fusion: "พลังงานฟิวชัน: เทคโนโลยีแห่งอนาคตที่เลียนแบบปฏิกิริยาในดวงอาทิตย์ ให้พลังงานสะอาดปริมาณมหาศาล ปัจจุบันยังอยู่ระหว่างการวิจัย",
  battery: "แบตเตอรี่ ESS: เก็บไฟฟ้าส่วนเกินไว้ใช้ตอนความต้องการพุ่งสูง ช่วยลดปัญหาไฟดับได้มาก",
  kwmw: "ความรู้ไฟฟ้า: 1 เมกะวัตต์ (MW) เท่ากับ 1,000 กิโลวัตต์ (kW) ใช้วัดกำลังการผลิต/ใช้ไฟฟ้า",
  peak: "Peak Load คือช่วงเวลาที่ความต้องการใช้ไฟฟ้าพุ่งสูงสุด มักเกิดตอนเย็นที่คนเปิดแอร์พร้อมกันจำนวนมาก",
  renewable: "พลังงานหมุนเวียน (โซลาร์, ลม, น้ำ) ผลิตซ้ำได้ไม่มีวันหมด ต่างจากฟอสซิล (ถ่านหิน, ก๊าซ) ที่ใช้แล้วหมดไป",
  money: "แต่ละโรงไฟฟ้าให้รายได้ไม่เท่ากันเมื่อเปิดใช้งาน กด ⓘ ดูรายละเอียดรายได้ของแต่ละโรงไฟฟ้าได้เลย!"
};
const randomTipKeys = ['kwmw', 'peak', 'renewable'];

const PLANT_DEFS = [
  { key: 'coal',       icon: '🏭', name: 'ถ่านหิน',                 type: 'constant', unlocked: true,  cost: 0,   capacity: 35, carbonRate: 6, runCost: 2, income: 5,  accent: '#ff6b6b' },
  { key: 'gas',        icon: '🔥', name: 'ก๊าซธรรมชาติ',            type: 'constant', unlocked: false, cost: 150, capacity: 28, carbonRate: 3, runCost: 1, income: 4,  accent: '#ff9f4a' },
  { key: 'solar',      icon: '☀️', name: 'โซลาร์เซลล์',             type: 'solar',    unlocked: true,  cost: 0,   dayCapacity: 26, carbonRate: 0, runCost: 0, income: 3,  accent: '#ffd166' },
  { key: 'wind',       icon: '💨', name: 'กังหันลม',                 type: 'wind',     unlocked: false, cost: 100, carbonRate: 0, runCost: 0, income: 3,  accent: '#38b6ff' },
  { key: 'hydro',      icon: '🌊', name: 'พลังน้ำ',                   type: 'constant', unlocked: false, cost: 220, capacity: 22, carbonRate: 0, runCost: 0, income: 4,  accent: '#4ad0ff' },
  { key: 'geothermal', icon: '🌋', name: 'ความร้อนใต้พิภพ',          type: 'constant', unlocked: false, cost: 260, capacity: 20, carbonRate: 0, runCost: 0, income: 4,  accent: '#ff8c42' },
  { key: 'biomass',    icon: '🌾', name: 'ชีวมวล',                   type: 'constant', unlocked: false, cost: 130, capacity: 22, carbonRate: 2, runCost: 1, income: 3,  accent: '#8bc34a' },
  { key: 'tidal',      icon: '🌀', name: 'คลื่น/น้ำขึ้นน้ำลง',       type: 'constant', unlocked: false, cost: 280, capacity: 18, carbonRate: 0, runCost: 0, income: 4,  accent: '#26c6da' },
  { key: 'nuclear',    icon: '☢️', name: 'นิวเคลียร์',                type: 'constant', unlocked: false, cost: 500, capacity: 50, carbonRate: 0, runCost: 2, income: 8,  accent: '#b388ff' },
  { key: 'hydrogen',   icon: '💠', name: 'เซลล์เชื้อเพลิงไฮโดรเจน', type: 'constant', unlocked: false, cost: 350, capacity: 24, carbonRate: 0, runCost: 1, income: 5,  accent: '#64b5f6' },
  { key: 'fusion',     icon: '⚛️', name: 'ฟิวชัน (อนาคต)',          type: 'constant', unlocked: false, cost: 600, capacity: 60, carbonRate: 0, runCost: 0, income: 10, accent: '#ff4fd8' }
];
const BATTERY_DEF = { key: 'battery', icon: '🔋', name: 'แบตเตอรี่ ESS', cost: 150, capacity: 100, chargeRate: 6, dischargeRate: 9, chargeCost: 1, dischargeIncome: 3 };
const PLANT_MAP = {};
PLANT_DEFS.forEach(d => PLANT_MAP[d.key] = d);

const EVENT_DEFS = {
  coal:     { icon: '🏭', name: 'หม้อไอน้ำแรงดันเกิน',      warn: 'แรงดันในหม้อไอน้ำถ่านหินสูงเกินขีดจำกัด!',            resolve: 'ปิดโรงไฟฟ้าถ่านหินทันทีเพื่อลดแรงดัน!',              duration: 11, cooldown: 20, gameOverText: 'หม้อไอน้ำระเบิด! ความเสียหายรุนแรงต่อโรงไฟฟ้าและพื้นที่โดยรอบ เกมจบลงทันที' },
  gas:      { icon: '🔥', name: 'ท่อก๊าซรั่ว',               warn: 'ตรวจพบก๊าซธรรมชาติรั่วไหล เสี่ยงเกิดเพลิงไหม้!',        resolve: 'ปิดโรงไฟฟ้าก๊าซธรรมชาติทันที!',                       duration: 9,  cooldown: 18, gameOverText: 'ก๊าซรั่วเกิดระเบิด! เพลิงไหม้ลุกลามทั่วโรงไฟฟ้า เกมจบลงทันที' },
  nuclear:  { icon: '☢️', name: 'อุณหภูมิเตาปฏิกรณ์ผิดปกติ', warn: 'เตาปฏิกรณ์นิวเคลียร์ร้อนเกินขีดจำกัด กำลังจะหลอมละลาย!', resolve: 'ปิดโรงไฟฟ้านิวเคลียร์ทันทีเพื่อหลีกเลี่ยงหายนะ!',       duration: 11, cooldown: 30, gameOverText: 'เตาปฏิกรณ์นิวเคลียร์หลอมละลาย! กัมมันตรังสีรั่วไหลปกคลุมเมือง เกมจบลงทันที' },
  hydrogen: { icon: '💠', name: 'ถังไฮโดรเจนรั่ว',           warn: 'ตรวจพบไฮโดรเจนรั่วไหลจากถังเก็บ เสี่ยงระเบิด!',          resolve: 'ปิดโรงไฟฟ้าเซลล์เชื้อเพลิงไฮโดรเจนทันที!',             duration: 9,  cooldown: 18, gameOverText: 'ถังไฮโดรเจนระเบิด! แรงระเบิดทำลายโครงสร้างโดยรอบ เกมจบลงทันที' },
  fusion:   { icon: '⚛️', name: 'สนามพลาสมาไม่เสถียร',      warn: 'ระบบกักเก็บพลาสมาฟิวชันไม่เสถียร กำลังจะเสียการควบคุม!', resolve: 'ปิดโรงไฟฟ้าฟิวชันทันทีเพื่อรีเซ็ตระบบ!',               duration: 11, cooldown: 30, gameOverText: 'ปฏิกิริยาฟิวชันหลุดควบคุม! พลังงานมหาศาลปลดปล่อยออกมา เกมจบลงทันที' }
};

const BUFF_DEFS = {
  goldenHour: { icon: '🌟', name: 'ช่วงเวลาทอง',      desc: 'รายได้จากทุกโรงไฟฟ้าเพิ่มขึ้น 2 เท่า!',            duration: 15 },
  windBoost:  { icon: '💨', name: 'ลมแรงพิเศษ',        desc: 'กังหันลมผลิตไฟเพิ่มขึ้น 60% ชั่วคราว',              duration: 15 },
  solarBoost: { icon: '☀️', name: 'แดดจัดพิเศษ',       desc: 'โซลาร์เซลล์ผลิตไฟเพิ่มขึ้น 60% ชั่วคราว',           duration: 15 },
  safeZone:   { icon: '🛡️', name: 'ช่วงเวลาปลอดภัย',   desc: 'โอกาสเกิดเหตุฉุกเฉินลดลงมากชั่วคราว',              duration: 20 },
  freeMoney:  { icon: '💰', name: 'เงินอุดหนุนพิเศษ',   desc: 'ได้รับเงินก้อนฟรีทันที',                            duration: 0 }
};

const PLANT_TITLES = ['มือใหม่', 'ฝึกหัด', 'ชำนาญการ', 'ผู้เชี่ยวชาญ', 'ปรมาจารย์', 'ตำนาน', 'เทพเจ้าพลังงาน'];
const CITY_TITLES = ['หมู่บ้านเล็ก', 'ตำบล', 'เมืองเล็ก', 'เมืองขนาดกลาง', 'นครใหญ่', 'มหานคร', 'อภิมหานคร'];
const CITY_BUILDINGS = ['🏠🏡🏠', '🏘️🏠🏡🏘️', '🏘️🏠🏢🏬🏠', '🏢🏬🏠🏢🏫🏠🏢', '🏙️🏢🏬🏙️🏫🏢', '🏙️🏙️🏢🏬🏙️🏫🏢🏙️', '🌆🏙️🏙️🏢🏬🏙️🏫🏢🏙️🌆'];
const WEATHER_ICONS = { clear: '🌤️', cloudy: '☁️', windy: '🌬️', calm: '🍃' };
const WEATHER_LABELS = { clear: 'อากาศแจ่มใส', cloudy: 'มีเมฆบัง', windy: 'ลมแรง', calm: 'ลมสงบ' };

function weatherIcon(w) { return WEATHER_ICONS[w] || '🌤️'; }
function weatherLabel(w) { return WEATHER_LABELS[w] || w; }
function getPlantTitle(level) { return level <= PLANT_TITLES.length ? PLANT_TITLES[level - 1] : 'เทพเจ้าพลังงาน Lv.' + level; }
function getCityTitle(level) { return level <= CITY_TITLES.length ? CITY_TITLES[level - 1] : 'อภิมหานคร Lv.' + level; }
function getCityBuildings(level) { return CITY_BUILDINGS[Math.min(level, CITY_BUILDINGS.length) - 1]; }
function getLevelMult(level) { return 1 + (level - 1) * 0.5; }
function getPlantUpgradeCost(def, level) { const base = Math.max(80, def.cost); return Math.round(base * (0.85 + level * 0.7)); }
function getCityDemandMult(level) { return 1 + (level - 1) * 0.4; }
function getCityScoreMult(level) { return 1 + (level - 1) * 0.3; }
function getCityUpgradeCost(level) { return Math.round(300 * (1 + (level - 1) * 0.8)); }
function getCityHazardMult(level) { return 1 + (level - 1) * 0.25; }
function getCityBlackoutThreshold(level) { return Math.max(3, BLACKOUT_THRESHOLD - Math.floor((level - 1) / 2)); }
function getEffectiveBlackoutThreshold() { return getCityBlackoutThreshold(state.cityLevel) + (state.elapsed < GRACE_PERIOD ? 3 : 0); }

function getEffective(def, level) {
  const mult = getLevelMult(level || 1);
  return {
    capacity: def.capacity !== undefined ? Math.round(def.capacity * mult) : undefined,
    dayCapacity: def.dayCapacity !== undefined ? Math.round(def.dayCapacity * mult) : undefined,
    mult: mult,
    income: Math.round(def.income * mult),
    runCost: Math.round(def.runCost * mult),
    carbonRate: Math.round(def.carbonRate * mult)
  };
}
function getBatteryEffective(level) {
  const mult = getLevelMult(level || 1);
  return {
    capacity: Math.round(BATTERY_DEF.capacity * mult),
    chargeRate: Math.round(BATTERY_DEF.chargeRate * mult),
    dischargeRate: Math.round(BATTERY_DEF.dischargeRate * mult),
    dischargeIncome: Math.round(BATTERY_DEF.dischargeIncome * mult)
  };
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function getShiftedDate(d) { return new Date(d.getTime() - 12 * 60 * 60 * 1000); }
function getDateKey(rawD) { const d = getShiftedDate(rawD); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function getWeekKey(rawD) {
  const d = getShiftedDate(rawD);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return date.getUTCFullYear() + '-W' + pad2(week);
}
/* Daily board resets at noon (not midnight); weekly resets Monday noon.
   Shifting the timestamp back 12h before computing the calendar-day /
   ISO-week key moves both reset points from 00:00 to 12:00 automatically. */
let rng = Math.random;
function randomWeatherExcept(exclude) {
  const options = ['clear', 'clear', 'cloudy', 'windy', 'calm'];
  let w = options[Math.floor(rng() * options.length)];
  let tries = 0;
  while (w === exclude && tries < 5) { w = options[Math.floor(rng() * options.length)]; tries++; }
  return w;
}

