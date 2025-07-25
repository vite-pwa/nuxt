import type { PwaMaskableImageProps } from '#build/pwa-icons/PwaMaskableImage.js'
import { useMaskablePwaIcon } from '#pwa'
import { defineComponent, h } from 'vue'

export default defineComponent<PwaMaskableImageProps>({
  setup(props) {
    const { icon } = useMaskablePwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
