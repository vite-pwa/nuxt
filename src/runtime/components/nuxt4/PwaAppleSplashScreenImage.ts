import type { PwaAppleImageProps } from '#build/pwa-icons/PwaAppleImage.d.ts'
import { defineComponent, h } from '#imports'
import { useApplePwaIcon } from '#pwa'

export type { PwaAppleImageProps }

export default defineComponent<PwaAppleImageProps>({
  name: 'PwaAppleImage',
  inheritAttrs: false,
  setup(_, { attrs = {} }) {
    const { icon } = useApplePwaIcon(attrs as unknown as PwaAppleImageProps)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
