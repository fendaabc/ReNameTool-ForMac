/**
 * 主题管理器 - 处理主题切换与外观一致性
 * 任务12：主题与外观一致性（Pico.css 定制）
 */

class ThemeManager {
  constructor() {
    this.themeOrder = ["light", "purelight", "dark"];
    this.currentThemeIdx = 0;
    this.html = document.documentElement;
    this.isInitialized = false;
    
    // 主题名称映射
    this.themeNames = {
      light: "亮色主题",
      purelight: "纯白主题", 
      dark: "暗色主题"
    };
    
    // 绑定方法到实例
    this.setTheme = this.setTheme.bind(this);
    this.toggleTheme = this.toggleTheme.bind(this);
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
    
    console.log("🎨 ThemeManager 初始化");
  }
  
  /**
   * 初始化主题管理器
   */
  init() {
    if (this.isInitialized) {
      console.warn("🎨 ThemeManager 已经初始化过了");
      return;
    }
    
    // 立即应用保存的主题，避免闪烁
    this.applyThemeImmediately();
    
    // 设置事件监听器
    this.setupEventListeners();
    
    // 初始化窄屏适配检测
    this.initializeResponsiveDetection();
    
    // 初始化高对比度检测
    this.initializeContrastDetection();
    
    // 初始化动画偏好检测
    this.initializeMotionPreferences();
    
    this.isInitialized = true;
    console.log("✅ ThemeManager 初始化完成");
  }
  
  /**
   * 立即应用主题，避免页面闪烁
   */
  applyThemeImmediately() {
    try {
      const savedTheme = localStorage.getItem("app-theme");
      if (savedTheme && this.themeOrder.includes(savedTheme)) {
        this.html.setAttribute("data-theme", savedTheme);
        this.currentThemeIdx = this.themeOrder.indexOf(savedTheme);
        console.log(`🎨 从localStorage恢复主题: ${savedTheme}`);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.html.setAttribute("data-theme", "dark");
        this.currentThemeIdx = this.themeOrder.indexOf("dark");
        console.log("🎨 检测到系统暗色主题，应用暗色主题");
      } else {
        // 默认使用light主题
        this.html.setAttribute("data-theme", "light");
        this.currentThemeIdx = this.themeOrder.indexOf("light");
        console.log("🎨 应用默认亮色主题");
      }
      
      // 添加主题变化的CSS类，用于动画过渡
      this.html.classList.add('theme-transition');
      setTimeout(() => {
        this.html.classList.remove('theme-transition');
      }, 300);
      
    } catch (e) {
      console.warn("🎨 无法立即应用主题:", e);
      // 降级到默认主题
      this.html.setAttribute("data-theme", "light");
      this.currentThemeIdx = 0;
    }
  }
  
