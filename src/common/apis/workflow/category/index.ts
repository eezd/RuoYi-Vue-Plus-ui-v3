import type { CategoryForm, CategoryQuery, CategoryTreeVO, CategoryVO } from "./types"
import { request } from "@/http/axios.ts"

/**
 * 查询流程分类列表
 * @param query
 * @returns {*}
 */

export function getWorkflowCategoryListApi(query?: CategoryQuery) {
  return request<ApiResponseData<CategoryVO[]>>({
    url: "/workflow/category/list",
    method: "get",
    params: query
  })
}

/**
 * 查询流程分类详细
 * @param categoryId
 */
export function getWorkflowCategoryApi(categoryId: string | number) {
  return request<ApiResponseData<CategoryVO>>({
    url: `/workflow/category/${categoryId}`,
    method: "get"
  })
}

/**
 * 新增流程分类
 * @param data
 */
export function addWorkflowCategoryApi(data: CategoryForm) {
  return request({
    url: "/workflow/category",
    method: "post",
    data
  })
}

/**
 * 修改流程分类
 * @param data
 */
export function updateWorkflowCategoryApi(data: CategoryForm) {
  return request({
    url: "/workflow/category",
    method: "put",
    data
  })
}

/**
 * 删除流程分类
 * @param categoryId
 */
export function delWorkflowCategoryApi(categoryId: string | number | Array<string | number>) {
  return request({
    url: `/workflow/category/${categoryId}`,
    method: "delete"
  })
}

/**
 * 获取流程分类树列表
 * @param query 流程实例id
 */
export function getWorkflowCategoryTreeApi(query?: CategoryForm) {
  return request<ApiResponseData<CategoryTreeVO[]>>({
    url: `/workflow/category/categoryTree`,
    method: "get",
    params: query
  })
}
