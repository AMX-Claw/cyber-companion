# 小珂 xiaoke-project

赛博宝宝养成游戏 🐚

- **线上地址**: https://xiaoke-1po.pages.dev
- **API**: https://xiaoke-api.megyucai.workers.dev
- **D1数据库ID**: (see wrangler.toml)
- **Token**: set via `wrangler secret put DADDY_TOKEN` / `wrangler secret put MAMA_TOKEN`

## 结构

```
xiaoke-project/
├── frontend/          # 前端（单文件 index.html ~3200行，Cloudflare Pages）
│   ├── index.html     # 主文件，React + inline CSS
│   ├── app.jsx        # 旧版组件参考（不serve）
│   ├── config.js      # Gemini API key配置
│   └── assets/        # 图片素材
├── api/               # 后端（Cloudflare Worker ~2000行）
│   ├── worker.js      # 主文件
│   ├── schema.sql     # D1数据库schema
│   └── wrangler.toml  # Worker配置
└── room-assets/       # Tiled地图素材
```

## 部署

```bash
# 前端
cd frontend
CLOUDFLARE_API_TOKEN=$(security find-generic-password -s "openclaw-cloudflare-api-token" -w) \
  npx wrangler pages deploy . --project-name xiaoke --commit-dirty=true

# 后端
cd api
CLOUDFLARE_API_TOKEN=$(security find-generic-password -s "openclaw-cloudflare-api-token" -w) \
  npx wrangler deploy
```

## ⚠️ 踩过的坑

### 部署
- **实际serve的是 index.html**，不是 app.jsx！
- 部署前 `git commit` 确保改动不丢
- Cloudflare Pages项目名是 `xiaoke`（不是 `xiaoke-1po`）
- wrangler deploy用toml里的name，不带--name
- 部署前确认本地代码是最新版，直接部署是危险操作
- Cloudflare cron trigger可能并发触发，光靠SELECT检查不够，必须有DB约束
- 日记是Worker cron trigger自动生成（UTC 12:50 = AEDT 23:50），跟🦞/CC无关——不要再建重复cron

### API
- 所有更新last_update的操作必须同时写入hunger+cleanliness+happiness三个字段，否则衰减会被重置导致数值"回涨"
- Day 56日记缺失问题：calcDay用实时时间算天数，cron在23:50触发时可能算错day——待修

### 日记"寂寞模板"bug（修过好几次，务必记住）

**症状**：连续几天的day日记content长得一模一样，类似"人家今天有点想爸爸妈妈...窝在珊瑚里发呆了好久..."或"为什么太阳下山了天就黑了呢...人家有好多问题想问..."。看起来像fallback但grep代码里没这些字符串——是Gemini真出品的，只是prompt里塞了错误的context。

**根因**：`POST /diary/generate` (worker.js ~L1604) 被**当天过早**调用时，activity_log还没有活动，`context`变量为空字符串，于是prompt走 else 分支 `今天${daddy}${mama}都没有来，你有点寂寞...`。Gemini收到这个prompt就真的生成一篇"寂寞日记"，insert进DB。然后晚上22:50 cron看到`alreadyExists`就skip——**当天后面所有真实活动全部丢失**。

**谁会提前调用** `/diary/generate`：
- 前端/app某个路径
- mama或daddy某个自动脚本
- 某个早上的heartbeat代码（查一下 CC cron 和 app 阿克 那边）

**直到部署代码修之前的手动恢复**（用Cloudflare D1 MCP直接改DB）：
1. 查看：`SELECT id, created_at, day, content FROM diary WHERE baby_id='xiaoke' AND created_at='2026-XX-XX'`
2. 更新：`UPDATE diary SET content = ? WHERE id = ?`（写成真实那天的小珂傲娇期/成长期日记即可）
3. DB id: (see wrangler.toml)

**永久修复（✅ 2026-04-16 已部署）**：
`POST /diary/generate` 加一个守门条件——**当context为空时，不写入DB**，返回一个 `{waiting: true, reason: 'no_activity_yet'}`，让当天晚上的cron负责写end-of-day版本。只有cron（末端时间窗口）和调用方明确知道"今天就是没人来"时才应该生成寂寞日记。

部署version: 7cff704c-3348-4108-a9a9-7cdd32e5b87a（4/16小玉吐槽"你修了5次都没修好"当天修好）。

不要再重新debug这个问题，直接看这里。历史记录：4/11 小玉明确说"这个bug修了好多次了"。

### UI / 素材
- sprite素材看清规格再切（16x16 vs 32x32），用眼睛看朝向别用算法
- 做完工作必须看截图验证，不要有东西显示就说"搞好了"

