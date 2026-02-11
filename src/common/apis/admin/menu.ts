import type { RouteRecordRaw } from "vue-router"
import { request } from "@/http/axios"

// 获取路由
export function getRouters() {
  return request<ApiResponseData<RouteRecordRaw[]>>({
    url: "/system/menu/getRouters",
    method: "get"
  })
}
