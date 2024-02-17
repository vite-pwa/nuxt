import { defineNuxtPlugin } from '#imports'
import { pwaAssetsIcons } from 'virtual:pwa-assets/icons'

export default defineNuxtPlugin(() => {
  const pwaIcons = {}
  configureEntries(pwaIcons, 'transparent')
  configureEntries(pwaIcons, 'maskable')
  configureEntries(pwaIcons, 'favicon')
  configureEntries(pwaIcons, 'apple')
  configureEntries(pwaIcons, 'appleSplashScreen')
  return {
    provide: {
      pwaIcons,
    },
  }
})

function configureEntries(pwaIcons, key) {
  pwaIcons[key] = Object.values(pwaAssetsIcons[key] ?? {}).reduce((acc, icon) => {
    const entry = {
      ...icon,
      asImage: {
        src: icon.url,
        key: `${key}-${icon.name}`,
      }
    }
    if (icon.width && icon.height) {
      entry.asImage.width = icon.width
      entry.asImage.height = icon.height
    }
    acc[icon.name] = entry
    return acc
  }, {})
}
