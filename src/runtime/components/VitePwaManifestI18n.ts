import type { MetaObject } from '@nuxt/schema'
import { defineComponent, ref } from 'vue'
import { pwaInfo } from 'virtual:pwa-info'
import { useHead, useLocalePath } from '#imports'

export default defineComponent({
  async setup() {
    if (pwaInfo) {
      const meta = ref<MetaObject>({ link: [] })
      const localePath = useLocalePath()
      useHead(meta)

      const { webManifest } = pwaInfo
      if (webManifest) {
        const { href, useCredentials } = webManifest
        const prefix = localePath("/").replace("^/$","")
        if (useCredentials) {
          meta.value.link!.push({
            rel: 'manifest',
            href: prefix+href,
            crossorigin: 'use-credentials',
          })
        }
        else {
          meta.value.link!.push({
            rel: 'manifest',
            href: prefix+href,
          })
        }
      }
    }

    return () => null
  },
})
