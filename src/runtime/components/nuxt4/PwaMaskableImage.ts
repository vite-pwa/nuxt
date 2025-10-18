import type { PwaMaskableImageProps } from '#build/pwa-icons/PwaMaskableImage.d.ts'
import { defineComponent, h } from '#imports'
import { useMaskablePwaIcon } from '#pwa'

export type { PwaMaskableImageProps }

export default defineComponent<PwaMaskableImageProps>({
  name: 'PwaMaskableImage',
  inheritAttrs: false,
  setup(_, { attrs = {} }) {
    const { icon } = useMaskablePwaIcon(attrs as unknown as PwaMaskableImageProps)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
