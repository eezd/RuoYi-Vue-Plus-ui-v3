import type { LoginInfoQuery, LoginInfoVO } from "./types.ts"
import { normalizePageResult } from "@@/apis/utils"
import { request } from "@/http/axios.ts"

// 查询登录日志列表
export async function getSysLoginInfoListApi(query: LoginInfoQuery) {
  const response = await request<ApiResponseData<PageResult<LoginInfoVO>>>({
    url: "/monitor/loginInfo/list",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

// 删除登录日志
export function delSysLoginInfoApi(infoId: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/monitor/loginInfo/${infoId}`,
    method: "delete"
  })
}

// 解锁用户登录状态
export function unlockSysLoginInfoApi(userName: string | Array<string>) {
  return request<ApiResponseData<null>>({
    url: `/monitor/loginInfo/unlock/${userName}`,
    method: "get"
  })
}

// 清空登录日志
export function cleanSysLoginInfoApi() {
  return request<ApiResponseData<null>>({
    url: "/monitor/loginInfo/clean",
    method: "delete"
  })
}
