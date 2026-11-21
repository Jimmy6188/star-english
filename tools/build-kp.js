/* ============================================================
 * 星际求知号 - 知识点骨架生成脚本（开发用，不参与网页运行）
 *
 * 用途：从 cn-math-taxonomy 的快照裁出 js/data-kp.js
 * 用法：
 *   1) 在任意临时目录拉取快照（gh CLI 已登录）：
 *        gh api repos/xiaoyang111222/cn-math-taxonomy/commits/HEAD --jq .sha
 *        gh api repos/xiaoyang111222/cn-math-taxonomy/contents/data/topics.json \
 *          -H "Accept: application/vnd.github.raw" > topics.json
 *        gh api repos/xiaoyang111222/cn-math-taxonomy/contents/data/dependencies.json \
 *          -H "Accept: application/vnd.github.raw" > dependencies.json
 *   2) 生成（本脚本在仓库里，参数是快照目录）：
 *        node tools/build-kp.js <快照目录> [commit]
 *   3) 校验：node --check js/data-kp.js
 *
 * 许可：cn-math-taxonomy 为 CC BY-NC 4.0；本产物只保留知识点结构，
 *       题目全部由本项目自写，署名见 README。
 * ============================================================ */
const fs = require('fs');
const path = require('path');

const srcDir = process.argv[2];
const commit = process.argv[3] || 'unknown';
if (!srcDir) {
  console.error('用法：node tools/build-kp.js <含 topics.json / dependencies.json 的目录> [commit]');
  process.exit(1);
}

const read = f => JSON.parse(fs.readFileSync(path.join(srcDir, f), 'utf8'));
const topics = read('topics.json');
const deps = read('dependencies.json');

/* 只保留本应用需要的范围：数学 1–4、道法 1–4、语文 4、英语 3–4（外研三起，
 * 孩子三年级才开始学英语，按知识点挂不按单元挂，年级/册章是人教 PEP 口径仅供参考） */
const want = x =>
  (x.id.startsWith('cnm_p') && x.grade <= 4) ||
  (x.id.startsWith('cnd_p') && x.grade <= 4) ||
  (x.id.startsWith('cnc_p') && x.grade === 4) ||
  (x.id.startsWith('cne_p') && x.grade >= 3 && x.grade <= 4);

const nodes = topics.filter(want);
const ids = new Set(nodes.map(x => x.id));
const edges = deps.filter(e => ids.has(e.topicId) && ids.has(e.prerequisiteId));

const outNodes = {};
nodes.forEach(x => { outNodes[x.id] = [x.name, x.grade, x.semester, x.chapter, x.domain]; });
const outDeps = {};
edges.forEach(e => { (outDeps[e.topicId] = outDeps[e.topicId] || []).push([e.prerequisiteId, e.strength]); });

/* 道法：课 id → 知识点 id（按课名核对，不靠顺序；课名对不上就报错，防止上游改目录后静默错挂） */
const DAOFA_LESSON = [
  ['df1-1', '热爱班集体'], ['df1-2', '选举班委会'], ['df1-3', '协商决定班级事务'],
  ['df2-1', '我是独特的'], ['df2-2', '生命最宝贵'], ['df2-3', '自我保护，免受伤害'],
  ['df3-1', '神奇的世界'], ['df3-2', '别让它抢走太多'], ['df3-3', '安全文明上网'],
  ['df4-1', '购物有学问'], ['df4-2', '学会合理消费'], ['df4-3', '反对浪费']
];
const cndByName = {};
nodes.filter(x => x.id.startsWith('cnd_p')).forEach(x => { cndByName[x.name] = x.id; });
const kpLesson = {};
const badLesson = [];
DAOFA_LESSON.forEach(([lid, name]) => {
  if (cndByName[name]) kpLesson[lid] = cndByName[name];
  else badLesson.push(lid + ':' + name);
});
if (badLesson.length) {
  console.error('✗ 道法课名未匹配（上游可能改了目录）：', badLesson.join(', '));
  process.exit(1);
}

