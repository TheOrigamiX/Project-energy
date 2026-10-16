/* VoltRush — js/state.js : ตัวแปร state หลักและ freshState() */

let state = null;
let gameTimerId = null;
let scoreSavedThisRound = false;
let gameInProgress = false;
window.addEventListener('beforeunload', function (e) {
  if (gameInProgress) { e.preventDefault(); e.returnValue = ''; return ''; }
});

function freshState() {
  const plants = {};
  PLANT_DEFS.forEach(d => { plants[d.key] = { on: d.unlocked, output: 0, unlocked: d.unlocked, tipShown: d.unlocked, level: 1, cooldown: 0, debuff: null }; });
  return {
    timeLeft: TOTAL_TIME, infinite: TOTAL_TIME === 0, elapsed: 0, money: START_MONEY,
    prepping: true, prepTime: PREP_TIME,
    isDay: true, weather: 'clear', nextWeatherValue: randomWeatherExcept('clear'), windLevel: 0.4, demand: 50, prevDemand: 50,
    peakActive: false, peakTimer: 0,
    nextPeakIn: Math.max(4, Math.round((26 + Math.floor(Math.random() * 10)) / EVENT_FREQ_MULT)),
    nextWeatherIn: Math.max(4, Math.round((8 + Math.floor(Math.random() * 6)) / EVENT_FREQ_MULT)),
    plants: plants,
    battery: { mode: 'off', unlocked: false, tipShown: false, level: 1, current: 0 },
    cityLevel: 1,
    grossSupply: 0, netSupply: 0, consecutiveShortage: 0, blackoutActive: false, blackoutEvents: 0,
    activeHazard: null, activeBuff: null,
    lastTipTimer: 20, lastRate: null,
    breakdown: { satisfaction: 0, cleanBonus: 0, carbonPenalty: 0, blackoutPenalty: 0 }
  };
}
