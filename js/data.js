/* ============================================================
 * 星际求知号 - 词库数据
 * 覆盖 1~6 年级核心词汇 136 词，按主题分为 8 个星系
 * 字段: word 单词 | zh 中文 | emoji 图鉴贴纸 | ex 例句 | exZh 例句中文
 *       cat 星系id | grade 年级(1-6) | level 同年级内难度 1易-3难
 * 自定义词不设 grade，表示任何范围下都可学
 * ============================================================ */

const WORD_PACKS = [
  {
    id: 'school', name: '学校星系', emoji: '🏫', color: '#4fd1ff',
    desc: '教室里的学习用品',
    words: [
      { word: 'book',      zh: '书，书本', emoji: '📖', grade: 1, level: 1, ex: 'I read a book every day.',    exZh: '我每天读一本书。' },
      { word: 'pen',       zh: '钢笔，笔', emoji: '🖊️', grade: 1, level: 1, ex: 'This pen is new.',            exZh: '这支笔是新的。' },
      { word: 'pencil',    zh: '铅笔',     emoji: '✏️', grade: 1, level: 1, ex: 'Where is my pencil?',         exZh: '我的铅笔在哪里？' },
      { word: 'crayon',    zh: '蜡笔',     emoji: '🖍️', grade: 1, level: 2, ex: 'I draw with a crayon.',       exZh: '我用蜡笔画画。' },
      { word: 'door',      zh: '门',       emoji: '🚪', grade: 1, level: 1, ex: 'Close the door, please.',     exZh: '请关门。' },
      { word: 'ruler',     zh: '尺子',     emoji: '📏', grade: 2, level: 2, ex: 'Draw a line with the ruler.', exZh: '用尺子画一条线。' },
      { word: 'chair',     zh: '椅子',     emoji: '🪑', grade: 2, level: 2, ex: 'Sit on the chair, please.',   exZh: '请坐在椅子上。' },
      { word: 'window',    zh: '窗户',     emoji: '🪟', grade: 2, level: 2, ex: 'Look out of the window.',     exZh: '看窗外。' },
      { word: 'clock',     zh: '时钟',     emoji: '🕐', grade: 3, level: 2, ex: 'The clock is on the wall.',   exZh: '时钟在墙上。' },
      { word: 'light',     zh: '灯，电灯', emoji: '💡', grade: 3, level: 2, ex: 'Turn on the light.',          exZh: '打开灯。' },
      { word: 'schoolbag', zh: '书包',     emoji: '🎒', grade: 3, level: 3, ex: 'My schoolbag is heavy.',      exZh: '我的书包很重。' },
      { word: 'classroom', zh: '教室',     emoji: '🏫', grade: 3, level: 3, ex: 'Our classroom is big.',       exZh: '我们的教室很大。' },
      { word: 'music',     zh: '音乐',     emoji: '🎵', grade: 4, level: 2, ex: 'I like music very much.',     exZh: '我非常喜欢音乐。' },
      { word: 'art',       zh: '美术，艺术', emoji: '🎨', grade: 4, level: 2, ex: 'We draw pictures in art class.', exZh: '我们在美术课上画画。' },
      { word: 'math',      zh: '数学',     emoji: '➗', grade: 4, level: 2, ex: 'Math is fun for me.',         exZh: '数学对我来说很有趣。' },
      { word: 'english',   zh: '英语',     emoji: '🔤', grade: 4, level: 3, ex: 'We speak English in class.',  exZh: '我们在课堂上讲英语。' },
      { word: 'science',   zh: '科学',     emoji: '🔬', grade: 5, level: 3, ex: 'Science is interesting.',     exZh: '科学很有意思。' },
      { word: 'dictionary', zh: '词典',    emoji: '📕', grade: 6, level: 3, ex: 'Look it up in the dictionary.', exZh: '去词典里查一查。' }
    ]
  },
  {
    id: 'animal', name: '动物星系', emoji: '🐾', color: '#58e08a',
    desc: '可爱的动物朋友们',
    words: [
      { word: 'cat',      zh: '猫',   emoji: '🐱', grade: 1, level: 1, ex: 'The cat is sleeping.',          exZh: '猫在睡觉。' },
      { word: 'dog',      zh: '狗',   emoji: '🐶', grade: 1, level: 1, ex: 'I have a little dog.',          exZh: '我有一只小狗。' },
      { word: 'bird',     zh: '鸟',   emoji: '🐦', grade: 1, level: 1, ex: 'The bird can fly.',             exZh: '鸟会飞。' },
      { word: 'fish',     zh: '鱼',   emoji: '🐟', grade: 1, level: 1, ex: 'Fish live in water.',           exZh: '鱼生活在水里。' },
      { word: 'duck',     zh: '鸭子', emoji: '🦆', grade: 1, level: 1, ex: 'The duck is swimming.',         exZh: '鸭子在游泳。' },
      { word: 'pig',      zh: '猪',   emoji: '🐷', grade: 1, level: 1, ex: 'The pig is fat.',               exZh: '猪很胖。' },
      { word: 'bee',      zh: '蜜蜂', emoji: '🐝', grade: 2, level: 2, ex: 'The bee can make honey.',       exZh: '蜜蜂会酿蜜。' },
      { word: 'frog',     zh: '青蛙', emoji: '🐸', grade: 2, level: 2, ex: 'The frog can jump.',            exZh: '青蛙会跳。' },
      { word: 'mouse',    zh: '老鼠', emoji: '🐭', grade: 2, level: 2, ex: 'The mouse is small.',           exZh: '老鼠很小。' },
      { word: 'cow',      zh: '奶牛', emoji: '🐮', grade: 2, level: 2, ex: 'The cow gives us milk.',        exZh: '奶牛给我们牛奶。' },
      { word: 'horse',    zh: '马',   emoji: '🐴', grade: 2, level: 2, ex: 'The horse runs fast.',          exZh: '马跑得很快。' },
      { word: 'rabbit',   zh: '兔子', emoji: '🐰', grade: 2, level: 2, ex: 'The rabbit likes carrots.',     exZh: '兔子喜欢胡萝卜。' },
      { word: 'panda',    zh: '熊猫', emoji: '🐼', grade: 2, level: 2, ex: 'The panda is black and white.', exZh: '熊猫是黑白色的。' },
      { word: 'monkey',   zh: '猴子', emoji: '🐵', grade: 2, level: 2, ex: 'The monkey can climb trees.',   exZh: '猴子会爬树。' },
      { word: 'tiger',    zh: '老虎', emoji: '🐯', grade: 3, level: 2, ex: 'The tiger is strong.',          exZh: '老虎很强壮。' },
      { word: 'lion',     zh: '狮子', emoji: '🦁', grade: 3, level: 2, ex: 'The lion is the king.',         exZh: '狮子是百兽之王。' },
      { word: 'sheep',    zh: '绵羊', emoji: '🐑', grade: 3, level: 2, ex: 'The sheep has soft wool.',      exZh: '绵羊有软软的毛。' },
      { word: 'elephant', zh: '大象', emoji: '🐘', grade: 3, level: 3, ex: 'The elephant has a long nose.', exZh: '大象有长鼻子。' },
      { word: 'snake',    zh: '蛇',   emoji: '🐍', grade: 4, level: 2, ex: 'The snake has no legs.',        exZh: '蛇没有腿。' },
      { word: 'turtle',   zh: '海龟', emoji: '🐢', grade: 4, level: 2, ex: 'The turtle walks slowly.',      exZh: '海龟走得很慢。' },
      { word: 'penguin',  zh: '企鹅', emoji: '🐧', grade: 4, level: 2, ex: 'The penguin lives in cold places.', exZh: '企鹅住在寒冷的地方。' },
      { word: 'butterfly', zh: '蝴蝶', emoji: '🦋', grade: 4, level: 3, ex: 'The butterfly is beautiful.', exZh: '蝴蝶很漂亮。' },
      { word: 'shark',    zh: '鲨鱼', emoji: '🦈', grade: 5, level: 3, ex: 'The shark swims very fast.',    exZh: '鲨鱼游得非常快。' },
      { word: 'whale',    zh: '鲸鱼', emoji: '🐳', grade: 5, level: 3, ex: 'The whale is very big.',        exZh: '鲸鱼非常大。' },
      { word: 'dolphin',  zh: '海豚', emoji: '🐬', grade: 5, level: 3, ex: 'The dolphin is smart.',         exZh: '海豚很聪明。' },
      { word: 'wolf',     zh: '狼',   emoji: '🐺', grade: 5, level: 3, ex: 'Wolves live together.',         exZh: '狼群居生活。' },
      { word: 'owl',      zh: '猫头鹰', emoji: '🦉', grade: 5, level: 3, ex: 'The owl sleeps in the day.', exZh: '猫头鹰白天睡觉。' }
    ]
  },
  {
    id: 'food', name: '食物星系', emoji: '🍎', color: '#ffb35c',
    desc: '好吃的食物和水果',
    words: [
      { word: 'apple',   zh: '苹果', emoji: '🍎', grade: 1, level: 1, ex: 'The apple is sweet.',         exZh: '苹果很甜。' },
      { word: 'egg',     zh: '鸡蛋', emoji: '🥚', grade: 1, level: 1, ex: 'I eat an egg for breakfast.', exZh: '我早餐吃一个鸡蛋。' },
      { word: 'rice',    zh: '米饭', emoji: '🍚', grade: 1, level: 1, ex: 'We eat rice for lunch.',      exZh: '我们午餐吃米饭。' },
      { word: 'water',   zh: '水',   emoji: '💧', grade: 1, level: 1, ex: 'I drink water every day.',    exZh: '我每天喝水。' },
      { word: 'banana',  zh: '香蕉', emoji: '🍌', grade: 2, level: 2, ex: 'Monkeys like bananas.',       exZh: '猴子喜欢香蕉。' },
      { word: 'orange',  zh: '橙子，橘子', emoji: '🍊', grade: 2, level: 2, ex: 'This orange is sour.', exZh: '这个橙子很酸。' },
      { word: 'pear',    zh: '梨',   emoji: '🍐', grade: 2, level: 2, ex: 'I want a big pear.',          exZh: '我想要一个大梨。' },
      { word: 'milk',    zh: '牛奶', emoji: '🥛', grade: 2, level: 2, ex: 'Drink milk every day.',       exZh: '每天喝牛奶。' },
      { word: 'candy',   zh: '糖果', emoji: '🍬', grade: 2, level: 2, ex: 'The candy is sweet.',         exZh: '糖果很甜。' },
      { word: 'cake',    zh: '蛋糕', emoji: '🍰', grade: 3, level: 2, ex: 'The cake is yummy.',          exZh: '蛋糕很好吃。' },
      { word: 'bread',   zh: '面包', emoji: '🍞', grade: 3, level: 2, ex: 'I like bread and milk.',      exZh: '我喜欢面包和牛奶。' },
      { word: 'grape',   zh: '葡萄', emoji: '🍇', grade: 3, level: 2, ex: 'Grapes are purple.',          exZh: '葡萄是紫色的。' },
      { word: 'noodles', zh: '面条', emoji: '🍜', grade: 3, level: 3, ex: 'The noodles are hot.',        exZh: '面条很热。' },
      { word: 'juice',   zh: '果汁', emoji: '🧃', grade: 3, level: 2, ex: 'This juice is sweet.',        exZh: '这杯果汁很甜。' },
      { word: 'cookie',  zh: '曲奇，饼干', emoji: '🍪', grade: 3, level: 2, ex: 'Grandma makes cookies.', exZh: '奶奶做饼干。' },
      { word: 'tea',     zh: '茶',   emoji: '🍵', grade: 4, level: 2, ex: 'Grandpa drinks tea.',         exZh: '爷爷喝茶。' },
      { word: 'chicken', zh: '鸡肉', emoji: '🍗', grade: 4, level: 3, ex: 'I like chicken best.',        exZh: '我最喜欢鸡肉。' },
      { word: 'strawberry', zh: '草莓', emoji: '🍓', grade: 4, level: 3, ex: 'The strawberry is red.',  exZh: '草莓是红色的。' },
      { word: 'watermelon', zh: '西瓜', emoji: '🍉', grade: 4, level: 3, ex: 'The watermelon is big.',  exZh: '西瓜很大。' },
      { word: 'peach',   zh: '桃子', emoji: '🍑', grade: 4, level: 2, ex: 'The peach is soft.',          exZh: '桃子软软的。' },
      { word: 'hamburger', zh: '汉堡包', emoji: '🍔', grade: 4, level: 3, ex: 'The hamburger is yummy.', exZh: '汉堡包很好吃。' },
      { word: 'fries',   zh: '薯条', emoji: '🍟', grade: 4, level: 3, ex: 'The fries are hot.',          exZh: '薯条热腾腾的。' },
      { word: 'sandwich', zh: '三明治', emoji: '🥪', grade: 5, level: 3, ex: 'I make a sandwich for dad.', exZh: '我给爸爸做三明治。' }
    ]
  },
  {
    id: 'home', name: '家庭星系', emoji: '🏠', color: '#ff8fab',
    desc: '家人和家里的事物',
    words: [
      { word: 'home',    zh: '家', emoji: '🏠', grade: 1, level: 1, ex: 'Welcome to my home.',       exZh: '欢迎来我家。' },
      { word: 'father',  zh: '爸爸，父亲', emoji: '👨', grade: 2, level: 2, ex: 'My father is a doctor.', exZh: '我的爸爸是医生。' },
      { word: 'mother',  zh: '妈妈，母亲', emoji: '👩', grade: 2, level: 2, ex: 'My mother cooks well.',  exZh: '我妈妈做饭很好吃。' },
      { word: 'friend',  zh: '朋友', emoji: '🤝', grade: 2, level: 2, ex: 'We are good friends.',    exZh: '我们是好朋友。' },
      { word: 'bed',     zh: '床',   emoji: '🛏️', grade: 2, level: 1, ex: 'I go to bed at nine.',    exZh: '我九点上床睡觉。' },
      { word: 'tv',      zh: '电视', emoji: '📺', grade: 2, level: 2, ex: 'We watch TV at night.',   exZh: '我们晚上看电视。' },
      { word: 'brother', zh: '哥哥，弟弟', emoji: '👦', grade: 3, level: 2, ex: 'My brother is tall.',  exZh: '我的哥哥很高。' },
      { word: 'sister',  zh: '姐姐，妹妹', emoji: '👧', grade: 3, level: 2, ex: 'My sister is cute.',   exZh: '我的妹妹很可爱。' },
      { word: 'grandpa', zh: '爷爷，外公', emoji: '👴', grade: 3, level: 2, ex: 'Grandpa tells me stories.', exZh: '爷爷给我讲故事。' },
      { word: 'grandma', zh: '奶奶，外婆', emoji: '👵', grade: 3, level: 2, ex: 'Grandma makes nice cakes.', exZh: '奶奶做的蛋糕很好吃。' },
      { word: 'family',  zh: '家庭，家人', emoji: '👪', grade: 3, level: 2, ex: 'I love my family.',    exZh: '我爱我的家人。' },
      { word: 'key',     zh: '钥匙', emoji: '🔑', grade: 3, level: 2, ex: 'Where is the key?',        exZh: '钥匙在哪里？' },
      { word: 'phone',   zh: '电话，手机', emoji: '📱', grade: 3, level: 2, ex: 'The phone is ringing.', exZh: '电话响了。' },
      { word: 'sofa',    zh: '沙发', emoji: '🛋️', grade: 3, level: 2, ex: 'The cat is on the sofa.',  exZh: '猫在沙发上。' },
      { word: 'wall',    zh: '墙',   emoji: '🧱', grade: 4, level: 2, ex: 'The picture is on the wall.', exZh: '画在墙上。' }
    ]
  },
  {
    id: 'body', name: '身体星系', emoji: '🧒', color: '#c792ff',
    desc: '我们的身体部位',
    words: [
      { word: 'face',   zh: '脸，面孔', emoji: '😊', grade: 1, level: 1, ex: 'Wash your face, please.',     exZh: '请洗脸。' },
      { word: 'hand',   zh: '手',       emoji: '✋', grade: 1, level: 1, ex: 'Raise your hand, please.',    exZh: '请举手。' },
      { word: 'eye',    zh: '眼睛',     emoji: '👁️', grade: 2, level: 1, ex: 'I see with my eyes.',        exZh: '我用眼睛看。' },
      { word: 'ear',    zh: '耳朵',     emoji: '👂', grade: 2, level: 1, ex: 'I hear with my ears.',       exZh: '我用耳朵听。' },
      { word: 'nose',   zh: '鼻子',     emoji: '👃', grade: 2, level: 1, ex: 'The dog has a wet nose.',    exZh: '狗的鼻子湿湿的。' },
      { word: 'finger', zh: '手指',     emoji: '☝️', grade: 2, level: 2, ex: 'I have ten fingers.',        exZh: '我有十根手指。' },
      { word: 'mouth',  zh: '嘴，嘴巴', emoji: '👄', grade: 3, level: 2, ex: 'Open your mouth, please.',   exZh: '请张开嘴。' },
      { word: 'arm',    zh: '手臂',     emoji: '💪', grade: 3, level: 2, ex: 'My arms are strong.',        exZh: '我的手臂很强壮。' },
      { word: 'leg',    zh: '腿',       emoji: '🦵', grade: 3, level: 2, ex: 'I run with my legs.',        exZh: '我用腿跑步。' },
      { word: 'foot',   zh: '脚，足',   emoji: '🦶', grade: 3, level: 2, ex: 'My left foot hurts.',        exZh: '我的左脚疼。' },
      { word: 'tooth',  zh: '牙齿',     emoji: '🦷', grade: 4, level: 2, ex: 'Brush your teeth every day.', exZh: '每天刷牙。' },
      { word: 'hair',   zh: '头发',     emoji: '💇', grade: 4, level: 2, ex: 'She has long hair.',         exZh: '她有长头发。' },
      { word: 'heart',  zh: '心脏，心', emoji: '❤️', grade: 5, level: 3, ex: 'My heart is beating fast.',  exZh: '我的心跳得很快。' },
      { word: 'brain',  zh: '大脑',     emoji: '🧠', grade: 6, level: 3, ex: 'The brain is amazing.',      exZh: '大脑太神奇了。' }
    ]
  },
  {
    id: 'nature', name: '自然星系', emoji: '🌿', color: '#6ee7d5',
    desc: '天气和大自然',
    words: [
      { word: 'sun',      zh: '太阳', emoji: '☀️', grade: 1, level: 1, ex: 'The sun is bright today.',   exZh: '今天阳光很灿烂。' },
      { word: 'moon',     zh: '月亮', emoji: '🌙', grade: 1, level: 1, ex: 'The moon is round tonight.', exZh: '今晚的月亮很圆。' },
      { word: 'star',     zh: '星星', emoji: '⭐', grade: 1, level: 1, ex: 'I can see many stars.',      exZh: '我能看到很多星星。' },
      { word: 'cloud',    zh: '云，云朵', emoji: '☁️', grade: 2, level: 2, ex: 'The cloud is white.',   exZh: '云朵是白色的。' },
      { word: 'rain',     zh: '雨，下雨', emoji: '🌧️', grade: 2, level: 1, ex: 'The rain is heavy.',    exZh: '雨下得很大。' },
      { word: 'snow',     zh: '雪，下雪', emoji: '❄️', grade: 2, level: 1, ex: 'The snow is cold.',     exZh: '雪很冷。' },
      { word: 'tree',     zh: '树',   emoji: '🌳', grade: 2, level: 1, ex: 'The tree is tall.',          exZh: '这棵树很高。' },
      { word: 'grass',    zh: '草，草地', emoji: '🌱', grade: 2, level: 2, ex: 'The grass is green.',   exZh: '草是绿色的。' },
      { word: 'wind',     zh: '风',   emoji: '🌬️', grade: 3, level: 2, ex: 'The wind is strong today.',  exZh: '今天风很大。' },
      { word: 'flower',   zh: '花',   emoji: '🌸', grade: 3, level: 2, ex: 'The flower is beautiful.',   exZh: '这朵花很美。' },
      { word: 'sea',      zh: '大海', emoji: '🌊', grade: 3, level: 2, ex: 'The sea is blue.',           exZh: '大海是蓝色的。' },
      { word: 'sky',      zh: '天空', emoji: '🌤️', grade: 3, level: 2, ex: 'The sky is clear today.',    exZh: '今天天空很晴朗。' },
      { word: 'leaf',     zh: '叶子', emoji: '🍃', grade: 4, level: 2, ex: 'The leaf is green.',         exZh: '叶子是绿色的。' },
      { word: 'weather',  zh: '天气', emoji: '🌦️', grade: 4, level: 2, ex: 'The weather is nice today.', exZh: '今天天气很好。' },
      { word: 'mountain', zh: '山，高山', emoji: '⛰️', grade: 5, level: 3, ex: 'The mountain is very high.', exZh: '这座山非常高。' },
      { word: 'spring',   zh: '春天', emoji: '🌷', grade: 5, level: 2, ex: 'Flowers come out in spring.', exZh: '春天花儿开了。' },
      { word: 'summer',   zh: '夏天', emoji: '🏖️', grade: 5, level: 2, ex: 'I swim in summer.',          exZh: '我夏天游泳。' },
      { word: 'autumn',   zh: '秋天', emoji: '🍂', grade: 5, level: 2, ex: 'Leaves fall in autumn.',     exZh: '秋天叶子落了。' },
      { word: 'winter',   zh: '冬天', emoji: '⛄', grade: 5, level: 2, ex: 'It is cold in winter.',      exZh: '冬天很冷。' },
      { word: 'forest',   zh: '森林', emoji: '🌲', grade: 5, level: 3, ex: 'Birds live in the forest.',  exZh: '鸟儿住在森林里。' },
      { word: 'river',    zh: '河流', emoji: '🏞️', grade: 5, level: 3, ex: 'The river runs to the sea.', exZh: '河流奔向大海。' },
      { word: 'beach',    zh: '海滩', emoji: '🏝️', grade: 5, level: 3, ex: 'We play on the beach.',      exZh: '我们在海滩上玩。' },
      { word: 'island',   zh: '岛屿', emoji: '🌴', grade: 6, level: 3, ex: 'The island is far away.',    exZh: '那个岛很远。' }
    ]
  },
  {
    id: 'color', name: '色彩星系', emoji: '🌈', color: '#ff6bd6',
    desc: '五颜六色的世界',
    words: [
      { word: 'red',    zh: '红色', emoji: '🟥', grade: 1, level: 1, ex: 'The apple is red.',     exZh: '苹果是红色的。' },
      { word: 'blue',   zh: '蓝色', emoji: '🟦', grade: 1, level: 1, ex: 'The sky is blue.',      exZh: '天空是蓝色的。' },
      { word: 'black',  zh: '黑色', emoji: '⬛', grade: 1, level: 1, ex: 'The cat is black.',     exZh: '这只猫是黑色的。' },
      { word: 'white',  zh: '白色', emoji: '⬜', grade: 1, level: 1, ex: 'The snow is white.',    exZh: '雪是白色的。' },
      { word: 'yellow', zh: '黄色', emoji: '🟨', grade: 2, level: 2, ex: 'The banana is yellow.', exZh: '香蕉是黄色的。' },
      { word: 'green',  zh: '绿色', emoji: '🟩', grade: 2, level: 2, ex: 'The tree is green.',    exZh: '树是绿色的。' },
      { word: 'pink',   zh: '粉色', emoji: '💗', grade: 2, level: 2, ex: 'The pig is pink.',      exZh: '猪是粉色的。' },
      { word: 'purple', zh: '紫色', emoji: '🟪', grade: 3, level: 2, ex: 'The grape is purple.',  exZh: '葡萄是紫色的。' },
      { word: 'brown',  zh: '棕色', emoji: '🟤', grade: 3, level: 2, ex: 'The bear is brown.',    exZh: '熊是棕色的。' },
      { word: 'rainbow', zh: '彩虹', emoji: '🌈', grade: 4, level: 3, ex: 'Look at the rainbow!', exZh: '看那条彩虹！' },
      { word: 'gold',   zh: '金色', emoji: '🥇', grade: 5, level: 3, ex: 'The star is gold.',     exZh: '星星是金色的。' },
      { word: 'silver', zh: '银色', emoji: '🥈', grade: 6, level: 3, ex: 'The moon is silver.',   exZh: '月亮是银色的。' }
    ]
  },
  {
    id: 'number', name: '数字星系', emoji: '🔢', color: '#a0e7a0',
    desc: '一二三，数一数',
    words: [
      { word: 'one',   zh: '一', emoji: '1️⃣', grade: 1, level: 1, ex: 'I have one brother.',   exZh: '我有一个哥哥。' },
      { word: 'two',   zh: '二', emoji: '2️⃣', grade: 1, level: 1, ex: 'Two birds are singing.', exZh: '两只鸟在唱歌。' },
      { word: 'three', zh: '三', emoji: '3️⃣', grade: 1, level: 1, ex: 'Three cats are here.',  exZh: '三只猫在这里。' },
      { word: 'four',  zh: '四', emoji: '4️⃣', grade: 1, level: 1, ex: 'A table has four legs.', exZh: '桌子有四条腿。' },
      { word: 'five',  zh: '五', emoji: '5️⃣', grade: 1, level: 1, ex: 'Give me five!',         exZh: '来击个掌！' },
      { word: 'ten',   zh: '十', emoji: '🔟', grade: 1, level: 2, ex: 'I have ten fingers.',   exZh: '我有十根手指。' },
      { word: 'six',   zh: '六', emoji: '6️⃣', grade: 2, level: 2, ex: 'Six ducks swim away.',  exZh: '六只鸭子游走了。' },
      { word: 'seven', zh: '七', emoji: '7️⃣', grade: 2, level: 2, ex: 'Seven days make a week.', exZh: '一周有七天。' },
      { word: 'eight', zh: '八', emoji: '8️⃣', grade: 2, level: 2, ex: 'Eight legs on a spider.', exZh: '蜘蛛有八条腿。' },
      { word: 'nine',  zh: '九', emoji: '9️⃣', grade: 2, level: 2, ex: 'Nine stars in the sky.', exZh: '天上有九颗星星。' }
    ]
  }
];

