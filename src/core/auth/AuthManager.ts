/**
 * 认证管理器实现
 * 处理用户登录、登出、令牌管理等功能
 */

import type {
  IAuthManager,
  User,
  AuthToken,
  LoginCredentials,
  LoginResult
} from './index'
import { AuthError, AuthStatus } from './index'

/**
 * 认证配置接口
 */
export interface AuthConfig {
  apiBaseUrl: string
  tokenStorageKey: string
  refreshTokenStorageKey: string
  userStorageKey: string
  tokenExpirationBuffer: number // 令牌过期缓冲时间（秒）
  autoRefresh: boolean
  rememberMeDuration: number // 记住我功能持续时间（天）
}

/**
 * 默认认证配置
 */
const DEFAULT_AUTH_CONFIG: AuthConfig = {
  apiBaseUrl: '/api/auth',
  tokenStorageKey: 'auth_token',
  refreshTokenStorageKey: 'refresh_token',
  userStorageKey: 'current_user',
  tokenExpirationBuffer: 300, // 5分钟
  autoRefresh: true,
  rememberMeDuration: 30 // 30天
}

/**
 * 认证事件类型
 */
export type AuthEventType = 'login' | 'logout' | 'tokenRefresh' | 'tokenExpired' | 'authError'

/**
 * 认证事件接口
 */
export interface AuthEvent {
  type: AuthEventType
  user?: User
  token?: AuthToken
  error?: Error
  timestamp: Date
}

/**
 * 认证管理器实现
 */
