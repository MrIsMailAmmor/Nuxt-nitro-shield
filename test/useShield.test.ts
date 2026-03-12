// test/useShield.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useShield } from '../src/runtime/composables/useShield'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// 1. Mock the config, but include Nuxt's required internal properties
mockNuxtImport('useRuntimeConfig', () => {
  return () => ({
    app: { baseURL: '/' }, // <--- THIS prevents the router crash!
    public: { shieldToken: 'fake-test-token-123' },
  })
})

// 2. Spy on global $fetch
const fetchSpy = vi.fn()
vi.stubGlobal('$fetch', fetchSpy)

describe('useShield Composable', () => {
  beforeEach(() => {
    fetchSpy.mockClear()
  })

  it('should fetch logs with the correct token', async () => {
    fetchSpy.mockResolvedValue([{ ip: '127.0.0.1', isBanned: true }])

    const { getLogs } = useShield()
    const logs = await getLogs()

    expect(fetchSpy).toHaveBeenCalledWith('/api/shield/status', {
      query: { token: 'fake-test-token-123' },
    })
    expect(logs).toHaveLength(1)
    // expect(logs[0].isBanned).toBe(true);
  })

  it('should send a DELETE request when unblocking an IP', async () => {
    fetchSpy.mockResolvedValue({ message: 'Unblocked' })

    const { unblockIp } = useShield()
    await unblockIp('192.168.1.1')

    expect(fetchSpy).toHaveBeenCalledWith('/api/shield/status', {
      method: 'DELETE',
      query: {
        token: 'fake-test-token-123',
        ip: '192.168.1.1',
        all: 'false',
      },
    })
  })

  it('should send a clear all request correctly', async () => {
    const { clearAll } = useShield()
    await clearAll()

    expect(fetchSpy).toHaveBeenCalledWith('/api/shield/status', {
      method: 'DELETE',
      query: {
        token: 'fake-test-token-123',
        ip: undefined,
        all: 'true',
      },
    })
  })
})
