import type { DbTableForm, DbTableQuery, DbTableVO, GenTableDetailPayload, TableQuery, TableVO } from "./types.ts"
import { normalizePageResult } from "@@/apis/utils"
import { request } from "@/http/axios.ts"

// 查询代码生成业务列表
export async function getSysGenListApi(query: TableQuery) {
  const response = await request<ApiResponseData<PageResult<TableVO>>>({
    url: "/tool/gen/list",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

// 查询数据库表列表
export async function getSysGenDbListApi(query: DbTableQuery) {
  const response = await request<ApiResponseData<PageResult<DbTableVO>>>({
    url: "/tool/gen/db/list",
    method: "get",
    params: query
  })
  return normalizePageResult(response)
}

// 查询代码生成业务详细
export function getSysGenApi(tableId: string | number) {
  return request<ApiResponseData<GenTableDetailPayload>>({
    url: `/tool/gen/${tableId}`,
    method: "get"
  })
}

// 修改代码生成业务配置
export function updateSysGenTableApi(data: DbTableForm) {
  return request<ApiResponseData<null>>({
    url: "/tool/gen",
    method: "put",
    data
  })
}

// 导入表结构
export function importSysGenTable(data: { tables: string, dataName: string }) {
  return request<ApiResponseData<null>>({
    url: "/tool/gen/importTable",
    method: "post",
    params: data
  })
}

// 预览生成代码
export function previewSysGenTable(tableId: string | number) {
  return request<ApiResponseData<Record<string, string>>>({
    url: `/tool/gen/preview/${tableId}`,
    method: "get"
  })
}

// 删除代码生成业务
export function delSysGenTable(tableId: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/tool/gen/${tableId}`,
    method: "delete"
  })
}

// 同步数据库
export function synchSysGenDb(tableId: string | number) {
  return request<ApiResponseData<null>>({
    url: `/tool/gen/synchDb/${tableId}`,
    method: "get"
  })
}

// 获取数据源名称
export function getSysGenDataNames() {
  return request<ApiResponseData<string[]>>({
    url: "/tool/gen/getDataNames",
    method: "get"
  })
}
