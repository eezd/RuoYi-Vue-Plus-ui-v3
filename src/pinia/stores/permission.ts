import type { RouteRecordRaw } from "vue-router"
import { getRouters } from "@@/apis/menu.ts"
import InnerLink from "@@/components/InnerLink/index.vue"
import ParentView from "@@/components/ParentView/index.vue"
import { cloneDeep } from "lodash-es"
import auth from "@/common/utils/auth"
import { createCustomNameComponent } from "@/common/utils/createCustomNameComponent"
import Layout from "@/layouts/index.vue"
import { constantRoutes, dynamicRoutes } from "@/router"

type AccessRouteRecord = RouteRecordRaw & {
  permissions?: string[]
  roles?: string[]
  children?: AccessRouteRecord[]
}

type PageModule = () => Promise<unknown>

const modules = import.meta.glob("./../../pages/**/*.vue") as Record<string, PageModule>
const viewModules = createViewModuleMap(modules)
const notFoundView = () => import("@/pages/error/404.vue")
const specialComponents = {
  Layout,
  ParentView,
  InnerLink
}

export const usePermissionStore = defineStore("permission", () => {
  const routes = ref<RouteRecordRaw[]>([])
  const addRoutes = ref<RouteRecordRaw[]>([])
  const defaultRoutes = ref<RouteRecordRaw[]>([])
  const topbarRouters = ref<RouteRecordRaw[]>([])
  const sidebarRouters = ref<RouteRecordRaw[]>([])

  const getRoutes = (): RouteRecordRaw[] => routes.value
  const getDefaultRoutes = (): RouteRecordRaw[] => defaultRoutes.value
  const getSidebarRoutes = (): RouteRecordRaw[] => sidebarRouters.value
  const getTopbarRoutes = (): RouteRecordRaw[] => topbarRouters.value

  const setRoutes = (newRoutes: RouteRecordRaw[]): void => {
    addRoutes.value = newRoutes
    routes.value = constantRoutes.concat(newRoutes)
  }
  const setDefaultRoutes = (newRoutes: RouteRecordRaw[]): void => {
    defaultRoutes.value = constantRoutes.concat(newRoutes)
  }
  const setTopbarRoutes = (newRoutes: RouteRecordRaw[]): void => {
    topbarRouters.value = newRoutes
  }
  const setSidebarRouters = (newRoutes: RouteRecordRaw[]): void => {
    sidebarRouters.value = newRoutes
  }

  const generateRoutes = async (): Promise<RouteRecordRaw[]> => {
    const { data } = await getRouters()
    if (!Array.isArray(data)) {
      throw new TypeError("菜单路由数据格式异常")
    }

    const sidebarRoutes = filterAsyncRouter(cloneDeep(data) as AccessRouteRecord[])
    const rewriteRoutes = filterAsyncRouter(cloneDeep(data) as AccessRouteRecord[])
    const defaultRouteRecords = filterAsyncRouter(cloneDeep(data) as AccessRouteRecord[])
    const asyncRoutes = filterDynamicRoutes(dynamicRoutes)

    setRoutes(rewriteRoutes)
    setSidebarRouters(constantRoutes.concat(sidebarRoutes))
    setDefaultRoutes(sidebarRoutes)
    setTopbarRoutes(defaultRouteRecords)
    duplicateRouteChecker(asyncRoutes, sidebarRoutes)

    return [...asyncRoutes, ...rewriteRoutes]
  }

  const filterAsyncRouter = (asyncRouterMap: AccessRouteRecord[]): RouteRecordRaw[] => {
    return asyncRouterMap.map((route) => {
      const resolvedComponent = resolveRouteComponent(route)
      if (resolvedComponent) {
        route.component = resolvedComponent
      }

      if (route.children?.length) {
        route.children = filterAsyncRouter(route.children) as AccessRouteRecord[]
      } else {
        delete route.children
        delete route.redirect
      }

      return route
    })
  }

  return {
    routes,
    topbarRouters,
    sidebarRouters,
    defaultRoutes,

    getRoutes,
    getDefaultRoutes,
    getSidebarRoutes,
    getTopbarRoutes,

    setRoutes,
    generateRoutes,
    setSidebarRouters
  }
})

