<template>
  <div id="designer-app" class="h-full">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useModule } from '@/core/state/helpers'

const app = useModule('app')

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
