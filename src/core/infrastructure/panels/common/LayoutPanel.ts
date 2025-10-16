/**
 * 布局属性面板配置
 * 包含所有组件共有的布局属性
 */

import { PanelGroup, type PanelConfig } from '../types'
import { FieldType } from '../../fields/types'

/**
 * 布局属性面板
 */
export const LayoutPanel: PanelConfig = {
  group: PanelGroup.LAYOUT,
  title: '布局属性',
  icon: 'LayoutOutlined',
  collapsible: true,
  defaultExpanded: true,
  order: 2,
  fields: [
    {
      key: 'width',
      label: '宽度',
      type: FieldType.SIZE,
      placeholder: '输入宽度',
      tooltip: '组件宽度',
      layout: { span: 2 },
    },
    {
      key: 'height',
      label: '高度',
      type: FieldType.SIZE,
      placeholder: '输入高度',
      tooltip: '组件高度',
      layout: { span: 2 },
    },
    {
      key: 'margin',
      label: '外边距',
      type: FieldType.TEXT,
      placeholder: '0, 10px, 10px 20px',
      tooltip: '组件外边距,支持简写格式',
      layout: { span: 2 },
      visualizer: {
        type: 'margin',
        interactive: true,
        preview: true,
      },
    },
    {
      key: 'padding',
      label: '内边距',
      type: FieldType.TEXT,
      placeholder: '0, 10px, 10px 20px',
      tooltip: '组件内边距,支持简写格式',
      layout: { span: 2 },
      visualizer: {
        type: 'padding',
        interactive: true,
        preview: true,
      },
    },
    {
      key: 'position',
      label: '定位',
      type: FieldType.SELECT,
      defaultValue: 'static',
      tooltip: '组件定位方式',
      layout: { span: 1 },
      options: [
        { label: '静态 (static)', value: 'static' },
        { label: '相对 (relative)', value: 'relative' },
        { label: '绝对 (absolute)', value: 'absolute' },
        { label: '固定 (fixed)', value: 'fixed' },
        { label: '粘性 (sticky)', value: 'sticky' },
      ],
    },
    {
      key: 'zIndex',
      label: 'Z轴层级',
      type: FieldType.NUMBER,
      defaultValue: 0,
      tooltip: '组件的堆叠顺序',
      layout: { span: 1 },
    },
    {
      key: 'top',
      label: '顶部偏移',
      type: FieldType.TEXT,
      placeholder: 'auto, 10px',
      tooltip: '定位时的顶部偏移',
      layout: { span: 1 },
      dependency: {
        field: 'position',
        condition: 'notEquals',
        value: 'static',
      },
    },
    {
      key: 'right',
      label: '右侧偏移',
      type: FieldType.TEXT,
      placeholder: 'auto, 10px',
      tooltip: '定位时的右侧偏移',
      layout: { span: 1 },
      dependency: {
        field: 'position',
        condition: 'notEquals',
        value: 'static',
      },
    },
    {
      key: 'bottom',
      label: '底部偏移',
      type: FieldType.TEXT,
      placeholder: 'auto, 10px',
      tooltip: '定位时的底部偏移',
      layout: { span: 1 },
      dependency: {
        field: 'position',
        condition: 'notEquals',
        value: 'static',
      },
    },
    {
      key: 'left',
      label: '左侧偏移',
      type: FieldType.TEXT,
      placeholder: 'auto, 10px',
      tooltip: '定位时的左侧偏移',
      layout: { span: 1 },
      dependency: {
        field: 'position',
        condition: 'notEquals',
        value: 'static',
      },
    },
  ],
}
