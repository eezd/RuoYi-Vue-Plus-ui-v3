import type { AxiosInstance, AxiosRequestConfig } from "axios"
import { getToken } from "@@/utils/cache/cookies"
import axios from "axios"
import { get, merge } from "lodash-es"
import { getLanguage } from "@/common/lang"
import { tansParams } from "@/common/utils"
import cache from "@/common/utils/cache"
import { encryptBase64, encryptWithAes, generateAesKey } from "@/common/utils/crypto"
import { encrypt } from "@/common/utils/jsencrypt"
import { useUserStore } from "@/pinia/stores/user"

const encryptHeader = "encrypt-key"

/** 退出登录并强制刷新页面（会重定向到登录页） */
function logout() {
  useUserStore().logout()
  location.reload()
}

axios.defaults.headers["Content-Type"] = "application/json;charset=utf-8"
axios.defaults.headers.clientid = import.meta.env.VITE_APP_CLIENT_ID

/** 创建请求实例 */
function createInstance() {
  // 创建一个 axios 实例命名为 instance
  const instance = axios.create()
  // 请求拦截器
  instance.interceptors.request.use(
    // 发送之前
    (config) => {
      // 对应国际化资源文件后缀
      config.headers["Content-Language"] = getLanguage()

      const isToken = config.headers?.isToken === false
      // 是否需要防止数据重复提交
      const isRepeatSubmit = config.headers?.repeatSubmit === false
      // 是否需要加密
      const isEncrypt = config.headers?.isEncrypt === "true"

      if (getToken() && !isToken) {
        config.headers.Authorization = `Bearer ${getToken()}` // 让每个请求携带自定义token 请根据实际情况自行修改
      }

      // get请求映射params参数
      if (config.method === "get" && config.params) {
        let url = `${config.url}?${tansParams(config.params)}`
        url = url.slice(0, -1)
        config.params = {}
        config.url = url
      }

      if (!isRepeatSubmit && (config.method === "post" || config.method === "put")) {
        const requestObj = {
          url: config.url,
          data: typeof config.data === "object" ? JSON.stringify(config.data) : config.data,
          time: new Date().getTime()
        }
        const sessionObj = cache.session.getJSON("sessionObj")
        if (sessionObj === undefined || sessionObj === null || sessionObj === "") {
          cache.session.setJSON("sessionObj", requestObj)
        } else {
          const s_url = sessionObj.url // 请求地址
          const s_data = sessionObj.data // 请求数据
          const s_time = sessionObj.time // 请求时间
          const interval = 500 // 间隔时间(ms)，小于此时间视为重复提交
          if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
            const message = "数据正在处理，请勿重复提交"
            console.warn(`[${s_url}]: ${message}`)
            return Promise.reject(new Error(message))
          } else {
            cache.session.setJSON("sessionObj", requestObj)
          }
        }
      }

      if (import.meta.env.VITE_APP_ENCRYPT === "true") {
      // 当开启参数加密
        if (isEncrypt && (config.method === "post" || config.method === "put")) {
        // 生成一个 AES 密钥
          const aesKey = generateAesKey()
          config.headers[encryptHeader] = encrypt(encryptBase64(aesKey))
          config.data = typeof config.data === "object" ? encryptWithAes(JSON.stringify(config.data), aesKey) : encryptWithAes(config.data, aesKey)
        }
      }

      // FormData数据去请求头Content-Type
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"]
      }
      return config
    },
    // 发送失败
    error => Promise.reject(error)
  )
  // 响应拦截器（可根据具体业务作出相应的调整）
  instance.interceptors.response.use(
    (response) => {
      // apiData 是 api 返回的数据
      const apiData = response.data
      // 二进制数据则直接返回
      const responseType = response.request?.responseType
      if (responseType === "blob" || responseType === "arraybuffer") return apiData
      // 这个 code 是和后端约定的业务 code
      const code = apiData.code
      // 如果没有 code, 代表这不是项目后端开发的 api
      if (code === undefined) {
        ElMessage.error("非本系统的接口")
        return Promise.reject(new Error("非本系统的接口"))
      }
      switch (code) {
        case 200:
          // 本系统采用 code === 200 来表示没有业务错误
          return apiData
        case 401:
          // Token 过期时
          return logout()
        default:
          // 不是正确的 code
          ElMessage.error(apiData.msg || "Error")
          return Promise.reject(new Error("Error"))
      }
    },
    (error) => {
      // status 是 HTTP 状态码
      const status = get(error, "response.status")
      const message = get(error, "response.data.msg")
      switch (status) {
        case 400:
          error.message = "请求错误"
          break
        case 401:
          // Token 过期时
          error.message = message || "未授权"
          logout()
          break
        case 403:
          error.message = message || "拒绝访问"
          break
        case 404:
          error.message = "请求地址出错"
          break
        case 408:
          error.message = "请求超时"
          break
        case 500:
          error.message = "服务器内部错误"
          break
        case 501:
          error.message = "服务未实现"
          break
        case 502:
          error.message = "网关错误"
          break
        case 503:
          error.message = "服务不可用"
          break
        case 504:
          error.message = "网关超时"
          break
        case 505:
          error.message = "HTTP 版本不受支持"
          break
      }
      ElMessage.error(error.message)
      return Promise.reject(error)
    }
  )
  return instance
}

/** 创建请求方法 */
function createRequest(instance: AxiosInstance) {
  return <T>(config: AxiosRequestConfig): Promise<T> => {
    // const token = getToken()
    // 默认配置
    const defaultConfig: AxiosRequestConfig = {
      // 接口地址
      baseURL: import.meta.env.VITE_BASE_URL,
      // 请求头
      headers: {
        // 携带 Token
        // "Authorization": token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json"
      },
      // 请求体
      data: {},
      // 请求超时
      timeout: 5000,
      // 跨域请求时是否携带 Cookies
      withCredentials: false
    }
    // 将默认配置 defaultConfig 和传入的自定义配置 config 进行合并成为 mergeConfig
    const mergeConfig = merge(defaultConfig, config)
    return instance(mergeConfig)
  }
}

/** 用于请求的实例 */
const instance = createInstance()

/** 用于请求的方法 */
export const request = createRequest(instance)
