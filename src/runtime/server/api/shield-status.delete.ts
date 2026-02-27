// src/runtime/server/api/shield-status.delete.ts
import { defineEventHandler, getQuery, createError } from "h3";
// @ts-expect-error
import { useStorage, useRuntimeConfig } from "#imports";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().rateLimit;
  const query = getQuery(event);
  const storage = useStorage("shield");

  // 1. 🛡️ Toujours vérifier le token
  if (query.token !== config.statusPage?.token) {
    throw createError({
      statusCode: 403,
      statusMessage: "Invalid Shield Token",
    });
  }

  // 2. 💣 Cas : TOUT supprimer (pour les tests ou reset total)
  if (query.all === "true") {
    const keys = await storage.getKeys();
    for (const key of keys) {
      await storage.removeItem(key);
    }
    return {
      status: "success",
      message: `Shield database cleared (${keys.length} keys removed).`,
    };
  }

  // 3. Cas : Supprimer une seule IP (ton code actuel)
  const ip = query.ip as string;
  if (!ip)
    throw createError({
      statusCode: 400,
      statusMessage: "Missing IP or all=true",
    });

  await storage.removeItem(`rate-limit:${ip}`);
  return { status: "success", message: `IP ${ip} unshielded.` };
});
