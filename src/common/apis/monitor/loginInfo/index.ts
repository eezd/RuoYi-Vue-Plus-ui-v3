import type { LoginInfoQuery, LoginInfoVO } from "./types.ts"
import { request } from "@/http/axios.ts"

// 查询登录日志列表
export function getSysLoginInfoListApi(query: LoginInfoQuery) {
  return request<ApiResponsePageData<LoginInfoVO[]>>({
    url: "/monitor/logininfor/list",
    method: "get",
    params: query
  })
}

// 删除登录日志
export function delSysLoginInfoApi(infoId: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/monitor/logininfor/${infoId}`,
    method: "delete"
  })
}

// 解锁用户登录状态
export function unlockSysLoginInfoApi(userName: string | Array<string>) {
  return request<ApiResponseData<null>>({
    url: `/monitor/logininfor/unlock/${userName}`,
    method: "get"
  })
}

// 清空登录日志
export function cleanSysLoginInfoApi() {
  return request<ApiResponseData<null>>({
    url: "/monitor/logininfor/clean",
    method: "delete"
  })
}
