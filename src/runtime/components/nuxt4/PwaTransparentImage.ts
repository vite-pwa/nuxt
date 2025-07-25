import type { PwaTransparentImageProps } from '#build/pwa-icons/PwaTransparentImage.js'
import { useTransparentPwaIcon } from '#pwa'
import { defineComponent, h } from 'vue'

export default defineComponent<PwaTransparentImageProps>({
  setup(props) {
    const { icon } = useTransparentPwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
