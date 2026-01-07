import type { RouteRecordRaw } from "vue-router"
import { pinia } from "@/pinia"
import { constantRoutes, dynamicRoutes } from "@/router"
import { routerConfig } from "@/router/config"
import { flatMultiLevelRoutes } from "@/router/helper"

function hasPermission(roles: string[], route: RouteRecordRaw) {
  const routeRoles = route.meta?.permissions
  // 如果路由没有设置权限要求,则允许访问
  if (!routeRoles) return true
  // 检查是否有超级管理员权限
  if (roles.includes("*:*:*")) {
    return true
  }
  // 检查是否有匹配的权限(支持通配符)
  return roles.some((role) => {
    // 如果用户权限本身就在路由要求的权限中
    if (routeRoles.includes(role)) {
      return true
    }

    // 通配符匹配逻辑
    const roleParts = role.split(":")
    return routeRoles.some((routeRole) => {
      const routeRoleParts = routeRole.split(":")

      // 逐级比较,支持 * 通配符
      return roleParts.every((part, index) => {
        if (part === "*") return true // 用户权限的这一级是通配符
        if (!routeRoleParts[index]) return false // 路由权限层级不够
        if (routeRoleParts[index] === "*") return true // 路由要求的这一级是通配符
        return part === routeRoleParts[index] // 精确匹配
      })
    })
  })
}

function filterDynamicRoutes(routes: RouteRecordRaw[], roles: string[]) {
  const res: RouteRecordRaw[] = []
  routes.forEach((route) => {
    const tempRoute = { ...route }
    if (hasPermission(roles, tempRoute)) {
      if (tempRoute.children) {
        tempRoute.children = filterDynamicRoutes(tempRoute.children, roles)
      }
      res.push(tempRoute)
    }
  })
  return res
}

export const usePermissionStore = defineStore("permission", () => {
  // 可访问的路由
  const routes = ref<RouteRecordRaw[]>([])

  // 有访问权限的动态路由
  const addRoutes = ref<RouteRecordRaw[]>([])

  // 根据角色生成可访问的 Routes（可访问的路由 = 常驻路由 + 有访问权限的动态路由）
  const setRoutes = (roles: string[]) => {
    const accessedRoutes = filterDynamicRoutes(dynamicRoutes, roles)
    set(accessedRoutes)
  }

  // 所有路由 = 所有常驻路由 + 所有动态路由
  const setAllRoutes = () => {
    set(dynamicRoutes)
  }

  // 统一设置
  const set = (accessedRoutes: RouteRecordRaw[]) => {
    routes.value = constantRoutes.concat(accessedRoutes)
    addRoutes.value = routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(accessedRoutes) : accessedRoutes
  }

  return { routes, addRoutes, setRoutes, setAllRoutes }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function usePermissionStoreOutside() {
  return usePermissionStore(pinia)
}
