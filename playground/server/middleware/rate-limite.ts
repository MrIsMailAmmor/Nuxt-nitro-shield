// file: src/runtime/server/middleware/rate-limit.ts
import { defineEventHandler, getRequestIP, createError } from "h3";
// Interface defining the shape of our stored data
interface RateLimitRecord {
  count: number;
  resetAt: number; // Timestamp in milliseconds
}

export default defineEventHandler(async (event) => {
  console.log("🚀 [Middleware] Requête interceptée sur :", event.node.req.url);
  // 1. Bypass logic: Only intercept API routes to avoid blocking static assets
  if (!event.path.startsWith("/api/")) {
    return;
  }

  const storage = useStorage("ratelimit");
  // Regarde d'abord si on simule une IP, sinon utilise la vraie méthode
  const ip =
    getHeader(event, "x-test-ip") || getRequestIP(event) || "ip-locale";
  const storageKey = `ip:${ip}`;

  // Configuration (later, we will make this customizable via nuxt.config.ts)
  const windowMs = 60000; // 1 minute time window
  const maxRequests = 60; // Maximum allowed requests per window
  const now = Date.now();

  try {
    // 2. Retrieve the current record for this IP
    let record = (await storage.getItem(storageKey)) as RateLimitRecord | null;
    console.log(
      `🕵️ [Rate Limiter] IP: ${ip} | Visites actuelles: ${record ? record.count : 0}`,
    );

    // 3. TTL Validation: Reset if no record exists or if the time window has passed
    if (!record || record.resetAt < now) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
    } else {
      // 4. Increment the request counter
      record.count += 1;
    }

    // 5. Save the updated state asynchronously
    await storage.setItem(storageKey, record);

    // 6. Enforce the limit (Fail-fast mechanism)
    if (record.count > maxRequests) {
      console.warn(`[Nitro-Shield] Blocked IP: ${ip} - Rate limit exceeded.`);

      throw createError({
        statusCode: 429,
        statusMessage: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
      });
    }
  } catch (error: any) {
    // Fallback: If the storage engine crashes (e.g., Redis goes down),
    // we let the request pass rather than taking down the whole API.
    // However, we re-throw 429 errors so the user is actually blocked.
    if (error.statusCode === 429) {
      throw error;
    }
    console.error("[Nitro-Shield] Storage engine failure:", error.message);
  }
});
