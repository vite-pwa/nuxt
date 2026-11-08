import type { Nuxt } from '@nuxt/schema'
import type { PWAAssetsIntegrationOptions } from '@unplugin-pwa/core'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import fs from 'node:fs'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { preparePWAAssetsGenerator } from '@unplugin-pwa/core/helpers'

export async function initPwaAssetsGenerator(
  ctx: NuxtPWAContext<any, any, any>,
  nuxt: Nuxt,
): Promise<void> {
  if (ctx.resolvedOptions.pwaAssets) {
    const config = ctx.resolvedOptions.pwaAssets.config
    if (typeof config === 'string') {
      ctx.resolvedOptions.pwaAssets.config = await ctx.nuxt.moduleResolver.resolvePath(
        config,
        {
          cwd: nuxt.options.rootDir,
          alias: nuxt.options.alias,
        },
      )
    }
    ctx.resolvedOptions.pwaAssets.integration = {
      baseUrl: ctx.base,
      publicDir: ctx.publicDir,
      outDir: ctx.outDir,
      resolveImage: resolveImageFactory(ctx, nuxt),
    }

    // prepare pwa assets generator
    preparePWAAssetsGenerator(ctx as any)
  }
}

async function checkFileExists(pathname: string): Promise<boolean> {
  try {
    await access(pathname, fs.constants.R_OK)
  }
  catch {
    return false
  }

  return true
}

function* preparePaths(
  nuxt: Nuxt,
  imageName: string,
  layers: boolean = false,
): Generator<string, undefined, void> {
  if (layers) {
    // nuxt layers except root
    for (const [idx, layer] of nuxt.options._layers.entries()) {
      if (idx === 0) {
        continue
      }
      yield path.resolve(layer.config.rootDir, imageName)
      yield path.resolve(layer.config.srcDir, imageName)
    }
    return
  }

  // nitro public dirs: consumer can unshift folders => elk.zone is an example
  // @ts-expect-error TS2339: Property publicAssets does not exist on type ResolveNuxtNitroConfig<NitroConfigFallback>
  if (nuxt.options.nitro.publicAssets) {
    // @ts-expect-error TS2339: Property publicAssets does not exist on type ResolveNuxtNitroConfig<NitroConfigFallback>
    for (const publicAsset of nuxt.options.nitro.publicAssets) {
      if (publicAsset?.dir) {
        yield path.resolve(publicAsset.dir, imageName)
      }
    }
  }

  // nuxt paths
  yield path.resolve(nuxt.options.rootDir, imageName)
  yield path.resolve(nuxt.options.srcDir, imageName)
}

async function* tryToResolveImage(
  ctx: NuxtPWAContext<any, any, any>,
  nuxt: Nuxt,
  imageName: string,
): AsyncGenerator<string, undefined, void> {
  // nitro public assets and nuxt paths
  for (const imagePath of preparePaths(nuxt, imageName)) {
    if (await checkFileExists(imagePath)) {
      yield imagePath
    }
  }

  // nuxt aliases
  try {
    const imagePath = await ctx.nuxt.moduleResolver.resolvePath(imageName, {
      cwd: nuxt.options.rootDir,
      alias: nuxt.options.alias,
    })
    if (await checkFileExists(imagePath)) {
      yield imagePath
    }
  }
  catch {
    // just ignore
  }

  // nuxt layers
  for (const imagePath of preparePaths(nuxt, imageName, true)) {
    if (await checkFileExists(imagePath)) {
      yield imagePath
    }
  }
}

function resolveImageFactory(
  ctx: NuxtPWAContext<any, any, any>,
  nuxt: Nuxt,
): NonNullable<PWAAssetsIntegrationOptions['resolveImage']> {
  return async (image: string) => {
    for await (const imagePath of tryToResolveImage(ctx, nuxt, image)) {
      if (imagePath) {
        return imagePath
      }
    }

    throw new Error(`PWA Assets image '${image}' cannot be resolved!`)
  }
}
