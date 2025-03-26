import type { Plugin } from '#app'
import type { UnwrapNestedRefs } from 'vue'
import type { BeforeInstallPromptEvent, PwaInjection, UserChoice } from './types'
import { defineNuxtPlugin } from '#imports'
import { display, installPrompt, periodicSyncForUpdates } from 'virtual:nuxt-pwa-configuration'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { nextTick, reactive, ref } from 'vue'

const plugin: Plugin<{
  pwa?: UnwrapNestedRefs<PwaInjection>
}> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:client:plugin',
  enforce: 'post',
  parallel: true,
  setup(nuxtApp) {
    const registrationError = ref(false)
    const swActivated = ref(false)
    const showInstallPrompt = ref(false)
    const hideInstall = ref(!installPrompt ? true : localStorage.getItem(installPrompt) === 'true')

    // https://thomashunter.name/posts/2021-12-11-detecting-if-pwa-twa-is-installed
    const ua = navigator.userAgent
    const ios = ua.match(/iPhone|iPad|iPod/)
    const useDisplay = display === 'standalone' || display === 'minimal-ui' ? `${display}` : 'standalone'
    const standalone = window.matchMedia(`(display-mode: ${useDisplay})`).matches
    const isInstalled = ref(!!(standalone || (ios && !ua.match(/Safari/))))
    const isPWAInstalled = ref(isInstalled.value)

    window.matchMedia(`(display-mode: ${useDisplay})`).addEventListener('change', (e) => {
      // PWA on fullscreen mode will not match standalone nor minimal-ui
      if (!isPWAInstalled.value && e.matches)
        isPWAInstalled.value = true
    })

    let swRegistration: ServiceWorkerRegistration | undefined

    const getSWRegistration = () => swRegistration

    const registerPeriodicSync = (swUrl: string, r: ServiceWorkerRegistration, timeout: number) => {
      setInterval(async () => {
        // prevent fetch when installing new service worker
        if ((r && r.installing) || (('connection' in navigator) && !navigator.onLine))
          return

        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: {
            'cache': 'no-store',
            'cache-control': 'no-cache',
          },
        })

        if (resp?.status === 200)
          await r.update()
      }, timeout)
    }

    const {
      offlineReady,
      needRefresh,
      updateServiceWorker,
    } = useRegisterSW({
      immediate: true,
      onRegisterError(error) {
        nuxtApp.hooks.callHook('service-worker:registration-failed', { error: error as unknown })
        registrationError.value = true
      },
      onRegisteredSW(swUrl, r) {
        swRegistration = r
        const timeout = periodicSyncForUpdates
        nuxtApp.hooks.callHook('service-worker:registered', { url: swUrl, registration: r })
        // should add support in pwa plugin
        if (r?.active?.state === 'activated') {
          swActivated.value = true
          if (timeout > 0) {
            registerPeriodicSync(swUrl, r, timeout * 1000)
          }
          nuxtApp.hooks.callHook('service-worker:activated', { url: swUrl, registration: r })
        }
        else if (r?.installing) {
          r.installing.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker
            swActivated.value = sw.state === 'activated'
            if (swActivated.value) {
              if (timeout > 0) {
                registerPeriodicSync(swUrl, r, timeout * 1000)
              }
              nuxtApp.hooks.callHook('service-worker:activated', { url: swUrl, registration: r })
            }
          })
        }
      },
    })

    const cancelPrompt = async () => {
      offlineReady.value = false
      needRefresh.value = false
    }

    let install: () => Promise<UserChoice | undefined> = () => Promise.resolve(undefined)
    let cancelInstall: () => void = () => {
    }

    if (!hideInstall.value) {
      let deferredPrompt: BeforeInstallPromptEvent | undefined

      const beforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        deferredPrompt = e as BeforeInstallPromptEvent
        showInstallPrompt.value = true
      }
      window.addEventListener('beforeinstallprompt', beforeInstallPrompt)
      window.addEventListener('appinstalled', () => {
        deferredPrompt = undefined
        showInstallPrompt.value = false
      })

      cancelInstall = () => {
        deferredPrompt = undefined
        showInstallPrompt.value = false
        window.removeEventListener('beforeinstallprompt', beforeInstallPrompt)
        hideInstall.value = true
        localStorage.setItem(installPrompt!, 'true')
      }

      install = async () => {
        if (!showInstallPrompt.value || !deferredPrompt) {
          showInstallPrompt.value = false
          return undefined
        }

        showInstallPrompt.value = false
        await nextTick()
        deferredPrompt.prompt()
        return await deferredPrompt.userChoice
      }
    }

    return {
      provide: {
        pwa: reactive({
          isInstalled,
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
          getSWRegistration,
        }) satisfies UnwrapNestedRefs<PwaInjection>,
      },
    }
  },
})

export default plugin
