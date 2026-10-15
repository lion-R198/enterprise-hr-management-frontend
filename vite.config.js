import { fileURLToPath, URL } from 'node:url'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // 真实 API 代理目标：读 .env.[mode] 的 VITE_PROXY_TARGET。
  // 此前这里被硬编码成 http://localhost:8080，导致 .env 里的声明形同虚设；
  // 联调要求「所有前端请求必须打到后端」，代理目标可配置是这条约束的前提。
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8080'

  // 联调取证开关（VITE_LOG_PROXY=true）：把每一条经过 vite 代理的 /api 请求
  // 逐条落到 verify/proxy-access.jsonl。
  // 判定意义：mock 通道在浏览器 JS 内直接返回，不产生任何 HTTP 出行，
  // 因此「出现在该日志里」等价于「确实经代理打到了后端」。
  const logProxy = env.VITE_LOG_PROXY === 'true'
  const verifyDir = fileURLToPath(new URL('./verify', import.meta.url))
  const accessLog = join(verifyDir, 'proxy-access.jsonl')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: false,
      proxy: {
        // 真实 API 通道：所有 /api 请求统一代理到后端（不使用 mock）
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            if (!logProxy) return
            mkdirSync(dirname(accessLog), { recursive: true })
            // 每次启动重新开一段，避免历史记录混入本次取证
            writeFileSync(accessLog, '')
            const write = (record) => {
              try {
                appendFileSync(accessLog, JSON.stringify(record) + '\n')
              } catch {
                /* 取证日志写失败不得影响业务请求 */
              }
            }
            proxy.on('proxyReq', (proxyReq, req) => {
              write({ at: new Date().toISOString(), phase: 'req', method: req.method, url: req.url })
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              write({
                at: new Date().toISOString(),
                phase: 'res',
                method: req.method,
                url: req.url,
                status: proxyRes.statusCode
              })
            })
            proxy.on('error', (err, req) => {
              write({ at: new Date().toISOString(), phase: 'err', method: req.method, url: req.url, error: String(err) })
            })
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            element: ['element-plus', '@element-plus/icons-vue'],
            echarts: ['echarts']
          }
        }
      }
    }
  }
})
