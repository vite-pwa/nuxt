import type { Nuxt } from '@nuxt/schema'
import type { VitePWAOptions, VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { NuxtPWAContext } from './context-types.ts'

export interface NuxtPWAContextBuilder {
  build: <
    B extends Bundler,
    UserStrategy extends VitePWAStrategy,
    T extends SWType,
    PWAContext extends NuxtPWAContext<B, UserStrategy, T>,
  >(
    nuxtVersion: string,
    buildAssetsDir: string,
    options: PwaOptions<UserStrategy, T>,
    nuxt: Nuxt,
    moduleResolver: ReturnType<typeof import('@nuxt/kit')['createResolver']>,
  ) => Promise<PWAContext>
}

export interface ClientOptions {
  /**
   * Expose the plugin?.
   *
   * @default true
   */
  registerPlugin?: boolean
  /**
   * Registers a periodic sync for updates interval: value in seconds.
   */
  periodicSyncForUpdates?: number
  /**
   * Will prevent showing native PWA install prompt.
   *
   * When set to true or non-empty string, the native PWA install prompt will be prevented.
   *
   * When set to a string, it will be used as the key in `localStorage` to prevent showing the native PWA install prompt widget.
   *
   * When set to true, the key used will be `vite-pwa:hide-install`.
   *
   * @default false
   */
  installPrompt?: boolean | string
}

export interface PwaOptions<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
> extends VitePWAOptions<UserStrategy, T> {
  builder?: NuxtPWAContextBuilder
  /**
   * Experimental features.
   */
  experimental?: {
    /**
     * NOTE: this option will be ignored if using `build-sw` or inject-manifest` strategies or when Nuxt experimental payload
     * extraction is disabled.
     *
     * Enable custom runtime caching to resolve the payload.json requests with query parameters when offline:
     * - Nuxt SSG will generate a payload.json file and will fetch it with a query parameter.
     * - The service worker cannot resolve the payload.json request with query parameters, and you won't get the payload when offline.
     *
     * Enabling this option will add a custom runtime caching handler to the service worker to resolve the payload files
     * with query parameters when offline: the runtime caching handler will redirect to the payload.json file without
     * query parameters when the original request fails.
     *
     * The new `@vite-pwa/workbox-build` allows `urlManipulation` option for `precacheAndRoute` when using `generate-sw` strategy.
     *
     * If you're using `build-sw` or `inject-manifest` strategy, you can fix the issue in your custom service worker adding the
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
     *       }
     *       return urls
     *     }
     *   }
     * )
     * ```
     */
    enableGenerateSWPayloadQueryParams?: true
    /**
     * @deprecated use `enableGenerateSWPayloadQueryParams` instead.
     */
    enableWorkboxPayloadQueryParams?: true
  }
  /**
   * Should add nitro route rules for the web manifest?.
   *
   * @default false
   */
  registerWebManifestInRouteRules?: boolean
  /**
   * Writes the plugin to disk.
   *
   * @default false
   */
  writePlugin?: boolean
  /**
   * Options for plugin.
   */
  client?: ClientOptions
}
