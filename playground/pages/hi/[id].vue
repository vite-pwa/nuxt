<template>
  <div>
    <h3 text-2xl font-500>
      Hi,
    </h3>
    <div text-xl>
      <NuxtPage :page-key="page => page.fullPath" />
    </div>

    <div>
      <NuxtLink
        class="m-3 text-sm btn"
        to="/"
      >
        Back
      </NuxtLink>
    </div>
  </div>
</template>
