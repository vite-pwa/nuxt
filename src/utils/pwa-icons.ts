import type { Nuxt } from '@nuxt/schema'
import type { UserConfig } from '@vite-pwa/assets-generator/config'
import type { ResolvedPWAAssetsOptions } from 'vite-plugin-pwa'
import type { PwaModuleOptions } from '../types'
import type { DtsInfo } from './pwa-icons-helper'
import fs from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import process from 'node:process'
import { instructions } from '@vite-pwa/assets-generator/api/instructions'
import { loadConfig } from '@vite-pwa/assets-generator/config'
import { generatePwaImageType, pwaIcons } from './pwa-icons-helper'

export async function preparePWAIconTypes(
  options: PwaModuleOptions,
  nuxt: Nuxt,
  isNuxt4: boolean,
) {
  if (!options.pwaAssets || options.pwaAssets.disabled)
    return

  const configuration = resolvePWAAssetsOptions(options)
  if (!configuration || configuration.disabled)
    return

  // use vite root: pwa plugin using vite root, nuxt will configure vite root properly
  const root = nuxt.options.vite.root ?? process.cwd()
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
  const imageFile = await tryToResolveImage(root, sources, useImage)
  const publicDir = resolve(root, nuxt.options.dir.public ?? 'public')
  const imageName = relative(publicDir, imageFile)

  const xhtml = userHeadLinkOptions?.xhtml === true
  const includeId = userHeadLinkOptions?.includeId === true
  const assetsInstructions = await instructions({
    imageResolver: () => readFile(imageFile),
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
    transparent: generatePwaImageType('PwaTransparentImage', isNuxt4, transparentNames),
    maskable: generatePwaImageType('PwaMaskableImage', isNuxt4, maskableNames),
    favicon: generatePwaImageType('PwaFaviconImage', isNuxt4, faviconNames),
    apple: generatePwaImageType('PwaAppleImage', isNuxt4, appleNames),
    appleSplashScreen: generatePwaImageType('PwaAppleSplashScreenImage', isNuxt4, appleSplashScreenNames),
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

async function checkFileExists(pathname: string): Promise<boolean> {
  try {
    await access(pathname, fs.constants.R_OK)
  }
  catch {
    return false
  }

  return true
}

async function tryToResolveImage(
  root: string,
  sources: string[],
  image: string,
): Promise<string> {
  const imagePath = resolve(root, image)
  // first check if the image is in the root directory
  if (await checkFileExists(imagePath)) {
    return imagePath
  }

  for (const source of sources) {
    const sourceImage = resolve(dirname(source), image)
    if (await checkFileExists(sourceImage)) {
      return sourceImage
    }
  }

  return imagePath
}
