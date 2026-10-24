let state = null;
let gameTimerId = null;
let scoreSavedThisRound = false;
let gameInProgress = false;
window.addEventListener('beforeunload', function (e) {
  if (gameInProgress) { e.preventDefault(); e.returnValue = ''; return ''; }
});

function selectDuration(sec) {
  selectedDuration = sec;
  document.querySelectorAll('#durationOptions .dur-btn').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.sec) === sec));
}

function freshState() {
  const plants = {};
  PLANT_DEFS.forEach(d => { plants[d.key] = { on: d.unlocked, output: 0, unlocked: d.unlocked, tipShown: d.unlocked, level: 1, cooldown: 0, debuff: null }; });
  return {
    timeLeft: TOTAL_TIME, infinite: TOTAL_TIME === 0, elapsed: 0, money: START_MONEY,
    prepping: true, prepTime: PREP_TIME,
    isDay: true, weather: 'clear', nextWeatherValue: randomWeatherExcept('clear'), windLevel: 0.4, demand: 50, prevDemand: 50,
    peakActive: false, peakTimer: 0,
    nextPeakIn: Math.max(4, Math.round((26 + Math.floor(rng() * 10)) / EVENT_FREQ_MULT)),
    nextWeatherIn: Math.max(4, Math.round((8 + Math.floor(rng() * 6)) / EVENT_FREQ_MULT)),
    plants: plants,
    battery: { mode: 'off', unlocked: false, tipShown: false, level: 1, current: 0 },
    cityLevel: 1,
    grossSupply: 0, netSupply: 0, consecutiveShortage: 0, blackoutActive: false, blackoutEvents: 0,
    activeHazard: null, activeBuff: null,
    lastTipTimer: 20, lastRate: null,
    breakdown: { satisfaction: 0, cleanBonus: 0, carbonPenalty: 0, blackoutPenalty: 0 }
  };
}

function startGame() {
  TOTAL_TIME = selectedDuration;
  EVENT_FREQ_MULT = 1;
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('endScreen').classList.add('hidden');
  document.getElementById('countdownScreen').classList.remove('hidden');
  runCountdown();
}

function runCountdown() {
  let n = 3;
  const el = document.getElementById('countdownNum');
  el.textContent = n;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'pop .8s ease';
  const cd = setInterval(() => {
    n--;
    if (n > 0) { el.textContent = n; sndCountdownTick(); }
    else if (n === 0) { el.textContent = 'เริ่ม!'; sndCountdownGo(); }
    else {
      clearInterval(cd);
      document.getElementById('countdownScreen').classList.add('hidden');
      actuallyStartGame();
      return;
    }
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'pop .8s ease';
  }, 800);
}

function actuallyStartGame() {
  state = freshState();
  gameInProgress = true;
  scoreSavedThisRound = false;
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById('skyBackground').classList.remove('hidden');
  document.getElementById('cityVisual').classList.remove('blackout', 'night');
  document.getElementById('stopBtn').classList.toggle('hidden', !state.infinite);
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
  const musicBtn = document.getElementById('musicToggleBtn');
  if (musicBtn) musicBtn.textContent = musicEnabled ? '🎵' : '🔕';
  initSky();
  renderGame();
  gameTimerId = setInterval(gameTick, 1000);
  showToast("เกมเริ่มแล้ว! เดี๋ยวจะพาชมส่วนต่างๆ ในเกมก่อนนะ");
  pauseGame();
  startCoachTutorial();
  startBackgroundMusic();
  startShootingStars();
}

function manualEndGame() {
  if (!confirm('ต้องการจบเกมตอนนี้เลยหรือไม่? การกระทำนี้ย้อนกลับไม่ได้')) return;
  if (gameTimerId) { clearInterval(gameTimerId); gameTimerId = null; }
  endGame();
}
function skipPrep() {
  if (state && state.prepping) {
    state.prepping = false;
    showToast('เริ่มนับเวลาแข่งจริงแล้ว! สู้ๆ');
    renderGame();
  }
}

