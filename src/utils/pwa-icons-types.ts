import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { PwaModuleOptions } from '../types'
import type { DtsInfo } from './pwa-icons-helper'
import { addImports, addTypeTemplate } from '@nuxt/kit'
import { addPwaTypeTemplate, pwaIcons } from './pwa-icons-helper'

export async function registerPwaIconsTypes(
  options: PwaModuleOptions,
  nuxt: Nuxt,
  resolver: Resolver,
  runtimeDir: string,
) {
  const pwaAssets = options.pwaAssets && !options.pwaAssets.disabled && (options.pwaAssets.config === true || !!options.pwaAssets.preset)
  let dts: DtsInfo | undefined
  if (pwaAssets) {
    try {
      const { preparePWAIconTypes } = await import('./pwa-icons')
      dts = await preparePWAIconTypes(options, nuxt)
    }
    catch {
      dts = undefined
    }
  }

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
