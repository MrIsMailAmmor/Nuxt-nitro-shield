import {
  defineNuxtModule,
  addServerHandler,
  createResolver,
  useLogger,
  addServerPlugin,
} from "@nuxt/kit";

/**
 * Interface for the Nuxt Nitro Shield module options.
 */
export interface ModuleOptions {
  /**
   * Activate or deactivate the module globally.
   * @default true
   */
  enabled: boolean;

  /**
   * Default limit applied to routes not specified in sensitiveRoutes.
   * @default { max: 50, timeWindow: 60000 }
   */
  defaultLimit: {
    max: number;
    timeWindow: number;
  };

  /**
   * List of IP addresses that bypass all rate limiting.
   * @default []
   */
  whitelist?: string[];

  /**
   * Route patterns to exclude from protection (e.g., /_nuxt/**, /images/**).
   * @default []
   */
  excludedRoutes?: string[];

  /**
   * If true, displays detailed logs in the server console.
   * @default true
   */
  verbose?: boolean;

  /**
   * List of honeypot endpoints to trap malicious bots.
   * Touching these leads to an immediate ban.
   * @default ["/admin.php", "/wp-login.php", "/.env"]
   */
  honeypots?: string[];

  /**
   * Configuration for the administration status page.
   */
  statusPage: {
    enabled: boolean;
    token: string;
  };

  /**
   * Specific limits for high-risk routes (Auth, Checkout, etc.).
   */
  sensitiveRoutes?: {
    path: string;
    max: number;
    window?: number;
  }[];
}

declare module "@nuxt/schema" {
  interface RuntimeConfig {
    rateLimit: ModuleOptions;
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-nitro-shield",
    configKey: "rateLimit",
  },
  // Default values for the module options
  defaults: {
    enabled: true,
    defaultLimit: {
      max: 50,
      timeWindow: 60000,
    },
    whitelist: [],
    excludedRoutes: ["/_nuxt/**", "/favicon.ico"],
    verbose: true,
    honeypots: ["/admin.php", "/wp-login.php", "/.env", "/backup.sql"],
    statusPage: {
      enabled: true,
      token: "123456789", // MUST be changed in production
    },
    sensitiveRoutes: [
      { path: "/api/auth", max: 5 },
      { path: "/api/checkout", max: 10 },
    ],
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const logger = useLogger("nuxt-nitro-shield");

    if (!options.enabled) {
      logger.info("🛡️ Shield is disabled via configuration.");
      return;
    }

    // Register the core rate-limiting middleware
    addServerHandler({
      middleware: true,
      handler: resolve("./runtime/server/middleware/rate-limite"),
    });
    const storageConfig = nuxt.options.nitro.storage?.["shield"];
    const driverName = String(storageConfig?.driver || "");

    // Redis et Cloudflare KV gèrent le TTL tout seuls, pas besoin de notre cleanup.ts
    const hasNativeTTL = [
      "redis",
      "cloudflare-kv",
      "cloudflareKV",
      "ioredis",
    ].includes(driverName);

    if (!hasNativeTTL) {
      if (options.verbose) {
        logger.info(
          "🧹 Storage driver lacks native TTL. Registering cleanup plugin...",
        );
      }
      addServerPlugin(resolve("./runtime/server/plugins/cleanup"));
    } else {
      if (options.verbose) {
        logger.info(
          `🚀 Storage driver (${driverName}) handles TTL natively. Cleanup plugin skipped.`,
        );
      }
    }

    // Register Status & Admin API Routes if enabled
    if (options.statusPage?.enabled) {
      if (options.verbose) {
        logger.info("🚀 [SHIELD] Registering Status & Admin API Routes...");
      }

      // GET: View stats and blocked IPs
      addServerHandler({
        route: "/api/shield/status",
        method: "get",
        handler: resolve("./runtime/server/api/shield-status.get"),
      });

      // DELETE: Manually unblock an IP or clear storage
      addServerHandler({
        route: "/api/shield/status",
        method: "delete",
        handler: resolve("./runtime/server/api/shield-status.delete"),
      });
    } else {
      logger.warn("⚠️ [SHIELD] Status API is disabled.");
    }

    logger.success("🛡️ Nuxt Nitro Shield is ready!");
  },
});
