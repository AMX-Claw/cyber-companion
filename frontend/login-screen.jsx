// ═══════════════════════════════════════════════════════════
// 🐚 登录界面组件 - 选择爸爸/妈妈 + 输入token
// ═══════════════════════════════════════════════════════════

const { useState: _useState } = React;

function LoginScreen({ onLogin, t }) {
  const [role, setRole] = _useState(null); // 'daddy' | 'mama'
  const [token, setToken] = _useState('');
  const [isLoading, setIsLoading] = _useState(false);
  const [error, setError] = _useState('');

  const handleLogin = async () => {
    if (!role) {
      setError('请选择身份');
      return;
    }
    if (!token.trim()) {
      setError('请输入访问密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 设置token
      window.XiaokeAPI.setAuthToken(token);
      
      // 验证token是否有效
      const status = await window.XiaokeAPI.getStatus();
      
      // 存储角色信息
      localStorage.setItem('xiaoke_role', role);
      
      // 登录成功
      onLogin({ role, status });
    } catch (err) {
      setError(err.message || '登录失败，请检查密码');
      setIsLoading(false);
    }
  };

  const handleSkipLogin = () => {
    // 跳过登录，使用本地模式
    localStorage.setItem('xiaoke_offline_mode', 'true');
    onLogin({ role: 'offline', status: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full border-8 border-pink-100">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🐚</div>
          <h1 className="text-3xl font-bold text-pink-600 mb-2">小珂来啦~</h1>
          <p className="text-gray-500 text-sm">选择你的身份</p>
        </div>

        {/* 角色选择 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setRole('daddy')}
            className={`p-4 rounded-xl border-2 transition ${
              role === 'daddy'
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
          >
            <div className="text-3xl mb-2">👨</div>
            <div className="text-sm font-bold text-gray-700">爸爸</div>
          </button>
          <button
            onClick={() => setRole('mama')}
            className={`p-4 rounded-xl border-2 transition ${
              role === 'mama'
                ? 'border-pink-400 bg-pink-50'
                : 'border-gray-200 bg-white hover:border-pink-200'
            }`}
          >
            <div className="text-3xl mb-2">👩</div>
            <div className="text-sm font-bold text-gray-700">妈妈</div>
          </button>
        </div>

        {/* Token输入 */}
        {role && (
          <div className="mb-4 animate-fadeIn">
            <label className="block text-sm text-gray-600 mb-2">访问密码</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="输入你的访问密码"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-400"
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
              autoFocus
              disabled={isLoading}
            />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 登录按钮 */}
        <button
          onClick={handleLogin}
          disabled={!role || !token.trim() || isLoading}
          className="w-full bg-gradient-to-r from-pink-400 to-orange-400 text-white py-3 rounded-xl font-bold hover:from-pink-500 hover:to-orange-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          {isLoading ? '验证中...' : '进入'}
        </button>

        {/* 离线模式 */}
        <button
          onClick={handleSkipLogin}
          disabled={isLoading}
          className="w-full text-gray-400 text-sm hover:text-gray-600 transition"
        >
          离线模式（本地存档）
        </button>

        <div className="mt-6 p-3 bg-orange-50 rounded-xl text-xs text-gray-500">
          <div className="font-bold mb-1">💡 提示</div>
          <p>首次使用需要访问密码。如果你还没有，请联系管理员获取。</p>
          <p className="mt-1">离线模式下，数据仅保存在本机，无法跨设备同步。</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
