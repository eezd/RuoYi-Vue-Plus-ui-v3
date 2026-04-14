import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { getToken } from "@@/utils/cache/cookies"
import axios from "axios"
import { get } from "lodash-es"
import { tansParams } from "@/common/utils"
import cache from "@/common/utils/cache"
import { getLanguage } from "@/common/utils/cache/local-storage"
import { encryptBase64, encryptWithAes, generateAesKey } from "@/common/utils/crypto"
import errorCode from "@/common/utils/errorCode"
import { encrypt } from "@/common/utils/jsencrypt"
import { useUserStore } from "@/pinia/stores/user"

export const isRelogin = { show: false }

const HEADER_ENCRYPT_KEY = "encrypt-key"
const REPEAT_SUBMIT_INTERVAL = 500

interface RequestControlHeaders {
  isToken?: boolean
  repeatSubmit?: boolean
  isEncrypt?: boolean | string
}

type RequestConfig = AxiosRequestConfig & {
  headers?: AxiosRequestConfig["headers"] & RequestControlHeaders
}

interface ApiErrorResponse {
  code?: number
  msg?: string
}

function logout() {
  useUserStore().logout()
  location.reload()
}

export function globalHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    clientid: import.meta.env.VITE_APP_CLIENT_ID
  }
}

function checkRepeatSubmit(config: AxiosRequestConfig) {
  const requestObj = {
    url: config.url,
    data: typeof config.data === "object" ? JSON.stringify(config.data) : config.data,
    time: Date.now()
  }

  const sessionObj = cache.session.getJSON("sessionObj")

  if (!sessionObj) {
    cache.session.setJSON("sessionObj", requestObj)
    return true
  }

  const s_url = sessionObj.url
  const s_data = sessionObj.data
  const s_time = sessionObj.time

  if (s_data === requestObj.data && requestObj.time - s_time < REPEAT_SUBMIT_INTERVAL && s_url === requestObj.url) {
    const message = "数据正在处理，请勿重复提交"
    console.warn(`[${s_url}]: ${message}`)
    return message
  }

  cache.session.setJSON("sessionObj", requestObj)
  return true
}

function handleEncryption(config: InternalAxiosRequestConfig) {
  const aesKey = generateAesKey()
  const encryptedKey = encrypt(encryptBase64(aesKey))

  if (!encryptedKey) {
    throw new Error("Encrypt request key failed")
  }

  config.headers[HEADER_ENCRYPT_KEY] = encryptedKey
  config.data = typeof config.data === "object"
    ? encryptWithAes(JSON.stringify(config.data), aesKey)
    : encryptWithAes(String(config.data ?? ""), aesKey)
}

function normalizeMethod(method?: string) {
  return method?.toLowerCase()
}

function appendParamsToUrl(url = "", params: unknown) {
  const queryString = tansParams(params).replace(/&$/, "")
  if (!queryString) return url

  const separator = url.includes("?")
    ? url.endsWith("?") || url.endsWith("&") ? "" : "&"
    : "?"

  return `${url}${separator}${queryString}`
}

function removeRequestControlHeaders(headers: InternalAxiosRequestConfig["headers"] & RequestControlHeaders) {
  delete headers.isToken
  delete headers.repeatSubmit
  delete headers.isEncrypt
}

function shouldEncryptRequest(isEncrypt: RequestControlHeaders["isEncrypt"]) {
  return isEncrypt === true || isEncrypt === "true"
}

function getApiErrorMessage(apiData: ApiErrorResponse) {
  return apiData.msg || errorCode[apiData.code as number] || errorCode.default
}

function resolveAxiosErrorMessage(error: AxiosError<ApiErrorResponse>) {
  const status = get(error, "response.status") as number | undefined
  const dataMsg = get(error, "response.data.msg") as string | undefined
  const rawMessage = error.message || ""

  if (status === 401) {
    return dataMsg || errorCode[401]
  }

  if (status && status in errorCode) {
    return dataMsg || errorCode[status]
  }

  if (rawMessage === "Network Error") {
    return "后端接口连接异常"
  }
  if (rawMessage.includes("timeout")) {
    return "系统接口请求超时"
  }
  if (rawMessage.includes("Request failed with status code")) {
    return `系统接口${rawMessage.slice(-3)}异常`
  }

  return rawMessage || errorCode.default
}

axios.defaults.headers["Content-Type"] = "application/json;charset=utf-8"
axios.defaults.headers.clientid = import.meta.env.VITE_APP_CLIENT_ID

function createInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json"
    },
    withCredentials: false
  })

  instance.interceptors.request.use(
    (config) => {
      const headers = config.headers as InternalAxiosRequestConfig["headers"] & RequestControlHeaders
      headers["Content-Language"] = getLanguage()

      const { isToken, repeatSubmit, isEncrypt } = headers
      const method = normalizeMethod(config.method)
      const token = getToken()

      if (token && isToken !== false) {
        headers.Authorization = `Bearer ${token}`
      }

      if (method === "get" && config.params) {
        config.url = appendParamsToUrl(config.url, config.params)
        config.params = {}
      }

      if (repeatSubmit !== false && (method === "post" || method === "put")) {
        const result = checkRepeatSubmit(config)
        if (typeof result === "string") {
          return Promise.reject(new Error(result))
        }
      }

      if (import.meta.env.VITE_APP_ENCRYPT === "true" && shouldEncryptRequest(isEncrypt) && (method === "post" || method === "put")) {
        handleEncryption(config)
      }

      if (config.data instanceof FormData) {
        delete headers["Content-Type"]
      }

      removeRequestControlHeaders(headers)
      return config
    },
    error => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const apiData = response.data
      const responseType = response.config.responseType || response.request?.responseType
      if (responseType === "blob" || responseType === "arraybuffer") return apiData

      const code = apiData?.code
      if (code === undefined) {
        const message = "非本系统的接口"
        ElMessage.error(message)
        return Promise.reject(new Error(message))
      }

      if (code === 200) {
        return apiData
      }

      if (code === 401) {
        const message = "无效的会话，或者会话已过期，请重新登录。"
        logout()
        return Promise.reject(new Error(message))
      }

      const message = getApiErrorMessage(apiData)
      ElMessage.error(message)
      return Promise.reject(new Error(message))
    },
    (error) => {
      const axiosError = error as AxiosError<ApiErrorResponse>
      const status = get(axiosError, "response.status")
      const message = resolveAxiosErrorMessage(axiosError)

      if (status === 401) {
        logout()
      }

      ElMessage.error(message)
      axiosError.message = message
      return Promise.reject(axiosError)
    }
  )

  return instance
}

const instance = createInstance()

export function request<T = any>(config: RequestConfig): Promise<T> {
  return instance.request(config)
}
