<template>
  <div class="login-container">
    <div class="main">
      <!-- 登录表单容器 -->
      <div class="login-form-container container">
        <form class="form" @submit.prevent="handleLogin">
          <h2 class="form_title title">{{ title }}</h2>
          <input v-model="loginForm.username" class="form__input" type="text" placeholder="用户名" required />
          <input v-model="loginForm.password" class="form__input" type="password" placeholder="密码" required />

          <div class="form__links">
            <a class="form__link" href="javascript:void(0)">忘记密码？</a>
            <a v-if="showWechatLogin" class="form__link wechat-link" href="javascript:void(0)" @click="handleWechatLogin">
              <svg class="wechat-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M337.387283 341.82659c-17.757225 0-35.514451 11.83815-35.514451 29.595375s17.757225 29.595376 35.514451 29.595376 29.595376-11.83815 29.595376-29.595376c0-18.49711-11.83815-29.595376-29.595376-29.595375zM577.849711 513.479769c-11.83815 0-22.936416 12.578035-22.936416 23.6763 0 12.578035 11.83815 23.676301 22.936416 23.676301 17.757225 0 29.595376-11.83815 29.595376-23.676301s-11.83815-23.676301-29.595376-23.6763zM501.641618 401.017341c17.757225 0 29.595376-12.578035 29.595376-29.595376 0-17.757225-11.83815-29.595376-29.595376-29.595375s-35.514451 11.83815-35.51445 29.595375 17.757225 29.595376 35.51445 29.595376zM706.589595 513.479769c-11.83815 0-22.936416 12.578035-22.936416 23.6763 0 12.578035 11.83815 23.676301 22.936416 23.676301 17.757225 0 29.595376-11.83815 29.595376-23.676301s-11.83815-23.676301-29.595376-23.6763z"
                  fill="#28C445"
                />
                <path
                  d="M510.520231 2.959538C228.624277 2.959538 0 231.583815 0 513.479769s228.624277 510.520231 510.520231 510.520231 510.520231-228.624277 510.520231-510.520231-228.624277-510.520231-510.520231-510.520231zM413.595376 644.439306c-29.595376 0-53.271676-5.919075-81.387284-12.578034l-81.387283 41.433526 22.936416-71.768786c-58.450867-41.433526-93.965318-95.445087-93.965317-159.815029 0-113.202312 105.803468-201.988439 233.803468-201.98844 114.682081 0 216.046243 71.028902 236.023121 166.473989-7.398844-0.739884-14.797688-1.479769-22.196532-1.479769-110.982659 1.479769-198.289017 85.086705-198.289017 188.67052 0 17.017341 2.959538 33.294798 7.398844 49.572255-7.398844 0.739884-15.537572 1.479769-22.936416 1.479768z m346.265896 82.867052l17.757225 59.190752-63.630058-35.514451c-22.936416 5.919075-46.612717 11.83815-70.289017 11.83815-111.722543 0-199.768786-76.947977-199.768786-172.393063-0.739884-94.705202 87.306358-171.653179 198.289017-171.65318 105.803468 0 199.028902 77.687861 199.028902 172.393064 0 53.271676-34.774566 100.624277-81.387283 136.138728z"
                  fill="#28C445"
                />
              </svg>
            </a>
          </div>

          <button class="form__button button submit" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>

      <!-- 垂直分隔线 -->
      <div class="vertical-divider"></div>

      <!-- 项目介绍面板 -->
      <div class="intro-panel">
        <div class="intro-content">
          <h2 class="intro-title">{{ systemName }}</h2>

          <!-- 设计器预览图 -->
          <div class="designer-preview">
            <div class="preview-window">
              <div class="preview-header">
                <div class="preview-dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>
              <div class="preview-body">
                <div class="preview-sidebar">
                  <div class="sidebar-item"></div>
                  <div class="sidebar-item"></div>
                  <div class="sidebar-item"></div>
                  <div class="sidebar-item"></div>
                </div>
                <div class="preview-canvas">
                  <div class="canvas-element"></div>
                  <div class="canvas-element small"></div>
                  <div class="canvas-element wide"></div>
                </div>
                <div class="preview-properties">
                  <div class="property-item"></div>
                  <div class="property-item"></div>
                  <div class="property-item"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="intro-features">
            <div v-for="(feature, index) in features" :key="index" class="feature-item">
              <div class="feature-icon">{{ feature.icon }}</div>
              <div class="feature-text">{{ feature.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 微信登录二维码弹窗 -->
    <div v-if="showWechatQR" class="wechat-modal" @click="closeWechatQR">
      <div class="wechat-modal-content" @click.stop>
        <div class="wechat-modal-header">
          <h3>微信扫码登录</h3>
          <button class="close-btn" @click="closeWechatQR">×</button>
        </div>
        <div class="wechat-modal-body">
          <div class="qrcode-container">
            <img :src="wechatQRCode" alt="微信登录二维码" class="qrcode-image" />
          </div>
          <p class="qrcode-tip">请使用微信扫描二维码登录</p>
          <p class="qrcode-hint">二维码有效期2分钟</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useModule } from '@/core/state/helpers'
import { useLogger } from '@/core/services/helpers'
import { notificationService } from '@/core/notification'
import type { LoginRequest } from '@/core/api/auth'

interface Feature {
  icon: string
  text: string
}

interface Props {
  title?: string
  systemName?: string
  redirectPath?: string
  showWechatLogin?: boolean
  features?: Feature[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '登录系统',
  systemName: '低代码管理系统',
  redirectPath: '/dashboard',
  showWechatLogin: false,
  features: () => [
    { icon: '🚀', text: '快速开发' },
    { icon: '🎨', text: '可视化设计' },
    { icon: '⚡', text: '高性能' },
  ],
})

const router = useRouter()
const loading = ref(false)
const authModule = useModule('auth')
const logger = useLogger('LoginPage')
const notify = notificationService

const loginForm = reactive({
  username: '',
  password: '',
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    notify.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  logger.info('开始登录', { username: loginForm.username })

  try {
    const credentials: LoginRequest = {
      username: loginForm.username,
      password: loginForm.password,
    }

    const response = await authModule.dispatch('login', credentials)

    if (response.success) {
      logger.info('登录成功', { username: loginForm.username })
      notify.success('登录成功', `欢迎回来，${loginForm.username}`)
      router.push(props.redirectPath)
    } else {
      logger.warn('登录失败', { username: loginForm.username, message: response.message })
      notify.error('登录失败', response.message || '用户名或密码错误')
    }
  } catch (error: any) {
    logger.error('登录异常', error, { username: loginForm.username })
    notify.error('登录失败', error.message || '网络连接失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

// 微信登录相关
const showWechatQR = ref(false)
const wechatQRCode = ref('')
const wechatPolling = ref<number | null>(null)

const handleWechatLogin = async () => {
  logger.info('开始微信登录流程')
  try {
    const qrCodeResponse = await getWechatQRCode()
    wechatQRCode.value = qrCodeResponse.qrCode
    showWechatQR.value = true
    logger.debug('微信二维码获取成功', { ticket: qrCodeResponse.ticket })
    startWechatPolling(qrCodeResponse.ticket)
  } catch (error: any) {
    logger.error('获取微信登录二维码失败', error)
    notify.error('获取二维码失败', '请稍后重试')
  }
}

const getWechatQRCode = async () => {
  await new Promise(resolve => setTimeout(resolve, 500))
  return {
    ticket: 'mock-ticket-' + Date.now(),
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent('微信登录-' + Date.now()),
  }
}

const startWechatPolling = (ticketId: string) => {
  let pollCount = 0
  const maxPolls = 60

  wechatPolling.value = window.setInterval(async () => {
    pollCount++

    if (pollCount > maxPolls) {
      stopWechatPolling()
      notify.warning('二维码已过期', '请重新获取二维码')
      showWechatQR.value = false
      return
    }

    try {
      const status = await checkWechatLoginStatus(ticketId)

      if (status.success) {
        stopWechatPolling()
        showWechatQR.value = false
        localStorage.setItem('token', status.token)
        localStorage.setItem('username', status.username)
        logger.info('微信登录成功', { username: status.username })
        notify.success('微信登录成功', `欢迎，${status.username}`)
        router.push(props.redirectPath)
      }
    } catch (error: any) {
      logger.error('检查微信登录状态失败', error, { ticketId })
    }
  }, 2000)
}

const checkWechatLoginStatus = async (ticket: string) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  const isSuccess = Math.random() < 0.1
  return {
    success: isSuccess,
    token: isSuccess ? 'wechat-token-' + Date.now() : null,
    username: isSuccess ? '微信用户' : null,
  }
}

const stopWechatPolling = () => {
  if (wechatPolling.value) {
    clearInterval(wechatPolling.value)
    wechatPolling.value = null
  }
}

const closeWechatQR = () => {
  stopWechatPolling()
  showWechatQR.value = false
}
</script>

<style scoped>
*,
*::after,
*::before {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
}

.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family:
    'Montserrat',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 12px;
  background-color: #ecf0f3;
  color: #a0a5a8;
}

.main {
  position: relative;
  width: 1000px;
  min-width: 1000px;
  min-height: 600px;
  height: 600px;
  padding: 25px;
  background-color: #ecf0f3;
  box-shadow:
    10px 10px 10px #d1d9e6,
    -10px -10px 10px #f9f9f9;
  border-radius: 12px;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .main {
    transform: scale(0.7);
  }
}

@media (max-width: 1000px) {
  .main {
    transform: scale(0.6);
  }
}

@media (max-width: 800px) {
  .main {
    transform: scale(0.5);
  }
}

@media (max-width: 600px) {
  .main {
    transform: scale(0.4);
  }
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  width: 500px;
  height: 100%;
  padding: 25px;
  background-color: #ecf0f3;
  transition: 1s;
}

.login-form-container {
  left: 0;
  z-index: 100;
}

.intro-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 500px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ecf0f3;
  transition: 1s;
  z-index: 50;
}

.intro-content {
  text-align: center;
  padding: 40px;
}

.designer-preview {
  margin: 30px 0;
}

.preview-window {
  background-color: #ecf0f3;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    8px 8px 16px #d1d9e6,
    -8px -8px 16px #f9f9f9;
}

.preview-header {
  height: 35px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  padding: 0 15px;
  justify-content: space-between;
}

.preview-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
}

.preview-body {
  display: flex;
  height: 200px;
  background-color: #f5f5f5;
}

.preview-sidebar {
  width: 60px;
  background-color: #2c3e50;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-item {
  height: 35px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.preview-canvas {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.canvas-element {
  height: 40px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.canvas-element.small {
  height: 30px;
  width: 60%;
}

.canvas-element.wide {
  height: 50px;
}

.preview-properties {
  width: 80px;
  background-color: #34495e;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-item {
  height: 25px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.intro-title {
  font-size: 32px;
  font-weight: 700;
  color: #181818;
  margin-bottom: 16px;
}

.intro-features {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 40px;
}

.feature-item {
  text-align: center;
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.feature-text {
  font-size: 14px;
  color: #181818;
  font-weight: 500;
}

.form {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 40px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.form__input {
  width: 350px;
  height: 40px;
  margin: 4px 0;
  padding-left: 25px;
  font-size: 13px;
  letter-spacing: 0.15px;
  border: none;
  outline: none;
  font-family: 'Montserrat', sans-serif;
  background-color: #ecf0f3;
  transition: 0.25s ease;
  border-radius: 8px;
  box-shadow:
    inset 2px 2px 4px #d1d9e6,
    inset -2px -2px 4px #f9f9f9;
}

.form__input:focus {
  box-shadow:
    inset 4px 4px 4px #d1d9e6,
    inset -4px -4px 4px #f9f9f9;
}

.form__links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.form__link {
  color: #181818;
  font-size: 14px;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form__link:hover {
  color: #4b70e2;
  border-bottom-color: #4b70e2;
}

.wechat-link {
  color: #28c445;
}

.wechat-link:hover {
  border-bottom-color: #28c445;
}

.wechat-icon {
  width: 18px;
  height: 18px;
}

.title {
  font-size: 34px;
  font-weight: 700;
  line-height: 3;
  color: #181818;
}

.button {
  width: 180px;
  height: 50px;
  border-radius: 25px;
  margin-top: 50px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1.15px;
  background-color: #4b70e2;
  color: #f9f9f9;
  box-shadow:
    8px 8px 16px #d1d9e6,
    -8px -8px 16px #f9f9f9;
  border: none;
  outline: none;
  cursor: pointer;
  transition: 0.25s;
}

.button:hover {
  box-shadow:
    6px 6px 10px #d1d9e6,
    -6px -6px 10px #f9f9f9;
  transform: scale(0.985);
}

.button:active,
.button:focus {
  box-shadow:
    2px 2px 6px #d1d9e6,
    -2px -2px 6px #f9f9f9;
  transform: scale(0.97);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vertical-divider {
  position: absolute;
  left: 500px;
  top: 50px;
  width: 2px;
  height: calc(100% - 100px);
  background: linear-gradient(to bottom, transparent, #d1d9e6 10%, #d1d9e6 90%, transparent);
  transition: 1s;
  z-index: 150;
}

.wechat-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.wechat-modal-content {
  background-color: #ecf0f3;
  border-radius: 16px;
  padding: 30px;
  box-shadow:
    10px 10px 20px #d1d9e6,
    -10px -10px 20px #f9f9f9;
  max-width: 400px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wechat-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.wechat-modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #181818;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background-color: #ecf0f3;
  border-radius: 50%;
  font-size: 24px;
  color: #a0a5a8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow:
    4px 4px 8px #d1d9e6,
    -4px -4px 8px #f9f9f9;
}

.close-btn:hover {
  color: #181818;
  box-shadow:
    2px 2px 4px #d1d9e6,
    -2px -2px 4px #f9f9f9;
}

.wechat-modal-body {
  text-align: center;
}

.qrcode-container {
  width: 220px;
  height: 220px;
  margin: 0 auto 20px;
  background-color: #fff;
  border-radius: 12px;
  padding: 10px;
  box-shadow:
    inset 2px 2px 4px #d1d9e6,
    inset -2px -2px 4px #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
}

.qrcode-tip {
  font-size: 16px;
  color: #181818;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.qrcode-hint {
  font-size: 13px;
  color: #a0a5a8;
  margin: 0;
}
</style>
