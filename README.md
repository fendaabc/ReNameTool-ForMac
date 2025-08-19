# ReName - 文件批量重命名工具

一个强大、直观且高效的批量文件重命名工具，基于 Tauri 2.0 框架和 Rust 语言构建，专为 macOS 优化。

## 简介

ReName 旨在提供一个用户友好的界面，帮助您轻松地对大量文件进行批量重命名。无论是简单的查找替换，还是复杂的序列化、大小写转换，ReName 都能满足您的需求，极大地提高文件管理的效率。

## 功能特性

### 🎯 核心功能
*   **直观的用户界面**：简洁明了的设计，支持明暗主题切换
*   **实时预览**：在应用更改前，实时查看重命名效果，避免错误
*   **批量操作**：支持大量文件的高效批量重命名
*   **撤销功能**：支持一键撤销重命名操作，安全可靠

### 📝 重命名规则
*   **查找替换**：支持普通文本和正则表达式的查找替换
*   **添加序列**：为文件添加序列号，支持前缀/后缀位置，自定义起始数字、步长和位数
*   **切片替换**：精确控制文件名的特定位置进行替换，支持负索引和保留扩展名
*   **大小写转换**：支持多种转换模式
    - 全部大写（UPPERCASE）
    - 全部小写（lowercase）
    - 标题格式（Title Case）
    - 蛇形命名（snake_case）
    - 短横线命名（kebab-case）
*   **扩展名修改**：灵活的扩展名操作
    - 修改扩展名
    - 移除扩展名
    - 添加扩展名
    - 支持强制修改和大小写保持

### 🚀 性能与体验
*   **原生 macOS 体验**：基于 Tauri 2.0，提供原生性能和体验
*   **Apple Silicon 优化**：专为 M1/M2/M3 芯片优化，性能卓越
*   **高性能**：底层使用 Rust 编写，确保重命名操作的快速与高效
*   **虚拟滚动**：支持大量文件列表的流畅显示
*   **智能预览**：实时高亮显示文件名变化，直观易懂

### 🎨 用户体验
*   **拖拽导入**：支持文件和文件夹的拖拽导入
*   **键盘快捷键**：完整的键盘操作支持
*   **无障碍支持**：完整的ARIA标签和屏幕阅读器支持
*   **响应式设计**：适配不同屏幕尺寸，支持窄屏显示

## 架构设计

### 目录结构

```
src/
├── core/                    # 核心功能
│   ├── event-bus.js         # 事件总线
│   ├── state-manager.js     # 状态管理
│   └── utils/               # 工具函数
│       ├── file-utils.js    # 文件操作工具
│       ├── dom-utils.js     # DOM 操作工具
│       ├── validation-utils.js # 验证工具
│       └── index.js         # 工具函数入口
│
├── features/                # 功能模块
│   ├── file-list/          # 文件列表管理
│   ├── preview/            # 预览功能
│   └── rename/             # 重命名功能
│
├── components/             # UI 组件
│   ├── buttons/            # 按钮组件
│   ├── file-list/          # 文件列表组件
│   └── rule-panel/         # 规则面板组件
│
└── services/               # 服务层
    ├── api/               # API 服务
    ├── storage/           # 本地存储服务
    └── history/           # 历史记录服务
```

### 核心模块

#### 1. 事件总线 (event-bus.js)
- 实现发布/订阅模式
- 支持同步和异步事件处理
- 提供常用事件常量

#### 2. 状态管理 (state-manager.js)
- 响应式状态管理
- 状态持久化
- 状态订阅和批量更新

#### 3. 工具函数 (utils/)
- **file-utils.js**: 文件路径处理、文件名提取、路径规范化等
- **dom-utils.js**: DOM 操作、事件处理、滚动控制等
- **validation-utils.js**: 数据验证、格式检查等
- **index.js**: 常用工具函数入口

### 功能模块

#### 1. 文件列表 (file-list/)
- 文件列表管理
- 文件选择和过滤
- 文件信息展示

#### 2. 预览功能 (preview/)
- 重命名预览
- 差异高亮
- 批量操作预览

#### 3. 重命名功能 (rename/)
- 重命名规则管理
- 重命名执行
- 撤销/重做

