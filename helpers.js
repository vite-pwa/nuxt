/**
 * A list of regular expressions for well-known Nuxt pages that should be excluded from search navigation fallbacks.
 * You can use this array to extend the denylist in your PWA configuration.
 * ```ts
 * import { nuxtNavigateFallbackDenylist } from '@vite-pwa/nuxt/helpers'
 * // ...
 * pwa: {
 *   workbox: {
 *     navigateFallbackDenylist: [
 *       ...nuxtNavigateFallbackDenylist,
 *       // add your own custom routes here
 *     ]
 *   }
 * }
 * ```
 *
 * If you're using `injectManifest` strategy you can do the same in your service worker:
 * ```ts
 * import { nuxtNavigateFallbackDenylist } from '@vite-pwa/nuxt/helpers'
 *
 * let allowlist: RegExp[] | undefined
 * // in dev mode, we disable precaching to avoid caching issues
 * if (import.meta.dev) {
 *   allowlist = [/^\/$/, ...nuxtNavigateFallbackDenylist]
 * }
 *
 * // to allow work offline
 * registerRoute(new NavigationRoute(
 *   createHandlerBoundToURL('/'),
 *   { allowlist },
 * ))
 * ```
 */
export const nuxtNavigateFallbackDenylist = [
  /^\/__nuxt_devtools__/,
  /^\/__nuxt-site-config/,
  /^\/__nuxt-robots/,
  /^\/__nuxt-link-checker/,
  /^\/__nuxt-og-image/,
  /^\/__nuxt-schema-org/,
  /^\/__nuxt-scripts/,
  /^\/__nuxt-devtools-fonts/,
  /^\/__sitemap__/,
]
