# Contributing Guide

Hi! We are really excited that you are interested in contributing to `@vite-pwa/nuxt`. Before submitting your contribution, please make sure to take a moment and read through the following guide.

Refer also to https://github.com/antfu/contribute.

## Set up your local development environment

The `@vite-pwa/nuxt` repo is a monorepo using pnpm workspaces. The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

To develop and test the `@vite-pwa/nuxt` package:

1. Fork the `@vite-pwa/nuxt` repository to your own GitHub account and then clone it to your local device.

2. `@vite-pwa/nuxt` uses pnpm v8. If you are working on multiple projects with different versions of pnpm, it's recommend to enable [Corepack](https://github.com/nodejs/corepack) by running `corepack enable`.

3. Check out a branch where you can work and commit your changes:
```shell
git checkout -b my-new-branch
```

5. Run `ni` in `@vite-pwa/nuxt`'s root folder

6. Run `nr dev:prepare` in `@vite-pwa/nuxt`'s root folder.

7. Run `nr dev` in `@vite-pwa/nuxt`'s root folder.

## Running tests

Before running tests, you'll need to install [Playwright](https://playwright.dev/) Chromium browser: `pnpm playwright install chromium`.

Run `nr test` in `@vite-pwa/nuxt`'s root folder.


