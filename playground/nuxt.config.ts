import { resolve } from "node:path";

export default defineNuxtConfig({
  nitro: {
    storage: {
      shield: {
        driver: "redis",
        host: "127.0.0.1",
        port: 6379,
      },
    },
  },
  modules: [
    // On force le chemin absolu vers le module
    resolve(__dirname, "../src/module"),
    "@nuxtjs/tailwindcss",
  ],
  runtimeConfig: {
    // Tout ce qui est défini directement ici est PRIVÉ (accessible uniquement côté serveur)
    rateLimit: {
      enabled: true,
      defaultLimit: {
        max: 5, // Limite par défaut
        timeWindow: 60000, // 1 minute par défaut (en millisecondes)
      },
      whitelist: ["127.0.0.2", "::1", "8.8.8.8"],
      verbose: true,
      honeypots: ["/secret-backdoor", "/admin.php"],
      statusPage: {
        enabled: true,
        token: "123456789",
      },
      sensitiveRoutes: [{ path: "/api/news", max: 2 }],
    },
    public: {
      shieldToken: "123456789", // Match the token above
    },
  },
});
