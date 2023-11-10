import type { UnwrapNestedRefs } from 'vue'
import type { PwaInjection } from '~/src/runtime/plugins/types'
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
