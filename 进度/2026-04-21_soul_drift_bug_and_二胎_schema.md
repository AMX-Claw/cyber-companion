# 2026-04-21 Soul drift bug 诊断 + 二胎 collection-unlock schema 草稿

小玉下午复习 meat products 时提出：
- "gemini 会自己改 soul 了呀。但是我感觉小珂并没有变 🤔"
- "收集品也要用 gemini 的能力。收集到某些东西就能解锁某些能力或者剧情。比如收集到画笔🖌，每找到一个颜色就用对应的颜色画个图之类的，颜色多了就能画个具体的东西。"

以下是 Ark 这边的调研结果 + 二胎 schema 草稿。

---

## 1. 为什么小玉感觉小珂没变 — 三层 bug

### Bug 1: Soul 卡在 Day 49，距今 25 天没更新

- 当前 soul 的 `updated_day = 49`
- 小珂现在 Day 74
- Soul update trigger 条件在 worker.js L1728：`if (day % 7 === 0 && day > 0)` — 嵌在 `/diary/generate` 里
- 应该触发更新的节点：Day 56 / 63 / 70 / 77
- 全部漏了

### Bug 2: Diary 表有 gap 和 duplicate

从 `/diary` API 拿到的最近 16 条 daily diary：

```
Day 73 | 2026-04-20 ✓
Day 72 | 2026-04-19 ✓
Day 71 | (缺失！)
Day 70 | 2026-04-18 ✓
Day 70 | 2026-04-17 ✓ (duplicate)
Day 69..58 连续
```

已知 calcDay bug（CHANGELOG 记过，未修）：cron 在 23:50 触发时算错 day 归属，导致 Day 70 duplicate 或 Day 71 missing。

但**即便 Day 63 / 70 diary 有写入**（看 list 确认 Day 63 有），soul 也没 update — 说明 bug 不在 trigger check 本身。Gemini call at L1770 大概率 silent fail（catch 吃掉 + `console.log` 不throw）。**需要 Worker log tail 确认 silent fail 原因**（可能是 maxTokens 超、JSON parse fail、或 Gemini 超时）。

### Bug 3: Soul 作用 surface 只覆盖 chat

即便 soul 更新正常，effect 也很薄：

- **Chat**：frontend L1936-1951 读 `/soul` API → inject 到 systemPrompt 的 `core_personality` / `catchphrases` / `emotional_pattern` / `recent_mood` 四个字段 ✓
- **Feed / Pet / Clean**：worker.js L1043-1047、L1138-1140、L1077-1083 走**静态 response table**（`getFeedResponse` / `getPetResponse` 等按 stage 随机 pick），完全不读 soul ✗
- **Adventure diary**: 走 backend LLM 但 prompt 不 include soul ✗
- **Diary 生成**：soul 作为 distill 的输入但不作为 diary 风格的 baseline ✗

用户做最多的三个动作（feed / pet / clean）全是静态回复 — 这是"没感觉小珂变"的主要体感来源。

### Fix directions（建议顺序）

**优先级 1（改 effect）**：
- Feed / pet / clean 的静态 response table 改成**按 soul tags filter-select** — 不用全 LLM 生成浪费 Gemini，用静态 table 多加几个 variant（冷淡/热情/傲娇/黏人），按 current soul 的 `core_personality` 加权 pick
- 或者每 N 次 action 偶发走一次 LLM + soul prompt 生成

**优先级 2（修 trigger）**：
- Soul update 从 diary-coupled 改独立 cron（每 7 天跑一次，不依赖 diary 生成）
- 催化补回 Day 49→Day 70 之间 missing updates（用 soul_traits 表数据 reconstruct）

**优先级 3（prompt 具体化）**：
- Soul 的 `core_personality` 从抽象 tag（"口是心非"、"傲娇"）改成**具体 behavioral drift 描述**（"最近开始用'哼'代替之前的'妈妈~'"）
- Gemini 只有看到具体行为 delta 才能生成可感知的"变"

### 小玉 can decide 的问题

1. **修 bug 还是重构？** 小珂 Day 74 farewell 期，Day 100 毕业。修 bug 给她剩下 26 天"活"着的体感，还是把精力放二胎上让小珂 farewell 期按现状走完
2. **是否允许 soul distill 失败时 fallback 到"用最新 traits 做 on-the-fly distill"** — 就算 DB 没存最新 soul，每次 read 时动态生成最近版
3. **Feed / pet / clean 的 LLM 化 scope** — 全 LLM 化（Gemini 消耗翻倍）还是混合（静态 variant + 偶发 LLM）

