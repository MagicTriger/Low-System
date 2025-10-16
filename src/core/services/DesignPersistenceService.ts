import type { RootView, DataSourceOption, DataFlow, DataAction, DesignDTO } from '@/types'

/**
 * 设计持久化服务
 * 负责保存和加载设计配置
 */
export class DesignPersistenceService {
  /**
   * 保存设计
   */
  async saveDesign(design: DesignDTO): Promise<void> {
    try {
      // 这里应该调用实际的API保存到服务器
      // 暂时保存到localStorage
      const designData = JSON.stringify(design, null, 2)
      localStorage.setItem('current_design', designData)
      console.log('设计已保存', design)
    } catch (error: any) {
      throw new Error(`保存设计失败: ${error.message}`)
    }
  }

  /**
   * 加载设计
   */
  async loadDesign(id?: string): Promise<DesignDTO | null> {
    try {
      // 这里应该调用实际的API从服务器加载
      // 暂时从localStorage加载
      const designData = localStorage.getItem('current_design')
      if (!designData) {
        return null
      }

      const design = JSON.parse(designData) as DesignDTO
      console.log('设计已加载', design)
      return design
    } catch (error: any) {
      throw new Error(`加载设计失败: ${error.message}`)
    }
  }

  /**
   * 导出设计为JSON文件
   */
  exportDesign(design: DesignDTO, filename?: string): void {
    try {
      const designData = JSON.stringify(design, null, 2)
      const blob = new Blob([designData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `design_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      throw new Error(`导出设计失败: ${error.message}`)
    }
  }

  /**
   * 从JSON文件导入设计
   */
  async importDesign(file: File): Promise<DesignDTO> {
    try {
      const text = await file.text()
      const design = JSON.parse(text) as DesignDTO

      // 验证设计数据
      if (!design.rootView) {
        throw new Error('无效的设计文件：缺少rootView')
      }

      return design
    } catch (error: any) {
      throw new Error(`导入设计失败: ${error.message}`)
    }
  }

  /**
   * 创建设计快照
   */
  createSnapshot(design: DesignDTO): string {
    return JSON.stringify(design)
  }

  /**
   * 从快照恢复设计
   */
  restoreFromSnapshot(snapshot: string): DesignDTO {
    return JSON.parse(snapshot) as DesignDTO
  }
}

// 导出单例
export const designPersistenceService = new DesignPersistenceService()
