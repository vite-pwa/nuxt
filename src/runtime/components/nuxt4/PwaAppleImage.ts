import type { PwaAppleImageProps } from '#build/pwa-icons/PwaAppleImage.js'
import { useApplePwaIcon } from '#pwa'
import { defineComponent, getCurrentInstance, h } from 'vue'

export default defineComponent<PwaAppleImageProps>({
  name: 'PwaAppleImage',
  inheritAttrs: false,
  setup() {
    const props = getCurrentInstance()?.attrs as unknown as PwaAppleImageProps
    const { icon } = useApplePwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      const { image: _, ...rest } = data

      return h('img', { ...rest })
    }
  },
})
