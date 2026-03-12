import {
  defineEventHandler,
  getHeader,
  getRequestIP,
  setHeaders,
  createError,
  type H3Event,
} from 'h3'
// @ts-expect-error - Nitro auto-imports
import { useStorage, useRuntimeConfig } from '#imports'
import { banIP, checkRateLimit, getBannedRecord } from '../../../core'
import { consola } from 'consola'

const logger = consola.withTag('nuxt-nitro-shield')

/**
 * Checks if the current request path matches any honeypot trap.
 */
function isHoneypotTrigger(path: string, honeypots: string[]): boolean {
  return honeypots.some(trap => path.includes(trap))
}

/**
 * Determines if the request should bypass the shield (static files, status page, etc.).
 */
function isExcludedRoute(path: string, excludedRoutes: string[]): boolean {
  // Always exclude internal Nuxt paths and the status API itself
  const internalExclusions = ['/_nuxt', 'favicon.ico', '/api/shield/status']
  const isInternal = internalExclusions.some(excluded =>
    path.includes(excluded),
  )

  const isNotApi = !path.startsWith('/api/')
  // Check against user-defined excluded routes
  const isUserExcluded = excludedRoutes.some((pattern) => {
    if (pattern.endsWith('/**')) {
      return path.startsWith(pattern.replace('/**', ''))
    }
    return path === pattern
  })

  return isInternal || isUserExcluded || isNotApi
}

/**
 * Resolves the correct rate limit configuration based on the path.
 * Prioritizes sensitiveRoutes over defaultLimit.
 */
function resolveRouteConfig(path: string, config: any) {
  const sensitiveMatch = config.sensitiveRoutes?.find((r: any) =>
    path.startsWith(r.path),
  )

  return {
    max: sensitiveMatch ? sensitiveMatch.max : config.defaultLimit.max,
    timeWindow: sensitiveMatch?.window || config.defaultLimit.timeWindow,
    isSensitive: !!sensitiveMatch,
  }
}

/**
 * Main Middleware Handler
 */
export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig().rateLimit
  if (!config.enabled) return

  const path = event.path || ''
  const storage = useStorage('shield')

  // 1. IP Identification (Support for tests, headers, and native IP)
  const ip
    = getHeader(event, 'x-test-ip') || getRequestIP(event) || '127.0.0.1'

  // 2. Honeypot Protection (Immediate Ban)
  if (isHoneypotTrigger(path, config.honeypots)) {
    if (config.verbose) {
      logger.error(
        `[HONEYPOT] 🪤 Trap triggered by ${ip} on ${path}. Banning IP.`,
      )
    }

    await banIP({ setItem: (key, val) => storage.setItem(key, val) }, ip)

    throw createError({
      statusCode: 418,
      statusMessage: 'Not Interested',
      data: { message: 'Your IP has been flagged for malicious activity.' },
    })
  }

  // 3. Skip shield for whitelisted IPs or excluded routes
  if (
    config.whitelist?.includes(ip)
    || isExcludedRoute(path, config.excludedRoutes || [])
  ) {
    return
  }

  const bannedRecord = await getBannedRecord(key => storage.getItem(key), ip)

  if (bannedRecord) {
    if (config.verbose) {
      logger.info(`[SHIELD] 🛡️ Pre-blocked known offender: ${ip}`)
    }

    throw createError({
      statusCode: 429,
      statusMessage: 'Access Denied',
      data: {
        message: 'Your IP is currently flagged. Please try again later.',
        resetAt: new Date(bannedRecord.resetTime).toISOString(),
      },
    })
  }
  // 4. Resolve Limit Configuration
  const routeConfig = resolveRouteConfig(path, config)

  // 5. Execute Rate Limit Check (Core Logic)
  const result = await checkRateLimit(
    key => storage.getItem(key),
    (key, val: any, opts?: any) => storage.setItem(key, val, opts),
    ip,
    {
      defaultLimit: {
        max: routeConfig.max,
        timeWindow: routeConfig.timeWindow,
      },
      // We pass the key prefix to help the core identify the storage bucket
      keyPrefix: 'rate-limit',
    },
  )

  // 6. Set HTTP Response Headers (Good practice for API consumers)
  setHeaders(event, {
    'X-RateLimit-Limit': routeConfig.max.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(), // Seconds
  })

  // 7. Handle Blocked State
  if (result.isBlocked) {
    if (config.verbose) {
      logger.warn(
        `[SHIELD] 🛡️ Blocked ${ip} on ${path}. (Limit: ${routeConfig.max})`,
      )
    }

    const isBanned = result.currentCount > 1000 // Sign of a previous ban or heavy attack

    throw createError({
      statusCode: 429,
      statusMessage: isBanned ? 'Banned' : 'Too Many Requests',
      data: {
        message: isBanned
          ? 'Your IP has been banned due to suspicious behavior.'
          : 'Rate limit exceeded. Please try again later.',
        resetAt: new Date(result.resetTime).toISOString(),
      },
    })
  }
})
