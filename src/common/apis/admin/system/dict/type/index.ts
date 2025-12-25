import type { DictTypeForm, DictTypeQuery, DictTypeVO } from "./types"
import { request } from "@/http/axios"

// 查询字典类型列表
export function getSysDictListTypeApi(query: DictTypeQuery) {
  return request<ApiResponsePageData<DictTypeVO[]>>({
    url: "/system/dict/type/list",
    method: "get",
    params: query
  })
}

// 查询字典类型详细
export function getSysDictTypeApi(dictId: number | string) {
  return request<ApiResponseData<DictTypeVO>>({
    url: `/system/dict/type/${dictId}`,
    method: "get"
  })
}

// 新增字典类型
export function addSysDictTypeApi(data: DictTypeForm) {
  return request<ApiResponseData<null>>({
    url: "/system/dict/type",
    method: "post",
    data
  })
}

// 修改字典类型
export function updateSysDictTypeApi(data: DictTypeForm) {
  return request<ApiResponseData<null>>({
    url: "/system/dict/type",
    method: "put",
    data
  })
}

// 删除字典类型
export function delSysDictTypeApi(dictId: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/system/dict/type/${dictId}`,
    method: "delete"
  })
}

// 刷新字典缓存
export function refreshSysDictCacheApi() {
  return request<ApiResponseData<null>>({
    url: "/system/dict/type/refreshCache",
    method: "delete"
  })
}

// 获取字典选择框列表
export function getSysDictOptionSelectApi() {
  return request<ApiResponseData<DictTypeVO[]>>({
    url: "/system/dict/type/optionselect",
    method: "get"
  })
}
