import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const nuxtVersion = process.env.NUXT_VERSION || '^4.0.0'
const fixture = mkdtempSync(path.join(tmpdir(), 'vite-pwa-nuxt-consumer-'))
const tarballs = path.join(fixture, 'tarballs')
const app = path.join(fixture, 'app')
const pnpm = process.platform === 'win32'
  ? 'pnpm.cmd'
  : 'pnpm'

function run(command, args, cwd) {
  console.log(`> ${command} ${args.join(' ')}`)
  execFileSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
}

function write(file, content) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}

try {
  mkdirSync(tarballs, { recursive: true })
  const packages = {}
  for (const dir of ['core', 'vite', 'module']) {
    const pkgDir = path.join(root, 'packages', dir)
    const { name } = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'))
    const before = new Set(readdirSync(tarballs))
    run(pnpm, ['pack', '--pack-destination', tarballs], pkgDir)
    const tarball = readdirSync(tarballs).find(file => !before.has(file))
    packages[name] = `file:${path.join(tarballs, tarball).replaceAll('\\', '/')}`
  }

  write(path.join(app, 'package.json'), `${JSON.stringify({
    name: 'vite-pwa-nuxt-consumer',
    type: 'module',
    private: true,
    dependencies: {
      '@vite-pwa/nuxt': packages['@vite-pwa/nuxt'],
      'nuxt': nuxtVersion,
    },
    devDependencies: {
      'typescript': '^5.9.0',
      'vue-tsc': '^3.0.0',
    },
  }, null, 2)}\n`)
  write(path.join(app, 'pnpm-workspace.yaml'), [
    'overrides:',
    ...Object.entries(packages).map(([name, spec]) => `  '${name}': '${spec}'`),
    'allowBuilds:',
    '  \'@parcel/watcher\': false',
    '  esbuild: false',
    '  sharp: false',
    '',
  ].join('\n'))
  write(path.join(app, 'nuxt.config.ts'), `export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Consumer',
      short_name: 'Consumer',
    },
    client: {
      installPrompt: true,
    },
  },
})
`)
  write(path.join(app, 'tsconfig.json'), `${JSON.stringify({ extends: './.nuxt/tsconfig.json' }, null, 2)}\n`)
  write(path.join(app, 'app.vue'), `<script setup lang="ts">
import { pwaInfo } from 'virtual:pwa-info'

const { $pwa } = useNuxtApp()
const manifest: string | undefined = pwaInfo?.webManifest.href
</script>

<template>
  <div>
    <NuxtPwaManifest />
    {{ $pwa?.offlineReady }} {{ manifest }}
  </div>
</template>
`)

  run(pnpm, ['install', '--no-frozen-lockfile'], app)
  run(pnpm, ['exec', 'nuxt', 'typecheck'], app)
  run(pnpm, ['exec', 'nuxt', 'build'], app)

  const publicDir = path.join(app, '.output/public')
  const sw = path.join(publicDir, 'sw.js')
  if (!existsSync(sw)) {
    throw new Error('sw.js was not generated')
  }
  const swContent = readFileSync(sw, 'utf-8')
  if (/\bimport\s*[{"'*]|@vite-pwa\/workbox-swkit/.test(swContent)) {
    throw new Error(`sw.js contains unresolved imports:\n${swContent.slice(0, 500)}`)
  }
  if (!existsSync(path.join(publicDir, 'manifest.webmanifest'))) {
    throw new Error('manifest.webmanifest was not generated')
  }
  console.log(`Consumer build succeeded with nuxt@${nuxtVersion}`)
}
finally {
  if (!process.env.KEEP_FIXTURE) {
    rmSync(fixture, { recursive: true, force: true })
  }
  else {
    console.log(`Fixture kept at ${fixture}`)
  }
}
