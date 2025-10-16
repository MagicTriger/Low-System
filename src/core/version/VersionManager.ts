/**
 * 版本管理器 (Version Manager)
 *
 * 管理应用版本、数据迁移和版本兼容性检查
 */

// Logger type - will be provided by the logging module
export type ILogger = {
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

/**
 * 版本信息
 */
export interface Version {
  /**
   * 主版本号
   */
  major: number

  /**
   * 次版本号
   */
  minor: number

  /**
   * 修订号
   */
  patch: number

  /**
   * 预发布标识
   */
  prerelease?: string

  /**
   * 构建元数据
   */
  build?: string
}

/**
 * 迁移脚本
 */
export interface Migration {
  /**
   * 迁移ID
   */
  id: string

  /**
   * 源版本
   */
  fromVersion: string

  /**
   * 目标版本
   */
  toVersion: string

  /**
   * 迁移描述
   */
  description: string

  /**
   * 执行迁移
   */
  up: (data: any) => Promise<any>

  /**
   * 回滚迁移
   */
  down?: (data: any) => Promise<any>

  /**
   * 优先级 (数字越大优先级越高)
   */
  priority?: number
}

/**
 * 迁移历史记录
 */
export interface MigrationRecord {
  /**
   * 迁移ID
   */
  migrationId: string

  /**
   * 执行时间
   */
  executedAt: Date

  /**
   * 执行状态
   */
  status: 'success' | 'failed' | 'rolled_back'

  /**
   * 错误信息
   */
  error?: string

  /**
   * 执行时长 (毫秒)
   */
  duration?: number
}

/**
 * 版本兼容性规则
 */
export interface CompatibilityRule {
  /**
   * 当前版本范围
   */
  currentVersion: string

  /**
   * 兼容的版本范围
   */
  compatibleVersions: string[]

  /**
   * 不兼容的版本范围
   */
  incompatibleVersions?: string[]

  /**
   * 警告信息
   */
  warning?: string
}

/**
 * 版本管理器配置
 */
export interface VersionManagerConfig {
  /**
   * 当前版本
   */
  currentVersion: string

  /**
   * 是否启用自动迁移
   */
  autoMigrate?: boolean

  /**
   * 是否启用版本检查
   */
  enableVersionCheck?: boolean

  /**
   * 持久化键
   */
  persistenceKey?: string
}

/**
 * 版本管理器接口
 */
export interface IVersionManager {
  /**
   * 获取当前版本
   */
  getCurrentVersion(): Version

  /**
   * 注册迁移脚本
   */
  registerMigration(migration: Migration): void

  /**
   * 执行迁移
   */
  migrate(data: any, targetVersion?: string): Promise<any>

  /**
   * 回滚迁移
   */
  rollback(data: any, targetVersion: string): Promise<any>

  /**
   * 检查版本兼容性
   */
  checkCompatibility(version: string): CompatibilityResult

  /**
   * 获取迁移历史
   */
  getMigrationHistory(): MigrationRecord[]

  /**
   * 添加兼容性规则
   */
  addCompatibilityRule(rule: CompatibilityRule): void
}

/**
 * 兼容性检查结果
 */
export interface CompatibilityResult {
  /**
   * 是否兼容
   */
  compatible: boolean

  /**
   * 警告信息
   */
  warnings: string[]

  /**
   * 错误信息
   */
  errors: string[]

  /**
   * 需要的迁移
   */
  requiredMigrations: Migration[]
}

/**
 * 版本管理器实现
 */
export class VersionManager implements IVersionManager {
  private currentVersion: Version
  private migrations = new Map<string, Migration>()
  private migrationHistory: MigrationRecord[] = []
  private compatibilityRules: CompatibilityRule[] = []
  private config: Required<VersionManagerConfig>
  private logger?: ILogger

  constructor(config: VersionManagerConfig, logger?: ILogger) {
    this.config = {
      autoMigrate: true,
      enableVersionCheck: true,
      persistenceKey: 'version_manager',
      ...config,
    }
    this.currentVersion = this.parseVersion(config.currentVersion)
    this.logger = logger

    // 加载迁移历史
    this.loadMigrationHistory()
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(): Version {
    return { ...this.currentVersion }
  }

  /**
   * 注册迁移脚本
   */
  registerMigration(migration: Migration): void {
    this.migrations.set(migration.id, migration)
    this.logger?.info(`Migration registered: ${migration.id} (${migration.fromVersion} -> ${migration.toVersion})`)
  }

  /**
   * 执行迁移
   */
  async migrate(data: any, targetVersion?: string): Promise<any> {
    const target = targetVersion || this.versionToString(this.currentVersion)
    const dataVersion = this.getDataVersion(data)

    this.logger?.info(`Starting migration from ${dataVersion} to ${target}`)

    // 获取需要执行的迁移
    const migrationsToRun = this.getMigrationsToRun(dataVersion, target)

    if (migrationsToRun.length === 0) {
      this.logger?.info('No migrations needed')
      return data
    }

    this.logger?.info(`Found ${migrationsToRun.length} migrations to run`)

    let migratedData = data

    // 按顺序执行迁移
    for (const migration of migrationsToRun) {
      const startTime = Date.now()

      try {
        this.logger?.info(`Running migration: ${migration.id}`)
        migratedData = await migration.up(migratedData)

        const duration = Date.now() - startTime

        // 记录成功的迁移
        this.recordMigration({
          migrationId: migration.id,
          executedAt: new Date(),
          status: 'success',
          duration,
        })

        this.logger?.info(`Migration completed: ${migration.id} (${duration}ms)`)
      } catch (error) {
        const duration = Date.now() - startTime

        // 记录失败的迁移
        this.recordMigration({
          migrationId: migration.id,
          executedAt: new Date(),
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          duration,
        })

        this.logger?.error(`Migration failed: ${migration.id}`, error)
        throw new Error(`Migration failed: ${migration.id} - ${error}`)
      }
    }

    // 更新数据版本
    migratedData = this.setDataVersion(migratedData, target)

    this.logger?.info(`Migration completed successfully to version ${target}`)
    return migratedData
  }

  /**
   * 回滚迁移
   */
  async rollback(data: any, targetVersion: string): Promise<any> {
    const dataVersion = this.getDataVersion(data)

    this.logger?.info(`Starting rollback from ${dataVersion} to ${targetVersion}`)

    // 获取需要回滚的迁移 (逆序)
    const migrationsToRollback = this.getMigrationsToRollback(dataVersion, targetVersion)

    if (migrationsToRollback.length === 0) {
      this.logger?.info('No rollbacks needed')
      return data
    }

    let rolledBackData = data

    // 按逆序执行回滚
    for (const migration of migrationsToRollback) {
      if (!migration.down) {
        throw new Error(`Migration ${migration.id} does not support rollback`)
      }

      const startTime = Date.now()

      try {
        this.logger?.info(`Rolling back migration: ${migration.id}`)
        rolledBackData = await migration.down(rolledBackData)

        const duration = Date.now() - startTime

        // 记录回滚
        this.recordMigration({
          migrationId: migration.id,
          executedAt: new Date(),
          status: 'rolled_back',
          duration,
        })

        this.logger?.info(`Rollback completed: ${migration.id} (${duration}ms)`)
      } catch (error) {
        this.logger?.error(`Rollback failed: ${migration.id}`, error)
        throw new Error(`Rollback failed: ${migration.id} - ${error}`)
      }
    }

    // 更新数据版本
    rolledBackData = this.setDataVersion(rolledBackData, targetVersion)

    this.logger?.info(`Rollback completed successfully to version ${targetVersion}`)
    return rolledBackData
  }

  /**
   * 检查版本兼容性
   */
  checkCompatibility(version: string): CompatibilityResult {
    const result: CompatibilityResult = {
      compatible: true,
      warnings: [],
      errors: [],
      requiredMigrations: [],
    }

    if (!this.config.enableVersionCheck) {
      return result
    }

    const targetVersion = this.parseVersion(version)
    const currentVersionStr = this.versionToString(this.currentVersion)

    // 检查主版本号
    if (targetVersion.major < this.currentVersion.major) {
      result.compatible = false
      result.errors.push(`Version ${version} is not compatible with current version ${currentVersionStr}. ` + `Major version mismatch.`)
    }

    // 检查兼容性规则
    for (const rule of this.compatibilityRules) {
      if (this.matchesVersionRange(version, rule.currentVersion)) {
        // 检查是否在兼容列表中
        const isCompatible = rule.compatibleVersions.some(v => this.matchesVersionRange(currentVersionStr, v))

        // 检查是否在不兼容列表中
        const isIncompatible = rule.incompatibleVersions?.some(v => this.matchesVersionRange(currentVersionStr, v))

        if (isIncompatible) {
          result.compatible = false
          result.errors.push(`Version ${version} is explicitly incompatible with ${currentVersionStr}`)
        } else if (!isCompatible) {
          result.warnings.push(rule.warning || `Version ${version} may not be fully compatible with ${currentVersionStr}`)
        }
      }
    }

    // 获取需要的迁移
    result.requiredMigrations = this.getMigrationsToRun(version, currentVersionStr)

    if (result.requiredMigrations.length > 0) {
      result.warnings.push(`${result.requiredMigrations.length} migration(s) required to upgrade from ${version} to ${currentVersionStr}`)
    }

    return result
  }

  /**
   * 获取迁移历史
   */
  getMigrationHistory(): MigrationRecord[] {
    return [...this.migrationHistory]
  }

  /**
   * 添加兼容性规则
   */
  addCompatibilityRule(rule: CompatibilityRule): void {
    this.compatibilityRules.push(rule)
  }

  /**
   * 解析版本字符串
   */
  private parseVersion(versionStr: string): Version {
    const match = versionStr.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/)

    if (!match) {
      throw new Error(`Invalid version format: ${versionStr}`)
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5],
    }
  }

  /**
   * 版本转字符串
   */
  private versionToString(version: Version): string {
    let str = `${version.major}.${version.minor}.${version.patch}`
    if (version.prerelease) {
      str += `-${version.prerelease}`
    }
    if (version.build) {
      str += `+${version.build}`
    }
    return str
  }

  /**
   * 比较版本
   */
  private compareVersions(v1: Version, v2: Version): number {
    if (v1.major !== v2.major) return v1.major - v2.major
    if (v1.minor !== v2.minor) return v1.minor - v2.minor
    if (v1.patch !== v2.patch) return v1.patch - v2.patch
    return 0
  }

  /**
   * 获取需要执行的迁移
   */
  private getMigrationsToRun(fromVersion: string, toVersion: string): Migration[] {
    const from = this.parseVersion(fromVersion)
    const to = this.parseVersion(toVersion)

    if (this.compareVersions(from, to) >= 0) {
      return []
    }

    const migrations: Migration[] = []

    for (const migration of this.migrations.values()) {
      const migrationFrom = this.parseVersion(migration.fromVersion)
      const migrationTo = this.parseVersion(migration.toVersion)

      // 检查迁移是否在版本范围内
      if (this.compareVersions(migrationFrom, from) >= 0 && this.compareVersions(migrationTo, to) <= 0) {
        migrations.push(migration)
      }
    }

    // 按优先级和版本排序
    migrations.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0)
      if (priorityDiff !== 0) return priorityDiff

      const aFrom = this.parseVersion(a.fromVersion)
      const bFrom = this.parseVersion(b.fromVersion)
      return this.compareVersions(aFrom, bFrom)
    })

    return migrations
  }

  /**
   * 获取需要回滚的迁移
   */
  private getMigrationsToRollback(fromVersion: string, toVersion: string): Migration[] {
    const migrations = this.getMigrationsToRun(toVersion, fromVersion)
    return migrations.reverse()
  }

  /**
   * 获取数据版本
   */
  private getDataVersion(data: any): string {
    return data?.__version || '0.0.0'
  }

  /**
   * 设置数据版本
   */
  private setDataVersion(data: any, version: string): any {
    return {
      ...data,
      __version: version,
    }
  }

  /**
   * 记录迁移
   */
  private recordMigration(record: MigrationRecord): void {
    this.migrationHistory.push(record)
    this.saveMigrationHistory()
  }

  /**
   * 加载迁移历史
   */
  private loadMigrationHistory(): void {
    try {
      const stored = localStorage.getItem(this.config.persistenceKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.migrationHistory = data.history || []
      }
    } catch (error) {
      this.logger?.error('Failed to load migration history', error)
    }
  }

  /**
   * 保存迁移历史
   */
  private saveMigrationHistory(): void {
    try {
      const data = {
        history: this.migrationHistory,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(data))
    } catch (error) {
      this.logger?.error('Failed to save migration history', error)
    }
  }

  /**
   * 匹配版本范围
   */
  private matchesVersionRange(version: string, range: string): boolean {
    // 简化实现,支持基本的版本匹配
    // 实际使用时可以集成 semver 库
    if (range === '*') return true
    if (range === version) return true

    // 支持通配符 (如 2.x, 2.1.x)
    const rangePattern = range.replace(/x/g, '\\d+')
    const regex = new RegExp(`^${rangePattern}$`)
    return regex.test(version)
  }
}
