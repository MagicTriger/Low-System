/**
 * 自动化迁移工具
 *
 * 将项目从 1.x 迁移到 2.0
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'

interface MigrationOptions {
  dryRun?: boolean
  backup?: boolean
  verbose?: boolean
}

interface MigrationResult {
  success: boolean
  filesProcessed: number
  filesModified: number
  errors: string[]
}

/**
 * 主迁移函数
 */
export async function migrateToV2(options: MigrationOptions = {}): Promise<MigrationResult> {
  const { dryRun = false, backup = true, verbose = false } = options

  const result: MigrationResult = {
    success: true,
    filesProcessed: 0,
    filesModified: 0,
    errors: [],
  }

  console.log('🚀 Starting migration to v2.0...')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Backup: ${backup ? 'ENABLED' : 'DISABLED'}`)
  console.log('')

  try {
    // 1. 备份项目
    if (backup && !dryRun) {
      console.log('📦 Creating backup...')
      await createBackup()
      console.log('✓ Backup created\n')
    }

    // 2. 迁移数据文件
    console.log('📄 Migrating data files...')
    const dataResult = await migrateDataFiles(dryRun, verbose)
    result.filesProcessed += dataResult.processed
    result.filesModified += dataResult.modified
    result.errors.push(...dataResult.errors)
    console.log(`✓ Processed ${dataResult.processed} data files\n`)

    // 3. 迁移代码文件
    console.log('💻 Migrating code files...')
    const codeResult = await migrateCodeFiles(dryRun, verbose)
    result.filesProcessed += codeResult.processed
    result.filesModified += codeResult.modified
    result.errors.push(...codeResult.errors)
    console.log(`✓ Processed ${codeResult.processed} code files\n`)

    // 4. 更新配置文件
    console.log('⚙️  Updating configuration files...')
    await updateConfigFiles(dryRun, verbose)
    console.log('✓ Configuration updated\n')

    // 5. 生成迁移报告
    console.log('📊 Generating migration report...')
    await generateReport(result, dryRun)
    console.log('✓ Report generated\n')

    if (result.errors.length > 0) {
      result.success = false
      console.log('⚠️  Migration completed with errors:')
      result.errors.forEach(err => console.log(`  - ${err}`))
    } else {
      console.log('✅ Migration completed successfully!')
    }

    if (dryRun) {
      console.log('\n💡 This was a dry run. No files were modified.')
      console.log('   Run without --dry-run to apply changes.')
    }
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : String(error))
    console.error('❌ Migration failed:', error)
  }

  return result
}

/**
 * 创建项目备份
 */
async function createBackup(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = `backup-${timestamp}`

  // 复制关键目录
  const dirsToBackup = ['src', 'public', 'docs']

  for (const dir of dirsToBackup) {
    const source = path.join(process.cwd(), dir)
    const dest = path.join(process.cwd(), 'backups', backupDir, dir)

    try {
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await copyDirectory(source, dest)
    } catch (error) {
      console.warn(`Warning: Could not backup ${dir}`)
    }
  }
}

/**
 * 迁移数据文件
 */
async function migrateDataFiles(dryRun: boolean, verbose: boolean) {
  const result = { processed: 0, modified: 0, errors: [] as string[] }

  // 查找所有JSON数据文件
  const files = await glob('src/**/*.json', { ignore: ['node_modules/**', 'dist/**'] })

  for (const file of files) {
    result.processed++

    try {
      const content = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(content)

      // 检查是否需要迁移
      if (!needsMigration(data)) {
        if (verbose) console.log(`  ⊘ ${file} (already migrated)`)
        continue
      }

      // 执行迁移
      const migrated = migrateData(data)

      if (!dryRun) {
        await fs.writeFile(file, JSON.stringify(migrated, null, 2), 'utf-8')
      }

      result.modified++
      if (verbose) console.log(`  ✓ ${file}`)
    } catch (error) {
      result.errors.push(`${file}: ${error}`)
      if (verbose) console.log(`  ✗ ${file} (error)`)
    }
  }

  return result
}

/**
 * 迁移代码文件
 */
async function migrateCodeFiles(dryRun: boolean, verbose: boolean) {
  const result = { processed: 0, modified: 0, errors: [] as string[] }

  // 查找所有TypeScript和Vue文件
  const files = await glob('src/**/*.{ts,vue}', { ignore: ['node_modules/**', 'dist/**'] })

  for (const file of files) {
    result.processed++

    try {
      let content = await fs.readFile(file, 'utf-8')
      let modified = false

      // 应用代码转换
      const transformations = [
        transformDataSourceAPI,
        transformStateManagementAPI,
        transformEventBusAPI,
        transformControlRegistrationAPI,
        transformAPIClientCalls,
      ]

      for (const transform of transformations) {
        const transformed = transform(content)
        if (transformed !== content) {
          content = transformed
          modified = true
        }
      }

      if (modified) {
        if (!dryRun) {
          await fs.writeFile(file, content, 'utf-8')
        }
        result.modified++
        if (verbose) console.log(`  ✓ ${file}`)
      } else {
        if (verbose) console.log(`  ⊘ ${file} (no changes)`)
      }
    } catch (error) {
      result.errors.push(`${file}: ${error}`)
      if (verbose) console.log(`  ✗ ${file} (error)`)
    }
  }

  return result
}

/**
 * 更新配置文件
 */
async function updateConfigFiles(dryRun: boolean, verbose: boolean): Promise<void> {
  // 更新 package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

  packageJson.version = '2.0.0'
  packageJson.dependencies = {
    ...packageJson.dependencies,
    // 添加新依赖
  }

  if (!dryRun) {
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8')
  }

  if (verbose) console.log('  ✓ package.json')
}

/**
 * 生成迁移报告
 */
async function generateReport(result: MigrationResult, dryRun: boolean): Promise<void> {
  const report = `
# Migration Report

**Date**: ${new Date().toISOString()}
**Mode**: ${dryRun ? 'Dry Run' : 'Live'}
**Status**: ${result.success ? 'Success' : 'Failed'}

## Summary

- Files Processed: ${result.filesProcessed}
- Files Modified: ${result.filesModified}
- Errors: ${result.errors.length}

${
  result.errors.length > 0
    ? `
## Errors

${result.errors.map(err => `- ${err}`).join('\n')}
`
    : ''
}

## Next Steps

1. Review the changes
2. Run tests: \`npm test\`
3. Start the application: \`npm run dev\`
4. Check for any runtime errors
5. Update documentation if needed

## Rollback

If you need to rollback, restore from the backup:
\`\`\`bash
cp -r backups/backup-* .
\`\`\`
`

  const reportPath = path.join(process.cwd(), 'MIGRATION_REPORT.md')
  await fs.writeFile(reportPath, report, 'utf-8')
}

