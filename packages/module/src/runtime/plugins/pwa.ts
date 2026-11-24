import type { UnwrapNestedRefs } from 'vue'
import type { Plugin } from '#app'
import type { BeforeInstallPromptEvent, PwaInjection } from './types'
import { defineNuxtPlugin, reactive, shallowRef, useAppConfig } from '#imports'

const plugin: Plugin<{ pwa: UnwrapNestedRefs<PwaInjection> }> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:client:plugin',
  enforce: 'post',
  parallel: true,
  async setup(nuxtApp) {
    if (!import.meta.server && import.meta.client && (useAppConfig().nuxtPwa as { registerPlugin: boolean }).registerPlugin) {
      const { installPrompt } = useAppConfig().nuxtPwa as { installPrompt?: string }
      let earlyEvent: BeforeInstallPromptEvent | undefined
      const beforeInstallPrompt = (event: Event) => {
        event.preventDefault()
        earlyEvent = event as BeforeInstallPromptEvent
      }
      const appInstalled = () => {
        earlyEvent = undefined
      }
      const capture = !import.meta.dev && installPrompt && localStorage.getItem(installPrompt) !== 'true'
      if (capture) {
        window.addEventListener('beforeinstallprompt', beforeInstallPrompt)
        window.addEventListener('appinstalled', appInstalled)
      }
      let createClientPwa: typeof import('./pwa-client').createClientPwa
      try {
        ;({ createClientPwa } = await import('./pwa-client'))
      }
      finally {
        if (capture) {
          window.removeEventListener('beforeinstallprompt', beforeInstallPrompt)
          window.removeEventListener('appinstalled', appInstalled)
        }
      }
      return {
        provide: { pwa: await createClientPwa(nuxtApp, earlyEvent) },
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
