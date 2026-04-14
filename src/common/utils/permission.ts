import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

const ALL_PERMISSION = "*:*:*"

/** 全局权限判断函数，和权限指令 v-hasPermi 功能类似 */
export function checkPermission(permissionRoles: string[]): boolean {
  if (!isArray(permissionRoles) || permissionRoles.length === 0) {
    console.error("need roles! Like checkPermission(['monitor:online:forceLogout'])")
    return false
  }

  const { permissions } = useUserStore()
  // 检查是否有超级管理员权限
  if (permissions.includes(ALL_PERMISSION)) {
    return true
  }

  // 检查是否有匹配的权限（支持通配符）
  return permissions.some(permission => permissionRoles.some(role => matchPermission(permission, role)))
}

function matchPermission(permission: string, requiredPermission: string) {
  // 如果用户权限本身就在要求的权限中
  if (permission === requiredPermission) return true

  // 通配符匹配逻辑：逐级比较，支持 * 通配符
  const permissionParts = permission.split(":")
  const requiredParts = requiredPermission.split(":")

  return permissionParts.every((part, index) => {
    // 用户权限的这一级是通配符
    if (part === "*") return true
    // 要求的权限层级不够
    if (!requiredParts[index]) return false
    // 要求的权限这一级是通配符
    if (requiredParts[index] === "*") return true
    // 精确匹配
    return part === requiredParts[index]
  })
}
