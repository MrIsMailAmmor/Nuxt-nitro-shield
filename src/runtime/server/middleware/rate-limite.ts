// 1. Les outils HTTP standards viennent du moteur 'h3'
import {
  defineEventHandler,
  getHeader,
  getRequestIP,
  setHeaders,
  createError,
} from "h3";
import { useStorage, useRuntimeConfig } from "#imports";
// 2. Les outils spécifiques à l'environnement serveur de Nuxt viennent de l'alias magique '#imports'
export default defineEventHandler(async (event) => {
  const url = event.path || ""; // Plus simple et mieux typé que event.node.req.url

  if (
    url.startsWith("/_nuxt") ||
    url.startsWith("/__nuxt") ||
    url.includes("favicon.ico")
  ) {
    return;
  }

  const config = useRuntimeConfig();
  const storage = useStorage();
  const rateLimitConfig = config.rateLimit as {
    maxRequests: number;
    timeWindow: number;
  };

  const ip =
    getHeader(event, "x-test-ip") || getRequestIP(event) || "ip-locale";
  const key = `rate-limit:${ip}`;

  const maxRequests = rateLimitConfig?.maxRequests || 5;
  const timeWindow = rateLimitConfig?.timeWindow || 60000;
  const now = Date.now();

  const data = (await storage.getItem(key)) as {
    count: number;
    startTime: number;
  } | null;

  let currentCount = 0;
  let startTime = now;

  if (data) {
    if (now - data.startTime > timeWindow) {
      currentCount = 1;
      startTime = now;
    } else {
      currentCount = data.count + 1;
      startTime = data.startTime;
    }
  } else {
    currentCount = 1;
  }

  await storage.setItem(key, { count: currentCount, startTime });

  const remaining = Math.max(0, maxRequests - currentCount);
  const resetTime = Math.ceil((startTime + timeWindow - now) / 1000);

  setHeaders(event, {
    "X-RateLimit-Limit": maxRequests.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": resetTime.toString(),
  });

  if (currentCount > maxRequests) {
    throw createError({
      statusCode: 429,
      statusMessage: "Trop de requetes, reessaie plus tard !",
    });
  }
});
