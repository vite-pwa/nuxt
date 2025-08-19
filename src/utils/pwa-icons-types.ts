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
  isNuxt4: boolean,
) {
  const pwaAssets = options.pwaAssets && !options.pwaAssets.disabled && (options.pwaAssets.config === true || !!options.pwaAssets.preset)
  let dts: DtsInfo | undefined
  if (pwaAssets) {
    try {
      const { preparePWAIconTypes } = await import('./pwa-icons')
      dts = await preparePWAIconTypes(options, nuxt, isNuxt4)
    }
    catch (e) {
      console.error('Error preparing PWA icon types:', e)
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
    from: resolver.resolve(runtimeDir, 'composables/index.js'),
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
  addPwaTypeTemplate('PwaTransparentImage', isNuxt4, dts?.transparent)
  addPwaTypeTemplate('PwaMaskableImage', isNuxt4, dts?.maskable)
  addPwaTypeTemplate('PwaFaviconImage', isNuxt4, dts?.favicon)
  addPwaTypeTemplate('PwaAppleImage', isNuxt4, dts?.apple)
  addPwaTypeTemplate('PwaAppleSplashScreenImage', isNuxt4, dts?.appleSplashScreen)

  return !!dts
}
