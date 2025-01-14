import { mkdir, writeFile } from 'node:fs/promises'
import type { VitePluginPWAAPI, PwaModuleOptions } from 'vite-plugin-pwa'
import { resolve } from 'pathe'

export async function regeneratePWA(options: PwaModuleOptions, pwaAssets: boolean, api?: VitePluginPWAAPI) {
  if (pwaAssets) {
    const pwaAssetsGenerator = await api?.pwaAssetsGenerator()
    if (pwaAssetsGenerator)
      await pwaAssetsGenerator.generate()
  }

  if (!api || api.disabled)
    return

  if (options.i18n?.splitServiceWorker == true) {
    const i18n = await import('./i18n')
    await Promise.all((await i18n.swOptions(options)).map(api.generateSW))
  } else {
    await api.generateSW()
  }
}

export async function writeWebManifest(dir: string, options: PwaModuleOptions, api: VitePluginPWAAPI, pwaAssets: boolean) {
  const path = options.manifestFilename || 'manifest.webmanifest'

  if (pwaAssets) {
    const pwaAssetsGenerator = await api.pwaAssetsGenerator()
    if (pwaAssetsGenerator)
      pwaAssetsGenerator.injectManifestIcons()
  }

  if (options.i18n?.splitManifest == true) {
    const i18n = await import('./i18n')
    const manifests = await i18n.webManifests(dir)
    await Promise.all(manifests.map(async ({localDir, optionsI18n})=>{
      const manifest = api.generateBundle({}, optionsI18n)?.[path]
      await _writeWebManifest(localDir, path, manifest)
    }))
  } else {
    const manifest = api.generateBundle({})?.[path]
    await _writeWebManifest(dir, path, manifest)
  }
}

async function _writeWebManifest(dir, path, manifest) {
  if (manifest && 'source' in manifest) {
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, path), manifest.source, 'utf-8')
  }
}
