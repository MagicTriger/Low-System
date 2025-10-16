<template>
  <LoginPage
    title="设计端登录"
    system-name="低代码管理系统"
    redirect-path="/designer/resource"
    :show-wechat-login="true"
    :features="[
      { icon: '🚀', text: '快速开发' },
      { icon: '🎨', text: '可视化设计' },
      { icon: '⚡', text: '高性能' },
    ]"
  />
</template>

<script setup lang="ts">
import LoginPage from '@/core/auth/LoginPage.vue'
</script>

<style scoped>
/* 设计端特定样式(如果需要) */
</style>
