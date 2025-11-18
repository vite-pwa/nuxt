import { cp, mkdir, readdir } from 'node:fs/promises'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/module'],
  externals: [
    'node:child_process',
    'node:fs',
    'consola',
    'esbuild',
    'h3',
    'pathe',
    'rollup',
    'ufo',
    'vite',
    'vite-plugin-pwa',
  ],
  hooks: {
    'rollup:done': async function () {
      await mkdir('dist/v3', { recursive: true })
      // temporary solution for this PR while I create fix in `mkdist` (relative module extensions not correct when referring outside)
      for (const file of await readdir('src/v3')) {
        await cp(`src/v3/${file}`, `dist/v3/${file}`)
      }
    },
  },
})