/* 语文：标题 → 知识点 id（四上/四下的古诗、词、文言文与同名阅读） */
const CN_TITLE = [
  ['暮江吟', 'cnc_p250'], ['题西林壁', 'cnc_p251'], ['雪梅', 'cnc_p252'],
  ['凉州词', 'cnc_p277'], ['出塞', 'cnc_p278'], ['夏日绝句', 'cnc_p279'],
  ['四时田园杂兴（其二十五）', 'cnc_p281'], ['宿新市徐公店', 'cnc_p282'], ['清平乐·村居', 'cnc_p283'],
  ['芙蓉楼送辛渐', 'cnc_p312'], ['塞下曲', 'cnc_p313'], ['墨梅', 'cnc_p314'],
  ['王戎不取道旁李', 'cnc_p272'], ['精卫填海', 'cnc_p257'],
  ['盘古开天地', 'cnc_p256'], ['女娲补天', 'cnc_p259']
];
const kpTitle = {};
const badTitle = [];
CN_TITLE.forEach(([name, id]) => {
  if (ids.has(id)) kpTitle[name] = id; else badTitle.push(name + ':' + id);
});
if (badTitle.length) {
  console.error('✗ 语文标题指向的知识点不存在（上游可能改了 id）：', badTitle.join(', '));
  process.exit(1);
}

/* 语文词语专项：选项里出现哪一组字，就挂到对应语文园地 */
const WORD_RULES = [
  { any: ['在', '再'], kp: 'cnc_p249' },
  { any: ['做', '作'], kp: 'cnc_p249' },
  { any: ['辨', '辩', '辫', '瓣'], kp: 'cnc_p248' },
  { any: ['幕', '慕', '暮', '墓'], kp: 'cnc_p293' },
  { any: ['清', '晴', '情', '请'], kp: 'cnc_p287' },
  { any: ['假', '散', '便', '发'], kp: 'cnc_p292' }
];

/* ---------- 英语挂点映射（孩子是外研版三起，上游是人教 PEP，按知识点挂不按单元） ---------- */

/* 拼读词族 id → 英语语音知识点：只挂拼写规律与点名称严格对应的（短元音 / 魔法 e）。
 * 其余词族（ee/ea/ay/ar/ch…）上游 3–4 年级没有对应语音点，不强挂、留空 */
const EN_FAM = {
  at: 'cne_p029', an: 'cne_p029', ap: 'cne_p029', and: 'cne_p029',   /* 短元音 a */
  ip: 'cne_p039', ill: 'cne_p039',                                   /* 短元音 i */
  og: 'cne_p043', op: 'cne_p043',                                    /* 短元音 o */
  ug: 'cne_p048', un: 'cne_p048', ump: 'cne_p048',                   /* 短元音 u */
  et: 'cne_p034', en: 'cne_p034', ell: 'cne_p034', est: 'cne_p034',  /* 短元音 e */
  ake: 'cne_p057',                                                   /* a-e */
  ide: 'cne_p062',                                                   /* i-e */
  oke: 'cne_p066'                                                    /* o-e */
};

/* 句子默写：按句首句式把整句挂到英语语法/日常表达知识点。
 * 规则按顺序匹配，先具体后一般；没命中的句子不挂（宁缺毋滥） */
const EN_SENT = [
  { re: "^This is |^That is ", kp: 'cne_p014' },                       /* This is 与 That is */
  { re: "^Who is ", kp: 'cne_p036' },                                  /* Who is 询问是谁 */
  { re: "^I am from |^She is from |^He is from |^We are from |^They are from ", kp: 'cne_p031' }, /* 说明来自哪里 */
  { re: "^It's time to ", kp: 'cne_p248' },                            /* It's time to 该做什么 */
  { re: "^What time ", kp: 'cne_p089' },                               /* What time is it */
  { re: "^How much ", kp: 'cne_p105' },                                /* How much 询问价格 */
  { re: "^How many ", kp: 'cne_p026' },                                /* How many 问数量 */
  { re: "^Whose ", kp: 'cne_p101' },                                   /* Whose 与名词所有格 */
  { re: "^These are |^Those are ", kp: 'cne_p097' },                   /* These are 与 Those are */
  { re: "^There (is|are) ", kp: 'cne_p253' },                          /* There be */
  { re: "^Let's ", kp: 'cne_p059' },                                   /* Let's 建议句 */
  { re: "^Do you like ", kp: 'cne_p051' },                             /* Do you like 一般疑问句 */
  { re: "^I like |^I love |^I don't like ", kp: 'cne_p021' },          /* I like 表达喜好 */
  { re: "\\bmust(n't)?\\b", kp: 'cne_p246' },                          /* must 与 mustn't 说规则 */
  { re: "\\bhave to\\b", kp: 'cne_p199' },                             /* 家规：have to */
  { re: "\\bwill\\b", kp: 'cne_p255' },                                /* 用 will 说打算 */
  { re: "^(Drink|Eat|Go|Come|Look|Listen|Open|Close|Put|Clean|Wash|Brush|Read|Write|Help|Wait|Stop|Have|Take|Sit|Stand|Give|Show|Tell|Ask|Play|Run|Jump|Sing|Draw|Point|Touch|Be)\\b", kp: 'cne_p152' }, /* 祈使句 */
  { re: "^I am ", kp: 'cne_p006' }                                     /* be 动词 am（放最后兜底） */
];

