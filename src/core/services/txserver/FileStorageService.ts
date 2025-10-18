import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Logger } from '../../../logging/Logger'

const logger = new Logger('FileStorageService')

export interface StorageConfig {
  type: 'local' | 'oss' | 's3'
  basePath?: string
  bucket?: string
  region?: string
  accessKeyId?: string
  accessKeySecret?: string
  cdnDomain?: string
}

export class FileStorageService {
  private config: StorageConfig

  constructor(config?: StorageConfig) {
    this.config = config || {
      type: (process.env.STORAGE_TYPE as any) || 'local',
      basePath: process.env.UPLOAD_PATH || './uploads/avatars',
      bucket: process.env.STORAGE_BUCKET,
      region: process.env.STORAGE_REGION,
      cdnDomain: process.env.CDN_DOMAIN,
    }

    this.initialize()
  }

  /**
   * 初始化存储
   */
  private async initialize() {
    if (this.config.type === 'local' && this.config.basePath) {
      // 确保上传目录存在
      try {
        await fs.mkdir(this.config.basePath, { recursive: true })
        logger.info(`本地存储目录已创建: ${this.config.basePath}`)
      } catch (error) {
        logger.error('创建存储目录失败:', error)
      }
    }
  }

  /**
   * 保存头像文件
   */
  async saveAvatar(userId: string, buffer: Buffer, filename: string): Promise<string> {
    switch (this.config.type) {
      case 'local':
        return this.saveToLocal(userId, buffer, filename)
      case 'oss':
        return this.saveToOSS(userId, buffer, filename)
      case 's3':
        return this.saveToS3(userId, buffer, filename)
      default:
        throw new Error(`不支持的存储类型: ${this.config.type}`)
    }
  }

  /**
   * 删除头像文件
   */
  async deleteAvatar(userId: string): Promise<void> {
    switch (this.config.type) {
      case 'local':
        return this.deleteFromLocal(userId)
      case 'oss':
        return this.deleteFromOSS(userId)
      case 's3':
        return this.deleteFromS3(userId)
      default:
        throw new Error(`不支持的存储类型: ${this.config.type}`)
    }
  }

  /**
   * 保存到本地文件系统
   */
  private async saveToLocal(userId: string, buffer: Buffer, filename: string): Promise<string> {
    if (!this.config.basePath) {
      throw new Error('未配置本地存储路径')
    }

    // 创建用户目录
    const userDir = path.join(this.config.basePath, userId)
    await fs.mkdir(userDir, { recursive: true })

    // 保存文件
    const filePath = path.join(userDir, filename)
    await fs.writeFile(filePath, buffer)

    // 返回访问URL
    const url = `/uploads/avatars/${userId}/${filename}`
    logger.info(`文件已保存到本地: ${filePath}`)

    return url
  }

  /**
   * 从本地删除
   */
  private async deleteFromLocal(userId: string): Promise<void> {
    if (!this.config.basePath) {
      throw new Error('未配置本地存储路径')
    }

    const userDir = path.join(this.config.basePath, userId)

    try {
      // 删除用户目录及其所有文件
      await fs.rm(userDir, { recursive: true, force: true })
      logger.info(`已删除用户目录: ${userDir}`)
    } catch (error) {
      logger.warn(`删除用户目录失败: ${userDir}`, error)
    }
  }

  /**
   * 保存到阿里云OSS
   */
  private async saveToOSS(userId: string, buffer: Buffer, filename: string): Promise<string> {
    // TODO: 实现OSS上传
    // 需要安装 ali-oss 包
    /*
    const OSS = require('ali-oss');
    const client = new OSS({
      region: this.config.region,
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
      bucket: this.config.bucket
    });

    const objectName = `avatars/${userId}/${filename}`;
    const result = await client.put(objectName, buffer);
    
    return this.config.cdnDomain 
      ? `${this.config.cdnDomain}/${objectName}`
      : result.url;
    */
    throw new Error('OSS存储未实现')
  }

  /**
   * 从OSS删除
   */
  private async deleteFromOSS(userId: string): Promise<void> {
    // TODO: 实现OSS删除
    throw new Error('OSS删除未实现')
  }

  /**
   * 保存到AWS S3
   */
  private async saveToS3(userId: string, buffer: Buffer, filename: string): Promise<string> {
    // TODO: 实现S3上传
    // 需要安装 aws-sdk 包
    /*
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      region: this.config.region,
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.accessKeySecret
    });

    const key = `avatars/${userId}/${filename}`;
    await s3.putObject({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg'
    }).promise();

    return this.config.cdnDomain
      ? `${this.config.cdnDomain}/${key}`
      : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    */
    throw new Error('S3存储未实现')
  }

  /**
   * 从S3删除
   */
  private async deleteFromS3(userId: string): Promise<void> {
    // TODO: 实现S3删除
    throw new Error('S3删除未实现')
  }

  /**
   * 生成唯一文件名
   */
  generateFilename(originalName: string): string {
    const ext = path.extname(originalName)
    return `${uuidv4()}${ext}`
  }
}
