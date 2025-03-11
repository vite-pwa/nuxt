import type { MetaObject } from '@nuxt/schema'
import { defineComponent, ref } from 'vue'
import { pwaInfo } from 'virtual:pwa-info'
import { useHead } from '#imports'

export default defineComponent({
  async setup() {
    if (pwaInfo) {
      const { webManifest } = pwaInfo
      if (webManifest) {
        const { href, useCredentials } = webManifest
        if (useCredentials) {
          useHead({
            link: {
              rel: 'manifest',
              href,
              crossorigin: 'use-credentials',
            }
          })
        }
        else {
          useHead({
            link: {
              rel: 'manifest',
              href
            }
          })
        }
      }
    }

    return () => null
  },
})