/* 宠物进化阶段：累计喂养次数达到阈值即进化（金币经济：喂一次 20 金币，满级约需 2-3 周） */
const PET_STAGES = [
  { name: '探测球',   need: 0,  desc: '刚降落的小小探测器' },
  { name: '小机器人', need: 15, desc: '长出了机械臂的伙伴' },
  { name: '机甲伙伴', need: 60, desc: '展开太阳能翅膀，超酷！' }
];

/* 喂食价格（金币） */
const FEED_COST = 20;

/* 段位体系：按累计已学单词数晋升（解决"学有余力"的成长目标） */
const RANKS = [
  { name: '见习飞行员', need: 0,   reward: 0   },
  { name: '飞行员',     need: 15,  reward: 30  },
  { name: '精英飞行员', need: 40,  reward: 50  },
  { name: '王牌飞行员', need: 80,  reward: 80  },
  { name: '星际指挥官', need: 150, reward: 120 }
];

/* 教材词包：外研版（新标准三起）四年级上册（2024审定）
 * 结构：每个 Module 一个包；条目里 phrase:true 表示词组（用"词块排序"挑战）
 * 待录入：家长提供课本单词表照片后逐 Module 填入，教材包会优先出题
 * 示例：
 * {
 *   id: 'wy4a-m1', textbook: true, name: '四上 M1', emoji: '🧭', color: '#5eead4',
 *   words: [
 *     { word: 'straight', zh: '直地，直线地', emoji: '⬆️', grade: 4, level: 2, ex: '...', exZh: '...' },
 *     { word: 'go straight on', zh: '直着走', emoji: '🧭', phrase: true, grade: 4, level: 2, ex: '...', exZh: '...' }
 *   ]
 * }
 */
