<template>
  <span class="icon-wrapper" :class="iconClasses" :style="iconStyle" @click="handleClick">
    <component 
      v-if="iconComponent" 
      :is="iconComponent" 
      :style="{ fontSize: size + 'px', color: color }"
    />
    <i 
      v-else-if="name" 
      :class="getIconClass(name)" 
      :style="{ fontSize: size + 'px', color: color }"
    />
    <span v-else class="icon-placeholder">?</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  HomeOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  DesktopOutlined,
  UserOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons-vue'

interface Props {
  name?: string
  size?: number
  color?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  color: 'currentColor'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 图标映射
const iconMap: Record<string, any> = {
  'home': HomeOutlined,
  'arrow-left': ArrowLeftOutlined,
  'refresh': ReloadOutlined,
  'design': DesktopOutlined,
  'user': UserOutlined,
  'help': QuestionCircleOutlined
}

const iconComponent = computed(() => {
  return props.name ? iconMap[props.name] : null
})

const iconClasses = computed(() => [
  'icon',
  props.className,
  {
    'icon-clickable': !!emit
  }
])

const iconStyle = computed(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const getIconClass = (name: string) => {
  // 兼容其他图标库的类名
  if (name.includes('icon-')) {
    return name
  }
  return `icon-${name}`
}

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<style scoped>
.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-clickable {
  cursor: pointer;
}

.icon-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  background-color: #f0f0f0;
  border-radius: 2px;
  font-size: 0.8em;
  color: #999;
}
</style>