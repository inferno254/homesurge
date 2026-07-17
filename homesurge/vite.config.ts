import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/mobile/build/**']
    }
  },
  build: {
    chunkSizeWarningLimit: 5000,
    commonjsOptions: { include: /node_modules/ },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          maps: ['leaflet', 'react-leaflet'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react'],
        },
      },
    },
  },
})
