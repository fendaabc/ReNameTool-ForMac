# 跨项目「文档结构与 AI 读取」统一规则 v1.0（临时）

适用范围：任意项目。目标是让 AI 与人类在所有项目中以同一套路径命名、同一份“唯一真源”协作，便于自动读取、校验与自愈（自动补齐缺失文档模块）。

## 1. 顶层目录约定
- docs/：项目文档根目录（对外可读）
- docs/archive/：归档区（历史原型、路线图、过期文档）
- .kiro/specs/：规范三件套根目录（AI/Kiro 专用读取区，禁止移动/重命名）

建议目录骨架：
```
docs/
  00.INDEX.md
  01.prototype-<topic-or-version>.md
  prototype-current.md (或项目已有稳定别名，见下)
  02.issues.md
  03.backlog.md
  04.CHANGELOG.md
  archive/
    ROADMAP-*.md
```

## 2. 原型 = 唯一真源
- 排序文件（当前版本）：docs/01.prototype-<topic-or-version>.md
- 稳定别名（统一引用入口）：推荐 docs/prototype-current.md
  - 若项目已使用固定别名（如 docs/prototype-v3-interface.md）且存量引用较多，可继续沿用；新项目统一用 prototype-current.md
- 原则：任意内容冲突时，以“稳定别名”指向的原型为准
- 归档规则：版本切换时，去掉旧原型文件名中的 01. 前缀并移入 docs/archive/，仅更新“稳定别名”的指向

最小别名文件示例（prototype-current.md）：
```md
# 原型（稳定别名）
- 当前版本原型文件：[01.prototype-<topic-or-version>.md](./01.prototype-<topic-or-version>.md)
- 若与任何文档内容冲突，一律以本别名指向的原型为准
```

## 3. 规范三件套（Kiro 专用）
- 路径：/.kiro/specs/<topic-slug>/
- 文件：
  - requirements.md（需求规范：用户故事、验收标准）
  - design.md（技术设计：架构/接口/约束/测试策略）
  - tasks.md（实现任务与验收：映射需求编号，带提交提醒）
- 禁止：在三件套内写“未确认想法/规划”；此类内容仅放 docs/02.issues.md 与 docs/03.backlog.md
- 命名：<topic-slug> 用 kebab-case（如 enhanced-rename-interface）
- 文件头必含「来源与对齐声明」（模板）：
```md
### 来源与对齐声明
- 主来源：`docs/prototype-current.md`（或项目稳定别名）
- 辅来源：`docs/04.CHANGELOG.md`、`docs/archive/ROADMAP-*.md`
- 冲突处理：若与辅来源不一致，一律以原型文档为准
- 追踪约定：本文件编号在其他两份文档中一一映射
```

## 4. 问题/规划/变更/路线
- docs/02.issues.md：问题清单（Bug/体验/风险/待澄清），含模板
- docs/03.backlog.md：未来规划（尚未确认/待评估），含模板
- docs/04.CHANGELOG.md：对外可见变更记录（发布说明/重要修复/特性）
- docs/archive/ROADMAP-*.md：路线图（默认归档）

## 5. 链接与命名规范
- 统一指向稳定别名：所有引用原型时，统一指向 docs/prototype-current.md（或项目既有稳定别名）
- 相对路径：文档间引用使用相对路径，避免断链
- 移动/重命名：同步更新 README.md、docs/00.INDEX.md 与所有交叉引用

## 6. 版本轮转流程（AI 可自动化）
1) 创建新版本：复制上一版原型为 docs/01.prototype-*.md  
2) 更新稳定别名：令其指向新的 01. 文件  
3) 旧版归档：去掉旧文件名中的 01. 并移入 docs/archive/  
4) 校验链接：扫描并确保所有引用仍指向“稳定别名”而非具体版本文件

## 7. AI 助手自愈准则
- 若 README.md 无“文档结构与用途说明”，AI 应自动插入一节，内容等同本规则摘要，含路径与流程
- 若缺少关键文件，AI 应按最小模板自动创建（见上模板）
- 若三件套文件头缺“来源与对齐声明”，AI 应自动补齐
- 若存在对 01.* 的直接引用，AI 应批量替换为“稳定别名”
- 任何自动修改后，按用户“Git提交规则”原子提交

## 8. 团队导航索引（docs/00.INDEX.md）
- 内容应列出：
  - 原型（稳定别名）、CHANGELOG、ROADMAP（归档）、Issues、Backlog
  - `/.kiro/specs/<topic-slug>/` 下的三件套路径
  - 重要约定（禁止移动 `.kiro/specs/`、同步更新链接等）

---

# 按规则检查当前仓库的结论与建议

基于当前仓库路径（示例，仅报告与修正点）：

- 已符合
  - docs/ 结构齐全：00.INDEX.md、01.prototype-v3-interface.md、02.issues.md、03.backlog.md、04.CHANGELOG.md、archive/ROADMAP-v3.0.md
  - 稳定别名：docs/prototype-v3-interface.md 已存在并指向 01.prototype-v3-interface.md
  - /.kiro/specs/enhanced-rename-interface/ 三件套齐全，且均包含“来源与对齐声明”
  - README.md 已包含“文档结构与用途说明”，与仓库现状基本一致

- 需调整（优先级高 → 低）
  - 统一原型引用到稳定别名：
    - /.kiro/specs/enhanced-rename-interface/design.md 头部引用为 docs/01.prototype-v3-interface.md，建议改为 docs/prototype-v3-interface.md（与 requirements.md、tasks.md 保持一致，避免换版时批量改动）
  - 可选增强：增加通用稳定别名
    - 新增一个轻量别名 docs/prototype-current.md，内容仅指向现有 docs/prototype-v3-interface.md；这样对跨项目自动化脚本更友好，且不破坏现有引用
  - 索引一致性检查：
    - 变更上述引用后，同步快速 grep 校验 01.prototype-*.md 的直接引用是否还存在，若有则替换为稳定别名

- 建议的原子提交示例（供参考）
  - fix: [docs.rules] 统一 design.md 原型引用至稳定别名
  - feat: [docs.rules] 新增通用别名 docs/prototype-current.md 指向现有稳定别名
  - chore: [docs.rules] 清理直接引用 01.prototype-*.md 的链接并对齐索引