function flashMoney(ok) {
  ['moneyChip', 'moneyChipPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('money-flash-success', 'money-flash-fail');
    void el.offsetWidth;
    el.classList.add(ok ? 'money-flash-success' : 'money-flash-fail');
  });
}

function togglePlant(key) {
  const p = state.plants[key];
  if (!p.unlocked) return;
  if (p.cooldown > 0) { showToast('' + PLANT_MAP[key].name + ' กำลังซ่อมแซมอยู่ อีก ' + p.cooldown + ' วิ'); sndError(); return; }
  p.on = !p.on;
  if (p.on) sndToggleOn(); else sndToggleOff();
  if (p.on && !p.tipShown) { showToast(tips[key]); p.tipShown = true; }
  renderGame();
}

function setBatteryMode(target) {
  const b = state.battery;
  if (!b.unlocked) return;
  b.mode = (b.mode === target) ? 'off' : target;
  if (b.mode === 'off') sndToggleOff(); else sndToggleOn();
  if (b.mode !== 'off' && !b.tipShown) { showToast(tips.battery); b.tipShown = true; }
  renderGame();
}

function buyPlant(key) {
  if (key === 'battery') {
    const b = state.battery;
    if (b.unlocked) return;
    if (state.money < BATTERY_DEF.cost) { showToast('เงินไม่พอ ต้องการ ' + BATTERY_DEF.cost + ' บาท (มี ' + Math.round(state.money) + ' บาท)'); flashMoney(false); sndError(); return; }
    state.money -= BATTERY_DEF.cost;
    b.unlocked = true;
    flashMoney(true);
    sndBuy();
    showToast('ปลดล็อก แบตเตอรี่ ESS แล้ว! ' + tips.battery);
    renderGame();
    return;
  }
  const def = PLANT_MAP[key];
  const p = state.plants[key];
  if (!def || p.unlocked) return;
  if (state.money < def.cost) { showToast('เงินไม่พอ ต้องการ ' + def.cost + ' บาท (มี ' + Math.round(state.money) + ' บาท)'); flashMoney(false); sndError(); return; }
  state.money -= def.cost;
  p.unlocked = true;
  p.on = true;
  p.tipShown = true;
  flashMoney(true);
  sndBuy();
  showToast('ปลดล็อก ' + def.name + ' แล้ว! ' + (tips[key] || ''));
  renderGame();
}

function upgradePlant(key) {
  if (key === 'battery') {
    const b = state.battery;
    if (!b.unlocked) return;
    const cost = getPlantUpgradeCost(BATTERY_DEF, b.level);
    if (state.money < cost) { showToast('เงินไม่พอสำหรับอัพเกรด ต้องการ ' + cost + ' บาท'); flashMoney(false); sndError(); return; }
    state.money -= cost;
    b.level++;
    flashMoney(true);
    sndUpgrade();
    showToast('อัพเกรดแบตเตอรี่ ESS เป็นระดับ "' + getPlantTitle(b.level) + '" แล้ว!');
    renderGame();
    return;
  }
  const def = PLANT_MAP[key];
  const p = state.plants[key];
  if (!p.unlocked) return;
  const cost = getPlantUpgradeCost(def, p.level);
  if (state.money < cost) { showToast('เงินไม่พอสำหรับอัพเกรด ต้องการ ' + cost + ' บาท'); flashMoney(false); sndError(); return; }
  state.money -= cost;
  p.level++;
  flashMoney(true);
  sndUpgrade();
  showToast('อัพเกรด ' + def.name + ' เป็นระดับ "' + getPlantTitle(p.level) + '" แล้ว!');
  renderGame();
}

function upgradeCity() {
  const cost = getCityUpgradeCost(state.cityLevel);
  if (state.money < cost) { showToast('เงินไม่พอสำหรับอัพเกรดเมือง ต้องการ ' + cost + ' บาท'); flashMoney(false); sndError(); return; }
  state.money -= cost;
  state.cityLevel++;
  flashMoney(true);
  sndUpgrade();
  showToast('อัพเกรดเมืองสำเร็จ! ตอนนี้เป็น "' + getCityTitle(state.cityLevel) + '"');
  renderGame();
}

