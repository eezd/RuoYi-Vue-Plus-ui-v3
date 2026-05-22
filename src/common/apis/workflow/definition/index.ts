import type { definitionXmlVO, FlowDefinitionForm, FlowDefinitionQuery, FlowDefinitionVO } from "./types"
import { normalizePageResult } from "@@/apis/utils"
import { request } from "@/http/axios.ts"

/**
 * 获取流程定义列表
 * @param query 流程实例id
 */
export async function getWorkflowDefinitionListApi(query: FlowDefinitionQuery) {
  const response = await request<ApiResponseData<PageResult<FlowDefinitionVO>>>({
    url: `/workflow/definition/list`,
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 查询未发布的流程定义列表
 * @param query 流程实例id
 */
export async function unWorkflowDefinitionPublishListApi(query: FlowDefinitionQuery) {
  const response = await request<ApiResponseData<PageResult<FlowDefinitionVO>>>({
    url: `/workflow/definition/unPublishList`,
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

/**
 * 通过流程定义id获取xml
 * @param definitionId 流程定义id
 */
export function getWorkflowDefinitionXmlApi(definitionId: string) {
  return request<ApiResponseData<definitionXmlVO>>({
    url: `/workflow/definition/definitionXml/${definitionId}`,
    method: "get"
  })
}

/**
 * 删除流程定义
 * @param id 流程定义id
 */
export function deleteWorkflowDefinitionApi(id: string | string[]) {
  return request({
    url: `/workflow/definition/${id}`,
    method: "delete"
  })
}

/**
 * 挂起/激活
 * @param definitionId 流程定义id
 * @param activityStatus 状态
 */
export function activeWorkflowDefinitionApi(definitionId: string, activityStatus: boolean) {
  return request({
    url: `/workflow/definition/active/${definitionId}`,
    method: "put",
    params: {
      active: activityStatus
    }
  })
}

/**
 * 通过zip或xml部署流程定义
 */
export function importWorkflowDefinitionApi(data: any) {
  return request({
    url: "/workflow/definition/importDef",
    method: "post",
    data,
    headers: {
      repeatSubmit: false
    }
  })
}

/**
 * 发布流程定义
 * @param id 流程定义id
 */
export function publishWorkflowDefinitionApi(id: string) {
  return request({
    url: `/workflow/definition/publish/${id}`,
    method: "put"
  })
}

/**
 * 取消发布流程定义
 * @param id 流程定义id
 */
export function unPublishWorkflowDefinitionApi(id: string) {
  return request({
    url: `/workflow/definition/unPublish/${id}`,
    method: "put"
  })
}

/**
 * 获取流程定义xml字符串
 * @param id 流程定义id
 */
export function getWorkflowDefinitionXmlStringApi(id: string) {
  return request({
    url: `/workflow/definition/xmlString/${id}`,
    method: "get"
  })
}

/**
 * 新增
 * @param data 参数
 */
export function addWorkflowDefinitionApi(data: FlowDefinitionForm) {
  return request({
    url: `/workflow/definition`,
    method: "post",
    data
  })
}

/**
 * 修改
 * @param data 参数
 */
export function editWorkflowDefinitionApi(data: FlowDefinitionForm) {
  return request({
    url: `/workflow/definition`,
    method: "put",
    data
  })
}

/**
 * 查询详情
 * @param id 参数
 */
export function getWorkflowDefinitionInfoApi(id: number | string) {
  return request({
    url: `/workflow/definition/${id}`,
    method: "get"
  })
}

/**
 * 复制流程定义
 * @param id 流程定义id
 */
export function copyWorkflowDefinitionApi(id: string) {
  return request({
    url: `/workflow/definition/copy/${id}`,
    method: "post"
  })
}
