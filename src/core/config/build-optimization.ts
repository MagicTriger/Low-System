/**
 * 构建优化配置
 * 提供代码分割、Tree Shaking、资源压缩等优化策略
 */

import type { Plugin, UserConfig } from 'vite'

export interface BuildOptimizationOptions {
  /** 是否启用代码分割 */
  codeSplitting?: boolean
  /** 是否启用Tree Shaking */
  treeShaking?: boolean
  /** 是否启用资源压缩 */
  compression?: boolean
  /** 是否启用CDN */
  cdn?: boolean
  /** CDN配置 */
  cdnConfig?: CDNConfig
  /** 分块策略 */
  chunkStrategy?: 'default' | 'aggressive' | 'conservative'
}

export interface CDNConfig {
  /** CDN基础URL */
  baseUrl: string
  /** 需要使用CDN的包 */
  modules: Array<{
    name: string
    var: string
    path: string
  }>
}

/**
 * 获取优化的Rollup配置
 */
export function getOptimizedRollupOptions(options: BuildOptimizationOptions = {}) {
  const { codeSplitting = true, chunkStrategy = 'default' } = options

  return {
    output: {
      // 入口文件命名
      entryFileNames: 'assets/js/[name].[hash].js',
      // 分块文件命名
      chunkFileNames: 'assets/js/[name].[hash].js',
      // 资源文件命名
      assetFileNames: (assetInfo: any) => {
        const name = assetInfo.name || ''

        if (/\.css$/.test(name)) {
          return 'assets/css/[name].[hash][extname]'
        }

        if (/\.(png|jpg|jpeg|gif|svg|webp)$/.test(name)) {
          return 'assets/images/[name].[hash][extname]'
        }

        if (/\.(woff|woff2|eot|ttf|otf)$/.test(name)) {
          return 'assets/fonts/[name].[hash][extname]'
        }

        return 'assets/[name].[hash][extname]'
      },
      // 手动分块策略
      manualChunks: codeSplitting ? getManualChunks(chunkStrategy) : undefined,
    },
  }
}

/**
 * 获取手动分块函数
 */
function getManualChunks(strategy: 'default' | 'aggressive' | 'conservative') {
  return (id: string) => {
    // 核心框架
    if (id.includes('node_modules/vue')) {
      return 'vue'
    }

    if (id.includes('node_modules/vue-router')) {
      return 'vue-router'
    }

    if (id.includes('node_modules/pinia')) {
      return 'pinia'
    }

    // UI框架
    if (id.includes('node_modules/ant-design-vue')) {
      return 'antdv'
    }

    if (id.includes('node_modules/element-plus')) {
      return 'element-plus'
    }

    // 编辑器
    if (id.includes('node_modules/monaco-editor')) {
      return 'monaco'
    }

    // 工具库
    if (id.includes('node_modules/lodash')) {
      return 'lodash'
    }

    if (id.includes('node_modules/dayjs')) {
      return 'dayjs'
    }

    if (id.includes('node_modules/axios')) {
      return 'axios'
    }

    // 根据策略处理其他依赖
    if (strategy === 'aggressive') {
      // 激进策略: 每个包单独分块
      if (id.includes('node_modules')) {
        const match = id.match(/node_modules\/([^/]+)/)
        if (match) {
          return `vendor-${match[1]}`
        }
      }
    } else if (strategy === 'conservative') {
      // 保守策略: 所有依赖打包到一起
      if (id.includes('node_modules')) {
        return 'vendor'
      }
    } else {
      // 默认策略: 按大小分组
      if (id.includes('node_modules')) {
        // 大型库单独分块
        const largeLibs = ['echarts', 'three', 'd3', '@antv']
        if (largeLibs.some(lib => id.includes(`node_modules/${lib}`))) {
          const match = id.match(/node_modules\/([^/]+)/)
          if (match) {
            return `vendor-${match[1]}`
          }
        }

        // 其他依赖打包到vendor
        return 'vendor'
      }
    }

    // 业务代码分块
    if (id.includes('/src/core/')) {
      return 'core'
    }

    if (id.includes('/src/components/')) {
      return 'components'
    }

    if (id.includes('/src/views/')) {
      return 'views'
    }
  }
}

