# 小珂 Stage分阶段 + 随机事件扩充 + Soul注入聊天

**日期：** 2026-04-01
**完成者：** CC弟弟（Sonnet）
**状态：** ⚠️ 本地已改，待review后部署

---

## 改动1：Stage分阶段

**问题：** Day 30-69全是rebellious，四十天没变化，小珂一直"哼""切""才不是呢"

**改动：**
- `getStage()` 从2段→5段：
  - baby (Day 1-29)
  - rebellious (Day 30-40): 炸呼呼叛逆期
  - awkward (Day 41-55): 别扭期，没那么凶了，偶尔傲娇但会主动撒娇
  - growing_up (Day 56-69): 小大人期，开始懂事，会关心爸妈
  - farewell (Day 70+)
- worker.js: getStage()改了 + 3处inline stage计算同步改了
- worker.js: getDualParentPetResponse/getDualParentFeedResponse/getPetResponse/getFeedResponse 全加了awkward和growing_up回复池
- frontend/index.html: getStage同步 + stage label + fallback回复 + 随机事件prompt里的阶段描述

**awkward回复风格举例：**
- "嗯……你要摸就摸吧反正人家也不在意……（但耳朵红了）"
- "谢、谢什么谢啦！人家又没有说喜欢被摸头！"

**growing_up回复风格举例：**
- "爸爸你今天累不累？"
- "谢谢你一直陪着我"
- 偶尔还会冒出孩子气

## 改动2：随机事件池扩充

**问题：** 随机事件只有9个，四天出了两次"看看小动物"，而且完成后不标记不去重

**改动：**
- RANDOM_EVENTS从9个→27个
- 新增18个事件：想学做饭、偷穿妈妈衣服、秘密日记被发现、想养宠物、模仿爸爸说话、给妈妈唱歌、拒绝洗澡被抓包玩水、看月亮、问星星的问题、捡闪亮石头送爸爸、偷偷存金币买礼物、假装大人、和蛋宝宝说话、做好吃的分享、想要第二个蛋、梦到飞起来、第一次说谎、想在雨里踩水坑
- 拍照类和纯对话类都有，coins 15-40不等，minDay从5到35错开
- **去重机制：** 后端`/events/available`加了查memories表`is_random=1`最近3天记录，返回`recentRandomIds`，前端filter排除最近3天触发过的

## 改动3：Soul注入聊天prompt

**问题：** 聊天时Gemini只看stage标签，不看soul系统积累的性格数据，所以soul在成长但聊天没变化

**改动：**
- 聊天POST handler里，读取soul_json并结构化注入system prompt
- 注入字段：核心性格、口头禅、情绪模式、最近心情
- 每个字段做了存在性检查和数组/字符串兼容

---

## 文件改动清单
- `api/worker.js`: getStage()、4个回复函数、/events/available去重、/chat soul注入
- `frontend/index.html`: RANDOM_EVENTS数组、getStage同步、stage显示

## 待做
- [ ] Review完整代码diff确认无破坏性改动
- [ ] 部署到Cloudflare Workers
- [ ] 部署前端到Pages
- [ ] 测试新stage（小珂Day 53→应该还是awkward期的边界外，等Day 41？不对，现在Day 53已经在awkward期了！部署后立刻能看到变化）
- [ ] 测试随机事件去重是否生效