### 服务层

#### 1. API 服务
- 与后端通信
- 请求封装
- 错误处理

#### 2. 存储服务
- 本地存储管理
- 配置持久化
- 数据加密

#### 3. 历史记录服务
- 操作历史记录
- 撤销/重做管理
- 历史记录持久化

## 使用指南

### 基本操作
1. **导入文件**：
   - 点击"选择文件"或"选择文件夹"按钮
   - 或直接拖拽文件/文件夹到应用窗口

2. **选择重命名规则**：
   - 点击顶部的规则标签页（查找替换、添加序列、切片替换、大小写、扩展名）
   - 配置相应的参数

3. **预览效果**：
   - 实时查看"新文件名(预览)"列中的重命名效果
   - 红色表示冲突或非法字符，需要调整规则

4. **执行重命名**：
   - 确认预览效果无误后，点击"执行重命名"按钮
   - 支持撤销操作，可一键恢复

### 规则详解

#### 查找替换
- **普通模式**：直接文本替换
- **正则表达式**：支持复杂的模式匹配
- **区分大小写**：控制匹配的大小写敏感性

#### 添加序列
- **位置**：选择序列号作为前缀或后缀
- **起始数字**：设置序列号的起始值
- **步长**：设置序列号的递增间隔
- **位数**：设置序列号的位数（不足补0）

#### 切片替换
- **起始位置**：指定替换的开始位置（支持负数从末尾计算）
- **结束位置**：指定替换的结束位置（留空表示到末尾）
- **替换内容**：用于替换的新文本
- **保留扩展名**：只对文件名主体进行操作

#### 大小写转换
- **全部大写**：将所有字母转为大写
- **全部小写**：将所有字母转为小写
- **标题格式**：每个单词首字母大写
- **蛇形命名**：用下划线连接，全部小写
- **短横线命名**：用短横线连接，全部小写

#### 扩展名修改
- **修改扩展名**：将现有扩展名替换为新扩展名
- **移除扩展名**：完全移除文件的扩展名
- **添加扩展名**：为没有扩展名的文件添加扩展名
- **强制修改**：即使文件已有扩展名也强制修改

### 键盘快捷键
- `Ctrl/Cmd + A`：全选所有文件
- `Ctrl/Cmd + D`：取消全选
- `Delete/Backspace`：删除选中文件
- `↑/↓`：上下导航选择文件
- `Shift + ↑/↓`：扩展选择范围
- `Space`：切换当前文件选择状态
- `F2`：开始重命名选中文件
- `←/→`：在规则标签间切换

## 技术栈

*   **前端**：HTML5, CSS3, Vanilla JavaScript
*   **UI框架**：Pico CSS
*   **构建工具**：Vite 6.0
*   **桌面框架**：Tauri 2.0
*   **核心逻辑**：Rust
*   **图标生成**：Sharp + png2icons

## 安装与运行

### 从发布版本安装

