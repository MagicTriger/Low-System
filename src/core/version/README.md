# 版本管理系统 (Version Manager)

版本管理系统负责管理应用版本、数据迁移和版本兼容性检查,确保在架构升级过程中数据的平滑迁移。

## 核心功能

### 1. 版本管理

- 解析和比较语义化版本 (Semantic Versioning)
- 跟踪当前应用版本
- 管理数据版本

### 2. 数据迁移

- 注册和执行迁移脚本
- 支持迁移回滚
- 记录迁移历史
- 自动化迁移流程

### 3. 版本兼容性检查

- 检查版本兼容性
- 提供兼容性警告和错误
- 识别需要的迁移

## 使用方法

### 基础使用

```typescript
import { VersionManager } from '@/core/version'

// 创建版本管理器
const versionManager = new VersionManager(
  {
    currentVersion: '2.0.0',
    autoMigrate: true,
    enableVersionCheck: true,
  },
  logger
)

// 获取当前版本
const version = versionManager.getCurrentVersion()
console.log(`Current version: ${version.major}.${version.minor}.${version.patch}`)
```

### 注册迁移脚本

```typescript
// 注册迁移脚本
versionManager.registerMigration({
  id: 'migration_1_to_2',
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: '从 1.0 迁移到 2.0',
  priority: 100,

  async up(data) {
    // 执行迁移逻辑
    return {
      ...data,
      newField: 'value',
      __version: '2.0.0',
    }
  },

  async down(data) {
    // 回滚逻辑
    const { newField, ...rest } = data
    return rest
  },
})
```

### 执行迁移

```typescript
// 加载旧版本数据
const oldData = {
  __version: '1.0.0',
  // ... 其他数据
}

// 执行迁移到最新版本
const migratedData = await versionManager.migrate(oldData)

// 或迁移到指定版本
const migratedData = await versionManager.migrate(oldData, '2.1.0')
```

### 回滚迁移

```typescript
// 回滚到指定版本
const rolledBackData = await versionManager.rollback(currentData, '1.0.0')
```

### 检查版本兼容性

```typescript
// 检查版本兼容性
const result = versionManager.checkCompatibility('1.5.0')

if (!result.compatible) {
  console.error('Incompatible version:', result.errors)
} else if (result.warnings.length > 0) {
  console.warn('Compatibility warnings:', result.warnings)
}

// 显示需要的迁移
if (result.requiredMigrations.length > 0) {
  console.log('Required migrations:')
  result.requiredMigrations.forEach(m => {
    console.log(`  - ${m.id}: ${m.description}`)
  })
}
```

### 添加兼容性规则

```typescript
// 添加兼容性规则
versionManager.addCompatibilityRule({
  currentVersion: '2.x',
  compatibleVersions: ['2.0.x', '2.1.x', '2.2.x'],
  incompatibleVersions: ['1.x'],
  warning: 'Version 2.x requires data migration from 1.x',
})
```

### 查看迁移历史

```typescript
// 获取迁移历史
const history = versionManager.getMigrationHistory()

history.forEach(record => {
  console.log(`${record.migrationId}: ${record.status} at ${record.executedAt}`)
  if (record.duration) {
    console.log(`  Duration: ${record.duration}ms`)
  }
  if (record.error) {
    console.log(`  Error: ${record.error}`)
  }
})
```

## 迁移脚本编写

### 基本结构

```typescript
import type { Migration } from '@/core/version'

export const myMigration: Migration = {
  id: 'unique_migration_id',
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: '迁移描述',
  priority: 100, // 可选,数字越大优先级越高

  async up(data: any) {
    // 向上迁移逻辑
    // 将数据从旧格式转换为新格式
    return transformedData
  },

  async down(data: any) {
    // 向下迁移逻辑 (可选)
    // 将数据从新格式转换回旧格式
    return revertedData
  },
}
```

### 数据源配置迁移示例