function emergencyShutdown(key) {
  state.plants[key].on = false;
  state.plants[key].cooldown = EVENT_DEFS[key].cooldown;
  state.activeHazard = null;
  sndToggleOff();
  showToast('ปิด ' + PLANT_MAP[key].name + ' ฉุกเฉินสำเร็จ! โรงไฟฟ้าจะซ่อมแซมชั่วคราว ' + EVENT_DEFS[key].cooldown + ' วิ');
  closeInfo();
  renderGame();
}

function pauseGame() { if (gameTimerId) { clearInterval(gameTimerId); gameTimerId = null; } }
function resumeGame() { if (!gameTimerId && state && (state.infinite || state.timeLeft > 0)) { gameTimerId = setInterval(gameTick, 1000); } }
function openInfo(key) { document.getElementById('modalContent').innerHTML = getDetailHTML(key); document.getElementById('detailOverlay').classList.remove('hidden'); pauseGame(); }
function openEventInfo(id) { document.getElementById('modalContent').innerHTML = getEventDetailHTML(id); document.getElementById('detailOverlay').classList.remove('hidden'); pauseGame(); }
function closeInfo() { document.getElementById('detailOverlay').classList.add('hidden'); resumeGame(); }

function getEventDetailHTML(id) {
  if (id === 'hazard' && state.activeHazard) {
    const h = state.activeHazard, def = h.def, pd = PLANT_MAP[h.key];
    return '<div class="detail-icon" style="color:#ffa8b5;">' + def.icon + ' → 💥</div><h2 style="color:#ffa8b5;">' + def.name + '!</h2>' +
      '<p class="detail-tip">' + def.warn + ' ' + def.resolve + '</p>' +
      '<div class="detail-stats"><div><span>โรงไฟฟ้า</span><span>' + pd.name + '</span></div><div><span>เหลือเวลา</span><span>' + h.timeLeft + ' วิ</span></div></div>' +
      '<button class="emergency-btn" onclick="emergencyShutdown(\'' + h.key + '\')">ปิดโรงไฟฟ้านี้ทันที</button>';
  }
  if (id === 'buff' && state.activeBuff) {
    const d = state.activeBuff.def;
    return '<div class="detail-icon">' + d.icon + '</div><h2 style="color:#b5f0cf;">' + d.name + '</h2><p class="detail-tip">' + d.desc + '</p>' +
      '<div class="detail-stats"><div><span>เหลือเวลา</span><span>' + state.activeBuff.timeLeft + ' วิ</span></div></div>';
  }
  if (id === 'peak') {
    if (state.peakActive) {
      return '<div class="detail-icon">📈 → ✅</div><h2>Peak Load กำลังเกิดขึ้น</h2><p class="detail-tip">' + tips.peak + '</p>' +
        '<div class="detail-stats"><div><span>สถานะ</span><span>กำลังเกิดขึ้น</span></div><div><span>จะกลับสู่ปกติอีก</span><span>' + state.peakTimer + ' วิ</span></div></div>';
    }
    return '<div class="detail-icon">🔹 → 📈</div><h2>Peak Load กำลังจะมาถึง</h2><p class="detail-tip">' + tips.peak + '</p>' +
      '<div class="detail-stats"><div><span>สถานะ</span><span>ปกติ</span></div><div><span>จะเริ่มอีก</span><span>' + state.nextPeakIn + ' วิ</span></div></div>';
  }
  if (id === 'weather') {
    return '<div class="detail-icon">' + weatherIcon(state.weather) + ' → ' + weatherIcon(state.nextWeatherValue) + '</div><h2>สภาพอากาศกำลังจะเปลี่ยน</h2>' +
      '<p class="detail-tip">สภาพอากาศส่งผลต่อกำลังผลิตของโซลาร์เซลล์และกังหันลม</p><div class="detail-stats">' +
      '<div><span>ตอนนี้</span><span>' + weatherLabel(state.weather) + '</span></div>' +
      '<div><span>จะเปลี่ยนเป็น</span><span>' + weatherLabel(state.nextWeatherValue) + '</span></div>' +
      '<div><span>อีก</span><span>' + state.nextWeatherIn + ' วิ</span></div></div>';
  }
  if (id === 'daynight') {
    return '<div class="detail-icon">' + (state.isDay ? '☀️ → 🌙' : '🌙 → ☀️') + '</div><h2>' + (state.isDay ? 'กำลังจะเข้าสู่กลางคืน' : 'กำลังจะเข้าสู่กลางวัน') + '</h2>' +
      '<p class="detail-tip">กลางคืนโซลาร์เซลล์จะไม่ผลิตไฟ ต้องเตรียมโรงไฟฟ้าอื่นทดแทนให้พอ</p><div class="detail-stats"><div><span>อีก</span><span>' + dayNightRemaining() + ' วิ</span></div></div>';
  }
  if (id === 'blackoutWarn') {
    return '<div class="detail-icon">⚠️ → 🔴</div><h2>เสี่ยงไฟดับ!</h2><p class="detail-tip">กำลังผลิตน้อยกว่าความต้องการต่อเนื่อง ถ้าปล่อยไว้ครบ ' + getEffectiveBlackoutThreshold() + ' วินาทีเมืองจะไฟดับ</p>' +
      '<div class="detail-stats"><div><span>ไฟจะดับใน</span><span>' + (getEffectiveBlackoutThreshold() - state.consecutiveShortage) + ' วิ</span></div></div>';
  }
  if (id === 'blackoutActive') {
    return '<div class="detail-icon">🔴</div><h2>ไฟดับ!</h2><p class="detail-tip">เมืองขาดแคลนพลังงาน รีบเปิดโรงไฟฟ้าเพิ่มเพื่อกู้สถานการณ์</p>' +
      '<div class="detail-stats"><div><span>ไฟดับไปแล้ว</span><span>' + state.blackoutEvents + ' ครั้ง</span></div></div>';
  }
  return '';
}
function getDetailHTML(key) {
  if (key === 'battery') {
    const b = state.battery;
    const eff = getBatteryEffective(b.level);
    const statusText = !b.unlocked ? 'ยังไม่ปลดล็อก' : (b.mode === 'off' ? 'ปิด' : (b.mode === 'charge' ? 'กำลังชาร์จ' : 'กำลังปล่อยไฟ'));
    return '<div class="detail-icon">🔋</div><h2>แบตเตอรี่ ESS' + (b.unlocked ? ' — ' + getPlantTitle(b.level) : '') + '</h2><p class="detail-tip">' + tips.battery + '</p>' +
      '<div class="detail-stats">' +
      '<div><span>สถานะ</span><span>' + statusText + '</span></div>' +
      '<div><span>เก็บไฟอยู่</span><span>' + Math.round(b.current) + '/' + eff.capacity + '</span></div>' +
      '<div><span>อัตราชาร์จ / ปล่อยไฟ</span><span>' + eff.chargeRate + ' / ' + eff.dischargeRate + ' MW/วิ</span></div>' +
      '<div><span>ต้นทุนตอนชาร์จ</span><span>-' + BATTERY_DEF.chargeCost + ' บาท/วิ</span></div>' +
      '<div><span>รายได้ตอนปล่อยไฟ</span><span>+' + eff.dischargeIncome + ' บาท/วิ</span></div>' +
      (b.unlocked ? '<div><span>ค่าอัพเกรดถัดไป</span><span>' + getPlantUpgradeCost(BATTERY_DEF, b.level) + ' บาท</span></div>' : '') +
      '</div>';
  }
  const def = PLANT_MAP[key];
  const p = state.plants[key];
  const eff = getEffective(def, p.level);
  let capacityText;
  if (def.type === 'solar') capacityText = eff.dayCapacity + ' MW (เฉพาะกลางวัน)';
  else if (def.type === 'wind') capacityText = 'ผันแปรตามความแรงลม (~' + Math.round(4 * eff.mult) + '-' + Math.round(32 * eff.mult) + ' MW)';
  else capacityText = eff.capacity + ' MW (คงที่เมื่อเปิด)';
  let statusText;
  if (!p.unlocked) statusText = 'ยังไม่ปลดล็อก (' + def.cost + ' บาท)';
  else if (p.cooldown > 0) statusText = 'กำลังซ่อมแซม เหลือ ' + p.cooldown + ' วิ';
  else if (p.debuff && p.debuff.type === 'outage') statusText = 'หยุดทำงานชั่วคราว เหลือ ' + p.debuff.timeLeft + ' วิ';
  else if (p.debuff && p.debuff.type === 'reduced') statusText = 'กำลังผลิตลดลงชั่วคราว (เหลือ ' + p.debuff.timeLeft + ' วิ)';
  else statusText = (p.on ? 'เปิดอยู่ — ผลิต ' + p.output + ' MW' : 'ปิดอยู่');
  const net = eff.income - eff.runCost;
  const riskLine = EVENT_DEFS[key] ? '<div><span>ความเสี่ยงเหตุฉุกเฉิน</span><span>มี (' + EVENT_DEFS[key].name + ')</span></div>' : '';
  return '<div class="detail-icon">' + def.icon + '</div><h2>' + def.name + (p.unlocked ? ' — ' + getPlantTitle(p.level) : '') + '</h2><p class="detail-tip">' + (tips[key] || '') + '</p>' +
    '<div class="detail-stats">' +
    '<div><span>กำลังผลิตสูงสุด</span><span>' + capacityText + '</span></div>' +
    '<div><span>ค่าคาร์บอน</span><span>' + (eff.carbonRate > 0 ? ('ระดับ ' + eff.carbonRate) : 'ไม่มี (0)') + '</span></div>' +
    '<div><span>รายได้เมื่อเปิด</span><span>+' + eff.income + ' บาท/วิ</span></div>' +
    '<div><span>ค่าดำเนินการ</span><span>' + (eff.runCost > 0 ? ('-' + eff.runCost + ' บาท/วิ') : 'ไม่มี') + '</span></div>' +
    '<div><span>รายได้สุทธิ</span><span>+' + net + ' บาท/วิ</span></div>' +
    riskLine +
    (p.unlocked ? '<div><span>ค่าอัพเกรดถัดไป</span><span>' + getPlantUpgradeCost(def, p.level) + ' บาท</span></div>' : '') +
    '<div><span>สถานะปัจจุบัน</span><span>' + statusText + '</span></div>' +
    '</div>';
}

