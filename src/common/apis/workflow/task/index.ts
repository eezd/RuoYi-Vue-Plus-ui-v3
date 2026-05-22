import type { FlowNextNodeForm, FlowNodeVO, FlowTaskVO, StartWorkflowForm, TaskOperationForm, TaskQuery, UpdateAssigneeForm, UrgeTaskForm, WorkflowUserDTO } from "./types"
import { normalizePageResult } from "@@/apis/utils"
import { request } from "@/http/axios.ts"

/**
 * 查询我的待办
 */
export async function getWorkflowTaskWaitPageApi(query: TaskQuery) {
  const response = await request<ApiResponseData<PageResult<FlowTaskVO>>>({
    url: "/workflow/task/pageByTaskWait",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 查询我的已办
 */
export async function getWorkflowTaskFinishPageApi(query: TaskQuery) {
  const response = await request<ApiResponseData<PageResult<FlowTaskVO>>>({
    url: "/workflow/task/pageByTaskFinish",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 查询我的抄送
 */
export async function getWorkflowTaskCopyPageApi(query: TaskQuery) {
  const response = await request<ApiResponseData<PageResult<FlowTaskVO>>>({
    url: "/workflow/task/pageByTaskCopy",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 查询全租户待办
 */
export async function getWorkflowTaskAllWaitPageApi(query: TaskQuery) {
  const response = await request<ApiResponseData<PageResult<FlowTaskVO>>>({
    url: "/workflow/task/pageByAllTaskWait",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 查询全租户已办
 */
export async function getWorkflowTaskAllFinishPageApi(query: TaskQuery) {
  const response = await request<ApiResponseData<PageResult<FlowTaskVO>>>({
    url: "/workflow/task/pageByAllTaskFinish",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
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
 * 获取当前任务详情
 */
export function getWorkflowTaskApi(taskId: string | number) {
  return request<ApiResponseData<FlowTaskVO>>({
    url: `/workflow/task/getTask/${taskId}`,
    method: "get"
  })
}

/**
 * 获取下一节点信息
 */
export function getWorkflowTaskNextNodeListApi(data: FlowNextNodeForm) {
  return request<ApiResponseData<FlowNodeVO[]>>({
    url: "/workflow/task/getNextNodeList",
    method: "post",
    data
  })
}

/**
 * 获取可驳回任务节点
 */
export function getWorkflowTaskBackNodeApi(taskId: string | number, nodeCode: string) {
  return request<ApiResponseData<FlowNodeVO[]>>({
    url: `/workflow/task/getBackTaskNode/${taskId}/${nodeCode}`,
    method: "get"
  })
}

/**
 * 委派、转办、加签、减签等任务操作
 */
export function operateWorkflowTaskApi(data: TaskOperationForm, operation: string) {
  return request<ApiResponseData<null>>({
    url: `/workflow/task/taskOperation/${operation}`,
    method: "post",
    data
  })
}

/**
 * 获取当前任务所有办理人
 */
export function getWorkflowTaskCurrentAllUserApi(taskId: string | number) {
  return request<ApiResponseData<WorkflowUserDTO[]>>({
    url: `/workflow/task/currentTaskAllUser/${taskId}`,
    method: "get"
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
