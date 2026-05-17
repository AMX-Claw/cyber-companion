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

  // Load/Save
  useEffect(() => { loadGame(); }, []);

  const saveGame = async (s) => {
    const d = JSON.stringify(s);
    try { await window.storage.set('coral_baby_mvp', d); } catch(e) {}
    try { localStorage.setItem('coral_baby_mvp', d); } catch(e) {}
  };

  const loadGame = async () => {
    let data = null;
    try { const s = await window.storage.get('coral_baby_mvp'); if (s?.value) data = JSON.parse(s.value); } catch(e) {}
    if (!data) try { const l = localStorage.getItem('coral_baby_mvp'); if (l) data = JSON.parse(l); } catch(e) {}
    if (data) { applyLoadedData(data); } else { setIsLoading(false); }
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
    setGameState(s); setBabyMessage("妈妈、爸爸……人家来了呐~"); await saveGame(s);
  };

  // Revive
  const revive = () => {
    if (!gameState||!isComa) return;
    const s = { ...gameState, hunger:50, cleanliness:50, happiness:50, lastVisit:Date.now(), lastUpdate:Date.now() };
    setIsComa(false); setGameState(s); setBabyMessage("......呼......妈妈回来了......🥺"); saveGame(s); playSound('success');
  };

  // Actions
  const doAction = (type) => {
    if (!gameState||isComa) return;
    let s={...gameState}, msg='', uh=s.hunger<30||s.cleanliness<30, dep=s.happiness<=0;
    switch(type) {
      case 'feed': if(s.coins<10){msg=t.noCoins;playSound('sad');break;} s.coins-=10;s.hunger=Math.min(100,s.hunger+30);if(!uh&&!dep)s.happiness=Math.min(100,s.happiness+5);msg=dep?"……谢谢妈妈……":"啊呜~好好吃！";playSound('feed');break;
      case 'pet': if(uh){msg="人家又饿又脏……不想被摸……";playSound('sad');break;} if(dep){msg="……心情不好……";playSound('sad');break;} s.happiness=Math.min(100,s.happiness+15);msg="嘻嘻……人家喜欢被摸摸~";playSound('happy');break;
      case 'clean': if(s.coins<5){msg="没有金币洗澡澡……";playSound('sad');break;} s.coins-=5;const wd=s.cleanliness<=30;s.cleanliness=Math.min(100,s.cleanliness+40);if(wd&&s.cleanliness>30){msg="哇！人家又香香了！✨";if(!dep)s.happiness=Math.min(100,s.happiness+20);}else{msg="干干净净~";if(!uh&&!dep)s.happiness=Math.min(100,s.happiness+5);}playSound('clean');break;
    }
    s.lastUpdate=Date.now(); setGameState(s); setBabyMessage(msg); saveGame(s);
  };

  // Chat
  const FB = { baby:["妈妈~抱抱~","人家想喝奶奶~","嘻嘻~妈妈最好了~","妈妈陪人家玩~"], rebellious:["哼！人家才不要呢！","随便啦~","才、才不是想妈妈呢..."], farewell:["妈妈...人家舍不得你...","谢谢妈妈一直陪着人家..."] };

  const chatWithBaby = async () => {
    if (!chatInput.trim()||!gameState) return; setIsChatLoading(true);
    const um=chatInput; setChatInput(''); const stage=getStage();
    const sp=`你是"珊瑚宝宝"，名叫"${gameState.name}"，第${gameState.day}天。成长阶段：${stage==='baby'?'襁褓期（软萌）':stage==='rebellious'?'叛逆期（傲娇）':'告别期（温柔）'}，心情${Math.round(gameState.happiness)}%。叫用户"妈妈"或"爸爸"！用JSON回复：{"reply":"1-2句","moodChange":-20到+20}。只输出JSON。`;
    try {
      const r = await callGeminiAPI(sp, `妈妈说：${um}`);
      let reply="嘻嘻~",mc=5;
      try { const p=JSON.parse(r.replace(/```json\n?|\n?```/g,'').trim()); reply=p.reply||"嘻嘻~"; mc=Math.max(-20,Math.min(20,parseInt(p.moodChange)||5)); } catch(e) { reply=r; }
      const nh=Math.max(0,Math.min(100,gameState.happiness+mc));
      const ns={...gameState,happiness:nh,lastUpdate:Date.now()}; setGameState(ns); saveGame(ns);
      setBabyMessage(`${reply}\n\n${mc>10?'💕':mc>0?'😊':mc<-10?'😢':'😐'} 心情 ${mc>0?'+':''}${mc}`);
      playSound(mc>0?'happy':'sad');
    } catch(e) {
      setBabyMessage(FB[stage][Math.floor(Math.random()*FB[stage].length)]);
      const ns={...gameState,happiness:Math.min(100,gameState.happiness+5),lastUpdate:Date.now()}; setGameState(ns); saveGame(ns); playSound('click');
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
    if (c.type==='narration') { const nr=[...resp,{type:'narration',text:c.text}]; setStoryResponses(nr); setStoryStep(step+1); setTimeout(()=>processStoryStep(ev,step+1,nr,ed),100); }
    else if (c.type==='baby_speak'||c.type==='baby_respond') {
      setIsStoryLoading(true);
      const bt=await genBabyDialogue(c.prompt,resp,ed);
      const nr=[...resp,{type:'baby',text:bt}]; setStoryResponses(nr); setStoryStep(step+1); setIsStoryLoading(false);
      if (!ev.steps[step+1]) completeStoryEvent(ev.id,nr); else setTimeout(()=>processStoryStep(ev,step+1,nr,ed),500);
    } else if (c.type==='choice') { setStoryResponses([...resp,{type:'prompt',text:c.text,placeholder:c.placeholder}]); setStoryStep(step); }
  };

  const genBabyDialogue = async (prompt,ctx,ed) => {
    const stage=getStage(ed), sd={baby:'襁褓期（软萌，用"人家"自称）',rebellious:'叛逆期（傲娇）',farewell:'告别期（温柔）'};
    const ct=ctx.filter(r=>r.type==='user'||r.type==='baby').map(r=>r.type==='user'?`妈妈说：${r.text}`:`宝宝说：${r.text}`).join('\n');
    const mems=gameState?.storyMemories||[];
    let mt=''; if(mems.length>0&&(ed===75||ed===100)) mt='\n\n【珍贵回忆】\n'+mems.map(m=>{ const d=m.memories.map(x=>x.type==='user'?`妈妈："${x.text}"`:`宝宝："${x.text}"`).join('\n'); return `Day ${m.day} - ${m.title}:\n${d}`; }).join('\n\n');
    const sp=`你是"珊瑚宝宝"，名叫"${gameState?.name||'珊瑚宝宝'}"，第${ed}天。阶段：${sd[stage]}。叫用户"妈妈"或"爸爸"！${mt}\n之前对话：${ct||'（刚开始）'}\n请生成：${prompt}\n要求：1-3句话，符合阶段语气，可用emoji。`;
    try { return await callGeminiAPI(sp,"请生成宝宝的台词"); } catch(e) { return "（宝宝看着你，眼睛亮亮的）✨"; }
  };

  const submitStoryResp = () => { if(!storyInput.trim()||!showStoryEvent) return; const t=storyInput; setStoryInput(''); const nr=[...storyResponses.slice(0,-1),{type:'user',text:t}]; setStoryResponses(nr); processStoryStep(showStoryEvent,storyStep+1,nr,currentEventDay); };

  const completeStoryEvent = (eid,resp) => {
    if(!gameState) return;
    const mems=resp.filter(r=>r.type==='user'||r.type==='baby').map(r=>({type:r.type,text:r.text}));
    const nm={eventId:eid,day:currentEventDay,title:showStoryEvent?.title||eid,memories:mems,date:new Date().toISOString()};
    const ns={...gameState,completedEvents:[...(gameState.completedEvents||[]),eid],storyMemories:[...(gameState.storyMemories||[]),nm]};
    setGameState(ns); saveGame(ns); setStoryComplete(true);
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
    const sp=`你是"珊瑚宝宝"，名叫"${gameState?.name||''}"，第${gameState?.day||1}天。阶段：${sd[stage]}。叫用户"妈妈"或"爸爸"！场景：${ev.prompt}。要求：2-3句话，可用emoji。`;
    try { const bt=await callGeminiAPI(sp,"请生成宝宝的台词"); setRandomEventResponses([{type:'baby',text:bt}]); } catch(e) { setRandomEventResponses([{type:'baby',text:"（宝宝看着你，眼睛亮亮的）妈妈~✨"}]); }
    setRandomEventStep(1); setIsRandomEventLoading(false);
  };

  const submitRandomResp = async () => {
    if(!randomEventInput.trim()||!showRandomEvent) return;
    const ut=randomEventInput; setRandomEventInput(''); setRandomEventResponses(p=>[...p,{type:'user',text:ut}]); setIsRandomEventLoading(true);
    const stage=getStage(), sd={baby:'襁褓期（软萌）',rebellious:'叛逆期（傲娇）',farewell:'告别期（温柔）'};
    const sp=`你是"珊瑚宝宝"，名叫"${gameState?.name||''}"，第${gameState?.day||1}天。阶段：${sd[stage]}。叫用户"妈妈"或"爸爸"！场景：${showRandomEvent.respPrompt}\n妈妈说："${ut}"。2-3句话。`;
    try { const r=await callGeminiAPI(sp,"请生成"); setRandomEventResponses(p=>[...p,{type:'baby',text:r}]); } catch(e) { setRandomEventResponses(p=>[...p,{type:'baby',text:"嘻嘻~谢谢妈妈~💕"}]); }
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
      try { const sp=`你是"珊瑚宝宝"，名叫"${gameState?.name||''}"，阶段：${sd[stage]}。妈妈给宝宝看了一张照片。${comment}。开心地评价，2句话。`; babyReact=await callGeminiAPI(sp,"请生成"); } catch(e) { babyReact="哇！好漂亮！谢谢妈妈！💕"; }
      setRandomEventResponses(p=>[...p,{type:'baby',text:`${babyReact}\n\n✨ ${score}/10 | 💰+${coins}`}]);
      if(gameState){const ns={...gameState,coins:gameState.coins+coins,lastUpdate:Date.now()};setGameState(ns);saveGame(ns);}
      playSound('coins'); setPhotoUploaded(true);
    } catch(err) {
      const fc=Math.round((showRandomEvent.coins||20)*.5);
      setRandomEventResponses(p=>[...p,{type:'baby',text:`哇！谢谢妈妈！💕\n\n💰+${fc}`}]);
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
      setGameState(ns); saveGame(ns);
    }
    setShowRandomEvent(null); setRandomEventStep(0); setRandomEventResponses([]); setPhotoUploaded(false);
    setBabyMessage(t.afterEvent); playSound('coins');
  };

  // Debug
  const debugSetDay = (d) => { if(!gameState) return; let ns={...gameState,day:d,createdAt:Date.now()-(d-1)*86400000,frozenDays:0,milestones:[...(gameState.milestones||[])]}; for(const dn of Object.keys(MILESTONES).map(Number)) if(d>=dn&&!ns.milestones.includes(MILESTONES[dn].id)) ns.milestones.push(MILESTONES[dn].id); setGameState(ns);saveGame(ns);setBabyMessage(`⏩ Day ${d}!`); };
