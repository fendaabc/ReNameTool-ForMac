/**
 * 历史记录管理器
 * 用于管理文件重命名操作的撤销/重做功能
 */

import { EventBus } from '../../core/event-bus';
import { generateId } from '../../core/utils';

/**
 * 重命名操作接口
 * @typedef {Object} RenameOperation
 * @property {string} id - 操作ID
 * @property {'rename'} type - 操作类型
 * @property {number} timestamp - 时间戳
 * @property {Array<{originalPath: string, newPath: string, status: 'success'|'failed'|'pending', error?: string}>} files - 文件操作列表
 * @property {Object} [metadata] - 其他元数据
 */

/**
 * 历史记录状态
 * @typedef {Object} HistoryState
 * @property {RenameOperation[]} past - 已撤销的操作
 * @property {RenameOperation|null} present - 当前操作
 * @property {RenameOperation[]} future - 可重做的操作
 */

export class HistoryManager {
  /**
   * 创建历史记录管理器
   * @param {number} [maxHistory=100] - 最大历史记录条数
   */
  constructor(maxHistory = 100) {
    /** @type {number} 最大历史记录条数 */
    this.maxHistory = maxHistory;
    
    /** @type {HistoryState} 历史记录状态 */
    this.state = {
      past: [],
      present: null,
      future: []
    };
    
    /** @type {EventBus} 事件总线 */
    this.eventBus = new EventBus();
  }
  
  /**
   * 添加新操作
   * @param {Omit<RenameOperation, 'id'|'timestamp'>} operation - 操作数据
   * @returns {RenameOperation} 添加的操作
   */
  addOperation(operation) {
    // 创建带有ID和时间戳的新操作
    const newOperation = {
      ...operation,
      id: generateId(),
      timestamp: Date.now()
    };
    
    // 更新状态：将当前操作移到历史记录，清空重做栈
    this.state = {
      past: this.state.present 
        ? [...this.state.past, this.state.present].slice(-this.maxHistory) 
        : this.state.past,
      present: newOperation,
      future: []
    };
    
    // 通知订阅者
    this.notify();
    
    return newOperation;
  }
  
  /**
   * 撤销上一次操作
   * @returns {RenameOperation|null} 被撤销的操作，如果没有可撤销的操作则返回null
   */
  undo() {
    if (!this.canUndo()) return null;
    
    // 从历史记录中取出最后一个操作
    const previous = this.state.past[this.state.past.length - 1];
    const newPast = this.state.past.slice(0, -1);
    
    // 更新状态：将当前操作移到重做栈
    this.state = {
      past: newPast,
      present: previous,
      future: [this.state.present, ...this.state.future]
    };
    
    this.notify();
    return previous;
  }
  
  /**
   * 重做上一次撤销的操作
   * @returns {RenameOperation|null} 被重做的操作，如果没有可重做的操作则返回null
   */
  redo() {
    if (!this.canRedo()) return null;
    
    // 从重做栈中取出第一个操作
    const next = this.state.future[0];
    const newFuture = this.state.future.slice(1);
    
    // 更新状态：将重做的操作设为当前操作
    this.state = {
      past: [...this.state.past, this.state.present],
      present: next,
      future: newFuture
    };
    
    this.notify();
    return next;
  }
  
  /**
   * 检查是否可以撤销
   * @returns {boolean} 是否可以撤销
   */
  canUndo() {
    return this.state.past.length > 0;
  }
  
  /**
   * 检查是否可以重做
   * @returns {boolean} 是否可以重做
   */
  canRedo() {
    return this.state.future.length > 0;
  }
  
  /**
   * 清空历史记录
   */
  clear() {
    this.state = {
      past: [],
      present: null,
      future: []
    };
    this.notify();
  }
  
  /**
   * 获取当前状态
   * @returns {HistoryState} 当前状态
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * 订阅状态变化
   * @param {(state: HistoryState) => void} listener - 状态变化回调
   * @returns {() => void} 取消订阅的函数
   */
  subscribe(listener) {
    // 立即调用一次以获取初始状态
    listener(this.getState());
    
    // 订阅状态变化
    const unsubscribe = this.eventBus.on('change', () => {
      listener(this.getState());
    });
    
    // 返回取消订阅的函数
    return () => {
      unsubscribe();
    };
  }
  
  /**
   * 通知所有订阅者
   * @private
   */
  notify() {
    this.eventBus.emit('change', this.state);
  }
}

// 单例模式导出
let historyManager = null;

/**
 * 获取历史记录管理器实例
 * @param {number} [maxHistory=100] - 最大历史记录条数
 * @returns {HistoryManager} 历史记录管理器实例
 */
export function getHistoryManager(maxHistory = 100) {
  if (!historyManager) {
    historyManager = new HistoryManager(maxHistory);
  }
  return historyManager;
}

// 导出类型定义
export const TYPES = {
  RENAME: 'rename'
};
