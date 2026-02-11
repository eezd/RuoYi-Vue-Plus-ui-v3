// import { DeviceEnum } from "@@/constants/app-key"
// import { useAppStore } from "@/pinia/stores/app"

// const appStore = useAppStore()

// const isMobile = computed(() => appStore.device === DeviceEnum.Mobile)

// const isDesktop = computed(() => appStore.device === DeviceEnum.Desktop)

// /** 设备类型 Composable */
// export function useDevice() {
//   return { isMobile, isDesktop }
// }
import { DeviceEnum } from "@@/constants/app-key"
import { useAppStore } from "@/pinia/stores/app"

export function useDevice() {
  const appStore = useAppStore() // 确保这个调用发生在 store 初始化之后
  const isMobile = computed(() => appStore.device === DeviceEnum.Mobile)
  const isDesktop = computed(() => appStore.device === DeviceEnum.Desktop)

  return { isMobile, isDesktop }
}
