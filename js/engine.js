/* VoltRush — js/engine.js : ตัวจำลองเกม: tick, demand, hazard, supply, คะแนน, เงิน */

function updateDayNight() { const cycle = 50; state.isDay = (state.elapsed % cycle) < cycle / 2; }
function dayNightRemaining() { const cycle = 50, half = 25; const phase = state.elapsed % cycle; return state.isDay ? (half - phase) : (cycle - phase); }

function updatePeakSchedule() {
  if (state.peakActive) {
    state.peakTimer--;
    if (state.peakTimer <= 0) { state.peakActive = false; state.nextPeakIn = Math.max(4, Math.round((12 + Math.floor(RNG.f('peak') * 10)) / EVENT_FREQ_MULT)); }
    return;
  }
  state.nextPeakIn--;
  if (state.nextPeakIn <= 0) { state.peakActive = true; state.peakTimer = 10; }
}

function updateWeatherSchedule() {
  state.nextWeatherIn--;
  if (state.nextWeatherIn <= 0) {
    state.weather = state.nextWeatherValue;
    state.nextWeatherValue = randomWeatherExcept(state.weather);
    state.nextWeatherIn = Math.max(4, Math.round((10 + Math.floor(RNG.f('weather') * 8)) / EVENT_FREQ_MULT));
  }
}

function updateDemand() {
  state.prevDemand = state.demand;
  const mult = getCityDemandMult(state.cityLevel);
  let base = 50 + 15 * (Math.round(Math.sin(state.elapsed / 35) * 1000) / 1000) + (RNG.f('demand') * 4 - 2);
  if (state.peakActive) base += 30;
  base *= mult;
  state.demand = Math.max(Math.round(20 * mult), Math.round(base));
}

function updateBuffs() {
  if (state.activeBuff) {
    state.activeBuff.timeLeft--;
    if (state.activeBuff.timeLeft <= 0) {
      showToast(state.activeBuff.def.name + ' สิ้นสุดลงแล้ว');
      state.activeBuff = null;
    }
    return;
  }
  if (state.activeHazard) return;
  if (RNG.f('buff') < 0.0035 * EVENT_FREQ_MULT) {
    const keys = Object.keys(BUFF_DEFS);
    const pick = keys[Math.floor(RNG.f('buff') * keys.length)];
    const def = BUFF_DEFS[pick];
    if (def.duration === 0) {
      const amt = 80 + Math.floor(RNG.f('buff') * 70);
      state.money += amt;
      sndBuff();
      showToast(def.icon + ' ' + def.name + '! ได้รับ +' + amt + ' บาท');
      flashMoney(true);
    } else {
      state.activeBuff = { type: pick, timeLeft: def.duration, def: def };
      sndBuff();
      showToast(def.icon + ' ' + def.name + '! ' + def.desc);
    }
  }
}

function updateCooldowns() {
  PLANT_DEFS.forEach(def => {
    const p = state.plants[def.key];
    if (p.cooldown > 0) {
      p.cooldown--;
      if (p.cooldown === 0) showToast('ซ่อม' + def.name + 'เสร็จแล้ว! ใช้งานได้ตามปกติ');
    }
  });
}

function updatePlantHiccups() {
  PLANT_DEFS.forEach(def => {
    const p = state.plants[def.key];
    if (!p.unlocked) return;
    if (p.debuff) {
      p.debuff.timeLeft--;
      if (p.debuff.timeLeft <= 0) { showToast(def.name + ' กลับมาทำงานปกติแล้ว'); p.debuff = null; }
      return;
    }
    if (!p.on || p.cooldown > 0) return;
    if (state.activeHazard && state.activeHazard.key === def.key) return;
    if (RNG.f('hiccup') < 0.0035 * EVENT_FREQ_MULT) {
      const type = RNG.f('hiccup') < 0.5 ? 'outage' : 'reduced';
      const dur = type === 'outage' ? (8 + Math.floor(RNG.f('hiccup') * 7)) : (10 + Math.floor(RNG.f('hiccup') * 9));
      p.debuff = { type: type, timeLeft: dur };
      if (type === 'outage') showToast(def.name + ' หยุดทำงานชั่วคราว (บำรุงรักษา) ' + dur + ' วิ');
      else showToast(def.name + ' ผลิตไฟลดลงชั่วคราวเหลือครึ่งหนึ่ง ' + dur + ' วิ');
    }
  });
}

