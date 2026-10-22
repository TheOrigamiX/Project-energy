function initSky() {
  const starsLayer = document.getElementById('starsLayer');
  let html = '';
  for (let i = 0; i < 50; i++) {
    const left = Math.random() * 100, top = Math.random() * 70;
    const dur = (2 + Math.random() * 3).toFixed(1), delay = (Math.random() * 3).toFixed(1);
    html += '<div class="star" style="left:' + left + '%;top:' + top + '%;animation-duration:' + dur + 's;animation-delay:' + delay + 's;"></div>';
  }
  starsLayer.innerHTML = html;

  const windLayer = document.getElementById('windLayer');
  let windHtml = '';
  for (let i = 0; i < 6; i++) {
    const top = 8 + Math.random() * 75;
    const dur = (1.6 + Math.random() * 1.4).toFixed(1), delay = (Math.random() * 2).toFixed(1);
    windHtml += '<div class="wind-streak" style="top:' + top + '%;animation-duration:' + dur + 's;animation-delay:' + delay + 's;"></div>';
  }
  for (let i = 0; i < 3; i++) {
    const top = 5 + Math.random() * 25;
    const dur = (35 + Math.random() * 20).toFixed(0), delay = (Math.random() * 15).toFixed(0);
    windHtml += '<div class="cloud-drift" style="top:' + top + '%;animation-duration:' + dur + 's;animation-delay:-' + delay + 's;"></div>';
  }
  windLayer.innerHTML = windHtml;
}

function updateSky() {
  if (!state) return;
  const bg = document.getElementById('skyBackground');
  const sun = document.getElementById('celestialSun');
  const moon = document.getElementById('celestialMoon');
  const gradient = document.getElementById('skyGradient');
  const windLayer = document.getElementById('windLayer');

  const cycle = 50, half = 25;
  const phase = state.elapsed % cycle;
  let progress = state.isDay ? (phase / half) : ((phase - half) / half);
  progress = Math.min(1, Math.max(0, progress));

  bg.classList.toggle('day', state.isDay);
  bg.classList.toggle('night', !state.isDay);

  const arcTop = (68 - 52 * Math.sin(progress * Math.PI)) + '%';
  const arcLeft = (8 + progress * 84) + '%';

  if (state.isDay) {
    const blueness = Math.sin(progress * Math.PI);
    const orange = [255, 157, 92], sky = [110, 175, 220];
    const r = Math.round(orange[0] + (sky[0] - orange[0]) * blueness);
    const g = Math.round(orange[1] + (sky[1] - orange[1]) * blueness);
    const b = Math.round(orange[2] + (sky[2] - orange[2]) * blueness);
    gradient.style.background = 'linear-gradient(180deg, rgb(' + r + ',' + g + ',' + b + ') 0%, rgba(20,28,50,0.35) 100%)';
    sun.style.opacity = '1'; moon.style.opacity = '0';
    sun.style.left = arcLeft; sun.style.top = arcTop;
  } else {
    gradient.style.background = 'linear-gradient(180deg, #05070f 0%, #0a1230 55%, #131b3a 100%)';
    moon.style.opacity = '1'; sun.style.opacity = '0';
    moon.style.left = arcLeft; moon.style.top = arcTop;
  }

  windLayer.classList.toggle('active', state.weather === 'windy');
  windLayer.classList.toggle('cloudy', state.weather === 'cloudy');
}

let shootingStarInterval = null;
function startShootingStars() {
  stopShootingStars();
  shootingStarInterval = setInterval(() => {
    if (!state || state.isDay || state.prepping) return;
    if (Math.random() < 0.4) spawnShootingStar();
  }, 2500);
}
function stopShootingStars() { if (shootingStarInterval) { clearInterval(shootingStarInterval); shootingStarInterval = null; } }
function spawnShootingStar() {
  const layer = document.getElementById('starsLayer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'shooting-star';
  el.style.top = (Math.random() * 40) + '%';
  el.style.left = (40 + Math.random() * 50) + '%';
  layer.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
}

function countUp(id, newVal, signed) {
  const el = document.getElementById(id);
  if (!el) return;
  newVal = Math.round(newVal);
  const stored = parseFloat(el.getAttribute('data-val'));
  const from = isNaN(stored) ? 0 : stored;
  const render = v => (signed && v >= 0 ? '+' : '') + v;
  if (from === newVal) { el.textContent = render(newVal); el.setAttribute('data-val', newVal); return; }
  const duration = 350;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 2);
    const cur = Math.round(from + (newVal - from) * eased);
    el.textContent = render(cur);
    if (t < 1) requestAnimationFrame(step);
    else { el.textContent = render(newVal); el.setAttribute('data-val', newVal); }
  }
  requestAnimationFrame(step);
}

