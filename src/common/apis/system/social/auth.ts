import { request } from "@/http/axios.ts"

// 获取跳转URL
export function authRouterUrlApi(source: string, tenantId: string) {
  return request({
    url: `/auth/binding/${source}`,
    method: "get",
    params: {
      tenantId,
      domain: window.location.host
    }
  })
}

// 解绑账号
export function authUnlockApi(authId: string) {
  return request({
    url: `/auth/unlock/${authId}`,
    method: "delete"
  })
}
// 获取授权列表
export function getAuthListApi() {
  return request({
    url: "/system/social/list",
    method: "get"
  })
}
