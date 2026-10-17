import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  oxc: {
    decorator: { legacy: true },
  },
  define: {
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_OPTIONS_API__: true,
  },
})
