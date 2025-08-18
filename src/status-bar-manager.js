/**
 * StatusBarManager - 状态栏管理器
 * 
 * 功能：
 * - 实时显示总数/选中/成功/失败与当前处理文件
 * - 批量执行/撤销的进度条与完成总结
 */

class StatusBarManager {
  constructor() {
    this.elements = {};
    this.init();
  }
  
  init() {
    console.log('📊 [StatusBarManager] 初始化状态栏管理器');
    
    // 获取状态栏元素
    this.elements = {
      total: document.getElementById('status-total'),
      selected: document.getElementById('status-selected'),
      changed: document.getElementById('status-changed'),
      conflicts: document.getElementById('status-conflicts'),
      invalid: document.getElementById('status-invalid'),
      progress: document.getElementById('status-progress'),
      progressContainer: document.getElementById('status-progress-container'),
      progressBar: document.getElementById('status-progress-bar'),
      progressText: document.getElementById('status-progress-text'),
      info: document.getElementById('status-info')
    };
    
    // 检查元素是否存在
    const missingElements = Object.keys(this.elements).filter(key => !this.elements[key]);
    if (missingElements.length > 0) {
      console.warn('⚠️ [StatusBarManager] 缺少状态栏元素:', missingElements);
    }
    
    // 绑定到全局对象
    window.statusBarManager = this;
    window.updateStatusBar = this.updateStatus.bind(this);
    
    // 初始化状态
    this.updateStatus({
      total: 0,
      selected: 0,
      changed: 0,
      conflicts: 0,
      invalid: 0
    });
    
    console.log('✅ [StatusBarManager] 状态栏管理器初始化完成');
  }
  
  /**
   * 更新状态信息
   */
  updateStatus(stats) {
    const {
      total = 0,
      displayed = total,
      selected = 0,
      changed = 0,
      conflicts = 0,
      invalid = 0,
      processing = false,
      currentFile = '',
      info = '',
      filtered = false
    } = stats;
    
    // 更新总数
    if (this.elements.total) {
      if (filtered && displayed !== total) {
        this.elements.total.textContent = `总计: ${displayed}/${total} 个文件`;
      } else {
        this.elements.total.textContent = `总计: ${total} 个文件`;
      }
    }
    
    // 更新选中数
    if (this.elements.selected) {
      this.elements.selected.textContent = `已选: ${selected} 个`;
      this.elements.selected.style.display = selected > 0 ? '' : 'none';
    }
    
    // 更新变更数
    if (this.elements.changed) {
      this.elements.changed.textContent = `将变更: ${changed} 个`;
      this.elements.changed.style.display = changed > 0 ? '' : 'none';
    }
    
    // 更新冲突数
    if (this.elements.conflicts) {
      this.elements.conflicts.textContent = `冲突: ${conflicts} 个`;
      this.elements.conflicts.style.display = conflicts > 0 ? '' : 'none';
    }
    
    // 更新非法字符数
    if (this.elements.invalid) {
      this.elements.invalid.textContent = `非法: ${invalid} 个`;
      this.elements.invalid.style.display = invalid > 0 ? '' : 'none';
    }
    
    // 更新进度信息
    if (this.elements.progress) {
      if (processing && currentFile) {
        this.elements.progress.textContent = `正在处理: ${currentFile}`;
        this.elements.progress.style.display = '';
      } else if (processing) {
        this.elements.progress.textContent = '处理中...';
        this.elements.progress.style.display = '';
      } else {
        this.elements.progress.style.display = 'none';
      }
    }
    
    // 更新信息
    if (this.elements.info) {
      if (info) {
        this.elements.info.textContent = info;
      } else if (conflicts > 0 || invalid > 0) {
        this.elements.info.textContent = '存在错误，无法执行重命名';
        this.elements.info.style.color = 'var(--pico-del-color)';
      } else if (changed > 0) {
        this.elements.info.textContent = '准备就绪';
        this.elements.info.style.color = 'var(--pico-primary)';
      } else {
        this.elements.info.textContent = '就绪';
        this.elements.info.style.color = '';
      }
    }
    
    console.log(`📊 [StatusBarManager] 状态更新: 总计${total}, 选中${selected}, 变更${changed}, 冲突${conflicts}, 非法${invalid}`);
  }
  
