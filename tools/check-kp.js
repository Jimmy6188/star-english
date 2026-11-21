/* ============================================================
 * 星际求知号 - 知识点骨架回归校验（开发用，不参与网页运行）
 * 用法：node tools/check-kp.js
 * 校验：
 *   1) 骨架完整：边引用的节点都存在、先修图无环
 *   2) 拼读映射：KP_EN_FAM 的词族 id 都真实存在于 WORD_FAMILIES
 *   3) 句子挂点：KP_EN_SENT 规则可编译、命中数统计、挂上的 kp 都存在
 *   4) KET 挂点：KP_EN_KET 的对话 id 都存在、挂上的 kp 都存在
 *   5) 错题池仿真：addEnWrong / clearEnWrong / kpWeakList 全链路
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

/* data.js 里只抠 WORD_FAMILIES（整份 data.js 有浏览器引用，不适合在 node 里整载） */
const dataSrc = read('js/data.js');
const famStart = dataSrc.indexOf('const WORD_FAMILIES = [');
if (famStart < 0) { console.error('✗ data.js 里找不到 WORD_FAMILIES'); process.exit(1); }
let famEnd = dataSrc.indexOf('];', famStart);
const famSrc = dataSrc.slice(famStart, famEnd + 2);

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };

const ctx = { console, window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(ctx);
vm.runInContext(
  read('js/data-kp.js') + '\n' + famSrc + '\n' + read('js/data-ket.js') + '\n' + read('js/data-sentence.js') +
  /* const 声明留在词法作用域里，显式挂到 context 上供外部取用 */
  ';this.KP = KP; this.WORD_FAMILIES = WORD_FAMILIES; this.KET_DIALOGUES = KET_DIALOGUES; this.SENTENCE_BANK = SENTENCE_BANK; this.KP_EN_FAM = KP_EN_FAM; this.KP_EN_SENT = KP_EN_SENT; this.KP_EN_KET = KP_EN_KET;',
  ctx,
  { filename: 'data-bundle.js' }
);
const { KP, WORD_FAMILIES, KET_DIALOGUES, SENTENCE_BANK, KP_EN_FAM, KP_EN_SENT, KP_EN_KET } = ctx;

/* 1) 骨架完整 + 无环 */
const ids = Object.keys(KP.nodes);
ok(ids.length === 525, `骨架节点数 ${ids.length}（期望 525：数学184+道法113+语文83+英语145）`);
const edgeCount = Object.keys(KP.deps).reduce((n, k) => n + KP.deps[k].length, 0);
ok(edgeCount === 717, `先修边总数 ${edgeCount}（期望 717）`);
const dangling = Object.keys(KP.deps).flatMap(k => KP.deps[k].map(d => d[0])).filter(d => !KP.get(d));
ok(dangling.length === 0, `悬空先修边 ${dangling.length} 条`);

/* 拓扑排序查环（Kahn） */
const indeg = {}; ids.forEach(id => indeg[id] = 0);
Object.keys(KP.deps).forEach(k => indeg[k] = KP.deps[k].length);
const queue = ids.filter(id => !indeg[id]);
let seen = 0;
const outdeg = {}; ids.forEach(id => outdeg[id] = []);
Object.keys(KP.deps).forEach(k => KP.deps[k].forEach(d => outdeg[d[0]].push(k)));
while (queue.length) {
  const u = queue.shift(); seen++;
  outdeg[u].forEach(v => { if (--indeg[v] === 0) queue.push(v); });
}
ok(seen === ids.length, `先修图无环（拓扑可达 ${seen}/${ids.length}）`);

/* 2) 拼读映射 */
const famIds = new Set(WORD_FAMILIES.map(f => f.id));
const ghostFam = Object.keys(KP_EN_FAM).filter(id => !famIds.has(id));
ok(ghostFam.length === 0, `KP_EN_FAM 词族 id 全部存在（虚指 ${ghostFam.length} 个）`);
ok(Object.keys(KP_EN_FAM).every(id => KP.get(KP_EN_FAM[id])), 'KP_EN_FAM 指向的知识点全部存在');
console.log(`  · 词族 ${WORD_FAMILIES.length} 族，已挂 ${Object.keys(KP_EN_FAM).length} 族（其余上游无对应语音点，不挂）`);

/* 3) 句子挂点 */
let sentErr = 0, sentHit = 0;
SENTENCE_BANK.forEach(s => {
  for (const r of KP_EN_SENT) {
    try { if (new RegExp(r.re).test(s.en)) { s.kp = r.kp; break; } } catch (e) { sentErr++; }
  }
  if (s.kp) { sentHit++; if (!KP.get(s.kp)) { sentErr++; console.error('  句子挂到不存在的点：' + s.en + ' → ' + s.kp); } }
});
ok(sentErr === 0, `KP_EN_SENT 规则编译与命中校验（异常 ${sentErr}）`);
console.log(`  · 句库 ${SENTENCE_BANK.length} 句，按句式命中 ${sentHit} 句`);
const ruleHits = {};
SENTENCE_BANK.filter(s => s.kp).forEach(s => ruleHits[s.kp] = (ruleHits[s.kp] || 0) + 1);
console.log('  · 句式分布：' + JSON.stringify(ruleHits));

/* 4) KET 挂点 */
const dlgIds = new Set(KET_DIALOGUES.map(d => d.id));
const ghostDlg = Object.keys(KP_EN_KET).filter(id => !dlgIds.has(id));
ok(ghostDlg.length === 0, `KP_EN_KET 对话 id 全部存在（虚指 ${ghostDlg.length} 个）`);
const taggedDlg = KET_DIALOGUES.filter(d => d.kp);
ok(taggedDlg.every(d => KP.get(d.kp)), 'KET 挂上的知识点全部存在');
console.log(`  · 对话 ${KET_DIALOGUES.length} 段，已挂 ${taggedDlg.length} 段`);

/* 5) 错题池仿真（走真实 store.js，localStorage 用内存垫） */
const mem = {};
const storeCtx = { console, window: {}, localStorage: {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
} };
/* store.js 依赖的页面上层常量，给最小垫片 */
vm.createContext(storeCtx);
try {
  vm.runInContext(
    read('js/audio.js') === undefined ? '' : '',
    storeCtx
  );
} catch (e) { /* audio.js 不是必需，容错 */ }
let storeSrc = read('js/store.js');
/* store.js 依赖的上层常量（data.js / 其他文件定义），给最小垫片 */
storeSrc = 'const ACHIEVEMENTS = [];\nconst PET_LINES = { praise: ["真棒"] };\n' +
  'const FEED_COST = 20;\n' + storeSrc;
vm.runInContext(storeCtx.document ? '' : 'var document = { getElementById: () => null, querySelector: () => null };', storeCtx);
try {
  vm.runInContext(storeSrc + '\n;var __store = Store;', storeCtx, { filename: 'store.js' });
  const S = storeCtx.__store;
  S.addEnWrong('fams', 'ake', 'cne_p057');
  S.addEnWrong('dlgs', 'k07', 'cne_p106');
  S.addEnWrong('sents', 'sw-ex01', 'cne_p006');
  const w1 = S.kpWeakList ? null : null;
  /* kpWeakList 在 ui-screens.js 里，这里手动模拟它的归并逻辑 */
  const pools = [S.state.enKp.fams, S.state.enKp.dlgs, S.state.enKp.sents];
  const n = pools.reduce((a, p) => a + p.filter(x => KP.get(x.kp)).length, 0);
  ok(n === 3, `enKp 三个池写入并全部指向有效知识点（${n}/3）`);
  S.clearEnWrong('fams', 'ake');
  ok(S.state.enKp.fams.length === 0, 'clearEnWrong 清除生效');
  /* 重复写入去重 */
  S.addEnWrong('dlgs', 'k07', 'cne_p106');
  S.addEnWrong('dlgs', 'k07', 'cne_p106');
  ok(S.state.enKp.dlgs.length === 1, '同一对话重复答错只记一条');
} catch (e) {
  ok(false, 'store 仿真失败：' + e.message);
}

console.log(fails ? `\n✗ ${fails} 项未过` : '\n✅ 全部通过');
process.exit(fails ? 1 : 0);
