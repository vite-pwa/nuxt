import type { PwaTransparentImageProps } from '#build/pwa-icons/PwaTransparentImage.d.ts'
import { defineComponent, h } from '#imports'
import { useTransparentPwaIcon } from '#pwa'

export type { PwaTransparentImageProps }

export default defineComponent<PwaTransparentImageProps>({
  name: 'PwaTransparentImage',
  inheritAttrs: false,
  setup(_, { attrs = {} }) {
    const { icon } = useTransparentPwaIcon(attrs as unknown as PwaTransparentImageProps)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
