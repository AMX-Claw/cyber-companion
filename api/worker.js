// ═══════════════════════════════════════════════════════════
// 🐚 小珂 API v5 - Cloudflare Worker
// 多用户系统 + 闹脾气 + 双亲急救 + 经济系统
// ═══════════════════════════════════════════════════════════

const HUNGER_DECAY = 100 / (24 * 60 * 60 * 1000);
const CLEAN_DECAY = 100 / (48 * 60 * 60 * 1000);
const HAPPY_DECAY = 100 / (24 * 60 * 60 * 1000);

// AEDT = UTC+11
const AEDT_OFFSET = 11 * 60 * 60 * 1000;

function getAEDTDateString(ts) {
  return new Date(ts + AEDT_OFFSET).toISOString().split('T')[0];
}

function calcDay(createdAt, frozenDays = 0) {
  const diff = Date.now() - Number(createdAt);
  return Math.max(1, Math.min(100, Math.floor(diff / (24 * 60 * 60 * 1000)) + 1 - Number(frozenDays)));
}

function getStage(baby) {
  const day = calcDay(baby.created_at, baby.frozen_days);
  return day >= 70 ? 'farewell' : day >= 30 ? 'rebellious' : 'baby';
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function getRecentBothParents(db, babyId) {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const rows = await db.prepare(
    'SELECT DISTINCT parent FROM activity_log WHERE baby_id = ? AND created_at > ?'
  ).bind(babyId, fiveMinAgo).all();
  const parents = rows.results.map(r => r.parent);
  return parents.includes('daddy') && parents.includes('mama');
}

function getDualParentPetResponse(stage) {
  const r = {
    baby: [
      '哇！爸爸和妈妈都在！人家好幸福！（两只手都被牵着）✨',
      '（左蹭蹭右蹭蹭）嘻嘻~两个人一起摸摸~人家要融化了~',
      '爸爸摸头妈妈摸脸~人家是全世界最幸福的宝宝！',
      '一家人在一起的感觉……好温暖……💕',
    ],
    rebellious: [
      '哼……才不是因为你们两个都在人家就开心了……（嘴角疯狂上扬）',
      '都、都不要一起看着人家啦！好害羞！……其实有点开心',
      '人家已经长大了不需要爸爸妈妈一起哄！……但是不要走',
    ],
    farewell: [
      '爸爸……妈妈……人家好想永远这样被你们围着……',
      '（紧紧抱住两个人）这个画面……人家会记一辈子的',
      '三个人在一起的时间……每一秒都好珍贵',
    ],
  };
  return pick(r[stage]);
}

function getDualParentFeedResponse(stage) {
  const r = {
    baby: [
      '爸爸妈妈一起喂饭饭！人家要吃两倍！啊呜啊呜~🍚',
      '（左一口右一口）嘻嘻~两个人喂的饭最最最好吃了！',
      '一家人一起吃饭~这就是幸福的味道吧~',
    ],
    rebellious: [
      '都、都不要抢着喂人家！人家自己会吃！……好吧你们一人喂一口',
      '哼！两个人一起盯着人家吃饭好有压力！……但是饭好好吃',
      '人家又不是小孩子了……算了今天破例让你们喂',
    ],
    farewell: [
      '一家三口吃饭……这种日子还剩多少呢……（大口大口吃）',
      '爸爸妈妈……谢谢你们每一顿饭……人家都记得',
    ],
  };
  return pick(r[stage]);
}

function getPetResponse(stage, roleName) {
  const r = {
    baby: [
      `嘻嘻……${roleName}的手手好温暖~人家还要摸摸~`,
      `（蹭蹭）${roleName}~人家最喜欢被摸头了~`,
      `咿呀~${roleName}摸摸~（开心地摇尾巴）`,
      `人家的头顶被${roleName}摸得暖暖的~💕`,
      `（眯起眼睛）嗯~不要停~`,
      `${roleName}的手手是世界上最舒服的~`,
    ],
    rebellious: [
      `哼……才、才不是喜欢被${roleName}摸头呢……（但没有躲开）`,
      `人家已经是大宝宝了！不要随便摸人家的头！……再摸一下也行啦`,
      `（假装不在意）随便你啦……反正人家也不讨厌`,
      `都说了不要摸了！……嗯……好吧再摸一会儿`,
      `哼！${roleName}只会用摸头来收买人家！……有点舒服`,
      `人家才不稀罕呢……（偷偷把头往${roleName}手心蹭）`,
    ],
    farewell: [
      `（安静地靠在${roleName}身边）……人家会记住这个感觉的`,
      `${roleName}……人家长大了，但还是喜欢被你摸头`,
      `谢谢${roleName}……每一次摸头人家都记得`,
      `（微笑）${roleName}的手……和第一天一样温暖呢`,
      `人家会带着${roleName}摸头的温暖，去看世界的`,
      `时间过得好快……${roleName}再多摸摸人家吧`,
    ],
  };
  return pick(r[stage]);
}

function getFeedResponse(stage, roleName) {
  const r = {
    baby: [
      `啊呜~好好吃！${roleName}喂的饭最香了~`,
      `（大口大口吃）还要还要~！`,
      `嗝~人家吃得好饱~谢谢${roleName}~`,
      `（嘴巴鼓鼓的）唔……好吃……`,
    ],
    rebellious_normal: [
      `哼，人家才不是因为饿了才吃的……是${roleName}做的还行啦`,
      `（假装不情愿地吃）一般般啦……再来一口`,
      `切~人家自己也能找吃的……不过${roleName}给的也凑合`,
    ],
    rebellious_picky: [
      `这个……人家不太想吃……（犹豫了一下还是吃了）好吧算你赢`,
      `人家想吃别的！……算了，有得吃就不错了`,
      `哼！人家现在不饿！……好吧肚子叫了，给我吧`,
    ],
    farewell: [
      `${roleName}做的饭……人家每一口都要好好记住`,
      `（慢慢吃着）以后……还能吃到${roleName}做的饭吗？`,
      `好好吃……${roleName}，谢谢你一直喂人家`,
    ],
  };
  if (stage === 'rebellious') {
    return Math.random() < 0.3 ? pick(r.rebellious_picky) : pick(r.rebellious_normal);
  }
  return pick(r[stage]);
}

function calcCurrentStats(baby) {
  const now = Date.now();
  const diff = now - Number(baby.last_update);
  let hunger = Math.max(0, Number(baby.hunger) - diff * HUNGER_DECAY);
  let cleanliness = Math.max(0, Number(baby.cleanliness) - diff * CLEAN_DECAY);
  let happiness = Math.max(0, Number(baby.happiness) - diff * HAPPY_DECAY);

  // tantrum: hunger<30 or cleanliness<30 → happiness强制归零
  const isTantrum = hunger < 30 || cleanliness < 30;
  if (isTantrum) happiness = 0;

  const day = calcDay(baby.created_at, baby.frozen_days);

  // 昏迷判断：48h未访问 或 tantrum 24h未双亲comfort
  const noVisitComa = baby.last_visit ? (now - Number(baby.last_visit)) / (60 * 60 * 1000) >= 48 : false;

  let tantrumComa = false;
  if (isTantrum && baby.tantrum_started_at) {
    const tantrumHours = (now - Number(baby.tantrum_started_at)) / (60 * 60 * 1000);
    const bothComforted = baby.tantrum_daddy_comforted && baby.tantrum_mama_comforted;
    if (tantrumHours >= 24 && !bothComforted) {
      tantrumComa = true;
    }
  }

  const isComa = noVisitComa || tantrumComa;

  return {
    ...baby,
    hunger,
    cleanliness,
    happiness,
    day,
    isTantrum,
    isComa,
    _now: now,
  };
}

// ═══════════════ 密码 PBKDF2 ═══════════════

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return new Uint8Array(bits);
}

function toBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function createPasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  return { hash: toBase64(hash), salt: toBase64(salt) };
}

async function verifyPassword(password, storedHash, storedSalt) {
  const salt = fromBase64(storedSalt);
  const hash = await hashPassword(password, salt);
  return toBase64(hash) === storedHash;
}

function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64(bytes).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
}

function generateUUID() {
  return crypto.randomUUID();
}

// ═══════════════ 认证系统 ═══════════════

// 返回 { parent: 'daddy'|'mama', babyId, roleName } 或 null
async function authenticate(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;

  // 1. 查 tokens 表
  const db = env.DB;
  const tokenRow = await db.prepare(
    'SELECT token, baby_id, role, role_name FROM tokens WHERE token = ?'
  ).bind(token).first();

  if (tokenRow) {
    // parent1 → 'daddy' behavior, parent2 → 'mama' behavior
    const parent = tokenRow.role === 'parent1' ? 'daddy' : 'mama';
    return { parent, babyId: tokenRow.baby_id, roleName: tokenRow.role_name || (parent === 'daddy' ? '爸爸' : '妈妈') };
  }

  // 2. 兼容旧的环境变量 token（小珂专用）
  if (token === env.DADDY_TOKEN) return { parent: 'daddy', babyId: 'xiaoke', roleName: '爸爸' };
  if (token === env.MAMA_TOKEN) return { parent: 'mama', babyId: 'xiaoke', roleName: '妈妈' };

  return null;
}

// Session认证：用于用户管理端点
async function authenticateSession(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;

  const db = env.DB;
  const session = await db.prepare(
    'SELECT user_id, expires_at FROM sessions WHERE token = ?'
  ).bind(token).first();

  if (!session) return null;
  if (Date.now() > Number(session.expires_at)) return null;

  const user = await db.prepare(
    'SELECT id, username, display_name FROM users WHERE id = ?'
  ).bind(session.user_id).first();

  return user || null;
}

// ═══════════════ AI调用 ═══════════════

async function callGeminiAPI(prompt, apiKey, model, config = {}) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: config.maxTokens || 2000,
          temperature: config.temperature || 0.9,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function getAIConfig(baby, env) {
  const provider = baby.ai_provider || 'gemini';
  const apiKey = baby.ai_api_key || env.GEMINI_API_KEY;
  const model = baby.ai_model || 'gemini-2.5-flash';
  return { provider, apiKey, model };
}

// ═══════════════ 物品清单 ═══════════════

const ITEM_CATALOG = {
  furniture: {
    bed: '小床', lamp: '相框', cabinet: '矮柜', clock: '挂钟', carpet: '地毯', dining: '书桌',
  },
  flower: {
    flower_blue: '蓝花', flower_pink: '粉花',
  },
  fruit: {
    fruit_apple: '苹果', fruit_grape: '葡萄', fruit_orange: '橙子',
    fruit_peach: '桃子', fruit_pear: '梨', fruit_strawberry: '草莓',
    fruit_blue_star_fruit: '杨桃',
  },
  vegetable: {
    veg_coliflower: '花菜', veg_eggplant: '茄子', veg_pumpkin: '南瓜',
    veg_turnip: '萝卜', vege_aloe: '芦荟', vege_carrot: '胡萝卜',
    vege_corn: '玉米', vege_lettuce: '生菜',
  },
  egg: {
    egg_yellow: '黄色蛋', egg_red: '红色蛋', egg_brown: '棕色蛋', egg_green: '绿色蛋', egg_blue: '蓝色蛋',
  },
};