/* KET 补全对话 id → 英语知识点：只挂对话核心语言与点内容对得上的（按 id 逐段核对过台词） */
const EN_KET = {
  k02: 'cne_p021',   /* I love drawing → I like 表达喜好 */
  k03: 'cne_p046',   /* Is there a noodle shop near here → 询问位置 */
  k04: 'cne_p256',   /* Shall we ride bikes on Saturday → 讨论周末计划 */
  k05: 'cne_p094',   /* it will rain / fly a kite → 谈论天气并给建议 */
  k06: 'cne_p017',   /* What animals do you like best → 动物 */
  k07: 'cne_p106',   /* Can I help you / What size → 在商店购物 */
  k08: 'cne_p086',   /* Go straight and turn right → 问路 */
  k10: 'cne_p101',   /* Whose dictionary is this → Whose 与名词所有格 */
  k14: 'cne_p210',   /* help with the housework → 帮忙做家务 */
  k23: 'cne_p078',   /* What would you like → Would you like 用餐 */
  k24: 'cne_p256',   /* Shall we go together on Sunday → 讨论周末计划 */
  k26: 'cne_p246',   /* You must give it back → must 说规则 */
  k29: 'cne_p086',   /* how can I get to the train station → 问路 */
  k32: 'cne_p255',   /* What will you take → 用 will 说打算 */
  k33: 'cne_p078',   /* What would you like → Would you like 用餐 */
  k36: 'cne_p210',   /* help with the housework → 帮忙做家务 */
  k40: 'cne_p255'    /* Our class will plant trees → 用 will 说打算 */
};

/* 校验：英语挂点里的 cne id 必须都在裁剪出的节点里 */
const enKps = [...Object.values(EN_FAM), ...EN_SENT.map(r => r.kp), ...Object.values(EN_KET)];
const badEn = [...new Set(enKps)].filter(id => !ids.has(id));
if (badEn.length) {
  console.error('✗ 英语挂点指向不存在的知识点（上游可能改了 id）：', badEn.join(', '));
  process.exit(1);
}
/* 校验：KET 对话 id 必须真实存在于 data-ket.js（防对话改 id 后静默错挂） */
const ketSrc = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'data-ket.js'), 'utf8');
const ketIds = new Set([...ketSrc.matchAll(/id:\s*'k(\d+)'/g)].map(m => 'k' + m[1]));
const badDlg = Object.keys(EN_KET).filter(id => !ketIds.has(id));
if (badDlg.length) {
  console.error('✗ KET 对话挂点指向不存在的对话：', badDlg.join(', '));
  process.exit(1);
}

