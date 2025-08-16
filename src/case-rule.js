// 大小写转换规则管理器
class CaseRuleManager {
  constructor() {
    this.caseTypeRadios = null;
    this.preserveExtensionCheckbox = null;
    this.validationTimeout = null;
    this.init();
  }
  
  init() {
    this.caseTypeRadios = document.querySelectorAll('input[name="caseType"]');
    this.preserveExtensionCheckbox = document.getElementById('case-preserve-extension');
    
    if (this.caseTypeRadios.length > 0) {
      this.setupValidation();
      this.setupPreviewUpdates();
      this.setupExamples();
    }
  }
  
  setupValidation() {
    // 添加单选框变化监听
    this.caseTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.validateInputs();
        this.updateExamples();
      });
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
    
    this.caseTypeRadios.forEach(radio => {
      radio.addEventListener('change', updatePreview);
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
    const container = document.getElementById('tab-case');
    if (!container) return;
    
    // 检查是否已存在示例区域
    let exampleDiv = container.querySelector('.case-examples');
    if (!exampleDiv) {
      exampleDiv = document.createElement('div');
      exampleDiv.className = 'case-examples';
      exampleDiv.innerHTML = `
        <h6>预览示例</h6>
        <div id="case-example-list" class="example-list"></div>
      `;
      container.appendChild(exampleDiv);
    }
  }
  
  updateExamples() {
    const exampleList = document.getElementById('case-example-list');
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
      'My Photo Album.jpg',
      'IMPORTANT_DOCUMENT.pdf',
      'music file 01.mp3',
      'Video-Recording.mp4'
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
    
    // 验证是否选择了转换类型
    const selectedType = this.getSelectedCaseType();
    if (!selectedType) {
      this.setInputError('caseType', '请选择一种大小写转换规则');
      isValid = false;
    } else {
      this.clearInputError('caseType');
    }
    
    this.updateExamples();
    return isValid;
  }
  
  setInputError(inputType, message) {
    const helpElement = document.getElementById('case-legend');
    
    if (helpElement) {
      helpElement.style.color = 'var(--pico-del-color)';
      helpElement.setAttribute('role', 'alert');
    }
    
    // 屏幕阅读器公告
    if (window.announceToScreenReader) {
      window.announceToScreenReader(`大小写转换输入错误: ${message}`);
    }
  }
  
  clearInputError(inputType) {
    const helpElement = document.getElementById('case-legend');
    
    if (helpElement) {
      helpElement.style.color = '';
      helpElement.removeAttribute('role');
    }
  }
  
  getSelectedCaseType() {
    const selectedRadio = Array.from(this.caseTypeRadios).find(radio => radio.checked);
    return selectedRadio ? selectedRadio.value : null;
  }
  
  // 应用大小写转换规则
  applyRule(fileName) {
    const caseType = this.getSelectedCaseType();
    const preserveExtension = this.preserveExtensionCheckbox ? this.preserveExtensionCheckbox.checked : true;
    
    if (!caseType) return fileName;
    
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
    
    let result;
    switch (caseType) {
      case 'upper':
        result = targetString.toUpperCase();
        break;
      case 'lower':
        result = targetString.toLowerCase();
        break;
      case 'title':
        result = this.toTitleCase(targetString);
        break;
      case 'snake':
        result = this.toSnakeCase(targetString);
        break;
      case 'kebab':
        result = this.toKebabCase(targetString);
        break;
      default:
        result = targetString;
    }
    
    return result + extension;
  }
  
  toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
  
  toSnakeCase(str) {
    return str
      .replace(/\W+/g, '_') // 替换非字母数字字符为下划线
      .replace(/([a-z\d])([A-Z])/g, '$1_$2') // 在小写字母和大写字母之间添加下划线
      .toLowerCase()
      .replace(/^_+|_+$/g, '') // 移除开头和结尾的下划线
      .replace(/_+/g, '_'); // 合并多个连续下划线
  }
  
  toKebabCase(str) {
    return str
      .replace(/\W+/g, '-') // 替换非字母数字字符为短横线
      .replace(/([a-z\d])([A-Z])/g, '$1-$2') // 在小写字母和大写字母之间添加短横线
      .toLowerCase()
      .replace(/^-+|-+$/g, '') // 移除开头和结尾的短横线
      .replace(/-+/g, '-'); // 合并多个连续短横线
  }
  
  // 获取高亮的预览结果
  getHighlightedPreview(fileName) {
    const result = this.applyRule(fileName);
    
    if (result === fileName) {
      return fileName;
    }
    
    // 高亮变化的部分
    let highlightedResult = '';
    const minLength = Math.min(fileName.length, result.length);
    
    for (let i = 0; i < Math.max(fileName.length, result.length); i++) {
      const originalChar = fileName[i] || '';
      const resultChar = result[i] || '';
      
      if (originalChar !== resultChar) {
        if (resultChar) {
          highlightedResult += `<span class="case-changed">${resultChar}</span>`;
        }
      } else {
        highlightedResult += resultChar;
      }
    }
    
    return highlightedResult;
  }
  
  // 获取规则数据
  getRuleData() {
    return {
      caseType: this.getSelectedCaseType(),
      preserveExtension: this.preserveExtensionCheckbox ? this.preserveExtensionCheckbox.checked : true
    };
  }
  
  // 设置规则数据
  setRuleData(data) {
    // 设置选中的大小写类型
    if (data.caseType) {
      this.caseTypeRadios.forEach(radio => {
        radio.checked = radio.value === data.caseType;
      });
    }
    
    // 设置保留扩展名选项
    if (this.preserveExtensionCheckbox) {
      this.preserveExtensionCheckbox.checked = data.preserveExtension !== false;
    }
    
    this.validateInputs();
    this.updateExamples();
  }
  
  // 重置规则
  reset() {
    // 取消所有单选框选择
    this.caseTypeRadios.forEach(radio => {
      radio.checked = false;
    });
    
    // 重置保留扩展名为选中状态
    if (this.preserveExtensionCheckbox) {
      this.preserveExtensionCheckbox.checked = true;
    }
    
    this.clearInputError('caseType');
    this.updateExamples();
  }
}

// 导出到全局
window.CaseRuleManager = CaseRuleManager;