// src/core.ts

export interface RateLimitOptions {
  defaultLimit: {
    max: number;
    timeWindow: number;
  };
  whitelist?: string[];
}

export interface RateLimitResult {
  currentCount: number;
  remaining: number;
  resetTime: number; // en secondes
  isBlocked: boolean;
}

/**
 * Logique universelle de Rate Limit
 * @param getItem Fonction pour récupérer une donnée (ex: depuis Redis, Mémoire, etc.)
 * @param setItem Fonction pour sauvegarder une donnée
 */
export async function checkRateLimit(
  getItem: (key: string) => Promise<any>,
  setItem: (key: string, val: any, opts?: { ttl?: number }) => Promise<void>,
  ip: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = `rate-limit:${ip}`;
  const now = Date.now();
  // 🛡️ Logique de Whitelist
  if (options.whitelist && options.whitelist.includes(ip)) {
    return {
      currentCount: 0,
      remaining: options.defaultLimit.max,
      resetTime: 0,
      isBlocked: false,
    };
  }

  // Récupération sécurisée des données
  const data = (await getItem(key)) as {
    count: number;
    startTime: number;
    resetTime: number;
  } | null;

  if (data && data.count > options.defaultLimit.max) {
    return {
      currentCount: data.count,
      remaining: options.defaultLimit.max,
      resetTime: Math.ceil(
        (now + options.defaultLimit.timeWindow - now) / 1000,
      ),
      isBlocked: true,
    };
  }
  let currentCount = 0;
  let startTime = now;

  // Algorithme de fenêtre glissante simplifiée
  if (data && now - data.startTime < options.defaultLimit.timeWindow) {
    currentCount = data.count + 1;
    startTime = data.startTime;
  } else {
    currentCount = 1;
    startTime = now;
  }
  const ttlInSeconds = Math.ceil(
    (startTime + options.defaultLimit.timeWindow - now) / 1000,
  );
  // On sauvegarde l'état
  await setItem(key, {
    ip,
    count: currentCount,
    startTime,
    isBanned: false,
    resetTime: startTime + options.defaultLimit.timeWindow,
    ttl: ttlInSeconds,
  });

  const remaining = Math.max(0, options.defaultLimit.max - currentCount);
  const resetTime = Math.ceil(
    (startTime + options.defaultLimit.timeWindow - now) / 1000,
  );
  return {
    currentCount,
    remaining,
    resetTime: Math.max(0, resetTime),
    isBlocked: currentCount > options.defaultLimit.max,
  };
}

/**
 * Instantly bans an IP by setting a very long reset time.
 */
export async function banIP(
  storage: { setItem: (key: string, val: any) => Promise<void> },
  ip: string,
  durationMs: number = 86400000, // Default 24 hours
): Promise<void> {
  const key = `rate-limit:${ip}`;
  await storage.setItem(key, {
    count: 999999, // Way above any limit
    resetTime: Date.now() + durationMs,
  });
}

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
