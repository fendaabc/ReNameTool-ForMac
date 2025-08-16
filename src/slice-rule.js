// 切片替换规则管理器
class SliceRuleManager {
  constructor() {
    this.startInput = null;
    this.endInput = null;
    this.replacementInput = null;
    this.preserveExtensionCheckbox = null;
    this.validationTimeout = null;
    this.init();
  }
  
  init() {
    this.startInput = document.getElementById('slice-start');
    this.endInput = document.getElementById('slice-end');
    this.replacementInput = document.getElementById('slice-replacement');
    this.preserveExtensionCheckbox = document.getElementById('slice-preserve-extension');
    
    if (this.startInput && this.replacementInput) {
      this.setupValidation();
      this.setupPreviewUpdates();
      this.setupExamples();
    }
  }
  
  setupValidation() {
    // 添加实时验证
    [this.startInput, this.endInput, this.replacementInput].forEach(input => {
      if (input) {
        input.addEventListener('input', () => {
          clearTimeout(this.validationTimeout);
          this.validationTimeout = setTimeout(() => {
            this.validateInputs();
          }, 300);
        });
        
        input.addEventListener('blur', () => {
          this.validateSingleInput(input);
        });
      }
    });
    
    // 复选框变化时重新验证和更新预览
    if (this.preserveExtensionCheckbox) {
      this.preserveExtensionCheckbox.addEventListener('change', () => {
        this.updateExamples();
      });
    }
  }
  
  setupPreviewUpdates() {
    const updatePreview = () => {
      if (window.updatePreview) {
        window.updatePreview();
      }
    };
    
    [this.startInput, this.endInput, this.replacementInput].forEach(input => {
      if (input) {
        input.addEventListener('input', updatePreview);
      }
    });
    
    if (this.preserveExtensionCheckbox) {
      this.preserveExtensionCheckbox.addEventListener('change', updatePreview);
    }
  }
  
  setupExamples() {
    // 创建示例显示区域
    this.createExampleDisplay();
    this.updateExamples();
  }
  
  createExampleDisplay() {
    const container = document.getElementById('tab-slice');
    if (!container) return;
    
    // 检查是否已存在示例区域
    let exampleDiv = container.querySelector('.slice-examples');
    if (!exampleDiv) {
      exampleDiv = document.createElement('div');
      exampleDiv.className = 'slice-examples';
      exampleDiv.innerHTML = `
        <h6>预览示例</h6>
        <div id="slice-example-list" class="example-list"></div>
      `;
      container.appendChild(exampleDiv);
    }
  }
  
