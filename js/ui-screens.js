/* ============================================================
 * 星际求知号 - 页面渲染
 * 首页(空间站+宠物) / 星际图鉴 / 航行日志(日历) / 家长面板
 * ============================================================ */

let parentUnlocked = false;

function updateTop() {
  $('#top-coins').textContent = '🪙 ' + Store.state.coins;
  $('#btn-sound').textContent = Store.state.settings.soundOff ? '🔇' : '🔊';
}

/* ---------------- 机器宠物 SVG ---------------- */
/* 装扮图层：cape 画在身体后面，其余画在头上/脸上/脖子上（PET_OUTFITS 数据见 data.js） */
/* 各物种共用同一画布坐标（头中心 100,62 / 身体 55~145 × 98~166），装扮全物种通用 */


/* ---------- v37：小星 Redesign · 表情片段（8 个） ----------
 * 锚点固定：双眼 (85,62)/(115,62)，面罩 x64~136 / y44~80，嘴在 y84~96。
 * 设计约束：相邻表情至少在两个维度上拉开差异；答错/战败用 expect（鼓励），不用 sad。 */
const PET_MOODS = {
  /* v37-A 糖果可爱风：眼睛改果冻青（双高光），嘴色改深灰绿（奶油脸上清晰），
   * 腮红已常驻在 PET_HEAD，happy/love 不再重复画。锚点与原版完全一致。 */
  idle: `
    <g class="eye"><ellipse cx="85" cy="62" rx="7" ry="8.5" fill="#7EE8FF"/><circle cx="82.6" cy="59" r="2" fill="#fff"/><circle cx="87.6" cy="65.8" r="1" fill="#DFFBFF" opacity=".8"/></g>
    <g class="eye"><ellipse cx="115" cy="62" rx="7" ry="8.5" fill="#7EE8FF"/><circle cx="112.6" cy="59" r="2" fill="#fff"/><circle cx="117.6" cy="65.8" r="1" fill="#DFFBFF" opacity=".8"/></g>
    <path class="mouth" d="M87,84 Q100,92 113,84" stroke="#7C8BA0" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  happy: `
    <g class="eye"><ellipse cx="85" cy="62" rx="7.4" ry="9" fill="#7EE8FF"/><circle cx="82.2" cy="58.6" r="2.4" fill="#fff"/><circle cx="87.4" cy="65.6" r="1.2" fill="#DFFBFF" opacity=".7"/></g>
    <g class="eye"><ellipse cx="115" cy="62" rx="7.4" ry="9" fill="#7EE8FF"/><circle cx="112.2" cy="58.6" r="2.4" fill="#fff"/><circle cx="117.4" cy="65.6" r="1.2" fill="#DFFBFF" opacity=".7"/></g>
    <path class="mouth" d="M80,81 Q100,102 120,81 Q100,90 80,81 Z" fill="#3D2B1F"/>
    <path d="M92,89 Q100,96 108,89 Q100,92.5 92,89 Z" fill="#FF8FAB"/>`,
  cheer: `
    <g class="eye"><path d="M78,65 Q85,57 92,65" stroke="#7EE8FF" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <g class="eye"><path d="M108,65 Q115,57 122,65" stroke="#7EE8FF" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <path class="mouth" d="M80,80 Q100,102 120,80 Q100,89 80,80 Z" fill="#3D2B1F"/>
    <path d="M64,40 L65.6,44 L69.6,45.6 L65.6,47.2 L64,51.2 L62.4,47.2 L58.4,45.6 L62.4,44 Z" fill="#FFD166"/>
    <path d="M136,40 L137.6,44 L141.6,45.6 L137.6,47.2 L136,51.2 L134.4,47.2 L130.4,45.6 L134.4,44 Z" fill="#FFD166"/>`,
  expect: `
    <g class="eye"><ellipse cx="85" cy="62" rx="7.6" ry="9.6" fill="#7EE8FF"/><circle cx="82.4" cy="58.6" r="2.2" fill="#fff"/><circle cx="87.2" cy="65.4" r="1.1" fill="#DFFBFF" opacity=".7"/></g>
    <g class="eye"><ellipse cx="115" cy="62" rx="7.6" ry="9.6" fill="#7EE8FF"/><circle cx="112.4" cy="58.6" r="2.2" fill="#fff"/><circle cx="117.2" cy="65.4" r="1.1" fill="#DFFBFF" opacity=".7"/></g>
    <circle cx="100" cy="89" r="4.6" fill="#3D2B1F" stroke="#7C8BA0" stroke-width="1.5"/>
    <circle cx="124" cy="40" r="1.8" fill="#9ADBC8"/>
    <circle cx="131" cy="33" r="1.8" fill="#9ADBC8" opacity=".8"/>
    <circle cx="138" cy="26" r="1.8" fill="#9ADBC8" opacity=".6"/>`,
  sad: `
    <g class="eye"><ellipse cx="85" cy="63" rx="6.6" ry="8" fill="#7EE8FF"/><path d="M78,57 Q85,53 92,57" stroke="#9FB0D0" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="82.6" cy="60.4" r="1.8" fill="#fff"/></g>
    <g class="eye"><ellipse cx="115" cy="63" rx="6.6" ry="8" fill="#7EE8FF"/><path d="M108,57 Q115,53 122,57" stroke="#9FB0D0" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="112.6" cy="60.4" r="1.8" fill="#fff"/></g>
    <path d="M74,69 Q77.5,77 74,80 Q70.5,77 74,69 Z" fill="#A8E6D8"/>
    <path class="mouth" d="M88,92 Q100,87 112,92" stroke="#7C8BA0" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  sleep: `
    <g class="eye"><path d="M78,62 Q85,67 92,62" stroke="#7EE8FF" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <g class="eye"><path d="M108,62 Q115,67 122,62" stroke="#7EE8FF" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <circle cx="100" cy="89" r="3.6" fill="#3D2B1F"/>
    <text x="126" y="34" font-family="sans-serif" font-size="13" fill="#9FB0D0" opacity=".9">z</text>
    <text x="136" y="22" font-family="sans-serif" font-size="9" fill="#9FB0D0" opacity=".7">z</text>`,
  sparkle: `
    <g class="eye"><path d="M85,53 L86.9,59.4 L93.5,61.3 L86.9,63.2 L85,69.6 L83.1,63.2 L76.5,61.3 L83.1,59.4 Z" fill="#FFD166"/></g>
    <g class="eye"><path d="M115,53 L116.9,59.4 L123.5,61.3 L116.9,63.2 L115,69.6 L113.1,63.2 L106.5,61.3 L113.1,59.4 Z" fill="#FFD166"/></g>
    <path class="mouth" d="M82,80 Q100,100 118,80 Q100,88 82,80 Z" fill="#3D2B1F"/>
    <path d="M60,30 L61.2,33.6 L65,34.8 L61.2,36 L60,39.6 L58.8,36 L55,34.8 L58.8,33.6 Z" fill="#FF8FAB"/>
    <path d="M140,30 L141.2,33.6 L145,34.8 L141.2,36 L140,39.6 L138.8,36 L135,34.8 L138.8,33.6 Z" fill="#FF8FAB"/>`,
  love: `
    <g class="eye"><path d="M85,71 C82,69 77.5,66 76,62.5 C74,57 80,53 85,58 C90,53 96,57 94,62.5 C92.5,66 88,69 85,71 Z" fill="#FF8FAB"/></g>
    <g class="eye"><path d="M115,71 C112,69 107.5,66 106,62.5 C104,57 110,53 115,58 C120,53 126,57 124,62.5 C122.5,66 118,69 115,71 Z" fill="#FF8FAB"/></g>
    <path class="mouth" d="M86,84 Q100,95 114,84" stroke="#7C8BA0" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
};

/* ---------- v37：小星三阶段身体（stage: 1 探测球 / 2 小机器人 / 3 机甲伙伴） ----------
 * 与旧版的区别：不再是"同一骨架换色 + CSS 显隐部件"，每个阶段是独立剪影，
 * 进化 = 整体变形。不变元素：星焰天线、面罩、配色——保证"还是它"。
 * 坐标仍限制在 x28~172 / y88~188，不侵入现有装扮锚点。 */
const PET_STAGE_BODIES = {
  /* v37-A 糖果可爱风三段剪影：奶油薄荷机身 + 软描边 + 爱心能量。
   * 记忆点三件套（星焰天线/面罩双眼/胸口爱心）与配色三阶段一致；emoji 全部矢量化。 */
  1: `
    <circle cx="100" cy="62" r="58" fill="url(#glowm)"/>
    <circle cx="54" cy="62" r="9" fill="url(#cream)" stroke="#8FBFB0" stroke-width="2.5"/>
    <circle cx="54" cy="62" r="2.6" fill="#7EE8FF"/>
    <circle cx="146" cy="62" r="9" fill="url(#cream)" stroke="#8FBFB0" stroke-width="2.5"/>
    <circle cx="146" cy="62" r="2.6" fill="#7EE8FF"/>
    <circle cx="100" cy="62" r="44" fill="url(#cream)" stroke="#8FBFB0" stroke-width="3"/>
    <path d="M60,76 Q100,90 140,76" stroke="#ffffff" stroke-opacity=".3" stroke-width="2" fill="none"/>
    <rect x="76" y="100" width="48" height="12" rx="6" fill="#CBE8DD" stroke="#8FBFB0" stroke-width="2.5"/>
    <rect x="84" y="110" width="10" height="6" rx="3" fill="#9ADBC8"/>
    <rect x="106" y="110" width="10" height="6" rx="3" fill="#9ADBC8"/>
    <path class="r-flame" d="M93,117 Q100,133 107,117 Q100,123 93,117 Z" fill="#FFD166"/>`,
  2: `
    <circle cx="100" cy="62" r="58" fill="url(#glowm)"/>
    <rect x="88" y="90" width="24" height="14" rx="7" fill="#9ADBC8"/>
    <rect x="58" y="100" width="84" height="64" rx="27" fill="url(#cream)" stroke="#8FBFB0" stroke-width="3"/>
    <ellipse cx="100" cy="132" rx="26" ry="19" fill="#FFFAF2" stroke="#D8EBE0" stroke-width="2"/>
    <path d="M100,142 C97,139 92.5,136 91,132.5 C89,127 95,123.5 100,128.5 C105,123.5 111,127 109,132.5 C107.5,136 103,139 100,142 Z" fill="#FF8FAB" stroke="#E0708F" stroke-width="1.5"/>
    <g><rect x="34" y="108" width="18" height="42" rx="9" fill="#DFF2EA" stroke="#8FBFB0" stroke-width="2.5"/><circle cx="43" cy="154" r="9" fill="#CBE8DD" stroke="#8FBFB0" stroke-width="2.5"/></g>
    <g><rect x="148" y="108" width="18" height="42" rx="9" fill="#DFF2EA" stroke="#8FBFB0" stroke-width="2.5"/><circle cx="157" cy="154" r="9" fill="#CBE8DD" stroke="#8FBFB0" stroke-width="2.5"/></g>
    <rect x="68" y="160" width="24" height="10" rx="5" fill="#CBE8DD" stroke="#8FBFB0" stroke-width="2.5"/>
    <rect x="108" y="160" width="24" height="10" rx="5" fill="#CBE8DD" stroke="#8FBFB0" stroke-width="2.5"/>
    <rect x="71" y="166" width="18" height="3" rx="1.5" fill="#7EE8FF" opacity=".9"/>
    <rect x="111" y="166" width="18" height="3" rx="1.5" fill="#7EE8FF" opacity=".9"/>`,
  3: `
    <circle cx="100" cy="80" r="62" fill="url(#glowm)"/>
    <polygon points="52,118 8,92 20,140" fill="#DFF2EA" stroke="#8FBFB0" stroke-width="2.5"/>
    <polygon points="52,130 22,112 27,138" fill="#9ADBC8" opacity=".55"/>
    <polygon points="148,118 192,92 180,140" fill="#DFF2EA" stroke="#8FBFB0" stroke-width="2.5"/>
    <polygon points="148,130 178,112 173,138" fill="#9ADBC8" opacity=".55"/>
    <circle cx="22" cy="112" r="3.5" fill="#FF8FAB"/>
    <circle cx="178" cy="112" r="3.5" fill="#FF8FAB"/>
    <rect x="86" y="88" width="28" height="14" rx="7" fill="#9ADBC8"/>
    <circle cx="48" cy="114" r="13" fill="url(#cream)" stroke="#8FBFB0" stroke-width="2.5"/>
    <circle cx="152" cy="114" r="13" fill="url(#cream)" stroke="#8FBFB0" stroke-width="2.5"/>
    <rect x="54" y="100" width="92" height="66" rx="26" fill="url(#cream)" stroke="#8FBFB0" stroke-width="3"/>
    <g class="r-core">
      <circle cx="100" cy="132" r="19" fill="#FFFAF2" stroke="#9ADBC8" stroke-width="2.5"/>
      <circle cx="100" cy="132" r="12" fill="url(#core)"/>
      <path d="M100,136.5 C98,134.8 95.2,133 94.2,130.8 C93,127.9 96.6,125.7 100,128.6 C103.4,125.7 107,127.9 105.8,130.8 C104.8,133 102,134.8 100,136.5 Z" fill="#fff7e0"/>
    </g>
    <g><rect x="30" y="106" width="22" height="48" rx="11" fill="#DFF2EA" stroke="#8FBFB0" stroke-width="3"/><rect x="30" y="126" width="22" height="5" rx="2.5" fill="#7EE8FF" opacity=".85"/><circle cx="41" cy="158" r="10" fill="#FFFFFF" stroke="#8FBFB0" stroke-width="3"/></g>
    <g><rect x="148" y="106" width="22" height="48" rx="11" fill="#DFF2EA" stroke="#8FBFB0" stroke-width="3"/><rect x="148" y="126" width="22" height="5" rx="2.5" fill="#7EE8FF" opacity=".85"/><circle cx="159" cy="158" r="10" fill="#FFFFFF" stroke="#8FBFB0" stroke-width="3"/></g>
    <rect x="62" y="160" width="30" height="12" rx="6" fill="#CBE8DD" stroke="#8FBFB0" stroke-width="2.5"/>
    <rect x="108" y="160" width="30" height="12" rx="6" fill="#CBE8DD" stroke="#8FBFB0" stroke-width="2.5"/>
    <rect x="65" y="168" width="24" height="3" rx="1.5" fill="#7EE8FF" opacity=".9"/>
    <rect x="111" y="168" width="24" height="3" rx="1.5" fill="#7EE8FF" opacity=".9"/>
    <path class="r-flame" d="M86,170 Q100,188 114,170 Q100,179 86,170 Z" fill="#FFD166"/>
    <path class="r-flame" d="M92,170 Q100,181 108,170 Q100,176 92,170 Z" fill="#A8E6D8"/>`
};

/* v37：小星头部（三阶段通用，保证"还是它"）——星焰天线 + 圆头 + 面罩。
 * 注意：PET_BODIES 里 bot 的 head 也含面罩，三阶段路径改用 PET_HEAD（不含旧脸）。 */
const PET_HEAD = `
  <line x1="100" y1="22" x2="100" y2="13" stroke="#9ADBC8" stroke-width="4" stroke-linecap="round"/>
  <path d="M100,3.5 L101.8,8.2 L106.5,10 L101.8,11.8 L100,16.5 L98.2,11.8 L93.5,10 L98.2,8.2 Z" fill="#FF8FAB" stroke="#E0708F" stroke-width="1.2"/>
  <circle cx="100" cy="62" r="44" fill="url(#cream)" stroke="#8FBFB0" stroke-width="3"/>
  <circle cx="58" cy="60" r="6" fill="#9ADBC8" stroke="#8FBFB0" stroke-width="2.5"/>
  <circle cx="142" cy="60" r="6" fill="#9ADBC8" stroke="#8FBFB0" stroke-width="2.5"/>
  <rect x="64" y="44" width="72" height="36" rx="17" fill="url(#visorc)"/>
  <ellipse cx="72" cy="87" rx="5.5" ry="3.8" fill="#FFB3C8" opacity=".75"/>
  <ellipse cx="128" cy="87" rx="5.5" ry="3.8" fill="#FFB3C8" opacity=".75"/>`;

/* v37 修复：猫/恐龙/紫人（旧结构物种）的翅膀与推进焰——旧版 svg 骨架片段，
 * 新骨架改版时被丢掉了，这里补回（受 stage 类控制显隐） */


/* ---------- v37-A2：星际猫 · 糖果可爱风（三段剪影 + 8 表情） ----------
 * 三个记忆点（进化不变）：奶油杏圆头 + 粉内耳圆耳、果冻绿大眼、卷卷奶油尾（粉尾尖）。
 * 与机器人的差异化：猫的能量徽章是四角星（机器人为爱心），能量线/腕环用粉色。
 * 锚点与机器人一致：头 (100,62) r44、双眼 (85,62)/(115,62)、嘴区 y84~96、装扮区不动。 */
const PET_CAT_HEAD = `
  <path d="M68,44 Q54,10 92,26" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="3" stroke-linejoin="round"/>
  <path d="M72,39 Q63,18 86,29" fill="#FFC9DC"/>
  <path d="M132,44 Q146,10 108,26" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="3" stroke-linejoin="round"/>
  <path d="M128,39 Q137,18 114,29" fill="#FFC9DC"/>
  <circle cx="100" cy="62" r="44" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="3"/>
  <g stroke="#D9A96E" stroke-width="2" stroke-linecap="round">
    <line x1="54" y1="68" x2="67" y2="70"/><line x1="54" y1="76" x2="67" y2="75"/>
    <line x1="146" y1="68" x2="133" y2="70"/><line x1="146" y1="76" x2="133" y2="75"/>
  </g>
  <path d="M96,70 L104,70 L100,75.5 Z" fill="#FF9DB5" stroke="#E77FA0" stroke-width="1.5" stroke-linejoin="round"/>
  <ellipse cx="70" cy="81" rx="6" ry="4" fill="#FFB3C8" opacity=".75"/>
  <ellipse cx="130" cy="81" rx="6" ry="4" fill="#FFB3C8" opacity=".75"/>`;

const PET_CAT_STAGES = {
  1: `
    <circle cx="100" cy="62" r="56" fill="url(#gloww)"/>
    <circle cx="100" cy="103" r="11" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="3"/>
    <circle cx="76" cy="110" r="5.5" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="2.5"/>
    <circle cx="124" cy="110" r="5.5" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="2.5"/>
    <path class="r-flame" d="M93,117 Q100,133 107,117 Q100,123 93,117 Z" fill="#FFD166"/>`,
  2: `
    <circle cx="100" cy="62" r="56" fill="url(#gloww)"/>
    <path d="M142,146 Q176,140 170,110" stroke="#FFE3C4" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="170" cy="108" r="6" fill="#FF9DB5"/>
    <path d="M180,104 L190,98 M177,114 L188,113" stroke="#FFC48F" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>
    <rect x="60" y="102" width="80" height="62" rx="27" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="3"/>
    <ellipse cx="100" cy="134" rx="26" ry="18" fill="#FFFAF2"/>
    <path d="M100,141 C97.5,138.5 93.5,136 92.5,133 C91,128.5 96.5,126 100,130.5 C103.5,126 109,128.5 107.5,133 C106.5,136 102.5,138.5 100,141 Z" fill="#FF8FAB" stroke="#E0708F" stroke-width="1.5"/>
    <rect x="66" y="158" width="26" height="12" rx="6" fill="#FFE3C4" stroke="#E0AC7C" stroke-width="2.5"/>
    <rect x="108" y="158" width="26" height="12" rx="6" fill="#FFE3C4" stroke="#E0AC7C" stroke-width="2.5"/>
    <ellipse cx="76" cy="166" rx="5" ry="3" fill="#FFC9DC"/>
    <ellipse cx="124" cy="166" rx="5" ry="3" fill="#FFC9DC"/>`,
  3: `
    <circle cx="100" cy="80" r="60" fill="url(#gloww)"/>
    <polygon points="52,118 8,96 20,142" fill="#FFE3C4" stroke="#E0AC7C" stroke-width="2.5"/>
    <polygon points="52,130 22,112 27,138" fill="#FFC9DC" opacity=".55"/>
    <polygon points="148,118 192,96 180,142" fill="#FFE3C4" stroke="#E0AC7C" stroke-width="2.5"/>
    <polygon points="148,130 178,112 173,138" fill="#FFC9DC" opacity=".55"/>
    <circle cx="22" cy="112" r="3.5" fill="#FF8FAB"/>
    <circle cx="178" cy="112" r="3.5" fill="#FF8FAB"/>
    <rect x="86" y="88" width="28" height="14" rx="7" fill="#FFD9A8"/>
    <circle cx="48" cy="114" r="13" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="2.5"/>
    <circle cx="152" cy="114" r="13" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="2.5"/>
    <path d="M146,104 Q182,94 168,58" stroke="#FFE3C4" stroke-width="12" fill="none" stroke-linecap="round"/>
    <circle cx="168" cy="56" r="6.5" fill="#FF8FAB"/>
    <rect x="54" y="100" width="92" height="66" rx="26" fill="url(#creamc)" stroke="#E0AC7C" stroke-width="3"/>
    <g class="r-core">
      <circle cx="100" cy="132" r="19" fill="#FFFAF2" stroke="#FFD9A8" stroke-width="2.5"/>
      <circle cx="100" cy="132" r="12" fill="url(#core)"/>
      <path d="M100,124.5 L102,130 L107.5,132 L102,134 L100,139.5 L98,134 L92.5,132 L98,130 Z" fill="#fff7e0"/>
    </g>
    <g><rect x="30" y="106" width="22" height="48" rx="11" fill="#FFF4E3" stroke="#E0AC7C" stroke-width="3"/><rect x="30" y="126" width="22" height="5" rx="2.5" fill="#FF9DB5" opacity=".85"/><circle cx="41" cy="158" r="10" fill="#FFFFFF" stroke="#E0AC7C" stroke-width="3"/></g>
    <g><rect x="148" y="106" width="22" height="48" rx="11" fill="#FFF4E3" stroke="#E0AC7C" stroke-width="3"/><rect x="148" y="126" width="22" height="5" rx="2.5" fill="#FF9DB5" opacity=".85"/><circle cx="159" cy="158" r="10" fill="#FFFFFF" stroke="#E0AC7C" stroke-width="3"/></g>
    <rect x="62" y="160" width="30" height="12" rx="6" fill="#FFE3C4" stroke="#E0AC7C" stroke-width="2.5"/>
    <rect x="108" y="160" width="30" height="12" rx="6" fill="#FFE3C4" stroke="#E0AC7C" stroke-width="2.5"/>
    <rect x="65" y="168" width="24" height="3" rx="1.5" fill="#FF9DB5" opacity=".9"/>
    <rect x="111" y="168" width="24" height="3" rx="1.5" fill="#FF9DB5" opacity=".9"/>
    <path class="r-flame" d="M86,170 Q100,188 114,170 Q100,179 86,170 Z" fill="#FFD166"/>
    <path class="r-flame" d="M92,170 Q100,181 108,170 Q100,176 92,170 Z" fill="#FFD9A8"/>`
};

const PET_CAT_MOODS = {
  idle: `
    <g class="eye"><ellipse cx="85" cy="60" rx="9.5" ry="11.5" fill="#4DBE93"/><circle cx="81.5" cy="55.5" r="3.4" fill="#fff"/><circle cx="88.5" cy="64" r="1.6" fill="#D8FFF0" opacity=".8"/></g>
    <g class="eye"><ellipse cx="115" cy="60" rx="9.5" ry="11.5" fill="#4DBE93"/><circle cx="111.5" cy="55.5" r="3.4" fill="#fff"/><circle cx="118.5" cy="64" r="1.6" fill="#D8FFF0" opacity=".8"/></g>
    <path class="mouth" d="M92,80 Q96,84 100,80 Q104,84 108,80" stroke="#C98A5B" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  happy: `
    <g class="eye"><ellipse cx="85" cy="60" rx="10" ry="12" fill="#4DBE93"/><circle cx="81.2" cy="55.5" r="3.6" fill="#fff"/><circle cx="88.8" cy="64.5" r="1.8" fill="#D8FFF0" opacity=".7"/></g>
    <g class="eye"><ellipse cx="115" cy="60" rx="10" ry="12" fill="#4DBE93"/><circle cx="111.2" cy="55.5" r="3.6" fill="#fff"/><circle cx="118.8" cy="64.5" r="1.8" fill="#D8FFF0" opacity=".7"/></g>
    <path class="mouth" d="M80,80 Q100,101 120,80 Q100,89 80,80 Z" fill="#3D2B1F"/>
    <path d="M92,88 Q100,95 108,88 Q100,91.5 92,88 Z" fill="#FF8FAB"/>`,
  cheer: `
    <g class="eye"><path d="M78,63 Q85,55 92,63" stroke="#4DBE93" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <g class="eye"><path d="M108,63 Q115,55 122,63" stroke="#4DBE93" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <path class="mouth" d="M80,80 Q100,101 120,80 Q100,89 80,80 Z" fill="#3D2B1F"/>
    <path d="M64,40 L65.6,44 L69.6,45.6 L65.6,47.2 L64,51.2 L62.4,47.2 L58.4,45.6 L62.4,44 Z" fill="#FFD166"/>
    <path d="M136,40 L137.6,44 L141.6,45.6 L137.6,47.2 L136,51.2 L134.4,47.2 L130.4,45.6 L134.4,44 Z" fill="#FFD166"/>`,
  expect: `
    <g class="eye"><ellipse cx="85" cy="60" rx="10" ry="12.2" fill="#4DBE93"/><circle cx="81.4" cy="55.5" r="3.4" fill="#fff"/><circle cx="88.6" cy="64.5" r="1.7" fill="#D8FFF0" opacity=".7"/></g>
    <g class="eye"><ellipse cx="115" cy="60" rx="10" ry="12.2" fill="#4DBE93"/><circle cx="111.4" cy="55.5" r="3.4" fill="#fff"/><circle cx="118.6" cy="64.5" r="1.7" fill="#D8FFF0" opacity=".7"/></g>
    <circle cx="100" cy="88" r="4.8" fill="#3D2B1F" stroke="#C98A5B" stroke-width="1.5"/>
    <circle cx="124" cy="40" r="1.8" fill="#FFC48F"/>
    <circle cx="131" cy="33" r="1.8" fill="#FFC48F" opacity=".8"/>
    <circle cx="138" cy="26" r="1.8" fill="#FFC48F" opacity=".6"/>`,
  sad: `
    <g class="eye"><ellipse cx="85" cy="61" rx="8.5" ry="10" fill="#4DBE93"/><path d="M78,55 Q85,51 92,55" stroke="#D9A96E" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="81.8" cy="58.2" r="2.6" fill="#fff"/></g>
    <g class="eye"><ellipse cx="115" cy="61" rx="8.5" ry="10" fill="#4DBE93"/><path d="M108,55 Q115,51 122,55" stroke="#D9A96E" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="111.8" cy="58.2" r="2.6" fill="#fff"/></g>
    <path d="M74,69 Q77.5,77 74,80 Q70.5,77 74,69 Z" fill="#A8E6D8"/>
    <path class="mouth" d="M88,90 Q100,85 112,90" stroke="#C98A5B" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  sleep: `
    <g class="eye"><path d="M78,60 Q85,65 92,60" stroke="#4DBE93" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <g class="eye"><path d="M108,60 Q115,65 122,60" stroke="#4DBE93" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <circle cx="100" cy="87" r="3.6" fill="#3D2B1F"/>
    <text x="126" y="34" font-family="sans-serif" font-size="13" fill="#D9A96E" opacity=".9">z</text>
    <text x="136" y="22" font-family="sans-serif" font-size="9" fill="#D9A96E" opacity=".7">z</text>`,
  sparkle: `
    <g class="eye"><path d="M85,51 L86.9,57.4 L93.5,59.3 L86.9,61.2 L85,67.6 L83.1,61.2 L76.5,59.3 L83.1,57.4 Z" fill="#FFD166"/></g>
    <g class="eye"><path d="M115,51 L116.9,57.4 L123.5,59.3 L116.9,61.2 L115,67.6 L113.1,61.2 L106.5,59.3 L113.1,57.4 Z" fill="#FFD166"/></g>
    <path class="mouth" d="M82,80 Q100,100 118,80 Q100,88 82,80 Z" fill="#3D2B1F"/>
    <path d="M60,30 L61.2,33.6 L65,34.8 L61.2,36 L60,39.6 L58.8,36 L55,34.8 L58.8,33.6 Z" fill="#FF8FAB"/>
    <path d="M140,30 L141.2,33.6 L145,34.8 L141.2,36 L140,39.6 L138.8,36 L135,34.8 L138.8,33.6 Z" fill="#FF8FAB"/>`,
  love: `
    <g class="eye"><path d="M85,70 C82,68 77.5,65 76,61.5 C74,56 80,52 85,57 C90,52 96,56 94,61.5 C92.5,65 88,68 85,70 Z" fill="#FF8FAB"/></g>
    <g class="eye"><path d="M115,70 C112,68 107.5,65 106,61.5 C104,56 110,52 115,57 C120,52 126,56 124,61.5 C122.5,65 118,68 115,70 Z" fill="#FF8FAB"/></g>
    <path class="mouth" d="M92,80 Q96,84 100,80 Q104,84 108,80" stroke="#C98A5B" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
};

