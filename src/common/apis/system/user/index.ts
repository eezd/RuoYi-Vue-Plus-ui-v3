import type { DeptTreeVO } from "../dept/types.ts"
import type { RoleVO } from "../role/types.ts"
import type { UserForm, UserInfo, UserInfoVO, UserQuery, UserVO } from "./types.ts"
import { parseStrEmpty } from "@@/utils"
import { request } from "@/http/axios.ts"

// 获取用户详细信息
export function getInfoApi() {
  return request<ApiResponseData<UserInfo>>({
    url: "/system/user/getInfo",
    method: "get"
  })
}

/**
 * 查询用户列表
 */
export function getSysUserListApi(query: UserQuery) {
  return request<ApiResponsePageData<UserVO[]>>({
    url: "/system/user/list",
    method: "get",
    params: query
  })
}

/**
 * 通过用户ids查询用户
 * @param userIds
 */
export function optionSelectApi(userIds: (number | string)[]) {
  return request<ApiResponseData<UserVO[]>>({
    url: `/system/user/optionselect?userIds=${userIds}`,
    method: "get"
  })
}

/**
 * 获取用户详情
 * @param userId
 */
export function getSysUserApi(userId?: string | number) {
  return request<ApiResponseData<UserInfoVO>>({
    url: `/system/user/${parseStrEmpty(userId)}`,
    method: "get"
  })
}

/**
 * 新增用户
 */
export function addSysUserApi(data: UserForm) {
  return request({
    url: "/system/user",
    method: "post",
    data
  })
}

/**
 * 修改用户
 */
export function updateSysUserApi(data: UserForm) {
  return request({
    url: "/system/user",
    method: "put",
    data
  })
}

/**
 * 删除用户
 * @param userId 用户ID
 */
export function delSysUserApi(userId: Array<string | number> | string | number) {
  return request({
    url: `/system/user/${userId}`,
    method: "delete"
  })
}

/**
 * 用户密码重置
 * @param userId 用户ID
 * @param password 密码
 */
export function resetSysUserPwdApi(userId: string | number, password: string) {
  const data = {
    userId,
    password
  }
  return request({
    url: "/system/user/resetPwd",
    method: "put",
    headers: {
      isEncrypt: true,
      repeatSubmit: false
    },
    data
  })
}

/**
 * 用户状态修改
 * @param userId 用户ID
 * @param status 用户状态
 */
export function changeSysUserStatusApi(userId: number | string, status: string) {
  const data = {
    userId,
    status
  }
  return request({
    url: "/system/user/changeStatus",
    method: "put",
    data
  })
}

/**
 * 查询用户个人信息
 */
export function getSysUserProfileApi() {
  return request<ApiResponseData<UserInfoVO>>({
    url: "/system/user/profile",
    method: "get"
  })
}

/**
 * 修改用户个人信息
 * @param data 用户信息
 */
export function updateSysUserProfileApi(data: UserForm) {
  return request({
    url: "/system/user/profile",
    method: "put",
    data
  })
}

/**
 * 用户密码重置
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 */
export function updateSysUserPwdApi(oldPassword: string, newPassword: string) {
  const data = {
    oldPassword,
    newPassword
  }
  return request({
    url: "/system/user/profile/updatePwd",
    method: "put",
    headers: {
      isEncrypt: true,
      repeatSubmit: false
    },
    data
  })
}

/**
 * 用户头像上传
 */
export function uploadAvatarApi(data: FormData) {
  return request({
    url: "/system/user/profile/avatar",
    method: "post",
    data
  })
}

/**
 * 查询授权角色
 */
export function getAuthRoleApi(userId: string | number) {
  return request<ApiResponseData<{ user: UserVO, roles: RoleVO[] }>>({
    url: `/system/user/authRole/${userId}`,
    method: "get"
  })
}

/**
 * 保存授权角色
 */
export function updateAuthRoleApi(data: { userId: string, roleIds: string }) {
  return request<ApiResponseData<UserInfo>>({
    url: "/system/user/authRole",
    method: "put",
    params: data
  })
}

/**
 * 查询当前部门的所有用户信息
 * @param deptId
 */
export function getSysUserListByDeptIdApi(deptId: string | number) {
  return request<ApiResponseData<UserVO[]>>({
    url: `/system/user/list/dept/${deptId}`,
    method: "get"
  })
}

/**
 * 查询部门下拉树结构
 */
export function getSysDeptTreeSelectApi() {
  return request<ApiResponseData<DeptTreeVO[]>>({
    url: "/system/user/deptTree",
    method: "get"
  })
}
