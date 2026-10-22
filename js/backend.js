/* ชั้นฐานข้อมูล: สลับ Firebase / Supabase ที่ config.js ส่วนอื่นเรียกผ่าน DB, DB_ENABLED, saveScoreRemote, loadLeaderboardRemote */
let DB = null, DB_ENABLED = false, SB = null;
function makeSupabaseDb(sb) {
  const chs = {}, seg = p => p.split('/').filter(Boolean);
  const nest = (path, v) => path.reduceRight((acc, k) => ({ [k]: acc }), v);
  const merge = (a, b) => { for (const k in b) a[k] = (b[k] && typeof b[k] === 'object' && a[k] && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; return a; };
  const patch = (code, tree) => sb.rpc('room_merge', { p_code: code, p_patch: tree });
  const R = base => ({
    child: p => R(base + '/' + p),
    async once() { const { data } = await sb.from('rooms').select('data').eq('code', seg(base)[1]).maybeSingle(); const v = data ? data.data : null; return { exists: () => !!v, val: () => v }; },
    set(v) { const s = seg(base); return s.length === 2 ? sb.from('rooms').upsert({ code: s[1], data: v }) : patch(s[1], nest(s.slice(2), v)); },
    update(o) { const t = {}; for (const k in o) { const f = seg(base).concat(seg(k)); merge(t[f[1]] = t[f[1]] || {}, nest(f.slice(2), o[k])); } return Promise.all(Object.keys(t).map(c => patch(c, t[c]))); },
    remove() { const s = seg(base); return patch(s[1], nest(s.slice(2), null)); },
    on(_, cb) {
      const c = seg(base)[1];
      R(base).once().then(x => cb({ val: () => x.val() }));
      chs[base] = sb.channel('room-' + c).on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: 'code=eq.' + c },
        p => cb({ val: () => p.eventType === 'DELETE' ? null : p.new.data })).subscribe();
    },
    off() { if (chs[base]) { sb.removeChannel(chs[base]); delete chs[base]; } },
    onDisconnect() { return { set: v => addEventListener('pagehide', () => R(base).set(v)) }; }
  });
  return { ref: p => R(p || '') };
}
(function () {
  try {
    if (BACKEND_TYPE === 'supabase') {
      if (!window.supabase || !SUPABASE_CONFIG.url) throw new Error('supabase ยังไม่ตั้งค่า');
      SB = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey); DB = makeSupabaseDb(SB);
    } else {
      if (typeof firebase === 'undefined') throw new Error('ไม่พบ Firebase SDK');
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      DB = firebase.database();
    }
    DB_ENABLED = true;
  } catch (e) { console.warn('ไม่มีฐานข้อมูล ใช้ localStorage แทน:', e); }
})();
const durTag = sec => sec === 0 ? 'infinite' : String(sec);
async function saveScoreRemote(entry, sec) {
  if (!DB_ENABLED) return;
  try {
    const clean = JSON.parse(JSON.stringify(entry));
    if (BACKEND_TYPE === 'supabase') await SB.from('scores').insert({ dur: durTag(sec), name: clean.name, score: clean.score, elapsed: clean.elapsed ?? null, ts: clean.ts, date: clean.date, week: clean.week });
    else await DB.ref('leaderboards/' + durTag(sec)).push(clean);
  } catch (e) { console.error('บันทึกคะแนนล้มเหลว:', e); }
}
async function loadLeaderboardRemote(sec, period) {
  if (!DB_ENABLED) return null;
  try {
    const tag = durTag(sec), now = new Date();
    if (BACKEND_TYPE === 'supabase') {
      let q = SB.from('scores').select('name,score,elapsed,ts,date,week').eq('dur', tag);
      if (period === 'daily') q = q.eq('date', getDateKey(now)); else if (period === 'weekly') q = q.eq('week', getWeekKey(now));
      const { data, error } = await q.order('score', { ascending: false }).limit(100);
      if (error) throw error; return data;
    }
    let q = DB.ref('leaderboards/' + tag);
    q = period === 'daily' ? q.orderByChild('date').equalTo(getDateKey(now)) : period === 'weekly' ? q.orderByChild('week').equalTo(getWeekKey(now)) : q.orderByChild('score').limitToLast(100);
    const snap = await q.once('value'), list = [];
    snap.forEach(c => { list.push(c.val()); });
    return list.sort((a, b) => b.score - a.score).slice(0, 100);
  } catch (e) { console.error('โหลดอันดับล้มเหลว:', e); return null; }
}