function badgeHTML(b) {
  return '<div class="status-badge ' + b.level + (b.pulse ? ' pulse' : '') + '" title="' + b.title + '" onclick="openEventInfo(\'' + b.id + '\')">' +
    '<div class="t-row">' + b.iconA + (b.iconB ? ' <span class="arrow">→</span> ' + b.iconB : '') + '</div>' +
    (b.count !== null ? '<div class="t-count">อีก ' + b.count + ' วิ</div>' : '<div class="t-count">' + (b.staticText || 'ตอนนี้!') + '</div>') +
    '</div>';
}

function renderStatusTray() {
  const el = document.getElementById('statusTray');
  if (state.prepping) {
    el.innerHTML = '<div class="status-empty" style="color:#8fe3ff;font-weight:700;">ช่วงเตรียมตัว — เปิด/ซื้อโรงไฟฟ้าได้เลย เหตุการณ์ต่างๆ ยังไม่เริ่ม</div>';
    return;
  }
  const badges = [];

  if (state.activeBuff) {
    badges.push({ id: 'buff', iconA: state.activeBuff.def.icon, iconB: null, count: state.activeBuff.timeLeft, level: 'buff', title: state.activeBuff.def.name });
  }
  if (state.activeHazard) {
    const h = state.activeHazard;
    badges.push({ id: 'hazard', iconA: h.def.icon, iconB: '💥', count: h.timeLeft, level: 'danger', pulse: true, title: h.def.name });
  }

  if (state.peakActive) {
    badges.push({ id: 'peak', iconA: '📈', iconB: '✅', count: state.peakTimer, level: 'warning', title: 'Peak Load กำลังเกิด → กลับสู่ปกติ' });
  } else {
    badges.push({ id: 'peak', iconA: '🔹', iconB: '📈', count: state.nextPeakIn, level: state.nextPeakIn <= 5 ? 'warning' : 'info', title: 'ปกติ → Peak Load' });
  }

  badges.push({ id: 'weather', iconA: weatherIcon(state.weather), iconB: weatherIcon(state.nextWeatherValue), count: state.nextWeatherIn, level: state.nextWeatherIn <= 5 ? 'warning' : 'info', title: weatherLabel(state.weather) + ' → ' + weatherLabel(state.nextWeatherValue) });

  const dn = dayNightRemaining();
  badges.push({ id: 'daynight', iconA: state.isDay ? '☀️' : '🌙', iconB: state.isDay ? '🌙' : '☀️', count: dn, level: dn <= 5 ? 'warning' : 'info', title: (state.isDay ? 'กลางวัน → กลางคืน' : 'กลางคืน → กลางวัน') });

  if (state.consecutiveShortage >= 1 && state.consecutiveShortage < getEffectiveBlackoutThreshold()) {
    badges.push({ id: 'blackoutWarn', iconA: '⚠️', iconB: '🔴', count: getEffectiveBlackoutThreshold() - state.consecutiveShortage, level: 'danger', title: 'เสี่ยง → ไฟดับ' });
  }
  if (state.blackoutActive) {
    badges.push({ id: 'blackoutActive', iconA: '🔴', iconB: null, count: null, level: 'danger', pulse: true, staticText: 'ไฟดับแล้ว!', title: 'ไฟดับแล้ว' });
  }

  el.innerHTML = badges.map(badgeHTML).join('');
}

