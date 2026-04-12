import type { TreeForm, TreeQuery, TreeVO } from "./types"
import { request } from "@/http/axios"

/**
 * 查询测试树列表
 * @param query
 * @returns {*}
 */

export function getSysTreeListApi(query?: TreeQuery) {
  return request<ApiResponsePageData<TreeVO[]>>({
    url: "/demo/tree/list",
    method: "get",
    params: query
  })
};

/**
 * 查询测试树详细
 * @param id
 */
export function getSysTreeApi(id: string | number) {
  return request<ApiResponseData<TreeVO>>({
    url: `/demo/tree/${id}`,
    method: "get"
  })
}

/**
 * 新增测试树
 * @param data
 */
export function addSysTreeApi(data: TreeForm) {
  return request<ApiResponseData<null>>({
    url: "/demo/tree",
    method: "post",
    data
  })
}

/**
 * 修改测试树
 * @param data
 */
export function updateSysTreeApi(data: TreeForm) {
  return request<ApiResponseData<null>>({
    url: "/demo/tree",
    method: "put",
    data
  })
}

/**
 * 删除测试树
 * @param id
 */
export function delSysTreeApi(id: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/demo/tree/${id}`,
    method: "delete"
  })
}
