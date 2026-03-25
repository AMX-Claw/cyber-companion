# 小珂多用户系统迁移指南

## 部署步骤

### 1. 创建 R2 Bucket

```bash
wrangler r2 bucket create xiaoke-avatars
```

### 2. 执行数据库迁移

按顺序在 D1 上执行以下 SQL（通过 wrangler 或 dashboard）：

```bash
# 方式1：用wrangler命令逐条执行
wrangler d1 execute xiaoke-db --command "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, display_name TEXT, created_at INTEGER NOT NULL)"

wrangler d1 execute xiaoke-db --command "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id))"

wrangler d1 execute xiaoke-db --command "CREATE TABLE IF NOT EXISTS tokens (token TEXT PRIMARY KEY, baby_id TEXT NOT NULL, role TEXT NOT NULL, role_name TEXT DEFAULT '爸爸', created_at INTEGER NOT NULL, FOREIGN KEY (baby_id) REFERENCES baby(id))"

# 给baby表加新字段（每条单独执行，忽略已存在错误）
wrangler d1 execute xiaoke-db --command "ALTER TABLE baby ADD COLUMN owner_id TEXT DEFAULT 'legacy'"
wrangler d1 execute xiaoke-db --command "ALTER TABLE baby ADD COLUMN avatar_url TEXT"
wrangler d1 execute xiaoke-db --command "ALTER TABLE baby ADD COLUMN ai_provider TEXT DEFAULT 'gemini'"
wrangler d1 execute xiaoke-db --command "ALTER TABLE baby ADD COLUMN ai_api_key TEXT"
wrangler d1 execute xiaoke-db --command "ALTER TABLE baby ADD COLUMN ai_model TEXT DEFAULT 'gemini-2.5-flash'"

# 新索引
wrangler d1 execute xiaoke-db --command "CREATE INDEX IF NOT EXISTS idx_tokens_baby ON tokens(baby_id)"
wrangler d1 execute xiaoke-db --command "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)"
wrangler d1 execute xiaoke-db --command "CREATE INDEX IF NOT EXISTS idx_baby_owner ON baby(owner_id)"
```

### 3. 迁移小珂的token到tokens表

```bash
# 把现有的hardcoded token迁移进来（token值需要跟 wrangler secret 里设置的一致）
# 先查看你设置的DADDY_TOKEN和MAMA_TOKEN的值，然后：
wrangler d1 execute xiaoke-db --command "INSERT OR IGNORE INTO tokens (token, baby_id, role, role_name, created_at) VALUES ('YOUR_DADDY_TOKEN', 'xiaoke', 'parent1', '爸爸', 1706140800000)"

wrangler d1 execute xiaoke-db --command "INSERT OR IGNORE INTO tokens (token, baby_id, role, role_name, created_at) VALUES ('YOUR_MAMA_TOKEN', 'xiaoke', 'parent2', '妈妈', 1706140800000)"
```

> **注意：** token值必须和 `wrangler secret` 里设置的 DADDY_TOKEN / MAMA_TOKEN 完全一致。
> 即使不迁移token到表里，旧的环境变量token仍然能用（代码有fallback）。

### 4. Deploy Worker

```bash
wrangler deploy
```

### 5. 验证

```bash
# 测试旧token是否仍然工作
curl -H "Authorization: Bearer YOUR_DADDY_TOKEN" https://your-worker.workers.dev/status

# 测试注册
curl -X POST https://your-worker.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","display_name":"测试用户"}'

# 测试创建宝宝（用返回的sessionToken）
curl -X POST https://your-worker.workers.dev/baby/create \
  -H "Authorization: Bearer <sessionToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"小贝","parent1_name":"爸爸","parent2_name":"妈妈"}'
```

## 关键变更

| 变更 | 说明 |
|------|------|
| 认证 | Bearer token先查tokens表，再fallback到env vars |
| 新表 | users, sessions, tokens |
| baby表新字段 | owner_id, avatar_url, ai_provider, ai_api_key, ai_model |
| 新端点 | /auth/register, /auth/login, /baby/create, /baby/list, /baby/avatar |
| R2 | 宝宝头像存储，binding名 AVATAR_BUCKET |
| AI | 每个宝宝可配置自己的AI key/model，fallback到环境变量 |

## 向后兼容

- 小珂的所有数据不受影响（owner_id='legacy'）
- DADDY_TOKEN / MAMA_TOKEN 环境变量仍然有效
- 所有现有API端点行为不变
- 现有前端不需要改动即可继续使用
