<template>
  <div class="avatar-cropper-modal" @click.self="handleCancel">
    <div class="cropper-container">
      <div class="cropper-header">
        <h3>裁剪头像</h3>
        <button @click="handleCancel" class="btn-close">×</button>
      </div>

      <div class="cropper-body">
        <div class="canvas-wrapper">
          <canvas
            ref="canvasRef"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="endDrag"
            @mouseleave="endDrag"
            @wheel="onWheel"
          ></canvas>
        </div>

        <div class="cropper-preview">
          <div class="preview-title">预览</div>
          <div class="preview-box">
            <canvas ref="previewCanvasRef"></canvas>
          </div>
        </div>
      </div>

      <div class="cropper-footer">
        <div class="cropper-controls">
          <button @click="zoom(1.1)" class="btn-control" title="放大">+</button>
          <button @click="zoom(0.9)" class="btn-control" title="缩小">-</button>
          <button @click="rotate(90)" class="btn-control" title="旋转">↻</button>
          <button @click="reset" class="btn-control" title="重置">⟲</button>
        </div>

        <div class="cropper-actions">
          <button @click="handleCancel" class="btn-cancel">取消</button>
          <button @click="handleConfirm" class="btn-confirm" :disabled="processing">
            {{ processing ? '处理中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  imageUrl: string
  aspectRatio?: number
  cropSize?: number
  previewSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 1,
  cropSize: 200,
  previewSize: 100,
})

interface Emits {
  (e: 'crop-complete', data: { blob: Blob; dataUrl: string }): void
  (e: 'crop-cancel'): void
}

const emit = defineEmits<Emits>()

const canvasRef = ref<HTMLCanvasElement>()
const previewCanvasRef = ref<HTMLCanvasElement>()
const processing = ref(false)

let image: HTMLImageElement | null = null
let scale = 1
let rotation = 0
let offsetX = 0
let offsetY = 0
let isDragging = false
let lastX = 0
let lastY = 0

onMounted(() => {
  loadImage()
})

onBeforeUnmount(() => {
  image = null
})

function loadImage() {
  image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => {
    initCanvas()
    draw()
  }
  image.onerror = () => {
    alert('图片加载失败')
  }
  image.src = props.imageUrl
}

function initCanvas() {
  if (!canvasRef.value || !image) return

  const canvas = canvasRef.value
  const size = Math.min(500, window.innerWidth - 100)
  canvas.width = size
  canvas.height = size

  // 初始化缩放和位置
  const imageAspect = image.width / image.height
  if (imageAspect > 1) {
    scale = size / image.width
  } else {
    scale = size / image.height
  }

  offsetX = size / 2
  offsetY = size / 2

  // 初始化预览画布
  if (previewCanvasRef.value) {
    previewCanvasRef.value.width = props.previewSize
    previewCanvasRef.value.height = props.previewSize
  }
}

function draw() {
  if (!canvasRef.value || !image) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制遮罩层（整个画布）
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 计算裁剪框位置
  const cropSize = Math.min(canvas.width, canvas.height) * 0.7
  const cropX = (canvas.width - cropSize) / 2
  const cropY = (canvas.height - cropSize) / 2

  // 保存状态
  ctx.save()

  // 设置裁剪区域（只在裁剪框内绘制图片）
  ctx.beginPath()
  ctx.rect(cropX, cropY, cropSize, cropSize)
  ctx.clip()

  // 移动到中心点
  ctx.translate(offsetX, offsetY)

  // 旋转
  ctx.rotate((rotation * Math.PI) / 180)

  // 缩放
  ctx.scale(scale, scale)

  // 绘制图片(中心对齐)
  ctx.drawImage(image, -image.width / 2, -image.height / 2)

  // 恢复状态
  ctx.restore()

  // 绘制裁剪框边框和网格
  drawCropBox(ctx, canvas.width, canvas.height, cropX, cropY, cropSize)

  // 更新预览
  updatePreview()
}

function drawCropBox(ctx: CanvasRenderingContext2D, width: number, height: number, cropX: number, cropY: number, cropSize: number) {
  // 绘制裁剪框边框
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 2
  ctx.strokeRect(cropX, cropY, cropSize, cropSize)

  // 绘制网格线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1
  for (let i = 1; i < 3; i++) {
    // 垂直线
    ctx.beginPath()
    ctx.moveTo(cropX + (cropSize / 3) * i, cropY)
    ctx.lineTo(cropX + (cropSize / 3) * i, cropY + cropSize)
    ctx.stroke()

    // 水平线
    ctx.beginPath()
    ctx.moveTo(cropX, cropY + (cropSize / 3) * i)
    ctx.lineTo(cropX + cropSize, cropY + (cropSize / 3) * i)
    ctx.stroke()
  }
}

function updatePreview() {
  if (!canvasRef.value || !previewCanvasRef.value || !image) return

  const canvas = canvasRef.value
  const previewCanvas = previewCanvasRef.value
  const ctx = previewCanvas.getContext('2d')
  if (!ctx) return

  const cropSize = Math.min(canvas.width, canvas.height) * 0.7
  const cropX = (canvas.width - cropSize) / 2
  const cropY = (canvas.height - cropSize) / 2

  // 从主画布获取裁剪区域
  const imageData = canvas.getContext('2d')?.getImageData(cropX, cropY, cropSize, cropSize)
  if (!imageData) return

  // 创建临时画布
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = cropSize
  tempCanvas.height = cropSize
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCtx.putImageData(imageData, 0, 0)

  // 缩放到预览尺寸
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
  ctx.drawImage(tempCanvas, 0, 0, previewCanvas.width, previewCanvas.height)
}

