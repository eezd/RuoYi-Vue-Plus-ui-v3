import type { CacheVO } from "./types.ts"
import { request } from "@/http/axios.ts"

// 查询缓存详细
export function getSysCacheApi() {
  return request<ApiResponseData<CacheVO>>({
    url: "/monitor/cache",
    method: "get"
  })
}
