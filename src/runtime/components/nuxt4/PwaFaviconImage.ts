import type { PwaFaviconImageProps } from '#build/pwa-icons/PwaFaviconImage.d.ts'
import { defineComponent, h } from '#imports'
import { useFaviconPwaIcon } from '#pwa'

export type { PwaFaviconImageProps }

export default defineComponent<PwaFaviconImageProps>({
  name: 'PwaFaviconImage',
  inheritAttrs: false,
  setup(_, { attrs = {} }) {
    const { icon } = useFaviconPwaIcon(attrs as unknown as PwaFaviconImageProps)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