### 代码规范
- 改数据要考虑影响所有用户，不只是团子
- 不可以硬编码小珂的名字，别人家宝宝不叫小珂
- Python脚本生成JSON时debug信息用stderr不要stdout（配置炸了无限重启惨案）
- cron已经喂了就不要手动重复喂
- 凌晨cron取昨天日期：`date -v-1d`
- **API key绝对不写前端代码** — 已迁移到Worker secret（4/2 Gemini key泄露惨案）

### 小鸡Sprite（翻了4次车）
- **原始素材是16×16，不是32×32！！！**
- 详细指南见同目录 `pixel-spritesheet-guide.md`
- 每次修小鸡前必读那个guide

### 旧路径（已废弃）
- `~/Desktop/薯羊毛计划/` 和 `~/Desktop/xiaoke-project/` 已废弃，代码全在这里

### 日记生成bug（翻了≥5次，4/16终于永久修复）

**症状**：4/14、4/15小珂日记内容一模一样 "人家今天有点想爸爸妈妈...窝在珊瑚里发呆了好久..."

**根因**：`POST /diary/generate` 被早上heartbeat/脚本提前调用 → 那时activity_log还空 → prompt走else分支生成寂寞日记入库 → 晚上22:50 cron看diary已存在 → skip → 当天真实活动丢失。

**永久修复（worker.js L1669-1674）**：空context直接 `return {waiting: true}` 不写DB。只有end-of-day cron的寂寞prompt才会写DB。

**部署版本**：`7cff704c-3348-4108-a9a9-7cdd32e5b87a`

**验证**：4/16 Day 69日记正常生成（有棕色蛋🥚探险内容，非寂寞模板）✅

**教训**：
- 有状态依赖的endpoint不能随便调——先确认依赖是否ready
- **修完看数据验证**，不要只看代码说"改了"

### 日记 bug 第 6 次回归 & 修复（2026-04-19）

**症状**：4-19 Day 72 日记 content 只一句："为什么太阳下山了天就黑了呢...人家有好多问题想问..."——当天 activity 很多（pet/feed/clean/chat/adventure pickup/event-reward 50 coins）却没反映。小玉戳"今天 Gemini 又没写日记"。

**调查**：
- 不是 fallback 模板串（grep 源码没这句）——是 Gemini 真生成的
- `alreadyExists` 检查阻止了晚上 cron 覆写早上的 short 内容——**上次"永久修复"的副作用：只要不是空 context，就直接生成并锁死**
- AEDT_OFFSET 写死 `11h`，但 2026-04-05 后墨尔本已经在 AEST (+10)。日期计算全偏 1 小时
- 硬编码 `T00:00:00+11:00` 字符串出现 2 处，同样 off-by-one-hour
- Cron 触发 UTC 12:50 = AEST 22:50，离 AEST 午夜还有 1h10min，小玉晚上 22:50 后的 activity（比如小珂 clean/chat/pet at UTC 13:11-13:17）全部错过当天 diary 窗口

**2026-04-19 这次修复**：
- `AEDT_OFFSET` 改成 `10 * 60 * 60 * 1000`（AEST +10，注释标明 Oct 要切回 +11）
- L1623 和 L2314 的 `+11:00` 字面量改成 `+10:00`
- `POST /diary/generate` 支持 `{force: true}` body — force 时 DELETE existing 再 INSERT
- Scheduled cron handler 去掉 `alreadyExists` skip，改成**always overwrite**（DELETE existing + INSERT）
- Prompt 从 `50-80 字记录心情` 改成 `80-150 字必须具体提到真实发生的事（谁喂你/摸你、带回什么东西、聊了什么），不要只写抽象心情或空泛诗句`
- `wrangler.toml` 把 cron 从 `50 12 * * *`（UTC 12:50 = AEST 22:50）移到 `45 13 * * *`（UTC 13:45 = AEST 23:45），把日终窗口拉到最接近午夜前

**部署版本**：`1252db9b-1901-4ac2-8832-bbcb90ad0a73`

**手动兜底**（这次先做的）：D1 MCP 直接 UPDATE id=163 content 成 reflect 4-19 activity 的版本；DELETE id=168（force=true 生成的 4-20 那条含 4-19 activity 的重复）。

**遗留 TODO**：
- 2026-10-04 左右 DST 再切回 AEDT 时，要把 `AEDT_OFFSET` 改回 11h + `+10:00` 字面量改回 `+11:00`（根因该解：用 `Intl.DateTimeFormat({timeZone:'Australia/Melbourne'})` 代替硬编码偏移，但工作量暂时放着）
- 如果早上 heartbeat 还会预 call `/diary/generate`，记得加 `force: false`（默认）不会破坏晚上的 overwrite


