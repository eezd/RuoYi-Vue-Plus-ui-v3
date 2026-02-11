import type { OssQuery, OssVO } from "./types.ts"
import { request } from "@/http/axios.ts"

// 查询OSS对象存储列表
export function getSysOssListApi(query: OssQuery) {
  return request<ApiResponsePageData<OssVO[]>>({
    url: "/resource/oss/list",
    method: "get",
    params: query
  })
}

// 查询OSS对象基于id串
export function getSysOssByIdsApi(ossId: string | number) {
  return request<ApiResponseData<OssVO[]>>({
    url: `/resource/oss/listByIds/${ossId}`,
    method: "get"
  })
}

// 删除OSS对象存储
export function delSysOssApi(ossId: string | number | Array<string | number>) {
  return request({
    url: `/resource/oss/${ossId}`,
    method: "delete"
  })
}
