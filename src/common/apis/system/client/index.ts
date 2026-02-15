import type { ClientForm, ClientQuery, ClientVO } from "./types.ts"
import { request } from "@/http/axios.ts"

/**
 * 查询客户端管理列表
 */
export function getSysClientListApi(query?: ClientQuery) {
  return request<ApiResponsePageData<ClientVO[]>>({
    url: "/system/client/list",
    method: "get",
    params: query
  })
}

/**
 * 查询客户端管理详细
 */
export function getSysClientApi(id: string | number) {
  return request<ApiResponseData<ClientVO>>({
    url: `/system/client/${id}`,
    method: "get"
  })
}

/**
 * 新增客户端管理
 */
export function addSysClientApi(data: ClientForm) {
  return request<ApiResponseData<null>>({
    url: "/system/client",
    method: "post",
    data
  })
}

/**
 * 修改客户端管理
 */
export function updateSysClientApi(data: ClientForm) {
  return request<ApiResponseData<null>>({
    url: "/system/client",
    method: "put",
    data
  })
}

/**
 * 删除客户端管理
 */
export function delSysClientApi(id: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/system/client/${id}`,
    method: "delete"
  })
}

/**
 * 状态修改
 */
export function changeSysClientStatusApi(clientId: string, status: string) {
  const data = {
    clientId,
    status
  }
  return request<ApiResponseData<null>>({
    url: "/system/client/changeStatus",
    method: "put",
    data
  })
}
