import type { ClientOptions, PwaOptions } from './types.ts'

export interface NitroPWAOptions {
  routeRules: Record<string, Record<string, any>>
}

/**
 * Module path resolver, compatible with the one returned by `createResolver` from `@nuxt/kit`.
 */
export interface NuxtPWAModuleResolver {
  resolve: (...path: string[]) => string
  resolvePath: (path: string, options?: {
    cwd?: string
    alias?: Record<string, string>
    extensions?: string[]
  }) => Promise<string>
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
   * Configure builder specific options, called at `build:before` hook.
   */
  prepareNuxtOptions: () => Promise<void> | void
  /**
   * The resolver using the module path.
   */
  moduleResolver: NuxtPWAModuleResolver
  experimental?: PwaOptions<any, any>['experimental']
  /**
   * Should add nitro route rules for the web manifest?.
   */
  registerWebManifestInRouteRules?: boolean
  /**
   * Writes the plugin to disk: defaults to false (debug).
   */
  writePlugin?: boolean
}
