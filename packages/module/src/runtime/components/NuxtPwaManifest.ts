import type { MetaObject } from '@nuxt/schema'
import { pwaInfo } from 'virtual:pwa-info'
import { defineComponent, shallowRef } from 'vue'
import { useHead } from '#imports'

export default defineComponent({
  setup() {
    if (pwaInfo) {
      const meta = shallowRef<MetaObject>({ link: [] })

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
      useHead(meta)
    }

    return () => null
  },
})
