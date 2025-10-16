/**
 * Web Worker管理器
 * 管理Worker生命周期和任务调度
 */

export interface WorkerTask<T = any, R = any> {
  id: string
  type: string
  data: T
  priority?: number
  timeout?: number
}

export interface WorkerResult<R = any> {
  taskId: string
  success: boolean
  data?: R
  error?: string
}

export interface WorkerPoolOptions {
  /** Worker数量 */
  size?: number
  /** 任务超时时间(ms) */
  timeout?: number
  /** 最大队列长度 */
  maxQueueSize?: number
}

export interface WorkerInfo {
  id: string
  busy: boolean
  tasksCompleted: number
  errors: number
}

/**
 * Worker包装器
 */
class WorkerWrapper {
  public id: string
  public busy = false
  public tasksCompleted = 0
  public errors = 0
  private worker: Worker
  private currentTask: WorkerTask | null = null
  private resolveMap = new Map<string, (result: any) => void>()
  private rejectMap = new Map<string, (error: any) => void>()

  constructor(workerUrl: string) {
    this.id = `worker-${Math.random().toString(36).substr(2, 9)}`
    this.worker = new Worker(workerUrl, { type: 'module' })
    this.setupMessageHandler()
  }

  /**
   * 执行任务
   */
  execute<T, R>(task: WorkerTask<T, R>): Promise<R> {
    return new Promise((resolve, reject) => {
      this.busy = true
      this.currentTask = task

      this.resolveMap.set(task.id, resolve)
      this.rejectMap.set(task.id, reject)

      // 设置超时
      if (task.timeout) {
        setTimeout(() => {
          if (this.currentTask?.id === task.id) {
            this.handleTimeout(task.id)
          }
        }, task.timeout)
      }

      // 发送任务到Worker
      this.worker.postMessage(task)
    })
  }

  /**
   * 终止Worker
   */
  terminate(): void {
    this.worker.terminate()
    this.busy = false
    this.currentTask = null
  }

  /**
   * 获取Worker信息
   */
  getInfo(): WorkerInfo {
    return {
      id: this.id,
      busy: this.busy,
      tasksCompleted: this.tasksCompleted,
      errors: this.errors,
    }
  }

  /**
   * 设置消息处理器
   */
  private setupMessageHandler(): void {
    this.worker.onmessage = (event: MessageEvent<WorkerResult>) => {
      const result = event.data
      const resolve = this.resolveMap.get(result.taskId)
      const reject = this.rejectMap.get(result.taskId)

      if (result.success) {
        this.tasksCompleted++
        resolve?.(result.data)
      } else {
        this.errors++
        reject?.(new Error(result.error))
      }

      this.resolveMap.delete(result.taskId)
      this.rejectMap.delete(result.taskId)
      this.busy = false
      this.currentTask = null
    }

    this.worker.onerror = error => {
      console.error('Worker error:', error)
      this.errors++

      if (this.currentTask) {
        const reject = this.rejectMap.get(this.currentTask.id)
        reject?.(error)
        this.rejectMap.delete(this.currentTask.id)
      }

      this.busy = false
      this.currentTask = null
    }
  }

  /**
   * 处理超时
   */
  private handleTimeout(taskId: string): void {
    const reject = this.rejectMap.get(taskId)
    reject?.(new Error('Task timeout'))
    this.rejectMap.delete(taskId)
    this.resolveMap.delete(taskId)
    this.errors++
    this.busy = false
    this.currentTask = null
  }
}

/**
 * Worker池
 */
export class WorkerPool {
  private workers: WorkerWrapper[] = []
  private taskQueue: WorkerTask[] = []
  private options: Required<WorkerPoolOptions>

  constructor(
    private workerUrl: string,
    options: WorkerPoolOptions = {}
  ) {
    this.options = {
      size: options.size || navigator.hardwareConcurrency || 4,
      timeout: options.timeout || 30000,
      maxQueueSize: options.maxQueueSize || 100,
    }

    this.initializeWorkers()
  }

