import type { Nuxt, NuxtPage } from '@nuxt/schema'
import { resolve } from 'pathe'
import type { NitroConfig } from 'nitropack'
import type { RuntimeCaching } from 'workbox-build'
import type { ModuleOptions } from './types'

export function configurePWAOptions(
  options: ModuleOptions,
  nuxt: Nuxt,
  nitroConfig: NitroConfig,
  ssrPages?: NuxtPage[],
) {
  if (!options.outDir) {
    const publicDir = nitroConfig.output?.publicDir ?? nuxt.options.nitro?.output?.publicDir
    options.outDir = publicDir ? resolve(publicDir) : resolve(nuxt.options.buildDir, '../.output/public')
  }

  // generate dev sw in .nuxt folder: we don't need to remove it
  if (options.devOptions?.enabled)
    options.devOptions.resolveTempFolder = () => resolve(nuxt.options.buildDir, 'dev-sw-dist')

  let config: Partial<
    import('workbox-build').BasePartial
    & import('workbox-build').GlobPartial
    & import('workbox-build').RequiredGlobDirectoryPartial
  >

  if (options.strategies === 'injectManifest') {
    // TODO: handle enableSSR, we need to inject the routeRules with a custom recipe
    options.injectManifest = options.injectManifest ?? {}
    config = options.injectManifest
  }
  else {
    options.workbox = options.workbox ?? {}
    if (options.registerType === 'autoUpdate' && (options.client?.registerPlugin || options.injectRegister === 'script' || options.injectRegister === 'inline')) {
      options.workbox.clientsClaim = true
      options.workbox.skipWaiting = true
    }
    if (nuxt.options.dev) {
      // on dev force always to use the root
      options.workbox.navigateFallback = options.workbox.navigateFallback ?? nuxt.options.app.baseURL ?? '/'
      if (options.devOptions?.enabled && !options.devOptions.navigateFallbackAllowlist)
        options.devOptions.navigateFallbackAllowlist = [nuxt.options.app.baseURL ? new RegExp(nuxt.options.app.baseURL) : /\//]
    }
    else if (ssrPages?.length) {
      const {
        cache = false,
        cacheName = 'ssr-pages',
        offlinePage = `${nuxt.options.app.baseURL ?? '/'}error?offline`,
      } = options.enableSSR!
      // 1. filter prerender pages: will go to the sw precache manifest
      // what happens if prerender is enabled but prerender routes with ssr?
      // don't use nitroConfig, we have _nuxt and __nuxt_error
      const prerenderPages = nuxt.options.nitro.prerender?.routes ?? []
      const rules = collectRules(ssrPages.filter(p => !prerenderPages.includes(p.path)))
      // 2. prepare runtime caching for ssr pages
      const routesInfo = Array.from(rules.keys()).map(r => createSSRHandler(r))
      // 3. configure workbox properly: since we have two builds, we need to check if previously added
      if (routesInfo.length > 0) {
        const navigateFallbackDenylist = options.workbox.navigateFallbackDenylist ?? []
        const runtimeCaching = options.workbox.runtimeCaching ?? []
        routesInfo.forEach((r) => {
          const path = r.urlPattern as string
          const { exp, dynamic } = rules.get(path)!
          const source = exp.source
          if (!navigateFallbackDenylist.some(d => d.source === source))
            navigateFallbackDenylist.push(exp)

          const index = runtimeCaching.findIndex(d => d.urlPattern === path)
          if (index > -1)
            runtimeCaching[index] = createSSRHandlerFunction(cache, cacheName, offlinePage, exp, dynamic)
          else
            runtimeCaching.push(r)
        })
        options.workbox.navigateFallbackDenylist = navigateFallbackDenylist
        options.workbox.runtimeCaching = runtimeCaching
      }
    }
    config = options.workbox
  }
  if (!nuxt.options.dev)
    config.manifestTransforms = [createManifestTransform(nuxt.options.app.baseURL ?? '/')]
}

function createManifestTransform(base: string): import('workbox-build').ManifestTransform {
  return async (entries) => {
    // prefix non html assets with base
    entries.filter(e => e && e.url.endsWith('.html')).forEach((e) => {
      const url = e.url.startsWith('/') ? e.url.slice(1) : e.url
      if (url === 'index.html') {
        e.url = base
      }
      else {
        const parts = url.split('/')
        parts[parts.length - 1] = parts[parts.length - 1].replace(/\.html$/, '')
        e.url = parts.length > 1 ? parts.slice(0, parts.length - 1).join('/') : parts[0]
      }
    })

    return { manifest: entries, warnings: [] }
  }
}

function createSSRHandler(route: string): RuntimeCaching {
  return {
    urlPattern: route,
    handler: 'NetworkOnly',
  }
}

function createSSRHandlerFunction(
  cache: boolean,
  cacheName: string,
  offlinePage: string,
  regex: RegExp,
  dynamic: boolean,
): RuntimeCaching {
  return cache && !dynamic
    // eslint-disable-next-line no-eval
    ? eval(`() => ({
    urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.match(${regex}),
    handler: 'NetworkFirst',
    options: {
      cacheName: ${JSON.stringify(cacheName)},
      cacheableResponse: {
        statuses: [200]
      },
      matchOptions: {
        ignoreVary: true,
        ignoreSearch: true
      },
      plugins: [{
        handlerDidError: async () => Response.redirect(${JSON.stringify(offlinePage)}, 302),
        cacheWillUpdate: async ({ response }) => response.status === 200 ? response : null
      }]
    }
  })`)()
  // eslint-disable-next-line no-eval
    : eval(`() => ({
    urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.match(${regex}),
    handler: 'NetworkOnly',
    options: {
      matchOptions: {
        ignoreVary: true,
        ignoreSearch: true
      },
      plugins: [{
        handlerDidError: async () => Response.redirect(${JSON.stringify(offlinePage)}, 302),
        cacheWillUpdate: async () => null
      }]
    }
  })`)()
}

function createRouteRegex(path: string) {
  const dynamicRoute = path.indexOf(':')
  return dynamicRoute > -1
    ? { exp: new RegExp(`^${path.slice(0, dynamicRoute)}`), dynamic: true }
    : { exp: new RegExp(`^${path}$`), dynamic: false }
}

function traversePage(page: NuxtPage, rules: Map<string, { exp: RegExp; dynamic: boolean }>, parentRoute?: string) {
  const path = `${parentRoute ? `${parentRoute}/` : ''}${page.path}`
  const route = createRouteRegex(path)
  rules.set(path, route)
  if (!route.dynamic) {
    if (page.children?.length) {
      page.children?.filter(p => p.path !== '')
        .sort((a, b) => {
          if (a.path.startsWith(':'))
            return 1

          if (b.path.startsWith(':'))
            return -1

          return b.path.length - a.path.length
        })
        .forEach(p => traversePage(p, rules, path))
    }
  }
}

function collectRules(ssrPages: NuxtPage[]) {
  const rules = new Map<string, { exp: RegExp; dynamic: boolean }>()
  ssrPages.forEach(p => traversePage(p, rules))
  return rules
}
