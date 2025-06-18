// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Enable static site generation for GitHub Pages
  nitro: {
    prerender: {
      routes: ['/']
    }
  },

  css: ['~/assets/css/tailwind.sass', 'leaflet/dist/leaflet.css', '~/assets/css/main.css'],
  tailwindcss: {
    cssPath: ['~/assets/css/tailwind.sass', { injectPosition: "first" }],
    exposeConfig: {
      level: 2
    },
    config: {},
    viewer: false,
  },
  build: {
    transpile: [
      'chart.js'
    ]
  },
  ssr: true,
  vite: {
    css: {
      preprocessorOptions: {
        sass: {
          api: 'modern',
        },
      },
    },
  },
  router: {
    options: {
      hashMode: false // Ensure this is set to false for proper URL handling
    }
  },
  app: {
    // Use different baseURL for GitHub Pages vs Netlify
    baseURL: process.env.NETLIFY ? '/' : (process.env.NODE_ENV === 'production' ? '/wetter-app/' : '/'),
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' }
      ]
    }
  },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-mdi'],
})