import type { Router } from "vue-router"
import { setRouteChange } from "@@/composables/useRouteListener"
import { useTitle } from "@@/composables/useTitle"
import { getToken } from "@@/utils/cache/cookies"
import NProgress from "nprogress"
import { isHttp } from "@/common/utils"
import { isRelogin } from "@/http/axios"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useUserStore } from "@/pinia/stores/user"
import { isWhiteList } from "./whitelist"

NProgress.configure({ showSpinner: false })

const { setTitle } = useTitle()

const LOGIN_PATH = "/login"

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (to, _from) => {
    NProgress.start()

    if (getToken()) {
      if (to.path === "/login") {
        return { path: "/" }
      } else if (isWhiteList(to)) {
        return true
      } else {
        const userStore = useUserStore()
        if (userStore.roles.length === 0) {
          isRelogin.show = true
          // 判断当前用户是否已拉取完user_info信息
          try {
            await userStore.getInfo()
            isRelogin.show = false
            const accessRoutes = await usePermissionStore().generateRoutes()
            // 根据roles权限生成可访问的路由表
            accessRoutes.forEach((route) => {
              if (!isHttp(route.path)) {
                router.addRoute(route)
              }
            })
            // hack方法 确保addRoutes已完成
            return { path: to.path, replace: true, params: to.params, query: to.query, hash: to.hash, name: to.name as string }
          } catch (err) {
            await userStore.logout()
            ElMessage.error((err as Error).message || "获取用户信息失败")
            return { path: "/" }
          }
        }
      }
    } else {
      // 没有token
      if (isWhiteList(to)) {
        return true
      } else {
        const redirect = encodeURIComponent(to.fullPath || "/")
        return `/login?redirect=${redirect}` // 否则全部重定向到登录页
        NProgress.done()
      }
    }

    // const userStore = useUserStore()
    // // const permissionStore = usePermissionStore()
    // // 如果没有登录
    // if (!getToken()) {
    //   // 如果在免登录的白名单中，则直接进入
    //   if (isWhiteList(to)) return true
    //   // 后台页面需要登录
    //   if (to.path.startsWith("/admin")) return LOGIN_PATH
    // } else if (to.path.startsWith("/admin")) {
    //   // 如果用户已经获得其权限角色
    //   if (userStore.roles.length !== 0) return true
    //   // 否则要重新获取权限角色
    //   try {
    //     await userStore.getInfo()
    //     // const permissions = userStore.permissions
    //     // 生成可访问的 Routes
    //     // routerConfig.dynamic ? permissionStore.setRoutes(permissions) : permissionStore.setAllRoutes()
    //     // 将 "有访问权限的动态路由" 添加到 Router 中
    //     // permissionStore.addRoutes.forEach(route => router.addRoute(route))
    //     // 设置 replace: true, 因此导航将不会留下历史记录
    //     // return { ...to, replace: true }
    //   } catch (error) {
    //   // 过程中发生任何错误，都直接重置 Token，并重定向到登录页面
    //     userStore.resetToken()
    //     ElMessage.error((error as Error).message || "路由守卫发生错误")
    //     return LOGIN_PATH
    //   }
    // }
    return true
  })

  // 全局后置钩子
  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
  })
}
