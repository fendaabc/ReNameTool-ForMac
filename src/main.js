// 统一错误提示函数（顶部toast横幅）
function showErrorMsg(msg, isSuccess = false) {
  if (typeof msg === "object" && msg !== null) {
    msg = msg.error_message || msg.message || JSON.stringify(msg);
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

// 主题切换按钮逻辑
const themeOrder = ["light", "purelight", "dark"];
let currentThemeIdx = 0;
const html = document.documentElement;
window.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  function setTheme(idx) {
    const theme = themeOrder[idx];
    html.setAttribute("data-theme", theme);
    // 切换SVG图标
    if (theme === "dark") {
      themeIcon.innerHTML = `<svg id=\"icon-sun\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"display:block;\"><circle cx=\"12\" cy=\"12\" r=\"5\"/><path d=\"M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41\"/></svg>`;
    } else if (theme === "purelight") {
      themeIcon.innerHTML = `<svg id=\"icon-sun\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"display:block;\"><circle cx=\"12\" cy=\"12\" r=\"5\"/><path d=\"M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41\"/></svg>`;
    } else {
      themeIcon.innerHTML = `<svg id=\"icon-moon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"display:block;\"><path d=\"M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z\"/></svg>`;
    }
  }
  setTheme(currentThemeIdx);
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      currentThemeIdx = (currentThemeIdx + 1) % themeOrder.length;
      setTheme(currentThemeIdx);
    });
  }
});

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";

// 立即执行的测试
console.log("=== JavaScript 文件已加载 ===");

// 全局变量存储文件信息
let loadedFiles = [];
let lastRenameUndoInfo = null;
let undoRenameButton = null;
// 撤销操作历史栈
let undoStack = [];

// 立即暴露函数到window对象，不等待DOM加载
window.getLoadedFiles = () => {
  console.log("🔍 [main.js] getLoadedFiles被调用，返回:", loadedFiles);
  return loadedFiles;
};

// 暴露设置文件列表的函数
window.setLoadedFiles = (files) => {
  console.log("🔧 [main.js] setLoadedFiles被调用，设置:", files);
  loadedFiles = files.map(filePath => ({
    name: filePath.split(/[\\/]/).pop(),
    path: filePath,
    readable: true,
    writable: true,
    newPath: filePath.split(/[\\/]/).pop(),
    hasConflict: false,
    invalidChar: false
  }));
  console.log("🔧 [main.js] loadedFiles已更新:", loadedFiles);
};

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
  localStorage.setItem("renameUndoStack", JSON.stringify(undoStack));
}
function loadHistory() {
  try {
    const u = localStorage.getItem("renameUndoStack");
    undoStack = u ? JSON.parse(u) : [];
  } catch (e) {
    undoStack = [];
  }
}

// DOM 元素引用
let dropZone;
let fileTable;
let fileCountElement;
let clearAllButton;
let applyRenameButton;

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
  initializeEventListeners();

  // 初始化主题
  initializeTheme();

  loadHistory();
  console.log("=== DOM 已加载，开始初始化 ===");

  initializeElements();
  // 按钮状态更新函数
  window.updateUndoButtons = function () {
    const undoRenameButton = document.getElementById("undo-rename");
    // 撤销按钮状态现在由重命名和撤销操作直接管理
    // 这个函数保留用于初始化
    if (undoRenameButton) undoRenameButton.disabled = true;
  };

  initializeEventListeners();
  // 确保在所有事件监听器设置完毕后，更新一次按钮状态
  updateUndoButtons();

  // 添加简单的拖拽测试
  testDragDrop();
  
  // executeRename函数已在文件开头暴露
});

// 简单的拖拽测试函数
function testDragDrop() {
  console.log("=== 开始设置拖拽测试 ===");

  // 在整个文档上监听拖拽事件
  document.addEventListener("dragenter", function (e) {
    console.log("🔥 Document dragenter detected!", e);
    document.body.style.border = "3px solid red";
    e.preventDefault();
  });

  document.addEventListener("dragover", function (e) {
    console.log("🔥 Document dragover detected!", e);
    e.preventDefault();
  });

  document.addEventListener("drop", function (e) {
    console.log("🔥 Document drop detected!", e);
    console.log("🔥 Files:", e.dataTransfer.files);
    document.body.style.border = "";
    e.preventDefault();
  });

  document.addEventListener("dragleave", function (e) {
    console.log("🔥 Document dragleave detected!", e);
    document.body.style.border = "";
  });

  // 也在 body 上监听
  document.body.addEventListener("dragenter", function (e) {
    console.log("🟢 Body dragenter detected!", e);
    e.preventDefault();
  });

  document.body.addEventListener("dragover", function (e) {
    console.log("🟢 Body dragover detected!", e);
    e.preventDefault();
  });

  document.body.addEventListener("drop", function (e) {
    console.log("🟢 Body drop detected!", e);
    e.preventDefault();
  });

  console.log("=== 拖拽测试监听器已设置 ===");
}

