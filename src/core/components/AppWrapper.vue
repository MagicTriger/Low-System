<template>
  <div id="app" :class="appClasses">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useModule } from '@/core/state/helpers'
import type { ThemeState } from '@/core/state/modules/theme'

const theme = useModule<ThemeState>('theme')

const appClasses = computed(() => [
  'app-wrapper',
  {
    dark: theme.state.darkMode,
    compact: theme.state.compactMode,
  },
])
</script>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-wrapper.dark {
  background-color: #141414;
  color: rgba(255, 255, 255, 0.85);
}

.app-wrapper.compact {
  font-size: 12px;
}
</style>
