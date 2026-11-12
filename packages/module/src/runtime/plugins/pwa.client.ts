import type { RegisterSWOptions } from '@unplugin-pwa/core/types'
import type { UnwrapNestedRefs } from 'vue'
import type { Plugin } from '#app'
import type { PwaInjection } from './types'
import {
  activateSWSwitcherDev,
  callBeforeRegisterHook,
  initializeDev,
  periodicSyncForUpdates,
} from 'virtual:nuxt-pwa-configuration'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { defineNuxtPlugin, reactive, ref } from '#imports'

const plugin: Plugin<{
  pwa?: UnwrapNestedRefs<PwaInjection>
}> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:client:plugin',
  enforce: 'post',
  parallel: true,
  async setup(nuxtApp) {
    if (import.meta.dev) {
      initializeDev()
    }
    const registrationError = ref(false)
    const swActivated = ref(false)

    function registerPeriodicSync(
      swUrl: string,
      r: ServiceWorkerRegistration,
      timeout: number,
    ) {
      setInterval(async () => {
        // prevent fetch when installing new service worker
        if ((r && r.installing) || (('connection' in navigator) && !navigator.onLine)) {
          return
        }

        try {
          const resp = await fetch(
            swUrl,
            {
              cache: 'no-store',
              headers: {
                'cache': 'no-store',
                'cache-control': 'no-cache',
              },
            },
          )
          if (resp?.status === 200) {
            await r.update()
          }
        }
        catch (error) {
          await nuxtApp.hooks.callHook(
            'service-worker:periodic-sync-update-failed',
            {
              url: swUrl,
              error,
              registration: r,
            },
          )
        }
      }, timeout)
    }

    const hooks = nuxtApp.hooks

    const options: RegisterSWOptions = {
      immediate: true,
      onRegisterError(error) {
        hooks.callHook(
          'service-worker:registration-failed',
          { error: error as unknown },
        )
        registrationError.value = true
      },
      onRegisteredSW(swUrl, r) {
        if (import.meta.dev) {
          activateSWSwitcherDev()
        }
        const timeout = periodicSyncForUpdates
        nuxtApp.hooks.callHook(
          'service-worker:registered',
          {
            url: swUrl,
            registration: r,
          },
        )
        // should add support in pwa plugin
        if (r?.active?.state === 'activated') {
          swActivated.value = true
          if (timeout > 0) {
            registerPeriodicSync(swUrl, r, timeout * 1000)
          }
          nuxtApp.hooks.callHook(
            'service-worker:activated',
            {
              url: swUrl,
              registration: r,
            },
          )
        }
        else if (r?.installing) {
          r.installing.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker
            swActivated.value = sw.state === 'activated'
            if (swActivated.value) {
              if (timeout > 0) {
                registerPeriodicSync(swUrl, r, timeout * 1000)
              }
              nuxtApp.hooks.callHook(
                'service-worker:activated',
                {
                  url: swUrl,
                  registration: r,
                },
              )
            }
          })
        }
      },
    }

    if (callBeforeRegisterHook) {
      await hooks.callHook(
        'service-worker:before-register',
        (trustedScriptUrl) => {
          options.trustedScriptUrl = trustedScriptUrl
        },
      )
    }

    const {
      offlineReady,
      needRefresh,
      updateServiceWorker,
    } = useRegisterSW(options)

    async function cancelPrompt() {
      offlineReady.value = false
      needRefresh.value = false
    }

    const {
      isPWAInstalled,
      showInstallPrompt,
      cancelInstall,
      install,
    } = nuxtApp.$pwaInstallPrompt

    return {
      provide: {
        pwa: reactive({
          isPWAInstalled,
          showInstallPrompt,
          cancelInstall,
          install,
          swActivated,
          registrationError,
          offlineReady,
          needRefresh,
          updateServiceWorker,
          cancelPrompt,
        }) satisfies UnwrapNestedRefs<PwaInjection>,
      },
    }
  },
})

export default plugin
