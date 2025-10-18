import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { PwaModuleOptions } from './types'

export interface NuxtPWAContext {
  nuxt3_8: boolean
  nuxt4: boolean
  nuxt4Compat: boolean
  options: PwaModuleOptions
  nuxt: Nuxt
  resolver: Resolver
  publicDirFolder: string
}
