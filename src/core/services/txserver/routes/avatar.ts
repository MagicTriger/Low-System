import express from 'express'
import multer from 'multer'
import { AvatarController } from '../controllers/AvatarController'
import { authMiddleware } from '../middleware/auth'
import { validateFile } from '../middleware/validateFile'

const router = express.Router()
const controller = new AvatarController()

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(), // 使用内存存储,后续处理后再保存
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    // 验证文件类型
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  },
})

// 上传头像
router.post('/upload', authMiddleware, upload.single('file'), validateFile, controller.uploadAvatar.bind(controller))

// 删除头像
router.delete('/', authMiddleware, controller.deleteAvatar.bind(controller))

// 获取头像信息
router.get('/:userId?', authMiddleware, controller.getAvatarInfo.bind(controller))

// 更新头像URL
router.put('/url', authMiddleware, controller.updateAvatarUrl.bind(controller))

export default router
