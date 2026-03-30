import type { LeaveForm, LeaveQuery, LeaveVO } from "./types"
import { request } from "@/http/axios.ts"

/**
 * 查询请假列表
 */
export function getWorkflowLeaveListApi(query?: LeaveQuery) {
  return request<ApiResponsePageData<LeaveVO[]>>({
    url: "/workflow/leave/list",
    method: "get",
    params: query
  })
}

/**
 * 查询请假详情
 */
export function getWorkflowLeaveApi(id: string | number) {
  return request<ApiResponseData<LeaveVO>>({
    url: `/workflow/leave/${id}`,
    method: "get"
  })
}

/**
 * 新增请假
 */
export function addWorkflowLeaveApi(data: LeaveForm) {
  return request<ApiResponseData<LeaveVO>>({
    url: "/workflow/leave",
    method: "post",
    data
  })
}

/**
 * 提交请假并发起流程（后端发起）
 */
export function submitWorkflowLeaveAndFlowStartApi(data: LeaveForm) {
  return request<ApiResponseData<LeaveVO>>({
    url: "/workflow/leave/submitAndFlowStart",
    method: "post",
    data
  })
}

/**
 * 修改请假
 */
export function updateWorkflowLeaveApi(data: LeaveForm) {
  return request<ApiResponseData<LeaveVO>>({
    url: "/workflow/leave",
    method: "put",
    data
  })
}

/**
 * 删除请假
 */
export function delWorkflowLeaveApi(id: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/workflow/leave/${id}`,
    method: "delete"
  })
}
