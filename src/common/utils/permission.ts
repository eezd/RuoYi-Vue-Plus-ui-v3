import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

/** 全局权限判断函数，和权限指令 v-permission 功能类似 */
export function checkPermission(permissionRoles: string[]): boolean {
  if (isArray(permissionRoles) && permissionRoles.length > 0) {
    const { permissions } = useUserStore()

    // 检查是否有超级管理员权限
    if (permissions.includes("*:*:*")) {
      return true
    }

    // 检查是否有匹配的权限(支持通配符)
    return permissions.some((permission) => {
      // 如果用户权限本身就在要求的角色中
      if (permissionRoles.includes(permission)) {
        return true
      }

      // 通配符匹配逻辑
      const permParts = permission.split(":")
      return permissionRoles.some((role) => {
        const roleParts = role.split(":")

        // 逐级比较,支持 * 通配符
        return permParts.every((part, index) => {
          if (part === "*") return true // 用户权限的这一级是通配符
          if (!roleParts[index]) return false // 角色权限层级不够
          if (roleParts[index] === "*") return true // 要求的角色这一级是通配符
          return part === roleParts[index] // 精确匹配
        })
      })
    })
  } else {
    console.error("need roles! Like checkPermission(['monitor:online:forceLogout'])")
    return false
  }
}
