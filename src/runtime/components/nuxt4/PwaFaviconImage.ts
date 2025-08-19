import type { PwaFaviconImageProps } from '#build/pwa-icons/PwaFaviconImage.js'
import { useFaviconPwaIcon } from '#pwa'
import { defineComponent, getCurrentInstance, h } from 'vue'

export default defineComponent<PwaFaviconImageProps>({
  name: 'PwaFaviconImage',
  inheritAttrs: false,
  setup() {
    const props = (getCurrentInstance()?.attrs ?? {}) as unknown as PwaFaviconImageProps
    const { icon } = useFaviconPwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      const { image: _, ...rest } = data

      return h('img', { ...rest })
    }
  },
})
