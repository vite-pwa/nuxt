import type { NuxtPWAContext } from '../context'
import { addImports, addTypeTemplate } from '@nuxt/kit'
import { addPwaTypeTemplate, pwaIcons } from './pwa-icons-helper'

export async function registerPwaIconsTypes(
  ctx: NuxtPWAContext,
  runtimeDir: string,
) {
  const { options, nuxt, resolver } = ctx
  // we need to resolve first the PWA assets options: the resolved options set at pwa-icons::resolvePWAAssetsOptions
  const dts = options.pwaAssets && !options.pwaAssets.disabled
    ? undefined
    : await import('./pwa-icons').then(({ preparePWAIconTypes }) => preparePWAIconTypes(ctx))

  nuxt.options.alias['#pwa'] = resolver.resolve(runtimeDir, 'composables/index.js')
  nuxt.options.build.transpile.push('#pwa')

  addImports([
    'usePWA',
    'useTransparentPwaIcon',
    'useMaskablePwaIcon',
    'useFaviconPwaIcon',
    'useApplePwaIcon',
    'useAppleSplashScreenPwaIcon',
  ].map(key => ({
    name: key,
    as: key,
    from: resolver.resolve(runtimeDir, 'composables/index'),
  })))

  const dtsContent = dts?.dts
  if (dtsContent) {
    addTypeTemplate({
      write: true,
      filename: 'pwa-icons/pwa-icons.d.ts',
      getContents: () => dtsContent,
    })
  }
  else {
    addTypeTemplate({
      write: true,
      filename: 'pwa-icons/pwa-icons.d.ts',
      getContents: () => pwaIcons(),
    })
  }
  addPwaTypeTemplate('PwaTransparentImage', dts?.transparent)
  addPwaTypeTemplate('PwaMaskableImage', dts?.maskable)
  addPwaTypeTemplate('PwaFaviconImage', dts?.favicon)
  addPwaTypeTemplate('PwaAppleImage', dts?.apple)
  addPwaTypeTemplate('PwaAppleSplashScreenImage', dts?.appleSplashScreen)

  return !!dts
}
