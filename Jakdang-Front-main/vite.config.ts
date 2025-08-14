import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    // drop: ["console", "debugger"], // console.log 제거
  },
  define: {
      global: "window",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // 모든 네트워크 인터페이스에서 접근 가능하도록 설정
    port: 4173, // 원하는 포트 번호 설정 가능
    allowedHosts: ['jakdanglabs.com', 'localhost:19091'],
    proxy: {
      '/ws': {
        target: process.env.VITE_BASE_API_URL,
        changeOrigin: true,
        ws: true,
      }
    }
  },
  preview: {
    allowedHosts: ['jakdanglabs.com'], // "preview" 모드에서도 호스트 허용
  }
})
