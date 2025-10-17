import type { Nuxt } from '@nuxt/schema'
import type { UserConfig } from '@vite-pwa/assets-generator/config'
import type { ResolvedPWAAssetsOptions } from 'vite-plugin-pwa'
import type { NuxtPWAContext } from '../context'
import type { DtsInfo } from './pwa-icons-helper'
import fs from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import process from 'node:process'
import { instructions } from '@vite-pwa/assets-generator/api/instructions'
import { loadConfig } from '@vite-pwa/assets-generator/config'
import { basename, isAbsolute, relative, resolve } from 'pathe'
import { generatePwaImageType, pwaIcons } from './pwa-icons-helper'

export async function preparePWAIconTypes(
  ctx: NuxtPWAContext,
) {
  const { options, nuxt } = ctx
  if (!options.pwaAssets || options.pwaAssets.disabled)
    return

  const configuration = resolvePWAAssetsOptions(ctx)
  if (!configuration || configuration.disabled)
    return

  const root = nuxt.options.vite.root ?? process.cwd()
  const { config, sources } = await loadConfiguration(nuxt, root, configuration)
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
  // const imageFile = resolve(root, useImage)
  const imageFile = await tryToResolveImage(root, sources, useImage)
  const publicDir = nuxt.options.dir.public
    ? (isAbsolute(nuxt.options.dir.public) ? nuxt.options.dir.public : resolve(nuxt.options.rootDir, nuxt.options.dir.public))
    : resolve(nuxt.options.rootDir, 'public')
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

function resolvePWAAssetsOptions(ctx: NuxtPWAContext) {
  const { options, nuxt, nuxt4, nuxt4Compat } = ctx
  if (!options.pwaAssets)
    return

  const {
    disabled: useDisabled,
    config,
    preset,
    image,
    htmlPreset = '2023',
    overrideManifestIcons = false,
    includeHtmlHeadLinks = true,
    injectThemeColor = true,
    integration,
  } = options.pwaAssets ?? {}

  const disabled = !(useDisabled === true) ? false : (!config && !preset)
  const publicDir = nuxt.options.dir.public
    ? (isAbsolute(nuxt.options.dir.public) ? basename(nuxt.options.dir.public) : nuxt.options.dir.public)
    : 'public'

  // prepare
  options.pwaAssets = {
    disabled,
    config: disabled || !config ? false : config,
    preset: disabled || config ? false : preset ?? 'minimal-2023',
    // nuxt4 or nuxt v3 v4compat using app as root (vite root)
    image: image || (nuxt4 || nuxt4Compat ? `../${publicDir}/favicon.svg` : `${publicDir}/favicon.svg`),
    htmlPreset,
    overrideManifestIcons,
    includeHtmlHeadLinks,
    injectThemeColor,
    integration,
  }

  return <ResolvedPWAAssetsOptions>{
    disabled,
    config: disabled || !config ? false : config,
    preset: disabled || config ? false : preset ?? 'minimal-2023',
    // nuxt4 or nuxt v3 v4compat using app as root (vite root)
    images: [image || (nuxt4 || nuxt4Compat ? `../${publicDir}/favicon.svg` : `${publicDir}/favicon.svg`)],
    htmlPreset,
    overrideManifestIcons,
    includeHtmlHeadLinks,
    injectThemeColor,
    integration,
  }
}

async function loadConfiguration(
  nuxt: Nuxt,
  root: string,
  pwaAssets: ResolvedPWAAssetsOptions,
) {
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
