import type { LanguageEnum } from "@/common/enums/LanguageEnum"
import { DeviceEnum, SIDEBAR_CLOSED, SIDEBAR_OPENED } from "@@/constants/app-key"
import { getLanguage, getSidebarStatus, setLanguage, setSidebarStatus } from "@@/utils/cache/local-storage"
import enUS from "element-plus/es/locale/lang/en"
import zhCN from "element-plus/es/locale/lang/zh-cn"
import { pinia } from "@/pinia"

interface Sidebar {
  opened: boolean
  withoutAnimation: boolean
}

/** 设置侧边栏状态本地缓存 */
function handleSidebarStatus(opened: boolean) {
  opened ? setSidebarStatus(SIDEBAR_OPENED) : setSidebarStatus(SIDEBAR_CLOSED)
}

export const useAppStore = defineStore("app", () => {
  // 语言
  const language = ref<LanguageEnum>(getLanguage())
  const languageObj: Record<LanguageEnum, object> = {
    en_US: enUS,
    zh_CN: zhCN
  }
  const locale = computed(() => {
    return languageObj[language.value]
  })

  // 侧边栏状态
  const sidebar: Sidebar = reactive({
    opened: getSidebarStatus() !== SIDEBAR_CLOSED,
    withoutAnimation: false
  })

  // 设备类型
  const device = ref<DeviceEnum>(DeviceEnum.Desktop)

  // 监听侧边栏 opened 状态
  watch(
    () => sidebar.opened,
    (opened) => {
      handleSidebarStatus(opened)
    }
  )

  // 切换侧边栏
  const toggleSidebar = (withoutAnimation: boolean) => {
    sidebar.opened = !sidebar.opened
    sidebar.withoutAnimation = withoutAnimation
  }

  // 关闭侧边栏
  const closeSidebar = (withoutAnimation: boolean) => {
    sidebar.opened = false
    sidebar.withoutAnimation = withoutAnimation
  }

  // 切换设备类型
  const toggleDevice = (value: DeviceEnum) => {
    device.value = value
  }

  // 切换语言
  const changeLanguage = (val: LanguageEnum): void => {
    language.value = val
    // i18n.global.locale.value = val
    setLanguage(val)
  }

  return { language, locale, device, sidebar, toggleSidebar, closeSidebar, toggleDevice, changeLanguage }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useAppStoreOutside() {
  return useAppStore(pinia)
}
