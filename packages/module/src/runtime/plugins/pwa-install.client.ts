import type { Plugin } from '#app'
import type { BeforeInstallPromptEvent, PwaInstallPromptInjection, UserChoice } from './types'
import {
  display,
  installPrompt,
} from 'virtual:nuxt-pwa-configuration'
import { defineNuxtPlugin, nextTick, ref } from '#imports'

const plugin: Plugin<{
  pwaInstallPrompt: PwaInstallPromptInjection
}> = defineNuxtPlugin({
  name: 'vite-pwa:nuxt:client:install-prompt-plugin',
  enforce: 'pre',
  setup() {
    const showInstallPrompt = ref(false)
    const hideInstall = ref(
      !installPrompt
        ? true
        : localStorage.getItem(installPrompt) === 'true',
    )

    // https://thomashunter.name/posts/2021-12-11-detecting-if-pwa-twa-is-installed
    const ua = navigator.userAgent
    const ios = ua.match(/iPhone|iPad|iPod/)
    const useDisplay = display === 'standalone' || display === 'minimal-ui'
      ? `${display}`
      : 'standalone'
    const standalone = window.matchMedia(`(display-mode: ${useDisplay})`).matches
    const isInstalled = ref(!!(standalone || (ios && !ua.match(/Safari/))))
    const isPWAInstalled = ref(isInstalled.value)

    window.matchMedia(`(display-mode: ${useDisplay})`).addEventListener('change', (e) => {
      // PWA on fullscreen mode will not match standalone nor minimal-ui
      if (!isPWAInstalled.value && e.matches) {
        isPWAInstalled.value = true
      }
    })

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
        pwaInstallPrompt: {
          isPWAInstalled,
          showInstallPrompt,
          cancelInstall,
          install,
        },
      },
    }
  },
})

export default plugin
