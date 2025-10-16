/**
 * Web Worker模块导出
 */

export {
  WorkerPool,
  WorkerManager,
  workerManager,
  type WorkerTask,
  type WorkerResult,
  type WorkerPoolOptions,
  type WorkerInfo,
} from './WorkerManager'

export {
  initializeWorkerPools,
  sortDataInWorker,
  filterDataInWorker,
  aggregateDataInWorker,
  transformDataInWorker,
  shouldUseWorker,
  smartSort,
  smartFilter,
} from './WorkerTasks'
