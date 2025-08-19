// 统一错误提示函数（顶部toast横幅）
function showErrorMsg(msg, isSuccess = false) {
  if (typeof msg === "object" && msg !== null) {
    msg = msg.error_message || msg.message || JSON.stringify(msg);
  }

// 选择与排序相关事件绑定
function setupSelectionAndSorting() {
  // 全选/取消全选
  const selectAll = document.getElementById('select-all');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checked = e.target.checked;
      
      // 获取当前显示的文件列表
      let filesToSelect = loadedFiles;
      if (window.searchFilterManager && window.searchFilterManager.hasActiveFilters()) {
        filesToSelect = window.searchFilterManager.getDisplayedFiles();
      }
      
      // 只对当前显示的文件进行全选/取消全选
      filesToSelect.forEach(f => f.selected = checked);
      lastSelectedIndex = -1;
      updateFileTable();
      
      // 公告给屏幕阅读器
      if (typeof window.announceToScreenReader === 'function') {
        const action = checked ? '全选' : '取消全选';
        const count = filesToSelect.length;
        const filtered = window.searchFilterManager && window.searchFilterManager.hasActiveFilters();
        const message = filtered ? `${action} ${count} 个显示的文件` : `${action} ${count} 个文件`;
        window.announceToScreenReader(message);
      }
    });
  }

  // 行内复选框与行点击 - 事件委托
  if (!fileTable) fileTable = document.getElementById('file-table-body');
  if (fileTable) {
    // 复选框变更
    fileTable.addEventListener('change', (e) => {
      const target = e.target;
      if (target && target.classList && target.classList.contains('row-select')) {
        const idx = parseInt(target.getAttribute('data-index'));
        if (!isNaN(idx) && loadedFiles[idx]) {
          loadedFiles[idx].selected = !!target.checked;
          lastSelectedIndex = idx;
          // 仅同步状态栏和全选状态，避免整表重绘
          try {
            const selectedCount = loadedFiles.filter(f => f.selected).length;
            if (typeof window.updateStatusBar === 'function') {
              window.updateStatusBar({ total: loadedFiles.length, selected: selectedCount });
            }
            const selectAllEl = document.getElementById('select-all');
            if (selectAllEl) {
              selectAllEl.indeterminate = selectedCount > 0 && selectedCount < loadedFiles.length;
              selectAllEl.checked = selectedCount > 0 && selectedCount === loadedFiles.length;
            }
          } catch (_) {}
        }
      }
    });

    // 行点击（支持Shift范围选择）
    fileTable.addEventListener('click', (e) => {
      const tr = e.target && e.target.closest('tr');
      if (!tr) return;
      // 避免点击复选框重复处理
      if (e.target && e.target.classList && e.target.classList.contains('row-select')) return;

      const idxStr = tr.getAttribute('data-index');
      const idx = idxStr ? parseInt(idxStr) : NaN;
      if (isNaN(idx) || !loadedFiles[idx]) return;

      const baseState = !loadedFiles[idx].selected;
      if (e.shiftKey && lastSelectedIndex >= 0 && lastSelectedIndex < loadedFiles.length) {
        const [start, end] = [Math.min(lastSelectedIndex, idx), Math.max(lastSelectedIndex, idx)];
        for (let i = start; i <= end; i++) {
          loadedFiles[i].selected = baseState;
        }
      } else {
        loadedFiles[idx].selected = baseState;
      }
      lastSelectedIndex = idx;
      updateFileTable();
    });
  }

  // 列表表头排序
  const sortableHeaders = [
    { id: 'th-name', key: 'name', label: '文件名' },
    { id: 'th-ext', key: 'extension', label: '扩展名' },
    { id: 'th-size', key: 'size', label: '文件大小' },
    { id: 'th-time', key: 'modified_ms', label: '修改时间' },
  ];
  sortableHeaders.forEach(({ id, key, label }) => {
    const el = document.getElementById(id);
    if (!el) return;
    
    const handleSort = () => {
      const wasAsc = sortAsc;
      if (sortKey === key) {
        sortAsc = !sortAsc;
      } else {
        sortKey = key;
        sortAsc = true;
      }
      updateFileTable();
      // 序列号预览依赖顺序
      updatePreview();
      updateSortIndicators();
      
      // 公告排序状态
      const direction = sortAsc ? '升序' : '降序';
      announceToScreenReader(`按${label}${direction}排序`);
    };
    
    // 点击事件
    el.addEventListener('click', handleSort);
    
    // 键盘事件 (Enter 和 Space)
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSort();
      }
    });
  });

  // 初始化一次指示
  updateSortIndicators();
}

// 更新表头排序箭头（▲/▼）
function updateSortIndicators() {
  const map = [
    { id: 'th-name', label: '原文件名', key: 'name' },
    { id: 'th-ext', label: '扩展名', key: 'extension' },
    { id: 'th-size', label: '大小', key: 'size' },
    { id: 'th-time', label: '修改时间', key: 'modified_ms' },
  ];
  map.forEach(({ id, label, key }) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (sortKey === key) {
      el.textContent = `${label} ${sortAsc ? '▲' : '▼'}`;
    } else {
      el.textContent = label;
    }
  });
}
  // 常见错误归纳
  if (!isSuccess) {
    if (msg.includes("EACCES") || msg.includes("权限"))
      msg = "操作被拒绝：请检查文件权限";
    else if (msg.includes("busy") || msg.includes("占用"))
      msg = "文件被占用或正在使用，无法操作";
    else if (msg.includes("not found") || msg.includes("不存在"))
      msg = "目标文件不存在";
    else if (msg.includes("conflict") || msg.includes("重名"))
      msg = "存在重名冲突，请检查文件名";
    else if (msg.includes("timeout") || msg.includes("超时"))
      msg = "操作超时，请重试或分批导入";
  }
  let toast = document.getElementById("toast-banner");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-banner";
    toast.style.position = "fixed";
    toast.style.top = "24px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.zIndex = "9999";
    toast.style.minWidth = "220px";
    toast.style.maxWidth = "90vw";
    toast.style.padding = "0.8em 1.7em";
    toast.style.borderRadius = "1.6em";
    toast.style.fontSize = "1.07em";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 4px 32px #0002";
    toast.style.textAlign = "center";
    toast.style.transition = "opacity 0.3s";
    document.body.appendChild(toast);
  }
  toast.style.opacity = "1";
  toast.style.background = isSuccess ? "#e7fbe7" : "#fff3f3";
  toast.style.color = isSuccess ? "#1a7f1a" : "#c00";
  toast.style.border = isSuccess
    ? "1.5px solid #8be28b"
    : "1.5px solid #ffb3b3";
  toast.textContent = (isSuccess ? "✅ " : "❌ ") + msg;
  clearTimeout(toast._timeoutId);
  toast._timeoutId = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, 3200);
}

// 主题管理现在由 theme-manager.js 处理
// 这里只保留必要的初始化代码

// 初始化主题函数（兼容性保留）
function initializeTheme() {
  // 主题管理现在由ThemeManager处理
  console.log("🎨 主题初始化由ThemeManager处理");
}

// Tab组滚动检测现在由ThemeManager处理

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";

// 立即执行的测试
console.log("=== JavaScript 文件已加载 ===");

// 全局变量存储文件信息
let loadedFiles = [];


// 立即暴露函数到window对象，不等待DOM加载
window.getLoadedFiles = () => {
  console.log("🔍 [main.js] getLoadedFiles被调用，返回:", loadedFiles);
  return loadedFiles;
};

// 暴露设置文件列表的函数

// 屏幕阅读器公告函数 - 可访问性支持
function announceToScreenReader(message) {
  // 创建一个临时的aria-live区域来公告消息
  let announcer = document.getElementById('screen-reader-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'screen-reader-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }
  
  // 清空后设置新消息，确保屏幕阅读器能够读出
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
  
  // 5秒后清空消息
  setTimeout(() => {
    announcer.textContent = '';
  }, 5000);
}

// 暴露公告函数到全局
window.announceToScreenReader = announceToScreenReader;

// 键盘导航检测 - 可访问性增强
function initializeKeyboardNavigation() {
  let isUsingKeyboard = false;
  
  // 检测键盘使用
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      if (!isUsingKeyboard) {
        isUsingKeyboard = true;
        document.body.classList.add('using-keyboard');
        document.body.classList.remove('using-mouse');
      }
    }
  });
  
  // 检测鼠标使用
  document.addEventListener('mousedown', () => {
    if (isUsingKeyboard) {
      isUsingKeyboard = false;
      document.body.classList.add('using-mouse');
      document.body.classList.remove('using-keyboard');
    }
  });
  
  // 初始状态设为鼠标模式
  document.body.classList.add('using-mouse');
}

// 在DOM加载后初始化键盘导航检测
document.addEventListener('DOMContentLoaded', initializeKeyboardNavigation);

// 检测用户动画偏好
function initializeMotionPreferences() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  function updateMotionPreference(mediaQuery) {
    if (mediaQuery.matches) {
      document.documentElement.classList.add('reduced-motion');
      console.log('用户偏好减少动画，已禁用动画效果');
    } else {
      document.documentElement.classList.remove('reduced-motion');
      console.log('用户允许动画，已启用动画效果');
    }
  }
  
  // 初始检查
  updateMotionPreference(prefersReducedMotion);
  
  // 监听偏好变化
  prefersReducedMotion.addEventListener('change', updateMotionPreference);
}

