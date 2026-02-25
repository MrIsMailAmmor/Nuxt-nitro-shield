import { defineNuxtModule, addServerHandler, createResolver } from "@nuxt/kit";

export default defineNuxtModule({
  meta: {
    name: "mon-super-rate-limiter",
    configKey: "rateLimit",
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // On enregistre le middleware serveur
    addServerHandler({
      handler: resolver.resolve("./runtime/server/middleware/rate-limite"),
    });

    // On peut aussi injecter les options par défaut ici
    nuxt.options.runtimeConfig.rateLimit = {
      ...nuxt.options.runtimeConfig.rateLimit,
    };
  },
});
