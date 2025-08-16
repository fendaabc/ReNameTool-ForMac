// 查找替换规则管理器
class ReplaceRuleManager {
  constructor() {
    this.findInput = null;
    this.replaceInput = null;
    this.regexCheckbox = null;
    this.caseSensitiveCheckbox = null;
    this.validationTimeout = null;
    this.init();
  }
  
  init() {
    this.findInput = document.getElementById('find');
    this.replaceInput = document.getElementById('replace');
    this.regexCheckbox = document.getElementById('regex-mode');
    this.caseSensitiveCheckbox = document.getElementById('case-sensitive');
    
    if (this.findInput && this.replaceInput) {
      this.setupValidation();
      this.setupPreviewUpdates();
      this.setupCheckboxEvents();
    }
  }
  
  setupCheckboxEvents() {
    // 复选框变化时重新验证和更新预览
    if (this.regexCheckbox) {
      this.regexCheckbox.addEventListener('change', () => {
        this.validateInputs();
        if (window.updatePreview) {
          window.updatePreview();
        }
      });
    }
    
    if (this.caseSensitiveCheckbox) {
      this.caseSensitiveCheckbox.addEventListener('change', () => {
        if (window.updatePreview) {
          window.updatePreview();
        }
      });
    }
  }
  
  setupValidation() {
    // 添加实时验证
    this.findInput.addEventListener('input', () => {
      clearTimeout(this.validationTimeout);
      this.validationTimeout = setTimeout(() => {
        this.validateInputs();
      }, 300); // 防抖300ms
    });
    
    this.replaceInput.addEventListener('input', () => {
      clearTimeout(this.validationTimeout);
      this.validationTimeout = setTimeout(() => {
        this.validateInputs();
      }, 300);
    });
    
    // 添加焦点事件处理
    this.findInput.addEventListener('focus', () => {
      this.showInputHelp('find');
    });
    
    this.replaceInput.addEventListener('focus', () => {
      this.showInputHelp('replace');
    });
    
    // 添加失焦验证
    this.findInput.addEventListener('blur', () => {
      this.validateSingleInput('find');
    });
    
    this.replaceInput.addEventListener('blur', () => {
      this.validateSingleInput('replace');
    });
  }
  
  setupPreviewUpdates() {
    // 实时预览更新
    const updatePreview = () => {
      if (window.updatePreview) {
        window.updatePreview();
      }
    };
    
    this.findInput.addEventListener('input', updatePreview);
    this.replaceInput.addEventListener('input', updatePreview);
  }
  