// 在DOM加载后初始化动画偏好检测
document.addEventListener('DOMContentLoaded', () => {
  initializeMotionPreferences();
  
  // 初始化撤销/重做控制器
  try {
    // 使用动态导入避免循环依赖
    import('../features/undo-redo/undo-redo-controller.js')
      .then(({ getUndoRedoController }) => {
        window.undoRedoController = getUndoRedoController();
        console.log('✅ UndoRedoController initialized');
      })
      .catch(error => {
        console.error('Failed to initialize UndoRedoController:', error);
      });
  } catch (error) {
    console.error('Error loading UndoRedoController:', error);
  }
});

// 主题切换视觉通知现在由ThemeManager处理
window.setLoadedFiles = (files) => {
  console.log("🔧 [main.js] setLoadedFiles被调用，设置:", files);
  loadedFiles = files.map(filePath => ({
    name: filePath.split(/[\\/]/).pop(),
    path: filePath,
    readable: true,
    writable: true,
    newPath: filePath.split(/[\\/]/).pop(),
    hasConflict: false,
    invalidChar: false,
    selected: false
  }));
  console.log("🔧 [main.js] loadedFiles已更新:", loadedFiles);
};

// 暴露全局变量给虚拟滚动管理器使用
window.loadedFiles = loadedFiles;
window.renderToken = renderToken;
window.formatFileSize = formatFileSize;
window.formatTime = formatTime;

// 规则管理器已移至后端Rust实现

// 立即暴露所有需要的函数
window.updatePreview = () => {
  console.log("🔄 [window.updatePreview] 被调用");
  if (typeof updatePreview === 'function') {
    updatePreview();
  } else {
    console.warn("⚠️ [window.updatePreview] updatePreview函数还未定义");
  }
};

// 暴露executeRename函数（需要等待函数定义后）
setTimeout(() => {
  window.executeRename = executeRename;
  console.log("🔧 [main.js] executeRename函数已暴露到window对象");
}, 0);

console.log("🔧 [main.js] 函数已立即暴露");

// 操作历史持久化
function saveHistory() {

}
function loadHistory() {
  try {
    const u = localStorage.getItem("renameUndoStack");

  } catch (e) {

  }
}

// DOM 元素引用
let dropZone;
let fileTable;
let fileCountElement;
let clearAllButton;
let applyRenameButton;
let contextMenuEl; // 右键菜单容器
let _ctxMenuBound = false; // 防重复绑定
let _shortcutsBound = false; // 防重复绑定

// 渲染控制与工具
let renderToken = 0; // 用于中止过期的渲染任务
// 排序与选择状态
let sortKey = null; // 可为 'name' | 'extension' | 'size' | 'modified_ms'
let sortAsc = true;
let lastSelectedIndex = -1;

// 虚拟滚动相关
let virtualScrollManager = null;
const VIRTUAL_SCROLL_THRESHOLD = 1000; // 超过1000行启用虚拟滚动
const VIRTUAL_ITEM_HEIGHT = 40; // 每行高度（像素）
const VIRTUAL_BUFFER_SIZE = 5; // 缓冲区大小（上下各5行）

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || isNaN(bytes)) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let num = bytes;
  while (num >= 1024 && i < units.length - 1) {
    num /= 1024;
    i++;
  }
  return (i === 0 ? num : num.toFixed(1)) + " " + units[i];
}

function formatTime(ms) {
  if (!ms) return "-";
  try {
    return new Date(ms).toLocaleString();
  } catch (_) {
    return "-";
  }
}

// 安全获取DOM元素的函数
function ensureElement(elementVar, elementId, elementName) {
  if (!elementVar) {
    console.warn(`⚠️ [ensureElement] ${elementName}未初始化，重新获取`);
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`❌ [ensureElement] 无法找到${elementId}元素`);
    }
    return element;
  }
  return elementVar;
}

// Tab 相关元素
let tabLinks;
let tabContents;

// 输入框元素
let findInput;
let replaceInput;
let startInput;
let digitsInput;
let positionRadios;

// 确保DOM加载完成后执行
document.addEventListener("DOMContentLoaded", () => {
  // 初始化主题（优先执行，确保正确的主题在页面渲染前应用）
  initializeTheme();
  
  initializeEventListeners();
  
  // 初始化键盘导航检测
  initializeKeyboardNavigation();

  loadHistory();
  console.log("=== DOM 已加载，开始初始化 ===");

  initializeElements();
  
  initializeEventListeners();
  
  // 规则管理器已移至后端，无需前端初始化
  
  // executeRename函数已在文件开头暴露
});

// 键盘导航检测
function initializeKeyboardNavigation() {
  let isUsingKeyboard = false;
  
  // 检测键盘使用
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      if (!isUsingKeyboard) {
        isUsingKeyboard = true;
        document.body.classList.add('keyboard-navigation-active');
      }
    }
  });
  
  // 检测鼠标使用
  document.addEventListener('mousedown', () => {
    if (isUsingKeyboard) {
      isUsingKeyboard = false;
      document.body.classList.remove('keyboard-navigation-active');
    }
  });
  
  // 检测触摸使用
  document.addEventListener('touchstart', () => {
    if (isUsingKeyboard) {
      isUsingKeyboard = false;
      document.body.classList.remove('keyboard-navigation-active');
    }
  });
}

function initializeElements() {
  console.log("🔧 [初始化] 开始初始化DOM元素");
  
  dropZone = document.getElementById("drop-zone");
  fileTable = document.getElementById("file-table-body");
  fileCountElement = document.getElementById("file-count");
  clearAllButton = document.getElementById("clear-all");
  applyRenameButton = document.getElementById("apply-rename");

  console.log("🔧 [初始化] 主要元素:", {
    dropZone: !!dropZone,
    fileTable: !!fileTable,
    fileCountElement: !!fileCountElement,
    applyRenameButton: !!applyRenameButton,
    clearAllButton: !!clearAllButton
  });

  tabLinks = document.querySelectorAll(".tab-link");
  tabContents = document.querySelectorAll(".tab-content");

  findInput = document.getElementById("find");
  replaceInput = document.getElementById("replace");
  startInput = document.getElementById("start");
  digitsInput = document.getElementById("digits");
  positionRadios = document.querySelectorAll('input[name="position"]');
  
  console.log("🔧 [初始化] 输入元素:", {
    findInput: !!findInput,
    replaceInput: !!replaceInput,
    startInput: !!startInput,
    digitsInput: !!digitsInput,
    positionRadiosCount: positionRadios.length,
    tabLinksCount: tabLinks.length,
    tabContentsCount: tabContents.length
  });
  
  // 检查关键元素是否存在
  const missingElements = [];
  if (!fileTable) missingElements.push("file-table-body");
  if (!fileCountElement) missingElements.push("file-count");
  if (!applyRenameButton) missingElements.push("apply-rename");
  
  if (missingElements.length > 0) {
    console.warn("⚠️ [初始化] 缺少关键DOM元素:", missingElements);
    console.log("⚠️ [初始化] 这些元素将在需要时重新获取");
  } else {
    console.log("✅ [初始化] 所有关键DOM元素初始化成功");
  }
}

function initializeEventListeners() {
  // 文件拖拽和选择
  setupFileHandling();

  // Tab 切换 - 现在由HTML中的逻辑处理
  // setupTabSwitching();

  // 实时预览
  setupRealTimePreview();

  // 按钮事件
  setupButtonEvents();

  // Tauri 拖拽事件监听
  setupTauriDragDrop();

  // 选择与排序事件
  setupSelectionAndSorting();

  // 右键菜单与删除
  setupContextMenu();
  setupKeyboardShortcuts();
}

// 文件处理相关
function setupFileHandling() {
  // 选择文件按钮
  const selectFilesBtn = document.getElementById("select-files-btn");
  const selectFolderBtn = document.getElementById("select-folder-btn");

  selectFilesBtn.addEventListener("click", async () => {
    try {
      const selected = await open({
        multiple: true,
        directory: false,
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        await handleFilePathsWithFolders(paths);
      }
    } catch (error) {
      console.error("文件选择失败:", error);
      alert("文件选择失败: " + error.message);
    }
  });

  selectFolderBtn.addEventListener("click", async () => {
    try {
      const selected = await open({
        multiple: true,
        directory: true,
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        await handleFilePathsWithFolders(paths);
      }
    } catch (error) {
      console.error("文件夹选择失败:", error);
      showErrorMsg("文件夹选择失败: " + error.message);
    }
  });

  // 基本的拖拽样式处理（实际拖拽由 Tauri 事件处理）
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Tauri 事件系统会处理实际的文件拖拽
  });
}

