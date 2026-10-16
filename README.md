# VoltRush

เกมจำลองบริหารพลังงานเมือง เล่นบนเบราว์เซอร์ ไม่มี build step ใช้ `<script>` ธรรมดา เปิด `index.html` หรือ deploy ขึ้น GitHub Pages ได้เลย

## โครงสร้าง

```
index.html            โครง HTML ทุกหน้าจอ + ลำดับโหลดสคริปต์
css/style.css         สไตล์ทั้งหมด
js/config.js          ค่าตั้งต้น ตัวแปรตั้งค่าเกม
js/data.js            ข้อมูลเกม (โรงไฟฟ้า เหตุการณ์ buff tips)
js/formulas.js        สูตรระดับ ค่าอัพเกรด ตัวคูณเมือง
js/util.js            ฟังก์ชันช่วย + ขอบเขตช่วงอันดับ (เวลาไทย UTC+7)
js/rng.js             RNG ใส่ seed ได้ แยกสตรีมตามชนิดเหตุการณ์
js/backend/firebase.js, supabase.js, index.js   จุดเชื่อม backend (เลือก Supabase ถ้าตั้งค่าแล้ว ไม่งั้น Firebase)
js/hunt.js            ตัวละครถาวร การล่า ฐานทัพ ของ ตีบวก (L1)
supabase/schema.sql   ตาราง leaderboard + RLS
js/audio.js           เสียงและเพลง
js/state.js           state หลัก freshState()
js/engine.js          ตัวจำลองเกม ทำงานทุก tick
js/actions.js         การกระทำของผู้เล่น
js/modal.js           หน้าต่างรายละเอียด + หยุดเกม
js/tutorial.js        บทเรียนชี้จุดในเกม
js/sky.js             ท้องฟ้าและเอฟเฟกต์
js/render.js          วาด UI ทุกวินาที (diff-render)
js/leaderboard.js     อันดับคะแนน
js/flow.js            เริ่ม/จบ/หยุดเกม
firebase/database.rules.json   Rules สำหรับ Realtime Database
```

ลำดับ `<script>` ใน `index.html` สำคัญ ทุกไฟล์ใช้ global scope ร่วมกัน ห้ามประกาศ `const`/`let` ชื่อซ้ำข้ามไฟล์

## สัญญา Backend (ใช้ตอนย้ายไป Supabase)

สร้าง `js/backend/supabase.js` ให้ประกาศ `const Backend` ที่มี:

- `Backend.enabled` : boolean
- `Backend.saveScore(entry, sec)` : `Promise<boolean>`  (entry = `{ name, score, elapsed?, ts }`)
- `Backend.loadLeaderboard(sec, period)` : `Promise<Array | null>`  คืนรายการเรียงคะแนนมากไปน้อย สูงสุด 100 รายการ `null` = ให้เกมใช้ localStorage แทน

แล้วสลับ `<script src="js/backend/firebase.js">` เป็นไฟล์ใหม่ และสลับ SDK ใน `<head>` เกมส่วนอื่นไม่ต้องแก้

ช่วงรายวัน/สัปดาห์ให้กรองด้วย `ts >= getPeriodStart(period)` ที่ฝั่ง query (ฟังก์ชันอยู่ใน `js/util.js`) อย่ากรองหลังดึง top 100

## Firebase Rules

`firebase/database.rules.json` ต้องนำไปวางใน Firebase Console เอง ถ้าฐานข้อมูลมี path อื่นนอกจาก `leaderboards` ให้รวมเข้ากับ rules เดิม เพดานคะแนน 5,000,000 เป็นค่าเผื่อกว้างๆ ควรปรับตามคะแนนจริงสูงสุดของแต่ละโหมด Rules ช่วยกันข้อมูลผิดรูปแบบ แต่ไม่ช่วยตรวจว่าคะแนนเล่นมาจริง การตรวจจริงต้องทำฝั่ง server

## โหมดล่า (L1 ตาม GDD)

กดปุ่ม "ฐานทัพ / ออกล่า" ในหน้าแรก. ใช้เครื่องยนต์โรงไฟฟ้าเดิม: ไฟที่ผลิตได้ (netSupply) แปลงเป็นความเสียหายต่อมอนสเตอร์ ไฟดับทำให้ยิงอ่อนและโล่เมืองแตกเร็ว. เมืองล่ม = เสีย EXP 3%. ข้อมูลตัวละครเก็บใน localStorage (`voltrushProfileV1`) ยังเป็นข้อมูลฝั่งเครื่อง แก้ได้ จึงยังไม่ใช่ระบบแข่งขันจริง ต้องย้ายขึ้น server ตามหัวข้อ 27 ของ GDD ก่อนมีตลาดหรืออันดับตัวละคร.

ค่าดรอป `DROP_ITEM` และ `DROP_SCROLL` ใน `js/hunt.js` ตั้งสูงกว่า GDD เพื่อทดสอบ (0.03 และ 0.05 แทน 0.008 และ 0.04) ปรับลงก่อนปล่อยจริง.

## ตั้งค่า Supabase

1. รัน `supabase/schema.sql` ใน SQL Editor.
2. ใส่ `SUPABASE_URL` และ `SUPABASE_ANON_KEY` ใน `js/backend/supabase.js`.
