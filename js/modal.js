/* VoltRush — js/modal.js : หน้าต่างรายละเอียดและหยุดเกมชั่วคราว */

function openInfo(key) { document.getElementById('modalContent').innerHTML = getDetailHTML(key); document.getElementById('detailOverlay').classList.remove('hidden'); pauseGame(); }
function openEventInfo(id) { document.getElementById('modalContent').innerHTML = getEventDetailHTML(id); document.getElementById('detailOverlay').classList.remove('hidden'); pauseGame(); }
function closeInfo() { document.getElementById('detailOverlay').classList.add('hidden'); resumeGame(); }

function getEventDetailHTML(id) {
  if (id === 'hazard' && state.activeHazard) {
    const h = state.activeHazard, def = h.def, pd = PLANT_MAP[h.key];
    return '<div class="detail-icon" style="color:#ff6b6b;">' + def.icon + ' → 💥</div><h2 style="color:#ff6b6b;">' + def.name + '!</h2>' +
      '<p class="detail-tip">' + def.warn + ' ' + def.resolve + '</p>' +
      '<div class="detail-stats"><div><span>โรงไฟฟ้า</span><span>' + pd.name + '</span></div><div><span>เหลือเวลา</span><span>' + h.timeLeft + ' วิ</span></div></div>' +
      '<button class="emergency-btn" onclick="emergencyShutdown(\'' + h.key + '\')">ปิดโรงไฟฟ้านี้ทันที</button>';
  }
  if (id === 'buff' && state.activeBuff) {
    const d = state.activeBuff.def;
    return '<div class="detail-icon">' + d.icon + '</div><h2 style="color:#6ee7a8;">' + d.name + '</h2><p class="detail-tip">' + d.desc + '</p>' +
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
