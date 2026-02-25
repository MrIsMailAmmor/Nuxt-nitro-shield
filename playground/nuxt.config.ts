import { resolve } from "node:path";

export default defineNuxtConfig({
  modules: [
    // On force le chemin absolu vers le module
    resolve(__dirname, "../src/module"),
    "@nuxtjs/tailwindcss",
  ],
  runtimeConfig: {
    // Tout ce qui est défini directement ici est PRIVÉ (accessible uniquement côté serveur)
    rateLimit: {
      maxRequests: 5, // Limite par défaut
      timeWindow: 60 * 1000, // 1 minute par défaut (en millisecondes)
      whitelist: ["127.0.0.2", "::1", "8.8.8.8"],
      verbose: true,
      honeypots: ["/secret-backdoor"],
      statusPage: {
        enabled: true,
        token: "123456789",
      },
    },
  },
});
