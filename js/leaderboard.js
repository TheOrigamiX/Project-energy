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
  if (period === 'daily') { const today = getDateKey(new Date()); return list.filter(e => e.date === today); }
  if (period === 'weekly') { const wk = getWeekKey(new Date()); return list.filter(e => e.week === wk); }
  return list;
}
function durationLabel() { if (state.infinite) return '∞ ไม่จำกัดเวลา'; return (TOTAL_TIME / 60) + ' นาที'; }

function endGame(disasterMessage) {
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('endScreen').classList.remove('hidden');
  document.getElementById('skyBackground').classList.add('hidden');
  gameInProgress = false;
  stopBackgroundMusic();
  stopShootingStars();
  scoreSavedThisRound = false;

  const banner = document.getElementById('disasterBanner');
  if (disasterMessage) { banner.textContent = disasterMessage; banner.classList.remove('hidden'); }
  else { banner.classList.add('hidden'); sndGameOver(); }

  const bd = state.breakdown;
  const sat = Math.round(bd.satisfaction);
  const clean = Math.round(bd.cleanBonus);
  const moneyBonus = Math.round(state.money * 0.5);
  const carbon = Math.round(bd.carbonPenalty);
  const blackout = Math.round(bd.blackoutPenalty);
  const final = currentScore();

  document.getElementById('finalScoreVal').textContent = final;
  document.getElementById('bdSatisfaction').textContent = sat;
  document.getElementById('bdClean').textContent = '+' + clean;
  document.getElementById('bdMoney').textContent = '+' + moneyBonus;
  document.getElementById('bdCarbon').textContent = '-' + carbon;
  document.getElementById('bdBlackout').textContent = '-' + blackout;
  document.getElementById('bdBlackoutCount').textContent = state.blackoutEvents;
  document.getElementById('bdFinal').textContent = final;
  document.getElementById('lbDurationLabel').textContent = durationLabel();

  document.getElementById('nameInput').value = '';
  document.getElementById('nameInput').disabled = false;
  const saveBtn = document.getElementById('saveScoreBtn');
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'บันทึก'; }
  renderLeaderboard();
}

async function renderLeaderboard() {
  const sec = state.infinite ? 0 : TOTAL_TIME;
  let list = DB_ENABLED ? await loadLeaderboardRemote(sec, 'all') : null;
  if (!list) list = loadAllScores(sec).slice().sort((a, b) => b.score - a.score).slice(0, 100);
  const ol = document.getElementById('leaderboardList');
  ol.innerHTML = '';
  if (list.length === 0) { ol.innerHTML = '<li style="color:#9fb3d1;">ยังไม่มีคะแนนบันทึกไว้</li>'; return; }
  list.forEach(entry => {
    const li = document.createElement('li');
    let text = entry.name + ' — ' + entry.score + ' คะแนน';
    if (state.infinite && entry.elapsed) text += ' • เล่นไป ' + formatTime(entry.elapsed);
    li.textContent = text;
    ol.appendChild(li);
  });
}

function saveScore() {
  if (scoreSavedThisRound) return;
  const nameInput = document.getElementById('nameInput');
  let name = nameInput.value.trim();
  if (!name) name = 'ผู้เล่นนิรนาม';
  const score = currentScore();
  const now = new Date();
  const sec = state.infinite ? 0 : TOTAL_TIME;
  const entry = { name: name, score: score, elapsed: state.infinite ? state.elapsed : undefined, ts: Date.now(), date: getDateKey(now), week: getWeekKey(now) };
  let list = loadAllScores(sec);
  list.push(entry);
  saveAllScores(sec, list);
  if (DB_ENABLED) saveScoreRemote(entry, sec);
  renderLeaderboard();
  scoreSavedThisRound = true;
  nameInput.disabled = true;
  const btn = document.getElementById('saveScoreBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'บันทึกแล้ว ✓'; }
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

function getNextDailyReset(now) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return next;
}
function getNextWeeklyReset(now) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  const day = next.getDay();
  let daysUntilMonday = (1 - day + 7) % 7;
  if (daysUntilMonday === 0 && now >= next) daysUntilMonday = 7;
  next.setDate(next.getDate() + daysUntilMonday);
  return next;
}
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
  const now = new Date();
  const next = lbViewPeriod === 'daily' ? getNextDailyReset(now) : getNextWeeklyReset(now);
  const label = lbViewPeriod === 'daily' ? 'เที่ยงวัน' : 'เที่ยงวันจันทร์';
  el.textContent = '⏳ อันดับนี้จะรีเซ็ตในอีก ' + formatCountdown(next - now) + ' (' + label + ')';
}

async function renderLeaderboardView() {
  const ol = document.getElementById('lbViewList');
  ol.innerHTML = '<li style="color:#9fb3d1;">กำลังโหลด...</li>';
  let list = null;
  if (DB_ENABLED) { list = await loadLeaderboardRemote(lbViewDuration, lbViewPeriod); }
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

function restartGame() {
  if (!scoreSavedThisRound && currentScore() > 0) {
    if (!confirm('คุณยังไม่ได้บันทึกคะแนนไว้ในตารางอันดับ ต้องการเล่นใหม่โดยไม่บันทึกคะแนนนี้ใช่หรือไม่?')) return;
  }
  document.getElementById('endScreen').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
}

