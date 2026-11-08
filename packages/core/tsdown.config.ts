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
  await Promise.all([
    cleanupDistFiles(['**/types.{js,mjs}']),
    cleanupDistFiles(['**/shared-types.{js,mjs}']),
    cleanupDistFiles(['**/context-types.{js,mjs}']),
  ])
}

export default defineConfig({
  entry: [
    'src/config.ts',
    'src/index.ts',
    'src/types.ts',
    'src/context-types.ts',
    'src/shared-types.ts',
  ],
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
      '@nuxt/kit',
      '@nuxt/schema',
      'vite',
      'rolldown',
      '@rolldown/pluginutils',
      '@unplugin-pwa/core',
      '@vite-pwa/workbox-build',
    ],
  },
  hooks: {
    'build:done': async () => {
      await cleanupJSTypes()
    },
  },
})
