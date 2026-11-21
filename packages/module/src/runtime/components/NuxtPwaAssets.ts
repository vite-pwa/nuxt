import type { MetaObject } from '@nuxt/schema'
import type { DefineComponent } from 'vue'
import { pwaAssetsHead } from 'virtual:pwa-assets/head'
import { pwaInfo } from 'virtual:pwa-info'
import { defineComponent, ref } from 'vue'
import { useHead } from '#imports'

const component: DefineComponent = defineComponent({
  setup(): () => null {
    const meta = ref<MetaObject>({ link: [] })
    useHead(meta)
    if (pwaAssetsHead.themeColor) {
      meta.value.meta = [
        { name: 'theme-color', content: pwaAssetsHead.themeColor.content },
      ]
    }

    if (pwaAssetsHead.links.length) {
      // @ts-expect-error TS2345: Index signature for type `data-${string}` is missing in type PWAAssetHeadLink
      meta.value.link!.push(...pwaAssetsHead.links)
    }

    if (pwaInfo) {
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

    return (): null => null
  },
})

export default component
