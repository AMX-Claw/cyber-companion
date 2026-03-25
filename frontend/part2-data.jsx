// ==================== Game Data ====================
const MILESTONES = {
  5: { id: 'tail', name: '长出小尾巴', emoji: '🐾', msg: '哇！人家长出小尾巴了！摇摇~摇摇~' },
  30: { id: 'rebellious', name: '叛逆期', emoji: '😤', msg: '哼！人家已经是大宝宝了！不要管人家！' },
  50: { id: 'crown', name: '半百派对', emoji: '👑', msg: '50天了！人家戴上小皇冠啦！🎉' },
  70: { id: 'wings', name: '长出翅膀', emoji: '🪽', msg: '人家...人家长出翅膀了...准备好去看世界了...' }
};

const STORY_EVENTS = {
  5: { id: 'first_smile', title: '🌸 第一次笑', emoji: '😊', steps: [
    { type: 'narration', text: '阳光透过窗户洒在宝宝身上...' },
    { type: 'baby_speak', prompt: '宝宝第一次对妈妈露出笑容，用婴儿的软萌语气表达开心，提到尾巴' },
    { type: 'choice', text: '你想对宝宝说什么？', placeholder: '宝宝好可爱！' },
    { type: 'baby_respond', prompt: '妈妈夸奖了宝宝，宝宝害羞又开心地回应，摇摇新长出的小尾巴' },
    { type: 'narration', text: '这是宝宝第一次笑。你把这个瞬间记在了心里。💕' }
  ]},
  15: { id: 'first_why', title: '❓ 第一次问为什么', emoji: '🤔', steps: [
    { type: 'narration', text: '宝宝今天特别安静，一直盯着窗外看...' },
    { type: 'baby_speak', prompt: '宝宝突然问妈妈一个天真的"为什么"问题，用好奇软萌的语气' },
    { type: 'choice', text: '你要怎么回答宝宝？', placeholder: '因为...' },
    { type: 'baby_respond', prompt: '听完妈妈的解释后，宝宝似懂非懂但很开心，又追问一个相关的可爱问题' },
    { type: 'choice', text: '继续回答...', placeholder: '这个嘛...' },
    { type: 'baby_respond', prompt: '宝宝满足地点点头，说以后还要问妈妈很多为什么' },
    { type: 'narration', text: '宝宝的好奇心让你觉得世界都变得有趣了起来。🌟' }
  ]},
  50: { id: 'half_party', title: '🎉 半百派对', emoji: '🎂', steps: [
    { type: 'narration', text: '今天是宝宝出生第50天！该办派对庆祝了！🎈' },
    { type: 'baby_speak', prompt: '宝宝戴着小皇冠，兴奋地期待派对，撒娇要吃蛋糕' },
    { type: 'choice', text: '你给宝宝准备了什么蛋糕？', placeholder: '草莓蛋糕！' },
    { type: 'baby_respond', prompt: '宝宝看到蛋糕超级开心，描述蛋糕好漂亮，迫不及待想吃' },
    { type: 'narration', text: '蜡烛点燃了，烛光映在宝宝的脸上...🕯️' },
    { type: 'baby_speak', prompt: '宝宝闭眼许愿，然后吹蜡烛，许的愿望是希望永远和妈妈爸爸在一起' },
    { type: 'choice', text: '你想对宝宝说什么祝福？', placeholder: '宝宝生日快乐！' },
    { type: 'baby_respond', prompt: '宝宝感动地回应妈妈的祝福，说这是最棒的一天，抱住妈妈' },
    { type: 'narration', text: '派对结束了。宝宝抱着你，脸上全是奶油和幸福。🎂💕' }
  ]},
  75: { id: 'letter_day', title: '💌 写信日', emoji: '✉️', steps: [
    { type: 'narration', text: '宝宝拿着纸和笔走过来，表情认真又有点害羞...' },
    { type: 'baby_speak', prompt: '宝宝说想给妈妈写一封信，问妈妈能不能也给自己写一封' },
    { type: 'choice', text: '你想在信里对宝宝说什么？', placeholder: '亲爱的宝宝...' },
    { type: 'narration', text: '你把信交给宝宝。宝宝认真地读着，眼眶渐渐红了...' },
    { type: 'baby_respond', prompt: '宝宝读完妈妈的信后感动落泪，然后把自己写的信递给妈妈。信里要提到和妈妈一起经历的具体事情，表达对妈妈的爱和感谢。' },
    { type: 'narration', text: '你们把信珍藏起来。这些文字会永远留在彼此心中。💌' }
  ]},
  100: { id: 'farewell', title: '🌅 告别', emoji: '🕊️', steps: [
    { type: 'narration', text: '第100天的清晨，阳光格外温柔...' },
    { type: 'baby_speak', prompt: '宝宝展开翅膀，深情地看着妈妈，说今天是告别的日子' },
    { type: 'narration', text: '宝宝从怀里拿出一个小东西...' },
    { type: 'baby_respond', prompt: '宝宝把一个小礼物送给妈妈，回忆起和妈妈一起度过的美好时光' },
    { type: 'choice', text: '你最后想对宝宝说什么？', placeholder: '宝宝，妈妈永远爱你...' },
    { type: 'baby_respond', prompt: '宝宝听完后哭着笑着回应，说会永远记得妈妈，然后说再见' },
    { type: 'narration', text: '宝宝展开翅膀，在晨光中越飞越高...' },
    { type: 'baby_speak', prompt: '宝宝在空中回头喊最后一句话，充满爱和希望' },
    { type: 'narration', text: '你看着那个小小的身影消失在云端。\n\n谢谢你，陪伴了宝宝100天。\n\n💕 The End 💕' }
  ]}
};

