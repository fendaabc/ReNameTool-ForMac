# 图标生成工作流文档

## 概述

本文档描述了如何为ReName应用生成和更新图标的完整工作流程。

## 源文件

- **源图标文件**: `src/assets/1.png`
- **格式**: PNG (1024x1024)
- **特点**: 包含橙黄色和青绿色的环形logo设计

## 生成的图标文件

运行图标生成脚本后，会在 `src-tauri/icons/` 目录下生成以下文件：

- `32x32.png` - 小尺寸图标
- `128x128.png` - 标准尺寸图标  
- `128x128@2x.png` - 高DPI图标 (实际256x256)
- `icon.png` - 基础图标 (实际512x512)

## 使用方法

### 1. 生成图标

```bash
npm run generate-icons
```

### 2. 构建应用

```bash
# 开发构建
npm run tauri dev

# 生产构建
npm run tauri build
```

## 技术细节

### 图标处理特性

- **格式**: PNG with RGBA (确保透明度支持)
- **调整算法**: Lanczos3 (高质量重采样)
- **背景**: 透明背景
- **适配方式**: contain (保持宽高比)

### 颜色配置

图标生成过程中会自动分析logo颜色并保存到 `src/assets/color-palette.json`:

```json
{
  "primary": { "name": "橙黄色", "hex": "#F5B041" },
  "secondary": { "name": "青绿色", "hex": "#58D68D" },
  "accent": { "name": "浅绿色", "hex": "#A9DFBF" },
  "background": { "name": "纯白色", "hex": "#FFFFFF" },
  "neutral": { "name": "浅灰色", "hex": "#F8F9FA" }
}
```

## 更新logo时的步骤

1. 替换 `src/assets/1.png` 文件
2. 运行 `npm run generate-icons`
3. 测试构建: `npm run tauri build --no-bundle`
4. 提交更改到版本控制

## 故障排除

### 常见问题

1. **图标不是RGBA格式错误**
   - 解决方案: 脚本已自动处理，确保使用 `ensureAlpha()` 和 `palette: false`

2. **源文件不存在**
   - 检查 `src/assets/1.png` 文件是否存在
   - 确认文件路径正确

3. **权限问题**
   - 确保对 `src-tauri/icons/` 目录有写权限

### 验证生成的图标

可以使用以下命令检查生成的图标信息：

```bash
# 检查图标文件
ls -la src-tauri/icons/

# 使用Sharp检查图标格式（如果需要）
node -e "
const sharp = require('sharp');
sharp('src-tauri/icons/32x32.png').metadata().then(console.log);
"
```

## 配置文件

### Tauri配置

`src-tauri/tauri.conf.json` 中的图标配置：

```json
{
  "bundle": {
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png", 
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

注意：虽然配置中包含 `.icns` 和 `.ico` 文件，但当前脚本只生成PNG格式，这对Tauri应用来说已经足够。

## 脚本文件

- **主脚本**: `scripts/generate-icons-simple.js`
- **npm命令**: `generate-icons`
- **依赖**: sharp (图像处理库)

## 版本历史

- v1.0: 初始版本，支持PNG格式图标生成
- v1.1: 修复RGBA格式问题，确保Tauri构建兼容性