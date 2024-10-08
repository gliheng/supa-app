import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'lib',
      // the proper extensions will be added
      fileName: 'lib',
    },
    rollupOptions: {
      external: ['react'],
    },
  }
})
