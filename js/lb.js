/* อันดับละเอียด (รูป/เลเวล/ข้อมูลผู้เล่น), เวลารีเซ็ตแบบไทย, ปุ่ม Daily, บันทึกคะแนนอัตโนมัติ, ห้อง 2 ปุ่ม */
const BKK = 7 * 3600e3, LB = { mode: 'solo' };
const hms = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
window.getNextDailyReset = now => new Date((Math.floor((now.getTime() + BKK) / 864e5) + 1) * 864e5 - BKK);
window.getNextWeeklyReset = now => { const d = Math.floor((now.getTime() + BKK) / 864e5), du = (((1 - (d + 4) % 7) + 7) % 7) || 7; return new Date((d + du) * 864e5 - BKK); };
const nextSeason = now => { const d = new Date(now.getTime() + BKK); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - BKK); };
window.updateLbCountdownText = () => {
  const el = byId('lbResetCountdown'); if (!el) return; const now = new Date(); let next, label;
  if (LB.mode === 'daily') { next = getNextDailyReset(now); label = 'Daily รีเซ็ตเที่ยงคืนเวลาไทย'; }
  else if (LB.mode === 'tour') { next = nextSeason(now); label = 'ขึ้นฤดูกาลใหม่ ถ้วยลดครึ่ง'; }
  else if (lbViewPeriod === 'daily') { next = getNextDailyReset(now); label = 'อันดับรายวัน'; }
  else if (lbViewPeriod === 'weekly') { next = getNextWeeklyReset(now); label = 'อันดับรายสัปดาห์ (จันทร์ 00:00)'; }
  else { el.classList.add('hidden'); return; }
  el.classList.remove('hidden'); el.textContent = '⏳ รีเซ็ตใน ' + hms(next - now) + ' (' + label + ')';
};
const approx = n => n < 10 ? n : Math.floor(n / 10) * 10 + '+';
function lbRow(e, i, sub) {
  const li = document.createElement('li'); li.className = 'lbrow' + (e.uid === PID ? ' me' : '');
  const rk = document.createElement('b'); rk.className = 'lbrk'; rk.textContent = ['🥇', '🥈', '🥉'][i] || (i + 1);
  const nm = document.createElement('div'); nm.className = 'lbnm'; nm.innerHTML = '<span class="n"></span><small></small>';
  nm.querySelector('.n').textContent = e.name; nm.querySelector('small').textContent = 'Lv.' + (e.level || 1) + ' • ' + leagueOf(e.trophies || 0) + (sub ? ' • ' + sub : '');
  const sc = document.createElement('span'); sc.className = 'lbsc'; sc.textContent = LB.mode === 'tour' ? '🏆 ' + e.trophies : e.score;
  li.append(rk, avatarEl(e.avatar, 40, e.trophies || 0), nm, sc);
  li.onclick = () => { let d = li.querySelector('.lbinfo'); if (d) { d.remove(); return; } d = document.createElement('div'); d.className = 'lbinfo'; d.textContent = titleOf(e.xp || 0) + ' • คะแนนสูงสุด ' + (e.best || 0) + ' • เล่นแล้ว ~' + approx(e.runs || 0) + ' รอบ • Wave สูงสุด ' + (e.max_wave || 0); li.appendChild(d); };
  return li;
}
async function lbLoad() {
  if (LB.mode === 'daily') return (await SB.rpc('daily_board')).data;
  if (LB.mode === 'tour') return (await SB.rpc('leaderboard_tour')).data;
  return loadLeaderboardRemote(lbViewDuration, lbViewPeriod);
}
window.renderLeaderboardView = async function () {
  const ol = byId('lbViewList'); ol.innerHTML = '<li>กำลังโหลด...</li>'; const list = DB_ENABLED ? await lbLoad() : null; ol.innerHTML = '';
  if (!list || !list.length) { ol.innerHTML = '<li>ยังไม่มีข้อมูล</li>'; return; }
  list.forEach((e, i) => ol.appendChild(lbRow(e, i, LB.mode === 'solo' && lbViewDuration === 0 && e.elapsed ? '⏱ ' + formatTime(e.elapsed) : '')));
};
window.renderLeaderboard = async function () {
  const sec = state.infinite ? 0 : TOTAL_TIME, list = DB_ENABLED ? await loadLeaderboardRemote(sec, 'all') : null, ol = byId('leaderboardList'); ol.innerHTML = ''; LB.mode = 'solo';
  if (!list || !list.length) { ol.innerHTML = '<li>ยังไม่มีคะแนน</li>'; return; }
  list.slice(0, 20).forEach((e, i) => ol.appendChild(lbRow(e, i, sec === 0 && e.elapsed ? '⏱ ' + formatTime(e.elapsed) : '')));
};
(function () {
  const dt = byId('lbDurationTabs'); if (!dt) return; const t = document.createElement('div'); t.id = 'lbModeTabs'; t.className = dt.className;
  [['solo', '🎮 เล่นเดี่ยว'], ['tour', '🏆 Tournament'], ['daily', '📅 Daily']].forEach(([m, l]) => { const b = document.createElement('button'); b.className = 'dur-btn'; b.dataset.mode = m; b.textContent = l; b.onclick = () => selectLbMode(m); t.appendChild(b); }); dt.before(t);
})();
function syncMode() { document.querySelectorAll('#lbModeTabs .dur-btn').forEach(b => b.classList.toggle('selected', b.dataset.mode === LB.mode)); ['lbDurationTabs', 'lbPeriodTabs'].forEach(i => { const e = byId(i); if (e) e.classList.toggle('hidden', LB.mode !== 'solo'); }); }
function selectLbMode(m) { LB.mode = m; syncMode(); renderLeaderboardView(); updateLbCountdownText(); }
wrap('openLeaderboard', (o, a) => { LB.mode = 'solo'; const r = o(...a); syncMode(); return r; });
/* ---- บันทึกคะแนนอัตโนมัติ ---- */
document.querySelector('#endScreen .save-row').insertAdjacentHTML('beforebegin', '<div id="saveStat" class="save-stat">กำลังบันทึกคะแนน…</div>');
wrap('endGame', (o, a) => { const e = byId('saveStat'); if (e) { e.className = 'save-stat'; e.textContent = 'กำลังบันทึกคะแนน…'; } return o(...a); });
async function showSaveStat(d, run, sc) {
  const el = byId('saveStat'); if (!el) return;
  if (d.score === 0 && sc > 0) { el.className = 'save-stat bad'; el.textContent = '⚠️ คะแนนผิดปกติ ไม่ถูกบันทึก'; return; }
  const { data: r } = await SB.rpc('my_rank', { p_run: run.run });
  el.className = 'save-stat ok'; el.textContent = '✓ บันทึกคะแนนแล้ว • อันดับที่ ' + (r ? r.day : '-') + ' ของวันนี้ • อันดับที่ ' + (r ? r.all : '-') + ' ตลอดกาล (+' + d.gained + ' XP)';
  renderLeaderboard(); dailyBtnSync();
}
/* ---- ปุ่ม Daily ---- */
let DST = null;
(function () { const b = [...document.querySelectorAll('#startScreen .start-actions button')].find(x => x.textContent.startsWith('📅')); if (b) b.id = 'dailyBtn'; })();
async function dailyBtnSync() { if (!byId('dailyBtn') || !AUTH.user) return; const { data } = await SB.rpc('daily_status'); DST = data; tickDaily(); }
function tickDaily() {
  const b = byId('dailyBtn'); if (!b || !DST) return; const ms = getNextDailyReset(new Date()) - new Date(), left = hms(ms);
  if (ms <= 0 && !tickDaily.rs) { tickDaily.rs = 1; setTimeout(() => { tickDaily.rs = 0; dailyBtnSync(); }, 1500); }
  if (DST.state === 'done') { b.disabled = true; b.textContent = '📅 Daily เล่นแล้ว • ' + DST.score + ' คะแนน • รีเซ็ตใน ' + left; }
  else if (DST.state === 'active') { b.disabled = false; b.textContent = '📅 Daily ▶ เล่นต่อ' + (DST.wave ? ' (Wave ' + DST.wave + ')' : '') + ' • เหลือ ' + left; }
  else { b.disabled = false; b.textContent = '📅 Daily Challenge • รีเซ็ตใน ' + left; }
}
setInterval(tickDaily, 1000); document.addEventListener('visibilitychange', () => { if (!document.hidden) dailyBtnSync(); });
/* ---- ห้องเพื่อน: 2 ปุ่ม สร้างห้อง / เข้าร่วม ---- */
const reEl = byId('roomEntry'), reCh = [...reEl.children];
reEl.insertAdjacentHTML('beforebegin', '<div id="roomChoice"><button class="primary-btn big" onclick="roomMode(\'create\')">➕ สร้างห้อง</button><button class="secondary-btn big" onclick="roomMode(\'join\')">🔑 เข้าร่วมห้อง</button><button class="link" onclick="leaveRoom()">⬅ กลับ</button></div>');
function roomMode(m) {
  byId('roomChoice').classList.toggle('hidden', m !== 'choice'); reEl.classList.toggle('hidden', m === 'choice'); reCh[0].classList.add('hidden');
  reCh[1].classList.toggle('hidden', m !== 'create'); reCh[2].classList.toggle('hidden', m !== 'create'); reCh[3].classList.add('hidden'); reCh[4].classList.toggle('hidden', m !== 'join');
  reCh[5].onclick = () => roomMode('choice');
}
roomMode('choice');
wrap('openRoom', (o, a) => { const r = o(...a); roomMode('choice'); return r; });
wrap('joinRoom', async (o, a) => { const r = await o(...a); if (ROOM.code) byId('roomChoice').classList.add('hidden'); return r; });
