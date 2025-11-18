import type { PwaAppleSplashScreenImageProps } from '#build/pwa-icons/PwaAppleSplashScreenImage.d.ts'
import { defineComponent, h } from '#imports'
import { useAppleSplashScreenPwaIcon } from '#pwa'

export type { PwaAppleSplashScreenImageProps }

export default defineComponent<PwaAppleSplashScreenImageProps>({
  name: 'PwaAppleImage',
  inheritAttrs: false,
  setup(_, { attrs = {} }) {
    const { icon } = useAppleSplashScreenPwaIcon(attrs as unknown as PwaAppleSplashScreenImageProps)
    return () => {
      const data = icon.value
      if (!data)
        return

      return h('img', data)
    }
  },
})
