/* VoltRush — js/leaderboard.js : อันดับคะแนน: localStorage + Backend, หน้าจออันดับ, นับถอยหลังรีเซ็ต */

function lbKeyForDuration(sec) { return LB_PREFIX + (sec === 0 ? 'infinite' : sec); }
function loadAllScores(sec) {
  try { const raw = localStorage.getItem(lbKeyForDuration(sec)); return raw ? JSON.parse(raw) : []; }
  catch (e) { return []; }
}
function saveAllScores(sec, list) {
  list.sort((a, b) => b.score - a.score);
  if (list.length > 300) list = list.slice(0, 300);
  localStorage.setItem(lbKeyForDuration(sec), JSON.stringify(list));
}
function filterByPeriod(list, period) {
  if (period === 'daily' || period === 'weekly') { const start = getPeriodStart(period); return list.filter(e => e.ts >= start); }
  return list;
}

async function renderLeaderboard() {
  const sec = state.infinite ? 0 : TOTAL_TIME;
  const ol = document.getElementById('leaderboardList');
  ol.innerHTML = '<li style="color:#9fb3d1;">กำลังโหลด...</li>';
  let list = await Backend.loadLeaderboard(sec, 'all');
  if (!list) list = loadAllScores(sec).slice().sort((a, b) => b.score - a.score).slice(0, 100);
  ol.innerHTML = '';
  if (list.length === 0) { ol.innerHTML = '<li style="color:#9fb3d1;">ยังไม่มีคะแนนบันทึกไว้</li>'; return; }
  list.forEach(entry => {
    const li = document.createElement('li');
    let text = entry.name + ' — ' + entry.score + ' คะแนน';
    if (sec === 0 && entry.elapsed) text += ' • เล่นไป ' + formatTime(entry.elapsed);
    li.textContent = text;
    ol.appendChild(li);
  });
}

async function saveScore() {
  if (scoreSavedThisRound) return;
  scoreSavedThisRound = true;                          // กันกดซ้ำระหว่างรอส่งขึ้นเซิร์ฟเวอร์
  const nameInput = document.getElementById('nameInput');
  const btn = document.getElementById('saveScoreBtn');
  nameInput.disabled = true;
  if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
  let name = nameInput.value.trim();
  if (!name) name = 'ผู้เล่นนิรนาม';
  const sec = state.infinite ? 0 : TOTAL_TIME;
  const entry = { name: name, score: currentScore(), elapsed: state.infinite ? state.elapsed : undefined, ts: Date.now() };
  const list = loadAllScores(sec);
  list.push(entry);
  saveAllScores(sec, list);
  await Backend.saveScore(entry, sec);
  await renderLeaderboard();
  if (btn) btn.textContent = 'บันทึกแล้ว ✓';
}

let lbViewDuration = 180;
let lbViewPeriod = 'all';
let lbReturnScreen = 'startScreen';
function openLeaderboard(fromEnd) {
  lbReturnScreen = fromEnd ? 'endScreen' : 'startScreen';
  document.getElementById(lbReturnScreen).classList.add('hidden');
  lbViewDuration = fromEnd ? (state.infinite ? 0 : TOTAL_TIME) : selectedDuration;
  lbViewPeriod = 'all';
  document.getElementById('leaderboardScreen').classList.remove('hidden');
  syncLbTabs();
  syncLbPeriodTabs();
  renderLeaderboardView();
  startLbCountdown();
}
function closeLeaderboard() {
  document.getElementById('leaderboardScreen').classList.add('hidden');
  document.getElementById(lbReturnScreen).classList.remove('hidden');
  stopLbCountdown();
}
function selectLbDuration(sec) { lbViewDuration = sec; syncLbTabs(); renderLeaderboardView(); }
function selectLbPeriod(p) { lbViewPeriod = p; syncLbPeriodTabs(); renderLeaderboardView(); updateLbCountdownText(); }
function syncLbTabs() { document.querySelectorAll('#lbDurationTabs .dur-btn').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.sec) === lbViewDuration)); }
function syncLbPeriodTabs() { document.querySelectorAll('#lbPeriodTabs .dur-btn').forEach(b => b.classList.toggle('selected', b.dataset.period === lbViewPeriod)); }

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return h + ' ชม. ' + m + ' นาที';
  if (m > 0) return m + ' นาที ' + s + ' วิ';
  return s + ' วินาที';
}
let lbCountdownInterval = null;
function startLbCountdown() {
  stopLbCountdown();
  updateLbCountdownText();
  lbCountdownInterval = setInterval(updateLbCountdownText, 1000);
}
function stopLbCountdown() { if (lbCountdownInterval) { clearInterval(lbCountdownInterval); lbCountdownInterval = null; } }
function updateLbCountdownText() {
  const el = document.getElementById('lbResetCountdown');
  if (!el) return;
  if (lbViewPeriod === 'all') { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const now = Date.now();
  const next = lbViewPeriod === 'daily' ? getNextDailyReset(now) : getNextWeeklyReset(now);
  const label = lbViewPeriod === 'daily' ? 'เที่ยงวัน เวลาไทย' : 'เที่ยงวันจันทร์ เวลาไทย';
  el.textContent = '⏳ อันดับนี้จะรีเซ็ตในอีก ' + formatCountdown(next - now) + ' (' + label + ')';
}

let lbReqId = 0;
async function renderLeaderboardView() {
  const reqId = ++lbReqId;
  const ol = document.getElementById('lbViewList');
  ol.innerHTML = '<li style="color:#9fb3d1;">กำลังโหลด...</li>';
  let list = null;
  list = await Backend.loadLeaderboard(lbViewDuration, lbViewPeriod);
  if (reqId !== lbReqId) return;   // ผู้เล่นกดแท็บอื่นไปแล้ว ทิ้งผลเก่า
  if (!list) { list = filterByPeriod(loadAllScores(lbViewDuration), lbViewPeriod).sort((a, b) => b.score - a.score).slice(0, 100); }
  ol.innerHTML = '';
  if (list.length === 0) { ol.innerHTML = '<li style="color:#9fb3d1;">ยังไม่มีคะแนนบันทึกไว้ในช่วงนี้</li>'; return; }
  list.forEach((entry, i) => {
    const li = document.createElement('li');
    let text = entry.name + ' — ' + entry.score + ' คะแนน';
    if (lbViewDuration === 0 && entry.elapsed) text += ' • เล่นไป ' + formatTime(entry.elapsed);
    li.textContent = text;
    ol.appendChild(li);
  });
}
