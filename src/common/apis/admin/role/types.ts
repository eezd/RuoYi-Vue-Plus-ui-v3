export interface RoleVO extends BaseEntity {
  roleId: string | number
  roleName: string
  roleKey: string
  roleSort: number
  menuCheckStrictly: boolean
  status: string
  delFlag: string
  remark?: any
  flag: boolean
  menuIds?: Array<string | number>
  admin: boolean
}

export interface RoleQuery extends PageQuery {
  roleName: string
  roleKey: string
  status: string
}

export interface RoleForm {
  roleId: string | undefined
  roleName: string
  roleKey: string
  roleSort: number
  status: string
  menuCheckStrictly: boolean
  remark: string
  menuIds: Array<string | number>
}
