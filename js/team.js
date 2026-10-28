/* ล็อบบี้ตัวละครเดิน + หน้าจัดทีม (ตัวหลัก ผู้ช่วย 2 ช่อง เด็ค) */
(function () {
  const st = document.createElement('div'); st.id = 'lobbyStage'; byId('profileBar').before(st); renderLobby();
  document.body.insertAdjacentHTML('beforeend', '<div id="teamModal" class="hidden"><div class="tm"><h2>👥 จัดทีม</h2><div id="tmMain" class="cgrid"></div><div id="tmDetail" class="tmd"></div><h3>ผู้ช่วย (ได้พาสซีฟ 40% ไม่มีสกิลกด)</h3><div class="row"><select id="tmH1" class="room-input"></select><select id="tmH2" class="room-input"></select></div><div id="tmWarn" class="auth-msg"></div><h3>เด็คการ์ด <span id="tmDeckN"></span></h3><div id="tmDeck" class="dgrid"></div><div class="row"><button class="primary-btn" id="tmSave">บันทึก</button><button class="secondary-btn" id="tmClose">ปิด</button></div></div></div>');
  byId('tmClose').onclick = () => byId('teamModal').classList.add('hidden'); byId('tmSave').onclick = saveTeam;
  ['tmH1', 'tmH2'].forEach((id, i) => byId(id).onchange = e => { CH.T.helpers[i] = e.target.value; if (CH.T.helpers[0] && CH.T.helpers[0] === CH.T.helpers[1]) CH.T.helpers[1 - i] = ''; renderTeam(); });
  setInterval(() => { if (document.hidden || gameInProgress || byId('startScreen').classList.contains('hidden')) return; const w = [...document.querySelectorAll('.walker')]; if (!w.length) return; const e = w[Math.floor(Math.random() * w.length)], c = CHARS[e.dataset.id], b = e.querySelector('.bubble'); b.textContent = c.lines[Math.floor(Math.random() * c.lines.length)]; b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 3200); }, 7000);
})();
function renderLobby() {
  const st = byId('lobbyStage'); if (!st) return; st.innerHTML = ''; const t = loadTeam(), ids = [t.main, ...t.helpers.filter(Boolean)];
  ids.forEach((id, i) => {
    const c = CHARS[id], w = document.createElement('div'); w.className = 'walker' + (i ? ' sub' : ''); w.dataset.id = id; w.style.setProperty('--d', (i === 0 ? 17 : 14 + i * 4) + 's'); w.style.setProperty('--dl', (-i * 5) + 's');
    w.innerHTML = '<div class="flip">' + charSvg(c) + '</div><div class="bubble"></div><small class="wname">' + esc(c.n) + (i ? ' (ผู้ช่วย)' : '') + '</small>';
    w.onclick = openTeam; st.appendChild(w);
  });
  st.insertAdjacentHTML('beforeend', '<button class="secondary-btn tmbtn" onclick="openTeam()">👥 จัดทีม / เปลี่ยนตัวละคร</button>');
}
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
