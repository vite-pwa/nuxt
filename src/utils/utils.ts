import type { VitePluginPWAAPI } from 'vite-plugin-pwa'
import { writeFile } from 'node:fs/promises'
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

export async function writeWebManifest(dir: string, path: string, api: VitePluginPWAAPI, pwaAssets: boolean) {
  if (pwaAssets) {
    const pwaAssetsGenerator = await api.pwaAssetsGenerator()
    if (pwaAssetsGenerator)
      pwaAssetsGenerator.injectManifestIcons()
  }
  const manifest = api.generateBundle({})?.[path]
  if (manifest && 'source' in manifest)
    await writeFile(resolve(dir, path), manifest.source, 'utf-8')
}
