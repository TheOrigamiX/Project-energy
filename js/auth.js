/* ล็อกอิน (อีเมล/Google/Guest), หน้าโปรไฟล์, รูปประจำตัว, เพื่อน+เชิญ, อีโมจิในห้อง */
const AUTH = { user: null, p: null, name: '', avatar: 'p:0', cfg: null, ich: null };
const PRESETS = ['⚡', '🔋', '☀️', '💨', '💧', '🔥', '☢️', '🌱', '🏭', '🛰️', '🧑‍🔧', '🦾'];
const TITLES = [[22, 'ตำนานกริด'], [14, 'ผู้อำนวยการโรงไฟฟ้า'], [8, 'วิศวกรไฟฟ้า'], [4, 'ผู้คุมสวิตช์'], [1, 'ช่างไฟฝึกหัด']];
const frameOf = t => ['#cd7f32', '#c0c8d8', '#ffe3a3', '#b8ecf7'][t >= 600 ? 3 : t >= 300 ? 2 : t >= 100 ? 1 : 0];
const titleOf = x => TITLES.find(t => lvOf(x) >= t[0])[1];
const thErr = m => ({ 'captcha verification process failed': 'ยืนยันตัวตน (CAPTCHA) ไม่ผ่าน ลองใหม่อีกครั้ง', 'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'Email not confirmed': 'ยังไม่ได้ยืนยันอีเมล', 'User already registered': 'อีเมลนี้สมัครไปแล้ว' })[m] || m;
const liveOf = (p, r) => p.bot ? Math.round(r.duration * 14 * p.skill * Math.pow(Math.min((state && state.elapsed) || 0, r.duration) / r.duration, 1.05)) : (p.live || 0);
function avatarEl(av, size, tr) {
  const e = document.createElement('span'); e.className = 'av';
  e.style.cssText = 'width:' + size + 'px;height:' + size + 'px;font-size:' + size * .55 + 'px;border-color:' + frameOf(tr || 0);
  if (av && av.startsWith('http')) { const i = document.createElement('img'); i.src = av; i.alt = ''; e.appendChild(i); }
  else { const n = parseInt((av || 'p:0').slice(2)) || 0; e.textContent = PRESETS[n % PRESETS.length]; e.style.background = 'hsl(' + (n * 37 % 360) + ',60%,32%)'; }
  return e;
}
document.body.insertAdjacentHTML('beforeend', `
<div id="authScreen" class="screen hidden"><div class="start-card auth-card">
  <h1>⚡ VoltRush</h1>
  <div class="tabs"><button class="tab on" id="tabLogin">เข้าสู่ระบบ</button><button class="tab" id="tabReg">สมัครสมาชิก</button></div>
  <input id="aName" class="room-input hidden" placeholder="ชื่อในเกม (3-16 ตัว)" maxlength="16">
  <input id="aEmail" class="room-input" type="email" placeholder="อีเมล">
  <input id="aPass" class="room-input" type="password" placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)">
  <input id="aPass2" class="room-input hidden" type="password" placeholder="ยืนยันรหัสผ่าน">
  <div id="aCaptcha" class="cap"></div>
  <div id="aMsg" class="auth-msg"></div>
  <button id="aGo" class="primary-btn">เข้าสู่ระบบ</button>
  <button id="aForgot" class="link">ลืมรหัสผ่าน?</button>
  <div class="room-or">หรือ</div>
  <button id="aGoogle" class="secondary-btn">🔵 เข้าด้วย Google</button>
  <button id="aGuest" class="secondary-btn">👤 เล่นแบบ Guest</button>
</div></div>
<div id="profileScreen" class="screen hidden"><div class="start-card ps-card">
  <div id="psHead" class="ps-head"></div>
  <div id="psTabs" class="tabs"><button class="tab" data-t="me">โปรไฟล์</button><button class="tab" data-t="stats">สถิติ</button><button class="tab" data-t="friends">เพื่อน</button></div>
  <div id="psBody"></div><button class="secondary-btn" style="margin-top:12px" onclick="closeProfileScreen()">⬅ กลับ</button>
</div></div>
<div id="reactBar" class="hidden"></div>`);
let regMode = false, capToken = '', capId = null;
const capOn = () => !!TURNSTILE_SITE_KEY;
function capOk() { if (!capOn() || capToken) return true; authMsg('รอสักครู่ กำลังยืนยันตัวตน (CAPTCHA)...'); return false; }
function capReset() { capToken = ''; if (capOn() && window.turnstile && capId !== null) try { turnstile.reset(capId); } catch (e) {} }
if (capOn()) {
  let n = 0; const iv = setInterval(() => {
    if (window.turnstile) { clearInterval(iv); capId = turnstile.render('#aCaptcha', { sitekey: TURNSTILE_SITE_KEY, theme: 'dark', callback: t => { capToken = t; authMsg(''); }, 'expired-callback': () => { capToken = ''; }, 'error-callback': () => { capToken = ''; authMsg('โหลด CAPTCHA ไม่สำเร็จ ลองรีเฟรชหน้า'); } }); }
    else if (++n > 50) { clearInterval(iv); authMsg('โหลด CAPTCHA ไม่ได้ ตรวจอินเทอร์เน็ต/โดเมนที่ตั้งใน Cloudflare'); }
  }, 200);
}
const authMsg = (t, ok) => { const m = byId('aMsg'); m.textContent = t; m.className = 'auth-msg' + (ok ? ' ok' : ''); };
function setTab(reg) {
  regMode = reg; byId('tabLogin').classList.toggle('on', !reg); byId('tabReg').classList.toggle('on', reg);
  ['aName', 'aPass2'].forEach(i => byId(i).classList.toggle('hidden', !reg)); byId('aForgot').classList.toggle('hidden', reg);
  byId('aGo').textContent = reg ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'; authMsg('');
}
const homeUrl = () => location.href.split('?')[0].split('#')[0];
async function authGo() {
  const email = byId('aEmail').value.trim(), pass = byId('aPass').value;
  if (!/^\S+@\S+\.\S+$/.test(email)) return authMsg('อีเมลไม่ถูกต้อง');
  if (pass.length < 8) return authMsg('รหัสผ่านต้องมีอย่างน้อย 8 ตัว');
  if (!capOk()) return; byId('aGo').disabled = true;
  try {
    if (regMode) {
      const name = byId('aName').value.trim();
      if (name.length < 3) throw new Error('ชื่อในเกมต้องมี 3-16 ตัว'); if (pass !== byId('aPass2').value) throw new Error('รหัสผ่านไม่ตรงกัน');
      const { data, error } = await SB.auth.signUp({ email, password: pass, options: { data: { display_name: name }, emailRedirectTo: homeUrl(), captchaToken: capToken } });
      if (error) throw error; if (!data.session) authMsg('สมัครแล้ว! ตรวจอีเมลเพื่อกดยืนยัน แล้วกลับมาเข้าสู่ระบบ', true);
    } else { const { error } = await SB.auth.signInWithPassword({ email, password: pass, options: { captchaToken: capToken } }); if (error) throw error; }
  } catch (e) { authMsg(thErr(e.message)); }
  capReset(); byId('aGo').disabled = false;
}
byId('tabLogin').onclick = () => setTab(false); byId('tabReg').onclick = () => setTab(true); byId('aGo').onclick = authGo;
byId('authScreen').addEventListener('keydown', e => { if (e.key === 'Enter') authGo(); });
byId('aGoogle').onclick = async () => { const { error } = await SB.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: homeUrl() } }); if (error) authMsg(error.message); };
byId('aGuest').onclick = async () => { if (!capOk()) return; const { error } = await SB.auth.signInAnonymously({ options: { captchaToken: capToken } }); capReset(); if (error) authMsg(thErr(error.message)); };
byId('aForgot').onclick = async () => { const email = byId('aEmail').value.trim(); if (!email) return authMsg('ใส่อีเมลก่อน'); if (!capOk()) return; const { error } = await SB.auth.resetPasswordForEmail(email, { redirectTo: homeUrl(), captchaToken: capToken }); capReset(); authMsg(error ? error.message : 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว', !error); };
async function loadMe() {
  const { data, error } = await SB.rpc('my_profile'); if (error) throw error;
  AUTH.p = data; AUTH.name = data.display_name; AUTH.avatar = data.avatar;
  if (!AUTH.cfg) { const r = await SB.from('game_config').select('cfg').eq('id', 1).maybeSingle(); AUTH.cfg = r.data && r.data.cfg; }
}
async function onAuth(ev, sess) {
  if (ev === 'PASSWORD_RECOVERY') { const pw = prompt('ตั้งรหัสผ่านใหม่ (อย่างน้อย 8 ตัว)'); if (pw && pw.length >= 8) { const { error } = await SB.auth.updateUser({ password: pw }); showToast(error ? error.message : 'เปลี่ยนรหัสผ่านแล้ว'); } }
  if (sess && sess.user) {
    if (AUTH.user && AUTH.user.id === sess.user.id) { AUTH.user = sess.user; return; }
    AUTH.user = sess.user; PID = sess.user.id;
    try { await loadMe(); } catch (e) { authMsg('โหลดโปรไฟล์ไม่สำเร็จ: ' + e.message + ' (รัน supabase.sql แล้วหรือยัง?)'); return; }
    byId('authScreen').classList.add('hidden'); if (!gameInProgress && !ROOM.code) byId('startScreen').classList.remove('hidden');
    listenInvites(); renderMenuBar();
  } else if (ev === 'SIGNED_OUT' || ev === 'INITIAL_SESSION') {
    AUTH.user = null; PID = ''; AUTH.p = null;
    ['startScreen', 'profileScreen', 'roomScreen'].forEach(i => byId(i).classList.add('hidden')); byId('authScreen').classList.remove('hidden');
  }
}
byId('startScreen').classList.add('hidden'); byId('authScreen').classList.remove('hidden');
if (SB) SB.auth.onAuthStateChange((ev, sess) => setTimeout(() => onAuth(ev, sess), 0)); else authMsg('เชื่อม Supabase ไม่ได้ ตรวจ js/config.js');
/* ---------- หน้าโปรไฟล์ ---------- */
function openProfileScreen(tab) { ['startScreen', 'roomScreen'].forEach(i => byId(i).classList.add('hidden')); byId('profileScreen').classList.remove('hidden'); renderPS(tab || 'me'); }
function closeProfileScreen() { byId('profileScreen').classList.add('hidden'); byId(ROOM.code ? 'roomScreen' : 'startScreen').classList.remove('hidden'); renderMenuBar(); }
byId('psTabs').onclick = e => { const t = e.target.dataset.t; if (t) renderPS(t); };
const psMsg = (t, ok) => { const m = byId('psMsg'); if (m) { m.textContent = t; m.className = 'auth-msg' + (ok ? ' ok' : ''); } };
async function renderPS(tab) {
  const p = AUTH.p, lv = lvOf(p.xp), lo = (lv - 1) * (lv - 1) * 80, hi = lv * lv * 80, hd = byId('psHead'); hd.innerHTML = '';
  hd.appendChild(avatarEl(AUTH.avatar, 72, p.trophies));
  const t = document.createElement('div'); t.innerHTML = '<b></b><div></div><div class="xpbar"><i></i></div>';
  t.children[0].textContent = AUTH.name; t.children[1].textContent = titleOf(p.xp) + ' • Lv.' + lv + ' • 🏆 ' + p.trophies + ' ' + leagueOf(p.trophies);
  t.querySelector('i').style.width = Math.min(100, (p.xp - lo) / (hi - lo) * 100) + '%'; hd.appendChild(t);
  document.querySelectorAll('#psTabs .tab').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  const b = byId('psBody'); b.innerHTML = ''; if (tab === 'me') psMe(b); else if (tab === 'stats') await psStats(b); else await psFriends(b);
}
function psMe(b) {
  b.innerHTML = '<h3>ชื่อในเกม</h3><div class="row"><input id="psName" class="room-input" maxlength="16"><button class="secondary-btn" id="psSave">บันทึก</button></div><h3>รูปประจำตัว</h3><div id="psPresets" class="presets"></div><div class="row"><label class="secondary-btn upl">📷 อัปโหลดรูปของคุณ<input type="file" id="psFile" accept="image/*" hidden></label></div><div id="psMsg" class="auth-msg"></div><div id="psGuest"></div><button class="secondary-btn" id="psOut">🚪 ออกจากระบบ</button>';
  byId('psName').value = AUTH.name;
  PRESETS.forEach((_, i) => { const bt = document.createElement('button'); bt.className = 'pbtn' + (AUTH.avatar === 'p:' + i ? ' on' : ''); bt.appendChild(avatarEl('p:' + i, 44, AUTH.p.trophies)); bt.onclick = () => saveProfile(null, 'p:' + i); byId('psPresets').appendChild(bt); });
  byId('psSave').onclick = () => saveProfile(byId('psName').value, AUTH.avatar);
  byId('psFile').onchange = e => uploadAvatar(e.target.files[0]); byId('psOut').onclick = () => SB.auth.signOut();
  if (AUTH.user.is_anonymous) {
    byId('psGuest').innerHTML = '<h3>ผูกบัญชี (ตอนนี้เป็น Guest)</h3><input id="gEmail" class="room-input" type="email" placeholder="อีเมล"><input id="gPass" class="room-input" type="password" placeholder="รหัสผ่าน ≥8 ตัว"><button class="primary-btn" id="gBind">ผูกบัญชี</button>';
    byId('gBind').onclick = async () => { const { error } = await SB.auth.updateUser({ email: byId('gEmail').value.trim(), password: byId('gPass').value }); psMsg(error ? thErr(error.message) : 'ส่งอีเมลยืนยันแล้ว กดลิงก์ในอีเมลเพื่อผูกบัญชี', !error); };
  }
}
async function saveProfile(name, avatar) {
  const { data, error } = await SB.rpc('set_profile', { p_name: name || AUTH.name, p_avatar: avatar }); if (error) return psMsg(error.message);
  AUTH.p = data; AUTH.name = data.display_name; AUTH.avatar = data.avatar; await renderPS('me'); psMsg('บันทึกแล้ว ✓', true); renderMenuBar();
}
async function uploadAvatar(f) {
  if (!f) return; if (!f.type.startsWith('image/')) return psMsg('เลือกไฟล์รูปภาพเท่านั้น');
  try {
    const bmp = await createImageBitmap(f), c = document.createElement('canvas'); c.width = c.height = 256; const s = Math.min(bmp.width, bmp.height);
    c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 256, 256);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .85)), path = AUTH.user.id + '/avatar.jpg';
    const { error } = await SB.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' }); if (error) throw error;
    await saveProfile(null, SB.storage.from('avatars').getPublicUrl(path).data.publicUrl + '?v=' + Date.now());
  } catch (e) { psMsg('อัปโหลดไม่สำเร็จ: ' + e.message); }
}
async function psStats(b) {
  const p = AUTH.p, c = AUTH.cfg || { mission_need: [2, 2000, 6], mission_xp: [60, 80, 80] };
  const { data: runs } = await SB.from('runs').select('mode,score,wave,elapsed').not('finished_at', 'is', null).order('finished_at', { ascending: false }).limit(20);
  const rs = runs || [], avg = rs.length ? Math.round(rs.reduce((t, r) => t + r.score, 0) / rs.length) : 0, mins = Math.round(rs.reduce((t, r) => t + (r.elapsed || 0), 0) / 60), mx = Math.max(1, ...rs.map(r => r.score));
  const ml = [['เล่นให้ครบ ' + c.mission_need[0] + ' รอบ', p.m_runs, c.mission_need[0]], ['ทำคะแนนเกิน ' + c.mission_need[1], p.m_best, c.mission_need[1]], ['ไปให้ถึง Wave ' + c.mission_need[2], p.m_wave, c.mission_need[2]]];
  b.innerHTML = '<h3>📊 สถิติ</h3><p>เล่นแล้ว ' + p.runs + ' รอบ • คะแนนสูงสุด ' + p.best + ' • Wave สูงสุด ' + p.max_wave + '<br>20 รอบล่าสุด: เฉลี่ย ' + avg + ' • เวลารวม ' + mins + ' นาที</p><svg class="spark" viewBox="0 0 200 50">' +
    rs.slice().reverse().map((r, i) => '<rect x="' + i * 10 + '" y="' + (50 - r.score / mx * 48) + '" width="8" height="' + (r.score / mx * 48) + '" rx="2"/>').join('') + '</svg><h3>📋 ภารกิจวันนี้</h3><ul>' +
    ml.map((m, i) => '<li>' + (p.m_done.includes(i + 1) ? '✅' : '⬜') + ' ' + m[0] + ' (' + Math.min(m[1], m[2]) + '/' + m[2] + ') +' + c.mission_xp[i] + ' XP</li>').join('') + '</ul><h3>🏅 ความสำเร็จ</h3><ul>' +
    Object.keys(ACHS).map(k => '<li>' + (p.ach.includes(k) ? '✅' : '🔒') + ' ' + ACHS[k] + '</li>').join('') + '</ul><h3>📅 อันดับ Daily วันนี้</h3><ol id="dailyBoard"><li>กำลังโหลด...</li></ol><h3>🕘 ประวัติล่าสุด</h3><ul>' +
    rs.slice(0, 10).map(r => '<li>' + esc(r.mode) + ' • ' + r.score + ' คะแนน • Wave ' + r.wave + '</li>').join('') + '</ul>';
  const { data: d } = await SB.rpc('daily_board'), ol = byId('dailyBoard'); ol.innerHTML = '';
  (d || []).slice(0, 10).forEach(e => { const li = document.createElement('li'); li.textContent = e.name + ' — ' + e.score; ol.appendChild(li); }); if (!ol.children.length) ol.innerHTML = '<li>ยังไม่มีใครเล่น</li>';
}
async function psFriends(b) {
  b.innerHTML = '<h3>👥 เพื่อน</h3><div class="row"><input id="fName" class="room-input" placeholder="ชื่อเพื่อนในเกม"><button class="secondary-btn" id="fAdd">เพิ่ม</button></div><div id="psMsg" class="auth-msg"></div><div id="fList"></div>';
  byId('fAdd').onclick = async () => { const { data, error } = await SB.rpc('friend_add', { p_name: byId('fName').value }); if (error) return psMsg(error.message); await psFriends(b); psMsg(data === 'accepted' ? 'เป็นเพื่อนกันแล้ว' : 'ส่งคำขอแล้ว', true); };
  const { data } = await SB.rpc('friend_list'), L = byId('fList'); L.innerHTML = '';
  (data || []).forEach(f => {
    const r = document.createElement('div'); r.className = 'frow'; r.appendChild(avatarEl(f.avatar, 36, f.trophies));
    const n = document.createElement('span'); n.textContent = f.name + (f.status === 'pending' ? (f.incoming ? ' (ขอเป็นเพื่อน)' : ' (รอตอบรับ)') : ' • 🏆 ' + f.trophies); r.appendChild(n);
    const mk = (t, fn) => { const a = document.createElement('button'); a.className = 'secondary-btn'; a.textContent = t; a.onclick = fn; r.appendChild(a); };
    if (f.incoming) mk('รับ', async () => { await SB.rpc('friend_add', { p_name: f.name }); psFriends(b); });
    else if (f.status === 'accepted' && ROOM.code) mk('เชิญ', async () => { const { error } = await SB.rpc('invite_friend', { p_to: f.id, p_code: ROOM.code }); showToast(error ? error.message : 'ส่งคำเชิญแล้ว'); });
    L.appendChild(r);
  });
  if (!(data || []).length) L.textContent = 'ยังไม่มีเพื่อน';
}
function listenInvites() {
  if (AUTH.ich) SB.removeChannel(AUTH.ich);
  AUTH.ich = SB.channel('inv-' + AUTH.user.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invites', filter: 'to_id=eq.' + AUTH.user.id }, async p => {
    const { data } = await SB.from('profiles').select('display_name').eq('id', p.new.from_id).maybeSingle(); showInvite((data && data.display_name) || 'เพื่อน', p.new.code);
  }).subscribe();
}
function showInvite(n, code) {
  const old = byId('inviteBox'); if (old) old.remove();
  const b = document.createElement('div'); b.id = 'inviteBox'; const t = document.createElement('span'); t.textContent = '📨 ' + n + ' ชวนเข้าห้อง ' + code;
  const y = document.createElement('button'); y.className = 'primary-btn'; y.textContent = 'เข้าร่วม';
  y.onclick = async () => { b.remove(); if (ROOM.code) leaveRoom(); await joinRoom(code, AUTH.name); ['startScreen', 'profileScreen'].forEach(i => byId(i).classList.add('hidden')); byId('roomScreen').classList.remove('hidden'); };
  const x = document.createElement('button'); x.className = 'secondary-btn'; x.textContent = '✕'; x.onclick = () => b.remove(); b.append(t, y, x); document.body.appendChild(b); setTimeout(() => b.remove(), 20000);
}
document.querySelector('#roomLobby .start-actions').insertAdjacentHTML('afterbegin', '<button class="secondary-btn" onclick="openProfileScreen(\'friends\')">👥 เชิญเพื่อน</button>');
wrap('joinRoom', async (o, a) => { try { return await o(...a); } catch (e) { showToast(e.message || 'เข้าห้องไม่ได้'); } });
wrap('createRoom', async (o, a) => { try { return await o(...a); } catch (e) { showToast(e.message || 'สร้างห้องไม่ได้'); } });
/* ---------- อีโมจิตอบโต้ในห้อง (Realtime broadcast) ---------- */
let RCH = null, RCODE = '';
['👍', '😂', '😱', '🔥'].forEach(e => { const b = document.createElement('button'); b.textContent = e; b.onclick = () => sendReact(e); byId('reactBar').appendChild(b); });
function reactCh() {
  if (!ROOM.code) return null;
  if (RCODE !== ROOM.code) { if (RCH) SB.removeChannel(RCH); RCODE = ROOM.code; RCH = SB.channel('react-' + RCODE).on('broadcast', { event: 'r' }, p => fxFloat(p.payload.e + ' ' + p.payload.n, innerWidth * (.15 + Math.random() * .7), innerHeight * .55, '#fff')).subscribe(); }
  return RCH;
}
function sendReact(e) { const c = reactCh(); if (c) { c.send({ type: 'broadcast', event: 'r', payload: { e, n: AUTH.name } }); fxFloat(e, innerWidth / 2, innerHeight * .55); } }
setInterval(() => { byId('reactBar').classList.toggle('hidden', !ROOM.code); if (ROOM.code) reactCh(); else if (RCH) { SB.removeChannel(RCH); RCH = null; RCODE = ''; } }, 1500);
