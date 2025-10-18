import express from 'express'
import cors from 'cors'
import path from 'path'
import avatarRoutes from './routes/avatar'

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/assets', express.static(path.join(__dirname, '../public/assets')))

// API路由
app.use('/api/user/avatar', avatarRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: '文件大小超过限制',
    })
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: '意外的文件字段',
    })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
  })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  })
})

export default app
