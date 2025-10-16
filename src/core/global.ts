import type { SystemConfig } from '../types/index'

// 全局系统配置
export const global: SystemConfig = {
  title: '企业级低代码平台',
  logo: '/logo.svg',
  version: '1.0.0',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  theme: {
    primaryColor: '#1890ff',
    darkMode: false,
    compactMode: false
  }
}

// 环境变量
export const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL,
  uploadUrl: import.meta.env.VITE_UPLOAD_URL
}

// 常量定义
export const CONSTANTS = {
  // 存储键名
  STORAGE_KEYS: {
    USER_INFO: 'user_info',
    TOKEN: 'access_token',
    THEME: 'theme_config',
    LANGUAGE: 'language'
  },
  
  // 默认配置
  DEFAULTS: {
    PAGE_SIZE: 20,
    TIMEOUT: 30000,
    DEBOUNCE_DELAY: 300
  },
  
  // 控件类型
  CONTROL_TYPES: {
    COMMON: 'common',
    INPUT: 'input',
    CONTAINER: 'container',
    COLLECTION: 'collection',
    CHART: 'chart',
    BI: 'bi',
    SVG: 'svg',
    MOBILE: 'mobile',
    CUSTOM: 'custom'
  },
  
  // 事件类型
  EVENT_TYPES: {
    CONTROL: 'control',
    DATA_SOURCE: 'dataSource',
    DATA_TRANSFER: 'dataTransfer',
    GLOBAL: 'global'
  },
  
  // 数据源类型
  DATA_SOURCE_TYPES: {
    API: 'api',
    STATIC: 'static',
    MOCK: 'mock'
  },
  
  // HTTP方法
  HTTP_METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH'
  },
  
  // 响应状态码
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  }
}

// 正则表达式
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  URL: /^https?:\/\/.+/,
  COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  NUMBER: /^\d+(\.\d+)?$/,
  CHINESE: /[\u4e00-\u9fa5]/,
  IDENTIFIER: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器内部错误，请联系管理员',
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '权限不足，无法访问该资源',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '数据验证失败，请检查输入内容',
  UNKNOWN_ERROR: '未知错误，请稍后重试'
}

// 成功消息
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: '保存成功',
  DELETE_SUCCESS: '删除成功',
  UPDATE_SUCCESS: '更新成功',
  CREATE_SUCCESS: '创建成功',
  UPLOAD_SUCCESS: '上传成功',
  COPY_SUCCESS: '复制成功',
  EXPORT_SUCCESS: '导出成功',
  IMPORT_SUCCESS: '导入成功'
}