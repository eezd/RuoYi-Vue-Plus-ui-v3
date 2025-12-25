import type { ConfigForm, ConfigQuery, ConfigVO } from "./types"
import { request } from "@/http/axios"

// 查询参数列表
export function getSysConfigListApi(query: ConfigQuery) {
  return request<ApiResponsePageData<ConfigVO[]>>({
    url: "/system/config/list",
    method: "get",
    params: query
  })
}

// 查询参数详细
export function getSysConfigApi(configId: string | number) {
  return request<ApiResponseData<ConfigVO>>({
    url: `/system/config/${configId}`,
    method: "get"
  })
}

// 根据参数键名查询参数值
export function getSysConfigKeyApi(configKey: string) {
  return request<ApiResponseData<string>>({
    url: `/system/config/configKey/${configKey}`,
    method: "get"
  })
}

// 新增参数配置
export function addSysConfigApi(data: ConfigForm) {
  return request<ApiResponseData<null>>({
    url: "/system/config",
    method: "post",
    data
  })
}

// 修改参数配置
export function updateSysConfigApi(data: ConfigForm) {
  return request<ApiResponseData<null>>({
    url: "/system/config",
    method: "put",
    data
  })
}

// 修改参数配置
export function updateSysConfigByKeyApi(key: string, value: any) {
  return request<ApiResponseData<null>>({
    url: "/system/config/updateByKey",
    method: "put",
    data: {
      configKey: key,
      configValue: value
    }
  })
}

// 删除参数配置
export function delConfigApi(configId: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/system/config/${configId}`,
    method: "delete"
  })
}

// 刷新参数缓存
export function refreshCacheApi() {
  return request<ApiResponseData<null>>({
    url: "/system/config/refreshCache",
    method: "delete"
  })
}
