// src/runtime/server/api/shield-status.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
// @ts-expect-error
import { useStorage, useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().rateLimit;
  const query = getQuery(event);

  // 🛡️ Vérification du Token
  if (query.token !== config.statusPage?.token) {
    console.log(config.statusPage?.token);

    throw createError({
      statusCode: 403,
      message: "Forbidden: Invalid Shield Token",
    });
  }

  const storage = useStorage("shield");
  const keys = await storage.getKeys();
  const stats = [];

  for (const key of keys) {
    const data: any = await storage.getItem(key);
    const ip = key.split(":").pop();

    stats.push({
      ip,
      requests: data.count,
      isBanned: data.count > 1000,
      expiresAt: new Date(data.resetTime).toLocaleString(),
      timeLeft: Math.ceil((data.resetTime - Date.now()) / 1000) + "s",
    });
  }

  return {
    status: "active",
    totalTrackedIPs: stats.length,
    offenders: stats.filter((s) => s.requests > 0),
  };
});
