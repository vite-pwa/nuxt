import { lstat, writeFile } from 'node:fs/promises'
import type { VitePluginPWAAPI } from 'vite-plugin-pwa'
import { resolve } from 'pathe'

export async function regeneratePWA(dir: string, path?: string, api?: VitePluginPWAAPI) {
  if (!api || api.disabled)
    return

  await api.generateSW()
  if (path)
    await writeWebManifest(dir, path, api)
}

async function isFile(path: string) {
  try {
    const stats = await lstat(path)
    return stats.isFile()
  }
  catch {
    return false
  }
}

async function writeWebManifest(dir: string, path: string, api: VitePluginPWAAPI) {
  const exists = await isFile(path)
  if (exists)
    return

  const manifest = api.generateBundle({})?.[path]
  if (manifest && 'source' in manifest)
    await writeFile(resolve(dir, path), manifest.source, 'utf-8')
}
