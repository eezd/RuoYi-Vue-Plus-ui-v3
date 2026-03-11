import type { SpelForm, SpelQuery, SpelVO } from "./types"
import { request } from "@/http/axios.ts"

/**
 * 查询流程spel表达式定义列表
 * @param query
 * @returns {*}
 */

export function getWorkflowSpelListApi(query?: SpelQuery) {
  return request<ApiResponsePageData<SpelVO[]>>({
    url: "/workflow/spel/list",
    method: "get",
    params: query
  })
}

/**
 * 查询流程spel表达式定义详细
 * @param id
 */
export function getWorkflowSpelApi(id: string | number) {
  return request<ApiResponseData<SpelVO>>({
    url: `/workflow/spel/${id}`,
    method: "get"
  })
}

/**
 * 新增流程spel表达式定义
 * @param data
 */
export function addWorkflowSpelApi(data: SpelForm) {
  return request({
    url: "/workflow/spel",
    method: "post",
    data
  })
}

/**
 * 修改流程spel表达式定义
 * @param data
 */
export function updateWorkflowSpelApi(data: SpelForm) {
  return request({
    url: "/workflow/spel",
    method: "put",
    data
  })
}

/**
 * 删除流程spel表达式定义
 * @param id
 */
export function delWorkflowSpelApi(id: string | number | Array<string | number>) {
  return request({
    url: `/workflow/spel/${id}`,
    method: "delete"
  })
}
