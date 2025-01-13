
import { useNuxt, loadNuxtModuleInstance } from '@nuxt/kit'
import { resolve } from 'pathe'
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

function getLocalePath(options, localeCode) {
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
