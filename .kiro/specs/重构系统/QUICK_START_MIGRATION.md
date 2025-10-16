# 🚀 迁移快速启动指南

## 5分钟快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动应用

```bash
npm run dev:designer
```

应用启动时会自动:

- ✅ 初始化迁移系统
- ✅ 启用兼容层
- ✅ 初始化特性开关
- ✅ 检查并迁移数据

### 3. 查看迁移状态

在浏览器中打开应用后,右下角会显示迁移状态监控面板(仅开发环境):

```
🔄 Migration System Status
├── 📦 Compatibility Layer: ✅ Enabled
├── 🎛️ Feature Flags: 15 flags registered
└── 📋 Version Manager: v2.0.0
```

点击展开可以查看详细信息。

### 4. 测试兼容层

打开浏览器控制台,测试兼容层:

```javascript
// 获取兼容层
const compatLayer = window.__MIGRATION_SYSTEM__.compatLayer

// 测试旧版API转换
compatLayer
  .adapt({
    name: 'dataSource.create',
    args: [{ type: 'api', url: '/api/data' }],
  })
  .then(result => {
    console.log('API adapted:', result)
  })
```

### 5. 测试特性开关

```javascript
// 获取特性开关
const featureFlags = window.__MIGRATION_SYSTEM__.featureFlags

// 查看所有特性
console.table(featureFlags.getAllFlags())

// 检查特性是否启用
console.log('New API Client:', featureFlags.isEnabled('new_api_client'))

// 启用/禁用特性
featureFlags.enable('new_data_flow_engine')
featureFlags.disable('new_data_flow_engine')
```

## 常用命令

### 开发

```bash
# 启动设计器
npm run dev:designer

# 启动管理器
npm run dev:manager

# 启动移动端
npm run dev:mobile
```

### 迁移

```bash
# 干运行(预览更改)
npm run migrate:dry-run

# 执行迁移
npm run migrate

# 详细输出
npm run migrate:verbose
```

### 构建

```bash
# 构建设计器
npm run build:designer

# 构建管理器
npm run build:manager

# 构建移动端
npm run build:mobile
```

### 代码质量

```bash
# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 核心概念

### 兼容层

兼容层自动将旧版API调用转换为新版API调用:

```typescript
// 旧版代码(仍然工作)
dataSource.create({ type: 'api', url: '/api/data' })

// 兼容层自动转换为
dataFlowEngine.createDataSource({
  type: 'api',
  config: { url: '/api/data' },
})
```

### 特性开关

特性开关控制新旧实现的切换:

```typescript
if (featureFlags.isEnabled('new_data_flow_engine')) {
  // 使用新实现
  return newEngine.process(data)
} else {
  // 使用旧实现
  return oldEngine.process(data)
}
```

### 版本管理

版本管理自动迁移数据格式:

```typescript
// 旧版数据
const oldData = {
  __version: '1.0.0',
  dataSources: [
    /* ... */
  ],
}

// 自动迁移到新版
const newData = await versionManager.migrate(oldData)
// newData.__version === '2.0.0'
```

## 开发工作流

### 1. 编写新功能

```typescript
// 1. 实现新功能
class NewFeature {
  // ...
}

// 2. 注册到容器
container.register(NewFeature)

// 3. 注册到兼容层
compatLayer.registerApi('NewFeature', newFeature)

// 4. 添加特性开关
featureFlags.register({
  name: 'new_feature',
  enabled: false, // 默认禁用
})
```

### 2. 测试新功能

```typescript
// 在开发环境启用特性
if (import.meta.env.DEV) {
  featureFlags.enable('new_feature')
}

// 使用特性开关
if (featureFlags.isEnabled('new_feature')) {
  // 测试新功能
}
```

### 3. 灰度发布

```typescript
// 配置灰度发布(10%用户)
featureFlags.register({
  name: 'new_feature',
  enabled: true,
  conditions: [
    {
      type: 'percentage',
      params: { percentage: 10 },
    },
  ],
})
```

### 4. 全量发布

```typescript
// 移除条件,全量发布
featureFlags.register({
  name: 'new_feature',
  enabled: true,
  conditions: [],
})
```

### 5. 清理旧代码

```typescript
// 移除特性开关
featureFlags.unregister('new_feature')

// 移除兼容层映射
// 删除旧代码
```

## 调试技巧

### 1. 查看迁移日志

打开浏览器控制台,查看迁移系统的日志输出:

```
🚀 Initializing Migration System...
📦 Initializing Compatibility Layer...
✓ Compatibility Layer initialized
🎛️  Initializing Feature Flags...
✓ Feature Flags initialized
  Registered 15 feature flags
📋 Initializing Version Manager...
✓ Version Manager initialized
✅ Migration System initialized successfully
```

### 2. 使用监控面板

点击右下角的监控面板,可以:

- 查看所有特性开关状态
- 查看迁移历史
- 导出状态信息
- 刷新状态

### 3. 使用浏览器DevTools

```javascript
// 全局访问迁移系统
window.__MIGRATION_SYSTEM__ = {
  compatLayer: getGlobalCompatLayer(),
  featureFlags: getGlobalFeatureFlags(),
  versionManager: getVersionManager(),
}
```

### 4. 启用详细日志

```typescript
// 在bootstrap.ts中设置
const migrationSystem = await initializeGlobalMigrationSystem({
  verbose: true, // 启用详细日志
})
```

## 常见问题

### Q: 如何知道哪些API需要迁移?

A: 使用代码扫描工具:

```bash
npm run migrate:dry-run
```

查看生成的报告,会列出所有需要迁移的API。

### Q: 如何回滚迁移?

A: 从备份恢复:

```bash
# 查看备份
ls backups/

# 恢复备份
cp -r backups/backup-2025-10-12/* .
```

### Q: 如何禁用迁移系统?

A: 在bootstrap.ts中设置:

```typescript
const migrationSystem = await initializeGlobalMigrationSystem({
  enableCompatLayer: false,
  enableFeatureFlags: false,
  enableVersionManager: false,
})
```

### Q: 性能会受影响吗?

A: 兼容层会带来约5%的性能开销,但这是临时的。迁移完成后移除兼容层即可。

## 下一步

1. ✅ 启动应用,验证迁移系统
2. ⏳ 查看[迁移计划](MIGRATION_PLAN.md)
3. ⏳ 阅读[迁移指南](src/core/version/MIGRATION_GUIDE.md)
4. ⏳ 开始迁移核心服务

## 获取帮助

- 📖 [完整文档](src/core/migration/README.md)
- 📋 [迁移计划](MIGRATION_PLAN.md)
- 📊 [进度追踪](MIGRATION_PROGRESS.md)
- 🎯 [迁移指南](src/core/version/MIGRATION_GUIDE.md)

---

**祝迁移顺利！** 🎉
