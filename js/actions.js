/* VoltRush — js/actions.js : การกระทำของผู้เล่น: เปิดปิด, ซื้อ, อัพเกรด */

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
