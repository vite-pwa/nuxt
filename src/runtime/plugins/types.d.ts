import type { Ref } from 'vue'
import type { UnwrapNestedRefs } from 'vue'

export interface PwaInjection {
  isInstalled: boolean
  showInstallPrompt: Ref<boolean>
  cancelInstall: () => void
  install: () => Promise<void>
  swActivated: Ref<boolean>
  registrationError: Ref<boolean>
  offlineReady: Ref<boolean>
  needRefresh: Ref<boolean>
  updateServiceWorker: (reloadPage?: boolean | undefined) => Promise<void>
  cancelPrompt: () => Promise<void>
  getSWRegistration: () => ServiceWorkerRegistration | undefined
}

declare module '#app' {
  interface NuxtApp {
    $pwa?: UnwrapNestedRefs<PwaInjection>
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $pwa?: UnwrapNestedRefs<PwaInjection>
  }
}

export {}
