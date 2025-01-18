
import { useNuxt, loadNuxtModuleInstance } from '@nuxt/kit'
import { resolve, join, basename } from 'pathe'
import type { PwaModuleOptions } from 'vite-plugin-pwa'
import type { NuxtI18nOptions } from '@nuxtjs/i18n'
import type { NuxtModule } from 'nuxt/schema'

export async function webManifests(manifestDir) {
  const i18nOptions = await getNuxtModuleOptions('@nuxtjs/i18n') as NuxtI18nOptions

  return i18nOptions.locales.map(({code})=>{
    const localePath = getLocalePath(i18nOptions, code)
    return {
      localDir: resolve(manifestDir, localePath),
      optionsI18n: { manifest: {
        start_url: `/${localePath}`,
        scope: `/${localePath}`,
        lang: code,
      }}
    }
  })
}

export async function swOptions(options: PwaModuleOptions) {
  const i18nOptions = await getNuxtModuleOptions('@nuxtjs/i18n') as NuxtI18nOptions
  const ignorePrefix = i18nOptions.locales.map(({code})=>code).join(',')
  return i18nOptions.locales.map(({code})=>{
    const prefix = getLocalePath(i18nOptions, code)
    const swDest = join(options.outDir, prefix, basename(options.swDest) || "sw.js")
    const ret:Partial<PwaModuleOptions> = {
      outDir: join(options.outDir, prefix),
      swDest: swDest,
    }
    ret.injectManifest = ret.workbox = ({
      swDest: swDest,
      globPatterns: [join(prefix, '**', '_payload.json')],
      globIgnores: prefix ? [] : [join(`{${ignorePrefix}}`, '**', '_payload.json')],
      modifyURLPrefix: {"": "/"},
    })
    return ret
  })
}

//from https://github.com/nuxt-modules/sitemap/blob/main/src/util/kit.ts
async function getNuxtModuleOptions(module: string | NuxtModule, nuxt: Nuxt = useNuxt()) {
  const moduleMeta = (typeof module === 'string' ? { name: module } : await module.getMeta?.()) || {}
  const { nuxtModule } = (await loadNuxtModuleInstance(module, nuxt))

  let moduleEntry: [string | NuxtModule, Record<string, any>] | undefined
  for (const m of nuxt.options.modules) {
    if (Array.isArray(m) && m.length >= 2) {
      const _module = m[0]
      const _moduleEntryName = typeof _module === 'string'
        ? _module
        : (await (_module as any as NuxtModule).getMeta?.())?.name || ''
      if (_moduleEntryName === moduleMeta.name)
        moduleEntry = m as [string | NuxtModule, Record<string, any>]
    }
  }

  let inlineOptions = {}
  if (moduleEntry)
    inlineOptions = moduleEntry[1]
  if (nuxtModule.getOptions)
    return nuxtModule.getOptions(inlineOptions, nuxt)
  return inlineOptions
}

function getLocalePath(options: NuxtI18nOptions, localeCode: string) {
  switch (options.strategy) {
    case 'prefix_except_default':
    case 'prefix_and_default':
      return localeCode === options.defaultLocale ? "" : localeCode
    case 'prefix':
      return localeCode
    default:
      throw "Strategy not implemented"
  }
}
