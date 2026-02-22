import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@handlers': fileURLToPath(new URL('./handlers', import.meta.url)),
      '@images': fileURLToPath(new URL('./public/images', import.meta.url)),
      '@asset-models': fileURLToPath(new URL('./public/models', import.meta.url)),
      '@enums': fileURLToPath(new URL('./models/enums', import.meta.url)),
      '@models': fileURLToPath(new URL('./models/view-models', import.meta.url)),
      '@interfaces': fileURLToPath(new URL('./interfaces', import.meta.url)),
      '@bootstrap': fileURLToPath(new URL('./bootstrap', import.meta.url)),
    }
  }
})