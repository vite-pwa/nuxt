import type { Nuxt } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { NuxtPWAContext } from './context-types.ts'
import fs from 'node:fs'
import path from 'node:path'
import { resolvePwaConfiguration } from '@unplugin-pwa/core/config'

export async function loadPwaConfiguration<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
  nuxt: Nuxt,
): Promise<void> {
  const resolvedOptions = await resolvePwaConfiguration(
    ctx.consumerOptions,
    {
      isDev: nuxt.options.dev,
      isWrongInjectManifest: (swSrc) => {
        return ctx.nuxt.publicDirs.some(dir => fs.existsSync(path.resolve(swSrc, dir)))
      },
    },
  )
  ctx.resolvedOptions = resolvedOptions as unknown as any
}
