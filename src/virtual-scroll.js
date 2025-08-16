// 虚拟滚动管理器
class VirtualScrollManager {
  constructor(container, itemHeight, bufferSize = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.bufferSize = bufferSize;
    this.scrollTop = 0;
    this.containerHeight = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.renderedItems = new Map(); // 缓存已渲染的行
    this.lastPreviewData = new Map(); // 缓存上次预览数据，用于diff高亮
    
    this.setupScrollContainer();
    this.bindScrollEvents();
  }
  
  setupScrollContainer() {
    // 确保容器有固定高度和滚动
    const scrollContainer = this.container.closest('.file-list-scroll');
    if (scrollContainer) {
      scrollContainer.style.position = 'relative';
      scrollContainer.style.overflow = 'auto';
      this.scrollContainer = scrollContainer;
    } else {
      this.scrollContainer = this.container.parentElement;
    }
    
    // 设置表格容器为相对定位
    const table = this.container.closest('table');
    if (table) {
      table.style.position = 'relative';
    }
    
    // 创建虚拟滚动的占位容器
    this.spacer = document.createElement('tr');
    this.spacer.style.position = 'absolute';
    this.spacer.style.top = '0';
    this.spacer.style.left = '0';
    this.spacer.style.width = '100%';
    this.spacer.style.pointerEvents = 'none';
    this.spacer.style.visibility = 'hidden';
    this.spacer.innerHTML = '<td colspan="7"></td>';
  }
  
