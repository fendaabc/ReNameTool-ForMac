/**
 * 验证工具函数
 * 提供常用的数据验证方法
 */

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否有效
 */
export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 验证URL格式
 * @param {string} url URL地址
 * @returns {boolean} 是否有效
 */
export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 验证字符串是否只包含字母和数字
 * @param {string} str 要验证的字符串
 * @returns {boolean} 是否只包含字母和数字
 */
export function isAlphaNumeric(str) {
  if (!str) return false;
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * 验证字符串是否为有效的JSON
 * @param {string} str 要验证的字符串
 * @returns {boolean} 是否为有效的JSON
 */
export function isValidJson(str) {
  if (typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 验证数字是否在指定范围内
 * @param {number} num 要验证的数字
 * @param {Object} options 选项
 * @param {number} [options.min] 最小值（包含）
 * @param {number} [options.max] 最大值（包含）
 * @returns {boolean} 是否在范围内
 */
export function isNumberInRange(num, { min, max } = {}) {
  if (typeof num !== 'number' || isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

/**
 * 验证字符串长度是否在指定范围内
 * @param {string} str 要验证的字符串
 * @param {Object} options 选项
 * @param {number} [options.min] 最小长度（包含）
 * @param {number} [options.max] 最大长度（包含）
 * @returns {boolean} 长度是否在范围内
 */
export function isLengthInRange(str, { min, max } = {}) {
  if (str === null || str === undefined) return false;
  const length = String(str).length;
  if (min !== undefined && length < min) return false;
  if (max !== undefined && length > max) return false;
  return true;
}

/**
 * 验证是否为有效的日期字符串
 * @param {string} dateStr 日期字符串
 * @returns {boolean} 是否为有效日期
 */
export function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * 验证是否为有效的颜色代码
 * @param {string} color 颜色代码
 * @returns {boolean} 是否为有效颜色代码
 */
export function isValidColor(color) {
  if (!color) return false;
  
  // 检查十六进制颜色代码
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) {
    return true;
  }
  
  // 检查RGB/RGBA颜色
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[01]?\d?\.?\d+\s*)?\)$/.test(color)) {
    return true;
  }
  
  // 检查颜色关键字
  const style = new Option().style;
  style.color = color;
  return style.color !== '' && style.color !== 'transparent';
}

/**
 * 验证是否为有效的手机号码（中国）
 * @param {string} phone 手机号码
 * @returns {boolean} 是否为有效手机号
 */
export function isValidChinesePhone(phone) {
  if (!phone) return false;
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证是否为有效的身份证号码（中国）
 * @param {string} idCard 身份证号码
 * @returns {boolean} 是否为有效身份证号
 */
export function isValidChineseIdCard(idCard) {
  if (!idCard) return false;
  
  // 18位身份证号码验证
  if (/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) {
    // 验证校验码
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i];
    }
    
    const checkCode = checkCodes[sum % 11];
    return checkCode === idCard[17].toUpperCase();
  }
  
  // 15位身份证号码验证（旧版）
  if (/^[1-9]\d{7}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}$/.test(idCard)) {
    return true;
  }
  
  return false;
}

/**
 * 验证是否为有效的银行卡号（Luhn算法）
 * @param {string} cardNumber 银行卡号
 * @returns {boolean} 是否为有效银行卡号
 */
export function isValidBankCard(cardNumber) {
  if (!cardNumber || !/^\d+$/.test(cardNumber)) {
    return false;
  }
  
  let sum = 0;
  let doubleUp = false;
  
  // 从右到左遍历每一位
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);
    
    if (doubleUp) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }
    
    sum += digit;
    doubleUp = !doubleUp;
  }
  
  return sum % 10 === 0;
}
