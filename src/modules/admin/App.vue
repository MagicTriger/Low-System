<template>
  <a-config-provider :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { ConfigProvider as AConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { useModule } from '@/core/state/helpers'
import './styles/layout.css'

const auth = useModule('auth')

// 在setup阶段立即恢复认证状态
auth.dispatch('restoreAuth')

// 开发环境日志记录
if (import.meta.env.DEV) {
  console.log('[Admin App] 认证状态恢复已触发')
}
</script>

<style>
/* 基础样式已移至 layout.css */
</style>