function updatePlantOutputs() {
  PLANT_DEFS.forEach(def => {
    const p = state.plants[def.key];
    if (!p.on || !p.unlocked || p.cooldown > 0) { p.output = 0; return; }
    const eff = getEffective(def, p.level);
    if (def.type === 'constant') {
      p.output = eff.capacity;
    } else if (def.type === 'solar') {
      let b = state.isDay ? eff.dayCapacity : 0;
      if (state.isDay && state.weather === 'cloudy') b *= 0.4;
      if (state.activeBuff && state.activeBuff.type === 'solarBoost') b *= 1.6;
      p.output = Math.round(b);
    } else if (def.type === 'wind') {
      state.windLevel += (RNG.f('wind') - 0.5) * 0.15;
      state.windLevel = Math.max(0, Math.min(1, state.windLevel));
      let range = [10, 22];
      if (state.weather === 'windy') range = [18, 32];
      if (state.weather === 'calm') range = [4, 12];
      range = [Math.round(range[0] * eff.mult), Math.round(range[1] * eff.mult)];
      let out = range[0] + state.windLevel * (range[1] - range[0]);
      if (state.activeBuff && state.activeBuff.type === 'windBoost') out *= 1.6;
      p.output = Math.round(out);
    }
    if (p.debuff && p.debuff.type === 'outage') p.output = 0;
    else if (p.debuff && p.debuff.type === 'reduced') p.output = Math.round(p.output * 0.5);
  });
}

function checkHazardEvents() {
  if (state.activeHazard) {
    const h = state.activeHazard;
    const p = state.plants[h.key];
    if (!p.on) {
      p.cooldown = h.def.cooldown;
      showToast('ปิด' + PLANT_MAP[h.key].name + 'ได้ทันเวลา! โรงไฟฟ้าจะซ่อมแซมชั่วคราว ' + h.def.cooldown + ' วิ');
      state.activeHazard = null;
      return false;
    }
    h.timeLeft--;
    if (h.timeLeft <= 0) { explodeNow(h); return true; }
    return false;
  }
  const safeMult = (state.activeBuff && state.activeBuff.type === 'safeZone') ? 0.15 : 1;
  const graceMult = state.elapsed < GRACE_PERIOD ? 0 : 1;
  if (graceMult === 0) return false;
  const eligible = Object.keys(EVENT_DEFS).filter(k => state.plants[k] && state.plants[k].on && state.plants[k].unlocked && state.plants[k].cooldown === 0 && !state.plants[k].debuff);
  for (let i = 0; i < eligible.length; i++) {
    if (state.activeHazard) break;
    const k = eligible[i];
    const p = state.plants[k];
    const eff = getEffective(PLANT_MAP[k], p.level);
    const chance = 0.004 * eff.mult * safeMult * EVENT_FREQ_MULT * getCityHazardMult(state.cityLevel);
    if (RNG.f('hazard') < Math.min(0.06, chance)) {
      const def = EVENT_DEFS[k];
      state.activeHazard = { key: k, timeLeft: def.duration, def: def };
      sndHazard();
      showToast(def.warn + ' ' + def.resolve);
    }
  }
  return false;
}
function explodeNow(h) {
  if (gameTimerId) { clearInterval(gameTimerId); gameTimerId = null; }
  state.activeHazard = null;
  sndExplosion();
  endGame(h.def.gameOverText);
}

function computeSupply() {
  const gross = PLANT_DEFS.reduce((s, def) => s + state.plants[def.key].output, 0);
  state.grossSupply = gross;
  const b = state.battery;
  const beff = getBatteryEffective(b.level);
  let net = gross, cleanFromBattery = 0;

  if (b.unlocked && !state.prepping && b.mode === 'charge') {
    const surplus = Math.max(0, gross - state.demand);
    const amt = Math.min(beff.chargeRate, beff.capacity - b.current, surplus);
    b.current += amt; net = gross - amt;
  } else if (b.unlocked && !state.prepping && b.mode === 'discharge') {
    const amt = Math.min(beff.dischargeRate, b.current);
    b.current -= amt; net = gross + amt; cleanFromBattery = amt;
  }
  state.netSupply = Math.round(net);
  return cleanFromBattery;
}

