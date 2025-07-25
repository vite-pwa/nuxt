import type { PwaAppleImageProps } from '#build/pwa-icons/PwaAppleImage.js'
import { useApplePwaIcon } from '#pwa'
import { defineComponent, h } from 'vue'

export default defineComponent<PwaAppleImageProps>({
  setup(props) {
    const { icon } = useApplePwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
