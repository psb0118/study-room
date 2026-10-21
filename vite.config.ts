import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 하위 경로(/study-room/) 등 어떤 호스트에서도 열리도록 상대 경로 사용
  base: './',
  plugins: [react(), tailwindcss()],
})
