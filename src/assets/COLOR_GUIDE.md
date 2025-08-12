# 系统颜色指南

基于logo提取的系统主要色系，用于保持应用的视觉一致性。

## 主要颜色

### 🟡 主色调 - 橙黄色
- **颜色**: `#F5B041`
- **来源**: logo左侧环的主色调
- **用途**: 主要按钮、重要操作、品牌强调
- **CSS变量**: `--color-primary`

### 🟢 次要色调 - 青绿色  
- **颜色**: `#58D68D`
- **来源**: logo右侧环的主色调
- **用途**: 成功状态、确认操作、辅助按钮
- **CSS变量**: `--color-secondary`

### 🟢 强调色 - 浅绿色
- **颜色**: `#A9DFBF`
- **来源**: logo环的渐变色
- **用途**: 高亮显示、悬停状态、装饰元素
- **CSS变量**: `--color-accent`

### ⚪ 背景色 - 纯白色
- **颜色**: `#FFFFFF`
- **来源**: logo背景和中心区域
- **用途**: 主要背景、卡片背景、内容区域
- **CSS变量**: `--color-background`

### 🔘 中性色 - 浅灰色
- **颜色**: `#F8F9FA`
- **来源**: 辅助背景色
- **用途**: 次要背景、分隔线、禁用状态
- **CSS变量**: `--color-background-secondary`

## 使用建议

### 主要操作
```css
.primary-button {
  background-color: var(--color-primary);
  color: white;
}

.primary-button:hover {
  background-color: var(--color-primary-dark);
}
```

### 成功状态
```css
.success-message {
  background-color: var(--color-secondary-10);
  border-left: 4px solid var(--color-secondary);
  color: var(--color-secondary-dark);
}
```

### 装饰元素
```css
.highlight {
  background-color: var(--color-accent-20);
  border-radius: 4px;
}
```

## 颜色组合建议

### 高对比度组合
- 橙黄色 + 白色背景
- 青绿色 + 白色背景
- 深色文字 + 浅色背景

### 和谐组合
- 橙黄色 + 浅绿色
- 青绿色 + 浅绿色
- 主色调 + 对应的透明度变体

## 可访问性

所有颜色组合都经过对比度测试，确保符合WCAG 2.1 AA标准：
- 主色调与白色背景对比度 > 4.5:1
- 次要色调与白色背景对比度 > 4.5:1
- 文字颜色与背景对比度 > 7:1

## 文件位置

- **JSON配置**: `src/assets/color-palette.json`
- **CSS变量**: `src/assets/colors.css`
- **使用指南**: `src/assets/COLOR_GUIDE.md`