import type { OnlineQuery, OnlineVO } from "./types.ts"
import { normalizePageResult } from "@@/apis/utils"
import { request } from "@/http/axios.ts"

// 查询在线用户列表
export async function getSysOnlineListApi(query: OnlineQuery) {
  const response = await request<ApiResponseData<PageResult<OnlineVO>>>({
    url: "/monitor/online/list",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

// 强退用户
export function forceLogoutSysOnlineApi(tokenId: string) {
  return request({
    url: `/monitor/online/${tokenId}`,
    method: "delete"
  })
}

// 获取当前用户登录在线设备
export async function getSysOnlineApi() {
  const response = await request<ApiResponseData<PageResult<OnlineVO>>>({
    url: "/monitor/online",
    method: "get"
  })
  return normalizePageResult(response)
}

// 删除当前在线设备
export function delSysOnlineApi(tokenId: string) {
  return request({
    url: `/monitor/online/myself/${tokenId}`,
    method: "delete"
  })
}
