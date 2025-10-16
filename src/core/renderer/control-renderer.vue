<template>
  <component 
    ref="ctrlInst" 
    :is="comp" 
    :control="control" 
    :class="cssClasses" 
    :style="cssStyles"
    v-bind="controlProps"
    @[eventName]="handleEvent"
    v-for="eventName in eventNames"
    :key="`event-${eventName}`"
  />
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import type { Control } from './base'
import { ControlInstIdKey, useControlMembers } from './control-members'
import { ControlDefinitions } from './definitions'
import { GenerateControlCommonStyle } from './style-generate'

// 定义Props
interface Props {
  control: Control
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 1
})

// 使用控件成员钩子
const { viewId, control, ctx, eventHandler } = useControlMembers(props, provide)

// 控件定义和组件
const def = computed(() => ControlDefinitions[control.value?.kind])
const comp = computed(() => def.value?.component || 'div')

// 样式处理
const cssClasses = computed(() => {
  const classes = [...(control.value.classes || [])]
  
  // 添加控件类型类名
  if (control.value.kind) {
    classes.push(`ctrl-${control.value.kind}`)
  }
  
  return classes
})

const cssStyles = computed(() => {
  const styles = GenerateControlCommonStyle(control.value)
  
  // 应用缩放
  if (props.zoom && props.zoom !== 1) {
    styles.zoom = props.zoom
  }
  
  return styles
})

// 控件属性
const controlProps = computed(() => {
  const props: Record<string, any> = {}
  
  // 传递控件自定义属性
  if (control.value.props) {
    Object.assign(props, control.value.props)
  }
  
  return props
})

// 事件名称列表
const eventNames = computed(() => {
  if (!def.value?.events) return []
  return Object.keys(def.value.events)
})

// 事件处理
const handleEvent = async (eventName: string, ...args: any[]) => {
  try {
    const result = await eventHandler?.(eventName, ...args)
    return result
  } catch (error) {
    console.error(`控件事件处理失败 [${control.value.kind}:${eventName}]:`, error)
    return false
  }
}

// 实例管理
const ctrlInstId = ctx?.nextInstId() || 'default'
provide(ControlInstIdKey, ctrlInstId)
const ctrlInst = ref()

// 生命周期
onMounted(() => {
  if (ctx && viewId) {
    ctx.addCtrlRef(viewId, ctrlInstId, control.value, ctrlInst.value?.methods)
  }
  
  // 延迟触发mounted事件，确保DOM已渲染
  setTimeout(() => {
    eventHandler?.('mounted')
  }, 0)
})

onUnmounted(() => {
  if (ctx && viewId) {
    ctx.removeCtrlRef(viewId, ctrlInstId)
  }
  
  eventHandler?.('unmounted')
})

// 暴露实例方法
defineExpose({
  control: control.value,
  element: ctrlInst,
  focus: () => ctrlInst.value?.focus?.(),
  blur: () => ctrlInst.value?.blur?.(),
  validate: () => ctrlInst.value?.validate?.(),
  reset: () => ctrlInst.value?.reset?.(),
  getValue: () => ctrlInst.value?.getValue?.(),
  setValue: (value: any) => ctrlInst.value?.setValue?.(value)
})
</script>

<style scoped>
/* 控件基础样式 */
.ctrl-base {
  position: relative;
  box-sizing: border-box;
}

/* 控件类型样式 */
.ctrl-button {
  display: inline-block;
}

.ctrl-input {
  display: block;
  width: 100%;
}

.ctrl-container {
  display: block;
  position: relative;
}

.ctrl-text {
  display: inline-block;
}

.ctrl-image {
  display: block;
  max-width: 100%;
  height: auto;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .ctrl-input,
  .ctrl-button {
    font-size: 16px; /* 防止iOS缩放 */
  }
}

/* 打印样式 */
@media print {
  .ctrl-button {
    display: none;
  }
}
</style>