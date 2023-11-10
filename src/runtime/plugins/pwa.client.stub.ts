import type { UnwrapNestedRefs } from 'vue'
import type { PwaInjection } from './types'
import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin<{
  pwa?: UnwrapNestedRefs<PwaInjection>
}>(() => {
  return {
    provide: {
      pwa: undefined,
    },
  }
})
