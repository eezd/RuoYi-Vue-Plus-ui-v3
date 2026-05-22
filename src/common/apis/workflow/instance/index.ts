import type { CancelProcessApplyForm, FlowInstanceQuery, FlowInstanceVO, FlowVariableForm, InvalidProcessForm } from "./types"
import { normalizePageResult } from "@@/apis/utils"
import { request } from "@/http/axios.ts"

/**
 * 查询运行中实例
 */
export async function getWorkflowInstanceRunningPageApi(query: FlowInstanceQuery) {
  const response = await request<ApiResponseData<PageResult<FlowInstanceVO>>>({
    url: "/workflow/instance/pageByRunning",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 查询已完成实例
 */
export async function getWorkflowInstanceFinishPageApi(query: FlowInstanceQuery) {
  const response = await request<ApiResponseData<PageResult<FlowInstanceVO>>>({
    url: "/workflow/instance/pageByFinish",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 查询当前登录人发起的单据
 */
export async function getWorkflowInstanceCurrentPageApi(query: FlowInstanceQuery) {
  const response = await request<ApiResponseData<PageResult<FlowInstanceVO>>>({
    url: "/workflow/instance/pageByCurrent",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 撤销流程申请
 */
export function cancelWorkflowProcessApplyApi(data: CancelProcessApplyForm) {
  return request<ApiResponseData<null>>({
    url: "/workflow/instance/cancelProcessApply",
    method: "put",
    data
  })
}

/**
 * 获取流程变量
 */
export function getWorkflowInstanceVariableApi(instanceId: string | number) {
  return request<ApiResponseData<{ variable: string }>>({
    url: `/workflow/instance/instanceVariable/${instanceId}`,
    method: "get"
  })
}

/**
 * 删除运行中实例
 */
export function deleteWorkflowInstanceByIdsApi(instanceIds: Array<string | number> | string | number) {
  return request<ApiResponseData<null>>({
    url: `/workflow/instance/deleteByInstanceIds/${instanceIds}`,
    method: "delete"
  })
}

/**
 * 删除历史实例
 */
export function deleteWorkflowHistoryInstanceByIdsApi(instanceIds: Array<string | number> | string | number) {
  return request<ApiResponseData<null>>({
    url: `/workflow/instance/deleteHisByInstanceIds/${instanceIds}`,
    method: "delete"
  })
}

/**
 * 作废流程
 */
export function invalidWorkflowInstanceApi(data: InvalidProcessForm) {
  return request<ApiResponseData<null>>({
    url: "/workflow/instance/invalid",
    method: "post",
    data
  })
}

/**
 * 修改流程变量
 */
export function updateWorkflowInstanceVariableApi(data: FlowVariableForm) {
  return request<ApiResponseData<null>>({
    url: "/workflow/instance/updateVariable",
    method: "put",
    data
  })
}
