import type { App, Directive } from "vue"
import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

/**
 * @name 权限指令
 * @description 和权限判断函数 checkPermission 功能类似
 */
const permission: Directive = {
  mounted(el, binding) {
    const { value: permissionRoles } = binding
    const { permissions } = useUserStore()

    if (isArray(permissionRoles) && permissionRoles.length > 0) {
      // 检查是否有超级管理员权限
      if (permissions.includes("*:*:*")) {
        return
      }

      // 检查是否有匹配的权限(支持通配符)
      const hasPermission = permissions.some((permission) => {
        // 如果用户权限本身就在要求的角色中
        if (permissionRoles.includes(permission)) {
          return true
        }

        // 通配符匹配逻辑
        const permParts = permission.split(":")
        return permissionRoles.some((role: any) => {
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

      hasPermission || el.parentNode?.removeChild(el)
    } else {
      throw new Error(`参数必须是一个数组且长度大于 0,参考:v-hasPermi="['monitor:online:forceLogout']"`)
    }
  }
}

export function installPermissionDirective(app: App) {
  app.directive("hasPermi", permission)
}
