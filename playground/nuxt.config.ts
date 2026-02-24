export default defineNuxtConfig({
  modules: ["my-module", "@nuxtjs/tailwindcss"],
  devtools: { enabled: true },
  compatibilityDate: "latest",
  runtimeConfig: {
    // Tout ce qui est défini directement ici est PRIVÉ (accessible uniquement côté serveur)
    rateLimit: {
      maxRequests: 5, // Limite par défaut
      timeWindow: 60 * 1000, // 1 minute par défaut (en millisecondes)
    },
  },
});
