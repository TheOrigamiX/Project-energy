/* VoltRush — js/flow.js : โฟลว์เกม: เริ่ม, นับถอยหลัง, หยุด/เล่นต่อ, จบเกม, เล่นใหม่ */

function selectFreq(key) {
  selectedFreqKey = key;
  document.querySelectorAll('#freqOptions .dur-btn').forEach(b => b.classList.toggle('selected', b.dataset.freq === key));
}

function selectDuration(sec) {
  selectedDuration = sec;
  document.querySelectorAll('#durationOptions .dur-btn').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.sec) === sec));
}

function startGame() {
  getAudioCtx();   // ปลดล็อกเสียงภายใน gesture ของผู้เล่น (จำเป็นบน iOS Safari)
  TOTAL_TIME = selectedDuration;
  EVENT_FREQ_MULT = EVENT_FREQ_OPTIONS[selectedFreqKey];
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

function pauseGame() { if (gameTimerId) { clearInterval(gameTimerId); gameTimerId = null; } }
function resumeGame() {
  if (coachActive || gameTimerId || !state || !gameInProgress) return;                    // tutorial ยังแสดงอยู่ / timer เดินอยู่แล้ว / เกมจบแล้ว
  if (!document.getElementById('detailOverlay').classList.contains('hidden')) return;   // modal ยังเปิดอยู่
  if (state.infinite || state.timeLeft > 0) { gameTimerId = setInterval(gameTick, 1000); }
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

function restartGame() {
  if (!scoreSavedThisRound && currentScore() > 0) {
    if (!confirm('คุณยังไม่ได้บันทึกคะแนนไว้ในตารางอันดับ ต้องการเล่นใหม่โดยไม่บันทึกคะแนนนี้ใช่หรือไม่?')) return;
  }
  document.getElementById('endScreen').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
}

/* ---------- หยุดเกมอัตโนมัติเมื่อซ่อนแท็บ (เบราว์เซอร์ throttle timer ของแท็บพื้นหลัง) ---------- */
let pausedByVisibility = false;
document.addEventListener('visibilitychange', function () {
  if (!state || !gameInProgress) return;
  if (document.hidden) {
    if (gameTimerId) { pauseGame(); pausedByVisibility = true; }
    stopBackgroundMusic();
  } else {
    if (pausedByVisibility) { pausedByVisibility = false; resumeGame(); }
    startBackgroundMusic();
  }
});
