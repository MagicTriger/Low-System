<template>
  <div class="not-found">
    <div class="not-found-content">
      <!-- 404 图标 -->
      <div class="error-icon">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" stroke="#e8eaed" stroke-width="4" fill="none" />
          <text x="100" y="120" text-anchor="middle" font-size="60" font-weight="bold" fill="#1890ff">404</text>
        </svg>
      </div>

      <!-- 错误信息 -->
      <h1 class="error-title">页面不存在</h1>
      <p class="error-description">抱歉，您访问的页面不存在或已被删除</p>

      <!-- 操作按钮 -->
      <div class="error-actions">
        <a-button type="primary" size="large" @click="goHome">
          <template #icon>
            <home-outlined />
          </template>
          返回首页
        </a-button>
        <a-button size="large" @click="goBack">
          <template #icon>
            <arrow-left-outlined />
          </template>
          返回上一页
        </a-button>
      </div>

      <!-- 建议链接 -->
      <div class="suggestions">
        <p class="suggestions-title">您可能想访问：</p>
        <div class="suggestions-links">
          <a-button type="link" @click="goTo('/admin/dashboard')">
            <dashboard-outlined />
            仪表板
          </a-button>
          <a-button type="link" @click="goTo('/admin/resource/list')">
            <database-outlined />
            资源管理
          </a-button>
          <a-button type="link" @click="goTo('/admin/system/users')">
            <user-outlined />
            用户管理
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HomeOutlined, ArrowLeftOutlined, DashboardOutlined, DatabaseOutlined, UserOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}

const goTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  background: #ffffff;
  padding: 60px 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.error-icon {
  margin-bottom: 32px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px 0;
}

.error-description {
  font-size: 16px;
  color: #8c8c8c;
  margin: 0 0 32px 0;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
}

.suggestions {
  padding-top: 32px;
  border-top: 1px solid #f0f0f0;
}

.suggestions-title {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0 0 16px 0;
}

.suggestions-links {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.suggestions-links :deep(.ant-btn-link) {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-content {
    padding: 40px 20px;
  }

  .error-icon svg {
    width: 150px;
    height: 150px;
  }

  .error-title {
    font-size: 24px;
  }

  .error-description {
    font-size: 14px;
  }

  .error-actions {
    flex-direction: column;
  }

  .error-actions :deep(.ant-btn) {
    width: 100%;
  }
}
</style>
