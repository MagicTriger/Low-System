import sharp from 'sharp'
import { Logger } from '../../../logging/Logger'

const logger = new Logger('ImageProcessingService')

export class ImageProcessingService {
  private readonly AVATAR_SIZE = 200 // 头像标准尺寸
  private readonly THUMBNAIL_SIZE = 50 // 缩略图尺寸
  private readonly QUALITY = 90 // JPEG质量

  /**
   * 验证图片文件
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata()

      // 检查是否为有效图片
      if (!metadata.format) {
        return false
      }

      // 检查图片格式
      const allowedFormats = ['jpeg', 'png', 'gif', 'webp']
      if (!allowedFormats.includes(metadata.format)) {
        return false
      }

      // 检查图片尺寸(最小10x10,最大10000x10000)
      if (metadata.width && metadata.height) {
        if (metadata.width < 10 || metadata.height < 10) {
          return false
        }
        if (metadata.width > 10000 || metadata.height > 10000) {
          return false
        }
      }

      return true
    } catch (error) {
      logger.error('图片验证失败:', error)
      return false
    }
  }

  /**
   * 处理头像图片
   * - 调整大小到标准尺寸
   * - 压缩
   * - 清除EXIF信息
   * - 转换为JPEG格式
   */
  async processAvatar(buffer: Buffer): Promise<Buffer> {
    try {
      const processed = await sharp(buffer)
        .resize(this.AVATAR_SIZE, this.AVATAR_SIZE, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: this.QUALITY,
          progressive: true,
        })
        .withMetadata(false) // 清除EXIF信息
        .toBuffer()

      logger.info(`图片处理完成: ${buffer.length} -> ${processed.length} bytes`)
      return processed
    } catch (error) {
      logger.error('图片处理失败:', error)
      throw new Error('图片处理失败')
    }
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      const thumbnail = await sharp(buffer)
        .resize(this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: 80,
          progressive: true,
        })
        .withMetadata(false)
        .toBuffer()

      logger.info(`缩略图生成完成: ${thumbnail.length} bytes`)
      return thumbnail
    } catch (error) {
      logger.error('缩略图生成失败:', error)
      throw new Error('缩略图生成失败')
    }
  }

  /**
   * 转换为WebP格式(可选)
   */
  async convertToWebP(buffer: Buffer, quality: number = 80): Promise<Buffer> {
    try {
      return await sharp(buffer).webp({ quality }).toBuffer()
    } catch (error) {
      logger.error('WebP转换失败:', error)
      throw new Error('WebP转换失败')
    }
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(buffer: Buffer) {
    try {
      const metadata = await sharp(buffer).metadata()
      return {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: buffer.length,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
      }
    } catch (error) {
      logger.error('获取图片信息失败:', error)
      throw new Error('获取图片信息失败')
    }
  }

  /**
   * 裁剪图片
   */
  async cropImage(buffer: Buffer, left: number, top: number, width: number, height: number): Promise<Buffer> {
    try {
      return await sharp(buffer).extract({ left, top, width, height }).toBuffer()
    } catch (error) {
      logger.error('图片裁剪失败:', error)
      throw new Error('图片裁剪失败')
    }
  }
}
