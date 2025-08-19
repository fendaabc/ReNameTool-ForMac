/**
 * 文件操作工具函数
 */

/**
 * 从文件路径中提取文件名（不含扩展名）
 * @param {string} filePath 文件路径
 * @returns {string} 文件名（不含扩展名）
 */
export function getFileNameWithoutExtension(filePath) {
  if (!filePath) return '';
  const fileName = filePath.split(/[\\/]/).pop() || '';
  return fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
}

/**
 * 获取文件扩展名（不含点）
 * @param {string} filePath 文件路径
 * @returns {string} 文件扩展名（不含点）
 */
export function getFileExtension(filePath) {
  if (!filePath) return '';
  const fileName = filePath.split(/[\\/]/).pop() || '';
  return fileName.includes('.') 
    ? fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase() 
    : '';
}

/**
 * 获取文件所在目录路径
 * @param {string} filePath 文件路径
 * @returns {string} 目录路径
 */
export function getDirectoryPath(filePath) {
  if (!filePath) return '';
  const lastSeparator = Math.max(
    filePath.lastIndexOf('/'),
    filePath.lastIndexOf('\\')
  );
  return lastSeparator === -1 ? '' : filePath.substring(0, lastSeparator);
}

/**
 * 连接路径
 * @param {...string} parts 路径部分
 * @returns {string} 连接后的路径
 */
export function joinPath(...parts) {
  return parts
    .filter(part => part && part.trim() !== '')
    .map((part, index) => {
      // 移除开头的路径分隔符（除了第一个部分）
      if (index > 0) {
        part = part.replace(/^[\\/]+/, '');
      }
      // 移除结尾的路径分隔符
      return part.replace(/[\\/]+$/, '');
    })
    .join('/')
    .replace(/\\/g, '/'); // 统一使用正斜杠
}

/**
 * 标准化文件路径（统一分隔符）
 * @param {string} path 文件路径
 * @returns {string} 标准化后的路径
 */
export function normalizePath(path) {
  if (!path) return '';
  return path.replace(/[\\/]+/g, '/');
}

/**
 * 检查路径是否是绝对路径
 * @param {string} path 路径
 * @returns {boolean} 是否是绝对路径
 */
export function isAbsolutePath(path) {
  if (!path) return false;
  // Windows 路径（如 C:\\ 或 \\server\share）
  if (/^([a-zA-Z]:\\|\\)/.test(path)) return true;
  // Unix 类路径（以 / 开头）
  return path.startsWith('/');
}

/**
 * 获取文件大小的人类可读格式
 * @param {number} bytes 字节数
 * @param {number} [decimals=2] 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * 生成唯一的操作ID
 * @returns {string} 唯一的操作ID
 */
export function generateOperationId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * 检查文件路径是否合法
 * @param {string} path 文件路径
 * @returns {boolean} 是否合法
 */
export function isValidFilePath(path) {
  if (!path || typeof path !== 'string') return false;
  
  // 检查非法字符（Windows和Unix都禁止的字符）
  const illegalChars = /[<>:"|?*\x00-\x1F\x7F]/g;
  if (illegalChars.test(path)) return false;
  
  // 检查保留名称（Windows）
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  
  const fileName = path.split(/[\\/]/).pop() || '';
  const nameWithoutExt = getFileNameWithoutExtension(fileName);
  
  if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
    return false;
  }
  
  // 检查路径长度（Windows限制为260个字符）
  if (path.length > 259) { // 259 + 1 (null terminator) = 260
    return false;
  }
  
  return true;
}
