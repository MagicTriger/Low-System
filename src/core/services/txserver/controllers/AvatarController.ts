import { Request, Response } from 'express'
import { FileStorageService } from '../services/FileStorageService'
import { ImageProcessingService } from '../services/ImageProcessingService'
import { AvatarService } from '../services/AvatarService'
import { Logger } from '../../../logging/Logger'

const logger = new Logger('AvatarController')

export class AvatarController {
  private fileStorage: FileStorageService
  private imageProcessing: ImageProcessingService
  private avatarService: AvatarService

  constructor() {
    this.fileStorage = new FileStorageService()
    this.imageProcessing = new ImageProcessingService()
    this.avatarService = new AvatarService()
  }

  /**
   * 上传头像
   */
  async uploadAvatar(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      const file = req.file

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权',
        })
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: '未上传文件',
        })
      }

      logger.info(`用户 ${userId} 开始上传头像`)

      // 1. 验证文件内容
      const isValid = await this.imageProcessing.validateImage(file.buffer)
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: '无效的图片文件',
        })
      }

      // 2. 处理图片(压缩、清除EXIF)
      const processedImage = await this.imageProcessing.processAvatar(file.buffer)

      // 3. 生成缩略图
      const thumbnail = await this.imageProcessing.generateThumbnail(file.buffer)

      // 4. 保存文件
      const avatarUrl = await this.fileStorage.saveAvatar(userId, processedImage, 'avatar.jpg')

      const thumbnailUrl = await this.fileStorage.saveAvatar(userId, thumbnail, 'avatar_thumb.jpg')

      // 5. 更新数据库
      await this.avatarService.updateUserAvatar(userId, {
        avatarUrl,
        thumbnailUrl,
        fileSize: processedImage.length,
        mimeType: 'image/jpeg',
      })

      logger.info(`用户 ${userId} 头像上传成功`)

      res.status(201).json({
        success: true,
        message: '头像上传成功',
        data: {
          avatarUrl,
          thumbnailUrl,
        },
      })
    } catch (error: any) {
      logger.error('上传头像失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '上传失败',
      })
    }
  }

  /**
   * 删除头像
   */
  async deleteAvatar(req: Request, res: Response) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权',
        })
      }

      logger.info(`用户 ${userId} 开始删除头像`)

      // 1. 获取当前头像信息
      const avatarInfo = await this.avatarService.getUserAvatar(userId)

      if (avatarInfo) {
        // 2. 删除文件
        await this.fileStorage.deleteAvatar(userId)

        // 3. 更新数据库
        await this.avatarService.deleteUserAvatar(userId)
      }

      logger.info(`用户 ${userId} 头像删除成功`)

      res.json({
        success: true,
        message: '头像删除成功',
      })
    } catch (error: any) {
      logger.error('删除头像失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '删除失败',
      })
    }
  }

  /**
   * 获取头像信息
   */
  async getAvatarInfo(req: Request, res: Response) {
    try {
      const currentUserId = req.user?.id
      const targetUserId = req.params.userId || currentUserId

      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          message: '未授权',
        })
      }

      const avatarInfo = await this.avatarService.getUserAvatar(targetUserId)

      if (!avatarInfo) {
        return res.status(404).json({
          success: false,
          message: '头像不存在',
        })
      }

      res.json({
        success: true,
        data: avatarInfo,
      })
    } catch (error: any) {
      logger.error('获取头像信息失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '获取失败',
      })
    }
  }

  /**
   * 更新头像URL
   */
  async updateAvatarUrl(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      const { avatarUrl } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权',
        })
      }

      if (!avatarUrl) {
        return res.status(400).json({
          success: false,
          message: '缺少avatarUrl参数',
        })
      }

      await this.avatarService.updateUserAvatar(userId, {
        avatarUrl,
        thumbnailUrl: avatarUrl,
      })

      res.json({
        success: true,
        message: '头像更新成功',
      })
    } catch (error: any) {
      logger.error('更新头像URL失败:', error)
      res.status(500).json({
        success: false,
        message: error.message || '更新失败',
      })
    }
  }
}
