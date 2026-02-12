import type { DeptForm, DeptQuery, DeptVO } from "./types"
import { request } from "@/http/axios"

// 查询部门列表
export function getSysDeptListApi(query?: DeptQuery) {
  return request({
    url: "/system/dept/list",
    method: "get",
    params: query
  })
}

/**
 * 通过deptIds查询部门
 * @param deptIds
 */
export function getSysDeptOptionSelectApi(deptIds: (number | string)[]) {
  return request<ApiResponseData<DeptVO[]>>({
    url: `/system/dept/optionselect?deptIds=${deptIds}`,
    method: "get"
  })
}

// 查询部门列表（排除节点）
export function getSysDeptListExcludeChildApi(deptId: string | number) {
  return request<ApiResponseData<DeptVO[]>>({
    url: `/system/dept/list/exclude/${deptId}`,
    method: "get"
  })
}

// 查询部门详细
export function getSysDeptApi(deptId: string | number) {
  return request<ApiResponseData<DeptVO>>({
    url: `/system/dept/${deptId}`,
    method: "get"
  })
}

// 新增部门
export function addSysDeptApi(data: DeptForm) {
  return request({
    url: "/system/dept",
    method: "post",
    data
  })
}

// 修改部门
export function updateSysDeptApi(data: DeptForm) {
  return request({
    url: "/system/dept",
    method: "put",
    data
  })
}

// 删除部门
export function delSysDeptApi(deptId: number | string) {
  return request({
    url: `/system/dept/${deptId}`,
    method: "delete"
  })
}