function renderPlantsPanel() {
  const container = document.getElementById('plantsContainer');
  let html = '';
  PLANT_DEFS.forEach(def => {
    const p = state.plants[def.key];
    const riskTag = EVENT_DEFS[def.key] ? '<span class="risk-tag">เสี่ยง</span>' : '';
    if (p.unlocked) {
      if (p.cooldown > 0 || (p.debuff && p.debuff.type === 'outage')) {
        const timeLeft = p.cooldown > 0 ? p.cooldown : p.debuff.timeLeft;
        const label = p.cooldown > 0 ? 'กำลังซ่อมแซมความเสียหาย...' : 'หยุดทำงานชั่วคราว (บำรุงรักษา)...';
        html += '<div class="plant-card cooldown">' +
          '<div class="card-top"><div class="info"><span class="icon">🔧</span><div><div class="name">' + def.name + '<span class="level-tag">' + getPlantTitle(p.level) + '</span></div></div></div>' +
          '<button class="info-btn" onclick="openInfo(\'' + def.key + '\')">ⓘ</button></div>' +
          '<div class="card-bottom"><div class="repair-text">' + label + ' เหลือ ' + timeLeft + ' วิ</div></div>' +
          '</div>';
        return;
      }
      const eff = getEffective(def, p.level);
      const net = eff.income - eff.runCost;
      const moneyTag = p.on ? '<span class="money-tag">+' + net + '/วิ</span>' : '';
      const debuffTag = (p.debuff && p.debuff.type === 'reduced') ? '<span class="debuff-tag">-50% (' + p.debuff.timeLeft + 'วิ)</span>' : '';
      const upCost = getPlantUpgradeCost(def, p.level);
      html += '<div class="plant-card ' + (p.on ? 'active' : '') + '" style="--accent:' + def.accent + ';--accent-glow:' + def.accent + '66">' +
        '<div class="card-top"><div class="info"><span class="icon">' + def.icon + '</span><div>' +
        '<div class="name">' + def.name + '<span class="level-tag">' + getPlantTitle(p.level) + '</span>' + riskTag + '</div>' +
        '</div></div>' +
        '<div class="switch ' + (p.on ? 'on' : '') + '" id="switch-' + def.key + '" style="--accent:' + def.accent + '" onclick="togglePlant(\'' + def.key + '\')"><div class="knob"></div></div>' +
        '</div>' +
        '<div class="card-bottom"><div class="output">' + p.output + ' MW' + moneyTag + debuffTag + '</div>' +
        '<div class="card-actions">' +
        '<button class="info-btn" id="infobtn-' + def.key + '" onclick="openInfo(\'' + def.key + '\')">ⓘ</button>' +
        '<button class="upgrade-btn" id="upgradebtn-' + def.key + '" ' + (state.money >= upCost ? '' : 'disabled') + ' onclick="upgradePlant(\'' + def.key + '\')">⬆️ ' + upCost + '฿</button>' +
        '</div></div></div>';
    } else {
      const afford = state.money >= def.cost;
      html += '<div class="plant-card locked">' +
        '<div class="card-top"><div class="info"><span class="icon">🔒</span><div><div class="name">' + def.name + riskTag + '</div></div></div>' +
        '<button class="info-btn" onclick="openInfo(\'' + def.key + '\')">ⓘ</button></div>' +
        '<div class="card-bottom"><div class="output">ต้องปลดล็อกก่อน</div>' +
        '<button class="buy-btn" ' + (afford ? '' : 'disabled') + ' onclick="buyPlant(\'' + def.key + '\')">ปลดล็อก · ' + def.cost + '฿</button>' +
        '</div></div>';
    }
  });

  const b = state.battery;
  if (b.unlocked) {
    const cls = b.mode === 'charge' ? 'charging' : (b.mode === 'discharge' ? 'discharging' : '');
    const eff = getBatteryEffective(b.level);
    const upCost = getPlantUpgradeCost(BATTERY_DEF, b.level);
    html += '<div class="battery-card ' + cls + '">' +
      '<div class="battery-top"><div class="info"><span class="icon">🔋</span><div>' +
      '<div class="name">แบตเตอรี่ ESS<span class="level-tag">' + getPlantTitle(b.level) + '</span></div>' +
      '<div class="output">เก็บไว้ <b>' + Math.round(b.current) + '</b>/' + eff.capacity + '</div>' +
      '</div></div>' +
      '<div class="card-actions"><button class="info-btn" onclick="openInfo(\'battery\')">ⓘ</button>' +
      '<button class="upgrade-btn" ' + (state.money >= upCost ? '' : 'disabled') + ' onclick="upgradePlant(\'battery\')">⬆️ ' + upCost + '฿</button></div>' +
      '</div>' +
      '<div class="battery-bar-track"><div class="battery-bar-fill" style="width:' + Math.round((b.current / eff.capacity) * 100) + '%"></div></div>' +
      '<div class="battery-controls">' +
      '<div class="battery-toggle-row"><span>ชาร์จไฟ</span><div class="switch ' + (b.mode === 'charge' ? 'on' : '') + '" style="--accent:#6ee7a8" onclick="setBatteryMode(\'charge\')"><div class="knob"></div></div></div>' +
      '<div class="battery-toggle-row"><span>ปล่อยไฟ</span><div class="switch ' + (b.mode === 'discharge' ? 'on' : '') + '" style="--accent:#ffd166" onclick="setBatteryMode(\'discharge\')"><div class="knob"></div></div></div>' +
      '</div></div>';
  } else {
    const afford = state.money >= BATTERY_DEF.cost;
    html += '<div class="battery-card locked">' +
      '<div class="battery-top"><div class="info"><span class="icon">🔒</span><div><div class="name">แบตเตอรี่ ESS</div></div></div>' +
      '<button class="info-btn" onclick="openInfo(\'battery\')">ⓘ</button></div>' +
      '<button class="buy-btn" ' + (afford ? '' : 'disabled') + ' onclick="buyPlant(\'battery\')">ปลดล็อก · ' + BATTERY_DEF.cost + '฿</button>' +
      '</div>';
  }
  if (container.dataset.h !== html) { container.innerHTML = html; container.dataset.h = html; }
}