  updateExamples() {
    const exampleList = document.getElementById('slice-example-list');
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
      'IMG_20240101_123456.jpg',
      'document_final_v2.pdf',
      'music_track_01.mp3',
      'video.mp4'
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
    
    // 验证起始位置
    const startValue = parseInt(this.startInput.value);
    if (isNaN(startValue)) {
      this.setInputError('start', '请输入有效的起始位置');
      isValid = false;
    } else if (startValue < -255 || startValue > 255) {
      this.setInputError('start', '起始位置必须在-255到255之间');
      isValid = false;
    } else {
      this.clearInputError('start');
    }
    
    // 验证结束位置（可选）
    if (this.endInput.value.trim() !== '') {
      const endValue = parseInt(this.endInput.value);
      if (isNaN(endValue)) {
        this.setInputError('end', '请输入有效的结束位置');
        isValid = false;
      } else if (endValue < -255 || endValue > 255) {
        this.setInputError('end', '结束位置必须在-255到255之间');
        isValid = false;
      } else {
        // 检查起始和结束位置的逻辑关系
        if (!isNaN(startValue) && this.isInvalidRange(startValue, endValue)) {
          this.setInputError('end', '结束位置必须大于起始位置（正数时）');
          isValid = false;
        } else {
          this.clearInputError('end');
        }
      }
    } else {
      this.clearInputError('end');
    }
    
    // 验证替换内容
    const replacementValue = this.replacementInput.value;
    if (replacementValue.length > 200) {
      this.setInputError('replacement', '替换内容不能超过200个字符');
      isValid = false;
    } else {
      // 检查非法文件名字符
      const invalidChars = /[<>:"/\\|?*]/.test(replacementValue);
      if (invalidChars) {
        this.setInputError('replacement', '替换内容包含文件名非法字符: < > : " / \\ | ? *');
        isValid = false;
      } else {
        this.clearInputError('replacement');
      }
    }
    
    // 检查是否会导致空文件名
    if (isValid && window.loadedFiles && window.loadedFiles.length > 0) {
      const wouldCreateEmpty = window.loadedFiles.some(file => {
        try {
          const result = this.applyRule(file.name);
          return result.trim() === '' || result === '.';
        } catch (e) {
          return false;
        }
      });
      
      if (wouldCreateEmpty) {
        this.setInputWarning('replacement', '警告：某些文件可能会变成空文件名');
      }
    }
    
    this.updateExamples();
    return isValid;
  }
  
  isInvalidRange(start, end) {
    // 如果都是正数，结束位置应该大于起始位置
    if (start >= 0 && end >= 0) {
      return end <= start;
    }
    // 如果都是负数，结束位置应该大于起始位置（绝对值小）
    if (start < 0 && end < 0) {
      return end <= start;
    }
    // 混合情况通常是有效的
    return false;
  }
  
  validateSingleInput(input) {
    const inputType = input.id.replace('slice-', '');
    
    switch (inputType) {
      case 'start':
        const startValue = parseInt(input.value);
        if (isNaN(startValue)) {
          this.setInputError('start', '起始位置必须是数字');
          return false;
        }
        break;
      case 'end':
        if (input.value.trim() !== '') {
          const endValue = parseInt(input.value);
          if (isNaN(endValue)) {
            this.setInputError('end', '结束位置必须是数字');
            return false;
          }
        }
        break;
    }
    return true;
  }
  
  setInputError(inputType, message) {
    let input, helpId;
    
    switch (inputType) {
      case 'start':
        input = this.startInput;
        helpId = 'slice-start-help';
        break;
      case 'end':
        input = this.endInput;
        helpId = 'slice-end-help';
        break;
      case 'replacement':
        input = this.replacementInput;
        helpId = 'slice-replacement-help';
        break;
    }
    
    if (!input) return;
    
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
      window.announceToScreenReader(`切片${inputType}输入错误: ${message}`);
    }
  }
  
  setInputWarning(inputType, message) {
    let input, helpId;
    
    switch (inputType) {
      case 'replacement':
        input = this.replacementInput;
        helpId = 'slice-replacement-help';
        break;
    }
    
    if (!input) return;
    
    const helpElement = document.getElementById(helpId);
    
    input.classList.add('warning');
    
    if (helpElement) {
      helpElement.textContent = message;
      helpElement.className = 'form-text warning';
    }
  }
  
  clearInputError(inputType) {
    let input, helpId, defaultText;
    
    switch (inputType) {
      case 'start':
        input = this.startInput;
        helpId = 'slice-start-help';
        defaultText = '字符串开始位置，0表示第一个字符，负数表示从末尾倒数';
        break;
      case 'end':
        input = this.endInput;
        helpId = 'slice-end-help';
        defaultText = '字符串结束位置，留空表示到末尾，负数表示从末尾倒数';
        break;
      case 'replacement':
        input = this.replacementInput;
        helpId = 'slice-replacement-help';
        defaultText = '用于替换选定范围的新文本，留空表示删除';
        break;
    }
    
    if (!input) return;
    
    const helpElement = document.getElementById(helpId);
    
    input.classList.remove('error', 'warning');
    input.setAttribute('aria-invalid', 'false');
    
    if (helpElement) {
      helpElement.className = 'form-text';
      helpElement.removeAttribute('role');
      helpElement.textContent = defaultText;
    }
  }
  