// Tauri 拖拽事件处理
async function setupTauriDragDrop() {
  try {
    console.log("=== 开始设置 Tauri 拖拽事件 ===");

    // 监听文件拖拽事件
    await listen("tauri://file-drop", async (event) => {
      console.log("🚀 检测到 Tauri 文件拖拽事件:", event);
      const filePaths = event.payload;

      if (filePaths && filePaths.length > 0) {
        console.log("🚀 拖拽的文件路径:", filePaths);
        await handleFilePathsWithFolders(filePaths);
      }
    });

    // 监听拖拽悬停事件
    await listen("tauri://file-drop-hover", (event) => {
      console.log("🚀 文件拖拽悬停:", event);
      document.body.style.backgroundColor = "var(--pico-primary-background)";
    });

    // 监听拖拽取消事件
    await listen("tauri://file-drop-cancelled", (event) => {
      console.log("🚀 文件拖拽取消:", event);
      document.body.style.backgroundColor = "";
    });

    console.log("=== Tauri 拖拽事件监听器已设置 ===");

    // 测试：3秒后显示一个提示，确认 JavaScript 正在运行
    setTimeout(() => {
      console.log("✅ JavaScript 正在正常运行，拖拽功能应该已激活");
      console.log("✅ 请尝试从 Finder 拖拽文件到应用窗口");
    }, 3000);
  } catch (error) {
    console.error("❌ 设置 Tauri 拖拽事件失败:", error);
  }
}

async function handleFilePathsWithFolders(paths) {
  // 显示加载中提示
  const fileCountElem = document.getElementById("file-count");
  let loadingBackup = "";
  if (fileCountElem) {
    loadingBackup = fileCountElem.textContent;
    fileCountElem.textContent = "正在扫描文件，请稍候...";
  }
  let timeoutId = null;
  try {
    // 超时保护（如10秒未返回，提示用户）
    let timedOut = false;
    timeoutId = setTimeout(() => {
      timedOut = true;
      if (fileCountElem)
        fileCountElem.textContent = "加载文件超时，请检查文件夹内容或重试";
    }, 10000);

    // 调用 Tauri 后端递归获取所有文件
    const files = await invoke("list_files", { paths });
    clearTimeout(timeoutId);
    if (timedOut) return;

    // 去重与非法路径拦截（list_files 已只返回文件，这里主要做去重）
    const existing = new Set(loadedFiles.map((f) => f.path));
    const uniqueFiles = [];
    let duplicateCount = 0;
    for (const f of files) {
      if (existing.has(f)) duplicateCount++;
      else uniqueFiles.push(f);
    }

    if (uniqueFiles.length === 0) {
      updateFileCount();
      if (fileCountElem) {
        fileCountElem.textContent = `已加载 ${loadedFiles.length} 个文件`;
      }
      if (duplicateCount > 0) {
        showErrorMsg(`检测到 ${duplicateCount} 个重复路径，已忽略`);
      }
      return;
    }

    // 批量获取元数据与权限
    if (fileCountElem) {
      fileCountElem.textContent = `正在获取元数据（共 ${uniqueFiles.length} 个）...`;
    }
    const details = await invoke("get_file_infos", { paths: uniqueFiles });
    // 合并到已加载文件
    loadedFiles = loadedFiles.concat(details.map((d) => ({
      name: d.name,
      path: d.path,
      extension: d.extension || "",
      size: d.size,
      modified_ms: d.modified_ms,
      readable: d.readable,
      writable: d.writable,
      // 预留前端计算字段
      newPath: undefined,
      hasConflict: false,
      invalidChar: false,
      selected: false,
    })));
    
    // 同步到window对象
    window.loadedFiles = loadedFiles;

    // 渲染与统计
    updateFileTable();
    updateFileCount();

    // 通知搜索过滤管理器文件列表已更新
    if (window.searchFilterManager) {
      window.searchFilterManager.onFilesUpdated();
    }

    updatePreview();
    // 只显示文件数量统计
    const fileCountElem2 = document.getElementById("file-count");
    if (fileCountElem2) {
      fileCountElem2.textContent = `已加载 ${loadedFiles.length} 个文件`;
    }
    // 空状态提示行显示/隐藏
    const emptyRow = document.getElementById("empty-tip-row");
    if (emptyRow)
      emptyRow.style.display = loadedFiles.length === 0 ? "" : "none";
    // 空文件夹或无有效文件时友好提示
    if (loadedFiles.length === 0) {
      showErrorMsg("未检测到可导入的文件。");
    }
    if (duplicateCount > 0) {
      showErrorMsg(`检测到 ${duplicateCount} 个重复路径，已忽略`);
    }
  } catch (error) {
    console.error("处理文件路径失败:", error);
    showErrorMsg("处理文件路径失败: " + error.message);
  } finally {
    if (fileCountElem) fileCountElem.textContent = loadingBackup;
    if (typeof window.updateStatusBar === "function") {
      try {
        const totalNow = loadedFiles.length;
        const selectedNow = loadedFiles.filter(f => f.selected).length;
        window.updateStatusBar({ total: totalNow, selected: selectedNow });
      } catch (_) {}
    }
  }
}

function clearTable() {
  if (!fileTable) {
    console.warn("⚠️ [clearTable] fileTable未初始化，重新获取");
    fileTable = document.getElementById("file-table-body");
  }
  if (!fileTable) {
    console.error("❌ [clearTable] 无法找到file-table-body元素");
    return;
  }
  fileTable.innerHTML = "";
}

// ========== 右键菜单与移除：Task 3.2 ==========
function createContextMenuIfNeeded() {
  if (contextMenuEl && document.body.contains(contextMenuEl)) return contextMenuEl;
  const menu = document.createElement('div');
  menu.id = 'file-context-menu';
  menu.style.position = 'fixed';
  menu.style.zIndex = '9999';
  menu.style.minWidth = '180px';
  menu.style.background = 'var(--pico-background, #fff)';
  menu.style.border = '1px solid #d0d7de';
  menu.style.borderRadius = '10px';
  menu.style.boxShadow = '0 6px 24px #0002, 0 2px 6px #0001';
  menu.style.padding = '6px';
  menu.style.display = 'none';
  menu.addEventListener('contextmenu', (e) => { e.preventDefault(); });
  document.body.appendChild(menu);
  contextMenuEl = menu;
  return menu;
}

function hideContextMenu() {
  if (contextMenuEl) contextMenuEl.style.display = 'none';
}

function openContextMenuForRow(rowIndex, x, y) {
  const menu = createContextMenuIfNeeded();
  menu.innerHTML = '';

  const addItem = (label, onClick, danger = false, disabled = false) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.style.display = 'block';
    btn.style.width = '100%';
    btn.style.textAlign = 'left';
    btn.style.padding = '8px 10px';
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.borderRadius = '8px';
    btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    btn.style.color = danger ? '#c1121f' : 'inherit';
    btn.disabled = !!disabled;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideContextMenu();
      if (!disabled) onClick();
    });
    btn.addEventListener('mouseenter', () => { if (!disabled) btn.style.background = 'rgba(0,0,0,0.06)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
    menu.appendChild(btn);
  };

  const hasAny = loadedFiles && loadedFiles.length > 0;
  const selectedCount = loadedFiles.filter(f => f.selected).length;
  const unselectedCount = hasAny ? (loadedFiles.length - selectedCount) : 0;

  addItem('移除所选', () => removeSelectedFiles(), true, selectedCount === 0);
  addItem('仅移除此项', () => removeFileAtIndex(rowIndex), true, !(rowIndex >= 0 && rowIndex < loadedFiles.length));
  addItem('移除未选', () => removeUnselectedFiles(), false, unselectedCount === 0);
  addItem('清空全部', () => clearAllFiles(), true, !hasAny);

  // 定位
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  menu.style.left = Math.min(x, vw - 200) + 'px';
  menu.style.top = Math.min(y, vh - 160) + 'px';
  menu.style.display = 'block';
}

function setupContextMenu() {
  if (_ctxMenuBound) return;
  if (!fileTable) fileTable = document.getElementById('file-table-body');
  if (!fileTable) return;

  document.addEventListener('click', hideContextMenu);
  window.addEventListener('resize', hideContextMenu);
  document.addEventListener('scroll', hideContextMenu, true);

  fileTable.addEventListener('contextmenu', (e) => {
    const tr = e.target && e.target.closest('tr');
    if (!tr) return;
    e.preventDefault();
    const idxStr = tr.getAttribute('data-index');
    const idx = idxStr ? parseInt(idxStr) : NaN;
    const x = e.clientX;
    const y = e.clientY;
    openContextMenuForRow(isNaN(idx) ? -1 : idx, x, y);
  });
  _ctxMenuBound = true;
}

function removeFileAtIndex(index) {
  if (!(index >= 0 && index < loadedFiles.length)) return;
  loadedFiles.splice(index, 1);
  window.loadedFiles = loadedFiles; // 同步到window对象
  // 重绘
  lastSelectedIndex = -1;
  updateFileTable();
  updateFileCount();
  try {
    if (typeof window.updateStatusBar === 'function') {
      const selected = loadedFiles.filter(f => f.selected).length;
      window.updateStatusBar({ total: loadedFiles.length, selected });
    }
  } catch (_) {}
}

