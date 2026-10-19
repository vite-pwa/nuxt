import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

// Extract the minimum version accepted by each `^` range in an `||` union.
// This keeps the test focused on the declared support floor without pulling in
// `semver` as a dependency just for this test.
function caretFloors(range: string): Record<number, string> {
  const floors: Record<number, string> = {}
  for (const part of range.split('||')) {
    const match = part.trim().match(/^\^(\d+\.\d+\.\d+)/)
    if (!match) {
      continue
    }
    const [major] = match[1].split('.').map(Number)
    floors[major] ??= match[1]
  }
  return floors
}

describe('pwa assets generator v2 support', () => {
  const assetsGeneratorRange = pkg.peerDependencies['@vite-pwa/assets-generator']
  const vitePluginPwaRange = pkg.dependencies['vite-plugin-pwa']

  it('allows @vite-pwa/assets-generator v2 as a peer dependency', () => {
    expect(caretFloors(assetsGeneratorRange)[2]).toBe('2.0.0')
  })

  it('still allows @vite-pwa/assets-generator v1 as a peer dependency', () => {
    expect(caretFloors(assetsGeneratorRange)[1]).toBe('1.0.0')
  })

  it('allows vite-plugin-pwa v2 as a dependency', () => {
    expect(caretFloors(vitePluginPwaRange)[2]).toBe('2.0.0')
  })

  it('still allows vite-plugin-pwa v1 as a dependency', () => {
    expect(caretFloors(vitePluginPwaRange)[1]).toBe('1.2.0')
  })
})
