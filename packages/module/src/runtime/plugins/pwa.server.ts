import type { UnwrapNestedRefs } from 'vue'
import type { Plugin } from '#app'
import type { PwaInjection } from './types'
import { defineNuxtPlugin, reactive, ref } from '#imports'

const plugin: Plugin<{
  pwa: UnwrapNestedRefs<PwaInjection>
}> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:server:plugin',
  setup() {
    return {
      provide: {
        pwa: reactive({
          isPWAInstalled: ref<boolean | undefined>(undefined),
          showInstallPrompt: ref(false),
          cancelInstall: () => {},
          install: async () => undefined,
          swActivated: ref(false),
          registrationError: ref(false),
          offlineReady: ref(false),
          needRefresh: ref(false),
          updateServiceWorker: async () => {},
          cancelPrompt: async () => {},
        }) satisfies UnwrapNestedRefs<PwaInjection>,
      },
    }
  },
})

export default plugin