function removeSelectedFiles() {
  if (!loadedFiles || loadedFiles.length === 0) return;
  const before = loadedFiles.length;
  loadedFiles = loadedFiles.filter(f => !f.selected);
  window.loadedFiles = loadedFiles; // 同步到window对象
  const removed = before - loadedFiles.length;
  if (removed === 0) return;
  lastSelectedIndex = -1;
  updateFileTable();
  updateFileCount();
  try {
    if (typeof window.updateStatusBar === 'function') {
      const selected = loadedFiles.filter(f => f.selected).length;
      window.updateStatusBar({ total: loadedFiles.length, selected });
    }
  } catch (_) {}
}

function removeUnselectedFiles() {
  if (!loadedFiles || loadedFiles.length === 0) return;
  const before = loadedFiles.length;
  loadedFiles = loadedFiles.filter(f => f.selected);
  window.loadedFiles = loadedFiles; // 同步到window对象
  if (loadedFiles.length === before) return;
  lastSelectedIndex = -1;
  updateFileTable();
  updateFileCount();
  try {
    if (typeof window.updateStatusBar === 'function') {
      const selected = loadedFiles.filter(f => f.selected).length;
      window.updateStatusBar({ total: loadedFiles.length, selected });
    }
  } catch (_) {}
}

function clearAllFiles() {
  loadedFiles = [];
  window.loadedFiles = loadedFiles; // 同步到window对象
  lastSelectedIndex = -1;
  
  // 通知搜索过滤管理器文件列表已清空
  if (window.searchFilterManager) {
    window.searchFilterManager.onFilesUpdated();
  }
  
  updateFileTable();
  updateFileCount();
  try {
    if (typeof window.updateStatusBar === 'function') {
      window.updateStatusBar({ total: 0, selected: 0 });
    }
  } catch (_) {}
}

function setupKeyboardShortcuts() {
  if (_shortcutsBound) return;
  
  document.addEventListener('keydown', (e) => {
    // 避免在输入框/文本域中触发快捷键
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    const isTyping = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    
    // 如果在输入框中，只允许部分快捷键
    if (isTyping) {
      // 在输入框中仍然允许全选
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        // 让浏览器处理输入框的全选，不阻止
        return;
      }
      return; // 其他快捷键在输入框中不生效
    }

    // 删除选中文件 (Delete/Backspace)
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const anySelected = loadedFiles.some(f => f.selected);
      if (anySelected) {
        e.preventDefault();
        removeSelectedFiles();
        announceToScreenReader(`已删除 ${loadedFiles.filter(f => f.selected).length} 个选中文件`);
      }
      return;
    }

    // 全选文件 (Ctrl+A / Cmd+A)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      
      // 获取当前显示的文件列表
      let filesToSelect = loadedFiles;
      if (window.searchFilterManager && window.searchFilterManager.hasActiveFilters()) {
        filesToSelect = window.searchFilterManager.getDisplayedFiles();
      }
      
      filesToSelect.forEach(f => f.selected = true);
      window.loadedFiles = loadedFiles; // 同步到window对象
      updateFileTable();
      
      const filtered = window.searchFilterManager && window.searchFilterManager.hasActiveFilters();
      const message = filtered ? `已全选 ${filesToSelect.length} 个显示的文件` : `已全选 ${filesToSelect.length} 个文件`;
      announceToScreenReader(message);
      return;
    }

    // 取消全选 (Ctrl+D / Cmd+D)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      
      // 获取当前显示的文件列表
      let filesToDeselect = loadedFiles;
      if (window.searchFilterManager && window.searchFilterManager.hasActiveFilters()) {
        filesToDeselect = window.searchFilterManager.getDisplayedFiles();
      }
      
      const beforeCount = filesToDeselect.filter(f => f.selected).length;
      if (beforeCount > 0) {
        filesToDeselect.forEach(f => f.selected = false);
        window.loadedFiles = loadedFiles; // 同步到window对象
        updateFileTable();
        
        const filtered = window.searchFilterManager && window.searchFilterManager.hasActiveFilters();
        const message = filtered ? `已取消选择 ${beforeCount} 个显示的文件` : `已取消选择所有文件`;
        announceToScreenReader(message);
      }
      return;
    }

    // 上下箭头键导航
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleArrowKeyNavigation(e.key === 'ArrowUp' ? -1 : 1, e.shiftKey);
      return;
    }

    // 空格键切换选择状态
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (lastSelectedIndex >= 0 && lastSelectedIndex < loadedFiles.length) {
        const file = loadedFiles[lastSelectedIndex];
        file.selected = !file.selected;
        window.loadedFiles = loadedFiles; // 同步到window对象
        updateFileTable();
        announceToScreenReader(`${file.selected ? '选中' : '取消选中'} ${file.name}`);
      }
      return;
    }

    // Home键 - 跳到第一个文件
    if (e.key === 'Home') {
      e.preventDefault();
      if (loadedFiles.length > 0) {
        lastSelectedIndex = 0;
        if (e.shiftKey) {
          // Shift+Home: 选择从当前到第一个
          for (let i = 0; i <= lastSelectedIndex; i++) {
            loadedFiles[i].selected = true;
          }
        } else if (e.ctrlKey || e.metaKey) {
          // Ctrl+Home: 只移动焦点，不改变选择
        } else {
          // Home: 移动焦点并单选
          loadedFiles.forEach((f, i) => f.selected = i === 0);
        }
        window.loadedFiles = loadedFiles; // 同步到window对象
        updateFileTable();
        scrollToFile(0);
        announceToScreenReader(`跳转到第一个文件: ${loadedFiles[0].name}`);
      }
      return;
    }

    // End键 - 跳到最后一个文件
    if (e.key === 'End') {
      e.preventDefault();
      if (loadedFiles.length > 0) {
        const lastIndex = loadedFiles.length - 1;
        lastSelectedIndex = lastIndex;
        if (e.shiftKey) {
          // Shift+End: 选择从当前到最后一个
          for (let i = lastSelectedIndex; i < loadedFiles.length; i++) {
            loadedFiles[i].selected = true;
          }
        } else if (e.ctrlKey || e.metaKey) {
          // Ctrl+End: 只移动焦点，不改变选择
        } else {
          // End: 移动焦点并单选
          loadedFiles.forEach((f, i) => f.selected = i === lastIndex);
        }
        window.loadedFiles = loadedFiles; // 同步到window对象
        updateFileTable();
        scrollToFile(lastIndex);
        announceToScreenReader(`跳转到最后一个文件: ${loadedFiles[lastIndex].name}`);
      }
      return;
    }

    // F2键 - 开始重命名（如果有选中文件）
    if (e.key === 'F2') {
      e.preventDefault();
      const selectedCount = loadedFiles.filter(f => f.selected).length;
      if (selectedCount > 0) {
        const applyButton = document.getElementById('apply-rename');
        if (applyButton && !applyButton.disabled) {
          applyButton.click();
          announceToScreenReader(`开始重命名 ${selectedCount} 个文件`);
        } else {
          announceToScreenReader('无法执行重命名，请检查规则设置');
        }
      } else {
        announceToScreenReader('请先选择要重命名的文件');
      }
      return;
    }
    
    // 撤销操作 (Ctrl+Z / Cmd+Z)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      const undoBtn = document.getElementById('undo-btn');
      if (undoBtn && !undoBtn.disabled) {
        undoBtn.click();
      }
      return;
    }
    
    // 重做操作 (Ctrl+Shift+Z / Cmd+Shift+Z 或 Ctrl+Y / Cmd+Y)
    if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') || 
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')) {
      e.preventDefault();
      const redoBtn = document.getElementById('redo-btn');
      if (redoBtn && !redoBtn.disabled) {
        redoBtn.click();
      }
      return;
    }

    // Escape键 - 取消选择或关闭菜单
    if (e.key === 'Escape') {
      e.preventDefault();
      // 关闭右键菜单
      hideContextMenu();
      
      // 如果有选中文件，取消选择
      const selectedCount = loadedFiles.filter(f => f.selected).length;
      if (selectedCount > 0) {
        loadedFiles.forEach(f => f.selected = false);
        window.loadedFiles = loadedFiles; // 同步到window对象
        updateFileTable();
        announceToScreenReader('已取消所有选择');
      }
      return;
    }
  });
  
  _shortcutsBound = true;
}

// 初始化规则管理器
// 规则管理器已移至后端Rust实现，前端不再需要初始化

// 箭头键导航处理
function handleArrowKeyNavigation(direction, shiftKey) {
  if (loadedFiles.length === 0) return;
  
  // 如果没有当前选中项，从第一个开始
  if (lastSelectedIndex < 0) {
    lastSelectedIndex = 0;
  } else {
    // 计算新的索引
    const newIndex = lastSelectedIndex + direction;
    if (newIndex >= 0 && newIndex < loadedFiles.length) {
      lastSelectedIndex = newIndex;
    } else {
      return; // 超出范围，不处理
    }
  }
  
  const currentFile = loadedFiles[lastSelectedIndex];
  
  if (shiftKey) {
    // Shift+箭头键：扩展选择
    currentFile.selected = true;
  } else {
    // 单纯箭头键：单选当前项
    loadedFiles.forEach((f, i) => f.selected = i === lastSelectedIndex);
  }
  
  window.loadedFiles = loadedFiles; // 同步到window对象
  updateFileTable();
  scrollToFile(lastSelectedIndex);
  announceToScreenReader(`${shiftKey ? '扩展选择到' : '选择'} ${currentFile.name}`);
}

