import {
  defineNuxtModule,
  addServerHandler,
  createResolver,
  useLogger,
  addServerPlugin,
} from "@nuxt/kit";

// 1. On définit l'interface de tes options
export interface ModuleOptions {
  /**
   * Nombre maximum de requêtes autorisées
   * @default 5
   */
  maxRequests?: number;
  /**
   * Fenêtre de temps en millisecondes
   * @default 60000
   */
  timeWindow?: number;
  /**
   * Liste des adresses IP qui ne seront jamais bloquées
   * @default []
   */
  whitelist?: string[];
  /**
   * Affiche des logs détaillés dans la console pour le développement
   * @default true
   */
  verbose?: boolean; // 👈 New option to toggle logs: string[];
  /**
   * Liste des endpoints "honeypots" à surveiller pour détecter les bots malveillants
   * @default []
   */
  honeypots?: string[]; // 🆕 Option pour définir des endpoints pièges
  /**
   * Page de statut pour afficher les statistiques de l'application
   * @default true
   */
  statusPage?: {
    enabled: boolean;
    token: string;
  };
  /**
   * Liste des routes sensibles à limiter
   * @default []
   */
  sensitiveRoutes?: {
    path: string;
    max: number;
  }[];
}
declare module "@nuxt/schema" {
  interface RuntimeConfig {
    // Si tes options sont côté serveur (privé)
    rateLimit: ModuleOptions;
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-nitro-shield",
    configKey: "rateLimit", // the key in nuxt.config where users can set options
  },
  // 2.  we define the default options for the module
  defaults: {
    maxRequests: 50,
    timeWindow: 60000,
    whitelist: [],
    verbose: true, // 🆕 Logs activés par défaut
    honeypots: ["/admin.php", "/wp-login.php", "/.env", "/backup.sql"],
    statusPage: {
      enabled: true,
      token: "123456789", // À changer impérativement en prod
    },
    sensitiveRoutes: [
      { path: "/api/auth", max: 5 }, // Strict pour la sécurité
      { path: "/api/checkout", max: 10 },
    ],
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

    addServerPlugin(resolve("./runtime/server/plugins/cleanup"));

    // 2. La Route de Statut (Nouveau !)
    if (options.statusPage?.enabled) {
      addServerHandler({
        route: "/api/shield/status",
        method: "get",
        handler: resolve("./runtime/server/api/shield-status.get"),
      });
    }
    if (options.statusPage?.enabled) {
      // 🕵️ Ajoute ce log
      console.log("🚀 [SHIELD] Registering Status API Routes...");

      addServerHandler({
        route: "/api/shield/status",
        method: "delete",
        handler: resolve("./runtime/server/api/shield-status.delete"),
      });
    } else {
      // 🕵️ Et celui-ci
      console.log("⚠️ [SHIELD] Status API is DISABLED in options");
    }
    logger.info("🛡️ Nitro Shield : Ready and Typed !");
  },
});
