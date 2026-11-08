import type { NuxtHooks } from '@nuxt/schema'
import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import { createRequire } from 'node:module'
import path from 'node:path'
import { getMajor } from 'verkit'

export function prepareTypesHook<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
): NuxtHooks['prepare:types'] {
  return (context) => {
    const unpluginPwaCoreDir = path.dirname(
      createRequire(import.meta.url).resolve('@unplugin-pwa/core/package.json'),
    )
    const references = [
      {
        path: ctx.nuxt.moduleResolver.resolve('../configuration.d.ts'),
      },
      ...['vue.d.ts', 'info.d.ts', 'pwa-assets.d.ts'].map(file => ({
        path: path.join(unpluginPwaCoreDir, file),
      })),
      { path: 'types/pwa-augments.d.ts' },
    ]
    context.references.push(...references)
    if (getMajor(ctx.nuxt.nuxtVersion) >= 4) {
      context.nodeReferences.push(...references)
    }
  }
}
