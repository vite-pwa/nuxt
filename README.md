<p align='center'>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vite-pwa/.github/main/nuxt-ecosystem-hero-dark.svg" />
        <img src="https://raw.githubusercontent.com/vite-pwa/.github/main/nuxt-ecosystem-hero.svg" alt="@vite-pwa/nuxt - Nuxt PWA Ecosystem logo">
    </picture>
</p>

<h1 align='center'>
Nuxt PWA Ecosystem
</h1>

<p align='center'>
<a href="https://unplugin-pwa.netlify.app/frameworks/nuxt" target="__blank">
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
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg' alt="Anthony Fu SVG sponsors image"/>
  </a>
</p>

## 🚀 Features

- 📖 [**Documentation & guides**](https://unplugin-pwa.netlify.app/)
- 👌 **Zero-Config**: sensible built-in default configs for common use cases
- 🔩 **Extensible**: expose the full ability to customize the behavior of the plugin
- 🦾 **Type Strong**: written in [TypeScript](https://www.typescriptlang.org/)
- 🔌 **Offline Support**: generate service worker with offline support (via Workbox)
- ⚡ **Fully tree shakable**: client virtual modules are strictly optimized for Dead Code Elimination.
- 📄 **Web Manifest**: auto-inject Web App Manifest and PWA assets seamlessly.
- 💬 **Prompt for new content**: built-in support for Vanilla JavaScript, Vue 3, React, Svelte, SolidJS and Preact
- ⚙️ **Stale-while-revalidate**: automatic reload when new content is available
- ✨ **Static assets handling**: configure static assets for offline support
- 🐞 **Development Support**: debug your custom service worker logic as you develop your application
- 🔍 **Inspector**: visually inspect your resolved configuration, web manifest and service worker during development, via middleware or [DevFrame](https://github.com/devframes/devframe)
- 🧩 **Modular**: use the ready-to-use plugins or compose your own integration from the building blocks in `@unplugin-pwa/core` and `@unplugin-pwa/vite`
- 📦 **Universal Bundlers**: native integration with Vite, Rolldown, Webpack (WIP), Rspack (WIP), and Rsbuild (WIP).
- 🛠️ **Meta-Frameworks**: seamless integration with [îles](https://github.com/ElMassimo/iles), [SvelteKit](https://github.com/sveltejs/kit), [VitePress](https://github.com/vuejs/vitepress), [Astro](https://github.com/withastro/astro), [Nuxt 3/4/5](https://github.com/nuxt/nuxt), [React Router](https://github.com/remix-run/react-router/), [TanStack](https://github.com/TanStack) and [Next](https://github.com/vercel/next.js/) (WIP).
- 💥 **PWA Assets Generator**: generate all the PWA assets from a single command and a single source image
- 🚀 **PWA Assets Integration**: serving, generating and injecting PWA Assets on the fly in your application

## 📦 Install

> `@vite-pwa/nuxt` requires Nuxt 3.9.0+ with the Vite builder.

```bash
npx nuxt module add @vite-pwa/nuxt
```

## 🦄 Usage

Add `@vite-pwa/nuxt` module to `nuxt.config.ts` and configure it:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    /* PWA options */
  },
})
```

The PWA options can also live in a `pwa.config.ts` file in your project root (or `srcDir`), which is loaded automatically:

```ts
// pwa.config.ts
import { definePwaConfig } from '@vite-pwa/nuxt'

export default definePwaConfig({
  registerType: 'autoUpdate',
  manifest: {
    name: 'My App',
  },
})
```

Use `pwa.path` in `nuxt.config.ts` to load the configuration from another file.

Read the [📖 documentation](https://unplugin-pwa.netlify.app/frameworks/nuxt) for a complete guide on how to configure and use this module.

## ⬆️ Migrating from v1

- `@vite-pwa/nuxt` now uses [`unplugin-pwa`](https://github.com/vite-pwa/unplugin-pwa) and `@vite-pwa/workbox-*` instead of `vite-plugin-pwa` and `workbox-*`. If you import Workbox modules in a custom service worker, replace `workbox-*` imports with their `@vite-pwa/workbox-swkit/*` counterparts.
- The `workbox` option is now `generateSW` (`workbox` still works but logs a deprecation warning).
- The `injectManifest` strategy only injects the precache manifest into an existing service worker in the `public` folder. Service workers written in TypeScript or living outside `public` must use the `buildSW` strategy (`strategies: 'buildSW'` and the `buildSW` option).
- The `PwaModuleOptions` type is now `ModuleOptions` (`PwaModuleOptions` is kept as a deprecated alias).
- `$pwa.isInstalled` has been removed: use `$pwa.isPWAInstalled` instead.
- `$pwa.getSWRegistration()` has been removed: use the `service-worker:registered` or `service-worker:activated` runtime hooks to access the service worker registration.
- The `PwaAppleImage`, `PwaAppleSplashScreenImage`, `PwaFaviconImage`, `PwaMaskableImage` and `PwaTransparentImage` components are only registered when `pwaAssets` is enabled.
- Deep imports from `@vite-pwa/nuxt/*` are no longer available.

## ⚡️ Examples

Run `pnpm dev` to start the Nuxt v4 example in development mode. To see the PWA in action, build or generate the Nuxt v3 example and serve it:
- `pnpm dev:build && pnpm test:build:serve`: Nuxt build command + start server
- `pnpm dev:generate && pnpm test:generate:serve`: Nuxt generate command + start server

<table>
<thead>
<tr>
<th>Example</th>
<th>Source</th>
<th>Playground</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>Nuxt v5: Auto Update PWA</code></td>
<td><a href="https://github.com/vite-pwa/nuxt/tree/main/examples/playground-v5">GitHub</a></td>
<td>
<a href="https://stackblitz.com/fork/github/vite-pwa/nuxt" target="_blank" rel="noopener noreferrer">
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" width="162" height="32">
</a>
</td>
</tr>
<tr>
<td><code>Nuxt v4: Auto Update PWA</code></td>
<td><a href="https://github.com/vite-pwa/nuxt/tree/main/examples/playground-v4">GitHub</a></td>
<td>
<a href="https://stackblitz.com/fork/github/vite-pwa/nuxt" target="_blank" rel="noopener noreferrer">
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" width="162" height="32">
</a>
</td>
</tr>
<tr>
<td><code>Nuxt v3: Auto Update PWA</code></td>
<td><a href="https://github.com/vite-pwa/nuxt/tree/main/examples/playground-v3">GitHub</a></td>
<td>
<a href="https://stackblitz.com/fork/github/vite-pwa/nuxt" target="_blank" rel="noopener noreferrer">
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" width="162" height="32">
</a>
</td>
</tr>
</tbody>
</table>

## 👀 Full config

Check the following links for more details.

- [Web app manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Vite PWA Workbox](https://unplugin-pwa.netlify.app/vite-pwa-workbox/)

## 📄 License

[MIT](https://github.com/vite-pwa/nuxt/blob/main/LICENSE) License &copy; 2023-PRESENT [Anthony Fu](https://github.com/antfu)
