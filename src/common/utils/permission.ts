import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

/** 全局权限判断函数，和权限指令 v-permission 功能类似 */
export function checkPermission(permissionRoles: string[]): boolean {
  if (isArray(permissionRoles) && permissionRoles.length > 0) {
    const { permissions } = useUserStore()
    return permissions.some(permission => permissionRoles.includes(permission))
  } else {
    console.error("need roles! Like checkPermission(['admin','editor'])")
    return false
  }
}
