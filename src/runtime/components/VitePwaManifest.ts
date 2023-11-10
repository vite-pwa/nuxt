import type { MetaObject } from '@nuxt/schema'
import { defineComponent, ref } from 'vue'
import { pwaInfo } from 'virtual:pwa-info'
import { useHead } from '#imports'

export default defineComponent({
  async setup() {
    if (pwaInfo) {
      const meta = ref<MetaObject>({ link: [] })
      useHead(meta)

      const { webManifest } = pwaInfo
      if (webManifest) {
        const { href, useCredentials } = webManifest
        if (useCredentials) {
          meta.value.link!.push({
            rel: 'manifest',
            href,
            crossorigin: 'use-credentials',
          })
        }
        else {
          meta.value.link!.push({
            rel: 'manifest',
            href,
          })
        }
      }
    }

    return () => null
  },
})