  bindScrollEvents() {
    let scrollTimeout;
    this.scrollContainer.addEventListener('scroll', () => {
      this.scrollTop = this.scrollContainer.scrollTop;
      
      // 防抖处理，避免频繁重绘
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateVisibleRange();
        this.renderVisibleItems();
      }, 16); // ~60fps
    });
    
    // 监听容器大小变化
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateContainerHeight();
        this.updateVisibleRange();
        this.renderVisibleItems();
      });
      this.resizeObserver.observe(this.scrollContainer);
    }
  }
  
  updateContainerHeight() {
    this.containerHeight = this.scrollContainer.clientHeight;
  }
  
  updateVisibleRange() {
    this.updateContainerHeight();
    
    const totalItems = window.loadedFiles ? window.loadedFiles.length : 0;
    if (totalItems === 0) return;
    
    // 计算可见范围
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const visibleEnd = Math.min(visibleStart + visibleCount, totalItems);
    
    // 添加缓冲区
    this.visibleStart = Math.max(0, visibleStart - this.bufferSize);
    this.visibleEnd = Math.min(totalItems, visibleEnd + this.bufferSize);
    
    // 更新占位容器高度
    if (this.spacer) {
      this.spacer.style.height = (totalItems * this.itemHeight) + 'px';
      // 确保占位容器在表格中
      if (!this.spacer.parentElement && this.container) {
        this.container.appendChild(this.spacer);
      }
    }
  }
  
  renderVisibleItems() {
    if (!window.loadedFiles || window.loadedFiles.length === 0) return;
    
    const thisToken = ++window.renderToken;
    
    // 清空当前表格内容
    this.container.innerHTML = '';
    
    // 创建文档片段
    const fragment = document.createDocumentFragment();
    
    // 渲染可见范围内的项目
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      if (thisToken !== window.renderToken) return; // 检查是否过期
      
      const fileInfo = window.loadedFiles[i];
      if (!fileInfo) continue;
      
      const row = this.createFileRow(fileInfo, i);
      
      // 设置行的绝对定位
      row.style.position = 'absolute';
      row.style.top = (i * this.itemHeight) + 'px';
      row.style.width = '100%';
      row.style.height = this.itemHeight + 'px';
      row.style.boxSizing = 'border-box';
      
      fragment.appendChild(row);
    }
    
    this.container.appendChild(fragment);
    
    // 更新状态栏
    this.updateStatusAfterRender();
  }
  
  createFileRow(fileInfo, index) {
    const hasChange = fileInfo.newPath && fileInfo.newPath !== fileInfo.name;
    let warn = "";
    let rowClass = "";
    
    // 检查diff变化并高亮
    const currentPreview = fileInfo.newPath || fileInfo.name;
    const lastPreview = this.lastPreviewData.get(index);
    const isDiffHighlight = lastPreview && lastPreview !== currentPreview;
    
    // 更新预览数据缓存
    this.lastPreviewData.set(index, currentPreview);

    if (fileInfo.writable === false) {
      warn += ' <span title="无写权限，跳过" style="color:#e87b00;font-size:1.1em;vertical-align:middle;">🔒</span>';
      rowClass += "file-row-readonly ";
    }
    if (fileInfo.hasConflict) {
      warn += ' <span style="color:#c00;font-size:0.9em;">(重名冲突)</span>';
      rowClass += "file-row-conflict ";
    } else if (fileInfo.invalidChar) {
      warn += ' <span style="color:#c00;font-size:0.9em;">(非法字符)</span>';
      rowClass += "file-row-invalid ";
    }

    const row = document.createElement("tr");
    row.dataset.index = String(index);
    row.setAttribute('role', 'row');
    row.setAttribute('aria-selected', fileInfo.selected ? 'true' : 'false');
    row.innerHTML = `
      <td role="gridcell"><input type="checkbox" class="row-select" data-index="${index}" ${fileInfo.selected ? "checked" : ""} aria-label="选择文件 ${fileInfo.name}" /></td>
      <th scope="row" role="rowheader">${index + 1}</th>
      <td role="gridcell">${fileInfo.name}</td>
      <td role="gridcell">${fileInfo.extension || ""}</td>
      <td role="gridcell">${window.formatFileSize ? window.formatFileSize(fileInfo.size) : fileInfo.size}</td>
      <td role="gridcell">${window.formatTime ? window.formatTime(fileInfo.modified_ms) : fileInfo.modified_ms}</td>
      <td role="gridcell" class="preview-cell ${hasChange ? "preview-highlight" : "dimmed"} ${isDiffHighlight ? "diff-highlight" : ""}" style="font-family:monospace;">
        ${fileInfo.newPath || "(无变化)"} ${warn}
      </td>
    `;
    row.className = (rowClass + (fileInfo.selected ? " selected-row" : "")).trim();
    
    return row;
  }
  
  updateStatusAfterRender() {
    try {
      const selectedCount = window.loadedFiles.filter(f => f.selected).length;
      if (typeof window.updateStatusBar === 'function') {
        window.updateStatusBar({ total: window.loadedFiles.length, selected: selectedCount });
      }
      const selectAllEl = document.getElementById('select-all');
      if (selectAllEl) {
        selectAllEl.indeterminate = selectedCount > 0 && selectedCount < window.loadedFiles.length;
        selectAllEl.checked = selectedCount > 0 && selectedCount === window.loadedFiles.length;
      }
    } catch (_) {}
  }
  
  // 批量局部刷新方法
  batchUpdateItems(indices) {
    if (!indices || indices.length === 0) return;
    
    indices.forEach(index => {
      if (index >= this.visibleStart && index < this.visibleEnd) {
        const existingRow = this.container.querySelector(`tr[data-index="${index}"]`);
        if (existingRow && window.loadedFiles[index]) {
          const newRow = this.createFileRow(window.loadedFiles[index], index);
          newRow.style.position = 'absolute';
          newRow.style.top = (index * this.itemHeight) + 'px';
          newRow.style.width = '100%';
          newRow.style.height = this.itemHeight + 'px';
          newRow.style.boxSizing = 'border-box';
          
          existingRow.replaceWith(newRow);
        }
      }
    });
    
    this.updateStatusAfterRender();
  }
  
  // 清理方法
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.spacer && this.spacer.parentElement) {
      this.spacer.parentElement.removeChild(this.spacer);
    }
    this.lastPreviewData.clear();
  }
}

// 导出到全局
window.VirtualScrollManager = VirtualScrollManager;