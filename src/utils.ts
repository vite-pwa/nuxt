import { writeFile } from 'node:fs/promises'
import type { VitePluginPWAAPI } from 'vite-plugin-pwa'
import { resolve } from 'pathe'

export async function regeneratePWA(dir: string, api?: VitePluginPWAAPI) {
  if (!api || api.disabled)
    return

  await api.generateSW()
}

export async function writeWebManifest(dir: string, path: string, api: VitePluginPWAAPI) {
  const manifest = api.generateBundle({})?.[path]
  if (manifest && 'source' in manifest)
    await writeFile(resolve(dir, path), manifest.source, 'utf-8')
}
