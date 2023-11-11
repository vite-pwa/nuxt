import type { UnwrapNestedRefs } from 'vue'
import type { PwaInjection } from './pwa'
import { defineNuxtPlugin } from '#imports'
import type { Plugin } from '#app/nuxt'

const plugin: Plugin<{
  pwa?: UnwrapNestedRefs<PwaInjection>
}> = defineNuxtPlugin(() => {
  return {
    provide: {
      pwa: undefined,
    },
  }
})

export default plugin
