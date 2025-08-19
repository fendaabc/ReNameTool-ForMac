/**
 * 重命名控制器
 * 处理重命名相关的UI交互和事件绑定
 */

import { getRenameService } from './rename-service';
import { EventBus } from '../../core/event-bus';

// 事件常量
export const EVENTS = {
  RENAME_START: 'rename:start',
  RENAME_COMPLETE: 'rename:complete',
  RENAME_ERROR: 'rename:error',
  UNDO_START: 'undo:start',
  UNDO_COMPLETE: 'undo:complete',
  UNDO_ERROR: 'undo:error',
  REDO_START: 'redo:start',
  REDO_COMPLETE: 'redo:complete',
  REDO_ERROR: 'redo:error',
  HISTORY_CHANGED: 'history:changed'
};

export class RenameController {
  constructor() {
    /** @type {import('./rename-service').RenameService} */
    this.renameService = getRenameService();
    
    /** @type {EventBus} */
    this.eventBus = EventBus.getInstance();
    
    // 绑定快捷键
    this.bindShortcuts();
    
    // 订阅历史记录变化
    this.unsubscribeHistory = this.renameService.subscribeToHistoryChanges((state) => {
      this.eventBus.emit(EVENTS.HISTORY_CHANGED, { state });
    });
  }
  
  /**
   * 绑定键盘快捷键
   * @private
   */
  bindShortcuts() {
    // 使用事件委托处理键盘事件
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  /**
   * 处理键盘事件
   * @param {KeyboardEvent} event - 键盘事件
   * @private
   */
  handleKeyDown(event) {
    // 忽略在输入框中的按键
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
      return;
    }
    
    // Ctrl+Z 撤销
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    }
    
    // Ctrl+Shift+Z 或 Ctrl+Y 重做
    if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || (event.ctrlKey && event.key === 'y')) {
      event.preventDefault();
      this.redo();
    }
  }
  
  /**
   * 批量重命名文件
   * @param {Array<{originalPath: string, newPath: string}>} files - 文件列表
   * @param {Object} [options={}] - 重命名选项
   * @returns {Promise<void>}
   */
  async renameFiles(files, options = {}) {
    if (!files || !files.length) return;
    
    try {
      this.eventBus.emit(EVENTS.RENAME_START, { files, options });
      
      const results = await this.renameService.renameFiles(files, options);
      
      this.eventBus.emit(EVENTS.RENAME_COMPLETE, { 
        files: results,
        options 
      });
      
      return results;
    } catch (error) {
      console.error('重命名失败:', error);
      this.eventBus.emit(EVENTS.RENAME_ERROR, { 
        error,
        files,
        options 
      });
      throw error;
    }
  }
  
  /**
   * 撤销上一次操作
   * @returns {Promise<void>}
   */
  async undo() {
    if (!this.canUndo()) return;
    
    try {
      this.eventBus.emit(EVENTS.UNDO_START);
      
      const results = await this.renameService.undoLastRename();
      
      if (results) {
        this.eventBus.emit(EVENTS.UNDO_COMPLETE, { results });
      }
      
      return results;
    } catch (error) {
      console.error('撤销失败:', error);
      this.eventBus.emit(EVENTS.UNDO_ERROR, { error });
      throw error;
    }
  }
  
  /**
   * 重做上一次撤销的操作
   * @returns {Promise<void>}
   */
  async redo() {
    if (!this.canRedo()) return;
    
    try {
      this.eventBus.emit(EVENTS.REDO_START);
      
      const results = await this.renameService.redoLastRename();
      
      if (results) {
        this.eventBus.emit(EVENTS.REDO_COMPLETE, { results });
      }
      
      return results;
    } catch (error) {
      console.error('重做失败:', error);
      this.eventBus.emit(EVENTS.REDO_ERROR, { error });
      throw error;
    }
  }
  
  /**
   * 检查是否可以撤销
   * @returns {boolean} 是否可以撤销
   */
  canUndo() {
    return this.renameService.canUndo();
  }
  
  /**
   * 检查是否可以重做
   * @returns {boolean} 是否可以重做
   */
  canRedo() {
    return this.renameService.canRedo();
  }
  
  /**
   * 获取历史记录状态
   * @returns {import('./history-manager').HistoryState} 历史记录状态
   */
  getHistoryState() {
    return this.renameService.getHistoryState();
  }
  
  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅的函数
   */
  on(event, callback) {
    return this.eventBus.on(event, callback);
  }
  
  /**
   * 取消订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    this.eventBus.off(event, callback);
  }
  
  /**
   * 销毁控制器，清理资源
   */
  destroy() {
    // 取消事件监听
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // 取消历史记录订阅
    if (this.unsubscribeHistory) {
      this.unsubscribeHistory();
    }
    
    // 清空事件监听
    this.eventBus.removeAllListeners();
  }
}

// 单例模式导出
let renameController = null;

/**
 * 获取重命名控制器实例
 * @returns {RenameController} 重命名控制器实例
 */
export function getRenameController() {
  if (!renameController) {
    renameController = new RenameController();
  }
  return renameController;
}

// 导出事件常量
export { EVENTS as RENAME_EVENTS };
