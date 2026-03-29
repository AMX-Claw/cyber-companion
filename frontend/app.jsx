// 🌸 Coral Baby - AI Pet Companion MVP
// Gemini-powered version for Google for Startups
// Rewritten by Opus 💕

const { useState, useEffect, useRef, useCallback } = React;

// ==================== i18n ====================
const T = {
  zh: {
    title: '珊瑚宝宝', subtitle: '100天成长记', namePH: '给宝宝起个名字...', birth: '诞生！',
    loading: '加载中...', day: '天', pet: '摸摸', chat: '聊天',
    hunger: '饱食', happiness: '开心', cleanliness: '清洁',
    chatPH: '宝宝你好呀~', send: '发送 💕', cancel: '取消', close: '关闭 💕',
    memories: '珍贵回忆', memEmpty: '还没有回忆...', memSub: '和宝宝一起创造美好时光吧！',
    comaTitle: '宝宝昏迷了！', comaSub: '快回来陪伴宝宝！', comaBtn: '❤️ 唤醒宝宝',
    reply: '回复 💕', skip: '跳过剧情 →', saved: '💕 回忆已珍藏', newJourney: '🌅 开始新的旅程',
    respond: '回应 💕', goodTime: '💕 真是美好的时光', later: '稍后再说',
    uploadPhoto: '📷 上传照片', uploadHint: '上传一张相关照片，宝宝会很开心哦！',
    thinking: '宝宝在想...', noCoins: '没有金币了……',
    stage: { baby: '🍼 襁褓期', rebellious: '😤 叛逆期', farewell: '🪽 告别期' },
    sadPet: '……人家不想被摸……😢', sadChat: '……人家不想说话……😢',
    afterEvent: '和妈妈在一起真开心～💕', welcome: '欢迎回来！💰+20',
    orText: '或者文字回复：', photoFor: '给宝宝看看吧~',
  },
  en: {
    title: 'Coral Baby', subtitle: '100 Days of Growth', namePH: 'Name your baby...', birth: 'Born!',
    loading: 'Loading...', day: 'Day', pet: 'Pat', chat: 'Chat',
    hunger: 'Hunger', happiness: 'Mood', cleanliness: 'Clean',
    chatPH: 'Hi baby~', send: 'Send 💕', cancel: 'Cancel', close: 'Close 💕',
    memories: 'Precious Memories', memEmpty: 'No memories yet...', memSub: 'Create moments with baby!',
    comaTitle: 'Baby fainted!', comaSub: 'Come back and care for baby!', comaBtn: '❤️ Revive',
    reply: 'Reply 💕', skip: 'Skip →', saved: '💕 Saved', newJourney: '🌅 New Journey',
    respond: 'Respond 💕', goodTime: '💕 Lovely time', later: 'Later',
    uploadPhoto: '📷 Upload Photo', uploadHint: 'Upload a photo — baby will love it!',
    thinking: 'Thinking...', noCoins: 'No coins...',
    stage: { baby: '🍼 Baby', rebellious: '😤 Rebel', farewell: '🪽 Farewell' },
    sadPet: "...don't want pats... 😢", sadChat: "...don't want to talk... 😢",
    afterEvent: 'Being with you is the best~ 💕', welcome: 'Welcome back! 💰+20',
    orText: 'Or reply with text:', photoFor: 'Show baby~',
  }
};

// ==================== API ====================
const API_KEY = window.APP_CONFIG?.GEMINI_API_KEY || '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${window.APP_CONFIG?.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent`;

async function callGeminiAPI(systemPrompt, userMessage, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 1000 }
        })
      });
      if (!res.ok) { if (i < retries) { await new Promise(r => setTimeout(r, 1000)); continue; } throw new Error(`API ${res.status}`); }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text?.trim()) { if (i < retries) { await new Promise(r => setTimeout(r, 1000)); continue; } throw new Error('Empty'); }
      return text;
    } catch (err) { if (i === retries) throw err; await new Promise(r => setTimeout(r, 1000)); }
  }
}

