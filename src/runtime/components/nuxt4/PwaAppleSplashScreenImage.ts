import type { PwaAppleSplashScreenImageProps } from '#build/pwa-icons/PwaAppleSplashScreenImage.js'
import { useAppleSplashScreenPwaIcon } from '#pwa'
import { defineComponent, getCurrentInstance, h } from 'vue'

export default defineComponent<PwaAppleSplashScreenImageProps>({
  name: 'PwaAppleSplashScreenImage',
  inheritAttrs: false,
  setup() {
    const props = (getCurrentInstance()?.attrs ?? {}) as unknown as PwaAppleSplashScreenImageProps
    const { icon } = useAppleSplashScreenPwaIcon(props)
    return () => {
      const data = icon.value
      if (!data)
        return

      const { image: _, ...rest } = data

      return h('img', { ...rest })
    }
  },
})
