# 撤销/重做功能实现方案

## 功能概述

实现文件的撤销重做功能，允许用户撤销或重做最近的文件重命名操作。

## 技术方案

### 1. 数据结构

```typescript
interface RenameOperation {
  id: string;           // 操作ID
  type: 'rename';       // 操作类型
  timestamp: number;    // 时间戳
  files: Array<{
    originalPath: string;  // 原始文件路径
    newPath: string;       // 新文件路径
    status: 'success' | 'failed' | 'pending'; // 操作状态
    error?: string;        // 错误信息
  }>;
  metadata?: Record<string, any>; // 其他元数据
}

interface HistoryState {
  past: RenameOperation[];    // 已撤销的操作
  present: RenameOperation | null; // 当前操作
  future: RenameOperation[];  // 可重做的操作
}
```

### 2. 核心接口

```typescript
interface HistoryManager {
  // 添加新操作
  addOperation(operation: Omit<RenameOperation, 'id' | 'timestamp'>): void;
  
  // 撤销操作
  undo(): RenameOperation | null;
  
  // 重做操作
  redo(): RenameOperation | null;
  
  // 检查是否可以撤销
  canUndo(): boolean;
  
  // 检查是否可以重做
  canRedo(): boolean;
  
  // 清空历史记录
  clear(): void;
  
  // 获取当前状态
  getState(): HistoryState;
  
  // 订阅状态变化
  subscribe(listener: (state: HistoryState) => void): () => void;
}
```

### 3. 实现步骤

#### 3.1 创建历史记录管理器

```javascript
// src/features/rename/history-manager.js
import { generateId } from '../../core/utils';
import { EventBus } from '../../core/event-bus';

export class HistoryManager {
  constructor(maxHistory = 100) {
    this.maxHistory = maxHistory;
    this.state = {
      past: [],
      present: null,
      future: []
    };
    
    this.eventBus = new EventBus();
  }
  
  addOperation(operation) {
    const newOperation = {
      ...operation,
      id: generateId(),
      timestamp: Date.now()
    };
    
    this.state = {
      past: this.state.present ? [...this.state.past, this.state.present].slice(-this.maxHistory) : [],
      present: newOperation,
      future: [] // 清空重做栈
    };
    
    this.notify();
    return newOperation;
  }
  
  undo() {
    if (!this.canUndo()) return null;
    
    const previous = this.state.past[this.state.past.length - 1];
    const newPast = this.state.past.slice(0, -1);
    
    this.state = {
      past: newPast,
      present: previous,
      future: [this.state.present, ...this.state.future]
    };
    
    this.notify();
    return previous;
  }
  
  redo() {
    if (!this.canRedo()) return null;
    
    const next = this.state.future[0];
    const newFuture = this.state.future.slice(1);
    
    this.state = {
      past: [...this.state.past, this.state.present],
      present: next,
      future: newFuture
    };
    
    this.notify();
    return next;
  }
  
  canUndo() {
    return this.state.past.length > 0;
  }
  
  canRedo() {
    return this.state.future.length > 0;
  }
  
  clear() {
    this.state = {
      past: [],
      present: null,
      future: []
    };
    this.notify();
  }
  
  getState() {
    return this.state;
  }
  
  subscribe(listener) {
    return this.eventBus.on('change', () => {
      listener(this.getState());
    });
  }
  
  notify() {
    this.eventBus.emit('change', this.state);
  }
}

// 单例模式导出
let historyManager = null;

export function getHistoryManager(maxHistory = 100) {
  if (!historyManager) {
    historyManager = new HistoryManager(maxHistory);
  }
  return historyManager;
}
```

#### 3.2 集成到重命名服务

