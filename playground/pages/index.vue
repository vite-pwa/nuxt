<script setup lang="ts">
const name = ref('')

const router = useRouter()
function go() {
  if (name.value)
    router.push(`/hi/${encodeURIComponent(name.value)}`)
}
</script>

<template>
  <div>
    <div>Nuxt Vite PWA</div>
    <div>
      <input
        id="input"
        v-model="name"
        placeholder="What's your name?"
        type="text"
        autocomplete="off"
        @keydown.enter="go"
      >
      <div>
        <button
          :disabled="!name"
          @click="go"
        >
          GO
        </button>
      </div>
    </div>
    <NuxtLink to="/list">
      Go to list
    </NuxtLink>
    <br>
    <NuxtLink to="/about">
      About
    </NuxtLink>
  </div>
</template>
