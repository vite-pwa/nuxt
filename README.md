<p align='center'>
<img src='https://raw.githubusercontent.com/vite-pwa/nuxt/main/hero.png' alt="@vite-pwa/nuxt - Zero-config PWA for Nuxt 3"><br>
Zero-config PWA Plugin for Nuxt 3
</p>

<p align='center'>
<a href='https://www.npmjs.com/package/@vite-pwa/nuxt' target="__blank">
<img src='https://img.shields.io/npm/v/@vite-pwa/nuxt?color=33A6B8&label=' alt="NPM version">
</a>
<a href="https://www.npmjs.com/package/@vite-pwa/nuxt" target="__blank">
    <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@vite-pwa/nuxt?color=476582&label=">
</a>
<a href="https://vite-pwa-org.netlify.app/frameworks/nuxt" target="__blank">
    <img src="https://img.shields.io/static/v1?label=&message=docs%20%26%20guides&color=2e859c" alt="Docs & Guides">
</a>
<br>
<a href="https://github.com/vite-pwa/nuxt" target="__blank">
<img alt="GitHub stars" src="https://img.shields.io/github/stars/vite-pwa/nuxt?style=social">
</a>
</p>

<br>

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>


## 🚀 Features

- 📖 [**Documentation & guides**](https://vite-pwa-org.netlify.app/)
- 👌 **Zero-Config**: sensible built-in default configs for common use cases
- 🔩 **Extensible**: expose the full ability to customize the behavior of the plugin
- 🦾 **Type Strong**: written in [TypeScript](https://www.typescriptlang.org/)
- 🔌 **Offline Support**: generate service worker with offline support (via Workbox)
- ⚡ **Fully tree shakable**: auto inject Web App Manifest
- 💬 **Prompt for new content**: built-in support for Vanilla JavaScript, Vue 3, React, Svelte, SolidJS and Preact
- ⚙️ **Stale-while-revalidate**: automatic reload when new content is available
- ✨ **Static assets handling**: configure static assets for offline support
- 🐞 **Development Support**: debug your custom service worker logic as you develop your application
- 🛠️ **Versatile**: integration with meta frameworks:  [îles](https://github.com/ElMassimo/iles), [SvelteKit](https://github.com/sveltejs/kit), [VitePress](https://github.com/vuejs/vitepress), [Astro](https://github.com/withastro/astro), and [Nuxt 3](https://github.com/nuxt/nuxt)

## 📦 Install

> Requires Vite 3.2.0+ and Nuxt 3.0.0+

```bash
npm i @vite-pwa/nuxt -D 

# yarn 
yarn add @vite-pwa/nuxt -D

# pnpm 
pnpm add @vite-pwa/nuxt -D
```

## 🦄 Usage

Add `@vite-pwa/nuxt` module to `nuxt.config.ts` and configure it:

```ts
// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@vite-pwa/nuxt'
  ],
  pwa: {
    /* PWA options */
  }
})
```

Read the [📖 documentation](https://vite-pwa-org.netlify.app/frameworks/nuxt) for a complete guide on how to configure and use
this plugin.

## 👀 Full config

Check out the type declaration [src/types.ts](./src/types.ts) and the following links for more details.

- [Web app manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox](https://developers.google.com/web/tools/workbox)


## 📄 License

MIT License © 2023-PRESENT [Anthony Fu](https://github.com/antfu)
