/**
 * PreviewManager - 预览与冲突/非法检测管理器
 * 
 * 功能：
 * - 去抖动（100–300ms）与分批渲染，1万文件保持交互
 * - 冲突检测（目标名重复）、非法字符高亮与修复建议
 * - 冲突时禁用"开始重命名"并在工具栏提示原因
 */

class PreviewManager {
  constructor() {
    this.debounceTimer = null;
    this.debounceDelay = 200; // 200ms防抖
    this.batchSize = 100; // 每批处理100个文件
    this.renderToken = 0; // 渲染令牌，用于取消过期渲染
    this.conflictFiles = new Set(); // 冲突文件索引
    this.invalidFiles = new Set(); // 非法字符文件索引
    this.lastPreviewResults = []; // 缓存上次预览结果
    
    // 非法字符正则表达式（Windows + macOS）
    this.invalidCharsRegex = /[<>:"/\\|?*\x00-\x1f]/;
    this.reservedNames = new Set([
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ]);
    
    this.init();
  }
  
  init() {
    console.log('🔄 [PreviewManager] 初始化预览管理器');
    
    // 绑定到全局对象
    window.previewManager = this;
    
    // 监听窗口大小变化，重新计算虚拟滚动
    window.addEventListener('resize', this.debounce(() => {
      this.updateVirtualScroll();
    }, 100));
  }
  
  /**
   * 防抖函数
   */
  debounce(func, delay) {
    return (...args) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
  /**
   * 更新预览（主入口，带防抖）
   */
  updatePreview() {
    console.log('🔄 [PreviewManager] 触发预览更新');
    
    // 清除之前的防抖定时器
    clearTimeout(this.debounceTimer);
    
    // 设置新的防抖定时器
    this.debounceTimer = setTimeout(() => {
      this.performPreviewUpdate();
    }, this.debounceDelay);
  }
  
  /**
   * 执行预览更新（实际处理逻辑）
   */
  async performPreviewUpdate() {
    const currentToken = ++this.renderToken;
    console.log('🔄 [PreviewManager] 开始预览更新，token:', currentToken);
    
    try {
      // 获取当前文件列表
      const files = window.loadedFiles || [];
      if (files.length === 0) {
        console.log('🔄 [PreviewManager] 没有文件，跳过预览');
        this.clearPreview();
        this.updateActionButtons(true, '没有文件');
        return;
      }
      
      // 性能监控
      const startTime = performance.now();
      
      // 获取当前规则
      const ruleData = this.getCurrentRuleData();
      if (!ruleData) {
        console.log('🔄 [PreviewManager] 没有有效规则，跳过预览');
        this.clearPreview();
        return;
      }
      
      console.log('🔄 [PreviewManager] 当前规则:', ruleData);
      
      // 分批处理预览
      const previewResults = await this.processPreviewInBatches(files, ruleData, currentToken);
      
      // 检查是否被新的渲染任务取消
      if (this.renderToken !== currentToken) {
        console.log('🔄 [PreviewManager] 预览被新任务取消，token:', currentToken);
        return;
      }
      
      // 检测冲突和非法字符
      this.detectConflictsAndInvalidChars(previewResults);
      
      // 更新UI
      this.updatePreviewUI(previewResults);
      
      // 更新操作按钮状态
      const hasConflicts = this.conflictFiles.size > 0;
      const hasInvalid = this.invalidFiles.size > 0;
      const hasErrors = hasConflicts || hasInvalid;
      
      let errorMessage = '';
      if (hasConflicts && hasInvalid) {
        errorMessage = `存在 ${this.conflictFiles.size} 个冲突和 ${this.invalidFiles.size} 个非法字符`;
      } else if (hasConflicts) {
        errorMessage = `存在 ${this.conflictFiles.size} 个重名冲突`;
      } else if (hasInvalid) {
        errorMessage = `存在 ${this.invalidFiles.size} 个非法字符`;
      }
      
      this.updateActionButtons(hasErrors, errorMessage);
      
      // 性能监控
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`🔄 [PreviewManager] 预览更新完成，耗时: ${duration.toFixed(2)}ms`);
      
      // 如果处理时间过长，给出警告
      if (duration > 1000) {
        console.warn(`⚠️ [PreviewManager] 预览更新耗时过长: ${duration.toFixed(2)}ms，建议优化`);
      }
      
    } catch (error) {
      console.error('❌ [PreviewManager] 预览更新失败:', error);
      this.updateActionButtons(true, '预览生成失败');
    }
  }
  
  /**
   * 分批处理预览
   */
  async processPreviewInBatches(files, ruleData, token) {
    const results = [];
    const totalBatches = Math.ceil(files.length / this.batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      // 检查是否被取消
      if (this.renderToken !== token) {
        throw new Error('Preview cancelled');
      }
      
      const start = i * this.batchSize;
      const end = Math.min(start + this.batchSize, files.length);
      const batch = files.slice(start, end);
      
      console.log(`🔄 [PreviewManager] 处理批次 ${i + 1}/${totalBatches} (${start}-${end})`);
      
      // 处理当前批次
      const batchResults = batch.map((file, index) => {
        const globalIndex = start + index;
        const newName = this.applyRule(file.name, ruleData, globalIndex, files);
        
        return {
          index: globalIndex,
          originalName: file.name,
          newName: newName,
          hasConflict: false, // 稍后检测
          hasInvalidChars: false, // 稍后检测
          errorMessage: null
        };
      });
      
      results.push(...batchResults);
      
      // 让出控制权，保持UI响应性
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }
  
  /**
   * 应用重命名规则
   */
  applyRule(originalName, ruleData, index, allFiles) {
    const { type } = ruleData;
    
    try {
      switch (type) {
        case 'replace':
          return this.applyReplaceRule(originalName, ruleData);
        case 'sequence':
          return this.applySequenceRule(originalName, ruleData, index, allFiles);
        case 'slice':
          return this.applySliceRule(originalName, ruleData);
        case 'case':
          return this.applyCaseRule(originalName, ruleData);
        case 'extension':
          return this.applyExtensionRule(originalName, ruleData);
        default:
          return originalName;
      }
    } catch (error) {
      console.error('❌ [PreviewManager] 规则应用失败:', error);
      return originalName;
    }
  }
  
  /**
   * 应用查找替换规则
   */
  applyReplaceRule(name, ruleData) {
    const { find, replace, regex, caseSensitive } = ruleData;
    
    if (!find) return name;
    
    try {
      if (regex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regexObj = new RegExp(find, flags);
        return name.replace(regexObj, replace || '');
      } else {
        const searchValue = caseSensitive ? find : find.toLowerCase();
        const targetName = caseSensitive ? name : name.toLowerCase();
        
        if (targetName.includes(searchValue)) {
          const parts = caseSensitive 
            ? name.split(find)
            : name.split(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'));
          return parts.join(replace || '');
        }
        return name;
      }
    } catch (error) {
      console.error('❌ [PreviewManager] 替换规则错误:', error);
      return name;
    }
  }
  
  /**
   * 应用序列号规则
   */
  applySequenceRule(name, ruleData, index, allFiles) {
    const { start, step, digits, position, order } = ruleData;
    
    // 根据排序顺序计算序列号
    let sequenceIndex = index;
    if (order && order !== 'current') {
      // 这里应该根据指定的排序重新计算索引
      // 为简化，暂时使用当前索引
      sequenceIndex = index;
    }
    
    const sequenceNumber = (start || 1) + sequenceIndex * (step || 1);
    const paddedNumber = sequenceNumber.toString().padStart(digits || 2, '0');
    
    // 分离文件名和扩展名
    const lastDotIndex = name.lastIndexOf('.');
    const baseName = lastDotIndex > 0 ? name.substring(0, lastDotIndex) : name;
    const extension = lastDotIndex > 0 ? name.substring(lastDotIndex) : '';
    
    if (position === 'suffix') {
      return `${baseName}_${paddedNumber}${extension}`;
    } else {
      return `${paddedNumber}_${baseName}${extension}`;
    }
  }
  
  /**
   * 应用切片替换规则
   */
  applySliceRule(name, ruleData) {
    const { start, end, replacement, preserveExtension } = ruleData;
    
    let targetName = name;
    let extension = '';
    
    // 如果保留扩展名，先分离
    if (preserveExtension) {
      const lastDotIndex = name.lastIndexOf('.');
      if (lastDotIndex > 0) {
        targetName = name.substring(0, lastDotIndex);
        extension = name.substring(lastDotIndex);
      }
    }
    
    // 处理负索引
    const startIndex = start < 0 ? Math.max(0, targetName.length + start) : start;
    const endIndex = end === null || end === undefined 
      ? targetName.length 
      : (end < 0 ? Math.max(0, targetName.length + end) : end);
    
    // 验证索引
    if (startIndex >= targetName.length || startIndex < 0) {
      return name; // 无效索引，返回原名
    }
    
    // 执行切片替换
    const before = targetName.substring(0, startIndex);
    const after = targetName.substring(Math.min(endIndex, targetName.length));
    const newName = before + (replacement || '') + after;
    
    return newName + extension;
  }
  
  /**
   * 应用大小写转换规则
   */
  applyCaseRule(name, ruleData) {
    const { caseType, preserveExtension } = ruleData;
    
    let targetName = name;
    let extension = '';
    
    // 如果保留扩展名，先分离
    if (preserveExtension) {
      const lastDotIndex = name.lastIndexOf('.');
      if (lastDotIndex > 0) {
        targetName = name.substring(0, lastDotIndex);
        extension = name.substring(lastDotIndex);
      }
    }
    
    switch (caseType) {
      case 'upper':
        targetName = targetName.toUpperCase();
        break;
      case 'lower':
        targetName = targetName.toLowerCase();
        break;
      case 'title':
        targetName = targetName.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case 'snake':
        targetName = targetName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        break;
      case 'kebab':
        targetName = targetName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        break;
      default:
        return name;
    }
    
    return targetName + extension;
  }
  
  /**
   * 应用扩展名修改规则
   */
  applyExtensionRule(name, ruleData) {
    const { mode, newExtension, forceChange, preserveCase } = ruleData;
    
    const lastDotIndex = name.lastIndexOf('.');
    const baseName = lastDotIndex > 0 ? name.substring(0, lastDotIndex) : name;
    const currentExtension = lastDotIndex > 0 ? name.substring(lastDotIndex + 1) : '';
    
    switch (mode) {
      case 'remove':
        return baseName;
        
      case 'add':
        if (currentExtension && !forceChange) {
          return name; // 已有扩展名且不强制修改
        }
        if (newExtension) {
          const ext = preserveCase ? newExtension : newExtension.toLowerCase();
          return `${baseName}.${ext}`;
        }
        return name;
        
      case 'change':
      default:
        if (newExtension) {
          const ext = preserveCase ? newExtension : newExtension.toLowerCase();
          return `${baseName}.${ext}`;
        }
        return baseName; // 没有新扩展名就移除
    }
  }
  
  /**
   * 检测冲突和非法字符
   */
  detectConflictsAndInvalidChars(previewResults) {
    this.conflictFiles.clear();
    this.invalidFiles.clear();
    
    const nameCount = new Map();
    
    // 统计名称出现次数和检测非法字符
    previewResults.forEach((result, index) => {
      const { newName } = result;
      
      // 检测非法字符
      if (this.hasInvalidChars(newName)) {
        this.invalidFiles.add(index);
        result.hasInvalidChars = true;
        result.errorMessage = this.getInvalidCharsMessage(newName);
      }
      
      // 统计名称出现次数
      const lowerName = newName.toLowerCase();
      nameCount.set(lowerName, (nameCount.get(lowerName) || 0) + 1);
    });
    
    // 标记冲突文件
    previewResults.forEach((result, index) => {
      const lowerName = result.newName.toLowerCase();
      if (nameCount.get(lowerName) > 1) {
        this.conflictFiles.add(index);
        result.hasConflict = true;
        if (!result.errorMessage) {
          result.errorMessage = `与其他文件重名`;
        }
      }
    });
    
    console.log(`🔄 [PreviewManager] 检测到 ${this.conflictFiles.size} 个冲突，${this.invalidFiles.size} 个非法字符`);
    
    // 更新状态栏
    this.updateStatusBar();
  }
  
  /**
   * 检测非法字符
   */
  hasInvalidChars(filename) {
    // 检查非法字符
    if (this.invalidCharsRegex.test(filename)) {
      return true;
    }
    
    // 检查保留名称（Windows）
    const nameWithoutExt = filename.split('.')[0].toUpperCase();
    if (this.reservedNames.has(nameWithoutExt)) {
      return true;
    }
    
    // 检查长度限制
    if (filename.length > 255) {
      return true;
    }
    
    // 检查以点或空格结尾
    if (filename.endsWith('.') || filename.endsWith(' ')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取非法字符错误信息
   */
  getInvalidCharsMessage(filename) {
    const issues = [];
    
    if (this.invalidCharsRegex.test(filename)) {
      const matches = filename.match(this.invalidCharsRegex);
      issues.push(`包含非法字符: ${matches.join(', ')}`);
    }
    
    const nameWithoutExt = filename.split('.')[0].toUpperCase();
    if (this.reservedNames.has(nameWithoutExt)) {
      issues.push(`使用了系统保留名称: ${nameWithoutExt}`);
    }
    
    if (filename.length > 255) {
      issues.push(`文件名过长 (${filename.length} > 255)`);
    }
    
    if (filename.endsWith('.') || filename.endsWith(' ')) {
      issues.push('不能以点或空格结尾');
    }
    
    return issues.join('; ');
  }
  
  /**
   * 更新预览UI
   */
  updatePreviewUI(previewResults) {
    console.log('🔄 [PreviewManager] 更新预览UI');
    
    // 缓存结果
    this.lastPreviewResults = previewResults;
    
    // 更新文件对象
    const files = window.loadedFiles || [];
    previewResults.forEach((result) => {
      if (files[result.index]) {
        files[result.index].newPath = result.newName;
        files[result.index].hasConflict = result.hasConflict;
        files[result.index].invalidChar = result.hasInvalidChars;
      }
    });
    
    // 触发表格重新渲染
    if (typeof window.updateFileTable === 'function') {
      window.updateFileTable();
    } else {
      // 备用方案：直接更新预览列
      this.updatePreviewColumn(previewResults);
    }
  }
  
  /**
   * 更新预览列（备用方案）
   */
  updatePreviewColumn(previewResults) {
    const tableBody = document.getElementById('file-table-body');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr[data-index]');
    
    previewResults.forEach((result) => {
      const row = tableBody.querySelector(`tr[data-index="${result.index}"]`);
      if (!row) return;
      
      const previewCell = row.querySelector('.preview-cell');
      if (!previewCell) return;
      
      // 更新预览内容
      previewCell.textContent = result.newName;
      
      // 更新样式
      previewCell.classList.remove('conflict', 'invalid-char', 'diff-highlight');
      row.classList.remove('file-row-conflict', 'file-row-invalid');
      
      if (result.hasConflict) {
        previewCell.classList.add('conflict');
        row.classList.add('file-row-conflict');
      }
      
      if (result.hasInvalidChars) {
        previewCell.classList.add('invalid-char');
        row.classList.add('file-row-invalid');
      }
      
      // 添加diff高亮动画
      if (result.originalName !== result.newName) {
        previewCell.classList.add('diff-highlight');
        setTimeout(() => {
          previewCell.classList.remove('diff-highlight');
        }, 600);
      }
      
      // 设置错误提示
      if (result.errorMessage) {
        previewCell.title = result.errorMessage;
      } else {
        previewCell.removeAttribute('title');
      }
    });
  }
  
  /**
   * 清空预览
   */
  clearPreview() {
    console.log('🔄 [PreviewManager] 清空预览');
    
    this.conflictFiles.clear();
    this.invalidFiles.clear();
    this.lastPreviewResults = [];
    
    // 清空文件对象的预览数据
    const files = window.loadedFiles || [];
    files.forEach(file => {
      file.newPath = file.name;
      file.hasConflict = false;
      file.invalidChar = false;
    });
    
    // 更新UI
    if (typeof window.updateFileTable === 'function') {
      window.updateFileTable();
    }
    
    this.updateActionButtons(false, '');
    this.updateStatusBar();
  }
  
  /**
   * 获取当前规则数据
   */
  getCurrentRuleData() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return null;
    
    const tabId = activeTab.id.replace('tab-', '');
    
    switch (tabId) {
      case 'replace':
        return this.getReplaceRuleData();
      case 'sequence':
        return this.getSequenceRuleData();
      case 'slice':
        return this.getSliceRuleData();
      case 'case':
        return this.getCaseRuleData();
      case 'extension':
        return this.getExtensionRuleData();
      default:
        return null;
    }
  }
  
  /**
   * 获取查找替换规则数据
   */
  getReplaceRuleData() {
    const find = document.getElementById('find')?.value || '';
    const replace = document.getElementById('replace')?.value || '';
    const regex = document.getElementById('regex-mode')?.checked || false;
    const caseSensitive = document.getElementById('case-sensitive')?.checked || false;
    
    if (!find) return null;
    
    return {
      type: 'replace',
      find,
      replace,
      regex,
      caseSensitive
    };
  }
  
  /**
   * 获取序列号规则数据
   */
  getSequenceRuleData() {
    const start = parseInt(document.getElementById('start')?.value) || 1;
    const step = parseInt(document.getElementById('step')?.value) || 1;
    const digits = parseInt(document.getElementById('digits')?.value) || 2;
    const position = document.querySelector('input[name="position"]:checked')?.value || 'prefix';
    const order = document.getElementById('sequence-order')?.value || 'current';
    
    return {
      type: 'sequence',
      start,
      step,
      digits,
      position,
      order
    };
  }
  
  /**
   * 获取切片替换规则数据
   */
  getSliceRuleData() {
    const start = parseInt(document.getElementById('slice-start')?.value) || 0;
    const endValue = document.getElementById('slice-end')?.value;
    const end = endValue ? parseInt(endValue) : null;
    const replacement = document.getElementById('slice-replacement')?.value || '';
    const preserveExtension = document.getElementById('slice-preserve-extension')?.checked !== false;
    
    return {
      type: 'slice',
      start,
      end,
      replacement,
      preserveExtension
    };
  }
  
  /**
   * 获取大小写规则数据
   */
  getCaseRuleData() {
    const caseType = document.querySelector('#tab-case input[name="caseType"]:checked')?.value;
    const preserveExtension = document.getElementById('case-preserve-extension')?.checked !== false;
    
    if (!caseType) return null;
    
    return {
      type: 'case',
      caseType,
      preserveExtension
    };
  }
  
  /**
   * 获取扩展名规则数据
   */
  getExtensionRuleData() {
    const mode = document.querySelector('input[name="extensionMode"]:checked')?.value || 'change';
    const newExtension = document.getElementById('new-extension')?.value?.trim() || '';
    const forceChange = document.getElementById('ext-force-change')?.checked || false;
    const preserveCase = document.getElementById('ext-case-preserve')?.checked !== false;
    
    // 对于移除模式，不需要新扩展名
    if (mode === 'remove') {
      return {
        type: 'extension',
        mode,
        newExtension: '',
        forceChange,
        preserveCase
      };
    }
    
    // 对于添加和修改模式，需要新扩展名
    if (!newExtension && mode !== 'remove') {
      return null;
    }
    
    return {
      type: 'extension',
      mode,
      newExtension,
      forceChange,
      preserveCase
    };
  }
  
  /**
   * 更新操作按钮状态
   */
  updateActionButtons(disabled, reason) {
    const buttons = [
      document.getElementById('apply-rename'),
      document.getElementById('apply-rename-top')
    ];
    
    buttons.forEach(button => {
      if (!button) return;
      
      button.disabled = disabled;
      
      if (disabled) {
        button.title = reason || '无法执行重命名';
        button.setAttribute('aria-describedby', 'rename-error-reason');
      } else {
        button.title = '开始重命名选中的文件';
        button.removeAttribute('aria-describedby');
      }
    });
    
    // 更新错误提示元素
    let errorElement = document.getElementById('rename-error-reason');
    if (disabled && reason) {
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'rename-error-reason';
        errorElement.className = 'sr-only';
        document.body.appendChild(errorElement);
      }
      errorElement.textContent = reason;
    } else if (errorElement) {
      errorElement.remove();
    }
    
    console.log(`🔄 [PreviewManager] 更新按钮状态: disabled=${disabled}, reason=${reason}`);
  }
  
  /**
   * 更新虚拟滚动
   */
  updateVirtualScroll() {
    if (typeof window.updateFileTable === 'function') {
      window.updateFileTable();
    } else if (window.virtualScrollManager) {
      window.virtualScrollManager.render();
    }
  }
  
  /**
   * 检查是否需要启用虚拟滚动
   */
  shouldUseVirtualScroll() {
    const files = window.loadedFiles || [];
    return files.length > 1000; // 超过1000个文件启用虚拟滚动
  }
  
  /**
   * 获取预览统计信息
   */
  getPreviewStats() {
    const files = window.loadedFiles || [];
    const totalFiles = files.length;
    const changedFiles = this.lastPreviewResults.filter(r => r.originalName !== r.newName).length;
    const conflictFiles = this.conflictFiles.size;
    const invalidFiles = this.invalidFiles.size;
    
    return {
      totalFiles,
      changedFiles,
      conflictFiles,
      invalidFiles,
      hasErrors: conflictFiles > 0 || invalidFiles > 0
    };
  }
  
  /**
   * 更新状态栏
   */
  updateStatusBar() {
    if (window.statusBarManager) {
      window.statusBarManager.updateFromPreviewManager();
    }
  }
  
  /**
   * 获取修复建议
   */
  getFixSuggestions() {
    const suggestions = [];
    
    if (this.conflictFiles.size > 0) {
      suggestions.push({
        type: 'conflict',
        message: `发现 ${this.conflictFiles.size} 个重名冲突`,
        suggestion: '建议添加序列号或修改替换规则以避免重名'
      });
    }
    
    if (this.invalidFiles.size > 0) {
      suggestions.push({
        type: 'invalid',
        message: `发现 ${this.invalidFiles.size} 个非法字符`,
        suggestion: '建议移除或替换非法字符：< > : " / \\ | ? *'
      });
    }
    
    return suggestions;
  }
  
  /**
   * 自动修复非法字符
   */
  autoFixInvalidChars() {
    const files = window.loadedFiles || [];
    let fixedCount = 0;
    
    this.lastPreviewResults.forEach((result, index) => {
      if (result.hasInvalidChars && files[index]) {
        // 自动替换非法字符
        const fixedName = result.newName
          .replace(/[<>:"/\\|?*]/g, '_')  // 替换非法字符为下划线
          .replace(/\s+/g, ' ')           // 合并多个空格
          .replace(/^\.+|\.+$/g, '')      // 移除开头和结尾的点
          .trim();                        // 移除首尾空格
        
        if (fixedName !== result.newName) {
          result.newName = fixedName;
          result.hasInvalidChars = false;
          result.errorMessage = null;
          fixedCount++;
        }
      }
    });
    
    if (fixedCount > 0) {
      console.log(`🔧 [PreviewManager] 自动修复了 ${fixedCount} 个非法字符`);
      this.detectConflictsAndInvalidChars(this.lastPreviewResults);
      this.updatePreviewUI(this.lastPreviewResults);
    }
    
    return fixedCount;
  }
  
  /**
   * 导出预览结果
   */
  exportPreviewResults() {
    const results = this.lastPreviewResults.map(result => ({
      originalName: result.originalName,
      newName: result.newName,
      hasConflict: result.hasConflict,
      hasInvalidChars: result.hasInvalidChars,
      errorMessage: result.errorMessage
    }));
    
    return {
      timestamp: new Date().toISOString(),
      totalFiles: results.length,
      changedFiles: results.filter(r => r.originalName !== r.newName).length,
      conflictFiles: results.filter(r => r.hasConflict).length,
      invalidFiles: results.filter(r => r.hasInvalidChars).length,
      results: results
    };
  }
}

// 创建全局实例
window.previewManager = new PreviewManager();

// 导出类（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PreviewManager;
}