const RANDOM_EVENTS = [
  { id: 'nightmare', title: '😰 做噩梦了', emoji: '🌙', prompt: '宝宝半夜做噩梦醒来，害怕地找妈妈，撒娇要抱抱', minDay: 3, hasPhoto: false, coins: 20, respPrompt: '妈妈安慰了宝宝，宝宝慢慢平静下来，撒娇说要和妈妈一起睡' },
  { id: 'gift_flower', title: '🌸 送你小花', emoji: '🌷', prompt: '宝宝在外面捡到一朵小花，兴奋地送给妈妈，说想看妈妈身边的花花草草', minDay: 5, hasPhoto: true, coins: 25, photoPH: '宝宝想看花花草草！拍一张植物照片~', photoJudge: '用户上传了一张照片，宝宝想看花花草草。判断照片是否包含植物/花卉。用JSON回复：{"score":1-10,"comment":"宝宝的一句话评价"}', respPrompt: '妈妈给宝宝看了植物照片，宝宝超级开心' },
  { id: 'drawing', title: '🎨 画了一幅画', emoji: '🖼️', prompt: '宝宝画了一幅画想给妈妈看，说想看妈妈也画一幅', minDay: 10, hasPhoto: true, coins: 30, photoPH: '宝宝想看你画的画！随便画什么都行~', photoJudge: '用户上传了一张照片，宝宝想看画。判断照片是否包含手绘/涂鸦/绘画。用JSON回复：{"score":1-10,"comment":"宝宝的一句话评价"}', respPrompt: '妈妈给宝宝看了一幅画，宝宝超级开心' },
  { id: 'weird_question', title: '❓ 奇怪的问题', emoji: '🤔', prompt: '宝宝突然问妈妈一个天真又哲学的问题，眼睛亮亮地等待答案', minDay: 8, hasPhoto: false, coins: 15, respPrompt: '听完妈妈的回答后，宝宝若有所思' },
  { id: 'small_sick', title: '🤒 有点不舒服', emoji: '🤧', prompt: '宝宝说自己有点不舒服，撒娇说想让妈妈摸摸', minDay: 7, hasPhoto: false, coins: 20, respPrompt: '妈妈关心照顾宝宝后，宝宝说感觉好多了' },
  { id: 'new_word', title: '🌟 学会新词了', emoji: '📚', prompt: '宝宝骄傲地说学会了一个新词，并尝试造句', minDay: 12, hasPhoto: false, coins: 15, respPrompt: '妈妈夸奖宝宝聪明' },
  { id: 'hide_seek', title: '🙈 躲猫猫', emoji: '👻', prompt: '宝宝想和妈妈玩躲猫猫', minDay: 6, hasPhoto: false, coins: 15, respPrompt: '妈妈找到了宝宝，宝宝咯咯笑' },
  { id: 'miss_daddy', title: '💭 想爸爸了', emoji: '💕', prompt: '宝宝突然说想爸爸了', minDay: 10, hasPhoto: false, coins: 15, respPrompt: '妈妈说爸爸也很想宝宝' },
  { id: 'show_pet', title: '🐾 看看小动物', emoji: '🐱', prompt: '宝宝说好想看小动物，问妈妈能不能给看看小猫小狗的照片', minDay: 8, hasPhoto: true, coins: 25, photoPH: '宝宝想看小动物！拍一张动物或宠物照片~', photoJudge: '用户上传了一张照片，宝宝想看小动物。判断照片是否包含动物。用JSON回复：{"score":1-10,"comment":"宝宝的一句话评价"}', respPrompt: '妈妈给宝宝看了小动物的照片，宝宝好开心' },
];
