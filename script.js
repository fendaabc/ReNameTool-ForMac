// 全局变量存储文件信息
let loadedFiles = [];

// DOM 元素引用
const dropZone = document.getElementById('drop-zone');
const fileTable = document.querySelector('tbody');
const fileCountElement = document.getElementById('file-count');
const clearAllButton = document.getElementById('clear-all');
const applyRenameButton = document.getElementById('apply-rename');

// Tab 相关元素
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

// 输入框元素
const findInput = document.getElementById('find');
const replaceInput = document.getElementById('replace');
const startInput = document.getElementById('start');
const digitsInput = document.getElementById('digits');
const positionRadios = document.querySelectorAll('input[name="position"]');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // 文件拖拽和选择
    setupFileHandling();
    
    // Tab 切换
    setupTabSwitching();
    
    // 实时预览
    setupRealTimePreview();
    
    // 按钮事件
    setupButtonEvents();
}

// 文件处理相关
function setupFileHandling() {
    // 创建隐藏的文件输入框
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // 点击选择文件
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 文件选择事件
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = 'var(--pico-primary-background)';
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '';
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(files) {
    // 清空现有文件和表格
    loadedFiles = [];
    clearTable();
    
    // 处理新文件
    Array.from(files).forEach(file => {
        loadedFiles.push({
            name: file.name,
            path: file.path || file.webkitRelativePath || file.name, // 获取完整路径
            file: file
        });
    });
    
    // 更新显示
    updateFileTable();
    updateFileCount();
    updatePreview();
}

function clearTable() {
    fileTable.innerHTML = '';
}

function updateFileTable() {
    clearTable();
    
    loadedFiles.forEach((fileInfo, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <th scope="row">${index + 1}</th>
            <td>${fileInfo.name}</td>
            <td class="preview-cell ${index === 0 ? 'preview-highlight' : 'dimmed'}">
                ${index === 0 ? getPreviewName(fileInfo.name) : '(仅预览第一条)'}
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
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 移除所有 active class
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 添加 active class 到被点击的链接和对应的内容
            const tabId = link.getAttribute('data-tab');
            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // 更新预览
            updatePreview();
        });
    });
}

// 实时预览相关
function setupRealTimePreview() {
    // 查找替换输入框
    findInput.addEventListener('input', updatePreview);
    replaceInput.addEventListener('input', updatePreview);
    
    // 序列号输入框
    startInput.addEventListener('input', updatePreview);
    digitsInput.addEventListener('input', updatePreview);
    
    // 位置单选框
    positionRadios.forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });
}

function updatePreview() {
    if (loadedFiles.length === 0) return;
    
    const firstFileName = loadedFiles[0].name;
    const previewName = getPreviewName(firstFileName);
    
    // 更新第一行的预览
    const firstPreviewCell = document.querySelector('.preview-cell');
    if (firstPreviewCell) {
        firstPreviewCell.textContent = previewName;
        firstPreviewCell.className = 'preview-cell preview-highlight';
    }
}

function getPreviewName(fileName) {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return fileName;
    
    const tabId = activeTab.id;
    
    switch (tabId) {
        case 'tab-replace':
            return getPreviewForReplace(fileName);
        case 'tab-sequence':
            return getPreviewForSequence(fileName);
        case 'tab-case':
            return fileName; // 大小写转换需要点击按钮，暂不实时预览
        default:
            return fileName;
    }
}

function getPreviewForReplace(fileName) {
    const findText = findInput.value;
    const replaceText = replaceInput.value;
    
    if (!findText) return fileName;
    
    return fileName.replace(new RegExp(findText, 'g'), replaceText);
}

function getPreviewForSequence(fileName) {
    const start = parseInt(startInput.value) || 1;
    const digits = parseInt(digitsInput.value) || 2;
    const position = document.querySelector('input[name="position"]:checked').value;
    
    const sequenceNumber = start.toString().padStart(digits, '0');
    const fileExtension = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
    const fileNameWithoutExt = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
    
    if (position === 'prefix') {
        return `${sequenceNumber}_${fileName}`;
    } else {
        return `${fileNameWithoutExt}_${sequenceNumber}${fileExtension}`;
    }
}

// 按钮事件相关
function setupButtonEvents() {
    // 清空按钮
    clearAllButton.addEventListener('click', () => {
        // 清空文件列表
        loadedFiles = [];
        clearTable();
        updateFileCount();
        
        // 清空所有输入框
        findInput.value = '';
        replaceInput.value = '';
        startInput.value = '1';
        digitsInput.value = '2';
        
        // 重置单选框到默认状态
        document.getElementById('pos-prefix').checked = true;
    });
    
    // 执行重命名按钮
    applyRenameButton.addEventListener('click', async () => {
        // 收集文件路径数组
        const filePaths = loadedFiles.map(fileInfo => fileInfo.path);
        
        // 收集当前激活选项卡和规则数据
        const activeTab = document.querySelector('.tab-content.active');
        const activeTabId = activeTab.id.replace('tab-', '');
        
        let ruleData = {};
        
        switch (activeTabId) {
            case 'replace':
                ruleData = {
                    find: findInput.value,
                    replace: replaceInput.value
                };
                break;
            case 'sequence':
                ruleData = {
                    start: parseInt(startInput.value) || 1,
                    digits: parseInt(digitsInput.value) || 2,
                    position: document.querySelector('input[name="position"]:checked').value
                };
                break;
            case 'case':
                ruleData = {
                    // 大小写转换的具体规则需要根据点击的按钮确定
                    // 这里暂时留空，实际使用时需要记录用户点击了哪个按钮
                };
                break;
        }
        
        // 打印收集到的数据
        console.log('文件路径数组:', filePaths);
        console.log('激活的选项卡:', activeTabId);
        console.log('规则数据:', ruleData);
        
        // 调用 Tauri 后端执行重命名
        await executeRename(filePaths);
    });
}

// 调用 Tauri 后端执行重命名
async function executeRename(filePaths) {
    if (filePaths.length === 0) {
        alert('请先选择文件');
        return;
    }
    
    try {
        // 检查是否在 Tauri 环境中
        if (typeof window.__TAURI__ === 'undefined') {
            console.log('不在 Tauri 环境中，模拟执行重命名');
            console.log('将要重命名的文件路径:', filePaths);
            alert('模拟执行：将 IMG_ 替换为 Photo_');
            return;
        }
        
        // 调用 Rust 后端
        const { invoke } = window.__TAURI__.core;
        const result = await invoke('execute_rename', {
            filePaths: filePaths
        });
        
        console.log('重命名结果:', result);
        
        if (result.success) {
            alert(`成功重命名 ${result.renamed_count} 个文件`);
            // 重命名成功后清空文件列表
            loadedFiles = [];
            clearTable();
            updateFileCount();
        } else {
            alert(`重命名失败: ${result.error_message || '未知错误'}`);
        }
        
    } catch (error) {
        console.error('调用后端失败:', error);
        alert('执行重命名时发生错误: ' + error.message);
    }
}

// 大小写转换按钮事件（需要单独处理）
document.addEventListener('DOMContentLoaded', function() {
    const caseButtons = document.querySelectorAll('#tab-case button');
    caseButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 这里可以添加大小写转换的预览逻辑
            console.log('点击了大小写转换按钮:', button.textContent);
        });
    });
});