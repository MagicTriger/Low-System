# 任务8实施指南 - 组件Panels配置

## 当前状态

### 已完成 (3/15+)

- ✅ Button - 按钮
- ✅ Span - 文本
- ✅ Image - 图片

### 待完成 (12+)

- ⏳ String - 文本输入
- ⏳ Number - 数字输入
- ⏳ Boolean - 布尔输入
- ⏳ Flex - Flex布局
- ⏳ Grid - Grid布局
- ⏳ Table - 表格
- ⏳ LineChart - 折线图
- ⏳ BarChart - 柱状图
- ⏳ PieChart - 饼图
- ⏳ 其他组件...

---

## 实施步骤

### 方法1: 手动添加(推荐用于关键组件)

1. 打开`src/core/renderer/controls/register.ts`
2. 找到对应组件的定义
3. 从`COMPONENT_PANELS_CONFIG.md`复制配置
4. 粘贴到组件定义的`panels`字段
5. 运行`getDiagnostics`检查错误
6. 测试验证

### 方法2: 批量添加(快速完成)

创建一个脚本批量添加配置:

```typescript
// scripts/add-panels-config.ts
import fs from 'fs'

const componentsConfig = {
  string: {
    /* 配置 */
  },
  number: {
    /* 配置 */
  },
  // ... 其他组件
}

// 读取register.ts
// 查找组件定义
// 插入panels配置
// 写回文件
```

### 方法3: 按需添加(灵活方式)

根据实际使用情况,优先添加:

1. 最常用的组件
2. 用户反馈需要的组件
3. 新功能需要的组件

---

## 优先级建议

### 高优先级 (立即实施)

1. **String** - 最常用的输入组件
2. **Number** - 数字输入很常见
3. **Flex** - 最常用的布局容器
4. **Table** - 数据展示核心组件

### 中优先级 (近期实施)

5. Boolean - 开关输入
6. Grid - 网格布局
7. LineChart - 数据可视化
8. BarChart - 数据可视化

### 低优先级 (按需实施)

9. PieChart - 特定场景
10. 移动端组件 - 特定平台
11. SVG组件 - 特定需求
12. 大屏组件 - 特定场景

---

## 快速实施方案

### 方案A: 核心组件优先

只实施4个最常用的组件:

- String
- Number
- Flex
- Table

**优点**: 快速见效,满足80%需求  
**时间**: 1-2小时

### 方案B: 分类完成

按组件类型分批实施:

1. 输入组件 (String, Number, Boolean)
2. 容器组件 (Flex, Grid)
3. 集合组件 (Table)
4. 图表组件 (LineChart, BarChart, PieChart)

**优点**: 系统完整,分类清晰  
**时间**: 3-4小时

### 方案C: 全部完成

实施所有组件的配置

**优点**: 一次性完成,无后顾之忧  
**时间**: 6-8小时

---

## 实施建议

### 推荐方案: A + 按需添加

1. **立即实施** (1小时)

   - String
   - Number
   - Flex
   - Table

2. **按需添加** (后续)
   - 根据实际使用情况
   - 用户反馈
   - 新功能需求

### 理由

- 满足大部分使用场景
- 快速见效
- 灵活应对变化
- 避免过度工程

---

## 代码示例

### 添加String组件配置

```typescript
// 在register.ts中找到String组件定义
{
  kind: 'string',
  kindName: '文本输入',
  type: ControlType.Input,
  icon: 'input',
  component: StringControl,
  dataBindable: true,
  events: { /* ... */ },
  // 添加panels配置
  panels: {
    extends: ['basic', 'layout', 'style', 'event'],
    custom: [{
      group: 'component' as any,
      title: '输入属性',
      icon: 'EditOutlined',
      fields: [
        {
          key: 'placeholder',
          label: '占位符',
          type: 'text' as any,
          layout: { span: 24 }
        },
        {
          key: 'maxLength',
          label: '最大长度',
          type: 'number' as any,
          layout: { span: 12 }
        },
        {
          key: 'showCount',
          label: '显示字数',
          type: 'switch' as any,
          defaultValue: false,
          layout: { span: 12 }
        }
      ]
    }]
  }
}
```

---

## 验证清单

添加配置后检查:

- [ ] TypeScript无错误
- [ ] 组件在设计器中可选择
- [ ] 属性面板正确显示
- [ ] 字段类型正确渲染
- [ ] 字段值可以修改
- [ ] 修改后组件正确更新
- [ ] 可视化组件正常工作(如果有)
- [ ] 验证规则生效(如果有)

---

## 常见问题

### Q: 配置后面板不显示?

A: 检查:

1. PropertyPanelService是否初始化
2. 组件是否正确注册
3. panels配置格式是否正确

### Q: 字段不渲染?

A: 检查:

1. 字段type是否正确
2. 是否添加了`as any`断言
3. 字段渲染器是否注册

### Q: 可视化组件不显示?

A: 检查:

1. visualizer名称是否正确
2. 可视化组件是否注册
3. 字段类型是否支持可视化

---

## 下一步行动

### 立即执行

1. 决定实施方案(推荐方案A)
2. 打开`register.ts`文件
3. 从`COMPONENT_PANELS_CONFIG.md`复制配置
4. 添加到对应组件
5. 测试验证

### 后续工作

1. 根据使用情况添加更多组件
2. 优化现有配置
3. 添加更多字段
4. 完善可视化组件

---

## 总结

- **配置文档**: `COMPONENT_PANELS_CONFIG.md`提供完整参考
- **推荐方案**: 先实施4个核心组件,后续按需添加
- **预计时间**: 1-2小时完成核心组件
- **验证方法**: 使用验证清单确保质量

**准备好了吗?** 让我们开始实施吧!🚀