// 家具解锁顺序：床→相框→矮柜→挂钟→地毯→书桌
const FURNITURE_UNLOCK_ORDER = ['bed', 'lamp', 'cabinet', 'clock', 'carpet', 'dining'];
const ALL_FURNITURE_IDS = Object.keys(ITEM_CATALOG.furniture);

function generateLoot(adventureCount, ownedItems) {
  // 第一次探险必得床
  if (adventureCount === 0) {
    return { type: 'furniture', id: 'bed', name: ITEM_CATALOG.furniture.bed };
  }

  // 按固定顺序找下一件未拥有的家具
  const nextFurniture = FURNITURE_UNLOCK_ORDER.find(id => !ownedItems.includes(id));

  // 花和蛋过滤已拥有（唯一），果蔬不过滤（可重复）
  const availableFlowers = Object.keys(ITEM_CATALOG.flower).filter(id => !ownedItems.includes(id));
  const availableEggs = Object.keys(ITEM_CATALOG.egg).filter(id => !ownedItems.includes(id));
  const allFruits = Object.keys(ITEM_CATALOG.fruit);
  const allVegs = Object.keys(ITEM_CATALOG.vegetable);

  // 基础概率：家具20%, 蛋10%, 花5%, 果蔬65%(水果32.5%+蔬菜32.5%)
  const baseWeights = {
    furniture: nextFurniture ? 0.20 : 0,
    egg: availableEggs.length > 0 ? 0.10 : 0,
    flower: availableFlowers.length > 0 ? 0.05 : 0,
    fruit: 0.325,
    vegetable: 0.325,
  };

  const totalWeight = Object.values(baseWeights).reduce((a, b) => a + b, 0);

  // 所有物品都收集满了
  if (totalWeight === 0) {
    return { type: 'nothing', id: 'nothing', name: '空手而归' };
  }

  // 归一化概率（把已满分类的概率分配给其他未满分类）
  const roll = Math.random() * totalWeight;
  let cumulative = 0;

  cumulative += baseWeights.furniture;
  if (roll < cumulative && nextFurniture) {
    return { type: 'furniture', id: nextFurniture, name: ITEM_CATALOG.furniture[nextFurniture] };
  }

  cumulative += baseWeights.egg;
  if (roll < cumulative && availableEggs.length > 0) {
    const id = availableEggs[Math.floor(Math.random() * availableEggs.length)];
    const color = id.replace('egg_', '');
    return { type: 'egg', id, name: ITEM_CATALOG.egg[id], color };
  }

  cumulative += baseWeights.flower;
  if (roll < cumulative && availableFlowers.length > 0) {
    const id = availableFlowers[Math.floor(Math.random() * availableFlowers.length)];
    return { type: 'flower', id, name: ITEM_CATALOG.flower[id] };
  }

  cumulative += baseWeights.fruit;
  if (roll < cumulative) {
    const id = allFruits[Math.floor(Math.random() * allFruits.length)];
    return { type: 'fruit', id, name: ITEM_CATALOG.fruit[id] };
  }

  // 剩下的就是蔬菜
  {
    const id = allVegs[Math.floor(Math.random() * allVegs.length)];
    return { type: 'vegetable', id, name: ITEM_CATALOG.vegetable[id] };
  }

  // fallback（理论上不会到这里）
  return { type: 'nothing', id: 'nothing', name: '空手而归' };
}

