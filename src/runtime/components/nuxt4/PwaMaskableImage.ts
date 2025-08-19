import type { PwaMaskableImageProps } from '#build/pwa-icons/PwaMaskableImage.js'
import { useMaskablePwaIcon } from '#pwa'
import { defineComponent, getCurrentInstance, h } from 'vue'

export default defineComponent<PwaMaskableImageProps>({
  name: 'PwaMaskableImage',
  inheritAttrs: false,
  setup() {
    const props = (getCurrentInstance()?.attrs ?? '') as unknown as PwaMaskableImageProps
    const { icon } = useMaskablePwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      const { image: _, ...rest } = data

      return h('img', { ...rest })
    }
  },
})
