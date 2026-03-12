import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { config } from './testUtils/setup'

describe('Module Integration', async () => {
  await setup(config({}))

  it('devrait répondre avec succès', async () => {
    const html = await $fetch('/')
    expect(html).toBeDefined()
  })
})