// 滚动到指定文件
function scrollToFile(index) {
  if (virtualScrollManager) {
    // 虚拟滚动模式
    const scrollTop = index * VIRTUAL_ITEM_HEIGHT;
    const scrollContainer = virtualScrollManager.scrollContainer;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollTop;
    }
  } else {
    // 常规模式
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// 屏幕阅读器公告
function announceToScreenReader(message) {
  // 创建或获取现有的公告元素
  let announcer = document.getElementById('screen-reader-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'screen-reader-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
  }
  
  // 清空后设置新消息，确保屏幕阅读器能读取
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

// 虚拟滚动管理器类
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
    
    // 创建虚拟滚动的占位容器
    this.spacer = document.createElement('div');
    this.spacer.style.position = 'absolute';
    this.spacer.style.top = '0';
    this.spacer.style.left = '0';
    this.spacer.style.width = '1px';
    this.spacer.style.pointerEvents = 'none';
    this.scrollContainer.appendChild(this.spacer);
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
    
    const totalItems = loadedFiles.length;
    if (totalItems === 0) return;
    
    // 计算可见范围
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const visibleEnd = Math.min(visibleStart + visibleCount, totalItems);
    
    // 添加缓冲区
    this.visibleStart = Math.max(0, visibleStart - this.bufferSize);
    this.visibleEnd = Math.min(totalItems, visibleEnd + this.bufferSize);
    
    // 更新占位容器高度
    this.spacer.style.height = (totalItems * this.itemHeight) + 'px';
  }
  
  renderVisibleItems() {
    if (!loadedFiles || loadedFiles.length === 0) return;
    
    const thisToken = ++renderToken;
    
    // 清空当前表格内容
    this.container.innerHTML = '';
    
    // 创建文档片段
    const fragment = document.createDocumentFragment();
    
    // 渲染可见范围内的项目
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      if (thisToken !== renderToken) return; // 检查是否过期
      
      const fileInfo = loadedFiles[i];
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
    row.innerHTML = `
      <td><input type="checkbox" class="row-select" data-index="${index}" ${fileInfo.selected ? "checked" : ""} /></td>
      <th scope="row">${index + 1}</th>
      <td>${fileInfo.name}</td>
      <td>${fileInfo.extension || ""}</td>
      <td>${formatFileSize(fileInfo.size)}</td>
      <td>${formatTime(fileInfo.modified_ms)}</td>
      <td class="preview-cell ${hasChange ? "preview-highlight" : "dimmed"} ${isDiffHighlight ? "diff-highlight" : ""}" style="font-family:monospace;">
        ${fileInfo.newPath || "(无变化)"} ${warn}
      </td>
    `;
    row.className = (rowClass + (fileInfo.selected ? " selected-row" : "")).trim();
    
    return row;
  }
  
  updateStatusAfterRender() {
    try {
      const selectedCount = loadedFiles.filter(f => f.selected).length;
      if (typeof window.updateStatusBar === 'function') {
        window.updateStatusBar({ total: loadedFiles.length, selected: selectedCount });
      }
      const selectAllEl = document.getElementById('select-all');
      if (selectAllEl) {
        selectAllEl.indeterminate = selectedCount > 0 && selectedCount < loadedFiles.length;
        selectAllEl.checked = selectedCount > 0 && selectedCount === loadedFiles.length;
      }
    } catch (_) {}
  }
  
  // 批量局部刷新方法
  batchUpdateItems(indices) {
    if (!indices || indices.length === 0) return;
    
    indices.forEach(index => {
      if (index >= this.visibleStart && index < this.visibleEnd) {
        const existingRow = this.container.querySelector(`tr[data-index="${index}"]`);
        if (existingRow && loadedFiles[index]) {
          const newRow = this.createFileRow(loadedFiles[index], index);
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
  }
}

function updateFileTable() {
  console.log("🔧 [updateFileTable] 开始更新文件表格");
  
  // 安全检查：确保fileTable存在
  if (!fileTable) {
    console.warn("⚠️ [updateFileTable] fileTable未初始化，重新获取");
    fileTable = document.getElementById("file-table-body");
    if (!fileTable) {
      console.error("❌ [updateFileTable] 无法找到file-table-body元素");
      return;
    }
  }
  
  const emptyRow = document.getElementById("empty-tip-row");
  const applyRenameButton = document.getElementById("apply-rename");
  
  // 获取要显示的文件列表（考虑搜索过滤）
  let filesToDisplay = loadedFiles;
  if (window.searchFilterManager && window.searchFilterManager.hasActiveFilters()) {
    filesToDisplay = window.searchFilterManager.getDisplayedFiles();
  }
  
  if (loadedFiles.length === 0) {
    // 清理虚拟滚动管理器
    if (virtualScrollManager) {
      virtualScrollManager.destroy();
      virtualScrollManager = null;
    }
    
    clearTable();
    if (emptyRow) emptyRow.style.display = "";
    if (applyRenameButton) applyRenameButton.disabled = true;
    return;
  }
  
  // 处理过滤后的空结果
  if (filesToDisplay.length === 0) {
    clearTable();
    const emptyMessage = window.searchFilterManager && window.searchFilterManager.hasActiveFilters() 
      ? `未找到匹配的文件 (共 ${loadedFiles.length} 个文件)`
      : "暂无文件，请拖拽或选择文件/文件夹导入";
    
    fileTable.innerHTML = `
      <tr id="empty-tip-row">
        <td colspan="7" style="text-align:center;color:var(--pico-secondary);padding:2.5em 0;font-size:1.05em;" role="gridcell">
          ${emptyMessage}
        </td>
      </tr>
    `;
    return;
  }
  
  if (emptyRow) emptyRow.style.display = "none";

  const thisToken = ++renderToken;
  const total = filesToDisplay.length;
  const batchSize = 200;
  let index = 0;

  const fileCountElem = document.getElementById("file-count");

  // 依据当前排序设置进行排序
  if (sortKey) {
    const key = sortKey;
    const asc = sortAsc ? 1 : -1;
    filesToDisplay.sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (key === 'size' || key === 'modified_ms') {
        const na = typeof va === 'number' ? va : 0;
        const nb = typeof vb === 'number' ? vb : 0;
        return (na - nb) * asc;
      }
      // 字符串自然排序
      const sa = (va || '').toString();
      const sb = (vb || '').toString();
      return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' }) * asc;
    });
  }

  function renderBatch() {
    if (thisToken !== renderToken) return; // 过期
    const end = Math.min(index + batchSize, total);
    const frag = document.createDocumentFragment();
    for (let i = index; i < end; i++) {
      const fileInfo = filesToDisplay[i];
      // 获取在原始数组中的索引，用于正确的选择和操作
      const originalIndex = loadedFiles.indexOf(fileInfo);
      const hasChange = fileInfo.newPath && fileInfo.newPath !== fileInfo.name;
      let warn = "";
      let rowClass = "";

      if (fileInfo.writable === false) {
        warn +=
          ' <span title="无写权限，跳过" style="color:#e87b00;font-size:1.1em;vertical-align:middle;">🔒</span>';
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
      row.dataset.index = String(originalIndex);
      row.setAttribute('role', 'row');
      row.setAttribute('aria-selected', fileInfo.selected ? 'true' : 'false');
      row.innerHTML = `
        <td role="gridcell"><input type="checkbox" class="row-select" data-index="${originalIndex}" ${fileInfo.selected ? "checked" : ""} aria-label="选择文件 ${fileInfo.name}" /></td>
        <th scope="row" role="rowheader">${i + 1}</th>
        <td role="gridcell">${fileInfo.name}</td>
        <td role="gridcell">${fileInfo.extension || ""}</td>
        <td role="gridcell">${formatFileSize(fileInfo.size)}</td>
        <td role="gridcell">${formatTime(fileInfo.modified_ms)}</td>
        <td role="gridcell" class="preview-cell ${hasChange ? "preview-highlight" : "dimmed"}" style="font-family:monospace;">
          ${fileInfo.newPath || "(无变化)"} ${warn}
        </td>
      `;
      row.className = (rowClass + (fileInfo.selected ? " selected-row" : "")).trim();
      frag.appendChild(row);
    }
    fileTable.appendChild(frag);
    index = end;

    if (fileCountElem) {
      const displayText = window.searchFilterManager && window.searchFilterManager.hasActiveFilters() 
        ? `渲染中 ${end}/${total} 个文件 (已过滤，共 ${loadedFiles.length} 个)`
        : `渲染中 ${end}/${total} 个文件...`;
      fileCountElem.textContent = displayText;
    }

    if (end < total) {
      requestAnimationFrame(renderBatch);
    } else {
      if (fileCountElem) {
        const displayText = window.searchFilterManager && window.searchFilterManager.hasActiveFilters() 
          ? `显示 ${total} 个文件 (已过滤，共 ${loadedFiles.length} 个)`
          : `已加载 ${total} 个文件`;
        fileCountElem.textContent = displayText;
      }
      // 同步状态栏与“全选”勾选状态
      try {
        const selectedCount = loadedFiles.filter(f => f.selected).length;
        const displayedSelectedCount = filesToDisplay.filter(f => f.selected).length;
        if (typeof window.updateStatusBar === 'function') {
          window.updateStatusBar({ 
            total: loadedFiles.length, 
            displayed: filesToDisplay.length,
            selected: selectedCount,
            filtered: window.searchFilterManager && window.searchFilterManager.hasActiveFilters()
          });
        }
        const selectAllEl = document.getElementById('select-all');
        if (selectAllEl) {
          selectAllEl.indeterminate = displayedSelectedCount > 0 && displayedSelectedCount < filesToDisplay.length;
          selectAllEl.checked = displayedSelectedCount > 0 && displayedSelectedCount === filesToDisplay.length;
        }
      } catch (_) {}
      // 按钮状态更新由 setupButtonEvents.refreshApplyButton() 统一处理
    }
  }

  // 判断是否需要启用虚拟滚动
  if (filesToDisplay.length > VIRTUAL_SCROLL_THRESHOLD) {
    console.log(`🚀 [updateFileTable] 启用虚拟滚动 (${filesToDisplay.length} 个文件)`);
    
    // 清理常规渲染
    clearTable();
    
    // 初始化或重置虚拟滚动管理器
    if (!virtualScrollManager) {
      virtualScrollManager = new window.VirtualScrollManager(fileTable, VIRTUAL_ITEM_HEIGHT, VIRTUAL_BUFFER_SIZE);
    }
    
    // 设置虚拟滚动的数据源为过滤后的文件
    virtualScrollManager.setDataSource(filesToDisplay);
    
    // 使用虚拟滚动渲染
    virtualScrollManager.updateVisibleRange();
    virtualScrollManager.renderVisibleItems();
    
    const fileCountElem = document.getElementById("file-count");
    if (fileCountElem) {
      const displayText = window.searchFilterManager && window.searchFilterManager.hasActiveFilters() 
        ? `显示 ${filesToDisplay.length} 个文件 (已过滤，共 ${loadedFiles.length} 个，虚拟滚动)`
        : `已加载 ${filesToDisplay.length} 个文件 (虚拟滚动)`;
      fileCountElem.textContent = displayText;
    }
  } else {
    console.log(`🔧 [updateFileTable] 使用常规渲染 (${filesToDisplay.length} 个文件)`);
    
    // 清理虚拟滚动管理器
    if (virtualScrollManager) {
      virtualScrollManager.destroy();
      virtualScrollManager = null;
    }
    
    // 使用原有的批量渲染逻辑
    requestAnimationFrame(renderBatch);
  }
}

function updateFileCount() {
  if (!fileCountElement) {
    fileCountElement = document.getElementById("file-count");
    if (!fileCountElement) {
      console.error("❌ [updateFileCount] 无法找到file-count元素");
      return;
    }
  }
  
  fileCountElement.textContent = `已加载 ${loadedFiles.length} 个文件`;
}

// Tab 切换相关
function setupTabSwitching() {
  tabLinks.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      // 移除所有 active class
      tabLinks.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      
      // 添加 active class
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add("active");
      }

      // CRITICAL: Always update preview after tab switch
      updatePreview();
      console.log("Tab switched to:", tabId);
      
      // Refresh button states
      document.dispatchEvent(new Event("refresh-apply"));
    });
  });

  // 初始化一次按钮状态
  // refreshApplyButton will be called after setupButtonEvents is initialized
}
// 确保初始化时setupTabSwitching被调用
// 已在initializeEventListeners中调用，无需重复调用

