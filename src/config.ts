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
      // 1. filter prerender pages: will go to the sw precache manifest
      // what happens if prerender is enabled but prerender routes with ssr?
      // don't use nitroConfig, we have _nuxt and __nuxt_error
      const prerenderPages = nuxt.options.nitro.prerender?.routes ?? []
      const rules = collectRules(ssrPages.filter(p => !prerenderPages.includes(p.path)))
      // 2. include routeRules: don't use nitroConfig, we have _nuxt and __nuxt_error
      Object.entries(nuxt.options.nitro.routeRules ?? {}).filter(([, rule]) => {
        return !rule.prerender && rule.ssr
      }).forEach(([path]) => rules.add(createRouteRuleRegex(path)))
      // 2. prepare runtime caching for ssr pages
      const routesInfo = Array.from(rules).map(createSSRHandler)
      // 3. configure workbox properly: since we have 2 builds we need to check if previously added
      if (routesInfo.length > 0) {
        const navigateFallbackDenylist = options.workbox.navigateFallbackDenylist ?? []
        const runtimeCaching = options.workbox.runtimeCaching ?? []
        routesInfo.forEach((r) => {
          const regexp = r.urlPattern as RegExp
          if (!navigateFallbackDenylist.some(d => d.source === regexp.source))
            navigateFallbackDenylist.push(regexp)

          if (!runtimeCaching.some(d => typeof d.urlPattern !== 'string' && typeof d.urlPattern !== 'function' && d.urlPattern.source === regexp.source))
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
    urlPattern: new RegExp(route),
    handler: 'NetworkOnly',
  }
}

function createRouteRegex(path: string): [route: string, dynamic: boolean] {
  const dynamicRoute = path.indexOf(':')
  return dynamicRoute > -1 ? [`^${path.slice(0, dynamicRoute)}`, true] : [`^${path}$`, false]
}

function createRouteRuleRegex(routeRule: string) {
  const routePath = routeRule.endsWith('/*')
    ? `^${routeRule.slice(routeRule.length - 1)}`
    : routeRule.endsWith('/**')
      ? `^${routeRule.slice(routeRule.length - 2)}`
      : `^${routeRule}$`

  return `${routePath.replace(/\*\*?/g, '.*')}`
}

function traversePage(page: NuxtPage, rules: Set<string>) {
  // If a page is excluded, then all its children should.
  // We'll have static and dynamic pages, for example:
  // hi/[id].vue: this case is not a problem, we can exclude the page with params
  // /list with server content: a table for example, in this case we need to exclude the page and the children
  // In previous case, if we have /list/[id].vue, we exclude all children
  const [route, dynamic] = createRouteRegex(page.path)
  // In case we have children, exclude all of them if the route is not dynamic.
  // We replace the $ with / to match any child route
  if (page.children?.length && !dynamic)
    rules.add(`${route.slice(0, route.length - 1)}/`)

  rules.add(route)
}

function collectRules(ssrPages: NuxtPage[]) {
  const rules = new Set<string>()
  ssrPages.forEach(p => traversePage(p, rules))
  return rules
}