function renderCityUpgrade() {
  document.getElementById('cityLevelLabel').textContent = 'Lv.' + state.cityLevel + ' — ' + getCityTitle(state.cityLevel);

  document.getElementById('cityDemandMultVal').textContent = getCityDemandMult(state.cityLevel).toFixed(1);
  document.getElementById('cityScoreMultVal').textContent = getCityScoreMult(state.cityLevel).toFixed(1);

  const effPct = state.demand > 0 ? Math.round((state.netSupply / state.demand) * 100) : 100;
  const gridChip = document.getElementById('gridEffChip');
  document.getElementById('gridEffVal').textContent = Math.min(999, effPct) + '%';
  gridChip.classList.toggle('good', effPct >= 100);
  gridChip.classList.toggle('bad', effPct < 100);

  const gauge = document.getElementById('powerGauge');
  const ringPct = Math.max(0, Math.min(100, effPct));
  gauge.style.setProperty('--gauge-pct', ringPct);
  gauge.style.setProperty('--gauge-color', effPct >= 100 ? '#6ee7a8' : (effPct >= 70 ? '#ffd166' : '#ff6b6b'));
  countUp('gaugePctNum', Math.min(999, effPct));
  countUp('gaugeSupplyNum', state.netSupply);
  countUp('gaugeDemandNum', state.demand);

  const trendEl = document.getElementById('demandTrend');
  trendEl.textContent = state.demand > state.prevDemand ? '▲' : (state.demand < state.prevDemand ? '▼' : '');
  trendEl.style.color = state.demand > state.prevDemand ? '#ff9d9d' : (state.demand < state.prevDemand ? '#6ee7a8' : '#9fb3d1');

  const diff = state.netSupply - state.demand;
  countUp('gaugeDiffNum', diff, true);
  document.getElementById('gaugeDiffLabel').textContent = diff >= 0 ? 'เหลือ' : 'ขาด';
  document.getElementById('gaugeDiff').classList.toggle('good', diff >= 0);
  document.getElementById('gaugeDiff').classList.toggle('bad', diff < 0);

  const cost = getCityUpgradeCost(state.cityLevel);
  const afford = state.money >= cost;
  document.getElementById('cityProgressLabel').textContent = 'เงินสะสม ' + Math.round(state.money) + ' / ' + cost + ' บาท สำหรับอัพเกรดถัดไป';
  document.getElementById('cityProgressFill').style.width = Math.min(100, (state.money / cost) * 100) + '%';

  const el = document.getElementById('cityUpgradeRow');
  el.innerHTML = '<button class="buy-btn" ' + (afford ? '' : 'disabled') + ' onclick="upgradeCity()">อัพเกรดเป็น "' + getCityTitle(state.cityLevel + 1) + '" · ' + cost + '฿</button>';
}

