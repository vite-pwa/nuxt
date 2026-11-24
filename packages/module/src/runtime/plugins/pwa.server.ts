import type { UnwrapNestedRefs } from 'vue'
import type { Plugin } from '#app'
import type { PwaInjection } from './types'
import { defineNuxtPlugin, reactive, shallowRef } from '#imports'

const plugin: Plugin<{
  pwa: UnwrapNestedRefs<PwaInjection>
}> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:server:plugin',
  setup() {
    return {
      provide: {
        pwa: reactive({
          isPWAInstalled: shallowRef<boolean | undefined>(undefined),
          showInstallPrompt: shallowRef(false),
          cancelInstall: () => {},
          install: async () => undefined,
          swActivated: shallowRef(false),
          registrationError: shallowRef(false),
          offlineReady: shallowRef(false),
          needRefresh: shallowRef(false),
          updateServiceWorker: async () => {},
          cancelPrompt: async () => {},
        }) satisfies UnwrapNestedRefs<PwaInjection>,
      },
    }
  },
})

export default plugin
