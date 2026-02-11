export interface RoleVO extends BaseEntity {
  /**
   * 角色ID
   */
  roleId: string | number
  /**
   * 角色名称
   */
  roleName: string
  /**
   * 角色权限字符串
   */
  roleKey: string
  /**
   * 显示顺序
   */
  roleSort: number
  /**
   * 菜单树选择项是否关联显示
   */
  menuCheckStrictly: boolean
  /**
   * 角色状态（0正常 1停用）
   */
  status: string
  /**
   * 备注
   */
  remark: any
  /**
   * 用户是否存在此角色标识 默认不存在
   */
  flag: boolean
  /**
   * 是否为管理员角色
   */
  admin: boolean
  /**
   * Element UI 树形控件已分配的菜单ID集合
   */
  menuIds: Array<string | number>
}

export interface RoleQuery extends PageQuery {
  roleName: string
  roleKey: string
  status: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}

export interface RoleForm {
  /**
   * 角色ID
   */
  roleId: string | number
  /**
   * 角色名称
   */
  roleName: string
  /**
   * 角色权限字符串
   */
  roleKey: string
  /**
   * 显示顺序
   */
  roleSort: number
  /**
   * 菜单树选择项是否关联显示
   */
  menuCheckStrictly: boolean
  /**
   * 角色状态（0正常 1停用）
   */
  status: string
  /**
   * 备注
   */
  remark: string
  /**
   * Element UI 树形控件已分配的菜单ID集合
   */
  menuIds: Array<string | number>
}
