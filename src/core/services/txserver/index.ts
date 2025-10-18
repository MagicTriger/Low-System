import dotenv from 'dotenv'
import app from './app'
import { Logger } from '../../../logging/Logger'

// 加载环境变量
dotenv.config({ path: './server/.env' })

const logger = new Logger('Server')
const PORT = process.env.PORT || 3000

// 启动服务器
app.listen(PORT, () => {
  logger.info(`服务器已启动: http://localhost:${PORT}`)
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`存储类型: ${process.env.STORAGE_TYPE || 'local'}`)
  logger.info(`上传路径: ${process.env.UPLOAD_PATH || './uploads/avatars'}`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号,准备关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号,准备关闭服务器...')
  process.exit(0)
})

// 未捕获的异常
process.on('uncaughtException', error => {
  logger.error('未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason)
  process.exit(1)
})
