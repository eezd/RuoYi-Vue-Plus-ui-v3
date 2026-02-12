import type { UserQuery, UserVO } from "../user/types.ts"
import type { RoleDeptTree, RoleQuery, RoleVO } from "./types.ts"
import { request } from "@/http/axios.ts"

export function getSysRolelistApi(query: RoleQuery) {
  return request<ApiResponsePageData<RoleVO[]>>({
    url: "/system/role/list",
    method: "get",
    params: query
  })
}

/**
 * 通过roleIds查询角色
 * @param roleIds
 */
export function optionSelectApi(roleIds: (number | string)[]) {
  return request<ApiResponseData<RoleVO[]>>({
    url: `/system/role/optionselect?roleIds=${roleIds}`,
    method: "get"
  })
}

/**
 * 查询角色详细
 */
export function getSysRoleApi(roleId: string | number) {
  return request<ApiResponseData<RoleVO>>({
    url: `/system/role/${roleId}`,
    method: "get"
  })
}

/**
 * 新增角色
 */
export function addSysRoleApi(data: any) {
  return request<ApiResponseData<null>>({
    url: "/system/role",
    method: "post",
    data
  })
}

/**
 * 修改角色
 * @param data
 */
export function updateSysRoleApi(data: any) {
  return request<ApiResponseData<null>>({
    url: "/system/role",
    method: "put",
    data
  })
}

/**
 * 角色数据权限
 */
export function updateSysRoleDataScopeApi(data: any) {
  return request<ApiResponseData<null>>({
    url: "/system/role/dataScope",
    method: "put",
    data
  })
}

/**
 * 角色状态修改
 */
export function changeSysRoleStatusApi(roleId: string | number, status: string) {
  const data = {
    roleId,
    status
  }
  return request<ApiResponseData<null>>({
    url: "/system/role/changeStatus",
    method: "put",
    data
  })
}

/**
 * 删除角色
 */
export function delSysRoleApi(roleId: Array<string | number> | string | number) {
  return request<ApiResponseData<null>>({
    url: `/system/role/${roleId}`,
    method: "delete"
  })
}

/**
 * 查询角色已授权用户列表
 */
export function allocatedSysUserListApi(query: UserQuery) {
  return request<ApiResponsePageData<UserVO[]>>({
    url: "/system/role/authUser/allocatedList",
    method: "get",
    params: query
  })
}

/**
 * 查询角色未授权用户列表
 */
export function unallocatedSysUserListApi(query: UserQuery) {
  return request<ApiResponsePageData<UserVO[]>>({
    url: "/system/role/authUser/unallocatedList",
    method: "get",
    params: query
  })
}

/**
 * 取消用户授权角色
 */
export function authSysUserCancelApi(data: any) {
  return request<ApiResponseData<null>>({
    url: "/system/role/authUser/cancel",
    method: "put",
    data
  })
}

/**
 * 批量取消用户授权角色
 */
export function authSysUserCancelAll(data: any) {
  return request<ApiResponseData<null>>({
    url: "/system/role/authUser/cancelAll",
    method: "put",
    params: data
  })
}

/**
 * 授权用户选择
 */
export function authSysUserSelectAll(data: any) {
  return request<ApiResponseData<null>>({
    url: "/system/role/authUser/selectAll",
    method: "put",
    params: data
  })
}

// 根据角色ID查询部门树结构
export function getSysDeptTreeSelectApi(roleId: string | number) {
  return request<ApiResponseData<RoleDeptTree>>({
    url: `/system/role/deptTree/${roleId}`,
    method: "get"
  })
}
