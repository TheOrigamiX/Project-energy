/* VoltRush — js/audio.js : เสียงเอฟเฟกต์และเพลงพื้นหลัง (Web Audio) */

/* ==================================================================
   SOUND ENGINE — synthesized via Web Audio API (no external files)
================================================================== */
let audioCtx = null;
let soundEnabled = localStorage.getItem('voltrushSound') !== 'off';
function getAudioCtx() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (audioCtx.state === 'suspended') { audioCtx.resume(); }
  return audioCtx;
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('voltrushSound', soundEnabled ? 'on' : 'off');
  const btn = document.getElementById('soundToggleBtn');
  if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) playTone(660, 0.06, 'sine', 0.12);
}
function playTone(freq, duration, type, volume, delay) {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(volume || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + duration + 0.03);
  } catch (e) {}
}
/* ---------- Custom sound files (optional) with automatic fallback ----------
   Drop your own audio files next to this HTML file in a "sounds/" folder
   using the filenames below, and VoltRush will use them automatically.
   Any sound that's missing (or fails to load) falls back to the built-in
   synthesized tone below, so nothing ever breaks if a file is absent.
   Recommended formats: short .mp3/.ogg/.wav clips (under ~1s for SFX).
------------------------------------------------------------------------- */
const CUSTOM_SOUND_FILES = {
  click: 'sounds/click.mp3',
  toggleOn: 'sounds/toggle-on.mp3',
  toggleOff: 'sounds/toggle-off.mp3',
  buy: 'sounds/buy.mp3',
  upgrade: 'sounds/upgrade.mp3',
  error: 'sounds/error.mp3',
  hazard: 'sounds/hazard.mp3',
  blackout: 'sounds/blackout.mp3',
  buff: 'sounds/buff.mp3',
  countdownTick: 'sounds/countdown-tick.mp3',
  countdownGo: 'sounds/countdown-go.mp3',
  gameOver: 'sounds/gameover.mp3',
  explosion: 'sounds/explosion.mp3',
  coach: 'sounds/coach.mp3'
};
const CUSTOM_MUSIC_FILE = 'sounds/bgm.mp3';
const customAudioCache = {};
function preloadCustomSounds() {
  Object.keys(CUSTOM_SOUND_FILES).forEach(key => {
    const audio = new Audio();
    const entry = { el: audio, ready: null };
    customAudioCache[key] = entry;
    audio.addEventListener('canplaythrough', () => { entry.ready = true; }, { once: true });
    audio.addEventListener('error', () => { entry.ready = false; }, { once: true });
    audio.preload = 'auto';
    audio.src = CUSTOM_SOUND_FILES[key];
  });
  const bgm = new Audio();
  const bgmEntry = { el: bgm, ready: null };
  customAudioCache.bgm = bgmEntry;
  bgm.loop = true;
  bgm.volume = 0.35;
  bgm.addEventListener('canplaythrough', () => { bgmEntry.ready = true; }, { once: true });
  bgm.addEventListener('error', () => { bgmEntry.ready = false; }, { once: true });
  bgm.preload = 'auto';
  bgm.src = CUSTOM_MUSIC_FILE;
}
preloadCustomSounds();
function playCustomOrFallback(key, fallbackFn) {
  if (!soundEnabled) return;
  const entry = customAudioCache[key];
  if (entry && entry.ready) {
    try {
      const node = entry.el.cloneNode();
      node.volume = 0.6;
      const p = node.play();
      if (p && p.catch) p.catch(() => fallbackFn());
      return;
    } catch (e) {}
  }
  fallbackFn();
}
function sndClickSynth() { playTone(600, 0.05, 'square', 0.07); }
function sndToggleOnSynth() { playTone(520, 0.08, 'sine', 0.12); playTone(820, 0.09, 'sine', 0.09, 0.05); }
function sndToggleOffSynth() { playTone(420, 0.09, 'sine', 0.1); }
function sndBuySynth() { playTone(660, 0.07, 'triangle', 0.12); playTone(880, 0.09, 'triangle', 0.12, 0.07); playTone(1100, 0.12, 'triangle', 0.13, 0.14); }
function sndUpgradeSynth() { playTone(500, 0.07, 'triangle', 0.12); playTone(750, 0.07, 'triangle', 0.12, 0.06); playTone(1000, 0.08, 'triangle', 0.13, 0.12); playTone(1300, 0.14, 'triangle', 0.14, 0.18); }
function sndErrorSynth() { playTone(180, 0.16, 'sawtooth', 0.13); playTone(140, 0.18, 'sawtooth', 0.11, 0.09); }
function sndHazardSynth() { playTone(320, 0.18, 'sawtooth', 0.15); playTone(260, 0.18, 'sawtooth', 0.15, 0.2); playTone(320, 0.18, 'sawtooth', 0.15, 0.4); }
function sndBlackoutSynth() { playTone(500, 0.32, 'sawtooth', 0.14); playTone(300, 0.45, 'sawtooth', 0.14, 0.14); }
function sndBuffSynth() { playTone(700, 0.07, 'sine', 0.12); playTone(950, 0.07, 'sine', 0.12, 0.06); playTone(1250, 0.12, 'sine', 0.13, 0.12); }
function sndCountdownTickSynth() { playTone(440, 0.1, 'square', 0.14); }
function sndCountdownGoSynth() { playTone(660, 0.22, 'square', 0.17); }
function sndGameOverSynth() { playTone(520, 0.16, 'triangle', 0.14); playTone(660, 0.16, 'triangle', 0.14, 0.16); playTone(880, 0.28, 'triangle', 0.15, 0.32); }
function sndExplosionSynth() { playTone(120, 0.45, 'sawtooth', 0.2); playTone(80, 0.55, 'sawtooth', 0.18, 0.1); }
function sndCoachStepSynth() { playTone(700, 0.05, 'sine', 0.07); }