// 实时预览相关
function setupRealTimePreview() {
  // 查找替换输入框
  findInput.addEventListener("input", updatePreview);
  replaceInput.addEventListener("input", updatePreview);

  // 序列号输入框
  startInput.addEventListener("input", updatePreview);
  digitsInput.addEventListener("input", updatePreview);

  // 位置单选框
  positionRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      console.log(
        "[sequence] position changed to:",
        e.target && e.target.value
      );
      updatePreview();
      document.dispatchEvent(new Event("refresh-apply"));
    });
  });

  // 大小写转换（改为单选组）
  const caseRadios = document.querySelectorAll(
    '#tab-case input[name="caseType"]'
  );
  caseRadios.forEach((r) => {
    r.addEventListener("change", (e) => {
      console.log("[case] caseType changed to:", e.target && e.target.value);
      updatePreview();
      document.dispatchEvent(new Event("refresh-apply"));
    });
  });
}

// 检查冲突和非法字符
function checkForConflicts() {
  const newPathMap = new Map();
  let hasAnyConflict = false;

  // 重置冲突和非法字符状态
  loadedFiles.forEach((fileInfo) => {
    fileInfo.hasConflict = false;
    fileInfo.invalidChar = false;
  });

  loadedFiles.forEach((fileInfo) => {
    if (fileInfo.newPath) {
      // 检查非法字符 (macOS 不允许 /)
      if (fileInfo.newPath.includes("/") || fileInfo.newPath.includes(":")) {
        fileInfo.invalidChar = true;
        hasAnyConflict = true;
      }

      // 检查重名冲突
      const lowerCaseNewPath = fileInfo.newPath.toLowerCase(); // 忽略大小写检查冲突
      if (newPathMap.has(lowerCaseNewPath)) {
        // 标记当前文件和之前已经存在的文件
        fileInfo.hasConflict = true;
        newPathMap.get(lowerCaseNewPath).hasConflict = true;
        hasAnyConflict = true;
      } else {
        newPathMap.set(lowerCaseNewPath, fileInfo);
      }
    }
  });
  return hasAnyConflict;
}

function updatePreview() {
  console.log("🔄 [updatePreview] 被调用，使用PreviewManager");
  
  // 使用新的PreviewManager处理预览
  if (window.previewManager) {
    window.previewManager.updatePreview();
  } else {
    console.warn("⚠️ [updatePreview] PreviewManager未初始化，使用备用方案");
    updatePreviewFallback();
  }

  // 2. 检查冲突和非法字符
  const hasConflicts = checkForConflicts();

  // 3. 更新表格显示
  const previewCells = document.querySelectorAll(".preview-cell");
  loadedFiles.forEach((fileInfo, index) => {
    if (index < previewCells.length) {
      const cell = previewCells[index];
      let className = "preview-cell";
      let textContent = fileInfo.newPath;

      if (fileInfo.hasConflict) {
        className += " conflict";
        textContent = "冲突! " + fileInfo.newPath; // 显示冲突提示
      } else if (fileInfo.invalidChar) {
        className += " invalid-char";
        textContent = "非法字符! " + fileInfo.newPath; // 显示非法字符提示
      } else if (fileInfo.newPath === fileInfo.name) {
        className += " dimmed";
        textContent = "(无变化)";
      } else {
        className += " preview-highlight";
      }

      cell.textContent = textContent;
      cell.className = className;
    }
  });

  // 4. 更新“执行重命名”按钮状态
  document.dispatchEvent(new Event("refresh-apply"));
}

// 备用预览更新方案（保持兼容性）
function updatePreviewFallback() {
  console.log("🔄 [updatePreviewFallback] 使用备用预览方案");
  
  if (loadedFiles.length === 0) return;

  console.log("🔄 [updatePreviewFallback] 开始更新预览");
  
  // 1. 更新所有文件的预览名称
  loadedFiles.forEach((fileInfo, index) => {
    const oldNewPath = fileInfo.newPath;
    fileInfo.newPath = getPreviewName(fileInfo.name, false, index);
    console.log(`🔄 [updatePreviewFallback] 文件${index}: ${fileInfo.name} -> ${oldNewPath} -> ${fileInfo.newPath}`);
  });

  // 2. 检查冲突和非法字符
  const hasConflicts = checkForConflicts();

  // 3. 更新表格显示
  const previewCells = document.querySelectorAll(".preview-cell");
  loadedFiles.forEach((fileInfo, index) => {
    if (index < previewCells.length) {
      const cell = previewCells[index];
      let className = "preview-cell";
      let textContent = fileInfo.newPath;

      if (fileInfo.hasConflict) {
        className += " conflict";
        textContent = "冲突! " + fileInfo.newPath; // 显示冲突提示
      } else if (fileInfo.invalidChar) {
        className += " invalid-char";
        textContent = "非法字符! " + fileInfo.newPath; // 显示非法字符提示
      } else if (fileInfo.newPath === fileInfo.name) {
        className += " dimmed";
        textContent = "(无变化)";
      } else {
        className += " preview-highlight";
      }

      cell.textContent = textContent;
      cell.className = className;
    }
  });

  // 4. 更新"执行重命名"按钮状态
  document.dispatchEvent(new Event("refresh-apply"));
}

function getPreviewName(fileName, withHighlight = false, fileIndex = 0) {
  // Use consistent method to get active tab
  const activeTab = document.querySelector(".tab-content.active");
  if (!activeTab) return fileName;
  
  const tabId = activeTab.id;
  
  switch (tabId) {
    case "tab-replace":
      return getPreviewForReplace(fileName, withHighlight);
    case "tab-sequence":
      return getPreviewForSequence(fileName, withHighlight, fileIndex);
    case "tab-slice":
      return getPreviewForSlice(fileName, withHighlight);
    case "tab-case":
      return getPreviewForCase(fileName, withHighlight);
    case "tab-extension":
      return getPreviewForExtension(fileName, withHighlight);
    default:
      return fileName;
  }
}