  /**
   * 执行任务
   */
  async execute<T, R>(type: string, data: T, options?: Partial<WorkerTask>): Promise<R> {
    const task: WorkerTask<T, R> = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority: options?.priority || 0,
      timeout: options?.timeout || this.options.timeout,
    }

    // 尝试找到空闲Worker
    const worker = this.getAvailableWorker()

    if (worker) {
      return worker.execute<T, R>(task)
    }

    // 如果没有空闲Worker,加入队列
    if (this.taskQueue.length >= this.options.maxQueueSize) {
      throw new Error('Task queue is full')
    }

    return new Promise((resolve, reject) => {
      // 将resolve/reject包装到任务中
      ;(task as any).resolve = resolve
      ;(task as any).reject = reject
      this.addToQueue(task)
    })
  }

  /**
   * 获取池状态
   */
  getStatus() {
    return {
      workers: this.workers.map(w => w.getInfo()),
      queueSize: this.taskQueue.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      idleWorkers: this.workers.filter(w => !w.busy).length,
    }
  }

  /**
   * 销毁Worker池
   */
  destroy(): void {
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    this.taskQueue = []
  }

  /**
   * 初始化Workers
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.options.size; i++) {
      this.workers.push(new WorkerWrapper(this.workerUrl))
    }
  }

  /**
   * 获取可用Worker
   */
  private getAvailableWorker(): WorkerWrapper | null {
    return this.workers.find(w => !w.busy) || null
  }

  /**
   * 添加任务到队列
   */
  private addToQueue(task: WorkerTask): void {
    // 按优先级插入
    const index = this.taskQueue.findIndex(t => (t.priority || 0) < (task.priority || 0))
    if (index === -1) {
      this.taskQueue.push(task)
    } else {
      this.taskQueue.splice(index, 0, task)
    }

    // 尝试处理队列
    this.processQueue()
  }

  /**
   * 处理队列
   */
  private processQueue(): void {
    const worker = this.getAvailableWorker()
    if (!worker || this.taskQueue.length === 0) {
      return
    }

    const task = this.taskQueue.shift()!
    const resolve = (task as any).resolve
    const reject = (task as any).reject

    worker
      .execute(task)
      .then(resolve)
      .catch(reject)
      .finally(() => this.processQueue())
  }
}

/**
 * Worker管理器
 */
export class WorkerManager {
  private pools = new Map<string, WorkerPool>()

  /**
   * 注册Worker池
   */
  registerPool(name: string, workerUrl: string, options?: WorkerPoolOptions): void {
    if (this.pools.has(name)) {
      throw new Error(`Worker pool "${name}" already exists`)
    }

    this.pools.set(name, new WorkerPool(workerUrl, options))
  }

  /**
   * 执行任务
   */
  async execute<T, R>(poolName: string, taskType: string, data: T, options?: Partial<WorkerTask>): Promise<R> {
    const pool = this.pools.get(poolName)
    if (!pool) {
      throw new Error(`Worker pool "${poolName}" not found`)
    }

    return pool.execute<T, R>(taskType, data, options)
  }

  /**
   * 获取池状态
   */
  getPoolStatus(poolName: string) {
    const pool = this.pools.get(poolName)
    return pool?.getStatus()
  }

  /**
   * 获取所有池状态
   */
  getAllPoolStatus() {
    const status: Record<string, any> = {}
    for (const [name, pool] of this.pools.entries()) {
      status[name] = pool.getStatus()
    }
    return status
  }

  /**
   * 销毁Worker池
   */
  destroyPool(poolName: string): void {
    const pool = this.pools.get(poolName)
    if (pool) {
      pool.destroy()
      this.pools.delete(poolName)
    }
  }

  /**
   * 销毁所有Worker池
   */
  destroyAll(): void {
    for (const pool of this.pools.values()) {
      pool.destroy()
    }
    this.pools.clear()
  }
}

// 导出单例
export const workerManager = new WorkerManager()
