import { ref, reactive, nextTick, type UnwrapNestedRefs } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { defineNuxtPlugin } from '#imports'

import { type PwaInjection } from '@vite-pwa/nuxt'

const options: { periodicSyncForUpdates: number; installPrompt?: string } = <%= JSON.stringify(options) %>

export default defineNuxtPlugin(() => {
  const registrationError = ref(false)
  const swActivated = ref(false)
  const showInstallPrompt = ref(false)
  const hideInstall = ref(!options.installPrompt ? true : localStorage.getItem(options.installPrompt) === 'true')

  // https://thomashunter.name/posts/2021-12-11-detecting-if-pwa-twa-is-installed
  const ua = navigator.userAgent
  const ios = ua.match(/iPhone|iPad|iPod/)
  const standalone = window.matchMedia('(display-mode: standalone)').matches
  const isInstalled = !!(standalone || (ios && !ua.match(/Safari/)))

  let swRegistration: ServiceWorkerRegistration | undefined

  const getSWRegistration = () => swRegistration

  const registerPeriodicSync = (swUrl: string, r: ServiceWorkerRegistration, timeout: number) => {
    setInterval(async () => {
      if (('connection' in navigator) && !navigator.onLine)
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
    offlineReady, needRefresh, updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError() {
      registrationError.value = true
    },
    onRegisteredSW(swUrl, r) {
      swRegistration = r
      const timeout = options.periodicSyncForUpdates
      if (timeout > 0) {
        // should add support in pwa plugin
        if (r?.active?.state === 'activated') {
          swActivated.value = true
          registerPeriodicSync(swUrl, r, timeout * 1000)
        }
        else if (r?.installing) {
          r.installing.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker
            swActivated.value = sw.state === 'activated'
            if (swActivated.value)
              registerPeriodicSync(swUrl, r, timeout * 1000)
          })
        }
      }
    },
  })

  const cancelPrompt = async () => {
    offlineReady.value = false
    needRefresh.value = false
  }

  let install: () => Promise<void> = () => Promise.resolve()
  let cancelInstall: () => void = () => {}

  if (!hideInstall.value) {
    type InstallPromptEvent = Event & {
      prompt: () => void
      userChoice: Promise<{ outcome: 'dismissed' | 'accepted' }>
    }

    let deferredPrompt: InstallPromptEvent | undefined

    const beforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as InstallPromptEvent
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
      localStorage.setItem(options.installPrompt!, 'true')
    }

    install = async () => {
      if (!showInstallPrompt.value || !deferredPrompt) {
        showInstallPrompt.value = false
        return
      }

      showInstallPrompt.value = false
      await nextTick()
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
    }
  }

  return {
    provide: {
      pwa: reactive({
        isInstalled,
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
})
