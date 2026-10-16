/* ==================================================================
   BACKEND — Supabase (REST ผ่าน fetch ไม่ต้องใช้ไลบรารี ไม่มี build step)
   ใส่ค่าสองตัวนี้จาก Supabase > Project Settings > API แล้วรัน supabase/schema.sql
   ถ้าเว้นว่าง เกมจะใช้ Firebase หรือ localStorage ตามเดิม
================================================================== */
const SUPABASE_URL = '';        // เช่น https://xxxx.supabase.co
const SUPABASE_ANON_KEY = '';   // anon public key (อยู่ในหน้าเว็บได้ ตราบที่เปิด RLS ตาม schema.sql)

const BackendSupabase = (function () {
  const enabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  const tagFor = sec => sec === 0 ? 'infinite' : String(sec);

  async function saveScore(entry, sec) {
    if (!enabled) return false;
    try {
      const r = await fetch(SUPABASE_URL + '/rest/v1/scores', { method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, headers),
        body: JSON.stringify({ duration: tagFor(sec), name: entry.name, score: entry.score, elapsed: entry.elapsed || null, ts: entry.ts }) });
      if (!r.ok) throw new Error(r.status + ' ' + await r.text());
      return true;
    } catch (e) { console.error('บันทึกคะแนนขึ้น Supabase ล้มเหลว:', e); return false; }
  }
  async function loadLeaderboard(sec, period) {
    if (!enabled) return null;
    try {
      const q = '?select=name,score,elapsed,ts&duration=eq.' + tagFor(sec) + (period === 'all' ? '' : '&ts=gte.' + getPeriodStart(period)) + '&order=score.desc&limit=100';
      const r = await fetch(SUPABASE_URL + '/rest/v1/scores' + q, { headers: headers });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) { console.error('โหลด Leaderboard จาก Supabase ล้มเหลว:', e); return null; }
  }
  return { name: 'supabase', enabled: enabled, saveScore: saveScore, loadLeaderboard: loadLeaderboard };
})();
