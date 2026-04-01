# 小珂螃蟹身体 - SVG动画方案

## 来源
- clawd-on-desk: https://github.com/rullerzhou-afk/clawd-on-desk
- MIT开源，15x16像素SVG + CSS keyframes动画
- 参考文件下载到: ~/Desktop/薅羊毛计划/xiaoke-mvp/assets/clawd-ref/

## 状态映射

| 小珂状态 | clawd动画 | 说明 |
|---------|----------|------|
| 默认/idle | clawd-idle-living | 呼吸+眨眼+打哈欠+抓痒 |
| 开心(happiness>80) | clawd-happy | 蹦跳+挥手+sparkle |
| 饥饿(hunger<30) | clawd-error | 冒烟+ERROR |
| 睡觉(cleanliness<30) | clawd-sleeping | zzZ |
| 探险中 | clawd-working-thinking | 思考泡泡 |
| 被摸头 | clawd-react-double | 被戳反应 |
| 闹脾气 | clawd-notification | 跳起来警报 |

## 配色改造
原色 #DE886D (橙红蟹色) → 小珂专属色？
- 方案1: 保持橙色系但更粉嫩 → #F4A89A
- 方案2: 根据avatar选择变色（珊瑚色/蓝色/粉色）
- 方案3: 跟随叛逆期设定用更酷的颜色

## 前端集成
1. 在前端加一个SVG容器div，替代现有的static avatar img
2. 根据小珂当前状态动态切换SVG内容
3. 保留现有avatar选择功能，但选了"螃蟹(会动)"后走SVG路线
4. 其他avatar（珊瑚/兔耳）保持PNG不变

## 进度
- [x] 小玉确认配色：原版 #DE886D，不加装饰
- [x] ClawdBaby组件完成并插入index.html
- [x] 状态映射完成：idle(呼吸+眨眼) / happy(蹦跳+挥手+sparkle) / sleeping(趴着+zzZ) / error(冒烟+ERROR)
- [x] AvatarRenderer已加入 avatar='clawd' 分支
- [x] 后端支持clawd avatar — `/baby/avatar/preset` API已实现
- [x] 前端Avatar切换UI — "回忆册"页面顶部3按钮（珊瑚/螃蟹/兔耳）
- [x] 部署上线 — https://1828b24d.xiaoke-1po.pages.dev
- [ ] 真实环境测试动画效果（需要token登录）
