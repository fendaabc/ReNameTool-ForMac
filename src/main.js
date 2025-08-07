// 主题切换按钮逻辑
const themeOrder = ["light", "purelight", "dark"];
let currentThemeIdx = 0;
const html = document.documentElement;
window.addEventListener('DOMContentLoaded', () => {
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

// DOM 元素引用
let dropZone;
let fileTable;
let fileCountElement;
let clearAllButton;
let applyRenameButton;

// Tab 相关元素
let tabLinks;
let tabContents;

// 输入框元素
let findInput;
let replaceInput;
let startInput;
let digitsInput;
let positionRadios;

// 初始化
document.addEventListener("DOMContentLoaded", function () {
  console.log("=== DOM 已加载，开始初始化 ===");
  
  initializeElements();
  initializeEventListeners();
  
  // 添加简单的拖拽测试
  testDragDrop();
});

// 简单的拖拽测试函数
function testDragDrop() {
  console.log("=== 开始设置拖拽测试 ===");
  
  // 在整个文档上监听拖拽事件
  document.addEventListener('dragenter', function(e) {
    console.log('🔥 Document dragenter detected!', e);
    document.body.style.border = '3px solid red';
    e.preventDefault();
  });
  
  document.addEventListener('dragover', function(e) {
    console.log('🔥 Document dragover detected!', e);
    e.preventDefault();
  });
  
  document.addEventListener('drop', function(e) {
    console.log('🔥 Document drop detected!', e);
    console.log('🔥 Files:', e.dataTransfer.files);
    document.body.style.border = '';
    e.preventDefault();
  });
  
  document.addEventListener('dragleave', function(e) {
    console.log('🔥 Document dragleave detected!', e);
    document.body.style.border = '';
  });
  
  // 也在 body 上监听
  document.body.addEventListener('dragenter', function(e) {
    console.log('🟢 Body dragenter detected!', e);
    e.preventDefault();
  });
  
  document.body.addEventListener('dragover', function(e) {
    console.log('🟢 Body dragover detected!', e);
    e.preventDefault();
  });
  
  document.body.addEventListener('drop', function(e) {
    console.log('🟢 Body drop detected!', e);
    e.preventDefault();
  });
  
  console.log("=== 拖拽测试监听器已设置 ===");
}

function initializeElements() {
  dropZone = document.getElementById("drop-zone");
  fileTable = document.querySelector("tbody");
  fileCountElement = document.getElementById("file-count");
  clearAllButton = document.getElementById("clear-all");
  applyRenameButton = document.getElementById("apply-rename");
  undoRenameButton = document.getElementById("undo-rename");

  tabLinks = document.querySelectorAll(".tab-link");
  tabContents = document.querySelectorAll(".tab-content");

  findInput = document.getElementById("find");
  replaceInput = document.getElementById("replace");
  startInput = document.getElementById("start");
  digitsInput = document.getElementById("digits");
  positionRadios = document.querySelectorAll('input[name="position"]');
}

function initializeEventListeners() {
  // 文件拖拽和选择
  setupFileHandling();

  // Tab 切换
  setupTabSwitching();

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
      alert("文件夹选择失败: " + error.message);
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
  const fileCountElem = document.getElementById('file-count');
  let loadingBackup = '';
  if (fileCountElem) {
    loadingBackup = fileCountElem.textContent;
    fileCountElem.textContent = '正在加载文件，请稍候...';
  }
  let timeoutId = null;
  try {
    // 超时保护（如10秒未返回，提示用户）
    let timedOut = false;
    timeoutId = setTimeout(() => {
      timedOut = true;
      if (fileCountElem) fileCountElem.textContent = '加载文件超时，请检查文件夹内容或重试';
      alert('文件夹内容过大或处理超时，请稍后重试或分批导入。');
    }, 10000);

    console.log("处理路径（可能包含文件夹）:", paths);
    const allFilePaths = await invoke("get_files_from_paths", { paths });
    if (timedOut) return;
    clearTimeout(timeoutId);
    console.log("展开后的所有文件:", allFilePaths);
    // 支持的扩展名（常见图片/文档/视频/压缩包等）
    const allowedExts = [
      'jpg','jpeg','png','gif','bmp','webp','svg','heic','tiff',
      'pdf','doc','docx','xls','xlsx','ppt','pptx','txt','md','csv',
      'mp4','mov','avi','mkv','webm','mp3','wav','aac','flac','zip','rar','7z','tar','gz'
    ];
    // 清空现有文件和表格
    loadedFiles = [];
    clearTable();
    // 统计文件夹数量（只统计目录路径）
    let folderCount = 0;
    paths.forEach((p) => {
      // 简单判断：不是以.扩展名结尾的路径视为文件夹
      if (!p.split('/').pop().includes('.')) folderCount++;
    });
    // 过滤并收集支持的文件
    allFilePaths.forEach((filePath) => {
      const fileName = filePath.split("/").pop() || filePath.split("\\").pop();
      const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      if (allowedExts.includes(ext)) {
        loadedFiles.push({ name: fileName, path: filePath });
      }
    });
    // 更新显示
    updateFileTable();
    updateFileCount();
    updatePreview();
    // 显示统计信息
    const fileCountElem = document.getElementById('file-count');
    if (fileCountElem) {
      fileCountElem.textContent = `已加载 ${loadedFiles.length} 个文件` + (folderCount > 0 ? `，${folderCount} 个文件夹` : '');
    }
    // 空状态提示行显示/隐藏
    const emptyRow = document.getElementById('empty-tip-row');
    if (emptyRow) emptyRow.style.display = loadedFiles.length === 0 ? '' : 'none';
    // 空文件夹或无有效文件时友好提示
    if (loadedFiles.length === 0) {
      alert(folderCount > 0 ? '未检测到可导入的文件，可能文件夹为空或不包含支持的文件类型。' : '未检测到可导入的文件。');
    }
  } catch (error) {
    console.error("处理文件路径失败:", error);
    alert("处理文件路径失败: " + error.message);
  } finally {
    if (fileCountElem) fileCountElem.textContent = loadingBackup;
  }
}

function clearTable() {
  if (!fileTable) return;
  fileTable.innerHTML = '';
}

function updateFileTable() {
  clearTable();
  const emptyRow = document.getElementById('empty-tip-row');
  const applyRenameButton = document.getElementById('apply-rename');
  if (loadedFiles.length === 0) {
    if (emptyRow) emptyRow.style.display = '';
    if (applyRenameButton) applyRenameButton.disabled = true;
    return;
  }
  if (emptyRow) emptyRow.style.display = 'none';
  // 生成所有新文件名
  const previewNames = loadedFiles.map(f => getPreviewName(f.name));
  // 检查冲突和非法字符
  const nameSet = new Set();
  let hasConflict = false;
  let illegalRows = [];
  previewNames.forEach((name, idx) => {
    // 检查非法字符
    if (/[\\/:*?"<>|]/.test(name)) {
      illegalRows.push(idx);
      hasConflict = true;
    }
    // 检查重名
    if (nameSet.has(name)) {
      hasConflict = true;
    } else {
      nameSet.add(name);
    }
  });
  // 渲染表格
  loadedFiles.forEach((fileInfo, index) => {
    const previewHTML = getPreviewName(fileInfo.name, true);
    const hasChange = previewHTML && !previewHTML.includes('(无变化)');
    const isIllegal = illegalRows.includes(index);
    const isDuplicate = previewNames.indexOf(previewNames[index]) !== index;
    const row = document.createElement("tr");
    let warn = '';
    if (isIllegal) warn = '<span style="color:#c00;font-size:0.9em;">(非法字符)</span>';
    if (isDuplicate) warn = '<span style="color:#c00;font-size:0.9em;">(重名冲突)</span>';
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${fileInfo.name}</td>
      <td class="preview-cell ${hasChange ? "preview-highlight" : "dimmed"}" style="font-family:monospace;">
        ${previewHTML} ${warn}
      </td>
    `;
    if (isIllegal || isDuplicate) row.style.background = '#ffeaea';
    fileTable.appendChild(row);
  });
  // 冲突时禁用按钮
  if (applyRenameButton) applyRenameButton.disabled = hasConflict;
}

function updateFileCount() {
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
      
      updatePreview();
    });
  });
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
    radio.addEventListener("change", updatePreview);
  });

  // 大小写转换按钮（实时预览）
  const caseButtons = document.querySelectorAll("#tab-case button");
  caseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // 记录激活按钮并刷新预览
      caseButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      updatePreview();
    });
  });
}

function updatePreview() {
  if (loadedFiles.length === 0) return;

  // 更新所有文件的预览
  const previewCells = document.querySelectorAll(".preview-cell");

  loadedFiles.forEach((fileInfo, index) => {
    if (index < previewCells.length) {
      const previewName = getPreviewName(fileInfo.name);
      const cell = previewCells[index];

      if (previewName !== fileInfo.name) {
        cell.textContent = previewName;
        cell.className = "preview-cell preview-highlight";
      } else {
        cell.textContent = "(无变化)";
        cell.className = "preview-cell dimmed";
      }
    }
  });
}

function getPreviewName(fileName, withHighlight = false) {
  const activeTab = document.querySelector(".tab-content.active");
  if (!activeTab) return fileName;
  const tabId = activeTab.id;
  switch (tabId) {
    case "tab-replace":
      return getPreviewForReplace(fileName, withHighlight);
    case "tab-sequence":
      return getPreviewForSequence(fileName, withHighlight);
    case "tab-case": {
      const activeCaseBtn = document.querySelector("#tab-case button.active");
      if (!activeCaseBtn) return fileName;
      const text = activeCaseBtn.textContent;
      let newName = fileName;
      if (text.includes("小写")) newName = fileName.toLowerCase();
      else if (text.includes("大写")) newName = fileName.toUpperCase();
      else if (text.includes("首字母")) newName = fileName.replace(/(^|[^a-zA-Z])([a-z])/g, (m, pre, char) => pre + char.toUpperCase());
      if (withHighlight && newName !== fileName) {
        // 高亮变化部分
        let html = '';
        for (let i = 0; i < newName.length; i++) {
          if (fileName[i] !== newName[i]) {
            html += `<span class='highlight'>${newName[i] || ''}</span>`;
          } else {
            html += newName[i] || '';
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
  const findText = findInput.value;
  const replaceText = replaceInput.value;

  if (!findText) return fileName;

  return fileName.replace(new RegExp(findText, "g"), replaceText);
}

function getPreviewForSequence(fileName, withHighlight = false) {
  const start = parseInt(startInput.value) || 1;
  const digits = parseInt(digitsInput.value) || 2;
  const position = document.querySelector('input[name="position"]:checked').value;
  const sequenceNumber = start.toString().padStart(digits, "0");
  const fileExtension = fileName.includes(".") ? "." + fileName.split(".").pop() : "";
  const fileNameWithoutExt = fileName.includes(".") ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
  let newName = position === "prefix"
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
  // 撤销按钮事件
  if (undoRenameButton) {
    undoRenameButton.addEventListener("click", async () => {
      if (!lastRenameUndoInfo) return;
      try {
        const result = await invoke("undo_rename", lastRenameUndoInfo);
        if (result.success) {
          alert("已撤销上一次重命名");
          undoRenameButton.disabled = true;
          lastRenameUndoInfo = null;
        } else {
          alert(result.error_message || "撤销失败");
        }
      } catch (error) {
        alert("撤销操作发生错误: " + error.message);
      }
    });
  }

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
  });

  // 执行重命名按钮
  applyRenameButton.addEventListener("click", async () => {
    console.log("点击了执行重命名按钮");

    // 收集文件路径数组
    const filePaths = loadedFiles.map((fileInfo) => fileInfo.path);

    // 收集当前激活选项卡和规则数据
    const activeTab = document.querySelector(".tab-content.active");
    const activeTabId = activeTab.id.replace("tab-", "");

    let ruleData = {};

    switch (activeTabId) {
      case "replace":
        ruleData = {
          find: findInput.value,
          replace: replaceInput.value,
        };
        break;
      case "sequence":
        ruleData = {
          start: parseInt(startInput.value) || 1,
          digits: parseInt(digitsInput.value) || 2,
          position: document.querySelector('input[name="position"]:checked')
            .value,
        };
        break;
      case "case": {
        // 记录大小写规则类型
        const activeCaseBtn = document.querySelector("#tab-case button.active");
        let caseType = "";
        if (activeCaseBtn) {
          if (activeCaseBtn.textContent.includes("小写")) caseType = "lower";
          else if (activeCaseBtn.textContent.includes("大写")) caseType = "upper";
          else if (activeCaseBtn.textContent.includes("首字母")) caseType = "capitalize";
        }
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

// 调用 Tauri 后端执行重命名
async function executeRename(filePaths, activeTabId, ruleData) {
  if (filePaths.length === 0) {
    alert("请先选择文件");
    return;
  }

    // 校验规则
  if (activeTabId === "replace" && !ruleData.find) {
    alert("请输入要查找的内容");
    return;
  }
  if (activeTabId === "sequence" && (!ruleData.start || !ruleData.digits)) {
    alert("请填写序列号起始和位数");
    return;
  }
  if (activeTabId === "case" && !ruleData.caseType) {
    alert("请选择大小写转换类型");
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
    const result = await invoke("execute_rename", {
      filePaths: filePaths,
      rule: backendRule,
    });
    console.log("重命名结果:", result);
    if (result.success) {
      if (result.renamed_count > 0) {
        alert(`成功重命名 ${result.renamed_count} 个文件`);
        // 保存撤销信息
        if (Array.isArray(result.undo_info)) {
          lastRenameUndoInfo = { undo_map: result.undo_info };
          if (undoRenameButton) undoRenameButton.disabled = false;
        } else {
          lastRenameUndoInfo = null;
          if (undoRenameButton) undoRenameButton.disabled = true;
        }
        loadedFiles = [];
        clearTable();
        updateFileCount();
      } else {
        alert(result.error_message || "没有文件需要重命名");
      }
    } else {
      alert(`重命名失败: ${result.error_message || "未知错误"}`);
    }
  } catch (error) {
    console.error("调用后端失败:", error);
    alert("执行重命名时发生错误: " + error.message);
  }
}
