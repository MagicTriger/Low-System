/**
 * 配置源实现
 * 提供常用的配置源
 */

import type { IConfigSource, ConfigObject } from './types'

/**
 * 对象配置源
 * 从JavaScript对象加载配置
 */
export class ObjectConfigSource implements IConfigSource {
  constructor(
    public readonly name: string,
    private config: ConfigObject,
    public readonly priority: number = 0
  ) {}

  async load(): Promise<ConfigObject> {
    return JSON.parse(JSON.stringify(this.config))
  }

  update(config: ConfigObject): void {
    this.config = config
  }
}

/**
 * 环境变量配置源
 * 从环境变量加载配置
 */
export class EnvironmentConfigSource implements IConfigSource {
  public readonly name = 'environment'
  public readonly priority = 100

  constructor(
    private prefix: string = 'APP_',
    private transform: (key: string, value: string) => any = (k, v) => v
  ) {}

  async load(): Promise<ConfigObject> {
    const config: ConfigObject = {}

    // 在浏览器环境中,使用 import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const env = import.meta.env as Record<string, any>

      for (const [key, value] of Object.entries(env)) {
        if (key.startsWith(this.prefix)) {
          const configKey = this.transformKey(key)
          config[configKey] = this.transform(configKey, String(value))
        }
      }
    }

    // 在Node.js环境中,使用 process.env
    const globalThis_ = globalThis as any
    if (globalThis_.process?.env) {
      const processEnv = globalThis_.process.env as Record<string, string | undefined>
      for (const [key, value] of Object.entries(processEnv)) {
        if (key.startsWith(this.prefix) && value !== undefined) {
          const configKey = this.transformKey(key)
          config[configKey] = this.transform(configKey, value)
        }
      }
    }

    return config
  }

  private transformKey(key: string): string {
    // 移除前缀并转换为小写点分隔格式
    // 例如: APP_API_BASE_URL -> api.baseUrl
    return key
      .slice(this.prefix.length)
      .toLowerCase()
      .split('_')
      .map((part, index) => {
        if (index === 0) return part
        return part.charAt(0).toUpperCase() + part.slice(1)
      })
      .join('.')
      .replace(/\.(.)/g, (_, char) => `.${char.toLowerCase()}`)
  }
}

/**
 * JSON文件配置源
 * 从JSON文件加载配置
 */
export class JsonFileConfigSource implements IConfigSource {
  constructor(
    public readonly name: string,
    private filePath: string,
    public readonly priority: number = 50
  ) {}

  async load(): Promise<ConfigObject> {
    try {
      const response = await fetch(this.filePath)
      if (!response.ok) {
        throw new Error(`Failed to load config file: ${this.filePath}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`[JsonFileConfigSource] Failed to load ${this.filePath}:`, error)
      return {}
    }
  }

  watch(callback: (config: ConfigObject) => void): () => void {
    // 简单的轮询实现
    let lastModified: string | null = null

    const checkUpdate = async () => {
      try {
        const response = await fetch(this.filePath, { method: 'HEAD' })
        const modified = response.headers.get('last-modified')

        if (modified && modified !== lastModified) {
          lastModified = modified
          const config = await this.load()
          callback(config)
        }
      } catch (error) {
        console.error('[JsonFileConfigSource] Watch error:', error)
      }
    }

    const interval = setInterval(checkUpdate, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }
}

/**
 * LocalStorage配置源
 * 从LocalStorage加载配置
 */
export class LocalStorageConfigSource implements IConfigSource {
  public readonly name = 'localStorage'
  public readonly priority = 200

  constructor(private storageKey: string = 'app-config') {}

  async load(): Promise<ConfigObject> {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('[LocalStorageConfigSource] Failed to load:', error)
    }
    return {}
  }

  watch(callback: (config: ConfigObject) => void): () => void {
    const handler = (event: StorageEvent) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const config = JSON.parse(event.newValue)
          callback(config)
        } catch (error) {
          console.error('[LocalStorageConfigSource] Watch error:', error)
        }
      }
    }

    window.addEventListener('storage', handler)

    return () => window.removeEventListener('storage', handler)
  }

  save(config: ConfigObject): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(config))
    } catch (error) {
      console.error('[LocalStorageConfigSource] Failed to save:', error)
    }
  }
}

/**
 * 远程配置源
 * 从远程API加载配置
 */
export class RemoteConfigSource implements IConfigSource {
  constructor(
    public readonly name: string,
    private apiUrl: string,
    public readonly priority: number = 75,
    private pollInterval: number = 60000 // 默认1分钟
  ) {}

  async load(): Promise<ConfigObject> {
    try {
      const response = await fetch(this.apiUrl)
      if (!response.ok) {
        throw new Error(`Failed to load remote config: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[RemoteConfigSource] Failed to load:', error)
      return {}
    }
  }

  watch(callback: (config: ConfigObject) => void): () => void {
    const poll = async () => {
      const config = await this.load()
      callback(config)
    }

    const interval = setInterval(poll, this.pollInterval)

    return () => clearInterval(interval)
  }
}

/**
 * 合并配置源
 * 合并多个配置源
 */
export class MergedConfigSource implements IConfigSource {
  constructor(
    public readonly name: string,
    private sources: IConfigSource[],
    public readonly priority: number = 0
  ) {}

  async load(): Promise<ConfigObject> {
    // 按优先级排序
    const sortedSources = [...this.sources].sort((a, b) => a.priority - b.priority)

    // 加载并合并所有配置
    let merged: ConfigObject = {}

    for (const source of sortedSources) {
      const config = await source.load()
      merged = this.deepMerge(merged, config)
    }

    return merged
  }

  watch(callback: (config: ConfigObject) => void): () => void {
    const unwatchFunctions: Array<() => void> = []

    for (const source of this.sources) {
      if (source.watch) {
        const unwatch = source.watch(async () => {
          const config = await this.load()
          callback(config)
        })
        unwatchFunctions.push(unwatch)
      }
    }

    return () => {
      unwatchFunctions.forEach(unwatch => unwatch())
    }
  }

  private deepMerge(target: ConfigObject, source: ConfigObject): ConfigObject {
    const result = { ...target }

    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.deepMerge((result[key] as ConfigObject) || {}, value as ConfigObject)
      } else {
        result[key] = value
      }
    }

    return result
  }
}
