# 🧪 快速测试指南

## 🎯 本次修复内容

1. ✅ **实时更新和持久化** - 属性修改立即生效,自动保存
2. ✅ **DomSizeRenderer集成** - 宽度/高度字段带单位选择器
3. ✅ **ID/Name只读** - ID和Name字段不可编辑
4. ✅ **图标和按钮状态** - 图标选择和开关状态正确更新

---

## 🚀 快速测试步骤

### 1. 刷新浏览器

```
Ctrl + Shift + R (强制刷新)
```

### 2. 测试实时更新

1. 拖拽Button到画布
2. 修改"按钮文本"为"测试按钮"
3. **预期**: 画布中的按钮文字立即改变 ✅

### 3. 测试持久化

1. 刷新浏览器(F5)
2. **预期**: 设计自动恢复,按钮还在 ✅

### 4. 测试尺寸字段

1. 选中Button
2. 找到"宽度"字段
3. **预期**: 看到数字输入框 + 单位选择器 ✅
4. 输入100,选择"像素"
5. **预期**: 按钮宽度变为100px ✅

### 5. 测试ID/Name只读

1. 选中Button
2. 查看"基础属性"
3. **预期**: ID和Name字段是灰色的,无法编辑 ✅

### 6. 测试图标选择

1. 选中Button
2. 找到"图标"字段
3. 点击"选择"按钮
4. 选择一个图标(如HomeOutlined)
5. 点击"确定"
6. **预期**: 按钮上显示图标 ✅

### 7. 测试按钮状态

1. 选中Button
2. 打开"危险按钮"开关
3. **预期**: 按钮变红色 ✅
4. 打开"加载状态"开关
5. **预期**: 按钮显示加载动画 ✅

---

## ✅ 成功标准

所有测试通过后:

- ✅ 属性修改立即生效
- ✅ 刷新后设计自动恢复
- ✅ 尺寸字段有单位选择器
- ✅ ID和Name不可编辑
- ✅ 图标选择正常工作
- ✅ 所有开关状态正常工作

---

## 🔍 如果有问题

### 查看控制台日志

应该看到:

```
✅ [Persistence] Data loaded from localStorage
✅ [Persistence] Auto-save started
🔧 [DesignerNew] 属性更新: text = 测试按钮
✅ 按钮文本已更新: 测试按钮
🔄 [updateControl] Updating control: button_xxx
✅ [updateControl] View updated, triggering re-render
```

### 检查localStorage

1. 打开开发者工具(F12)
2. Application → Local Storage
3. 查找`designer_data`键
4. 应该有完整的设计数据

---

## 🎊 测试完成!

如果所有测试都通过,恭喜!所有功能都正常工作了! 🚀

如果有任何问题,请查看详细文档:

- `REALTIME_AND_PERSISTENCE_TEST_GUIDE.md`
- `DOM_SIZE_RENDERER_INTEGRATION.md`
- `ID_NAME_READONLY_AND_ICON_FIX.md`
