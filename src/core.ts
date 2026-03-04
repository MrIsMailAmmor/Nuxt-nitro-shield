export interface RateLimitOptions {
  defaultLimit: {
    max: number;
    timeWindow: number;
  };
  whitelist?: string[];
  keyPrefix?: string;
}

export interface RateLimitResult {
  currentCount: number;
  remaining: number;
  resetTime: number; // Timestamp in milliseconds
  isBlocked: boolean;
}

/**
 * Generates a standardized storage key.
 */
const generateKey = (prefix: string | undefined, ip: string): string =>
  `${prefix || "rate-limit"}:${ip}`;

/**
 * Logic to determine if an IP should bypass the shield.
 */
const isWhitelisted = (ip: string, whitelist?: string[]): boolean =>
  !!(whitelist && whitelist.includes(ip));

/**
 * Core Universal Rate Limiting Logic.
 * Optimized for both File System and Redis TTL support.
 */
export async function checkRateLimit(
  getItem: (key: string) => Promise<any>,
  setItem: (key: string, val: any, opts?: { ttl?: number }) => Promise<void>,
  ip: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = generateKey(options.keyPrefix, ip);
  const now = Date.now();
  const { max, timeWindow } = options.defaultLimit;

  // 1. Whitelist Bypass
  if (isWhitelisted(ip, options.whitelist)) {
    return { currentCount: 0, remaining: max, resetTime: 0, isBlocked: false };
  }

  // 2. Retrieve existing state
  const data = await getItem(key);

  // 3. Calculate New State (Fixed Window Algorithm)
  let currentCount: number;
  let startTime: number;

  if (data && now - data.startTime < timeWindow) {
    // Within the current window: increment
    currentCount = data.count + 1;
    startTime = data.startTime;
  } else {
    // Window expired or no data: reset
    currentCount = 1;
    startTime = now;
  }

  const resetTime = startTime + timeWindow;
  const ttlInSeconds = Math.ceil((resetTime - now) / 1000);

  // 4. Persistence
  // We pass the TTL so drivers like Redis can handle auto-cleanup
  await setItem(
    key,
    { ip, count: currentCount, startTime, resetTime },
    { ttl: ttlInSeconds > 0 ? ttlInSeconds : 1 },
  );

  return {
    currentCount,
    remaining: Math.max(0, max - currentCount),
    resetTime,
    isBlocked: currentCount > max,
  };
}

/**
 * Instantly bans an IP by setting an astronomical count and long duration.
 */
export async function banIP(
  storage: {
    setItem: (key: string, val: any, opts?: { ttl?: number }) => Promise<void>;
  },
  ip: string,
  durationMs: number = 86400000, // Default: 24 hours
): Promise<void> {
  const key = `rate-limit:${ip}`;
  const ttlInSeconds = Math.ceil(durationMs / 1000);

  await storage.setItem(
    key,
    {
      count: 999999,
      startTime: Date.now(),
      resetTime: Date.now() + durationMs,
      isBanned: true,
    },
    { ttl: ttlInSeconds },
  );
}

/**
 * Maintenance: Identifies and removes expired records.
 * Only necessary for storage drivers that do not support native TTL (like FS).
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

    if (data?.resetTime && now > data.resetTime) {
      await storage.removeItem(key);
      cleaned++;
    }
  }

  return { cleaned };
}

/**
 * Quick check to see if an IP is already flagged as banned.
 * Returns the record if banned, otherwise null.
 */
export async function getBannedRecord(
  getItem: (key: string) => Promise<any>,
  ip: string,
  prefix?: string,
): Promise<any | null> {
  const key = `${prefix || "rate-limit"}:${ip}`;
  const data = await getItem(key);

  if (!data) return null;

  const now = Date.now();
  // An IP is considered banned if the flag is true OR if we are still within the reset window and count is over limit
  const isCurrentlyBlocked =
    data.isBanned ||
    (data.count > 0 && now < data.resetTime && data.count > 1000);

  return isCurrentlyBlocked ? data : null;
}