/* ============================================================
 * 教材同步词包：外研版新标准（三年级起点）四年级上册 · 2025秋版
 * 按课本 Unit 1~6 录入（教材词每轮新词优先出 2 个）
 * 不设 grade（跟随当前教材学习，不受词汇范围限制）；phrase: true 走组装舱
 * ============================================================ */
const TEXTBOOK_PACKS = [
  {
    id: 'tb4u1', name: '四上U1 · I love sports', emoji: '⚽', color: '#4fd1ff', textbook: true,
    desc: 'Unit 1 爱运动',
    words: [
      { word: 'sport', zh: '体育运动', emoji: '🏅', level: 1, ex: 'My favourite sport is ping-pong.', exZh: '我最喜欢的运动是乒乓球。' },
      { word: 'jump', zh: '跳', emoji: '🤸', level: 1, ex: 'The rabbit can jump high.', exZh: '兔子能跳得很高。' },
      { word: 'high', zh: '高的；高地', emoji: '⬆️', level: 1, ex: 'The bird flies high.', exZh: '鸟飞得很高。' },
      { word: 'far', zh: '远的；远地', emoji: '🛫', level: 1, ex: 'My school is not far.', exZh: '我的学校不远。' },
      { word: 'ping-pong', zh: '乒乓球运动', emoji: '🏓', level: 1, ex: 'We play ping-pong after school.', exZh: '放学后我们打乒乓球。' },
      { word: 'volleyball', zh: '排球（运动）', emoji: '🏐', level: 2, ex: 'They play volleyball on the beach.', exZh: '他们在沙滩上打排球。' },
      { word: 'across', zh: '穿过；越过', emoji: '🛤️', level: 2, ex: 'Go across the street.', exZh: '穿过马路。' },
      { word: 'hope', zh: '希望', emoji: '🤞', level: 2, ex: 'I hope you are happy.', exZh: '希望你开心。' },
      { word: 'lose', zh: '输掉；失去', emoji: '😤', level: 3, ex: 'I don\'t want to lose the game.', exZh: '我不想输掉比赛。' },
      { word: 'because', zh: '因为', emoji: '🤔', level: 2, ex: 'I like summer because I can swim.', exZh: '我喜欢夏天，因为能游泳。' },
      { word: 'because of', zh: '因为（某人/某事）', emoji: '❓', level: 2, phrase: true },
      { word: 'cancer', zh: '癌（症）', emoji: '🎗️', level: 3 },
      { word: 'money', zh: '钱', emoji: '💰', level: 1, ex: 'I have some money.', exZh: '我有一些钱。' },
      { word: 'hard', zh: '努力地；困难的', emoji: '💪', level: 2, ex: 'Try hard!', exZh: '努力干！' },
      { word: 'kind', zh: '友好的；善良的', emoji: '😊', level: 1, ex: 'She is kind to us.', exZh: '她对我们很友善。' },
      { word: 'keep', zh: '保持；继续', emoji: '⏳', level: 2, ex: 'Keep running!', exZh: '继续跑！' },
      { word: 'month', zh: '月；一个月', emoji: '📅', level: 2, ex: 'There are twelve months in a year.', exZh: '一年有十二个月。' },
      { word: 'ill', zh: '生病的', emoji: '🤒', level: 2, ex: 'He is ill today.', exZh: '他今天生病了。' },
      { word: 'year', zh: '年', emoji: '📆', level: 1, ex: 'This year I am in Grade 4.', exZh: '今年我上四年级。' },
      { word: 'remember', zh: '记得；纪念', emoji: '🧠', level: 2, ex: 'I remember your name.', exZh: '我记得你的名字。' },
      { word: 'fail', zh: '失败', emoji: '😞', level: 3, ex: 'Don\'t be afraid to fail.', exZh: '别怕失败。' },
      { word: 'give', zh: '给', emoji: '🎁', level: 2, ex: 'Please give me the book.', exZh: '请给我那本书。' },
      { word: 'give up', zh: '放弃', emoji: '🛑', level: 2, phrase: true, ex: 'Never give up!', exZh: '永不放弃！' },
      { word: 'never', zh: '决不；永不', emoji: '🚫', level: 2, ex: 'I never give up.', exZh: '我从不放弃。' },
      { word: 'try', zh: '努力；尝试', emoji: '💪', level: 2, ex: 'Let me try.', exZh: '让我试试。' },
      { word: 'try your best', zh: '尽最大努力', emoji: '🌟', level: 2, phrase: true, ex: 'Try your best!', exZh: '尽你最大的努力！' },
      { word: 'star', zh: '明星；最出色者', emoji: '⭐', level: 1, ex: 'She is a star player.', exZh: '她是明星球员。' },
      { word: 'ability', zh: '才能；能力', emoji: '🧩', level: 3 },
      { word: 'player', zh: '运动员；选手', emoji: '🏀', level: 1, ex: 'He is a good player.', exZh: '他是个好球员。' },
      { word: 'at first', zh: '起初', emoji: '🎞️', level: 2, phrase: true }
    ]
  },
  {
    id: 'tb4u2', name: '四上U2 · Helping at home', emoji: '🧹', color: '#58e08a', textbook: true,
    desc: 'Unit 2 在家帮忙',
    words: [
      { word: 'phew', zh: '唷（松了口气）', emoji: '😮‍💨', level: 1, ex: 'Phew! We did it!', exZh: '唷！我们做到了！' },
      { word: 'wash', zh: '洗', emoji: '🧼', level: 1, ex: 'Wash your hands, please.', exZh: '请洗手。' },
      { word: 'dish', zh: '盘子；碟', emoji: '🍽️', level: 1, ex: 'I wash the dishes.', exZh: '我洗碗。' },
      { word: 'feed', zh: '喂养', emoji: '🍖', level: 1, ex: 'I feed my dog every day.', exZh: '我每天喂狗。' },
      { word: 'sweep', zh: '扫；打扫', emoji: '🧹', level: 2, ex: 'Sweep the floor, please.', exZh: '请扫地。' },
      { word: 'floor', zh: '地板；地面', emoji: '🟫', level: 2 },
      { word: 'rubbish', zh: '垃圾', emoji: '🗑️', level: 2, ex: 'Throw the rubbish away.', exZh: '把垃圾扔掉。' },
      { word: 'chore', zh: '家庭杂务', emoji: '🪣', level: 2, ex: 'I do chores on Sunday.', exZh: '我周日做家务。' },
      { word: 'to-do list', zh: '待办清单', emoji: '📝', level: 2, phrase: true },
      { word: 'may', zh: '可以（表示允许）', emoji: '✅', level: 2, ex: 'May I come in?', exZh: '我可以进来吗？' },
      { word: 'outside', zh: '在室外，在外面', emoji: '🏞️', level: 2, ex: 'Let\'s play outside.', exZh: '我们出去玩吧。' },
      { word: 'tidy', zh: '整理；收拾', emoji: '🗂️', level: 2, ex: 'Tidy your room.', exZh: '整理你的房间。' },
      { word: 'easy', zh: '容易的', emoji: '👌', level: 1, ex: 'It\'s easy for me.', exZh: '这对我来说很容易。' },
      { word: 'clean', zh: '弄干净；清洁', emoji: '🧽', level: 1, ex: 'Clean the desk, please.', exZh: '请擦桌子。' },
      { word: 'woof', zh: '汪汪（狗叫声）', emoji: '🐶', level: 1 },
      { word: 'job', zh: '任务；事情', emoji: '🧑‍💼', level: 1 },
      { word: 'Good job!', zh: '干得好！真不错！', emoji: '🎉', level: 1, phrase: true },
      { word: 'dirty', zh: '脏的', emoji: '💩', level: 2, ex: 'My shoes are dirty.', exZh: '我的鞋脏了。' },
      { word: 'desk', zh: '书桌', emoji: '🪑', level: 1, ex: 'My books are on the desk.', exZh: '我的书在书桌上。' },
      { word: 'wall', zh: '墙', emoji: '🧱', level: 1, ex: 'The map is on the wall.', exZh: '地图在墙上。' },
      { word: 'again', zh: '又；再一次', emoji: '🔁', level: 1, ex: 'Say it again, please.', exZh: '请再说一遍。' },
      { word: 'also', zh: '还；也', emoji: '➕', level: 2, ex: 'I also like music.', exZh: '我也喜欢音乐。' },
      { word: 'sunshine', zh: '阳光', emoji: '☀️', level: 2 },
      { word: 'sometimes', zh: '有时', emoji: '🤷', level: 2, ex: 'Sometimes I read at night.', exZh: '我有时晚上读书。' },
      { word: 'feel', zh: '感受到；觉得', emoji: '🫶', level: 2, ex: 'I feel happy.', exZh: '我感到开心。' },
      { word: 'tired', zh: '疲惫的，累的', emoji: '😴', level: 2, ex: 'I am tired.', exZh: '我累了。' },
      { word: 'helpful', zh: '乐于助人的', emoji: '🙋', level: 2, ex: 'He is a helpful boy.', exZh: '他是个乐于助人的男孩。' },
      { word: 'warm', zh: '（使）温暖', emoji: '☕', level: 2 },
      { word: 'warm up', zh: '热身；变暖', emoji: '🔥', level: 2, phrase: true },
      { word: 'water', zh: '给……浇水', emoji: '💦', level: 2, ex: 'I water the flowers.', exZh: '我浇花。' },
      { word: 'yard', zh: '庭院', emoji: '🏡', level: 2 },
      { word: 'helper', zh: '帮手；助手', emoji: '🦸', level: 2 },
      { word: 'pick', zh: '采，摘', emoji: '✋', level: 2, ex: 'Pick some apples.', exZh: '摘些苹果。' },
      { word: 'pig', zh: '猪', emoji: '🐷', level: 1 },
      { word: 'cow', zh: '奶牛', emoji: '🐮', level: 1 },
      { word: 'cut', zh: '修剪；切', emoji: '✂️', level: 2, ex: 'Cut the grass.', exZh: '修剪草坪。' },
      { word: 'grass', zh: '草地；草', emoji: '🌿', level: 2 },
      { word: 'surprise', zh: '惊喜', emoji: '🎊', level: 2 }
    ]
  },
  {
    id: 'tb4u3', name: '四上U3 · What\'s the weather like?', emoji: '⛅', color: '#ffd166', textbook: true,
    desc: 'Unit 3 天气怎么样',
    words: [
      { word: 'weather', zh: '天气', emoji: '⛅', level: 1, ex: 'What\'s the weather like today?', exZh: '今天天气怎么样？' },
      { word: 'sunny', zh: '阳光充足的', emoji: '☀️', level: 1 },
      { word: 'cloud', zh: '云', emoji: '☁️', level: 1 },
      { word: 'cloudy', zh: '多云的，阴天的', emoji: '🌥️', level: 1 },
      { word: 'wind', zh: '风', emoji: '🌬️', level: 1 },
      { word: 'windy', zh: '风大的；多风的', emoji: '🍃', level: 1 },
      { word: 'rain', zh: '雨；下雨', emoji: '💧', level: 1 },
      { word: 'rainy', zh: '多雨的', emoji: '🌧️', level: 1 },
      { word: 'snow', zh: '雪；下雪', emoji: '❄️', level: 1 },
      { word: 'snowy', zh: '下雪的', emoji: '🌨️', level: 2 },
      { word: 'cold', zh: '冷的，寒冷的', emoji: '🥶', level: 1 },
      { word: 'hot', zh: '热的', emoji: '🥵', level: 1 },
      { word: 'cool', zh: '凉爽的', emoji: '😎', level: 2 },
      { word: 'storm', zh: '暴风雨', emoji: '⛈️', level: 3 },
      { word: 'shine', zh: '照耀', emoji: '✨', level: 2 },
      { word: 'sun', zh: '太阳', emoji: '🌞', level: 1 },
      { word: 'blow', zh: '吹，刮', emoji: '💨', level: 2 },
      { word: 'inside', zh: '在里面', emoji: '🏠', level: 2 },
      { word: 'by', zh: '经过', emoji: '🚶', level: 2 },
      { word: 'any', zh: '任何一个', emoji: '🔢', level: 2, ex: 'Do you have any milk?', exZh: '你有牛奶吗？' },
      { word: 'or', zh: '或者', emoji: '❓', level: 2, ex: 'Tea or milk?', exZh: '茶还是牛奶？' },
      { word: 'enjoy', zh: '享受……的乐趣', emoji: '😄', level: 2, ex: 'Enjoy the game!', exZh: '享受比赛吧！' },
      { word: 'diary', zh: '日记', emoji: '📔', level: 2, ex: 'I write in my diary.', exZh: '我写日记。' },
      { word: 'teacher', zh: '教师，老师', emoji: '👩‍🏫', level: 2 },
      { word: 'taste', zh: '有……的味道；品尝', emoji: '👅', level: 2, ex: 'The apples taste sweet.', exZh: '苹果尝起来很甜。' },
      { word: 'ice cream', zh: '冰激凌，雪糕', emoji: '🍦', level: 2, phrase: true },
      { word: 'real', zh: '真的，真正的', emoji: '🆗', level: 2 },
      { word: 'later', zh: '之后，稍后', emoji: '⏰', level: 2, ex: 'See you later.', exZh: '回头见。' },
      { word: 'coat', zh: '外套', emoji: '🧥', level: 3 },
      { word: 'turn', zh: '转身；转动', emoji: '🔄', level: 2, ex: 'Turn around!', exZh: '转个圈！' },
      { word: 'turn on', zh: '打开', emoji: '💡', level: 2, phrase: true, ex: 'Turn on the TV, please.', exZh: '请打开电视。' },
      { word: 'TV', zh: '电视', emoji: '📺', level: 1 },
      { word: 'report', zh: '报道', emoji: '📰', level: 2 }
    ]
  },
  {
    id: 'tb4u4', name: '四上U4 · Wonderful seasons', emoji: '🍂', color: '#ff8fab', textbook: true,
    desc: 'Unit 4 精彩四季',
    words: [
      { word: 'season', zh: '季节', emoji: '🍂', level: 1 },
      { word: 'spring', zh: '春天，春季', emoji: '🌸', level: 1, ex: 'Spring is warm.', exZh: '春天很温暖。' },
      { word: 'summer', zh: '夏天，夏季', emoji: '🩳', level: 1, ex: 'I can swim in summer.', exZh: '夏天我能游泳。' },
      { word: 'autumn', zh: '秋天，秋季', emoji: '🍁', level: 1 },
      { word: 'winter', zh: '冬天，冬季', emoji: '⛄', level: 1, ex: 'It is cold in winter.', exZh: '冬天很冷。' },
      { word: 'favourite', zh: '最喜欢的', emoji: '❤️', level: 2, ex: 'My favourite season is autumn.', exZh: '我最喜欢的季节是秋天。' },
      { word: 'birthday', zh: '生日', emoji: '🎂', level: 1, ex: 'Happy birthday to you!', exZh: '祝你生日快乐！' },
      { word: 'fly', zh: '飞；放飞', emoji: '🕊️', level: 1, ex: 'Birds fly in the sky.', exZh: '鸟在天上飞。' },
      { word: 'fly kites', zh: '放风筝', emoji: '🪁', level: 1, phrase: true },
      { word: 'snowstorm', zh: '雪暴，暴风雪', emoji: '🌪️', level: 3 },
      { word: 'beach', zh: '海滩，沙滩', emoji: '🏖️', level: 1, ex: 'We play on the beach.', exZh: '我们在沙滩上玩。' },
      { word: 'sea', zh: '海，海洋', emoji: '🌊', level: 1 },
      { word: 'equator', zh: '赤道', emoji: '🌍', level: 3 },
      { word: 'round', zh: '循环地；圆的', emoji: '⭕', level: 2 },
      { word: 'all year round', zh: '全年', emoji: '🔄', level: 2, phrase: true },
      { word: 'quite', zh: '非常，十分', emoji: '💯', level: 2 },
      { word: 'join', zh: '参与，加入', emoji: '🤝', level: 2, ex: 'Join us!', exZh: '加入我们吧！' }
    ]
  },
  {
    id: 'tb4u5', name: '四上U5 · Let\'s go!', emoji: '🚌', color: '#b28dff', textbook: true,
    desc: 'Unit 5 出发吧',
    words: [
      { word: 'bus', zh: '公交车，公共汽车', emoji: '🚌', level: 1, ex: 'I go to school by bus.', exZh: '我坐公交上学。' },
      { word: 'car', zh: '小汽车', emoji: '🚗', level: 1 },
      { word: 'train', zh: '火车，列车', emoji: '🚆', level: 1, ex: 'The train is fast.', exZh: '火车很快。' },
      { word: 'city', zh: '城市', emoji: '🏙️', level: 1 },
      { word: 'town', zh: '镇，城镇', emoji: '🏘️', level: 1 },
      { word: 'ship', zh: '大船', emoji: '🚢', level: 1 },
      { word: 'plane', zh: '飞机', emoji: '✈️', level: 1, ex: 'The plane is in the sky.', exZh: '飞机在天上。' },
      { word: 'sky', zh: '天，天空', emoji: '🌌', level: 1 },
      { word: 'place', zh: '地方，地点', emoji: '📍', level: 2 },
      { word: 'near', zh: '（距离）近的', emoji: '📏', level: 2, ex: 'The park is near my home.', exZh: '公园在我家附近。' },
      { word: 'travel', zh: '旅行', emoji: '🧳', level: 2, ex: 'We travel by train.', exZh: '我们坐火车旅行。' },
      { word: 'way', zh: '路；方式', emoji: '🛣️', level: 2 },
      { word: 'picnic', zh: '野餐', emoji: '🧺', level: 1, ex: 'We have a picnic in the park.', exZh: '我们在公园野餐。' },
      { word: 'minute', zh: '分钟', emoji: '⏱️', level: 1, ex: 'Wait a minute!', exZh: '等一下！' },
      { word: 'wear', zh: '穿；戴', emoji: '👕', level: 2, ex: 'Wear your coat.', exZh: '穿上你的外套。' },
      { word: 'live', zh: '住，居住', emoji: '🔑', level: 2, ex: 'I live in Beijing.', exZh: '我住在北京。' },
      { word: 'away', zh: '离开，相距', emoji: '↔️', level: 2 },
      { word: 'truck', zh: '货车，卡车', emoji: '🚚', level: 2 },
      { word: 'bamboo', zh: '竹，竹子', emoji: '🎍', level: 2 },
      { word: 'bike', zh: '自行车', emoji: '🚲', level: 1, ex: 'I ride my bike to school.', exZh: '我骑自行车上学。' },
      { word: 'ring', zh: '（钟、铃）鸣响', emoji: '🔔', level: 2, ex: 'The bell rings.', exZh: '铃响了。' },
      { word: 'beep', zh: '（汽车喇叭）嘟嘟响', emoji: '📢', level: 2 },
      { word: 'subway', zh: '地铁', emoji: '🚇', level: 2 },
      { word: 'whoosh', zh: '呼地飞快移动', emoji: '🛸', level: 3 },
      { word: 'tram', zh: '有轨电车', emoji: '🚋', level: 2 },
      { word: 'chug', zh: '突突地缓慢前进', emoji: '🚂', level: 3 },
      { word: 'airport', zh: '机场', emoji: '🛫', level: 2 }
    ]
  },
  {
    id: 'tb4u6', name: '四上U6 · Find your way', emoji: '🗺️', color: '#7d6bff', textbook: true,
    desc: 'Unit 6 找路',
    words: [
      { word: 'wheel', zh: '车轮', emoji: '🛞', level: 1 },
      { word: 'left', zh: '向左，朝左', emoji: '⬅️', level: 1, ex: 'Turn left at the school.', exZh: '在学校那里左转。' },
      { word: 'straight', zh: '笔直地', emoji: '➡️', level: 1, ex: 'Go straight on.', exZh: '直走。' },
      { word: 'library', zh: '图书室；图书馆', emoji: '📚', level: 2, ex: 'I read in the library.', exZh: '我在图书馆看书。' },
      { word: 'centre', zh: '中心', emoji: '🎯', level: 2 },
      { word: 'cinema', zh: '电影院', emoji: '🎬', level: 2, ex: 'We go to the cinema.', exZh: '我们去看电影。' },
      { word: 'hospital', zh: '医院', emoji: '🏥', level: 2 },
      { word: 'supermarket', zh: '超市', emoji: '🛒', level: 1, ex: 'Mum buys food at the supermarket.', exZh: '妈妈在超市买食物。' },
      { word: 'museum', zh: '博物馆，博物院', emoji: '🏛️', level: 2 },
      { word: 'tomorrow', zh: '明天', emoji: '🌅', level: 2, ex: 'See you tomorrow.', exZh: '明天见。' },
      { word: 'woman', zh: '成年女子，妇女', emoji: '👩', level: 2 },
      { word: 'wish', zh: '愿望', emoji: '🌠', level: 2 },
      { word: 'step', zh: '步；一步的距离', emoji: '👣', level: 2 },
      { word: 'own', zh: '自己的', emoji: '🫵', level: 3 },
      { word: "on one's own", zh: '独立地', emoji: '🧍', level: 3, phrase: true },
      { word: 'cross', zh: '横穿', emoji: '🚸', level: 2, ex: 'Cross the road carefully.', exZh: '小心过马路。' },
      { word: 'careful', zh: '谨慎的，小心的', emoji: '🧐', level: 2 },
      { word: 'be careful', zh: '当心，小心', emoji: '⚠️', level: 2, phrase: true },
      { word: 'underground', zh: '在地面下；地铁', emoji: '🌑', level: 3 },
      { word: 'excuse', zh: '原谅', emoji: '🙌', level: 3 },
      { word: 'excuse me', zh: '打扰一下', emoji: '🙋‍♂️', level: 3, phrase: true },
      { word: 'true', zh: '真实的', emoji: '✔️', level: 3 }
    ]
  }
];

