# ReName

一个基于 Tauri 的桌面应用程序。

## 项目简介

ReName 是使用 Tauri 框架开发的跨平台桌面应用，结合了 Web 前端技术和 Rust 后端的优势。

## 开发计划与升级计划

### 阶段划分

#### 阶段一：核心布局与交互重构（高优先级）
- [ ] 1.1 设计并实现一体化单屏工作台主界面
- [ ] 1.2 文件批量导入与展示（拖拽/选择）
- [ ] 1.3 文件重命名规则预览与编辑
- [ ] 1.4 重命名结果预览与冲突检测
- [ ] 1.5 核心重命名功能实现（调用 Rust/Tauri 后端）
- [ ] 1.6 基础操作按钮（重命名、撤销、重置等）

#### 阶段二：健壮性与体验优化（中优先级）
- [ ] 2.1 错误处理与用户提示优化
- [ ] 2.2 文件类型与权限兼容性增强
- [ ] 2.3 操作历史记录与撤销重做
- [ ] 2.4 多语言支持（中英文）

#### 阶段三：进阶功能与效率提升（长期价值）
- [ ] 3.1 高级重命名规则（正则/模板/批量规则）
- [ ] 3.2 文件/文件夹混合处理
- [ ] 3.3 自定义插件机制
- [ ] 3.4 高级批处理性能优化
- [ ] 3.5 自动化脚本支持

### 升级计划
- 逐步替换旧版分离式页面为一体化单屏工作台
- 每完成一个阶段性小任务，进行 git commit 记录
- 详细记录每次升级内容、bug 修复与新特性

### 开发流程建议
1. 选择当前阶段的第一个未完成任务
2. 开发并自测该功能
3. 完成后进行 git commit，备注功能点
4. 进入下一个任务

### 任务推进建议
建议每完成一个小功能（如1.1、1.2等），就用如下格式进行 git 提交：

```
git add .
git commit -m "feat: 完成一体化主界面基础布局"
```

## 技术栈

- **前端：** HTML, CSS, JavaScript, Vite
- **后端：** Rust (Tauri)
- **构建工具：** Vite, Cargo

## 开发环境设置

### 前置要求

- Node.js (推荐 LTS 版本)
- Rust (最新稳定版)
- Tauri CLI

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装 Tauri CLI (如果尚未安装)
npm install -g @tauri-apps/cli
```

### 开发模式

```bash
# 启动开发服务器
npm run tauri dev
```

### 构建生产版本

```bash
# 构建应用
npm run tauri build
```

## 项目结构

```
ReName/
├── src/                    # 前端源码
│   ├── assets/            # 静态资源
│   ├── main.js            # 主入口文件
│   └── styles.css         # 样式文件
├── src-tauri/             # Tauri 后端
│   ├── src/               # Rust 源码
│   ├── icons/             # 应用图标
│   └── Cargo.toml         # Rust 依赖配置
├── index.html             # 主页面
├── package.json           # Node.js 依赖
└── vite.config.ts         # Vite 配置
```

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 创建 Pull Request

## 许可证

[添加许可证信息]

## 联系方式

[添加联系信息]