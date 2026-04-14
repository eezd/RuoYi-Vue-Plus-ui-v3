import type { Router, RouteRecordRaw } from "vue-router"
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

type RuntimeRouteRegistrar = (routes: RouteRecordRaw[]) => void

export function registerNavigationGuard(router: Router, addRuntimeRoutes: RuntimeRouteRegistrar) {
  router.beforeEach(async (to) => {
    NProgress.start()

    if (!getToken()) {
      if (isWhiteList(to)) return true

      return {
        path: LOGIN_PATH,
        query: { redirect: to.fullPath || "/" }
      }
    }

    if (to.path === LOGIN_PATH) {
      return { path: "/" }
    }

    if (isWhiteList(to)) {
      return true
    }

    const userStore = useUserStore()
    if (userStore.roles.length > 0) {
      return true
    }

    isRelogin.show = true
    try {
      await userStore.getInfo()
      const accessRoutes = await usePermissionStore().generateRoutes()
      addRuntimeRoutes(accessRoutes.filter(route => !isHttp(route.path)))

      return {
        path: to.path,
        query: to.query,
        hash: to.hash,
        replace: true
      }
    } catch (error) {
      userStore.logout()
      ElMessage.error(error instanceof Error ? error.message : "获取用户信息失败")
      return {
        path: LOGIN_PATH,
        query: { redirect: to.fullPath || "/" }
      }
    } finally {
      isRelogin.show = false
    }
  })

  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
  })
}
