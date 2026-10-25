/* โปรไฟล์/รอบเล่น: ทุกอย่างบันทึกและตรวจฝั่งเซิร์ฟเวอร์ (RPC: start_run / submit_run) */
let DAILY = false, RUN = null, DAILY_SEED = 0;
const lvOf = x => Math.floor(Math.sqrt(x / 80)) + 1;
const LEAGUES = [[600, '💎 ไดมอนด์'], [300, '🥇 โกลด์'], [100, '🥈 ซิลเวอร์'], [0, '🥉 บรอนซ์']];
const leagueOf = t => LEAGUES.find(l => t >= l[0])[1];
const ACHS = { w10: 'ถึง Wave 10', c30: 'คอมโบ 30', tw: 'ชนะ Tournament', l5: 'ถึงเลเวล 5' };
function levelUp(l) { showToast('⭐ เลเวลอัพ! Lv.' + l); MAPS.forEach(m => { if (m.lv === l) showToast('🗺 ปลดล็อกแผนที่ ' + m.n); }); fxConfetti(); }
async function beginRun(mode, dur) {
  RUN = null;
  try { const { data, error } = await SB.rpc('start_run', { p_mode: mode, p_dur: dur }); if (error) throw error; RUN = data; return data; }
  catch (e) { showToast(e.message); return null; }
}
async function submitRun() {
  const run = RUN; RUN = null; DAILY = false; if (!run) return;
  try {
    const sc = Math.round(currentScore()), old = AUTH.p;
    const { data, error } = await SB.rpc('submit_run', { p_run: run.run, p_score: sc, p_wave: (state && state.wave) || 0, p_elapsed: (state && state.elapsed) | 0, p_streak: (state && state.maxStreak) || 0 });
    if (error) throw error; AUTH.p = data.profile;
    showSaveStat(data, run, sc);
    if (lvOf(AUTH.p.xp) > lvOf(old.xp)) levelUp(lvOf(AUTH.p.xp)); renderMenuBar();
  } catch (e) {
    if (/fetch|network|load failed/i.test(e.message || '')) { try { localStorage.setItem('voltrushPending', JSON.stringify({ run: run.run, score: Math.round(currentScore()), wave: (state && state.wave) || 0, elapsed: (state && state.elapsed) | 0, streak: (state && state.maxStreak) || 0 })); } catch (x) {} showToast('เน็ตหลุด จะส่งผลให้ใหม่เมื่อกลับมาออนไลน์'); const el = byId('saveStat'); if (el) { el.className = 'save-stat bad'; el.textContent = '⚠️ ยังไม่ได้บันทึก (เน็ตหลุด) จะส่งให้อัตโนมัติเมื่อกลับมาออนไลน์'; } }
    else showToast('บันทึกผลไม่สำเร็จ: ' + e.message);
  }
}
async function startDaily() {
  const { data: st, error } = await SB.rpc('daily_status'); if (error) { showToast(error.message); return false; }
  if (st.state === 'done') { showToast('วันนี้เล่น Daily แล้ว ได้ ' + st.score + ' คะแนน'); return false; }
  let run = { run: st.run, day: st.day };
  if (st.state === 'new') { run = await beginRun('daily', 180); if (!run) return false; } else RUN = run;
  let h = 0; for (const c of run.day) h = (h * 31 + c.charCodeAt(0)) | 0; DAILY_SEED = h >>> 0; selectedDuration = 180;
  if (st.state === 'active' && st.snapshot && st.snapshot.state) RESUME = Object.assign({}, st.snapshot, { run, daily: true, seed: DAILY_SEED, sel: 180 });
  else { DAILY = true; rng = mulberry32(DAILY_SEED); CUR_MAP = DAILY_SEED % MAPS.length; }
  startGame(); return true;
}
wrap('startGame', (o, a) => {
  if (!DAILY && !RESUME) { if (!ROOM.code) { rng = Math.random; CUR_MAP = SEL_MAP; } beginRun(ROOM.code ? (ROOM.data && ROOM.data.tournament ? 'tour' : 'room') : 'solo', Number(selectedDuration) || 0); }
  return o(...a);
});
wrap('endGame', (o, a) => { const r = o(...a); submitRun(); if (!ROOM.code) rng = Math.random; return r; });
function renderMenuBar() {
  const b = byId('profileBar'); if (!b || !AUTH.p) return; b.innerHTML = ''; const p = AUTH.p;
  b.appendChild(avatarEl(AUTH.avatar, 46, p.trophies)); const t = document.createElement('div'); t.innerHTML = '<b></b><small></small>';
  t.children[0].textContent = AUTH.name; t.children[1].textContent = titleOf(p.xp) + ' • Lv.' + lvOf(p.xp) + ' • ⭐ ' + p.xp + ' XP • 🏆 ' + p.trophies + ' ' + leagueOf(p.trophies); b.appendChild(t);
  const ms = byId('mapSel'), lv = lvOf(p.xp); ms.innerHTML = '';
  MAPS.forEach((m, i) => { const c = document.createElement('button'); c.className = 'mchip' + (i === SEL_MAP ? ' on' : ''); c.textContent = lv >= m.lv ? m.n : '🔒 Lv.' + m.lv; c.disabled = lv < m.lv; c.onclick = () => { SEL_MAP = i; renderMenuBar(); }; ms.appendChild(c); });
}
(function () {
  const sa = document.querySelector('#startScreen .start-actions'), pb = document.createElement('div'), ms = document.createElement('div');
  pb.id = 'profileBar'; pb.onclick = () => openProfileScreen('me'); ms.id = 'mapSel'; sa.before(pb, ms);
  const mk = (t, f, c) => { const b = document.createElement('button'); b.className = c; b.textContent = t; b.onclick = f; sa.appendChild(b); };
  mk('🏆 Tournament (สุ่มคู่แข่ง)', () => startTournament(), 'primary-btn'); mk('📅 Daily Challenge', () => startDaily(), 'secondary-btn');
})();
