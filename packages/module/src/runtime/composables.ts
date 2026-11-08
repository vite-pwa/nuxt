import type { ImgHTMLAttributes, MaybeRef, UnwrapNestedRefs } from 'vue'
import type { PwaAppleImageProps } from '#build/pwa-icons/PwaAppleImageProps'
import type { PwaAppleSplashScreenImageProps } from '#build/pwa-icons/PwaAppleSplashScreenImageProps'
import type { PwaFaviconImageProps } from '#build/pwa-icons/PwaFaviconImageProps'
import type { PwaMaskableImageProps } from '#build/pwa-icons/PwaMaskableImageProps'
import type { PwaTransparentImageProps } from '#build/pwa-icons/PwaTransparentImageProps'
import type { PwaInjection } from './plugins/types'
import { computed, toValue } from 'vue'
import { useNuxtApp } from '#imports'

export type PWAVueImageType = Omit<ImgHTMLAttributes, 'src'>

export type PWAImage = PWAVueImageType & {
  image: string
}

export type PWAIcon = ImgHTMLAttributes & {
  key: any
}

export type PWAImageType<T> = T extends 'transparent'
  ? PwaTransparentImageProps['image'] | (Omit<PWAImage, 'image'> & { image: PwaTransparentImageProps['image'] })
  : T extends 'maskable'
    ? PwaMaskableImageProps['image'] | Omit<PWAImage, 'image'> & { image: PwaMaskableImageProps['image'] }
    : T extends 'favicon'
      ? PwaFaviconImageProps['image'] | Omit<PWAImage, 'image'> & { image: PwaFaviconImageProps['image'] }
      : T extends 'apple'
        ? PwaAppleImageProps['image'] | Omit<PWAImage, 'image'> & { image: PwaAppleImageProps['image'] }
        : T extends 'appleSplashScreen'
          ? PwaAppleSplashScreenImageProps['image'] | Omit<PWAImage, 'image'> & { image: PwaAppleSplashScreenImageProps['image'] }
          : never

export type TransparentImageType = MaybeRef<PWAImageType<'transparent'>>
export type MaskableImageType = MaybeRef<PWAImageType<'maskable'>>
export type FaviconImageType = MaybeRef<PWAImageType<'favicon'>>
export type AppleImageType = MaybeRef<PWAImageType<'apple'>>
export type AppleSplashScreenImageType = MaybeRef<PWAImageType<'appleSplashScreen'>>

export function useTransparentPwaIcon(image: TransparentImageType) {
  return usePWAIcon('transparent', image)
}
export function useMaskablePwaIcon(image: MaskableImageType) {
  return usePWAIcon('maskable', image)
}
export function useFaviconPwaIcon(image: FaviconImageType) {
  return usePWAIcon('favicon', image)
}
export function useApplePwaIcon(image: AppleImageType) {
  return usePWAIcon('apple', image)
}
export function useAppleSplashScreenPwaIcon(image: AppleSplashScreenImageType) {
  return usePWAIcon('appleSplashScreen', image)
}
export function usePWA(): UnwrapNestedRefs<PwaInjection> | undefined {
  return useNuxtApp().$pwa
}

function usePWAIcon(
  type: 'transparent' | 'maskable' | 'favicon' | 'apple' | 'appleSplashScreen',
  pwaImage: MaybeRef<string | PWAImage>,
) {
  const pwaIcons = useNuxtApp().$pwaIcons
  const icon = computed(() => {
    const pwaIcon = toValue(pwaImage)
    const iconName = typeof pwaIcon === 'object' ? pwaIcon.image : pwaIcon
    const image = pwaIcons?.[type]?.[iconName]?.asImage
    if (!image)
      return

    if (typeof pwaIcon === 'string') {
      return <PWAIcon>{
        width: image.width,
        height: image.height,
        key: image.key,
        src: image.src,
      }
    }

    const {
      width,
      height,
      image: _image,
      ...rest
    } = pwaIcon

    return <PWAIcon>{
      width: width ?? image.width,
      height: height ?? image.height,
      ...rest,
      key: image.key,
      src: image.src,
    }
  })

  return { icon }
}
