/* Tournament: จับคู่ฝั่งเซิร์ฟเวอร์ (mm_poll) 2-4 คน ครบ 20 วิให้บอทเติม บอทคำนวณคะแนนฝั่ง client แบบกำหนดแน่นอน */
const MM = { on: false, t0: 0, tick: 0, busy: false };
function queueBox(on) {
  let b = byId('queueBox');
  if (!b) { b = document.createElement('div'); b.id = 'queueBox'; b.className = 'hidden'; b.innerHTML = '<div class="qb"><div class="qb-ico">🏆</div><h2>กำลังหาคู่แข่ง...</h2><div id="qbTxt"></div><button class="secondary-btn" onclick="cancelQueue()">ยกเลิก</button></div>'; document.body.appendChild(b); }
  b.classList.toggle('hidden', !on);
}
async function pollQueue() {
  if (!MM.on || MM.busy) return; MM.busy = true;
  try {
    const { data, error } = await SB.rpc('mm_poll'); byId('qbTxt').textContent = 'รอ ' + Math.round((Date.now() - MM.t0) / 1000) + ' วิ';
    if (error) { showToast(error.message); cancelQueue(); }
    else if (data) { MM.on = false; clearInterval(MM.tick); queueBox(false); await joinRoom(data, AUTH.name); ['startScreen', 'profileScreen'].forEach(i => byId(i).classList.add('hidden')); byId('roomScreen').classList.remove('hidden'); }
  } finally { MM.busy = false; }
}
function startTournament() { if (!AUTH.user) return; MM.on = true; MM.t0 = Date.now(); queueBox(true); clearInterval(MM.tick); pollQueue(); MM.tick = setInterval(pollQueue, 2000); }
function cancelQueue() { MM.on = false; clearInterval(MM.tick); queueBox(false); SB.rpc('mm_cancel'); }
wrap('onRoom', (o, a) => {
  o(...a); const r = ROOM.data; if (!r || !r.tournament) return;
  if (r.host === PID && r.status === 'lobby' && ROOM.auto !== ROOM.code && Object.keys(r.players || {}).length >= r.expect) { ROOM.auto = ROOM.code; setTimeout(hostStart, 2500); }
  if (r.status === 'finished' && ROOM.rew !== ROOM.code) {
    ROOM.rew = ROOM.code;
    SB.rpc('claim_tournament', { p_code: ROOM.code }).then(({ data, error }) => { if (error) return; AUTH.p = data.profile; showToast('🏆 อันดับ ' + data.rank + '/' + data.n + ' → ถ้วย ' + (data.delta > 0 ? '+' : '') + data.delta); renderMenuBar(); });
  }
});
