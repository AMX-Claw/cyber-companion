# 小珂 xiaoke-project

赛博宝宝养成游戏 🐚

- **线上地址**: https://xiaoke-1po.pages.dev
- **API**: https://xiaoke-api.megyucai.workers.dev
- **D1数据库ID**: 51cdbaa0-5f7c-452e-a2af-fa990df8d217
- **Token**: daddy_ak_xiaoke_2026 / mama_xy_xiaoke_2026

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

## ⚠️ 关键提醒
- **实际serve的是 index.html**，不是 app.jsx！
- 部署前 `git commit` 确保改动不丢
- Cloudflare Pages项目名是 `xiaoke`（不是 `xiaoke-1po`）
- 日记是Worker cron trigger自动生成，跟🦞无关
