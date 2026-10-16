/* VoltRush — js/formulas.js : สูตรคำนวณ: ระดับ, ค่าอัพเกรด, ค่าตัวคูณเมือง */

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