/* ---------- v37-A3：薄荷小恐龙 · 糖果可爱风（三段剪影 + 8 表情） ----------
 * 三个记忆点（进化不变）：薄荷绿圆头 + 圆弧背鳍、金色果冻大眼、粗短尾（尾焰喷出）。
 * 体态：四足趴姿（无手臂），与猫同理；能量徽章为圆形绿叶（机器人爱心/猫四角星/恐龙绿叶）。
 * 锚点与机器人/猫完全一致。 */
const PET_DINO_HEAD = `
  <g fill="#74C79B" stroke="#5BA883" stroke-width="2.5" stroke-linejoin="round">
    <path d="M74,28 Q68,6 90,18 Z"/>
    <path d="M92,22 Q90,2 106,12 Z"/>
    <path d="M110,16 Q112,-2 126,10 Z"/>
  </g>
  <g fill="#FBFFEF" opacity=".6">
    <path d="M76,26 Q72,12 88,20 Z"/>
    <path d="M94,20 Q93,8 104,14 Z"/>
    <path d="M111,14 Q113,4 122,10 Z"/>
  </g>
  <circle cx="100" cy="62" r="44" fill="url(#creamd)" stroke="#74C79B" stroke-width="3"/>
  <ellipse cx="100" cy="80" rx="17" ry="10.5" fill="#FBFFEF" stroke="#74C79B" stroke-width="2.5"/>
  <circle cx="94" cy="78" r="1.8" fill="#4A7A5C"/>
  <circle cx="106" cy="78" r="1.8" fill="#4A7A5C"/>
  <ellipse cx="70" cy="70" rx="6" ry="4" fill="#FFB3C8" opacity=".75"/>
  <ellipse cx="130" cy="70" rx="6" ry="4" fill="#FFB3C8" opacity=".75"/>`;

const PET_DINO_STAGES = {
  1: `
    <circle cx="100" cy="62" r="56" fill="url(#glowd)"/>
    <circle cx="100" cy="103" r="12" fill="url(#creamd)" stroke="#74C79B" stroke-width="3"/>
    <circle cx="76" cy="110" r="6" fill="url(#creamd)" stroke="#74C79B" stroke-width="2.5"/>
    <circle cx="124" cy="110" r="6" fill="url(#creamd)" stroke="#74C79B" stroke-width="2.5"/>
    <path class="r-flame" d="M93,117 Q100,133 107,117 Q100,123 93,117 Z" fill="#FFD166"/>`,
  2: `
    <circle cx="100" cy="62" r="56" fill="url(#glowd)"/>
    <path d="M140,148 Q172,146 166,118" stroke="#DFF5D0" stroke-width="11" fill="none" stroke-linecap="round"/>
    <circle cx="166" cy="116" r="6" fill="#74C79B"/>
    <rect x="60" y="102" width="80" height="62" rx="26" fill="url(#creamd)" stroke="#74C79B" stroke-width="3"/>
    <ellipse cx="100" cy="134" rx="26" ry="18" fill="#FBFFEF"/>
    <path d="M100,128 C96,124 90,126 90,131 C90,135 95,139 100,143 C105,139 110,135 110,131 C110,126 104,124 100,128 Z" fill="#74C79B" stroke="#5BA883" stroke-width="1.5"/>
    <rect x="66" y="156" width="26" height="14" rx="7" fill="#DFF5D0" stroke="#74C79B" stroke-width="2.5"/>
    <rect x="108" y="156" width="26" height="14" rx="7" fill="#DFF5D0" stroke="#74C79B" stroke-width="2.5"/>
    <ellipse cx="76" cy="166" rx="5" ry="3" fill="#FBFFEF" opacity=".8"/>
    <ellipse cx="124" cy="166" rx="5" ry="3" fill="#FBFFEF" opacity=".8"/>`,
  3: `
    <circle cx="100" cy="80" r="60" fill="url(#glowd)"/>
    <polygon points="52,118 8,96 20,142" fill="#DFF5D0" stroke="#74C79B" stroke-width="2.5"/>
    <polygon points="52,130 22,112 27,138" fill="#A9D98A" opacity=".55"/>
    <polygon points="148,118 192,96 180,142" fill="#DFF5D0" stroke="#74C79B" stroke-width="2.5"/>
    <polygon points="148,130 178,112 173,138" fill="#A9D98A" opacity=".55"/>
    <circle cx="22" cy="112" r="3.5" fill="#FF8FAB"/>
    <circle cx="178" cy="112" r="3.5" fill="#FF8FAB"/>
    <rect x="86" y="88" width="28" height="14" rx="7" fill="#A9D98A"/>
    <circle cx="48" cy="114" r="13" fill="url(#creamd)" stroke="#74C79B" stroke-width="2.5"/>
    <circle cx="152" cy="114" r="13" fill="url(#creamd)" stroke="#74C79B" stroke-width="2.5"/>
    <path d="M142,148 Q182,148 174,116" stroke="#DFF5D0" stroke-width="12" fill="none" stroke-linecap="round"/>
    <circle cx="174" cy="114" r="6.5" fill="#74C79B"/>
    <rect x="54" y="100" width="92" height="66" rx="26" fill="url(#creamd)" stroke="#74C79B" stroke-width="3"/>
    <g class="r-core">
      <circle cx="100" cy="132" r="19" fill="#FBFFEF" stroke="#A9D98A" stroke-width="2.5"/>
      <circle cx="100" cy="132" r="12" fill="url(#core)"/>
      <path d="M100,126 C97,126 95,128 95,131 C95,134 98,137 100,139 C102,137 105,134 105,131 C105,128 103,126 100,126 Z M100,128 C98.5,128 97.5,129 97.5,130.5 C97.5,132 99,133.5 100,135 C101,133.5 102.5,132 102.5,130.5 C102.5,129 101.5,128 100,128 Z" fill="#74C79B"/>
    </g>
    <g><rect x="30" y="106" width="22" height="48" rx="11" fill="#DFF5D0" stroke="#74C79B" stroke-width="3"/><rect x="30" y="126" width="22" height="5" rx="2.5" fill="#74C79B" opacity=".85"/><circle cx="41" cy="158" r="10" fill="#FFFFFF" stroke="#74C79B" stroke-width="3"/></g>
    <g><rect x="148" y="106" width="22" height="48" rx="11" fill="#DFF5D0" stroke="#74C79B" stroke-width="3"/><rect x="148" y="126" width="22" height="5" rx="2.5" fill="#74C79B" opacity=".85"/><circle cx="159" cy="158" r="10" fill="#FFFFFF" stroke="#74C79B" stroke-width="3"/></g>
    <rect x="62" y="158" width="30" height="14" rx="7" fill="#DFF5D0" stroke="#74C79B" stroke-width="2.5"/>
    <rect x="108" y="158" width="30" height="14" rx="7" fill="#DFF5D0" stroke="#74C79B" stroke-width="2.5"/>
    <rect x="65" y="167" width="24" height="3" rx="1.5" fill="#74C79B" opacity=".9"/>
    <rect x="111" y="167" width="24" height="3" rx="1.5" fill="#74C79B" opacity=".9"/>
    <path class="r-flame" d="M86,170 Q100,188 114,170 Q100,179 86,170 Z" fill="#FFD166"/>
    <path class="r-flame" d="M92,170 Q100,181 108,170 Q100,176 92,170 Z" fill="#DFF5D0"/>`
};