const js = `/* ============================================================
 * 星际求知号 - 知识点骨架（v42）
 * 数据来源：xiaoyang111222/cn-math-taxonomy（CC BY-NC 4.0）
 *   仓库：https://github.com/xiaoyang111222/cn-math-taxonomy
 *   快照：commit ${commit}，抓取 ${new Date().toISOString().slice(0, 10)}
 * 包含：小学数学 1–4 年级、小学道法 1–4 年级、小学语文 4 年级、
 *       英语 3–4 年级（外研三起按知识点挂，年级/册章是人教 PEP 口径）
 *       ${nodes.length} 个知识点、${edges.length} 条先修边（hard=硬门槛 / soft=有帮助）
 * 修改：只保留 id/名称/年级/册/章/领域 与先修边；题目全部由本项目自写
 * 由 tools/build-kp.js 生成，请勿手改
 * ============================================================ */

const KP_META = ${JSON.stringify({
  source: 'xiaoyang111222/cn-math-taxonomy',
  url: 'https://github.com/xiaoyang111222/cn-math-taxonomy',
  commit,
  fetched: new Date().toISOString().slice(0, 10),
  license: 'CC BY-NC 4.0',
  scope: '小学数学1-4年级、小学道法1-4年级、小学语文4年级、英语3-4年级',
  note: '只保留知识点结构；题目全部由本项目自写'
})};

/* id: [名称, 年级, 学期, 册章, 领域] —— 年级/册章是人教口径，北师大版单元顺序不同，按知识点看 */
const KP_NODES = ${JSON.stringify(outNodes)};

/* id: [[先修 id, 'hard'|'soft'], ...] —— 含义是"学它之前需要先会" */
const KP_DEPS = ${JSON.stringify(outDeps)};

/* 道法课 id → 知识点 id */
const KP_LESSON = ${JSON.stringify(kpLesson)};

/* 语文标题 → 知识点 id */
const KP_TITLE = ${JSON.stringify(kpTitle)};

/* 词语专项：选项里出现这些字，就挂到对应语文园地 */
const KP_WORD_RULES = ${JSON.stringify(WORD_RULES)};

/* 拼读词族 id → 英语语音知识点（只挂拼写规律与点名称严格对应的词族） */
const KP_EN_FAM = ${JSON.stringify(EN_FAM)};

/* 句子默写：句式正则（按顺序首个命中生效）→ 英语知识点 */
const KP_EN_SENT = ${JSON.stringify(EN_SENT)};

/* KET 补全对话 id → 英语知识点（逐段核对过台词） */
const KP_EN_KET = ${JSON.stringify(EN_KET)};

const KP = {
  meta: KP_META,
  nodes: KP_NODES,
  deps: KP_DEPS,
  get(id) {
    const r = this.nodes[id];
    return r ? { id, name: r[0], grade: r[1], semester: r[2], chapter: r[3], domain: r[4] } : null;
  },
  name(id) { const r = this.nodes[id]; return r ? r[0] : ''; },
  /* 先修列表：hardOnly=true 只要硬门槛；默认 hard 在前 */
  prereqs(id, hardOnly) {
    const list = (this.deps[id] || []).slice().sort((a, b) => (a[1] === 'hard' ? 0 : 1) - (b[1] === 'hard' ? 0 : 1));
    return list.filter(x => !hardOnly || x[1] === 'hard')
      .map(x => { const n = this.get(x[0]); return n ? Object.assign({ strength: x[1] }, n) : null; })
      .filter(Boolean);
  },
  /* 错题池汇总：输入若干个 [{kp}] 数组，返回按错题数排序的知识点 */
  weak(pools, limit) {
    const cnt = {};
    (pools || []).forEach(list => (list || []).forEach(x => {
      if (!x || !x.kp || !this.get(x.kp)) return;
      const rec = cnt[x.kp] || (cnt[x.kp] = { id: x.kp, n: 0 });
      rec.n++;
    }));
    return Object.keys(cnt).map(k => cnt[k])
      .sort((a, b) => b.n - a.n || this.get(a.id).grade - this.get(b.id).grade)
      .slice(0, limit || 99);
  }
};

/* ---------- 静态内容挂点（data-kp.js 必须在 data-chinese.js 之后加载） ---------- */
(function tagStaticContent() {
  const tagTitle = obj => { if (obj && !obj.kp && KP_TITLE[obj.title]) obj.kp = KP_TITLE[obj.title]; };
  if (typeof CN_POEMS !== 'undefined') CN_POEMS.forEach(tagTitle);
  if (typeof CN_POEMS_NEXT !== 'undefined') CN_POEMS_NEXT.forEach(tagTitle);
  if (typeof CN_GUWEN !== 'undefined') CN_GUWEN.forEach(tagTitle);
  if (typeof CN_READINGS !== 'undefined') CN_READINGS.forEach(tagTitle);
  if (typeof CN_TRAPS !== 'undefined') {
    CN_TRAPS.forEach(q => {
      if (!q.opts) return;
      const hit = KP_WORD_RULES.find(r => r.any.every(ch => q.opts.includes(ch)));
      if (hit) q.kp = hit.kp;
    });
  }
  if (typeof CN_WORDFIT !== 'undefined') {
    CN_WORDFIT.forEach(q => {
      if (!q.opts) return;
      const hit = KP_WORD_RULES.find(r => r.any.every(ch => q.opts.includes(ch)));
      if (hit) q.kp = hit.kp;
    });
  }
})();
`;

const out = path.resolve(__dirname, '..', 'js', 'data-kp.js');
fs.writeFileSync(out, js, 'utf8');
console.log(`✓ 生成 ${out}`);
console.log(`  知识点 ${nodes.length}（数学 ${nodes.filter(x => x.id.startsWith('cnm_')).length} / 道法 ${nodes.filter(x => x.id.startsWith('cnd_')).length} / 语文 ${nodes.filter(x => x.id.startsWith('cnc_')).length} / 英语 ${nodes.filter(x => x.id.startsWith('cne_')).length}）`);
console.log(`  先修边 ${edges.length}（英语 ${edges.filter(e => e.topicId.startsWith('cne_')).length}）· 道法课映射 ${Object.keys(kpLesson).length} · 语文标题映射 ${Object.keys(kpTitle).length} · 拼读词族 ${Object.keys(EN_FAM).length} · 句式规则 ${EN_SENT.length} · KET对话 ${Object.keys(EN_KET).length}`);
console.log(`  字节 ${Buffer.byteLength(js)}`);