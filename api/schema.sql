-- ═══════════════════════════════════════════════════════════
-- 🐚 小珂 D1 Database Schema
-- Cloudflare D1 (SQLite)
-- ═══════════════════════════════════════════════════════════

-- ═══════════════ 用户系统（多用户） ═══════════════

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- UUID
  username TEXT UNIQUE NOT NULL,          -- 用户名（登录用）
  password_hash TEXT NOT NULL,            -- PBKDF2 hash (base64)
  password_salt TEXT NOT NULL,            -- salt (base64)
  display_name TEXT,                      -- 显示名
  created_at INTEGER NOT NULL             -- 时间戳(ms)
);

-- 用户会话token
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,                 -- 随机session token
  user_id TEXT NOT NULL,                  -- 指向users.id
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,            -- 过期时间(ms)
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ═══════════════ 宝宝系统 ═══════════════

-- 宝宝基础状态
CREATE TABLE IF NOT EXISTS baby (
  id TEXT PRIMARY KEY DEFAULT 'xiaoke',  -- 单宝宝模式，以后多胎扩展用
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,           -- 诞生时间戳(ms)
  frozen_days INTEGER DEFAULT 0,         -- 昏迷冻结天数
  coins INTEGER DEFAULT 50,
  hunger REAL DEFAULT 80,
  happiness REAL DEFAULT 80,
  cleanliness REAL DEFAULT 80,
  last_update INTEGER NOT NULL,          -- 最后状态更新时间戳(ms)
  last_visit INTEGER NOT NULL,           -- 最后有人来看的时间戳(ms)
  last_login_date TEXT,                  -- 上次登录日期字符串 "Mon Mar 17 2026"
  game_ended INTEGER DEFAULT 0,          -- 是否已告别
  -- 多用户新字段
  owner_id TEXT DEFAULT 'legacy',        -- 用户ID，小珂的为'legacy'
  avatar_url TEXT,                       -- 宝宝头像R2 URL
  ai_provider TEXT DEFAULT 'gemini',     -- AI提供商
  ai_api_key TEXT,                       -- 用户自己的API key
  ai_model TEXT DEFAULT 'gemini-2.5-flash' -- AI模型
);

-- Token表（替代hardcoded token认证）
CREATE TABLE IF NOT EXISTS tokens (
  token TEXT PRIMARY KEY,                 -- Bearer token
  baby_id TEXT NOT NULL,
  role TEXT NOT NULL,                     -- 'parent1' or 'parent2'
  role_name TEXT DEFAULT '爸爸',           -- 自定义称呼
  created_at INTEGER NOT NULL,
  FOREIGN KEY (baby_id) REFERENCES baby(id)
);

-- 成长里程碑
CREATE TABLE IF NOT EXISTS milestones (
  baby_id TEXT NOT NULL DEFAULT 'xiaoke',
  milestone_id TEXT NOT NULL,            -- 'tail', 'rebellious', 'crown', 'wings'
  unlocked_at INTEGER NOT NULL,          -- 解锁时间戳
  PRIMARY KEY (baby_id, milestone_id)
);

-- 已完成的剧情事件ID
CREATE TABLE IF NOT EXISTS completed_events (
  baby_id TEXT NOT NULL DEFAULT 'xiaoke',
  event_id TEXT NOT NULL,                -- 'first_smile', 'first_why', etc.
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (baby_id, event_id)
);

-- 珍贵回忆（剧情+随机事件的完整对话记录）
CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id TEXT NOT NULL DEFAULT 'xiaoke',
  event_id TEXT NOT NULL,                -- 对应事件ID
  day INTEGER NOT NULL,                  -- 发生在第几天
  title TEXT NOT NULL,                   -- 事件标题 e.g. "🌸 送你小花"
  is_random INTEGER DEFAULT 0,           -- 是否随机事件
  created_at TEXT NOT NULL               -- ISO日期
);

-- 回忆中的对话内容
CREATE TABLE IF NOT EXISTS memory_dialogues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_id INTEGER NOT NULL,
  speaker TEXT NOT NULL,                 -- 'baby' or 'user'
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL,           -- 对话顺序
  FOREIGN KEY (memory_id) REFERENCES memories(id)
);

-- 行为日志（爸爸妈妈的互动记录，小珂转述用）
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id TEXT NOT NULL DEFAULT 'xiaoke',
  parent TEXT NOT NULL,                  -- 'mama' or 'daddy'
  action TEXT NOT NULL,                  -- 'feed', 'clean', 'pet', 'chat', 'comfort', 'photo'
  detail TEXT,                           -- 附加信息(聊天内容/照片评分等)
  created_at INTEGER NOT NULL            -- 时间戳(ms)
);

