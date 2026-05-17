  // ========== RENDER ==========
  if (isLoading) return <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center"><p className="text-gray-500">{t.loading}</p></div>;

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

        {/* Actions - 4 buttons, NO 暗号 */}
        <div className="p-4 bg-orange-50">
          <div className="grid grid-cols-4 gap-2">
            <button onClick={()=>doAction('feed')} disabled={isComa} className="flex flex-col items-center p-3 bg-white rounded-xl shadow hover:shadow-lg transition border border-orange-100 disabled:opacity-50"><span className="text-2xl">🍼</span><span className="text-xs text-gray-500 mt-1">-10💰</span></button>
            <button onClick={()=>{if(gameState?.happiness<=0){setBabyMessage(t.sadPet);playSound('sad');}else doAction('pet');}} disabled={isComa} className={`flex flex-col items-center p-3 rounded-xl shadow hover:shadow-lg transition border disabled:opacity-50 ${gameState?.happiness<=0?'bg-gray-100 border-gray-200':'bg-white border-orange-100'}`}><span className="text-2xl">{gameState?.happiness<=0?'😢':'🤗'}</span><span className="text-xs text-gray-500 mt-1">{t.pet}</span></button>
            <button onClick={()=>doAction('clean')} disabled={isComa} className="flex flex-col items-center p-3 bg-white rounded-xl shadow hover:shadow-lg transition border border-orange-100 disabled:opacity-50"><span className="text-2xl">🛁</span><span className="text-xs text-gray-500 mt-1">-5💰</span></button>
            <button onClick={()=>{if(gameState?.happiness<=0){setBabyMessage(t.sadChat);playSound('sad');}else{setShowChat(true);playSound('click');}}} disabled={isComa} className={`flex flex-col items-center p-3 rounded-xl shadow hover:shadow-lg transition border disabled:opacity-50 ${gameState?.happiness<=0?'bg-gray-100 border-gray-200':'bg-pink-50 border-pink-200'}`}><span className="text-2xl">{gameState?.happiness<=0?'😶':'💬'}</span><span className={`text-xs mt-1 ${gameState?.happiness<=0?'text-gray-400':'text-pink-600'}`}>{t.chat}</span></button>
          </div>
        </div>

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
            gameState.storyMemories.map((mem,i)=><details key={i} className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden"><summary className="p-3 cursor-pointer hover:bg-pink-50 flex items-center gap-2"><span className="text-lg">{mem.isRandom?'✨':'📌'}</span><div className="flex-1"><p className="text-sm font-bold text-pink-600">{mem.title}</p><p className="text-xs text-gray-400">Day {mem.day}</p></div></summary><div className="px-3 pb-3 space-y-2 border-t border-pink-50 pt-2">{mem.memories.map((m,j)=><div key={j} className={`p-2 rounded-lg text-sm ${m.type==='baby'?'bg-pink-50 text-pink-700':'bg-blue-50 text-blue-700 ml-4'}`}><span className="text-xs opacity-60">{m.type==='baby'?'🐚 宝宝':'💕 妈妈'}</span><p className="whitespace-pre-wrap">{m.text}</p></div>)}</div></details>)}
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
