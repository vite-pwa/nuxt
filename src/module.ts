import type { PwaModuleOptions } from './types'
import { defineNuxtModule } from '@nuxt/kit'
import { version } from '../package.json'
import { doSetup } from './utils/module'

export * from './types'

export interface ModuleOptions extends PwaModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'pwa',
    configKey: 'pwa',
    compatibility: {
      nuxt: '>=3.6.5',
      bridge: false,
    },
    version,
  },
  defaults: nuxt => ({
    base: nuxt.options.app.baseURL,
    scope: nuxt.options.app.baseURL,
    injectRegister: false,
    includeManifestIcons: false,
    registerPlugin: true,
    writePlugin: false,
    client: {
      registerPlugin: true,
      installPrompt: false,
      periodicSyncForUpdates: 0,
    },
  }),
  async setup(options, nuxt) {
    await doSetup(options, nuxt)
  },
})
