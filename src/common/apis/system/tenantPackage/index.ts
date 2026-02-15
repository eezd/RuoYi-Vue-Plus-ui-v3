import type { TenantPkgForm, TenantPkgQuery, TenantPkgVO } from "./types"
import { request } from "@/http/axios.ts"

// 查询租户套餐列表
export function getSysTenantPackageListApi(query?: TenantPkgQuery) {
  return request<ApiResponsePageData<TenantPkgVO[]>>({
    url: "/system/tenant/package/list",
    method: "get",
    params: query
  })
}

// 查询租户套餐下拉选列表
export function getSysTenantPackageSelectListApi() {
  return request<ApiResponsePageData<TenantPkgVO[]>>({
    url: "/system/tenant/package/selectList",
    method: "get"
  })
}

// 查询租户套餐详细
export function getSysTenantPackageApi(packageId: string | number) {
  return request<ApiResponsePageData<TenantPkgVO>>({
    url: `/system/tenant/package/${packageId}`,
    method: "get"
  })
}

// 新增租户套餐
export function addSysTenantPackageApi(data: TenantPkgForm) {
  return request({
    url: "/system/tenant/package",
    method: "post",
    data
  })
}

// 修改租户套餐
export function updateSysTenantPackageApi(data: TenantPkgForm) {
  return request({
    url: "/system/tenant/package",
    method: "put",
    data
  })
}

// 租户套餐状态修改
export function changeSysTenantPackageStatusApi(packageId: number | string, status: string) {
  const data = {
    packageId,
    status
  }
  return request({
    url: "/system/tenant/package/changeStatus",
    method: "put",
    data
  })
}

// 删除租户套餐
export function delSysTenantPackageApi(packageId: string | number | Array<string | number>) {
  return request({
    url: `/system/tenant/package/${packageId}`,
    method: "delete"
  })
}
