import type { CaptchaInfo, LoginInfo, LoginRequestData } from "./type"
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
