/* ============================================================
 * 星际求知号 - 场景词卡数据生成脚本（开发用，不参与网页运行）
 *
 * 思路借鉴 chaogevision/words-flashcard 的分层理念（未使用其代码/素材）：
 *   AI 只画"无文字场景插画"，单词/释义等教学事实由本站 HTML 确定性渲染。
 *   插画暂缺时用 emoji 占位场景先行，图片放入 assets/scenes/<id>.jpg 自动生效
 *   （产图规范见 tools/scene-prompts.md）。
 *
 * 词源：js/data-ketwords.js（Word Atlas CC BY 4.0），词形/词义/音标/例句自动同步，
 *       不在本库另造词义。场景 = PEP 类别词汇点的具象化，错题挂进英语知识地图。
 * 用法：node tools/build-scene.js
 * 产物：js/data-scene.js
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* 读 KET 词库，取词形/释义/音标/例句 */
const ketSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'data-ketwords.js'), 'utf8');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(ketSrc + ';this.KET_WORDS = KET_WORDS;', ctx);
const dict = new Map(ctx.KET_WORDS.map(w => [w.w.toLowerCase(), w]));
const pick = w => {
  const hit = dict.get(w.toLowerCase());
  if (!hit) { console.error('✗ 场景词不在 KET 库：' + w); process.exit(1); }
  return { w: hit.w, zh: hit.zh.split(/[；;]/)[0], uk: hit.uk, ex: hit.ex };
};

/* 12 个场景：kp = PEP 类别词汇点（名称与场景类别一一对应，构建时校验存在） */
const SCENES = [
  { id: 'sc01', name: '动物农场', emoji: '🐾', kp: 'cne_p017', sky: '#dff3d8', ground: '#a5d98b',
    words: [
      { w: 'bird', emoji: '🐦', x: 32, y: 13 },
      { w: 'fish', emoji: '🐟', x: 60, y: 83 },
      { w: 'cat', emoji: '🐱', x: 26, y: 58 },
      { w: 'dog', emoji: '🐶', x: 41, y: 55 },
      { w: 'rabbit', emoji: '🐰', x: 55, y: 60 },
      { w: 'horse', emoji: '🐴', x: 70, y: 45 }
    ] },
  { id: 'sc02', name: '水果篮', emoji: '🍎', kp: 'cne_p050', sky: '#ffe9d6', ground: '#f7c8a0',
    words: [
      { w: 'grape', emoji: '🍇', x: 50, y: 20 },
      { w: 'apple', emoji: '🍎', x: 30, y: 62 },
      { w: 'banana', emoji: '🍌', x: 40, y: 68 },
      { w: 'orange', emoji: '🍊', x: 51, y: 68 },
      { w: 'pear', emoji: '🍐', x: 61, y: 52 },
      { w: 'mango', emoji: '🥭', x: 68, y: 70 }
    ] },
  { id: 'sc03', name: '书桌文具', emoji: '✏️', kp: 'cne_p063', sky: '#e8e3ff', ground: '#c9bdf5',
    words: [
      { w: 'bag', emoji: '🎒', x: 77, y: 42 },
      { w: 'book', emoji: '📕', x: 32, y: 72 },
      { w: 'pencil', emoji: '✏️', x: 55, y: 74 },
      { w: 'ruler', emoji: '📏', x: 62, y: 77 },
      { w: 'eraser', emoji: '🧼', x: 70, y: 76 },
      { w: 'pen', emoji: '🖊️', x: 76, y: 77 }
    ] },
  { id: 'sc04', name: '我的衣柜', emoji: '👕', kp: 'cne_p100', sky: '#ddeeff', ground: '#b8ccdd',
    words: [
      { w: 'shirt', emoji: '👕', x: 33, y: 43 },
      { w: 'dress', emoji: '👗', x: 45, y: 47 },
      { w: 'coat', emoji: '🧥', x: 56, y: 48 },
      { w: 'sweater', emoji: '🧶', x: 67, y: 46 },
      { w: 'trousers', emoji: '👖', x: 37, y: 81 },
      { w: 'hat', emoji: '🎩', x: 61, y: 80 }
    ] },
  { id: 'sc05', name: '天气窗', emoji: '🌤️', kp: 'cne_p092', sky: '#cfe8ff', ground: '#9fc4e8',
    words: [
      { w: 'sun', emoji: '☀️', x: 34, y: 16 },
      { w: 'cloud', emoji: '☁️', x: 43, y: 33 },
      { w: 'rain', emoji: '🌧️', x: 44, y: 50 },
      { w: 'storm', emoji: '⛈️', x: 66, y: 27 },
      { w: 'snow', emoji: '❄️', x: 34, y: 68 },
      { w: 'wind', emoji: '🌬️', x: 64, y: 67 }
    ] },
  { id: 'sc06', name: '我的房间', emoji: '🛏️', kp: 'cne_p072', sky: '#fff3d6', ground: '#d9b98c',
    words: [
      { w: 'window', emoji: '🪟', x: 50, y: 33 },
      { w: 'clock', emoji: '🕰️', x: 77, y: 26 },
      { w: 'lamp', emoji: '💡', x: 89, y: 52 },
      { w: 'bed', emoji: '🛏️', x: 60, y: 68 },
      { w: 'sofa', emoji: '🛋️', x: 10, y: 63 },
      { w: 'door', emoji: '🚪', x: 21, y: 40 }
    ] },
  { id: 'sc07', name: '职业小镇', emoji: '🧑‍🚒', kp: 'cne_p080', sky: '#d6f0ff', ground: '#c8b09a',
    words: [
      { w: 'doctor', emoji: '🧑‍⚕️', x: 11, y: 55 },
      { w: 'teacher', emoji: '🧑‍🏫', x: 23, y: 55 },
      { w: 'farmer', emoji: '🧑‍🌾', x: 39, y: 55 },
      { w: 'nurse', emoji: '💉', x: 51, y: 55 },
      { w: 'driver', emoji: '🚖', x: 83, y: 45 },
      { w: 'police', emoji: '👮', x: 64, y: 48 }
    ] },
  { id: 'sc08', name: '餐桌晚餐', emoji: '🍽️', kp: 'cne_p020', sky: '#ffe8e8', ground: '#e8b8a8',
    words: [
      { w: 'cake', emoji: '🎂', x: 50, y: 40 },
      { w: 'rice', emoji: '🍚', x: 26, y: 45 },
      { w: 'egg', emoji: '🥚', x: 33, y: 73 },
      { w: 'milk', emoji: '🥛', x: 70, y: 40 },
      { w: 'juice', emoji: '🧃', x: 77, y: 52 },
      { w: 'bread', emoji: '🍞', x: 68, y: 75 }
    ] },
  { id: 'sc09', name: '玩具角', emoji: '🧸', kp: 'cne_p025', sky: '#ffe1f0', ground: '#d8a8c8',
    words: [
      { w: 'kite', emoji: '🪁', x: 28, y: 18 },
      { w: 'gift', emoji: '🎁', x: 74, y: 10 },
      { w: 'ball', emoji: '⚽', x: 26, y: 75 },
      { w: 'toy', emoji: '🧸', x: 51, y: 72 },
      { w: 'doll', emoji: '🪆', x: 73, y: 62 },
      { w: 'robot', emoji: '🤖', x: 83, y: 72 }
    ] },
  { id: 'sc10', name: '全家福', emoji: '👨‍👩‍👧‍👦', kp: 'cne_p035', sky: '#ffe9cf', ground: '#c8a878',
    words: [
      { w: 'grandfather', emoji: '👴', x: 34, y: 45 },
      { w: 'grandmother', emoji: '👵', x: 50, y: 45 },
      { w: 'father', emoji: '👨', x: 36, y: 25 },
      { w: 'mother', emoji: '👩', x: 53, y: 27 },
      { w: 'brother', emoji: '👦', x: 38, y: 63 },
      { w: 'sister', emoji: '👧', x: 63, y: 60 }
    ] },
  { id: 'sc11', name: '彩色气球', emoji: '🎈', kp: 'cne_p009', sky: '#e6f7ff', ground: '#bde3d8',
    words: [
      { w: 'red', emoji: '🔴', x: 17, y: 18 },
      { w: 'blue', emoji: '🔵', x: 35, y: 20 },
      { w: 'yellow', emoji: '🟡', x: 53, y: 18 },
      { w: 'green', emoji: '🟢', x: 71, y: 18 },
      { w: 'pink', emoji: '🩷', x: 89, y: 17 },
      { w: 'black', emoji: '⚫', x: 51, y: 68 }
    ] },
  { id: 'sc12', name: '身体小侦探', emoji: '🧍', kp: 'cne_p013', sky: '#e8f0ff', ground: '#a8b8d8',
    words: [
      { w: 'eye', emoji: '👁️', x: 45, y: 24, lx: 36, ly: 14 },
      { w: 'ear', emoji: '👂', x: 61, y: 24, lx: 68, ly: 14 },
      { w: 'nose', emoji: '👃', x: 50, y: 27, lx: 36, ly: 30 },
      { w: 'mouth', emoji: '👄', x: 49, y: 32, lx: 64, ly: 32 },
      { w: 'hand', emoji: '✋', x: 62, y: 71, lx: 70, ly: 62 },
      { w: 'foot', emoji: '🦶', x: 55, y: 88, lx: 40, ly: 84 }
    ] }
];

