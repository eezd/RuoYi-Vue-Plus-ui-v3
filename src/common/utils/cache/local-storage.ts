import type { ThemeName } from "@@/composables/useTheme"
import type { SidebarClosed, SidebarOpened } from "@@/constants/app-key"
import type { LayoutsConfig } from "@/layouts/config"
import type { TagView } from "@/pinia/stores/tags-view"
import { CacheKey } from "@@/constants/cache-key"
import { LanguageEnum } from "@/common/enums/LanguageEnum"

// 系统布局配置
export function getLayoutsConfig() {
  return parseLocalStorageJSON<LayoutsConfig | null>(CacheKey.CONFIG_LAYOUT, null)
}

export function setLayoutsConfig(settings: LayoutsConfig) {
  localStorage.setItem(CacheKey.CONFIG_LAYOUT, JSON.stringify(settings))
}

export function removeLayoutsConfig() {
  localStorage.removeItem(CacheKey.CONFIG_LAYOUT)
}

// 侧边栏折叠状态
export function getSidebarStatus() {
  return localStorage.getItem(CacheKey.SIDEBAR_STATUS)
}

export function setSidebarStatus(sidebarStatus: SidebarOpened | SidebarClosed) {
  localStorage.setItem(CacheKey.SIDEBAR_STATUS, sidebarStatus)
}

// 当前应用主题
export function getActiveThemeName() {
  return localStorage.getItem(CacheKey.ACTIVE_THEME_NAME) as ThemeName | null
}

export function setActiveThemeName(themeName: ThemeName) {
  localStorage.setItem(CacheKey.ACTIVE_THEME_NAME, themeName)
}

// 标签栏缓存
export function getVisitedViews() {
  return parseLocalStorageJSON<TagView[]>(CacheKey.VISITED_VIEWS, [])
}

export function setVisitedViews(views: TagView[]) {
  views.forEach((view) => {
    // 路由对象存在循环引用，写入 localStorage 前需要去掉运行时字段
    delete view.matched
    delete view.redirectedFrom
  })
  localStorage.setItem(CacheKey.VISITED_VIEWS, JSON.stringify(views))
}

export function getCachedViews() {
  return parseLocalStorageJSON<string[]>(CacheKey.CACHED_VIEWS, [])
}

export function setCachedViews(views: string[]) {
  localStorage.setItem(CacheKey.CACHED_VIEWS, JSON.stringify(views))
}

// 当前语言
export function getLanguage(): LanguageEnum {
  const value = localStorage.getItem(CacheKey.LANGUAGE)
  if (!value) return LanguageEnum.zh_CN
  if (Object.values(LanguageEnum).includes(value as LanguageEnum)) {
    return value as LanguageEnum
  }
  return LanguageEnum.zh_CN
}

export function setLanguage(language: LanguageEnum) {
  localStorage.setItem(CacheKey.LANGUAGE, language)
}

function parseLocalStorageJSON<T>(key: string, fallback: T): T {
  const json = localStorage.getItem(key)
  if (!json) return fallback

  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}
