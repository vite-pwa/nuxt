import type { ClientOptions } from './types.ts'

export interface NitroPWAOptions {
  publicAssets: {
    baseURL?: string
    fallthrough?: boolean
    maxAge: number
    dir: string
  }[]
  routeRules: Record<string, Record<string, any>>
}

export interface PWAPluginContextOptions {
  nuxtVersion: string
  nitroPWAOptions: NitroPWAOptions
  publicDirs: string[]
  buildAssetsDir: string
  enableGlobPatterns?: boolean
  appManifestFolder?: string
  client: Required<ClientOptions>
  /**
   * Called at `nitro:init` hook if builder requires adding some custom PWA options.
   */
  preparePwaConfiguration?: () => Promise<void> | void
  /**
   * Configure builder specific options, called at `build:done` hook.
   */
  prepareNuxtOptions: () => Promise<void> | void
  /**
   * The resolver using the module path.
   */
  moduleResolver: ReturnType<typeof import('@nuxt/kit')['createResolver']>
  experimental?: {
    /**
     * @deprecated use `enableGenerateSWPayloadQueryParams` instead.
     */
    enableWorkboxPayloadQueryParams?: true
    /**
     * When using `generateSW/generate-sw` strategy, enabling this option will add a runtime caching
     * when using `nitro.options.static` or `generate` nuxt command for payload.json files.
     */
    enableGenerateSWPayloadQueryParams?: true
  }
  /**
   * Should add nitro route rules for the web manifest?.
   */
  registerWebManifestInRouteRules?: boolean
  /**
   * Writes the plugin to disk: defaults to false (debug).
   */
  writePlugin?: boolean
}
