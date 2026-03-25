import type { DemoForm, DemoQuery, DemoVO } from "./types"
import { request } from "@/http/axios"

/**
 * 查询测试单列表
 * @param query
 * @returns {*}
 */

export function getSysDemoListApi(query?: DemoQuery) {
  return request<ApiResponsePageData<DemoVO[]>>({
    url: "/demo/demo/list",
    method: "get",
    params: query
  })
};

/**
 * 查询测试单详细
 * @param id
 */
export function getSysDemoApi(id: string | number) {
  return request<ApiResponseData<DemoVO>>({
    url: `/demo/demo/${id}`,
    method: "get"
  })
}

/**
 * 新增测试单
 * @param data
 */
export function addSysDemoApi(data: DemoForm) {
  return request<ApiResponseData<null>>({
    url: "/demo/demo",
    method: "post",
    data
  })
}

/**
 * 修改测试单
 * @param data
 */
export function updateSysDemoApi(data: DemoForm) {
  return request<ApiResponseData<null>>({
    url: "/demo/demo",
    method: "put",
    data
  })
}

/**
 * 删除测试单
 * @param id
 */
export function delSysDemoApi(id: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/demo/demo/${id}`,
    method: "delete"
  })
}