export class AuthManager implements IAuthManager {
  private config: AuthConfig
  private currentUser: User | null = null
  private currentToken: AuthToken | null = null
  private authStatus: AuthStatus = AuthStatus.UNAUTHENTICATED
  private refreshTimer: NodeJS.Timeout | null = null
  private eventListeners: Map<string, ((event: AuthEvent) => void)[]> = new Map()
  private authStateListeners: ((status: AuthStatus, user?: User) => void)[] = []

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...DEFAULT_AUTH_CONFIG, ...config }
    this.initialize()
  }

  /**
   * 初始化认证管理器
   */
  private initialize() {
    this.loadStoredAuth()
    this.setupAutoRefresh()
  }

  /**
   * 加载存储的认证信息
   */
  private loadStoredAuth() {
    try {
      const tokenData = localStorage.getItem(this.config.tokenStorageKey)
      const userData = localStorage.getItem(this.config.userStorageKey)

      if (tokenData && userData) {
        const token = JSON.parse(tokenData) as AuthToken
        const user = JSON.parse(userData) as User

        // 检查令牌是否过期
        if (new Date(token.expiresAt) > new Date()) {
          this.currentToken = token
          this.currentUser = user
          this.authStatus = AuthStatus.AUTHENTICATED
          this.notifyAuthStateChange()
        } else {
          this.clearStoredAuth()
          this.authStatus = AuthStatus.EXPIRED
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error)
      this.clearStoredAuth()
    }
  }

  /**
   * 设置自动刷新令牌
   */
  private setupAutoRefresh() {
    if (!this.config.autoRefresh || !this.currentToken) {
      return
    }

    const expiresAt = new Date(this.currentToken.expiresAt)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const refreshTime = timeUntilExpiry - (this.config.tokenExpirationBuffer * 1000)

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(error => {
          console.error('Auto refresh failed:', error)
          this.handleAuthError(new AuthError('Token refresh failed', 'TOKEN_REFRESH_FAILED'))
        })
      }, refreshTime)
    }
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      this.authStatus = AuthStatus.LOADING
      this.notifyAuthStateChange()

      const response = await fetch(`${this.config.apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new AuthError(data.message || 'Login failed', 'LOGIN_FAILED', response.status)
      }

      if (data.success && data.user && data.token) {
        this.currentUser = data.user
        this.currentToken = data.token
        this.authStatus = AuthStatus.AUTHENTICATED

        // 存储认证信息
        this.storeAuth(data.user, data.token, credentials.rememberMe)

        // 设置自动刷新
        this.setupAutoRefresh()

        // 触发事件
        this.emitEvent({
          type: 'login',
          user: data.user,
          token: data.token,
          timestamp: new Date()
        })

        this.notifyAuthStateChange()
      } else {
        this.authStatus = AuthStatus.UNAUTHENTICATED
        this.notifyAuthStateChange()
      }

      return data
    } catch (error) {
      this.authStatus = AuthStatus.UNAUTHENTICATED
      this.notifyAuthStateChange()
      
      if (error instanceof AuthError) {
        throw error
      }
      
      throw new AuthError('Network error during login', 'NETWORK_ERROR')
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      // 调用服务器登出接口
      if (this.currentToken) {
        await fetch(`${this.config.apiBaseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `${this.currentToken.tokenType} ${this.currentToken.accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Server logout failed:', error)
    } finally {
      // 清理本地状态
      this.clearAuth()
      
      // 触发事件
      this.emitEvent({
        type: 'logout',
        timestamp: new Date()
      })
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<AuthToken> {
    if (!this.currentToken?.refreshToken) {
      throw new AuthError('No refresh token available', 'NO_REFRESH_TOKEN')
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.currentToken.refreshToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new AuthError(data.message || 'Token refresh failed', 'TOKEN_REFRESH_FAILED', response.status)
      }

      if (data.token) {
        this.currentToken = data.token
        
        // 更新存储
        if (this.currentUser) {
          this.storeAuth(this.currentUser, data.token)
        }

        // 重新设置自动刷新
        this.setupAutoRefresh()

        // 触发事件
        this.emitEvent({
          type: 'tokenRefresh',
          token: data.token,
          timestamp: new Date()
        })

        return data.token
      }

      throw new AuthError('Invalid refresh response', 'INVALID_REFRESH_RESPONSE')
    } catch (error) {
      // 刷新失败，清理认证状态
      this.clearAuth()
      
      if (error instanceof AuthError) {
        throw error
      }
      
      throw new AuthError('Network error during token refresh', 'NETWORK_ERROR')
    }
  }

  /**
   * 获取配置
   */
  getConfig(): AuthConfig {
    return this.config
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.currentUser
  }

  /**
   * 获取认证状态
   */
  getAuthStatus(): AuthStatus {
    return this.authStatus
  }

  /**
   * 验证令牌
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * 设置认证状态监听器
   */
  onAuthStateChange(callback: (status: AuthStatus, user?: User) => void): () => void {
    this.authStateListeners.push(callback)
    
    // 立即调用一次回调
    callback(this.authStatus, this.currentUser || undefined)
    
    // 返回取消监听的函数
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: AuthEventType, listener: (event: AuthEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, [])
    }
    
    this.eventListeners.get(type)!.push(listener)
    
    return () => {
      const listeners = this.eventListeners.get(type)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * 设置令牌
   */
  setToken(token: string): void {
    const authToken: AuthToken = {
      accessToken: token,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1小时后过期
    }
    this.currentToken = authToken
    this.authStatus = AuthStatus.AUTHENTICATED
    localStorage.setItem(this.config.tokenStorageKey, JSON.stringify(authToken))
  }

  /**
   * 获取令牌
   */
  getToken(): string | null {
    return this.currentToken?.accessToken || null
  }

  /**
   * 清除令牌
   */
  clearToken(): void {
    this.currentToken = null
    this.authStatus = AuthStatus.UNAUTHENTICATED
    localStorage.removeItem(this.config.tokenStorageKey)
  }

  /**
   * 设置刷新令牌
   */
  setRefreshToken(refreshToken: string): void {
    // 如果当前有令牌，更新其刷新令牌
    if (this.currentToken) {
      this.currentToken.refreshToken = refreshToken
      localStorage.setItem(this.config.tokenStorageKey, JSON.stringify(this.currentToken))
    }
    // 同时存储到单独的刷新令牌存储中
    localStorage.setItem(this.config.refreshTokenStorageKey, refreshToken)
  }

  /**
   * 获取刷新令牌
   */
  getRefreshToken(): string | null {
    // 首先尝试从当前令牌中获取
    if (this.currentToken?.refreshToken) {
      return this.currentToken.refreshToken
    }
    // 然后从localStorage获取
    return localStorage.getItem(this.config.refreshTokenStorageKey)
  }

  /**
   * 设置用户信息
   */
  setUser(user: User): void {
    this.currentUser = user
    localStorage.setItem(this.config.userStorageKey, JSON.stringify(user))
  }

  /**
   * 获取用户信息
   */
  getUser(): User | null {
    return this.currentUser
  }

  /**
   * 清除用户信息
   */
  clearUser(): void {
    this.currentUser = null
    localStorage.removeItem(this.config.userStorageKey)
  }

  /**
   * 添加事件监听器（简化版）
   */
  on(eventType: AuthEventType, listener: (event: any) => void): void {
    this.addEventListener(eventType, listener)
  }

  /**
   * 移除事件监听器（简化版）
   */
  off(eventType: AuthEventType, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件（简化版）
   */
  emit(eventType: AuthEventType, event: any): void {
    this.emitEvent(event)
  }

  /**
   * 获取当前令牌
   */
  getCurrentToken(): AuthToken | null {
    return this.currentToken
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.authStatus === AuthStatus.AUTHENTICATED && this.currentUser !== null
  }

  /**
   * 检查令牌是否即将过期
   */
  isTokenExpiringSoon(): boolean {
    if (!this.currentToken) {
      return false
    }

    try {
      // 如果是JWT令牌，解析它
      const token = this.currentToken.accessToken
      if (token.includes('.')) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp) {
          const expiresAt = new Date(payload.exp * 1000)
          const now = new Date()
          const timeUntilExpiry = expiresAt.getTime() - now.getTime()
          
          return timeUntilExpiry <= (this.config.tokenExpirationBuffer * 1000)
        }
      }
    } catch (error) {
      // 如果解析失败，使用存储的过期时间
    }

    // 使用存储的过期时间
    const expiresAt = new Date(this.currentToken.expiresAt)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    
    return timeUntilExpiry <= (this.config.tokenExpirationBuffer * 1000)
  }

  /**
   * 存储认证信息
   */
  private storeAuth(user: User, token: AuthToken, rememberMe: boolean = false) {
    const storage = rememberMe ? localStorage : sessionStorage
    
    storage.setItem(this.config.tokenStorageKey, JSON.stringify(token))
    storage.setItem(this.config.userStorageKey, JSON.stringify(user))
    
    if (token.refreshToken) {
      storage.setItem(this.config.refreshTokenStorageKey, token.refreshToken)
    }
  }

  /**
   * 清理认证信息
   */
  private clearAuth() {
    this.currentUser = null
    this.currentToken = null
    this.authStatus = AuthStatus.UNAUTHENTICATED
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    
    this.clearStoredAuth()
    this.notifyAuthStateChange()
  }

  /**
   * 清理存储的认证信息
   */
  private clearStoredAuth() {
    localStorage.removeItem(this.config.tokenStorageKey)
    localStorage.removeItem(this.config.userStorageKey)
    localStorage.removeItem(this.config.refreshTokenStorageKey)
    
    sessionStorage.removeItem(this.config.tokenStorageKey)
    sessionStorage.removeItem(this.config.userStorageKey)
    sessionStorage.removeItem(this.config.refreshTokenStorageKey)
  }

  /**
   * 处理认证错误
   */
  private handleAuthError(error: AuthError) {
    this.emitEvent({
      type: 'authError',
      error,
      timestamp: new Date()
    })

    // 如果是令牌相关错误，清理认证状态
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'TOKEN_INVALID') {
      this.clearAuth()
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: AuthEvent) {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Auth event listener error:', error)
        }
      })
    }
  }

  /**
   * 通知认证状态变化
   */
  private notifyAuthStateChange() {
    this.authStateListeners.forEach(listener => {
      try {
        listener(this.authStatus, this.currentUser || undefined)
      } catch (error) {
        console.error('Auth state listener error:', error)
      }
    })
  }

  /**
   * 销毁认证管理器
   */
  destroy() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    
    this.eventListeners.clear()
    this.authStateListeners.length = 0
  }
}

/**
 * 创建认证管理器实例
 */
export function createAuthManager(config?: Partial<AuthConfig>): AuthManager {
  return new AuthManager(config)
}

/**
 * 全局认证管理器实例
 */
export const authManager = createAuthManager()