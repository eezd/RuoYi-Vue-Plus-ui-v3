/**
 * 部门查询参数
 */
export interface DeptQuery extends PageQuery {
  deptName?: string
  deptCategory?: string
  status?: string
}

/**
 * 部门类型
 */
export interface DeptVO extends BaseEntity {
  id?: number | string
  parentName?: string
  parentId: number | string
  children?: DeptVO[]
  deptId: number | string
  deptName: string
  deptCategory?: string
  orderNum: number
  leader?: number | string
  leaderName?: string
  phone?: string
  email?: string
  status: string
  ancestors?: string
}

/**
 * 部门树类型
 */
export interface DeptTreeVO extends BaseEntity {
  id: number | string
  label: string
  parentId: number | string
  weight?: number
  children?: DeptTreeVO[]
  disabled?: boolean
}

/**
 * 部门表单类型
 */
export interface DeptForm {
  parentId?: number | string
  deptId?: number | string
  deptName?: string
  deptCategory?: string
  orderNum?: number
  leader?: number | string
  phone?: string
  email?: string
  status?: string
}
