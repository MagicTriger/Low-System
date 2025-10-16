/**
 * 事件属性面板配置
 * 包含所有组件共有的事件属性
 */

import { PanelGroup, type PanelConfig } from '../types'
import { FieldType } from '../../fields/types'

/**
 * 事件属性面板
 */
export const EventPanel: PanelConfig = {
  group: PanelGroup.EVENT,
  title: '事件配置',
  icon: 'ThunderboltOutlined',
  collapsible: true,
  defaultExpanded: false,
  order: 4,
  fields: [
    {
      key: 'onClick',
      label: '点击事件',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 点击时执行的代码\nconsole.log("clicked")',
      tooltip: '组件被点击时触发',
      layout: { span: 2 },
    },
    {
      key: 'onDoubleClick',
      label: '双击事件',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 双击时执行的代码',
      tooltip: '组件被双击时触发',
      layout: { span: 2 },
    },
    {
      key: 'onMouseEnter',
      label: '鼠标进入',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 鼠标进入时执行的代码',
      tooltip: '鼠标进入组件区域时触发',
      layout: { span: 2 },
    },
    {
      key: 'onMouseLeave',
      label: '鼠标离开',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 鼠标离开时执行的代码',
      tooltip: '鼠标离开组件区域时触发',
      layout: { span: 2 },
    },
    {
      key: 'onFocus',
      label: '获得焦点',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 获得焦点时执行的代码',
      tooltip: '组件获得焦点时触发',
      layout: { span: 2 },
    },
    {
      key: 'onBlur',
      label: '失去焦点',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 失去焦点时执行的代码',
      tooltip: '组件失去焦点时触发',
      layout: { span: 2 },
    },
  ],
}