function getPreviewForReplace(fileName, withHighlight = false) {
  // 规则预览现在由后端Rust实现处理
  
  // 回退到原始实现
  if (!findInput) {
    findInput = document.getElementById("find");
  }
  if (!replaceInput) {
    replaceInput = document.getElementById("replace");
  }
  
  const findText = findInput ? findInput.value : "";
  const replaceText = replaceInput ? replaceInput.value : "";

  if (!findText) return fileName;

  try {
    return fileName.replace(new RegExp(findText, "g"), replaceText);
  } catch (e) {
    console.error('Replace preview error:', e);
    return fileName;
  }
}

function getPreviewForSequence(fileName, withHighlight = false, fileIndex = 0) {
  // 规则预览现在由后端Rust实现处理
  
  // 回退到原始实现
  if (!startInput) {
    startInput = document.getElementById("start");
  }
  if (!digitsInput) {
    digitsInput = document.getElementById("digits");
  }
  
  const start = parseInt(startInput ? startInput.value : "1") || 1;
  const digits = parseInt(digitsInput ? digitsInput.value : "2") || 2;
  const positionElement = document.querySelector('input[name="position"]:checked');
  const position = positionElement ? positionElement.value : "prefix";

  // 为每个文件计算不同的序列号
  const currentSequenceNumber = start + fileIndex;
  const sequenceNumber = currentSequenceNumber.toString().padStart(digits, "0");

  const fileExtension = fileName.includes(".")
    ? "." + fileName.split(".").pop()
    : "";
  const fileNameWithoutExt = fileName.includes(".")
    ? fileName.substring(0, fileName.lastIndexOf("."))
    : fileName;
  let newName =
    position === "prefix"
      ? `${sequenceNumber}_${fileName}`
      : `${fileNameWithoutExt}_${sequenceNumber}${fileExtension}`;
  if (!withHighlight || newName === fileName) return newName;
  // 高亮序列号部分
  if (position === "prefix") {
    return `<span class='highlight'>${sequenceNumber}_</span>${fileName}`;
  } else {
    return `${fileNameWithoutExt}_<span class='highlight'>${sequenceNumber}</span>${fileExtension}`;
  }
}