const PET_DINO_MOODS = {
  idle: `
    <g class="eye"><ellipse cx="85" cy="58" rx="9.5" ry="11" fill="#F5B93B"/><circle cx="81.5" cy="53.5" r="3.4" fill="#fff"/><circle cx="88.5" cy="62" r="1.6" fill="#FFF3D0" opacity=".8"/></g>
    <g class="eye"><ellipse cx="115" cy="58" rx="9.5" ry="11" fill="#F5B93B"/><circle cx="111.5" cy="53.5" r="3.4" fill="#fff"/><circle cx="118.5" cy="62" r="1.6" fill="#FFF3D0" opacity=".8"/></g>
    <path class="mouth" d="M93,87 Q100,92 107,87" stroke="#4A7A5C" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  happy: `
    <g class="eye"><ellipse cx="85" cy="58" rx="10" ry="11.5" fill="#F5B93B"/><circle cx="81.2" cy="53.5" r="3.6" fill="#fff"/><circle cx="88.8" cy="62.5" r="1.8" fill="#FFF3D0" opacity=".7"/></g>
    <g class="eye"><ellipse cx="115" cy="58" rx="10" ry="11.5" fill="#F5B93B"/><circle cx="111.2" cy="53.5" r="3.6" fill="#fff"/><circle cx="118.8" cy="62.5" r="1.8" fill="#FFF3D0" opacity=".7"/></g>
    <path class="mouth" d="M80,82 Q100,103 120,82 Q100,91 80,82 Z" fill="#3D2B1F"/>
    <path d="M92,90 Q100,97 108,90 Q100,93.5 92,90 Z" fill="#FF8FAB"/>`,
  cheer: `
    <g class="eye"><path d="M78,61 Q85,53 92,61" stroke="#F5B93B" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <g class="eye"><path d="M108,61 Q115,53 122,61" stroke="#F5B93B" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <path class="mouth" d="M80,82 Q100,103 120,82 Q100,91 80,82 Z" fill="#3D2B1F"/>
    <path d="M64,40 L65.6,44 L69.6,45.6 L65.6,47.2 L64,51.2 L62.4,47.2 L58.4,45.6 L62.4,44 Z" fill="#FFD166"/>
    <path d="M136,40 L137.6,44 L141.6,45.6 L137.6,47.2 L136,51.2 L134.4,47.2 L130.4,45.6 L134.4,44 Z" fill="#FFD166"/>`,
  expect: `
    <g class="eye"><ellipse cx="85" cy="58" rx="10" ry="11.8" fill="#F5B93B"/><circle cx="81.4" cy="53.5" r="3.4" fill="#fff"/><circle cx="88.6" cy="62.5" r="1.7" fill="#FFF3D0" opacity=".7"/></g>
    <g class="eye"><ellipse cx="115" cy="58" rx="10" ry="11.8" fill="#F5B93B"/><circle cx="111.4" cy="53.5" r="3.4" fill="#fff"/><circle cx="118.6" cy="62.5" r="1.7" fill="#FFF3D0" opacity=".7"/></g>
    <circle cx="100" cy="90" r="4.8" fill="#3D2B1F" stroke="#4A7A5C" stroke-width="1.5"/>
    <circle cx="124" cy="40" r="1.8" fill="#A9D98A"/>
    <circle cx="131" cy="33" r="1.8" fill="#A9D98A" opacity=".8"/>
    <circle cx="138" cy="26" r="1.8" fill="#A9D98A" opacity=".6"/>`,
  sad: `
    <g class="eye"><ellipse cx="85" cy="59" rx="8.5" ry="10" fill="#F5B93B"/><path d="M78,53 Q85,49 92,53" stroke="#9BB89A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="81.8" cy="56.2" r="2.6" fill="#fff"/></g>
    <g class="eye"><ellipse cx="115" cy="59" rx="8.5" ry="10" fill="#F5B93B"/><path d="M108,53 Q115,49 122,53" stroke="#9BB89A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="111.8" cy="56.2" r="2.6" fill="#fff"/></g>
    <path d="M74,69 Q77.5,77 74,80 Q70.5,77 74,69 Z" fill="#A8E6D8"/>
    <path class="mouth" d="M88,91 Q100,86 112,91" stroke="#4A7A5C" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  sleep: `
    <g class="eye"><path d="M78,58 Q85,63 92,58" stroke="#F5B93B" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <g class="eye"><path d="M108,58 Q115,63 122,58" stroke="#F5B93B" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <circle cx="100" cy="89" r="3.6" fill="#3D2B1F"/>
    <text x="126" y="34" font-family="sans-serif" font-size="13" fill="#9BB89A" opacity=".9">z</text>
    <text x="136" y="22" font-family="sans-serif" font-size="9" fill="#9BB89A" opacity=".7">z</text>`,
  sparkle: `
    <g class="eye"><path d="M85,49 L86.9,55.4 L93.5,57.3 L86.9,59.2 L85,65.6 L83.1,59.2 L76.5,57.3 L83.1,55.4 Z" fill="#FFD166"/></g>
    <g class="eye"><path d="M115,49 L116.9,55.4 L123.5,57.3 L116.9,59.2 L115,65.6 L113.1,59.2 L106.5,57.3 L113.1,55.4 Z" fill="#FFD166"/></g>
    <path class="mouth" d="M82,82 Q100,102 118,82 Q100,90 82,82 Z" fill="#3D2B1F"/>
    <path d="M60,30 L61.2,33.6 L65,34.8 L61.2,36 L60,39.6 L58.8,36 L55,34.8 L58.8,33.6 Z" fill="#FF8FAB"/>
    <path d="M140,30 L141.2,33.6 L145,34.8 L141.2,36 L140,39.6 L138.8,36 L135,34.8 L138.8,33.6 Z" fill="#FF8FAB"/>`,
  love: `
    <g class="eye"><path d="M85,68 C82,66 77.5,63 76,59.5 C74,54 80,50 85,55 C90,50 96,54 94,59.5 C92.5,63 88,66 85,68 Z" fill="#FF8FAB"/></g>
    <g class="eye"><path d="M115,68 C112,66 107.5,63 106,59.5 C104,54 110,50 115,55 C120,50 126,54 124,59.5 C122.5,63 118,66 115,68 Z" fill="#FF8FAB"/></g>
    <path class="mouth" d="M93,87 Q100,92 107,87" stroke="#4A7A5C" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
};


/* ---------- v37-A4：深空小紫人 · 糖果可爱风（三段剪影 + 8 表情） ----------
 * 三个记忆点（进化不变）：香芋紫圆头 + 双触角发光球、深色星光大眼、悬浮云朵身。
 * 体态：悬浮无腿无手臂（外星生物）；能量徽章为星云漩涡（机器人爱心/猫四角星/恐龙绿叶/紫人漩涡）。
 * 锚点与其他三款完全一致。 */
const PET_ALIEN_HEAD = `
  <line x1="80" y1="30" x2="68" y2="14" stroke="#A78BEB" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="67" cy="12" r="5" fill="#7EE8FF" stroke="#4FB8D8" stroke-width="2"/>
  <line x1="120" y1="30" x2="132" y2="14" stroke="#A78BEB" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="133" cy="12" r="5" fill="#FF9DB5" stroke="#E77FA0" stroke-width="2"/>
  <ellipse cx="100" cy="62" rx="43" ry="42" fill="url(#creama)" stroke="#A78BEB" stroke-width="3"/>
  <ellipse cx="70" cy="76" rx="6" ry="4" fill="#FFB3C8" opacity=".8"/>
  <ellipse cx="130" cy="76" rx="6" ry="4" fill="#FFB3C8" opacity=".8"/>`;

const PET_ALIEN_STAGES = {
  1: `
    <circle cx="100" cy="62" r="56" fill="url(#glowa)"/>
    <ellipse cx="100" cy="108" rx="16" ry="7" fill="url(#creama)" stroke="#A78BEB" stroke-width="2.5"/>
    <path class="r-flame" d="M93,117 Q100,133 107,117 Q100,123 93,117 Z" fill="#FFD166"/>`,
  2: `
    <circle cx="100" cy="62" r="56" fill="url(#glowa)"/>
    <path d="M66,120 Q64,106 78,104 L122,104 Q136,106 134,120 Q140,150 128,160 L72,160 Q60,150 66,120 Z" fill="url(#creama)" stroke="#A78BEB" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="100" cy="134" rx="26" ry="18" fill="#F5EEFF"/>
    <path d="M100,124 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 M100,124 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0" fill="#A78BEB"/>
    <path d="M150,44 l2.2,5 5,2.2 -5,2.2 -2.2,5 -2.2 -5 -5 -2.2 5 -2.2 Z" fill="#FFD166"/>
    <path d="M52,40 l1.6,3.6 3.6,1.6 -3.6,1.6 -1.6,3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6 Z" fill="#7EE8FF"/>`,
  3: `
    <circle cx="100" cy="80" r="60" fill="url(#glowa)"/>
    <polygon points="52,118 8,96 20,142" fill="#EDE1FA" stroke="#A78BEB" stroke-width="2.5"/>
    <polygon points="52,130 22,112 27,138" fill="#C9B2E8" opacity=".55"/>
    <polygon points="148,118 192,96 180,142" fill="#EDE1FA" stroke="#A78BEB" stroke-width="2.5"/>
    <polygon points="148,130 178,112 173,138" fill="#C9B2E8" opacity=".55"/>
    <circle cx="22" cy="112" r="3.5" fill="#FF8FAB"/>
    <circle cx="178" cy="112" r="3.5" fill="#FF8FAB"/>
    <rect x="86" y="88" width="28" height="14" rx="7" fill="#C9B2E8"/>
    <circle cx="48" cy="114" r="13" fill="url(#creama)" stroke="#A78BEB" stroke-width="2.5"/>
    <circle cx="152" cy="114" r="13" fill="url(#creama)" stroke="#A78BEB" stroke-width="2.5"/>
    <path d="M66,120 Q64,106 78,104 L122,104 Q136,106 134,120 Q140,150 128,160 L72,160 Q60,150 66,120 Z" fill="url(#creama)" stroke="#A78BEB" stroke-width="3" stroke-linejoin="round"/>
    <g class="r-core">
      <circle cx="100" cy="132" r="19" fill="#F5EEFF" stroke="#C9B2E8" stroke-width="2.5"/>
      <circle cx="100" cy="132" r="12" fill="url(#core)"/>
      <path d="M100,124 m-7,3 a7,7 0 1,1 14,-4 a5,5 0 1,0 -10,2 a3,3 0 1,1 6,-1" fill="none" stroke="#A78BEB" stroke-width="2" stroke-linecap="round"/>
    </g>
    <g><rect x="30" y="106" width="22" height="48" rx="11" fill="#EDE1FA" stroke="#A78BEB" stroke-width="3"/><rect x="30" y="126" width="22" height="5" rx="2.5" fill="#A78BEB" opacity=".85"/><circle cx="41" cy="158" r="10" fill="#FFFFFF" stroke="#A78BEB" stroke-width="3"/></g>
    <g><rect x="148" y="106" width="22" height="48" rx="11" fill="#EDE1FA" stroke="#A78BEB" stroke-width="3"/><rect x="148" y="126" width="22" height="5" rx="2.5" fill="#A78BEB" opacity=".85"/><circle cx="159" cy="158" r="10" fill="#FFFFFF" stroke="#A78BEB" stroke-width="3"/></g>
    <rect x="62" y="158" width="30" height="14" rx="7" fill="#EDE1FA" stroke="#A78BEB" stroke-width="2.5"/>
    <rect x="108" y="158" width="30" height="14" rx="7" fill="#EDE1FA" stroke="#A78BEB" stroke-width="2.5"/>
    <rect x="65" y="167" width="24" height="3" rx="1.5" fill="#A78BEB" opacity=".9"/>
    <rect x="111" y="167" width="24" height="3" rx="1.5" fill="#A78BEB" opacity=".9"/>
    <path class="r-flame" d="M86,170 Q100,188 114,170 Q100,179 86,170 Z" fill="#FFD166"/>
    <path class="r-flame" d="M92,170 Q100,181 108,170 Q100,176 92,170 Z" fill="#EDE1FA"/>`
};

const PET_ALIEN_MOODS = {
  idle: `
    <g class="eye"><ellipse cx="85" cy="60" rx="10" ry="12" fill="#3A2B66"/><circle cx="81.5" cy="55.5" r="3.6" fill="#fff"/><circle cx="88.5" cy="64" r="1.8" fill="#B9A0FF" opacity=".8"/></g>
    <g class="eye"><ellipse cx="115" cy="60" rx="10" ry="12" fill="#3A2B66"/><circle cx="111.5" cy="55.5" r="3.6" fill="#fff"/><circle cx="118.5" cy="64" r="1.8" fill="#B9A0FF" opacity=".8"/></g>
    <path class="mouth" d="M94,84 Q100,90 106,84" stroke="#7A5FB8" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  happy: `
    <g class="eye"><ellipse cx="85" cy="60" rx="10.5" ry="12.5" fill="#3A2B66"/><circle cx="81.2" cy="55.5" r="3.8" fill="#fff"/><circle cx="88.8" cy="64.5" r="1.9" fill="#B9A0FF" opacity=".7"/></g>
    <g class="eye"><ellipse cx="115" cy="60" rx="10.5" ry="12.5" fill="#3A2B66"/><circle cx="111.2" cy="55.5" r="3.8" fill="#fff"/><circle cx="118.8" cy="64.5" r="1.9" fill="#B9A0FF" opacity=".7"/></g>
    <path class="mouth" d="M80,82 Q100,103 120,82 Q100,91 80,82 Z" fill="#3D2B1F"/>
    <path d="M92,90 Q100,97 108,90 Q100,93.5 92,90 Z" fill="#FF8FAB"/>`,
  cheer: `
    <g class="eye"><path d="M78,63 Q85,55 92,63" stroke="#B9A0FF" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <g class="eye"><path d="M108,63 Q115,55 122,63" stroke="#B9A0FF" stroke-width="4" fill="none" stroke-linecap="round"/></g>
    <path class="mouth" d="M80,82 Q100,103 120,82 Q100,91 80,82 Z" fill="#3D2B1F"/>
    <path d="M64,40 L65.6,44 L69.6,45.6 L65.6,47.2 L64,51.2 L62.4,47.2 L58.4,45.6 L62.4,44 Z" fill="#FFD166"/>
    <path d="M136,40 L137.6,44 L141.6,45.6 L137.6,47.2 L136,51.2 L134.4,47.2 L130.4,45.6 L134.4,44 Z" fill="#FFD166"/>`,
  expect: `
    <g class="eye"><ellipse cx="85" cy="60" rx="10.5" ry="12.8" fill="#3A2B66"/><circle cx="81.4" cy="55.5" r="3.6" fill="#fff"/><circle cx="88.6" cy="64.5" r="1.8" fill="#B9A0FF" opacity=".7"/></g>
    <g class="eye"><ellipse cx="115" cy="60" rx="10.5" ry="12.8" fill="#3A2B66"/><circle cx="111.4" cy="55.5" r="3.6" fill="#fff"/><circle cx="118.6" cy="64.5" r="1.8" fill="#B9A0FF" opacity=".7"/></g>
    <circle cx="100" cy="89" r="4.8" fill="#3D2B1F" stroke="#7A5FB8" stroke-width="1.5"/>
    <circle cx="124" cy="40" r="1.8" fill="#C9B2E8"/>
    <circle cx="131" cy="33" r="1.8" fill="#C9B2E8" opacity=".8"/>
    <circle cx="138" cy="26" r="1.8" fill="#C9B2E8" opacity=".6"/>`,
  sad: `
    <g class="eye"><ellipse cx="85" cy="61" rx="9" ry="10.5" fill="#3A2B66"/><path d="M78,55 Q85,51 92,55" stroke="#C9B2E8" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="81.8" cy="58.2" r="2.8" fill="#fff"/></g>
    <g class="eye"><ellipse cx="115" cy="61" rx="9" ry="10.5" fill="#3A2B66"/><path d="M108,55 Q115,51 122,55" stroke="#C9B2E8" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="111.8" cy="58.2" r="2.8" fill="#fff"/></g>
    <path d="M74,69 Q77.5,77 74,80 Q70.5,77 74,69 Z" fill="#A8E6D8"/>
    <path class="mouth" d="M88,91 Q100,86 112,91" stroke="#7A5FB8" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
  sleep: `
    <g class="eye"><path d="M78,60 Q85,65 92,60" stroke="#B9A0FF" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <g class="eye"><path d="M108,60 Q115,65 122,60" stroke="#B9A0FF" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <circle cx="100" cy="88" r="3.6" fill="#3D2B1F"/>
    <text x="126" y="34" font-family="sans-serif" font-size="13" fill="#C9B2E8" opacity=".9">z</text>
    <text x="136" y="22" font-family="sans-serif" font-size="9" fill="#C9B2E8" opacity=".7">z</text>`,
  sparkle: `
    <g class="eye"><path d="M85,51 L86.9,57.4 L93.5,59.3 L86.9,61.2 L85,67.6 L83.1,61.2 L76.5,59.3 L83.1,57.4 Z" fill="#FFD166"/></g>
    <g class="eye"><path d="M115,51 L116.9,57.4 L123.5,59.3 L116.9,61.2 L115,67.6 L113.1,61.2 L106.5,59.3 L113.1,57.4 Z" fill="#FFD166"/></g>
    <path class="mouth" d="M82,82 Q100,102 118,82 Q100,90 82,82 Z" fill="#3D2B1F"/>
    <path d="M60,30 L61.2,33.6 L65,34.8 L61.2,36 L60,39.6 L58.8,36 L55,34.8 L58.8,33.6 Z" fill="#FF8FAB"/>
    <path d="M140,30 L141.2,33.6 L145,34.8 L141.2,36 L140,39.6 L138.8,36 L135,34.8 L138.8,33.6 Z" fill="#FF8FAB"/>`,
  love: `
    <g class="eye"><path d="M85,70 C82,68 77.5,65 76,61.5 C74,56 80,52 85,57 C90,52 96,56 94,61.5 C92.5,65 88,68 85,70 Z" fill="#FF8FAB"/></g>
    <g class="eye"><path d="M115,70 C112,68 107.5,65 106,61.5 C104,56 110,52 115,57 C120,52 126,56 124,61.5 C122.5,65 118,68 115,70 Z" fill="#FF8FAB"/></g>
    <path class="mouth" d="M94,84 Q100,90 106,84" stroke="#7A5FB8" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
};


