/**
 * 布局组件模块
 * 提供响应式布局组件，包括容器、网格、间距和弹性布局
 */

// 导出布局组件
export { default as Container } from './Container.vue'
export { default as Row } from './Row.vue'
export { default as Col } from './Col.vue'
export { default as Space } from './Space.vue'
export { default as Flex } from './Flex.vue'

// 导出组件类型
export type { default as ContainerComponent } from './Container.vue'
export type { default as RowComponent } from './Row.vue'
export type { default as ColComponent } from './Col.vue'
export type { default as SpaceComponent } from './Space.vue'
export type { default as FlexComponent } from './Flex.vue'

// 组件安装函数
import type { App } from 'vue'
import Container from './Container.vue'
import Row from './Row.vue'
import Col from './Col.vue'
import Space from './Space.vue'
import Flex from './Flex.vue'

/**
 * 布局组件列表
 */
export const layoutComponents = {
  Container,
  Row,
  Col,
  Space,
  Flex
}

/**
 * 安装所有布局组件
 * @param app Vue应用实例
 * @param options 安装选项
 */
export function installLayoutComponents(app: App, options?: {
  prefix?: string
  components?: (keyof typeof layoutComponents)[]
}) {
  const { prefix = '', components = Object.keys(layoutComponents) as (keyof typeof layoutComponents)[] } = options || {}
  
  components.forEach(name => {
    const component = layoutComponents[name]
    if (component) {
      app.component(`${prefix}${name}`, component)
    }
  })
}

/**
 * 默认安装函数
 * @param app Vue应用实例
 */
export default function install(app: App) {
  installLayoutComponents(app)
}