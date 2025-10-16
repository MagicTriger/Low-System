/**
 * 设计端布局配置
 */

import type { LayoutConfig } from '@/core/layout/types'

/**
 * 设计端布局配置
 */
export const designerLayoutConfig: LayoutConfig = {
  /**
   * 模块类型
   */
  module: 'designer',

  /**
   * 头部配置
   */
  header: {
    // 显示侧边栏切换按钮
    showSidebarToggle: true,
    // 标题
    title: '低代码管理系统',
    // 显示图标库按钮
    showIconLibrary: true,
    // 显示通知按钮
    showNotifications: true,
    // 显示设置按钮
    showSettings: true,
    // 自定义操作按钮
    actions: [],
  },

  /**
   * 侧边栏配置
   */
  sidebar: {
    // 默认宽度
    width: 240,
    // 折叠后宽度
    collapsedWidth: 64,
    // 默认是否折叠
    defaultCollapsed: false,
    // Logo 配置
    logo: {
      logoText: 'Kiro Platform',
      to: '/designer/resource',
    },
    // 显示用户信息
    showUserInfo: true,
    // 用户信息配置
    userInfo: {
      name: '',
      avatar: '',
      role: '',
    },
    // 菜单模式
    menuMode: 'inline',
    // 主题 (深色侧边栏)
    theme: 'dark',
  },

  /**
   * 主题配置 (参考 Dashgum 风格)
   */
  theme: {
    // 主色调 (橙黄色,类似 Dashgum)
    primaryColor: '#f6bb42',
    // 侧边栏背景色 (深色,类似 Dashgum)
    sidebarBg: '#2f4050',
    // 头部背景色 (橙黄色,类似 Dashgum)
    headerBg: '#f6bb42',
    // 内容区背景色
    contentBg: '#ffffff',
    // 主要文本颜色
    textPrimary: '#ffffff',
    // 次要文本颜色
    textSecondary: 'rgba(255, 255, 255, 0.65)',
    // 普通文本颜色
    textColor: '#333333',
    // 悬停背景色
    bgHover: 'rgba(255, 255, 255, 0.08)',
    // 边框颜色
    borderColor: 'rgba(0, 0, 0, 0.06)',
    // 过渡动画时长
    transitionDuration: '0.3s',
    // 过渡动画时间函数
    transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

/**
 * 获取设计端布局配置
 */
export function getDesignerLayoutConfig(): LayoutConfig {
  return designerLayoutConfig
}
