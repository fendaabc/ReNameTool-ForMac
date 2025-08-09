# ReNameTool

一个强大、直观且高效的批量文件重命名工具，基于 Tauri 框架和 Rust 语言构建。

## 简介

ReNameTool 旨在提供一个用户友好的界面，帮助您轻松地对大量文件进行批量重命名。无论是简单的查找替换，还是复杂的序列化、大小写转换，ReNameTool 都能满足您的需求，极大地提高文件管理的效率。

## 功能特性

*   **直观的用户界面**：简洁明了的设计，易于上手。
*   **多种重命名规则**：支持查找替换、序列化、大小写转换等多种高级重命名模式。
*   **实时预览**：在应用更改前，实时查看重命名效果，避免错误。
*   **跨平台支持**：基于 Tauri，可打包为 Mac 和 Windows 桌面应用。
*   **高性能**：底层使用 Rust 编写，确保重命名操作的快速与高效。

## 技术栈

*   **前端**：HTML, CSS, JavaScript (请根据实际使用的前端框架填写，例如：Vue/React/Svelte)
*   **后端/桌面框架**：Tauri
*   **核心逻辑**：Rust

## 安装与运行

### 从发布版本安装

请前往 [GitHub Releases](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME/releases) 下载最新版本的安装包，然后按照指引进行安装。

### 从源代码构建

如果您希望从源代码构建和运行 ReNameTool，请确保您的系统已安装以下依赖：

*   [Rust](https://www.rust-lang.org/tools/install)
*   [Node.js](https://nodejs.org/en/download/) (推荐 LTS 版本)
*   [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

1.  **克隆仓库**：
    ```bash
    git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
    cd ReNameTool
    ```

2.  **安装前端依赖**：
    ```bash
    npm install # 或 yarn install
    ```

3.  **运行开发模式**：
    ```bash
    npm run tauri dev # 或 yarn tauri dev
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

本项目采用 [MIT 许可证](LICENSE) 发布。您可以在项目的 `LICENSE` 文件中查看更多详情。

## 联系方式

如果您有任何问题或建议，欢迎通过以下方式联系我：

*   GitHub Issues: [https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME/issues](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME/issues)
*   Email: [your_email@example.com](mailto:your_email@example.com)

请将 `YOUR_USERNAME` 和 `YOUR_REPOSITORY_NAME` 替换为您的实际 GitHub 用户名和仓库名，并将 `your_email@example.com` 替换为您的电子邮件地址。