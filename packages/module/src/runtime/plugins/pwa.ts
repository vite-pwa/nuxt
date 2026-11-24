import type { UnwrapNestedRefs } from 'vue'
import type { Plugin } from '#app'
import type { PwaInjection } from './types'
import { defineNuxtPlugin } from '#imports'
import { createDisabledPwa } from './disabled-pwa'

const plugin: Plugin<{ pwa: UnwrapNestedRefs<PwaInjection> }> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:client:plugin',
  enforce: 'post',
  parallel: true,
  async setup(nuxtApp) {
    if (import.meta.client) {
      const { createClientPwa } = await import('../utils/pwa-client')
      return {
        provide: { pwa: await createClientPwa(nuxtApp) },
      }
    }

    return {
      provide: {
        pwa: createDisabledPwa(),
      },
    }
  },
})

export default plugin
