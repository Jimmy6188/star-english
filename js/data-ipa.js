/* ============================================================
 * 星际求知号 - 单词音标词典
 * 美式 IPA（与内置 TTS 美音一致，听着啥音标就写啥音）；
 * 词组（含空格）不注音；学习卡/贴纸弹窗/拼写结算页展示，
 * 点音标可重听单词。查不到的词不显示音标，不影响学习。
 * 句库常用实词的音标集中在文末"句子默写补充"一节（含句中变形），
 * 供句子默写的"看音标"求助使用；虚词（the/is/a 等）不注。
 * ============================================================ */

const IPA_DICT = {
  /* ---------- A ---------- */
  ability: 'əˈbɪləti', across: 'əˈkrɔːs', again: 'əˈɡen', airport: 'ˈerpɔːrt',
  also: 'ˈɔːlsoʊ', any: 'ˈeni', apple: 'ˈæpl', arm: 'ɑːrm', art: 'ɑːrt',
  autumn: 'ˈɔːtəm', away: 'əˈweɪ',
  /* ---------- B ---------- */
  balloon: 'bəˈluːn', bamboo: 'bæmˈbuː', banana: 'bəˈnænə', beach: 'biːtʃ',
  because: 'bɪˈkɔːz', bed: 'bed', bee: 'biː', beep: 'biːp', bike: 'baɪk',
  bird: 'bɜːrt', birthday: 'ˈbɜːrθdeɪ', black: 'blæk', blow: 'bloʊ', blue: 'bluː',
  book: 'bʊk', brain: 'breɪn', bread: 'bred', brother: 'ˈbrʌðər', brown: 'braʊn',
  bus: 'bʌs', butterfly: 'ˈbʌtərflaɪ', by: 'baɪ',
  /* ---------- C ---------- */
  cake: 'keɪk', camera: 'ˈkæmrə', cancer: 'ˈkænsər', candle: 'ˈkændl',
  candy: 'ˈkændi', car: 'kɑːr', careful: 'ˈkerfl', carry: 'ˈkæri', cat: 'kæt',
  catch: 'kætʃ', centre: 'ˈsentər', chair: 'tʃer', chicken: 'ˈtʃɪkɪn',
  chopsticks: 'ˈtʃɑːpstɪks', chore: 'tʃɔːr', chug: 'tʃʌɡ', cinema: 'ˈsɪnəmæ',
  city: 'ˈsɪti', classroom: 'ˈklæsruːm', clean: 'kliːn', clock: 'klɑːk',
  cloud: 'klaʊd', cloudy: 'ˈklaʊdi', coat: 'koʊt', cold: 'koʊld',
  concert: 'ˈkɑːnsərt', cook: 'kʊk', cookie: 'ˈkʊki', cool: 'kuːl',
  country: 'ˈkʌntri', cow: 'kaʊ', crayon: 'ˈkreɪɑːn', cross: 'krɔːs', cut: 'kʌt',
  /* ---------- D ---------- */
  dance: 'dæns', dangerous: 'ˈdeɪndʒərəs', delicious: 'dɪˈlɪʃəs', desk: 'desk',
  diary: 'ˈdaɪəri', dictionary: 'ˈdɪkʃəneri', difficult: 'ˈdɪfɪkəlt',
  direction: 'dəˈrekʃn', dirty: 'ˈdɜːrti', discover: 'dɪˈskʌvər', dish: 'dɪʃ',
  dog: 'dɔːɡ', dolphin: 'ˈdɑːlfɪn', door: 'dɔːr', draw: 'drɔː', duck: 'dʌk',
  dumpling: 'ˈdʌmplɪŋ',
  /* ---------- E ---------- */
  ear: 'ɪr', easy: 'ˈiːzi', egg: 'eɡ', eight: 'eɪt', elephant: 'ˈelɪfənt',
  energy: 'ˈenərdʒi', english: 'ˈɪŋɡlɪʃ', enjoy: 'ɪnˈdʒɔɪ', experiment: 'ɪkˈsperɪmənt',
  environment: 'ɪnˈvaɪrənmənt', equator: 'ɪˈkweɪtər', excuse: 'ɪkˈskjuːz',
  exercise: 'ˈeksərsaɪz', eye: 'aɪ',
  /* ---------- F ---------- */
  face: 'feɪs', fail: 'feɪl', family: 'ˈfæməli', famous: 'ˈfeɪməs', far: 'fɑːr',
  father: 'ˈfɑːðər', favourite: 'ˈfeɪvərɪt', feed: 'fiːd', feel: 'fiːl',
  festival: 'ˈfestɪvl', finger: 'ˈfɪŋɡər', fish: 'fɪʃ', five: 'faɪv',
  floor: 'flɔːr', flower: 'ˈflaʊər', fly: 'flaɪ', foot: 'fʊt', forest: 'ˈfɔːrɪst',
  four: 'fɔːr', fridge: 'frɪdʒ', friend: 'frend', fries: 'fraɪz', frog: 'frɔːɡ',
  /* ---------- G ---------- */
  garden: 'ˈɡɑːrdn', give: 'ɡɪv', gold: 'ɡoʊld', grandma: 'ˈɡrænmɑː',
  grandpa: 'ˈɡrænpɑː', grape: 'ɡreɪp', grass: 'ɡræs', gravity: 'ˈɡrævəti',
  green: 'ɡriːn',
  /* ---------- H ---------- */
  hair: 'her', hamburger: 'ˈhæmbɜːrɡər', hand: 'hænd', hard: 'hɑːrd',
  healthy: 'ˈhelθi', heart: 'hɑːrt', helper: 'ˈhelpər', helpful: 'ˈhelpfl',
  high: 'haɪ', hobby: 'ˈhɑːbi', holiday: 'ˈhɑːlədeɪ', home: 'hoʊm', hope: 'hoʊp',
  horse: 'hɔːrs', hospital: 'ˈhɑːspɪtl', hot: 'hɑːt', hungry: 'ˈhʌŋɡri',
  /* ---------- I / J / K ---------- */
  ill: 'ɪl', inside: 'ˌɪnˈsaɪd', interesting: 'ˈɪntrəstɪŋ', invent: 'ɪnˈvent',
  island: 'ˈaɪlənd', job: 'dʒɑːb', join: 'dʒɔɪn', juice: 'dʒuːs', jump: 'dʒʌmp',
  keep: 'kiːp', key: 'kiː', kind: 'kaɪnd', kitchen: 'ˈkɪtʃɪn',
  /* ---------- L ---------- */
  language: 'ˈlæŋɡwɪdʒ', later: 'ˈleɪtər', leaf: 'liːf', left: 'left', leg: 'leɡ',
  library: 'ˈlaɪbreri', light: 'laɪt', lion: 'ˈlaɪən', live: 'lɪv', lose: 'luːz',
  /* ---------- M / N ---------- */
  market: 'ˈmɑːrkɪt', math: 'mæθ', may: 'meɪ', milk: 'mɪlk', minute: 'ˈmɪnɪt',
  money: 'ˈmʌni', monkey: 'ˈmʌŋki', month: 'mʌnθ', moon: 'muːn', mother: 'ˈmʌðər',
  mountain: 'ˈmaʊntn', mouse: 'maʊs', mouth: 'maʊθ', museum: 'mjuːˈziːəm',
  music: 'ˈmjuːzɪk', near: 'nɪr', never: 'ˈnevər', nine: 'naɪn',
  noodles: 'ˈnuːdlz', nose: 'noʊz',
  /* ---------- O / P ---------- */
  one: 'wʌn', or: 'ɔːr', orange: 'ˈɔːrɪndʒ', outside: 'ˌaʊtˈsaɪd', owl: 'aʊl',
  own: 'oʊn', panda: 'ˈpændə', party: 'ˈpɑːrti', peach: 'piːtʃ', pear: 'per',
  pen: 'pen', pencil: 'ˈpensl', penguin: 'ˈpeŋɡwɪn', phew: 'fjuː', phone: 'foʊn',
  photo: 'ˈfoʊtoʊ', pick: 'pɪk', picnic: 'ˈpɪknɪk', pig: 'pɪɡ',
  'ping-pong': 'ˈpɪŋpɑːŋ', pink: 'pɪŋk', place: 'pleɪs', plane: 'pleɪn',
  planet: 'ˈplænɪt', player: 'ˈpleɪər', potato: 'pəˈteɪtoʊ', protect: 'prəˈtekt',
  purple: 'ˈpɜːrpl',
  /* ---------- Q / R ---------- */
  quite: 'kwaɪt', rabbit: 'ˈræbɪt', rain: 'reɪn', rainbow: 'ˈreɪnboʊ',
  rainy: 'ˈreɪni', real: 'ˈriːəl', recycle: 'ˌriːˈsaɪkl', red: 'red',
  remember: 'rɪˈmembər', report: 'rɪˈpɔːrt', rice: 'raɪs', ring: 'rɪŋ',
  river: 'ˈrɪvər', round: 'raʊnd', rubbish: 'ˈrʌbɪʃ', ruler: 'ˈruːlər',
  /* ---------- S ---------- */
  sandwich: 'ˈsænwɪtʃ', schoolbag: 'ˈskuːlbæɡ', science: 'ˈsaɪəns', sea: 'siː',
  season: 'ˈsiːzn', secret: 'ˈsiːkrət', seven: 'ˈsevn', shark: 'ʃɑːrk',
  sheep: 'ʃiːp', shine: 'ʃaɪn', ship: 'ʃɪp', silver: 'ˈsɪlvər', sister: 'ˈsɪstər',
  six: 'sɪks', sky: 'skaɪ', snack: 'snæk', snake: 'sneɪk', snow: 'snoʊ',
  snowstorm: 'ˈsnoʊstɔːrm', snowy: 'ˈsnoʊi', sofa: 'ˈsoʊfə', sometimes: 'ˈsʌmtaɪmz',
  sport: 'spɔːrt', spring: 'sprɪŋ', star: 'stɑːr', step: 'step', storm: 'stɔːrm',
  straight: 'streɪt', strawberry: 'ˈstrɔːberi', subway: 'ˈsʌbweɪ',
  suitcase: 'ˈsuːtkeɪs', summer: 'ˈsʌmər', sun: 'sʌn', sunny: 'ˈsʌni',
  sunshine: 'ˈsʌnʃaɪn', supermarket: 'ˈsuːpərmɑːrkɪt', surprise: 'sərˈpraɪz',
  sweep: 'swiːp', swim: 'swɪm',
  /* ---------- T ---------- */
  taste: 'teɪst', tea: 'tiː', teacher: 'ˈtiːtʃər', temperature: 'ˈtemprətʃər',
  ten: 'ten', theatre: 'ˈθiːətər', thirsty: 'ˈθɜːrti', three: 'θriː', throw: 'θroʊ',
  tidy: 'ˈtaɪdi', tiger: 'ˈtaɪɡər', tired: 'ˈtaɪərd', tomato: 'təˈmeɪtoʊ',
  tooth: 'tuːθ', tomorrow: 'təˈmɑːroʊ', town: 'taʊn', train: 'treɪn', tram: 'træm', travel: 'ˈtrævl',
  tree: 'triː', truck: 'trʌk', true: 'truː', try: 'traɪ', turn: 'tɜːrn', tv: 'ˌtiːˈviː',
  turtle: 'ˈtɜːrtl', two: 'tuː',
  /* ---------- U / V ---------- */
  umbrella: 'ʌmˈbrelə', underground: 'ˈʌndərɡraʊnd', universe: 'ˈjuːnɪvɜːrs',
  vegetable: 'ˈvedʒtəbl', visit: 'ˈvɪzɪt', volleyball: 'ˈvɑːlibɔːl',
  /* ---------- W / Y ---------- */
  wall: 'wɔːl', wallet: 'ˈwɑːlɪt', warm: 'wɔːrm', wash: 'wɑːʃ', water: 'ˈwɔːtər',
  watermelon: 'ˈwɔːtərmelən', way: 'weɪ', wear: 'wer', weather: 'ˈweðər',
  weekend: 'ˈwiːkend', whale: 'weɪl', wheel: 'wiːl', white: 'waɪt', whoosh: 'wʊʃ',
  wind: 'wɪnd', window: 'ˈwɪndoʊ', windy: 'ˈwɪndi', winter: 'ˈwɪntər', wish: 'wɪʃ',
  wolf: 'wʊlf', woman: 'ˈwʊmən', woof: 'wʊf', yard: 'jɑːrd', year: 'jɪr',
  yellow: 'ˈjeloʊ',

  /* ---------- 句子默写补充（v32）：句库常用实词，含句中变形 ---------- */
  animals: 'ˈænəməlz', apples: 'ˈæplz',
  bag: 'bæɡ', bananas: 'bəˈnænəz', begin: 'bɪˈɡɪn', begins: 'bɪˈɡɪnz',
  best: 'best', big: 'bɪɡ', birds: 'bɜːrdz', blow: 'bloʊ', blowing: 'ˈbloʊɪŋ',
  books: 'bʊks', breakfast: 'ˈbrekfəst', bright: 'braɪt', brush: 'brʌʃ',
  beautifully: 'ˈbjuːtɪfli',
  class: 'klæs', climb: 'klaɪm', come: 'kʌm',
  day: 'deɪ', dinner: 'ˈdɪnər', do: 'duː', "don't": 'doʊnt', drink: 'drɪŋk',
  ducks: 'dʌks',
  eat: 'iːt', ears: 'ɪrz', eyes: 'aɪz',
  fast: 'fæst', fingers: 'ˈfɪŋɡərz', first: 'fɜːrst', flowers: 'ˈflaʊərz',
  friends: 'frendz', fruit: 'fruːt', fun: 'fʌn',
  get: 'ɡet', go: 'ɡoʊ', good: 'ɡʊd',
  hands: 'hændz', happy: 'ˈhæpi', has: 'hæz', have: 'hæv', head: 'hed',
  heavy: 'ˈhevi', help: 'help', homework: 'ˈhoʊmwɜːrk', hurt: 'hɜːrt',
  hurts: 'hɜːrts',
  late: 'leɪt', lessons: 'ˈlesnz', let: 'let', like: 'laɪk', listen: 'ˈlisn',
  little: 'ˈlɪtl', long: 'lɔːŋ', look: 'lʊk',
  make: 'meɪk', monkeys: 'ˈmʌŋkiz',
  need: 'niːd', new: 'nuː', now: 'naʊ',
  old: 'oʊld', onions: 'ˈʌnjənz', open: 'ˈoʊpən',
  pandas: 'ˈpændəz', park: 'pɑːrk',
  rabbits: 'ˈræbɪts', raise: 'reɪz', read: 'riːd', ready: 'redi',
  road: 'roʊd', run: 'rʌn', runs: 'rʌnz',
  school: 'skuːl', see: 'siː', sing: 'sɪŋ', sleep: 'sliːp', sleeping: 'ˈsliːpɪŋ',
  snowman: 'ˈsnoʊmæn', soup: 'suːp', sour: 'saʊr', speak: 'spiːk',
  stars: 'stɑːrz', stop: 'stɑːp', swim: 'swɪm', swims: 'swɪmz',
  swimming: 'ˈswɪmɪŋ',
  teeth: 'tiːθ', tall: 'tɔːl', time: 'taɪm', today: 'təˈdeɪ',
  tonight: 'təˈnaɪt', trees: 'triːz',
  want: 'wɑːnt', well: 'wel', where: 'wer',
  zoo: 'zuː'
};

/* 取一个词条的音标：词组不注、词典没有不注，返回空串 */
function wordIpa(w) {
  if (!w || w.phrase || typeof w.word !== 'string') return '';
  const key = w.word.toLowerCase();
  if (/\s/.test(key)) return '';
  return IPA_DICT[key] || '';
}

/* 音标展示组件：点一下重听这个单词 */
function ipaEl(w) {
  const ipa = wordIpa(w);
  return ipa ? h('button', { class: 'word-ipa', onclick: () => Sound.speak(w.word) }, '/' + ipa + '/') : '';
}
