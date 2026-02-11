<script setup lang="ts">
import iFrame from "@@/components/iFrame/index.vue"

const url = ref(import.meta.env.VITE_APP_MONITOR_ADMIN)
</script>

<template>
  <div>
    <i-frame v-model:src="url" />
  </div>
</template>