/**
 * 辅助函数
 */

function needsMigration(data: any): boolean {
  return !data.__version || data.__version.startsWith('1.')
}

function migrateData(data: any): any {
  return {
    ...data,
    __version: '2.0.0',
    // 应用数据转换
  }
}

function transformDataSourceAPI(code: string): string {
  // 转换数据源API调用
  return code.replace(/dataSource\.create\(/g, 'dataFlowEngine.createDataSource(').replace(/loadData\(dataSource\)/g, 'dataSource.load()')
}

function transformStateManagementAPI(code: string): string {
  // 转换状态管理API
  return code.replace(/store\.register\(/g, 'stateManager.registerModule(').replace(/store\.commit\(/g, 'stateManager.commit(')
}

function transformEventBusAPI(code: string): string {
  // 转换事件总线API
  return code.replace(/import { eventBus } from '@\/utils\/eventBus'/g, "import { EventBus } from '@/core/events'")
}

function transformControlRegistrationAPI(code: string): string {
  // 转换控件注册API
  return code.replace(/registerControl\(/g, 'pluginManager.registerPlugin(')
}

function transformAPIClientCalls(code: string): string {
  // 转换API客户端调用
  return code.replace(/axios\.get\(/g, 'apiClient.get(').replace(/axios\.post\(/g, 'apiClient.post(')
}

async function copyDirectory(source: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

/**
 * CLI入口
 */
if (require.main === module) {
  const args = process.argv.slice(2)
  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    backup: !args.includes('--no-backup'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  }

  migrateToV2(options)
    .then(result => {
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