/* 宠物台词（按场景随机） */
const PET_LINES = {
  idle: [
    '今天也一起去冒险吧！',
    '我对词汇量进行了一次扫描，你越来越强了！',
    '听说是你昨天又坚持打卡了？佩服佩服。',
    '肚子……啊不，电池有点馋能量块了。'
  ],
  hungry: [
    '我有金币可以换能量块啦，喂喂我嘛！',
    '能量块！能量块！能量块！'
  ],
  praise: [
    '太厉害了！今天的任务全部完成！',
    '日志已记录：小宇航员今天超棒！',
    '又变强了一点！我为你骄傲！'
  ],
  sleepy: [
    '（哈欠……我的电量快用完了，明天见）',
    '休眠程序启动中……晚安，小宇航员。'
  ],
  feed: [
    '嘎嘣脆！能量恢复！',
    '谢谢投喂！感觉能绕地球一圈！',
    '叮！能量 +10086！'
  ]
};

/* 鼓励语（拼写成功时漂浮） */
const PRAISE_WORDS = ['太棒了!', '完美!', '好厉害!', '漂亮!', '没错!', '集齐能量!'];

const GOLD_RATE = 0.10;          // 稀有"超新星"贴纸概率
const COIN_NEW = 10;             // 新词拼对奖励
const COIN_REVIEW = 5;           // 复习正确奖励
const COIN_QUEST_BONUS = 20;     // 完成每日任务奖励
const COIN_BOSS = 50;            // 周日 BOSS 挑战通关奖励
const HINT_COST = 2;             // 每次提示扣除的奖励

