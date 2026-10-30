/* ล็อบบี้ตัวละครเดิน + หน้าจัดทีม (ตัวหลัก ผู้ช่วย 2 ช่อง เด็ค) */
(function () {
  const pl = document.createElement('div'); pl.id = 'petLayer'; document.body.appendChild(pl); const tb = document.createElement('button'); tb.id = 'petTeamBtn'; tb.className = 'secondary-btn'; tb.textContent = '👥 จัดทีม / เปลี่ยนตัวละคร'; tb.onclick = openTeam; document.body.appendChild(tb);
  document.body.insertAdjacentHTML('beforeend', '<div id="teamModal" class="hidden"><div class="tm"><h2>👥 จัดทีม</h2><div id="tmMain" class="cgrid"></div><div id="tmDetail" class="tmd"></div><h3>ผู้ช่วย (ได้พาสซีฟ 40% ไม่มีสกิลกด)</h3><div class="row"><select id="tmH1" class="room-input"></select><select id="tmH2" class="room-input"></select></div><div id="tmWarn" class="auth-msg"></div><h3>เด็คการ์ด <span id="tmDeckN"></span></h3><div id="tmDeck" class="dgrid"></div><div class="row"><button class="primary-btn" id="tmSave">บันทึก</button><button class="secondary-btn" id="tmClose">ปิด</button></div></div></div>');
  byId('tmClose').onclick = () => byId('teamModal').classList.add('hidden'); byId('tmSave').onclick = saveTeam;
  ['tmH1', 'tmH2'].forEach((id, i) => byId(id).onchange = e => { CH.T.helpers[i] = e.target.value; if (CH.T.helpers[0] && CH.T.helpers[0] === CH.T.helpers[1]) CH.T.helpers[1 - i] = ''; renderTeam(); });
  setInterval(() => { if (document.hidden || gameInProgress || !AUTH.user) return; const w = [...document.querySelectorAll('.pet')]; if (!w.length) return; const e = w[Math.floor(Math.random() * w.length)], c = CHARS[e.dataset.id], b = e.querySelector('.bubble'); b.textContent = c.lines[Math.floor(Math.random() * c.lines.length)]; b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 3200); }, 7000);
})();
const PETS = []; let petRaf = 0, petLast = 0; const petCalm = matchMedia('(prefers-reduced-motion: reduce)').matches;
function petPick(p) { const top = Math.max(90, innerHeight * .3); p.tx = 10 + Math.random() * Math.max(10, innerWidth - p.w - 20); p.ty = top + Math.random() * Math.max(10, innerHeight - p.h - top - 10); }
function renderLobby() {
  const L = byId('petLayer'); if (!L) return; L.innerHTML = ''; PETS.length = 0; const t = loadTeam(), ids = [t.main, ...t.helpers.filter(Boolean)];
  ids.forEach((id, i) => {
    const c = CHARS[id], el = document.createElement('div'), w = i ? 74 : 98, h = Math.round(w * 1.18);
    el.className = 'pet' + (i ? ' sub' : ''); el.dataset.id = id; el.style.width = w + 'px'; el.style.height = h + 'px';
    el.innerHTML = '<div class="pflip">' + charSvg(c) + '</div><div class="bubble"></div><small class="wname"></small>'; el.querySelector('.wname').textContent = c.n + (i ? ' (ผู้ช่วย)' : ''); L.appendChild(el);
    const p = { el, w, h, svg: el.querySelector('.chsvg'), flip: el.querySelector('.pflip'), x: 30 + Math.random() * Math.max(10, innerWidth - w - 60), y: Math.max(90, innerHeight - h - 40 - Math.random() * 160), tx: 0, ty: 0, wait: Math.random() * 3, drag: false, moved: false, dir: 1 };
    petPick(p); wirePet(p); PETS.push(p); el.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0)';
  });
  if (!petRaf) petRaf = requestAnimationFrame(petLoop);
}
function wirePet(p) {
  let ox = 0, oy = 0, sx = 0, sy = 0; const say = t => { const b = p.el.querySelector('.bubble'); b.textContent = t; b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 1800); };
  p.el.onpointerdown = e => { e.preventDefault(); p.drag = true; p.moved = false; ox = e.clientX - p.x; oy = e.clientY - p.y; sx = e.clientX; sy = e.clientY; p.el.setPointerCapture(e.pointerId); p.svg.classList.add('held'); p.svg.classList.remove('idle'); };
  p.el.onpointermove = e => {
    if (!p.drag) return; if (!p.moved && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) { p.moved = true; say(['ว้าย!', 'ปล่อยก่อนน๊า~', 'ลอยแล้ว!'][Math.floor(Math.random() * 3)]); }
    p.x = Math.min(innerWidth - p.w, Math.max(0, e.clientX - ox)); p.y = Math.min(innerHeight - p.h, Math.max(0, e.clientY - oy)); p.el.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0)';
  };
  p.el.onpointerup = p.el.onpointercancel = () => { if (!p.drag) return; p.drag = false; p.svg.classList.remove('held'); if (!p.moved) openTeam(); else { p.wait = 2; petPick(p); } };
}
function petLoop(t) {
  petRaf = requestAnimationFrame(petLoop); const L = byId('petLayer'); if (!L || L.classList.contains('hidden') || document.hidden) { petLast = t; return; }
  const dt = Math.min(.05, (t - petLast) / 1000 || 0); petLast = t;
  PETS.forEach(p => {
    if (!p.drag && !petCalm) {
      if (p.wait > 0) { p.wait -= dt; p.svg.classList.add('idle'); if (p.wait <= 0) petPick(p); }
      else { const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy); if (d < 5) p.wait = 2 + Math.random() * 4; else { const sp = (p.el.classList.contains('sub') ? 38 : 48) * dt; p.x += dx / d * sp; p.y += dy / d * sp; p.dir = dx >= 0 ? 1 : -1; p.svg.classList.remove('idle'); } }
      p.flip.style.transform = 'scaleX(' + p.dir + ')'; p.el.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0)';
    }
    p.el.style.zIndex = Math.round(p.y);
  });
}
setInterval(() => { const L = byId('petLayer'), tb = byId('petTeamBtn'), show = !!AUTH.user && !gameInProgress; if (L) L.classList.toggle('hidden', !show); if (tb) tb.classList.toggle('hidden', !show || byId('startScreen').classList.contains('hidden')); }, 400);
addEventListener('resize', () => PETS.forEach(p => { p.x = Math.min(p.x, innerWidth - p.w); p.y = Math.min(p.y, innerHeight - p.h); }));
function openTeam() { CH.T = loadTeam(); byId('teamModal').classList.remove('hidden'); renderTeam(); }
function renderTeam() {
  const T = CH.T, main = byId('tmMain'); main.innerHTML = '';
  Object.keys(CHARS).forEach(id => {
    const c = CHARS[id], d = document.createElement('div'); d.className = 'ccard rar-' + c.rar + (id === T.main ? ' on' : '');
    d.innerHTML = '<div class="cs">' + charSvg(c, { bust: true, still: true }) + '</div><b></b><small></small><i class="rt"></i>'; d.querySelector('b').textContent = c.n; d.querySelector('small').textContent = c.role; d.querySelector('.rt').textContent = c.rar + ' • ' + ({ auto: 'อัตโนมัติ', active: 'กดใช้', rule: 'กฎเฉพาะ' })[c.kind];
    if (!ownsChar(id)) d.classList.add('locked'); d.onclick = () => { if (!ownsChar(id)) { showToast('🔒 ' + c.n + ' ได้จากตู้สุ่ม (เร็วๆ นี้)'); return; } T.main = id; T.helpers = T.helpers.map(h => h === id ? '' : h); renderTeam(); }; main.appendChild(d);
  });
  const c = CHARS[T.main], s = SIG[c.sig];
  byId('tmDetail').innerHTML = '<b>' + c.n + '</b> — ' + c.role + '<br>พาสซีฟ: ' + c.ptxt + '<br>สกิล: ' + c.stxt + '<br>การ์ดประจำตัว: ' + s.ic + ' ' + s.n + ' — ' + s.d;
  ['tmH1', 'tmH2'].forEach((id, i) => {
    const sel = byId(id); sel.innerHTML = '<option value="">— ไม่มีผู้ช่วย —</option>' + Object.keys(CHARS).filter(x => x !== T.main && x !== T.helpers[1 - i] && ownsChar(x)).map(x => '<option value="' + x + '"' + (T.helpers[i] === x ? ' selected' : '') + '>' + CHARS[x].n + ' (' + CHARS[x].role + ')</option>').join('');
  });
  const downs = teamDowns(T), bad = downs.length > 2; byId('tmWarn').textContent = bad ? 'ทีมนี้มีข้อเสียเกิน 2 ข้อ (' + downs.length + ') ลองเปลี่ยนผู้ช่วย' : (downs.length ? 'ข้อเสียในทีม: ' + downs.length + '/2' : ''); byId('tmSave').disabled = bad;
  const slots = deckSlots(), dk = byId('tmDeck'); dk.innerHTML = ''; byId('tmDeckN').textContent = '(' + T.deck.length + '/' + slots + ' ช่อง • การ์ดฟรี 6 ใบอยู่ในกองเสมอ)';
  CARDS.forEach(cd => {
    const d = document.createElement('div'), on = cd.base || T.deck.includes(cd.id); d.className = 'dcard rar-' + cd.rar + (on ? ' on' : '') + (cd.base ? ' base' : '') + (!ownsCard(cd.id) ? ' locked' : ''); d.innerHTML = '<span>' + cd.ic + '</span><b></b><small></small>'; d.querySelector('b').textContent = cd.n; d.querySelector('small').textContent = cd.base ? 'ฟรี • ' + cd.d : cd.d;
    if (!cd.base) d.onclick = () => { if (!ownsCard(cd.id)) { showToast('🔒 การ์ดนี้ได้จากตู้สุ่ม (เร็วๆ นี้)'); return; } const i = T.deck.indexOf(cd.id); if (i >= 0) T.deck.splice(i, 1); else if (T.deck.length < slots) T.deck.push(cd.id); else showToast('เด็คเต็มแล้ว (' + slots + ' ช่อง)'); renderTeam(); }; dk.appendChild(d);
  });
}
function saveTeam() { try { localStorage.setItem(TM_SAVE, JSON.stringify(CH.T)); } catch (e) {} byId('teamModal').classList.add('hidden'); renderLobby(); showToast('✓ บันทึกทีมแล้ว'); }

let TEAM_ROLE = null;
wrap('renderMenuBar', (o, a) => { o(...a); const r = AUTH.p && AUTH.p.role; if (TEAM_ROLE !== r) { TEAM_ROLE = r; renderLobby(); } });
try { renderLobby(); } catch (e) { console.error('renderLobby:', e); }
