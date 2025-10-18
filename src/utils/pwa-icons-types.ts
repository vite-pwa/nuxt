import type { NuxtPWAContext } from '../context'
import type { DtsInfo } from './pwa-icons-helper'
import { addImports, addTypeTemplate } from '@nuxt/kit'
import { addPwaTypeTemplate, pwaIcons } from './pwa-icons-helper'

export async function registerPwaIconsTypes(
  ctx: NuxtPWAContext,
  runtimeDir: string,
) {
  const { options, nuxt, resolver } = ctx
  // we need to resolve first the PWA assets options: the resolved options set at pwa-icons::resolvePWAAssetsOptions
  const pwaAssets = options.pwaAssets && !options.pwaAssets.disabled
  let dts: DtsInfo | undefined
  if (pwaAssets) {
    try {
      const { preparePWAIconTypes } = await import('./pwa-icons')
      dts = await preparePWAIconTypes(ctx)
    }
    catch {
      dts = undefined
    }
  }

  nuxt.options.alias['#pwa'] = resolver.resolve(runtimeDir, 'composables/index')
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

  // TODO: add `{ node: true, nuxt: true }` to addTypeTemplate when migrating to nuxt 4, rn doing it manually
  const templates: string[] = []
  const isNuxt4 = ctx.nuxt4
  const dtsContent = dts?.dts
  if (dtsContent) {
    templates.push(addTypeTemplate({
      write: true,
      filename: 'pwa-icons/pwa-icons.d.ts',
      getContents: () => dtsContent,
    }).dst)
  }
  else {
    templates.push(addTypeTemplate({
      write: true,
      filename: 'pwa-icons/pwa-icons.d.ts',
      getContents: () => pwaIcons(),
    }).dst)
  }
  templates.push(addPwaTypeTemplate('PwaTransparentImage', isNuxt4, dts?.transparent))
  templates.push(addPwaTypeTemplate('PwaMaskableImage', isNuxt4, dts?.maskable))
  templates.push(addPwaTypeTemplate('PwaFaviconImage', isNuxt4, dts?.favicon))
  templates.push(addPwaTypeTemplate('PwaAppleImage', isNuxt4, dts?.apple))
  templates.push(addPwaTypeTemplate('PwaAppleSplashScreenImage', isNuxt4, dts?.appleSplashScreen))

  // TODO: remove this once migrated
  if (ctx.nuxt4) {
    ctx.nuxt.hook('prepare:types', (context) => {
      const nodeReferences = (context as any).nodeReferences
      for (const path of templates) {
        nodeReferences.push({ path })
      }
    })
  }

  return !!dts
}