function resolveRouteComponent(route: AccessRouteRecord) {
  const component = (route as { component?: unknown }).component

  if (typeof component !== "string") {
    return component
  }

  if (component in specialComponents) {
    return specialComponents[component as keyof typeof specialComponents]
  }

  return loadView(component, (route as { name?: string | symbol }).name)
}

export function filterDynamicRoutes(routes: RouteRecordRaw[]) {
  return routes
    .map(route => filterDynamicRoute(route as AccessRouteRecord))
    .filter((route): route is RouteRecordRaw => Boolean(route))
}

function filterDynamicRoute(route: AccessRouteRecord, inheritedAccess = false): AccessRouteRecord | null {
  const permissions = getRoutePermissions(route)
  const roles = getRouteRoles(route)
  const hasAccessRule = permissions.length > 0 || roles.length > 0
  const hasAccess = hasAccessRule ? hasRouteAccess(permissions, roles) : inheritedAccess

  if (hasAccessRule && !hasAccess) {
    return null
  }

  const filteredChildren = route.children
    ?.map(child => filterDynamicRoute(child, hasAccess))
    .filter((child): child is AccessRouteRecord => Boolean(child)) ?? []

  if (!hasAccessRule && !inheritedAccess && filteredChildren.length === 0) {
    return null
  }

  const routeRecord = cloneDeep(route)
  if (filteredChildren.length > 0) {
    routeRecord.children = filteredChildren
  } else {
    delete routeRecord.children
  }

  return routeRecord
}

function getRoutePermissions(route: AccessRouteRecord) {
  return route.permissions || route.meta?.permissions || []
}

function getRouteRoles(route: AccessRouteRecord) {
  return route.roles || (route.meta as { roles?: string[] } | undefined)?.roles || []
}

function hasRouteAccess(permissions: string[], roles: string[]) {
  if (permissions.length > 0) {
    return auth.hasPermiOr(permissions)
  }
  if (roles.length > 0) {
    return auth.hasRoleOr(roles)
  }
  return false
}

export function loadView(view: unknown, name?: string | symbol) {
  if (typeof view !== "string") {
    console.error("Invalid route component path:", view)
    return notFoundView
  }

  const viewPath = normalizeViewPath(view)
  const loader = viewModules[viewPath]

  if (!loader) {
    console.error(`Cannot resolve route component: ${view}`)
    return notFoundView
  }

  return createCustomNameComponent(loader, {
    name: typeof name === "string" ? name : viewPath.replace(/\W/g, "_")
  })
}

function createViewModuleMap(sourceModules: Record<string, PageModule>) {
  const moduleMap: Record<string, PageModule> = {}

  Object.entries(sourceModules).forEach(([path, loader]) => {
    const pagesIndex = path.indexOf("/pages/")
    if (pagesIndex === -1) return

    const viewPath = path.slice(pagesIndex + "/pages/".length)
    moduleMap[normalizeViewPath(viewPath)] = loader
  })

  return moduleMap
}

function normalizeViewPath(view: string) {
  return view.replace(/^\/+/, "").replace(/\.vue$/, "")
}

interface Route {
  name?: string | symbol
  path: string
  children?: Route[]
}

function duplicateRouteChecker(localRoutes: Route[], routes: Route[]) {
  const nameSet = new Set<string>()
  const allRoutes = flatRoutes([...localRoutes, ...routes])

  allRoutes.forEach((route) => {
    if (!route.name) return

    const name = String(route.name)
    if (nameSet.has(name)) {
      const message = `路由名称: [${name}] 重复，可能会造成 404`
      console.error(message)
      ElNotification({
        title: "路由名称重复",
        message,
        type: "error"
      })
      return
    }

    nameSet.add(name)
  })
}

function flatRoutes(routes: Route[]) {
  const result: Route[] = []

  routes.forEach((route) => {
    if (route.children?.length) {
      result.push(...flatRoutes(route.children))
    } else {
      result.push(route)
    }
  })

  return result
}
