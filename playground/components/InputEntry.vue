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
        m-3 text-sm btn
        :disabled="!name"
        @click="go"
      >
        GO
      </button>
    </div>
  </div>
</template>
