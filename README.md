# ReName

一个基于 Tauri 的桌面应用程序。

## 项目简介

ReName 是使用 Tauri 框架开发的跨平台桌面应用，结合了 Web 前端技术和 Rust 后端的优势。

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