function robotSVG(stage, kindId, mood = 'idle') {
  const worn = (Store.state.pet.outfits && Store.state.pet.outfits.worn) || {};
  const kind = (typeof PET_KINDS !== 'undefined' && PET_KINDS.find(k => k.id === kindId)) || PET_KINDS[0];
  /* v37：redesign 物种走"三段独立剪影 + 表情"新架构，其余物种保持旧结构。
   * Store.petStage() 返回 0/1/2，映射到 1/2/3 号身体。新物种在此注册一行即可接入。 */
  const REDI = {
    bot: { stages: PET_STAGE_BODIES, head: PET_HEAD, moods: PET_MOODS },
    cat: { stages: PET_CAT_STAGES, head: PET_CAT_HEAD, moods: PET_CAT_MOODS },
    dino: { stages: PET_DINO_STAGES, head: PET_DINO_HEAD, moods: PET_DINO_MOODS },
    alien: { stages: PET_ALIEN_STAGES, head: PET_ALIEN_HEAD, moods: PET_ALIEN_MOODS }
  };
  const red = REDI[kind.id] || REDI.bot;
  const body = red.stages[stage + 1] || red.stages[1];
  const head = red.head;
  const face = red.moods[mood] || red.moods.idle;
  const ACC = {
    hat: '<g><ellipse cx="100" cy="26" rx="32" ry="6" fill="#2b3f6e" stroke="#4fd1ff" stroke-width="1.5"/><rect x="82" y="4" width="36" height="22" rx="4" fill="#2b3f6e"/><rect x="82" y="19" width="36" height="7" fill="#ff6bd6"/></g>',
    crown: '<g><polygon points="76,28 81,8 92,20 100,4 108,20 119,8 124,28" fill="#ffd166" stroke="#e0a63c" stroke-width="2"/><circle cx="100" cy="18" r="3.2" fill="#ff6bd6"/></g>',
    bow: '<g><polygon points="128,22 146,13 146,31" fill="#ff8fab" stroke="#ff6bd6" stroke-width="1.5"/><polygon points="164,22 146,13 146,31" fill="#ff8fab" stroke="#ff6bd6" stroke-width="1.5"/><circle cx="146" cy="22" r="4.5" fill="#ff6bd6"/></g>',
    shades: '<g><rect x="68" y="54" width="27" height="17" rx="8" fill="#141d38"/><rect x="105" y="54" width="27" height="17" rx="8" fill="#141d38"/><line x1="95" y1="62" x2="105" y2="62" stroke="#141d38" stroke-width="3"/><line x1="74" y1="58" x2="84" y2="58" stroke="#4fd1ff" stroke-width="2" opacity=".7"/><line x1="111" y1="58" x2="121" y2="58" stroke="#4fd1ff" stroke-width="2" opacity=".7"/></g>',
    starg: '<g><circle cx="83" cy="62" r="11" fill="rgba(255,209,102,.15)" stroke="#ffd166" stroke-width="3"/><circle cx="117" cy="62" r="11" fill="rgba(255,209,102,.15)" stroke="#ffd166" stroke-width="3"/><line x1="94" y1="62" x2="106" y2="62" stroke="#ffd166" stroke-width="3"/><text x="83" y="67" text-anchor="middle" font-size="12">⭐</text><text x="117" y="67" text-anchor="middle" font-size="12">⭐</text></g>',
    scarf: '<g><rect x="60" y="95" width="80" height="13" rx="6.5" fill="#ff5d73"/><rect x="120" y="104" width="15" height="28" rx="6" fill="#ff5d73"/><line x1="66" y1="101" x2="134" y2="101" stroke="#ffd9de" stroke-width="2" opacity=".6"/></g>',
    cape: '<g><polygon points="56,100 144,100 172,180 28,180" fill="#4a2f8f"/><polygon points="56,100 100,100 100,180 28,180" fill="#5b3fa8"/><circle cx="100" cy="106" r="4" fill="#ffd166"/></g>',
    /* v35 新增装扮 */
    party: '<g><polygon points="100,2 76,34 124,34" fill="#ff6bd6" stroke="#e055c0" stroke-width="1.5"/><circle cx="100" cy="9" r="5" fill="#ffd166"/><path d="M84 29 q16 8 32 0" stroke="#ffd166" stroke-width="2" fill="none"/></g>',
    bunny: '<g><g transform="rotate(-14 80 28)"><ellipse cx="80" cy="28" rx="8" ry="24" fill="#eaf2ff" stroke="#9fb0d0" stroke-width="1.5"/><ellipse cx="80" cy="30" rx="4" ry="15" fill="#ffb8e6"/></g><g transform="rotate(14 120 28)"><ellipse cx="120" cy="28" rx="8" ry="24" fill="#eaf2ff" stroke="#9fb0d0" stroke-width="1.5"/><ellipse cx="120" cy="30" rx="4" ry="15" fill="#ffb8e6"/></g></g>',
    helmet: '<g><ellipse cx="100" cy="62" rx="48" ry="47" fill="rgba(140,210,255,.16)" stroke="#4fd1ff" stroke-width="2.5"/><rect x="66" y="46" width="68" height="34" rx="16" fill="rgba(11,18,38,.32)"/><line x1="74" y1="63" x2="126" y2="63" stroke="rgba(255,255,255,.35)" stroke-width="2"/></g>',
    phones: '<g><path d="M60 60 a40 38 0 0 1 80 0" fill="none" stroke="#2b3f6e" stroke-width="7" stroke-linecap="round"/><rect x="50" y="54" width="17" height="28" rx="8" fill="#2b3f6e" stroke="#4fd1ff" stroke-width="1.5"/><rect x="133" y="54" width="17" height="28" rx="8" fill="#2b3f6e" stroke="#4fd1ff" stroke-width="1.5"/><path d="M142 82 q12 6 6 16" fill="none" stroke="#2b3f6e" stroke-width="3" stroke-linecap="round"/><circle cx="148" cy="100" r="4.5" fill="#4fd1ff"/></g>',
    nose: '<g><circle cx="100" cy="71" r="8.5" fill="#ff5d73" stroke="#e0455c" stroke-width="1.5"/><circle cx="97" cy="68" r="2.5" fill="rgba(255,255,255,.65)"/></g>',
    blush: '<g><circle cx="72" cy="78" r="8" fill="rgba(255,107,214,.4)"/><circle cx="128" cy="78" r="8" fill="rgba(255,107,214,.4)"/></g>',
    tie: '<g><polygon points="100,95 91,103 91,112 100,119 109,112 109,103" fill="#e0455c" stroke="#b03048" stroke-width="1.5"/><polygon points="100,119 93,127 93,142 100,150 107,142 107,127" fill="#e0455c" stroke="#b03048" stroke-width="1.5"/></g>',
    bell: '<g><rect x="62" y="95" width="76" height="9" rx="4.5" fill="#ffd166" stroke="#e0a63c" stroke-width="1.5"/><circle cx="100" cy="113" r="9" fill="#ffd166" stroke="#e0a63c" stroke-width="1.5"/><rect x="91" y="112" width="18" height="3" fill="#e0a63c"/><circle cx="100" cy="118" r="2.2" fill="#8a6100"/></g>',
    /* v36 新伙伴配套装扮 */
    fish: '<g><path d="M90 136 Q100 127 110 136 Q100 145 90 136" fill="#4fd1ff" stroke="#2b9fd8" stroke-width="1.5"/><polygon points="110,136 119,129 119,143" fill="#4fd1ff" stroke="#2b9fd8" stroke-width="1.5"/><circle cx="95" cy="134.5" r="1.6" fill="#0b1226"/></g>',
    leaf: '<g><path d="M70 36 Q100 14 130 36" stroke="#58e08a" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="82" cy="28" rx="7" ry="3.5" fill="#58e08a" transform="rotate(-38 82 28)"/><ellipse cx="100" cy="20" rx="7" ry="3.5" fill="#6be89a"/><ellipse cx="118" cy="28" rx="7" ry="3.5" fill="#58e08a" transform="rotate(38 118 28)"/></g>',
    ray: '<g><rect x="68" y="54" width="27" height="17" rx="8" fill="url(#rb)" opacity=".92"/><rect x="105" y="54" width="27" height="17" rx="8" fill="url(#rb)" opacity=".92"/><line x1="95" y1="62" x2="105" y2="62" stroke="#2b3f6e" stroke-width="3"/><path d="M73 61 L85 53" stroke="rgba(255,255,255,.65)" stroke-width="2"/><path d="M110 61 L122 53" stroke="rgba(255,255,255,.65)" stroke-width="2"/></g>',
    /* v39 新一批装扮 */
    santa: '<g><path d="M64,28 Q68,2 100,4 Q134,6 136,24 Z" fill="#e0455c" stroke="#b03048" stroke-width="1.5" stroke-linejoin="round"/><circle cx="138" cy="25" r="7.5" fill="#fff" stroke="#d8dee8" stroke-width="1.5"/><rect x="56" y="26" width="66" height="13" rx="6.5" fill="#fff" stroke="#d8dee8" stroke-width="1.5"/></g>',
    flower: '<g><path d="M62,36 Q100,14 138,36" stroke="#6BBF8A" stroke-width="4" fill="none" stroke-linecap="round"/><g fill="#FF8FAB"><circle cx="70" cy="29" r="3.6"/><circle cx="63.5" cy="33.5" r="3.6"/><circle cx="70" cy="39" r="3.6"/><circle cx="76.5" cy="33.5" r="3.6"/></g><circle cx="70" cy="33.5" r="2.8" fill="#FFD166"/><g fill="#FF9DD6"><circle cx="100" cy="16" r="3.6"/><circle cx="93.5" cy="20.5" r="3.6"/><circle cx="100" cy="26" r="3.6"/><circle cx="106.5" cy="20.5" r="3.6"/></g><circle cx="100" cy="20.5" r="2.8" fill="#FFD166"/><g fill="#FF8FAB"><circle cx="130" cy="29" r="3.6"/><circle cx="123.5" cy="33.5" r="3.6"/><circle cx="130" cy="39" r="3.6"/><circle cx="136.5" cy="33.5" r="3.6"/></g><circle cx="130" cy="33.5" r="2.8" fill="#FFD166"/></g>',
    grad: '<g><polygon points="100,4 148,20 100,36 52,20" fill="#2b3f6e" stroke="#4fd1ff" stroke-width="1.5"/><polygon points="100,10 134,20 100,30 66,20" fill="#1d2c50"/><rect x="90" y="32" width="20" height="11" rx="2.5" fill="#2b3f6e"/><line x1="100" y1="20" x2="128" y2="38" stroke="#ffd166" stroke-width="2.2"/><circle cx="128" cy="40" r="4" fill="#ffd166"/></g>',
    halo: '<g><ellipse cx="100" cy="8" rx="27" ry="7.5" fill="none" stroke="#ffd166" stroke-width="4.5"/><ellipse cx="100" cy="8" rx="27" ry="7.5" fill="none" stroke="#fff3c4" stroke-width="1.6"/><path d="M138,16 l1.9,4.2 4.2,1.9 -4.2,1.9 -1.9,4.2 -1.9 -4.2 -4.2 -1.9 4.2 -1.9 Z" fill="#fff7e0" opacity=".9"/></g>',
    heart: '<g><path d="M83,52 C80,48.5 73.5,48.5 71.5,53 C69.5,57.5 74,63 83,69.5 C92,63 96.5,57.5 94.5,53 C92.5,48.5 86,48.5 83,52 Z" fill="#ff5d73" stroke="#e0455c" stroke-width="1.5"/><path d="M117,52 C114,48.5 107.5,48.5 105.5,53 C103.5,57.5 108,63 117,69.5 C126,63 130.5,57.5 128.5,53 C126.5,48.5 120,48.5 117,52 Z" fill="#ff5d73" stroke="#e0455c" stroke-width="1.5"/><line x1="94" y1="57" x2="106" y2="57" stroke="#e0455c" stroke-width="3"/></g>',
    sticker: '<g><path d="M66,72 L68.3,78 L74.5,78.9 L70,83.3 L71.2,89.5 L66,86.4 L60.8,89.5 L62,83.3 L57.5,78.9 L63.7,78 Z" fill="#FFD166" stroke="#E0A63C" stroke-width="1.3"/></g>',
    bowtie: '<g><polygon points="100,100 83,91 83,111" fill="#4fd1ff" stroke="#2b9fd8" stroke-width="1.5" stroke-linejoin="round"/><polygon points="100,100 117,91 117,111" fill="#4fd1ff" stroke="#2b9fd8" stroke-width="1.5" stroke-linejoin="round"/><circle cx="100" cy="101" r="4.5" fill="#2b9fd8"/></g>',
    boa: '<g><circle cx="62" cy="100" r="8" fill="#FF8FAB"/><circle cx="78" cy="106" r="8" fill="#FFD166"/><circle cx="100" cy="108" r="8" fill="#7EE8FF"/><circle cx="122" cy="106" r="8" fill="#A78BEB"/><circle cx="138" cy="100" r="8" fill="#9ADBC8"/><circle cx="88" cy="99" r="7" fill="#FFB3C8"/><circle cx="112" cy="99" r="7" fill="#C9E8A8"/></g>',
    medal: '<g><polygon points="87,94 100,114 100,100" fill="#e0455c"/><polygon points="113,94 100,114 100,100" fill="#c73a50"/><circle cx="100" cy="123" r="11.5" fill="#ffd166" stroke="#e0a63c" stroke-width="2"/><path d="M100,116.5 L102.1,121.6 L107.6,122.1 L103.5,125.7 L104.8,131.1 L100,128.2 L95.2,131.1 L96.5,125.7 L92.4,122.1 L97.9,121.6 Z" fill="#e0a63c"/></g>',
    /* v41 万圣节限定装扮 */
    pumpkin: '<g><path d="M100,20 L100,12" stroke="#5e8c4a" stroke-width="5" stroke-linecap="round"/><path d="M100,14 Q108,6 116,10" stroke="#5e8c4a" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="58" rx="46" ry="42" fill="#ff9a3c" stroke="#d97b22" stroke-width="2.5"/><ellipse cx="78" cy="58" rx="14" ry="38" fill="none" stroke="#d97b22" stroke-width="2" opacity=".7"/><ellipse cx="122" cy="58" rx="14" ry="38" fill="none" stroke="#d97b22" stroke-width="2" opacity=".7"/><polygon points="84,52 92,60 84,66" fill="#5e3a12"/><polygon points="116,52 108,60 116,66" fill="#5e3a12"/><path d="M86,74 Q92,82 100,82 Q108,82 114,74 Q108,88 100,88 Q92,88 86,74 Z" fill="#5e3a12"/></g>',
    witch: '<g><path d="M70,26 Q100,-14 128,22 L122,28 Q100,0 76,28 Z" fill="#7b4dbb" stroke="#5e3a99" stroke-width="1.5"/><ellipse cx="100" cy="27" rx="42" ry="9" fill="#7b4dbb" stroke="#5e3a99" stroke-width="1.5"/><rect x="88" y="20" width="24" height="7" rx="3.5" fill="#ffd166"/><circle cx="112" cy="18" r="3.5" fill="#ffd166"/></g>',
    bat: '<g><path d="M60,22 Q68,10 76,20 Q72,26 66,27 Q62,27 60,22 Z" fill="#4a3a6e" stroke="#2e2450" stroke-width="1.2"/><path d="M140,22 Q132,10 124,20 Q128,26 134,27 Q138,27 140,22 Z" fill="#4a3a6e" stroke="#2e2450" stroke-width="1.2"/><circle cx="68" cy="21" r="1.6" fill="#ffd166"/><circle cx="132" cy="21" r="1.6" fill="#ffd166"/></g>',
    horns: '<g><path d="M72,30 Q66,12 78,6 Q82,18 82,28 Z" fill="#e0455c" stroke="#b03048" stroke-width="1.5"/><path d="M128,30 Q134,12 122,6 Q118,18 118,28 Z" fill="#e0455c" stroke="#b03048" stroke-width="1.5"/></g>',
    ghost: '<g opacity=".92"><path d="M46,102 Q40,92 52,88 L148,88 Q160,92 154,102 Q162,112 150,120 Q158,130 146,136 Q152,146 138,148 Q142,158 128,156 Q100,164 72,156 Q58,158 62,148 Q48,146 54,136 Q42,130 50,120 Q38,112 46,102 Z" fill="#eef2ff" stroke="#b8c4e8" stroke-width="2.5"/><circle cx="82" cy="108" r="4.5" fill="#2e2450"/><circle cx="118" cy="108" r="4.5" fill="#2e2450"/><path d="M92,120 Q100,127 108,120" stroke="#2e2450" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>',
    basket: '<g><path d="M84,124 Q100,118 116,124 L112,142 Q100,148 88,142 Z" fill="#ff9a3c" stroke="#d97b22" stroke-width="2"/><path d="M86,126 Q100,112 114,126" fill="none" stroke="#d97b22" stroke-width="2.5"/><circle cx="93" cy="118" r="5" fill="#ff8fab"/><circle cx="103" cy="114" r="5" fill="#7ee8ff"/><circle cx="110" cy="119" r="5" fill="#ffd166"/></g>'
  };
  const back = worn.neck === 'cape' ? ACC.cape : (worn.neck === 'ghost' ? ACC.ghost : '');
  const front =
    ['hat', 'crown', 'bow', 'party', 'bunny', 'helmet', 'phones', 'leaf', 'santa', 'flower', 'grad', 'halo', 'pumpkin', 'witch', 'bat', 'horns'].filter(k => worn.head === k).map(k => ACC[k]).join('') +
    ['shades', 'starg', 'nose', 'blush', 'ray', 'heart', 'sticker'].filter(k => worn.face === k).map(k => ACC[k]).join('') +
    (worn.neck === 'scarf' ? ACC.scarf : '') + (worn.neck === 'tie' ? ACC.tie : '') + (worn.neck === 'bell' ? ACC.bell : '') + (worn.neck === 'fish' ? ACC.fish : '') +
    (worn.neck === 'bowtie' ? ACC.bowtie : '') + (worn.neck === 'boa' ? ACC.boa : '') + (worn.neck === 'medal' ? ACC.medal : '') + (worn.neck === 'basket' ? ACC.basket : '');
  return `
  <svg viewBox="0 0 200 190" class="robot  mood-${mood}">
    <defs>
      <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#b8c9e8"/><stop offset="1" stop-color="#6b7fa8"/>
      </linearGradient>
      <linearGradient id="visor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a2647"/><stop offset="1" stop-color="#0b1226"/>
      </linearGradient>
      <linearGradient id="core" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#ff9a3c"/>
      </linearGradient>
      <radialGradient id="glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#4fd1ff" stop-opacity=".4"/>
        <stop offset="1" stop-color="#4fd1ff" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="cream" cx=".35" cy=".28" r="1"><stop offset="0" stop-color="#F4FBF8"/><stop offset="1" stop-color="#CBE8DD"/></radialGradient>
      <linearGradient id="visorc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3D5A8F"/><stop offset="1" stop-color="#2C3E66"/></linearGradient>
      <radialGradient id="glowm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9ADBC8" stop-opacity=".45"/><stop offset="1" stop-color="#9ADBC8" stop-opacity="0"/></radialGradient>
      <radialGradient id="creamc" cx=".35" cy=".28" r="1"><stop offset="0" stop-color="#FFF8EC"/><stop offset="1" stop-color="#FFE3C4"/></radialGradient>
      <radialGradient id="gloww" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD9A8" stop-opacity=".4"/><stop offset="1" stop-color="#FFD9A8" stop-opacity="0"/></radialGradient>
      <radialGradient id="creamd" cx=".35" cy=".28" r="1"><stop offset="0" stop-color="#F0FBF2"/><stop offset="1" stop-color="#DFF5D0"/></radialGradient>
      <radialGradient id="glowd" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#A9D98A" stop-opacity=".4"/><stop offset="1" stop-color="#A9D98A" stop-opacity="0"/></radialGradient>
      <radialGradient id="creama" cx=".35" cy=".28" r="1"><stop offset="0" stop-color="#F5EEFF"/><stop offset="1" stop-color="#E3D4FA"/></radialGradient>
      <radialGradient id="glowa" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#C9B2E8" stop-opacity=".4"/><stop offset="1" stop-color="#C9B2E8" stop-opacity="0"/></radialGradient>
      <linearGradient id="rb" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ff8fab"/><stop offset=".5" stop-color="#ffd166"/><stop offset="1" stop-color="#4fd1ff"/>
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="178" rx="52" ry="8" fill="rgba(79,209,255,.14)"/>
    ${back}
    <g class="r-react">
      ${body}
      ${head}
      ${face}
      ${front}
    </g>
  </svg>`;
}

/* ---------------- 首页：空间站 ---------------- */

/* v37：宠物表情反应——重绘首页宠物卡并在一段时间后回到 idle。
 * 事件映射（行为状态机）：喂食→happy、进化→sparkle、盖章/全对→cheer、
 * 答错/战败→expect（鼓励）、断签→sad、换装/开盒→love。
 * petMood 记下当前表情，renderHome() 重绘时沿用，避免表情被覆盖回 idle。 */
