import type { CancelProcessApplyForm, FlowHistoryTaskListResult, FlowInstanceQuery, FlowInstanceVO, FlowVariableForm, InvalidProcessForm } from "./types"
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
 * 查询流程实例详情
 */
export function getWorkflowInstanceInfoApi(businessId: string | number) {
  return request<ApiResponseData<FlowInstanceVO>>({
    url: `/workflow/instance/getInfo/${businessId}`,
    method: "get"
  })
}

/**
 * 查询流程图和历史审批记录
 */
export function getWorkflowInstanceHistoryTaskListApi(businessId: string | number) {
  return request<ApiResponseData<FlowHistoryTaskListResult>>({
    url: `/workflow/instance/flowHisTaskList/${businessId}`,
    method: "get",
    params: {
      t: Math.random()
    }
  })
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
 * 删除指定业务单据关联的实例
 */
export function deleteWorkflowInstanceByBusinessIdsApi(businessIds: Array<string | number> | string | number) {
  return request<ApiResponseData<null>>({
    url: `/workflow/instance/deleteByBusinessIds/${businessIds}`,
    method: "delete"
  })
}

/**
 * 激活/挂起流程实例
 */
export function activeWorkflowInstanceApi(instanceId: string | number, active: boolean) {
  return request<ApiResponseData<boolean>>({
    url: `/workflow/instance/active/${instanceId}`,
    method: "put",
    params: { active }
  })
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