function updateDayNight() { const cycle = 50; state.isDay = (state.elapsed % cycle) < cycle / 2; }
function dayNightRemaining() { const cycle = 50, half = 25; const phase = state.elapsed % cycle; return state.isDay ? (half - phase) : (cycle - phase); }

function updatePeakSchedule() {
  if (state.peakActive) {
    state.peakTimer--;
    if (state.peakTimer <= 0) { state.peakActive = false; state.nextPeakIn = Math.max(4, Math.round((12 + Math.floor(rng() * 10)) / EVENT_FREQ_MULT)); }
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
    state.nextWeatherIn = Math.max(4, Math.round((10 + Math.floor(rng() * 8)) / EVENT_FREQ_MULT));
  }
}

function updateDemand() {
  state.prevDemand = state.demand;
  const mult = getCityDemandMult(state.cityLevel) * (1 + 0.04 * (state.wave || 0)) * perkMul('dem') * bossMul('dem') * mapDem();
  let base = 50 + 15 * Math.sin(state.elapsed / 35) + (rng() * 4 - 2);
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
  if (rng() < 0.0035 * EVENT_FREQ_MULT) {
    const keys = Object.keys(BUFF_DEFS);
    const pick = keys[Math.floor(rng() * keys.length)];
    const def = BUFF_DEFS[pick];
    if (def.duration === 0) {
      const amt = 80 + Math.floor(rng() * 70);
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
    if (rng() < 0.0035 * EVENT_FREQ_MULT) {
      const type = rng() < 0.5 ? 'outage' : 'reduced';
      const dur = type === 'outage' ? (8 + Math.floor(rng() * 7)) : (10 + Math.floor(rng() * 9));
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
      state.windLevel += (rng() - 0.5) * 0.15;
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
    const chance = 0.004 * eff.mult * safeMult * Math.sqrt(EVENT_FREQ_MULT) * perkMul('haz') * bossMul('haz') * getCityHazardMult(state.cityLevel);
    if (rng() < chance) {
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
  let net = gross, cleanFromBattery = 0; state.battCharged = 0;

  if (b.unlocked && b.mode === 'charge') {
    const surplus = Math.max(0, gross - state.demand);
    const amt = Math.min(beff.chargeRate, beff.capacity - b.current, surplus);
    { const cl = PLANT_DEFS.filter(d => d.carbonRate === 0).reduce((t, d) => t + state.plants[d.key].output, 0); b.clean = (b.clean || 0) + amt * (gross > 0 ? Math.min(1, cl / gross) : 0); } b.current += amt; net = gross - amt; state.battCharged = amt;
  } else if (b.unlocked && b.mode === 'discharge') {
    const amt = Math.min(beff.dischargeRate, b.current);
    { const share = b.current > 0 ? Math.min(1, (b.clean || 0) / b.current) : 0; cleanFromBattery = amt * share; b.clean = Math.max(0, (b.clean || 0) - cleanFromBattery); } b.current -= amt; net = gross + amt;
  }
  state.netSupply = Math.round(net);
  return cleanFromBattery;
}

function updateScoreAndBlackout(cleanFromBattery) {
  const scoreMult = getCityScoreMult(state.cityLevel);
  const met = state.netSupply >= state.demand;
  state.streak = met ? (state.streak || 0) + 1 : 0;
  const satDelta = (met ? 8 + Math.min(state.streak, 30) * 0.3 : -6) * scoreMult;
  state.breakdown.satisfaction += satDelta;

  const clean = PLANT_DEFS.filter(d => d.carbonRate === 0).reduce((s, def) => s + state.plants[def.key].output, 0) + cleanFromBattery;
  const cleanDelta = clean * 0.3 * scoreMult;
  state.breakdown.cleanBonus += cleanDelta;

  const carbon = PLANT_DEFS.reduce((s, def) => {
    const p = state.plants[def.key];
    if (!p.on || !p.unlocked) return s;
    return s + getEffective(def, p.level).carbonRate;
  }, 0);
  const carbonDelta = carbon * 0.3 * scoreMult;
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
    if (p.on && p.unlocked && p.cooldown === 0 && p.output > 0) { const eff = getEffective(def, p.level); income += eff.income; expense += eff.runCost; }
  });
  const b = state.battery;
  if (b.unlocked) {
    const beff = getBatteryEffective(b.level);
    if (b.mode === 'charge' && state.battCharged > 0) expense += BATTERY_DEF.chargeCost;
    if (b.mode === 'discharge') income += beff.dischargeIncome;
  }
  if (state.activeBuff && state.activeBuff.type === 'goldenHour') income *= 2;
  if (state.blackoutActive) income = 0;
  state.money = Math.max(0, state.money + income - expense);
}

function maybeShowRandomTip() {
  state.lastTipTimer--;
  if (state.lastTipTimer <= 0) {
    const key = randomTipKeys[Math.floor(rng() * randomTipKeys.length)];
    showToast(tips[key]);
    state.lastTipTimer = 22 + Math.floor(rng() * 14);
  }
}

function currentScore() {
  if (state.prepping) return 0;
  const bd = state.breakdown;
  const moneyBonus = state.money * 0.5;
  const raw = bd.satisfaction + bd.cleanBonus + moneyBonus - bd.carbonPenalty - bd.blackoutPenalty;
  return Math.max(0, Math.round(raw));
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
  maybeShowRandomTip();

  renderGame();

  if (!state.infinite && state.timeLeft <= 0) {
    clearInterval(gameTimerId); gameTimerId = null; endGame();
  }
}

function formatTime(s) { const m = Math.floor(s / 60); const sec = s % 60; return m + ':' + (sec < 10 ? '0' : '') + sec; }

