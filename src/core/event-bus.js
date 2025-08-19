/**
 * 事件总线 - 用于模块间通信
 * 采用发布/订阅模式，支持同步和异步事件处理
 */
class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} callback 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    const listeners = this.events.get(eventName);
    listeners.add(callback);
    
    // 返回取消订阅函数
    return () => this.off(eventName, callback);
  }

  /**
   * 取消订阅
   * @param {string} eventName 事件名称
   * @param {Function} callback 要移除的回调函数
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) return;
    const listeners = this.events.get(eventName);
    listeners.delete(callback);
    if (listeners.size === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * 触发事件（同步）
   * @param {string} eventName 事件名称
   * @param  {...any} args 事件参数
   */
  emit(eventName, ...args) {
    if (!this.events.has(eventName)) return;
    const listeners = this.events.get(eventName);
    for (const callback of listeners) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`[EventBus] Error in ${eventName} handler:`, error);
      }
    }
  }

  /**
   * 触发事件（异步）
   * @param {string} eventName 事件名称
   * @param  {...any} args 事件参数
   * @returns {Promise<Array>} 所有处理结果的Promise
   */
  async emitAsync(eventName, ...args) {
    if (!this.events.has(eventName)) return [];
    const listeners = this.events.get(eventName);
    const results = [];
    
    for (const callback of listeners) {
      try {
        const result = await callback(...args);
        results.push({ success: true, result });
      } catch (error) {
        console.error(`[EventBus] Async error in ${eventName} handler:`, error);
        results.push({ success: false, error });
      }
    }
    
    return results;
  }

  /**
   * 一次性事件监听
   * @param {string} eventName 事件名称
   * @returns {Promise} 当事件触发时解析的Promise
   */
  once(eventName) {
    return new Promise((resolve) => {
      const unsubscribe = this.on(eventName, (...args) => {
        unsubscribe();
        resolve(args.length === 1 ? args[0] : args);
      });
    });
  }

  /**
   * 清除所有事件监听器
   * @param {string} [eventName] 可选，指定要清除的事件名称
   */
  clear(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }
}

// 导出单例实例
export const eventBus = new EventBus();

// 常用事件常量
export const EVENTS = {
  // 文件相关
  FILES_LOADED: 'files:loaded',
  FILES_UPDATED: 'files:updated',
  FILE_SELECTED: 'file:selected',
  
  // 重命名相关
  RENAME_STARTED: 'rename:started',
  RENAME_COMPLETED: 'rename:completed',
  RENAME_FAILED: 'rename:failed',
  UNDO_RENAME: 'rename:undo',
  
  // UI 状态
  UI_LOADING: 'ui:loading',
  UI_ERROR: 'ui:error',
  
  // 规则变更
  RULE_CHANGED: 'rule:changed',
  RULE_ADDED: 'rule:added',
  RULE_REMOVED: 'rule:removed',
  
  // 预览
  PREVIEW_UPDATED: 'preview:updated'
};

export default eventBus;