```typescript
export const migrateDataSource: Migration = {
  id: 'migrate_datasource_v2',
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: '迁移数据源配置到新格式',

  async up(data: any) {
    if (!data.dataSources) return data

    return {
      ...data,
      dataSources: data.dataSources.map((ds: any) => ({
        id: ds.id,
        type: ds.type,
        config: {
          ...ds.config,
          // 添加新字段
          caching: {
            enabled: true,
            ttl: 300,
          },
        },
        metadata: {
          version: '2.0.0',
          migratedAt: new Date().toISOString(),
        },
      })),
    }
  },

  async down(data: any) {
    if (!data.dataSources) return data

    return {
      ...data,
      dataSources: data.dataSources.map((ds: any) => {
        const { caching, ...config } = ds.config
        const { metadata, ...rest } = ds
        return {
          ...rest,
          config,
        }
      }),
    }
  },
}
```

### 控件定义迁移示例

```typescript
export const migrateControls: Migration = {
  id: 'migrate_controls_v2',
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: '迁移控件定义到新格式',

  async up(data: any) {
    if (!data.controls) return data

    return {
      ...data,
      controls: data.controls.map((ctrl: any) => ({
        kind: ctrl.kind,
        kindName: ctrl.kindName || ctrl.name,
        category: ctrl.category || 'basic',
        // 重命名字段
        properties: ctrl.props || ctrl.properties,
        // 添加新字段
        version: '2.0.0',
        metadata: {
          migratedFrom: '1.0.0',
        },
      })),
    }
  },

  async down(data: any) {
    if (!data.controls) return data

    return {
      ...data,
      controls: data.controls.map((ctrl: any) => {
        const { version, metadata, properties, ...rest } = ctrl
        return {
          ...rest,
          props: properties,
        }
      }),
    }
  },
}
```

### 复杂迁移示例

```typescript
export const complexMigration: Migration = {
  id: 'complex_migration_v2',
  fromVersion: '1.5.0',
  toVersion: '2.0.0',
  description: '复杂的数据结构迁移',

  async up(data: any) {
    const migrated = { ...data }

    // 1. 迁移嵌套结构
    if (migrated.pages) {
      migrated.pages = await Promise.all(
        migrated.pages.map(async (page: any) => {
          // 异步处理每个页面
          const controls = await migratePageControls(page.controls)
          return {
            ...page,
            controls,
            version: '2.0.0',
          }
        })
      )
    }

    // 2. 重构数据关系
    if (migrated.relationships) {
      migrated.relationships = migrated.relationships.map((rel: any) => ({
        id: rel.id,
        source: { type: 'control', id: rel.sourceId },
        target: { type: 'control', id: rel.targetId },
        type: rel.relationType,
      }))
    }

    // 3. 合并配置
    if (migrated.config && migrated.settings) {
      migrated.configuration = {
        ...migrated.config,
        ...migrated.settings,
      }
      delete migrated.config
      delete migrated.settings
    }

    return migrated
  },

  async down(data: any) {
    // 实现回滚逻辑
    // ...
  },
}
```

## 预定义迁移

系统提供了一些预定义的迁移脚本:

### 从 1.x 到 2.0

```typescript
import { migration_1x_to_2_0 } from '@/core/version/DataMigrations'

versionManager.registerMigration(migration_1x_to_2_0)
```

主要变更:

- 数据源配置格式变更
- 控件定义结构变更
- 状态管理格式变更

### 从 2.0 到 2.1

```typescript
import { migration_2_0_to_2_1 } from '@/core/version/DataMigrations'

versionManager.registerMigration(migration_2_0_to_2_1)
```

主要变更:

- 添加插件系统支持
- 优化数据流配置

### 注册所有迁移

```typescript
import { registerAllMigrations } from '@/core/version/DataMigrations'

registerAllMigrations(versionManager)
```

## 版本格式

系统使用语义化版本 (Semantic Versioning):

```
major.minor.patch[-prerelease][+build]
```

示例:

