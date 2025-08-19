/**
 * ActionControls - 操作区与流程控制管理器
 * 
 * 功能：
 * - "开始重命名"启用/禁用逻辑、二次确认与摘要
 * - "清空列表"清理列表/规则/预览/统计
 * - 快捷键与可访问性（焦点管理、ARIA）
 */

class ActionControls {
  constructor() {
    this.elements = {};
    this.isProcessing = false;
    this.lastOperationId = null;
    this.confirmationDialog = null;
    this.undoStack = []; // 存储可撤销的操作
    this.maxUndoSteps = 10; // 最大撤销步骤数
    
    this.init();
  }
  
  init() {
    console.log('🎮 [ActionControls] 初始化操作控制器');
    
    // 获取操作按钮元素
    this.elements = {
      applyRename: document.getElementById('apply-rename'),
      applyRenameTop: document.getElementById('apply-rename-top'),
      clearAll: document.getElementById('clear-all'),
      clearAllTop: document.getElementById('clear-all-top'),
      selectAll: document.getElementById('select-all'),
      undoRename: document.getElementById('undo-rename')
    };
    
    // 检查元素是否存在
    const missingElements = Object.keys(this.elements).filter(key => !this.elements[key]);
    if (missingElements.length > 0) {
      console.warn('⚠️ [ActionControls] 缺少操作按钮元素:', missingElements);
    }
    
    // 绑定事件
    this.bindEvents();
    
    // 设置初始状态
    this.updateButtonStates();
    
    // 设置焦点管理
    this.manageFocus();
    
    // 绑定到全局对象
    window.actionControls = this;
    
    console.log('✅ [ActionControls] 操作控制器初始化完成');
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    console.log('🎮 [ActionControls] 绑定操作事件');
    
    // 开始重命名按钮事件
    if (this.elements.applyRename) {
      this.elements.applyRename.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleRenameAction();
      });
    }
    
    // 撤销按钮事件
    if (this.elements.undoRename) {
      this.elements.undoRename.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleUndoAction();
      });
    }
    
    if (this.elements.applyRenameTop) {
      this.elements.applyRenameTop.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleRenameAction();
      });
    }
    
    // 清空列表按钮事件
    if (this.elements.clearAll) {
      this.elements.clearAll.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleClearAction();
      });
    }
    
    if (this.elements.clearAllTop) {
      this.elements.clearAllTop.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleClearAction();
      });
    }
    
    // 全选按钮事件
    if (this.elements.selectAll) {
      this.elements.selectAll.addEventListener('change', (e) => {
        this.handleSelectAllAction(e.target.checked);
      });
    }
    
    // 监听状态变化事件
    document.addEventListener('refresh-apply', () => {
      this.updateButtonStates();
    });
    
    // 键盘快捷键
    this.bindKeyboardShortcuts();
    
    console.log('✅ [ActionControls] 事件绑定完成');
  }
  
  /**
   * 绑定键盘快捷键
   */
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // 避免在输入框中触发
      const isTyping = this.isTypingContext(e.target);
      if (isTyping) return;
      
      // Ctrl+Z / Cmd+Z - 撤销操作
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (this.lastOperationId && !this.isProcessing) {
          this.handleUndoAction();
          this.announceToScreenReader('撤销上次重命名操作');
        }
        return;
      }
      
      // Ctrl+Enter / Cmd+Enter - 开始重命名
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (this.canExecuteRename()) {
          this.handleRenameAction();
          this.announceToScreenReader('快捷键触发重命名操作');
        }
        return;
      }
      
      // Ctrl+Shift+C / Cmd+Shift+C - 清空列表
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        this.handleClearAction();
        this.announceToScreenReader('快捷键触发清空操作');
        return;
      }
      
      // F5 - 刷新预览
      if (e.key === 'F5') {
        e.preventDefault();
        if (window.previewManager) {
          window.previewManager.updatePreview();
          this.announceToScreenReader('刷新预览');
        }
        return;
      }
      
      // Escape - 取消当前操作或关闭对话框
      if (e.key === 'Escape') {
        e.preventDefault();
        this.handleEscapeAction();
        return;
      }
    });
  }
  
  /**
   * 检查是否在输入上下文中
   */
  isTypingContext(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    const isContentEditable = element.isContentEditable;
    
    return isInput || isContentEditable;
  }
  
  /**
   * 处理重命名操作
   */
  async handleRenameAction() {
    console.log('🎮 [ActionControls] 处理重命名操作');
    
    if (this.isProcessing) {
      console.log('⚠️ [ActionControls] 操作正在进行中，忽略重复请求');
      return;
    }
    
    if (!this.canExecuteRename()) {
      console.log('⚠️ [ActionControls] 当前无法执行重命名');
      this.showError('当前无法执行重命名操作');
      return;
    }
    
    try {
      // 获取操作摘要
      const summary = this.getOperationSummary();
      
      // 显示确认对话框
      const confirmed = await this.showConfirmationDialog(summary);
      if (!confirmed) {
        console.log('🎮 [ActionControls] 用户取消了重命名操作');
        return;
      }
      
      // 执行重命名
      await this.executeRename(summary);
      
    } catch (error) {
      console.error('❌ [ActionControls] 重命名操作失败:', error);
      this.showError('重命名操作失败: ' + error.message);
    }
  }
  
  /**
   * 处理撤销操作
   */
  async handleUndoAction() {
    console.log('🎮 [ActionControls] 处理撤销操作');
    
    if (this.isProcessing) {
      console.log('⚠️ [ActionControls] 操作正在进行中，忽略撤销请求');
      return;
    }
    
    if (!this.lastOperationId) {
      console.log('⚠️ [ActionControls] 没有可撤销的操作');
      this.showError('没有可撤销的操作');
      return;
    }
    
    this.isProcessing = true;
    this.updateButtonStates();
    
    try {
      console.log(`🔄 [ActionControls] 正在撤销操作 ID: ${this.lastOperationId}`);
      
      // 调用后端的撤销API
      const result = await window.__TAURI__.invoke('undo_rename', { 
        operationId: this.lastOperationId 
      });
      
      if (result.success) {
        console.log(`✅ [ActionControls] 成功撤销 ${result.restored_count} 个文件`);
        this.showSuccess(`已撤销 ${result.restored_count} 个文件的重命名`);
        
        // 清空操作ID，防止重复撤销
        this.lastOperationId = null;
        
        // 刷新文件列表
        if (window.previewManager) {
          await window.previewManager.refreshFileList();
        }
      } else {
        console.error(`❌ [ActionControls] 撤销失败: ${result.error_message || '未知错误'}`);
        this.showError(`撤销失败: ${result.error_message || '未知错误'}`);
      }
    } catch (error) {
      console.error('❌ [ActionControls] 撤销操作出错:', error);
      this.showError(`撤销操作出错: ${error.message || '未知错误'}`);
    } finally {
      this.isProcessing = false;
      this.updateButtonStates();
    }
  }
  
  /**
   * 处理清空操作
   */
  async handleClearAction() {
    console.log(' [ActionControls] 处理清空操作');
    
    const files = window.loadedFiles || [];
    if (files.length === 0) {
      console.log(' [ActionControls] 没有文件需要清空');
      return;
    }
    
    // 显示确认对话框
    const confirmed = await this.showClearConfirmationDialog(files.length);
    if (!confirmed) {
      console.log(' [ActionControls] 用户取消了清空操作');
      return;
    }
    
    try {
      // 执行清空
      this.executeClear();
      this.showSuccess(`已清空 ${files.length} 个文件`);
      this.announceToScreenReader(`已清空 ${files.length} 个文件`);
      
    } catch (error) {
      console.error('❌ [ActionControls] 清空操作失败:', error);
      this.showError('清空操作失败: ' + error.message);
    }
  }
  
  /**
   * 处理全选操作
   */
  handleSelectAllAction(checked) {
    console.log('🎮 [ActionControls] 处理全选操作:', checked);
    
    const files = window.loadedFiles || [];
    if (files.length === 0) return;
    
    files.forEach(file => {
      file.selected = checked;
    });
    
    // 更新UI
    if (typeof window.updateFileTable === 'function') {
      window.updateFileTable();
    }
    
    // 更新状态栏
    if (window.statusBarManager) {
      window.statusBarManager.updateFromFileList();
    }
    
    const action = checked ? '全选' : '取消全选';
    this.announceToScreenReader(`${action} ${files.length} 个文件`);
  }
  
  /**
   * 处理Escape键操作
   */
  handleEscapeAction() {
    // 关闭确认对话框
    if (this.confirmationDialog && this.confirmationDialog.isVisible) {
      this.confirmationDialog.close();
      return;
    }
    
    // 取消当前处理
    if (this.isProcessing) {
      // 这里可以添加取消处理的逻辑
      console.log('🎮 [ActionControls] 用户请求取消当前操作');
    }
  }
  
  /**
   * 检查是否可以执行重命名
   */
  canExecuteRename() {
    const files = window.loadedFiles || [];
    if (files.length === 0) return false;
    
    const selectedFiles = files.filter(f => f.selected);
    if (selectedFiles.length === 0) return false;
    
    // 检查是否有冲突或非法字符
    if (window.previewManager) {
      const stats = window.previewManager.getPreviewStats();
      if (stats.hasErrors) return false;
    }
    
    // 检查是否有有效的规则
    const ruleData = this.getCurrentRuleData();
    if (!ruleData) return false;
    
    return true;
  }
  
  /**
   * 获取当前规则数据
   */
  getCurrentRuleData() {
    if (window.previewManager) {
      return window.previewManager.getCurrentRuleData();
    }
    return null;
  }
  
  /**
   * 获取操作摘要
   */
  getOperationSummary() {
    const files = window.loadedFiles || [];
    const selectedFiles = files.filter(f => f.selected);
    const changedFiles = selectedFiles.filter(f => f.newPath && f.newPath !== f.name);
    
    const ruleData = this.getCurrentRuleData();
    const ruleType = ruleData ? ruleData.type : '未知';
    
    return {
      totalFiles: files.length,
      selectedFiles: selectedFiles.length,
      changedFiles: changedFiles.length,
      unchangedFiles: selectedFiles.length - changedFiles.length,
      ruleType: ruleType,
      ruleDescription: this.getRuleDescription(ruleData),
      files: selectedFiles.map(f => ({
        originalName: f.name,
        newName: f.newPath || f.name,
        changed: f.newPath && f.newPath !== f.name
      }))
    };
  }
  
  /**
   * 获取规则描述
   */
  getRuleDescription(ruleData) {
    if (!ruleData) return '无规则';
    
    switch (ruleData.type) {
      case 'replace':
        return `查找替换: "${ruleData.find}" → "${ruleData.replace}"`;
      case 'sequence':
        return `添加序列号: 起始${ruleData.start}, 步长${ruleData.step}, ${ruleData.digits}位数`;
      case 'slice':
        return `切片替换: 位置${ruleData.start}-${ruleData.end || '末尾'} → "${ruleData.replacement}"`;
      case 'case':
        return `大小写转换: ${ruleData.caseType}`;
      case 'extension':
        return `扩展名${ruleData.mode}: ${ruleData.newExtension || '移除'}`;
      default:
        return '未知规则';
    }
  }
  
  /**
   * 显示确认对话框
   */
  async showConfirmationDialog(summary) {
    return new Promise((resolve) => {
      // 创建确认对话框
      const dialog = this.createConfirmationDialog(summary, resolve);
      this.confirmationDialog = dialog;
      
      // 显示对话框
      dialog.show();
    });
  }
  
  /**
   * 创建确认对话框
   */
  createConfirmationDialog(summary, callback) {
    // 移除现有对话框
    const existingDialog = document.getElementById('rename-confirmation-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }
    
    // 创建对话框容器
    const overlay = document.createElement('div');
    overlay.id = 'rename-confirmation-dialog';
    overlay.className = 'dialog-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    // 创建对话框内容
    const dialog = document.createElement('div');
    dialog.className = 'dialog-content';
    dialog.style.cssText = `
      background: var(--pico-background-color, #fff);
      border-radius: 12px;
      padding: 2rem;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      margin: 1rem;
    `;
    
    // 对话框HTML内容
    dialog.innerHTML = `
      <h3 style="margin-top: 0; color: var(--pico-primary);">确认重命名操作</h3>
      
      <div class="summary-section">
        <h4>操作摘要</h4>
        <ul>
          <li>总文件数: ${summary.totalFiles}</li>
          <li>选中文件: ${summary.selectedFiles}</li>
          <li>将要重命名: <strong>${summary.changedFiles}</strong></li>
          <li>保持不变: ${summary.unchangedFiles}</li>
        </ul>
        
        <h4>重命名规则</h4>
        <p><strong>${summary.ruleDescription}</strong></p>
      </div>
      
      <div class="file-preview" style="margin: 1.5rem 0;">
        <h4>文件预览 (前10个)</h4>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 6px; padding: 0.5rem;">
          ${summary.files.slice(0, 10).map(f => `
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #eee;">
              <span style="color: ${f.changed ? '#666' : '#999'};">${f.originalName}</span>
              <span style="color: ${f.changed ? 'var(--pico-primary)' : '#999'}; font-weight: ${f.changed ? 'bold' : 'normal'};">
                ${f.changed ? '→ ' + f.newName : '(无变化)'}
              </span>
            </div>
          `).join('')}
          ${summary.files.length > 10 ? `<div style="text-align: center; color: #666; padding: 0.5rem;">... 还有 ${summary.files.length - 10} 个文件</div>` : ''}
        </div>
      </div>
      
      <div class="dialog-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
        <button id="cancel-rename" class="secondary" style="padding: 0.75rem 1.5rem;">取消</button>
        <button id="confirm-rename" class="primary" style="padding: 0.75rem 1.5rem;">确认重命名</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 绑定事件
    const cancelBtn = dialog.querySelector('#cancel-rename');
    const confirmBtn = dialog.querySelector('#confirm-rename');
    
    const close = (result) => {
      overlay.remove();
      this.confirmationDialog = null;
      callback(result);
    };
    
    cancelBtn.addEventListener('click', () => close(false));
    confirmBtn.addEventListener('click', () => close(true));
    
    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close(false);
      }
    });
    
    // 键盘事件
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        close(true);
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    // 设置焦点陷阱
    const cleanupFocusTrap = this.trapFocus(dialog);
    
    return {
      show: () => {
        // 聚焦到确认按钮
        setTimeout(() => {
          confirmBtn.focus();
          this.announceToScreenReader('重命名确认对话框已打开');
        }, 100);
      },
      close: () => {
        cleanupFocusTrap();
        close(false);
      },
      isVisible: true
    };
  }
  
  /**
   * 显示清空确认对话框
   */
  async showClearConfirmationDialog(fileCount) {
    return new Promise((resolve) => {
      const confirmed = confirm(`确定要清空所有 ${fileCount} 个文件吗？\n\n此操作将清除：\n- 所有已加载的文件\n- 当前的重命名规则设置\n- 预览结果\n\n此操作无法撤销。`);
      resolve(confirmed);
    });
  }
  
  /**
   * 执行重命名
   */
  async executeRename(summary) {
    console.log('🎮 [ActionControls] 开始执行重命名');
    
    this.isProcessing = true;
    this.updateButtonStates();
    
    try {
      // 显示进度
      if (window.statusBarManager) {
        window.statusBarManager.showProgress(0, summary.changedFiles, '准备重命名...');
      }
      
      // 获取要重命名的文件
      const filesToRename = summary.files.filter(f => f.changed);
      
      if (filesToRename.length === 0) {
        throw new Error('没有文件需要重命名');
      }
      
      // 生成操作ID（时间戳）
      const operationId = Date.now().toString();
      this.lastOperationId = operationId;
      console.log(`🆔 [ActionControls] 创建重命名操作 ID: ${operationId}`);
      
      // 检查是否有实际的重命名函数可用
      if (typeof window.executeRename === 'function') {
        // 使用实际的重命名函数
        await this.executeActualRename(filesToRename, summary);
      } else {
        // 模拟重命名过程
        await this.executeSimulatedRename(filesToRename);
      }
      
      // 更新文件列表
      const files = window.loadedFiles || [];
      files.forEach(file => {
        if (file.selected && file.newPath && file.newPath !== file.name) {
          file.name = file.newPath;
          file.path = file.path.replace(/[^/\\]+$/, file.newPath);
          file.newPath = file.name; // 重置预览
        }
        file.selected = false; // 取消选择
      });
      
      // 更新UI
      if (typeof window.updateFileTable === 'function') {
        window.updateFileTable();
      }
      
      // 更新预览
      if (window.previewManager) {
        window.previewManager.updatePreview();
      }
      
      // 显示成功信息
      this.showSuccess(`成功重命名 ${filesToRename.length} 个文件`);
      this.announceToScreenReader(`重命名操作完成，成功处理 ${filesToRename.length} 个文件`);
      
    } catch (error) {
      console.error('❌ [ActionControls] 重命名失败:', error);
      this.showError('重命名失败: ' + error.message);
      this.announceToScreenReader('重命名操作失败: ' + error.message);
      throw error;
    } finally {
      this.isProcessing = false;
      this.updateButtonStates();
      
      // 隐藏进度
      if (window.statusBarManager) {
        window.statusBarManager.hideProgress();
      }
    }
  }
  
  /**
   * 执行实际重命名（调用后端API）
   */
  async executeActualRename(filesToRename, summary) {
    console.log('🎮 [ActionControls] 执行实际重命名');
    
    // 准备重命名参数
    const filePaths = filesToRename.map(f => f.originalName);
    const ruleData = this.getCurrentRuleData();
    const activeTab = document.querySelector('.tab-content.active');
    const activeTabId = activeTab ? activeTab.id.replace('tab-', '') : 'replace';
    
    // 调用实际的重命名函数
    await window.executeRename(filePaths, activeTabId, ruleData);
  }
  
  /**
   * 执行模拟重命名（用于测试）
   */
  async executeSimulatedRename(filesToRename) {
    console.log('🎮 [ActionControls] 执行模拟重命名');
    
    for (let i = 0; i < filesToRename.length; i++) {
      const file = filesToRename[i];
      
      // 更新进度
      if (window.statusBarManager) {
        window.statusBarManager.showProgress(i + 1, filesToRename.length, file.originalName);
      }
      
      // 模拟处理时间和可能的错误
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 模拟随机错误（5%概率）
      if (Math.random() < 0.05) {
        throw new Error(`文件 "${file.originalName}" 重命名失败：权限不足`);
      }
      
      console.log(`🎮 [ActionControls] 重命名: ${file.originalName} → ${file.newName}`);
    }
  }
  
  /**
   * 执行清空
   */
  executeClear() {
    console.log('🎮 [ActionControls] 执行清空操作');
    
    // 清空文件列表
    window.loadedFiles = [];
    
    // 重置规则表单
    this.resetRuleForms();
    
    // 清空预览
    if (window.previewManager) {
      window.previewManager.clearPreview();
    }
    
    // 更新UI
    if (typeof window.updateFileTable === 'function') {
      window.updateFileTable();
    }
    
    // 更新状态栏
    if (window.statusBarManager) {
      window.statusBarManager.reset();
    }
    
    // 更新按钮状态
    this.updateButtonStates();
  }
  
  /**
   * 重置规则表单
   */
  resetRuleForms() {
    // 查找替换
    const findInput = document.getElementById('find');
    const replaceInput = document.getElementById('replace');
    const regexCheckbox = document.getElementById('regex-mode');
    const caseSensitiveCheckbox = document.getElementById('case-sensitive');
    
    if (findInput) findInput.value = '';
    if (replaceInput) replaceInput.value = '';
    if (regexCheckbox) regexCheckbox.checked = false;
    if (caseSensitiveCheckbox) caseSensitiveCheckbox.checked = false;
    
    // 序列号
    const startInput = document.getElementById('start');
    const stepInput = document.getElementById('step');
    const digitsInput = document.getElementById('digits');
    const prefixRadio = document.getElementById('pos-prefix');
    
    if (startInput) startInput.value = '1';
    if (stepInput) stepInput.value = '1';
    if (digitsInput) digitsInput.value = '2';
    if (prefixRadio) prefixRadio.checked = true;
    
    // 切片替换
    const sliceStartInput = document.getElementById('slice-start');
    const sliceEndInput = document.getElementById('slice-end');
    const sliceReplacementInput = document.getElementById('slice-replacement');
    const preserveExtCheckbox = document.getElementById('slice-preserve-extension');
    
    if (sliceStartInput) sliceStartInput.value = '0';
    if (sliceEndInput) sliceEndInput.value = '';
    if (sliceReplacementInput) sliceReplacementInput.value = '';
    if (preserveExtCheckbox) preserveExtCheckbox.checked = true;
    
    // 大小写转换
    document.querySelectorAll('#tab-case input[name="caseType"]').forEach(radio => {
      radio.checked = false;
    });
    
    // 扩展名修改
    const newExtensionInput = document.getElementById('new-extension');
    const changeRadio = document.getElementById('ext-mode-change');
    
    if (newExtensionInput) newExtensionInput.value = '';
    if (changeRadio) changeRadio.checked = true;
  }
  
  /**
   * 更新按钮状态
   */
  updateButtonStates() {
    const canRename = this.canExecuteRename() && !this.isProcessing;
    const hasFiles = (window.loadedFiles || []).length > 0;
    
    // 更新重命名按钮
    [this.elements.applyRename, this.elements.applyRenameTop].forEach(btn => {
      if (btn) {
        btn.disabled = !canRename;
        btn.setAttribute('aria-disabled', !canRename);
        
        if (canRename) {
          btn.title = '开始重命名选中的文件';
        } else if (this.isProcessing) {
          btn.title = '正在处理中...';
        } else {
          btn.title = '请选择文件并配置重命名规则';
        }
      }
    });
    
    // 更新清空按钮
    [this.elements.clearAll, this.elements.clearAllTop].forEach(btn => {
      if (btn) {
        btn.disabled = !hasFiles || this.isProcessing;
        btn.setAttribute('aria-disabled', !hasFiles || this.isProcessing);
        btn.title = hasFiles ? '清空所有文件和设置' : '没有文件可清空';
      }
    });
    
    // 更新全选按钮
    if (this.elements.selectAll) {
      const files = window.loadedFiles || [];
      const selectedCount = files.filter(f => f.selected).length;
      
      this.elements.selectAll.disabled = files.length === 0;
      this.elements.selectAll.indeterminate = selectedCount > 0 && selectedCount < files.length;
      this.elements.selectAll.checked = files.length > 0 && selectedCount === files.length;
    }
    
    // 更新撤销按钮
    if (this.elements.undoRename) {
      const canUndo = !!this.lastOperationId && !this.isProcessing;
      this.elements.undoRename.disabled = !canUndo;
      this.elements.undoRename.setAttribute('aria-disabled', !canUndo);
      this.elements.undoRename.title = canUndo ? '撤销上次重命名操作 (Ctrl+Z)' : '没有可撤销的操作';
      
      // 更新按钮的视觉状态
      if (canUndo) {
        this.elements.undoRename.classList.remove('disabled');
      } else {
        this.elements.undoRename.classList.add('disabled');
      }
    }
  }
  
  /**
   * 显示成功信息
   */
  showSuccess(message) {
    if (window.statusBarManager) {
      window.statusBarManager.showSuccess(message);
    }
    
    // 也可以使用现有的showErrorMsg函数
    if (typeof showErrorMsg === 'function') {
      showErrorMsg(message, true);
    }
  }
  
  /**
   * 显示错误信息
   */
  showError(message) {
    if (window.statusBarManager) {
      window.statusBarManager.showError(message);
    }
    
    // 也可以使用现有的showErrorMsg函数
    if (typeof showErrorMsg === 'function') {
      showErrorMsg(message, false);
    }
  }
  
  /**
   * 屏幕阅读器公告
   */
  announceToScreenReader(message) {
    if (typeof announceToScreenReader === 'function') {
      announceToScreenReader(message);
    } else {
      // 备用方案：创建临时的aria-live区域
      let announcer = document.getElementById('screen-reader-announcer');
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'screen-reader-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = `
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        `;
        document.body.appendChild(announcer);
      }
      
      announcer.textContent = message;
      
      // 清除消息
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }
  
  /**
   * 焦点管理
   */
  manageFocus() {
    // 确保按钮可以通过Tab键访问
    const focusableElements = [
      this.elements.applyRename,
      this.elements.applyRenameTop,
      this.elements.clearAll,
      this.elements.clearAllTop,
      this.elements.selectAll
    ].filter(el => el);
    
    focusableElements.forEach(element => {
      if (element) {
        element.setAttribute('tabindex', '0');
      }
    });
    
    // 设置焦点顺序
    this.setupFocusOrder();
  }
  
  /**
   * 设置焦点顺序
   */
  setupFocusOrder() {
    // 为主要操作按钮设置合理的tab顺序
    const tabOrder = [
      { element: this.elements.selectAll, order: 1 },
      { element: this.elements.applyRename, order: 100 },
      { element: this.elements.clearAll, order: 101 },
      { element: this.elements.applyRenameTop, order: 102 },
      { element: this.elements.clearAllTop, order: 103 }
    ];
    
    tabOrder.forEach(({ element, order }) => {
      if (element) {
        element.style.tabIndex = order;
      }
    });
  }
  
  /**
   * 跳转到主要操作按钮
   */
  focusMainAction() {
    if (this.elements.applyRename && !this.elements.applyRename.disabled) {
      this.elements.applyRename.focus();
      this.announceToScreenReader('焦点移动到重命名按钮');
    }
  }
  
  /**
   * 处理焦点陷阱（在对话框中）
   */
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // 返回清理函数
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

// 创建全局实例
document.addEventListener('DOMContentLoaded', () => {
  window.actionControls = new ActionControls();
});

// 导出类（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActionControls;
}