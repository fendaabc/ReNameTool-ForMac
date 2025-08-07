import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";

// 立即执行的测试
console.log("=== JavaScript 文件已加载 ===");

// 全局变量存储文件信息
let loadedFiles = [];

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
  try {
    console.log("处理路径（可能包含文件夹）:", paths);

    // 调用 Rust 后端来展开文件夹中的文件
    const allFilePaths = await invoke("get_files_from_paths", {
      paths: paths,
    });

    console.log("展开后的所有文件:", allFilePaths);

    // 清空现有文件和表格
    loadedFiles = [];
    clearTable();

    // 处理所有文件路径
    allFilePaths.forEach((filePath) => {
      const fileName = filePath.split("/").pop() || filePath.split("\\").pop();
      loadedFiles.push({
        name: fileName,
        path: filePath, // 真实的文件路径
      });
    });

    // 更新显示
    updateFileTable();
    updateFileCount();
    updatePreview();
  } catch (error) {
    console.error("处理文件路径失败:", error);
    alert("处理文件路径失败: " + error.message);
  }
}

function clearTable() {
  fileTable.innerHTML = "";
}

function updateFileTable() {
  clearTable();

  loadedFiles.forEach((fileInfo, index) => {
    const previewName = getPreviewName(fileInfo.name);
    const hasChange = previewName !== fileInfo.name;

    const row = document.createElement("tr");
    row.innerHTML = `
            <th scope="row">${index + 1}</th>
            <td>${fileInfo.name}</td>
            <td class="preview-cell ${hasChange ? "preview-highlight" : "dimmed"}">
                ${hasChange ? previewName : "(无变化)"}
            </td>
        `;
    fileTable.appendChild(row);
  });
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
      document.getElementById(tabId).classList.add("active");
      updatePreview();
    });
  });
}

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

function getPreviewName(fileName) {
  const activeTab = document.querySelector(".tab-content.active");
  if (!activeTab) return fileName;
  const tabId = activeTab.id;
  switch (tabId) {
    case "tab-replace":
      return getPreviewForReplace(fileName);
    case "tab-sequence":
      return getPreviewForSequence(fileName);
    case "tab-case": {
      // 判断哪个大小写按钮激活
      const activeCaseBtn = document.querySelector("#tab-case button.active");
      if (!activeCaseBtn) return fileName;
      const text = activeCaseBtn.textContent;
      if (text.includes("小写")) return fileName.toLowerCase();
      if (text.includes("大写")) return fileName.toUpperCase();
      if (text.includes("首字母")) return fileName.replace(/(^|[^a-zA-Z])([a-z])/g, (m, pre, char) => pre + char.toUpperCase());
      return fileName;
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

function getPreviewForSequence(fileName) {
  const start = parseInt(startInput.value) || 1;
  const digits = parseInt(digitsInput.value) || 2;
  const position = document.querySelector('input[name="position"]:checked').value;

  const sequenceNumber = start.toString().padStart(digits, "0");
  const fileExtension = fileName.includes(".")
    ? "." + fileName.split(".").pop()
    : "";
  const fileNameWithoutExt = fileName.includes(".")
    ? fileName.substring(0, fileName.lastIndexOf("."))
    : fileName;

  if (position === "prefix") {
    return `${sequenceNumber}_${fileName}`;
  } else {
    return `${fileNameWithoutExt}_${sequenceNumber}${fileExtension}`;
  }
}

// 按钮事件相关
function setupButtonEvents() {
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
      case "case":
        ruleData = {
          // 大小写转换的具体规则需要根据点击的按钮确定
          // 这里暂时留空，实际使用时需要记录用户点击了哪个按钮
        };
        break;
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

  // 目前只支持查找替换功能
  if (activeTabId !== "replace") {
    alert("目前只支持查找替换功能，其他功能正在开发中");
    return;
  }

  // 检查查找替换规则
  if (!ruleData.find) {
    alert("请输入要查找的内容");
    return;
  }

  try {
    console.log("准备调用 Tauri 后端，文件路径:", filePaths);
    console.log("使用规则:", ruleData);

    // 调用 Rust 后端 - 传递文件路径和规则
    const result = await invoke("execute_rename", {
      filePaths: filePaths,
      rule: {
        find: ruleData.find,
        replace: ruleData.replace || "",
      },
    });

    console.log("重命名结果:", result);

    if (result.success) {
      if (result.renamed_count > 0) {
        alert(`成功重命名 ${result.renamed_count} 个文件`);
        // 重命名成功后清空文件列表
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
