# Xiaoke API

Cloudflare Worker backend for Xiaoke, using D1 (SQLite) for data and R2 for avatar storage.

小珂的后端 API，基于 Cloudflare Worker，使用 D1 数据库和 R2 存储。

## Deployment / 部署

### Prerequisites / 前置条件

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed (`npm i -g wrangler`)
- Logged in to Cloudflare (`wrangler login`)

### Steps / 步骤

**1. Create D1 database / 创建数据库**

```bash
cd api/
wrangler d1 create xiaoke-db
```

Copy the returned `database_id` into `wrangler.toml`.

把返回的 `database_id` 填到 `wrangler.toml` 里。

**2. Initialize schema / 初始化表结构**

```bash
wrangler d1 execute xiaoke-db --file=schema.sql
```

**3. Set auth tokens / 设置认证 token**

```bash
# Generate two random tokens / 生成两个随机 token
python3 -c "import secrets; print('PARENT1:', secrets.token_urlsafe(32)); print('PARENT2:', secrets.token_urlsafe(32))"

# Store as Worker secrets / 存入 Worker secrets
wrangler secret put DADDY_TOKEN
wrangler secret put MAMA_TOKEN
```

**4. Set Gemini API key / 设置 Gemini API key**

Either put it in `wrangler.toml` `[vars]` or use a secret:

```bash
wrangler secret put GEMINI_API_KEY
```

**5. Deploy / 部署**

```bash
wrangler deploy
```

Your API will be available at `https://xiaoke-api.<your-subdomain>.workers.dev`.

部署后 API 地址：`https://xiaoke-api.<你的subdomain>.workers.dev`

---

## API Endpoints / 接口列表

All endpoints except `/health` require `Authorization: Bearer <TOKEN>` header.

除 `/health` 外，所有接口需要 `Authorization: Bearer <TOKEN>` 请求头。

### Core / 核心

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (no auth) / 健康检查（无需认证） |
| GET | `/status` | Baby status + other parent's activity + pending messages / 宝宝状态 |
| POST | `/feed` | Feed the baby (-10 coins) / 喂饭 |
| POST | `/clean` | Bathe the baby (-5 coins) / 洗澡 |
| POST | `/pet` | Pet the baby (+15 happiness) / 摸头 |
| POST | `/chat` | Chat with baby `{message}` / 聊天 |
| POST | `/comfort` | Comfort the baby (+30 happiness) / 安慰 |
| POST | `/revive` | Revive a comatose baby / 唤醒昏迷 |

### Memory & History / 回忆与历史

| Method | Path | Description |
|--------|------|-------------|
| GET | `/memories` | List all saved memories / 查看所有回忆 |
| POST | `/memories/save` | Save a memory / 保存回忆 |
| GET | `/activity` | Activity log `?limit=20` / 行为日志 |
| GET | `/chat/history` | Chat history / 聊天记录 |
| GET | `/diary` | Daily diary entries / 日记 |
| POST | `/diary/generate` | Generate diary entry (AI) / 生成日记 |

### Parent Messaging / 亲子留言板

| Method | Path | Description |
|--------|------|-------------|
| POST | `/message` | Send message to other parent `{message}` / 留言 |
| POST | `/message/deliver` | Mark message as delivered `{id}` / 标记已送达 |
| GET | `/message/board` | Message board / 留言板 |

### Adventure & Inventory / 探险与收集

| Method | Path | Description |
|--------|------|-------------|
| POST | `/adventure/start` | Start an adventure / 开始探险 |
| GET | `/adventure/status` | Adventure status / 探险状态 |
| POST | `/adventure/pickup` | Pick up loot / 捡起战利品 |
| GET | `/inventory` | View inventory / 物品栏 |
| POST | `/gift/read` | Read a received gift / 阅读礼物 |

### Egg System / 蛋孵化

| Method | Path | Description |
|--------|------|-------------|
| GET | `/eggs` | List eggs / 查看蛋 |
| POST | `/egg/pet` | Interact with egg / 摸蛋 |

### Soul & Personality / 灵魂人格

| Method | Path | Description |
|--------|------|-------------|
| GET | `/soul` | Get baby's soul/personality / 查看人格 |
| GET | `/soul/traits` | Get personality traits / 性格特征 |

### User & Auth / 用户认证

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user / 注册 |
| POST | `/auth/login` | Login / 登录 |
| POST | `/baby/create` | Create a new baby / 创建宝宝 |
| GET | `/baby/list` | List user's babies / 宝宝列表 |

### Data / 数据

| Method | Path | Description |
|--------|------|-------------|
| POST | `/save-state` | Sync game state / 同步状态 |
| POST | `/import` | Import save data / 导入存档 |
| POST | `/daily-checkin` | Daily check-in / 每日签到 |
| POST | `/event/reward` | Claim event reward / 领取奖励 |

---

## Cron / 定时任务

A cron trigger runs daily at UTC 12:50 to auto-generate diary entries for all babies.

每天 UTC 12:50 自动为所有宝宝生成日记。
