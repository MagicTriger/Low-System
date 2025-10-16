<template>
  <div v-if="visible" class="alignment-toolbar">
    <div class="toolbar-section">
      <span class="section-label">对齐</span>
      <a-button-group size="small">
        <a-tooltip title="左对齐">
          <a-button @click="$emit('align', 'left')">
            <align-left-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="水平居中">
          <a-button @click="$emit('align', 'center-horizontal')">
            <align-center-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="右对齐">
          <a-button @click="$emit('align', 'right')">
            <align-right-outlined />
          </a-button>
        </a-tooltip>
      </a-button-group>

      <a-button-group size="small" style="margin-left: 8px">
        <a-tooltip title="顶部对齐">
          <a-button @click="$emit('align', 'top')">
            <vertical-align-top-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="垂直居中">
          <a-button @click="$emit('align', 'center-vertical')">
            <vertical-align-middle-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="底部对齐">
          <a-button @click="$emit('align', 'bottom')">
            <vertical-align-bottom-outlined />
          </a-button>
        </a-tooltip>
      </a-button-group>
    </div>

    <a-divider type="vertical" />

    <div class="toolbar-section">
      <span class="section-label">分布</span>
      <a-button-group size="small">
        <a-tooltip title="水平分布">
          <a-button @click="$emit('distribute', 'horizontal')">
            <column-width-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="垂直分布">
          <a-button @click="$emit('distribute', 'vertical')">
            <column-height-outlined />
          </a-button>
        </a-tooltip>
      </a-button-group>
    </div>

    <a-divider type="vertical" />

    <div class="toolbar-section">
      <span class="section-label">尺寸</span>
      <a-button-group size="small">
        <a-tooltip title="统一宽度">
          <a-button @click="$emit('resize', 'same-width')">
            <arrows-alt-outlined :rotate="90" />
          </a-button>
        </a-tooltip>
        <a-tooltip title="统一高度">
          <a-button @click="$emit('resize', 'same-height')">
            <arrows-alt-outlined :rotate="0" />
          </a-button>
        </a-tooltip>
        <a-tooltip title="统一尺寸">
          <a-button @click="$emit('resize', 'same-size')">
            <border-outlined />
          </a-button>
        </a-tooltip>
      </a-button-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  ColumnWidthOutlined,
  ColumnHeightOutlined,
  ArrowsAltOutlined,
  BorderOutlined,
} from '@ant-design/icons-vue'

interface Props {
  visible: boolean
}

defineProps<Props>()

defineEmits<{
  align: [type: 'left' | 'center-horizontal' | 'right' | 'top' | 'center-vertical' | 'bottom']
  distribute: [type: 'horizontal' | 'vertical']
  resize: [type: 'same-width' | 'same-height' | 'same-size']
}>()
</script>

<style scoped>
.alignment-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

:deep(.ant-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