function spawnScorePopup(delta) {
  const anchor = document.getElementById('scoreChip');
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'score-popup ' + (delta >= 0 ? 'good' : 'bad');
  el.textContent = (delta >= 0 ? '+' : '') + Math.round(delta);
  el.style.left = (r.left + r.width / 2 - 14) + 'px';
  el.style.top = (r.bottom + 4) + 'px';
  document.body.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1150);
}
function renderScoreRate() {
  const rate = state.lastRate;
  const sat = document.getElementById('rateSatisfaction');
  const clean = document.getElementById('rateClean');
  const carbon = document.getElementById('rateCarbon');
  const blackoutRow = document.getElementById('rateBlackoutRow');
  const blackoutEl = document.getElementById('rateBlackout');
  if (!rate || state.prepping) {
    sat.textContent = '—'; clean.textContent = '—'; carbon.textContent = '—';
    blackoutRow.classList.add('hidden');
    return;
  }
  sat.textContent = (rate.satisfaction >= 0 ? '+' : '') + rate.satisfaction.toFixed(1);
  clean.textContent = '+' + rate.clean.toFixed(1);
  carbon.textContent = '-' + rate.carbon.toFixed(1);
  if (rate.blackout > 0) { blackoutRow.classList.remove('hidden'); blackoutEl.textContent = '-' + rate.blackout.toFixed(1); }
  else blackoutRow.classList.add('hidden');
}

function renderGame() {
  updateSky();
  renderScoreRate();
  document.getElementById('skipPrepBtn').classList.toggle('hidden', !state.prepping);

  if (state.prepping) {
    document.getElementById('timerText').textContent = 'เตรียม ' + state.prepTime + 's';
    const ring = document.getElementById('clockRing');
    ring.classList.remove('infinite');
    ring.style.setProperty('--clock-pct', Math.max(0, (state.prepTime / PREP_TIME) * 100));
    ring.style.setProperty('--clock-color', '#38b6ff');
  } else if (state.infinite) {
    document.getElementById('timerText').textContent = formatTime(state.elapsed);
    const ring = document.getElementById('clockRing');
    ring.classList.add('infinite');
    ring.style.setProperty('--clock-pct', 100);
    ring.style.setProperty('--clock-color', '#6ee7a8');
  } else {
    document.getElementById('timerText').textContent = formatTime(Math.max(0, state.timeLeft));
    const ring = document.getElementById('clockRing');
    ring.classList.remove('infinite');
    const pct = Math.max(0, (state.timeLeft / TOTAL_TIME) * 100);
    ring.style.setProperty('--clock-pct', pct);
    ring.style.setProperty('--clock-color', pct < 15 ? '#ff6b6b' : (pct < 40 ? '#ffd166' : '#ffb347'));
  }
  countUp('moneyVal', state.money);
  countUp('moneyValPanel', state.money);

  document.getElementById('dayNightIcon').textContent = state.isDay ? '☀️' : '🌙';
  document.getElementById('dayNightText').textContent = state.isDay ? 'กลางวัน' : 'กลางคืน';
  document.getElementById('cityVisual').classList.toggle('night', !state.isDay);
  document.getElementById('cityVisual').textContent = getCityBuildings(state.cityLevel);

  document.getElementById('weatherIcon').textContent = weatherIcon(state.weather);
  document.getElementById('weatherText').textContent = weatherLabel(state.weather);

  renderStatusTray();
  renderPlantsPanel();
  renderCityUpgrade();

  document.getElementById('cityVisual').classList.toggle('blackout', state.blackoutActive);

  const carbonMax = state.infinite ? 600 : Math.max(300, TOTAL_TIME * 1.8);
  const carbonPct = Math.min(100, (state.breakdown.carbonPenalty / carbonMax) * 100);
  document.getElementById('carbonFill').style.width = carbonPct + '%';
  countUp('carbonVal', state.breakdown.carbonPenalty);

  const clean = PLANT_DEFS.filter(d => d.carbonRate === 0).reduce((s, def) => s + state.plants[def.key].output, 0);
  const totalProd = PLANT_DEFS.reduce((s, def) => s + state.plants[def.key].output, 0);
  const cleanPct = totalProd > 0 ? Math.round((clean / totalProd) * 100) : 0;
  document.getElementById('cleanFill').style.width = cleanPct + '%';
  countUp('cleanNum', cleanPct);

  const score = currentScore();
  countUp('scoreVal', score);
  countUp('scoreTopVal', score);
  countUp('blackoutCountVal', state.blackoutEvents);
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 6100);
}

