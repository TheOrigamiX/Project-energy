/* ==================================================================
   BACKEND — Firebase Realtime Database
   สัญญา (interface) ที่เกมเรียกใช้ ตอนย้ายไป Supabase ให้สร้าง js/backend/supabase.js
   ที่มีชื่อ Backend และ 3 อย่างนี้เหมือนกัน แล้วสลับ <script> ใน index.html
     Backend.enabled                        boolean
     Backend.saveScore(entry, sec)          Promise<boolean>
     Backend.loadLeaderboard(sec, period)   Promise<Array | null>   (null = ใช้ localStorage แทน)
     sec: 180 | 300 | 600 | 1800 | 0 (ไม่จำกัดเวลา)     period: 'all' | 'daily' | 'weekly'
================================================================== */
const Backend = (function () {
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBHVM6bttnfPlctL7TwAFwAiW5Xs9qEFOM",
    authDomain: "energy-debe5.firebaseapp.com",
    databaseURL: "https://energy-debe5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "energy-debe5",
    storageBucket: "energy-debe5.firebasestorage.app",
    messagingSenderId: "802290003784",
    appId: "1:802290003784:web:6c3c776f13d372874b8d7d",
    measurementId: "G-T1KXRYCEQF"
  };
  let db = null;
  let enabled = false;
  try {
    if (FIREBASE_CONFIG.apiKey && typeof firebase !== 'undefined') {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      enabled = true;
    } else { console.warn('ไม่พบ Firebase SDK — ใช้ localStorage แทน'); }
  } catch (e) { console.error('Firebase init ล้มเหลว:', e); }

  function tagFor(sec) { return sec === 0 ? 'infinite' : String(sec); }

  async function saveScore(entry, sec) {
    if (!enabled) return false;
    try {
      const clean = JSON.parse(JSON.stringify(entry));   // ตัดค่า undefined ออก (Firebase ไม่รับ)
      await db.ref('leaderboards/' + tagFor(sec)).push(clean);
      return true;
    } catch (e) { console.error('บันทึกคะแนนขึ้น Firebase ล้มเหลว (เช็ค Database Rules):', e); return false; }
  }

  async function loadLeaderboard(sec, period) {
    if (!enabled) return null;
    try {
      const ref = db.ref('leaderboards/' + tagFor(sec));
      // รายวัน/สัปดาห์: กรองช่วงเวลาที่ฝั่ง server ก่อน แล้วค่อยเรียงคะแนน (เดิมกรองหลังดึง top 100 ตลอดกาล จึงว่าง)
      const query = period === 'all'
        ? ref.orderByChild('score').limitToLast(100)
        : ref.orderByChild('ts').startAt(getPeriodStart(period)).limitToLast(500);
      const snap = await query.once('value');
      const list = [];
      snap.forEach(child => { list.push(child.val()); });
      list.sort((a, b) => b.score - a.score);
      return list.slice(0, 100);
    } catch (e) { console.error('โหลด Leaderboard จาก Firebase ล้มเหลว:', e); return null; }
  }

  return { name: 'firebase', enabled: enabled, saveScore: saveScore, loadLeaderboard: loadLeaderboard };
})();
