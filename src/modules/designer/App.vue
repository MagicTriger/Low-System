<template>
  <div id="designer-app" class="h-full">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useModule } from '@/core/state/helpers'

const app = useModule('app')
const auth = useModule('auth')

// 在setup阶段立即恢复认证状态
auth.dispatch('restoreAuth')

// 开发环境日志记录
if (import.meta.env.DEV) {
  console.log('[Designer App] 认证状态恢复已触发')
}

onMounted(() => {
  app.commit('setPageTitle', '设计器')
})
</script>

<style scoped>
#designer-app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