  /**
   * 从PreviewManager获取统计信息并更新状态栏
   */
  updateFromPreviewManager() {
    if (!window.previewManager) {
      console.warn('⚠️ [StatusBarManager] PreviewManager未初始化');
      return;
    }
    
    const stats = window.previewManager.getPreviewStats();
    const files = window.loadedFiles || [];
    const selectedCount = files.filter(f => f.selected).length;
    
    this.updateStatus({
      total: stats.totalFiles,
      selected: selectedCount,
      changed: stats.changedFiles,
      conflicts: stats.conflictFiles,
      invalid: stats.invalidFiles
    });
  }
  
  /**
   * 从文件列表获取统计信息并更新状态栏
   */
  updateFromFileList() {
    const files = window.loadedFiles || [];
    const selectedCount = files.filter(f => f.selected).length;
    const changedCount = files.filter(f => f.newPath && f.newPath !== f.name).length;
    const conflictCount = files.filter(f => f.hasConflict).length;
    const invalidCount = files.filter(f => f.invalidChar).length;
    
    this.updateStatus({
      total: files.length,
      selected: selectedCount,
      changed: changedCount,
      conflicts: conflictCount,
      invalid: invalidCount
    });
  }
  
  /**
   * 显示进度信息
   */
  showProgress(current, total, currentFile = '') {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const progressText = `${current}/${total} (${percentage}%)`;
    
    // 更新进度条
    if (this.elements.progressBar) {
      this.elements.progressBar.value = percentage;
      this.elements.progressBar.max = 100;
    }
    
    if (this.elements.progressText) {
      this.elements.progressText.textContent = progressText;
    }
    
    // 显示进度容器
    if (this.elements.progressContainer) {
      this.elements.progressContainer.style.display = 'flex';
    }
    
    // 更新当前文件信息
    let infoText = `正在处理: ${currentFile || '准备中...'}`;
    if (current === total && total > 0) {
      infoText = '处理完成';
    }
    
    this.updateStatus({
      processing: true,
      currentFile: currentFile,
      info: infoText
    });
    
    console.log(`📊 [StatusBarManager] 进度更新: ${current}/${total} (${percentage}%) - ${currentFile}`);
  }
  
  /**
   * 隐藏进度信息
   */
  hideProgress() {
    this.updateStatus({
      processing: false,
      currentFile: '',
      info: ''
    });
  }
  
  /**
   * 显示成功信息
   */
  showSuccess(message) {
    this.updateStatus({
      processing: false,
      info: message
    });
    
    if (this.elements.info) {
      this.elements.info.style.color = 'var(--pico-ins-color, #28a745)';
    }
    
    // 3秒后恢复正常状态
    setTimeout(() => {
      this.updateFromFileList();
    }, 3000);
  }
  
  /**
   * 显示错误信息
   */
  showError(message) {
    this.updateStatus({
      processing: false,
      info: message
    });
    
    if (this.elements.info) {
      this.elements.info.style.color = 'var(--pico-del-color)';
    }
    
    // 5秒后恢复正常状态
    setTimeout(() => {
      this.updateFromFileList();
    }, 5000);
  }
  
  /**
   * 重置状态栏
   */
  reset() {
    this.updateStatus({
      total: 0,
      selected: 0,
      changed: 0,
      conflicts: 0,
      invalid: 0,
      processing: false,
      currentFile: '',
      info: '就绪'
    });
  }
}

// 创建全局实例
document.addEventListener('DOMContentLoaded', () => {
  window.statusBarManager = new StatusBarManager();
});

// 导出类（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatusBarManager;
}