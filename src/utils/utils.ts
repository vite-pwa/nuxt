import { mkdir, writeFile } from 'node:fs/promises'
import type { VitePluginPWAAPI, PwaModuleOptions } from 'vite-plugin-pwa'
import { resolve } from 'pathe'

export async function regeneratePWA(_dir: string, pwaAssets: boolean, api?: VitePluginPWAAPI) {
  if (pwaAssets) {
    const pwaAssetsGenerator = await api?.pwaAssetsGenerator()
    if (pwaAssetsGenerator)
      await pwaAssetsGenerator.generate()
  }

  if (!api || api.disabled)
    return

  await api.generateSW()
}

export async function writeWebManifest(dir: string, options: PwaModuleOptions, api: VitePluginPWAAPI, pwaAssets: boolean) {
  const path = options.manifestFilename || 'manifest.webmanifest'

  if (pwaAssets) {
    const pwaAssetsGenerator = await api.pwaAssetsGenerator()
    if (pwaAssetsGenerator)
      pwaAssetsGenerator.injectManifestIcons()
  }
  const manifest = api.generateBundle({})?.[path]
  await _writeWebManifest(dir, path, manifest)
}

async function _writeWebManifest(dir, path, manifest) {
  if (manifest && 'source' in manifest) {
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, path), manifest.source, 'utf-8')
  }
}
