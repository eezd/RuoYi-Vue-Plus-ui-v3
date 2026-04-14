import { useUserStore } from "@/pinia/stores/user"

const ALL_PERMISSION = "*:*:*"
const SUPER_ADMIN_ROLE = "admin"

function authPermission(permission: string): boolean {
  if (!permission) return false

  const permissions: string[] = useUserStore().permissions
  return permissions.some(item => item === ALL_PERMISSION || item === permission)
}

function authRole(role: string): boolean {
  if (!role) return false

  const roles: string[] = useUserStore().roles
  return roles.some(item => item === SUPER_ADMIN_ROLE || item === role)
}

export default {
  // 验证用户是否具备某权限
  hasPermi(permission: string): boolean {
    return authPermission(permission)
  },
  // 验证用户是否含有指定权限，只需包含其中一个
  hasPermiOr(permissions: string[]): boolean {
    return permissions.some(authPermission)
  },
  // 验证用户是否含有指定权限，必须全部拥有
  hasPermiAnd(permissions: string[]): boolean {
    return permissions.every(authPermission)
  },
  // 验证用户是否具备某角色
  hasRole(role: string): boolean {
    return authRole(role)
  },
  // 验证用户是否含有指定角色，只需包含其中一个
  hasRoleOr(roles: string[]): boolean {
    return roles.some(authRole)
  },
  // 验证用户是否含有指定角色，必须全部拥有
  hasRoleAnd(roles: string[]): boolean {
    return roles.every(authRole)
  }
}
