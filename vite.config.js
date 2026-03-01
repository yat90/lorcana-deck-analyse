import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      kit: {
        adapterFallback: 'index.html',
        includeVersionFile: true
      },
      manifest: {
        name: 'Lorcana Deck-Analyse',
        short_name: 'Lorcana',
        description: 'Deckliste analysieren und Start-Hand-Wahrscheinlichkeiten berechnen',
        theme_color: '#0071e3',
        background_color: '#f5f5f7',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}']
      }
    })
  ]
});