let petMood = 'idle';
function petSay(mood, ms = 2600) {
  const wrap = $('#pet-wrap');
  if (!wrap) return;
  petMood = mood;
  wrap.innerHTML = robotSVG(Store.petStage(), Store.petKind().id, mood);
  clearTimeout(wrap._petTimer);
  wrap._petTimer = setTimeout(() => {
    if (petMood !== mood) return;   /* 已被其他表情接管就不回退 */
    petMood = 'idle';
    wrap.innerHTML = robotSVG(Store.petStage(), Store.petKind().id, 'idle');
  }, ms);
}
function renderHome() {
  updateTop();
  const s = Store.state;
  const now = new Date();
  const hour = now.getHours();
  const hello = hour < 6 ? '夜深啦' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  $('#greet-title').textContent = `${hello}，小宇航员！`;
  $('#greet-date').textContent = `${now.getMonth() + 1}月${now.getDate()}日 星期${week}`;

  /* 宠物 */
  const stage = Store.petStage();
  const kind = Store.petKind();
  const petWrap = $('#pet-wrap');
  petWrap.innerHTML = robotSVG(stage, kind.id, petMood);
  $('#pet-name').textContent = `🐾 ${s.pet.name}`;
  const stageInfo = Store.petStageInfo();
  $('#pet-stage').textContent = `${kind.emoji} ${kind.name} · ${stageInfo.name}：${stageInfo.desc}`;
  const nextStage = PET_STAGES[stage + 1];
  const prog = $('#pet-progress');
  if (nextStage) {
    const from = PET_STAGES[stage].need, span = nextStage.need - from;
    const pct = Math.min(100, Math.round(((s.pet.fed - from) / span) * 100));
    prog.innerHTML = `<div class="bar slim"><i style="width:${pct}%"></i></div><div class="tiny">再喂 ${nextStage.need - s.pet.fed} 次进化成「${kind.stages[stage + 1].name}」</div>`;
  } else {
    prog.innerHTML = `<div class="tiny">已是最终形态，闪闪发光 ✨</div>`;
  }
  const feedBtn = $('#btn-feed');
  feedBtn.disabled = s.coins < Store.FEED_COST || !!nextStage === false;
  feedBtn.textContent = nextStage ? `🍞 喂能量块 (${Store.FEED_COST}🪙)` : '⭐ 已满级';

  /* 台词 */
  let line;
  if (s.today.questDone) line = rnd(PET_LINES.praise);
  else if (s.coins >= Store.FEED_COST && Math.random() < 0.5) line = rnd(PET_LINES.hungry);
  else line = rnd(PET_LINES.idle);
  /* v36：还没招募过第二个伙伴时，时不时用台词提醒入口 */
  if ((s.pet.kinds || []).length < 2 && Math.random() < 0.4)
    line = '听说「换伙伴」里住着新的小伙伴，点下面去看看？';
  $('#pet-bubble').textContent = line;

  /* 连击 + 护盾（护盾可用金币兑换，给金币一个大额出口） */
  $('#streak-num').textContent = s.streak.count;
  const shieldFull = s.streak.shields >= SHIELD_MAX;
  $('#streak-shields').innerHTML =
    '🛡️'.repeat(s.streak.shields) + (s.streak.shields === 0 ? '<span class="tiny">护盾已用完，周一补充</span>' : `<span class="tiny">护盾 ×${s.streak.shields}</span>`) +
    `<button id="btn-buy-shield" class="btn small${shieldFull || s.coins < SHIELD_COST ? '' : ' btn-gold'}" style="margin-top:6px" ${shieldFull ? 'disabled' : ''}>🛡️ 兑换护盾 ${SHIELD_COST}🪙</button>`;
  const buyShieldBtn = $('#btn-buy-shield');
  if (buyShieldBtn) buyShieldBtn.onclick = () => {
    Sound.tap();
    const res = Store.buyShield();
    if (res.ok) {
      Sound.gold();
      toast(`🛡️ 兑换成功！现在有 ${res.shields} 张护盾护航`);
      renderHome();
    } else toast(res.msg);
  };

  /* 今日任务（主科：英语 / 数学 / 语文） */
  const set = s.settings;
  const newDone = s.today.newDone, revDone = s.today.revDone;
  const enDone = !!s.today.enDone;
  const mathDone = !!s.today.mathDone;
  const cnDone = (s.today.cnRounds || 0) >= 1;

  const taskRows = $('#task-rows');
  taskRows.innerHTML = '';
  const mkRow = (icon, name, sub, done, go, color) => h('div', { class: 'task-row' + (done ? ' done' : '') },
    h('span', { class: 'tr-icon', style: color ? ('--sub:' + color) : '' }, icon),
    h('div', { class: 'tr-info' },
      h('div', { class: 'tr-name' }, name),
      h('div', { class: 'tr-sub' }, sub)
    ),
    h('button', { class: 'btn small' + (done ? ' btn-on' : ''), onclick: () => { Sound.tap(); go(); } }, done ? '再来' : '去完成')
  );
  taskRows.appendChild(mkRow('🚀', '英语',
    enDone ? '今日任务完成' : `新词 ${Math.min(newDone, set.dailyNew)}/${set.dailyNew} · 复习 ${Math.min(revDone, set.dailyReview)}/${set.dailyReview}`,
    enDone, () => Quest.start(enDone), 'var(--accent)'));
  taskRows.appendChild(mkRow('🪐', '数学',
    mathDone ? '今日已冲刺' : '60 秒口算冲刺',
    mathDone, () => MathSprint.start(), 'var(--accent)'));
  taskRows.appendChild(mkRow('📖', '语文',
    cnDone ? '今日已练一轮' : '诗词 / 阅读 / 词语任选一轮',
    cnDone, () => openCnHub(), 'var(--gold-strong)'));

  /* 大按钮：按 英语 → 数学 → 语文 顺序指向下一个任务 */
  const btn = $('#btn-quest');
  const startedEn = newDone + revDone > 0;
  if (!enDone) {
    btn.textContent = startedEn ? '🚀 继续冒险' : '🚀 开始冒险';
    btn.onclick = () => { Sound.tap(); Quest.start(false); };
  } else if (!mathDone) {
    btn.textContent = '🪐 去口算冲刺';
    btn.onclick = () => { Sound.tap(); MathSprint.start(); };
  } else if (!cnDone) {
    btn.textContent = '📖 语文练一轮';
    btn.onclick = () => { Sound.tap(); Chinese.words(); };
  } else {
    btn.textContent = '🎉 主科全达 · 全科自由练';
    btn.onclick = () => { Sound.tap(); BossAll.start(true); };
  }
  $('#task-foot').textContent = (enDone && mathDone && cnDone)
    ? '三科全达奖励已到账，去学科星系继续探索吧！'
    : '完成任意一科即盖章 · 三科全达额外 +10 🪙';

  /* 三科全达奖励（每天一次） */
  if (enDone && mathDone && cnDone && !s.today.tripleDone) {
    s.today.tripleDone = true;
    Store.addCoins(10);
    Store.save();
    Sound.coin();
    toast('🎉 三科全达！额外 +10 🪙');
  }

  /* 学科星系宫格 */
  renderSubjects();

  /* 今日英语小短文（拔高加餐） */
  const enSlot = $('#enread-slot');
  if (enSlot && typeof ENGLISH_READINGS !== 'undefined') {
    const reads = (s.enRead && s.enRead.reads) || [];
    const nextP = ENGLISH_READINGS.find(r => !reads.includes(r.id))
      || ENGLISH_READINGS[reads.length % ENGLISH_READINGS.length];
    const enDoneToday = !!s.today.enReadDone;
    enSlot.innerHTML = '';
    enSlot.appendChild(h('div', { class: 'card math-card subj', style: '--sub:var(--accent)' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '📚'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, enDoneToday ? '今日短文已读完 ✅' : '今日英语小短文'),
          h('div', { class: 'tiny' }, `《${nextP.title}》 · ${nextP.level} · 2 判断 + 2 填空`)
        ),
        h('button', { class: 'btn btn-main small', onclick: () => { Sound.tap(); EnRead.start(); } }, enDoneToday ? '再读一篇' : '去读')
      )
    ));
  }

  /* 英语句子默写（看中文，逐词拼英文句子） */
  const swSlot = $('#sentence-slot');
  if (swSlot && typeof SENTENCE_BANK !== 'undefined') {
    const swDone = ((s.sentence && s.sentence.done) || []).length;
    const swNew = Object.keys((s.sentence && s.sentence.newWords) || {}).length;
    swSlot.innerHTML = '';
    swSlot.appendChild(h('div', { class: 'card math-card subj', style: '--sub:var(--accent)' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '⌨️'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, '英语句子默写'),
          h('div', { class: 'tiny' }, `看中文拼英文 · 已默写 ${swDone}/${SENTENCE_BANK.length} 句 · 拼错不能跳过${swNew ? ` · 生词 ${swNew}` : ''}`)
        ),
        h('button', { class: 'btn btn-main small', onclick: () => { Sound.tap(); SentWrite.start(); } }, '去默写')
      )
    ));
  }

  /* KET 补全对话（v40：A2 题型启蒙，四选一把话接上） */
  const ketSlot = $('#ket-slot');
  if (ketSlot && typeof KET_DIALOGUES !== 'undefined') {
    const ketDone = ((s.ket && s.ket.done) || []).length;
    ketSlot.innerHTML = '';
    ketSlot.appendChild(h('div', { class: 'card math-card subj', style: '--sub:var(--accent)' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '💬'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, 'KET 补全对话'),
          h('div', { class: 'tiny' }, `剑桥 A2 题型启蒙 · 已练 ${ketDone}/${KET_DIALOGUES.length} 段 · 每段 +4 🪙`)
        ),
        h('button', { class: 'btn btn-main small', onclick: () => { Sound.tap(); KETUI.start(); } }, '去练')
      )
    ));
  }

  /* 每日一星：初中知识浸润卡（纯阅读不考试，看完 +1 🪙，重在潜移默化） */
  const jrSlot = $('#junior-slot');
  if (jrSlot && typeof JUNIOR_CARDS !== 'undefined') {
    jrSlot.innerHTML = '';
    const card = Store.nextJuniorCard();
    if (card) {
      const isSeen = !!(s.junior.seen && s.junior.seen[card.id]);
      const seenN = Object.keys(s.junior.seen || {}).length;
      if (isSeen) {
        jrSlot.appendChild(h('div', { class: 'card junior-card subj', style: '--sub:var(--gold-strong)' },
          h('div', { class: 'math-head' },
            h('span', { class: 'math-emoji' }, '🌟'),
            h('div', { class: 'math-info' },
              h('div', { style: 'font-weight:800' }, `今日一星已收下 ${card.emoji}`),
              h('div', { class: 'tiny' }, `${card.subject} · ${card.title}`)
            ),
            h('button', { class: 'btn small', onclick: () => { Sound.tap(); juniorQuiz(card, false); } }, '🔁'),
            h('button', { class: 'btn small', onclick: e => {
              /* 朗读整卡：播放中再点一次即停，不用干等全文念完 */
              Sound.tap();
              const btn = e.currentTarget;
              if (btn.dataset.speaking === '1') {
                Sound.stopSpeak();
                btn.dataset.speaking = '0';
                btn.textContent = '🔊';
                return;
              }
              btn.dataset.speaking = '1';
              btn.textContent = '⏹️';
              Sound.speak(card.title + '。' + card.body + card.example + card.fun, 0.95, () => {
                btn.dataset.speaking = '0';
                btn.textContent = '🔊';
              });
            } }, '🔊')
          )
        ));
      } else {
        jrSlot.appendChild(h('div', { class: 'card junior-card subj', style: '--sub:var(--gold-strong)' },
          h('div', { style: 'text-align:left' },
            h('span', { class: 'junior-badge' }, `${card.emoji} ${card.subject} · 初中星知识`),
            h('div', { class: 'junior-title' }, card.title),
            h('div', { class: 'junior-body' }, card.body),
            h('div', { class: 'junior-row' }, h('b', { class: 'jr-k' }, '🧭'), h('span', {}, card.example)),
            h('div', { class: 'junior-row' }, h('b', { class: 'jr-k' }, '🎩'), h('span', {}, card.fun))
          ),
          h('button', {
            class: 'btn btn-main big', style: 'margin-top:12px',
            onclick: () => { Sound.tap(); juniorQuiz(card, true); }
          }, '看懂了，考考我 →'),
          h('div', { class: 'tiny center', style: 'margin-top:6px' }, `答 2 道小题加深理解 · 全对 +2 🪙 · 已收 ${seenN}/${JUNIOR_CARDS.length} 张`)
        ));
      }
    }
  }

  /* 成长足迹卡 */
  const growSlot = $('#growth-slot');
  if (growSlot) renderGrowthCard(growSlot);

  /* 待兑现提醒横幅：插在学科星系上方，孩子回首页一眼就能看到 */
  const oldBanner = $('#pending-redeem-banner');
  if (oldBanner) oldBanner.remove();
  if (s.shop.pending.length) {
    const subjSlot = $('#subjects-slot');
    const banner = h('button', { class: 'card pending-banner', id: 'pending-redeem-banner', onclick: () => { Sound.tap(); openShop(); } },
      h('span', { class: 'pb-emoji' }, '🎁'),
      h('span', { class: 'pb-text' },
        h('b', {}, `有 ${s.shop.pending.length} 份礼物待领取！`),
        h('span', { class: 'tiny' }, `${s.shop.pending.map(p => `${p.emoji}${p.name}`).join('、')} · 快去找爸爸妈妈兑现吧`)
      )
    );
    subjSlot.parentNode.insertBefore(banner, subjSlot);
  }

  /* 兑换商店卡（家长定义了奖励才显示） */
  const shopSlot = $('#shop-slot');
  if (shopSlot) {
    const shop = Store.state.shop;
    shopSlot.innerHTML = '';
    if (shop.rewards.length) {
      shopSlot.appendChild(h('div', { class: 'card math-card subj', style: '--sub:var(--gold-strong)' },
        h('div', { class: 'math-head' },
          h('span', { class: 'math-emoji' }, '🎁'),
          h('div', { class: 'math-info' },
            h('div', { style: 'font-weight:800' }, '兑换商店'),
            h('div', { class: 'tiny' }, `${shop.rewards.length} 个奖励${shop.pending.length ? ` · ${shop.pending.length} 个待爸妈兑现` : ' · 攒金币来换'}`)
          ),
          h('button', { class: 'btn btn-main small', onclick: () => { Sound.tap(); openShop(); } }, '去逛逛')
        )
      ));
    }
  }

  /* 错词雷达 + 周日 BOSS 挑战 + 段位晋升 */
  const weakSlot = $('#weak-slot');
  weakSlot.innerHTML = '';
  $('#rank-line').textContent = `🎖 ${Store.rankInfo().name}`;
  if (Store.state.pendingPromotion) {
    const p = Store.state.pendingPromotion;
    Store.state.pendingPromotion = null;
    Store.save();
    Sound.gold();
    showModal({
      title: '🎖 段位晋升！',
      dismissable: true,
      build(el) {
        el.appendChild(h('div', { class: 'center' },
          h('div', { style: 'font-size:56px;margin:6px 0' }, '🎉'),
          h('div', { style: 'font-size:24px;font-weight:900;color:var(--gold)' }, p.name),
          h('div', { class: 'tiny', style: 'margin-top:8px' }, `晋升奖励 +${p.reward} 🪙 已发放，新的星域向你敞开！`)
        ));
      },
      actions: [{ label: '太棒了！', cls: 'btn-main' }]
    });
  }
  /* 新成就徽章庆祝（每次首页展示一枚） */
  const nextBadgeId = Store.popPendingBadge();
  if (nextBadgeId) {
    const a = ACHIEVEMENTS.find(x => x.id === nextBadgeId);
    if (a) {
      Store.save();
      Sound.gold();
      showModal({
        title: '🏅 解锁新徽章！',
        dismissable: true,
        build(el) {
          el.appendChild(h('div', { class: 'center' },
            h('div', { style: 'font-size:64px;margin:8px 0' }, a.emoji),
            h('div', { style: 'font-size:24px;font-weight:900;color:var(--gold)' }, a.name),
            h('div', { class: 'tiny', style: 'margin-top:6px' }, a.desc)
          ));
        },
        actions: [{ label: '收下！', cls: 'btn-main' }]
      });
    }
  }
  if (new Date().getDay() === 0) {
    const boss = Store.bossInfo();
    weakSlot.appendChild(h('button', {
      class: 'card weak-card boss-card' + (boss.done ? ' done' : ''),
      onclick: () => { Sound.tap(); BossAll.start(); }
    },
      h('span', { class: 'weak-icon' }, '👑'),
      h('span', { class: 'weak-text' },
        h('b', {}, boss.done ? '本周 BOSS 已被击败！' : 'BOSS 周挑战！'),
        h('span', { class: 'tiny' }, boss.done ? `最佳成绩 ${boss.best}/${boss.total || 15} · 友谊赛再战（+3 🪙）` : `15 题全科综合大考 · 失误 ≤1 击败 +${COIN_BOSS} 🪙 / ≤3 击伤 +10（仅周日）`)
      ),
      h('span', { class: 'weak-go boss-go' }, boss.done ? '再战' : '开战')
    ));
  }
  const weak = Store.weakList(99);
  if (weak.length) {
    weakSlot.appendChild(h('button', {
      class: 'card weak-card', onclick: () => { Sound.tap(); Quest.startDrill(); }
    },
      h('span', { class: 'weak-icon' }, '⚡'),
      h('span', { class: 'weak-text' },
        h('b', {}, `错词来袭！${weak.length} 个老对手在等你`),
        h('span', { class: 'tiny' }, '点击开战，全部答对就能洗清连错')
      ),
      h('span', { class: 'weak-go' }, '开战')
    ));
  }
}

/* ---------- 学科星系宫格与学科入口 ---------- */
/* 四上诗词点亮数（四下预习的诗不计入"星河诗卷 36"，但同样能点亮复习） */
function cnStarCount() {
  const st = (Store.state.chinese && Store.state.chinese.stars) || {};
  return CN_POEMS.filter(p => st[p.id]).length;
}
function subjectTile(emoji, name, sub, go, color) {
  return h('button', { class: 'subject-tile', style: color ? ('--sub:' + color) : '', onclick: () => { Sound.tap(); go(); } },
    h('div', { class: 'st-emoji' }, emoji),
    h('div', { class: 'st-name' }, name),
    h('div', { class: 'st-sub' }, sub)
  );
}

function renderSubjects() {
  const slot = $('#subjects-slot');
  if (!slot) return;
  const s = Store.state;
  const m = s.math;
  const tiles = [
    subjectTile('🪐', '数学星系', `${s.today.mathDone ? '✅ ' : ''}口算 · 练习场 · ${m.best || 0} 题/轮`, openMathHub, 'var(--accent)'),
    subjectTile('📖', '语文星系', `${(s.today.cnRounds || 0) ? '✅ ' : ''}诗词 ⭐${cnStarCount()}/${CN_POEMS.length} · 阅读 · 词语`, openCnHub, 'var(--gold-strong)'),
    subjectTile('🔤', '拼读星系', `${(Store.state.phonics && Store.state.phonics.rounds) ? '✅ ' : ''}词族 · 自然拼读`, () => Phonics.start(), 'var(--purple)')
  ];
  /* 次科模块加载后自动出现在宫格里 */
  if (typeof SubjectUI !== 'undefined') SubjectUI.tiles().forEach(t => tiles.push(t));
  /* 竞技场（v38 竞赛玩法专项）：不占打卡、纯加餐 */
  tiles.push(subjectTile('🏆', '竞技场',
    `擂台 ${s.arena.spell.best} 连胜 · 袋鼠 ${s.arena.roo.best} 分`,
    () => Arena.open(), 'var(--orange, #ff9f43)'));
  slot.innerHTML = '';
  slot.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '🌌 学科星系'),
    h('div', { class: 'subject-grid' }, tiles)
  ));
}

function openMathHub() {
  const m = Store.state.math;
  const planets = '🪐'.repeat(Math.min(10, m.planets || 0));
  showModal({
    title: '🪐 数学星系',
    build(el, close) {
      el.appendChild(h('div', { class: 'tiny center', style: 'margin-bottom:12px' },
        `${planets || '尚未点亮行星'} · 最佳 ${m.best || 0} 题/轮 · 答对 ≥10 题的冲刺累计点亮行星`));
      el.appendChild(h('button', {
        class: 'btn btn-main big', style: 'margin-top:0',
        onclick: () => { close(); MathSprint.start(); }
      }, '🪐 限时口算冲刺'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); MathThink.start(); }
      }, '🧠 思维挑战场（拔高）'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); MathDrill.start(); }
      }, '📐 练习场（笔算 · 应用 · 换算 · 图形）'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); MathDrill.start('app'); }
      }, '🧮 应用题专项（两步计算 · 生活情境 · 6 题）'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); Sudoku.start(); }
      }, '🔢 数独挑战（四宫 +20 / 六宫 +30 / 九宫 40~100 🪙）'));
      el.appendChild(h('div', { class: 'tiny center', style: 'margin-top:10px' },
        `思维场答对每题 +5 🪙 · 数独唯一解程序生成 · 首刷全额，当天重刷递减${Store.state.settings.dailyCoinCap ? ` · 每日上限 ${Store.state.settings.dailyCoinCap} 🪙` : ''}`));
    }
  });
}

function openCnHub() {
  const c = Store.state.chinese;
  const guwenN = (c.guwen || []).length;
  const prepGot = (typeof CN_POEMS_NEXT !== 'undefined') ? CN_POEMS_NEXT.filter(p => c.stars[p.id]).length : 0;
  const prepTotal = (typeof CN_POEMS_NEXT !== 'undefined') ? CN_POEMS_NEXT.length : 0;
  showModal({
    title: '📖 语文星系',
    build(el, close) {
      el.appendChild(h('div', { class: 'tiny center', style: 'margin-bottom:12px' },
        `诗词 ⭐${cnStarCount()}/${CN_POEMS.length}${prepTotal ? ` · 四下预习 ⭐${prepGot}/${prepTotal}` : ''} · 阅读 ${c.reads.length}/${CN_READINGS.length} 篇 · 小古文 ${guwenN}/${CN_GUWEN.length} 篇${c.wrong.length ? ` · 错题 ${c.wrong.length}` : ''}`));
      el.appendChild(h('button', {
        class: 'btn btn-main big', style: 'margin-top:0',
        onclick: () => { close(); Chinese.poemList(); }
      }, '📜 诗词星图'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); Chinese.readList(); }
      }, '📖 阅读训练营'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); Chinese.guwenList(); }
      }, '🧧 小古文启蒙（拔高）'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); Chinese.words(); }
      }, '🈶 词语实战'));
    }
  });
}

function bindHome() {
  $('#btn-feed').addEventListener('click', () => {
    const r = Store.feedPet();
    if (!r) { toast('金币不够啦，先去做任务吧'); return; }
    const c = centerOf($('#pet-wrap'));
    if (r.evolved) {
      Sound.evolve();
      burst(c.x, c.y, { count: 26, emojis: ['✨', '⭐', '🌟', '💥'], power: 130 });
      toast(`${Store.state.pet.name} 进化成「${Store.petKind().stages[r.stage].name}」啦！`);
      petSay('sparkle', 4000);   /* v37：进化演出 */
    } else {
      Sound.coin();
      burst(c.x, c.y, { count: 10, emojis: ['💛', '✨'], power: 70 });
      $('#pet-bubble').textContent = rnd(PET_LINES.feed);
      petSay('happy');           /* v37：喂食开心 */
    }
    renderHome();
  });
  const wBtn = $('#btn-wardrobe'), bBtn = $('#btn-box'), pBtn = $('#btn-pet-swap');
  if (wBtn) wBtn.addEventListener('click', () => { Sound.tap(); Extras.openWardrobe(); });
  if (bBtn) bBtn.addEventListener('click', () => { Sound.tap(); Extras.openBox(); });
  if (pBtn) pBtn.addEventListener('click', () => { Sound.tap(); Extras.openWardrobe(); });
  /* 点宠物本体也能打开伙伴衣柜（入口更直观） */
  const petWrap = $('#pet-wrap');
  if (petWrap) {
    petWrap.style.cursor = 'pointer';
    petWrap.title = '点我打开伙伴衣柜';
    petWrap.addEventListener('click', () => { Sound.tap(); Extras.openWardrobe(); });
  }
}

