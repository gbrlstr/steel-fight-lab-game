import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  ssr: false,
  srcDir: 'app/',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      wsUrl: 'ws://127.0.0.1:3001',
      apiUrl: 'http://127.0.0.1:3010',
      githubUrl: 'https://github.com/gbrlstr/steel-fight-lab-game',
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/public/**', '**/imports/**', '**/docs/**', '**/.tools/**'],
      },
    },
  },
})
