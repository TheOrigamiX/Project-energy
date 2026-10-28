/* ตัวละครแนวอนิเมะ "จิบิ" แบบ SVG (หัวโต ตัวเล็ก ขอบหนาสไตล์สติกเกอร์) สลับเป็นภาพจริงทีหลังได้โดยแก้ charSvg() */
let _cu = 0;
function charSvg(c, o) {
  o = o || {}; const u = 'c' + (++_cu), O = '#3b2a4a', sk = c.skin || '#ffe3d2', c2 = c.cloth2 || c.cloth, hair = 'url(#' + u + 'h)', cloth = 'url(#' + u + 'b)', sw = 'stroke="' + O + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  const defs = `<defs><linearGradient id="${u}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.hair}"/><stop offset="1" stop-color="${c.hair2 || c.hair}"/></linearGradient><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cloth}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`;
  const back = {
    short: `<path d="M18 58Q20 10 60 10Q100 10 102 58L98 80Q60 70 22 80Z" fill="${hair}" ${sw}/>`,
    bob: `<path d="M14 60Q18 6 60 6Q102 6 106 60L104 102Q60 92 16 102Z" fill="${hair}" ${sw}/>`,
    long: `<path d="M12 60Q16 2 60 2Q104 2 108 60L114 128Q60 142 6 128Z" fill="${hair}" ${sw}/>`,
    twin: `<path d="M18 58Q20 10 60 10Q100 10 102 58L98 80Q60 70 22 80Z" fill="${hair}" ${sw}/><path d="M20 60Q-8 84 6 126Q26 108 30 80Z" fill="${hair}" ${sw}/><path d="M100 60Q128 84 114 126Q94 108 90 80Z" fill="${hair}" ${sw}/><circle cx="22" cy="46" r="7" fill="#ff6b81" ${sw}/><circle cx="98" cy="46" r="7" fill="#ff6b81" ${sw}/>`
  }[c.style] || '';
  const cape = c.acc === 'cape' ? `<path d="M38 98L26 134Q60 144 94 134L82 98Z" fill="#6a4fb3" ${sw}/>` : '';
  const hoodBack = c.acc === 'hood' ? `<path d="M14 62Q60 -26 106 62L106 98Q60 86 14 98Z" fill="#5b8ac0" ${sw}/>` : '';
  const leg = x => `<g class="lg ${x < 60 ? 'l' : 'r'}" style="transform-origin:${x + 6}px 120px"><rect x="${x}" y="118" width="12" height="16" rx="6" fill="${sk}" ${sw}/><ellipse cx="${x + 6}" cy="134" rx="9" ry="5" fill="${c2}" ${sw}/></g>`;
  const arm = (x, ox) => `<g class="am ${x < 60 ? 'l' : 'r'}" style="transform-origin:${ox}px 100px"><rect x="${x}" y="98" width="11" height="20" rx="5.5" fill="${cloth}" ${sw}/><circle cx="${x + 5.5}" cy="119" r="5.5" fill="${sk}" ${sw}/></g>`;
  const body = `<rect x="42" y="94" width="36" height="32" rx="13" fill="${cloth}" ${sw}/><path d="M52 95L60 107L68 95Z" fill="#fff" opacity=".9"/>` + (c.acc === 'cape' ? `<circle cx="60" cy="114" r="5.5" fill="#ffd166" ${sw}/>` : '') + (c.acc === 'leaf' ? `<path d="M42 96Q60 110 78 96L78 104Q60 118 42 104Z" fill="#7ad07a" ${sw}/>` : '');
  const eye = x => `<ellipse cx="${x}" cy="62" rx="9.5" ry="12.5" fill="#fff"/><ellipse cx="${x}" cy="64" rx="7.4" ry="10.4" fill="${c.eye}"/><ellipse cx="${x}" cy="65" rx="3.6" ry="5.6" fill="#1b1b2f"/><circle cx="${x - 3}" cy="58" r="3.6" fill="#fff"/><circle cx="${x + 3.5}" cy="70" r="1.7" fill="#fff" opacity=".85"/><path d="M${x - 10.5} 52Q${x} 45 ${x + 10.5} 52" stroke="${O}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const face = `<circle cx="60" cy="56" r="40" fill="${sk}" ${sw}/>` + eye(44) + eye(76) + `<ellipse cx="33" cy="80" rx="7" ry="4" fill="#ff8fa3" opacity=".42"/><ellipse cx="87" cy="80" rx="7" ry="4" fill="#ff8fa3" opacity=".42"/>` + (c.acc === 'mask' ? `<path d="M28 76Q60 110 92 76L92 94Q60 114 28 94Z" fill="#cfd8e3" ${sw}/>` : `<path d="M54 84Q60 90 66 84" stroke="#b84a62" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
  const front = `<path d="M18 58Q20 14 60 14Q100 14 102 58Q88 36 74 46Q64 30 54 46Q36 36 18 58Z" fill="${hair}" ${sw}/><path d="M18 58Q12 84 22 106Q32 88 30 62Z" fill="${hair}" ${sw}/><path d="M102 58Q108 84 98 106Q88 88 90 62Z" fill="${hair}" ${sw}/>`;
  const acc = {
    helmet: `<path d="M22 38Q60 -8 98 38L98 44L22 44Z" fill="#ffd84d" ${sw}/><rect x="14" y="42" width="92" height="9" rx="4.5" fill="#f0a500" ${sw}/>`,
    strawhat: `<ellipse cx="60" cy="26" rx="58" ry="12" fill="#f3d27a" ${sw}/><path d="M28 26Q60 -14 92 26Z" fill="#f7e29a" ${sw}/><rect x="30" y="21" width="60" height="6" fill="#e07a3f"/>`,
    glasses: `<circle cx="44" cy="62" r="15" fill="rgba(255,255,255,.15)" stroke="#5b3f9a" stroke-width="3"/><circle cx="76" cy="62" r="15" fill="rgba(255,255,255,.15)" stroke="#5b3f9a" stroke-width="3"/><path d="M58 62h4" stroke="#5b3f9a" stroke-width="3"/>`,
    goggles: `<rect x="20" y="24" width="80" height="14" rx="7" fill="#455a64" ${sw}/><circle cx="42" cy="31" r="9" fill="#ff7043" ${sw}/><circle cx="78" cy="31" r="9" fill="#ff7043" ${sw}/>`,
    diver: `<rect x="20" y="24" width="80" height="13" rx="6.5" fill="#0277bd" ${sw}/><circle cx="42" cy="30" r="8.5" fill="#b3e5fc" ${sw}/><circle cx="78" cy="30" r="8.5" fill="#b3e5fc" ${sw}/><path d="M96 42q14-3 8 11q-12-3-8-11Z" fill="#ffccbc" ${sw}/>`,
    aurora: `<path d="M34 22l26-18 26 18-10 3-16-9-16 9Z" fill="#ffe082" ${sw}/><circle cx="60" cy="6" r="4.5" fill="#fff" ${sw}/><path d="M10 44l3.5 8 8 3.5-8 3.5-3.5 8-3.5-8-8-3.5 8-3.5Z" fill="#fff" opacity=".9"/><path d="M110 74l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="#fff" opacity=".8"/>`
  }[c.acc] || '';
  const all = '<g class="bob">' + cape + back + hoodBack + leg(48) + leg(62) + body + arm(31, 36) + arm(78, 83) + face + front + (c.acc === 'hood' ? '' : acc) + '</g>';
  return `<svg class="chsvg${o.still ? ' still' : ''}" viewBox="${o.bust ? '6 0 108 112' : '0 0 120 142'}" xmlns="http://www.w3.org/2000/svg">${defs}${all}</svg>`;
}
