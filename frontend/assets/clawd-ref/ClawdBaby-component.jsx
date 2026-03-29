// ═══════════════ ClawdBaby (clawd-on-desk会动的螃蟹) ═══════════════
// 来源: https://github.com/rullerzhou-afk/clawd-on-desk (MIT)
// 15x16像素SVG + CSS keyframes动画
const ClawdBaby = ({ day, mood, cleanliness, happiness, hunger, isComa, onPokeFlower, onPetBody, petCDText }) => {
  const [isPoked, setIsPoked] = useState(false);
  const [pokeCount, setPokeCount] = useState(0);
  
  const handleClick = () => {
    if (isPoked) return;
    setIsPoked(true);
    const n = pokeCount + 1;
    setPokeCount(n);
    let m;
    if (n===1) m='嗯？';
    else if (n===2) m='别戳啦~';
    else if (n===3) m='🦀 小心我夹你！';
    else if (n===5) m='钳子都被你戳酸了！';
    else if (n===10) m='戳了10下了...你想吃蟹吗😤';
    else if (n===20) m='好啦告诉你一个秘密...我是会动的哦~✨';
    else if (n>10) m=['夹夹~','又戳~','横着走~','嘻嘻~','咔咔~'][n%5];
    else m='嘻嘻~';
    onPokeFlower(m);
    setTimeout(() => setIsPoked(false), 400);
  };

  // 状态判断
  const isHappy = happiness > 80;
  const isHungry = hunger !== undefined && hunger < 30;
  const isDirty = cleanliness < 30;
  const isSleeping = isDirty; // 脏了就趴着睡
  
  // 根据状态选择动画模式
  let animMode = 'idle';
  if (isComa) animMode = 'error';
  else if (isHungry) animMode = 'error';
  else if (isSleeping) animMode = 'sleeping';
  else if (isHappy) animMode = 'happy';
  else animMode = 'idle';

  const hasCrown = day >= 50;
  const hasWings = day >= 70;

  return (
    <svg viewBox="0 0 240 240" style={{width:'300px',height:'300px'}}>
      <defs>
        <style>{`
          /* ═══ IDLE 动画 ═══ */
          .clawd-idle .clawd-body {
            transform-origin: 120px 200px;
            animation: clawd-breathe 3.2s infinite ease-in-out;
          }
          .clawd-idle .clawd-eyes {
            animation: clawd-blink 4s infinite linear;
            transform-origin: 120px 135px;
          }
          @keyframes clawd-breathe {
            0%, 100% { transform: scale(1) translateY(0); }
            50% { transform: scale(1.02, 0.98) translateY(2px); }
          }
          @keyframes clawd-blink {
            0%, 46%, 54%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.1); }
          }
          
          /* ═══ HAPPY 动画 ═══ */
          .clawd-happy .clawd-body {
            transform-origin: 120px 200px;
            animation: clawd-bounce 1s infinite ease-in-out;
          }
          .clawd-happy .clawd-arm-l {
            transform-origin: 68px 140px;
            animation: clawd-wave-l 0.15s infinite alternate ease-in-out;
          }
          .clawd-happy .clawd-arm-r {
            transform-origin: 172px 140px;
            animation: clawd-wave-r 0.15s infinite alternate ease-in-out;
          }
          .clawd-happy .clawd-shadow {
            animation: clawd-shadow-bounce 1s infinite ease-in-out;
          }
          .clawd-happy .clawd-sparkle {
            animation: clawd-sparkle 1.5s infinite step-end;
          }
          @keyframes clawd-bounce {
            0%, 15%, 100% { transform: translateY(0) scaleY(1); }
            20% { transform: translateY(0) scaleY(0.85); }
            40% { transform: translateY(-35px) scaleY(1.05); }
            50% { transform: translateY(-42px) scaleY(1); }
            60% { transform: translateY(-35px) scaleY(1.05); }
            80% { transform: translateY(0) scaleY(0.85); }
            85% { transform: translateY(0) scaleY(1); }
          }
          @keyframes clawd-wave-l {
            0% { transform: rotate(45deg); }
            100% { transform: rotate(85deg); }
          }
          @keyframes clawd-wave-r {
            0% { transform: rotate(-45deg); }
            100% { transform: rotate(-85deg); }
          }
          @keyframes clawd-shadow-bounce {
            0%, 15%, 100% { transform: scale(1); opacity: 0.5; }
            40%, 60% { transform: scale(0.5); opacity: 0.15; }
          }
          @keyframes clawd-sparkle {
            0%, 40%, 100% { opacity: 0; }
            10%, 30% { opacity: 1; }
          }
          
          /* ═══ SLEEPING 动画 ═══ */
          .clawd-sleeping .clawd-body {
            transform-origin: 120px 200px;
            animation: clawd-sleep-breathe 4.5s infinite ease-in-out;
          }
          .clawd-sleeping .clawd-zzz {
            animation: clawd-zzz-float 6s infinite ease-in-out;
            opacity: 0;
          }
          .clawd-sleeping .clawd-zzz.z1 { animation-delay: 0s; }
          .clawd-sleeping .clawd-zzz.z2 { animation-delay: 2s; }
          .clawd-sleeping .clawd-zzz.z3 { animation-delay: 4s; }
          @keyframes clawd-sleep-breathe {
            0%, 80%, 100% { transform: scale(1, 1); }
            30%, 40% { transform: scale(1.02, 1.15); }
          }
          @keyframes clawd-zzz-float {
            0% { transform: translate(0, 0) scale(0.4); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 0.8; }
            100% { transform: translate(15px, -40px) scale(1.1); opacity: 0; }
          }
          
          /* ═══ ERROR 动画 ═══ */
          .clawd-error .clawd-body {
            transform-origin: 120px 200px;
            animation: clawd-exhausted 2.5s infinite ease-in-out;
          }
          .clawd-error .clawd-smoke {
            animation: clawd-puff 3s infinite ease-out;
            opacity: 0;
          }
          .clawd-error .clawd-smoke.s1 { animation-delay: 0s; }
          .clawd-error .clawd-smoke.s2 { animation-delay: 1s; }
          .clawd-error .clawd-smoke.s3 { animation-delay: 2s; }
          .clawd-error .clawd-error-text {
            animation: clawd-error-flash 0.8s infinite ease-in-out;
          }
          @keyframes clawd-exhausted {
            0%, 100% { transform: scale(1, 1) translateY(0); }
            50% { transform: scale(1.05, 0.9) translateY(5px); }
          }
          @keyframes clawd-puff {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { opacity: 0.6; }
            100% { transform: translateY(-50px) scale(2); opacity: 0; }
          }
          @keyframes clawd-error-flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.15; }
          }
          
          /* ═══ POKE 动画 ═══ */
          .clawd-poked {
            animation: clawd-squish 0.3s ease-in-out;
            transform-origin: center;
          }
          @keyframes clawd-squish {
            0% { transform: scale(1); }
            40% { transform: scale(0.8, 1.2); }
            80% { transform: scale(1.1, 0.9); }
            100% { transform: scale(1); }
          }
        `}</style>
      </defs>
      
      <g className={`clawd-${animMode}`}>
        {/* 影子 */}
        <ellipse className="clawd-shadow" cx="120" cy="200" rx="40" ry="8" fill="#000" opacity="0.4"/>
        
        {/* 翅膀 (Day 70+) */}
        {hasWings && <>
          <text x="20" y="120" fontSize="45">🪽</text>
          <g transform="translate(220,75) scale(-1,1)"><text fontSize="45" y="45">🪽</text></g>
        </>}
        
        {/* 皇冠 (Day 50+) */}
        {hasCrown && <text x="120" y="75" fontSize="30" textAnchor="middle">👑</text>}
        
        {/* Happy模式的sparkle */}
        {animMode === 'happy' && <>
          <g className="clawd-sparkle" style={{'--delay':'0s'}}>
            <rect x="50" y="80" width="6" height="6" fill="#FFD700"/>
            <rect x="47" y="83" width="12" height="1" fill="#FFD700"/>
            <rect x="52" y="77" width="1" height="12" fill="#FFD700"/>
          </g>
          <g className="clawd-sparkle" style={{'--delay':'0.3s',animationDelay:'0.5s'}}>
            <rect x="175" y="95" width="5" height="5" fill="#FFA000"/>
            <rect x="172" y="97" width="10" height="1" fill="#FFA000"/>
            <rect x="177" y="92" width="1" height="10" fill="#FFA000"/>
          </g>
          <g className="clawd-sparkle" style={{animationDelay:'1s'}}>
            <rect x="160" y="150" width="5" height="5" fill="#FFF59D"/>
            <rect x="157" y="152" width="10" height="1" fill="#FFF59D"/>
            <rect x="162" y="147" width="1" height="10" fill="#FFF59D"/>
          </g>
        </>}
        
        {/* Sleeping模式的ZZZ */}
        {animMode === 'sleeping' && <>
          <g className="clawd-zzz z1" fill="#90A4AE">
            <rect x="155" y="90" width="20" height="5"/>
            <rect x="168" y="95" width="5" height="5"/>
            <rect x="160" y="100" width="5" height="5"/>
            <rect x="155" y="105" width="20" height="5"/>
          </g>
          <g className="clawd-zzz z2" fill="#B0BEC5">
            <rect x="165" y="100" width="15" height="4"/>
            <rect x="175" y="104" width="4" height="4"/>
            <rect x="168" y="108" width="4" height="4"/>
            <rect x="165" y="112" width="15" height="4"/>
          </g>
          <g className="clawd-zzz z3" fill="#CFD8DC">
            <rect x="175" y="85" width="18" height="5"/>
            <rect x="186" y="90" width="5" height="5"/>
            <rect x="178" y="95" width="5" height="5"/>
            <rect x="175" y="100" width="18" height="5"/>
          </g>
        </>}
        
        {/* Error模式的烟雾 */}
        {animMode === 'error' && <>
          <g className="clawd-smoke s1">
            <rect x="110" y="80" width="10" height="10" fill="#B0BEC5" rx="2"/>
            <rect x="115" y="70" width="10" height="10" fill="#CFD8DC" rx="2"/>
          </g>
          <g className="clawd-smoke s2">
            <rect x="100" y="85" width="8" height="8" fill="#CFD8DC" rx="2"/>
            <rect x="105" y="75" width="8" height="8" fill="#ECEFF1" rx="2"/>
          </g>
          <g className="clawd-smoke s3">
            <rect x="125" y="82" width="9" height="9" fill="#B0BEC5" rx="2"/>
            <rect x="128" y="72" width="9" height="9" fill="#CFD8DC" rx="2"/>
          </g>
          <text className="clawd-error-text" x="120" y="65" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#FF3B30">ERROR</text>
        </>}
        
        {/* 主身体 */}
        <g className={`clawd-body ${isPoked ? 'clawd-poked' : ''}`}>
          {/* 腿 */}
          <g fill="#DE886D">
            {animMode === 'sleeping' ? <>
              {/* 睡觉时腿朝上 */}
              <rect x="86" y="130" width="7" height="7"/>
              <rect x="100" y="130" width="7" height="7"/>
              <rect x="133" y="130" width="7" height="7"/>
              <rect x="147" y="130" width="7" height="7"/>
            </> : <>
              {/* 正常站立的腿 */}
              <rect x="86" y="175" width="7" height="14"/>
              <rect x="100" y="175" width="7" height="14"/>
              <rect x="133" y="175" width="7" height="14"/>
              <rect x="147" y="175" width="7" height="14"/>
            </>}
          </g>
          
          {/* 身体 */}
          <g fill="#DE886D">
            {animMode === 'sleeping' ? <>
              {/* 睡觉时趴着的身体 */}
              <rect x="72" y="140" width="96" height="35"/>
              {/* 手臂摊开 */}
              <rect x="54" y="165" width="14" height="14"/>
              <rect x="172" y="165" width="14" height="14"/>
            </> : <>
              {/* 正常站立的身体 */}
              <rect x="79" y="120" width="82" height="55"/>
              {/* 手臂 */}
              <g className="clawd-arm-l">
                <rect x="61" y="135" width="14" height="14"/>
              </g>
              <g className="clawd-arm-r">
                <rect x="165" y="135" width="14" height="14"/>
              </g>
            </>}
          </g>
          
          {/* 眼睛 */}
          <g className="clawd-eyes" fill="#000">
            {animMode === 'sleeping' ? <>
              {/* 睡觉时闭眼 - 横线 */}
              <rect x="93" y="157" width="14" height="3"/>
              <rect x="133" y="157" width="14" height="3"/>
            </> : animMode === 'error' || isComa ? <>
              {/* ERROR/昏迷时 X眼 */}
              <text x="100" y="155" fontSize="16">✖</text>
              <text x="140" y="155" fontSize="16">✖</text>
            </> : <>
              {/* 正常眼睛 */}
              <rect x="93" y="140" width="7" height="14"/>
              <rect x="140" y="140" width="7" height="14"/>
            </>}
          </g>
        </g>
        
        {/* 可点击区域 */}
        <rect 
          x="60" y="100" width="120" height="110" 
          fill="transparent" 
          style={{cursor:'pointer'}} 
          onClick={handleClick}
        />
        <rect 
          x="60" y="100" width="120" height="110" 
          fill="transparent" 
          style={{cursor:'pointer'}} 
          onClick={onPetBody}
        />
      </g>
    </svg>
  );
};