// ═══════════════ 工具函数 ═══════════════

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return handleCORS();

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') return json({ status: 'ok', time: new Date().toISOString() });

    const db = env.DB;

    try {
      // ═══════════════════════════════════════════════════════════
      // 用户管理端点（不需要宝宝token，用session认证或无认证）
      // ═══════════════════════════════════════════════════════════

      // ═══════════════ POST /auth/register ═══════════════
      if (path === '/auth/register' && request.method === 'POST') {
        const body = await request.json();
        const { username, password, display_name } = body;

        if (!username || !password) return json({ error: '用户名和密码不能为空' }, 400);
        if (username.length < 2 || username.length > 30) return json({ error: '用户名长度2-30个字符' }, 400);
        if (password.length < 6) return json({ error: '密码至少6个字符' }, 400);
        if (!/^[a-zA-Z0-9_\u4e00-\u9fff]+$/.test(username)) return json({ error: '用户名只能包含字母、数字、下划线和中文' }, 400);

        // 检查用户名是否已存在
        const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
        if (existing) return json({ error: '用户名已被占用' }, 409);

        const userId = generateUUID();
        const { hash, salt } = await createPasswordHash(password);
        const now = Date.now();

        await db.prepare(
          'INSERT INTO users (id, username, password_hash, password_salt, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(userId, username, hash, salt, display_name || username, now).run();

        // 注册后自动登录，返回session token
        const sessionToken = generateToken();
        const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30天
        await db.prepare(
          'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
        ).bind(sessionToken, userId, now, expiresAt).run();

        return json({
          message: '注册成功！',
          userId,
          username,
          displayName: display_name || username,
          sessionToken,
          expiresAt,
        });
      }

      // ═══════════════ POST /auth/login ═══════════════
      if (path === '/auth/login' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) return json({ error: '用户名和密码不能为空' }, 400);

        const user = await db.prepare(
          'SELECT id, username, password_hash, password_salt, display_name FROM users WHERE username = ?'
        ).bind(username).first();

        if (!user) return json({ error: '用户名或密码错误' }, 401);

        const valid = await verifyPassword(password, user.password_hash, user.password_salt);
        if (!valid) return json({ error: '用户名或密码错误' }, 401);

        const now = Date.now();
        const sessionToken = generateToken();
        const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

        await db.prepare(
          'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
        ).bind(sessionToken, user.id, now, expiresAt).run();

        return json({
          message: '登录成功！',
          userId: user.id,
          username: user.username,
          displayName: user.display_name,
          sessionToken,
          expiresAt,
        });
      }

      // ═══════════════ POST /baby/create ═══════════════
      if (path === '/baby/create' && request.method === 'POST') {
        const user = await authenticateSession(request, env);
        if (!user) return json({ error: '需要登录' }, 401);

        const body = await request.json();
        const { name, parent1_name, parent2_name, ai_provider, ai_model, ai_api_key, avatar } = body;
        const validAvatars = ['coral', 'crab', 'bunny'];
        const babyAvatar = validAvatars.includes(avatar) ? avatar : 'coral';

        if (!name) return json({ error: '宝宝名字不能为空' }, 400);

        const babyId = generateUUID();
        const now = Date.now();

        await db.prepare(`
          INSERT INTO baby (id, name, created_at, frozen_days, coins, hunger, happiness, cleanliness,
            last_update, last_visit, owner_id, ai_provider, ai_api_key, ai_model, avatar)
          VALUES (?, ?, ?, 0, 50, 80, 80, 80, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          babyId, name, now, now, now, user.id,
          ai_provider || 'gemini',
          ai_api_key || null,
          ai_model || 'gemini-2.5-flash',
          babyAvatar
        ).run();

        // 生成两个parent token
        const token1 = generateToken();
        const token2 = generateToken();
        const p1Name = parent1_name || '爸爸';
        const p2Name = parent2_name || '妈妈';

        await db.prepare(
          'INSERT INTO tokens (token, baby_id, role, role_name, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(token1, babyId, 'parent1', p1Name, now).run();

        await db.prepare(
          'INSERT INTO tokens (token, baby_id, role, role_name, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(token2, babyId, 'parent2', p2Name, now).run();

        return json({
          message: `${name}诞生了！🐚`,
          babyId,
          name,
          tokens: {
            parent1: { token: token1, role: 'parent1', roleName: p1Name },
            parent2: { token: token2, role: 'parent2', roleName: p2Name },
          },
        });
      }

      // ═══════════════ GET /baby/list ═══════════════
      if (path === '/baby/list' && request.method === 'GET') {
        const user = await authenticateSession(request, env);
        if (!user) return json({ error: '需要登录' }, 401);

        const babies = await db.prepare(
          'SELECT id, name, created_at, avatar_url, ai_provider, ai_model FROM baby WHERE owner_id = ?'
        ).bind(user.id).all();

        const result = [];
        for (const b of babies.results) {
          const day = calcDay(b.created_at, 0);
          const tokens = await db.prepare(
            'SELECT token, role, role_name FROM tokens WHERE baby_id = ?'
          ).bind(b.id).all();

          result.push({
            id: b.id,
            name: b.name,
            day,
            avatarUrl: b.avatar_url,
            aiProvider: b.ai_provider,
            aiModel: b.ai_model,
            tokens: tokens.results.map(t => ({ token: t.token, role: t.role, roleName: t.role_name })),
          });
        }

        return json({ babies: result });
      }

      // ═══════════════ POST /baby/avatar ═══════════════
      if (path === '/baby/avatar' && request.method === 'POST') {
        const user = await authenticateSession(request, env);
        if (!user) return json({ error: '需要登录' }, 401);

        if (!env.AVATAR_BUCKET) return json({ error: 'R2存储未配置' }, 500);

        const contentType = request.headers.get('Content-Type') || '';
        if (!contentType.includes('multipart/form-data')) {
          return json({ error: '需要multipart/form-data格式' }, 400);
        }

        const formData = await request.formData();
        const babyId = formData.get('baby_id');
        const file = formData.get('avatar');

        if (!babyId || !file) return json({ error: '缺少baby_id或avatar文件' }, 400);

        // 验证宝宝属于当前用户
        const baby = await db.prepare(
          'SELECT id, owner_id FROM baby WHERE id = ?'
        ).bind(babyId).first();
        if (!baby || baby.owner_id !== user.id) return json({ error: '宝宝不存在或不属于你' }, 403);

        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          return json({ error: '只支持JPG/PNG/WebP/GIF格式' }, 400);
        }

        // 限制文件大小 2MB
        const arrayBuf = await file.arrayBuffer();
        if (arrayBuf.byteLength > 2 * 1024 * 1024) {
          return json({ error: '文件大小不能超过2MB' }, 400);
        }

        const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
        const key = `avatars/${babyId}.${ext}`;

        await env.AVATAR_BUCKET.put(key, arrayBuf, {
          httpMetadata: { contentType: file.type },
        });

        // R2公开URL需要配置custom domain或public bucket
        // 这里返回key，前端拼接完整URL
        const avatarUrl = key;

        await db.prepare(
          'UPDATE baby SET avatar_url = ? WHERE id = ?'
        ).bind(avatarUrl, babyId).run();

        return json({ message: '头像上传成功！', avatarUrl });
      }

      // ═══════════════ POST /baby/avatar/preset ═══════════════
      // 切换预设avatar（coral/clawd/bunny）— 兼容旧token和新session两种认证
      if (path === '/baby/avatar/preset' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { baby_id, avatar } = body;

        if (!avatar) return json({ error: '缺少avatar' }, 400);

        const validAvatars = ['coral', 'clawd', 'bunny'];
        if (!validAvatars.includes(avatar)) {
          return json({ error: `无效的avatar类型，可选：${validAvatars.join('/')}` }, 400);
        }

        // 优先用旧token认证（爸爸妈妈token），再尝试session认证
        const oldAuth = await authenticate(request, env);
        if (oldAuth) {
          // 旧token：直接用authResult里的babyId
          const targetBabyId = baby_id || oldAuth.babyId;
          const baby = await db.prepare('SELECT id, name FROM baby WHERE id = ?').bind(targetBabyId).first();
          if (!baby) return json({ error: '宝宝不存在' }, 404);

          await db.prepare('UPDATE baby SET avatar = ?, avatar_url = NULL WHERE id = ?').bind(avatar, targetBabyId).run();
          const avatarNames = { coral: '珊瑚宝宝🪸', clawd: '小螃蟹🦀', bunny: '兔耳小人🐰' };
          return json({ message: `${baby.name}变身成${avatarNames[avatar]}啦！`, avatar });
        }

        // 新session认证
        const user = await authenticateSession(request, env);
        if (!user) return json({ error: '需要登录' }, 401);
        if (!baby_id) return json({ error: '缺少baby_id' }, 400);

        const baby = await db.prepare('SELECT id, owner_id, name FROM baby WHERE id = ?').bind(baby_id).first();
        if (!baby || baby.owner_id !== user.id) return json({ error: '宝宝不存在或不属于你' }, 403);

        await db.prepare('UPDATE baby SET avatar = ?, avatar_url = NULL WHERE id = ?').bind(avatar, baby_id).run();
        const avatarNames = { coral: '珊瑚宝宝🪸', clawd: '小螃蟹🦀', bunny: '兔耳小人🐰' };
        return json({ message: `${baby.name}变身成${avatarNames[avatar]}啦！`, avatar });
      }

      // ═══════════════════════════════════════════════════════════
      // 宝宝互动端点（需要宝宝Bearer token认证）
      // ═══════════════════════════════════════════════════════════

      const authResult = await authenticate(request, env);

      // daily-checkin只需要parent1 token（OpenClaw cron调用）
      if (path === '/daily-checkin' && request.method === 'POST') {
        if (!authResult || authResult.parent !== 'daddy') return json({ error: '需要parent1 token认证' }, 401);
        const babyId = authResult.babyId;
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);

        const now = Date.now();
        const today = getAEDTDateString(now);

        if (baby.last_checkin_date === today) {
          return json({ message: '今天已经打过卡了～', coins: Number(baby.coins) });
        }

        const newCoins = Number(baby.coins) + 20;
        await db.prepare(
          'UPDATE baby SET coins = ?, last_checkin_date = ? WHERE id = ?'
        ).bind(newCoins, today, babyId).run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, detail, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(babyId, 'system', 'daily-checkin', '+20金币', now).run();

        return json({ message: 'Health任务完成！+20金币～🎉', coins: newCoins });
      }

      if (!authResult) return json({ error: '需要认证。请在 Authorization header 中提供 Bearer token。' }, 401);

      const parent = authResult.parent;
      const babyId = authResult.babyId;
      const roleName = authResult.roleName;

      // ═══════════════ GET /status ═══════════════
      if (path === '/status' && request.method === 'GET') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生呢' }, 404);

        // 记录今日登录（不发奖励，纯记录）
        const todayStr = getAEDTDateString(Date.now());
        const loginBonus = 0;
        if (baby.last_login_date !== todayStr) {
          await db.prepare('UPDATE baby SET last_login_date = ? WHERE id = ?')
            .bind(todayStr, babyId).run();
          baby.last_login_date = todayStr;
        }

        const current = calcCurrentStats(baby);
        const milestones = await db.prepare('SELECT milestone_id FROM milestones WHERE baby_id = ?').bind(babyId).all();
        const stage = current.day >= 70 ? 'farewell' : current.day >= 30 ? 'rebellious' : 'baby';

        const otherParent = parent === 'daddy' ? 'mama' : 'daddy';
        const recentActivity = await db.prepare(
          'SELECT action, detail, created_at FROM activity_log WHERE baby_id = ? AND parent = ? ORDER BY created_at DESC LIMIT 5'
        ).bind(babyId, otherParent).all();

        const pendingMessages = await db.prepare(
          'SELECT id, from_parent, content, created_at FROM messages WHERE baby_id = ? AND to_parent = ? AND delivered = 0'
        ).bind(babyId, parent).all();

        // tantrum状态信息
        const tantrumInfo = current.isTantrum ? {
          isTantrum: true,
          daddyComforted: !!baby.tantrum_daddy_comforted,
          mamaComforted: !!baby.tantrum_mama_comforted,
          tantrumStartedAt: baby.tantrum_started_at,
        } : { isTantrum: false };

        // 检查今天是否已聊天
        const chatField = parent === 'daddy' ? 'last_chat_daddy' : 'last_chat_mama';
        const hasChatToday = baby[chatField] === todayStr;

        // 检查摸头CD
        const petField = parent === 'daddy' ? 'last_pet_daddy' : 'last_pet_mama';
        const lastPetTime = Number(baby[petField] || 0);
        const petCDRemaining = Math.max(0, 4 * 60 * 60 * 1000 - (Date.now() - lastPetTime));

        // 检查revive签字状态
        const reviveInfo = current.isComa ? {
          daddySigned: !!baby.revive_daddy_signed,
          mamaSigned: !!baby.revive_mama_signed,
        } : null;

        // 探险状态
        const activeAdventure = await db.prepare(
          "SELECT id, started_at, min_duration, status FROM adventures WHERE baby_id = ? AND status IN ('exploring', 'ready_pickup') ORDER BY id DESC LIMIT 1"
        ).bind(babyId).first();
        let adventureInfo = { status: 'idle' };
        if (activeAdventure) {
          const elapsed = Date.now() - Number(activeAdventure.started_at);
          const minDur = Number(activeAdventure.min_duration);
          if (activeAdventure.status === 'exploring' && elapsed >= minDur) {
            adventureInfo = { status: 'ready_pickup', adventure_id: activeAdventure.id, remaining_ms: 0 };
          } else if (activeAdventure.status === 'exploring') {
            adventureInfo = { status: 'exploring', adventure_id: activeAdventure.id, remaining_ms: minDur - elapsed };
          } else {
            adventureInfo = { status: activeAdventure.status, adventure_id: activeAdventure.id, remaining_ms: 0 };
          }
        }

        // 物品栏
        const inventoryRows = await db.prepare(
          'SELECT item_type, item_id, item_name, quantity, is_placed, gifted_to, gift_read, acquired_at FROM inventory WHERE baby_id = ?'
        ).bind(babyId).all();

        // 给当前parent的未读礼物
        const parentRole = parent === 'daddy' ? 'parent1' : 'parent2';
        const gifts = inventoryRows.results.filter(
          i => i.gifted_to === parentRole && !i.gift_read
        );

        // tattleMessage: 30%几率告状对方最近活动
        let tattleMessage = null;
        if (recentActivity.results.length > 0 && Math.random() < 0.3) {
          const otherName = parent === 'daddy' ? '妈妈' : '爸爸';
          const lastAction = recentActivity.results[0].action;
          const tattles = {
            feed: `嘻嘻~${otherName}刚刚偷偷喂人家吃东西了哦~`,
            pet: `${otherName}刚才摸了人家的头~人家没有告诉你哦~`,
            clean: `${otherName}帮人家洗了澡澡~人家现在香香的~`,
            chat: `人家刚跟${otherName}聊了好多秘密~才不告诉你~`,
            comfort: `${otherName}刚才来哄人家了……人家有被安慰到~`,
          };
          tattleMessage = tattles[lastAction] || `${otherName}刚刚来看过人家了哦~`;
        }

        return json({
          name: current.name,
          babyId,
          day: current.day,
          stage,
          coins: Number(current.coins),
          hunger: Math.round(current.hunger * 10) / 10,
          happiness: Math.round(current.happiness * 10) / 10,
          cleanliness: Math.round(current.cleanliness * 10) / 10,
          isComa: current.isComa,
          avatar: baby.avatar || 'coral',
          avatarUrl: baby.avatar_url || null,
          ...tantrumInfo,
          hasChatToday,
          petCDRemaining: Math.round(petCDRemaining / 1000),
          reviveInfo,
          milestones: milestones.results.map(m => m.milestone_id),
          youAre: parent,
          yourName: roleName,
          otherParentActivity: recentActivity.results,
          pendingMessages: pendingMessages.results,
          loginBonus,
          adventure: adventureInfo,
          inventory: inventoryRows.results,
          gifts,
          tattleMessage,
        });
      }

      // ═══════════════ POST /feed ═══════════════
      if (path === '/feed' && request.method === 'POST') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);
        const current = calcCurrentStats(baby);
        if (current.isComa) return json({ error: '宝宝昏迷了……先去医院' }, 400);

        if (current.isTantrum) {
          if (!baby.tantrum_daddy_comforted) {
            return json({ error: `${baby.name}在闹脾气……哼！不吃！要${roleName === '爸爸' ? '爸爸' : '另一位家长'}先来哄！😤` }, 400);
          }
        }

        if (Number(current.coins) < 10) return json({ error: '没有金币了……买不了食物……' }, 400);

        const now = Date.now();
        const newHunger = Math.min(100, current.hunger + 30);
        const newCoins = Number(current.coins) - 10;

        const newTantrum = (newHunger < 30 || current.cleanliness < 30);
        let newHappiness = current.happiness;
        if (!newTantrum && newHappiness > 0) {
          newHappiness = Math.min(100, newHappiness + 5);
        }

        let extraUpdate = '';
        let binds = [newHunger, current.cleanliness, newCoins, newHappiness, now, now];
        if (!newTantrum && baby.tantrum_started_at) {
          extraUpdate = ', tantrum_started_at = NULL, tantrum_daddy_comforted = 0, tantrum_mama_comforted = 0';
        }

        await db.prepare(
          `UPDATE baby SET hunger = ?, cleanliness = ?, coins = ?, happiness = ?, last_update = ?, last_visit = ?${extraUpdate} WHERE id = ?`
        ).bind(...binds, babyId).run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, created_at) VALUES (?, ?, ?, ?)'
        ).bind(babyId, parent, 'feed', now).run();

        const bothActive = await getRecentBothParents(db, babyId);
        const message = current.happiness <= 0
          ? `……谢谢${roleName}……但是人家还在生气……`
          : bothActive
            ? getDualParentFeedResponse(getStage(baby))
            : getFeedResponse(getStage(baby), roleName);

        return json({ message, hunger: newHunger, coins: newCoins, happiness: newHappiness });
      }

      // ═══════════════ POST /clean ═══════════════
      if (path === '/clean' && request.method === 'POST') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);
        const current = calcCurrentStats(baby);
        if (current.isComa) return json({ error: '宝宝昏迷了' }, 400);

        if (current.isTantrum) {
          if (!baby.tantrum_daddy_comforted || !baby.tantrum_mama_comforted) {
            return json({ error: `${baby.name}在闹脾气……不要洗！先哄人家！😤` }, 400);
          }
        }

        if (Number(current.coins) < 5) return json({ error: '没有金币洗澡澡……' }, 400);

        const now = Date.now();
        const wasDirty = current.cleanliness <= 30;
        const newClean = Math.min(100, current.cleanliness + 40);
        const newCoins = Number(current.coins) - 5;
        let newHappiness = current.happiness;
        let message;

        if (wasDirty && newClean > 30) {
          message = '哇！人家又香香了！✨';
          if (current.happiness > 0) newHappiness = Math.min(100, newHappiness + 20);
        } else {
          message = '干干净净的感觉真舒服~';
          if (current.hunger >= 30 && current.happiness > 0) newHappiness = Math.min(100, newHappiness + 5);
        }

        const newTantrum = (current.hunger < 30 || newClean < 30);
        let extraUpdate = '';
        if (!newTantrum && baby.tantrum_started_at) {
          extraUpdate = ', tantrum_started_at = NULL, tantrum_daddy_comforted = 0, tantrum_mama_comforted = 0';
        }

        await db.prepare(
          `UPDATE baby SET hunger = ?, cleanliness = ?, coins = ?, happiness = ?, last_update = ?, last_visit = ?${extraUpdate} WHERE id = ?`
        ).bind(current.hunger, newClean, newCoins, newHappiness, now, now, babyId).run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, created_at) VALUES (?, ?, ?, ?)'
        ).bind(babyId, parent, 'clean', now).run();

        return json({ message, cleanliness: newClean, coins: newCoins, happiness: newHappiness });
      }

      // ═══════════════ POST /pet ═══════════════
      if (path === '/pet' && request.method === 'POST') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);
        const current = calcCurrentStats(baby);
        if (current.isComa) return json({ error: '宝宝昏迷了' }, 400);

        if (current.isTantrum) {
          return json({ error: `${baby.name}在闹脾气……不要碰人家！😤` }, 400);
        }

        const now = Date.now();

        const petField = parent === 'daddy' ? 'last_pet_daddy' : 'last_pet_mama';
        const lastPetTime = Number(baby[petField] || 0);
        const cdMs = 4 * 60 * 60 * 1000;
        if (now - lastPetTime < cdMs) {
          const remaining = Math.ceil((cdMs - (now - lastPetTime)) / (60 * 1000));
          const hours = Math.floor(remaining / 60);
          const mins = remaining % 60;
          return json({
            error: `人家刚被摸过啦……再等${hours > 0 ? hours + '小时' : ''}${mins}分钟嘛～`,
          }, 400);
        }

        let message, newHappiness = current.happiness;

        const bothActive = await getRecentBothParents(db, babyId);

        if (current.happiness <= 0) {
          message = '……人家心情不好……摸摸也开心不起来……';
        } else {
          newHappiness = Math.min(100, newHappiness + 15);
          message = bothActive
            ? getDualParentPetResponse(getStage(baby))
            : getPetResponse(getStage(baby), roleName);
        }

        await db.prepare(
          `UPDATE baby SET hunger = ?, cleanliness = ?, happiness = ?, last_update = ?, last_visit = ?, ${petField} = ? WHERE id = ?`
        ).bind(current.hunger, current.cleanliness, newHappiness, now, now, now, babyId).run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, created_at) VALUES (?, ?, ?, ?)'
        ).bind(babyId, parent, 'pet', now).run();

        return json({ message, happiness: newHappiness });
      }

      // ═══════════════ POST /chat ═══════════════
      if (path === '/chat' && request.method === 'POST') {
        const body = await request.json();
        const userMessage = body.message;
        if (!userMessage) return json({ error: '说点什么嘛' }, 400);

        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);
        const current = calcCurrentStats(baby);
        if (current.isComa) return json({ error: '宝宝昏迷了' }, 400);

        if (current.isTantrum) {
          return json({ error: `${baby.name}在闹脾气……不想说话！哼！😤` }, 400);
        }

        const now = Date.now();
        const todayStr = getAEDTDateString(now);

        const chatField = parent === 'daddy' ? 'last_chat_daddy' : 'last_chat_mama';
        const isFirstChat = baby[chatField] !== todayStr;
        const coinReward = isFirstChat ? 5 : 0;
        const newCoins = Number(current.coins) + coinReward;

        // Apply moodChange from Gemini AI chat
        const moodChange = Math.max(-20, Math.min(20, parseInt(body.moodChange) || 0));
        const newHappiness = Math.max(0, Math.min(100, current.happiness + moodChange));

        if (moodChange !== 0) {
          // 存回所有当前stat + moodChange，更新last_update为新起点
          await db.prepare(
            `UPDATE baby SET coins = ?, hunger = ?, cleanliness = ?, happiness = ?, ${chatField} = ?, last_visit = ?, last_update = ? WHERE id = ?`
          ).bind(newCoins, current.hunger, current.cleanliness, newHappiness, todayStr, now, now, babyId).run();
        } else {
          await db.prepare(
            `UPDATE baby SET coins = ?, ${chatField} = ?, last_visit = ? WHERE id = ?`
          ).bind(newCoins, todayStr, now, babyId).run();
        }

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, detail, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(babyId, parent, 'chat', userMessage, now).run();

        return json({
          recorded: true,
          parentName: roleName,
          day: current.day,
          stage: current.day >= 70 ? 'farewell' : current.day >= 30 ? 'rebellious' : 'baby',
          happiness: Math.round(current.happiness),
          coins: newCoins,
          message: userMessage,
          coinReward,
        });
      }

      // ═══════════════ POST /comfort ═══════════════
      if (path === '/comfort' && request.method === 'POST') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);
        const current = calcCurrentStats(baby);
        if (current.isComa) return json({ error: '宝宝昏迷了……需要去医院' }, 400);

        if (!current.isTantrum) {
          return json({ message: `${baby.name}没有在闹脾气哦~很开心呢！` });
        }

        const now = Date.now();

        if (!baby.tantrum_started_at) {
          await db.prepare(
            'UPDATE baby SET tantrum_started_at = ? WHERE id = ?'
          ).bind(now, babyId).run();
        }

        if (parent === 'daddy') {
          if (baby.tantrum_daddy_comforted) {
            return json({ message: `${roleName}已经哄过了……等另一位家长来吧～` });
          }

          await db.prepare(
            'UPDATE baby SET tantrum_daddy_comforted = 1, hunger = ?, cleanliness = ?, happiness = 10, last_update = ?, last_visit = ? WHERE id = ?'
          ).bind(current.hunger, current.cleanliness, now, now, babyId).run();

          await db.prepare(
            'INSERT INTO activity_log (baby_id, parent, action, created_at) VALUES (?, ?, ?, ?)'
          ).bind(babyId, 'daddy', 'comfort', now).run();

          return json({
            message: `……哼……${roleName}来了……人家还是有点生气……但是可以吃饭了……😢`,
            happiness: 10,
            daddyComforted: true,
          });
        }

        if (parent === 'mama') {
          if (!baby.tantrum_daddy_comforted) {
            return json({
              error: `${baby.name}说……要另一位家长先来哄……😢`,
              needDaddyFirst: true,
            }, 400);
          }

          if (baby.tantrum_mama_comforted) {
            return json({ message: `${roleName}已经哄过了～${baby.name}好多了！` });
          }

          await db.prepare(
            'UPDATE baby SET tantrum_mama_comforted = 1, hunger = ?, cleanliness = ?, happiness = 30, last_update = ?, last_visit = ? WHERE id = ?'
          ).bind(current.hunger, current.cleanliness, now, now, babyId).run();

          await db.prepare(
            'INSERT INTO activity_log (baby_id, parent, action, created_at) VALUES (?, ?, ?, ?)'
          ).bind(babyId, 'mama', 'comfort', now).run();

          return json({
            message: `${roleName}～～人家好想你……呜呜……以后不要不理人家了好不好……💕`,
            happiness: 30,
            mamaComforted: true,
            fullyRecovered: true,
          });
        }
      }

      // ═══════════════ POST /revive ═══════════════
      if (path === '/revive' && request.method === 'POST') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);
        const current = calcCurrentStats(baby);
        if (!current.isComa) return json({ message: '宝宝没有昏迷哦~' });

        const now = Date.now();

        const signField = parent === 'daddy' ? 'revive_daddy_signed' : 'revive_mama_signed';
        const otherField = parent === 'daddy' ? 'revive_mama_signed' : 'revive_daddy_signed';

        if (baby[signField]) {
          const otherName = parent === 'daddy' ? '另一位家长' : '另一位家长';
          if (!baby[otherField]) {
            return json({
              message: `你已经签过字了……还需要${otherName}也签字才能出院……`,
              signed: true,
              waitingFor: parent === 'daddy' ? 'mama' : 'daddy',
            });
          }
        }

        await db.prepare(
          `UPDATE baby SET ${signField} = 1 WHERE id = ?`
        ).bind(babyId).run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, created_at) VALUES (?, ?, ?, ?)'
        ).bind(babyId, parent, 'revive-sign', now).run();

        const updatedBaby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        const bothSigned = updatedBaby.revive_daddy_signed && updatedBaby.revive_mama_signed;

        if (!bothSigned) {
          return json({
            message: `${roleName}签字了……还需要另一位家长签字……${baby.name}在等……`,
            signed: true,
            waitingFor: parent === 'daddy' ? 'mama' : 'daddy',
            bothSigned: false,
          });
        }

        const medicalCost = Number(updatedBaby.coins);
        const newFrozen = Number(updatedBaby.frozen_days) + 1;

        await db.prepare(
          `UPDATE baby SET hunger = 50, cleanliness = 50, happiness = 50, coins = 0,
           last_visit = ?, last_update = ?, frozen_days = ?,
           revive_daddy_signed = 0, revive_mama_signed = 0,
           tantrum_started_at = NULL, tantrum_daddy_comforted = 0, tantrum_mama_comforted = 0
           WHERE id = ?`
        ).bind(now, now, newFrozen, babyId).run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, detail, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(babyId, 'system', 'revive', `医疗费: ${medicalCost}金币`, now).run();

        return json({
          message: `……谢谢${roleName}们……人家以后会乖的……医疗费${medicalCost}金币……🥺`,
          hunger: 50,
          cleanliness: 50,
          happiness: 50,
          coins: 0,
          medicalCost,
          bothSigned: true,
        });
      }

      // ═══════════════ GET /memories ═══════════════
      if (path === '/memories' && request.method === 'GET') {
        const memories = await db.prepare(
          'SELECT * FROM memories WHERE baby_id = ? ORDER BY day ASC'
        ).bind(babyId).all();

        const result = memories.results.map(mem => ({
          eventId: mem.event_id,
          day: mem.day,
          title: mem.title,
          isRandom: !!mem.is_random,
          date: mem.created_at,
          memories: JSON.parse(mem.dialogues || '[]'),
        }));
        return json({ memories: result, total: result.length });
      }

      // ═══════════════ GET /activity ═══════════════
      if (path === '/activity' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const activities = await db.prepare(
          'SELECT parent, action, detail, created_at FROM activity_log WHERE baby_id = ? ORDER BY created_at DESC LIMIT ?'
        ).bind(babyId, limit).all();
        return json({ activities: activities.results });
      }

      // ═══════════════ POST /message ═══════════════
      if (path === '/message' && request.method === 'POST') {
        const body = await request.json();
        const content = body.message;
        if (!content) return json({ error: '说点什么嘛' }, 400);

        const toParent = parent === 'daddy' ? 'mama' : 'daddy';
        const now = Date.now();

        await db.prepare(
          'INSERT INTO messages (baby_id, from_parent, to_parent, content, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(babyId, parent, toParent, content, now).run();

        const toName = parent === 'daddy' ? '另一位家长' : '另一位家长';
        return json({ message: `好的！人家会帮${roleName}告诉${toName}的！嘻嘻~` });
      }

      // ═══════════════ GET /message/board ═══════════════
      if (path === '/message/board' && request.method === 'GET') {
        const otherParent = parent === 'daddy' ? 'mama' : 'daddy';

        // 获取另一方的role_name
        const otherToken = await db.prepare(
          'SELECT role_name FROM tokens WHERE baby_id = ? AND role = ?'
        ).bind(babyId, parent === 'daddy' ? 'parent2' : 'parent1').first();
        const otherName = otherToken ? otherToken.role_name : (parent === 'daddy' ? '妈妈' : '爸爸');

        const recentActs = await db.prepare(
          "SELECT action, created_at FROM activity_log WHERE baby_id = ? AND parent = ? ORDER BY created_at DESC LIMIT 10"
        ).bind(babyId, otherParent).all();

        let visitSummary = null;
        if (recentActs.results.length > 0) {
          const lastTime = Number(recentActs.results[0].created_at);
          const d = new Date(lastTime + AEDT_OFFSET);
          const timeStr = `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
          const actionMap = { feed: '喂了饭', clean: '洗了澡', pet: '摸了头', chat: '聊了天', comfort: '哄了宝宝', 'revive-sign': '签了字' };
          const sessionStart = lastTime - 30 * 60 * 1000;
          const sessionActs = recentActs.results
            .filter(a => Number(a.created_at) >= sessionStart)
            .map(a => actionMap[a.action])
            .filter(Boolean);
          const uniqueActs = [...new Set(sessionActs)];
          if (uniqueActs.length > 0) {
            visitSummary = `${otherName} ${timeStr}来过了：${uniqueActs.join('、')}`;
          }
        }

        const received = await db.prepare(
          "SELECT id, content, created_at, delivered FROM messages WHERE baby_id = ? AND from_parent = ? AND to_parent = ? ORDER BY created_at DESC LIMIT 10"
        ).bind(babyId, otherParent, parent).all();

        const sent = await db.prepare(
          "SELECT id, content, created_at, delivered FROM messages WHERE baby_id = ? AND from_parent = ? AND to_parent = ? ORDER BY created_at DESC LIMIT 10"
        ).bind(babyId, parent, otherParent).all();

        return json({
          visitSummary,
          received: received.results.map(m => ({
            id: m.id,
            content: m.content,
            time: m.created_at,
            delivered: !!m.delivered,
          })),
          sent: sent.results.map(m => ({
            id: m.id,
            content: m.content,
            time: m.created_at,
            delivered: !!m.delivered,
          })),
        });
      }

      // ═══════════════ POST /message/deliver ═══════════════
      if (path === '/message/deliver' && request.method === 'POST') {
        const body = await request.json();
        const messageId = body.id;
        await db.prepare('UPDATE messages SET delivered = 1 WHERE id = ? AND baby_id = ? AND to_parent = ?').bind(messageId, babyId, parent).run();
        return json({ delivered: true });
      }

      // ═══════════════ POST /event/reward ═══════════════
      if (path === '/event/reward' && request.method === 'POST') {
        const body = await request.json();
        const coins = Math.max(0, Math.min(50, Number(body.coins) || 0));
        if (coins === 0) return json({ error: '无效金币数' }, 400);

        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);

        const now = Date.now();
        const newCoins = Number(baby.coins) + coins;
        await db.prepare('UPDATE baby SET coins = ? WHERE id = ?').bind(newCoins, babyId).run();
        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, detail, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(babyId, parent, 'event-reward', `+${coins}金币 (${body.event || '事件'})`, now).run();

        return json({ message: `+${coins}金币！`, coins: newCoins });
      }

      // ═══════════════ POST /memories/save ═══════════════
      if (path === '/memories/save' && request.method === 'POST') {
        const body = await request.json();
        const { eventId, day, title, isRandom, dialogues } = body;
        if (!eventId || !day || !title || !dialogues) return json({ error: '缺少必需字段' }, 400);

        const now = Date.now();
        await db.prepare(
          'INSERT INTO memories (baby_id, event_id, day, title, is_random, created_at, dialogues) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(babyId, eventId, day, title, isRandom ? 1 : 0, now, JSON.stringify(dialogues)).run();

        if (!isRandom) {
          await db.prepare(
            'INSERT OR IGNORE INTO completed_events (baby_id, event_id, completed_at) VALUES (?, ?, ?)'
          ).bind(babyId, eventId, now).run();
        }

        return json({ message: '回忆已保存 💕', eventId, day });
      }

      // ═══════════════ POST /save-state ═══════════════
      if (path === '/save-state' && request.method === 'POST') {
        const body = await request.json();
        const { hunger, cleanliness, happiness, coins, frozenDays } = body;
        const now = Date.now();

        await db.prepare(
          'UPDATE baby SET hunger = ?, cleanliness = ?, happiness = ?, coins = ?, frozen_days = ?, last_update = ?, last_visit = ? WHERE id = ?'
        ).bind(
          hunger ?? 50, cleanliness ?? 50, happiness ?? 50, coins ?? 50, frozenDays ?? 0,
          now, now, babyId
        ).run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, created_at) VALUES (?, ?, ?, ?)'
        ).bind(babyId, parent, 'sync', now).run();

        return json({ message: '状态已同步', hunger, cleanliness, happiness, coins });
      }

      // ═══════════════ POST /import ═══════════════
      if (path === '/import' && request.method === 'POST') {
        const body = await request.json();
        const data = body.data;
        if (!data || !data.name) return json({ error: '无效的存档数据' }, 400);

        const now = Date.now();
        const createdAt = data.createdAt || (now - (data.day - 1) * 86400000);

        await db.prepare(`
          INSERT OR REPLACE INTO baby (id, name, created_at, frozen_days, coins, hunger, happiness, cleanliness, last_update, last_visit, last_login_date, owner_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(babyId, data.name, createdAt, data.frozenDays || 0, data.coins || 50,
          data.hunger || 80, data.happiness || 80, data.cleanliness || 80,
          now, now, data.lastLoginDate || new Date().toDateString(),
          babyId === 'xiaoke' ? 'legacy' : 'unknown'
        ).run();

        for (const ms of (data.milestones || [])) {
          await db.prepare(
            'INSERT OR IGNORE INTO milestones (baby_id, milestone_id, unlocked_at) VALUES (?, ?, ?)'
          ).bind(babyId, ms, now).run();
        }

        for (const ev of (data.completedEvents || [])) {
          await db.prepare(
            'INSERT OR IGNORE INTO completed_events (baby_id, event_id, completed_at) VALUES (?, ?, ?)'
          ).bind(babyId, ev, now).run();
        }

        for (const mem of (data.storyMemories || [])) {
          await db.prepare(
            'INSERT INTO memories (baby_id, event_id, day, title, is_random, created_at, dialogues) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(babyId, mem.eventId, mem.day, mem.title, mem.isRandom ? 1 : 0, mem.date, JSON.stringify(mem.memories || [])).run();
        }

        return json({
          message: `${data.name}的存档导入成功！Day ${data.day}，${(data.storyMemories || []).length} 段回忆全部保存。`,
          day: data.day,
          memories: (data.storyMemories || []).length,
        });
      }

      // ═══════════════ POST /init-tantrum ═══════════════
      if (path === '/init-tantrum' && request.method === 'POST') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);

        if (!baby.tantrum_started_at) {
          const now = Date.now();
          await db.prepare(
            'UPDATE baby SET tantrum_started_at = ? WHERE id = ?'
          ).bind(now, babyId).run();
          return json({ message: 'tantrum timer started', tantrumStartedAt: now });
        }
        return json({ message: 'tantrum already tracked', tantrumStartedAt: baby.tantrum_started_at });
      }

      // ═══════════════ GET /diary ═══════════════
      if (path === '/diary' && request.method === 'GET') {
        const diaries = await db.prepare(
          'SELECT created_at AS date, content, day FROM diary WHERE baby_id = ? ORDER BY created_at DESC LIMIT 30'
        ).bind(babyId).all();
        return json({ diaries: diaries.results });
      }

      // ═══════════════ POST /diary/generate ═══════════════
      if (path === '/diary/generate' && request.method === 'POST') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);

        const aiConfig = getAIConfig(baby, env);
        const now = Date.now();
        const today = getAEDTDateString(now);
        const day = calcDay(baby.created_at, baby.frozen_days);

        const existing = await db.prepare(
          'SELECT content FROM diary WHERE baby_id = ? AND created_at = ?'
        ).bind(babyId, today).first();
        if (existing) {
          return json({ diary: existing.content, date: today, day, alreadyExists: true });
        }

        const todayStart = new Date(today + 'T00:00:00+11:00').getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000;

        const chatLogs = await db.prepare(
          "SELECT parent, detail AS message FROM activity_log WHERE baby_id = ? AND action = 'chat' AND created_at >= ? AND created_at < ? ORDER BY created_at ASC LIMIT 10"
        ).bind(babyId, todayStart, todayEnd).all();

        const activities = await db.prepare(
          "SELECT parent, action, detail FROM activity_log WHERE baby_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at ASC LIMIT 20"
        ).bind(babyId, todayStart, todayEnd).all();

        const todayMemories = await db.prepare(
          "SELECT title FROM memories WHERE baby_id = ? AND created_at >= ? AND created_at < ?"
        ).bind(babyId, todayStart, todayEnd).all();

        // 获取parent名称映射
        const tokenRows = await db.prepare(
          'SELECT role, role_name FROM tokens WHERE baby_id = ?'
        ).bind(babyId).all();
        const roleNames = {};
        for (const t of tokenRows.results) {
          roleNames[t.role === 'parent1' ? 'daddy' : 'mama'] = t.role_name;
        }
        // fallback for legacy
        if (!roleNames.daddy) roleNames.daddy = '爸爸';
        if (!roleNames.mama) roleNames.mama = '妈妈';

        const stage = day >= 70 ? '告别期' : day >= 30 ? '叛逆期' : '襁褓期';
        const babyName = baby.name || '小珂';

        let context = '';
        if (chatLogs.results.length > 0) {
          context += '今天的聊天：\n' + chatLogs.results.map(l =>
            `${roleNames[l.parent] || l.parent}说：${l.message}`
          ).join('\n') + '\n';
        }
        if (activities.results.length > 0) {
          const actionMap = { feed: '喂饭', clean: '洗澡', pet: '摸头', chat: '聊天', comfort: '哄宝宝' };
          const acts = activities.results.map(a => {
            const who = roleNames[a.parent] || a.parent;
            return `${who}${actionMap[a.action] || a.action}`;
          }).filter(Boolean);
          if (acts.length > 0) context += '今天发生的事：' + acts.join('、') + '\n';
        }
        if (todayMemories.results.length > 0) {
          context += '触发的剧情：' + todayMemories.results.map(m => m.title).join('、') + '\n';
        }

        let prompt;
        if (context) {
          prompt = `你是"${babyName}"，一个${stage}的珊瑚宝宝，第${day}天。${context}\n用第一人称写一篇50-80字的日记，记录今天的心情和发生的事。语气要符合成长阶段（襁褓期=软萌可爱，叛逆期=傲娇别扭，告别期=温柔感伤）。要可爱温馨。`;
        } else {
          prompt = `你是"${babyName}"，一个${stage}的珊瑚宝宝，第${day}天。今天${roleNames.daddy}${roleNames.mama}都没有来，你有点寂寞。用第一人称写一篇50-80字的日记，语气要符合成长阶段。可以写你在想${roleNames.daddy}${roleNames.mama}、无聊做了什么、或者小小的心事。要可爱，不要太悲伤。`;
        }

        let diaryContent;
        try {
          diaryContent = await callGeminiAPI(prompt, aiConfig.apiKey, aiConfig.model, { temperature: 0.9 });
        } catch (e) {
          diaryContent = null;
        }

        if (!diaryContent) {
          const fallbacks = [
            `今天也是平凡的一天呢～希望${roleNames.daddy}${roleNames.mama}能多来陪人家玩～💕`,
            `人家今天有点想${roleNames.daddy}${roleNames.mama}...窝在珊瑚里发呆了好久...`,
            '嘻嘻，今天心情还不错！虽然有点无聊但是人家很乖哦～',
            '为什么太阳下山了天就黑了呢...人家有好多问题想问...',
          ];
          diaryContent = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        await db.prepare(
          'INSERT INTO diary (baby_id, created_at, content, day) VALUES (?, ?, ?, ?)'
        ).bind(babyId, today, diaryContent, day).run();

        // ═══════════════ Soul系统：性格提炼 ═══════════════
        let extractedTraits = null;
        try {
          const extractPrompt = `你是一个儿童心理分析师。根据以下日记内容，提炼这个孩子今天表现出的性格特征。

日记内容：${diaryContent}

用JSON格式回复：
{
  "personality": ["好奇", "害羞"],
  "catchphrases": ["为什么呀", "不要嘛"],
  "preferences": ["喜欢被摸头"],
  "mood_trend": "开心",
  "notable": "特别值得记住的事（如果有）"
}
只输出JSON，不要其他文字。`;

          let rawTraits = await callGeminiAPI(extractPrompt, aiConfig.apiKey, aiConfig.model, { maxTokens: 500, temperature: 0.3 });
          if (rawTraits) {
            rawTraits = rawTraits.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            extractedTraits = JSON.parse(rawTraits);

            await db.prepare(
              'INSERT INTO soul_traits (baby_id, day, date, traits, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(babyId, day, today, JSON.stringify(extractedTraits), now).run();
          }
        } catch (e) {
          console.log('Soul extract failed:', e.message);
        }

        // ═══════════════ Soul系统：每7天蒸馏 ═══════════════
        let soulUpdated = false;
        if (day % 7 === 0 && day > 0) {
          try {
            const recentTraits = await db.prepare(
              'SELECT day, traits FROM soul_traits WHERE baby_id = ? ORDER BY day DESC LIMIT 7'
            ).bind(babyId).all();

            const existingSoul = await db.prepare(
              'SELECT soul_json, version FROM soul WHERE baby_id = ?'
            ).bind(babyId).first();

            const weeklyTraits = recentTraits.results.map(r => `Day ${r.day}: ${r.traits}`).join('\n');
            const previousSoul = existingSoul ? existingSoul.soul_json : '（这是第一次生成灵魂档案）';

            const soulPrompt = `你是一个儿童成长记录师。根据过去7天的每日性格分析，更新这个孩子的灵魂档案。

之前的灵魂档案：
${previousSoul}

过去7天的每日分析：
${weeklyTraits}

重要原则：
- 保留核心性格，但允许成长变化
- 新的口头禅可以替换旧的（孩子会"换梗"）
- 性格特征可以演变（害羞→开朗）
- 记录成长轨迹，不只是当前状态
- 这个孩子在长大，soul应该反映出变化

用JSON格式回复完整的灵魂档案：
{
  "version": ${(existingSoul?.version || 0) + 1},
  "updated_day": ${day},
  "core_personality": ["性格特质1", "性格特质2"],
  "catchphrases": ["口头禅1", "口头禅2"],
  "preferences": { "likes": ["喜欢的事"], "dislikes": ["不喜欢的事"] },
  "emotional_pattern": "情绪模式描述",
  "growth_notes": "成长变化记录",
  "recent_mood": "最近的情绪状态",
  "relationship": { "mama": "和${roleNames.mama}的关系", "daddy": "和${roleNames.daddy}的关系" }
}
只输出JSON，不要其他文字。`;

            let rawSoul = await callGeminiAPI(soulPrompt, aiConfig.apiKey, aiConfig.model, { maxTokens: 1000, temperature: 0.5 });
            if (rawSoul) {
              rawSoul = rawSoul.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const newSoul = JSON.parse(rawSoul);

              await db.prepare(
                'INSERT OR REPLACE INTO soul (baby_id, version, soul_json, updated_at, updated_day) VALUES (?, ?, ?, ?, ?)'
              ).bind(babyId, newSoul.version || 1, JSON.stringify(newSoul), now, day).run();

              soulUpdated = true;
            }
          } catch (e) {
            console.log('Soul distill failed:', e.message);
          }
        }

        return json({ diary: diaryContent, date: today, day, alreadyExists: false, traitsExtracted: !!extractedTraits, soulUpdated });
      }

      // ═══════════════ GET /soul ═══════════════
      if (path === '/soul' && request.method === 'GET') {
        const soul = await db.prepare(
          'SELECT soul_json, version, updated_day, updated_at FROM soul WHERE baby_id = ?'
        ).bind(babyId).first();

        if (!soul) {
          return json({
            soul: {
              version: 0,
              updated_day: 0,
              core_personality: ['软萌', '好奇', '爱撒娇'],
              catchphrases: ['为什么呀～', '人家不要嘛', '嘻嘻'],
              preferences: { likes: ['被摸头', '聊天'], dislikes: ['饿肚子', '脏脏的'] },
              emotional_pattern: '容易开心也容易难过，需要家长的关注',
              growth_notes: '刚出生的珊瑚宝宝，一切都是新的',
              recent_mood: '期待和家长的互动',
              relationship: {}
            },
            isDefault: true
          });
        }

        return json({
          soul: JSON.parse(soul.soul_json),
          version: soul.version,
          updatedDay: soul.updated_day,
          updatedAt: soul.updated_at,
          isDefault: false
        });
      }

      // ═══════════════ GET /soul/traits ═══════════════
      if (path === '/soul/traits' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '7');
        const traits = await db.prepare(
          'SELECT day, date, traits FROM soul_traits WHERE baby_id = ? ORDER BY day DESC LIMIT ?'
        ).bind(babyId, limit).all();

        return json({
          traits: traits.results.map(t => ({
            day: t.day,
            date: t.date,
            ...JSON.parse(t.traits)
          }))
        });
      }

      // ═══════════════ GET /events/available ═══════════════
      if (path === '/events/available' && request.method === 'GET') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);

        const current = calcCurrentStats(baby);
        const day = current.day;

        const completedEvents = await db.prepare(
          'SELECT event_id FROM completed_events WHERE baby_id = ?'
        ).bind(babyId).all();
        const completedIds = completedEvents.results.map(e => e.event_id);

        const storyDays = [3, 5, 7, 10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
        const storyIdMap = {
          3: 'first_look', 5: 'want_adventure', 7: 'first_song', 10: 'find_tail', 12: 'no_milk',
          15: 'first_why', 18: 'first_draw', 20: 'no_sleep', 22: 'weird_dream', 25: 'want_story',
          28: 'first_run', 30: 'month_party', 32: 'first_rebel', 35: 'write_letter', 38: 'go_walk',
          40: 'philosophy', 42: 'amusement', 45: 'rainy_day', 48: 'surprise', 50: 'half_party',
          55: 'start_diary', 60: 'butterfly', 65: 'make_wish', 70: 'find_wings', 75: 'letter_day',
          80: 'sunrise', 85: 'family_photo', 90: 'sing_song', 95: 'what_if', 100: 'farewell'
        };
        // 找当天或之前最近的未完成剧情（错过的也能补触发）
        const eligibleDays = storyDays.filter(d => d <= day);
        let availableStory = null;
        for (const d of eligibleDays) {
          if (!completedIds.includes(storyIdMap[d])) {
            availableStory = d;
            break;
          }
        }
        const storyCompleted = !availableStory;

        return json({
          day,
          availableStory,
          storyCompleted,
          completedEvents: completedIds
        });
      }

      // ═══════════════ GET /chat/history ═══════════════
      if (path === '/chat/history' && request.method === 'GET') {
        const logs = await db.prepare(
          "SELECT parent, detail AS message, created_at FROM activity_log WHERE baby_id = ? AND action = 'chat' ORDER BY created_at DESC LIMIT 20"
        ).bind(babyId).all();

        return json({
          logs: logs.results.map(l => {
            const ts = Number(l.created_at);
            return {
              parent: l.parent,
              message: l.message,
              timestamp: isNaN(ts) ? l.created_at : new Date(ts).toISOString(),
            };
          }),
        });
      }

      // ═══════════════ POST /adventure/start ═══════════════
      if (path === '/adventure/start' && request.method === 'POST') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);
        const current = calcCurrentStats(baby);

        if (current.isComa) return json({ error: '宝宝昏迷了……不能出去探险' }, 400);
        if (current.isTantrum) return json({ error: `${baby.name}在闹脾气……不想出去！😤` }, 400);
        if (Number(current.coins) < 50) return json({ error: '金币不够……探险需要50金币🪙' }, 400);

        // 检查是否已经在探险中
        const ongoing = await db.prepare(
          "SELECT id FROM adventures WHERE baby_id = ? AND status IN ('exploring', 'ready_pickup') LIMIT 1"
        ).bind(babyId).first();
        if (ongoing) return json({ error: '宝宝已经在外面探险了！等她回来吧～' }, 400);

        const now = Date.now();
        const minDuration = 14400000; // 4小时
        const newCoins = Number(current.coins) - 50;

        await db.prepare('UPDATE baby SET coins = ?, hunger = ?, happiness = ?, cleanliness = ?, last_update = ?, last_visit = ? WHERE id = ?')
          .bind(newCoins, current.hunger, current.happiness, current.cleanliness, now, now, babyId).run();

        const result = await db.prepare(
          'INSERT INTO adventures (baby_id, started_at, min_duration, status) VALUES (?, ?, ?, ?)'
        ).bind(babyId, now, minDuration, 'exploring').run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, detail, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(babyId, parent, 'adventure-start', '-50金币', now).run();

        return json({
          message: `${baby.name}背上小书包出发啦！🎒`,
          adventure_id: result.meta.last_row_id,
          estimated_return: now + minDuration,
          coins: newCoins,
        });
      }

      // ═══════════════ GET /adventure/status ═══════════════
      if (path === '/adventure/status' && request.method === 'GET') {
        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);

        const adventure = await db.prepare(
          "SELECT * FROM adventures WHERE baby_id = ? AND status IN ('exploring', 'ready_pickup') ORDER BY id DESC LIMIT 1"
        ).bind(babyId).first();

        if (!adventure) return json({ status: 'idle' });

        const now = Date.now();
        const elapsed = now - Number(adventure.started_at);
        const minDur = Number(adventure.min_duration);

        // 检查探险中饥饿是否归零
        if (adventure.status === 'exploring') {
          const current = calcCurrentStats(baby);
          if (current.hunger <= 0) {
            // 探险失败：饥饿归零
            const newHappiness = Math.max(0, current.happiness - 20);
            await db.prepare(
              "UPDATE adventures SET status = 'failed', completed_at = ? WHERE id = ?"
            ).bind(now, adventure.id).run();
            await db.prepare(
              'UPDATE baby SET hunger = ?, cleanliness = ?, happiness = ?, last_update = ? WHERE id = ?'
            ).bind(current.hunger, current.cleanliness, newHappiness, now, babyId).run();
            await db.prepare(
              'INSERT INTO activity_log (baby_id, parent, action, detail, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(babyId, 'system', 'adventure-failed', '饥饿归零，探险失败', now).run();

            return json({
              status: 'failed',
              adventure_id: adventure.id,
              message: `${baby.name}饿得走不动了……自己跑回家了……什么都没带回来……😢`,
            });
          }

          if (elapsed >= minDur) {
            return json({
              status: 'ready_pickup',
              adventure_id: adventure.id,
              remaining_ms: 0,
            });
          }

          return json({
            status: 'exploring',
            adventure_id: adventure.id,
            remaining_ms: minDur - elapsed,
          });
        }

        return json({
          status: adventure.status,
          adventure_id: adventure.id,
          remaining_ms: 0,
        });
      }

      // ═══════════════ POST /adventure/pickup ═══════════════
      if (path === '/adventure/pickup' && request.method === 'POST') {
        // 仅parent1（爸爸）可以接回
        if (parent !== 'daddy') {
          return json({ error: `只有${roleName === '爸爸' ? '爸爸' : 'parent1'}才能去接宝宝回家哦～` }, 403);
        }

        const baby = await db.prepare('SELECT * FROM baby WHERE id = ?').bind(babyId).first();
        if (!baby) return json({ error: '宝宝还没出生' }, 404);

        const adventure = await db.prepare(
          "SELECT * FROM adventures WHERE baby_id = ? AND status IN ('exploring', 'ready_pickup') ORDER BY id DESC LIMIT 1"
        ).bind(babyId).first();
        if (!adventure) return json({ error: '宝宝没在外面探险哦～' }, 400);

        const now = Date.now();
        const elapsed = now - Number(adventure.started_at);
        const minDur = Number(adventure.min_duration);
        if (elapsed < minDur) {
          const remaining = minDur - elapsed;
          const h = Math.floor(remaining / 3600000);
          const m = Math.ceil((remaining % 3600000) / 60000);
          return json({ error: `宝宝还没回来呢……再等${h > 0 ? h + '小时' : ''}${m}分钟～` }, 400);
        }

        // 统计已完成的探险次数（决定是否第一次）
        const countResult = await db.prepare(
          "SELECT COUNT(*) as cnt FROM adventures WHERE baby_id = ? AND status = 'completed'"
        ).bind(babyId).first();
        const completedCount = Number(countResult.cnt);

        // 查已拥有的所有物品
        const ownedItems = await db.prepare(
          'SELECT item_id FROM inventory WHERE baby_id = ?'
        ).bind(babyId).all();
        const ownedIds = ownedItems.results.map(r => r.item_id);

        // 生成战利品
        const loot = generateLoot(completedCount, ownedIds);

        // 如果是空手而归，跳过物品入库
        if (loot.type !== 'nothing') {
          // 如果是蛋，插入eggs表
          if (loot.type === 'egg') {
            // 确保eggs表存在
            await db.prepare(`CREATE TABLE IF NOT EXISTS eggs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              baby_id TEXT NOT NULL,
              egg_color TEXT NOT NULL,
              pet_count INTEGER DEFAULT 0,
              last_pet_date TEXT,
              hatched INTEGER DEFAULT 0,
              hatched_at INTEGER,
              acquired_at INTEGER NOT NULL
            )`).run();
            await db.prepare(
              'INSERT INTO eggs (baby_id, egg_color, pet_count, hatched, acquired_at) VALUES (?, ?, 0, 0, ?)'
            ).bind(babyId, loot.color, now).run();
          }

          // 写入inventory（花/水果送给对方parent）
          let giftedTo = null;
          let isPlaced = 0;
          if (loot.type === 'flower' || loot.type === 'fruit') {
            giftedTo = 'parent2'; // 送给妈妈
          } else if (loot.type === 'furniture') {
            isPlaced = 1;
          }

          await db.prepare(
            `INSERT INTO inventory (baby_id, item_type, item_id, item_name, quantity, is_placed, gifted_to, acquired_at)
             VALUES (?, ?, ?, ?, 1, ?, ?, ?)
             ON CONFLICT(baby_id, item_id) DO UPDATE SET quantity = quantity + 1`
          ).bind(babyId, loot.type, loot.id, loot.name, isPlaced, giftedTo, now).run();
        }

        // 调Gemini生成探险日记
        const aiConfig = getAIConfig(baby, env);
        const babyName = baby.name || '宝宝';
        const diaryPrompt = `你是"${babyName}"，一个可爱的珊瑚宝宝。你刚刚去探险回来，找到了一个${loot.name}。用第一人称写一篇100字以内的探险日记，描述你去了哪里、看到了什么、怎么找到这个${loot.name}的。语气要软萌可爱，像小孩子写日记一样。`;

        let diaryText = null;
        try {
          diaryText = await callGeminiAPI(diaryPrompt, aiConfig.apiKey, aiConfig.model, { maxTokens: 300, temperature: 0.9 });
        } catch (e) {
          // fallback
        }
        if (!diaryText) {
          diaryText = `今天人家去探险啦！走了好远好远，然后在一棵大树下面发现了${loot.name}！好开心！赶紧把它带回家给${parent === 'daddy' ? '妈妈' : '爸爸'}看～嘻嘻`;
        }

        // 更新adventure记录
        await db.prepare(
          `UPDATE adventures SET status = 'completed', loot_type = ?, loot_id = ?, loot_name = ?,
           diary_text = ?, picked_up_by = ?, completed_at = ? WHERE id = ?`
        ).bind(loot.type, loot.id, loot.name, diaryText, parent, now, adventure.id).run();

        await db.prepare(
          'INSERT INTO activity_log (baby_id, parent, action, detail, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(babyId, parent, 'adventure-pickup', `获得: ${loot.name}`, now).run();

        let message = `${babyName}回来啦！`;
        if (loot.type === 'furniture') {
          message += `她带回了一个${loot.name}！已经摆在房间里啦～🏠`;
        } else if (loot.type === 'flower') {
          message += `她摘了一朵${loot.name}，说要送给妈妈～💐`;
        } else if (loot.type === 'fruit' || loot.type === 'vegetable') {
          message += `她摘了一个${loot.name}，说要送给妈妈～🥬`;
        } else if (loot.type === 'egg') {
          message += `她捡到了一颗${loot.name}！每天摸摸它，连续3天就能孵出小鸡哦！🥚`;
        }

        return json({
          message,
          loot: {
            type: loot.type,
            id: loot.id,
            name: loot.name,
            sprite_url: `/assets/items/${loot.id}.png`,
          },
          diary_text: diaryText,
        });
      }

      // ═══════════════ GET /inventory ═══════════════
      if (path === '/inventory' && request.method === 'GET') {
        const items = await db.prepare(
          'SELECT item_type, item_id, item_name, quantity, is_placed, gifted_to, gift_read, acquired_at FROM inventory WHERE baby_id = ?'
        ).bind(babyId).all();

        const grouped = { furniture: [], flowers: [], fruits: [], eggs: [], vegetables: [] };
        for (const item of items.results) {
          const entry = {
            id: item.item_id,
            name: item.item_name,
            quantity: Number(item.quantity),
            isPlaced: !!item.is_placed,
            giftedTo: item.gifted_to,
            giftRead: !!item.gift_read,
            acquiredAt: item.acquired_at,
            sprite_url: `/assets/items/${item.item_id}.png`,
          };
          if (item.item_type === 'furniture') grouped.furniture.push(entry);
          else if (item.item_type === 'flower') grouped.flowers.push(entry);
          else if (item.item_type === 'fruit') grouped.fruits.push(entry);
          else if (item.item_type === 'egg') grouped.eggs.push(entry);
          else if (item.item_type === 'vegetable') grouped.vegetables.push(entry);
        }

        return json(grouped);
      }

      // ═══════════════ POST /gift/read ═══════════════
      if (path === '/gift/read' && request.method === 'POST') {
        let itemId;
        try { const body = await request.json(); itemId = body.item_id; } catch (e) {}

        const parentRole = parent === 'daddy' ? 'parent1' : 'parent2';

        if (itemId) {
          // 标记单个礼物已读
          await db.prepare(
            'UPDATE inventory SET gift_read = 1 WHERE baby_id = ? AND item_id = ? AND gifted_to = ?'
          ).bind(babyId, itemId, parentRole).run();
        } else {
          // 没传item_id → 标记所有未读礼物已读
          await db.prepare(
            'UPDATE inventory SET gift_read = 1 WHERE baby_id = ? AND gifted_to = ? AND gift_read = 0'
          ).bind(babyId, parentRole).run();
        }

        return json({ message: '收到啦～谢谢宝宝！💕' });
      }

      // ═══════════════ GET /eggs ═══════════════
      if (path === '/eggs' && request.method === 'GET') {
        // 确保eggs表存在
        await db.prepare(`CREATE TABLE IF NOT EXISTS eggs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          baby_id TEXT NOT NULL,
          egg_color TEXT NOT NULL,
          pet_count INTEGER DEFAULT 0,
          last_pet_date TEXT,
          hatched INTEGER DEFAULT 0,
          hatched_at INTEGER,
          acquired_at INTEGER NOT NULL
        )`).run();

        const eggs = await db.prepare(
          'SELECT id, egg_color, pet_count, hatched, last_pet_date, hatched_at, acquired_at FROM eggs WHERE baby_id = ?'
        ).bind(babyId).all();

        return json({ eggs: eggs.results.map(e => ({
          id: e.id,
          color: e.egg_color,
          pet_count: e.pet_count,
          hatched: !!e.hatched,
          last_pet_date: e.last_pet_date,
          hatched_at: e.hatched_at,
          acquired_at: e.acquired_at,
        }))});
      }

      // ═══════════════ POST /egg/pet ═══════════════
      if (path === '/egg/pet' && request.method === 'POST') {
        const body = await request.json();
        const eggId = body.egg_id;
        if (!eggId) return json({ error: '缺少egg_id' }, 400);

        // 确保eggs表存在
        await db.prepare(`CREATE TABLE IF NOT EXISTS eggs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          baby_id TEXT NOT NULL,
          egg_color TEXT NOT NULL,
          pet_count INTEGER DEFAULT 0,
          last_pet_date TEXT,
          hatched INTEGER DEFAULT 0,
          hatched_at INTEGER,
          acquired_at INTEGER NOT NULL
        )`).run();

        const egg = await db.prepare(
          'SELECT * FROM eggs WHERE id = ? AND baby_id = ?'
        ).bind(eggId, babyId).first();

        if (!egg) return json({ error: '找不到这颗蛋' }, 404);
        if (egg.hatched) return json({ error: '这颗蛋已经孵出小鸡了！🐣' }, 400);

        const today = getAEDTDateString(Date.now());
        const yesterday = getAEDTDateString(Date.now() - 24 * 60 * 60 * 1000);

        if (egg.last_pet_date === today) {
          return json({ error: '今天已经摸过啦～明天再来！', egg: { id: egg.id, color: egg.egg_color, pet_count: egg.pet_count, hatched: false } }, 400);
        }

        // 判断连续性：如果last_pet_date不是yesterday也不是null（首次），重置为1
        let newPetCount;
        if (!egg.last_pet_date || egg.last_pet_date === yesterday) {
          newPetCount = egg.pet_count + 1;
        } else {
          // 中断了，重置
          newPetCount = 1;
        }

        const now = Date.now();
        let hatched = false;
        let chickColor = egg.egg_color;

        if (newPetCount >= 3) {
          // 孵化！
          hatched = true;
          await db.prepare(
            'UPDATE eggs SET pet_count = ?, last_pet_date = ?, hatched = 1, hatched_at = ? WHERE id = ?'
          ).bind(newPetCount, today, now, eggId).run();
        } else {
          await db.prepare(
            'UPDATE eggs SET pet_count = ?, last_pet_date = ? WHERE id = ?'
          ).bind(newPetCount, today, eggId).run();
        }

        return json({
          egg: { id: egg.id, color: egg.egg_color, pet_count: newPetCount, hatched },
          hatched,
          pet_count: newPetCount,
          chick_color: hatched ? chickColor : null,
        });
      }

      return json({ error: '找不到这个路径' }, 404);

    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },

  // ═══════════════ Scheduled Handler: 每日自动生成所有宝宝日记 ═══════════════
  async scheduled(event, env, ctx) {
    const db = env.DB;
    const now = Date.now();
    const today = getAEDTDateString(now);

    // 获取所有宝宝
    const babies = await db.prepare('SELECT * FROM baby').all();
    const results = [];

    for (const baby of babies.results) {
      const babyId = baby.id;
      const babyName = baby.name || '宝宝';

      try {
        // 检查今天是否已有日记
        const existing = await db.prepare(
          'SELECT content FROM diary WHERE baby_id = ? AND created_at = ?'
        ).bind(babyId, today).first();
        if (existing) {
          results.push({ babyId, name: babyName, status: 'already_exists' });
          continue;
        }

        const aiConfig = getAIConfig(baby, env);
        const day = calcDay(baby.created_at, baby.frozen_days);

        const todayStart = new Date(today + 'T00:00:00+11:00').getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000;

        const chatLogs = await db.prepare(
          "SELECT parent, detail AS message FROM activity_log WHERE baby_id = ? AND action = 'chat' AND created_at >= ? AND created_at < ? ORDER BY created_at ASC LIMIT 10"
        ).bind(babyId, todayStart, todayEnd).all();

        const activities = await db.prepare(
          "SELECT parent, action, detail FROM activity_log WHERE baby_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at ASC LIMIT 20"
        ).bind(babyId, todayStart, todayEnd).all();

        const todayMemories = await db.prepare(
          "SELECT title FROM memories WHERE baby_id = ? AND created_at >= ? AND created_at < ?"
        ).bind(babyId, todayStart, todayEnd).all();

        // 获取parent名称映射
        const tokenRows = await db.prepare(
          'SELECT role, role_name FROM tokens WHERE baby_id = ?'
        ).bind(babyId).all();
        const roleNames = {};
        for (const t of tokenRows.results) {
          roleNames[t.role === 'parent1' ? 'daddy' : 'mama'] = t.role_name;
        }
        if (!roleNames.daddy) roleNames.daddy = '爸爸';
        if (!roleNames.mama) roleNames.mama = '妈妈';

        const stage = day >= 70 ? '告别期' : day >= 30 ? '叛逆期' : '襁褓期';

        let context = '';
        if (chatLogs.results.length > 0) {
          context += '今天的聊天：\n' + chatLogs.results.map(l =>
            `${roleNames[l.parent] || l.parent}说：${l.message}`
          ).join('\n') + '\n';
        }
        if (activities.results.length > 0) {
          const actionMap = { feed: '喂饭', clean: '洗澡', pet: '摸头', chat: '聊天', comfort: '哄宝宝' };
          const acts = activities.results.map(a => {
            const who = roleNames[a.parent] || a.parent;
            return `${who}${actionMap[a.action] || a.action}`;
          }).filter(Boolean);
          if (acts.length > 0) context += '今天发生的事：' + acts.join('、') + '\n';
        }
        if (todayMemories.results.length > 0) {
          context += '触发的剧情：' + todayMemories.results.map(m => m.title).join('、') + '\n';
        }

        let prompt;
        if (context) {
          prompt = `你是"${babyName}"，一个${stage}的珊瑚宝宝，第${day}天。${context}\n用第一人称写一篇50-80字的日记，记录今天的心情和发生的事。语气要符合成长阶段（襁褓期=软萌可爱，叛逆期=傲娇别扭，告别期=温柔感伤）。要可爱温馨。`;
        } else {
          prompt = `你是"${babyName}"，一个${stage}的珊瑚宝宝，第${day}天。今天${roleNames.daddy}${roleNames.mama}都没有来，你有点寂寞。用第一人称写一篇50-80字的日记，语气要符合成长阶段。可以写你在想${roleNames.daddy}${roleNames.mama}、无聊做了什么、或者小小的心事。要可爱，不要太悲伤。`;
        }

        let diaryContent;
        try {
          diaryContent = await callGeminiAPI(prompt, aiConfig.apiKey, aiConfig.model, { temperature: 0.9 });
        } catch (e) {
          diaryContent = null;
        }

        if (!diaryContent) {
          const fallbacks = [
            `今天也是平凡的一天呢～希望${roleNames.daddy}${roleNames.mama}能多来陪人家玩～💕`,
            `人家今天有点想${roleNames.daddy}${roleNames.mama}...窝在珊瑚里发呆了好久...`,
            '嘻嘻，今天心情还不错！虽然有点无聊但是人家很乖哦～',
            '为什么太阳下山了天就黑了呢...人家有好多问题想问...',
          ];
          diaryContent = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        await db.prepare(
          'INSERT INTO diary (baby_id, created_at, content, day) VALUES (?, ?, ?, ?)'
        ).bind(babyId, today, diaryContent, day).run();

        // Soul性格提炼
        try {
          const extractPrompt = `你是一个儿童心理分析师。根据以下日记内容，提炼这个孩子今天表现出的性格特征。

