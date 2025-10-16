# 迁移工具脚本

本目录包含用于项目迁移的自动化工具脚本。

## migrate-to-v2.ts

自动化迁移工具,将项目从 1.x 迁移到 2.0。

### 功能

- 自动备份项目文件
- 迁移数据文件格式
- 转换代码API调用
- 更新配置文件
- 生成迁移报告

### 使用方法

#### 1. 干运行 (推荐先执行)

```bash
npm run migrate -- --dry-run
```

这将模拟迁移过程,但不会修改任何文件。

#### 2. 执行迁移

```bash
npm run migrate
```

这将执行实际的迁移,并自动创建备份。

#### 3. 不创建备份

```bash
npm run migrate -- --no-backup
```

跳过备份步骤(不推荐)。

#### 4. 详细输出

```bash
npm run migrate -- --verbose
```

显示每个文件的处理详情。

### 选项

- `--dry-run`: 干运行模式,不修改文件
- `--no-backup`: 不创建备份
- `--verbose` 或 `-v`: 显示详细输出

### 迁移内容

#### 数据文件迁移

- 更新数据版本号
- 转换数据源配置格式
- 转换控件定义结构
- 转换状态管理格式

#### 代码文件迁移

自动转换以下API调用:

1. **数据源API**

   ```typescript
   // 旧版
   dataSource.create({ type: 'api', url: '/api/data' })

   // 新版
   dataFlowEngine.createDataSource({ type: 'api', config: { url: '/api/data' } })
   ```

2. **状态管理API**

   ```typescript
   // 旧版
   store.register('myModule', { state, mutations, actions })

   // 新版
   stateManager.registerModule({ name: 'myModule', state, mutations, actions })
   ```

3. **事件总线API**

   ```typescript
   // 旧版
   import { eventBus } from '@/utils/eventBus'

   // 新版
   import { EventBus } from '@/core/events'
   ```

4. **控件注册API**

   ```typescript
   // 旧版
   registerControl({ kind: 'my-control', ... })

   // 新版
   pluginManager.registerPlugin(new MyControlPlugin())
   ```

5. **API客户端**

   ```typescript
   // 旧版
   axios.get('/api/data')

   // 新版
   apiClient.get('/api/data')
   ```

#### 配置文件更新

- 更新 `package.json` 版本号
- 添加新依赖

### 迁移报告

迁移完成后,会在项目根目录生成 `MIGRATION_REPORT.md`,包含:

- 迁移摘要
- 处理的文件数量
- 修改的文件数量
- 错误列表
- 后续步骤

### 备份

备份文件保存在 `backups/` 目录下,按时间戳命名:

```
backups/
  backup-2024-01-01T12-00-00/
    src/
    public/
    docs/
```

### 回滚

如果迁移出现问题,可以从备份恢复:

```bash
# 查看可用的备份
ls backups/

# 恢复备份
cp -r backups/backup-2024-01-01T12-00-00/* .
```

### 注意事项

1. **在迁移前提交代码**: 确保所有更改已提交到版本控制系统
2. **先执行干运行**: 使用 `--dry-run` 选项预览更改
3. **检查迁移报告**: 仔细阅读生成的迁移报告
4. **运行测试**: 迁移后运行所有测试确保功能正常
5. **手动检查**: 某些复杂场景可能需要手动调整

### 故障排除

#### 迁移失败

如果迁移失败:

1. 查看 `MIGRATION_REPORT.md` 中的错误信息
2. 从备份恢复: `cp -r backups/backup-*/* .`
3. 修复错误后重新运行迁移

#### 部分文件未迁移

某些文件可能需要手动迁移:

1. 复杂的自定义代码
2. 第三方库集成
3. 特殊的配置文件

参考 [迁移指南](../src/core/version/MIGRATION_GUIDE.md) 进行手动迁移。

### 添加到 package.json

在 `package.json` 中添加脚本:

```json
{
  "scripts": {
    "migrate": "ts-node scripts/migrate-to-v2.ts",
    "migrate:dry-run": "ts-node scripts/migrate-to-v2.ts --dry-run",
    "migrate:verbose": "ts-node scripts/migrate-to-v2.ts --verbose"
  }
}
```

### 扩展工具

可以根据项目需求扩展迁移工具:

```typescript
// 添加自定义转换
function customTransform(code: string): string {
  // 实现自定义转换逻辑
  return code
}

// 在 migrateCodeFiles 中使用
const transformations = [
  transformDataSourceAPI,
  transformStateManagementAPI,
  customTransform, // 添加自定义转换
]
```

## 相关文档

- [迁移指南](../src/core/version/MIGRATION_GUIDE.md)
- [版本管理](../src/core/version/README.md)
- [兼容层](../src/core/compat/README.md)
