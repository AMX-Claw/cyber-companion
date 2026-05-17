# 像素画 & Spritesheet 速查指南

## 📐 Spritesheet基本概念

Spritesheet = 一张大图里排列了很多小帧，按网格排列（行×列）

### 计算公式
```
帧宽 = 总宽 ÷ 列数
帧高 = 总高 ÷ 行数
总帧数 = 行数 × 列数（最后一行可能不满）
```

### 读取顺序
从左到右，从上到下。跟读书一样。
- Frame 0 = 第1行第1列
- Frame 7 = 第1行第8列（如果8列的话）
- Frame 8 = 第2行第1列

### 实战例子（小鸡spritesheet）
```
大图: 128×432px
帧大小: 16×16px
列数: 128÷16 = 8列
行数: 432÷16 = 27行
每行8帧，共27行不同动画
```

## 🎮 Phaser 3 用法

### 加载spritesheet
```javascript
this.load.spritesheet('chicken', 'assets/chicken.png', {
    frameWidth: 16,   // 每帧宽
    frameHeight: 16   // 每帧高
});
```

### 创建动画
```javascript
this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('chicken', { 
        start: 8,   // 第2行第1帧 (row×cols = 1×8)
        end: 15      // 第2行第8帧
    }),
    frameRate: 8,
    repeat: -1  // 循环
});
```

### 指定特定帧（不连续）
```javascript
frames: this.anims.generateFrameNumbers('chicken', { 
    frames: [80, 81, 82, 83, 84, 85]  // row 11的前6帧
})
```

### 帧号计算
```
帧号 = row × cols_per_row + col
例: row 2 (0-indexed), col 0, 8列 → 帧号 = 2×8 = 16
例: row 10 (0-indexed), col 0, 8列 → 帧号 = 10×8 = 80
```

## ⚠️ 常见翻车点（全是我踩过的）

1. **尺寸搞错**：先看图片总尺寸÷列数，不要猜！128÷8=16不是32！
2. **行号数错**：row从0开始数！第1行=row 0，第2行=row 1
3. **切行切错**：要看原图确认每行是什么动画，不要靠猜
4. **朝向判断**：用眼睛看sprite的眼睛/嘴巴朝向，不要用算法推
5. **翻转方向**：`sprite.setFlipX(true)` 水平翻转。走左边flipX=true，走右边flipX=false
6. **部署前验证**：本地跑通了再部署！部署完看截图确认！
7. **项目名确认**：wrangler deploy要确认project name！`xiaoke`不是`xiaoke-1po`！

## 🛠️ 工具推荐

- **Aseprite**: 最好的像素画工具（$20），支持动画timeline、洋葱皮、导出spritesheet
- **Piskel**: 免费在线版，适合快速预览
- **ezgif.com/sprite-cutter**: 在线切spritesheet，上传图片指定帧大小即可切割
- **TexturePacker**: 把多张小图打包成spritesheet

## 🎨 像素画动画原则

- **Walk cycle**: 交替腿+手臂，身体在脚着地时下降1px，腿并拢时上升
- **Idle**: 微微呼吸感——头/身体1px上下移动，偶尔眨眼
- **Peck(啄)**: 头向下2-3px，身体前倾，1-2帧停顿再抬头
- **帧率**: 像素动画一般8-12fps够了，不需要60fps
- **帧数**: walk 4-8帧，idle 2-4帧，attack 4-6帧

## 📝 下次修sprite的checklist
1. [ ] 看原图总尺寸
2. [ ] 算帧大小 = 总宽÷列数
3. [ ] 数行号，确认每行是什么动画（用眼睛看！）
4. [ ] 算帧号 = row × cols + col
5. [ ] 本地测试播放
6. [ ] 截图确认方向/动画正确
7. [ ] 确认部署项目名
8. [ ] 部署后截图再确认一次
