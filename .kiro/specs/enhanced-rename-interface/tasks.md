# 实现计划

### 来源与对齐声明

 - 主来源：`docs/prototype-v3-interface.md`（UI/交互/功能的最终依据）
 - 辅来源：`docs/04.CHANGELOG.md` 与 `docs/archive/ROADMAP-v3.0.md`（用于补充阶段目标、性能指标与技术约束）
 - 冲突处理：若与辅来源不一致，一律以原型文档为准
 - 追踪约定：本文件任务项与 `requirements.md` 的需求编号、`design.md` 的设计项一一映射

- [ ] 1. 构建基础布局骨架（Toolbar/Sidebar/RulePanel/Preview/StatusBar）

  - 实现顶部工具栏：标题与图标、开始重命名、清空列表、主题切换、全局设置入口
  - 左侧文件列表与右侧规则配置两栏布局，底部状态栏常驻
  - 响应式与窄屏兼容处理
  - 需求: 1, 3, 7, 9, 11
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

 - [x] 22. 文档结构与链接维护（稳定别名方案）

   - 建立 `docs/prototype-v3-interface.md` 稳定别名
   - 更新 `README.md` 与 `docs/00.INDEX.md` 指向该别名
   - 更新模板链接：`docs/02.issues.md`、`docs/03.backlog.md`、本 `tasks.md` 的来源声明
   - 约定：后续版本切换时仅需更新别名指向，避免全仓链接替换
   - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 2. 文件导入与元数据加载（FileImport 模块）

  - 支持拖拽/对话框/目录导入，去重与非法路径拦截
  - 加载文件名、扩展名、大小、修改时间等元数据
  - 大量文件批量增量渲染与进度反馈
  - 需求: 1, 2, 11, 12
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 3. 文件列表（FileList）与虚拟滚动

  - 支持单选/多选、排序（名称/大小/时间/扩展）、上下文菜单与移除
  - 实现虚拟滚动（>1000行启用），批量局部刷新与diff高亮
  - 键盘快捷键（全选/删除/上移下移）与可访问性处理
  - 需求: 1, 7, 8, 12
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 4. 规则配置-查找替换（ReplaceRule）

  - 参数：find/replace、regex、case_sensitive；输入校验与提示
  - 即时预览触发与高亮变化区域
  - 需求: 3, 4, 13
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 5. 规则配置-序列号（SequenceRule）

  - 参数：start/step/width/order；示例与预览
  - 与文件排序联动，支持按当前排序生成序号
  - 需求: 3, 4, 13
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 6. 规则配置-切片替换（SliceRule）

  - 参数：start/end/replacement；负索引与边界校验
  - 预览错误提示：超界、空替换策略
  - 需求: 3, 4, 13
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 7. 规则配置-大小写转换（CaseRule）

  - 模式：upper/lower/title/snake/kebab；示例与预览
  - 与扩展名处理的边界说明（只改名主体/含扩展可选）
  - 需求: 3, 4, 13
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 8. 规则配置-扩展名修改（ExtensionRule）

  - 参数：new_extension/keep_original；空扩展与多点扩展处理
  - 预览与与CaseRule叠加顺序说明
  - 需求: 3, 4, 13
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 9. 预览与冲突/非法检测（PreviewManager）

  - 去抖动（100–300ms）与分批渲染，1万文件保持交互
  - 冲突检测（目标名重复）、非法字符高亮与修复建议
  - 冲突时禁用“开始重命名”并在工具栏提示原因
  - 需求: 4, 9, 10, 12, 13
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 10. 操作区与流程控制（ActionControls）

  - “开始重命名”启用/禁用逻辑、二次确认与摘要
  - “清空列表”清理列表/规则/预览/统计
  - 快捷键与可访问性（焦点管理、ARIA）
  - 需求: 5, 7, 9, 11
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 11. 状态栏（StatusBar）与进度/统计

  - 实时显示总数/选中/成功/失败与当前处理文件
  - 批量执行/撤销的进度条与完成总结
  - 需求: 5, 6, 11
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 12. 主题与外观一致性（Pico.css 定制）

  - 主题切换与持久化（localStorage）
  - radio/checkbox/switch 可见选中与聚焦样式，焦点可达
  - 窄屏适配与布局不溢出
  - 需求: 7, 9, 10
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 13. 过滤与搜索

  - 关键字搜索实时过滤；文件类型过滤器；按大小/修改时间排序
  - 空结果提示与清除条件恢复
  - 需求: 8
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 14. Rust 后端：规则枚举与预览接口

  - 定义 `RenameRule`（tagged enum）：Replace/Sequence/Slice/Case/Extension，serde 序列化
  - 实现 `preview_rename(files, rule)` 纯函数式预览；各规则算法与单元测试
  - 参数校验与错误分类（4xx/5xx）
  - 需求: 13, 12
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 15. Rust 后端：批量执行与两阶段改名

  - `execute_rename_batch(ops)`：临时名两阶段、并发与权限/路径校验、结果统计与 `operation_id`
  - 冲突失败策略：默认失败并上报；（自动追加序号进入 v3.x 配置）
  - 集成测试：预览-执行一致性与回滚
  - 需求: 5, 12
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 16. Rust 后端：单批次撤销接口

  - `undo_rename(operation_id)` 反向应用；边界：跨重启/状态漂移提示限制
  - 若仅前端快照可用，前端提供兜底撤销并展示限制文案
  - 需求: 6, 14
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 17. Tauri 通信与参数校验

  - 前端桥接 `preview_rename`、`execute_rename_batch`、`undo_rename` 调用，加入参数验证
  - 错误映射与用户提示；进度事件（可选）
  - 需求: 5, 11, 12, 14
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 18. 性能基线与调优

  - 预览耗时基准（目标<100ms/1万文件，分批渲染）；虚拟列表阈值调参
  - 内存占用观测与优化（空闲<50MB/常规<200MB）
  - 需求: 12
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 19. 端到端测试与验收清单

  - 场景：导入→配置规则→预览→执行→撤销→统计与日志
  - 覆盖失败路径：权限、名字冲突、非法字符、长路径
  - 需求: 1, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 20. 跨平台验证（Windows/macOS）

  - Windows：保留字、大小写不敏感、路径长度限制与分隔符
  - macOS：权限与沙箱、HFS/APFS 特性
  - 需求: 12
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容

- [ ] 21. 文档与用户指引

  - 更新 README/内置帮助：规则说明、示例、冲突策略、撤销限制与后续规划
  - 原型与实现的差异记录与已知限制列表
  - 需求: 7, 9, 10, 14
  - 完成后提交git 的commit，暂时先不push，写清楚commit内容
