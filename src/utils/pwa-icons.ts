import process from 'node:process'
import { basename, relative, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import type { Nuxt } from '@nuxt/schema'
import { instructions } from '@vite-pwa/assets-generator/api/instructions'
import type { UserConfig } from '@vite-pwa/assets-generator/config'
import { loadConfig } from '@vite-pwa/assets-generator/config'
import type { ResolvedPWAAssetsOptions } from 'vite-plugin-pwa'
import type { PwaModuleOptions } from '../types'
import { type DtsInfo, generatePwaImageType, pwaIcons } from './pwa-icons-helper'

export async function preparePWAIconTypes(
  options: PwaModuleOptions,
  nuxt: Nuxt,
) {
  if (!options.pwaAssets || options.pwaAssets.disabled)
    return

  const configuration = resolvePWAAssetsOptions(options)
  if (!configuration || configuration.disabled)
    return

  const root = nuxt.options.rootDir ?? process.cwd()
  const { config, sources } = await loadConfiguration(root, configuration)
  if (!config.preset)
    return

  const {
    preset,
    images,
    headLinkOptions: userHeadLinkOptions,
  } = config
  if (!images)
    return

  if (Array.isArray(images) && (!images.length || images.length > 1))
    return

  const useImage = Array.isArray(images) ? images[0] : images
  const imageFile = resolve(root, useImage)
  const publicDir = resolve(root, nuxt.options.dir.public ?? 'public')
  const imageName = relative(publicDir, imageFile)

  const xhtml = userHeadLinkOptions?.xhtml === true
  const includeId = userHeadLinkOptions?.includeId === true
  const assetsInstructions = await instructions({
    imageResolver: () => readFile(resolve(root, useImage)),
    imageName,
    preset,
    faviconPreset: userHeadLinkOptions?.preset,
    htmlLinks: { xhtml, includeId },
    basePath: nuxt.options.app.baseURL ?? '/',
    resolveSvgName: userHeadLinkOptions?.resolveSvgName ?? (name => basename(name)),
  })
  const transparentNames = Object.values(assetsInstructions.transparent).map(({ name }) => name)
  const maskableNames = Object.values(assetsInstructions.maskable).map(({ name }) => name)
  const faviconNames = Object.values(assetsInstructions.favicon).map(({ name }) => name)
  const appleNames = Object.values(assetsInstructions.apple).map(({ name }) => name)
  const appleSplashScreenNames = Object.values(assetsInstructions.appleSplashScreen).map(({ name }) => name)
  const dts = {
    dts: pwaIcons({
      transparent: transparentNames,
      maskable: maskableNames,
      favicon: faviconNames,
      apple: appleNames,
      appleSplashScreen: appleSplashScreenNames,
    }),
    transparent: generatePwaImageType('PwaTransparentImage', transparentNames),
    maskable: generatePwaImageType('PwaMaskableImage', maskableNames),
    favicon: generatePwaImageType('PwaFaviconImage', faviconNames),
    apple: generatePwaImageType('PwaAppleImage', appleNames),
    appleSplashScreen: generatePwaImageType('PwaAppleSplashScreenImage', appleSplashScreenNames),
  } satisfies DtsInfo

  if (nuxt.options.dev && nuxt.options.ssr) {
    // restart nuxt dev server when the configuration files change
    sources.forEach(source => nuxt.options.watch.push(source.replace(/\\/g, '/')))
  }

  return dts
}

function resolvePWAAssetsOptions(options: PwaModuleOptions) {
  if (!options.pwaAssets)
    return

  const {
    disabled: useDisabled,
    config,
    preset,
    image = 'public/favicon.svg',
    htmlPreset = '2023',
    overrideManifestIcons = false,
    includeHtmlHeadLinks = true,
    injectThemeColor = true,
    integration,
  } = options.pwaAssets ?? {}

  const disabled = useDisabled || (!config && !preset)

  return <ResolvedPWAAssetsOptions>{
    disabled,
    config: disabled || !config ? false : config,
    preset: disabled || config ? false : preset ?? 'minimal-2023',
    images: [image],
    htmlPreset,
    overrideManifestIcons,
    includeHtmlHeadLinks,
    injectThemeColor,
    integration,
  }
}

async function loadConfiguration(root: string, pwaAssets: ResolvedPWAAssetsOptions) {
  if (pwaAssets.config === false) {
    return await loadConfig<UserConfig>(root, {
      config: false,
      preset: pwaAssets.preset as UserConfig['preset'],
      images: pwaAssets.images,
      logLevel: 'silent',
    })
  }

  return await loadConfig<UserConfig>(
    root,
    typeof pwaAssets.config === 'boolean'
      ? root
      : { config: pwaAssets.config },
  )
}
