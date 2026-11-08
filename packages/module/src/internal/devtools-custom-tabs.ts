import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import {
  INSPECTOR_BASE_PATH,
  INSPECTOR_BASE_PATH_URL,
} from '@unplugin-pwa/core/constants'

export function devtoolsCustomTabsHook<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
): import('@nuxt/schema').NuxtHooks['devtools:customTabs'] {
  return (tabs) => {
    if (ctx.resolvedOptions.devOptions?.inspector) {
      tabs.push({
        title: 'Unplugin PWA Inspector',
        name: 'vite-pwa:nuxt:inspector',
        icon: `${INSPECTOR_BASE_PATH}/icon_gray.svg`,
        view: {
          type: 'iframe',
          src: INSPECTOR_BASE_PATH_URL,
        },
      })
    }
  }
}
