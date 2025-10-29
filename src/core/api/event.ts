/**
 * @deprecated 此文件已重命名为 event-config.ts
 *
 * 为了避免与事件总线系统（src/core/events/）混淆，
 * 事件配置 API 已移至 event-config.ts。
 *
 * 此文件保留用于向后兼容，请使用新的导入路径：
 * ```typescript
 * // 旧的导入方式（仍然可用）
 * import { eventApi } from '@/core/api/event'
 *
 * // 新的导入方式（推荐）
 * import { eventConfigApi } from '@/core/api/event-config'
 * // 或
 * import { eventConfigApi } from '@/core/api'
 * ```
 */

// 重新导出所有类型和 API
export * from './event-config'

// 为了向后兼容，导出 eventApi 别名
export { eventConfigApi as eventApi } from './event-config'
