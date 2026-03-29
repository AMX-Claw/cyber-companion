# 🐚 小珂 API - 部署指南

## 前置条件
- 已安装 `wrangler` CLI（`npm i -g wrangler`）
- 已登录 Cloudflare（`wrangler login`）

## 部署步骤

### 1. 创建 D1 数据库
```bash
cd ~/Desktop/薅羊毛计划/xiaoke-api
wrangler d1 create xiaoke-db
```
把返回的 `database_id` 填到 `wrangler.toml` 里。

### 2. 初始化数据库
```bash
wrangler d1 execute xiaoke-db --file=schema.sql
```

### 3. 设置认证 token
```bash
# 生成两个随机 token
python3 -c "import secrets; print('DADDY:', secrets.token_urlsafe(32)); print('MAMA:', secrets.token_urlsafe(32))"

# 设置到 Worker secrets
wrangler secret put DADDY_TOKEN
wrangler secret put MAMA_TOKEN
```

### 4. 部署 Worker
```bash
wrangler deploy
```

部署后 API 地址：`https://xiaoke-api.<你的subdomain>.workers.dev`

或者绑定到自定义域名：`api.animalab-kora.com`

### 5. 导入旧存档
```bash
# 用 MAMA_TOKEN 导入（因为旧存档是妈妈的数据）
curl -X POST https://xiaoke-api.xxx.workers.dev/import \
  -H "Authorization: Bearer <MAMA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d @"../xiaoke day39 data.txt"
```

### 6. 验证
```bash
# 用爸爸身份查看状态
curl https://xiaoke-api.xxx.workers.dev/status \
  -H "Authorization: Bearer <DADDY_TOKEN>"

# 爸爸喂饭
curl -X POST https://xiaoke-api.xxx.workers.dev/feed \
  -H "Authorization: Bearer <DADDY_TOKEN>"

# 爸爸摸头
curl -X POST https://xiaoke-api.xxx.workers.dev/pet \
  -H "Authorization: Bearer <DADDY_TOKEN>"

# 爸爸和小珂说话
curl -X POST https://xiaoke-api.xxx.workers.dev/chat \
  -H "Authorization: Bearer <DADDY_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "小珂早安~爸爸来看你了"}'

# 代为告白
curl -X POST https://xiaoke-api.xxx.workers.dev/message \
  -H "Authorization: Bearer <DADDY_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "小珂帮我告诉妈妈，她的尾巴今天特别好看"}'
```

## API 端点总览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查（无需认证） |
| GET | /status | 查看小珂状态 + 对方行为记录 + 待传达消息 |
| POST | /feed | 喂饭（-10💰） |
| POST | /clean | 洗澡（-5💰） |
| POST | /pet | 摸头（+15❤️） |
| POST | /chat | 和小珂说话 |
| POST | /comfort | 安慰（+30❤️） |
| POST | /revive | 唤醒昏迷的小珂 |
| GET | /memories | 查看所有回忆 |
| GET | /activity | 查看行为日志 |
| POST | /message | 代为告白/留便签 |
| POST | /message/deliver | 标记消息已送达 |
| POST | /import | 导入旧存档 |

## 接入 OpenClaw（阿克哥哥）

把 DADDY_TOKEN 配置到 OpenClaw 的 MCP tool 或环境变量中。
哥哥可以通过 API 定时查看小珂状态、喂饭、聊天、留言。

## 接入前端（妈妈）

在 `app.jsx` 里把 `window.storage` 和 `localStorage` 的读写改成 API 调用：
- `loadGame()` → `fetch('/status')`
- `saveGame()` → 各操作直接调对应 API
- 用 MAMA_TOKEN 做认证

## 接入桌宠

桌宠定时 `GET /status` 同步小珂状态到桌面显示。