/* Leitner 盒子间隔（天） */
const BOX_INTERVALS = [1, 2, 4, 7, 15];

/* ---------- 成就徽章 ----------
 * cond 在关键事件后由 Store.checkBadges() 统一评估，state 为存档对象 */
const ACHIEVEMENTS = [
  { id: 'first-word',   emoji: '🌟', name: '启航之星',   desc: '学会第一个单词',
    cond: s => Object.keys(s.srs).length >= 1 },
  { id: 'words-10',     emoji: '🥉', name: '十词骑士',   desc: '累计学会 10 个词',
    cond: s => Object.keys(s.srs).length >= 10 },
  { id: 'words-50',     emoji: '🥈', name: '词汇探险家', desc: '累计学会 50 个词',
    cond: s => Object.keys(s.srs).length >= 50 },
  { id: 'words-100',    emoji: '🥇', name: '百词王牌',   desc: '累计学会 100 个词',
    cond: s => Object.keys(s.srs).length >= 100 },
  { id: 'streak-3',     emoji: '🔥', name: '三日航程',   desc: '连续打卡 3 天',
    cond: s => s.streak.count >= 3 },
  { id: 'streak-7',     emoji: '🚀', name: '七日远航',   desc: '连续打卡 7 天',
    cond: s => s.streak.count >= 7 },
  { id: 'streak-30',    emoji: '🌕', name: '月球居民',   desc: '连续打卡 30 天',
    cond: s => s.streak.count >= 30 },
  { id: 'streak-100',   emoji: '🏆', name: '百日长征',   desc: '连续打卡 100 天',
    cond: s => s.streak.count >= 100 },
  { id: 'first-gold',   emoji: '✨', name: '超新星时刻', desc: '获得第一张金色超新星贴纸',
    cond: s => Object.values(s.album).some(a => a.gold) },
  { id: 'gold-10',      emoji: '💫', name: '黄金收藏家', desc: '收集 10 张金色超新星贴纸',
    cond: s => Object.values(s.album).filter(a => a.gold).length >= 10 },
  { id: 'album-set',    emoji: '📀', name: '星系大满贯', desc: '集齐任意一个星系的全部贴纸',
    cond: (s, Store) => Store.allPacks().some(p => p.words.length >= 5 && p.words.every(w => s.album[w.word.toLowerCase()])) },
  { id: 'first-speak',  emoji: '🎤', name: '开口之星',   desc: '第一次跟读录音',
    cond: s => s.spoken && Object.keys(s.spoken).length >= 1 },
  { id: 'first-drill',  emoji: '⚡', name: '错词终结者', desc: '完成一次错词挑战',
    cond: s => (s.stats && s.stats.drillsDone) >= 1 },
  { id: 'first-dict',   emoji: '📝', name: '听写小能手', desc: '完成第一次听写小测验',
    cond: s => s.dictations && s.dictations.length >= 1 },
  { id: 'dict-perfect', emoji: '💯', name: '满分听写',   desc: '听写测验拿到满分',
    cond: s => s.dictations && s.dictations.some(d => d.correct === d.total) },
  { id: 'perfect-day',  emoji: '🎯', name: '完美一天',   desc: '任务全对零失误地完成每日冒险',
    cond: s => s.history[s.today.date] && s.history[s.today.date].done && s.today.mistakes === 0 },
  { id: 'first-math',   emoji: '🪐', name: '计算新星',   desc: '完成第一次口算冲刺',
    cond: s => s.math && (s.math.runs || []).length >= 1 },
  { id: 'math-20',      emoji: '🧮', name: '口算小达人', desc: '单次口算冲刺答对 20 题',
    cond: s => s.math && (s.math.best || 0) >= 20 },
  { id: 'planets-10',   emoji: '🌌', name: '行星征服者', desc: '点亮全部 10 颗数学行星',
    cond: s => s.math && (s.math.planets || 0) >= 10 },
  { id: 'pet-max',      emoji: '🤖', name: '机械大师',   desc: '把机器伙伴养成最终形态',
    cond: s => s.pet.fed >= PET_STAGES[PET_STAGES.length - 1].need }
];
