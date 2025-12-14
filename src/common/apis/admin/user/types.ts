import type { RoleVO } from "../role/types"

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
  phonenumber?: string
  status?: string
  roleId?: string | number
  userIds?: string | number | (string | number)[] | undefined
}

/**
 * 用户返回对象
 */
export interface UserVO extends BaseEntity {
  /**
   * 用户ID
   */
  userId: string | number
  /**
   * 用户账号
   */
  userName: string
  /**
   * 用户昵称
   */
  nickName: string
  /**
   * 用户类型（sys_user系统用户）
   */
  userType: string
  /**
   * 用户邮箱
   */
  email: string
  /**
   * 手机号码
   */
  phonenumber: string
  /**
   * 用户性别（0男 1女 2未知）
   */
  sex: string
  /**
   * 头像地址
   */
  avatar: string
  /**
   * 帐号状态（0正常 1停用）
   */
  status: string
  delFlag: string
  /**
   * 最后登录IP
   */
  loginIp: string
  /**
   * 最后登录时间
   */
  loginDate: string
  /**
   * 备注
   */
  remark: string
  /**
   * 角色对象
   */
  roles: RoleVO[]
  /**
   * 角色组
   */
  roleIds: any
  /**
   * 岗位组
   */
  postIds: any
  /**
   * 数据权限 当前角色ID
   */
  roleId: any
  admin: boolean
}

/**
 * 用户表单类型
 */
export interface UserForm {
  id?: string
  userId?: string
  userName: string
  nickName?: string
  password: string
  phonenumber?: string
  email?: string
  sex?: string
  status: string
  remark?: string
  postIds: string[]
  roleIds: string[]
}

export interface UserInfoVO {
  user: UserVO
  roles: RoleVO[]
  permissions: string[]
}

export interface ResetPwdForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
