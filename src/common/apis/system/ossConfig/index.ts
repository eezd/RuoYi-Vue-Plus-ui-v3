import type { OssConfigForm, OssConfigQuery, OssConfigVO } from "./types.ts"
import { request } from "@/http/axios.ts"

// 查询对象存储配置列表
export function getSysOssConfigListApi(query: OssConfigQuery) {
  return request<ApiResponsePageData<OssConfigVO[]>>({
    url: "/resource/oss/config/list",
    method: "get",
    params: query
  })
}

// 查询对象存储配置详细
export function getSysOssConfigApi(ossConfigId: string | number) {
  return request<ApiResponseData<OssConfigVO>>({
    url: `/resource/oss/config/${ossConfigId}`,
    method: "get"
  })
}

// 新增对象存储配置
export function addSysOssConfigApi(data: OssConfigForm) {
  return request({
    url: "/resource/oss/config",
    method: "post",
    data
  })
}

// 修改对象存储配置
export function updateSysOssConfigApi(data: OssConfigForm) {
  return request({
    url: "/resource/oss/config",
    method: "put",
    data
  })
}

// 删除对象存储配置
export function delSysOssConfigApi(ossConfigId: string | number | Array<string | number>) {
  return request({
    url: `/resource/oss/config/${ossConfigId}`,
    method: "delete"
  })
}

// 对象存储状态修改
export function changeSysOssConfigStatusApi(ossConfigId: string | number, status: string, configKey: string) {
  const data = {
    ossConfigId,
    status,
    configKey
  }
  return request({
    url: "/resource/oss/config/changeStatus",
    method: "put",
    data
  })
}
