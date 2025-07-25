import type { PwaAppleSplashScreenImageProps } from '#build/pwa-icons/PwaAppleSplashScreenImage.js'
import { useAppleSplashScreenPwaIcon } from '#pwa'
import { defineComponent, h } from 'vue'

export default defineComponent<PwaAppleSplashScreenImageProps>({
  setup(props) {
    const { icon } = useAppleSplashScreenPwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
