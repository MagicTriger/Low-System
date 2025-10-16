<template>
  <a-button
    :type="buttonType"
    :size="buttonSize"
    :shape="buttonShape"
    :loading="loading"
    :disabled="disabled"
    :danger="danger"
    :ghost="ghost"
    :block="block"
    :href="href"
    :target="target"
    @click="handleClick"
  >
    <template #icon v-if="icon">
      <component :is="iconComponent" />
    </template>
    {{ text }}
  </a-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as AntIcons from '@ant-design/icons-vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface ButtonControl extends Control {
  props?: {
    text?: string
    type?: 'primary' | 'default' | 'dashed' | 'text' | 'link'
    size?: 'large' | 'middle' | 'small'
    shape?: 'default' | 'circle' | 'round'
    icon?: string
    loading?: boolean
    disabled?: boolean
    danger?: boolean
    ghost?: boolean
    block?: boolean
    href?: string
    target?: string
  }
}

const props = defineProps<{ control: ButtonControl }>()

const { control, eventHandler } = useControlMembers(props)

// 计算属性
const text = computed(() => control.value.props?.text || '')
const buttonType = computed(() => control.value.props?.type || 'default')
const buttonSize = computed(() => control.value.props?.size || 'middle')
const buttonShape = computed(() => control.value.props?.shape || 'default')
const loading = computed(() => control.value.props?.loading || false)
const disabled = computed(() => control.value.props?.disabled || false)
const danger = computed(() => control.value.props?.danger || false)
const ghost = computed(() => control.value.props?.ghost || false)
const block = computed(() => control.value.props?.block || false)
const href = computed(() => control.value.props?.href)
const target = computed(() => control.value.props?.target)
const icon = computed(() => {
  const iconValue = control.value.props?.icon
  console.log('[Button] Icon value:', iconValue, 'Props:', control.value.props)
  return iconValue
})

const iconComponent = computed(() => {
  if (!icon.value) {
    console.log('[Button] No icon value')
    return null
  }
  // 从导入的 AntIcons 中获取图标组件
  const component = (AntIcons as any)[icon.value]
  console.log('[Button] Icon component for', icon.value, ':', component)
  return component || null
})

// 事件处理
const handleClick = async (event: Event) => {
  await eventHandler?.('click', event)
}

// 暴露方法
defineExpose({
  focus: () => {
    // 按钮聚焦逻辑
  },
  blur: () => {
    // 按钮失焦逻辑
  },
})
</script>

<style scoped>
/* 按钮控件样式 */
</style>
