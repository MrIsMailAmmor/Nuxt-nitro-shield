import {
  defineNuxtModule,
  addServerHandler,
  createResolver,
  useLogger,
} from "@nuxt/kit";

// 1. On définit l'interface de tes options
export interface ModuleOptions {
  /**
   * Nombre maximum de requêtes autorisées
   * @default 5
   */
  maxRequests: number;
  /**
   * Fenêtre de temps en millisecondes
   * @default 60000
   */
  timeWindow: number;
  /**
   * Liste des adresses IP qui ne seront jamais bloquées
   * @default []
   */
  whitelist: string[];
  /**
   * Affiche des logs détaillés dans la console pour le développement
   * @default true
   */
  verbose: boolean; // 👈 New option to toggle logs: string[];
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-nitro-shield",
    configKey: "rateLimit", // the key in nuxt.config where users can set options
  },
  // 2.  we define the default options for the module
  defaults: {
    maxRequests: 5,
    timeWindow: 60000,
    whitelist: [],
    verbose: true, // 🆕 Logs activés par défaut
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const logger = useLogger("nuxt-nitro-shield");
    // 3. we add a server middleware that will handle the rate limiting logic
    const handlerPath = resolve("./runtime/server/middleware/rate-limite");

    addServerHandler({
      middleware: true,
      handler: handlerPath,
    });

    logger.info("🛡️ Nitro Shield : Ready and Typed !");
  },
});
