// src/runtime/server/plugins/cleanup.ts
import { defineNitroPlugin } from "nitropack/runtime/plugin";
// @ts-expect-error
import { useStorage, useRuntimeConfig } from "#imports";
import { consola } from "consola";
import { cleanupExpiredFiles } from "../middleware/rate-limite";

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig().rateLimit;
  const storage = useStorage("shield");
  const logger = consola.withTag("nuxt-nitro-shield");

  // Run cleanup every hour (or based on config)
  // 3600000 ms = 1 hour
  const CLEANUP_INTERVAL = 5000; // 5 seconds for testing, change to 3600000 for production

  setInterval(async () => {
    try {
      const { cleaned } = await cleanupExpiredFiles({
        getKeys: () => storage.getKeys(),
        getItem: (key) => storage.getItem(key),
        removeItem: (key) => storage.removeItem(key),
      });

      if (cleaned > 0 && config.verbose) {
        logger.info(
          `Maintenance: Cleaned ${cleaned} expired rate-limit records.`,
        );
      }
    } catch (error) {
      logger.error("Maintenance failed:", error);
    }
  }, CLEANUP_INTERVAL);
});
