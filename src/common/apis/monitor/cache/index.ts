import type { CacheVO } from "./types.ts"
import { request } from "@/http/axios.ts"

// 查询缓存详细
export function getSysCacheApi() {
  return request<ApiResponseData<CacheVO>>({
    url: "/monitor/cache",
    method: "get"
  })
}

// 查询缓存名称列表
export function listSysCacheNameApi() {
  return request({
    url: "/monitor/cache/getNames",
    method: "get"
  })
}

// 查询缓存键名列表
export function listSysCacheKeyApi(cacheName: string) {
  return request({
    url: `/monitor/cache/getKeys/${cacheName}`,
    method: "get"
  })
}

// 查询缓存内容
export function getSysCacheValueApi(cacheName: string, cacheKey: string) {
  return request({
    url: `/monitor/cache/getValue/${cacheName}/${cacheKey}`,
    method: "get"
  })
}

// 清理指定名称缓存
export function clearSysCacheNameApi(cacheName: string) {
  return request({
    url: `/monitor/cache/clearCacheName/${cacheName}`,
    method: "delete"
  })
}

// 清理指定键名缓存
export function clearCacheKeyApi(cacheName: string, cacheKey: string) {
  return request({
    url: `/monitor/cache/clearCacheKey/${cacheName}/${cacheKey}`,
    method: "delete"
  })
}

// 清理全部缓存
export function clearSysCacheAllApi() {
  return request({
    url: "/monitor/cache/clearCacheAll",
    method: "delete"
  })
}
