import type { OssQuery, OssVO } from "./types.ts"
import { normalizePageResult } from "@@/apis/utils"
import { request } from "@/http/axios.ts"

// 查询OSS对象存储列表
export async function getSysOssListApi(query: OssQuery) {
  const response = await request<ApiResponseData<PageResult<OssVO>>>({
    url: "/resource/oss/list",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
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
  return request<ApiResponseData<null>>({
    url: `/resource/oss/${ossId}`,
    method: "delete"
  })
}
