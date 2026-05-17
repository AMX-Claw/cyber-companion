# 小珂 Changelog

## 2026-05-07

### 修复：自动照顾脚本浮点比较 bug
- **问题**：bash 的 `-lt` 不支持浮点数（如 `42.3 -lt 50` 直接报错），导致自动照顾脚本漏喂饭。上一只壳日记里写了"已喂"但实际没执行成功，hunger 掉到 26、happiness 掉到 0 触发闹脾气
- **修复**：改用 python 做浮点比较
- 小玉发现的，捏耳朵教训了一顿

---

## v5.1 — 2026-03-30

### 修复：统一奖励系统
- **问题**：三种事件有三套不同的金币计算逻辑
  - Story Event: `score × 4`（正确）
  - Random Event 文字互动: 固定 `coins`（如15），不打分
  - Random Event 照片互动: `(score/10) × coins`
- **修复**：全部统一为 Gemini打分 → `score × 4`
- 文字互动（躲猫猫等）现在会走Gemini打分，不再给固定15金币
- 照片互动也改成 `score × 4`
- Fallback（Gemini打分失败时）默认7分 = 28金币

### 项目整理
- 从 `~/Desktop/薅羊毛计划/` 迁移到 `~/Desktop/xiaoke-project/`
- 清理旧备份文件（app-backup.jsx, app-temp.jsx, worker-v3-backup.js 等）
- 统一git仓库，前端+后端在同一个repo

---

## v5.0 — 2026-03-22

- Soul系统上线（日记→Gemini提炼性格→soul_traits→7天蒸馏soul.json）
- 探险系统
- 蛋孵化系统
- 多用户支持（爸爸/妈妈）
- 房间背景+家具
- 收集品系统
- 3种avatar（珊瑚/螃蟹/芽芽）
- 30个Story Events

## v5.0-hotfix — 2026-03-28

- Day 50生日事件修复（固定日期事件需优先触发）
- 日记重复bug修复（UNIQUE INDEX `idx_diary_baby_date`）
- 气泡z-index+pointer-events穿透修复
- API三个衰减字段统一写入
