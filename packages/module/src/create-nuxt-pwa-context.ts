import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { PwaOptions } from '@vite-pwa/nuxt-core/types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import { styleText } from 'node:util'
import { getNuxtVersion } from '@nuxt/kit'

export async function createNuxtPwaContext<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  options: PwaOptions<UserStrategy, T>,
  nuxt: Nuxt,
  moduleResolver: ReturnType<typeof import('@nuxt/kit')['createResolver']>,
): Promise<NPWAC> {
  const nuxtVersion = getNuxtVersion(nuxt)
  let buildAssetsDir = nuxt.options.app.buildAssetsDir ?? '_nuxt/'
  if (buildAssetsDir[0] === '/') {
    buildAssetsDir = buildAssetsDir.slice(1)
  }
  if (buildAssetsDir[buildAssetsDir.length - 1] !== '/') {
    buildAssetsDir += '/'
  }

  if (options.builder) {
    return await options.builder.build(
      nuxtVersion,
      buildAssetsDir,
      options,
      nuxt,
      moduleResolver,
    ) as unknown as NPWAC
  }

  if (nuxt.options.builder === '@nuxt/vite-builder') {
    // TODO: add nostics
    return import('@vite-pwa/nuxt-vite').then(({
      builder,
    }) => builder.build(
      nuxtVersion,
      buildAssetsDir,
      options,
      nuxt,
      moduleResolver,
    ) as unknown as NPWAC)
  }

  const builder = typeof nuxt.options.builder === 'string'
    ? nuxt.options.builder
    : 'custom'

  throw new Error([
    '',
    styleText('cyan', `[Nuxt PWA] Bundler '${builder}' not yet supported`),
  ].join('\n'))
}
