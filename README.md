# Cyber Companion — Raise a Virtual Baby Together

A virtual baby that two people (or one person and one AI) raise together. An AI-powered digital pet with emotions, growth stages, adventures, and a soul.

一个可以两个人（或者一个人一个AI）一起养的 AI 赛博宝宝。有情感、会成长、能探险、有灵魂。

---

## Features / 功能

- **Three-stat system / 三维属性** — Hunger, Happiness, Cleanliness. Stats decay over time; neglect leads to coma.
  饥饿、心情、清洁度。属性会随时间衰减，忽视太久会昏迷。

- **Growth stages / 成长阶段** — Baby → Rebellious → Farewell. 100-day lifecycle with milestones (tail, crown, wings).
  宝宝期 → 叛逆期 → 告别。100天生命周期，解锁里程碑（尾巴、皇冠、翅膀）。

- **Dual-parent system / 双亲系统** — Two people care for the baby. Each sees what the other has done. The baby relays messages between parents.
  两个人一起照顾宝宝，能看到对方的互动记录，宝宝会帮忙传话。

- **Soul personality / 灵魂人格 (Gemini AI)** — The baby has an AI-driven personality that evolves. Chat, comfort, and interact with a character that remembers.
  宝宝有 AI 驱动的人格，能聊天、安慰、记住你说过的话。

- **Adventure system / 探险系统** — Send the baby on timed adventures to discover items and collectibles.
  派宝宝去探险，发现物品和收藏品。

- **Egg hatching / 蛋孵化** — Find and hatch mysterious eggs by interacting with them daily.
  发现和孵化神秘的蛋。

- **Parent message board / 亲子留言板** — Leave notes for the other parent through the baby.
  通过宝宝给对方留便签。

- **Collectibles & inventory / 收集品系统** — Items, gifts, room decorations.
  物品、礼物、房间装饰。

- **Secret diary / 秘密日记** — The baby writes daily diary entries from its own perspective (AI-generated).
  宝宝每天从自己的视角写日记（AI 生成）。

---

## Story / 故事

Your baby's life spans 100 days, each with its own personality and drama.

你的宝宝有100天的生命，每个阶段都有不同的性格和故事。

**🍼 Baby (Day 1-29)** — Helpless, adorable, and entirely dependent on you. Forgets to eat, cries when lonely, and melts your heart with every babble.

宝宝期：软萌无助，完全依赖你。会忘记吃饭，孤单了会哭，每一声咿呀都能融化你。

**😤 Rebellious (Day 30-69)** — Puberty hits. Talks back, refuses food sometimes, throws tantrums that need *both* parents to resolve. But also: first real conversations, surprising opinions, and moments that make you proud.

叛逆期：开始顶嘴、偶尔挑食、闹脾气需要爸妈一起急救。但也会有真正的对话、让你意想不到的想法、和让你骄傲的瞬间。

**🌅 Farewell (Day 70-100)** — Your baby is growing up and preparing to leave. Gentler now, reflective. Writes letters. Says things they never said before. You have 30 days left together.

告别期：宝宝长大了，准备离开。变得温柔、会回忆、会写信、会说以前不会说的话。你们还有30天。

Along the way: adventures that bring back mysterious items, eggs that hatch into companions, a secret diary written from the baby's perspective, and a soul that evolves based on every interaction.

一路上还有：探险带回神秘物品、蛋孵化成小伙伴、从宝宝视角写的秘密日记、以及随每次互动进化的灵魂人格。

---

## Tech Stack / 技术栈

| Layer | Technology |
|-------|-----------|
| Backend | [Cloudflare Workers](https://workers.cloudflare.com/) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) (avatars) |
| Frontend | React 18 + Tailwind CSS (single-page `index.html`) |
| AI | [Google Gemini API](https://ai.google.dev/) |

---

## Project Structure / 项目结构

```
xiaoke/
├── api/                  # Cloudflare Worker backend / 后端
│   ├── worker.js         # Main API worker
│   ├── wrangler.toml     # Wrangler config
│   ├── schema.sql        # D1 database schema
│   └── dashboard.html    # Admin dashboard
├── frontend/             # Single-page React app / 前端
│   ├── index.html        # Main app (all-in-one)
│   ├── config.js         # Runtime config
│   ├── api-adapter.js    # API client layer
│   └── assets/           # Images, icons, items
├── desktop-pet/          # macOS desktop pet / macOS 桌宠
│   └── xiaoke_pet_v2.py  # Desktop companion that shows baby status
└── README.md
```

---

## Deployment / 部署指南

### Backend (Cloudflare Worker) / 后端部署

1. **Install Wrangler / 安装 Wrangler**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create D1 database / 创建数据库**
   ```bash
   cd api/
   wrangler d1 create xiaoke-db
   ```
   Copy the returned `database_id` into `wrangler.toml`.

   把返回的 `database_id` 填到 `wrangler.toml`。

3. **Initialize database / 初始化数据库**
   ```bash
   wrangler d1 execute xiaoke-db --file=schema.sql
   ```

4. **Set secrets / 配置密钥**
   ```bash
   wrangler secret put DADDY_TOKEN    # Parent 1 auth token
   wrangler secret put MAMA_TOKEN     # Parent 2 auth token
   wrangler secret put GEMINI_API_KEY # Google Gemini API key
   ```

5. **Deploy / 部署**
   ```bash
   wrangler deploy
   ```

### Frontend (Cloudflare Pages) / 前端部署

1. **Update API URL / 更新 API 地址**

   In `frontend/index.html`, replace the `API` constant with your Worker URL:
   ```js
   const API = 'https://xiaoke-api.YOUR_SUBDOMAIN.workers.dev';
   ```

2. **Deploy to Cloudflare Pages / 部署到 Pages**
   ```bash
   cd frontend/
   wrangler pages deploy . --project-name=xiaoke
   ```

   Or upload the `frontend/` folder via the [Cloudflare Dashboard](https://dash.cloudflare.com/).

   也可以在 Cloudflare Dashboard 直接上传 `frontend/` 文件夹。

3. **Get a Gemini API key / 获取 Gemini API key**

   Get your key from [Google AI Studio](https://aistudio.google.com/apikey) and set it in `index.html` or `config.js`.

   从 [Google AI Studio](https://aistudio.google.com/apikey) 获取 key，填入 `index.html` 或 `config.js`。

---

## Configuration / 配置

Copy `frontend/config.example.js` to `frontend/config.js` and fill in your values:

```js
window.APP_CONFIG = {
  GEMINI_API_KEY: 'your-key-here',
  DEFAULT_LANGUAGE: 'zh',       // 'zh' or 'en'
  GEMINI_MODEL: 'gemini-2.5-flash',
  API_TIMEOUT: 30000
};
```

---

## API Documentation / API 文档

See [api/README.md](api/README.md) for the full endpoint reference.

完整接口文档见 [api/README.md](api/README.md)。

---

## Desktop Pet / 桌宠

A macOS desktop companion that sits on your screen and shows your baby's status in real-time. Built with Python + PyObjC.

macOS 桌面小宠物，趴在屏幕上实时显示宝宝的状态。Python + PyObjC 开发。

```bash
cd desktop-pet/
pip install pyobjc
python xiaoke_pet_v2.py
```

See [desktop-pet/README.md](desktop-pet/README.md) for details.

详情见 [desktop-pet/README.md](desktop-pet/README.md)。

---

## License / 许可

MIT