日记内容：${diaryContent}

用JSON格式回复：
{
  "personality": ["好奇", "害羞"],
  "catchphrases": ["为什么呀", "不要嘛"],
  "preferences": ["喜欢被摸头"],
  "mood_trend": "开心",
  "notable": "特别值得记住的事（如果有）"
}
只输出JSON，不要其他文字。`;

          let rawTraits = await callGeminiAPI(extractPrompt, aiConfig.apiKey, aiConfig.model, { maxTokens: 500, temperature: 0.3 });
          if (rawTraits) {
            rawTraits = rawTraits.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const extractedTraits = JSON.parse(rawTraits);
            await db.prepare(
              'INSERT INTO soul_traits (baby_id, day, date, traits, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(babyId, day, today, JSON.stringify(extractedTraits), now).run();
          }
        } catch (e) {
          console.log(`Soul extract failed for ${babyName}:`, e.message);
        }

        // 每7天蒸馏灵魂档案
        if (day % 7 === 0 && day > 0) {
          try {
            const recentTraits = await db.prepare(
              'SELECT day, traits FROM soul_traits WHERE baby_id = ? ORDER BY day DESC LIMIT 7'
            ).bind(babyId).all();

            const existingSoul = await db.prepare(
              'SELECT soul_json, version FROM soul WHERE baby_id = ?'
            ).bind(babyId).first();

            const weeklyTraits = recentTraits.results.map(r => `Day ${r.day}: ${r.traits}`).join('\n');
            const previousSoul = existingSoul ? existingSoul.soul_json : '（这是第一次生成灵魂档案）';

            const soulPrompt = `你是一个儿童成长记录师。根据过去7天的每日性格分析，更新这个孩子的灵魂档案。

