<template>
  <div class="avatar-display" :class="{ 'avatar-loading': loading }" :style="avatarStyle">
    <img
      v-if="!loading && !error"
      :src="displaySrc"
      :alt="alt"
      @load="handleLoad"
      @error="handleError"
      class="avatar-image"
      :class="{ 'avatar-lazy': lazy }"
    />

    <div v-if="loading" class="avatar-skeleton">
      <div class="skeleton-animation"></div>
    </div>

    <div v-if="error" class="avatar-fallback">
      <i class="icon-user"></i>
    </div>

    <div v-if="badge" class="avatar-badge" :class="`badge-${badge}`">
      <span v-if="badgeContent">{{ badgeContent }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

type AvatarSize = 'small' | 'medium' | 'large' | number
type BadgeType = 'dot' | 'online' | 'offline' | 'busy'

interface Props {
  src?: string
  size?: AvatarSize
  alt?: string
  lazy?: boolean
  badge?: BadgeType
  badgeContent?: string | number
  shape?: 'circle' | 'square'
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  size: 'medium',
  alt: '用户头像',
  lazy: false,
  shape: 'circle',
})

const loading = ref(true)
const error = ref(false)
const imageLoaded = ref(false)

const defaultAvatar = '/assets/default-avatar.png'

const sizeMap: Record<string, number> = {
  small: 32,
  medium: 48,
  large: 64,
}

const avatarSize = computed(() => {
  if (typeof props.size === 'number') {
    return props.size
  }
  return sizeMap[props.size] || sizeMap.medium
})

const avatarStyle = computed(() => ({
  width: `${avatarSize.value}px`,
  height: `${avatarSize.value}px`,
  borderRadius: props.shape === 'circle' ? '50%' : '4px',
}))

const displaySrc = computed(() => {
  if (error.value) {
    return defaultAvatar
  }
  return props.src || defaultAvatar
})

watch(
  () => props.src,
  () => {
    loading.value = true
    error.value = false
    imageLoaded.value = false
  }
)

onMounted(() => {
  if (!props.lazy) {
    loading.value = false
  }
})

function handleLoad() {
  loading.value = false
  error.value = false
  imageLoaded.value = true
}

function handleError() {
  loading.value = false
  error.value = true
}
</script>

<style scoped>
.avatar-display {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background: #f5f7fa;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-lazy {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-lazy[src] {
  opacity: 1;
}

.avatar-skeleton {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f2f3f5;
}

.skeleton-animation {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4e7ed;
  color: #909399;
}

.avatar-fallback i {
  font-size: 50%;
}

.avatar-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #f56c6c;
  color: white;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  border: 2px solid white;
  box-sizing: border-box;
}

.badge-dot {
  width: 10px;
  height: 10px;
  min-width: 10px;
  padding: 0;
  border-radius: 50%;
  top: 2px;
  right: 2px;
}

.badge-online {
  background: #67c23a;
}

.badge-offline {
  background: #909399;
}

.badge-busy {
  background: #e6a23c;
}

.avatar-loading {
  pointer-events: none;
}
</style>
