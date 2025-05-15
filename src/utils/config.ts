import type { Nuxt } from '@nuxt/schema'
import type { NitroConfig } from 'nitropack'
import type { PwaModuleOptions } from '../types'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat } from 'node:fs/promises'
import { resolve } from 'pathe'

export function configurePWAOptions(
  nuxt3_8: boolean,
  options: PwaModuleOptions,
  nuxt: Nuxt,
  nitroConfig: NitroConfig,
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
    options.injectManifest = options.injectManifest ?? {}
    config = options.injectManifest
  }
  else {
    options.strategies = 'generateSW'
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
    // the user may want to disable offline support
    if (!('navigateFallback' in options.workbox))
      options.workbox.navigateFallback = nuxt.options.app.baseURL ?? '/'

    config = options.workbox
  }

  let buildAssetsDir = nuxt.options.app.buildAssetsDir ?? '_nuxt/'
  if (buildAssetsDir[0] === '/')
    buildAssetsDir = buildAssetsDir.slice(1)
  if (buildAssetsDir[buildAssetsDir.length - 1] !== '/')
    buildAssetsDir += '/'

  // Vite 5 support: allow override dontCacheBustURLsMatching
  if (!('dontCacheBustURLsMatching' in config))
    config.dontCacheBustURLsMatching = new RegExp(buildAssetsDir)

  // handle payload extraction
  if (nuxt.options.experimental.payloadExtraction) {
    const enableGlobPatterns = nuxt.options._generate
      || (
        !!nitroConfig.prerender?.routes?.length
        || Object.values(nitroConfig.routeRules ?? {}).some(r => r.prerender)
      )
    if (enableGlobPatterns) {
      config.globPatterns = config.globPatterns ?? []
      config.globPatterns.push('**/_payload.json')
      if (options.strategies === 'generateSW' && options.experimental?.enableWorkboxPayloadQueryParams) {
        options.workbox!.runtimeCaching = options.workbox!.runtimeCaching ?? []
        options.workbox!.runtimeCaching.push({
          urlPattern: /\/_payload\.json\?/,
          handler: 'NetworkOnly',
          options: {
            plugins: [{
              /* this callback will be called when the fetch call fails */
              handlerDidError: async ({ request }) => {
                const url = new URL(request.url)
                url.search = ''
                return Response.redirect(url.href, 302)
              },
              /* this callback will prevent caching the response */
              cacheWillUpdate: async () => null,
            }],
          },
        })
      }
    }
  }

  // handle Nuxt App Manifest
  let appManifestFolder: string | undefined
  if (nuxt3_8 && nuxt.options.experimental.appManifest) {
    config.globPatterns = config.globPatterns ?? []
    appManifestFolder = `${buildAssetsDir}builds/`
    config.globPatterns.push(`${appManifestFolder}**/*.json`)
  }

  // allow override manifestTransforms
  if (!nuxt.options.dev && !config.manifestTransforms)
    config.manifestTransforms = [createManifestTransform(nuxt.options.app.baseURL ?? '/', options.outDir, appManifestFolder)]

  if (options.pwaAssets) {
    options.pwaAssets.integration = {
      baseUrl: nuxt.options.app.baseURL ?? '/',
      publicDir: nuxt.options.dir.public,
      outDir: options.outDir,
    }
  }
}

function createManifestTransform(
  base: string,
  publicFolder: string,
  appManifestFolder?: string,
): import('workbox-build').ManifestTransform {
  return async (entries) => {
    entries.filter(e => e.url.endsWith('.html')).forEach((e) => {
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

    if (appManifestFolder) {
      // this shouldn't be necessary, since we are using dontCacheBustURLsMatching
      // eslint-disable-next-line regexp/no-unused-capturing-group,regexp/no-useless-assertions
      const regExp = /(\/)?[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}\.json$/i
      // we need to remove the revision from the sw prechaing manifest, UUID is enough:
      // we don't use dontCacheBustURLsMatching, single regex
      entries.filter(e => e.url.startsWith(appManifestFolder) && regExp.test(e.url)).forEach((e) => {
        e.revision = null
      })
      // add revision to latest.json file: we are excluding `_nuxt/` assets from dontCacheBustURLsMatching
      const latest = `${appManifestFolder}latest.json`
      const latestJson = resolve(publicFolder, latest)
      const data = await lstat(latestJson).catch(() => undefined)
      if (data?.isFile()) {
        const revision = await new Promise<string>((resolve, reject) => {
          const cHash = createHash('MD5')
          const stream = createReadStream(latestJson)
          stream.on('error', (err) => {
            reject(err)
          })
          stream.on('data', chunk => cHash.update(chunk))
          stream.on('end', () => {
            resolve(cHash.digest('hex'))
          })
        })

        const latestEntry = entries.find(e => e.url === latest)
        if (latestEntry)
          latestEntry.revision = revision
        else
          entries.push({ url: latest, revision, size: data.size })
      }
      else {
        entries = entries.filter(e => e.url !== latest)
      }
    }

    return { manifest: entries, warnings: [] }
  }
}
