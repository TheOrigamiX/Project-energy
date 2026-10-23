/* ---------- hand-holding coach-mark tutorial (points at real UI) ---------- */
const COACH_STEPS = [
  { target: 'hudMeter', title: 'มิเตอร์ไฟ', body: 'แถบนี้เทียบไฟที่ผลิตกับที่เมืองต้องการ เส้นขาวคือจุดที่ไฟพอดี ถ้าแถบเป็นสีแดงคือไฟไม่พอ ต้องรีบเพิ่มไฟ' },
  { target: 'plantStrip', title: 'ชิปโรงไฟฟ้า', body: 'แตะชิปเพื่อเปิด/ปิดโรงไฟฟ้าได้ทันที เส้นไฟที่วิ่งไปเมืองจะหนาขึ้นเมื่อโรงผลิตได้มาก' },
  { target: 'dock-plants', title: 'ปุ่มโรงไฟฟ้า', body: 'กดปุ่มนี้เพื่อเปิดแผงซื้อและอัพเกรดโรงไฟฟ้า (ปุ่มลัดคีย์ 1) ลากที่จับด้านบนแผงลงเพื่อปิด' },
  { sheet: 'plants', target: 'switch-coal', title: 'สวิตช์เปิด-ปิด', body: 'ลองแตะสวิตช์นี้ดูได้เลยตอนนี้ เพื่อเปิดโรงไฟฟ้าถ่านหิน!' },
  { sheet: 'plants', target: 'infobtn-coal', title: 'ดูรายละเอียด (ⓘ)', body: 'กดปุ่มนี้เพื่อดูข้อมูลเชิงลึกของโรงไฟฟ้านี้ เกมจะหยุดชั่วคราวให้อ่านสบายๆ' },
  { sheet: 'plants', target: 'upgradebtn-coal', title: 'อัพเกรด (⬆️)', body: 'กดปุ่มนี้เพื่ออัพเกรดโรงไฟฟ้าให้ผลิตไฟและสร้างรายได้มากขึ้น ไม่จำกัดระดับ' },
  { target: 'dock-battery', title: 'ปุ่มแบตเตอรี่ลัด', body: 'กดวนโหมด ปิด → ชาร์จ → จ่ายไฟ ชาร์จตอนไฟเหลือ จ่ายตอนไฟขาด' },
  { target: 'forecastChip', title: 'พยากรณ์และ Wave', body: 'นับถอยหลังถึง Peak และสภาพอากาศถัดไป พร้อม Wave ปัจจุบัน ยิ่งเล่นนานยิ่งยากขึ้น ข้อความสำคัญจะขึ้นใต้แถบนี้ และปุ่ม 🚨 สีแดงจะลอยขึ้นตอนโรงมีปัญหา กดเพื่อปิดทันที' },
  { target: 'moneyChip', title: 'เงินของคุณ', body: 'เงินที่ใช้ปลดล็อกและอัพเกรดโรงไฟฟ้าแสดงตรงนี้เด่นชัด' },
  { target: 'statusTray', title: 'แผงสถานะ', body: 'กล่องเหล่านี้บอกเหตุการณ์ปัจจุบัน ไปจนถึงถัดไป พร้อมเวลานับถอยหลัง แตะเพื่อดูรายละเอียด' },
  { target: 'gaugeSection', title: 'มาตรวัดประสิทธิภาพ', body: 'วงกลมนี้เทียบกำลังผลิตกับความต้องการไฟฟ้า สีเขียวเต็มวง แปลว่าพอ ส่วนสีแดงคือไม่พอ' },
  { target: 'cityUpgradeRow', title: 'อัพเกรดเมือง', body: 'อัพเกรดเมืองให้ใหญ่ขึ้นตรงนี้ ยิ่งเมืองใหญ่คะแนนยิ่งเยอะ แต่ความต้องการไฟก็สูงขึ้นด้วย' },
  { target: 'scoreChip', title: 'คะแนนรวม', body: 'คะแนนสะสมของคุณแสดงตรงนี้ตลอดเวลา พร้อมลุยได้เลย!' }
];
let coachIndex = 0;
function startCoachTutorial() {
  coachIndex = 0;
  document.getElementById('coachSpotlight').classList.remove('hidden');
  document.getElementById('coachTooltip').classList.remove('hidden');
  showCoachStep(0);
  window.addEventListener('resize', repositionCoach);
  window.addEventListener('scroll', repositionCoach, true);
}
function endCoachTutorial() {
  document.getElementById('coachSpotlight').classList.add('hidden');
  document.getElementById('coachTooltip').classList.add('hidden');
  window.removeEventListener('resize', repositionCoach);
  window.removeEventListener('scroll', repositionCoach, true);
  closeSheets();
  resumeGame();
}
function coachNext() { sndCoachStep(); if (coachIndex < COACH_STEPS.length - 1) { coachIndex++; showCoachStep(coachIndex); } else { endCoachTutorial(); } }
function coachSkip() { endCoachTutorial(); }
function showCoachStep(i) {
  const step = COACH_STEPS[i];
  if (step.sheet) openSheet(step.sheet); else closeSheets();
  const el = document.getElementById(step.target);
  const shEl = el && el.closest('.sheet'); if (shEl && !shEl.classList.contains('open')) openSheet(shEl.id === 'plantsPanel' ? 'plants' : 'stats');
  if ((!el || !el.getClientRects().length) && i < COACH_STEPS.length - 1) { coachIndex = i + 1; return showCoachStep(coachIndex); }
  document.getElementById('coachTitle').textContent = step.title;
  document.getElementById('coachBody').textContent = step.body;
  document.getElementById('coachProgress').textContent = (i + 1) + ' / ' + COACH_STEPS.length;
  document.getElementById('coachNextBtn').textContent = (i === COACH_STEPS.length - 1) ? 'เริ่มเล่นเลย' : 'ถัดไป ➡';
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => positionCoach(el), (step.sheet || shEl) ? 520 : 260); }
}
function positionCoach(el) {
  const r = el.getBoundingClientRect();
  const pad = 6;
  const spot = document.getElementById('coachSpotlight');
  spot.style.left = (r.left - pad) + 'px';
  spot.style.top = (r.top - pad) + 'px';
  spot.style.width = (r.width + pad * 2) + 'px';
  spot.style.height = (r.height + pad * 2) + 'px';

  const tip = document.getElementById('coachTooltip');
  const tipWidth = 300;
  let left = r.left;
  if (left + tipWidth > window.innerWidth - 10) left = window.innerWidth - tipWidth - 10;
  if (left < 10) left = 10;
  let top;
  if (r.bottom + 170 < window.innerHeight) { top = r.bottom + 14; }
  else { top = Math.max(10, r.top - 180); }
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}
function repositionCoach() {
  const step = COACH_STEPS[coachIndex];
  const el = document.getElementById(step.target);
  if (el) positionCoach(el);
}

