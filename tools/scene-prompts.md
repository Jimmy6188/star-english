# 场景词卡 · 插画生产指南（P1-C）

> **2026-11-21 更新：12 张插画已全部生成完毕**（Agnes Image 2.5 Flash，存于
> `assets/scenes/sc01.jpg … sc12.jpg`，65-190KB 均达标，标签坐标已按实际图校准）。
> 重产单张 / 换风格用一键脚本：
>
> ```bash
> python tools/gen-scene-images.py                # 只产缺失的
> python tools/gen-scene-images.py --force        # 全部重产
> python tools/gen-scene-images.py --only sc07    # 只重产某张
> ```
>
> 前置：`~/.claude/skills/agnes-image/.env` 里有 AGNES_API_KEY（模型
> agnes-image-2.5-flash，1K/16:9，自动转 JPG 并压到 ≤250KB）。
>
> 原始生产方法（其他图像模型也可用）保留如下。

---

> 思路来自 words-flashcard 的分层理念：**AI 只画无文字的场景插画**，单词、
> 释义等教学文字由网页的 HTML 标签层确定性渲染（不会出现 AI 写错字）。
> 图片**不限定**用哪个模型/工具生成——豆包、千问、即梦、DALL·E、SD 都可以。

## 使用方法

1. 用下面的 prompt 逐个生成 12 张图（每个场景一段）。
2. 按命名存为 JPG：`assets/scenes/sc01.jpg` … `sc12.jpg`（建议 1600×900 横图，单张 ≤ 250KB，
   过大用工具压一压）。
3. 放好后刷新页面即自动生效（`data-scene.js` 里已写好 `img` 路径），emoji 占位自动隐藏。
4. 如果某张图的物体位置和标签对不上：不用重画，改 `js/data-scene.js` 里对应词的
   `x / y` 百分比坐标即可（标签跟随坐标）。

## 统一风格前缀（每段 prompt 开头都带上）

```
Flat children's picture book illustration, bright cheerful colors, soft rounded shapes,
daylight, clean composition, ABSOLUTELY NO TEXT, no letters, no words, no labels, no signs.
```

中文模型（豆包/千问）可用：

```
儿童绘本扁平插画风格，色彩明快，造型圆润可爱，白天，画面干净。
【重要】画面中绝对不要出现任何文字、字母、单词、标签、招牌。
```

## 12 个场景 prompt

物体清单与画面布局建议来自 `js/data-scene.js` 的标签坐标（物体所在的大致方位写在括号里，
生成时不必精确对位，事后可挪标签）。

### sc01 动物农场（绿草地）
```
A cheerful farm meadow with green grass and a small pond. A cat, a dog, a rabbit and a horse
standing on the grass (lower area), a little bird flying in the sky (upper left), a fish
jumping out of the pond (lower right). No text.
```
中文：`绿草地农场，草地上有猫、狗、兔子、马（画面下半），天上飞一只小鸟（左上），池塘里跳出一条鱼（右下）。`

### sc02 水果篮（木桌果摊）
```
A wooden table with fresh fruits: an apple, a banana, an orange, a pear and a mango arranged
on the table (lower area), a bunch of purple grapes hanging above (upper left). Warm kitchen
background. No text.
```
中文：`木桌上摆着苹果、香蕉、橙子、梨、芒果（下半），上方挂一串紫葡萄（左上），温暖厨房背景。`

### sc03 书桌文具（学习桌）
```
A study desk seen from the front: an open book, a pencil, a ruler, an eraser and a pen lying
on the desk (lower area), a school backpack leaning against the desk (upper left). No text.
```
中文：`学习书桌，桌上摊开的书、铅笔、尺子、橡皮、钢笔（下半），一个书包靠在桌边（左上）。`

### sc04 我的衣柜（衣柜内部）
```
An open wooden wardrobe: a shirt, a dress, a coat and a sweater hanging on hangers (upper
row), a pair of trousers and a hat on the shelf below (lower area). Cozy bedroom light. No text.
```
中文：`打开的木头衣柜，上排挂着衬衫、连衣裙、外套、毛衣，下层格子里放一条长裤和一顶帽子。`

