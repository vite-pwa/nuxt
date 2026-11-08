import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const cwd = fileURLToPath(new URL('.', import.meta.url))

async function cleanupDistFiles(patterns: string | string[]) {
  const [fs, path] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
  ])
  const dir = fs.glob(patterns, {
    withFileTypes: true,
    cwd: path.resolve(cwd, 'dist'),
  })

  for await (const file of dir) {
    await fs.rm(path.resolve(file.parentPath, file.name), { force: true })
  }
}

async function cleanupJSTypes() {
  await cleanupDistFiles(['**/types.{js,mjs}'])
}

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  clean: true,
  dts: true,
  attw: {
    level: 'error',
    profile: 'esm-only',
  },
  publint: true,
  deps: {
    neverBundle: [
      '@vitejs/devtools',
      '@vitejs/devtools-kit',
      '@nuxt/kit',
      '@nuxt/schema',
      'devframe',
      'vite',
      'rolldown',
      '@rolldown/pluginutils',
      '@unplugin-pwa/core',
      '@unplugin-pwa/vite',
      '@vite-pwa/assets-generator',
      '@vite-pwa/workbox-build',
      '@vite-pwa/workbox-window',
      'sirv',
    ],
  },
})