function startDrag(e: MouseEvent) {
  isDragging = true
  lastX = e.clientX
  lastY = e.clientY
}

function onDrag(e: MouseEvent) {
  if (!isDragging) return

  const dx = e.clientX - lastX
  const dy = e.clientY - lastY

  offsetX += dx
  offsetY += dy

  lastX = e.clientX
  lastY = e.clientY

  draw()
}

function endDrag() {
  isDragging = false
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  zoom(delta)
}

function zoom(factor: number) {
  scale *= factor
  scale = Math.max(0.1, Math.min(5, scale))
  draw()
}

function rotate(degree: number) {
  rotation += degree
  rotation = rotation % 360
  draw()
}

function reset() {
  initCanvas()
  draw()
}

async function handleConfirm() {
  if (!canvasRef.value || !image || processing.value) return

  try {
    processing.value = true

    const canvas = canvasRef.value
    const cropSize = Math.min(canvas.width, canvas.height) * 0.7
    const cropX = (canvas.width - cropSize) / 2
    const cropY = (canvas.height - cropSize) / 2

    console.log('开始裁剪图片:', { cropSize, cropX, cropY })

    // 创建输出画布
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = props.cropSize
    outputCanvas.height = props.cropSize
    const outputCtx = outputCanvas.getContext('2d')
    if (!outputCtx) {
      console.error('无法获取输出画布上下文')
      throw new Error('无法创建画布，请刷新页面重试')
    }

    // 获取裁剪区域
    const mainCtx = canvas.getContext('2d')
    if (!mainCtx) {
      console.error('无法获取主画布上下文')
      throw new Error('无法访问画布，请刷新页面重试')
    }

    const imageData = mainCtx.getImageData(cropX, cropY, cropSize, cropSize)
    if (!imageData) {
      console.error('无法获取图像数据')
      throw new Error('无法读取图像数据，请重试')
    }

    console.log('成功获取图像数据:', imageData.width, 'x', imageData.height)

    // 创建临时画布
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = cropSize
    tempCanvas.height = cropSize
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) {
      console.error('无法获取临时画布上下文')
      throw new Error('无法创建临时画布，请刷新页面重试')
    }

    tempCtx.putImageData(imageData, 0, 0)

    // 缩放到目标尺寸
    outputCtx.drawImage(tempCanvas, 0, 0, props.cropSize, props.cropSize)

    console.log('图片缩放完成，准备转换为Blob')

    // 转换为Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob(
        b => {
          if (b) {
            console.log('Blob创建成功，大小:', b.size, 'bytes')
            resolve(b)
          } else {
            console.error('Blob创建失败')
            reject(new Error('无法生成图片文件'))
          }
        },
        'image/jpeg',
        0.9
      )
    })

    // 获取DataURL
    const dataUrl = outputCanvas.toDataURL('image/jpeg', 0.9)
    console.log('DataURL创建成功，长度:', dataUrl.length)

    emit('crop-complete', { blob, dataUrl })
  } catch (error: any) {
    console.error('裁剪失败:', error)
    alert(error.message || '裁剪失败，请重试')
  } finally {
    processing.value = false
  }
}

function handleCancel() {
  emit('crop-cancel')
}
</script>

<style scoped>
.avatar-cropper-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.cropper-container {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: scale(0.9) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.cropper-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cropper-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: #909399;
  transition: color 0.3s;
}

.btn-close:hover {
  color: #606266;
}

.cropper-body {
  padding: 20px;
  display: flex;
  gap: 20px;
  overflow: auto;
  flex: 1;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
}

.canvas-wrapper canvas {
  cursor: move;
  border-radius: 4px;
}

.cropper-preview {
  width: 150px;
  flex-shrink: 0;
}

.preview-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  text-align: center;
}

.preview-box {
  width: 100px;
  height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
  background: #f5f7fa;
}

.preview-box canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.cropper-footer {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cropper-controls {
  display: flex;
  gap: 8px;
}

.btn-control {
  width: 36px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-size: 18px;
}

.btn-control:hover {
  border-color: #409eff;
  color: #409eff;
  transform: scale(1.05);
}

.btn-control:active {
  transform: scale(0.95);
}

.cropper-actions {
  display: flex;
  gap: 12px;
}

.cropper-actions button {
  padding: 8px 20px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-cancel:hover {
  border-color: #909399;
  color: #909399;
}

.btn-confirm {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #66b1ff;
  border-color: #66b1ff;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #a0cfff;
  border-color: #a0cfff;
}

/* 处理中状态动画 */
.btn-confirm:disabled::after {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 8px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .cropper-body {
    flex-direction: column;
  }

  .cropper-preview {
    width: 100%;
  }

  .cropper-footer {
    flex-direction: column;
    gap: 12px;
  }

  .cropper-controls {
    width: 100%;
    justify-content: center;
  }

  .cropper-actions {
    width: 100%;
  }

  .cropper-actions button {
    flex: 1;
  }
}
</style>