- `1.0.0` - 正式版本
- `2.1.3` - 正式版本
- `2.0.0-beta.1` - 预发布版本
- `2.0.0+20240101` - 带构建元数据的版本

### 版本比较规则

1. 主版本号 (major) 优先级最高
2. 次版本号 (minor) 次之
3. 修订号 (patch) 最低
4. 预发布版本低于正式版本

## 最佳实践

### 1. 迁移脚本命名

使用清晰的命名约定:

```typescript
migration_ < from > _to_<to>
```

例如: `migration_1_0_to_2_0`

### 2. 提供回滚支持

尽可能为每个迁移提供 `down` 方法,以支持回滚:

```typescript
async down(data: any) {
  // 实现回滚逻辑
}
```

### 3. 设置优先级

当多个迁移可能冲突时,使用优先级控制执行顺序:

```typescript
{
  priority: 100, // 数字越大优先级越高
}
```

### 4. 记录详细信息

提供清晰的描述和日志:

```typescript
{
  description: '详细描述迁移的内容和原因',
}
```

### 5. 测试迁移

在生产环境使用前,充分测试迁移脚本:

```typescript
// 测试向上迁移
const migrated = await migration.up(testData)
assert.equal(migrated.__version, '2.0.0')

// 测试向下迁移
const reverted = await migration.down(migrated)
assert.deepEqual(reverted, testData)
```

### 6. 处理边界情况

考虑各种边界情况:

```typescript
async up(data: any) {
  // 检查数据是否存在
  if (!data.field) {
    return data
  }

  // 检查是否已经迁移
  if (data.__version === '2.0.0') {
    return data
  }

  // 执行迁移
  // ...
}
```

### 7. 保持向后兼容

在可能的情况下,保持向后兼容:

```typescript
async up(data: any) {
  return {
    ...data,
    // 保留旧字段
    oldField: data.oldField,
    // 添加新字段
    newField: data.oldField,
  }
}
```

## 集成示例

### 应用启动时自动迁移

```typescript
import { VersionManager, registerAllMigrations } from '@/core/version'

async function initializeApp() {
  // 创建版本管理器
  const versionManager = new VersionManager(
    {
      currentVersion: '2.0.0',
      autoMigrate: true,
    },
    logger
  )

  // 注册所有迁移
  registerAllMigrations(versionManager)

  // 加载用户数据
  const userData = await loadUserData()

  // 检查版本兼容性
  const dataVersion = userData.__version || '1.0.0'
  const compatibility = versionManager.checkCompatibility(dataVersion)

  if (!compatibility.compatible) {
    throw new Error(`Incompatible data version: ${dataVersion}`)
  }

  // 执行迁移
  if (compatibility.requiredMigrations.length > 0) {
    console.log(`Migrating data from ${dataVersion} to 2.0.0...`)
    const migratedData = await versionManager.migrate(userData)
    await saveUserData(migratedData)
    console.log('Migration completed successfully')
  }

  // 继续应用初始化
  // ...
}
```

### 与特性开关集成

```typescript
import { FeatureFlags, FEATURE_FLAGS } from '@/core/features'
import { VersionManager } from '@/core/version'

// 根据版本启用特性
const version = versionManager.getCurrentVersion()

if (version.major >= 2) {
  featureFlags.enable(FEATURE_FLAGS.NEW_DATA_FLOW_ENGINE)
  featureFlags.enable(FEATURE_FLAGS.NEW_RENDER_ENGINE)
}
```

## 注意事项

1. **备份数据**: 在执行迁移前,始终备份原始数据
2. **测试充分**: 在生产环境使用前,充分测试迁移脚本
3. **渐进式迁移**: 对于大型数据集,考虑分批迁移
4. **监控迁移**: 记录迁移过程和结果,便于问题排查
5. **提供回滚**: 确保可以回滚到之前的版本
6. **文档化**: 记录每个版本的变更和迁移步骤

## 相关文档

- [兼容层](../compat/README.md)
- [特性开关](../features/README.md)
- [迁移指南](./MIGRATION_GUIDE.md)
