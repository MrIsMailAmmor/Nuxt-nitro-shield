import {
  defineEventHandler,
  getHeader,
  getRequestIP,
  setHeaders,
  createError,
} from "h3";
// @ts-expect-error
import { useStorage, useRuntimeConfig } from "#imports";
import { checkRateLimit } from "../../../core"; // Import relatif local (toujours vert ✅)
import { consola } from "consola"; // Nuxt's beautiful logger

export default defineEventHandler(async (event) => {
  const url = event.path || "";

  if (url.startsWith("/_nuxt") || url.includes("favicon.ico")) return;

  if (!url.startsWith("/api/")) return;

  // 1. Récupération de la config Nuxt
  const config = useRuntimeConfig().rateLimit;
  const maxRequests = config?.maxRequests || 5;
  const timeWindow = config?.timeWindow || 60000;

  // 2. Préparation du stockage Nitro
  const storage = useStorage();
  const ip =
    getHeader(event, "x-test-ip") || getRequestIP(event) || "ip-locale";

  // 3. Appel du cerveau universel
  // Note comment on passe juste les fonctions .getItem et .setItem
  const result = await checkRateLimit(
    (key) => storage.getItem(key),
    (key, val: string) => storage.setItem(key, val),
    ip,
    { maxRequests, timeWindow, whitelist: config?.whitelist || [] },
  );

  // 4. On communique les résultats via les headers
  setHeaders(event, {
    "X-RateLimit-Limit": maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  });

  // 5. Blocage si nécessaire
  if (result.isBlocked) {
    // 🛡️ Logging Logic
    if (config.verbose) {
      console.log(config.verbose);

      consola.warn(`[SHIELD] 🛑 Blocked IP: ${ip} on ${url}`);
      consola.info(
        `[SHIELD] ⏳ Reset scheduled at: ${new Date(result.resetTime).toLocaleString()}`,
      );
    }

    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
      data: {
        ip,
        resetAt: new Date(result.resetTime).toISOString(),
      },
    });
  }
});
