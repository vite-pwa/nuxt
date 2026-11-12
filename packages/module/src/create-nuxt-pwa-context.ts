import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { NuxtPWAModuleResolver } from '@vite-pwa/nuxt-core/shared-types'
import type { PwaOptions } from '@vite-pwa/nuxt-core/types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import { getNuxtVersion, useLogger } from '@nuxt/kit'

export async function createNuxtPwaContext<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  options: PwaOptions<UserStrategy, T>,
  nuxt: Nuxt,
  moduleResolver: NuxtPWAModuleResolver,
): Promise<NPWAC | undefined> {
  const nuxtVersion = getNuxtVersion(nuxt)
  let buildAssetsDir = nuxt.options.app.buildAssetsDir ?? '_nuxt/'
  if (buildAssetsDir[0] === '/') {
    buildAssetsDir = buildAssetsDir.slice(1)
  }
  if (buildAssetsDir[buildAssetsDir.length - 1] !== '/') {
    buildAssetsDir += '/'
  }

  const builder = options.builder
    ?? (nuxt.options.builder === '@nuxt/vite-builder'
      ? await import('@vite-pwa/nuxt-vite').then(m => m.builder)
      : undefined)

  if (!builder) {
    const name = typeof nuxt.options.builder === 'string'
      ? nuxt.options.builder
      : 'custom'
    useLogger('@vite-pwa/nuxt').warn(`Builder \`${name}\` is not supported yet, PWA support is disabled.`)
    return undefined
  }

  return await builder.build(
    nuxtVersion,
    buildAssetsDir,
    options,
    nuxt,
    moduleResolver,
  ) as unknown as NPWAC
}
