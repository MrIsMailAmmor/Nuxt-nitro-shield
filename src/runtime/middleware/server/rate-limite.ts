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
    (key, val) => storage.setItem(key, val),
    ip,
    { maxRequests, timeWindow },
  );

  // 4. On communique les résultats via les headers
  setHeaders(event, {
    "X-RateLimit-Limit": maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  });

  // 5. Blocage si nécessaire
  if (result.isBlocked) {
    throw createError({
      statusCode: 429,
      message: "Too Many Requests",
    });
  }
});
