import { describe, expect, it } from 'vitest'
import { PwaRuntimeConfiguration } from '../packages/vite/src/plugins/pwa-runtime-configuration'

describe('virtual PWA runtime configuration', () => {
  it.each([true, false])('exports enabled as %s', (enabled) => {
    const plugin = PwaRuntimeConfiguration({
      nuxt: {
        client: { registerPlugin: enabled },
      },
      devEnvironment: false,
      resolvedOptions: { disable: false, manifest: false },
    } as any)
    const load = plugin.load as { handler: (id: string) => string }
    expect(load.handler('\0virtual:nuxt-pwa-configuration')).toContain(`export const enabled = ${enabled}`)
  })
})
