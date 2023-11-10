import type { Plugin } from '#app/nuxt'
import type { PwaInjection } from '~/src/runtime/plugins/types'
import { defineNuxtPlugin } from '#imports'

const plugin: Plugin<{
  pwa?: PwaInjection
}> = defineNuxtPlugin(() => {
  return {
    provide: {
      pwa: undefined,
    },
  }
})

export default plugin
