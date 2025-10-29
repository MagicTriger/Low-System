/**
 * 上下文表达式解析器
 *
 * 支持从数据上下文中解析表达式，例如：
 * - ${context.userId} -> 从 context 对象中获取 userId
 * - ${user.name} -> 从 user 对象中获取 name
 * - ${page.selectedRow.id} -> 从 page.selectedRow 中获取 id
 */

/**
 * 表达式模式
 * 匹配 ${xxx.yyy.zzz} 格式的表达式
 */
const EXPRESSION_PATTERN = /\$\{([^}]+)\}/g

/**
 * 解析上下文表达式
 *
 * @param expression - 包含表达式的字符串，如 "${context.userId}"
 * @param context - 数据上下文对象
 * @returns 解析后的值
 *
 * @example
 * ```typescript
 * const context = { user: { id: 123, name: 'John' } }
 * resolveContextExpression('${user.id}', context) // 返回 123
 * resolveContextExpression('User: ${user.name}', context) // 返回 'User: John'
 * resolveContextExpression('${user.id}-${user.name}', context) // 返回 '123-John'
 * ```
 */
export function resolveContextExpression(expression: string, context: Record<string, any>): any {
  if (!expression || typeof expression !== 'string') {
    return expression
  }

  // 检查是否包含表达式
  if (!expression.includes('${')) {
    return expression
  }

  // 如果整个字符串就是一个表达式，直接返回解析后的值（保持原始类型）
  const singleExpressionMatch = expression.match(/^\$\{([^}]+)\}$/)
  if (singleExpressionMatch) {
    const path = singleExpressionMatch[1].trim()
    return getValueByPath(context, path)
  }

  // 替换字符串中的所有表达式
  return expression.replace(EXPRESSION_PATTERN, (match, path) => {
    const value = getValueByPath(context, path.trim())
    return value !== undefined && value !== null ? String(value) : ''
  })
}

/**
 * 根据路径从对象中获取值
 *
 * @param obj - 源对象
 * @param path - 属性路径，如 'user.profile.name'
 * @returns 路径对应的值，如果路径不存在则返回 undefined
 *
 * @example
 * ```typescript
 * const obj = { user: { profile: { name: 'John' } } }
 * getValueByPath(obj, 'user.profile.name') // 返回 'John'
 * getValueByPath(obj, 'user.age') // 返回 undefined
 * ```
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined
  }

  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }

    // 处理数组索引
    if (Array.isArray(current)) {
      const index = parseInt(key, 10)
      if (!isNaN(index)) {
        current = current[index]
        continue
      }
    }

    current = current[key]
  }

  return current
}

/**
 * 设置对象的嵌套属性值
 *
 * @param obj - 目标对象
 * @param path - 属性路径，如 'user.profile.name'
 * @param value - 要设置的值
 *
 * @example
 * ```typescript
 * const obj = {}
 * setValueByPath(obj, 'user.profile.name', 'John')
 * // obj 变为 { user: { profile: { name: 'John' } } }
 * ```
 */
export function setValueByPath(obj: any, path: string, value: any): void {
  if (!obj || !path) {
    return
  }

  const keys = path.split('.')
  const lastKey = keys.pop()

  if (!lastKey) {
    return
  }

  let current = obj

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[lastKey] = value
}

/**
 * 批量解析对象中的表达式
 *
 * @param obj - 包含表达式的对象
 * @param context - 数据上下文
 * @returns 解析后的对象
 *
 * @example
 * ```typescript
 * const obj = {
 *   userId: '${user.id}',
 *   userName: '${user.name}',
 *   nested: {
 *     value: '${data.value}'
 *   }
 * }
 * const context = { user: { id: 123, name: 'John' }, data: { value: 'test' } }
 * resolveObjectExpressions(obj, context)
 * // 返回 { userId: 123, userName: 'John', nested: { value: 'test' } }
 * ```
 */
export function resolveObjectExpressions(obj: Record<string, any>, context: Record<string, any>): Record<string, any> {
  const resolved: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      resolved[key] = resolveContextExpression(value, context)
    } else if (Array.isArray(value)) {
      resolved[key] = value.map(item => (typeof item === 'string' ? resolveContextExpression(item, context) : item))
    } else if (value && typeof value === 'object') {
      resolved[key] = resolveObjectExpressions(value, context)
    } else {
      resolved[key] = value
    }
  }

  return resolved
}

/**
 * 检查字符串是否包含表达式
 *
 * @param str - 要检查的字符串
 * @returns 是否包含表达式
 */
export function hasExpression(str: string): boolean {
  return typeof str === 'string' && str.includes('${')
}

/**
 * 提取字符串中的所有表达式路径
 *
 * @param str - 包含表达式的字符串
 * @returns 表达式路径数组
 *
 * @example
 * ```typescript
 * extractExpressionPaths('${user.id}-${user.name}')
 * // 返回 ['user.id', 'user.name']
 * ```
 */
export function extractExpressionPaths(str: string): string[] {
  if (!hasExpression(str)) {
    return []
  }

  const paths: string[] = []
  const matches = str.matchAll(EXPRESSION_PATTERN)

  for (const match of matches) {
    if (match[1]) {
      paths.push(match[1].trim())
    }
  }

  return paths
}

/**
 * 验证表达式路径是否在上下文中存在
 *
 * @param expression - 表达式字符串
 * @param context - 数据上下文
 * @returns 验证结果
 */
export function validateExpression(
  expression: string,
  context: Record<string, any>
): {
  valid: boolean
  missingPaths: string[]
} {
  const paths = extractExpressionPaths(expression)
  const missingPaths: string[] = []

  for (const path of paths) {
    const value = getValueByPath(context, path)
    if (value === undefined) {
      missingPaths.push(path)
    }
  }

  return {
    valid: missingPaths.length === 0,
    missingPaths,
  }
}