function getPreviewForSlice(fileName, withHighlight = false) {
  // 规则预览现在由后端Rust实现处理
  
  // 回退到原始实现
  const startInput = document.getElementById("slice-start");
  const endInput = document.getElementById("slice-end");
  const replacementInput = document.getElementById("slice-replacement");
  const preserveExtensionCheckbox = document.getElementById("slice-preserve-extension");
  
  const start = parseInt(startInput ? startInput.value : "0") || 0;
  const endValue = endInput ? endInput.value.trim() : "";
  const end = endValue === "" ? null : parseInt(endValue);
  const replacement = replacementInput ? replacementInput.value : "";
  const preserveExtension = preserveExtensionCheckbox ? preserveExtensionCheckbox.checked : true;
  
  let targetString = fileName;
  let extension = "";
  
  // 如果保留扩展名，分离文件名和扩展名
  if (preserveExtension) {
    const lastDotIndex = fileName.lastIndexOf(".");
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
  
  return result + extension;
}

function getPreviewForCase(fileName, withHighlight = false) {
  // 规则预览现在由后端Rust实现处理
  
  // 回退到原始实现
  const checked = document.querySelector('#tab-case input[name="caseType"]:checked');
  if (!checked) return fileName;
  
  const val = checked.value;
  const preserveExtensionCheckbox = document.getElementById('case-preserve-extension');
  const preserveExtension = preserveExtensionCheckbox ? preserveExtensionCheckbox.checked : true;
  
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
  
  let newName = targetString;
  switch (val) {
    case 'lower':
      newName = targetString.toLowerCase();
      break;
    case 'upper':
      newName = targetString.toUpperCase();
      break;
    case 'title':
      newName = targetString.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
      break;
    case 'snake':
      newName = targetString
        .replace(/\W+/g, '_')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_');
      break;
    case 'kebab':
      newName = targetString
        .replace(/\W+/g, '-')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .toLowerCase()
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
      break;
  }
  
  return newName + extension;
}

function getPreviewForExtension(fileName, withHighlight = false) {
  // 规则预览现在由后端Rust实现处理
  
  // 回退到原始实现
  const modeRadios = document.querySelectorAll('input[name="extensionMode"]');
  const selectedMode = Array.from(modeRadios).find(radio => radio.checked);
  const mode = selectedMode ? selectedMode.value : null;
  
  if (!mode) return fileName;
  
  const newExtensionInput = document.getElementById('new-extension');
  const forceChangeCheckbox = document.getElementById('ext-force-change');
  const preserveCaseCheckbox = document.getElementById('ext-case-preserve');
  
  const newExtension = newExtensionInput ? newExtensionInput.value.trim() : '';
  const forceChange = forceChangeCheckbox ? forceChangeCheckbox.checked : false;
  const preserveCase = preserveCaseCheckbox ? preserveCaseCheckbox.checked : true;
  
  // 分离文件名和扩展名
  const lastDotIndex = fileName.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0;
  const nameWithoutExt = hasExtension ? fileName.substring(0, lastDotIndex) : fileName;
  
  let result;
  switch (mode) {
    case 'change':
      if (!newExtension) return fileName;
      result = nameWithoutExt + '.' + (preserveCase ? newExtension : newExtension.toLowerCase());
      break;
    case 'remove':
      result = nameWithoutExt;
      break;
    case 'add':
      if (!newExtension) return fileName;
      if (hasExtension && !forceChange) {
        result = fileName;
      } else {
        result = nameWithoutExt + '.' + (preserveCase ? newExtension : newExtension.toLowerCase());
      }
      break;
    default:
      result = fileName;
  }
  
  return result;
}

// 按钮事件相关
function setupButtonEvents() {
  console.log("🔧 [初始化] 开始设置按钮事件");
  
  // 初始禁用状态
  const applyBtn = document.getElementById("apply-rename");
  
  console.log("🔧 [初始化] 按钮元素检查:", {
    applyBtn,
    applyRenameButton
  });
  // 重做按钮已移除
  
  if (applyBtn) applyBtn.disabled = true;
  // 根据规则配置与文件列表使能“执行重命名”
  function refreshApplyButton() {
    const applyBtnEl = document.getElementById("apply-rename");
    const activeTab = document.querySelector(".tab-content.active");
    const hasFiles = loadedFiles && loadedFiles.length > 0;
    let valid = false;
    
    console.log("🔍 [按钮状态] 检查按钮状态:", {
      hasFiles,
      activeTabId: activeTab?.id,
      loadedFilesCount: loadedFiles?.length
    });
    
    if (activeTab && activeTab.id === "tab-replace") {
      valid = !!(findInput && findInput.value);
      console.log("🔍 [按钮状态] 替换标签页验证:", { valid, findValue: findInput?.value });
    } else if (activeTab && activeTab.id === "tab-sequence") {
      const startValue = parseInt(startInput?.value) || 0;
      const digitsValue = parseInt(digitsInput?.value) || 0;
      const positionSelected = document.querySelector('input[name="position"]:checked');
      valid = !!(
        startInput &&
        startInput.value &&
        startValue >= 0 &&
        digitsInput &&
        digitsInput.value &&
        digitsValue > 0 &&
        positionSelected
      );
      console.log("🔍 [按钮状态] 序列标签页验证:", { 
        valid, 
        startValue, 
        digitsValue, 
        positionSelected: positionSelected?.value,
        startInputValue: startInput?.value,
        digitsInputValue: digitsInput?.value
      });
    } else if (activeTab && activeTab.id === "tab-case") {
      valid = !!document.querySelector(
        '#tab-case input[name="caseType"]:checked'
      );
      console.log("🔍 [按钮状态] 大小写标签页验证:", { valid });
    }
    
    // 检查是否有任何文件存在冲突或非法字符
    const hasAnyConflictOrInvalidChar = loadedFiles.some(
      (fileInfo) => fileInfo.hasConflict || fileInfo.invalidChar
    );
    
    const shouldEnable = hasFiles && valid && !hasAnyConflictOrInvalidChar;
    console.log("🔍 [按钮状态] 最终状态:", { 
      hasFiles, 
      valid, 
      hasAnyConflictOrInvalidChar, 
      shouldEnable,
      buttonDisabled: applyBtnEl?.disabled
    });

    if (applyBtnEl) {
      applyBtnEl.disabled = !shouldEnable;
    }
  }

  // 绑定输入变化以刷新按钮状态
  [findInput, replaceInput, startInput, digitsInput].forEach(
    (el) => el && el.addEventListener("input", refreshApplyButton)
  );
  positionRadios &&
    positionRadios.forEach((r) =>
      r.addEventListener("change", refreshApplyButton)
    );
  const caseRadiosForBtn = document.querySelectorAll(
    '#tab-case input[name="caseType"]'
  );
  caseRadiosForBtn.forEach((r) =>
    r.addEventListener("change", refreshApplyButton)
  );
  // 允许外部触发刷新（如Tab切换）
  document.addEventListener("refresh-apply", refreshApplyButton);

  // 清空按钮
  clearAllButton.addEventListener("click", () => {
    // 清空文件列表
    loadedFiles = [];
    clearTable();
    updateFileCount();

    // 重置全选复选框
    const selectAllEl = document.getElementById('select-all');
    if (selectAllEl) {
      selectAllEl.checked = false;
      selectAllEl.indeterminate = false;
    }

    // 重置排序状态
    sortKey = null;
    sortAsc = true;
    lastSelectedIndex = -1;
    if (typeof updateSortIndicators === 'function') {
      updateSortIndicators();
    }

    // 清空所有输入框
    findInput.value = "";
    replaceInput.value = "";
    startInput.value = "1";
    digitsInput.value = "2";

    // 重置单选框到默认状态
    document.getElementById("pos-prefix").checked = true;


    saveHistory();

    // 重置状态栏
    if (typeof window.updateStatusBar === 'function') {
      try { window.updateStatusBar({ total: 0, selected: 0, success: 0, failed: 0, message: "" }); } catch (_) {}
    }
  });

  // 执行重命名按钮
  console.log("🔧 [初始化] 正在绑定执行重命名按钮事件:", applyRenameButton);
  
  if (!applyRenameButton) {
    console.error("❌ [初始化] 找不到执行重命名按钮元素!");
    return;
  }
  
  // 临时测试：强制启用按钮
  setTimeout(() => {
    console.log("🔧 [测试] 强制启用按钮进行测试");
    applyRenameButton.disabled = false;
  }, 2000);
  
  applyRenameButton.addEventListener("click", async (event) => {
    console.log("🚀 [按钮点击] 点击了执行重命名按钮");
    console.log("🚀 [按钮点击] 事件对象:", event);
    console.log("🚀 [按钮点击] 按钮状态:", {
      disabled: applyRenameButton.disabled,
      loadedFilesCount: loadedFiles.length
    });
    
    // 防止按钮被禁用时仍然执行
    if (applyRenameButton.disabled) {
      console.log("⚠️ [按钮点击] 按钮被禁用，停止执行");
      return;
    }

    // 收集文件路径数组：若有选中项，则仅对选中项执行；否则对全部
    const selectedItems = loadedFiles.filter(f => f.selected);
    const targetItems = selectedItems.length > 0 ? selectedItems : loadedFiles;
    const filePaths = targetItems.map((fileInfo) => fileInfo.path);

    // 收集当前激活选项卡和规则数据
    const activeTab = document.querySelector(".tab-content.active");
    if (!activeTab) {
      showErrorMsg("无法识别当前激活的标签页");
      return;
    }
    const activeTabId = activeTab.id.replace("tab-", "");

    let ruleData = {};

    switch (activeTabId) {
      case "replace":
        ruleData = {
          find: findInput.value,
          replace: replaceInput.value,
        };
        break;
      case "sequence": {
        const positionElement = document.querySelector('input[name="position"]:checked');
        ruleData = {
          start: parseInt(startInput.value) || 1,
          digits: parseInt(digitsInput.value) || 2,
          position: positionElement ? positionElement.value : "prefix",
        };
        break;
      }
      case "case": {
        const checked = document.querySelector(
          '#tab-case input[name="caseType"]:checked'
        );
        const caseType = checked ? checked.value : "";
        ruleData = { caseType };
        break;
      }
    }

    // 打印收集到的数据
    console.log("文件路径数组:", filePaths);
    console.log("激活的选项卡:", activeTabId);
    console.log("规则数据:", ruleData);

    // 调用 Tauri 后端执行重命名
    await executeRename(filePaths, activeTabId, ruleData);
  });
}

// 更新重命名后的文件名
function updateFileNamesAfterRename(renamedFiles) {
  if (!Array.isArray(renamedFiles)) return;
  
  console.log("🔄 [updateFileNamesAfterRename] 更新文件名，renamedFiles:", renamedFiles);
  
  // renamedFiles 包含 {old_path, new_path} 的映射
  renamedFiles.forEach(renameInfo => {
    const fileInfo = loadedFiles.find(f => f.path === renameInfo.old_path);
    if (fileInfo) {
      console.log("🔄 [updateFileNamesAfterRename] 更新文件:", {
        oldPath: fileInfo.path,
        oldName: fileInfo.name,
        newPath: renameInfo.new_path,
        newName: renameInfo.new_path.split(/[\\/]/).pop()
      });
      
      // 更新文件路径和名称
      fileInfo.path = renameInfo.new_path;
      fileInfo.name = renameInfo.new_path.split(/[\\/]/).pop();
      // 重命名后，newPath应该等于新的文件名，这样预览会显示"无变化"
      fileInfo.newPath = fileInfo.name;
      fileInfo.hasConflict = false;
      fileInfo.invalidChar = false;
    }
  });
  
  console.log("🔄 [updateFileNamesAfterRename] 更新后的loadedFiles:", loadedFiles);
  
  // 重命名后立即更新预览，确保显示正确
  updatePreview();
}



// 调用 Tauri 后端执行重命名
async function executeRename(filePaths, activeTabId, ruleData) {
  console.log("🚀 [前端日志] 开始执行重命名");
  console.log("🚀 [前端日志] 文件路径:", filePaths);
  console.log("🚀 [前端日志] 激活选项卡:", activeTabId);
  console.log("🚀 [前端日志] 规则数据:", ruleData);

  if (filePaths.length === 0) {
    showErrorMsg("请先选择文件");
    return;
  }

  // 检查文件名冲突和非法字符
  const conflictFiles = loadedFiles.filter(f => f.hasConflict);
  const invalidCharFiles = loadedFiles.filter(f => f.invalidChar);
  
  if (conflictFiles.length > 0) {
    showErrorMsg(`检测到 ${conflictFiles.length} 个文件存在重名冲突，请修改规则避免重复文件名`);
    return;
  }
  
  if (invalidCharFiles.length > 0) {
    showErrorMsg(`检测到 ${invalidCharFiles.length} 个文件包含非法字符（如 / 或 :），请修改规则`);
    return;
  }

  // 跳过无写权限文件
  const filesToRename = loadedFiles.filter(
    (f) => filePaths.includes(f.path) && f.writable !== false
  );
  const skippedFiles = loadedFiles.filter(
    (f) => filePaths.includes(f.path) && f.writable === false
  );
  if (skippedFiles.length > 0) {
    showErrorMsg(`${skippedFiles.length} 个文件因无写权限被跜过`, false);
  }
  if (filesToRename.length === 0) {
    showErrorMsg("所选文件均无写权限，无法重命名");
    return;
  }

  try {
    // 构建规则对象
    let backendRule = {};
    if (activeTabId === "replace") {
      backendRule = {
        type: "replace",
        find: ruleData.find || "",
        replace: ruleData.replace || "",
        regex: ruleData.regex || false,
        case_sensitive: ruleData.caseSensitive || false,
      };
    } else if (activeTabId === "sequence") {
      backendRule = {
        type: "sequence",
        start: parseInt(ruleData.start) || 1,
        step: parseInt(ruleData.step) || 1,
        width: parseInt(ruleData.digits) || 2,
        order: ruleData.order || "current",
      };
    } else if (activeTabId === "slice") {
      backendRule = {
        type: "slice",
        start: parseInt(ruleData.start) || 0,
        end: ruleData.end !== null && ruleData.end !== undefined ? parseInt(ruleData.end) : null,
        replacement: ruleData.replacement || "",
      };
    } else if (activeTabId === "case") {
      backendRule = {
        type: "case",
        caseType: ruleData.caseType || "lower",
      };
    } else if (activeTabId === "extension") {
      backendRule = {
        type: "extension",
        new_extension: ruleData.newExtension || null,
        keep_original: ruleData.keepOriginal || false,
      };
    }

    console.log("🚀 [前端日志] 构建的后端规则:", backendRule);

    // 先调用预览接口获取新文件名
    const previewResult = await invoke("preview_rename", {
      files: filePaths,
      rule: backendRule,
    });

    console.log("🚀 [前端日志] 预览结果:", previewResult);

    // 构建操作列表
    const operations = [];
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const preview = previewResult[i];
      
      if (preview && !preview.error_message && preview.new_name !== preview.original_name) {
        operations.push({
          old_path: filePath,
          new_name: preview.new_name,
        });
      }
    }

    if (operations.length === 0) {
      showErrorMsg("没有文件需要重命名");
      return;
    }

    console.log("🚀 [前端日志] 即将调用 invoke('execute_rename_batch')");

    const result = await invoke("execute_rename_batch", {
      operations: operations,
    });

    console.log("🚀 [前端日志] 后端返回结果:", result);

    if (result.success_count > 0) {
      showErrorMsg(`成功重命名 ${result.success_count} 个文件`, true);
      
      // 更新文件列表中的文件名
      updateFileNamesAfterRename(result.operations);
      updateFileTable();
      updateFileCount();
    }
    
    if (result.failed_count > 0) {
      showErrorMsg(`${result.failed_count} 个文件重命名失败`);
    }

  } catch (error) {
    console.error("❌ [前端日志] 调用后端失败:", error);
    console.error("❌ [前端日志] 错误详情:", error.message);
    showErrorMsg("执行重命名时发生错误: " + error.message);
  }
}
