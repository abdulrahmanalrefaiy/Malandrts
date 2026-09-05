/**
 * ====================================
 * MALAND RTS - Utility Helpers
 * ====================================
 */

// ====== DOM Helpers ======
export const DOM = {
  get: (selector) => document.querySelector(selector),
  getAll: (selector) => document.querySelectorAll(selector),
  
  create: (tag, classes = '', html = '') => {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (html) el.innerHTML = html;
    return el;
  },
  
  show: (el) => {
    if (el) el.style.display = '';
  },
  
  hide: (el) => {
    if (el) el.style.display = 'none';
  },
  
  toggle: (el) => {
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
  },
  
  addClass: (el, className) => {
    if (el) el.classList.add(className);
  },
  
  removeClass: (el, className) => {
    if (el) el.classList.remove(className);
  },
  
  toggleClass: (el, className) => {
    if (el) el.classList.toggle(className);
  },
  
  hasClass: (el, className) => {
    return el ? el.classList.contains(className) : false;
  },
  
  on: (el, event, handler) => {
    if (el) el.addEventListener(event, handler);
  },
  
  off: (el, event, handler) => {
    if (el) el.removeEventListener(event, handler);
  },
  
  once: (el, event, handler) => {
    if (el) el.addEventListener(event, handler, { once: true });
  }
};

// ====== Storage Helpers ======
export const Storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error('Storage error:', e);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },
  
  exists: (key) => {
    return localStorage.getItem(key) !== null;
  }
};

// ====== Math Helpers ======
export const Math2D = {
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  
  lerp: (a, b, t) => a + (b - a) * t,
  
  distance: (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  angle: (x1, y1, x2, y2) => {
    return Math.atan2(y2 - y1, x2 - x1);
  },
  
  normalize: (dx, dy) => {
    const len = Math.sqrt(dx * dx + dy * dy);
    return len > 0 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
  },
  
  random: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  randomFloat: (min, max) => {
    return Math.random() * (max - min) + min;
  }
};

// ====== Time Helpers ======
export const Time = {
  now: () => Date.now(),
  
  formatTime: (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  },
  
  debounce: (func, delay) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  },
  
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// ====== String Helpers ======
export const Strings = {
  truncate: (str, length = 50) => {
    return str.length > length ? str.slice(0, length) + '...' : str;
  },
  
  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  i18n: (key, lang = 'ar') => {
    const translations = {
      ar: {
        'play': 'العب',
        'settings': 'الإعدادات',
        'exit': 'خروج',
        'loading': 'جاري التحميل...',
        'error': 'حدث خطأ',
        'success': 'تم بنجاح',
        'username': 'اسم المستخدم',
        'password': 'كلمة المرور',
        'email': 'البريد الإلكتروني',
        'login': 'تسجيل الدخول',
        'logout': 'تسجيل الخروج',
        'register': 'إنشاء حساب',
        'resources': 'الموارد',
        'units': 'الوحدات',
        'buildings': 'المباني',
        'economy': 'الاقتصاد',
        'military': 'العسكري',
      },
      en: {
        'play': 'Play',
        'settings': 'Settings',
        'exit': 'Exit',
        'loading': 'Loading...',
        'error': 'Error occurred',
        'success': 'Success',
        'username': 'Username',
        'password': 'Password',
        'email': 'Email',
        'login': 'Login',
        'logout': 'Logout',
        'register': 'Register',
        'resources': 'Resources',
        'units': 'Units',
        'buildings': 'Buildings',
        'economy': 'Economy',
        'military': 'Military',
      }
    };
    
    return translations[lang]?.[key] || key;
  }
};

// ====== Logger ======
export const Logger = {
  log: (msg, data = null) => {
    console.log(`[MALAND] ${msg}`, data || '');
  },
  
  warn: (msg, data = null) => {
    console.warn(`[MALAND] ⚠️ ${msg}`, data || '');
  },
  
  error: (msg, data = null) => {
    console.error(`[MALAND] ❌ ${msg}`, data || '');
  },
  
  success: (msg, data = null) => {
    console.log(`[MALAND] ✅ ${msg}`, data || '');
  }
};

// ====== Animation Frame Helper ======
export class Animator {
  constructor() {
    this.id = null;
    this.callback = null;
  }
  
  start(callback) {
    this.callback = callback;
    const animate = (time) => {
      if (this.callback) {
        this.callback(time);
        this.id = requestAnimationFrame(animate);
      }
    };
    this.id = requestAnimationFrame(animate);
  }
  
  stop() {
    if (this.id) {
      cancelAnimationFrame(this.id);
      this.id = null;
      this.callback = null;
    }
  }
  
  isRunning() {
    return this.id !== null;
  }
}

// ====== Event Emitter ======
export class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, handler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }
  
  off(event, handler) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(h => h !== handler);
    }
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(handler => handler(data));
    }
  }
  
  once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// ====== API Helper ======
export const API = {
  async get(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      Logger.error('API GET failed:', e);
      throw e;
    }
  },
  
  async post(url, data) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      Logger.error('API POST failed:', e);
      throw e;
    }
  }
};

export default { DOM, Storage, Math2D, Time, Strings, Logger, Animator, EventEmitter, API };
