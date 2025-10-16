<template>
  <div class="unified-layout-logo" @click="handleClick">
    <transition name="fade" mode="out-in">
      <div v-if="!collapsed" class="unified-layout-logo-expanded">
        <img v-if="logoUrl" :src="logoUrl" :alt="logoText || 'Logo'" class="unified-layout-logo-img" />
        <div v-if="logoText" class="unified-layout-logo-text">
          {{ logoText }}
        </div>
        <div v-if="!logoUrl && !logoText" class="unified-layout-logo-default">
          <AppstoreOutlined class="unified-layout-logo-icon" />
          <span class="unified-layout-logo-text">Kiro</span>
        </div>
      </div>
      <div v-else class="unified-layout-logo-collapsed">
        <img v-if="logoUrl" :src="logoUrl" :alt="logoText || 'Logo'" class="unified-layout-logo-img-small" />
        <AppstoreOutlined v-else class="unified-layout-logo-icon-small" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { AppstoreOutlined } from '@ant-design/icons-vue'
import type { AppLogoProps } from '../types'

const props = withDefaults(defineProps<AppLogoProps>(), {
  logoText: 'Kiro Platform',
  to: '/',
})

const router = useRouter()

const handleClick = () => {
  if (props.to) {
    router.push(props.to)
  }
}
</script>

<style scoped>
.unified-layout-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
  transition: all var(--layout-transition-duration);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  min-height: 64px;
}

.unified-layout-logo:hover {
  background: var(--layout-bg-hover);
}

.unified-layout-logo-expanded {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.unified-layout-logo-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.unified-layout-logo-default {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unified-layout-logo-img {
  max-width: 120px;
  max-height: 32px;
  object-fit: contain;
}

.unified-layout-logo-img-small {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.unified-layout-logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--layout-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.5px;
}

.unified-layout-logo-icon {
  font-size: 24px;
  color: var(--layout-primary-color);
}

.unified-layout-logo-icon-small {
  font-size: 20px;
  color: var(--layout-primary-color);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--layout-transition-duration) var(--layout-transition-timing);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .unified-layout-logo {
    padding: 12px;
    min-height: 56px;
  }

  .unified-layout-logo-text {
    font-size: 16px;
  }

  .unified-layout-logo-img {
    max-width: 100px;
    max-height: 28px;
  }
}
</style>