```javascript
// src/features/rename/rename-service.js
import { getHistoryManager } from './history-manager';
import { invoke } from '@tauri-apps/api/tauri';

export class RenameService {
  constructor() {
    this.history = getHistoryManager();
  }
  
  async renameFiles(files, options) {
    try {
      // 调用后端重命名API
      const result = await invoke('batch_rename', { files, options });
      
      // 记录操作历史
      const operation = {
        type: 'rename',
        files: result.map(item => ({
          originalPath: item.original_path,
          newPath: item.new_path,
          status: item.status,
          error: item.error
        })),
        metadata: {
          options,
          timestamp: new Date().toISOString()
        }
      };
      
      this.history.addOperation(operation);
      
      return result;
    } catch (error) {
      console.error('重命名失败:', error);
      throw error;
    }
  }
  
  async undoLastRename() {
    const operation = this.history.undo();
    if (!operation) return null;
    
    try {
      // 撤销操作：将文件从newPath改回originalPath
      const files = operation.files.map(file => ({
        original_path: file.newPath,
        new_path: file.originalPath
      }));
      
      return await invoke('batch_rename', { files });
    } catch (error) {
      console.error('撤销重命名失败:', error);
      throw error;
    }
  }
  
  canUndo() {
    return this.history.canUndo();
  }
  
  canRedo() {
    return this.history.canRedo();
  }
}

// 单例模式导出
let renameService = null;

export function getRenameService() {
  if (!renameService) {
    renameService = new RenameService();
  }
  return renameService;
}
```

#### 3.3 集成到UI组件

```javascript
// src/features/rename/rename-controller.js
import { getRenameService } from './rename-service';
import { EventBus, EVENTS } from '../../core/event-bus';

export class RenameController {
  constructor() {
    this.renameService = getRenameService();
    this.eventBus = EventBus.getInstance();
    
    // 绑定快捷键
    this.bindShortcuts();
  }
  
  bindShortcuts() {
    // 监听键盘事件
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z 撤销
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      
      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        this.redo();
      }
    });
  }
  
  async renameFiles(files, options) {
    try {
      const result = await this.renameService.renameFiles(files, options);
      this.eventBus.emit(EVENTS.RENAME_COMPLETE, { result });
      return result;
    } catch (error) {
      this.eventBus.emit(EVENTS.RENAME_ERROR, { error });
      throw error;
    }
  }
  
  async undo() {
    if (!this.canUndo()) return;
    
    try {
      const result = await this.renameService.undoLastRename();
      this.eventBus.emit(EVENTS.UNDO_COMPLETE, { result });
      return result;
    } catch (error) {
      this.eventBus.emit(EVENTS.UNDO_ERROR, { error });
      throw error;
    }
  }
  
  redo() {
    // TODO: 实现重做功能
    console.log('Redo not implemented yet');
  }
  
  canUndo() {
    return this.renameService.canUndo();
  }
  
  canRedo() {
    return this.renameService.canRedo();
  }
}
```

## 4. 前端集成

### 4.1 更新UI组件

```jsx
// src/components/controls/UndoRedoButtons.jsx
import { useEffect, useState } from 'react';
import { getRenameService } from '../../features/rename/rename-service';

export function UndoRedoButtons() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  useEffect(() => {
    const service = getRenameService();
    
    // 初始状态
    setCanUndo(service.canUndo());
    setCanRedo(service.canRedo());
    
    // 订阅状态变化
    const unsubscribe = service.history.subscribe(() => {
      setCanUndo(service.canUndo());
      setCanRedo(service.canRedo());
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleUndo = () => {
    const controller = new RenameController();
    controller.undo();
  };
  
  const handleRedo = () => {
    const controller = new RenameController();
    controller.redo();
  };
  
  return (
    <div className="undo-redo-buttons">
      <button 
        onClick={handleUndo} 
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
      >
        撤销
      </button>
      <button 
        onClick={handleRedo} 
        disabled={!canRedo}
        title="重做 (Ctrl+Shift+Z 或 Ctrl+Y)"
      >
        重做
      </button>
    </div>
  );
}
```

## 5. 后端实现

```rust
// src-tauri/src/commands.rs

#[tauri::command]
pub async fn batch_rename(
    files: Vec<RenameFile>,
    options: RenameOptions,
) -> Result<Vec<RenameResult>, String> {
    let mut results = Vec::with_capacity(files.len());
    
    for file in files {
        let result = match rename_file(&file, &options).await {
            Ok(_) => RenameResult {
                original_path: file.original_path,
                new_path: file.new_path,
                status: "success".to_string(),
                error: None,
            },
            Err(e) => RenameResult {
                original_path: file.original_path,
                new_path: file.new_path,
                status: "failed".to_string(),
                error: Some(e.to_string()),
            },
        };
        
        results.push(result);
    }
    
    // 记录操作历史
    if let Err(e) = record_operation(&results, &options).await {
        eprintln!("Failed to record operation: {}", e);
    }
    
    Ok(results)
}

async fn record_operation(
    results: &[RenameResult],
    options: &RenameOptions,
) -> std::io::Result<()> {
    let operation = RenameOperation {
        id: Uuid::new_v4().to_string(),
        timestamp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64,
        files: results
            .iter()
            .map(|r| RenameOperationFile {
                original_path: r.original_path.clone(),
                new_path: r.new_path.clone(),
                status: r.status.clone(),
                error: r.error.clone(),
            })
            .collect(),
        options: options.clone(),
    };
    
    // 保存到数据库或文件系统
    save_operation(operation).await
}
```

