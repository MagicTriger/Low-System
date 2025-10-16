<template>
  <div :class="gridClasses" :style="gridStyles">
    <!-- 在设计器模式下使用插槽，在运行时模式下渲染子组件 -->
    <slot>
      <template v-for="child in children" :key="child.id">
        <component :is="controlRenderer" :control="child" :style="getChildStyle(child)" />
      </template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useControlMembers } from '../../control-members'
import { RootViewContext } from '../../root-view-context'
import type { Control } from '../../base'

interface GridControl extends Control {
  props?: {
    columns?: number | string
    rows?: number | string
    gap?: number
    columnGap?: number
    rowGap?: number
    autoRows?: string
    autoColumns?: string
    autoFlow?: 'row' | 'column' | 'row dense' | 'column dense'
    justifyItems?: 'start' | 'end' | 'center' | 'stretch'
    alignItems?: 'start' | 'end' | 'center' | 'stretch'
    justifyContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly'
    alignContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly'
  }
}

const props = defineProps<{ control: GridControl }>()

const { control, eventHandler } = useControlMembers(props)

// 注入控件渲染器（提供默认值避免警告）
const controlRenderer = inject(RootViewContext.RendererKey, null)

// 计算属性
const children = computed(() => control.value.children || [])

const gridClasses = computed(() => {
  const classes = ['grid-container']
  return classes
})

const gridStyles = computed(() => {
  const styles: Record<string, any> = {
    display: 'grid',
    width: '100%', // 默认占满父容器宽度
  }

  const props = control.value.props
  const childCount = children.value.length

  if (props?.columns) {
    if (typeof props.columns === 'number') {
      styles.gridTemplateColumns = `repeat(${props.columns}, 1fr)`
    } else {
      styles.gridTemplateColumns = props.columns
    }
  } else if (childCount > 0) {
    // 如果没有设置columns,根据子元素数量自动设置
    // 默认横向排列,每个子元素占1fr
    styles.gridTemplateColumns = `repeat(${childCount}, 1fr)`
  }

  if (props?.rows) {
    if (typeof props.rows === 'number') {
      styles.gridTemplateRows = `repeat(${props.rows}, 1fr)`
    } else {
      styles.gridTemplateRows = props.rows
    }
  }

  if (props?.gap !== undefined) {
    styles.gap = `${props.gap}px`
  } else {
    if (props?.columnGap !== undefined) {
      styles.columnGap = `${props.columnGap}px`
    }
    if (props?.rowGap !== undefined) {
      styles.rowGap = `${props.rowGap}px`
    }
  }

  if (props?.autoRows) {
    styles.gridAutoRows = props.autoRows
  }

  if (props?.autoColumns) {
    styles.gridAutoColumns = props.autoColumns
  }

  if (props?.autoFlow) {
    styles.gridAutoFlow = props.autoFlow
  }

  if (props?.justifyItems) {
    styles.justifyItems = props.justifyItems
  }

  if (props?.alignItems) {
    styles.alignItems = props.alignItems
  }

  if (props?.justifyContent) {
    styles.justifyContent = props.justifyContent
  }

  if (props?.alignContent) {
    styles.alignContent = props.alignContent
  }

  return styles
})

// 获取子元素样式
const getChildStyle = (child: Control) => {
  const styles: Record<string, any> = {}

  // 检查子元素是否有网格定位属性
  if (child.styles?.gridColumn) {
    styles.gridColumn = child.styles.gridColumn
  }

  if (child.styles?.gridRow) {
    styles.gridRow = child.styles.gridRow
  }

  if (child.styles?.gridArea) {
    styles.gridArea = child.styles.gridArea
  }

  if (child.styles?.justifySelf) {
    styles.justifySelf = child.styles.justifySelf
  }

  if (child.styles?.alignSelf) {
    styles.alignSelf = child.styles.alignSelf
  }

  return styles
}

// 事件处理
const handleClick = async (event: Event) => {
  await eventHandler?.('click', event)
}

// 暴露方法
defineExpose({
  addChild: (child: Control, position?: { column?: number; row?: number }) => {
    if (!control.value.children) {
      control.value.children = []
    }

    // 如果指定了位置，设置网格位置样式
    if (position) {
      if (!child.styles) {
        child.styles = {}
      }

      if (position.column !== undefined) {
        child.styles.gridColumn = `${position.column + 1}`
      }

      if (position.row !== undefined) {
        child.styles.gridRow = `${position.row + 1}`
      }
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
  setGridTemplate: (columns: string, rows?: string) => {
    if (!control.value.props) {
      control.value.props = {}
    }
    control.value.props.columns = columns
    if (rows) {
      control.value.props.rows = rows
    }
  },
  getGridInfo: () => {
    const props = control.value.props
    return {
      columns: props?.columns,
      rows: props?.rows,
      gap: props?.gap,
      childCount: children.value.length,
    }
  },
})
</script>

<style scoped>
.grid-container {
  position: relative;
  width: 100%; /* 默认占满父容器宽度 */
  min-height: 100px; /* 设置最小高度确保容器可见 */
}

/* 设计器模式下的样式 */
.grid-container:empty::before {
  content: '拖拽组件到网格中';
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  min-height: 60px;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
  grid-column: 1 / -1;
  grid-row: 1 / -1;
}

.grid-container:hover {
  outline: 1px dashed #1890ff;
}

/* 网格线显示（设计器模式） */
.grid-container.show-grid {
  background-image:
    linear-gradient(rgba(24, 144, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 144, 255, 0.2) 1px, transparent 1px);
}
</style>
