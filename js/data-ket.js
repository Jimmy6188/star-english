/* ============================================================
 * 星际求知号 - KET 补全对话题库（v40，A2 Key for Schools 题型启蒙）
 * 题型：一段 4~5 轮的小对话挖空一句，四选一补全（对应 KET 阅读 Part 3 思路）
 * 结构：lines[{who,t}] / miss 挖空行下标 / answer 正确句 / opts 3 个干扰句 / tip 中文解析
 * 干扰句取自相近场景（语法对但上下文不接），tip 讲清"看哪句线索选它"
 * 语料口径：A2 词汇 + 外研四上学过的话题（学校/爱好/食物/天气/动物/购物/出行/计划）
 * ============================================================ */

const KET_DIALOGUES = [
  {
    id: 'k01', topic: '学校生活', emoji: '🏫',
    lines: [
      { who: 'Amy', t: 'Hi Ben! Where were you yesterday?' },
      { who: 'Ben', t: 'I was at home. I was ill.' },
      { who: 'Amy', t: '' },
      { who: 'Ben', t: 'Yes, I feel much better. Thanks!' }
    ],
    miss: 2,
    answer: 'Oh no! Are you OK now?',
    opts: ['What time does the film start?', 'I like beef noodles best.', "Let's play football after school."],
    tip: '下句 Ben 回答"我好多了"，说明这句在关心他的身体，所以选"你还好吗？"。'
  },
  {
    id: 'k02', topic: '爱好', emoji: '🎨',
    lines: [
      { who: 'Ben', t: 'What do you do after school?' },
      { who: 'Amy', t: 'I go to the art club. I love drawing.' },
      { who: 'Ben', t: '' },
      { who: 'Amy', t: 'Animals. Cats are my favourite.' }
    ],
    miss: 2,
    answer: 'What do you like to draw?',
    opts: ['How much is the ruler?', 'Do we have maths today?', 'Where is the bus stop?'],
    tip: '下句回答"画动物，最喜欢猫"，说明这句在问"你喜欢画什么"。'
  },
  {
    id: 'k03', topic: '食物', emoji: '🍜',
    lines: [
      { who: 'Amy', t: "I'm hungry. Is there a noodle shop near here?" },
      { who: 'Ben', t: 'Yes, one is next to the library.' },
      { who: 'Amy', t: '' },
      { who: 'Ben', t: "It's about five minutes on foot." }
    ],
    miss: 2,
    answer: 'How far is it from here?',
    opts: ['What colour is your bag?', 'Whose book is this?', "Why don't you like winter?"],
    tip: '下句回答"走路大约五分钟"，说明这句在问"离这儿多远"。'
  },
  {
    id: 'k04', topic: '周末计划', emoji: '🚲',
    lines: [
      { who: 'Ben', t: "Shall we ride bikes in the park on Saturday?" },
      { who: 'Amy', t: 'Good idea! What time shall we meet?' },
      { who: 'Ben', t: 'At nine in the morning.' },
      { who: 'Amy', t: '' }
    ],
    miss: 3,
    answer: "OK. See you at the park gate!",
    opts: ['My leg hurts today.', 'I usually go to bed at nine.', 'The museum is free on Mondays.'],
    tip: '约好了时间地点，这句应该是愉快地答应"公园门口见"。'
  },
  {
    id: 'k05', topic: '天气', emoji: '⛅',
    lines: [
      { who: 'Amy', t: "What's the weather like tomorrow?" },
      { who: 'Ben', t: 'The radio says it will rain.' },
      { who: 'Amy', t: 'Rain again! I want to fly a kite.' },
      { who: 'Ben', t: '' }
    ],
    miss: 3,
    answer: "Then let's go on Sunday. It will be sunny.",
    opts: ['Put the milk in the fridge, please.', 'My uncle works in a hospital.', 'Turn left at the second crossing.'],
    tip: 'Amy 说想放风筝但明天有雨，所以 Ben 出主意"周日去吧，那天是晴天"。'
  },
  {
    id: 'k06', topic: '动物', emoji: '🐼',
    lines: [
      { who: 'Ben', t: 'What animals do you like best?' },
      { who: 'Amy', t: 'Pandas! I saw one at the zoo last month.' },
      { who: 'Ben', t: '' },
      { who: 'Amy', t: 'Because they are cute and very quiet.' }
    ],
    miss: 2,
    answer: 'Why do you like pandas?',
    opts: ['When does the shop open?', 'Which season is the coldest?', 'How do you go to school?'],
    tip: '下句用 "Because..." 回答原因，说明这句在问"你为什么喜欢熊猫"。'
  },
  {
    id: 'k07', topic: '购物', emoji: '🛍️',
    lines: [
      { who: 'Amy', t: 'Can I help you?' },
      { who: 'Ben', t: 'Yes, please. I want a pair of sports shoes.' },
      { who: 'Amy', t: 'What size do you wear?' },
      { who: 'Ben', t: '' }
    ],
    miss: 3,
    answer: 'Size 35, please. I like the blue ones.',
    opts: ['Yes, it was a lot of fun.', "Sorry, I don't know her.", "It's beside the sofa."],
    tip: '店员问了尺码，这句应该回答"35 码，喜欢蓝色的"。'
  },
  {
    id: 'k08', topic: '问路', emoji: '🗺️',
    lines: [
      { who: 'Ben', t: "Excuse me, how can I get to the station?" },
      { who: 'Amy', t: 'Go straight and turn right at the bank.' },
      { who: 'Ben', t: 'Is it far from here?' },
      { who: 'Amy', t: '' }
    ],
    miss: 3,
    answer: "No, it's only ten minutes on foot.",
    opts: ['I did my homework last night.', "Don't feed the animals!", 'She sings very well.'],
    tip: 'Ben 问"远吗"，这句应回答"不远，走路十分钟"。'
  },
  {
    id: 'k09', topic: '健康', emoji: '🦷',
    lines: [
      { who: 'Amy', t: "You look tired. What's wrong?" },
      { who: 'Ben', t: "I didn't sleep well last night." },
      { who: 'Amy', t: '' },
      { who: 'Ben', t: "That's a good idea. I'll go to bed early tonight." }
    ],
    miss: 2,
    answer: 'Why not go to bed earlier tonight?',
    opts: ["Let's play chess now.", 'The soup tastes great.', 'My birthday is in May.'],
    tip: '下句说"好主意，今晚早点睡"，说明这句在建议他早点休息。'
  },
  {
    id: 'k10', topic: '课堂', emoji: '📖',
    lines: [
      { who: 'Ben', t: 'Whose dictionary is this?' },
      { who: 'Amy', t: "It's Lily's. She looked for it just now." },
      { who: 'Ben', t: '' },
      { who: 'Amy', t: 'Good idea. She is on the playground.' }
    ],
    miss: 2,
    answer: "Let's give it back to her.",
    opts: ['It often snows there in winter.', 'The ticket was twenty yuan.', 'He is taller than me.'],
    tip: '词典是 Lily 的，她正在找，所以这句建议"把词典还给她"。'
  },
  {
    id: 'k11', topic: '假期', emoji: '🏖️',
    lines: [
      { who: 'Amy', t: 'Where did you go for the holiday?' },
      { who: 'Ben', t: 'I went to Qingdao with my family.' },
      { who: 'Amy', t: '' },
      { who: 'Ben', t: 'We swam in the sea and built a big sandcastle.' }
    ],
    miss: 2,
    answer: 'Wow! What did you do there?',
    opts: ['What does your father do?', 'How heavy is the box?', "When's your English class?"],
    tip: '下句讲"在海里游泳、堆沙堡"，说明这句在问"你们在那儿做了什么"。'
  },
  {
    id: 'k12', topic: '借东西', emoji: '✏️',
    lines: [
      { who: 'Ben', t: 'May I borrow your eraser?' },
      { who: 'Amy', t: "Sure. Here you are." },
      { who: 'Ben', t: '' },
      { who: 'Amy', t: "No problem. We can share it." }
    ],
    miss: 2,
    answer: 'Thanks! Oh, my ruler is at home too.',
    opts: ['The library closes at five.', "I'm good at swimming.", 'Turn on the light, please.'],
    tip: '接橡皮后说"我的尺子也忘带了"，对方才会回答"没问题，一起用"。'
  },
  {
    id: 'k13', topic: '运动', emoji: '⚽',
    lines: [
      { who: 'Amy', t: 'Did you watch the football game yesterday?' },
      { who: 'Ben', t: 'Yes! Our team won the game.' },
      { who: 'Amy', t: '' },
      { who: 'Ben', t: 'Two to one. The last goal was amazing.' }
    ],
    miss: 2,
    answer: 'Great! What was the score?',
    opts: ['Where were you born?', "What's your sister like?", 'Which month has thirty days?'],
    tip: '下句回答"二比一"，说明这句在问"比分是多少"。'
  },
  {
    id: 'k14', topic: '家务', emoji: '🧹',
    lines: [
      { who: 'Ben', t: "Mum, can I help you with the housework?" },
      { who: 'Mum', t: "Sure! Could you water the flowers first?" },
      { who: 'Ben', t: "OK. Anything else?" },
      { who: 'Mum', t: '' }
    ],
    miss: 3,
    answer: "Then please sweep the floor.",
    opts: ["I was born in 2016.", "The kite flies very high.", "We'll have a picnic tomorrow."],
    tip: 'Ben 问"还有别的吗"，妈妈接着安排"然后请扫地"。'
  },
  {
    id: 'k15', topic: '电话', emoji: '📞',
    lines: [
      { who: 'Amy', t: 'Hello! May I speak to Ben?' },
      { who: 'Mum', t: "Sorry, he's doing his homework now." },
      { who: 'Amy', t: '' },
      { who: 'Mum', t: "OK, I'll tell him. Bye!" }
    ],
    miss: 2,
    answer: "Could you ask him to call me later?",
    opts: ['Is there a park nearby?', 'What did you have for lunch?', "Don't run in the hallways."],
    tip: 'Ben 不在（在写作业），所以这句请妈妈"让他晚点回电话"。'
  },
  {
    id: 'k16', topic: '生日', emoji: '🎂',
    lines: [
      { who: 'Ben', t: 'My birthday is coming. It is on Saturday.' },
      { who: 'Amy', t: "Really? Happy birthday to you!" },
      { who: 'Ben', t: "Would you like to come to my party?" },
      { who: 'Amy', t: '' }
    ],
    miss: 3,
    answer: "Sure! When does the party start?",
    opts: ["My shoes are worn out.", "It's cold outside today.", "I walk to school every day."],
    tip: '被邀请参加生日会，这句应该开心答应并问"几点开始"。'
  },
  {
    id: 'k17', topic: '图书馆', emoji: '📚',
    lines: [
      { who: 'Amy', t: 'What are you reading?' },
      { who: 'Ben', t: "A story about a clever robot." },
      { who: 'Amy', t: 'It sounds interesting. Where did you get it?' },
      { who: 'Ben', t: '' }
    ],
    miss: 3,
    answer: "From the school library. You can borrow one too.",
    opts: ["He lives on the fifth floor.", "I get up at six thirty.", "The moon is bright tonight."],
    tip: '问"书从哪来"，这句回答"从学校图书馆借的，你也可以借"。'
  },
  {
    id: 'k18', topic: '帮助', emoji: '🤝',
    lines: [
      { who: 'Ben', t: "Oh no! I can't carry this big box." },
      { who: 'Amy', t: "Don't worry. Let me help you." },
      { who: 'Ben', t: '' },
      { who: 'Amy', t: "Not at all. We are good friends." }
    ],
    miss: 2,
    answer: "Thank you so much!",
    opts: ["What a windy day!", "Where does it come from?", "How often do you swim?"],
    tip: '对方主动帮忙，这句应该说"太谢谢你了"；下句 "Not at all（不客气）" 正是回应感谢。'
  },
  {
    id: 'k19', topic: '宠物', emoji: '🐶',
    lines: [
      { who: 'Amy', t: "Your dog is so cute! What's his name?" },
      { who: 'Ben', t: "His name is Lucky. He is two years old." },
      { who: 'Amy', t: "Can he do any tricks?" },
      { who: 'Ben', t: '' }
    ],
    miss: 3,
    answer: "Yes, he can shake hands and play with a ball.",
    opts: ["She is doing the dishes.", "They went to Beijing by train.", "It rains a lot here in summer."],
    tip: '问"它会本领吗"，这句回答"会握手、会玩球"。'
  },
  {
    id: 'k20', topic: '交通', emoji: '🚌',
    lines: [
      { who: 'Ben', t: "How do you usually go to school?" },
      { who: 'Amy', t: "I usually walk. My home is near the school." },
      { who: 'Ben', t: "I take the bus. It takes twenty minutes." },
      { who: 'Amy', t: '' }
    ],
    miss: 3,
    answer: "That's OK. You can read a book on the bus.",
    opts: ["The apple pie smells nice.", "My cousin lives in London.", "Be careful with the knife!"],
    tip: 'Ben 说坐车要二十分钟，Amy 安慰"正好可以在车上读书"。'
  },
  {
    id: 'k21', topic: '学习', emoji: '💯',
    lines: [
      { who: 'Amy', t: "You got full marks in the English test!" },
      { who: 'Ben', t: "Thank you. I read English every morning." },
      { who: 'Amy', t: '' },
      { who: 'Ben', t: "Of course! Let's read together tomorrow." }
    ],
    miss: 2,
    answer: "Well done! Can you help me with it?",
    opts: ["What's on the desk?", "Who broke the window?", "How much are the apples?"],
    tip: '夸奖之后请教"你能帮帮我吗"，下句回答"当然可以，明天一起读"。'
  },
  {
    id: 'k22', topic: '失物', emoji: '🔑',
    lines: [
      { who: 'Ben', t: "I can't find my key anywhere!" },
      { who: 'Amy', t: "Is it in your schoolbag?" },
      { who: 'Ben', t: "No, I looked in it already." },
      { who: 'Amy', t: '' }
    ],
    miss: 3,
    answer: "Look! It's on the desk, under your book.",
    opts: ["He runs faster than me.", "We visited the museum last week.", "Please close the window."],
    tip: '找不到钥匙，这句提醒"看，就在桌上你的书下面"。'
  },
  {
    id: 'k23', topic: '晚餐', emoji: '🥗',
    lines: [
      { who: 'Mum', t: "Dinner is ready. What would you like?" },
      { who: 'Ben', t: "Fish and vegetables, please." },
      { who: 'Mum', t: "Here you are. Be careful, it's hot." },
      { who: 'Ben', t: '' }
    ],
    miss: 3,
    answer: "Thanks, Mum. It smells really nice!",
    opts: ["I like winter best.", "The bus is coming soon.", "My bag is on the chair."],
    tip: '妈妈端上饭菜提醒小心烫，这句应该说"谢谢妈妈，闻起来真香"。'
  },
  {
    id: 'k24', topic: '约定', emoji: '🎬',
    lines: [
      { who: 'Amy', t: "There's a new cartoon film this weekend." },
      { who: 'Ben', t: "Really? I want to see it very much." },
      { who: 'Amy', t: "Shall we go together on Sunday afternoon?" },
      { who: 'Ben', t: '' }
    ],
    miss: 3,
    answer: "Great! Let's meet at the cinema at two.",
    opts: ["I do my homework every evening.", "The hospital is very big.", "She was late this morning."],
    tip: '约好周日看电影，这句应定细节"两点电影院见"。'
  }
];
