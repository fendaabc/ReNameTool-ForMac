/**
 * 搜索和过滤管理器
 * 负责文件列表的搜索、过滤和排序功能
 */

class SearchFilterManager {
  constructor() {
    this.searchQuery = '';
    this.selectedExtension = '';
    this.filteredFiles = [];
    this.isActive = false;
    
    // DOM元素
    this.searchInput = null;
    this.extensionFilter = null;
    this.clearButton = null;
    this.searchSection = null;
    
    // 防抖定时器
    this.searchDebounceTimer = null;
    
    this.init();
  }
  
  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initElements());
    } else {
      this.initElements();
    }
  }
  
  initElements() {
    this.searchInput = document.getElementById('search-input');
    this.extensionFilter = document.getElementById('extension-filter');
    this.clearButton = document.getElementById('clear-search');
    this.searchSection = document.getElementById('search-filter-section');
    
    if (!this.searchInput || !this.extensionFilter || !this.clearButton) {
      console.warn('⚠️ [SearchFilterManager] 搜索过滤元素未找到，稍后重试');
      setTimeout(() => this.initElements(), 500);
      return;
    }
    
    this.bindEvents();
    console.log('✅ [SearchFilterManager] 初始化完成');
  }
  
  bindEvents() {
    // 搜索输入框 - 使用防抖
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.applyFilters();
      }, 300);
    });
    
    // 扩展名过滤器
    this.extensionFilter.addEventListener('change', (e) => {
      this.selectedExtension = e.target.value;
      this.applyFilters();
    });
    
    // 清除按钮
    this.clearButton.addEventListener('click', () => {
      this.clearFilters();
    });
    
    // 键盘快捷键支持
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearFilters();
        this.searchInput.blur();
      }
    });
  }
  
  /**
   * 显示搜索过滤区域
   */
  show() {
    if (this.searchSection) {
      this.searchSection.style.display = 'block';
      this.updateExtensionOptions();
    }
  }
  
  /**
   * 隐藏搜索过滤区域
   */
  hide() {
    if (this.searchSection) {
      this.searchSection.style.display = 'none';
      this.clearFilters();
    }
  }
  
  /**
   * 更新扩展名选项
   */
  updateExtensionOptions() {
    if (!this.extensionFilter || !window.loadedFiles) return;
    
    // 获取所有唯一的扩展名
    const extensions = new Set();
    window.loadedFiles.forEach(file => {
      if (file.extension && file.extension.trim()) {
        extensions.add(file.extension.toLowerCase());
      }
    });
    
    // 清空现有选项（保留"所有类型"）
    this.extensionFilter.innerHTML = '<option value="">所有类型</option>';
    
    // 添加扩展名选项
    const sortedExtensions = Array.from(extensions).sort();
    sortedExtensions.forEach(ext => {
      const option = document.createElement('option');
      option.value = ext;
      option.textContent = `.${ext}`;
      this.extensionFilter.appendChild(option);
    });
    
    console.log(`📋 [SearchFilterManager] 更新扩展名选项: ${sortedExtensions.length} 种类型`);
  }
  
  /**
   * 应用搜索和过滤条件
   */
  applyFilters() {
    if (!window.loadedFiles) {
      this.filteredFiles = [];
      return;
    }
    
    const hasSearchQuery = this.searchQuery.length > 0;
    const hasExtensionFilter = this.selectedExtension.length > 0;
    
    // 如果没有任何过滤条件，显示所有文件
    if (!hasSearchQuery && !hasExtensionFilter) {
      this.filteredFiles = [...window.loadedFiles];
      this.isActive = false;
    } else {
      this.isActive = true;
      this.filteredFiles = window.loadedFiles.filter(file => {
        // 搜索条件：文件名或扩展名包含关键词
        let matchesSearch = true;
        if (hasSearchQuery) {
          const fileName = file.name.toLowerCase();
          const fileExt = (file.extension || '').toLowerCase();
          matchesSearch = fileName.includes(this.searchQuery) || 
                         fileExt.includes(this.searchQuery);
        }
        
        // 扩展名过滤条件
        let matchesExtension = true;
        if (hasExtensionFilter) {
          const fileExt = (file.extension || '').toLowerCase();
          matchesExtension = fileExt === this.selectedExtension;
        }
        
        return matchesSearch && matchesExtension;
      });
    }
    
    // 更新文件表格显示
    this.updateFileTable();
    
    // 更新状态栏
    this.updateStatusBar();
    
    // 更新预览
    if (typeof window.updatePreview === 'function') {
      window.updatePreview();
    }
    
    console.log(`🔍 [SearchFilterManager] 过滤结果: ${this.filteredFiles.length}/${window.loadedFiles.length} 个文件`);
  }
  
  /**
   * 清除所有过滤条件
   */
  clearFilters() {
    this.searchQuery = '';
    this.selectedExtension = '';
    
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    
    if (this.extensionFilter) {
      this.extensionFilter.value = '';
    }
    
    this.applyFilters();
    
    // 公告给屏幕阅读器
    if (typeof window.announceToScreenReader === 'function') {
      window.announceToScreenReader('已清除所有搜索和过滤条件');
    }
  }
  
  /**
   * 获取当前显示的文件列表
   */
  getDisplayedFiles() {
    return this.isActive ? this.filteredFiles : (window.loadedFiles || []);
  }
  
  /**
   * 检查是否有活动的过滤条件
   */
  hasActiveFilters() {
    return this.isActive;
  }
  
  /**
   * 更新文件表格显示
   */
  updateFileTable() {
    // 调用主文件管理器的更新函数
    if (typeof window.updateFileTable === 'function') {
      window.updateFileTable();
    }
  }
  
  /**
   * 更新状态栏
   */
  updateStatusBar() {
    if (typeof window.updateStatusBar === 'function') {
      const displayedFiles = this.getDisplayedFiles();
      const selectedCount = displayedFiles.filter(f => f.selected).length;
      const totalCount = window.loadedFiles ? window.loadedFiles.length : 0;
      
      window.updateStatusBar({
        total: totalCount,
        displayed: displayedFiles.length,
        selected: selectedCount,
        filtered: this.isActive
      });
    }
  }
  
  /**
   * 当文件列表更新时调用此方法
   */
  onFilesUpdated() {
    // 重新应用过滤条件
    this.updateExtensionOptions();
    this.applyFilters();
    
    // 如果没有文件，隐藏搜索区域
    if (!window.loadedFiles || window.loadedFiles.length === 0) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * 获取搜索统计信息
   */
  getSearchStats() {
    const totalFiles = window.loadedFiles ? window.loadedFiles.length : 0;
    const displayedFiles = this.getDisplayedFiles().length;
    const hiddenFiles = totalFiles - displayedFiles;
    
    return {
      total: totalFiles,
      displayed: displayedFiles,
      hidden: hiddenFiles,
      hasFilters: this.isActive,
      searchQuery: this.searchQuery,
      selectedExtension: this.selectedExtension
    };
  }
}

// 创建全局实例
window.searchFilterManager = new SearchFilterManager();

// 暴露到全局作用域供其他模块使用
window.SearchFilterManager = SearchFilterManager;

console.log('📋 [SearchFilterManager] 模块已加载');