/* เลือก backend: Supabase ถ้าตั้งค่าแล้ว ไม่งั้น Firebase (ไม่มีทั้งคู่ = localStorage) */
const Backend = BackendSupabase.enabled ? BackendSupabase : BackendFirebase;
