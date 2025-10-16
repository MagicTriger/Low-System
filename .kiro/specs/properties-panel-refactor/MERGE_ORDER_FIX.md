# 🔧 合并顺序修复 - 字段重复问题的真正原因

## 问题发现

虽然控件注册成功了(21个控件),但属性面板仍然显示重复的字段。

经过深入分析,发现了**真正的根本原因**:

### 合并顺序错误

在 `PropertyPanelManager.ts` 的 `mergeWithDefaultPanels` 方法中:

**修复前:**

```typescript
// 错误的顺序: 先默认面板,后控件配置
return this.mergePanels([...defaultPanels, config])
```

**问题:**

1. 先处理 BasicPanel 的字段 (如 'id', 'name', 'classes' 等)
2. 再处理控件 settings 的字段
3. 去重逻辑会保留**第一次出现**的字段
4. 结果: BasicPanel 的字段被保留,控件的同名字段被跳过
5. **但是**: 控件的字段和 BasicPanel 的字段都会显示,因为它们在不同的 group 中!

等等,让我重新分析...

## 重新分析

让我检查按钮的 settings 配置:

```typescript
settings: [
  // 数据分组
  {
    key: 'dataSource',
    name: '数据源',
    type: 'select',
    group: 'data', // ← 注意这里
  },
  // 公共分组
  {
    key: 'text',
    name: '文本',
    type: 'string',
    group: 'common', // ← 注意这里
  },
  // ...
]
```

BasicPanel 的配置:

```typescript
{
  key: 'common',
  name: '公共属性',
  fields: [
    {
      key: 'opacity',
      name: '透明度',
      // ...
    },
    {
      key: 'classes',
      name: '样式类名',
      // ...
    },
  ]
}
```

**关键发现:**

- 按钮的 settings 中有 `group: 'common'` 的字段
- BasicPanel 也有 `key: 'common'` 的 group
- 这两个 group 会被合并!

### 合并过程

**修复前的顺序** `[...defaultPanels, config]`:

1. 处理 BasicPanel 的 'common' group:

   - 添加 'opacity', 'classes' 等字段

2. 处理按钮 settings 的 'common' group:

   - 尝试添加 'text', 'icon', 'stopPropagation'
   - 这些字段不存在,所以都会被添加

3. 结果: 'common' group 包含:
   - BasicPanel 的字段: 'opacity', 'classes', ...
   - 按钮的字段: 'text', 'icon', 'stopPropagation', ...
   - **所有字段都显示,没有重复!**

**那为什么还会重复?**

让我检查是否有其他地方也在添加字段...

## 真正的问题

可能的原因:

1. **缓存问题**: 缓存的配置没有被清除
2. **多次合并**: 配置被合并了多次
3. **UI渲染问题**: 属性面板组件渲染了多次

让我添加更多调试日志来追踪。

## 修复措施

### 1. 修改合并顺序

虽然理论上顺序不应该导致重复,但为了确保控件字段优先,我修改了顺序:

```typescript
// 修复后: 先控件配置,后默认面板
return this.mergePanels([config, ...defaultPanels])
```

**好处:**

- 控件的字段优先
- 如果有同名字段,控件的定义会被保留
- 默认面板的字段作为补充

### 2. 添加调试日志

在 `mergePanels` 方法中添加日志:

```typescript
console.log(
  `🔀 Merging ${panels.length} panels:`,
  panels.map(p => p.id || p.name)
)

// 在跳过重复字段时
console.log(`  ⏭️  Skipping duplicate field: ${field.key} in group ${group.key}`)
```

### 3. 清除缓存

确保在注册控件定义后清除缓存:

```typescript
registerControlDefinitions(definitions: Map<string, any>): void {
  definitions.forEach((def, kind) => {
    this.registerControlDefinition(kind, def)
  })
  // 清空缓存
  this.configCache.clear()
}
```

## 验证步骤

### 1. 重启应用

```bash
# 完全重启
npm run dev
```

### 2. 检查控制台日志

应该看到:

```
🔀 Merging 2 panels: ['button-panel', 'basic']
  ⏭️  Skipping duplicate field: xxx in group common
```

如果看到 "Skipping duplicate field",说明去重逻辑在工作。

### 3. 在浏览器控制台运行验证脚本

参考 `BROWSER_VERIFICATION.md` 中的脚本。

### 4. 检查属性面板

拖拽按钮到画布,查看属性面板:

- 每个字段应该只显示一次
- 字段应该按 group 正确分组

## 可能的其他问题

如果修复后仍然有重复,可能是:

### 问题 A: UI 组件渲染了多次

检查 `PropertiesPanel.vue` 是否有重复渲染的问题。

### 问题 B: 多个面板配置被注册

检查是否有多个地方注册了相同的面板配置。

### 问题 C: 字段定义本身重复

检查控件的 settings 数组中是否有重复的字段定义。

## 下一步

1. **重启应用**
2. **检查控制台日志**
3. **运行浏览器验证脚本**
4. **测试属性面板**
5. **报告结果**

如果仍然有重复,请提供:

- 完整的控制台日志
- 浏览器验证脚本的输出
- 属性面板的截图

---

**修复状态:** ✅ 已应用
**需要验证:** 是
**预计效果:** 字段不再重复
