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

const height = ref(`${document.documentElement.clientHeight - 94.5}px`)
</script>

<template>
  <div :style="`height:${height}`">
    <iframe :id="props.iframeId" style="width: 100%; height: 100%; border: 0" :src="props.src" />
  </div>
</template>
