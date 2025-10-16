<template>
  <div :class="flexClasses" :style="flexStyles">
    <!-- 在设计器模式下使用插槽，在运行时模式下渲染子组件 -->
    <slot>
      <template v-for="child in children" :key="child.id">
        <component :is="controlRenderer" :control="child" />
      </template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useControlMembers } from '../../control-members'
import { RootViewContext } from '../../root-view-context'
import type { Control } from '../../base'

interface FlexControl extends Control {
  props?: {
    direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
    justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
    align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
    alignContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch'
    gap?: number
    vertical?: boolean
  }
}

const props = defineProps<{ control: FlexControl }>()

const { control, eventHandler } = useControlMembers(props)

// 注入控件渲染器（提供默认值避免警告）
const controlRenderer = inject(RootViewContext.RendererKey, null)

// 计算属性
const children = computed(() => control.value.children || [])

const flexClasses = computed(() => {
  const classes = ['flex-container']

  if (control.value.props?.vertical) {
    classes.push('flex-vertical')
  }

  return classes
})

const flexStyles = computed(() => {
  const styles: Record<string, any> = {
    display: 'flex',
    width: '100%', // 默认占满父容器宽度
  }

  const props = control.value.props

  if (props?.direction) {
    styles.flexDirection = props.direction
  }

  if (props?.wrap) {
    styles.flexWrap = props.wrap
  }

  if (props?.justify) {
    styles.justifyContent = props.justify
  }

  if (props?.align) {
    styles.alignItems = props.align
  }

  if (props?.alignContent) {
    styles.alignContent = props.alignContent
  }

  if (props?.gap !== undefined) {
    styles.gap = `${props.gap}px`
  }

  // 垂直布局快捷方式
  if (props?.vertical) {
    styles.flexDirection = 'column'
  }

  return styles
})

// 事件处理
const handleClick = async (event: Event) => {
  await eventHandler?.('click', event)
}

// 暴露方法
defineExpose({
  addChild: (child: Control) => {
    if (!control.value.children) {
      control.value.children = []
    }
    control.value.children.push(child)
  },
  removeChild: (childId: string) => {
    if (control.value.children) {
      const index = control.value.children.findIndex(child => child.id === childId)
      if (index > -1) {
        control.value.children.splice(index, 1)
      }
    }
  },
  getChildren: () => control.value.children || [],
  clearChildren: () => {
    control.value.children = []
  },
})
</script>

<style scoped>
.flex-container {
  position: relative;
  width: 100%; /* 默认占满父容器宽度 */
  min-height: 100px; /* 设置最小高度确保容器可见 */
}

.flex-vertical {
  flex-direction: column;
}

/* 设计器模式下的样式 */
.flex-container:empty::before {
  content: '拖拽组件到此处';
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  min-height: 60px;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
}

.flex-container:hover {
  outline: 1px dashed #1890ff;
}
</style>
