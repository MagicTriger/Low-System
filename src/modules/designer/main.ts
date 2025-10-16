import { AppInit } from '@/core/index'
import { routes } from './router'
import DesignerApp from './App.vue'
import { registerBasicControls } from '@/core/renderer/controls/register'
import { initializeIconLibraries } from '@/core/renderer/icons'
import { permission, role } from '@/core/directives/permission'
import { message } from 'ant-design-vue'
import './styles/message.css'

// 初始化图标库
initializeIconLibraries()

// 注册所有基础控件（包含Flex容器的面板配置）
registerBasicControls()

// 配置全局消息提示样式
message.config({
  top: '80px',
  duration: 3,
  maxCount: 3,
})

// 初始化设计器应用
AppInit('#app', routes, [], async app => {
  // 设计器专用配置
  app.component('DesignerApp', DesignerApp)

  // 注册权限指令
  app.directive('permission', permission)
  app.directive('role', role)

  // 开发环境配置
  if (import.meta.env.DEV) {
    console.log('✅ 设计器模块已启动')
    console.log('✅ 已注册基础控件')
    console.log('✅ PropertyPanelService已通过DI容器自动初始化')
    console.log('✅ 认证状态已自动恢复')
  }
})
