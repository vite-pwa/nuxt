import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { generateWebManifest } from '@unplugin-pwa/core/generate-web-manifest'

export async function buildPwaAssets<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
  nuxt: Nuxt,
) {
  const pwaAssetsGenerator = await ctx.pwaAssetsGenerator
  if (pwaAssetsGenerator) {
    await pwaAssetsGenerator.generate()
    pwaAssetsGenerator.injectManifestIcons()
  }

  if (ctx.resolvedOptions.manifest) {
    const webManifest = generateWebManifest(ctx as any)
    await fs.writeFile(
      path.resolve(ctx.outDir, ctx.resolvedOptions.manifestFilename || 'manifest.webmanifest'),
      webManifest,
      'utf-8',
    )
  }

  if (!ctx.resolvedOptions.disable) {
    await nuxt.callHook('pwa:beforeBuildServiceWorker', ctx.resolvedOptions as any)
    await ctx.runBuild()
  }
}
