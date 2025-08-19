import { eventBus, EVENTS } from './event-bus';

/**
 * 状态管理模块
 * 提供响应式状态管理和状态持久化功能
 */
class StateManager {
  constructor() {
    this.state = new Map();
    this.subscriptions = new Map();
    this.persistKeys = new Set();
    this.initialized = false;
  }

  /**
   * 初始化状态管理器
   * @param {Object} initialState 初始状态
   * @param {Array} persistKeys 需要持久化的状态键名数组
   */
  init(initialState = {}, persistKeys = []) {
    if (this.initialized) {
      console.warn('[StateManager] 已经初始化过状态管理器');
      return;
    }

    // 设置需要持久化的键
    this.persistKeys = new Set(persistKeys);
    
    // 从本地存储加载持久化状态
    const persistedState = this.loadPersistedState();
    
    // 合并初始状态和持久化状态
    const mergedState = {
      ...initialState,
      ...persistedState
    };

    // 初始化状态
    Object.entries(mergedState).forEach(([key, value]) => {
      this.state.set(key, value);
    });

    this.initialized = true;
    console.log('[StateManager] 状态管理器初始化完成');
  }

  /**
   * 从本地存储加载持久化状态
   * @returns {Object} 持久化的状态对象
   */
  loadPersistedState() {
    try {
      const persisted = localStorage.getItem('app_state');
      return persisted ? JSON.parse(persisted) : {};
    } catch (error) {
      console.error('[StateManager] 加载持久化状态失败:', error);
      return {};
    }
  }

  /**
   * 保存状态到本地存储
   */
  savePersistedState() {
    try {
      const stateToPersist = {};
      this.persistKeys.forEach(key => {
        if (this.state.has(key)) {
          stateToPersist[key] = this.state.get(key);
        }
      });
      localStorage.setItem('app_state', JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('[StateManager] 保存持久化状态失败:', error);
    }
  }

  /**
   * 获取状态值
   * @param {string} key 状态键名
   * @param {*} defaultValue 默认值
   * @returns {*} 状态值
   */
  get(key, defaultValue = null) {
    if (!this.initialized) {
      console.warn(`[StateManager] 尝试在初始化前获取状态: ${key}`);
      return defaultValue;
    }
    return this.state.has(key) ? this.state.get(key) : defaultValue;
  }

  /**
   * 设置状态值
   * @param {string} key 状态键名
   * @param {*} value 新值
   * @param {boolean} silent 是否静默更新（不触发事件）
   */
  set(key, value, silent = false) {
    if (!this.initialized) {
      console.warn(`[StateManager] 尝试在初始化前设置状态: ${key}`);
      return;
    }

    const oldValue = this.state.get(key);
    
    // 如果值没有变化，直接返回
    if (JSON.stringify(oldValue) === JSON.stringify(value)) {
      return;
    }

    // 更新状态
    this.state.set(key, value);

    // 如果需要持久化，保存到本地存储
    if (this.persistKeys.has(key)) {
      this.savePersistedState();
    }

    // 触发状态变更事件
    if (!silent) {
      this.notify(key, value, oldValue);
      eventBus.emit(EVENTS.STATE_CHANGED, { key, value, oldValue });
    }
  }

  /**
   * 批量更新状态
   * @param {Object} updates 要更新的状态键值对
   * @param {boolean} silent 是否静默更新
   */
  batchUpdate(updates, silent = false) {
    if (!this.initialized) {
      console.warn('[StateManager] 尝试在初始化前批量更新状态');
      return;
    }

    const changes = [];
    let shouldSave = false;

    // 应用所有更新
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = this.state.get(key);
      
      // 如果值没有变化，跳过
      if (JSON.stringify(oldValue) === JSON.stringify(value)) {
        return;
      }

      // 更新状态
      this.state.set(key, value);
      changes.push({ key, value, oldValue });

      // 检查是否需要保存到本地存储
      if (this.persistKeys.has(key)) {
        shouldSave = true;
      }
    });

    // 如果需要，保存到本地存储
    if (shouldSave) {
      this.savePersistedState();
    }

    // 触发状态变更事件
    if (!silent && changes.length > 0) {
      changes.forEach(({ key, value, oldValue }) => {
        this.notify(key, value, oldValue);
      });
      eventBus.emit(EVENTS.STATE_BATCH_UPDATED, changes);
    }
  }

  /**
   * 订阅状态变更
   * @param {string} key 状态键名
   * @param {Function} callback 回调函数
   * @returns {Function} 取消订阅函数
   */
  subscribe(key, callback) {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    const subscribers = this.subscriptions.get(key);
    subscribers.add(callback);

    // 返回取消订阅函数
    return () => {
      if (this.subscriptions.has(key)) {
        const subscribers = this.subscriptions.get(key);
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscriptions.delete(key);
        }
      }
    };
  }

  /**
   * 通知订阅者状态变更
   * @param {string} key 状态键名
   * @param {*} newValue 新值
   * @param {*} oldValue 旧值
   */
  notify(key, newValue, oldValue) {
    if (this.subscriptions.has(key)) {
      const subscribers = this.subscriptions.get(key);
      subscribers.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`[StateManager] 状态变更回调执行出错 (${key}):`, error);
        }
      });
    }
  }

  /**
   * 重置状态
   * @param {Object} newState 新状态
   * @param {boolean} silent 是否静默更新
   */
  reset(newState = {}, silent = false) {
    const oldState = Object.fromEntries(this.state.entries());
    this.state = new Map(Object.entries(newState));
    
    // 保存持久化状态
    this.savePersistedState();
    
    // 触发重置事件
    if (!silent) {
      eventBus.emit(EVENTS.STATE_RESET, { newState, oldState });
    }
  }

  /**
   * 清空所有状态
   * @param {boolean} silent 是否静默更新
   */
  clear(silent = false) {
    const oldState = Object.fromEntries(this.state.entries());
    this.state.clear();
    
    // 清空持久化状态
    localStorage.removeItem('app_state');
    
    // 触发清空事件
    if (!silent) {
      eventBus.emit(EVENTS.STATE_CLEARED, { oldState });
    }
  }
}

// 导出单例实例
export const stateManager = new StateManager();

export default stateManager;
