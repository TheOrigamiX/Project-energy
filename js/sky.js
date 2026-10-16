/* VoltRush — js/sky.js : ท้องฟ้า ดวงอาทิตย์/จันทร์ ดาว ลม เมฆ */

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
