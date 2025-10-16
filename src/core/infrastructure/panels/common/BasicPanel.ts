/**
 * 基础属性面板配置
 * 包含所有组件共有的基础属性
 */

import { PanelGroup, type PanelConfig } from '../types'
import { FieldType } from '../../fields/types'

/**
 * 基础属性面板
 */
export const BasicPanel: PanelConfig = {
  group: PanelGroup.BASIC,
  title: '基础属性',
  icon: 'InfoCircleOutlined',
  collapsible: true,
  defaultExpanded: true,
  order: 1,
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: FieldType.TEXT,
      readonly: true,
      tooltip: '组件的唯一标识符',
      layout: { span: 2 }, // 占满整行
    },
    {
      key: 'name',
      label: '名称',
      type: FieldType.TEXT,
      readonly: true, // 设置为只读
      placeholder: '组件名称',
      tooltip: '组件的显示名称(只读)',
      layout: { span: 2 }, // 占满整行
    },
    {
      key: 'visible',
      label: '可见',
      type: FieldType.SWITCH,
      defaultValue: true,
      tooltip: '控制组件是否显示',
      layout: { span: 1 },
    },
    {
      key: 'disabled',
      label: '禁用',
      type: FieldType.SWITCH,
      defaultValue: false,
      tooltip: '控制组件是否禁用',
      layout: { span: 1 },
    },
  ],
}
