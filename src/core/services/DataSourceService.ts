import type { DataSourceOption } from '@/types'

/**
 * 数据源服务
 * 负责实际的数据获取逻辑
 */
export class DataSourceService {
  /**
   * 从数据源获取数据
   */
  async fetchData(dataSource: DataSourceOption): Promise<any> {
    switch (dataSource.type) {
      case 'api':
        return this.fetchFromAPI(dataSource)
      case 'static':
        return this.fetchFromStatic(dataSource)
      case 'mock':
        return this.fetchFromMock(dataSource)
      default:
        throw new Error(`不支持的数据源类型: ${dataSource.type}`)
    }
  }

  /**
   * 从API获取数据
   */
  private async fetchFromAPI(dataSource: DataSourceOption): Promise<any> {
    const { url, method = 'GET', headers = {}, params = {} } = dataSource

    if (!url) {
      throw new Error('API地址不能为空')
    }

    try {
      // 构建URL（如果是GET请求，添加查询参数）
      let requestUrl = url
      if (method === 'GET' && Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params as any).toString()
        requestUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`
      }

      // 发送请求
      const response = await fetch(requestUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method !== 'GET' ? JSON.stringify(params) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      throw new Error(`API请求失败: ${error.message}`)
    }
  }

  /**
   * 从静态数据获取
   */
  private async fetchFromStatic(dataSource: DataSourceOption): Promise<any> {
    const { data } = dataSource

    if (!data) {
      throw new Error('静态数据不能为空')
    }

    // 如果是字符串，尝试解析为JSON
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch (error) {
        throw new Error('静态数据格式错误，无法解析为JSON')
      }
    }

    // 返回数据的副本
    return JSON.parse(JSON.stringify(data))
  }

  /**
   * 从Mock数据获取
   */
  private async fetchFromMock(dataSource: DataSourceOption): Promise<any> {
    // 这里可以集成Mock.js或其他mock库
    // 暂时返回示例数据
    const mockTemplate = (dataSource.metadata as any)?.mockTemplate || dataSource.data

    if (!mockTemplate) {
      throw new Error('Mock模板不能为空')
    }

    // 简单的mock实现
    // 实际项目中应该使用Mock.js等库
    if (typeof mockTemplate === 'string') {
      try {
        const template = JSON.parse(mockTemplate)
        return this.generateMockData(template)
      } catch (error) {
        throw new Error('Mock模板格式错误')
      }
    }

    return this.generateMockData(mockTemplate)
  }

  /**
   * 生成Mock数据（简单实现）
   */
  private generateMockData(template: any): any {
    // 这是一个简化的实现
    // 实际项目中应该使用Mock.js等专业库
    if (Array.isArray(template)) {
      return template.map(item => this.generateMockData(item))
    }

    if (typeof template === 'object' && template !== null) {
      const result: any = {}
      for (const key in template) {
        const value = template[key]
        if (typeof value === 'string' && value.startsWith('@')) {
          // 简单的mock规则
          result[key] = this.generateMockValue(value)
        } else {
          result[key] = this.generateMockData(value)
        }
      }
      return result
    }

    return template
  }

  /**
   * 生成Mock值
   */
  private generateMockValue(rule: string): any {
    switch (rule) {
      case '@id':
        return Math.floor(Math.random() * 10000)
      case '@name':
        return `User${Math.floor(Math.random() * 100)}`
      case '@email':
        return `user${Math.floor(Math.random() * 100)}@example.com`
      case '@age':
        return Math.floor(Math.random() * 60) + 18
      case '@date':
        return new Date().toISOString()
      case '@boolean':
        return Math.random() > 0.5
      default:
        return rule
    }
  }

  /**
   * 测试数据源连接
   */
  async testConnection(dataSource: DataSourceOption): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const data = await this.fetchData(dataSource)
      return {
        success: true,
        message: '连接成功',
        data,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      }
    }
  }
}

// 导出单例
export const dataSourceService = new DataSourceService()
