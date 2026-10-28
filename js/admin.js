/* แผงแอดมิน (เห็นเฉพาะ role = admin ที่เซิร์ฟเวอร์กำหนด) ใช้ทดสอบบาลานซ์ รอบที่เล่นด้วยบัญชีนี้ไม่ติดอันดับ */
(function () {
  const b = document.createElement('button'), p = document.createElement('div'); b.id = 'admBtn'; b.textContent = '🛠'; b.className = 'hidden'; p.id = 'admPanel'; p.className = 'hidden';
  p.innerHTML = '<h4>🛠 แผงแอดมิน <small>(รอบนี้ไม่ติดอันดับ)</small></h4>' +
    '<div class="ar"><input id="admMoney" type="number" value="1000"><button data-a="money">ตั้งเงิน</button><button data-a="addmoney">+เงิน</button></div>' +
    '<div class="ar"><input id="admWave" type="number" value="6"><button data-a="wave">ข้ามไป Wave</button></div>' +
    '<div class="ar"><button data-a="boss">👹 เรียกบอส</button><button data-a="unlock">🔓 ปลดล็อกโรงทุกชนิด</button></div>' +
    '<div class="ar"><label><input type="checkbox" id="admGod"> 🛡 ปิดความเสี่ยงระเบิด</label></div>' +
    '<div class="ar"><label>คูลดาวน์สกิล ×<input id="admCd" type="number" step="0.1" min="0.1" max="1" value="1"></label><button data-a="cdreset">รีเซ็ตสกิลทันที</button></div>' +
    '<div class="ar"><button data-a="daily">🧹 ล้างสิทธิ์ Daily วันนี้</button></div><small id="admMsg"></small>';
  document.body.append(b, p); b.onclick = () => p.classList.toggle('hidden');
  const msg = t => { byId('admMsg').textContent = t; };
  const need = () => { if (!state || !gameInProgress) { msg('ต้องอยู่ในเกมก่อน'); return false; } return true; };
  p.addEventListener('change', e => { if (e.target.id === 'admGod') ADM.god = e.target.checked; if (e.target.id === 'admCd') ADM.cd = Math.min(1, Math.max(.1, parseFloat(e.target.value) || 1)); });
  p.addEventListener('click', async e => {
    const a = e.target.dataset && e.target.dataset.a; if (!a) return;
    if (a === 'daily') { const { error } = await SB.rpc('admin_reset_daily'); msg(error ? error.message : 'ล้างสิทธิ์ Daily แล้ว'); if (!error) dailyBtnSync(); return; }
    if (!need()) return; const v = n => +byId(n).value || 0;
    if (a === 'money') state.money = v('admMoney'); else if (a === 'addmoney') state.money += v('admMoney');
    else if (a === 'wave') { state.prepping = false; state.elapsed = Math.max(0, v('admWave') * WAVE_SEC - 1); msg('ไป Wave ' + v('admWave') + ' ในวินาทีถัดไป'); }
    else if (a === 'boss') { state.boss = { t: Math.floor(Math.random() * BOSS.length), left: 20 }; showToast('⚠️ แอดมินเรียกบอส: ' + BOSS[state.boss.t].n); }
    else if (a === 'unlock') { PLANT_DEFS.forEach(d => { if (state.plants[d.key]) state.plants[d.key].unlocked = true; }); if (state.battery) state.battery.unlocked = true; msg('ปลดล็อกโรงทั้งหมดแล้ว'); }
    else if (a === 'cdreset') { CH.run.cdLeft = 0; CH.run.uses = 0; CH.run.watt = 0; msg('รีเซ็ตสกิลแล้ว'); }
    renderGame();
  });
  setInterval(() => { b.classList.toggle('hidden', !isAdmin() || !AUTH.user); if (!isAdmin()) p.classList.add('hidden'); }, 1000);
})();
