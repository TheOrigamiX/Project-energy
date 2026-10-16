/* VoltRush — js/rng.js : RNG ใส่ seed ได้ แยกสตรีมตามชนิดเหตุการณ์ (พื้นฐานของ Daily Seed / ตรวจคะแนนซ้ำ) */
const RNG = (function () {
  let base = 1, streams = {};
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) { return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  return {
    seed: function (n) { base = n >>> 0; streams = {}; return base; },
    f: function (name) { if (!streams[name]) streams[name] = mulberry(base ^ hash(name)); return streams[name](); },
    get value() { return base; }
  };
})();