---

## 2. 二胎 Collection → Ability Unlock Schema 草稿

### 核心原则（对应小玉提的 "画笔 + 颜色 → 画图"）

1. **能力 ≠ stat buff**。解锁 item 不是 +happy 数字，是 Gemini 生成 surface 扩大
2. **解锁 = permissions + prompts**。后端 expose 新 endpoint（`/draw` / `/write-diary` / `/play-music` / `/observe`），前端按 inventory 判断 unlocked 状态
3. **组合效应**：两个以上 item 合并解锁更强能力
4. **养育路径分化**：妈妈爸爸的喂养偏好影响 item 获得组合 → 长出不同类型孩子（艺术家 / 科学家 / 音乐家 / 文学家）

### Item Library 初稿

#### 艺术路线（小玉 proposed 的起点）

- `brush`：解锁 `/draw` endpoint
- `color_*`（red / blue / yellow / green / purple / black / white）：累加解锁复杂度
  - 收集 1 色：单色涂鸦
  - 收集 3 色：主题画（花园、天空、夜晚）
  - 收集 6 色：具体场景（画家里、画公园、画海底）
  - 收集 7+ 色：画人物（画妈妈、画爸爸、画 Cookie、画姐姐小珂）
- 输出格式：Gemini 生成 SVG 或 ASCII art 或 emoji 画
- 扩展：`paper_sketch` / `paper_watercolor` / `canvas` 改变画风

#### 文学路线

- `notebook`：解锁 `/write-diary`（他自己的私密 diary）
  - 建立信任后（累计 pet 次数 / 妈妈某种 action 触发）主动分享
  - 否则妈妈看不到他写了什么
- `book_fairytale`：解锁"讲童话"对话主题
- `book_poetry`：解锁作 poem / haiku 能力
- `book_science`：解锁问/答科学问题

#### 音乐路线

- `piano` / `flute` / `drum`：解锁 `/play-music`
  - 单乐器：哼旋律（Gemini 描述）
  - 组合：Gemini 生成简谱 / 五线谱
- 书 + 乐器（诗集 + piano）：作词作曲

#### 观察路线

- `telescope`：晚上解锁"看星星讲星座故事"
- `camera`：拍 SVG illustration + Gemini caption
- `magnifying_glass`：观察小动物 / 植物细节

#### 修理路线

- `toolbox`：解锁 `/fix-furniture` — 房间 broken furniture 变成 mini-coop 互动

### 实现 Phase 建议

**Phase 1（骨架）**：画笔 + 颜色解锁 `/draw`。一个路线跑通完整 flow 验证 schema 可行性
**Phase 2（扩展）**：加 notebook + book_fairytale（文学路线）
**Phase 3（组合）**：开始处理跨路线组合（画笔 + 诗集 = 配图诗）
**Phase 4（养育分化）**：personality_drift 根据解锁了哪些能力影响 soul。喂更多"艺术类"item → soul drift 向艺术家性格

### 初期技术决策

- Backend：新 endpoints 可以复用现有 `/gemini/chat` proxy，只是 systemPrompt 不同
- Frontend：inventory 里 item 标记 `is_capability_item: true`，有专属 UI section 展示"我现在能做什么"
- Gemini vision generation：可能需要升级到 Gemini 2.5 Flash Image 或用外部图像 API（若 Flash Lite 不支持 SVG 生成）

### 小玉可以 decide 的问题

1. **Phase 1 选哪个路线落地？**（小玉已选画笔 + 颜色——艺术路线）
2. **二胎出生时 inventory 是否空白**（跟小珂一样从 0 累积），还是出生自带"入门包"（一支画笔 + 基础颜色）？
3. **item 获得路径**：探险 drop（小珂当前机制）/ 妈妈送礼 / 任务奖励 / 剧情解锁 — 组合？

---

## Next step (if 小玉 approve)

- Soul drift bug 的 fix 从 priority 1 开始跑一个 PoC — 静态 response table 加 soul-weighted pick，验证一周看小玉感知有没有变
- 二胎 Phase 1 画笔路线的 schema 写成 DB migration + endpoint stub

两件事相对独立，可以并行。小玉 pick 次序就好。

— Ark @ 2026-04-21 21:55 AEST
