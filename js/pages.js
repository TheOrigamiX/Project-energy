/* หลายหน้า (URL แยก) + เล่นต่อเมื่อรีเฟรช/หลุด (ภายใน 10 นาที) */
const PAGE = document.body.dataset.page || 'index', QS = new URLSearchParams(location.search), SNAP = 'voltrushSnap';
let RESUME = null;
const goto = (p, o) => { location.href = p + (o ? '?' + new URLSearchParams(o) : ''); };
const safeNext = n => /^[a-z]+\.html(\?[\w=&%.-]*)?$/i.test(n || '') ? n : 'index.html';
const hideAll = () => ['startScreen', 'authScreen', 'roomScreen', 'profileScreen', 'leaderboardScreen', 'countdownScreen', 'endScreen'].forEach(i => { const e = byId(i); if (e) e.classList.add('hidden'); });
const __openRoom = openRoom, __startDaily = startDaily, __startTournament = startTournament, __openLb = openLeaderboard, __closeLb = closeLeaderboard, __restart = restartGame, __leave = leaveRoom, __cancelQ = cancelQueue;
window.openRoom = () => PAGE === 'room' ? __openRoom() : goto('room.html');
window.startDaily = () => PAGE === 'daily' ? __startDaily() : goto('daily.html');
window.startTournament = () => PAGE === 'tournament' ? __startTournament() : goto('tournament.html');
window.openLeaderboard = fe => (PAGE === 'leaderboard' || fe) ? __openLb(fe) : goto('leaderboard.html');
window.closeLeaderboard = () => PAGE === 'leaderboard' ? goto('index.html') : __closeLb();
window.restartGame = () => PAGE === 'index' ? __restart() : goto('index.html');
window.leaveRoom = () => { __leave(); if (PAGE === 'room' || PAGE === 'tournament') goto('index.html'); };
window.cancelQueue = () => { __cancelQ(); if (PAGE === 'tournament') goto('index.html'); };
async function onPageReady() {
  byId('authScreen').classList.add('hidden');
  if (PAGE === 'login') { location.replace(safeNext(QS.get('next'))); return; }
  hideAll(); retryPending();
  if (PAGE === 'index') { byId('startScreen').classList.remove('hidden'); renderMenuBar(); checkResume(); }
  else if (PAGE === 'leaderboard') { try { __openLb(false); } catch (e) { console.warn(e); } }
  else if (PAGE === 'room') { __openRoom(); const c = (QS.get('room') || '').toUpperCase().slice(0, 4); if (c) await joinRoom(c, AUTH.name); }
  else if (PAGE === 'daily') { if (!(await __startDaily())) setTimeout(() => goto('index.html'), 2500); }
  else if (PAGE === 'tournament') __startTournament();
  else if (PAGE === 'solo') { selectedDuration = +QS.get('dur') || 180; SEL_MAP = +QS.get('map') || 0; startGame(); }
}
function onSignedOut() {
  hideAll();
  if (PAGE === 'login') { byId('authScreen').classList.remove('hidden'); capMount(); }
  else if (PAGE === 'leaderboard') { try { __openLb(false); } catch (e) { console.warn(e); } }
  else goto('login.html', { next: PAGE + '.html' + location.search });
}
/* ---- ส่งผลที่ค้างเมื่อเน็ตหลุด ---- */
async function retryPending() {
  let p; try { p = JSON.parse(localStorage.getItem('voltrushPending') || 'null'); } catch (e) {} if (!p || !AUTH.user) return;
  const { data, error } = await SB.rpc('submit_run', { p_run: p.run, p_score: p.score, p_wave: p.wave, p_elapsed: p.elapsed, p_streak: p.streak });
  if (!error) { localStorage.removeItem('voltrushPending'); AUTH.p = data.profile; showToast('ส่งผลที่ค้างอยู่แล้ว +' + data.gained + ' XP'); renderMenuBar(); }
  else if (!/fetch|network/i.test(error.message)) localStorage.removeItem('voltrushPending');
}
addEventListener('online', retryPending);
/* ---- เล่นต่อ ---- */
function saveSnap() {
  try { if (!gameInProgress || !state || state.prepping || ROOM.code) return; localStorage.setItem(SNAP, JSON.stringify({ t: Date.now(), uid: PID, state, sel: selectedDuration, tt: TOTAL_TIME, efm: EVENT_FREQ_MULT, map: CUR_MAP, run: RUN, daily: DAILY, seed: DAILY_SEED })); } catch (e) {}
}
addEventListener('pagehide', saveSnap); document.addEventListener('visibilitychange', () => { if (document.hidden) saveSnap(); });
wrap('endGame', (o, a) => { localStorage.removeItem(SNAP); return o(...a); });
function checkResume() {
  let s; try { s = JSON.parse(localStorage.getItem(SNAP) || 'null'); } catch (e) {}
  if (!s || s.uid !== PID || !s.state || Date.now() - s.t > 600000) { localStorage.removeItem(SNAP); return; }
  const b = document.createElement('div'); b.id = 'resumeBox';
  b.innerHTML = '<div class="qb"><div class="qb-ico">⏯️</div><h2>พบเกมที่ค้างไว้</h2><p></p><div class="row"><button class="primary-btn" id="rsGo">▶ เล่นต่อ</button><button class="secondary-btn" id="rsNo">ทิ้งเกมนี้</button></div></div>';
  b.querySelector('p').textContent = 'Wave ' + (s.state.wave || 0) + ' • ' + (s.state.infinite ? 'ไม่จำกัดเวลา' : 'เหลือ ' + formatTime(s.state.timeLeft || 0)) + ' • เงิน ' + Math.round(s.state.money) + ' • หลุดไป ' + Math.round((Date.now() - s.t) / 1000) + ' วินาที';
  document.body.appendChild(b);
  byId('rsNo').onclick = () => { localStorage.removeItem(SNAP); b.remove(); };
  byId('rsGo').onclick = () => { b.remove(); RESUME = s; selectedDuration = s.sel; startGame(); };
}
wrap('actuallyStartGame', (o, a) => {
  if (!RESUME) return o(...a);
  const s = RESUME; RESUME = null;
  state = s.state; TOTAL_TIME = s.tt; EVENT_FREQ_MULT = s.efm; CUR_MAP = s.map; RUN = s.run; DAILY = !!s.daily; DAILY_SEED = s.seed || 0;
  rng = s.daily ? mulberry32((s.seed || 1) + (state.elapsed || 0) * 7919) : Math.random;
  gameInProgress = true; scoreSavedThisRound = false;
  byId('gameScreen').classList.remove('hidden'); byId('skyBackground').classList.remove('hidden'); byId('cityVisual').classList.remove('blackout', 'night');
  byId('stopBtn').classList.toggle('hidden', !state.infinite);
  initSky(); renderGame(); gameTimerId = setInterval(gameTick, 1000); startBackgroundMusic(); startShootingStars();
  showToast('▶ เล่นต่อจากเดิม'); localStorage.removeItem(SNAP);
});
