import { defineEventHandler, getQuery, createError } from 'h3'
// @ts-expect-error - Nitro auto-imports
import { useStorage, useRuntimeConfig } from '#imports'

/**
 * Validates the administrative token.
 * Throws a 403 error if the token is missing or incorrect.
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
 * Removes all keys from the specified storage bucket.
 * Returns the total number of items removed.
 */
async function clearAll(storage: any): Promise<number> {
  const keys = await storage.getKeys()
  for (const key of keys) {
    await storage.removeItem(key)
  }
  return keys.length
}

/**
 * Main Handler for Shield Management (DELETE)
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().rateLimit
  const storage = useStorage('shield')
  const query = getQuery(event)

  // 1. Security Check
  validateAuth(query.token, config.statusPage?.token)

  // 2. Action: Global Reset
  // Triggered by adding ?all=true to the request
  if (query.all === 'true') {
    const deletedCount = await clearAll(storage)
    return {
      status: 'success',
      message: 'Shield storage has been fully reset.',
      deletedCount,
    }
  }

  // 3. Action: Targeted Unban
  // Triggered by adding ?ip=xxx.xxx.xxx.xxx to the request
  const ip = query.ip as string

  if (!ip) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Parameter \'ip\' or \'all=true\' is required.',
    })
  }

  // Consistent key formatting (matches middleware and core)
  const storageKey = `rate-limit:${ip}`

  // Check if item exists before attempting removal for better feedback
  const exists = await storage.hasItem(storageKey)
  await storage.removeItem(storageKey)

  return {
    status: 'success',
    message: exists
      ? `IP ${ip} has been successfully unshielded.`
      : `IP ${ip} was not found in the active shield list.`,
  }
})
