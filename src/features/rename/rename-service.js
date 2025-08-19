/**
 * 重命名服务
 * 处理文件重命名操作，包括撤销/重做功能
 */

import { getHistoryManager } from './history-manager';
import { invoke } from '@tauri-apps/api/tauri';

/**
 * 重命名选项
 * @typedef {Object} RenameOptions
 * @property {boolean} [overwrite=false] - 是否覆盖已存在的文件
 * @property {boolean} [skipOnError=false] - 出错时是否跳过
 * @property {Object} [rule] - 重命名规则
 */

/**
 * 重命名结果
 * @typedef {Object} RenameResult
 * @property {string} originalPath - 原始文件路径
 * @property {string} newPath - 新文件路径
 * @property {'success'|'failed'|'pending'} status - 操作状态
 * @property {string} [error] - 错误信息（如果有）
 */

export class RenameService {
  constructor() {
    /** @type {import('./history-manager').HistoryManager} */
    this.history = getHistoryManager();
  }
  
  /**
   * 批量重命名文件
   * @param {Array<{originalPath: string, newPath: string}>} files - 文件列表
   * @param {RenameOptions} [options={}] - 重命名选项
   * @returns {Promise<RenameResult[]>} 重命名结果
   */
  async renameFiles(files, options = {}) {
    try {
      // 调用 Tauri 后端执行重命名
      const results = await invoke('batch_rename', { 
        files,
        options: {
          overwrite: options.overwrite || false,
          skip_on_error: options.skipOnError || false,
          rule: options.rule || {}
        }
      });
      
      // 记录操作历史
      const operation = {
        type: 'rename',
        files: results.map(result => ({
          originalPath: result.original_path,
          newPath: result.new_path,
          status: result.status,
          error: result.error
        })),
        metadata: {
          options,
          timestamp: new Date().toISOString()
        }
      };
      
      this.history.addOperation(operation);
      
      return results;
    } catch (error) {
      console.error('重命名失败:', error);
      throw error;
    }
  }
  
  /**
   * 撤销上一次重命名操作
   * @returns {Promise<RenameResult[]|null>} 撤销操作的结果，如果没有可撤销的操作则返回null
   */
  async undoLastRename() {
    if (!this.canUndo()) return null;
    
    try {
      // 获取上一次操作
      const operation = this.history.undo();
      if (!operation) return null;
      
      // 构建反向操作：将文件从newPath改回originalPath
      const files = operation.files.map(file => ({
        original_path: file.newPath,
        new_path: file.originalPath
      }));
      
      // 执行反向操作
      const results = await invoke('batch_rename', { 
        files,
        options: {
          overwrite: true, // 撤销操作时强制覆盖
          skip_on_error: false
        }
      });
      
      return results;
    } catch (error) {
      console.error('撤销重命名失败:', error);
      throw error;
    }
  }
  
  /**
   * 重做上一次撤销的操作
   * @returns {Promise<RenameResult[]|null>} 重做操作的结果，如果没有可重做的操作则返回null
   */
  async redoLastRename() {
    if (!this.canRedo()) return null;
    
    try {
      // 获取重做操作
      const operation = this.history.redo();
      if (!operation) return null;
      
      // 执行重做操作
      const files = operation.files.map(file => ({
        original_path: file.originalPath,
        new_path: file.newPath
      }));
      
      const results = await invoke('batch_rename', { 
        files,
        options: {
          overwrite: true, // 重做操作时强制覆盖
          skip_on_error: false
        }
      });
      
      return results;
    } catch (error) {
      console.error('重做重命名失败:', error);
      throw error;
    }
  }
  
  /**
   * 检查是否可以撤销
   * @returns {boolean} 是否可以撤销
   */
  canUndo() {
    return this.history.canUndo();
  }
  
  /**
   * 检查是否可以重做
   * @returns {boolean} 是否可以重做
   */
  canRedo() {
    return this.history.canRedo();
  }
  
  /**
   * 获取历史记录状态
   * @returns {import('./history-manager').HistoryState} 历史记录状态
   */
  getHistoryState() {
    return this.history.getState();
  }
  
  /**
   * 订阅历史记录变化
   * @param {(state: import('./history-manager').HistoryState) => void} listener - 状态变化回调
   * @returns {() => void} 取消订阅的函数
   */
  subscribeToHistoryChanges(listener) {
    return this.history.subscribe(listener);
  }
  
  /**
   * 清空历史记录
   */
  clearHistory() {
    this.history.clear();
  }
}

// 单例模式导出
let renameService = null;

/**
 * 获取重命名服务实例
 * @returns {RenameService} 重命名服务实例
 */
export function getRenameService() {
  if (!renameService) {
    renameService = new RenameService();
  }
  return renameService;
}

// 导出类型定义
export const STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending'
};
