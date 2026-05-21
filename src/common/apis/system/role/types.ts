/**
 * 菜单树形结构类型
 */
export interface DeptTreeOption {
  id: string | number
  label: string
  parentId: string | number
  weight: number
  children?: DeptTreeOption[]
}

export interface RoleDeptTree {
  checkedKeys: Array<string | number>
  depts: DeptTreeOption[]
}

export interface RolePageResult<T> {
  total: number
  rows: T[]
}

export interface RoleVO extends BaseEntity {
  roleId: string | number
  roleName: string
  roleKey: string
  roleSort: number
  dataScope: string
  menuCheckStrictly: boolean
  deptCheckStrictly: boolean
  status: string
  delFlag: string
  remark: any
  flag: boolean
  menuIds?: Array<string | number>
  deptIds?: Array<string | number>
  superAdmin: boolean
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
  roleId?: string | number
  roleName: string
  roleKey: string
  roleSort: number
  status: string
  menuCheckStrictly: boolean
  deptCheckStrictly: boolean
  remark: string
  dataScope?: string
  menuIds: Array<string | number>
  deptIds: Array<string | number>
}
