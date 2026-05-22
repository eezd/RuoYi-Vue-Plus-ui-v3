<script lang="ts" setup>
import { getToken } from "@@/utils/cache/cookies"
import { useTagsViewStore } from "@/pinia/stores/tags-view"

defineOptions({
  name: "AdminWorkflowProcessDefinitionDesign"
})

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

const iframeUrl = ref("")

function buildDesignerUrl() {
  const definitionId = String(route.query.definitionId || "")
  const baseUrl = String(import.meta.env.VITE_BASE_URL || "")
  const url = new URL(`${baseUrl}/warm-flow-ui/index.html`, window.location.origin)

  url.searchParams.set("id", definitionId)
  url.searchParams.set("onlyDesignShow", "true")
  url.searchParams.set("Authorization", `Bearer ${getToken() || ""}`)
  url.searchParams.set("clientid", String(import.meta.env.VITE_APP_CLIENT_ID || ""))

  if (route.query.disabled != null) {
    url.searchParams.set("disabled", String(route.query.disabled))
  }

  iframeUrl.value = url.toString()
}

function closePage() {
  tagsViewStore.delVisitedView(router.currentRoute.value)
  router.push({
    path: "/workflow/process-definition",
    query: {
      activeName: String(route.query.activeName || "0")
    }
  })
}

function handleDesignerMessage(event: MessageEvent) {
  if (event.data?.method === "close") {
    closePage()
  }
}

onMounted(() => {
  window.addEventListener("message", handleDesignerMessage)
  buildDesignerUrl()
})

onBeforeUnmount(() => {
  window.removeEventListener("message", handleDesignerMessage)
})
</script>

<template>
  <div class="warm-flow-designer-page">
    <iframe :src="iframeUrl" frameborder="0" class="warm-flow-designer-page__iframe" />
  </div>
</template>

<style lang="scss" scoped>
.warm-flow-designer-page {
  width: 100%;
  height: calc(100vh - 123px);
  overflow: hidden;
}

.warm-flow-designer-page__iframe {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