/* ---------------- 星际图鉴 ---------------- */
function renderAlbum() {
  updateTop();
  const root = $('#album-root');
  root.innerHTML = '';
  const packs = Store.activePacks();
  let total = 0, got = 0;
  packs.forEach(p => {
    p.words.forEach(w => {
      total++;
      if (Store.state.album[w.word.toLowerCase()]) got++;
    });
  });

  const head = h('div', { class: 'album-head' },
    h('div', { class: 'album-title' }, '🌌 星际图鉴'),
    h('div', { class: 'album-sub' }, `已收集 ${got} / ${total} 张星际贴纸`)
  );
  root.appendChild(head);

  /* 成就徽章墙入口 */
  const earnedBadges = Object.keys(Store.state.badges).length;
  root.appendChild(h('button', {
    class: 'card weak-card boss-card',
    onclick: () => { Sound.tap(); showBadgeWall(); }
  },
    h('span', { class: 'weak-icon' }, '🎖'),
    h('span', { class: 'weak-text' },
      h('b', {}, `成就徽章 ${earnedBadges} / ${ACHIEVEMENTS.length}`),
      h('span', { class: 'tiny' }, '坚持打卡、收集贴纸、击败 BOSS 都能解锁')
    ),
    h('span', { class: 'weak-go boss-go' }, '查看')
  ));

  packs.forEach(p => {
    const pgot = p.words.filter(w => Store.state.album[w.word.toLowerCase()]).length;
    const sec = h('div', { class: 'card galaxy-card' },
      h('div', { class: 'galaxy-head' },
        h('span', { class: 'galaxy-emoji' }, p.emoji),
        h('span', { class: 'galaxy-name' }, p.name),
        h('span', { class: 'galaxy-count' }, `${pgot}/${p.words.length}`)
      ),
      h('div', { class: 'album-grid' },
        p.words.map(w => {
          const id = w.word.toLowerCase();
          const rec = Store.state.album[id];
          const weakMark = Store.isWeak(id) ? ' weak' : '';
          const tile = h('button', {
            class: 'album-tile ' + (rec ? (rec.gold ? 'unlocked gold' : 'unlocked') : 'locked') + weakMark,
            onclick: () => { Sound.tap(); showWordModal(id, !!rec); }
          },
          h('span', { class: 'tile-emoji' }, w.emoji),
          rec ? h('span', { class: 'tile-word' }, w.word) : h('span', { class: 'tile-q' }, '?')
          );
          return tile;
        })
      )
    );
    root.appendChild(sec);
  });
}

function showWordModal(id, unlocked) {
  const w = Store.findWord(id);
  if (!w) return;
  if (!unlocked) {
    showModal({
      title: '🔒 还没解锁',
      build(el) { el.appendChild(h('div', { class: 'center' }, `继续冒险，拼出「${w.zh}」就能点亮这张贴纸！`)); },
      actions: [{ label: '知道啦', cls: 'btn-main' }]
    });
    return;
  }
  const rec = Store.state.album[id];
  showModal({
    title: rec.gold ? '🌟 超新星贴纸 🌟' : '星际贴纸',
    build(el) {
      el.appendChild(h('div', { class: 'center modal-emoji ' + (rec.gold ? 'gold-glow' : '') }, w.emoji));
      el.appendChild(h('div', { class: 'modal-word' }, w.word));
      el.appendChild(ipaEl(w));
      el.appendChild(h('div', { class: 'modal-zh' }, w.zh));
      el.appendChild(h('div', { class: 'modal-ex' },
        h('button', { class: 'speak-btn', onclick: () => Sound.speakSentence(w.ex) }, icon('sound')), w.ex
      ));
      el.appendChild(h('div', { class: 'modal-exzh' }, w.exZh));
      el.appendChild(h('div', { class: 'tiny center' }, gradeLabel(w) + `${rec.gold ? ' · 稀有贴纸' : ''} · 收集于 ${rec.at}`));
    },
    actions: [{ label: '再听一遍 🔊', cls: '', onClick: (close) => Sound.speakWord(w.word) }, { label: '好', cls: 'btn-main' }]
  });
  Sound.speakWord(w.word);
}

/* 每日一星 · 知识星小测验：读完卡片答 2 道选择题加深理解（答案都在卡片里）。
 * claim=true 时答完收下当天的知识星（全对多奖 1 🪙）；false 为温习模式不奖励。 */
function juniorQuiz(card, claim = true) {
  const quiz = (typeof JUNIOR_QUIZ !== 'undefined' && JUNIOR_QUIZ[card.id]) || [];
  if (!quiz.length) { /* 兜底：没有配题的卡保持旧行为，直接领 */
    if (claim) {
      const res = Store.markJuniorSeen(card.id);
      if (res.ok) { Sound.coin(); toast('🌟 知识星已收进口袋 +1 🪙'); }
      renderHome();
    }
    return;
  }
  let qi = 0, okN = 0;
  const finish = close => {
    close();
    if (!claim) { Sound.correct(); toast('温习完成，理解更牢啦！'); renderHome(); return; }
    const res = Store.markJuniorSeen(card.id);
    if (res.ok) {
      Sound.coin();
      const allOk = okN === quiz.length;
      if (allOk) Store.addCoins(1);
      toast(allOk ? `🌟 知识星收进口袋 +2 🪙 · 小测验全对！` : '🌟 知识星收进口袋 +1 🪙');
    } else {
      toast('今天已经领过知识星啦');
    }
    renderHome();
  };
  const askQ = (box, close) => {
    if (qi >= quiz.length) {
      box.innerHTML = '';
      box.appendChild(h('div', { class: 'center' },
        h('div', { style: 'font-size:44px' }, okN === quiz.length ? '💯' : '🌟'),
        h('div', { style: 'font-weight:900;font-size:18px;margin:8px 0' }, `小测验 ${okN}/${quiz.length}`),
        h('div', { class: 'tiny', style: 'margin-bottom:12px;line-height:1.8' },
          okN === quiz.length ? '全对！这个知识点真的装进脑袋啦' : '答错的再看一眼卡片，理解会更牢'),
        h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); finish(close); } }, claim ? '收下知识星 →' : '完成')
      ));
      return;
    }
    const q = quiz[qi];
    const opts = shuffle(q.opts.map((t, i) => ({ t, ok: i === 0 })));
    let answered = false;
    box.innerHTML = '';
    const tipEl = h('div', { class: 'tiny', style: 'margin-top:10px;min-height:18px;line-height:1.8;text-align:left' }, '');
    const nextBtn = h('button', {
      class: 'btn btn-main big', style: 'display:none;margin-top:12px',
      onclick: () => { Sound.tap(); qi++; askQ(box, close); }
    }, qi + 1 >= quiz.length ? '看结果 →' : '下一题 →');
    const optsEl = h('div', { class: 'cn-opts', style: 'margin-top:12px' });
    opts.forEach(m => optsEl.appendChild(h('button', {
      class: 'cn-opt', 'data-ok': m.ok ? '1' : '0',
      onclick: e => {
        if (answered) return;
        answered = true;
        if (m.ok) {
          okN++;
          Sound.correct();
          e.currentTarget.classList.add('right');
          const c = centerOf(e.currentTarget);
          burst(c.x, c.y, { count: 6, colors: ['#58e08a'], power: 40 });
        } else {
          Sound.wrong();
          e.currentTarget.classList.add('wrong');
          const right = Array.from(optsEl.children).find(x => x.dataset.ok === '1');
          if (right) right.classList.add('right');
        }
        Array.from(optsEl.children).forEach(b => { b.disabled = true; });
        tipEl.textContent = m.ok ? '✅ ' + q.tip : '❌ ' + q.tip;
        nextBtn.style.display = '';
      }
    }, m.t)));
    box.appendChild(h('div', { style: 'text-align:left' },
      h('div', { class: 'tiny' }, `${card.emoji} ${card.subject}小测验 · 第 ${qi + 1} / ${quiz.length} 题 · 答案就藏在刚才的卡片里`),
      h('div', { style: 'font-weight:800;font-size:16px;line-height:1.8;margin-top:8px' }, q.q),
      optsEl,
      tipEl,
      nextBtn
    ));
  };
  showModal({
    title: `🌟 知识星小测验 · ${card.title}`,
    dismissable: true,
    build: (el, close) => askQ(el, close)
  });
}

/* 徽章墙 */
function showBadgeWall() {
  showModal({
    title: `🎖 成就徽章 ${Object.keys(Store.state.badges).length}/${ACHIEVEMENTS.length}`,
    build(el) {
      el.appendChild(h('div', { class: 'badge-grid' },
        ACHIEVEMENTS.map(a => {
          const at = Store.state.badges[a.id];
          return h('div', { class: 'badge-tile' + (at ? '' : ' locked') },
            h('div', { class: 'be' }, a.emoji),
            h('div', { class: 'bn' }, a.name),
            h('div', { class: 'bd' }, a.desc),
            h('div', { class: 'bt' }, at || '🔒')
          );
        })
      ));
    },
    actions: [{ label: '继续加油！', cls: 'btn-main' }]
  });
}

/* ---------------- 航行日志（日历） ---------------- */
let calView = null, calSel = null;
function renderCalendar() {
  updateTop();
  const root = $('#calendar-root');
  root.innerHTML = '';
  const now = new Date();
  if (!calView) calView = { y: now.getFullYear(), m: now.getMonth() };
  const { y, m } = calView;
  const s = Store.state;

  root.appendChild(h('div', { class: 'cal-top card' },
    h('div', { class: 'cal-streak' }, '🔥 连续航行 ', h('b', {}, s.streak.count + ' 天')),
    h('div', { class: 'tiny' }, `🛡️ 护盾 ×${s.streak.shields} · 完成当日任务即盖章，漏一天自动用护盾保护`)
  ));

  const head = h('div', { class: 'cal-head' },
    h('button', { class: 'cal-nav', onclick: () => { Sound.tap(); calView.m--; if (calView.m < 0) { calView.m = 11; calView.y--; } renderCalendar(); } }, icon('left')),
    h('div', { class: 'cal-title' }, `${y}年${m + 1}月`),
    h('button', {
      class: 'cal-nav', onclick: () => {
        Sound.tap(); calView.m++;
        if (calView.m > 11) { calView.m = 0; calView.y++; }
        renderCalendar();
      }
    }, icon('right'))
  );
  root.appendChild(head);

  const grid = h('div', { class: 'cal-grid' });
  ['一', '二', '三', '四', '五', '六', '日'].forEach(d => grid.appendChild(h('div', { class: 'cal-wd' }, d)));
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // 周一开头
  for (let i = 0; i < offset; i++) grid.appendChild(h('div', { class: 'cal-cell empty' }));
  const days = new Date(y, m + 1, 0).getDate();
  const today = Store.todayStr();
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rec = s.history[ds] || {};
    const cell = h('div', {
      class: 'cal-cell' + (ds === today ? ' today' : '') + (calSel === ds ? ' sel' : ''),
      onclick: () => { Sound.tap(); calSel = calSel === ds ? null : ds; renderCalendar(); }
    },
      h('span', { class: 'cal-day' }, d),
      rec.done ? h('span', { class: 'cal-stamp' }, '🚀') :
        rec.shieldUsed ? h('span', { class: 'cal-stamp shield' }, '🛡️') : ''
    );
    grid.appendChild(cell);
  }
  root.appendChild(h('div', { class: 'card cal-card' }, grid));
  root.appendChild(calDetail(calSel, today));
}

/* 点日期后的当日学习情况卡：今天显示实时数据，过去的日子读 history 存档 */
function calDetail(ds, today) {
  if (!ds) {
    return h('div', { class: 'tiny center', style: 'margin:8px 0 4px' }, '💡 点上面的日期，看看那天学了什么');
  }
  const s = Store.state;
  const isToday = ds === today;
  const rec = isToday
    ? { done: s.today.questDone, shieldUsed: false, minutes: s.today.minutes, news: s.today.newDone, revs: s.today.revDone, coins: s.today.coinsEarned }
    : (s.history[ds] || {});
  const hasRec = !!(rec.done || rec.shieldUsed || rec.minutes || rec.news || rec.revs);
  const wd = '日一二三四五六'[new Date(ds + 'T00:00:00').getDay()];
  const rows = [];
  if (isToday) rows.push('⏳ 今天还在进行中，数据实时更新');
  if (!hasRec) rows.push('这天没有学习记录，可能是启程前的日子');
  else {
    rows.push(rec.done ? '✅ 完成当日任务，打卡盖章' : (rec.shieldUsed ? '🛡️ 漏学一天，护盾自动保护了连续记录' : '🚧 学了一会，但没完成打卡'));
    if (rec.minutes) rows.push(`⏱️ 学习了 ${rec.minutes} 分钟`);
    if (rec.news) rows.push(`🆕 新学单词 ${rec.news} 个`);
    if (rec.revs) rows.push(`🔁 复习单词 ${rec.revs} 个`);
    if (rec.coins) rows.push(`🪙 获得金币 ${rec.coins} 枚`);
  }
  return h('div', { class: 'card cal-detail' },
    h('div', { class: 'cal-detail-title' }, `📅 ${ds} 周${wd}`),
    rows.map(t => h('div', { class: 'cal-detail-row' }, t))
  );
}

