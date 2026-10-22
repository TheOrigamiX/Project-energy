/* ความยากเพิ่มตามเวลา: ทุก 30 วิ = 1 wave, ความถี่เหตุการณ์เท่าตัวทุก 2 นาที (2^(wave/4)),
   โอกาสระเบิดเท่าตัวทุก 4 นาที (รากที่สองของตัวคูณ), ดีมานด์ +4% ต่อ wave — ไม่มีเพดาน */
const WAVE_SEC = 30;
const _gameTick = gameTick;
gameTick = function () {
  if (state && !state.prepping) {
    const w = Math.floor((state.elapsed || 0) / WAVE_SEC);
    if (w !== state.wave) {
      const up = w > (state.wave || 0);
      state.wave = w; EVENT_FREQ_MULT = Math.pow(2, w / 4);
      if (up && w > 0 && typeof waveBanner === 'function') waveBanner(w);
    }
  }
  return _gameTick();
};
