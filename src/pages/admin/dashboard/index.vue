<script lang="ts" setup>
import { useUserStore } from "@/pinia/stores/user"

const userStore = useUserStore()

function test() {
  userStore.getInfo()
}

// const isAdmin = userStore.roles.includes("admin")
</script>

<template>
  <div>
    <el-button @click="test">
      test
    </el-button>
  </div>
</template>
