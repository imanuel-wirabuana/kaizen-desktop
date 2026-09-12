import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY || env.VITE_RESEND_API_KEY || ''),
        'process.env.VITE_RESEND_API_KEY': JSON.stringify(env.VITE_RESEND_API_KEY || env.RESEND_API_KEY || ''),
        'process.env.RESEND_FROM_EMAIL': JSON.stringify(env.RESEND_FROM_EMAIL || env.VITE_RESEND_FROM_EMAIL || ''),
        'process.env.VITE_RESEND_FROM_EMAIL': JSON.stringify(env.VITE_RESEND_FROM_EMAIL || env.RESEND_FROM_EMAIL || '')
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@': resolve('src/renderer/src'),
          '@renderer': resolve('src/renderer/src')
        }
      },
      plugins: [react(), tailwindcss()]
    }
  }
})