### sc05 天气窗（一扇大窗外）
```
A big window showing the sky with different weather at once: bright sun (upper left), a white
cloud (upper center), falling rain (upper right), a thunderstorm (far upper right), snowflakes
drifting (lower left), and swirling wind lines (lower right). No text.
```
中文：`一扇大窗外的天空同时出现：太阳（左上）、白云（中上）、雨（右上）、雷暴（最右上）、雪花（左下）、风（右下）。`

### sc06 我的房间（温馨卧室）
```
A cozy children's bedroom: a bed (lower left), a sofa (lower center), an open door (lower
right), a window on the wall (upper center), a wall clock (upper left) and a table lamp on a
nightstand (upper right). No text.
```
中文：`温馨儿童卧室：床（左下）、沙发（中下）、开着的门（右下）、墙上的窗（中上）、挂钟（左上）、床头灯（右上）。`

### sc07 职业小镇（小镇街道）
```
A friendly little town street with six working people: a doctor with a first-aid kit (upper
left), a teacher with a book (upper center), a farmer with a straw hat holding vegetables
(upper right), a nurse (lower left), a taxi driver standing by a small taxi (lower center),
and a police officer (lower right). No text.
```
中文：`友好小镇街上有六位工作者：拿急救箱的医生（上左）、拿书的老师（上中）、戴草帽拿蔬菜的农民（上右）、护士（下左）、站在小车旁的司机（下中）、警察（下右）。`

### sc08 餐桌晚餐（餐桌）
```
A family dinner table: a birthday cake in the middle (upper center), and on the table a bowl
of rice, a fried egg, a glass of milk, a glass of juice and a loaf of bread (lower row). No text.
```
中文：`家庭餐桌：中间一个蛋糕（中上），桌上一碗米饭、一个煎蛋、一杯牛奶、一杯果汁、一个面包（下排）。`

### sc09 玩具角（游戏房角落）
```
A cozy playroom corner: a kite flying near the ceiling (upper left), a gift box on a shelf
(upper right), and on the floor a ball, a teddy bear toy, a Russian doll and a toy robot
(lower row). No text.
```
中文：`游戏房角落：风筝飘在近天花板处（左上），架子上一个礼物盒（右上），地板上球、泰迪熊玩具、套娃、玩具机器人（下排）。`

### sc10 全家福（客厅合影）
```
A warm family photo scene in a living room: grandfather and grandmother sitting on a sofa
(upper row, left and center), father and mother standing behind them (upper row, right and
far right), a little boy and a little girl playing on the carpet in front (lower row). No text.
```
中文：`客厅全家福：爷爷奶奶坐在沙发上（上排左/中），爸爸妈妈站在身后（上排右），小男孩和小女孩在地毯上玩（下排）。`

### sc11 彩色气球（派对）
```
Five balloons of different colors floating in a bright room: red, blue, yellow, green and
pink balloons in a row near the ceiling (upper row), one black balloon lower down (lower
center). Party decorations in background. No text, no numbers.
```
中文：`明亮房间里飘着五只气球：红、蓝、黄、绿、粉（上排），下方一只黑色气球（中下）。`

### sc12 身体小侦探（可爱的机器人朋友）
```
A cute friendly robot standing in the center, big and clear, with clearly visible eyes, ears,
nose, mouth, hands and feet, so each body part can be pointed at. Simple background. No text.
```
中文：`一个可爱的大机器人站在中央，眼睛、耳朵、鼻子、嘴巴、手、脚都清晰可见，方便逐个指认，背景简洁。`

## 常见问题

- **图里出现文字了**：重生成，或在 prompt 里加重"NO TEXT / 不要任何文字"。
- **物体位置对不上标签**：不重画，改 `js/data-scene.js` 的 `x / y`。
- **图太大**：压到 250KB 内（网页与 SW 预缓存更稳）。
- **想加场景/换词**：改 `tools/build-scene.js` 的 SCENES 配置，跑 `node tools/build-scene.js`，
  词必须在 KET 词库里（脚本会校验），并同步补一段上面的 prompt。
