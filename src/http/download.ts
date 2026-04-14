import type { AxiosRequestConfig, AxiosResponse } from "axios"
import type { LoadingInstance } from "element-plus/es/components/loading/src/loading"
import { blobValidate, tansParams } from "@@/utils"
import errorCode from "@@/utils/errorCode"
import axios from "axios"
import { ElLoading, ElMessage } from "element-plus"
import FileSaver from "file-saver"
import { useFullscreenLoading } from "@/common/composables/useFullscreenLoading"
import { globalHeaders, request } from "@/http/axios"

let downloadLoadingInstance: LoadingInstance | null = null
const baseURL = import.meta.env.VITE_BASE_URL

type DownloadMethod = "get" | "post"

interface BlobErrorResponse {
  code?: number | string
  msg?: string
}

export async function download(url: string, params: Record<string, any>, fileName: string, method: DownloadMethod = "post"): Promise<void> {
  downloadLoadingInstance = ElLoading.service({
    text: "正在下载数据，请稍候",
    background: "rgba(0, 0, 0, 0.7)"
  })

  try {
    const config: AxiosRequestConfig = {
      url,
      method,
      responseType: "blob",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }

    if (method === "post") {
      config.data = tansParams(params)
    } else {
      config.params = params
    }

    const response = await request<Blob>(config)
    const isValidBlob = await blobValidate(response)

    if (isValidBlob) {
      FileSaver.saveAs(new Blob([response]), fileName)
      return
    }

    await showBlobError(response)
  } catch (error) {
    console.error("下载文件错误:", error)
    const errMsg = error instanceof Error ? error.message : "下载文件出现错误，请联系管理员！"
    ElMessage.error(errMsg)
  } finally {
    downloadLoadingInstance?.close()
    downloadLoadingInstance = null
  }
}

export function handleExport(queryParams: Record<string, any>) {
  const fileName = `dict_${Date.now()}.xlsx`
  download("/system/dict/type/export", queryParams, fileName)
}

export const downloadOss = useFullscreenLoading(
  async (ossId: string | number) => {
    const url = `${baseURL}/resource/oss/download/${ossId}`
    try {
      const res = await axios<Blob>({
        method: "get",
        url,
        responseType: "blob",
        headers: globalHeaders()
      })
      const isBlob = await blobValidate(res.data)
      if (isBlob) {
        const blob = new Blob([res.data], { type: "application/octet-stream" })
        FileSaver.saveAs(blob, resolveDownloadFilename(res, String(ossId)))
      } else {
        await showBlobError(res.data)
      }
    } catch (error) {
      console.error(error)
      const errMsg = error instanceof Error ? error.message : "下载文件出现错误，请联系管理员！"
      ElMessage.error(errMsg)
    }
  },
  {
    text: "正在下载数据，请稍候",
    background: "rgba(0, 0, 0, 0.7)"
  }
)

export const downloadZip = useFullscreenLoading(
  async (url: string, name: string) => {
    const fullUrl = baseURL + url
    try {
      const res = await axios<Blob>({
        method: "get",
        url: fullUrl,
        responseType: "blob",
        headers: globalHeaders()
      })
      const isBlob = await blobValidate(res.data)
      if (isBlob) {
        const blob = new Blob([res.data], { type: "application/zip" })
        FileSaver.saveAs(blob, name)
      } else {
        await showBlobError(res.data)
      }
    } catch (error) {
      console.error(error)
      const errMsg = error instanceof Error ? error.message : "下载文件出现错误，请联系管理员！"
      ElMessage.error(errMsg)
    }
  },
  {
    text: "正在下载数据，请稍候",
    background: "rgba(0, 0, 0, 0.7)"
  }
)

function resolveDownloadFilename(response: AxiosResponse<Blob>, fallbackName: string) {
  const headerFilename = response.headers["download-filename"]
  if (!headerFilename) return fallbackName
  return decodeURIComponent(String(headerFilename))
}

async function showBlobError(data: Blob) {
  ElMessage.error(await getBlobErrorMessage(data))
}

async function getBlobErrorMessage(data: Blob) {
  try {
    const resText = await data.text()
    if (!resText) return "下载文件失败，响应为空"

    const rspObj = JSON.parse(resText) as BlobErrorResponse
    return errorCode[rspObj.code as string] || rspObj.msg || errorCode.default
  } catch {
    return "下载文件失败，响应格式异常"
  }
}