/* ---------------- 家长面板 ---------------- */
function renderParent() {
  updateTop();
  const root = $('#parent-root');
  root.innerHTML = '';
  if (!parentUnlocked) { renderPinGate(root); return; }

  const s = Store.state;
  const packs = Store.allPacks();
  const active = Store.activePacks();
  const totalWords = active.reduce((n, p) => n + p.words.length, 0);
  const learnedIds = Object.keys(s.srs).filter(id => Store.findWord(id));
  const dueNow = Store.dueList().length;
  let ok = 0, bad = 0;
  learnedIds.forEach(id => { ok += s.srs[id].ok; bad += s.srs[id].bad; });
  const acc = ok + bad ? Math.round((ok / (ok + bad)) * 100) : 0;

  /* 概览 */
  const bars7 = [];
  for (let i = 6; i >= 0; i--) {
    const ds = Store.addDays(Store.todayStr(), -i);
    const rec = s.history[ds];
    const min = rec ? Math.max(3, Math.min(30, rec.minutes || (rec.done ? 10 : 0))) : 0;
    bars7.push(h('div', { class: 'stat-bar', title: `${ds} ${rec && rec.done ? '已完成' : '未完成'}` },
      h('i', { style: 'height:' + min * 3 + 'px', class: rec && rec.done ? '' : 'dim' }),
      h('span', {}, ds.slice(8))
    ));
  }
  const rk = Store.rankInfo();
  const boss = Store.bossInfo();
  const accHint = (acc >= 92 && learnedIds.length >= 30)
    ? h('div', { class: 'acc-hint' },
      `🌟 孩子正确率高达 ${acc}%，学有余力！建议：① 把下方「数学星系」的口算难度切到「挑战」；② 把「每天挑战词数」调到 2~3，混入五六年级词；③ 首页的「英语小短文」每天读一篇；④ 周日 BOSS 挑战。`)
    : '';
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '📊 学习概览'),
    accHint,
    h('div', { class: 'stat-grid' },
      statBox('已学单词', `${learnedIds.length} / ${totalWords}`),
      statBox('今日待复习', dueNow + ' 词'),
      statBox('总正确率', acc + '%'),
      statBox('连续打卡', s.streak.count + ' 天'),
      statBox('当前段位', rk.name),
      statBox('今日用时', s.today.minutes + ' 分钟'),
      statBox('金币余额', s.coins + ' 🪙'),
      statBox('本周BOSS', boss.done ? `${boss.best}/${boss.total || 15} ✓` : '周日开启')
    ),
    h('div', { class: 'stat-bars' }, bars7),
    h('div', { class: 'tiny' }, '近 7 天学习时长（柱高=分钟数，亮色=当天完成打卡）· 段位按已学词数晋升：' + RANKS.map(r => r.name).join('→')),
    h('button', {
      class: 'btn', style: 'margin-top:10px',
      onclick: () => { Sound.tap(); showWeeklyReport(); }
    }, '📋 本周学习周报（打卡 / 用时 / 薄弱项 / 建议）')
  ));

  /* 错题本 */
  const weakIds = Store.weakList(10);
  if (weakIds.length) {
    const wCard = h('div', { class: 'card' },
      h('div', { class: 'sec-title' }, '📕 错题本'),
      h('div', { class: 'tiny', style: 'margin-bottom:6px' }, '孩子反复出错的词。复习时会优先出现；首页的「错词来袭」可以专项挑战，连续答对会自动移出本子'));
    weakIds.forEach(id => {
      const w = Store.findWord(id);
      const rec = s.srs[id];
      wCard.appendChild(h('div', { class: 'pack-row' },
        h('span', { class: 'pack-info' }, `${w.emoji} ${w.word}`, h('span', { class: 'tiny' }, `　${w.zh}`)),
        h('span', { class: 'tiny' }, `错 ${rec.bad || 0} 次 · 连错 ${rec.wrongStreak || 0}`)
      ));
    });
    root.appendChild(wCard);
  }

  /* 英语生词本（句子默写里求助过/手动收进的词） */
  const newWords = Store.sentenceNewList();
  if (newWords.length) {
    const nbCard = h('div', { class: 'card' },
      h('div', { class: 'sec-title' }, '📒 英语生词本'),
      h('div', { class: 'tiny', style: 'margin-bottom:6px' }, '句子默写中卡住求助过、或孩子手动收进的词。在「英语句子默写 → 生词本」里练习，拼对 2 次自动移出本子'));
    newWords.slice(0, 10).forEach(rec => {
      nbCard.appendChild(h('div', { class: 'pack-row' },
        h('span', { class: 'pack-info' }, rec.word, h('span', { class: 'tiny' }, `　${rec.zh || ''}${rec.ok ? ` · 已拼对 ${rec.ok} 次` : ''}`)),
        h('span', { class: 'tiny' }, `求助 ${rec.n} 次`)
      ));
    });
    root.appendChild(nbCard);
  }

  /* 小练笔作品回看（v38 写作星系） */
  const writes = Store.writingList();
  if (writes.length) {
    const wCard = h('div', { class: 'card' },
      h('div', { class: 'sec-title' }, '✍️ 小练笔作品'),
      h('div', { class: 'tiny', style: 'margin-bottom:6px' }, '写作星系写的小练笔都收在这里。孩子端「去请爸妈点评」可以打星；这里随时回看全文和手写照片'));
    writes.slice(-5).reverse().forEach(e => {
      const d = new Date(e.at);
      const n = ((e.open || '') + (e.mid || '') + (e.end || '')).replace(/\s/g, '').length;
      wCard.appendChild(h('div', {
        class: 'pack-row', style: 'cursor:pointer',
        onclick: () => {
          Sound.tap();
          showModal({
            title: `${e.emoji} ${e.title}`,
            build(el) {
              if (e.photo) el.appendChild(h('img', { class: 'wp-photo', src: e.photo, alt: '手写照片' }));
              if (e.audio) {
                el.appendChild(h('div', { class: 'tiny center', style: 'margin:4px 0' }, `🎧 孩子的录音 ${e.audioSec || '?'} 秒`));
                try { el.appendChild(h('audio', { class: 'wp-audio', controls: '', src: e.audio })); } catch (err) { /* 忽略 */ }
              }
              ['open', 'mid', 'end'].forEach(k => {
                if (e[k]) el.appendChild(h('div', { style: 'text-align:left;line-height:1.9;margin-top:4px' }, e[k]));
              });
              el.appendChild(h('div', { class: 'tiny', style: 'margin-top:8px' },
                `${d.getMonth() + 1}月${d.getDate()}日 · ${n} 字 · ${e.stars ? '⭐'.repeat(e.stars) : '还没点评'}`));
              if (e.note) el.appendChild(h('div', { class: 'wp-note' }, '💬 点评：' + e.note));
            },
            actions: [{ label: '关掉', cls: 'btn-main' }]
          });
        }
      },
        h('span', { class: 'pack-info' }, `${e.emoji} ${e.title}`, h('span', { class: 'tiny' }, `　${d.getMonth() + 1}月${d.getDate()}日 · ${n} 字${e.photo ? ' · 📷' : ''}`)),
        h('span', { class: 'tiny' }, e.stars ? '⭐'.repeat(e.stars) : '待点评')
      ));
    });
    root.appendChild(wCard);
  }

  /* 学习设置 */
  const set = s.settings;
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '⚙️ 学习设置'),
    selectRow('孩子年级', 'grade',
      [1, 2, 3, 4, 5, 6].map(g => [String(g), `${g}年级`]), String(set.grade),
      v => Store.setSetting('grade', parseInt(v, 10))),
    selectRow('词汇范围', 'range',
      [['below', '当前年级 + 低年级温故（推荐）'], ['current', '只学当前年级'], ['all', '全部词库（含高年级挑战）']],
      set.range, v => Store.setSetting('range', v)),
    numInput('每天温故词数', 'warmupPerDay', set.warmupPerDay === undefined ? 1 : set.warmupPerDay, 0, 3),
    h('div', { class: 'tiny', style: 'margin:2px 0 10px' }, '每天的新词 = 当前年级词汇为主 + 至多数个低年级温故词热身（设为 0 则全部当前年级）；学习卡上会标注「温故/挑战」'),
    numInput('每天挑战词数（五六年级拔高）', 'challengePerDay', set.challengePerDay === undefined ? 1 : set.challengePerDay, 0, 3),
    h('div', { class: 'tiny', style: 'margin:2px 0 10px' }, '无视词汇范围，每天从「挑战星系」限量混入高年级词，答对金币更多（+5）；学习卡上标注「挑战 · N年级词」'),
    numInput('每天新词数', 'dailyNew', set.dailyNew, 1, 10),
    numInput('每天复习量', 'dailyReview', set.dailyReview, 3, 30),
    numInput('单次时长提醒（分钟）', 'sessionLimitMin', set.sessionLimitMin, 5, 60),
    numInput('护眼提醒间隔（分钟）', 'eyeRestMin', set.eyeRestMin === undefined ? 25 : set.eyeRestMin, 10, 60),
    h('div', { class: 'tiny', style: 'margin:2px 0 10px' }, '当天累计学习每满这个分钟数，弹窗提醒孩子休息眼睛（默认 25 分钟）'),
    numInput('每日金币上限', 'dailyCoinCap', set.dailyCoinCap === undefined ? 150 : set.dailyCoinCap, 60, 500),
    h('div', { class: 'tiny', style: 'margin:2px 0 10px' }, '每天最多能赚的金币数（段位晋升和周日 BOSS 不受限）；可重复的活动当天首刷全额、第二次四折、之后只给 1 枚'),
    h('label', { class: 'check-row' },
      h('input', { type: 'checkbox', checked: !set.soundOff ? '' : null, onchange: e => Store.setSetting('soundOff', !e.target.checked) }),
      ' 音效与发音'
    ),
    /* v36 方案A：英语发音语速档 + 声音试听选择（解决"偏快/怪腔"——多因设备挑到低质声音） */
    selectRow('英语发音语速', 'voicerate',
      [['0.65', '慢速 · 跟读模仿'], ['0.85', '标准（推荐）'], ['1', '原速']],
      String(parseFloat(set.voiceRate) || 0.85), v => Store.setSetting('voiceRate', parseFloat(v))),
    voiceRow(),
    /* v36 方案B：单词朗读优先有道词典真人音频（美音），断网/失败自动回退上面的 TTS */
    selectRow('词典真人发音', 'wordvoice',
      [['youdao', '开启（单词 + 短句 · 需联网）'], ['tts', '关闭，用本机合成']],
      set.wordVoice === 'tts' ? 'tts' : 'youdao', v => Store.setSetting('wordVoice', v)),
    selectRow('词典口音', 'vtype',
      [['us', '美音（与教材一致）'], ['uk', '英音']],
      set.voiceType === 'uk' ? 'uk' : 'us', v => Store.setSetting('voiceType', v)),
    h('div', { class: 'tiny', style: 'margin:2px 0 10px' }, '语速/声音只影响本机合成；词典真人音用于单词和 6 词内短句（约四成常见句式有词典音，其余自动回落合成），断网也自动回落，孩子无感；中文诗词一律本机中文声'),
    selectRow('外观主题', 'theme',
      [['auto', '跟随系统（推荐）'], ['light', '日间 · 明亮护眼'], ['dark', '夜间 · 深空']],
      set.theme || 'auto',
      v => { Store.setSetting('theme', v); applyTheme(); }),
    h('div', { class: 'row-gap' },
      h('input', { id: 'new-pin', class: 'input', type: 'password', maxlength: '4', placeholder: '设置新 PIN（4位数字）' }),
      h('button', {
        class: 'btn', onclick: () => {
          const v = $('#new-pin').value;
          if (!/^\d{4}$/.test(v)) { toast('PIN 必须是 4 位数字'); return; }
          Store.setSetting('pin', v); $('#new-pin').value = ''; toast('PIN 已更新');
        }
      }, '修改 PIN')
    ),
    h('div', { class: 'tiny' }, '初始 PIN 为 1234，请及时修改（当前 PIN：' + set.pin + '）'),
    h('div', { class: 'row-gap', style: 'margin-top:10px' },
      h('button', { class: 'btn', onclick: () => { Sound.tap(); showUpdateNotes(); } }, `📋 查看 ${APP_VERSION} 更新日志`)
    )
  ));

  /* 词库管理 */
  const packCard = h('div', { class: 'card' }, h('div', { class: 'sec-title' }, '📚 词库管理'));
  packs.forEach(p => {
    const on = Store.isActive(p.id);
    const learned = p.words.filter(w => s.srs[w.word.toLowerCase()]).length;
    packCard.appendChild(h('div', { class: 'pack-row' },
      h('span', { class: 'pack-info' }, `${p.emoji} ${p.name}`, h('span', { class: 'tiny' }, `　${learned}/${p.words.length} 已学`)),
      h('button', {
        class: 'btn small ' + (on ? 'btn-on' : ''),
        onclick: () => {
          Sound.tap();
          let ap = s.settings.activePacks ? s.settings.activePacks.slice() : Store.allPacks().map(x => x.id);
          if (on) ap = ap.filter(x => x !== p.id); else ap.push(p.id);
          if (!ap.length) { toast('至少要保留一个星系'); return; }
          Store.setSetting('activePacks', ap.length === Store.allPacks().length ? null : ap);
          renderParent();
        }
      }, on ? '已开启' : '已关闭')
    ));
  });
  packCard.appendChild(h('div', { class: 'tiny' }, '关闭的星系不出现在学习与图鉴中'));
  root.appendChild(packCard);

  /* 自定义词库 */
  const customCard = h('div', { class: 'card' }, h('div', { class: 'sec-title' }, '✨ 添加自定义词'));
  customCard.appendChild(h('textarea', {
    id: 'custom-input', class: 'input', rows: '4',
    placeholder: '每行一个词，格式：单词|中文|表情|例句|例句中文\n后三项可省略，例如：\ntiger|老虎\ncup|杯子|🍵|This is my cup.'
  }));
  customCard.appendChild(h('button', {
    class: 'btn btn-main', onclick: () => {
      const txt = $('#custom-input').value;
      const { list, bad } = parseCustomLines(txt);
      if (!list.length) { toast(bad.length ? `这行没认出来：${bad[0].slice(0, 24)}` : '没有识别到有效单词'); return; }
      const n = Store.addCustomWords(list);
      toast(`已添加 ${n} 个词` + (bad.length ? `；${bad.length} 行无法识别` : ''));
      renderParent();
    }
  }, '添加到「我的星系」'));
  if (s.custom.length) {
    s.custom.forEach(w => {
      const id = w.word.toLowerCase();
      customCard.appendChild(h('div', { class: 'pack-row' },
        h('span', {}, `${w.emoji} ${w.word} `, h('span', { class: 'tiny' }, w.zh || '')),
        h('button', { class: 'btn small danger', onclick: () => { Store.removeCustomWord(id); renderParent(); } }, '删除')
      ));
    });
  }
  root.appendChild(customCard);

  /* 听写小测验 */
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '📝 听写小测验'),
    h('div', { class: 'tiny', style: 'margin-bottom:8px' }, '随机抽 10 个已学词，播发音+显示中文让孩子拼写；每词只有一次机会，错词自动收进错题本。适合周末或课前检查。'),
    h('button', {
      class: 'btn btn-main', onclick: () => {
        setQuestSub('var(--accent)');
        showScreen('quest');
        Quest.startDictation();
      }
    }, '🎯 发起听写测验'),
    s.dictations && s.dictations.length ? h('div', { style: 'margin-top:6px' },
      h('div', { class: 'tiny', style: 'margin:6px 0 2px' }, '最近成绩：'),
      s.dictations.slice(-3).reverse().map(d => h('div', { class: 'pack-row' },
        h('span', { class: 'tiny' }, d.at),
        h('span', { class: 'pack-info' }, `${d.correct}/${d.total} ${d.correct === d.total ? '💯' : ''}`)
      ))
    ) : ''
  ));

  /* 兑换商店管理 */
  const shop = s.shop;
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '🎁 兑换商店'),
    h('div', { class: 'tiny', style: 'margin-bottom:8px' }, '定义孩子可以用金币兑换的现实奖励；孩子发起兑换后在这里确认。'),
    h('div', { class: 'row-gap' },
      h('input', { id: 'shop-emoji', class: 'input', style: 'width:52px;flex:none;text-align:center', maxlength: '2', value: '🎁' }),
      h('input', { id: 'shop-name', class: 'input', style: 'flex:1', placeholder: '奖励名称，如：周末冰淇淋' }),
      h('input', { id: 'shop-cost', class: 'input num', type: 'number', min: '1', placeholder: '金币' })
    ),
    h('button', {
      class: 'btn btn-main', style: 'margin-top:8px', onclick: () => {
        const emoji = document.getElementById('shop-emoji').value.trim() || '🎁';
        const name = document.getElementById('shop-name').value.trim();
        const cost = parseInt(document.getElementById('shop-cost').value, 10);
        if (!name || !cost || cost < 1) { toast('填好奖励名称和金币数'); return; }
        Store.addShopReward(emoji, name, cost);
        renderParent();
      }
    }, '添加奖励'),
    h('button', {
      class: 'btn', style: 'margin-top:8px', onclick: () => {
        let n = 0;
        PRIVILEGE_PACK.forEach(p => {
          if (!shop.rewards.some(r => r.name === p.name)) {
            Store.addShopReward(p.emoji, p.name, p.cost);
            n++;
          }
        });
        toast(n ? `已添加 ${n} 张特权券，价格可在下方自行调整` : '特权券都已经添加过啦');
        if (n) renderParent();
      }
    }, '🎫 一键添加特权券包'),
    h('div', { class: 'tiny', style: 'margin-top:6px' }, '特权券 = 孩子用金币换家庭特权（选晚餐、晚睡 15 分钟、决定周末活动…），比实物礼物更好用；兑换后同样在这里确认'),
    shop.rewards.length ? shop.rewards.map(r => h('div', { class: 'pack-row' },
      h('span', { class: 'pack-info' }, `${r.emoji} ${r.name}`, h('span', { class: 'tiny' }, `　${r.cost} 🪙`)),
      h('button', { class: 'btn small danger', onclick: () => { Store.removeShopReward(r.id); renderParent(); } }, '删除')
    )) : emptyArt('gift', '还没有奖励，先在下面添加一个吧。'),
    shop.pending.length ? h('div', { style: 'margin-top:12px' },
      h('div', { class: 'sec-title', style: 'font-size:16px' }, '⏳ 待兑现'),
      shop.pending.map(p2 => h('div', { class: 'pack-row' },
        h('span', { class: 'pack-info' }, `${p2.emoji} ${p2.name}`, h('span', { class: 'tiny' }, `　${p2.cost} 🪙 · ${p2.at}`)),
        h('span', { class: 'row-gap', style: 'margin-top:0' },
          h('button', { class: 'btn small btn-on', onclick: () => { Store.approveRedeem(p2.id); Sound.gold(); renderParent(); } }, '已兑现 ✓'),
          h('button', { class: 'btn small danger', onclick: () => { Store.rejectRedeem(p2.id); renderParent(); toast('已拒绝并退还金币'); } }, '退还')
        )
      ))
    ) : '',
    shop.history.length ? h('div', { class: 'tiny', style: 'margin-top:8px' }, '最近兑现：' + shop.history.slice(0, 5).map(x => `${x.emoji}${x.name}`).join('、')) : ''
  ));

  /* 成长曲线 */
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '📈 成长曲线'),
    curveBlock('词汇量增长（近 14 天）', vocabCurve(14)),
    curveBlock('口算冲刺成绩（每次答对题数）', (s.math.runs || []).slice(-14).map(r => r.correct), '#58e08a')
  ));

  /* 数学星系设置 */
  const m = s.math;
  const mathRuns = (m.runs || []).slice(-7);
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '🪐 数学星系'),
    selectRow('口算难度', 'mlevel',
      [['1', '基础'], ['2', '四上核心（推荐）'], ['3', '挑战（两步混合）']],
      String(m.level || 2), v => Store.setMath('level', parseInt(v, 10))),
    selectRow('冲刺时长', 'mseconds',
      [['30', '30 秒'], ['60', '60 秒（推荐）'], ['90', '90 秒']],
      String(m.seconds || 60), v => Store.setMath('seconds', parseInt(v, 10))),
    mathRuns.length ? h('div', { class: 'stat-bars' },
      mathRuns.map(r => h('div', { class: 'stat-bar' },
        h('i', { style: 'height:' + Math.min(30, r.correct) * 3 + 'px' }),
        h('span', {}, r.at.slice(5) + ' ' + r.correct + '题')
      ))
    ) : emptyArt('rocket', '还没有冲刺记录，去「数学星系」跑一轮就有啦。'),
    h('div', { class: 'tiny' }, `错题池 ${m.wrong.length} 题，下次冲刺优先重练；口算答错同样计入当日失误`)
  ));

  /* 数据管理 */
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '💾 数据备份'),
    h('div', { class: 'row-gap wrap' },
      h('button', {
        class: 'btn', onclick: () => {
          const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `star-english-backup-${Store.todayStr()}.json` });
          document.body.appendChild(a); a.click(); a.remove();
          toast('备份文件已下载');
        }
      }, '导出备份'),
      h('button', { class: 'btn', onclick: () => $('#import-file').click() }, '导入备份'),
      h('input', { id: 'import-file', type: 'file', accept: '.json', style: 'display:none', onchange: e => {
        const f = e.target.files[0];
        if (!f) return;
        const fr = new FileReader();
        fr.onload = () => {
          try { Store.importJSON(fr.result); toast('导入成功'); parentUnlocked = false; showScreen('home'); }
          catch (err) { toast('导入失败：' + err.message); }
        };
        fr.readAsText(f);
      } })
    ),
    h('div', { class: 'row-gap wrap' },
      h('button', {
        class: 'btn danger', onclick: () => confirmModal('仅清空学习进度', '清空所有学习记录、图鉴和连击（保留词库与设置），确定？', () => {
          Store.resetProgress(); showScreen('home'); toast('已清空学习进度');
        })
      }, '清空学习进度'),
      h('button', {
        class: 'btn danger', onclick: () => {
          const pet = Store.state.pet;
          const kind = (typeof PET_KINDS !== 'undefined' && PET_KINDS.find(x => x.id === pet.kind)) || { name: '伙伴' };
          confirmModal('重置伙伴成长', `把当前伙伴「${pet.name}」（${kind.emoji} ${kind.name}）的进化进度清零，从头养起。金币和装扮不受影响，确定？`, () => {
            Store.resetPetProgress();
            renderHome();
            toast('🐾 伙伴成长已重置，从最初始形态重新养吧');
          });
        }
      }, '重置伙伴成长'),
      h('button', {
        class: 'btn danger', onclick: () => confirmModal('恢复出厂', '将删除全部数据（包括自定义词库和设置），确定？', () => {
          Store.factoryReset(); parentUnlocked = false; showScreen('home'); toast('已恢复出厂设置');
        })
      }, '恢复出厂')
    ),
    h('div', { class: 'tiny' }, '数据仅保存在本设备浏览器中。清理浏览器数据会丢失进度，建议定期导出备份。')
  ));

  root.appendChild(h('button', { class: 'btn exit-btn', onclick: () => { parentUnlocked = false; showScreen('home'); } }, '退出家长面板'));
}