/**
 * 获取优化的构建配置
 */
export function getOptimizedBuildConfig(options: BuildOptimizationOptions = {}): UserConfig['build'] {
  const { treeShaking = true, compression = true } = options

  return {
    // 分块大小警告限制
    chunkSizeWarningLimit: 1000,

    // 清空输出目录
    emptyOutDir: true,

    // Rollup配置
    rollupOptions: getOptimizedRollupOptions(options),

    // 压缩配置
    minify: 'esbuild',

    // ESBuild配置
    ...(process.env.NODE_ENV === 'production' && {
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
      },
    }),

    // 启用CSS代码分割
    cssCodeSplit: true,

    // 启用源码映射(生产环境可关闭)
    sourcemap: process.env.NODE_ENV !== 'production',

    // 报告压缩后的大小
    reportCompressedSize: compression,

    // 目标浏览器
    target: 'es2015',

    // 启用Tree Shaking
    ...(treeShaking && {
      rollupOptions: {
        ...getOptimizedRollupOptions(options),
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
    }),
  }
}

/**
 * CDN外部化插件
 */
export function createCDNPlugin(config: CDNConfig): Plugin {
  return {
    name: 'vite-plugin-cdn',
    config(config) {
      return {
        build: {
          rollupOptions: {
            external: config.modules?.map(m => m.name) || [],
            output: {
              globals:
                config.modules?.reduce(
                  (acc, m) => {
                    acc[m.name] = m.var
                    return acc
                  },
                  {} as Record<string, string>
                ) || {},
            },
          },
        },
      }
    },
    transformIndexHtml(html) {
      const scripts = config.modules?.map(m => `<script src="${config.baseUrl}${m.path}"></script>`).join('\n')

      return html.replace('</head>', `${scripts}\n</head>`)
    },
  } as any
}

/**
 * 预设的CDN配置
 */
export const cdnPresets = {
  /** unpkg CDN */
  unpkg: {
    baseUrl: 'https://unpkg.com/',
    modules: [
      { name: 'vue', var: 'Vue', path: 'vue@3/dist/vue.global.prod.js' },
      { name: 'vue-router', var: 'VueRouter', path: 'vue-router@4/dist/vue-router.global.prod.js' },
      { name: 'pinia', var: 'Pinia', path: 'pinia@2/dist/pinia.iife.prod.js' },
    ],
  },

  /** jsDelivr CDN */
  jsdelivr: {
    baseUrl: 'https://cdn.jsdelivr.net/npm/',
    modules: [
      { name: 'vue', var: 'Vue', path: 'vue@3/dist/vue.global.prod.js' },
      { name: 'vue-router', var: 'VueRouter', path: 'vue-router@4/dist/vue-router.global.prod.js' },
      { name: 'pinia', var: 'Pinia', path: 'pinia@2/dist/pinia.iife.prod.js' },
    ],
  },

  /** 国内CDN (bootcdn) */
  bootcdn: {
    baseUrl: 'https://cdn.bootcdn.net/ajax/libs/',
    modules: [
      { name: 'vue', var: 'Vue', path: 'vue/3.3.4/vue.global.prod.min.js' },
      { name: 'vue-router', var: 'VueRouter', path: 'vue-router/4.2.4/vue-router.global.prod.min.js' },
    ],
  },
}

/**
 * 性能分析插件
 */
export function createPerformancePlugin(): Plugin {
  return {
    name: 'vite-plugin-performance',
    closeBundle() {
      console.log('\n📊 Build Performance Analysis:')
      console.log('  - Check bundle size in dist folder')
      console.log('  - Use "npm run analyze" to visualize bundle')
    },
  }
}

/**
 * 获取完整的优化配置
 */
export function getFullOptimizationConfig(options: BuildOptimizationOptions = {}): UserConfig {
  const plugins: Plugin[] = []

  // 添加CDN插件
  if (options.cdn && options.cdnConfig) {
    plugins.push(createCDNPlugin(options.cdnConfig))
  }

  // 添加性能分析插件
  plugins.push(createPerformancePlugin())

  return {
    build: getOptimizedBuildConfig(options),
    plugins,
  }
}
