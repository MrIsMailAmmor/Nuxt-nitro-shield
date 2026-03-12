export default defineNuxtConfig({
  modules: ['my-module', '@nuxtjs/tailwindcss', '@nuxt/test-utils'],
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      shieldToken: '123456789', // Match the token above
    },
    // Tout ce qui est défini directement ici est PRIVÉ (accessible uniquement côté serveur)
    rateLimit: {
      enabled: true,
      defaultLimit: {
        max: 5, // Limite par défaut
        timeWindow: 60000, // 1 minute par défaut (en millisecondes)
      },
      whitelist: ['127.0.0.1', '::1', '8.8.8.8'],
      excludedRoutes: ['/_nuxt/**', '/favicon.ico'],
      verbose: true,
      honeypots: ['/admin.php', '/wp-login.php', '/.env', '/backup.sql'],
      statusPage: {
        enabled: true,
        token: '123456789',
      },
      sensitiveRoutes: [],
    },
  },
  compatibilityDate: 'latest',
  nitro: {
    storage: {
      shield: {
        driver: 'redis',
        host: '127.0.0.1',
        port: 6379,
      },
    },
  },
})
