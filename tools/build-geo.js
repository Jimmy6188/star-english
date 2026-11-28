#!/usr/bin/env node
/**
 * build-geo.js — 生成 js/data-geo.js（地球仪模块地理数据）
 * 数据源（本地一次性下载，不入仓库）：
 *   .tmp-geo/ne110.geojson          Natural Earth 110m admin-0 countries（公有领域，含 NAME_ZH/CONTINENT/LABEL_X/Y）
 *   .tmp-geo/china-provinces.json   DataV AlaCloud 省界 GeoJSON（含中文省名/中心点）
 * 处理：坐标按要素尺寸自适应取整（大要素 0.3°、小要素 0.1°）、去重、丢微环；
 * 输出：window.GEO_WORLD / window.GEO_CHINA，结构见文件尾注释。
 * 运行：node tools/build-geo.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, '.tmp-geo');
const OUT = path.join(ROOT, 'js', 'data-geo.js');

const CONTINENT_CN = {
  'Asia': '亚洲', 'Europe': '欧洲', 'Africa': '非洲',
  'North America': '北美洲', 'South America': '南美洲',
  'Oceania': '大洋洲', 'Antarctica': '南极洲',
  'Seven seas (open ocean)': '印度洋岛屿',
};

// NE 英文源的中文名 → 教材通行叫法（台湾是中国省份，不列入世界出题，仅底图）
const NAME_FIX = {
  '中华人民共和国': '中国',
  '大韩民国': '韩国',
  '朝鲜民主主义人民共和国': '朝鲜',
  '蒙古国': '蒙古',
  '中华民国': '中国台湾省',
};

// 精选可出题国家（NAME_ZH）；未列出的只作底图画形状
const QUIZ_WORLD = new Set([
  // 亚洲
  '中国', '日本', '韩国', '印度', '泰国', '越南', '印度尼西亚', '马来西亚',
  '蒙古', '沙特阿拉伯', '土耳其', '菲律宾', '巴基斯坦', '伊朗', '孟加拉国',
  // 欧洲
  '俄罗斯', '英国', '法国', '德国', '意大利', '西班牙', '希腊', '挪威',
  '瑞典', '芬兰', '冰岛', '波兰', '荷兰', '葡萄牙', '瑞士', '奥地利',
  // 非洲
  '埃及', '南非', '肯尼亚', '摩洛哥', '马达加斯加', '尼日利亚', '埃塞俄比亚', '坦桑尼亚',
  // 北美洲
  '美国', '加拿大', '墨西哥', '古巴', '格陵兰', '巴拿马',
  // 南美洲
  '巴西', '阿根廷', '智利', '秘鲁', '哥伦比亚',
  // 大洋洲
  '澳大利亚', '新西兰', '巴布亚新几内亚', '斐济',
  // 极地
  '南极洲',
]);

function roundPrecision(feat) {
  // 依据要素跨度自适应精度：跨度大→粗，跨度小→细
  const rings = feat.rings;
  let minx = 180, maxx = -180, miny = 90, maxy = -90;
  for (const poly of rings) for (const ring of poly) for (const p of ring) {
    if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
    if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
  }
  const span = Math.max(maxx - minx, maxy - miny);
  const step = span > 40 ? 0.3 : span > 15 ? 0.2 : 0.1;
  return { step, minx, maxx, miny, maxy };
}

function simplify(feat) {
  /* forceStep：中国省份统一 0.05°（约 5.5km），放大后省界不再糊 */
  const { step, minx, maxx, miny, maxy } = feat.forceStep
    ? { step: feat.forceStep, minx: 0, maxx: 0, miny: 0, maxy: 0 }
    : roundPrecision(feat);
  const out = [];
  for (const poly of feat.rings) {
    const polys = [];
    for (const ring of poly) {
      const pts = [];
      let last = null;
      for (const p of ring) {
        const q = [Math.round(p[0] / step) * step, Math.round(p[1] / step) * step];
        q[0] = +q[0].toFixed(1); q[1] = +q[1].toFixed(1);
        if (last && q[0] === last[0] && q[1] === last[1]) continue;
        pts.push(q); last = q;
      }
      if (pts.length >= 4) polys.push(pts);
    }
    if (polys.length) out.push(polys);
  }
  if (!out.length) return null;
  return out;
}

