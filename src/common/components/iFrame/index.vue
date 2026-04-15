<script setup lang="ts">
const props = defineProps<{
  src: string
}>()

const height = ref("")
const loading = ref(true)
let loadingTimer: ReturnType<typeof setTimeout> | undefined

function updateHeight() {
  height.value = `${document.documentElement.clientHeight - 94.5}px`
}

onMounted(() => {
  updateHeight()
  loadingTimer = setTimeout(() => {
    loading.value = false
  }, 300)
  window.addEventListener("resize", updateHeight)
})

onBeforeUnmount(() => {
  if (loadingTimer) clearTimeout(loadingTimer)
  window.removeEventListener("resize", updateHeight)
})
</script>

<template>
  <div v-loading="loading" :style="{ height }">
    <iframe :src="props.src" frameborder="no" style="width: 100%; height: 100%" scrolling="auto" title="iframe-page" />
  </div>
</template>
