/* ชั้นฐานข้อมูล: สลับ Firebase / Supabase ที่ config.js ส่วนอื่นเรียกผ่าน DB, DB_ENABLED, saveScoreRemote, loadLeaderboardRemote */
let DB = null, DB_ENABLED = false, SB = null;
function makeSupabaseDb(sb) {
  const chs = {}, seg = p => p.split('/').filter(Boolean);
  const nest = (path, v) => path.reduceRight((acc, k) => ({ [k]: acc }), v);
  const merge = (a, b) => { for (const k in b) a[k] = (b[k] && typeof b[k] === 'object' && a[k] && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; return a; };
  const ck = p => Promise.resolve(p).then(x => { if (x && x.error) throw new Error(x.error.message); return x; });
  const patch = (code, tree) => ck(sb.rpc('room_merge', { p_code: code, p_patch: tree }));
  const R = base => ({
    child: p => R(base + '/' + p),
    async once() { const { data } = await sb.from('rooms').select('data').eq('code', seg(base)[1]).maybeSingle(); const v = data ? data.data : null; return { exists: () => !!v, val: () => v }; },
    set(v) { const s = seg(base); return s.length === 2 ? ck(sb.from('rooms').insert({ code: s[1], data: v })) : patch(s[1], nest(s.slice(2), v)); },
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
    if (!window.supabase) throw new Error('ไม่พบ Supabase SDK');
    SB = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    DB = makeSupabaseDb(SB); DB_ENABLED = true;
  } catch (e) { console.error('เชื่อม Supabase ไม่ได้:', e); }
})();
async function saveScoreRemote() {} // คะแนนบันทึกฝั่งเซิร์ฟเวอร์ผ่าน submit_run
async function loadLeaderboardRemote(sec, period) {
  if (!DB_ENABLED) return null;
  const { data, error } = await SB.rpc('leaderboard', { p_dur: sec, p_period: period });
  if (error) { console.error(error); return null; } return data;
}