function sndClick() { playCustomOrFallback('click', sndClickSynth); }
function sndToggleOn() { playCustomOrFallback('toggleOn', sndToggleOnSynth); }
function sndToggleOff() { playCustomOrFallback('toggleOff', sndToggleOffSynth); }
function sndBuy() { playCustomOrFallback('buy', sndBuySynth); }
function sndUpgrade() { playCustomOrFallback('upgrade', sndUpgradeSynth); }
function sndError() { playCustomOrFallback('error', sndErrorSynth); }
function sndHazard() { playCustomOrFallback('hazard', sndHazardSynth); }
function sndBlackout() { playCustomOrFallback('blackout', sndBlackoutSynth); }
function sndBuff() { playCustomOrFallback('buff', sndBuffSynth); }
function sndCountdownTick() { playCustomOrFallback('countdownTick', sndCountdownTickSynth); }
function sndCountdownGo() { playCustomOrFallback('countdownGo', sndCountdownGoSynth); }
function sndGameOver() { playCustomOrFallback('gameOver', sndGameOverSynth); }
function sndExplosion() { playCustomOrFallback('explosion', sndExplosionSynth); }
function sndCoachStep() { playCustomOrFallback('coach', sndCoachStepSynth); }

/* ---------- Ambient background music (generative, no external files) ---------- */
let musicEnabled = localStorage.getItem('voltrushMusic') !== 'off';
let musicMasterGain = null;
let musicInterval = null;
let musicChordIndex = 0;
const MUSIC_CHORDS = [
  [130.81, 164.81, 196.00, 246.94],
  [110.00, 130.81, 164.81, 196.00],
  [87.31, 110.00, 130.81, 174.61],
  [98.00, 123.47, 146.83, 196.00]
];
let usingCustomBgm = false;
function startBackgroundMusic() {
  if (!musicEnabled) return;
  stopBackgroundMusic();
  const bgmEntry = customAudioCache.bgm;
  if (bgmEntry && bgmEntry.ready) {
    try {
      bgmEntry.el.currentTime = 0;
      const p = bgmEntry.el.play();
      if (p && p.catch) p.catch(() => { usingCustomBgm = false; startGeneratedMusic(); });
      usingCustomBgm = true;
      return;
    } catch (e) {}
  }
  usingCustomBgm = false;
  startGeneratedMusic();
}
function startGeneratedMusic() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  musicMasterGain = ctx.createGain();
  musicMasterGain.gain.value = 0.05;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 900;
  musicMasterGain.connect(filter); filter.connect(ctx.destination);
  musicChordIndex = 0;
  playMusicChord();
  musicInterval = setInterval(playMusicChord, 7000);
}
function playMusicChord() {
  if (!musicEnabled || !musicMasterGain) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const chord = MUSIC_CHORDS[musicChordIndex % MUSIC_CHORDS.length];
  musicChordIndex++;
  const now = ctx.currentTime;
  chord.forEach((freq, i) => {
    try {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.9 / chord.length, now + 2.5);
      g.gain.linearRampToValueAtTime(0.0001, now + 7);
      osc.connect(g); g.connect(musicMasterGain);
      osc.start(now); osc.stop(now + 7.2);
    } catch (e) {}
  });
}
function stopBackgroundMusic() {
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  if (musicMasterGain) { try { musicMasterGain.disconnect(); } catch (e) {} musicMasterGain = null; }
  if (usingCustomBgm && customAudioCache.bgm) {
    try { customAudioCache.bgm.el.pause(); customAudioCache.bgm.el.currentTime = 0; } catch (e) {}
  }
  usingCustomBgm = false;
}
function toggleMusic() {
  musicEnabled = !musicEnabled;
  localStorage.setItem('voltrushMusic', musicEnabled ? 'on' : 'off');
  const btn = document.getElementById('musicToggleBtn');
  if (btn) btn.textContent = musicEnabled ? '🎵' : '🔕';
  if (musicEnabled) { startBackgroundMusic(); } else { stopBackgroundMusic(); }
}
