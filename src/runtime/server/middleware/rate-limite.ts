import {
  defineEventHandler,
  getHeader,
  getRequestIP,
  setHeaders,
  createError,
} from "h3";
// @ts-expect-error
import { useStorage, useRuntimeConfig } from "#imports";
import { banIP, checkRateLimit } from "../../../core"; // Import relatif local (toujours vert ✅)
import { consola } from "consola"; // Nuxt's beautiful logger

const logger = consola.withTag("nuxt-nitro-shield");
const config = useRuntimeConfig().rateLimit;

export default defineEventHandler(async (event) => {
  const url = event.path || "";
  const ip =
    getHeader(event, "x-test-ip") || getRequestIP(event) || "ip-locale";
  const storage = useStorage("shield");

  // 1. 🪤 HONEYPOT CHECK
  // If the path is in the honeypot list, ban the IP instantly
  const isTrap = config.honeypots.some((trap: string) => url.includes(trap));
  if (isTrap) {
    if (config.verbose) {
      logger.error(
        `[HONEYPOT] 🪤 Trap triggered by ${ip} on ${url}. Banning for 24h.`,
      );
    }

    // Ban for 24 hours
    await banIP({ setItem: (key, val) => storage.setItem(key, val) }, ip);

    throw createError({
      statusCode: 418, // "I'm a teapot" - fun way to tell bots they are caught
      statusMessage: "Not Interested",
      data: { message: "Your IP has been flagged for malicious activity." },
    });
  }

  if (
    url.startsWith("/_nuxt") ||
    url.includes("favicon.ico") ||
    url.includes("/api/shield/status") ||
    !url.startsWith("/api/")
  )
    return;

  // 1. Récupération de la config Nuxt
  const sensitiveMatch = config.sensitiveRoutes.find((r: any) =>
    url.startsWith(r.path),
  );
  const rateLimitOptions = {
    maxRequests: sensitiveMatch ? sensitiveMatch.max : config.maxRequests,
    timeWindow: sensitiveMatch?.timeWindow || config.timeWindow,
    whitelist: config.whitelist,
  };

  // 2. Préparation du stockage Nitro

  // 3. Appel du cerveau universel
  // Note comment on passe juste les fonctions .getItem et .setItem
  const result = await checkRateLimit(
    (key) => storage.getItem(key),
    (key, val: string) => storage.setItem(key, val),
    ip,
    rateLimitOptions,
  );

  if (result.isBlocked && sensitiveMatch && config.verbose) {
    consola.warn(
      `[SHIELD] 🔥 SENSITIVE ROUTE BLOCKED: ${ip} on ${url} (Limit: ${sensitiveMatch.max})`,
    );
  }
  logger.warn("🛡️ Rate Limit Result", result);
  // 4. On communique les résultats via les headers
  setHeaders(event, {
    "X-RateLimit-Limit": rateLimitOptions.maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  });

  // 5. Blocage si nécessaire
  if (result.isBlocked) {
    // If the count is huge, it means they hit a honeypot or were manually banned
    const isPermanentBan = result.currentCount > 1000;

    throw createError({
      statusCode: 429,
      statusMessage: isPermanentBan ? "Banned" : "Too Many Requests",
      data: {
        message: isPermanentBan
          ? "Your IP has been permanently flagged for suspicious activity."
          : "Too many requests, please slow down.",
        resetAt: new Date(result.resetTime).toISOString(),
      },
    });
  }
});

/**
 * Identifies expired keys and removes them from storage.
 * Agnostic logic: works with any storage interface.
 */
export async function cleanupExpiredFiles(storage: {
  getKeys: () => Promise<string[]>;
  getItem: (key: string) => Promise<any>;
  removeItem: (key: string) => Promise<void>;
}): Promise<{ cleaned: number }> {
  const keys = await storage.getKeys();
  const now = Date.now();
  let cleaned = 0;

  for (const key of keys) {
    const data = await storage.getItem(key);
    // If the record exists and resetTime is in the past, delete it
    if (data && data.resetTime && now > data.resetTime) {
      await storage.removeItem(key);
      cleaned++;
    }
  }

  return { cleaned };
}
