import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { Bundler } from '@unplugin-pwa/core/context-types'
import type { NuxtPWAContext } from '@vite-pwa/nuxt-core/context-types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import {
  INSPECTOR_BASE_PATH,
  INSPECTOR_BASE_PATH_URL,
} from '@unplugin-pwa/core/constants'

export function devtoolsCustomTabs<
  B extends Bundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
  NPWAC extends NuxtPWAContext<B, UserStrategy, T>,
>(
  ctx: NPWAC,
): import('@nuxt/schema').NuxtHooks['devtools:customTabs'] {
  return (tabs) => {
    // register the inspector only when using standalone
    // adding pwa inspector to nuxt devtools will require some changes
    // we remove the entry at nuxt devtools, pwa inspector is present at vite devtools
    if (ctx.resolvedOptions.devOptions?.inspector === 'standalone') {
      tabs.push({
        title: 'Vite PWA Inspector',
        name: 'vite-pwa:nuxt:inspector',
        icon: `${INSPECTOR_BASE_PATH}/icon_gray.svg`,
        // icon: {
        //   light: `${INSPECTOR_BASE_PATH}/icon_light.svg`,
        //   dark: `${INSPECTOR_BASE_PATH}/icon_dark.svg`,
        // },
        view: {
          type: 'iframe',
          src: INSPECTOR_BASE_PATH_URL,
        },
      })
    }
  }
}