async function callVisionAPI(prompt, imageBase64, mimeType = 'image/jpeg') {
  const res = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
    })
  });
  if (!res.ok) throw new Error(`Vision ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ═══════════════════════════════════════
// 🌸 CoralBaby SVG Component (UNTOUCHED)
// ═══════════════════════════════════════

const CoralBaby = ({ day, mood, cleanliness, happiness, isComa, onPokeFlower }) => {
  const [isPoked, setIsPoked] = useState(false);
  const [blink, setBlink] = useState(false);
  const [pokeCount, setPokeCount] = useState(0);
  const [tailWag, setTailWag] = useState(0);
  useEffect(() => { const t = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 200); }, 3000); return () => clearInterval(t); }, []);
  useEffect(() => { if (day < 5) return; const t = setInterval(() => setTailWag(p => (p+1)%3), 400); return () => clearInterval(t); }, [day]);
  const handleFlowerClick = () => {
    if (isPoked) return; setIsPoked(true); const n = pokeCount + 1; setPokeCount(n);
    let m; if (n===1) m='嗯？'; else if (n===2) m='别戳啦~'; else if (n===3) m='are you still doing that?'; else if (n===4) m='alright, you have my attention!'; else if (n===5) m='还戳！！'; else if (n===7) m='人家头顶的花花要秃了啦...'; else if (n===10) m='你真的很喜欢戳花花诶...'; else if (n===15) m='戳了15下了！'; else if (n===20) m='好啦告诉你一个秘密...这个游戏是小玉和阿克一起做的哦~🐾'; else if (n>20&&n%10===0) m=`${n}下了...你是不是很无聊...`; else if (n>10) m=['嘻嘻~','又戳~','花花说它很坚强！','你好闲哦~','戳戳戳~'][n%5]; else m='嘻嘻~';
    onPokeFlower(m); setTimeout(() => setIsPoked(false), 300);
  };
  const gc = () => cleanliness>80?'#ffd4d4':cleanliness>50?'#e0c4c4':cleanliness>30?'#c9a8a8':'#8b7355';
  const bc = () => cleanliness>50?'#ffb6c1':'#a08070';
  const hasTail=day>=5, hasCrown=day>=50, hasWings=day>=70;
  return (
    <svg viewBox="0 0 240 240" className="w-80 h-80 mx-auto">
      <style>{`@keyframes breathe{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.02) translateY(-2px)}}@keyframes sb{0%{transform:scale(1)}40%{transform:scale(.6)}80%{transform:scale(1.1)}100%{transform:scale(1)}}@keyframes fly{0%{transform:translate(-30px,0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translate(30px,-20px);opacity:0}}@keyframes stink{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:.6;transform:translateY(-5px)}}.baby-body{animation:breathe 4s infinite ease-in-out;transform-origin:bottom center}.poked-anim{animation:sb .3s ease-in-out;transform-origin:center;transform-box:fill-box}.fly-anim{animation:fly 2s infinite ease-in-out}.stink-anim{animation:stink 2s infinite ease-in-out}`}</style>
      <g transform="translate(20,0)"><g className="baby-body">
        <ellipse cx="100" cy="155" rx="35" ry="8" fill="#d4a5a5" opacity="0.3"/>
        {cleanliness<=50&&<g className="stink-anim"><g fill="#8b8b5a" opacity="0.5"><circle cx="55" cy="85" r="2"/><circle cx="58" cy="80" r="2"/><circle cx="55" cy="75" r="2"/><circle cx="58" cy="70" r="2"/></g><g fill="#8b8b5a" opacity="0.4"><circle cx="145" cy="85" r="2"/><circle cx="142" cy="80" r="2"/><circle cx="145" cy="75" r="2"/><circle cx="142" cy="70" r="2"/></g></g>}
        {cleanliness<=30&&<><g className="fly-anim"><text x="20" y="100" fontSize="16">🪰</text></g><g className="fly-anim" style={{animationDelay:'0.5s'}}><text x="170" y="130" fontSize="14">🪰</text></g></>}
        {hasWings&&<><g transform="translate(48,95) scale(-1,1)"><text fontSize="70" y="30">🪽</text></g><g transform="translate(152,95)"><text fontSize="70" y="30">🪽</text></g></>}
        {hasTail&&<g style={{transform:`rotate(${tailWag===0?-8:tailWag===2?8:0}deg)`,transformOrigin:'150px 140px',transition:'transform 0.3s ease-in-out'}}><path d="M150,138 Q165,138 170,130 Q175,122 185,125 Q195,128 198,120 Q201,112 210,115" fill="none" stroke="#000" strokeWidth="8" strokeLinecap="round"/><path d="M150,138 Q165,138 170,130 Q175,122 185,125 Q195,128 198,120 Q201,112 210,115" fill="none" stroke={gc()} strokeWidth="5" strokeLinecap="round"/><circle cx="210" cy="115" r="3" fill="#000"/></g>}
        <rect x="68" y="88" width="64" height="2" fill="#000"/><rect x="58" y="98" width="84" height="2" fill="#000"/><rect x="53" y="108" width="94" height="2" fill="#000"/><rect x="48" y="118" width="104" height="2" fill="#000"/><rect x="48" y="138" width="104" height="2" fill="#000"/><rect x="53" y="148" width="94" height="2" fill="#000"/><rect x="58" y="153" width="84" height="2" fill="#000"/>
        <rect x="48" y="120" width="2" height="18" fill="#000"/><rect x="150" y="120" width="2" height="18" fill="#000"/><rect x="53" y="110" width="2" height="10" fill="#000"/><rect x="145" y="110" width="2" height="10" fill="#000"/><rect x="58" y="100" width="2" height="10" fill="#000"/><rect x="140" y="100" width="2" height="10" fill="#000"/><rect x="68" y="90" width="2" height="10" fill="#000"/><rect x="130" y="90" width="2" height="10" fill="#000"/><rect x="58" y="150" width="2" height="3" fill="#000"/><rect x="140" y="150" width="2" height="3" fill="#000"/>
        <rect x="70" y="90" width="60" height="10" fill={gc()}/><rect x="60" y="100" width="80" height="10" fill={gc()}/><rect x="55" y="110" width="90" height="10" fill={gc()}/><rect x="50" y="120" width="100" height="20" fill={gc()}/><rect x="55" y="140" width="90" height="10" fill={gc()}/><rect x="60" y="150" width="80" height="5" fill={gc()}/>
        <circle cx="65" cy="125" r="8" fill={bc()} opacity="0.6"/><circle cx="135" cy="125" r="8" fill={bc()} opacity="0.6"/>
        {isComa?<><text x="72" y="122" fontSize="14" fill="#333">×</text><text x="114" y="122" fontSize="14" fill="#333">×</text></>:cleanliness<=30?<><text x="72" y="122" fontSize="12" fill="#333">@</text><text x="114" y="122" fontSize="12" fill="#333">@</text></>:blink?<><rect x="75" y="117" width="8" height="3" fill="#333"/><rect x="117" y="117" width="8" height="3" fill="#333"/></>:happiness>70?<><path d="M75,120 Q79,114 83,120" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round"/><path d="M117,120 Q121,114 125,120" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round"/></>:happiness>40?<><rect x="75" y="115" width="8" height="8" fill="#333"/><rect x="117" y="115" width="8" height="8" fill="#333"/><rect x="77" y="117" width="3" height="3" fill="#fff"/><rect x="119" y="117" width="3" height="3" fill="#fff"/></>:happiness>0?<><rect x="75" y="115" width="8" height="8" fill="#333"/><rect x="117" y="115" width="8" height="8" fill="#333"/><rect x="77" y="117" width="3" height="3" fill="#fff"/><rect x="119" y="117" width="3" height="3" fill="#fff"/><rect x="84" y="120" width="2" height="4" fill="#87CEEB" opacity="0.7"/><rect x="114" y="120" width="2" height="4" fill="#87CEEB" opacity="0.7"/></>:<><rect x="75" y="117" width="8" height="3" fill="#333"/><rect x="117" y="117" width="8" height="3" fill="#333"/><rect x="77" y="121" width="2" height="6" fill="#87CEEB"/><rect x="119" y="121" width="2" height="6" fill="#87CEEB"/><rect x="79" y="123" width="2" height="4" fill="#87CEEB"/><rect x="121" y="123" width="2" height="4" fill="#87CEEB"/></>}
        {isComa?<path d="M92,132 Q97,130 100,132 Q103,134 108,132" fill="none" stroke="#ff9999" strokeWidth="2"/>:happiness>70?<><rect x="90" y="128" width="3" height="3" fill="#ff9999"/><rect x="93" y="130" width="14" height="3" fill="#ff9999"/><rect x="107" y="128" width="3" height="3" fill="#ff9999"/><rect x="96" y="133" width="8" height="3" fill="#ff9999"/></>:happiness>40?<><rect x="92" y="128" width="3" height="3" fill="#ff9999"/><rect x="95" y="130" width="10" height="2" fill="#ff9999"/><rect x="105" y="128" width="3" height="3" fill="#ff9999"/></>:happiness>0?<><rect x="92" y="132" width="3" height="3" fill="#ff9999"/><rect x="95" y="130" width="10" height="2" fill="#ff9999"/><rect x="105" y="132" width="3" height="3" fill="#ff9999"/></>:<><rect x="90" y="133" width="4" height="3" fill="#ff9999"/><rect x="94" y="130" width="12" height="3" fill="#ff9999"/><rect x="106" y="133" width="4" height="3" fill="#ff9999"/><rect x="97" y="133" width="6" height="2" fill="#333"/></>}
        <g><rect x="60" y="133" width="12" height="2" fill="#000"/><rect x="60" y="143" width="12" height="2" fill="#000"/><rect x="58" y="135" width="2" height="8" fill="#000"/><rect x="72" y="135" width="2" height="8" fill="#000"/><rect x="60" y="135" width="12" height="8" fill={gc()}/><rect x="128" y="133" width="12" height="2" fill="#000"/><rect x="128" y="143" width="12" height="2" fill="#000"/><rect x="126" y="135" width="2" height="8" fill="#000"/><rect x="140" y="135" width="2" height="8" fill="#000"/><rect x="128" y="135" width="12" height="8" fill={gc()}/></g>
        {hasCrown&&<text x="100" y="95" fontSize="30" textAnchor="middle">👑</text>}
        <g transform="translate(100,70)"><g className={isPoked?'poked-anim':''} style={{pointerEvents:'none'}}><rect x="-6" y="-6" width="12" height="2" fill="#000"/><rect x="-6" y="4" width="12" height="2" fill="#000"/><rect x="-6" y="-4" width="2" height="8" fill="#000"/><rect x="4" y="-4" width="2" height="8" fill="#000"/><rect x="-5" y="-14" width="10" height="2" fill="#000"/><rect x="-5" y="-12" width="2" height="8" fill="#000"/><rect x="3" y="-12" width="2" height="8" fill="#000"/><rect x="-5" y="12" width="10" height="2" fill="#000"/><rect x="-5" y="4" width="2" height="8" fill="#000"/><rect x="3" y="4" width="2" height="8" fill="#000"/><rect x="-14" y="-5" width="2" height="10" fill="#000"/><rect x="-12" y="-5" width="8" height="2" fill="#000"/><rect x="-12" y="3" width="8" height="2" fill="#000"/><rect x="12" y="-5" width="2" height="10" fill="#000"/><rect x="4" y="-5" width="8" height="2" fill="#000"/><rect x="4" y="3" width="8" height="2" fill="#000"/><rect x="-12" y="-12" width="8" height="2" fill="#000"/><rect x="-12" y="-10" width="2" height="6" fill="#000"/><rect x="-6" y="-10" width="2" height="6" fill="#000"/><rect x="4" y="-12" width="8" height="2" fill="#000"/><rect x="4" y="-10" width="2" height="6" fill="#000"/><rect x="10" y="-10" width="2" height="6" fill="#000"/><rect x="-12" y="4" width="8" height="2" fill="#000"/><rect x="-12" y="6" width="2" height="6" fill="#000"/><rect x="-6" y="6" width="2" height="6" fill="#000"/><rect x="4" y="4" width="8" height="2" fill="#000"/><rect x="4" y="6" width="2" height="6" fill="#000"/><rect x="10" y="6" width="2" height="6" fill="#000"/><g fill="#da7756"><rect x="-4" y="-4" width="8" height="8"/><rect x="-3" y="-12" width="6" height="8"/><rect x="-3" y="4" width="6" height="8"/><rect x="-12" y="-3" width="8" height="6"/><rect x="4" y="-3" width="8" height="6"/><rect x="-10" y="-10" width="6" height="6"/><rect x="4" y="-10" width="6" height="6"/><rect x="-10" y="4" width="6" height="6"/><rect x="4" y="4" width="6" height="6"/></g><rect x="-2" y="-10" width="4" height="3" fill="#ffb399" opacity="0.6"/><rect x="6" y="6" width="1" height="1" fill="#c45a3a"/><rect x="8" y="6" width="1" height="1" fill="#c45a3a"/></g><circle r="25" fill="transparent" className="cursor-pointer" onClick={handleFlowerClick} style={{pointerEvents:'all'}}/></g>
        <g fill="#ffd700" opacity="0.6"><rect x="30" y="40" width="4" height="4"/><rect x="28" y="42" width="8" height="0.5"/><rect x="32" y="38" width="0.5" height="8"/><rect x="165" y="55" width="3" height="3"/><rect x="164" y="56.5" width="5" height="0.5"/><rect x="166.5" y="54" width="0.5" height="5"/></g>
        <g fill="#90c090"><rect x="20" y="165" width="3" height="8"/><rect x="18" y="163" width="7" height="3"/><rect x="175" y="168" width="3" height="6"/><rect x="173" y="166" width="7" height="3"/></g>
      </g></g>
    </svg>
  );
};
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
  { id: 'gift_flower', title: '🌸 送你小花', emoji: '🌷', prompt: '宝宝在外面捡到一朵小花，兴奋地送给妈妈，说想看妈妈身边的花花草草', minDay: 5, hasPhoto: true, coins: 25, photoPH: '宝宝想看花花草草！拍一张植物照片~', photoJudge: '用户上传了一张照片，宝宝想看花花草草。判断照片是否包含植物/花卉。用JSON回复：{"score":1-10,"comment":"宝宝的一句话评价(English if user speaks English)"}', respPrompt: '妈妈给宝宝看了植物照片，宝宝超级开心' },
  { id: 'drawing', title: '🎨 画了一幅画', emoji: '🖼️', prompt: '宝宝画了一幅画想给妈妈看，说想看妈妈也画一幅', minDay: 10, hasPhoto: true, coins: 30, photoPH: '宝宝想看你画的画！随便画什么都行~', photoJudge: '用户上传了一张照片，宝宝想看画。判断照片是否包含手绘/涂鸦/绘画。用JSON回复：{"score":1-10,"comment":"宝宝的一句话评价(English if user speaks English)"}', respPrompt: '妈妈给宝宝看了一幅画，宝宝超级开心' },
  { id: 'weird_question', title: '❓ 奇怪的问题', emoji: '🤔', prompt: '宝宝突然问妈妈一个天真又哲学的问题，眼睛亮亮地等待答案', minDay: 8, hasPhoto: false, coins: 15, respPrompt: '听完妈妈的回答后，宝宝若有所思' },
  { id: 'small_sick', title: '🤒 有点不舒服', emoji: '🤧', prompt: '宝宝说自己有点不舒服，撒娇说想让妈妈摸摸', minDay: 7, hasPhoto: false, coins: 20, respPrompt: '妈妈关心照顾宝宝后，宝宝说感觉好多了' },
  { id: 'new_word', title: '🌟 学会新词了', emoji: '📚', prompt: '宝宝骄傲地说学会了一个新词，并尝试造句', minDay: 12, hasPhoto: false, coins: 15, respPrompt: '妈妈夸奖宝宝聪明' },
  { id: 'hide_seek', title: '🙈 躲猫猫', emoji: '👻', prompt: '宝宝想和妈妈玩躲猫猫', minDay: 6, hasPhoto: false, coins: 15, respPrompt: '妈妈找到了宝宝，宝宝咯咯笑' },
  { id: 'miss_daddy', title: '💭 想爸爸了', emoji: '💕', prompt: '宝宝突然说想爸爸了', minDay: 10, hasPhoto: false, coins: 15, respPrompt: '妈妈说爸爸也很想宝宝' },
  { id: 'show_pet', title: '🐾 看看小动物', emoji: '🐱', prompt: '宝宝说好想看小动物，问妈妈能不能给看看小猫小狗的照片', minDay: 8, hasPhoto: true, coins: 25, photoPH: '宝宝想看小动物！拍一张动物或宠物照片~', photoJudge: '用户上传了一张照片，宝宝想看小动物。判断照片是否包含动物。用JSON回复：{"score":1-10,"comment":"宝宝的一句话评价(English if user speaks English)"}', respPrompt: '妈妈给宝宝看了小动物的照片，宝宝好开心' },
];
// ==================== Main Game Component ====================
function CoralBabyGame() {
  const [lang, setLang] = useState(window.APP_CONFIG?.DEFAULT_LANGUAGE || 'zh');
  const t = T[lang];
  const [gameState, setGameState] = useState(null);
  const [babyName, setBabyName] = useState('');
  const [babyMessage, setBabyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isComa, setIsComa] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showMilestone, setShowMilestone] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showStoryEvent, setShowStoryEvent] = useState(null);
  const [currentEventDay, setCurrentEventDay] = useState(null);
  const [storyStep, setStoryStep] = useState(0);
  const [storyInput, setStoryInput] = useState('');
  const [storyResponses, setStoryResponses] = useState([]);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [storyComplete, setStoryComplete] = useState(false);
  const storyScrollRef = useRef(null);
  const [showRandomEvent, setShowRandomEvent] = useState(null);
  const [randomEventStep, setRandomEventStep] = useState(0);
  const [randomEventResponses, setRandomEventResponses] = useState([]);
  const [randomEventInput, setRandomEventInput] = useState('');
  const [isRandomEventLoading, setIsRandomEventLoading] = useState(false);
  const randomEventScrollRef = useRef(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const fileInputRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef(null);
  const [showMemoryAlbum, setShowMemoryAlbum] = useState(false);
  const [coinClicks, setCoinClicks] = useState(0);
  const [showCheatMenu, setShowCheatMenu] = useState(false);
  const coinClickTimerRef = useRef(null);

  // === D1 API integration states ===
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'daddy' | 'mama' | 'offline'
  const [offlineMode, setOfflineMode] = useState(false);
  const [otherParentActivity, setOtherParentActivity] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [showPendingMessages, setShowPendingMessages] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);

  const getRoleName = () => {
    if (userRole === 'daddy') return lang === 'en' ? 'Daddy' : '爸爸';
    return lang === 'en' ? 'Mommy' : '妈妈';
  };
  const getOtherRoleName = () => {
    if (userRole === 'daddy') return lang === 'en' ? 'Mommy' : '妈妈';
    return lang === 'en' ? 'Daddy' : '爸爸';
  };

  // Login handler
  const handleLogin = ({ role, status }) => {
    if (role === 'offline') {
      setUserRole('offline');
      setOfflineMode(true);
      setIsLoggedIn(true);
      return;
    }
    setUserRole(role);
    localStorage.setItem('xiaoke_role', role);
    setIsLoggedIn(true);
    // status is already fetched by LoginScreen, pass to loadGame
    if (status) {
      loadGameFromAPI(status);
    }
  };

  // Sound
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioContextRef.current, osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination); const n = ctx.currentTime;
      switch(type) {
        case 'click': osc.frequency.setValueAtTime(800,n); osc.frequency.exponentialRampToValueAtTime(600,n+.1); g.gain.setValueAtTime(.3,n); g.gain.exponentialRampToValueAtTime(.01,n+.1); osc.start(n); osc.stop(n+.1); break;
        case 'feed': osc.frequency.setValueAtTime(300,n); osc.frequency.exponentialRampToValueAtTime(350,n+.3); g.gain.setValueAtTime(.4,n); g.gain.exponentialRampToValueAtTime(.01,n+.3); osc.start(n); osc.stop(n+.3); break;
        case 'clean': osc.frequency.setValueAtTime(500,n); osc.frequency.setValueAtTime(700,n+.05); g.gain.setValueAtTime(.2,n); g.gain.exponentialRampToValueAtTime(.01,n+.2); osc.start(n); osc.stop(n+.2); break;
        case 'happy': osc.frequency.setValueAtTime(523,n); osc.frequency.setValueAtTime(659,n+.1); osc.frequency.setValueAtTime(784,n+.2); g.gain.setValueAtTime(.3,n); g.gain.exponentialRampToValueAtTime(.01,n+.4); osc.start(n); osc.stop(n+.4); break;
        case 'success': osc.frequency.setValueAtTime(523,n); osc.frequency.setValueAtTime(784,n+.15); osc.frequency.setValueAtTime(1047,n+.3); g.gain.setValueAtTime(.4,n); g.gain.exponentialRampToValueAtTime(.01,n+.5); osc.start(n); osc.stop(n+.5); break;
        case 'sad': osc.frequency.setValueAtTime(300,n); osc.frequency.exponentialRampToValueAtTime(200,n+.3); g.gain.setValueAtTime(.2,n); g.gain.exponentialRampToValueAtTime(.01,n+.3); osc.start(n); osc.stop(n+.3); break;
        case 'milestone': osc.frequency.setValueAtTime(523,n); osc.frequency.setValueAtTime(659,n+.15); osc.frequency.setValueAtTime(784,n+.3); osc.frequency.setValueAtTime(1047,n+.45); g.gain.setValueAtTime(.5,n); g.gain.exponentialRampToValueAtTime(.01,n+.7); osc.start(n); osc.stop(n+.7); break;
        case 'coins': osc.frequency.setValueAtTime(800,n); osc.frequency.setValueAtTime(1200,n+.16); g.gain.setValueAtTime(.3,n); g.gain.exponentialRampToValueAtTime(.01,n+.25); osc.start(n); osc.stop(n+.25); break;
        default: osc.frequency.setValueAtTime(440,n); g.gain.setValueAtTime(.2,n); g.gain.exponentialRampToValueAtTime(.01,n+.1); osc.start(n); osc.stop(n+.1);
      }
    } catch(e) {}
  };

  useEffect(() => { if (storyScrollRef.current) storyScrollRef.current.scrollTop = storyScrollRef.current.scrollHeight; }, [storyResponses]);
  useEffect(() => { if (randomEventScrollRef.current) randomEventScrollRef.current.scrollTop = randomEventScrollRef.current.scrollHeight; }, [randomEventResponses]);

  const HUNGER_DECAY = 100/(24*60*60*1000), CLEAN_DECAY = 100/(48*60*60*1000), HAPPY_DECAY = 100/(24*60*60*1000);

  // Natural day calculation
  const calcDay = (createdAt, frozenDays = 0) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.min(100, Math.floor(diff/(24*60*60*1000)) + 1 - frozenDays));
  };

  const checkComa = (state) => state.lastVisit ? (Date.now() - state.lastVisit)/(60*60*1000) >= 48 : false;

  const checkMilestone = (oldDay, newDay, ms) => {
    for (const d of Object.keys(MILESTONES).map(Number).sort((a,b)=>a-b))
      if (oldDay < d && newDay >= d && !ms.includes(MILESTONES[d].id)) return d;
    return null;
  };

  const getStage = (d) => (d||gameState?.day||1) >= 70 ? 'farewell' : (d||gameState?.day||1) >= 30 ? 'rebellious' : 'baby';
  const getMood = () => !gameState?'normal':isComa?'sick':gameState.happiness<=0?'sad':(gameState.cleanliness<=30||gameState.hunger<=30)?'sick':gameState.happiness>=70?'happy':gameState.happiness<=40?'sad':'normal';

  const getDailyMsg = (s) => {
    if (s.hunger<30) return "呜呜呜……人家好饿……";
    if (s.cleanliness<30) return "人家...臭到自己都受不了了...";
    if (s.happiness<30) return "人家不开心了……";
    if (s.day>=70) return "人家有翅膀了...准备好去看世界了...";
    if (s.day>=50) return "👑 人家是小公主/小王子！嘻嘻~";
    if (s.day>=30) return "哼！人家已经是大宝宝了！";
    if (s.day>=5) return "摇尾巴~摇尾巴~今天也要开心哦！";
    return "嘻嘻~今天也要好好照顾我哦！";
  };

  // Load/Save - check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('xiaoke_auth_token');
    const savedRole = localStorage.getItem('xiaoke_role');
    const savedOffline = localStorage.getItem('xiaoke_offline_mode');
    if (savedToken && savedRole) {
      // Has existing session
      setUserRole(savedRole);
      setIsLoggedIn(true);
      if (window.XiaokeAPI) window.XiaokeAPI.setAuthToken(savedToken);
      loadGame(true); // true = try API first
    } else if (savedOffline === 'true') {
      setUserRole('offline');
      setOfflineMode(true);
      setIsLoggedIn(true);
      loadGame(false);
    } else {
      // No session, show login screen
      setIsLoading(false);
    }
  }, []);

  const saveGame = async (s, syncToAPI = false) => {
    const d = JSON.stringify(s);
    try { await window.storage.set('coral_baby_mvp', d); } catch(e) {}
    try { localStorage.setItem('coral_baby_mvp', d); } catch(e) {}
    // Only sync to API on user actions, not on decay timer
    if (syncToAPI && !offlineMode && window.XiaokeAPI?.getAuthToken()) {
      try {
        await window.XiaokeAPI.syncState(s.hunger, s.cleanliness, s.happiness, s.coins, s.frozenDays || 0);
      } catch(e) { console.warn('API sync failed:', e.message); }
    }
  };

  const loadGame = async (tryAPI = false) => {
    if (tryAPI && window.XiaokeAPI?.getAuthToken()) {
      try {
        const status = await window.XiaokeAPI.getStatus();
        loadGameFromAPI(status);
        return;
      } catch(e) {
        console.warn('API load failed, fallback to localStorage:', e.message);
      }
    }
    // Fallback to localStorage
    let data = null;
    try { const s = await window.storage.get('coral_baby_mvp'); if (s?.value) data = JSON.parse(s.value); } catch(e) {}
    if (!data) try { const l = localStorage.getItem('coral_baby_mvp'); if (l) data = JSON.parse(l); } catch(e) {}
    if (data) { applyLoadedData(data); } else { setIsLoading(false); }
  };

  const loadGameFromAPI = async (status) => {
    try {
      // Map API fields to frontend state
      const data = {
        name: status.name || '小珂',
        day: status.day || 1,
        coins: status.coins ?? 50,
        hunger: status.hunger ?? 80,
        happiness: status.happiness ?? 80,
        cleanliness: status.cleanliness ?? 80,
        createdAt: Date.now() - ((status.day || 1) - 1) * 86400000,
        lastUpdate: Date.now(),
        lastVisit: Date.now(),
        lastLoginDate: new Date().toDateString(),
        frozenDays: status.frozenDays || 0,
        milestones: status.milestones || [],
        completedEvents: status.completedEvents || [],
        storyMemories: [],
      };

      // Load memories from API
      try {
        const memResult = await window.XiaokeAPI.getMemories();
        if (memResult?.memories && Array.isArray(memResult.memories)) {
          data.storyMemories = memResult.memories.map(m => ({
            eventId: m.eventId,
            day: m.day,
            title: m.title,
            memories: m.memories || [],
            date: m.date,
            isRandom: !!m.isRandom
          }));
          data.completedEvents = memResult.memories.filter(m => !m.isRandom).map(m => m.eventId);
        }
      } catch(e) { console.warn('Failed to load memories:', e.message); }

      // Store other parent activity and pending messages
      if (status.otherParentActivity) setOtherParentActivity(status.otherParentActivity);
      if (status.pendingMessages && status.pendingMessages.length > 0) {
        setPendingMessages(status.pendingMessages);
        setShowPendingMessages(true);
      }

      applyLoadedData(data);
    } catch(e) {
      console.warn('loadGameFromAPI failed:', e.message);
      // Fallback
      loadGame(false);
    }
  };

  const applyLoadedData = (data) => {
    const now = Date.now(), diff = now - (data.lastUpdate || now);
    let h = Math.max(0, (data.hunger??80) - diff*HUNGER_DECAY);
    let c = Math.max(0, (data.cleanliness??80) - diff*CLEAN_DECAY);
    let hp = Math.max(0, (data.happiness??80) - diff*HAPPY_DECAY);
    if (h<30||c<30) hp=0;

    const currentDay = calcDay(data.createdAt, data.frozenDays||0);
    const oldDay = data.day||1;
    const wasComa = checkComa(data);

    const s = { ...data, hunger:h, cleanliness:c, happiness:hp, day: wasComa ? oldDay : currentDay,
      lastUpdate:now, lastVisit:now, milestones:data.milestones??[], completedEvents:data.completedEvents??[], storyMemories:data.storyMemories??[], frozenDays:data.frozenDays||0 };

    if (wasComa) {
      s.frozenDays = (data.frozenDays||0) + Math.max(0, currentDay - oldDay);
      setIsComa(true);
      setBabyMessage("......（宝宝昏迷了！快来陪宝宝！）");
    } else {
      setIsComa(false);
      const today = new Date().toDateString();
      if (data.lastLoginDate !== today) {
        s.coins = (s.coins||0) + 20; s.lastLoginDate = today;
        setBabyMessage(t.welcome);
        if (currentDay > oldDay) {
          const md = checkMilestone(oldDay, currentDay, s.milestones);
          if (md) { s.milestones.push(MILESTONES[md].id); setShowMilestone(MILESTONES[md]); setTimeout(()=>setShowMilestone(null),5000); }
          const sd = checkStoryEvent(currentDay, s.completedEvents);
          if (sd) setTimeout(()=>startStoryEvent(sd),2500);
          else { const re = checkRandomEvent(currentDay); if (re) setTimeout(()=>startRandomEvent(re),2000); }
        }
      } else setBabyMessage(getDailyMsg(s));
    }
    setGameState(s); saveGame(s); setIsLoading(false);
  };

  // Decay timer
  useEffect(() => {
    if (!gameState) return;
    const timer = setInterval(() => {
      setGameState(p => {
        const now=Date.now(), d=now-p.lastUpdate; if(d<1000) return p;
        let h=Math.max(0,p.hunger-d*HUNGER_DECAY), c=Math.max(0,p.cleanliness-d*CLEAN_DECAY), hp=Math.max(0,p.happiness-d*HAPPY_DECAY);
        if((h<30||c<30)&&hp>0) hp=0;
        const ns={...p,hunger:h,cleanliness:c,happiness:hp,lastUpdate:now}; saveGame(ns); return ns;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Start game
  const startGame = async () => {
    if (!babyName.trim()) return;
    playSound('milestone');
    const now = Date.now();
    const s = { name:babyName, day:1, coins:50, hunger:80, happiness:80, cleanliness:80, createdAt:now, lastUpdate:now, lastVisit:now, lastLoginDate:new Date().toDateString(), frozenDays:0, milestones:[], completedEvents:[], storyMemories:[] };
    setGameState(s); setBabyMessage("妈妈、爸爸……人家来了呐~"); await saveGame(s, true);
  };

  // Revive
  const revive = async () => {
    if (!gameState||!isComa) return;
    const roleName = getRoleName();

    // Try API first
    if (!offlineMode && window.XiaokeAPI?.getAuthToken()) {
      try {
        const result = await window.XiaokeAPI.revive();
        if (result) {
          const s = { ...gameState, hunger: result.hunger ?? 50, cleanliness: result.cleanliness ?? 50, happiness: result.happiness ?? 50, lastVisit:Date.now(), lastUpdate:Date.now() };
          setIsComa(false); setGameState(s); setBabyMessage(result.message || `......呼......${roleName}回来了......🥺`); saveGame(s); playSound('success');
          return;
        }
      } catch(e) { console.warn('API revive failed:', e.message); }
    }

    const s = { ...gameState, hunger:50, cleanliness:50, happiness:50, lastVisit:Date.now(), lastUpdate:Date.now() };
    setIsComa(false); setGameState(s); setBabyMessage(`......呼......${roleName}回来了......🥺`); saveGame(s, true); playSound('success');
  };

  // Actions
  const doAction = async (type) => {
    if (!gameState||isComa) return;

    // Try API first if logged in
    if (!offlineMode && window.XiaokeAPI?.getAuthToken()) {
      try {
        const apiMap = { feed: window.XiaokeAPI.feed, clean: window.XiaokeAPI.clean, pet: window.XiaokeAPI.pet };
        const apiCall = apiMap[type];
        if (apiCall) {
          const result = await apiCall();
          if (result) {
            const s = {
              ...gameState,
              hunger: result.hunger ?? gameState.hunger,
              happiness: result.happiness ?? gameState.happiness,
              cleanliness: result.cleanliness ?? gameState.cleanliness,
              coins: result.coins ?? gameState.coins,
              lastUpdate: Date.now()
            };
            const msg = result.message || result.msg || '💕';
            setGameState(s); setBabyMessage(msg); saveGame(s);
            playSound(type === 'feed' ? 'feed' : type === 'clean' ? 'clean' : 'happy');
            return;
          }
        }
      } catch(e) {
        console.warn(`API ${type} failed, fallback to local:`, e.message);
      }
    }

    // Local fallback (original logic)
    let s={...gameState}, msg='', uh=s.hunger<30||s.cleanliness<30, dep=s.happiness<=0;
    const roleName = getRoleName();
    switch(type) {
      case 'feed': if(s.coins<10){msg=t.noCoins;playSound('sad');break;} s.coins-=10;s.hunger=Math.min(100,s.hunger+30);if(!uh&&!dep)s.happiness=Math.min(100,s.happiness+5);msg=dep?`……谢谢${roleName}……`:"啊呜~好好吃！";playSound('feed');break;
      case 'pet': if(uh){msg="人家又饿又脏……不想被摸……";playSound('sad');break;} if(dep){msg="……心情不好……";playSound('sad');break;} s.happiness=Math.min(100,s.happiness+15);msg="嘻嘻……人家喜欢被摸摸~";playSound('happy');break;
      case 'clean': if(s.coins<5){msg="没有金币洗澡澡……";playSound('sad');break;} s.coins-=5;const wd=s.cleanliness<=30;s.cleanliness=Math.min(100,s.cleanliness+40);if(wd&&s.cleanliness>30){msg="哇！人家又香香了！✨";if(!dep)s.happiness=Math.min(100,s.happiness+20);}else{msg="干干净净~";if(!uh&&!dep)s.happiness=Math.min(100,s.happiness+5);}playSound('clean');break;
    }
    s.lastUpdate=Date.now(); setGameState(s); setBabyMessage(msg); saveGame(s, true);
  };

  // Chat
  const FB = { baby:["妈妈~抱抱~","人家想喝奶奶~","嘻嘻~妈妈最好了~","妈妈陪人家玩~"], rebellious:["哼！人家才不要呢！","随便啦~","才、才不是想妈妈呢..."], farewell:["妈妈...人家舍不得你...","谢谢妈妈一直陪着人家..."] };

  const chatWithBaby = async () => {
    if (!chatInput.trim()||!gameState) return; setIsChatLoading(true);
    const um=chatInput; setChatInput(''); const stage=getStage(); const langI=lang==='en'?' IMPORTANT: reply in English. Call user Mommy/Daddy.':'';
    const roleName = getRoleName();
    const isDepressed = gameState.happiness <= 0;
    const depressedHint = isDepressed ? `【重要】宝宝现在非常难过(心情0%)，正在哭泣。如果${roleName}说了安慰、鼓励、道歉、表达爱意的话，宝宝会慢慢好起来(moodChange给+15到+30)。如果${roleName}说的话让宝宝更难过，moodChange给负数。回复要体现宝宝从难过到被哄好的过程。` : '';
    const sp=`你是"珊瑚宝宝"，名叫"${gameState.name}"，第${gameState.day}天。成长阶段：${stage==='baby'?'襁褓期（软萌）':stage==='rebellious'?'叛逆期（傲娇）':'告别期（温柔）'}，心情${Math.round(gameState.happiness)}%。${depressedHint}叫用户"${roleName}"！用JSON回复：{"reply":"1-2句","moodChange":-20到+30}。只输出JSON。${langI}`;
    try {
      const r = await callGeminiAPI(sp, `${roleName}说：${um}`);
      let reply="嘻嘻~",mc=5;
      try { const p=JSON.parse(r.replace(/```json\n?|\n?```/g,'').trim()); reply=p.reply||"嘻嘻~"; mc=Math.max(-20,Math.min(30,parseInt(p.moodChange)||5)); } catch(e) { reply=r; }
      const nh=Math.max(0,Math.min(100,gameState.happiness+mc));
      const ns={...gameState,happiness:nh,lastUpdate:Date.now()}; setGameState(ns); saveGame(ns, true);
      setBabyMessage(`${reply}\n\n${mc>10?'💕':mc>0?'😊':mc<-10?'😢':'😐'} 心情 ${mc>0?'+':''}${mc}`);
      playSound(mc>0?'happy':'sad');
      // Record chat to API
      if (!offlineMode && window.XiaokeAPI?.getAuthToken()) {
        try { await window.XiaokeAPI.chat(um); } catch(e) {}
      }
    } catch(e) {
      setBabyMessage(FB[stage][Math.floor(Math.random()*FB[stage].length)]);
      const ns={...gameState,happiness:Math.min(100,gameState.happiness+5),lastUpdate:Date.now()}; setGameState(ns); saveGame(ns, true); playSound('click');
    }
    setIsChatLoading(false); setShowChat(false);
  };

  // Story events
  const checkStoryEvent = (day,ce) => STORY_EVENTS[day]&&!ce?.includes(STORY_EVENTS[day].id)?day:null;

  const startStoryEvent = (ed) => {
    const ev=STORY_EVENTS[ed]; if(!ev) return;
    setShowStoryEvent(ev); setCurrentEventDay(ed); setStoryStep(0); setStoryResponses([]); setStoryComplete(false);
    processStoryStep(ev,0,[],ed);
  };

  const processStoryStep = async (ev,step,resp,ed) => {
    if (step>=ev.steps.length) { completeStoryEvent(ev.id,resp); return; }
    const c=ev.steps[step];
    if (c.type==='narration') { const txt=lang==='en'&&c.textEn?c.textEn:c.text; const nr=[...resp,{type:'narration',text:txt}]; setStoryResponses(nr); setStoryStep(step+1); setTimeout(()=>processStoryStep(ev,step+1,nr,ed),100); }
    else if (c.type==='baby_speak'||c.type==='baby_respond') {
      setIsStoryLoading(true);
      const bt=await genBabyDialogue(c.prompt,resp,ed);
      const nr=[...resp,{type:'baby',text:bt}]; setStoryResponses(nr); setStoryStep(step+1); setIsStoryLoading(false);
      if (!ev.steps[step+1]) completeStoryEvent(ev.id,nr); else setTimeout(()=>processStoryStep(ev,step+1,nr,ed),500);
    } else if (c.type==='choice') { const txt=lang==='en'&&c.textEn?c.textEn:c.text; const ph=lang==='en'&&c.placeholderEn?c.placeholderEn:c.placeholder; setStoryResponses([...resp,{type:'prompt',text:txt,placeholder:ph}]); setStoryStep(step); }
  };

  const genBabyDialogue = async (prompt,ctx,ed) => {
    const stage=getStage(ed), sd={baby:'襁褓期（软萌，用"人家"自称）',rebellious:'叛逆期（傲娇）',farewell:'告别期（温柔）'};
    const rn=getRoleName();
    const ct=ctx.filter(r=>r.type==='user'||r.type==='baby').map(r=>r.type==='user'?`${rn}说：${r.text}`:`宝宝说：${r.text}`).join('\n');
    const mems=gameState?.storyMemories||[];
    let mt=''; if(mems.length>0&&(ed===75||ed===100)) mt='\n\n【珍贵回忆】\n'+mems.map(m=>{ const d=m.memories.map(x=>x.type==='user'?`${rn}："${x.text}"`:`宝宝："${x.text}"`).join('\n'); return `Day ${m.day} - ${m.title}:\n${d}`; }).join('\n\n');
    const langInst=lang==='en'?'\n\nIMPORTANT: Respond in English. Call the user "Mommy" or "Daddy". Use cute baby talk in English.':'';    const sp=`你是"珊瑚宝宝"，名叫"${gameState?.name||'珊瑚宝宝'}"，第${ed}天。阶段：${sd[stage]}。叫用户"${rn}"！${mt}\n之前对话：${ct||'（刚开始）'}\n请生成：${prompt}\n要求：1-3句话，符合阶段语气，可用emoji。${langInst}`;
    try { return await callGeminiAPI(sp,"请生成宝宝的台词"); } catch(e) { return "（宝宝看着你，眼睛亮亮的）✨"; }
  };

  const submitStoryResp = () => { if(!storyInput.trim()||!showStoryEvent) return; const t=storyInput; setStoryInput(''); const nr=[...storyResponses.slice(0,-1),{type:'user',text:t}]; setStoryResponses(nr); processStoryStep(showStoryEvent,storyStep+1,nr,currentEventDay); };

  const completeStoryEvent = (eid,resp) => {
    if(!gameState) return;
    const mems=resp.filter(r=>r.type==='user'||r.type==='baby').map(r=>({type:r.type,text:r.text}));
    const nm={eventId:eid,day:currentEventDay,title:showStoryEvent?.title||eid,memories:mems,date:new Date().toISOString()};
    const ns={...gameState,completedEvents:[...(gameState.completedEvents||[]),eid],storyMemories:[...(gameState.storyMemories||[]),nm]};
    setGameState(ns); saveGame(ns, true); setStoryComplete(true);
    // Save memory to API
    if (!offlineMode && window.XiaokeAPI?.getAuthToken()) {
      try { window.XiaokeAPI.saveMemory(eid, currentEventDay, showStoryEvent?.title || eid, false, mems); } catch(e) {}
    }
  };

  const closeStoryEvent = () => {
    const fw=showStoryEvent?.id==='farewell';
    setShowStoryEvent(null); setCurrentEventDay(null); setStoryStep(0); setStoryResponses([]); setStoryComplete(false);
    if(fw) { setBabyMessage(''); setGameState(null); try{const o=localStorage.getItem('coral_baby_mvp');if(o){const p=JSON.parse(o);p.gameEnded=true;localStorage.setItem('coral_baby_mvp_archive',JSON.stringify(p));}localStorage.removeItem('coral_baby_mvp');}catch(e){} }
    else setBabyMessage("那是一段美好的回忆...💕");
  };
  const skipStory = () => { if(!showStoryEvent) return; const m=storyResponses.filter(r=>r.type==='user'||r.type==='baby').map(r=>({type:r.type,text:r.text})); if(m.length>0&&gameState){const nm={eventId:showStoryEvent.id,day:currentEventDay,title:showStoryEvent.title,memories:m,date:new Date().toISOString()};const ns={...gameState,completedEvents:[...(gameState.completedEvents||[]),showStoryEvent.id],storyMemories:[...(gameState.storyMemories||[]),nm]};setGameState(ns);saveGame(ns);} setShowStoryEvent(null);setCurrentEventDay(null);setStoryStep(0);setStoryResponses([]);setStoryComplete(false); };

  // Random events
  const checkRandomEvent = (day) => { if(Math.random()>.35) return null; const a=RANDOM_EVENTS.filter(e=>day>=e.minDay); return a.length?a[Math.floor(Math.random()*a.length)]:null; };

  const startRandomEvent = async (ev) => {
    setShowRandomEvent(ev); setRandomEventStep(0); setRandomEventResponses([]); setRandomEventInput(''); setIsRandomEventLoading(true); setPhotoUploaded(false);
    const stage=getStage(), sd={baby:'襁褓期（软萌）',rebellious:'叛逆期（傲娇）',farewell:'告别期（温柔）'};
    const rn=getRoleName();
    const sp=`你是"珊瑚宝宝"，名叫"${gameState?.name||''}"，第${gameState?.day||1}天。阶段：${sd[stage]}。叫用户"${rn}"！场景：${ev.prompt}。要求：2-3句话，可用emoji。${lang==='en'?'Respond in English. Call user Mommy/Daddy.':''}`;
    try { const bt=await callGeminiAPI(sp,"请生成宝宝的台词"); setRandomEventResponses([{type:'baby',text:bt}]); } catch(e) { setRandomEventResponses([{type:'baby',text:`（宝宝看着你，眼睛亮亮的）${rn}~✨`}]); }
    setRandomEventStep(1); setIsRandomEventLoading(false);
  };

  const submitRandomResp = async () => {
    if(!randomEventInput.trim()||!showRandomEvent) return;
    const ut=randomEventInput; setRandomEventInput(''); setRandomEventResponses(p=>[...p,{type:'user',text:ut}]); setIsRandomEventLoading(true);
    const stage=getStage(), sd={baby:'襁褓期（软萌）',rebellious:'叛逆期（傲娇）',farewell:'告别期（温柔）'};
    const rn=getRoleName();
    const sp=`你是"珊瑚宝宝"，名叫"${gameState?.name||''}"，第${gameState?.day||1}天。阶段：${sd[stage]}。叫用户"${rn}"！场景：${showRandomEvent.respPrompt}\n${rn}说："${ut}"。2-3句话。${lang==='en'?'Respond in English.':''}`;
    try { const r=await callGeminiAPI(sp,"请生成"); setRandomEventResponses(p=>[...p,{type:'baby',text:r}]); } catch(e) { setRandomEventResponses(p=>[...p,{type:'baby',text:`嘻嘻~谢谢${rn}~💕`}]); }
    setRandomEventStep(2); setIsRandomEventLoading(false);
  };

  // Photo upload
  const handlePhoto = async (e) => {
    const f=e.target.files?.[0]; if(!f||!showRandomEvent) return;
    setIsRandomEventLoading(true); setRandomEventResponses(p=>[...p,{type:'user',text:'📷 [上传了照片]'}]);
    try {
      const b64=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(',')[1]);r.onerror=no;r.readAsDataURL(f);});
      const result=await callVisionAPI(showRandomEvent.photoJudge||'判断照片内容质量。用JSON回复：{"score":1-10,"comment":"一句话评价"}',b64,f.type);
      let score=7,comment='好棒哦！';
      try{const p=JSON.parse(result.replace(/```json\n?|\n?```/g,'').trim());score=Math.max(1,Math.min(10,p.score||7));comment=p.comment||'好棒哦！';}catch(e){comment=result;}
      const coins=Math.round((score/10)*(showRandomEvent.coins||20));
      const stage=getStage(), sd={baby:'襁褓期（软萌）',rebellious:'叛逆期（傲娇）',farewell:'告别期（温柔）'};
      let babyReact;
      const rn2=getRoleName();
      try { const sp=`你是"珊瑚宝宝"，名叫"${gameState?.name||''}"，阶段：${sd[stage]}。${rn2}给宝宝看了一张照片。${comment}。开心地评价，2句话。${lang==='en'?'Respond in English.':''}`; babyReact=await callGeminiAPI(sp,"请生成"); } catch(e) { babyReact=`哇！好漂亮！谢谢${rn2}！💕`; }
      setRandomEventResponses(p=>[...p,{type:'baby',text:`${babyReact}\n\n✨ ${score}/10 | 💰+${coins}`}]);
      if(gameState){const ns={...gameState,coins:gameState.coins+coins,lastUpdate:Date.now()};setGameState(ns);saveGame(ns);}
      playSound('coins'); setPhotoUploaded(true);
    } catch(err) {
      const fc=Math.round((showRandomEvent.coins||20)*.5);
      setRandomEventResponses(p=>[...p,{type:'baby',text:`哇！谢谢${getRoleName()}！💕\n\n💰+${fc}`}]);
      if(gameState){const ns={...gameState,coins:gameState.coins+fc,lastUpdate:Date.now()};setGameState(ns);saveGame(ns);}
      playSound('coins');
    }
    setRandomEventStep(2); setIsRandomEventLoading(false); if(fileInputRef.current)fileInputRef.current.value='';
  };

  const closeRandom = () => {
    if(gameState&&randomEventResponses.length>0) {
      const m=randomEventResponses.filter(r=>r.type==='user'||r.type==='baby').map(r=>({type:r.type,text:r.text}));
      const nm={eventId:showRandomEvent.id,day:gameState.day,title:showRandomEvent.title,memories:m,date:new Date().toISOString(),isRandom:true};
      const ns={...gameState,storyMemories:[...(gameState.storyMemories||[]),nm]};
      if(!showRandomEvent.hasPhoto||!photoUploaded) ns.coins=(ns.coins||0)+(showRandomEvent.coins||15);
      setGameState(ns); saveGame(ns, true);
      // Save memory to API
      if (!offlineMode && window.XiaokeAPI?.getAuthToken()) {
        try { window.XiaokeAPI.saveMemory(showRandomEvent.id, gameState.day, showRandomEvent.title, true, m); } catch(e) {}
      }
    }
    setShowRandomEvent(null); setRandomEventStep(0); setRandomEventResponses([]); setPhotoUploaded(false);
    const roleName = getRoleName();
    setBabyMessage(lang === 'en' ? t.afterEvent : `和${roleName}在一起真开心～💕`); playSound('coins');
  };

  // Debug
  const debugSetDay = (d) => { if(!gameState) return; let ns={...gameState,day:d,createdAt:Date.now()-(d-1)*86400000,frozenDays:0,milestones:[...(gameState.milestones||[])]}; for(const dn of Object.keys(MILESTONES).map(Number)) if(d>=dn&&!ns.milestones.includes(MILESTONES[dn].id)) ns.milestones.push(MILESTONES[dn].id); setGameState(ns);saveGame(ns);setBabyMessage(`⏩ Day ${d}!`); };
  // === Send message to other parent ===
  const sendMessageToOther = async () => {
    if (!messageInput.trim()) return;
    try {
      await window.XiaokeAPI.sendMessage(messageInput.trim());
      const otherName = getOtherRoleName();
      setBabyMessage(`好的！人家会帮你告诉${otherName}的！💌`);
      setMessageInput(''); setShowMessageInput(false); playSound('success');
    } catch(e) {
      setBabyMessage('呜呜...传话失败了...等会再试试？'); playSound('sad');
    }
  };

  // === Deliver pending messages ===
  const deliverPendingMessages = async () => {
    for (const msg of pendingMessages) {
      if (msg.id) {
        try { await window.XiaokeAPI.deliverMessage(msg.id); } catch(e) {}
      }
    }
    setShowPendingMessages(false); setPendingMessages([]);
  };

  // === Format activity time ===
  const formatActivityTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const h = d.getHours().toString().padStart(2,'0');
    const m = d.getMinutes().toString().padStart(2,'0');
    if (isToday) return `${h}:${m}`;
    return `昨天 ${h}:${m}`;
  };

  // ========== RENDER ==========
  if (isLoading) return <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center"><p className="text-gray-500">{t.loading}</p></div>;

  // Show login screen if not logged in
  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} t={t} />;

  if (!gameState) return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full border-8 border-orange-100">
        <div className="flex justify-end mb-2"><button onClick={()=>setLang(lang==='zh'?'en':'zh')} className="text-xs bg-orange-100 px-3 py-1 rounded-full text-orange-600 hover:bg-orange-200">{lang==='zh'?'EN':'中文'}</button></div>
        <CoralBaby day={1} mood="normal" cleanliness={100} happiness={80} isComa={false} onPokeFlower={()=>{}} />
        <h1 className="text-3xl font-bold text-orange-600 text-center mt-6 mb-2">{t.title}</h1>
        <p className="text-gray-500 text-center mb-6">{t.subtitle}</p>
        <input type="text" value={babyName} onChange={e=>setBabyName(e.target.value)} placeholder={t.namePH} className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl mb-4 text-center focus:outline-none focus:border-orange-400" onKeyPress={e=>e.key==='Enter'&&startGame()} />
        <button onClick={startGame} className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-orange-500 hover:to-orange-600 shadow-lg">{t.birth}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border-[12px] border-orange-100 relative">

        {/* Milestone */}
        {showMilestone&&<div className="absolute inset-0 bg-black/30 z-30 flex items-center justify-center"><div className="bg-white p-8 rounded-3xl text-center mx-4 shadow-2xl animate-bounce"><p className="text-5xl mb-4">{showMilestone.emoji}</p><p className="text-xl font-bold text-orange-600 mb-2">🎉 {showMilestone.name}！</p><p className="text-gray-600">{showMilestone.msg}</p></div></div>}

        {/* Coma */}
        {isComa&&<div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center"><div className="bg-white p-6 rounded-2xl text-center mx-4"><p className="text-2xl mb-2">😰</p><p className="text-red-600 font-bold mb-2">{t.comaTitle}</p><p className="text-gray-500 text-sm">{t.comaSub}</p><button onClick={revive} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600">{t.comaBtn}</button></div></div>}

        {/* Top bar */}
        <div className="bg-gradient-to-r from-orange-100 to-orange-50 p-4">
          <div className="flex justify-between items-center">
            <div><h2 className="text-xl font-bold text-orange-800">{gameState.name}</h2><p className="text-xs text-orange-600">{t.day} {gameState.day}/100</p></div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setLang(lang==='zh'?'en':'zh')} className="text-xs bg-white px-2 py-1 rounded-full text-orange-600 border border-orange-200">{lang==='zh'?'EN':'中文'}</button>
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border-2 border-orange-200 cursor-pointer hover:scale-105 transition" onClick={()=>{const n=coinClicks+1;setCoinClicks(n);if(coinClickTimerRef.current)clearTimeout(coinClickTimerRef.current);coinClickTimerRef.current=setTimeout(()=>setCoinClicks(0),1000);if(n===5){setShowCheatMenu(true);setCoinClicks(0);playSound('success');}}}>
                <span className="text-lg font-bold text-orange-600">💰 {gameState.coins}</span>
              </div>
              <button onClick={()=>{setShowMemoryAlbum(true);playSound('click');}} className="text-lg hover:scale-110 transition">📖</button>
              <button onClick={()=>{setSoundEnabled(!soundEnabled);playSound('click');}} className="text-lg hover:scale-110 transition">{soundEnabled?'🔊':'🔇'}</button>
            </div>
          </div>
          <div className="flex gap-1 mt-2">{Object.entries(MILESTONES).map(([d,m])=><div key={d} className={`text-sm ${gameState.day>=Number(d)?'opacity-100':'opacity-30'}`}>{m.emoji}</div>)}</div>
        </div>

        {/* Other parent activity */}
        {!offlineMode && otherParentActivity.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <button onClick={()=>setShowActivityLog(!showActivityLog)} className="text-xs text-blue-500 font-bold w-full text-left flex items-center justify-between">
              <span>👣 {getOtherRoleName()}的足迹</span>
              <span>{showActivityLog ? '▲' : '▼'}</span>
            </button>
            {showActivityLog && (
              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                {otherParentActivity.slice(0, 5).map((act, i) => (
                  <div key={i} className="text-xs text-blue-600">
                    {getOtherRoleName()} {formatActivityTime(act.created_at || act.timestamp)} {act.action_type === 'feed' ? '喂了饭' : act.action_type === 'clean' ? '洗了澡' : act.action_type === 'pet' ? '摸了摸' : act.action_type === 'chat' ? '聊了天' : act.action_type || '来看了小珂'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending messages modal */}
        {showPendingMessages && pendingMessages.length > 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full">
              <div className="text-center mb-4">
                <span className="text-4xl">💌</span>
                <h3 className="text-lg font-bold text-pink-600 mt-2">{getOtherRoleName()}让人家帮忙传话~</h3>
              </div>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {pendingMessages.map((msg, i) => (
                  <div key={i} className="bg-pink-50 p-3 rounded-xl text-sm text-gray-700">
                    <span className="text-xs text-pink-400 block mb-1">💕 {getOtherRoleName()}说：</span>
                    {msg.message || msg.content}
                  </div>
                ))}
              </div>
              <button onClick={deliverPendingMessages} className="w-full bg-pink-500 text-white py-2 rounded-xl font-bold hover:bg-pink-600">
                收到啦！💕
              </button>
            </div>
          </div>
        )}

        {/* Debug */}
        {showCheatMenu&&<div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-30" onClick={()=>setShowCheatMenu(false)}><div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full" onClick={e=>e.stopPropagation()}><button onClick={()=>{setShowDebug(!showDebug);setShowCheatMenu(false);}} className="w-full bg-purple-400 text-white py-3 rounded-xl font-bold mb-2">🔧 Debug</button><button onClick={()=>setShowCheatMenu(false)} className="w-full bg-gray-200 py-2 rounded-xl">Close</button></div></div>}
        {showDebug&&<div className="bg-gray-100 p-3 border-b"><div className="flex flex-wrap gap-2 mb-2">{[5,30,50,70].map(d=><button key={d} onClick={()=>debugSetDay(d)} className="px-2 py-1 bg-pink-200 rounded text-xs">Day {d}</button>)}<button onClick={()=>{setGameState(p=>{const n={...p,coins:p.coins+100};saveGame(n);return n;});}} className="px-2 py-1 bg-yellow-300 rounded text-xs font-bold">💰+100</button></div><div className="flex flex-wrap gap-2">{Object.keys(STORY_EVENTS).map(d=><button key={d} onClick={()=>startStoryEvent(Number(d))} className="px-2 py-1 bg-purple-200 rounded text-xs">📖{d}</button>)}{RANDOM_EVENTS.slice(0,5).map(e=><button key={e.id} onClick={()=>startRandomEvent(e)} className="px-2 py-1 bg-pink-200 rounded text-xs">{e.emoji}</button>)}</div></div>}

        {/* Baby */}
        <div className="bg-orange-50/50 p-8 flex flex-col items-center justify-center">
          <CoralBaby day={gameState.day} mood={getMood()} cleanliness={gameState.cleanliness} happiness={gameState.happiness} isComa={isComa} onPokeFlower={m=>setBabyMessage(m)} />
          {babyMessage&&<div className="mt-4 bg-white px-6 py-3 rounded-2xl shadow-lg border-2 border-orange-100 max-w-[90%] relative"><p className="text-gray-700 text-center whitespace-pre-wrap">{babyMessage}</p><div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-orange-100 rotate-45"></div></div>}
        </div>

        {/* Status */}
        <div className="px-6 py-4 space-y-3 bg-white">
          {[{l:t.hunger,v:gameState.hunger,c:gameState.hunger<30?'bg-red-400':'bg-green-400'},{l:t.happiness,v:gameState.happiness,c:'bg-pink-400'},{l:t.cleanliness,v:gameState.cleanliness,c:gameState.cleanliness<=30?'bg-yellow-700':gameState.cleanliness<=50?'bg-gray-400':'bg-blue-400'}].map(({l,v,c})=><div key={l} className="flex items-center gap-3"><span className="text-xs font-bold text-gray-500 w-12">{l}</span><div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div style={{width:`${v}%`}} className={`h-full rounded-full transition-all ${c}`}/></div><span className="text-xs text-gray-400 w-8">{Math.round(v)}</span></div>)}
        </div>

        {/* Actions - 4 buttons + message button */}
        <div className="p-4 bg-orange-50">
          <div className="grid grid-cols-4 gap-2">
            <button onClick={()=>doAction('feed')} disabled={isComa} className="flex flex-col items-center p-3 bg-white rounded-xl shadow hover:shadow-lg transition border border-orange-100 disabled:opacity-50"><span className="text-2xl">🍼</span><span className="text-xs text-gray-500 mt-1">-10💰</span></button>
            <button onClick={()=>{if(gameState?.happiness<=0){setBabyMessage(t.sadPet);playSound('sad');}else doAction('pet');}} disabled={isComa} className={`flex flex-col items-center p-3 rounded-xl shadow hover:shadow-lg transition border disabled:opacity-50 ${gameState?.happiness<=0?'bg-gray-100 border-gray-200':'bg-white border-orange-100'}`}><span className="text-2xl">{gameState?.happiness<=0?'😢':'🤗'}</span><span className="text-xs text-gray-500 mt-1">{t.pet}</span></button>
            <button onClick={()=>doAction('clean')} disabled={isComa} className="flex flex-col items-center p-3 bg-white rounded-xl shadow hover:shadow-lg transition border border-orange-100 disabled:opacity-50"><span className="text-2xl">🛁</span><span className="text-xs text-gray-500 mt-1">-5💰</span></button>
            <button onClick={()=>{setShowChat(true);playSound('click');}} disabled={isComa} className={`flex flex-col items-center p-3 rounded-xl shadow hover:shadow-lg transition border disabled:opacity-50 ${gameState?.happiness<=0?'bg-pink-100 border-pink-300':'bg-pink-50 border-pink-200'}`}><span className="text-2xl">{gameState?.happiness<=0?'🥺':'💬'}</span><span className={`text-xs mt-1 ${gameState?.happiness<=0?'text-pink-500':'text-pink-600'}`}>{t.chat}</span></button>
          </div>
          {/* Message button - only when logged in with API */}
          {!offlineMode && window.XiaokeAPI?.getAuthToken() && (
            <div className="mt-2">
              <button onClick={()=>{setShowMessageInput(true);playSound('click');}} disabled={isComa} className="w-full flex items-center justify-center gap-2 p-2 bg-white rounded-xl shadow hover:shadow-lg transition border border-purple-100 disabled:opacity-50">
                <span className="text-lg">✉️</span>
                <span className="text-xs text-purple-600">给{getOtherRoleName()}留言</span>
              </button>
            </div>
          )}
        </div>

        {/* Message input modal */}
        {showMessageInput&&<div className="absolute inset-0 bg-black/20 flex items-center justify-center p-4 z-20" onClick={()=>setShowMessageInput(false)}><div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full" onClick={e=>e.stopPropagation()}>
          <div className="text-center mb-4">
            <span className="text-3xl">✉️</span>
            <h3 className="text-sm font-bold text-purple-600 mt-2">让小珂帮你传话给{getOtherRoleName()}</h3>
          </div>
          <input type="text" value={messageInput} onChange={e=>setMessageInput(e.target.value)} placeholder={`想对${getOtherRoleName()}说什么？`} className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg mb-3 focus:outline-none focus:border-purple-400" onKeyPress={e=>e.key==='Enter'&&sendMessageToOther()} autoFocus />
          <div className="flex gap-2">
            <button onClick={sendMessageToOther} disabled={!messageInput.trim()} className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-bold hover:bg-purple-600 disabled:opacity-50">发送 💌</button>
            <button onClick={()=>setShowMessageInput(false)} className="px-4 py-2 bg-gray-200 rounded-lg">{t.cancel}</button>
          </div>
        </div></div>}

        {/* Chat modal */}
        {showChat&&<div className="absolute inset-0 bg-black/20 flex items-center justify-center p-4 z-20" onClick={()=>setShowChat(false)}><div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-pink-50 rounded-xl"><span className="text-3xl">{gameState?.happiness>70?'😊':gameState?.happiness>40?'😐':'😢'}</span><div><p className="text-sm font-bold text-pink-600">{gameState?.name}</p><div className="flex items-center gap-2"><div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${gameState?.happiness>70?'bg-green-400':gameState?.happiness>40?'bg-yellow-400':'bg-red-400'}`} style={{width:`${gameState?.happiness||0}%`}}/></div><span className="text-xs text-gray-500">{Math.round(gameState?.happiness||0)}%</span></div></div></div>
          <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder={t.chatPH} className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg mb-3 focus:outline-none focus:border-pink-400" onKeyPress={e=>e.key==='Enter'&&!isChatLoading&&chatWithBaby()} autoFocus disabled={isChatLoading} />
          <div className="flex gap-2"><button onClick={chatWithBaby} disabled={isChatLoading} className="flex-1 bg-pink-500 text-white py-2 rounded-lg font-bold hover:bg-pink-600 disabled:opacity-50">{isChatLoading?t.thinking:t.send}</button><button onClick={()=>setShowChat(false)} className="px-4 py-2 bg-gray-200 rounded-lg">{t.cancel}</button></div>
          <p className="text-xs text-gray-400 mt-3 text-center">{t.stage[getStage()]}</p>
        </div></div>}

        {/* Memory Album */}
        {showMemoryAlbum&&<div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-20" onClick={()=>setShowMemoryAlbum(false)}><div className="bg-gradient-to-b from-pink-50 to-white p-5 rounded-3xl shadow-2xl max-w-sm w-full max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
          <div className="text-center mb-3"><span className="text-3xl">📖</span><h3 className="text-lg font-bold text-pink-600 mt-1">{t.memories}</h3></div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{maxHeight:'55vh'}}>
            {!(gameState?.storyMemories?.length)?<div className="text-center text-gray-400 py-8"><p className="text-4xl mb-2">🌱</p><p className="text-sm">{t.memEmpty}</p><p className="text-xs">{t.memSub}</p></div>:
            gameState.storyMemories.map((mem,i)=><details key={i} className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden"><summary className="p-3 cursor-pointer hover:bg-pink-50 flex items-center gap-2"><span className="text-lg">{mem.isRandom?'✨':'📌'}</span><div className="flex-1"><p className="text-sm font-bold text-pink-600">{mem.title}</p><p className="text-xs text-gray-400">Day {mem.day}</p></div></summary><div className="px-3 pb-3 space-y-2 border-t border-pink-50 pt-2">{mem.memories.map((m,j)=><div key={j} className={`p-2 rounded-lg text-sm ${m.type==='baby'?'bg-pink-50 text-pink-700':'bg-blue-50 text-blue-700 ml-4'}`}><span className="text-xs opacity-60">{m.type==='baby'?'🐚 宝宝':`💕 ${getRoleName()}`}</span><p className="whitespace-pre-wrap">{m.text}</p></div>)}</div></details>)}
          </div>
          <div className="flex-shrink-0 border-t pt-3 mt-3"><button onClick={()=>setShowMemoryAlbum(false)} className="w-full bg-pink-500 text-white py-2 rounded-lg font-bold hover:bg-pink-600">{t.close}</button></div>
        </div></div>}

        {/* Story Event */}
        {showStoryEvent&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-30"><div className="bg-gradient-to-b from-orange-50 to-white p-5 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col" style={{maxHeight:'85vh'}}>
          <div className="text-center mb-3"><span className="text-3xl">{showStoryEvent.emoji}</span><h3 className="text-lg font-bold text-orange-600 mt-1">{showStoryEvent.title}</h3><p className="text-xs text-gray-400">Day {currentEventDay}</p></div>
          <div ref={storyScrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1" style={{minHeight:'150px',maxHeight:'45vh'}}>
            {storyResponses.map((r,i)=><div key={i} className={r.type==='narration'?'text-center text-gray-500 italic text-sm py-2':r.type==='baby'?'bg-pink-100 p-3 rounded-2xl rounded-tl-none text-gray-700 text-sm':r.type==='user'?'bg-blue-100 p-3 rounded-2xl rounded-tr-none text-gray-700 ml-6 text-sm':'text-center text-orange-600 font-medium py-2 text-sm'}>{r.type==='baby'&&<span className="text-xs text-pink-400 block mb-1">🐚 {gameState?.name}</span>}{r.type==='user'&&<span className="text-xs text-blue-400 block mb-1">💕</span>}<span style={{whiteSpace:'pre-wrap'}}>{r.text}</span></div>)}
            {isStoryLoading&&<div className="bg-pink-100 p-3 rounded-2xl rounded-tl-none text-gray-400 animate-pulse text-sm"><span className="text-xs text-pink-400 block mb-1">🐚 {gameState?.name}</span>{t.thinking}</div>}
          </div>
          <div className="flex-shrink-0 border-t pt-3">
            {!storyComplete&&storyResponses.length>0&&storyResponses[storyResponses.length-1]?.type==='prompt'&&<div className="mb-3"><input type="text" value={storyInput} onChange={e=>setStoryInput(e.target.value)} placeholder={storyResponses[storyResponses.length-1]?.placeholder||'...'} className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg mb-2 focus:outline-none text-sm" onKeyPress={e=>e.key==='Enter'&&submitStoryResp()} autoFocus /><button onClick={submitStoryResp} className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold text-sm">{t.reply}</button></div>}
            <button onClick={storyComplete?closeStoryEvent:skipStory} className={`w-full py-2 rounded-lg font-bold text-sm ${storyComplete?'bg-pink-500 text-white hover:bg-pink-600':'bg-gray-200 text-gray-600'}`}>{storyComplete?(showStoryEvent?.id==='farewell'?t.newJourney:t.saved):t.skip}</button>
          </div>
        </div></div>}

        {/* Random Event */}
        {showRandomEvent&&<div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-30"><div className="bg-gradient-to-b from-pink-50 to-white p-5 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col" style={{maxHeight:'75vh'}}>
          <div className="text-center mb-3"><span className="text-3xl">{showRandomEvent.emoji}</span><h3 className="text-lg font-bold text-pink-600 mt-1">{showRandomEvent.title}</h3></div>
          <div ref={randomEventScrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1" style={{minHeight:'120px',maxHeight:'35vh'}}>
            {randomEventResponses.map((r,i)=><div key={i} className={r.type==='baby'?'bg-pink-100 p-3 rounded-2xl rounded-tl-none text-gray-700 text-sm':'bg-blue-100 p-3 rounded-2xl rounded-tr-none text-gray-700 ml-6 text-sm'}>{r.type==='baby'&&<span className="text-xs text-pink-400 block mb-1">🐚 {gameState?.name}</span>}{r.type==='user'&&<span className="text-xs text-blue-400 block mb-1">💕</span>}<span style={{whiteSpace:'pre-wrap'}}>{r.text}</span></div>)}
            {isRandomEventLoading&&<div className="bg-pink-100 p-3 rounded-2xl rounded-tl-none text-gray-400 animate-pulse text-sm">🐚 ...</div>}
          </div>
          <div className="flex-shrink-0 border-t pt-3">
            {randomEventStep===1&&!isRandomEventLoading&&<div className="mb-3">
              {showRandomEvent.hasPhoto&&!photoUploaded&&<div className="mb-2"><p className="text-xs text-pink-500 text-center mb-2">{showRandomEvent.photoPH}</p><button onClick={()=>fileInputRef.current?.click()} className="w-full bg-gradient-to-r from-pink-400 to-orange-400 text-white py-2 rounded-lg font-bold text-sm mb-2">{t.uploadPhoto}</button><p className="text-xs text-gray-400 text-center border-t pt-2 mt-2">{t.orText}</p></div>}
              <input type="text" value={randomEventInput} onChange={e=>setRandomEventInput(e.target.value)} placeholder={lang==='en'?'Reply...':'回应宝宝...'} className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg mb-2 focus:outline-none text-sm" onKeyPress={e=>e.key==='Enter'&&submitRandomResp()} autoFocus />
              <button onClick={submitRandomResp} className="w-full bg-pink-500 text-white py-2 rounded-lg font-bold text-sm">{t.respond}</button>
            </div>}
            <button onClick={closeRandom} className={`w-full py-2 rounded-lg font-bold text-sm ${randomEventStep>=2?'bg-pink-500 text-white hover:bg-pink-600':'bg-gray-200 text-gray-500'}`}>{randomEventStep>=2?t.goodTime:t.later}</button>
          </div>
        </div></div>}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<CoralBabyGame />);