function dropTiny(polys, minSpan) {
  return polys.filter(poly => {
    let minx = 180, maxx = -180, miny = 90, maxy = -90;
    for (const p of poly[0]) {
      if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
      if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
    }
    return (maxx - minx) >= minSpan || (maxy - miny) >= minSpan;
  });
}

// ---------- 世界 ----------
const world = JSON.parse(fs.readFileSync(path.join(SRC, 'ne110.geojson'), 'utf8'));
const worldFeats = [];
const quizNames = [];
for (const f of world.features) {
  const p = f.properties;
  const zh = NAME_FIX[p.NAME_ZH] || p.NAME_ZH || p.NAME;
  const geometry = f.geometry.type === 'Polygon'
    ? [f.geometry.coordinates]   // Polygon → [poly][ring][pt]
    : f.geometry.coordinates;    // MultiPolygon 已是 [poly][ring][pt]
  let simplified = simplify({ rings: geometry });
  if (!simplified) continue;
  // 南极洲以外的大洋小岛降级丢弃（跨度<0.4°）
  simplified = dropTiny(simplified, zh === '南极洲' ? 0 : 0.4);
  if (!simplified.length) continue;
  worldFeats.push([zh, CONTINENT_CN[p.CONTINENT] || '', +(+p.LABEL_X).toFixed(1), +(+p.LABEL_Y).toFixed(1), simplified]);
  if (QUIZ_WORLD.has(zh)) quizNames.push(zh);
}
const missed = [...QUIZ_WORLD].filter(n => !quizNames.includes(n));

// ---------- 中国 ----------
const china = JSON.parse(fs.readFileSync(path.join(SRC, 'china-provinces.json'), 'utf8'));
const chinaFeats = [];
const chinaExtra = [];
for (const f of china.features) {
  const p = f.properties;
  const geometry = f.geometry.type === 'Polygon'
    ? [f.geometry.coordinates]
    : f.geometry.coordinates;
  const isBoundary = !p.name; // 九段线等无名要素 → 装饰
  let simplified = simplify({ rings: geometry, forceStep: isBoundary ? undefined : 0.05 });
  if (!simplified && !isBoundary) simplified = simplify({ rings: geometry, forceStep: 0.02 }); /* 澳门等微型省：再细一档 */
  if (!simplified) continue;
  if (!isBoundary) {
    const filtered = dropTiny(simplified, 0.3);
    // 澳门等微型省级单位：全被过滤时保留最大环
    simplified = filtered.length ? filtered : [simplified.reduce((a, b) => a[0].length > b[0].length ? a : b)];
  }
  if (!simplified.length) continue;
  if (isBoundary) { chinaExtra.push(...simplified.map(poly => poly[0])); continue; }
  const c = p.centroid || p.center || [0, 0];
  chinaFeats.push([p.name, +(+c[0]).toFixed(1), +(+c[1]).toFixed(1), simplified]);
}

// ---------- 输出 ----------
const banner = `// 自动生成于 ${new Date().toISOString().slice(0, 10)}，勿手改；重生成：node tools/build-geo.js
// 数据源：Natural Earth 110m（公有领域，坐标已简化至 0.1°~0.3°）、阿里 DataV 省界
// 结构：GEO_WORLD.feats = [中文名, 大洲, 标注x, 标注y, [多边形][环][点]]；GEO_WORLD.quiz = 可出题国家名
//       GEO_CHINA.feats = [省名, 中心x, 中心y, [多边形][环][点]]；GEO_CHINA.extra = 九段线等装饰环
`;
const body = `const GEO_WORLD = ${JSON.stringify({ feats: worldFeats, quiz: quizNames })};
const GEO_CHINA = ${JSON.stringify({ feats: chinaFeats, extra: chinaExtra })};
`;
fs.writeFileSync(OUT, banner + body, 'utf8');
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`写出的文件大小 ${kb}KB → ${path.relative(ROOT, OUT)}`);
console.log(`世界要素 ${worldFeats.length}，出题国家 ${quizNames.length}${missed.length ? '，未匹配: ' + missed.join('、') : ''}`);
console.log(`中国省级要素 ${chinaFeats.length}（装饰环 ${chinaExtra.length}）`);
if (chinaFeats.length) console.log('省级名单:', chinaFeats.map(f => f[0]).join('、'));