请前往 [GitHub Releases](https://github.com/fendaabc/re_name/releases) 下载最新版本的安装包：

- **macOS (Apple Silicon)**：下载 `rename_0.1.0_aarch64.dmg`
- **macOS (Intel)**：下载 `rename_0.1.0_x64.dmg`

下载后双击 DMG 文件，将应用拖拽到应用程序文件夹即可。

### 从源代码构建

如果您希望从源代码构建和运行 ReNameTool，请确保您的系统已安装以下依赖：

*   [Rust](https://www.rust-lang.org/tools/install)
*   [Node.js](https://nodejs.org/en/download/) (推荐 LTS 版本)
*   [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

1.  **克隆仓库**：
    ```bash
    git clone https://github.com/fendaabc/re_name.git
    cd re_name
    ```

2.  **安装前端依赖**：
    ```bash
    npm install
    ```

3.  **运行开发模式**：
    ```bash
    npm run tauri dev
    ```

4.  **生成图标并运行**（如果需要更新图标）：
    ```bash
    npm run dev-with-icons
    ```

### 打包发布版本

要为不同平台构建发布版本，您可以使用 `npm run tauri build` 命令。Tauri 会根据您的操作系统和配置，自动生成适用于该平台的安装包。

**通用构建命令：**

```bash
npm run tauri build
```

**特定平台构建命令及包类型：**

*   **macOS (Intel Mac / Apple Silicon Mac)**
    *   **命令：**
        *   通用二进制 (同时支持 Intel 和 Apple Silicon):
            ```bash
            npm run tauri build -- --target universal-apple-darwin
            ```
        *   仅 Apple Silicon (M1/M2/M3):
            ```bash
            npm run tauri build -- --target aarch64-apple-darwin
            ```
        *   仅 Intel (x86_64):
            ```bash
            npm run tauri build -- --target x86_64-apple-darwin
            ```
    *   **包类型：**
        *   `.dmg` (磁盘映像文件，macOS 安装包)
        *   `.app` (应用程序包，可直接运行)
    *   **输出位置示例：**
        ```
        src-tauri/target/universal-apple-darwin/release/bundle/dmg/your_app_name_version_universal.dmg
        src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/your_app_name_version_aarch64.dmg
        src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/your_app_name_version_x86_64.dmg
        ```

*   **Windows (x64)**
    *   **命令：**
        ```bash
        npm run tauri build -- --target x86_64-pc-windows-msvc
        # 或 npm run tauri build (如果在 Windows 系统上运行，默认会构建 Windows 包)
        ```
    *   **包类型：**
        *   `.msi` (Microsoft Installer，Windows 安装包)
        *   `.exe` (可执行文件，通常在 `target/release` 目录下)
    *   **输出位置示例：**
        ```
        src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/your_app_name_version_x64.msi
        src-tauri/target/x86_64-pc-windows-msvc/release/your_app_name.exe
        ```
    *   **重要提示：** 在非 Windows 系统上构建 Windows 包（交叉编译）通常需要额外的环境配置，如安装 MinGW-w64。推荐直接在 Windows 系统上进行构建，以简化流程。

*   **Linux (x64)**
    *   **命令：**
        ```bash
        npm run tauri build -- --target x86_64-unknown-linux-gnu
        # 或 npm run tauri build (如果在 Linux 系统上运行，默认会构建 Linux 包)
        ```
    *   **包类型：**
        *   `.AppImage` (自包含的 Linux 应用程序包)
        *   `.deb` (Debian/Ubuntu 安装包)
        *   `.rpm` (Fedora/CentOS 安装包)
    *   **输出位置示例：**
        ```
        src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/your_app_name_version_amd64.AppImage
        src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/your_app_name_version_amd64.deb
        ```

**打包后的文件通常位于 `src-tauri/target/<target-triple>/release/bundle/` 目录下。**

## 项目结构

```
re_name/
├── src/                    # 前端源码
│   ├── main.js            # 主入口文件和核心逻辑
│   ├── replace-rule.js    # 查找替换规则管理器
│   ├── sequence-rule.js   # 序列号规则管理器
│   ├── slice-rule.js      # 切片替换规则管理器
│   ├── case-rule.js       # 大小写转换规则管理器
│   ├── extension-rule.js  # 扩展名修改规则管理器
│   ├── virtual-scroll.js  # 虚拟滚动组件
│   └── styles.css         # 样式文件
├── src-tauri/             # Tauri 后端
│   ├── src/               # Rust 源码
│   ├── icons/             # 应用图标 (PNG, ICNS)
│   └── Cargo.toml         # Rust 依赖配置
├── .kiro/                 # Kiro IDE 配置
│   └── specs/             # 功能规范文档
│       └── enhanced-rename-interface/
│           ├── requirements.md  # 需求规范
│           ├── design.md       # 技术设计
│           └── tasks.md        # 实现任务
├── scripts/               # 构建脚本
│   └── generate-icons-simple.js  # 图标生成脚本
├── docs/                  # 文档
│   ├── 00.INDEX.md        # 文档导航
│   ├── 01.prototype-v3-interface.md  # 当前版本原型
│   ├── prototype-v3-interface.md     # 稳定别名
│   ├── 02.issues.md       # 问题清单
│   ├── 03.backlog.md      # 产品规划
│   └── 04.CHANGELOG.md    # 变更记录
├── index.html             # 主页面
├── package.json           # Node.js 依赖
└── vite.config.ts         # Vite 配置
```

## 文档结构与用途说明

 - 总览入口（导航与索引）
   - `docs/00.INDEX.md`：列出下述所有文档及用途，作为团队入口页。

 - 当前唯一真源（UI/交互/功能）
   - 当前版本文件：`docs/01.prototype-v3-interface.md`
   - 稳定别名：`docs/prototype-v3-interface.md`（所有引用统一指向此别名；切换版本时仅更新别名指向）
   - 规则：任意内容若与原型冲突，一律以此为准（通过别名定位当前版本原型）。
   - 归档：旧版本去掉 `01.` 前缀并移入 `docs/archive/`

 - 规范三件套（仅记录“已确认内容”）
   - `/.kiro/specs/<topic-slug>/requirements.md`：需求规范（用户故事、验收标准）。
   - `/.kiro/specs/<topic-slug>/design.md`：技术设计（架构/接口/约束/测试策略）。
   - `/.kiro/specs/<topic-slug>/tasks.md`：实现任务与验收（映射需求编号，结尾带提交提醒）。
   - 约束：不得写“未确认的想法/规划”，此类内容请写到下述入口。
   - 注意：`/.kiro/specs/` 为 Kiro 专用读取目录，禁止移动/重命名该目录。

 - 问题与未来规划（未确认内容的唯一入口）
   - `docs/02.issues.md`：问题清单（Bug/体验问题/风险/待澄清事项）。
   - `docs/03.backlog.md`：未来产品规划与想法（尚未确认/待评估）。
   - 作用：集中未确认内容，避免污染规范三件套。

 - 变更记录
   - `docs/04.CHANGELOG.md`：所有对外可见的变更记录（发布说明/重要修复/特性）。

 - 路线图（可选，默认归档）
   - 默认归档为：`docs/archive/ROADMAP-*.md`。
   
 - AI 助手工作流（必须遵守）
   1. 发现问题/想法：写入 `docs/02.issues.md` 或 `docs/03.backlog.md`。
   2. 立项（进入规划）：在 `/.kiro/specs/` 下创建 `<topic-slug>/`，依次补齐 `requirements.md → design.md → tasks.md`。
   3. 开发执行：严格按 tasks 执行；完成每一子任务即按“全局开发规则”提交一次 commit。
   4. 收尾：更新 `docs/04.CHANGELOG.md`；关闭相关 `issues` 项；将 `03.backlog` 中对应条目标记为已纳入/完成。
   5. 结构调整：如调整文档结构，需同步更新 `docs/00.INDEX.md`，并在 `/.kiro/specs/<topic-slug>/tasks.md` 增加维护任务。

 - 命名与链接规范
   - `<topic-slug>` 使用 kebab-case（例如：`enhanced-rename-interface`）。
   - 在 `requirements.md`/`design.md`/`tasks.md` 开头保留“来源与对齐声明”（指向 prototype/issue/backlog 链接）。
   - 任何移动/重命名需同步更新 README、`docs/00.INDEX.md` 与相关交叉引用，避免断链。

## 可用脚本

- `npm run dev` - 启动 Vite 开发服务器
- `npm run build` - 构建前端资源
- `npm run tauri dev` - 启动 Tauri 开发模式
- `npm run tauri build` - 构建生产版本
- `npm run generate-icons` - 生成应用图标
- `npm run dev-with-icons` - 生成图标并启动开发模式
- `npm run update-icons` - 更新图标并构建（不打包）

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 [MIT 许可证](LICENSE) 发布。您可以在项目的 `LICENSE` 文件中查看更多详情。

## 版本历史

查看 [变更记录](docs/04.CHANGELOG.md) 了解详细的版本更新记录。

## 联系方式

如果您有任何问题或建议，欢迎通过以下方式联系我：

*   GitHub Issues: [https://github.com/fendaabc/re_name/issues](https://github.com/fendaabc/re_name/issues)

## 致谢

感谢 [Tauri](https://tauri.app/) 团队提供的优秀框架，让跨平台桌面应用开发变得如此简单。

感谢Windsurf、Cursor、Trae、Kiro等AI辅助编码助手的代码生成。