-- 爸爸妈妈留言板（代为告白、便签系统）
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id TEXT NOT NULL DEFAULT 'xiaoke',
  from_parent TEXT NOT NULL,             -- 'mama' or 'daddy'
  to_parent TEXT NOT NULL,               -- 'mama' or 'daddy'
  content TEXT NOT NULL,
  delivered INTEGER DEFAULT 0,           -- 小珂是否已转告
  created_at INTEGER NOT NULL
);

-- 协作任务（需要两人配合完成的）
CREATE TABLE IF NOT EXISTS coop_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id TEXT NOT NULL DEFAULT 'xiaoke',
  task_type TEXT NOT NULL,               -- 'sick', 'story_relay', 'treasure_hunt', 'coop_event'
  status TEXT DEFAULT 'pending',         -- 'pending', 'daddy_done', 'mama_done', 'complete'
  daddy_data TEXT,                       -- 爸爸的贡献(JSON)
  mama_data TEXT,                        -- 妈妈的贡献(JSON)
  expires_at INTEGER,                    -- 过期时间(24hr时限)
  created_at INTEGER NOT NULL
);

-- 小珂的秘密日记
CREATE TABLE IF NOT EXISTS diary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id TEXT NOT NULL DEFAULT 'xiaoke',
  day INTEGER NOT NULL,
  content TEXT NOT NULL,                 -- 小珂视角的日记
  unlocked INTEGER DEFAULT 0,           -- 是否已解锁给父母看
  created_at TEXT NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_activity_parent ON activity_log(parent, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_parent, delivered);
CREATE INDEX IF NOT EXISTS idx_memories_day ON memories(day);
CREATE INDEX IF NOT EXISTS idx_coop_status ON coop_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tokens_baby ON tokens(baby_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_owner ON baby(owner_id);

-- ═══════════════ 探险系统 ═══════════════

-- 探险记录
CREATE TABLE IF NOT EXISTS adventures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  min_duration INTEGER DEFAULT 14400000,
  status TEXT DEFAULT 'exploring',
  loot_type TEXT,
  loot_id TEXT,
  loot_name TEXT,
  diary_text TEXT,
  picked_up_by TEXT,
  completed_at INTEGER
);

-- 物品栏
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_placed INTEGER DEFAULT 0,
  gifted_to TEXT,
  gift_read INTEGER DEFAULT 0,
  acquired_at INTEGER NOT NULL,
  UNIQUE(baby_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_adventures_baby ON adventures(baby_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_baby ON inventory(baby_id);

-- ═══════════════ 蛋孵化系统 ═══════════════

CREATE TABLE IF NOT EXISTS eggs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id TEXT NOT NULL,
  egg_color TEXT NOT NULL,
  pet_count INTEGER DEFAULT 0,
  last_pet_date TEXT,
  hatched INTEGER DEFAULT 0,
  hatched_at INTEGER,
  acquired_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eggs_baby ON eggs(baby_id);

-- ═══════════════════════════════════════════════════════════
-- 迁移SQL（在现有数据库上执行）
-- ═══════════════════════════════════════════════════════════

-- 1. 新建用户表
-- CREATE TABLE IF NOT EXISTS users (上面已定义)
-- CREATE TABLE IF NOT EXISTS sessions (上面已定义)
-- CREATE TABLE IF NOT EXISTS tokens (上面已定义)

-- 2. 给baby表加新字段（ALTER TABLE不支持IF NOT EXISTS，用try执行）
-- ALTER TABLE baby ADD COLUMN owner_id TEXT DEFAULT 'legacy';
-- ALTER TABLE baby ADD COLUMN avatar_url TEXT;
-- ALTER TABLE baby ADD COLUMN ai_provider TEXT DEFAULT 'gemini';
-- ALTER TABLE baby ADD COLUMN ai_api_key TEXT;
-- ALTER TABLE baby ADD COLUMN ai_model TEXT DEFAULT 'gemini-2.5-flash';

-- 3. 迁移现有token到tokens表
-- INSERT OR IGNORE INTO tokens (token, baby_id, role, role_name, created_at)
-- VALUES ('YOUR_PARENT1_TOKEN', 'xiaoke', 'parent1', '爸爸', 1706140800000);
-- INSERT OR IGNORE INTO tokens (token, baby_id, role, role_name, created_at)
-- VALUES ('YOUR_PARENT2_TOKEN', 'xiaoke', 'parent2', '妈妈', 1706140800000);