  /**
   * 设置主题
   * @param {number} idx - 主题索引
   */
  setTheme(idx) {
    const theme = this.themeOrder[idx];
    const previousTheme = this.html.getAttribute("data-theme");
    
    // 添加过渡效果
    this.html.classList.add('theme-transition');
    this.html.setAttribute("data-theme", theme);
    
    // 保存主题到localStorage，增强错误处理
    this.saveThemeToStorage(theme);
    
    // 移除过渡效果
    setTimeout(() => {
      this.html.classList.remove('theme-transition');
    }, 300);
    
    // 更新主题切换按钮
    this.updateThemeToggleButton(theme);
    
    // 触发自定义事件，让其他组件知道主题已更改
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme, previousTheme } 
    }));
    
    // 为屏幕阅读器用户公告主题变化
    this.announceThemeChange(theme);
    
    // 显示主题切换的视觉反馈
    this.showThemeChangeNotification(theme);
    
    console.log(`🎨 主题已切换到: ${theme}`);
  }
  
  /**
   * 切换到下一个主题
   */
  toggleTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    
    // 添加切换动画类
    if (themeToggle) {
      themeToggle.classList.add('switching');
    }
    
    this.currentThemeIdx = (this.currentThemeIdx + 1) % this.themeOrder.length;
    this.setTheme(this.currentThemeIdx);
    
    // 移除动画类
    if (themeToggle) {
      setTimeout(() => {
        themeToggle.classList.remove('switching');
      }, 300);
    }
  }
  
  /**
   * 保存主题到localStorage
   * @param {string} theme - 主题名称
   */
  saveThemeToStorage(theme) {
    try {
      localStorage.setItem("app-theme", theme);
      // 验证保存是否成功
      const saved = localStorage.getItem("app-theme");
      if (saved !== theme) {
        console.warn("🎨 主题保存验证失败，可能存储空间不足");
      } else {
        console.log(`🎨 主题已保存到localStorage: ${theme}`);
      }
    } catch (e) {
      console.warn("🎨 无法保存主题设置:", e);
      // 尝试清理localStorage中的其他数据为主题设置腾出空间
      try {
        // 清理可能的临时数据
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('temp-') || key.startsWith('cache-')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem("app-theme", theme);
        console.log("🎨 清理存储空间后，主题保存成功");
      } catch (e2) {
        console.error("🎨 主题保存完全失败:", e2);
      }
    }
  }
  
  /**
   * 更新主题切换按钮的图标和标题
   * @param {string} theme - 当前主题
   */
  updateThemeToggleButton(theme) {
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    
    if (!themeToggle || !themeIcon) return;
    
    // 切换SVG图标和按钮标题
    if (theme === "dark") {
      themeIcon.innerHTML = `<svg id="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>`;
      themeToggle.title = "切换到亮色主题";
      themeIcon.setAttribute("aria-label", "切换到亮色主题");
    } else if (theme === "purelight") {
      themeIcon.innerHTML = `<svg id="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>`;
      themeToggle.title = "切换到暗色主题";
      themeIcon.setAttribute("aria-label", "切换到暗色主题");
    } else {
      themeIcon.innerHTML = `<svg id="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>`;
      themeToggle.title = "切换到纯白主题";
      themeIcon.setAttribute("aria-label", "切换到纯白主题");
    }
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    const themeToggle = document.getElementById("theme-toggle");
    
    if (themeToggle) {
      // 点击事件
      themeToggle.addEventListener("click", this.toggleTheme);
      
      // 键盘支持
      themeToggle.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }
    
    // 监听系统主题变化
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', this.handleSystemThemeChange);
    }
  }
  
  /**
   * 处理系统主题变化
   * @param {MediaQueryListEvent} e - 媒体查询事件
   */
  handleSystemThemeChange(e) {
    // 只在没有用户手动设置主题时响应系统变化
    const savedTheme = localStorage.getItem("app-theme");
    if (!savedTheme) {
      this.currentThemeIdx = e.matches ? this.themeOrder.indexOf("dark") : this.themeOrder.indexOf("light");
      this.setTheme(this.currentThemeIdx);
    }
  }
  
  /**
   * 初始化响应式检测
   */
  initializeResponsiveDetection() {
    // 检测窄屏并添加相应的类
    const checkScreenSize = () => {
      const isNarrow = window.innerWidth <= 800;
      const isVeryNarrow = window.innerWidth <= 480;
      
      document.body.classList.toggle('narrow-screen', isNarrow);
      document.body.classList.toggle('very-narrow-screen', isVeryNarrow);
      
      // 检查Tab组是否需要滚动
      this.checkTabScrollable();
    };
    
    // 初始检查
    checkScreenSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize);
    
    // 防抖处理
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkScreenSize, 150);
    });
  }
  
  /**
   * 检查Tab组是否可滚动
   */
  checkTabScrollable() {
    const tabGroup = document.querySelector('.tab-group');
    if (!tabGroup) return;
    
    const isScrollable = tabGroup.scrollWidth > tabGroup.clientWidth;
    tabGroup.classList.toggle('scrollable', isScrollable);
    
    // 添加滚动指示器
    if (isScrollable) {
      this.addScrollIndicators(tabGroup);
    }
  }
  
  /**
   * 为Tab组添加滚动指示器
   * @param {Element} tabGroup - Tab组元素
   */
  addScrollIndicators(tabGroup) {
    // 检查是否已经有指示器
    if (tabGroup.querySelector('.scroll-indicator')) return;
    
    const leftIndicator = document.createElement('div');
    leftIndicator.className = 'scroll-indicator scroll-indicator-left';
    leftIndicator.innerHTML = '‹';
    
    const rightIndicator = document.createElement('div');
    rightIndicator.className = 'scroll-indicator scroll-indicator-right';
    rightIndicator.innerHTML = '›';
    
    tabGroup.appendChild(leftIndicator);
    tabGroup.appendChild(rightIndicator);
    
    // 添加点击滚动功能
    leftIndicator.addEventListener('click', () => {
      tabGroup.scrollBy({ left: -100, behavior: 'smooth' });
    });
    
    rightIndicator.addEventListener('click', () => {
      tabGroup.scrollBy({ left: 100, behavior: 'smooth' });
    });
    
    // 监听滚动更新指示器状态
    tabGroup.addEventListener('scroll', () => {
      const { scrollLeft, scrollWidth, clientWidth } = tabGroup;
      leftIndicator.style.opacity = scrollLeft > 0 ? '1' : '0';
      rightIndicator.style.opacity = scrollLeft < scrollWidth - clientWidth ? '1' : '0';
    });
  }
  
  /**
   * 初始化高对比度检测
   */
  initializeContrastDetection() {
    if (window.matchMedia) {
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      
      const updateContrastMode = (mediaQuery) => {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('high-contrast');
          console.log('🎨 用户偏好高对比度，已启用高对比度模式');
        } else {
          document.documentElement.classList.remove('high-contrast');
          console.log('🎨 用户偏好正常对比度');
        }
      };
      
      // 初始检查
      updateContrastMode(highContrastQuery);
      
      // 监听偏好变化
      highContrastQuery.addEventListener('change', updateContrastMode);
    }
  }
  
  /**
   * 初始化动画偏好检测
   */
  initializeMotionPreferences() {
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      const updateMotionPreference = (mediaQuery) => {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('reduced-motion');
          console.log('🎨 用户偏好减少动画，已禁用动画效果');
        } else {
          document.documentElement.classList.remove('reduced-motion');
          console.log('🎨 用户允许动画，已启用动画效果');
        }
      };
      
      // 初始检查
      updateMotionPreference(prefersReducedMotion);
      
      // 监听偏好变化
      prefersReducedMotion.addEventListener('change', updateMotionPreference);
    }
  }
  
  /**
   * 公告主题变化给屏幕阅读器
   * @param {string} theme - 主题名称
   */
  announceThemeChange(theme) {
    const themeName = this.themeNames[theme] || theme;
    
    // 使用全局的公告函数
    if (typeof window.announceToScreenReader === 'function') {
      window.announceToScreenReader(`已切换到${themeName}`);
    } else {
      // 备用方案
      this.announceToScreenReader(`已切换到${themeName}`);
    }
  }
  
  /**
   * 屏幕阅读器公告函数（备用）
   * @param {string} message - 要公告的消息
   */
  announceToScreenReader(message) {
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
  
  /**
   * 显示主题切换通知
   * @param {string} theme - 主题名称
   */
  showThemeChangeNotification(theme) {
    const themeName = this.themeNames[theme] || theme;
    
    // 检查用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 移除现有的通知
    const existingNotification = document.getElementById('theme-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.id = 'theme-notification';
    notification.textContent = `已切换到${themeName}`;
    
    const baseStyles = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--panel);
      color: var(--fg);
      border: 2px solid var(--primary);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      pointer-events: none;
    `;
    
    if (prefersReducedMotion) {
      // 无动画版本
      notification.style.cssText = baseStyles + `
        opacity: 1;
        transform: translateX(0);
      `;
    } else {
      // 有动画版本
      notification.style.cssText = baseStyles + `
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      `;
    }
    
    document.body.appendChild(notification);
    
    if (!prefersReducedMotion) {
      // 显示动画
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      });
    }
    
    // 3秒后隐藏
    setTimeout(() => {
      if (prefersReducedMotion) {
        // 直接移除
        if (notification.parentNode) {
          notification.remove();
        }
      } else {
        // 动画隐藏
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  }
  
  /**
   * 获取当前主题
   * @returns {string} 当前主题名称
   */
  getCurrentTheme() {
    return this.themeOrder[this.currentThemeIdx];
  }
  
  /**
   * 设置特定主题
   * @param {string} themeName - 主题名称
   */
  setSpecificTheme(themeName) {
    const index = this.themeOrder.indexOf(themeName);
    if (index !== -1) {
      this.currentThemeIdx = index;
      this.setTheme(index);
    } else {
      console.warn(`🎨 未知的主题名称: ${themeName}`);
    }
  }
  
  /**
   * 销毁主题管理器
   */
  destroy() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.removeEventListener("click", this.toggleTheme);
    }
    
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
    
    this.isInitialized = false;
    console.log("🎨 ThemeManager 已销毁");
  }
}

// 创建全局主题管理器实例
window.themeManager = new ThemeManager();

// 在DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager.init();
  });
} else {
  // DOM已经加载完成
  window.themeManager.init();
}

// 导出主题管理器类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}