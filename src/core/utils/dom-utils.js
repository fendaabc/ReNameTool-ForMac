/**
 * DOM 操作工具函数
 * 提供常用的 DOM 操作方法
 */

/**
 * 获取元素
 * @param {string} selector 选择器
 * @param {HTMLElement|Document} [parent=document] 父元素，默认为 document
 * @returns {HTMLElement|null} 匹配的元素或 null
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * 获取元素列表
 * @param {string} selector 选择器
 * @param {HTMLElement|Document} [parent=document] 父元素，默认为 document
 * @returns {NodeList} 匹配的元素列表
 */
export function $$(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * 创建元素
 * @param {string} tag 标签名
 * @param {Object} [options] 选项
 * @param {string} [options.className] 类名
 * @param {Object} [options.attrs] 属性对象
 * @param {string|HTMLElement} [options.html] HTML 内容或元素
 * @param {string} [options.text] 文本内容
 * @returns {HTMLElement} 创建的元素
 */
export function createElement(tag, { className, attrs = {}, html, text } = {}) {
  const el = document.createElement(tag);
  
  if (className) {
    el.className = className;
  }
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      el.setAttribute(key, value);
    }
  });
  
  if (html !== undefined) {
    if (typeof html === 'string') {
      el.innerHTML = html;
    } else if (html instanceof HTMLElement) {
      el.appendChild(html);
    }
  } else if (text !== undefined) {
    el.textContent = text;
  }
  
  return el;
}

/**
 * 添加事件监听器
 * @param {HTMLElement|Window} target 目标元素
 * @param {string} event 事件名称
 * @param {Function} handler 事件处理函数
 * @param {Object} [options] 选项
 * @returns {Function} 移除事件监听器的函数
 */
export function on(target, event, handler, options) {
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

/**
 * 添加一次性事件监听器
 * @param {HTMLElement|Window} target 目标元素
 * @param {string} event 事件名称
 * @param {Function} handler 事件处理函数
 * @returns {Function} 移除事件监听器的函数
 */
export function once(target, event, handler) {
  const onceHandler = (...args) => {
    handler(...args);
    target.removeEventListener(event, onceHandler);
  };
  return on(target, event, onceHandler);
}

/**
 * 切换元素的类
 * @param {HTMLElement} element 元素
 * @param {string} className 类名
 * @param {boolean} [force] 强制添加或移除
 * @returns {boolean} 操作后类是否存在
 */
export function toggleClass(element, className, force) {
  if (force === undefined) {
    return element.classList.toggle(className);
  }
  return force 
    ? element.classList.add(className)
    : element.classList.remove(className);
}

/**
 * 检查元素是否包含指定类
 * @param {HTMLElement} element 元素
 * @param {string} className 类名
 * @returns {boolean} 是否包含该类
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

/**
 * 添加类
 * @param {HTMLElement} element 元素
 * @param {...string} classNames 要添加的类名
 */
export function addClass(element, ...classNames) {
  element.classList.add(...classNames);
}

/**
 * 移除类
 * @param {HTMLElement} element 元素
 * @param {...string} classNames 要移除的类名
 */
export function removeClass(element, ...classNames) {
  element.classList.remove(...classNames);
}

/**
 * 获取元素的位置和尺寸信息
 * @param {HTMLElement} element 元素
 * @returns {DOMRect} 位置和尺寸信息
 */
export function getRect(element) {
  return element.getBoundingClientRect();
}

/**
 * 获取窗口的滚动位置
 * @returns {{x: number, y: number}} 滚动位置
 */
export function getScrollPosition() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
    y: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  };
}

/**
 * 滚动到指定元素
 * @param {HTMLElement} element 目标元素
 * @param {Object} [options] 滚动选项
 * @param {string} [options.behavior='smooth'] 滚动行为
 * @param {string} [options.block='start'] 垂直方向对齐方式
 * @param {string} [options.inline='nearest'] 水平方向对齐方式
 */
export function scrollToElement(element, {
  behavior = 'smooth',
  block = 'start',
  inline = 'nearest'
} = {}) {
  if (element && element.scrollIntoView) {
    element.scrollIntoView({
      behavior,
      block,
      inline
    });
  }
}

/**
 * 检测元素是否在视口内
 * @param {HTMLElement} element 要检测的元素
 * @param {Object} [options] 选项
 * @param {number} [options.threshold=0] 阈值（0-1）
 * @returns {boolean} 是否在视口内
 */
export function isInViewport(element, { threshold = 0 } = {}) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = rect.top <= windowHeight * (1 - threshold) && 
                    rect.top + rect.height * threshold >= 0;
  const horInView = rect.left <= windowWidth * (1 - threshold) && 
                   rect.left + rect.width * threshold >= 0;
  
  return vertInView && horInView;
}

/**
 * 防抖函数
 * @param {Function} func 要执行的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 100) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func 要执行的函数
 * @param {number} limit 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 动态加载脚本
 * @param {string} src 脚本URL
 * @param {Object} [options] 选项
 * @param {boolean} [options.async=true] 是否异步加载
 * @param {boolean} [options.defer=false] 是否延迟执行
 * @returns {Promise<HTMLScriptElement>} 加载的脚本元素
 */
export function loadScript(src, { async = true, defer = false } = {}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    (document.head || document.documentElement).appendChild(script);
  });
}

/**
 * 动态加载样式表
 * @param {string} href 样式表URL
 * @returns {Promise<HTMLLinkElement>} 加载的链接元素
 */
export function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    
    (document.head || document.documentElement).appendChild(link);
  });
}

/**
 * 获取元素的计算样式
 * @param {HTMLElement} element 元素
 * @param {string} [property] 要获取的CSS属性名
 * @returns {string|CSSStyleDeclaration} 计算后的样式值或整个样式对象
 */
export function getComputedStyle(element, property) {
  const styles = window.getComputedStyle(element);
  return property ? styles.getPropertyValue(property) : styles;
}

/**
 * 检测当前设备类型
 * @returns {{isMobile: boolean, isTablet: boolean, isDesktop: boolean}} 设备类型信息
 */
export function detectDevice() {
  const width = window.innerWidth;
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024
  };
}
