/**
 * 优化的Vite配置文件
 * 包含代码分割、Tree Shaking、资源压缩等优化
 *
 * 使用方法:
 * 1. 重命名此文件为 vite.config.ts 以启用优化配置
 * 2. 或在构建时使用: vite build --config vite.config.optimized.ts
 */

import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

import { getOptimizedBuildConfig, getOptimizedRollupOptions, cdnPresets, createCDNPlugin } from './src/core/config/build-optimization'

const entryPath = resolve(__dirname, './src/modules')
const entrys = readdirSync(entryPath).reduce((obj: { [key: string]: string }, dirname) => {
  obj[dirname] = join(entryPath, dirname, 'index.html')
  return obj
}, {})

const portMap: Record<string, number> = {
  designer: 5173,
  manager: 5174,
  mobile: 5175,
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, join(process.cwd(), 'envs'))
  const isProduction = mode === 'production'
  const enableCDN = env.VITE_ENABLE_CDN === 'true'

  return {
    root: `./src/modules/${env.VITE_APP_MODEL}`,
    envDir: join(process.cwd(), 'envs'),
    publicDir: resolve(__dirname, 'public'),

    plugins: [
      vue(),

      // Gzip压缩
      viteCompression({
        verbose: true,
        disable: !isProduction,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
        filter: /\.(js|mjs|json|css|html|ttf|eot|otf|woff)$/i,
      }),

      // Brotli压缩(更高压缩率)
      viteCompression({
        verbose: true,
        disable: !isProduction,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br',
        filter: /\.(js|mjs|json|css|html|ttf|eot|otf|woff)$/i,
      }),

      // PWA
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: env.VITE_TITLE,
          short_name: env.VITE_TITLE,
          description: env.VITE_TITLE,
          theme_color: '#2f60ff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/logo-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/logo-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html}', '**/*.{png,jpg,jpeg,gif,svg}', '**/*.{mp4,webm,ogg}', '**/*.{otf,eot,ttf,webp}'],
          navigateFallbackDenylist: [/^\/api/],
          maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/file/preview'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'kenon-mes-cache-file-preview',
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 360 * 24 * 60 * 60,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/file/download'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'kenon-mes-cache-file-download',
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 360 * 24 * 60 * 60,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
          ignoreURLParametersMatching: [/.*/],
        },
      }),

      // CDN外部化(可选)
      ...(enableCDN ? [createCDNPlugin(cdnPresets.jsdelivr)] : []),

      // 构建分析(仅生产环境)
      ...(isProduction
        ? [
            visualizer({
              filename: './dist/stats.html',
              open: false,
              gzipSize: true,
              brotliSize: true,
            }) as any,
          ]
        : []),
    ],

    resolve: {
      extensions: ['.js', '.ts', '.vue', '.json', '.css'],
      alias: {
        '@core/components/monaco-editor':
          env.VITE_APP_MODEL == 'designer'
            ? fileURLToPath(new URL('./src/core/components/monaco-editor', import.meta.url))
            : fileURLToPath(new URL('./src/core/components/monaco-editor-mock', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
        '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
        '@designer': fileURLToPath(new URL('./src/modules/designer', import.meta.url)),
        '@manager': fileURLToPath(new URL('./src/modules/manager', import.meta.url)),
        '@mobile': fileURLToPath(new URL('./src/modules/mobile', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/core/assets', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/core/utils', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/core/stores', import.meta.url)),
        '@api': fileURLToPath(new URL('./src/core/api', import.meta.url)),
        '@auth': fileURLToPath(new URL('./src/core/auth', import.meta.url)),
        '@engines': fileURLToPath(new URL('./src/core/engines', import.meta.url)),
        '@layout': fileURLToPath(new URL('./src/core/layout', import.meta.url)),
        '@renderer': fileURLToPath(new URL('./src/core/renderer', import.meta.url)),
        '@validation': fileURLToPath(new URL('./src/core/validation', import.meta.url)),
      },
    },

    // 依赖优化
    optimizeDeps: {
      include:
        env.VITE_APP_MODEL == 'designer'
          ? [
              'vue',
              'vue-router',
              'pinia',
              'monaco-editor/esm/vs/language/json/json.worker',
              'monaco-editor/esm/vs/language/typescript/ts.worker',
              'monaco-editor/esm/vs/editor/editor.worker',
            ]
          : ['vue', 'vue-router', 'pinia'],
      exclude: ['@vueuse/core'],
    },

    // 开发服务器
    server: {
      host: '0.0.0.0',
      port: portMap[env.VITE_APP_MODEL],
      open: true,
      fs: {
        strict: false,
        allow: ['..'],
      },
      proxy: {
        '/api': {
          target: env.VITE_SERVICE_URL,
          changeOrigin: true,
          ws: true,
          secure: true,
        },
      },
    },

    // 构建配置
    build: {
      ...getOptimizedBuildConfig({
        codeSplitting: true,
        treeShaking: true,
        compression: true,
        chunkStrategy: 'default',
      }),

      outDir: resolve(__dirname, 'dist', env.VITE_APP_MODEL),

      rollupOptions: {
        input: entrys[env.VITE_APP_MODEL],
        ...getOptimizedRollupOptions({
          codeSplitting: true,
          chunkStrategy: 'default',
        }),
      },
    },
  }
})
