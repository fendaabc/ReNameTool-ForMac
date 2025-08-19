import { getRenameController, RENAME_EVENTS as EVENTS } from '../rename/rename-controller';

/**
 * UndoRedoController - 管理撤销/重做按钮状态的控制器
 */
class UndoRedoController {
  constructor() {
    this.undoBtn = document.getElementById('undo-btn');
    this.redoBtn = document.getElementById('redo-btn');
    this.renameController = getRenameController();
    
    this.init();
  }

  /**
   * 初始化控制器
   */
  init() {
    if (!this.undoBtn || !this.redoBtn) {
      console.warn('Undo/Redo buttons not found in the DOM');
      return;
    }

    // 添加事件监听器
    this.undoBtn.addEventListener('click', () => this.handleUndo());
    this.redoBtn.addEventListener('click', () => this.handleRedo());

    // 订阅历史记录变化
    this.unsubscribe = this.renameController.on(EVENTS.HISTORY_CHANGED, () => {
      this.updateButtonStates();
    });

    // 初始状态
    this.updateButtonStates();
  }

  /**
   * 处理撤销操作
   */
  async handleUndo() {
    if (this.undoBtn.disabled) return;
    
    try {
      this.setButtonsDisabled(true);
      await this.renameController.undo();
    } catch (error) {
      console.error('Undo failed:', error);
    } finally {
      this.updateButtonStates();
    }
  }

  /**
   * 处理重做操作
   */
  async handleRedo() {
    if (this.redoBtn.disabled) return;
    
    try {
      this.setButtonsDisabled(true);
      await this.renameController.redo();
    } catch (error) {
      console.error('Redo failed:', error);
    } finally {
      this.updateButtonStates();
    }
  }

  /**
   * 更新按钮状态
   */
  updateButtonStates() {
    if (!this.undoBtn || !this.redoBtn) return;
    
    const canUndo = this.renameController.canUndo();
    const canRedo = this.renameController.canRedo();
    
    this.undoBtn.disabled = !canUndo;
    this.redoBtn.disabled = !canRedo;
    
    // 更新标题提示
    const history = this.renameController.getHistoryState();
    const undoCount = history.past.length;
    const redoCount = history.future.length;
    
    this.undoBtn.title = canUndo ? `撤销 (${undoCount} 个操作)` : '撤销';
    this.redoBtn.title = canRedo ? `重做 (${redoCount} 个操作)` : '重做';
  }

  /**
   * 设置按钮禁用状态
   */
  setButtonsDisabled(disabled) {
    if (this.undoBtn) this.undoBtn.disabled = disabled;
    if (this.redoBtn) this.redoBtn.disabled = disabled;
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    if (this.undoBtn) {
      this.undoBtn.removeEventListener('click', this.handleUndo);
    }
    
    if (this.redoBtn) {
      this.redoBtn.removeEventListener('click', this.handleRedo);
    }
  }
}

// 导出单例
let instance = null;

export function getUndoRedoController() {
  if (!instance) {
    instance = new UndoRedoController();
  }
  return instance;
}

export default getUndoRedoController();
