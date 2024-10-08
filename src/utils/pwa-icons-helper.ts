import { addPluginTemplate, addTypeTemplate } from '@nuxt/kit'

export interface DtsInfo {
  dts?: string
  transparent?: string
  maskable?: string
  favicon?: string
  apple?: string
  appleSplashScreen?: string
}

export interface PwaIconsTypes {
  transparent?: string[]
  maskable?: string[]
  favicon?: string[]
  apple?: string[]
  appleSplashScreen?: string[]
}

export function addPwaTypeTemplate(
  filename: string,
  content?: string,
) {
  if (content?.length) {
    addTypeTemplate({
      write: true,
      filename: `pwa-icons/${filename}.d.ts`,
      getContents: () => content,
    })
  }
  else {
    addTypeTemplate({
      write: true,
      getContents: () => generatePwaImageType(filename),
      filename: `pwa-icons/${filename}.d.ts`,
    })
  }
}

export function pwaIcons(types?: PwaIconsTypes) {
  return `// Generated by @vite-pwa/nuxt
import type { AppleSplashScreenLink, FaviconLink, HtmlLink, IconAsset } from '@vite-pwa/assets-generator/api'

export interface PWAAssetIconImage {
  width?: number
  height?: number
  key: string
  src: string
}
export type PWAAssetIcon<T extends HtmlLink> = Omit<IconAsset<T>, 'buffer'> & {
  asImage: PWAAssetIconImage
}
export interface PWAIcons {
  transparent: Record<${generateTypes(types?.transparent)}, PWAAssetIcon<HtmlLink>>
  maskable: Record<${generateTypes(types?.maskable)}, PWAAssetIcon<HtmlLink>>
  favicon: Record<${generateTypes(types?.favicon)}, PWAAssetIcon<FaviconLink>>
  apple: Record<${generateTypes(types?.apple)}, PWAAssetIcon<HtmlLink>>
  appleSplashScreen: Record<${generateTypes(types?.appleSplashScreen)}, PWAAssetIcon<AppleSplashScreenLink>>
}

declare module '#app' {
  interface NuxtApp {
    $pwaIcons?: PWAIcons
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $pwaIcons?: PWAIcons
  }
}

export {}
`
}

export function generatePwaImageType(filename: string, names?: string[]) {
  const propsName = `${filename}Props`
  return `// Generated by @vite-pwa/nuxt
export interface ${propsName} {
  image: ${generateTypes(names)}
  alt?: string
  width?: number
  height?: number
  crossorigin?: '' | 'anonymous' | 'use-credentials'
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'auto' | 'sync'
  nonce?: string
}
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T
type __VLS_TypePropsToRuntimeProps<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? {
    type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>
  } : {
    type: import('vue').PropType<T[K]>
    required: true
  }
}
declare const _default: import('vue').DefineComponent<__VLS_TypePropsToRuntimeProps<${propsName}>, {}, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<${propsName}>>>, {}, {}>
export default _default
`
}

function generateTypes(types?: string[]) {
  return types?.length ? types.map(name => `'${name}'`).join(' | ') : 'string'
}

export function addPWAIconsPluginTemplate(pwaAssetsEnabled: boolean) {
  if (pwaAssetsEnabled) {
    addPluginTemplate({
      filename: 'pwa-icons-plugin.ts',
      name: 'vite-pwa:nuxt:pwa-icons-plugin',
      write: true,
      getContents: () => `// Generated by @vite-pwa/nuxt
import { defineNuxtPlugin } from '#imports'
import { pwaAssetsIcons } from 'virtual:pwa-assets/icons'
import type { PWAAssetIcon, PWAIcons } from '#build/pwa-icons/pwa-icons'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      pwaIcons: {
        transparent: configureEntry('transparent'),
        maskable: configureEntry('maskable'),
        favicon: configureEntry('favicon'),
        apple: configureEntry('apple'),
        appleSplashScreen: configureEntry('appleSplashScreen')
      } satisfies PWAIcons
    }
  }
})

function configureEntry<K extends keyof PWAIcons>(key: K) {
  return Object.values(pwaAssetsIcons[key] ?? {}).reduce((acc, icon) => {
    const entry: PWAAssetIcon<any> = {
      ...icon,
      asImage: {
        src: icon.url,
        key: \`\${key}-\${icon.name}\`
      }
    }
    if (icon.width && icon.height) {
      entry.asImage.width = icon.width
      entry.asImage.height = icon.height
    }
    ;(acc as unknown as any)[icon.name] = entry
    return acc
  }, {} as PWAIcons[typeof key])
}
`,
    })
  }
  else {
    addPluginTemplate({
      filename: 'pwa-icons-plugin.ts',
      name: 'vite-pwa:nuxt:pwa-icons-plugin',
      write: true,
      getContents: () => `// Generated by @vite-pwa/nuxt
import { defineNuxtPlugin } from '#imports'
import type { PWAIcons } from '#build/pwa-icons/pwa-icons'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      pwaIcons: {
        transparent: {},
        maskable: {},
        favicon: {},
        apple: {},
        appleSplashScreen: {}
      } satisfies PWAIcons
    }
  }
})
`,
    })
  }
}
