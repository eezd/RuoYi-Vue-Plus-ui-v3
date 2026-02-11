import type { AxiosPromise } from "axios"
import type { CaptchaInfo, LoginData, LoginInfo, LoginRequestData, TenantInfo } from "./type"
import { request } from "@/http/axios"

const clientId = import.meta.env.VITE_APP_CLIENT_ID

/** 获取登录验证码 */
export function getCaptchaApi() {
  return request<ApiResponseData<CaptchaInfo>>({
    url: "/auth/code",
    headers: {
      isToken: false
    },
    method: "get",
    timeout: 20000
  })
}

/** 登录并返回 Token */
export function loginApi(data: LoginRequestData) {
  const params = {
    ...data,
    clientId: data.clientId || clientId,
    grantType: data.grantType || "password"
  }
  return request <ApiResponseData<LoginInfo>>({
    url: "/auth/login",
    headers: {
      isToken: false,
      isEncrypt: false,
      repeatSubmit: false
    },
    method: "post",
    data: params
  })
}

/**
 * 第三方登录
 */
export function callback(data: LoginData): AxiosPromise<any> {
  const LoginData = {
    ...data,
    clientId,
    grantType: "social"
  }
  return request({
    url: "/auth/social/callback",
    method: "post",
    data: LoginData
  })
}

// 注册方法
export function register(data: any) {
  const params = {
    ...data,
    clientId,
    grantType: "password"
  }
  return request({
    url: "/auth/register",
    headers: {
      isToken: false,
      isEncrypt: true,
      repeatSubmit: false
    },
    method: "post",
    data: params
  })
}

/**
 * 注销
 */
export function logout() {
  if (import.meta.env.VITE_APP_SSE === "true") {
    request({
      url: "/resource/sse/close",
      method: "get"
    })
  }
  return request({
    url: "/auth/logout",
    method: "post"
  })
}

/** 获取租户列表 */
export function getTenantListApi(isToken: boolean) {
  return request<ApiResponseData<TenantInfo>>({
    url: "/auth/tenant/list",
    headers: {
      isToken
    },
    method: "get"
  })
}
