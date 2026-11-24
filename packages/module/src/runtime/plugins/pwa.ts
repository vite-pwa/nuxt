import type { UnwrapNestedRefs } from 'vue'
import type { Plugin } from '#app'
import type { PwaInjection } from './types'
import { defineNuxtPlugin, reactive, shallowRef, useAppConfig } from '#imports'

const plugin: Plugin<{ pwa: UnwrapNestedRefs<PwaInjection> }> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:plugin',
  enforce: 'post',
  parallel: true,
  async setup(nuxtApp) {
    if (!import.meta.server && import.meta.client && (useAppConfig().nuxtPwa as { registerPlugin: boolean }).registerPlugin) {
      const { createClientPwa } = await import('./pwa-client')
      return {
        provide: { pwa: await createClientPwa(nuxtApp) },
      }
    }

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
