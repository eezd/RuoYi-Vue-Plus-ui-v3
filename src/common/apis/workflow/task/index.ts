import type { FlowTaskVO, StartWorkflowForm, TaskQuery, UpdateAssigneeForm, UrgeTaskForm } from "./types"
import { request } from "@/http/axios.ts"

/**
 * 查询我的待办
 */
export function getWorkflowTaskWaitPageApi(query: TaskQuery) {
  return request<ApiResponsePageData<FlowTaskVO[]>>({
    url: "/workflow/task/pageByTaskWait",
    method: "get",
    params: query
  })
}

/**
 * 查询我的已办
 */
export function getWorkflowTaskFinishPageApi(query: TaskQuery) {
  return request<ApiResponsePageData<FlowTaskVO[]>>({
    url: "/workflow/task/pageByTaskFinish",
    method: "get",
    params: query
  })
}

/**
 * 查询我的抄送
 */
export function getWorkflowTaskCopyPageApi(query: TaskQuery) {
  return request<ApiResponsePageData<FlowTaskVO[]>>({
    url: "/workflow/task/pageByTaskCopy",
    method: "get",
    params: query
  })
}

/**
 * 查询全租户待办
 */
export function getWorkflowTaskAllWaitPageApi(query: TaskQuery) {
  return request<ApiResponsePageData<FlowTaskVO[]>>({
    url: "/workflow/task/pageByAllTaskWait",
    method: "get",
    params: query
  })
}

/**
 * 查询全租户已办
 */
export function getWorkflowTaskAllFinishPageApi(query: TaskQuery) {
  return request<ApiResponsePageData<FlowTaskVO[]>>({
    url: "/workflow/task/pageByAllTaskFinish",
    method: "get",
    params: query
  })
}

/**
 * 发起流程
 */
export function startWorkflowTaskApi(data: StartWorkflowForm) {
  return request<ApiResponseData<{ taskId: string | number }>>({
    url: "/workflow/task/startWorkFlow",
    method: "post",
    data
  })
}

/**
 * 办理流程
 */
export function completeWorkflowTaskApi(data: Record<string, any>) {
  return request<ApiResponseData<null>>({
    url: "/workflow/task/completeTask",
    method: "post",
    data
  })
}

/**
 * 驳回流程
 */
export function backWorkflowProcessApi(data: Record<string, any>) {
  return request<ApiResponseData<null>>({
    url: "/workflow/task/backProcess",
    method: "post",
    data
  })
}

/**
 * 终止任务
 */
export function terminationWorkflowTaskApi(data: Record<string, any>) {
  return request<ApiResponseData<null>>({
    url: "/workflow/task/terminationTask",
    method: "post",
    data
  })
}

/**
 * 修改任务办理人
 */
export function updateWorkflowTaskAssigneeApi(data: UpdateAssigneeForm) {
  return request<ApiResponseData<null>>({
    url: `/workflow/task/updateAssignee/${data.userId}`,
    method: "put",
    data: data.taskIdList
  })
}

/**
 * 催办任务
 */
export function urgeWorkflowTaskApi(data: UrgeTaskForm) {
  return request<ApiResponseData<null>>({
    url: "/workflow/task/urgeTask",
    method: "post",
    data
  })
}
