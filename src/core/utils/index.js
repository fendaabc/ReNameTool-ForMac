// 导出所有工具函数

export * from './file-utils';
export * from './validation-utils';
export * from './dom-utils';

// 常用工具函数

/**
 * 生成唯一ID
 * @param {number} [length=8] ID长度
 * @returns {string} 唯一ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substr(2, length);
}

/**
 * 深拷贝对象
 * @param {*} obj 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * 对象浅合并
 * @param {Object} target 目标对象
 * @param {...Object} sources 源对象
 * @returns {Object} 合并后的对象
 */
export function merge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (source && typeof source === 'object') {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          merge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  }
  
  return merge(target, ...sources);
}

/**
 * 防抖装饰器
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Function} 装饰器函数
 */
export function debounce(delay) {
  return function(target, key, descriptor) {
    const originalMethod = descriptor.value;
    let timeoutId = null;
    
    descriptor.value = function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
      }, delay);
    };
    
    return descriptor;
  };
}

/**
 * 节流装饰器
 * @param {number} limit 时间间隔（毫秒）
 * @returns {Function} 装饰器函数
 */
export function throttle(limit) {
  return function(target, key, descriptor) {
    const originalMethod = descriptor.value;
    let inThrottle = false;
    
    descriptor.value = function(...args) {
      if (!inThrottle) {
        originalMethod.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
    
    return descriptor;
  };
}

/**
 * 格式化日期
 * @param {Date|number|string} date 日期对象、时间戳或日期字符串
 * @param {string} format 格式字符串，例如 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  let d = date;
  
  if (!(d instanceof Date)) {
    d = new Date(d);
  }
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const pad = (n) => (n < 10 ? `0${n}` : n);
  
  const replacements = {
    'YYYY': d.getFullYear(),
    'MM': pad(d.getMonth() + 1),
    'DD': pad(d.getDate()),
    'HH': pad(d.getHours()),
    'mm': pad(d.getMinutes()),
    'ss': pad(d.getSeconds()),
    'SSS': d.getMilliseconds().toString().padStart(3, '0'),
    'D': d.getDate(),
    'H': d.getHours(),
    'm': d.getMinutes(),
    's': d.getSeconds()
  };
  
  return format.replace(/(YYYY|MM|DD|HH|mm|ss|SSS|D|H|m|s)/g, (match) => replacements[match] || match);
}

/**
 * 将字符串转换为驼峰命名
 * @param {string} str 要转换的字符串
 * @returns {string} 转换后的字符串
 */
export function toCamelCase(str) {
  if (!str) return '';
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
}

/**
 * 将驼峰命名转换为连字符命名
 * @param {string} str 要转换的字符串
 * @returns {string} 转换后的字符串
 */
export function toKebabCase(str) {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * 生成指定范围的随机数
 * @param {number} min 最小值（包含）
 * @param {number} max 最大值（不包含）
 * @returns {number} 随机数
 */
export function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 生成指定范围的随机整数
 * @param {number} min 最小值（包含）
 * @param {number} max 最大值（包含）
 * @returns {number} 随机整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 从数组中随机获取一个元素
 * @param {Array} array 数组
 * @returns {*} 随机元素
 */
export function sample(array) {
  if (!array || !array.length) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 数组去重
 * @param {Array} array 数组
 * @returns {Array} 去重后的数组
 */
export function uniq(array) {
  if (!array || !array.length) return [];
  return [...new Set(array)];
}

/**
 * 数组扁平化
 * @param {Array} array 数组
 * @returns {Array} 扁平化后的数组
 */
export function flatten(array) {
  if (!array || !array.length) return [];
  return array.reduce((acc, val) => 
    acc.concat(Array.isArray(val) ? flatten(val) : val), []);
}

/**
 * 对象深比较
 * @param {*} a 第一个值
 * @param {*} b 第二个值
 * @returns {boolean} 是否相等
 */
export function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.constructor !== b.constructor) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !isEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}
