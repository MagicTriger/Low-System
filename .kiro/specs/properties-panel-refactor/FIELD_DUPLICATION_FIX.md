# 字段重复显示修复方案

## 🎯 问题确认

字段重复显示的根本原因是:**group key不匹配导致去重失败**

### 问题详情

在`PropertyPanelManager.mergePanels()`中,去重逻辑是基于group key的:

```typescript
if (groupMap.has(group.key)) {
  // 合并同名group的fields,去重
  const existingGroup = groupMap.get(group.key)!
  const existingFieldKeys = new Set(existingGroup.fields.map(f => f.key))

  // 只添加不存在的字段
  group.fields.forEach(field => {
    if (!existingFieldKeys.has(field.key)) {
      existingGroup.fields.push(field)
    }
  })
} else {
  // 不同的group key,直接添加
  groupMap.set(group.key, { ...group, fields: [...group.fields] })
}
```

### Group Key不匹配

**按钮控件settings** (来自`register.ts`):

- `group: 'data'`
- `group: 'common'`
- `group: 'extend'`

**BasicPanel配置** (来自`BasicPanel.ts`):

- `key: 'basic-info'`
- `key: 'common'` ✅ 匹配
- `key: 'data-binding'` ❌ 不匹配 (应该是'data')
- `key: 'extended'` ❌ 不匹配 (应该是'extend')

**结果**:

- `'data'` 和 `'data-binding'` 被当作两个不同的分组
- `'extend'` 和 `'extended'` 被当作两个不同的分组
- 所以字段都显示出来了,看起来像是重复!

## ✅ 解决方案

### 方案1: 统一Group Key命名 (推荐)

修改`BasicPanel.ts`,使用与控件settings一致的group key:

```typescript
export const BasicPanelConfig: PropertyPanelConfig = {
  id: 'basic',
  name: '基本',
  groups: [
    {
      key: 'basic',  // 改为'basic'
      name: '基本信息',
      fields: [...]
    },
    {
      key: 'common',  // 保持'common' ✅
      name: '公共属性',
      fields: [...]
    },
    {
      key: 'data',  // 改为'data' (从'data-binding')
      name: '数据绑定',
      fields: [...]
    },
    {
      key: 'extend',  // 改为'extend' (从'extended')
      name: '扩展属性',
      fields: [...]
    },
  ],
}
```

### 方案2: 添加Group Key映射

在`PropertyPanelManager`中添加group key映射逻辑:

```typescript
private normalizeGroupKey(key: string): string {
  const keyMap: Record<string, string> = {
    'data-binding': 'data',
    'extended': 'extend',
    'basic-info': 'basic',
  }
  return keyMap[key] || key
}
```

然后在合并时使用规范化的key。

### 方案3: 智能字段去重

不依赖group key,而是在整个面板级别去重:

```typescript
private mergeWithDefaultPanels(config: PropertyPanelConfig): PropertyPanelConfig {
  const defaultPanels = this.getDefaultPanels()
  if (defaultPanels.length === 0) {
    return config
  }

  // 收集控件配置中的所有字段key
  const controlFieldKeys = new Set<string>()
  config.groups?.forEach(group => {
    group.fields.forEach(field => {
      controlFieldKeys.add(field.key)
    })
  })

  // 从默认面板中移除已存在的字段
  const filteredDefaultPanels = defaultPanels.map(panel => ({
    ...panel,
    groups: panel.groups?.map(group => ({
      ...group,
      fields: group.fields.filter(field => !controlFieldKeys.has(field.key))
    })).filter(group => group.fields.length > 0)
  }))

  return this.mergePanels([...filteredDefaultPanels, config])
}
```

## 🚀 推荐实施步骤

### 步骤1: 统一Group Key (最简单)

修改`BasicPanel.ts`:

```typescript
{
  key: 'data',  // 从'data-binding'改为'data'
  name: '数据绑定',
  // ...
},
{
  key: 'extend',  // 从'extended'改为'extend'
  name: '扩展属性',
  // ...
}
```

### 步骤2: 验证修复

1. 重启应用
2. 拖拽按钮组件
3. 检查属性面板
4. 确认字段不再重复

### 步骤3: 更新其他面板

检查`StylePanel.ts`和`EventPanel.ts`,确保它们的group key也遵循统一的命名规范。

## 📋 Group Key命名规范

建议使用以下标准group key:

- `basic` - 基本信息 (id, name等)
- `common` - 公共属性 (opacity, classes等)
- `data` - 数据绑定
- `extend` - 扩展属性
- `size` - 尺寸
- `spacing` - 间距
- `flex` - 弹性布局
- `position` - 定位
- `font` - 字体
- `border` - 边框
- `radius` - 圆角
- `background` - 背景
- `event-lifecycle` - 生命周期事件
- `event-mouse` - 鼠标事件
- `event-keyboard` - 键盘事件
- `event-form` - 表单事件

## 🎯 预期效果

修复后:

- ✅ 字段不再重复显示
- ✅ 控件特定字段和通用字段正确合并
- ✅ 相同key的字段被去重
- ✅ 属性面板显示清晰

## 🔧 立即修复

让我现在就实施方案1...
