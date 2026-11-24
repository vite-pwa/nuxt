import type { RegisterSWOptions } from '@unplugin-pwa/core/types'
import type { ShallowRef, UnwrapNestedRefs } from 'vue'
import type { NuxtApp } from '#app'
import type { BeforeInstallPromptEvent, PwaInjection, UserChoice } from './types'
import {
  activateSWSwitcherDev,
  callBeforeRegisterHook,
  display,
  initializeDev,
  installPrompt,
  periodicSyncForUpdates,
} from 'virtual:nuxt-pwa-configuration'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { computed, nextTick, reactive, shallowRef } from '#imports'

export async function createClientPwa(nuxtApp: NuxtApp): Promise<UnwrapNestedRefs<PwaInjection>> {
  if (import.meta.dev) {
    initializeDev()
  }
  const registrationError = shallowRef(false)
  const swActivated = shallowRef(false)
  const hydrated = shallowRef(!nuxtApp.isHydrating)
  if (nuxtApp.isHydrating) {
    nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
      hydrated.value = true
    })
  }

  function afterHydration(value: ShallowRef<boolean>) {
    return computed({
      get: () => hydrated.value && value.value,
      set: (newValue: boolean) => { value.value = newValue },
    })
  }

  let earlyEvent: BeforeInstallPromptEvent | undefined
  if (import.meta.dev) {
    const promptWindow = window as Window & {
      __vitePwaInstallPrompt?: {
        event?: BeforeInstallPromptEvent
        beforeInstallPrompt: EventListener
        appInstalled: EventListener
      }
    }
    const earlyPrompt = promptWindow.__vitePwaInstallPrompt
    if (earlyPrompt) {
      earlyEvent = earlyPrompt.event
      window.removeEventListener('beforeinstallprompt', earlyPrompt.beforeInstallPrompt)
      window.removeEventListener('appinstalled', earlyPrompt.appInstalled)
      delete promptWindow.__vitePwaInstallPrompt
    }
  }

  const showInstallPrompt = shallowRef(false)
  const ua = navigator.userAgent
  const ios = ua.match(/iPhone|iPad|iPod/)
  const useDisplay = display === 'standalone' || display === 'minimal-ui'
    ? display
    : 'standalone'
  const displayMode = window.matchMedia(`(display-mode: ${useDisplay})`)
  let isInstalled = !!(displayMode.matches || (ios && !ua.match(/Safari/)))
  const isPWAInstalled = shallowRef<boolean | undefined>(nuxtApp.isHydrating ? undefined : isInstalled)
  if (nuxtApp.isHydrating) {
    nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
      isPWAInstalled.value = isInstalled
    })
  }
  displayMode.addEventListener('change', (e) => {
    if (!isInstalled && e.matches) {
      isInstalled = true
      if (!nuxtApp.isHydrating)
        isPWAInstalled.value = true
    }
  })

  let install: () => Promise<UserChoice | undefined> = async () => undefined
  let cancelInstall: () => void = () => {}
  const installPromptKey = installPrompt
  if (installPromptKey && localStorage.getItem(installPromptKey) !== 'true') {
    let deferredPrompt = earlyEvent
    if (nuxtApp.isHydrating) {
      nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
        showInstallPrompt.value = !!deferredPrompt
      })
    }
    else {
      showInstallPrompt.value = !!deferredPrompt
    }

    const beforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      if (!nuxtApp.isHydrating)
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
      localStorage.setItem(installPromptKey, 'true')
    }
    install = async () => {
      if (!showInstallPrompt.value || !deferredPrompt) {
        showInstallPrompt.value = false
        return undefined
      }
      showInstallPrompt.value = false
      const prompt = deferredPrompt
      deferredPrompt = undefined
      await nextTick()
      prompt.prompt()
      return await prompt.userChoice
    }
  }

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

  return reactive({
    isPWAInstalled,
    showInstallPrompt,
    cancelInstall,
    install,
    swActivated: afterHydration(swActivated),
    registrationError: afterHydration(registrationError),
    offlineReady: afterHydration(offlineReady),
    needRefresh: afterHydration(needRefresh),
    updateServiceWorker,
    cancelPrompt,
  }) satisfies UnwrapNestedRefs<PwaInjection>
}
