import type { OnlineQuery, OnlineVO } from "./types"
import { request } from "@/http/axios"

// 查询在线用户列表
export function getSysOnlineListApi(query: OnlineQuery) {
  return request<ApiResponsePageData<OnlineVO[]>>({
    url: "/monitor/online/list",
    method: "get",
    params: query
  })
}

// 强退用户
export function forceLogoutSysOnlineApi(tokenId: string) {
  return request({
    url: `/monitor/online/${tokenId}`,
    method: "delete"
  })
}

// 获取当前用户登录在线设备
export function getSysOnlineApi() {
  return request({
    url: "/monitor/online",
    method: "get"
  })
}

// 删除当前在线设备
export function delSysOnlineApi(tokenId: string) {
  return request({
    url: `/monitor/online/myself/${tokenId}`,
    method: "delete"
  })
}
