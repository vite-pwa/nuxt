import type { NuxtPWAContextBuilder } from '@vite-pwa/nuxt-core/types'
import { getMajor } from 'verkit'

export const builder: NuxtPWAContextBuilder = {
  build: async (
    nuxtVersion,
    buildAssetsDir,
    options,
    nuxt,
    moduleResolver,
  ) => {
    const enableEnvApi = getMajor(nuxtVersion) === 4 && nuxt.options.experimental.viteEnvironmentApi
    if (getMajor(nuxtVersion) >= 5 || enableEnvApi) {
      return await import('./vite.ts').then(({
        createViteNuxtPwaContext,
      }) => createViteNuxtPwaContext(
        nuxtVersion,
        buildAssetsDir,
        options,
        nuxt,
        moduleResolver,
      ) as any)
    }

    // fallback to legacy
    return await import('./vite-legacy.ts').then(({
      createViteLegacyNuxtPwaContext,
    }) => createViteLegacyNuxtPwaContext(
      nuxtVersion,
      buildAssetsDir,
      options,
      nuxt,
      moduleResolver,
    ) as any)
  },
}
