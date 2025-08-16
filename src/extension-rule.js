// 扩展名修改规则管理器
class ExtensionRuleManager {
  constructor() {
    this.modeRadios = null;
    this.newExtensionInput = null;
    this.forceChangeCheckbox = null;
    this.preserveCaseCheckbox = null;
    this.validationTimeout = null;
    this.init();
  }
  
  init() {
    this.modeRadios = document.querySelectorAll('input[name="extensionMode"]');
    this.newExtensionInput = document.getElementById('new-extension');
    this.forceChangeCheckbox = document.getElementById('ext-force-change');
    this.preserveCaseCheckbox = document.getElementById('ext-case-preserve');
    
    if (this.modeRadios.length > 0 && this.newExtensionInput) {
      this.setupValidation();
      this.setupPreviewUpdates();
      this.setupExamples();
      this.setupModeToggle();
    }
  }
  
  setupModeToggle() {
    // 根据模式显示/隐藏新扩展名输入框
    this.modeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.toggleNewExtensionInput();
        this.toggleForceChangeOption();
      });
    });
    
    // 初始化显示状态
    this.toggleNewExtensionInput();
    this.toggleForceChangeOption();
  }
  
  toggleNewExtensionInput() {
    const selectedMode = this.getSelectedMode();
    const inputGroup = document.getElementById('new-extension-group');
    
    if (inputGroup) {
      if (selectedMode === 'remove') {
        inputGroup.style.display = 'none';
        this.newExtensionInput.required = false;
      } else {
        inputGroup.style.display = 'block';
        this.newExtensionInput.required = selectedMode === 'change' || selectedMode === 'add';
      }
    }
  }
  
  toggleForceChangeOption() {
    const selectedMode = this.getSelectedMode();
    const forceLabel = this.forceChangeCheckbox ? this.forceChangeCheckbox.closest('label') : null;
    
    if (forceLabel) {
      if (selectedMode === 'add') {
        forceLabel.style.display = 'block';
      } else {
        forceLabel.style.display = 'none';
        if (this.forceChangeCheckbox) {
          this.forceChangeCheckbox.checked = false;
        }
      }
    }
  }
  
  setupValidation() {
    // 添加实时验证
    this.newExtensionInput.addEventListener('input', () => {
      clearTimeout(this.validationTimeout);
      this.validationTimeout = setTimeout(() => {
        this.validateInputs();
      }, 300);
    });
    
    this.newExtensionInput.addEventListener('blur', () => {
      this.validateSingleInput();
    });
    
    // 模式变化时重新验证
    this.modeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.validateInputs();
        this.updateExamples();
      });
    });
    
    // 复选框变化时更新预览
    [this.forceChangeCheckbox, this.preserveCaseCheckbox].forEach(checkbox => {
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          this.updateExamples();
        });
      }
    });
  }
  
  setupPreviewUpdates() {
    const updatePreview = () => {
      if (window.updatePreview) {
        window.updatePreview();
      }
    };
    
    this.newExtensionInput.addEventListener('input', updatePreview);
    
    this.modeRadios.forEach(radio => {
      radio.addEventListener('change', updatePreview);
    });
    
    [this.forceChangeCheckbox, this.preserveCaseCheckbox].forEach(checkbox => {
      if (checkbox) {
        checkbox.addEventListener('change', updatePreview);
      }
    });
  }
  
  setupExamples() {
    // 创建示例显示区域
    this.createExampleDisplay();
    this.updateExamples();
  }
  
  createExampleDisplay() {
    const container = document.getElementById('tab-extension');
    if (!container) return;
    
    // 检查是否已存在示例区域
    let exampleDiv = container.querySelector('.extension-examples');
    if (!exampleDiv) {
      exampleDiv = document.createElement('div');
      exampleDiv.className = 'extension-examples';
      exampleDiv.innerHTML = `
        <h6>预览示例</h6>
        <div id="extension-example-list" class="example-list"></div>
      `;
      container.appendChild(exampleDiv);
    }
  }
  
  updateExamples() {
    const exampleList = document.getElementById('extension-example-list');
    if (!exampleList) return;
    
    const examples = this.generateExamples();
    exampleList.innerHTML = examples.map(example => 
      `<div class="example-item">
        <span class="original">${example.original}</span>
        <span class="arrow">→</span>
        <span class="result ${example.error ? 'error' : ''}">${example.result}</span>
        ${example.error ? `<small class="error-msg">${example.error}</small>` : ''}
      </div>`
    ).join('');
  }
  
  generateExamples() {
    const sampleFiles = [
      'document.pdf',
      'image.JPG',
      'script.js',
      'readme',
      'data.csv'
    ];
    
    return sampleFiles.map(fileName => {
      try {
        const result = this.applyRule(fileName);
        return {
          original: fileName,
          result: result,
          error: null
        };
      } catch (error) {
        return {
          original: fileName,
          result: fileName,
          error: error.message
        };
      }
    });
  }
  
  validateInputs() {
    let isValid = true;
    
    // 验证是否选择了模式
    const selectedMode = this.getSelectedMode();
    if (!selectedMode) {
      this.setInputError('mode', '请选择扩展名操作模式');
      isValid = false;
    } else {
      this.clearInputError('mode');
    }
    
    // 验证新扩展名（如果需要）
    if (selectedMode === 'change' || selectedMode === 'add') {
      const newExt = this.newExtensionInput.value.trim();
      if (!newExt) {
        this.setInputError('extension', '请输入新的扩展名');
        isValid = false;
      } else if (!/^[a-zA-Z0-9]+$/.test(newExt)) {
        this.setInputError('extension', '扩展名只能包含字母和数字');
        isValid = false;
      } else if (newExt.length > 10) {
        this.setInputError('extension', '扩展名不能超过10个字符');
        isValid = false;
      } else {
        this.clearInputError('extension');
      }
    } else {
      this.clearInputError('extension');
    }
    
    this.updateExamples();
    return isValid;
  }
  
  validateSingleInput() {
    const selectedMode = this.getSelectedMode();
    if (selectedMode === 'change' || selectedMode === 'add') {
      const newExt = this.newExtensionInput.value.trim();
      if (!newExt) {
        this.setInputError('extension', '扩展名不能为空');
        return false;
      }
    }
    return true;
  }
  
  setInputError(inputType, message) {
    let input, helpId;
    
    switch (inputType) {
      case 'mode':
        helpId = 'ext-mode-legend';
        break;
      case 'extension':
        input = this.newExtensionInput;
        helpId = 'new-ext-help';
        break;
    }
    
    if (input) {
      input.classList.add('error');
      input.setAttribute('aria-invalid', 'true');
    }
    
    const helpElement = document.getElementById(helpId);
    if (helpElement) {
      helpElement.textContent = message;
      helpElement.className = inputType === 'mode' ? helpElement.className : 'form-text error';
      helpElement.setAttribute('role', 'alert');
      if (inputType === 'mode') {
        helpElement.style.color = 'var(--pico-del-color)';
      }
    }
    
    // 屏幕阅读器公告
    if (window.announceToScreenReader) {
      window.announceToScreenReader(`扩展名${inputType}输入错误: ${message}`);
    }
  }
  
  clearInputError(inputType) {
    let input, helpId, defaultText;
    
    switch (inputType) {
      case 'mode':
        helpId = 'ext-mode-legend';
        defaultText = '操作模式';
        break;
      case 'extension':
        input = this.newExtensionInput;
        helpId = 'new-ext-help';
        defaultText = '输入新的扩展名（不需要包含点号）';
        break;
    }
    
    if (input) {
      input.classList.remove('error', 'warning');
      input.setAttribute('aria-invalid', 'false');
    }
    
    const helpElement = document.getElementById(helpId);
    if (helpElement) {
      helpElement.className = inputType === 'mode' ? helpElement.className : 'form-text';
      helpElement.removeAttribute('role');
      helpElement.textContent = defaultText;
      if (inputType === 'mode') {
        helpElement.style.color = '';
      }
    }
  }
  
  getSelectedMode() {
    const selectedRadio = Array.from(this.modeRadios).find(radio => radio.checked);
    return selectedRadio ? selectedRadio.value : null;
  }
  
  // 应用扩展名修改规则
  applyRule(fileName) {
    const mode = this.getSelectedMode();
    const newExtension = this.newExtensionInput.value.trim();
    const forceChange = this.forceChangeCheckbox ? this.forceChangeCheckbox.checked : false;
    const preserveCase = this.preserveCaseCheckbox ? this.preserveCaseCheckbox.checked : true;
    
    if (!mode) return fileName;
    
    // 分离文件名和扩展名
    const lastDotIndex = fileName.lastIndexOf('.');
    const hasExtension = lastDotIndex > 0;
    const nameWithoutExt = hasExtension ? fileName.substring(0, lastDotIndex) : fileName;
    const currentExt = hasExtension ? fileName.substring(lastDotIndex + 1) : '';
    
    let result;
    switch (mode) {
      case 'change':
        if (!hasExtension) {
          // 没有扩展名的文件，添加新扩展名
          result = nameWithoutExt + '.' + (preserveCase ? newExtension : newExtension.toLowerCase());
        } else {
          // 有扩展名的文件，替换扩展名
          result = nameWithoutExt + '.' + (preserveCase ? newExtension : newExtension.toLowerCase());
        }
        break;
      case 'remove':
        result = nameWithoutExt;
        break;
      case 'add':
        if (hasExtension && !forceChange) {
          // 已有扩展名且不强制修改，保持原样
          result = fileName;
        } else {
          // 没有扩展名或强制修改
          result = nameWithoutExt + '.' + (preserveCase ? newExtension : newExtension.toLowerCase());
        }
        break;
      default:
        result = fileName;
    }
    
    return result;
  }
  
  // 获取高亮的预览结果
  getHighlightedPreview(fileName) {
    const result = this.applyRule(fileName);
    
    if (result === fileName) {
      return fileName;
    }
    
    const mode = this.getSelectedMode();
    const lastDotIndex = fileName.lastIndexOf('.');
    const hasExtension = lastDotIndex > 0;
    const nameWithoutExt = hasExtension ? fileName.substring(0, lastDotIndex) : fileName;
    const currentExt = hasExtension ? fileName.substring(lastDotIndex + 1) : '';
    
    const resultLastDotIndex = result.lastIndexOf('.');
    const resultHasExtension = resultLastDotIndex > 0;
    const resultNameWithoutExt = resultHasExtension ? result.substring(0, resultLastDotIndex) : result;
    const resultExt = resultHasExtension ? result.substring(resultLastDotIndex + 1) : '';
    
    let highlightedResult = nameWithoutExt;
    
    switch (mode) {
      case 'change':
        if (hasExtension) {
          highlightedResult += '.<span class="ext-removed">' + currentExt + '</span><span class="ext-added">' + resultExt + '</span>';
        } else {
          highlightedResult += '<span class="ext-added">.' + resultExt + '</span>';
        }
        break;
      case 'remove':
        if (hasExtension) {
          highlightedResult += '<span class="ext-removed">.' + currentExt + '</span>';
        }
        break;
      case 'add':
        if (!hasExtension || (this.forceChangeCheckbox && this.forceChangeCheckbox.checked)) {
          if (hasExtension) {
            highlightedResult += '.<span class="ext-removed">' + currentExt + '</span><span class="ext-added">' + resultExt + '</span>';
          } else {
            highlightedResult += '<span class="ext-added">.' + resultExt + '</span>';
          }
        } else {
          highlightedResult = fileName; // 无变化
        }
        break;
    }
    
    return highlightedResult;
  }
  
  // 获取规则数据
  getRuleData() {
    return {
      mode: this.getSelectedMode(),
      newExtension: this.newExtensionInput.value.trim(),
      forceChange: this.forceChangeCheckbox ? this.forceChangeCheckbox.checked : false,
      preserveCase: this.preserveCaseCheckbox ? this.preserveCaseCheckbox.checked : true
    };
  }
  
  // 设置规则数据
  setRuleData(data) {
    // 设置选中的模式
    if (data.mode) {
      this.modeRadios.forEach(radio => {
        radio.checked = radio.value === data.mode;
      });
    }
    
    // 设置新扩展名
    if (this.newExtensionInput) {
      this.newExtensionInput.value = data.newExtension || '';
    }
    
    // 设置选项
    if (this.forceChangeCheckbox) {
      this.forceChangeCheckbox.checked = data.forceChange || false;
    }
    
    if (this.preserveCaseCheckbox) {
      this.preserveCaseCheckbox.checked = data.preserveCase !== false;
    }
    
    this.toggleNewExtensionInput();
    this.toggleForceChangeOption();
    this.validateInputs();
    this.updateExamples();
  }
  
  // 重置规则
  reset() {
    // 重置为修改模式
    this.modeRadios.forEach(radio => {
      radio.checked = radio.value === 'change';
    });
    
    // 清空新扩展名
    if (this.newExtensionInput) {
      this.newExtensionInput.value = '';
    }
    
    // 重置选项
    if (this.forceChangeCheckbox) {
      this.forceChangeCheckbox.checked = false;
    }
    
    if (this.preserveCaseCheckbox) {
      this.preserveCaseCheckbox.checked = true;
    }
    
    this.toggleNewExtensionInput();
    this.toggleForceChangeOption();
    this.clearInputError('mode');
    this.clearInputError('extension');
    this.updateExamples();
  }
}

// 导出到全局
window.ExtensionRuleManager = ExtensionRuleManager;