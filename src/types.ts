import type { VitePWAOptions } from 'vite-plugin-pwa'

export interface ClientOptions {
  /**
   * Exposes the plugin: defaults to true.
   */
  registerPlugin?: boolean
  /**
   * Registers a periodic sync for updates interval: value in seconds.
   */
  periodicSyncForUpdates?: number
  /**
   * Will prevent showing native PWA install prompt: defaults to false.
   *
   * When set to true or no empty string, the native PWA install prompt will be prevented.
   *
   * When set to a string, it will be used as the key in `localStorage` to prevent show the PWA install prompt widget.
   *
   * When set to true, the key used will be `vite-pwa:hide-install`.
   */
  installPrompt?: boolean | string
}

export interface AllowListOptions {
  /**
   * The redirection page when the route is not found.
   *
   * @default '404'
   */
  redirectPage?: string
}

export interface PwaModuleOptions extends Partial<VitePWAOptions> {
  registerWebManifestInRouteRules?: boolean
  /**
   * Writes the plugin to disk: defaults to false (debug).
   */
  writePlugin?: boolean
  /**
   * Options for plugin.
   */
  client?: ClientOptions
  /**
   * Experimental options.
   */
  experimental?: {
    /**
     * Only for `generateSW` strategy, include the logic to handle the `workbox.navigateFallbackAllowlist` option.
     *
     * When using `true`, this module will include a Workbox runtime caching for all dynamic and missing routes using `NetworkOnly` strategy via `404` redirection.
     *
     * You can create a custom page to replace `404` using the `redirectPage` option, remember the page **MUST** be prerenderer, cannot be dynamic or SSR page.
     *
     * @default false
     */
    includeAllowlist?: boolean | AllowListOptions
  }
}