## 6. 测试计划

### 6.1 单元测试

```javascript
// tests/features/rename/history-manager.test.js
import { HistoryManager } from '../../../src/features/rename/history-manager';

describe('HistoryManager', () => {
  let history;
  
  beforeEach(() => {
    history = new HistoryManager(10);
  });
  
  it('should add operation to history', () => {
    const operation = {
      type: 'rename',
      files: [{ originalPath: 'a.txt', newPath: 'b.txt', status: 'success' }]
    };
    
    history.addOperation(operation);
    
    const state = history.getState();
    expect(state.present).toBeDefined();
    expect(state.present.type).toBe('rename');
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
  });
  
  it('should undo and redo operations', () => {
    const op1 = { type: 'rename', files: [{ originalPath: 'a.txt', newPath: 'b.txt', status: 'success' }] };
    const op2 = { type: 'rename', files: [{ originalPath: 'b.txt', newPath: 'c.txt', status: 'success' }] };
    
    history.addOperation(op1);
    history.addOperation(op2);
    
    // 撤销第二个操作
    const undoneOp = history.undo();
    expect(undoneOp).toBeDefined();
    expect(history.canRedo()).toBe(true);
    
    // 重做
    const redoneOp = history.redo();
    expect(redoneOp).toBeDefined();
    expect(history.canUndo()).toBe(true);
  });
});
```

### 6.2 集成测试

```javascript
// tests/features/rename/rename-service.test.js
import { getRenameService } from '../../../src/features/rename/rename-service';
import { invoke } from '@tauri-apps/api/tauri';

// Mock Tauri invoke
jest.mock('@tauri-apps/api/tauri');

describe('RenameService', () => {
  let service;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = getRenameService();
  });
  
  it('should rename files and add to history', async () => {
    const mockResult = [
      { original_path: 'a.txt', new_path: 'b.txt', status: 'success', error: null }
    ];
    
    invoke.mockResolvedValue(mockResult);
    
    const files = [{ originalPath: 'a.txt', newPath: 'b.txt' }];
    const options = { overwrite: false };
    
    const result = await service.renameFiles(files, options);
    
    expect(invoke).toHaveBeenCalledWith('batch_rename', { files, options });
    expect(result).toEqual(mockResult);
    expect(service.canUndo()).toBe(true);
  });
  
  it('should undo last rename operation', async () => {
    const mockResult = [
      { original_path: 'b.txt', new_path: 'a.txt', status: 'success', error: null }
    ];
    
    invoke.mockResolvedValue(mockResult);
    
    // 先添加一个操作
    const files = [{ originalPath: 'a.txt', newPath: 'b.txt' }];
    await service.renameFiles(files, {});
    
    // 撤销操作
    const result = await service.undoLastRename();
    
    expect(invoke).toHaveBeenCalledWith('batch_rename', {
      files: [{ original_path: 'b.txt', new_path: 'a.txt' }]
    });
    expect(result).toEqual(mockResult);
  });
});
```

## 7. 性能考虑

1. **内存使用**：
   - 限制历史记录条数（默认100条）
   - 只存储必要的操作数据
   - 考虑使用不可变数据结构优化性能

2. **磁盘空间**：
   - 压缩存储历史记录
   - 定期清理过期的历史记录

3. **响应时间**：
   - 批量操作时使用防抖
   - 异步保存历史记录，不阻塞主线程

## 8. 安全考虑

1. **文件路径验证**：
   - 验证所有文件路径，防止目录遍历攻击
   - 限制操作的文件类型和大小

2. **权限控制**：
   - 检查文件读写权限
   - 提示用户确认敏感操作

3. **数据保护**：
   - 加密存储敏感信息
   - 不记录文件内容，只记录元数据

## 9. 后续优化

1. **操作分组**：将多个相关操作合并为一个可撤销组
2. **冲突解决**：处理文件冲突情况
3. **批量撤销**：支持一次撤销多个操作
4. **可视化历史**：显示操作历史时间线
5. **云同步**：跨设备同步操作历史
