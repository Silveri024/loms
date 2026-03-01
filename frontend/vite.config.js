import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/loms/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
}))