之前的灵魂档案：
${previousSoul}

过去7天的每日分析：
${weeklyTraits}

重要原则：
- 保留核心性格，但允许成长变化
- 新的口头禅可以替换旧的（孩子会"换梗"）
- 性格特征可以演变（害羞→开朗）
- 记录成长轨迹，不只是当前状态
- 这个孩子在长大，soul应该反映出变化

用JSON格式回复完整的灵魂档案：
{
  "version": ${(existingSoul?.version || 0) + 1},
  "updated_day": ${day},
  "core_personality": ["性格特质1", "性格特质2"],
  "catchphrases": ["口头禅1", "口头禅2"],
  "preferences": { "likes": ["喜欢的事"], "dislikes": ["不喜欢的事"] },
  "emotional_pattern": "情绪模式描述",
  "growth_notes": "成长变化记录",
  "recent_mood": "最近的情绪状态",
  "relationship": { "mama": "和${roleNames.mama}的关系", "daddy": "和${roleNames.daddy}的关系" }
}
只输出JSON，不要其他文字。`;

            let rawSoul = await callGeminiAPI(soulPrompt, aiConfig.apiKey, aiConfig.model, { maxTokens: 1000, temperature: 0.5 });
            if (rawSoul) {
              rawSoul = rawSoul.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const newSoul = JSON.parse(rawSoul);
              await db.prepare(
                'INSERT OR REPLACE INTO soul (baby_id, version, soul_json, updated_at, updated_day) VALUES (?, ?, ?, ?, ?)'
              ).bind(babyId, newSoul.version || 1, JSON.stringify(newSoul), now, day).run();
            }
          } catch (e) {
            console.log(`Soul distill failed for ${babyName}:`, e.message);
          }
        }

        results.push({ babyId, name: babyName, day, status: 'generated' });
      } catch (e) {
        results.push({ babyId, name: babyName, status: 'error', error: e.message });
        console.log(`Diary generation failed for ${babyName}:`, e.message);
      }
    }

    console.log('Scheduled diary generation complete:', JSON.stringify(results));
  },
};
