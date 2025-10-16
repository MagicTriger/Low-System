# 表格组件宽度修复

## 问题描述

单个表格组件添加到Flex容器后,没有占满容器的整个宽度,只显示了一小部分。

## 根本原因

`ControlFactory.create`方法创建Table组件时,没有设置默认的`layout`属性,导致表格使用了组件自身的默认宽度(可能是auto或固定值)。

## 解决方案

在`ControlFactory.create`方法中,为Table组件添加默认的layout配置:

```typescript
// 为Table组件设置默认layout,让它占满容器宽度
let defaultLayout: any = options.layout || {}
if (kind === 'Table' && !options.layout) {
  defaultLayout = {
    width: { type: '%', value: 100 },
    height: { type: '%', value: 100 },
  }
}
```

## 修改文件

- `src/core/renderer/base.ts` - ControlFactory.create方法

## 工作流程

### 1. 创建单个表格

```
用户操作: 拖拽Table到Flex容器
↓
ControlFactory.create('Table')
↓
自动设置: layout = { width: { type: '%', value: 100 }, height: { type: '%', value: 100 } }
↓
addControl(table, flexId)
↓
autoResizeTablesInContainer(flex) - 检测到1个表格,保持100%
↓
controlToStyles转换: width: '100%', height: '100%'
↓
表格占满容器宽度 ✅
```

### 2. 添加第二个表格

```
用户操作: 再拖拽一个Table到Flex容器
↓
ControlFactory.create('Table')
↓
自动设置: layout = { width: { type: '%', value: 100 }, height: { type: '%', value: 100 } }
↓
addControl(table2, flexId)
↓
autoResizeTablesInContainer(flex) - 检测到2个表格
↓
调整所有表格: width = { type: '%', value: 50 }
↓
两个表格各占50%宽度 ✅
```

## 测试步骤

1. **测试单个表格**

   - 创建Flex容器
   - 拖拽一个Table组件到Flex容器
   - 验证: 表格应该占满容器的整个宽度(100%)

2. **测试多个表格**

   - 继续添加第2个Table组件
   - 验证: 两个表格应该各占50%宽度
   - 继续添加第3个Table组件
   - 验证: 三个表格应该各占33.33%宽度

3. **测试删除表格**
   - 删除一个表格
   - 验证: 剩余表格应该重新分配空间

## 预期效果

### 单个表格

```
┌─────────────────────────────────────┐
│          Flex Container             │
│  ┌─────────────────────────────┐   │
│  │         Table (100%)        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 两个表格

```
┌─────────────────────────────────────┐
│          Flex Container             │
│  ┌───────────────┬───────────────┐  │
│  │  Table (50%)  │  Table (50%)  │  │
│  └───────────────┴───────────────┘  │
└─────────────────────────────────────┘
```

### 三个表格

```
┌─────────────────────────────────────┐
│          Flex Container             │
│  ┌──────────┬──────────┬──────────┐ │
│  │Table 33% │Table 33% │Table 33% │ │
│  └──────────┴──────────┴──────────┘ │
└─────────────────────────────────────┘
```

## 完成状态

✅ 修复完成
✅ 语法检查通过
🔄 等待测试验证

## 下一步

测试验证修复效果,如果单个表格能够占满容器宽度,则继续验证多个表格的自动平均分配功能。