function initializeElements() {
  console.log("🔧 [初始化] 开始初始化DOM元素");
  
  dropZone = document.getElementById("drop-zone");
  fileTable = document.getElementById("file-table-body");
  fileCountElement = document.getElementById("file-count");
  clearAllButton = document.getElementById("clear-all");
  applyRenameButton = document.getElementById("apply-rename");
  undoRenameButton = document.getElementById("undo-rename");

  console.log("🔧 [初始化] 主要元素:", {
    dropZone: !!dropZone,
    fileTable: !!fileTable,
    fileCountElement: !!fileCountElement,
    applyRenameButton: !!applyRenameButton,
    clearAllButton: !!clearAllButton,
    undoRenameButton: !!undoRenameButton
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
    fileCountElem.textContent = "正在加载文件，请稍候...";
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

    // 权限检测：检查每个文件的读写权限
    let checkedFiles = [];
    for (const f of files) {
      try {
        const perm = await invoke("check_file_permission", { path: f });
        checkedFiles.push({
          name: f.split(/[\\/]/).pop(),
          path: f,
          readable: perm.readable,
          writable: perm.writable,
        });
      } catch (e) {
        checkedFiles.push({
          name: f.split(/[\\/]/).pop(),
          path: f,
          readable: false,
          writable: false,
        });
      }
    }
    loadedFiles = checkedFiles;
    updateFileTable();
    updateFileCount();

    updatePreview();
    // 只显示文件数量统计
    const fileCountElem = document.getElementById("file-count");
    if (fileCountElem) {
      fileCountElem.textContent = `已加载 ${loadedFiles.length} 个文件`;
    }
    // 空状态提示行显示/隐藏
    const emptyRow = document.getElementById("empty-tip-row");
    if (emptyRow)
      emptyRow.style.display = loadedFiles.length === 0 ? "" : "none";
    // 空文件夹或无有效文件时友好提示
    if (loadedFiles.length === 0) {
      showErrorMsg("未检测到可导入的文件。");
    }
  } catch (error) {
    console.error("处理文件路径失败:", error);
    showErrorMsg("处理文件路径失败: " + error.message);
  } finally {
    if (fileCountElem) fileCountElem.textContent = loadingBackup;
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
  
  clearTable();
  const emptyRow = document.getElementById("empty-tip-row");
  const applyRenameButton = document.getElementById("apply-rename");
  if (loadedFiles.length === 0) {
    if (emptyRow) emptyRow.style.display = "";
    if (applyRenameButton) applyRenameButton.disabled = true;
    return;
  }
  if (emptyRow) emptyRow.style.display = "none";
  // 确保loadedFiles中的文件信息是最新的，包括newPath, hasConflict, invalidChar
  // 这一步在updatePreview中已经完成，这里只需使用

  loadedFiles.forEach((fileInfo, index) => {
    const hasChange = fileInfo.newPath && fileInfo.newPath !== fileInfo.name;
    let warn = "";
    let rowClass = "";

    // 权限检测
    let permIcon = "";
    if (fileInfo.writable === false) {
      warn +=
        ' <span title="无写权限，跳过" style="color:#e87b00;font-size:1.1em;vertical-align:middle;">🔒</span>';
      rowClass += "file-row-readonly ";
    }

    // 冲突或非法字符警告
    if (fileInfo.hasConflict) {
      warn += ' <span style="color:#c00;font-size:0.9em;">(重名冲突)</span>';
      rowClass += "file-row-conflict ";
    } else if (fileInfo.invalidChar) {
      warn += ' <span style="color:#c00;font-size:0.9em;">(非法字符)</span>';
      rowClass += "file-row-invalid ";
    }

    // 行内容
    let row = document.createElement("tr");
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${fileInfo.name}</td>
      <td class="preview-cell ${
        hasChange ? "preview-highlight" : "dimmed"
      }" style="font-family:monospace;">
        ${fileInfo.newPath || "(无变化)"} ${warn}
      </td>
    `;
    row.className = rowClass.trim();
    fileTable.appendChild(row);
  });
  // 按钮状态更新由 setupButtonEvents.refreshApplyButton() 统一处理
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
  console.log("🔄 [updatePreview] 被调用，loadedFiles.length:", loadedFiles.length);
  
  if (loadedFiles.length === 0) return;

  console.log("🔄 [updatePreview] 开始更新预览");
  
  // 1. 更新所有文件的预览名称
  loadedFiles.forEach((fileInfo, index) => {
    const oldNewPath = fileInfo.newPath;
    fileInfo.newPath = getPreviewName(fileInfo.name, false, index);
    console.log(`🔄 [updatePreview] 文件${index}: ${fileInfo.name} -> ${oldNewPath} -> ${fileInfo.newPath}`);
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

  // 4. 更新“执行重命名”按钮状态
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
    case "tab-case": {
      const checked = document.querySelector(
        '#tab-case input[name="caseType"]:checked'
      );
      if (!checked) return fileName;
      const val = checked.value; // 'upper' | 'lower' | 'capitalize'
      let newName = fileName;
      if (val === "lower") newName = fileName.toLowerCase();
      else if (val === "upper") newName = fileName.toUpperCase();
      else if (val === "capitalize")
        newName = fileName.replace(
          /(^|[^a-zA-Z])([a-z])/g,
          (m, pre, char) => pre + char.toUpperCase()
        );
      if (withHighlight && newName !== fileName) {
        // 高亮变化部分
        let html = "";
        for (let i = 0; i < newName.length; i++) {
          if (fileName[i] !== newName[i]) {
            html += `<span class='highlight'>${newName[i] || ""}</span>`;
          } else {
            html += newName[i] || "";
          }
        }
        return html;
      }
      return newName;
    }
    default:
      return fileName;
  }
}

function getPreviewForReplace(fileName) {
  if (!findInput) {
    findInput = document.getElementById("find");
  }
  if (!replaceInput) {
    replaceInput = document.getElementById("replace");
  }
  
  const findText = findInput ? findInput.value : "";
  const replaceText = replaceInput ? replaceInput.value : "";

  if (!findText) return fileName;

  return fileName.replace(new RegExp(findText, "g"), replaceText);
}

function getPreviewForSequence(fileName, withHighlight = false, fileIndex = 0) {
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

// 按钮事件相关
function setupButtonEvents() {
  console.log("🔧 [初始化] 开始设置按钮事件");
  
  // 初始禁用状态
  const applyBtn = document.getElementById("apply-rename");
  const undoBtn = document.getElementById("undo-rename");
  
  console.log("🔧 [初始化] 按钮元素检查:", {
    applyBtn,
    undoBtn,
    applyRenameButton
  });
  
  if (applyBtn) applyBtn.disabled = true;
  if (undoBtn) undoBtn.disabled = true;
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

  // 撤销按钮事件
  if (undoRenameButton) {
    undoRenameButton.addEventListener("click", async () => {
      try {
        const result = await invoke("undo_rename");
        if (result.success) {
          showErrorMsg("已撤销上一步重命名", true);
          
          // 更新文件列表中的文件名，恢复到撤销前的状态
          if (result.undo_info && Array.isArray(result.undo_info)) {
            updateFileNamesAfterUndo(result.undo_info);
          }
          
          updateFileTable();
          updateFileCount();
          
          // 撤销成功后禁用撤销按钮
          if (undoRenameButton) undoRenameButton.disabled = true;
        } else {
          showErrorMsg(result.error_message || "撤销失败");
        }
      } catch (error) {
        showErrorMsg("撤销操作发生错误: " + error.message);
      }
    });
  }
  // 重做按钮已移除

  // 清空按钮
  clearAllButton.addEventListener("click", () => {
    // 清空文件列表
    loadedFiles = [];
    clearTable();
    updateFileCount();

    // 清空所有输入框
    findInput.value = "";
    replaceInput.value = "";
    startInput.value = "1";
    digitsInput.value = "2";

    // 重置单选框到默认状态
    document.getElementById("pos-prefix").checked = true;

    // 清空操作历史栈并更新按钮状态
    undoStack = [];
    updateUndoButtons();
    saveHistory();
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

    // 收集文件路径数组
    const filePaths = loadedFiles.map((fileInfo) => fileInfo.path);

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
function updateFileNamesAfterRename(undoInfo) {
  if (!Array.isArray(undoInfo)) return;
  
  console.log("🔄 [updateFileNamesAfterRename] 更新文件名，undoInfo:", undoInfo);
  
  // undoInfo 包含 {old_path, new_path} 的映射
  undoInfo.forEach(renameInfo => {
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

// 更新撤销后的文件名
function updateFileNamesAfterUndo(undoInfo) {
  if (!Array.isArray(undoInfo)) return;
  
  // 撤销时，new_path 变回 old_path
  undoInfo.forEach(renameInfo => {
    const fileInfo = loadedFiles.find(f => f.path === renameInfo.new_path);
    if (fileInfo) {
      // 恢复原始文件路径和名称
      fileInfo.path = renameInfo.old_path;
      fileInfo.name = renameInfo.old_path.split(/[\\/]/).pop();
      // 重置预览相关状态
      fileInfo.newPath = fileInfo.name;
      fileInfo.hasConflict = false;
      fileInfo.invalidChar = false;
    }
  });
}

// 调用 Tauri 后端执行重命名
async function executeRename(filePaths, activeTabId, ruleData) {
  console.log("🚀 [前端日志] 开始执行重命名");
  console.log("🚀 [前端日志] 文件路径:", filePaths);
  console.log("🚀 [前端日志] 激活选项卡:", activeTabId);
  console.log("🚀 [前端日志] 规则数据:", ruleData);

  // 操作前快照入undo栈
  if (loadedFiles.length > 0) {
    undoStack.push(loadedFiles.map((f) => ({ ...f })));
    // 撤销按钮状态将在重命名成功后更新
    saveHistory();
  }
  if (filePaths.length === 0) {
    showErrorMsg("请先选择文件");
    return;
  }

  // 校验规则
  if (activeTabId === "replace") {
    if (!ruleData.find) {
      showErrorMsg("请输入要查找的内容");
      return;
    }
    if (ruleData.find.length === 0) {
      showErrorMsg("查找内容不能为空");
      return;
    }
  }
  
  if (activeTabId === "sequence") {
    if (ruleData.start === undefined || ruleData.start === null) {
      showErrorMsg("请填写序列号起始数字");
      return;
    }
    if (ruleData.start < 0) {
      showErrorMsg("序列号起始数字不能为负数");
      return;
    }
    if (!ruleData.digits || ruleData.digits <= 0) {
      showErrorMsg("序列号位数必须大于0");
      return;
    }
    if (ruleData.digits > 10) {
      showErrorMsg("序列号位数不能超过10位");
      return;
    }
    if (!ruleData.position) {
      showErrorMsg("请选择序列号位置（前缀或后缀）");
      return;
    }
  }
  
  if (activeTabId === "case") {
    if (!ruleData.caseType) {
      showErrorMsg("请选择大小写转换类型");
      return;
    }
    if (!["upper", "lower", "capitalize"].includes(ruleData.caseType)) {
      showErrorMsg("无效的大小写转换类型");
      return;
    }
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
    showErrorMsg(`${skippedFiles.length} 个文件因无写权限被跳过`, false);
  }
  if (filesToRename.length === 0) {
    showErrorMsg("所选文件均无写权限，无法重命名");
    return;
  }
  try {
    let backendRule = {};
    if (activeTabId === "replace") {
      backendRule = {
        type: "replace",
        find: ruleData.find,
        replace: ruleData.replace || "",
      };
    } else if (activeTabId === "sequence") {
      backendRule = {
        type: "sequence",
        start: ruleData.start,
        digits: ruleData.digits,
        position: ruleData.position,
      };
    } else if (activeTabId === "case") {
      backendRule = {
        type: "case",
        caseType: ruleData.caseType, // "upper" | "lower" | "capitalize"
      };
    }

    console.log("🚀 [前端日志] 构建的后端规则:", backendRule);
    console.log("🚀 [前端日志] 即将调用 invoke('execute_rename')");

    const result = await invoke("execute_rename", {
      filePaths: filePaths,
      rule: backendRule,
    });

    console.log("🚀 [前端日志] 后端返回结果:", result);

    if (result.success) {
      if (result.renamed_count > 0) {
        showErrorMsg(`成功重命名 ${result.renamed_count} 个文件`, true);
        // 保存撤销信息
        if (Array.isArray(result.undo_info)) {
          lastRenameUndoInfo = { undo_map: result.undo_info };
          if (undoRenameButton) undoRenameButton.disabled = false;
        } else {
          lastRenameUndoInfo = null;
          if (undoRenameButton) undoRenameButton.disabled = true;
        }
        
        // 更新文件列表中的文件名，而不是清空列表
        updateFileNamesAfterRename(result.undo_info);
        updateFileTable();
        updateFileCount();
      } else {
        showErrorMsg(result.error_message || "没有文件需要重命名");
      }
    } else {
      showErrorMsg(`重命名失败: ${result.error_message || "未知错误"}`);
    }
  } catch (error) {
    console.error("❌ [前端日志] 调用后端失败:", error);
    console.error("❌ [前端日志] 错误详情:", error.message);
    showErrorMsg("执行重命名时发生错误: " + error.message);
  }
}
