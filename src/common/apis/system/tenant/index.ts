import type { TenantForm, TenantQuery, TenantVO } from "./types"
import { request } from "@/http/axios.ts"

// 查询租户列表
export function getSysTenantListApi(query: TenantQuery) {
  return request<ApiResponsePageData<TenantVO[]>>({
    url: "/system/tenant/list",
    method: "get",
    params: query
  })
}

// 查询租户详细
export function getSysTenantApi(id: string | number) {
  return request<ApiResponseData<TenantVO>>({
    url: `/system/tenant/${id}`,
    method: "get"
  })
}

// 新增租户
export function addSysTenantApi(data: TenantForm) {
  return request<ApiResponseData<null>>({
    url: "/system/tenant",
    method: "post",
    headers: {
      isEncrypt: true,
      repeatSubmit: false
    },
    data
  })
}

// 修改租户
export function updateSysTenantApi(data: TenantForm) {
  return request({
    url: "/system/tenant",
    method: "put",
    data
  })
}

// 租户状态修改
export function changeSysTenantStatusApi(id: string | number, tenantId: string | number, status: string) {
  const data = {
    id,
    tenantId,
    status
  }
  return request({
    url: "/system/tenant/changeStatus",
    method: "put",
    data
  })
}

// 删除租户
export function delSysTenantApi(id: string | number | Array<string | number>) {
  return request({
    url: `/system/tenant/${id}`,
    method: "delete"
  })
}

// 动态切换租户
export function dynamicSysTenantApi(tenantId: string | number) {
  return request({
    url: `/system/tenant/dynamic/${tenantId}`,
    method: "get"
  })
}

// 清除动态租户
export function dynamicClearSysTenantApi() {
  return request({
    url: "/system/tenant/dynamic/clear",
    method: "get"
  })
}

// 同步租户套餐
export function syncSysTenantPackageApi(tenantId: string | number, packageId: string | number) {
  const data = {
    tenantId,
    packageId
  }
  return request({
    url: "/system/tenant/syncTenantPackage",
    method: "get",
    params: data
  })
}

// 同步租户字典
export function syncSysTenantDictApi() {
  return request({
    url: "/system/tenant/syncTenantDict",
    method: "get"
  })
}

// 同步租户字典
export function syncSysTenantConfigApi() {
  return request({
    url: "/system/tenant/syncTenantConfig",
    method: "get"
  })
}
