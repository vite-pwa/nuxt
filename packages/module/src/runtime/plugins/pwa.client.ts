import type { UnwrapNestedRefs } from 'vue'
import type { Plugin } from '#app'
import type { PwaInjection } from './types'
import { defineNuxtPlugin } from '#imports'
import { createClientPwa } from '../utils/pwa-client'

const plugin: Plugin<{ pwa: UnwrapNestedRefs<PwaInjection> }> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:client:plugin',
  enforce: 'post',
  parallel: true,
  async setup(nuxtApp) {
    return {
      provide: { pwa: await createClientPwa(nuxtApp) },
    }
  },
})

export default plugin
