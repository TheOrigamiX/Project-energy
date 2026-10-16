/* VoltRush — js/util.js : ฟังก์ชันช่วย: เวลา, ขอบเขตช่วงอันดับ, สุ่มสภาพอากาศ */

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
/* ---------- ขอบเขตช่วงเวลาของอันดับ (รายวัน / รายสัปดาห์) ----------
   รายวันรีเซ็ตทุกวัน 12:00 และรายสัปดาห์รีเซ็ตทุกวันจันทร์ 12:00 ตามเวลาไทย (UTC+7) แบบคงที่
   ผู้เล่นทุกคนเห็นบอร์ดเดียวกันไม่ว่าเครื่องตั้ง timezone ไว้ที่ใด คำนวณจาก epoch ms ล้วนๆ */
const LB_TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
const LB_RESET_HOUR = 12;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
function lbShifted(now) { return now + LB_TZ_OFFSET_MS - LB_RESET_HOUR * HOUR_MS; }
function lbUnshift(shifted) { return shifted - LB_TZ_OFFSET_MS + LB_RESET_HOUR * HOUR_MS; }
function getNextDailyReset(now) { return lbUnshift((Math.floor(lbShifted(now) / DAY_MS) + 1) * DAY_MS); }
function getNextWeeklyReset(now) {
  const dayIndex = Math.floor(lbShifted(now) / DAY_MS);   // วันที่ 0 = พฤหัสบดี 1 ม.ค. 1970
  const daysSinceMonday = (dayIndex + 3) % 7;
  return lbUnshift((dayIndex - daysSinceMonday + 7) * DAY_MS);
}
function getPeriodStart(period, now) {
  now = now || Date.now();
  if (period === 'daily') return getNextDailyReset(now) - DAY_MS;
  if (period === 'weekly') return getNextWeeklyReset(now) - 7 * DAY_MS;
  return 0;
}

function randomWeatherExcept(exclude) {
  const options = ['clear', 'clear', 'cloudy', 'windy', 'calm'];
  let w = options[Math.floor(RNG.f('weather') * options.length)];
  let tries = 0;
  while (w === exclude && tries < 5) { w = options[Math.floor(RNG.f('weather') * options.length)]; tries++; }
  return w;
}

function formatTime(s) { const m = Math.floor(s / 60); const sec = s % 60; return m + ':' + (sec < 10 ? '0' : '') + sec; }
