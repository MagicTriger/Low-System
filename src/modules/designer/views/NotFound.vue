<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <!-- 404图标 -->
      <div class="error-icon">
        <svg viewBox="0 0 200 200" class="error-svg">
          <!-- 404数字 -->
          <text x="100" y="80" class="error-number">404</text>
          <!-- 装饰元素 -->
          <circle cx="50" cy="120" r="8" class="decoration-circle" />
          <circle cx="150" cy="120" r="8" class="decoration-circle" />
          <path d="M60 140 Q100 160 140 140" class="decoration-path" />
        </svg>
      </div>

      <!-- 错误信息 -->
      <div class="error-info">
        <h1 class="error-title">页面不存在</h1>
        <p class="error-description">抱歉，您访问的页面不存在或已被移除。</p>
        <p class="error-suggestion">请检查URL是否正确，或者返回首页继续浏览。</p>
      </div>

      <!-- 操作按钮 -->
      <div class="error-actions">
        <button @click="goHome" class="btn-primary">
          <Icon name="home" />
          返回首页
        </button>
        <button @click="goBack" class="btn-secondary">
          <Icon name="arrow-left" />
          返回上页
        </button>
        <button @click="refresh" class="btn-secondary">
          <Icon name="refresh" />
          刷新页面
        </button>
      </div>

      <!-- 帮助信息 -->
      <div class="help-section">
        <h3 class="help-title">可能的原因：</h3>
        <ul class="help-list">
          <li>页面URL输入错误</li>
          <li>页面已被删除或移动</li>
          <li>您没有访问权限</li>
          <li>服务器临时故障</li>
        </ul>
      </div>

      <!-- 快速导航 -->
      <div class="quick-nav">
        <h3 class="nav-title">快速导航：</h3>
        <div class="nav-links">
          <router-link to="/resource" class="nav-link">
            <Icon name="design" />
            <span>资源管理</span>
          </router-link>
          <router-link to="/login" class="nav-link">
            <Icon name="user" />
            <span>登录</span>
          </router-link>
          <a href="#" @click.prevent="contactSupport" class="nav-link">
            <Icon name="help" />
            <span>帮助支持</span>
          </a>
        </div>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Icon } from '@/core/components'

const router = useRouter()

// 返回首页
const goHome = () => {
  // 检查是否有token（注意：键名是 accessToken）
  const token = localStorage.getItem('accessToken')
  if (token) {
    // 有token，跳转到资源管理页面
    router.push('/designer/resource')
  } else {
    // 没有token，跳转到登录页面
    router.push('/login')
  }
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

// 刷新页面
const refresh = () => {
  window.location.reload()
}

// 联系支持
const contactSupport = () => {
  // 这里可以打开帮助文档或联系方式
  window.open('mailto:support@example.com', '_blank')
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #faf5ff 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.not-found-content {
  max-width: 48rem;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 10;
}

.error-icon {
  margin-bottom: 2rem;
}

.error-svg {
  width: 12rem;
  height: 12rem;
  margin: 0 auto;
}

.error-number {
  font-size: 3.75rem;
  font-weight: bold;
  fill: #2563eb;
  font-family: 'Arial', sans-serif;
  text-anchor: middle;
  dominant-baseline: middle;
}

.decoration-circle {
  fill: #a855f7;
  animation: pulse 2s infinite;
}

.decoration-path {
  stroke: #a855f7;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
}

.error-info {
  margin-bottom: 2rem;
}

.error-title {
  font-size: 2.25rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 1rem;
}

.error-description {
  font-size: 1.125rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.error-suggestion {
  color: #6b7280;
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #2563eb;
  color: white;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background-color: #1d4ed8;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background-color: #f9fafb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.help-section {
  margin-bottom: 2rem;
  text-align: left;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
}

.help-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

.help-list {
  list-style: none;
  padding: 0;
  color: #4b5563;
}

.help-list li {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.help-list li::before {
  content: '•';
  color: #2563eb;
  font-weight: bold;
  margin-right: 0.5rem;
}

.quick-nav {
  text-align: center;
}

.nav-title {
  @apply mb-4 text-lg font-semibold text-gray-900;
}

.nav-links {
  @apply flex flex-wrap justify-center gap-4;
}

.nav-link {
  @apply flex min-w-[100px] flex-col items-center rounded-lg border border-gray-200 bg-white p-4 text-gray-700 transition-all duration-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md;
}

.nav-link span {
  @apply mt-2 text-sm font-medium;
}

.background-decoration {
  @apply pointer-events-none absolute inset-0;
}

.floating-shape {
  @apply absolute rounded-full opacity-20;
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  @apply left-1/4 top-1/4 h-20 w-20 bg-blue-400;
  animation-delay: 0s;
}

.shape-2 {
  @apply right-1/4 top-1/3 h-16 w-16 bg-purple-400;
  animation-delay: 2s;
}

.shape-3 {
  @apply bottom-1/4 left-1/3 h-12 w-12 bg-pink-400;
  animation-delay: 4s;
}

.shape-4 {
  @apply bottom-1/3 right-1/3 h-24 w-24 bg-indigo-400;
  animation-delay: 1s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .error-number {
    @apply text-4xl;
  }

  .error-svg {
    @apply h-32 w-32;
  }

  .error-title {
    @apply text-2xl;
  }

  .error-actions {
    @apply flex-col items-center;
  }

  .btn-primary,
  .btn-secondary {
    @apply w-full max-w-xs;
  }

  .nav-links {
    @apply grid grid-cols-2 gap-3;
  }
}
</style>
