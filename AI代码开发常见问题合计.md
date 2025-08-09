# AI代码开发常见问题合计

## 1. 前后端数据模型字段名不匹配

### 问题描述

前端 JavaScript 代码通过 Tauri 的 `invoke` 方法调用 Rust 后端命令时，传递的数据模型字段名与后端 Rust 结构体定义的字段名不一致，导致后端无法正确反序列化数据，从而引发“invalid args: missing field”等错误。

### 问题原因

1.  **命名约定不一致：** 前端可能使用驼峰命名法（camelCase），而后端 Rust 代码（尤其是在 `serde` 序列化/反序列化时）可能默认使用蛇形命名法（snake_case），或者在结构体上使用了 `#[serde(rename_all = "camelCase")]` 等属性，但内部某些字段未正确遵循或被手动覆盖。
2.  **`serde` 标签使用不当：** 对于 Rust 枚举类型，如果使用了 `#[serde(tag = "type")]`，前端在传递数据时必须包含一个名为 `type` 的字段，其值对应枚举的变体名称。

### 解决方案

1.  **统一命名约定：** 确保前端和后端在数据模型字段命名上保持一致。如果 Rust 后端使用了 `#[serde(rename_all = "camelCase")]`，则前端也应使用驼峰命名法；如果后端使用蛇形命名法，前端也应遵循。
2.  **检查 `type` 字段：** 对于 Rust 枚举类型，如果后端使用了 `#[serde(tag = "type")]`，前端在构建参数时必须显式添加 `type` 字段。
3.  **严格比对结构体：** 在前端调用后端命令时，务必对照后端 Rust 结构体的定义，确保所有字段名、类型和嵌套结构都完全匹配。

### 示例 (已解决的 `execute_rename` 问题)

**原始问题：**

*   前端 `src/main.js` 中 `executeRename` 函数构建 `ruleData` 时，缺少 `type` 字段。
*   前端 `src/main.js` 中 `executeRename` 函数构建 `backendRule` 时，`case` 规则的 `caseType` 字段与后端 `RenameRule::Case` 结构体中的 `case_type` 字段不匹配。

**解决方案：**

*   在 `src/main.js` 的 `setupButtonEvents` 函数中，为 `ruleData` 添加 `type` 字段。
*   在 `src/main.js` 的 `executeRename` 函数中，将 `backendRule` 的 `caseType` 字段更正为 `case_type`。

## 2. 前后端命令不一致或未实现

### 问题描述

前端 JavaScript 代码调用了一个名为 `check_file_permission` 的后端命令，但在 Rust 后端代码中未找到对应的 `#[tauri::command]` 定义。

### 问题原因

1.  **后端功能未实现：** 该后端命令可能是一个计划中的功能，但尚未在后端实现。
2.  **命令名称不匹配：** 前端调用的命令名称与后端实际实现的命令名称不一致（例如，后端函数名为 `check_access`）。
3.  **遗留代码：** 该命令可能是旧版本代码中的遗留，在新版本中已被移除或替换，但前端调用未更新。

### 解决方案

1.  **确认功能需求：** 首先确认 `check_file_permission` 功能是否是当前项目所需。如果需要，则在后端实现对应的 `#[tauri::command]`。
2.  **查找实际命令：** 如果功能已在后端实现，但名称不匹配，则需要查找后端实际的命令名称，并更新前端调用。
3.  **移除或替换：** 如果该功能不再需要，则从前端代码中移除相关调用，或替换为其他现有功能。

### 当前状态

`check_file_permission` 命令在前端 `src/main.js` 中被调用 (`invoke('check_file_permission', { path: f });`)，但在 `src-tauri` 目录下未找到其对应的 Rust 后端实现。目前该问题处于未解决状态，需要进一步确认其功能需求和后端实现情况。
