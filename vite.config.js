import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    // 编辑器/工具在 src 下写临时文件时不要触发文件监听（曾因 .tmpdir 被锁导致 dev server 整个崩掉）
    watch: {
      ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/*.swp']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
