import type { PwaTransparentImageProps } from '#build/pwa-icons/PwaTransparentImage.js'
import { useTransparentPwaIcon } from '#pwa'
import { defineComponent, getCurrentInstance, h } from 'vue'

export default defineComponent<PwaTransparentImageProps>({
  name: 'PwaTransparentImage',
  inheritAttrs: false,
  setup() {
    const props = (getCurrentInstance()?.attrs ?? {}) as unknown as PwaTransparentImageProps
    const { icon } = useTransparentPwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      const { image: _, ...rest } = data

      return h('img', { ...rest })
    }
  },
})