function statBox(label, value) {
  return h('div', { class: 'stat-box' }, h('div', { class: 'stat-val' }, value), h('div', { class: 'tiny' }, label));
}
/* 年级徽章文案：低于当前年级=温故，高于=挑战，自定义词无年级 */
function gradeLabel(w) {
  if (!w.grade) return '';
  const cur = Store.state.settings.grade;
  const tag = w.grade < cur ? '温故 · ' : (w.grade > cur ? '挑战 · ' : '');
  return `${tag}${w.grade}年级词`;
}
function numInput(label, key, val, min, max) {
  return h('label', { class: 'num-row' },
    h('span', {}, label),
    h('input', {
      class: 'input num', type: 'number', min, max, value: val,
      onchange: e => {
        let v = parseInt(e.target.value, 10);
        if (isNaN(v)) v = min;
        v = Math.max(min, Math.min(max, v));
        e.target.value = v;
        Store.setSetting(key, v);
      }
    })
  );
}
function selectRow(label, key, options, val, onChange) {
  const sel = h('select', {
    class: 'input num',
    onchange: e => onChange(e.target.value)
  }, options.map(([v, text]) => h('option', { value: v, selected: v === val ? '' : null }, text)));
  return h('label', { class: 'num-row' }, h('span', {}, label), sel);
}
/* 英语发音声音选择（v36 方案A）：列出设备全部英文声音，可试听后选用 */
function voiceRow() {
  const list = Sound.enVoices();
  const cur = Store.state.settings.voiceName || '';
  if (!list.length) {
    return h('label', { class: 'num-row' },
      h('span', {}, '英语发音声音'),
      h('span', { class: 'tiny' }, '本机声音还没就绪，稍后重开本页再选'));
  }
  const sel = h('select', {
    class: 'input num', style: 'flex:1.35',
    onchange: e => { Store.setSetting('voiceName', e.target.value); Sound.pickVoice(); }
  },
    [h('option', { value: '', selected: !cur ? '' : null }, '（自动推荐）')]
      .concat(list.map(v => h('option', { value: v.name, selected: v.name === cur ? '' : null }, v.name))));
  return h('label', { class: 'num-row' },
    h('span', {}, '英语发音声音'),
    h('span', { class: 'row-gap', style: 'margin-top:0;flex:1.35' }, sel,
      h('button', {
        class: 'btn small', style: 'flex:none',
        onclick: () => { Sound.pickVoice(); Sound.speak('Hello! I am your English friend.', 0.85); }
      }, '🔊 试听')));
}
function parseCustomLines(text) {
  const out = [], bad = [];
  text.split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(line => {
    /* 分隔符自动识别：| 优先，其次 Tab、中文逗号、英文逗号 */
    let parts;
    if (line.includes('|')) parts = line.split('|');
    else if (line.includes('\t')) parts = line.split('\t');
    else if (line.includes('，')) parts = line.split('，');
    else if (line.includes(',')) parts = line.split(',');
    else parts = [line];
    parts = parts.map(x => x.trim());
    const word = parts[0];
    if (!/^[a-zA-Z][a-zA-Z'\- ]{0,19}$/.test(word)) { bad.push(line); return; }
    out.push({
      word,
      zh: parts[1] || '',
      emoji: parts[2] || '🌟',
      ex: parts[3] || `${word.charAt(0).toUpperCase() + word.slice(1)} is a word.`,
      exZh: parts[4] || ''
    });
  });
  return { list: out, bad };
}
function confirmModal(title, msg, onYes) {
  showModal({
    title,
    build(el) { el.appendChild(h('div', {}, msg)); },
    actions: [
      { label: '取消' },
      { label: '确定执行', cls: 'danger', onClick: close => { close(); onYes(); } }
    ]
  });
}

/* ---------- 本周学习周报（v36）----------
 * 从 history / math.runs / 错题池按周一汇总，附规则化的家长建议 */
function showWeeklyReport() {
  const s = Store.state;
  const mon = mondayOf(new Date());
  const today = Store.todayStr();
  const weekStr = dsOf(mon);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const ds = dsOf(new Date(mon.getTime() + i * 86400000));
    days.push({ ds, rec: s.history[ds] || {} });
  }
  const passed = days.filter(d => d.ds <= today);
  const doneN = passed.filter(d => d.rec.done).length;
  const missN = passed.filter(d => !d.rec.done && d.ds !== today).length;
  const mins = passed.reduce((n, d) => n + (d.rec.minutes || 0), 0);
  const news = passed.reduce((n, d) => n + (d.rec.news || 0), 0);
  const coins = passed.reduce((n, d) => n + (d.rec.coins || 0), 0);
  const runs = (s.math.runs || []).filter(r => r.at >= weekStr);
  const avg = runs.length ? Math.round(runs.reduce((n, r) => n + r.correct, 0) / runs.length) : 0;
  const best = runs.length ? Math.max(...runs.map(r => r.correct)) : 0;
  const dictW = (s.dictations || []).filter(d => d.at >= weekStr);
  const weakN = Store.weakList(99).length;
  const cnWrong = (s.chinese.wrong || []).length;
  const mWrong = (s.math.wrong || []).length + (s.math.wrongP || []).length;

  const tips = [];
  /* 💬 亮点话术（v40）：先说这周做成了什么，给家长一个"聊内容不聊分数"的切入点 */
  const starsThisWeek = Object.values(s.chinese.stars || {}).filter(d => d >= weekStr).length;
  const learnedThisWeek = Object.values(s.chinese.learned || {}).filter(d => d >= weekStr).length;
  const ketThisWeek = ((s.ket && s.ket.done) || []).length;
  const shine = [];
  if (news > 0) shine.push(`学了 ${news} 个新词`);
  if (starsThisWeek + learnedThisWeek > 0) shine.push(`背了 ${starsThisWeek + learnedThisWeek} 首诗`);
  if (ketThisWeek > 0) shine.push(`练了 ${ketThisWeek} 段英语对话`);
  if (shine.length) tips.push(`本周 ${shine.join('、')}——找个轻松的时候，让 ta 当小老师讲给你听听看，比问"考了多少分"更养劲头。`);
  if (missN > 0) tips.push(`本周有 ${missN} 天没打卡（护盾会自动保住连续记录），每天 10 分钟比一次学很久更有效。`);
  if (weakN > 5) tips.push(`英语错词攒到 ${weakN} 个，建议今天点首页「错词来袭」专项清理。`);
  if (cnWrong > 5) tips.push(`语文错题 ${cnWrong} 道，「词语实战」会优先安排它们复习，答对一道当场清零一道。`);
  if (mWrong > 8) tips.push(`数学错题 ${mWrong} 道，冲刺和练习场会先重练它们，答对即清零。`);
  if (runs.length >= 3 && avg < 8) tips.push(`口算平均 ${avg} 题/轮偏低，若吃力可把难度调回「核心」档；也可以试试新的「应用题专项」。`);
  if (mins > 0 && mins < 60) tips.push(`本周学习共 ${mins} 分钟，每天两个 10 分钟刚刚好。`);
  if (!tips.length) tips.push('各项节奏都很稳，保持就好！');

  showModal({
    title: '📋 本周学习周报',
    build(el) {
      el.appendChild(h('div', { class: 'receipt' },
        h('div', { class: 'receipt-date' }, `${weekStr.slice(5).replace('-', '/')} 起的这一周`),
        h('div', { class: 'receipt-row' }, h('b', {}, '🚀 打卡'), h('span', {}, `${doneN} 天${missN ? ` · 漏 ${missN} 天` : ' · 全勤！'}`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '⏱ 用时'), h('span', {}, `${mins} 分钟`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '🆕 新词'), h('span', {}, `${news} 个`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '🪐 口算'), h('span', {}, runs.length ? `${runs.length} 轮 · 平均 ${avg} 题 · 最好 ${best} 题` : '本周还没冲刺')),
        h('div', { class: 'receipt-row' }, h('b', {}, '📝 听写'), h('span', {}, dictW.length ? `${dictW.length} 次 · 共对 ${dictW.reduce((n, d) => n + d.correct, 0)}/${dictW.reduce((n, d) => n + d.total, 0)} 个` : '本周没有听写')),
        h('div', { class: 'receipt-row' }, h('b', {}, '🪙 进账'), h('span', {}, `${coins} 枚金币`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '📕 待消灭'), h('span', {}, `英语错词 ${weakN} · 语文错题 ${cnWrong} · 数学错题 ${mWrong}`)),
        h('div', { class: 'receipt-div' }),
        tips.map(t => h('div', { class: 'receipt-row' }, h('b', {}, '💡'), h('span', {}, t)))
      ));
    },
    actions: [{ label: '知道了', cls: 'btn-main' }]
  });
}

/* PIN 门 */
function renderPinGate(root) {
  let entered = '';
  const dots = () => h('div', { class: 'pin-dots' }, [0, 1, 2, 3].map(i =>
    h('span', { class: 'pin-dot' + (i < entered.length ? ' on' : '') })
  ));
  const box = h('div', { class: 'card pin-card' });
  const refresh = () => { box.querySelector('.pin-dots').replaceWith(dots()); };
  box.appendChild(h('div', { class: 'sec-title center' }, '🔒 家长入口'));
  box.appendChild(dots());
  const pad = h('div', { class: 'pin-pad' });
  '1234567890'.split('').forEach(n => pad.appendChild(h('button', {
    class: 'btn pin-key', onclick: () => {
      Sound.tap();
      if (entered.length >= 4) return;
      entered += n;
      if (entered.length === 4) {
        setTimeout(() => {
          if (entered === Store.state.settings.pin) { parentUnlocked = true; renderParent(); }
          else { toast('PIN 不对'); entered = ''; refresh(); }
        }, 120);
      }
      refresh();
    }
  }, n)));
  pad.appendChild(h('button', { class: 'btn pin-key', onclick: () => { entered = entered.slice(0, -1); refresh(); } }, '⌫'));
  box.appendChild(pad);
  box.appendChild(h('div', { class: 'tiny center' }, '默认 PIN：1234（可在家长面板修改）'));
  root.appendChild(box);
  root.appendChild(h('button', { class: 'btn exit-btn', onclick: () => showScreen('home') }, '返回'));
}


/* ============================================================
 * 兑换商店（孩子端）与今日结算单
 * ============================================================ */
function openShop() {
  const shop = Store.state.shop;
  showModal({
    title: '🎁 兑换商店',
    build(el, close) {
      el.appendChild(h('div', { class: 'tiny', style: 'margin-bottom:8px' }, `当前金币：${Store.state.coins} 🪙 · 兑换后找爸妈领取`));
      shop.rewards.forEach(r => {
        const pending = shop.pending.some(p => p.rewardId === r.id);
        const afford = Store.state.coins >= r.cost;
        el.appendChild(h('div', { class: 'pack-row' },
          h('span', { class: 'pack-info' }, `${r.emoji} ${r.name}`, h('span', { class: 'tiny' }, `　${r.cost} 🪙`)),
          h('button', {
            class: 'btn small ' + (afford && !pending ? 'btn-main' : ''),
            disabled: pending || !afford ? '' : null,
          onclick: e => {
            const res = Store.redeemReward(r.id);
            if (res.ok) {
              Sound.gold();
              const c = centerOf(e.currentTarget);
              burst(c.x, c.y, { count: 14, emojis: ['🎁', '⭐'], power: 90 });
              /* 兑换成功用大弹窗明示，回首页时同步待兑现提醒 */
              showModal({
                title: '🎉 兑换成功！',
                dismissable: true,
                build(el) {
                  el.appendChild(h('div', { class: 'center' },
                    h('div', { style: 'font-size:64px;margin:8px 0' }, r.emoji),
                    h('div', { style: 'font-size:24px;font-weight:900;color:var(--gold)' }, r.name),
                    h('div', { class: 'tiny', style: 'margin-top:8px' }, `花了 ${r.cost} 🪙 · 礼券已收进"待爸妈兑现"`),
                    h('div', { class: 'tiny', style: 'margin-top:4px' }, '快去找爸爸妈妈领取吧！')
                  ));
                },
                actions: [{ label: '好嘞！', cls: 'btn-main', onClick: () => { close(); renderHome(); } }]
              });
            } else toast(res.msg);
          }
          }, pending ? '待兑现' : '兑换')
        ));
      });
      if (shop.pending.length) {
        el.appendChild(h('div', { class: 'tiny', style: 'margin-top:10px' }, `待爸妈兑现：${shop.pending.map(p => `${p.emoji}${p.name}`).join('、')}`));
      }
    },
    actions: [{ label: '先逛到这', cls: 'btn-main' }]
  });
}

function openSettlement() {
  const s = Store.state.today;
  const c = Store.state;
  const now = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  const spoken = Object.values(c.spoken).filter(d => d === Store.todayStr()).length;
  const lastRun = (c.math.runs || []).filter(r => r.at === Store.todayStr()).pop();
  const due = Store.tomorrowDueCount();
  showModal({
    title: '🧾 今日结算单',
    build(el) {
      el.appendChild(h('div', { class: 'receipt' },
        h('div', { class: 'receipt-date' }, `${now.getMonth() + 1}月${now.getDate()}日 星期${week}`),
        h('div', { class: 'receipt-row' }, h('b', {}, '🚀 英语'), h('span', {}, `新词 ${s.newDone}/${Store.state.settings.dailyNew} · 复习 ${s.revDone}/${Store.state.settings.dailyReview}${spoken ? ` · 跟读 ${spoken} 词` : ''}`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '🪐 数学'), h('span', {}, s.mathDone ? `冲刺完成${lastRun ? ` · 最近答对 ${lastRun.correct} 题` : ''}` : '今天还没冲刺')),
        h('div', { class: 'receipt-row' }, h('b', {}, '📖 语文'), h('span', {}, (s.cnRounds || 0) ? `完成 ${s.cnRounds} 轮练习` : '今天还没开始')),
        h('div', { class: 'receipt-row' }, h('b', {}, '📚 短文'), h('span', {}, s.enReadDone ? '今日英语短文已读完 ✅' : '今天的小短文还在等你')),
        h('div', { class: 'receipt-div' }),
        h('div', { class: 'receipt-row' }, h('b', {}, '💰 今日收入'), h('span', {}, `+${s.coinsEarned || 0} 🪙${c.settings.dailyCoinCap && s.capHit ? `（已达上限 ${c.settings.dailyCoinCap}）` : ''}`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '⏱ 今日用时'), h('span', {}, `${s.minutes} 分钟`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '🔥 连续航行'), h('span', {}, `${c.streak.count} 天`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '📅 明天待复习'), h('span', {}, `${due} 个词`)),
        h('div', { class: 'receipt-div' }),
        h('div', { class: 'receipt-foot' }, `“${rnd(PET_LINES.praise)}” —— ${c.pet.name}`)
      ));
    },
    actions: [{ label: '今天辛苦啦！', cls: 'btn-main' }]
  });
}

/* ---------- 成长曲线 ---------- */
function curveBlock(label, values, color = '#4fd1ff') {
  const clean = values.filter(v => v !== null && v !== undefined);
  if (clean.length < 2) return h('div', { class: 'tiny', style: 'margin:4px 0 10px' }, label + '：数据积累中…');
  const w = 300, hgt = 76, pad = 6;
  const max = Math.max(...clean, 1);
  const pts = clean.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (clean.length - 1);
    const y = hgt - pad - (v / max) * (hgt - pad * 2);
    return [x, y];
  });
  const poly = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return h('div', { style: 'margin:4px 0 14px' },
    h('div', { class: 'tiny', style: 'margin-bottom:4px' }, `${label}（最新 ${clean[clean.length - 1]}）`),
    h('svg', { viewBox: `0 0 ${w} ${hgt}`, style: 'width:100%;height:76px' },
      h('polyline', { points: poly, fill: 'none', stroke: color, 'stroke-width': '2.5', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
      pts.map(p => h('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 3, fill: '#ffd166' }))
    )
  );
}

function vocabCurve(days = 14) {
  const s = Store.state;
  const total = Object.keys(s.srs).filter(id => Store.findWord(id)).length;
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const ds = Store.addDays(Store.todayStr(), -i);
    arr.push({ news: (s.history[ds] && s.history[ds].news) || 0 });
  }
  let back = 0;
  for (let i = arr.length - 1; i >= 0; i--) { arr[i].cum = total - back; back += arr[i].news; }
  return arr.map(x => Math.max(0, x.cum));
}


/* ============================================================
 * 🏅 成长足迹：把数据翻译成孩子的语言
 * 头条播报（夸努力与进步）+ 本周航行格 + 下一个够得着的目标
 * ============================================================ */
function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function dsOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekWordDelta() {
  const s = Store.state;
  const now = new Date();
  const thisMon = dsOf(mondayOf(now));
  const lastMon = dsOf(new Date(mondayOf(now).getTime() - 7 * 86400000));
  let thisW = 0, lastW = 0;
  Object.values(s.srs).forEach(rec => {
    if (!rec.learnedAt) return;
    if (rec.learnedAt >= thisMon) thisW++;
    else if (rec.learnedAt >= lastMon) lastW++;
  });
  return { thisW, lastW };
}

function growthHeadline() {
  const s = Store.state;
  const runs = s.math.runs || [];
  if (runs.length >= 2 && runs[runs.length - 1].correct > runs[runs.length - 2].correct) {
    return `📣 口算新纪录！最近一次答对 ${runs[runs.length - 1].correct} 题`;
  }
  const { thisW, lastW } = weekWordDelta();
  if (thisW > 0 && thisW > lastW) return `📣 你这周学会了 ${thisW} 个新词，比上周多了 ${thisW - lastW} 个！`;
  if (thisW > 0) return `📣 你这周已经学会了 ${thisW} 个新词！`;
  if (s.streak.count >= 2) return `📣 已经连续航行 ${s.streak.count} 天，坚持就是超能力！`;
  return `📣 今天也出发吧，去点亮第一颗星！`;
}

function nextGoal() {
  const s = Store.state;
  const cands = [];
  const g = s.math.goodRuns || 0;
  const need = g % 2 === 0 ? 1 : 2;
  cands.push({
    name: `再完成 ${need} 次达标冲刺（答对 ≥10 题），点亮新行星！`,
    prog: (g % 2) / 2
  });
  const stars = cnStarCount();
  if (stars < CN_POEMS.length) cands.push({ name: `诗词星图再点亮 ${CN_POEMS.length - stars} 首就集齐啦！`, prog: stars / CN_POEMS.length });
  const reads = s.chinese.reads.length;
  if (reads < CN_READINGS.length) cands.push({ name: `阅读训练营还剩 ${CN_READINGS.length - reads} 篇等你探索！`, prog: reads / CN_READINGS.length });
  const learned = Object.keys(s.srs).filter(id => Store.findWord(id)).length;
  const nextWords = [10, 50, 100].find(t => learned < t);
  if (nextWords) cands.push({ name: `再学会 ${nextWords - learned} 个词，赢得新徽章！`, prog: learned / nextWords });
  cands.push({
    name: '完成今日冒险，盖章领金币！',
    prog: Math.min(1, (s.today.newDone + s.today.revDone) / Math.max(1, s.settings.dailyNew + s.settings.dailyReview))
  });
  return cands.sort((a, b) => b.prog - a.prog)[0];
}

function renderGrowthCard(slot) {
  const s = Store.state;
  const mon = mondayOf(new Date());
  const todayIdx = (new Date().getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < 7; i++) {
    const ds = dsOf(new Date(mon.getTime() + i * 86400000));
    const done = s.history[ds] && s.history[ds].done;
    cells.push(h('div', { class: 'wk-cell' + (done ? ' on' : '') + (i > todayIdx ? ' future' : '') },
      done ? '●' : (i > todayIdx ? '' : '○')));
  }
  const learned = Object.keys(s.srs).filter(id => Store.findWord(id)).length;
  const weakN = Store.weakList(99).length;
  const goal = nextGoal();
  slot.innerHTML = '';
  slot.appendChild(h('div', { class: 'card growth-card', onclick: () => { Sound.tap(); openFootprint(); } },
    h('div', { class: 'growth-head' },
      h('span', { style: 'font-weight:800' }, '🏅 成长足迹'),
      h('span', { class: 'tiny', style: 'cursor:pointer' }, '详情 ›')
    ),
    h('div', { class: 'growth-headline' }, growthHeadline()),
    h('div', { class: 'wk-row' },
      h('span', { class: 'tiny' }, '本周航行'),
      h('div', { class: 'wk-cells' }, cells)
    ),
    h('div', { class: 'growth-stats' },
      h('span', {}, `📈 词汇量 ${learned}`),
      weakN ? h('span', {}, `⚡ 待消灭 ${weakN}`) : h('span', { style: 'color:var(--green)' }, '✅ 错词清零'),
    ),
    h('div', { class: 'growth-goal' },
      h('div', { class: 'tiny' }, `🎯 ${goal.name}`),
      h('div', { class: 'bar slim', style: 'margin-top:4px' }, h('i', { style: 'width:' + Math.round(goal.prog * 100) + '%' }))
    )
  ));
}

function openFootprint() {
  const s = Store.state;
  const weeks = [];
  const thisMon = mondayOf(new Date());
  for (let w = 3; w >= 0; w--) {
    const mon = new Date(thisMon.getTime() - w * 7 * 86400000);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const ds = dsOf(new Date(mon.getTime() + i * 86400000));
      const done = s.history[ds] && s.history[ds].done;
      cells.push(h('div', { class: 'wk-cell' + (done ? ' on' : '') + (w === 0 && i > (new Date().getDay() + 6) % 7 ? ' future' : '') },
        done ? '●' : '·'));
    }
    weeks.push(h('div', { class: 'wk-row' },
      h('span', { class: 'tiny' }, w === 0 ? '本周' : `${mon.getMonth() + 1}/${mon.getDate()} 起`),
      h('div', { class: 'wk-cells' }, cells)
    ));
  }
  const c = Store.state.chinese;
  showModal({
    title: '🏅 我的成长足迹',
    build(el) {
      el.appendChild(h('div', { class: 'card', style: 'padding:12px;margin-bottom:10px' }, weeks));
      el.appendChild(h('div', { class: 'stat-grid' },
        statBox('词汇量', Object.keys(s.srs).filter(id => Store.findWord(id)).length + ' 个'),
        statBox('诗词星图', `${cnStarCount()}/${CN_POEMS.length}`),
        statBox('阅读探索', `${c.reads.length}/${CN_READINGS.length}`),
        statBox('口算最佳', (s.math.best || 0) + ' 题/轮'),
        statBox('点亮行星', (s.math.planets || 0) + '/10'),
        statBox('最长连航', (s.streak.best || 0) + ' 天')
      ));
      el.appendChild(h('div', { class: 'tiny', style: 'margin-top:10px' }, '每完成一次打卡，就多一格航行灯；集齐星图和行星，还会有神秘徽章等你！'));
    },
    actions: [{ label: '继续加油！', cls: 'btn-main' }]
  });
}
