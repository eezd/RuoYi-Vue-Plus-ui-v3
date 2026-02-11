import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
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

// 是否显示重新登录
export const isRelogin = { show: false }

// ================= 常量定义 =================
const HEADER_ENCRYPT_KEY = "encrypt-key"

// ================= 辅助函数 =================
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

/** 检查是否为重复提交 */
function checkRepeatSubmit(config: AxiosRequestConfig) {
  const requestObj = {
    url: config.url,
    data: typeof config.data === "object" ? JSON.stringify(config.data) : config.data,
    time: new Date().getTime()
  }

  const sessionObj = cache.session.getJSON("sessionObj")

  if (!sessionObj) {
    cache.session.setJSON("sessionObj", requestObj)
    return true
  }

  const s_url = sessionObj.url
  const s_data = sessionObj.data
  const s_time = sessionObj.time
  const interval = 500 // 间隔时间(ms)

  if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
    const message = "数据正在处理，请勿重复提交"
    console.warn(`[${s_url}]: ${message}`)
    return message // 返回错误信息
  }

  cache.session.setJSON("sessionObj", requestObj)
  return true
}

/** 处理请求加密 */
function handleEncryption(config: AxiosRequestConfig) {
  const aesKey = generateAesKey()
  config.headers![HEADER_ENCRYPT_KEY] = encrypt(encryptBase64(aesKey))
  config.data = typeof config.data === "object"
    ? encryptWithAes(JSON.stringify(config.data), aesKey)
    : encryptWithAes(config.data, aesKey)
}

// ================= Axios 实例配置 =================

// 设置全局默认值
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

  // --- 请求拦截器 ---
  instance.interceptors.request.use(
    (config) => {
      config.headers["Content-Language"] = getLanguage()
      const { isToken, repeatSubmit, isEncrypt } = config.headers || {}

      const token = getToken()
      if (token && isToken !== false) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // GET 请求参数序列化
      if (config.method === "get" && config.params) {
        let url = `${config.url}?${tansParams(config.params)}`
        // 去掉最后一个字符（通常是多余的 & 或 ?）
        url = url.slice(0, -1)
        config.params = {}
        config.url = url
      }

      // 防重复提交处理 (POST/PUT)
      if (repeatSubmit !== false && (config.method === "post" || config.method === "put")) {
        const result = checkRepeatSubmit(config)
        if (typeof result === "string") {
          return Promise.reject(new Error(result))
        }
      }

      // 加密处理
      if (import.meta.env.VITE_APP_ENCRYPT === "true" && isEncrypt === "true" && (config.method === "post" || config.method === "put")) {
        handleEncryption(config)
      }

      // FormData 特殊处理
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"]
      }

      return config
    },
    error => Promise.reject(error)
  )

  // --- 响应拦截器 ---
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const apiData = response.data
      // 二进制数据直接返回
      const responseType = response.request?.responseType
      if (responseType === "blob" || responseType === "arraybuffer") return apiData

      // 校验业务 Code
      const code = apiData.code
      if (code === undefined) {
        ElMessage.error("非本系统的接口")
        return Promise.reject(new Error("非本系统的接口"))
      }

      // 业务逻辑判断
      if (code === 200) {
        return apiData
      } else if (code === 401) {
        logout()
        return Promise.reject(new Error("无效的会话，或者会话已过期，请重新登录。"))
      } else {
        ElMessage.error(apiData.msg || "Error")
        return Promise.reject(new Error("Error"))
      }
    },
    (error) => {
      let { message } = error
      const status = get(error, "response.status")
      const dataMsg = get(error, "response.data.msg")

      if (status === 401) {
        message = dataMsg || errorCode[401]
        logout()
      } else if (status in errorCode) {
        message = dataMsg || errorCode[status]
      } else {
        if (message === "Network Error") {
          message = "后端接口连接异常"
        } else if (message.includes("timeout")) {
          message = "系统接口请求超时"
        } else if (message.includes("Request failed with status code")) {
          message = `系统接口${message.substr(message.length - 3)}异常`
        }
      }

      ElMessage.error(message)
      error.message = message
      return Promise.reject(error)
    }
  )

  return instance
}

const instance = createInstance()

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return instance.request(config)
}
