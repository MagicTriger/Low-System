import { Request, Response, NextFunction } from 'express'
import { Logger } from '../../../../logging/Logger'

const logger = new Logger('ValidateFile')

/**
 * 文件验证中间件
 */
export function validateFile(req: Request, res: Response, next: NextFunction) {
  const file = req.file

  if (!file) {
    return res.status(400).json({
      success: false,
      message: '未上传文件',
    })
  }

  // 验证文件大小
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    logger.warn(`文件大小超限: ${file.size} > ${maxSize}`)
    return res.status(400).json({
      success: false,
      message: '文件大小超过限制(最大2MB)',
    })
  }

  // 验证MIME类型
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedMimes.includes(file.mimetype)) {
    logger.warn(`不支持的文件类型: ${file.mimetype}`)
    return res.status(400).json({
      success: false,
      message: '不支持的文件类型,仅支持 JPG, PNG, GIF',
    })
  }

  // 验证文件扩展名
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif']
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!ext || !allowedExts.includes(ext)) {
    logger.warn(`不支持的文件扩展名: ${ext}`)
    return res.status(400).json({
      success: false,
      message: '不支持的文件扩展名',
    })
  }

  // 验证文件内容(检查文件头)
  if (!isValidImageBuffer(file.buffer)) {
    logger.warn('文件内容验证失败')
    return res.status(400).json({
      success: false,
      message: '无效的图片文件',
    })
  }

  next()
}

/**
 * 验证文件buffer是否为有效图片
 */
function isValidImageBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) {
    return false
  }

  // 检查文件头(Magic Number)
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true
  }

  // GIF: 47 49 46 38 (GIF8)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true
  }

  return false
}
