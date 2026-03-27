import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 与 apps/agent 在 Windows 上默认首选端口 18080 对齐（避免 8000 的 WinError 10013）
  const defaultAgentPort = process.platform === 'win32' ? '18080' : '8000'
  const agentTarget =
    (env.VITE_AGENT_API && env.VITE_AGENT_API.replace(/\/$/, '')) ||
    `http://127.0.0.1:${env.VITE_AGENT_PORT || defaultAgentPort}`

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: agentTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': {
          target: agentTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})
