// remove this when this released and update package.json with dist dts:
// https://github.com/nuxt/module-builder/pull/194
import type { ModuleOptions } from './dist/module.js'

declare module '@nuxt/schema' {
  interface NuxtConfig { ['pwa']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['pwa']?: ModuleOptions }
}

declare module 'nuxt/schema' {
  interface NuxtConfig { ['pwa']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['pwa']?: ModuleOptions }
}

// copy this line from types.d.ts in the dist folder
export type { ClientOptions, ModuleOptions, PwaModuleOptions, default } from './dist/module.js'
