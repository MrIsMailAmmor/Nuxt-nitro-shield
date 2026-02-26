import { resolve } from "node:path";

export default defineNuxtConfig({
  nitro: {
    storage: {
      shield: {
        // Doit correspondre exactement au nom dans useStorage('shield')
        driver: "fs",
        base: "./.data/shield", // Le point au début signifie "racine du playground"
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
      maxRequests: 50, // Limite par défaut
      timeWindow: 10 * 1000, // 1 minute par défaut (en millisecondes)
      whitelist: ["127.0.0.2", "::1", "8.8.8.8"],
      verbose: true,
      honeypots: ["/secret-backdoor"],
      statusPage: {
        enabled: true,
        token: "123456789",
      },
      sensitiveRoutes: [
        { path: "/api/auth", max: 10 }, // Strict pour la sécurité
        { path: "/api/checkout", max: 10 },
      ],
    },
  },
});
