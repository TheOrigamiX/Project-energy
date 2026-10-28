/* ตัวละครแนวอนิเมะแบบ SVG (chibi) สร้างจากพารามิเตอร์ สลับเป็นภาพจริงทีหลังได้โดยแก้ charSvg() */
let _cu = 0;
function charSvg(c, o) {
  o = o || {}; const u = 'c' + (++_cu), sk = c.skin || '#ffe3d2', c2 = c.cloth2 || c.cloth, hair = 'url(#' + u + 'h)', cloth = 'url(#' + u + 'b)';
  const defs = '<defs><linearGradient id="' + u + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.hair + '"/><stop offset="1" stop-color="' + (c.hair2 || c.hair) + '"/></linearGradient><linearGradient id="' + u + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.cloth + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>';
  const back = {
    short: '<path d="M30 54Q60 4 90 54L88 72Q60 62 32 72Z" fill="' + hair + '"/>',
    bob: '<path d="M26 54Q60 2 94 54L92 94Q60 84 28 94Z" fill="' + hair + '"/>',
    long: '<path d="M24 54Q60 0 96 54L100 146Q60 156 20 146Z" fill="' + hair + '"/>',
    twin: '<path d="M30 54Q60 4 90 54L88 72Q60 62 32 72Z" fill="' + hair + '"/><path d="M28 56Q6 78 16 122Q30 106 32 76Z" fill="' + hair + '"/><path d="M92 56Q114 78 104 122Q90 106 88 76Z" fill="' + hair + '"/><circle cx="30" cy="48" r="6" fill="#ff6b81"/><circle cx="90" cy="48" r="6" fill="#ff6b81"/>'
  }[c.style] || '';
  const cape = c.acc === 'cape' ? '<path d="M34 86L24 152Q60 168 96 152L86 86Z" fill="#6a4fb3"/>' : '';
  const leg = x => '<g class="lg ' + (x < 60 ? 'l' : 'r') + '" style="transform-origin:' + (x + 6) + 'px 134px"><rect x="' + x + '" y="132" width="12" height="38" rx="6" fill="' + sk + '"/><ellipse cx="' + (x + 6) + '" cy="172" rx="9" ry="5" fill="' + c2 + '"/></g>';
  const arm = x => '<g class="am ' + (x < 60 ? 'l' : 'r') + '" style="transform-origin:' + (x + 6) + 'px 92px"><rect x="' + x + '" y="88" width="12" height="36" rx="6" fill="' + cloth + '"/><circle cx="' + (x + 6) + '" cy="126" r="6.5" fill="' + sk + '"/></g>';
  const body = '<rect x="37" y="84" width="46" height="54" rx="17" fill="' + cloth + '"/><path d="M50 84L60 102L70 84Z" fill="#fff" opacity=".9"/><rect x="37" y="118" width="46" height="6" fill="' + c2 + '" opacity=".55"/>' + (c.acc === 'cape' ? '<circle cx="60" cy="112" r="7" fill="#ffd166" stroke="#a97b00" stroke-width="1.5"/>' : '') + (c.acc === 'leaf' ? '<path d="M40 82Q60 96 80 82L80 90Q60 104 40 90Z" fill="#7ad07a"/>' : '');
  const eye = x => '<ellipse cx="' + x + '" cy="58" rx="7.5" ry="10" fill="#fff"/><ellipse cx="' + x + '" cy="60" rx="5.6" ry="8" fill="' + c.eye + '"/><ellipse cx="' + x + '" cy="60" rx="2.6" ry="4.4" fill="#1b1b2f"/><circle cx="' + (x - 2) + '" cy="55" r="2.6" fill="#fff"/><circle cx="' + (x + 2) + '" cy="64" r="1.2" fill="#fff" opacity=".8"/><path d="M' + (x - 8.5) + ' 51Q' + x + ' 46 ' + (x + 8.5) + ' 51" stroke="#3a2b3f" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  const face = '<circle cx="60" cy="54" r="30" fill="' + sk + '"/>' + eye(47) + eye(73) + '<ellipse cx="38" cy="70" rx="6" ry="3.4" fill="#ff8fa3" opacity=".38"/><ellipse cx="82" cy="70" rx="6" ry="3.4" fill="#ff8fa3" opacity=".38"/>' + (c.acc === 'mask' ? '<path d="M36 66Q60 92 84 66L84 82Q60 98 36 82Z" fill="#cfd8e3"/>' : '<path d="M55 73Q60 78 65 73" stroke="#c0576b" stroke-width="2" fill="none" stroke-linecap="round"/>');
  const front = '<path d="M30 54Q32 18 60 18Q88 18 90 54Q80 36 70 42Q62 30 54 42Q42 34 30 54Z" fill="' + hair + '"/><path d="M30 54Q26 72 32 90Q38 76 36 56Z" fill="' + hair + '"/><path d="M90 54Q94 72 88 90Q82 76 84 56Z" fill="' + hair + '"/>';
  const acc = {
    helmet: '<path d="M30 38Q60 4 90 38L90 44L30 44Z" fill="#ffd84d" stroke="#d99a00"/><rect x="26" y="42" width="68" height="7" rx="3" fill="#f0a500"/>',
    strawhat: '<ellipse cx="60" cy="30" rx="46" ry="9" fill="#f3d27a"/><path d="M36 30Q60 -2 84 30Z" fill="#f7e29a"/><rect x="36" y="25" width="48" height="5" fill="#e07a3f"/>',
    glasses: '<circle cx="47" cy="58" r="11" fill="none" stroke="#5b3f9a" stroke-width="2.4"/><circle cx="73" cy="58" r="11" fill="none" stroke="#5b3f9a" stroke-width="2.4"/><path d="M58 58h4" stroke="#5b3f9a" stroke-width="2.4"/>',
    hood: '<path d="M28 62Q60 -4 92 62L92 84Q60 74 28 84Z" fill="#5b8ac0" opacity=".92"/>' + '',
    goggles: '<rect x="30" y="28" width="60" height="11" rx="5.5" fill="#455a64"/><circle cx="46" cy="33" r="7" fill="#ff7043" stroke="#263238" stroke-width="2"/><circle cx="74" cy="33" r="7" fill="#ff7043" stroke="#263238" stroke-width="2"/>',
    diver: '<rect x="30" y="28" width="60" height="10" rx="5" fill="#0277bd"/><circle cx="46" cy="33" r="6.5" fill="#b3e5fc" stroke="#01579b" stroke-width="2"/><circle cx="74" cy="33" r="6.5" fill="#b3e5fc" stroke="#01579b" stroke-width="2"/><path d="M84 40q10-2 6 8q-8-2-6-8Z" fill="#ffccbc"/>',
    aurora: '<path d="M38 24l22-14 22 14-8 2-14-6-14 6Z" fill="#ffe082" stroke="#ffb300"/><circle cx="60" cy="10" r="3.5" fill="#fff"/><path d="M16 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#fff" opacity=".85"/><path d="M104 70l2.5 5 5 2.5-5 2.5-2.5 5-2.5-5-5-2.5 5-2.5Z" fill="#fff" opacity=".7"/>'
  }[c.acc] || '';
  const hoodBack = c.acc === 'hood' ? acc : '';
  const body_all = '<g class="bob">' + cape + back + hoodBack + leg(45) + leg(63) + body + arm(27) + arm(81) + face + front + (c.acc === 'hood' ? '' : acc) + '</g>';
  return '<svg class="chsvg' + (o.still ? ' still' : '') + '" viewBox="' + (o.bust ? '8 0 104 118' : '0 0 120 180') + '" xmlns="http://www.w3.org/2000/svg">' + defs + body_all + '</svg>';
}
