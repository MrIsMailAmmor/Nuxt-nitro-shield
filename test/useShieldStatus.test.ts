import { describe, it, expect, vi, beforeEach } from 'vitest'
// Import the core logic wrapper, NOT the Nitro wrapper
import { createShieldStatusAPI } from '../src/runtime/server/utils/shield'

// 1. Create a fake storage object
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

describe('useShieldStatus (Server Utility)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should retrieve the status of an IP', async () => {
    mockStorage.getItem.mockResolvedValue({ isBanned: true, requests: 100 })

    // Inject the fake storage directly!
    const api = createShieldStatusAPI(mockStorage)
    const status = await api.getIpStatus('1.1.1.1')

    expect(mockStorage.getItem).toHaveBeenCalledWith('1.1.1.1')
    expect(status).toEqual({ isBanned: true, requests: 100 })
  })

  it('should return null if the IP is not in storage', async () => {
    mockStorage.getItem.mockResolvedValue(null)

    const api = createShieldStatusAPI(mockStorage)
    const status = await api.getIpStatus('8.8.8.8')

    expect(mockStorage.getItem).toHaveBeenCalledWith('8.8.8.8')
    expect(status).toBeNull()
  })

  it('should unblock an IP by removing it from storage', async () => {
    const api = createShieldStatusAPI(mockStorage)
    const result = await api.unblockIp('2.2.2.2')

    expect(mockStorage.removeItem).toHaveBeenCalledWith('2.2.2.2')
    expect(result).toBe(true)
  })

  it('should manually ban an IP with a custom reason', async () => {
    const api = createShieldStatusAPI(mockStorage)
    const result = await api.banIp('3.3.3.3', 'Failed login spam')

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      '3.3.3.3',
      expect.objectContaining({
        ip: '3.3.3.3',
        isBanned: true,
        reason: 'Failed login spam',
        requests: 9999,
      }),
    )

    expect(result.isBanned).toBe(true)
    expect(result.reason).toBe('Failed login spam')
    expect(result.expiresAt).toBeDefined()
  })
})
