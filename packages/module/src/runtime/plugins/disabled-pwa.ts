import type { UnwrapNestedRefs } from 'vue'
import type { Plugin } from '#app'
import type { PwaInjection } from './types'
import { computed, defineNuxtPlugin, reactive, shallowRef } from '#imports'

function createDisabledPwa(): UnwrapNestedRefs<PwaInjection> {
  function protectedRef<T>(value: T) {
    const state = shallowRef(value)
    return computed({
      get: () => state.value,
      set: () => {},
    })
  }

  return reactive({
    isPWAInstalled: protectedRef<boolean | undefined>(undefined),
    showInstallPrompt: protectedRef(false),
    cancelInstall: () => {},
    install: async () => undefined,
    swActivated: protectedRef(false),
    registrationError: protectedRef(false),
    offlineReady: protectedRef(false),
    needRefresh: protectedRef(false),
    updateServiceWorker: async () => {},
    cancelPrompt: async () => {},
  }) satisfies UnwrapNestedRefs<PwaInjection>
}

const plugin: Plugin<{ pwa: UnwrapNestedRefs<PwaInjection> }> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:client:plugin',
  enforce: 'post',
  parallel: true,
  setup() {
    return {
      provide: {
        pwa: createDisabledPwa(),
      },
    }
  },
})

export default plugin
