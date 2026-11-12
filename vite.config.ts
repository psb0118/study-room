import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const previewHost = process.env.VITE_PREVIEW_ALLOWED_HOST?.trim()

export default defineConfig({
  // GitHub Pages 하위 경로(/study-room/) 등 어떤 호스트에서도 열리도록 상대 경로 사용
  base: './',
  plugins: [react(), tailwindcss()],
  // Cloud 미리보기처럼 특정 호스트가 필요할 때만 허용한다. 배포에는 영향이 없다.
  ...(previewHost ? { preview: { allowedHosts: [previewHost] } } : {}),
})
