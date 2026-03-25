// ═══════════════════════════════════════════════════════════
// 🐚 小珂 API 适配层
// 封装所有后端调用，前端只需要调这个文件的函数
// ═══════════════════════════════════════════════════════════

// API 配置
const API_CONFIG = {
  baseUrl: 'https://xiaoke-api.YOUR_SUBDOMAIN.workers.dev', // Replace with your Worker URL after deployment
  token: null, // 运行时设置（从localStorage读取或登录时获取）
  timeout: 10000
};

// 设置认证token
function setAuthToken(token) {
  API_CONFIG.token = token;
  localStorage.setItem('xiaoke_auth_token', token);
}

// 获取认证token
function getAuthToken() {
  if (!API_CONFIG.token) {
    API_CONFIG.token = localStorage.getItem('xiaoke_auth_token');
  }
  return API_CONFIG.token;
}

// 通用请求封装
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(url, { ...config, signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `请求失败：${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw err;
  }
}

// ═══════════════ API 方法 ═══════════════

// 健康检查（无需认证）
async function healthCheck() {
  return await apiRequest('/health');
}

// 获取小珂状态 + 对方行为 + 待传达消息
async function getStatus() {
  return await apiRequest('/status');
}

// 喂饭
async function feed() {
  return await apiRequest('/feed', { method: 'POST' });
}

// 洗澡
async function clean() {
  return await apiRequest('/clean', { method: 'POST' });
}

// 摸头
async function pet() {
  return await apiRequest('/pet', { method: 'POST' });
}

// 聊天（不生成AI回复，只记录行为）
async function chat(message) {
  return await apiRequest('/chat', {
    method: 'POST',
    body: { message }
  });
}

// 安慰（#MMDD-comfort-签名）
async function comfort() {
  return await apiRequest('/comfort', { method: 'POST' });
}

// 唤醒昏迷（#MMDD-emergency-签名）
async function revive() {
  return await apiRequest('/revive', { method: 'POST' });
}

// 查看所有回忆
async function getMemories() {
  return await apiRequest('/memories');
}

// 保存回忆（剧情/随机事件完成后）
async function saveMemory(eventId, day, title, isRandom, dialogues) {
  return await apiRequest('/memories/save', {
    method: 'POST',
    body: { eventId, day, title, isRandom, dialogues }
  });
}

// 查看行为日志
async function getActivity(limit = 20) {
  return await apiRequest(`/activity?limit=${limit}`);
}

// 代为告白/留便签
async function sendMessage(message) {
  return await apiRequest('/message', {
    method: 'POST',
    body: { message }
  });
}

// 标记消息已送达
async function deliverMessage(messageId) {
  return await apiRequest('/message/deliver', {
    method: 'POST',
    body: { id: messageId }
  });
}

// 同步状态（前端定时调用，保存衰减后的数值）
async function syncState(hunger, cleanliness, happiness, coins, frozenDays) {
  return await apiRequest('/save-state', {
    method: 'POST',
    body: { hunger, cleanliness, happiness, coins, frozenDays }
  });
}

// 导入旧存档
async function importArchive(data) {
  return await apiRequest('/import', {
    method: 'POST',
    body: { data }
  });
}

// ═══════════════ 兼容层（fallback到localStorage） ═══════════════

// 尝试从API加载，失败则fallback到localStorage
async function loadGameState() {
  try {
    const token = getAuthToken();
    if (!token) {
      // 没有token，走localStorage
      return loadFromLocalStorage();
    }
    
    const status = await getStatus();
    
    // 将API返回的格式转换成前端需要的格式
    return {
      name: status.name,
      day: status.day,
      coins: status.coins,
      hunger: status.hunger,
      happiness: status.happiness,
      cleanliness: status.cleanliness,
      createdAt: Date.now() - (status.day - 1) * 86400000, // 反推createdAt
      lastUpdate: Date.now(),
      lastVisit: Date.now(),
      lastLoginDate: new Date().toDateString(),
      frozenDays: 0, // API返回里没有这个字段，先给0
      milestones: status.milestones || [],
      completedEvents: [], // 需要API补充这个字段
      storyMemories: [] // 需要从 /memories 单独获取
    };
  } catch (err) {
    console.warn('API加载失败，fallback到localStorage:', err.message);
    return loadFromLocalStorage();
  }
}

// 从localStorage加载
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('coral_baby_mvp');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

// 保存到localStorage（作为备份）
function saveToLocalStorage(state) {
  try {
    localStorage.setItem('coral_baby_mvp', JSON.stringify(state));
  } catch (e) {}
}

// 双写：API + localStorage
async function saveGameState(state) {
  // 先保存到localStorage作为备份
  saveToLocalStorage(state);
  
  // 如果有token，同步到API
  const token = getAuthToken();
  if (token) {
    try {
      await syncState(
        state.hunger,
        state.cleanliness,
        state.happiness,
        state.coins,
        state.frozenDays
      );
    } catch (err) {
      console.warn('API同步失败，仅保存到localStorage:', err.message);
    }
  }
}

// 导出所有API
window.XiaokeAPI = {
  // 配置
  setAuthToken,
  getAuthToken,
  
  // API方法
  healthCheck,
  getStatus,
  feed,
  clean,
  pet,
  chat,
  comfort,
  revive,
  getMemories,
  saveMemory,
  getActivity,
  sendMessage,
  deliverMessage,
  syncState,
  importArchive,
  
  // 兼容层
  loadGameState,
  saveGameState
};

console.log('🐚 小珂 API 适配层加载完成');
