import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Money-Manager/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-512.png'],
      manifest: {
        name: 'Money Manager',
        short_name: 'MoneyMgr',
        description: 'Personal money management app',
        theme_color: '#FAF8F5',
        background_color: '#FAF8F5',
        display: 'standalone',
        scope: '/Money-Manager/',
        start_url: '/Money-Manager/',
        icons: [
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
})
