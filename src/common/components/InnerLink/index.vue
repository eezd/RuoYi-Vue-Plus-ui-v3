<script setup lang="ts">
/**
 * defineProps
 */
// #region defineProps
const props = defineProps({
  src: { type: String, default: "/" },
  iframeId: { type: String, required: true }
})
// #endregion

const height = ref("")

function updateHeight() {
  height.value = `${document.documentElement.clientHeight - 94.5}px`
}

onMounted(() => {
  updateHeight()
  window.addEventListener("resize", updateHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateHeight)
})
</script>

<template>
  <div :style="{ height }">
    <iframe :id="props.iframeId" style="width: 100%; height: 100%; border: 0" :src="props.src" :title="props.iframeId" />
  </div>
</template>