  // 应用切片替换规则
  applyRule(fileName) {
    const start = parseInt(this.startInput.value) || 0;
    const endValue = this.endInput.value.trim();
    const end = endValue === '' ? null : parseInt(endValue);
    const replacement = this.replacementInput.value || '';
    const preserveExtension = this.preserveExtensionCheckbox ? this.preserveExtensionCheckbox.checked : true;
    
    let targetString = fileName;
    let extension = '';
    
    // 如果保留扩展名，分离文件名和扩展名
    if (preserveExtension) {
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        targetString = fileName.substring(0, lastDotIndex);
        extension = fileName.substring(lastDotIndex);
      }
    }
    
    // 处理负索引
    const length = targetString.length;
    let actualStart = start < 0 ? Math.max(0, length + start) : Math.min(start, length);
    let actualEnd = end === null ? length : (end < 0 ? Math.max(0, length + end) : Math.min(end, length));
    
    // 确保起始位置不大于结束位置
    if (actualStart > actualEnd) {
      actualStart = actualEnd;
    }
    
    // 执行切片替换
    const before = targetString.substring(0, actualStart);
    const after = targetString.substring(actualEnd);
    const result = before + replacement + after;
    
    // 重新组合文件名
    return result + extension;
  }
  
  // 获取高亮的预览结果
  getHighlightedPreview(fileName) {
    const start = parseInt(this.startInput.value) || 0;
    const endValue = this.endInput.value.trim();
    const end = endValue === '' ? null : parseInt(endValue);
    const replacement = this.replacementInput.value || '';
    const preserveExtension = this.preserveExtensionCheckbox ? this.preserveExtensionCheckbox.checked : true;
    
    let targetString = fileName;
    let extension = '';
    
    // 如果保留扩展名，分离文件名和扩展名
    if (preserveExtension) {
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        targetString = fileName.substring(0, lastDotIndex);
        extension = fileName.substring(lastDotIndex);
      }
    }
    
    // 处理负索引
    const length = targetString.length;
    let actualStart = start < 0 ? Math.max(0, length + start) : Math.min(start, length);
    let actualEnd = end === null ? length : (end < 0 ? Math.max(0, length + end) : Math.min(end, length));
    
    // 确保起始位置不大于结束位置
    if (actualStart > actualEnd) {
      actualStart = actualEnd;
    }
    
    // 构建高亮预览
    const before = targetString.substring(0, actualStart);
    const sliced = targetString.substring(actualStart, actualEnd);
    const after = targetString.substring(actualEnd);
    
    let highlightedResult;
    if (replacement) {
      highlightedResult = `${before}<span class="slice-removed">${sliced}</span><span class="slice-added">${replacement}</span>${after}`;
    } else {
      highlightedResult = `${before}<span class="slice-removed">${sliced}</span>${after}`;
    }
    
    return highlightedResult + extension;
  }
  
  // 获取规则数据
  getRuleData() {
    const endValue = this.endInput.value.trim();
    return {
      start: parseInt(this.startInput.value) || 0,
      end: endValue === '' ? null : parseInt(endValue),
      replacement: this.replacementInput.value || '',
      preserveExtension: this.preserveExtensionCheckbox ? this.preserveExtensionCheckbox.checked : true
    };
  }
  
  // 设置规则数据
  setRuleData(data) {
    if (this.startInput) this.startInput.value = data.start || 0;
    if (this.endInput) this.endInput.value = data.end !== null ? data.end : '';
    if (this.replacementInput) this.replacementInput.value = data.replacement || '';
    if (this.preserveExtensionCheckbox) this.preserveExtensionCheckbox.checked = data.preserveExtension !== false;
    
    this.validateInputs();
    this.updateExamples();
  }
  
  // 重置规则
  reset() {
    if (this.startInput) this.startInput.value = '0';
    if (this.endInput) this.endInput.value = '';
    if (this.replacementInput) this.replacementInput.value = '';
    if (this.preserveExtensionCheckbox) this.preserveExtensionCheckbox.checked = true;
    
    this.clearInputError('start');
    this.clearInputError('end');
    this.clearInputError('replacement');
    this.updateExamples();
  }
}

// 导出到全局
window.SliceRuleManager = SliceRuleManager;