<template>
  <span
    :class="textClasses"
    :style="textStyles"
    v-html="displayText"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface SpanControl extends Control {
  props?: {
    text?: string
    html?: boolean
    ellipsis?: boolean
    copyable?: boolean
    editable?: boolean
    mark?: boolean
    code?: boolean
    keyboard?: boolean
    underline?: boolean
    delete?: boolean
    strong?: boolean
    italic?: boolean
  }
}

const props = defineProps<{ control: SpanControl }>()

const { control, value, eventHandler } = useControlMembers(props)

// 计算属性
const text = computed(() => {
  // 优先使用数据绑定的值
  if (value.value !== null && value.value !== undefined) {
    return String(value.value)
  }
  return control.value.props?.text || '文本内容'
})

const displayText = computed(() => {
  if (control.value.props?.html) {
    return text.value
  }
  return text.value
})

const textClasses = computed(() => {
  const classes: string[] = []
  
  if (control.value.props?.ellipsis) {
    classes.push('text-ellipsis')
  }
  
  if (control.value.props?.mark) {
    classes.push('ant-typography-mark')
  }
  
  if (control.value.props?.code) {
    classes.push('ant-typography-code')
  }
  
  if (control.value.props?.keyboard) {
    classes.push('ant-typography-keyboard')
  }
  
  if (control.value.props?.underline) {
    classes.push('ant-typography-underline')
  }
  
  if (control.value.props?.delete) {
    classes.push('ant-typography-delete')
  }
  
  if (control.value.props?.strong) {
    classes.push('ant-typography-strong')
  }
  
  if (control.value.props?.italic) {
    classes.push('ant-typography-italic')
  }
  
  return classes
})

const textStyles = computed(() => {
  const styles: Record<string, any> = {}
  
  if (control.value.props?.ellipsis) {
    styles.overflow = 'hidden'
    styles.textOverflow = 'ellipsis'
    styles.whiteSpace = 'nowrap'
  }
  
  return styles
})

// 事件处理
const handleClick = async (event: Event) => {
  await eventHandler?.('click', event)
}

// 暴露方法
defineExpose({
  getText: () => text.value,
  setText: (newText: string) => {
    if (control.value.props) {
      control.value.props.text = newText
    }
  }
})
</script>

<style scoped>
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ant-typography-mark {
  background-color: #ffe58f;
  padding: 0 2px;
}

.ant-typography-code {
  background-color: rgba(150, 150, 150, 0.1);
  border: 1px solid rgba(100, 100, 100, 0.2);
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  padding: 0.2em 0.4em;
}

.ant-typography-keyboard {
  background-color: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  padding: 0.15em 0.4em;
}

.ant-typography-underline {
  text-decoration: underline;
}

.ant-typography-delete {
  text-decoration: line-through;
}

.ant-typography-strong {
  font-weight: 600;
}

.ant-typography-italic {
  font-style: italic;
}
</style>