/* KET 库校验 + 类别挂点校验（kp 必须在骨架里） */
const kpSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'data-kp.js'), 'utf8');
SCENES.forEach(s => {
  if (!kpSrc.includes(`"${s.kp}"`)) { console.error('✗ 场景 kp 不在骨架：' + s.id + ' → ' + s.kp); process.exit(1); }
});

const out = SCENES.map(s => ({
  id: s.id, name: s.name, emoji: s.emoji, kp: s.kp, sky: s.sky, ground: s.ground,
  img: 'assets/scenes/' + s.id + '.jpg',
  words: s.words.map(c => Object.assign(pick(c.w), { emoji: c.emoji, x: c.x, y: c.y, lx: c.lx, ly: c.ly }))
}));

const totalWords = out.reduce((n, s) => n + s.words.length, 0);
const js = `/* ============================================================
 * 星际求知号 - 场景词卡（v45 P1-C）
 * 分层思路借鉴 chaogevision/words-flashcard（仅理念，未用其代码/素材）：
 *   场景插画（img，暂缺时用 emoji 占位）+ 确定性文字层（HTML 标签，可点读）
 * 词源：KET 词汇站词库（Word Atlas，CC BY 4.0），由 tools/build-scene.js 同步生成
 * 场景 = PEP 类别词汇点的具象化，kp 挂进英语知识地图
 * 标签坐标为百分比（x/y = 物体中心），插画替换后如需微调直接改这里
 * ============================================================ */

const SCENE_CARDS = ${JSON.stringify(out, null, 0)};
`;
fs.writeFileSync(path.resolve(__dirname, '..', 'js', 'data-scene.js'), js, 'utf8');
console.log(`✓ 生成 js/data-scene.js：${out.length} 个场景 / ${totalWords} 词`);
console.log(`  字节 ${Buffer.byteLength(js)}`);
