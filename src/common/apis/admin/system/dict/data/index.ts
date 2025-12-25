import type { DictDataForm, DictDataQuery, DictDataVO } from "./types"
import { request } from "@/http/axios"

// 根据字典类型查询字典数据信息
export function getSysDictDataApi(dictType: string) {
  return request<ApiResponseData<DictDataVO[]>>({
    url: `/system/dict/data/type/${dictType}`,
    method: "get"
  })
}

// 查询字典数据列表
export function getSysDictDataListApi(query: DictDataQuery) {
  return request<ApiResponsePageData<DictDataVO[]>>({
    url: "/system/dict/data/list",
    method: "get",
    params: query
  })
}

// 查询字典数据详细
export function getSysDictDataCodeApi(dictCode: string | number) {
  return request<ApiResponseData<DictDataVO>>({
    url: `/system/dict/data/${dictCode}`,
    method: "get"
  })
}

// 新增字典数据
export function addSysDictDataApi(data: DictDataForm) {
  return request({
    url: "/system/dict/data",
    method: "post",
    data
  })
}

// 修改字典数据
export function updateSysDictDataApi(data: DictDataForm) {
  return request({
    url: "/system/dict/data",
    method: "put",
    data
  })
}

// 删除字典数据
export function delSysDictDataApi(dictCode: string | number | Array<string | number>) {
  return request({
    url: `/system/dict/data/${dictCode}`,
    method: "delete"
  })
}
