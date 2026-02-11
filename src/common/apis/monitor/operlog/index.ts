import type { OperLogQuery, OperLogVO } from "./types.ts"
import { request } from "@/http/axios.ts"

// 查询操作日志列表
export function getSysOperlogListApi(query: OperLogQuery) {
  return request<ApiResponsePageData<OperLogVO[]>>({
    url: "/monitor/operlog/list",
    method: "get",
    params: query
  })
}

// 删除操作日志
export function delSysOperlogApi(operId: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/monitor/operlog/${operId}`,
    method: "delete"
  })
}

// 清空操作日志
export function cleanSysOperlogApi() {
  return request<ApiResponseData<null>>({
    url: "/monitor/operlog/clean",
    method: "delete"
  })
}
