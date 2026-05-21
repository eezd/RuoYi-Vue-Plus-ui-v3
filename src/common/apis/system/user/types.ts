import type { PostVO } from "../post/types.ts"
import type { RoleVO } from "../role/types.ts"

/**
 * 用户信息
 */
export interface UserInfo {
  user: UserVO
  roles: string[]
  permissions: string[]
}

/**
 * 用户查询对象类型
 */
export interface UserQuery extends PageQuery {
  userName?: string
  nickName?: string
  phoneNumber?: string
  status?: string
  roleId?: string | number
  userIds?: string | number | Array<string | number>
  deptId?: string | number
  params?: {
    beginTime?: string
    endTime?: string
  }
}

/**
 * 用户返回对象
 */
export interface UserVO extends BaseEntity {
  userId: number | string
  deptId?: number | string
  userName: string
  nickName: string
  userType?: string
  email?: string
  phoneNumber?: string
  gender?: string
  avatar?: string | number
  status: string
  loginIp?: string
  loginDate?: string
  remark?: string
  deptName?: string
  roles?: RoleVO[]
  roleIds?: Array<string | number>
  postIds?: Array<string | number>
  roleId?: string | number
}

/**
 * 用户表单类型
 */
export interface UserForm {
  userId?: number | string
  deptId?: number | string
  userName: string
  nickName: string
  password?: string
  phoneNumber?: string
  email?: string
  gender?: string
  status: string
  remark?: string
  postIds: Array<string | number>
  roleIds: Array<string | number>
}

export interface UserInfoVO {
  user: UserVO
  roles: RoleVO[]
  roleIds: Array<string | number>
  posts: PostVO[]
  postIds: Array<string | number>
}

export interface ResetPwdForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