function updateScoreAndBlackout(cleanFromBattery) {
  const scoreMult = getCityScoreMult(state.cityLevel);
  const met = state.netSupply >= state.demand;
  const satDelta = (met ? 8 : -6) * scoreMult;
  state.breakdown.satisfaction += satDelta;

  const clean = PLANT_DEFS.filter(d => d.carbonRate === 0).reduce((s, def) => s + state.plants[def.key].output, 0) + cleanFromBattery;
  const served = Math.min(state.netSupply, state.demand);   // โบนัสสะอาดนับเฉพาะไฟที่ใช้จริง ผลิตเกินไม่ได้เพิ่ม
  const cleanDelta = served * Math.min(1, clean / Math.max(1, state.netSupply)) * 0.25 * scoreMult;
  state.breakdown.cleanBonus += cleanDelta;

  const carbon = PLANT_DEFS.reduce((s, def) => {
    const p = state.plants[def.key];
    if (!p.on || !p.unlocked) return s;
    return s + getEffective(def, p.level).carbonRate;
  }, 0);
  const carbonDelta = carbon * 0.8;
  state.breakdown.carbonPenalty += carbonDelta;

  const threshold = getEffectiveBlackoutThreshold();
  if (met) { state.consecutiveShortage = 0; } else { state.consecutiveShortage++; }
  state.blackoutActive = state.consecutiveShortage >= threshold;

  let blackoutDelta = 0;
  if (state.consecutiveShortage === threshold) {
    state.blackoutEvents++;
    const hit = 100 * scoreMult;
    state.breakdown.blackoutPenalty += hit;
    blackoutDelta += hit;
    sndBlackout();
    showToast('⚠️ ไฟดับ! เมืองขาดแคลนพลังงาน (-' + Math.round(hit) + ' คะแนน)');
    spawnScorePopup(-hit);
  }
  if (state.blackoutActive) {
    const ongoing = 10 * scoreMult;
    state.breakdown.blackoutPenalty += ongoing;
    blackoutDelta += ongoing;
  }

  state.lastRate = { satisfaction: satDelta, clean: cleanDelta, carbon: carbonDelta, blackout: blackoutDelta };

  const netDelta = satDelta + cleanDelta - carbonDelta - blackoutDelta;
  if (Math.abs(netDelta) >= 12) spawnScorePopup(netDelta);
}

function updateMoney() {
  let income = 0, expense = 0;
  PLANT_DEFS.forEach(def => {
    const p = state.plants[def.key];
    if (p.on && p.unlocked && p.cooldown === 0) { const eff = getEffective(def, p.level); income += eff.income; expense += eff.runCost; }
  });
  const b = state.battery;
  if (b.unlocked) {
    const beff = getBatteryEffective(b.level);
    if (b.mode === 'charge') expense += BATTERY_DEF.chargeCost;
    if (b.mode === 'discharge') income += beff.dischargeIncome;
  }
  if (state.activeBuff && state.activeBuff.type === 'goldenHour') income *= 2;
  if (state.blackoutActive) income = Math.floor(income * 0.3);   // ไฟดับยังเหลือรายได้ 30% กันวงจรเลวร้าย
  state.money = Math.max(0, state.money + income - expense);
}

function maybeShowRandomTip() {
  state.lastTipTimer--;
  if (state.lastTipTimer <= 0) {
    const key = randomTipKeys[Math.floor(Math.random() * randomTipKeys.length)];
    showToast(tips[key]);
    state.lastTipTimer = 22 + Math.floor(Math.random() * 14);
  }
}

function currentScore() {
  if (state.prepping) return 0;
  const bd = state.breakdown;
  const raw = bd.satisfaction + bd.cleanBonus - bd.carbonPenalty - bd.blackoutPenalty;
  const moneyBonus = state.finished ? Math.min(state.money * 0.5, Math.max(0, raw) * 0.1) : 0;   // เงินคิดตอนจบเท่านั้น เพดาน 10%
  return Math.max(0, Math.round(raw + moneyBonus));
}

function gameTick() {
  if (state.prepping) {
    state.prepTime--;
    updatePlantOutputs();
    computeSupply();
    if (state.prepTime <= 0) { state.prepping = false; showToast('เริ่มนับเวลาแข่งจริงแล้ว! สู้ๆ'); }
    renderGame();
    return;
  }

  state.elapsed++;
  if (!state.infinite) state.timeLeft--;

  updateDayNight();
  updatePeakSchedule();
  updateWeatherSchedule();
  updateDemand();
  updateBuffs();
  updateCooldowns();
  updatePlantHiccups();
  updatePlantOutputs();

  const exploded = checkHazardEvents();
  if (exploded) return;

  const cleanFromBattery = computeSupply();
  updateScoreAndBlackout(cleanFromBattery);
  updateMoney();
  if (state.hunt && huntTick()) return;
  maybeShowRandomTip();

  renderGame();

  if (!state.infinite && state.timeLeft <= 0) {
    clearInterval(gameTimerId); gameTimerId = null; endGame();
  }
}
