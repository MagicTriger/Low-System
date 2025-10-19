<template>
  <LoginPage
    title="管理端登录"
    system-name="资源管理系统"
    redirect-path="/admin/Layout"
    :show-wechat-login="false"
    :features="[
      { icon: '🚀', text: '快速管理' },
      { icon: '🎨', text: '可视化配置' },
      { icon: '⚡', text: '高效运维' },
    ]"
  />
</template>

<script setup lang="ts">
import LoginPage from '@/modules/login/LoginPage.vue'
</script>

<style scoped>
/* 管理端特定样式(如果需要) */
</style>
