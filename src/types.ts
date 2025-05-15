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

export interface PwaModuleOptions extends Partial<VitePWAOptions> {
  /**
   * Experimental features.
   */
  experimental?: {
    /**
     * NOTE: this option will be ignored if using `injectManifest` strategy or when Nuxt experimental payload extraction
     * is disabled.
     *
     * Enable custom runtime caching to resolve the payload.json requests with query parameters:
     * - Workbox doesn't allow to configure `precacheAndRoute` `urlManipulation` option when using the `generateSW` strategy.
     * - Nuxt SSG will generate a payload.json file and will fetch it with a query parameter.
     * - The service worker cannot resolve the payload.json request with query parameters, and you won't get the payload.
     *
     * Enabling this option will add a custom runtime caching handler to the service worker to resolve the payload files
     * with query parameters.
     *
     * If you're using `injectManifest` strategy, you can fix the issue in your custom service worker adding the
     * following `urlManipulation` callback to the `precacheAndRouter` call:
     * ```ts
     * // self.__WB_MANIFEST is the default injection point
     * precacheAndRoute(
     *   self.__WB_MANIFEST,
     *   {
     *     urlManipulation: ({ url }) => {
     *       const urls: URL[] = []
     *       if (url.pathname.endsWith('_payload.json')) {
     *         const newUrl = new URL(url.href)
     *         newUrl.search = ''
     *         urls.push(newUrl)
     *      }
     *      return urls
     *    }
     *  }
     * )
     */
    enableWorkboxPayloadQueryParams?: true
  }
  registerWebManifestInRouteRules?: boolean
  /**
   * Writes the plugin to disk: defaults to false (debug).
   */
  writePlugin?: boolean
  /**
   * Options for plugin.
   */
  client?: ClientOptions
}
