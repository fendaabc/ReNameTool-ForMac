// 序列号规则管理器
class SequenceRuleManager {
  constructor() {
    this.startInput = null;
    this.stepInput = null;
    this.widthInput = null;
    this.orderSelect = null;
    this.positionRadios = null;
    this.validationTimeout = null;
    this.init();
  }
  
  init() {
    this.startInput = document.getElementById('start');
    this.stepInput = document.getElementById('step');
    this.widthInput = document.getElementById('digits');
    this.orderSelect = document.getElementById('sequence-order');
    this.positionRadios = document.querySelectorAll('input[name="position"]');
    
    if (this.startInput && this.widthInput) {
      this.setupValidation();
      this.setupPreviewUpdates();
      this.setupExamples();
    }
  }
  
  setupValidation() {
    // 添加实时验证
    [this.startInput, this.stepInput, this.widthInput].forEach(input => {
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
    
    // 位置单选框验证
    this.positionRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.updateExamples();
      });
    });
  }
  
  setupPreviewUpdates() {
    const updatePreview = () => {
      if (window.updatePreview) {
        window.updatePreview();
      }
    };
    
    [this.startInput, this.stepInput, this.widthInput].forEach(input => {
      if (input) {
        input.addEventListener('input', updatePreview);
      }
    });
    
    this.positionRadios.forEach(radio => {
      radio.addEventListener('change', updatePreview);
    });
    
    if (this.orderSelect) {
      this.orderSelect.addEventListener('change', updatePreview);
    }
  }
  
  setupExamples() {
    // 创建示例显示区域
    this.createExampleDisplay();
    this.updateExamples();
  }
  
  createExampleDisplay() {
    const container = document.getElementById('tab-sequence');
    if (!container) return;
    
    // 检查是否已存在示例区域
    let exampleDiv = container.querySelector('.sequence-examples');
    if (!exampleDiv) {
      exampleDiv = document.createElement('div');
      exampleDiv.className = 'sequence-examples';
      exampleDiv.innerHTML = `
        <h6>预览示例</h6>
        <div id="sequence-example-list" class="example-list"></div>
      `;
      container.appendChild(exampleDiv);
    }
  }
  
  updateExamples() {
    const exampleList = document.getElementById('sequence-example-list');
    if (!exampleList) return;
    
    const examples = this.generateExamples();
    exampleList.innerHTML = examples.map(example => 
      `<div class="example-item">
        <span class="original">${example.original}</span>
        <span class="arrow">→</span>
        <span class="result">${example.result}</span>
      </div>`
    ).join('');
  }
  
  generateExamples() {
    const sampleFiles = [
      'photo.jpg',
      'document.pdf',
      'music.mp3',
      'video.mp4'
    ];
    
    return sampleFiles.map((fileName, index) => ({
      original: fileName,
      result: this.applyRule(fileName, index)
    }));
  }
  
  validateInputs() {
    let isValid = true;
    
    // 验证起始数字
    const startValue = parseInt(this.startInput.value);
    if (isNaN(startValue)) {
      this.setInputError('start', '请输入有效的起始数字');
      isValid = false;
    } else if (startValue < 0) {
      this.setInputError('start', '起始数字不能小于0');
      isValid = false;
    } else if (startValue > 999999) {
      this.setInputError('start', '起始数字不能超过999999');
      isValid = false;
    } else {
      this.clearInputError('start');
    }
    
    // 验证步长
    if (this.stepInput) {
      const stepValue = parseInt(this.stepInput.value);
      if (isNaN(stepValue)) {
        this.setInputError('step', '请输入有效的步长');
        isValid = false;
      } else if (stepValue <= 0) {
        this.setInputError('step', '步长必须大于0');
        isValid = false;
      } else if (stepValue > 1000) {
        this.setInputError('step', '步长不能超过1000');
        isValid = false;
      } else {
        this.clearInputError('step');
      }
    }
    
    // 验证位数
    const widthValue = parseInt(this.widthInput.value);
    if (isNaN(widthValue)) {
      this.setInputError('width', '请输入有效的位数');
      isValid = false;
    } else if (widthValue < 1) {
      this.setInputError('width', '位数不能小于1');
      isValid = false;
    } else if (widthValue > 10) {
      this.setInputError('width', '位数不能超过10');
      isValid = false;
    } else {
      this.clearInputError('width');
    }
    
    // 检查是否会产生过长的文件名
    if (isValid && window.loadedFiles && window.loadedFiles.length > 0) {
      const maxLength = Math.max(...window.loadedFiles.map(f => f.name.length));
      const sequenceLength = widthValue + 1; // 包括分隔符
      if (maxLength + sequenceLength > 255) {
        this.setInputWarning('width', '警告：某些文件名可能会超过系统限制');
      }
    }
    
    this.updateExamples();
    return isValid;
  }
  
  validateSingleInput(input) {
    const value = parseInt(input.value);
    const inputType = input.id;
    
    switch (inputType) {
      case 'start':
        if (isNaN(value) || value < 0) {
          this.setInputError('start', '起始数字必须大于等于0');
          return false;
        }
        break;
      case 'step':
        if (isNaN(value) || value <= 0) {
          this.setInputError('step', '步长必须大于0');
          return false;
        }
        break;
      case 'digits':
        if (isNaN(value) || value < 1) {
          this.setInputError('width', '位数必须大于0');
          return false;
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
        helpId = 'start-help';
        break;
      case 'step':
        input = this.stepInput;
        helpId = 'step-help';
        break;
      case 'width':
        input = this.widthInput;
        helpId = 'digits-help';
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
      window.announceToScreenReader(`序列号${inputType}输入错误: ${message}`);
    }
  }
  
  setInputWarning(inputType, message) {
    let input, helpId;
    
    switch (inputType) {
      case 'width':
        input = this.widthInput;
        helpId = 'digits-help';
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
        helpId = 'start-help';
        defaultText = '序列号的起始数字';
        break;
      case 'step':
        input = this.stepInput;
        helpId = 'step-help';
        defaultText = '每个文件序列号的增量';
        break;
      case 'width':
        input = this.widthInput;
        helpId = 'digits-help';
        defaultText = '序列号的位数，不足时前面补0';
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
  
  // 应用序列号规则
  applyRule(fileName, fileIndex = 0) {
    const start = parseInt(this.startInput.value) || 1;
    const step = this.stepInput ? (parseInt(this.stepInput.value) || 1) : 1;
    const width = parseInt(this.widthInput.value) || 2;
    const position = this.getSelectedPosition();
    
    // 计算当前文件的序列号
    const currentNumber = start + (fileIndex * step);
    const sequenceNumber = currentNumber.toString().padStart(width, '0');
    
    // 根据位置添加序列号
    if (position === 'prefix') {
      return `${sequenceNumber}_${fileName}`;
    } else {
      // suffix - 在扩展名前添加
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        const nameWithoutExt = fileName.substring(0, lastDotIndex);
        const extension = fileName.substring(lastDotIndex);
        return `${nameWithoutExt}_${sequenceNumber}${extension}`;
      } else {
        return `${fileName}_${sequenceNumber}`;
      }
    }
  }
  
  getSelectedPosition() {
    const selectedRadio = Array.from(this.positionRadios).find(radio => radio.checked);
    return selectedRadio ? selectedRadio.value : 'prefix';
  }
  
  // 获取高亮的预览结果
  getHighlightedPreview(fileName, fileIndex = 0) {
    const result = this.applyRule(fileName, fileIndex);
    const position = this.getSelectedPosition();
    const start = parseInt(this.startInput.value) || 1;
    const step = this.stepInput ? (parseInt(this.stepInput.value) || 1) : 1;
    const width = parseInt(this.widthInput.value) || 2;
    
    const currentNumber = start + (fileIndex * step);
    const sequenceNumber = currentNumber.toString().padStart(width, '0');
    
    if (position === 'prefix') {
      return `<span class="highlight">${sequenceNumber}_</span>${fileName}`;
    } else {
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        const nameWithoutExt = fileName.substring(0, lastDotIndex);
        const extension = fileName.substring(lastDotIndex);
        return `${nameWithoutExt}_<span class="highlight">${sequenceNumber}</span>${extension}`;
      } else {
        return `${fileName}_<span class="highlight">${sequenceNumber}</span>`;
      }
    }
  }
  
  // 获取规则数据
  getRuleData() {
    return {
      start: parseInt(this.startInput.value) || 1,
      step: this.stepInput ? (parseInt(this.stepInput.value) || 1) : 1,
      width: parseInt(this.widthInput.value) || 2,
      position: this.getSelectedPosition(),
      order: this.orderSelect ? this.orderSelect.value : 'current'
    };
  }
  
  // 设置规则数据
  setRuleData(data) {
    if (this.startInput) this.startInput.value = data.start || 1;
    if (this.stepInput) this.stepInput.value = data.step || 1;
    if (this.widthInput) this.widthInput.value = data.width || 2;
    
    if (data.position) {
      this.positionRadios.forEach(radio => {
        radio.checked = radio.value === data.position;
      });
    }
    
    if (this.orderSelect && data.order) {
      this.orderSelect.value = data.order;
    }
    
    this.validateInputs();
    this.updateExamples();
  }
  
  // 重置规则
  reset() {
    if (this.startInput) this.startInput.value = '1';
    if (this.stepInput) this.stepInput.value = '1';
    if (this.widthInput) this.widthInput.value = '2';
    
    // 重置为前缀
    this.positionRadios.forEach(radio => {
      radio.checked = radio.value === 'prefix';
    });
    
    if (this.orderSelect) this.orderSelect.value = 'current';
    
    this.clearInputError('start');
    this.clearInputError('step');
    this.clearInputError('width');
    this.updateExamples();
  }
}

// 导出到全局
window.SequenceRuleManager = SequenceRuleManager;