import {
  defineNuxtModule,
} from '@nuxt/kit'
import { version } from '../package.json'
import type { PwaModuleOptions } from './types'
import { doSetup } from './utils/module'

export * from './types'

export default defineNuxtModule<PwaModuleOptions>({
  meta: {
    name: 'pwa',
    configKey: 'pwa',
    compatibility: {
      nuxt: '^3.6.5',
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

export interface ModuleOptions extends PwaModuleOptions {}

declare module '@nuxt/schema' {
  interface NuxtConfig {
    ['pwa']?: Partial<ModuleOptions>
  }
  interface NuxtOptions {
    ['pwa']?: ModuleOptions
  }
}
