import type { DbTableForm, DbTableQuery, DbTableVO, GenTableVO, TableQuery, TableVO } from "./types.ts"
import { request } from "@/http/axios.ts"

// 查询参数列表
export function getSysGenListApi(query: TableQuery) {
  return request<ApiResponsePageData<TableVO[]>>({
    url: "/tool/gen/list",
    method: "get",
    params: query
  })
}

export function getSysGenDbListApi(query: DbTableQuery) {
  return request<ApiResponsePageData<DbTableVO[]>>({
    url: "/tool/gen/db/list",
    method: "get",
    params: query
  })
}

// 查询参数详细
export function getSysGenApi(tableId: string | number) {
  return request<ApiResponseData<GenTableVO>>({
    url: `/tool/gen/${tableId}`,
    method: "get"
  })
}

// 修改参数配置
export function updateSysGenTableApi(data: DbTableForm) {
  return request<ApiResponseData<null>>({
    url: "/tool/gen",
    method: "put",
    data
  })
}

// 修改参数配置
export function updateSysGenByKeyApi(data: DbTableForm) {
  return request<ApiResponseData<GenTableVO>>({
    url: "/tool/gen/updateByKey",
    method: "put",
    data
  })
}

// 导入表
export function importSysGenTable(data: { tables: string, dataName: string }) {
  return request<ApiResponseData<GenTableVO>>({
    url: "/tool/gen/importTable",
    method: "post",
    params: data
  })
}

// 预览生成代码
export function previewSysGenTable(tableId: string | number) {
  return request({
    url: `/tool/gen/preview/${tableId}`,
    method: "get"
  })
}

// 删除表数据
export function delSysGenTable(tableId: string | number | Array<string | number>) {
  return request({
    url: `/tool/gen/${tableId}`,
    method: "delete"
  })
}

// 生成代码（自定义路径）
export function genSysGenCode(tableId: string | number) {
  return request({
    url: `/tool/gen/genCode/${tableId}`,
    method: "get"
  })
}

// 同步数据库
export function synchSysGenDb(tableId: string | number) {
  return request({
    url: `/tool/gen/synchDb/${tableId}`,
    method: "get"
  })
}

// 获取数据源名称
export function getSysGenDataNames() {
  return request({
    url: "/tool/gen/getDataNames",
    method: "get"
  })
}
