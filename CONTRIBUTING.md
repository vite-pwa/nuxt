# Contributing Guide

Hi! We are really excited that you are interested in contributing to `@vite-pwa/nuxt`. Before submitting your contribution, please make sure to take a moment and read through the following guide.

Refer also to https://github.com/antfu/contribute.

## Set up your local development environment

The `@vite-pwa/nuxt` repo is a monorepo using pnpm workspaces. The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

To develop and test the `@vite-pwa/nuxt` package:

1. Fork the `@vite-pwa/nuxt` repository to your own GitHub account and then clone it to your local device.

2. `@vite-pwa/nuxt` uses the pnpm version pinned in the root `package.json` (`packageManager` field). If you are working on multiple projects with different versions of pnpm, it's recommended to enable [Corepack](https://github.com/nodejs/corepack) by running `corepack enable`.

3. Check out a branch where you can work and commit your changes:
```shell
git checkout -b my-new-branch
```

4. Run `pnpm install` in `@vite-pwa/nuxt`'s root folder

5. Run `pnpm build` in `@vite-pwa/nuxt`'s root folder.

6. Run `pnpm dev` in `@vite-pwa/nuxt`'s root folder.

## Running tests

Before running tests, you'll need to install [Playwright](https://playwright.dev/) Chromium browser: `pnpm playwright install chromium`.

Run `pnpm build && pnpm test` in `@vite-pwa/nuxt`'s root folder.

To check the packages outside the workspace, run `pnpm build && pnpm test:consumer`: it packs the packages and builds a fresh Nuxt app with them. Set `NUXT_VERSION` to change the Nuxt version, `EXTRA_TARBALLS` to a directory of packed dependencies to override (for example unreleased `@unplugin-pwa/*` fixes), and `KEEP_FIXTURE=1` to keep the generated app.

You can run also `pnpm build && pnpm test:consumer:v3` and `pnpm build && pnpm test:consumer:v4` to run previous test using Nuxt 3.21 and latest Nuxt 4 respectively.
