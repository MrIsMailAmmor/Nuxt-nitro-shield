import { defineEventHandler, getQuery, createError } from 'h3'
// @ts-expect-error - Nitro auto-imports
import { useStorage, useRuntimeConfig } from '#imports'

/**
 * Validates the administrative token.
 */
function validateAuth(queryToken: any, configToken: string) {
  if (!queryToken || queryToken !== configToken) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Invalid or missing Shield Token',
    })
  }
}

/**
 * Maps raw storage data into a readable statistics object.
 */
function mapStorageEntry(key: string, data: any) {
  if (!data) return null

  // Extract IP from key (format is "rate-limit:xxx.xxx.xxx.xxx")
  const ip = key.split(':').pop() || 'unknown'
  const now = Date.now()
  const resetTime = data.resetTime || 0
  const timeLeft = Math.max(0, Math.ceil((resetTime - now) / 1000))

  return {
    ip,
    requests: data.count || 0,
    isBanned: !!data.isBanned,
    expiresAt: new Date(resetTime).toISOString(),
    timeLeftSeconds: timeLeft,
    isExpired: now > resetTime,
  }
}

/**
 * Main Handler for Shield Monitoring (GET)
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().rateLimit
  const query = getQuery(event)
  const storage = useStorage('shield')

  // 1. Security Check
  validateAuth(query.token, config.statusPage?.token)

  // 2. Fetch all tracked keys
  const keys = await storage.getKeys()
  const rawStats = []

  // 3. Transform storage data into actionable stats
  for (const key of keys) {
    const data = await storage.getItem(key)
    const entry = mapStorageEntry(key, data)
    if (entry) rawStats.push(entry)
  }

  // 4. Return clean, filtered overview
  return {
    status: 'active',
    timestamp: new Date().toISOString(),
    metrics: {
      totalTrackedIPs: rawStats.length,
      bannedCount: rawStats.filter(s => s.isBanned).length,
      activeOffenders: rawStats.filter(s => s.requests > 0 && !s.isExpired)
        .length,
    },
    // We only return relevant entries to keep the response light
    entries: rawStats.sort((a, b) => b.requests - a.requests),
  }
})