  validateInputs() {
    const findValue = this.findInput.value.trim();
    const replaceValue = this.replaceInput.value;
    
    let isValid = true;
    let errors = [];
    
    // 验证查找内容
    if (!findValue) {
      this.setInputError('find', '请输入要查找的内容');
      isValid = false;
    } else if (findValue.length > 100) {
      this.setInputError('find', '查找内容不能超过100个字符');
      isValid = false;
    } else {
      // 验证正则表达式（如果启用）
      if (this.isRegexMode()) {
        try {
          new RegExp(findValue);
          this.clearInputError('find');
        } catch (e) {
          this.setInputError('find', '无效的正则表达式: ' + e.message);
          isValid = false;
        }
      } else {
        // 检查特殊字符
        const hasSpecialChars = /[\\\/\*\?\[\]\(\)\{\}\|\^\$\+\.]/.test(findValue);
        if (hasSpecialChars) {
          this.setInputWarning('find', '包含特殊字符，将按字面意思匹配');
        } else {
          this.clearInputError('find');
        }
      }
    }
    
    // 验证替换内容
    if (replaceValue.length > 200) {
      this.setInputError('replace', '替换内容不能超过200个字符');
      isValid = false;
    } else {
      // 检查非法文件名字符
      const invalidChars = /[<>:"/\\|?*]/.test(replaceValue);
      if (invalidChars) {
        this.setInputError('replace', '替换内容包含文件名非法字符: < > : " / \\ | ? *');
        isValid = false;
      } else {
        this.clearInputError('replace');
      }
    }
    
    // 检查是否会导致空文件名
    if (findValue && replaceValue === '' && window.loadedFiles) {
      const wouldCreateEmpty = window.loadedFiles.some(file => {
        const result = this.applyRule(file.name);
        return result.trim() === '' || result === '.';
      });
      
      if (wouldCreateEmpty) {
        this.setInputWarning('replace', '警告：某些文件可能会变成空文件名');
      }
    }
    
    return isValid;
  }
  
  validateSingleInput(inputType) {
    if (inputType === 'find') {
      const value = this.findInput.value.trim();
      if (!value) {
        this.setInputError('find', '查找内容不能为空');
        return false;
      }
    }
    return true;
  }
  
  setInputError(inputType, message) {
    const input = inputType === 'find' ? this.findInput : this.replaceInput;
    const helpId = inputType === 'find' ? 'find-help' : 'replace-help';
    const helpElement = document.getElementById(helpId);
    
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    
    if (helpElement) {
      helpElement.textContent = message;
      helpElement.className = 'form-text error';
      helpElement.setAttribute('role', 'alert');
    }
    
    // 屏幕阅读器公告
    if (window.announceToScreenReader) {
      window.announceToScreenReader(`${inputType === 'find' ? '查找' : '替换'}输入错误: ${message}`);
    }
  }
  
  setInputWarning(inputType, message) {
    const input = inputType === 'find' ? this.findInput : this.replaceInput;
    const helpId = inputType === 'find' ? 'find-help' : 'replace-help';
    const helpElement = document.getElementById(helpId);
    
    input.classList.add('warning');
    
    if (helpElement) {
      helpElement.textContent = message;
      helpElement.className = 'form-text warning';
    }
  }
  
  clearInputError(inputType) {
    const input = inputType === 'find' ? this.findInput : this.replaceInput;
    const helpId = inputType === 'find' ? 'find-help' : 'replace-help';
    const helpElement = document.getElementById(helpId);
    
    input.classList.remove('error', 'warning');
    input.setAttribute('aria-invalid', 'false');
    
    if (helpElement) {
      helpElement.className = 'form-text';
      helpElement.removeAttribute('role');
      // 恢复默认帮助文本
      if (inputType === 'find') {
        helpElement.textContent = '输入要在文件名中查找的文本';
      } else {
        helpElement.textContent = '输入用于替换的新文本';
      }
    }
  }
  
  showInputHelp(inputType) {
    const helpId = inputType === 'find' ? 'find-help' : 'replace-help';
    const helpElement = document.getElementById(helpId);
    
    if (helpElement && !helpElement.classList.contains('error') && !helpElement.classList.contains('warning')) {
      if (inputType === 'find') {
        helpElement.textContent = '支持普通文本和正则表达式匹配';
      } else {
        helpElement.textContent = '可以为空以删除匹配的文本';
      }
    }
  }
  
  isRegexMode() {
    return this.regexCheckbox && this.regexCheckbox.checked;
  }
  
  isCaseSensitive() {
    return this.caseSensitiveCheckbox && this.caseSensitiveCheckbox.checked;
  }
  
  // 应用查找替换规则
  applyRule(fileName) {
    const findText = this.findInput.value;
    const replaceText = this.replaceInput.value;
    
    if (!findText) return fileName;
    
    try {
      if (this.isRegexMode()) {
        const flags = this.isCaseSensitive() ? 'g' : 'gi';
        const regex = new RegExp(findText, flags);
        return fileName.replace(regex, replaceText);
      } else {
        // 普通文本替换
        if (this.isCaseSensitive()) {
          return fileName.split(findText).join(replaceText);
        } else {
          // 不区分大小写的替换
          const regex = new RegExp(this.escapeRegExp(findText), 'gi');
          return fileName.replace(regex, replaceText);
        }
      }
    } catch (e) {
      console.error('Replace rule error:', e);
      return fileName;
    }
  }
  
  // 转义正则表达式特殊字符
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // 获取高亮的预览结果
  getHighlightedPreview(fileName) {
    const findText = this.findInput.value;
    const replaceText = this.replaceInput.value;
    
    if (!findText) return fileName;
    
    try {
      let regex;
      if (this.isRegexMode()) {
        const flags = this.isCaseSensitive() ? 'g' : 'gi';
        regex = new RegExp(findText, flags);
      } else {
        const flags = this.isCaseSensitive() ? 'g' : 'gi';
        regex = new RegExp(this.escapeRegExp(findText), flags);
      }
      
      // 高亮匹配的部分
      const highlighted = fileName.replace(regex, (match) => {
        return `<span class="find-match">${match}</span>`;
      });
      
      // 如果有替换，也高亮替换后的结果
      if (replaceText !== '') {
        const replaced = fileName.replace(regex, replaceText);
        if (replaced !== fileName) {
          return replaced.replace(new RegExp(this.escapeRegExp(replaceText), 'g'), 
            `<span class="replace-result">${replaceText}</span>`);
        }
      }
      
      return highlighted;
    } catch (e) {
      return fileName;
    }
  }
  
  // 获取规则数据
  getRuleData() {
    return {
      find: this.findInput.value,
      replace: this.replaceInput.value,
      regex: this.isRegexMode(),
      caseSensitive: this.isCaseSensitive()
    };
  }
  
  // 设置规则数据
  setRuleData(data) {
    if (this.findInput) this.findInput.value = data.find || '';
    if (this.replaceInput) this.replaceInput.value = data.replace || '';
    if (this.regexCheckbox) this.regexCheckbox.checked = data.regex || false;
    if (this.caseSensitiveCheckbox) this.caseSensitiveCheckbox.checked = data.caseSensitive || false;
    
    this.validateInputs();
  }
  
  // 重置规则
  reset() {
    if (this.findInput) this.findInput.value = '';
    if (this.replaceInput) this.replaceInput.value = '';
    if (this.regexCheckbox) this.regexCheckbox.checked = false;
    if (this.caseSensitiveCheckbox) this.caseSensitiveCheckbox.checked = false;
    
    this.clearInputError('find');
    this.clearInputError('replace');
  }
}

// 导出到全局
window.ReplaceRuleManager = ReplaceRuleManager;