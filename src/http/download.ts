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

/**
 * 通用下载方法
 * @param url 下载地址
 * @param params 请求参数
 * @param fileName 文件名
 * @param method 请求方法，默认POST
 */
export async function download(url: string, params: Record<string, any>, fileName: string, method: "get" | "post" = "post"): Promise<void> {
  // 显示加载动画
  downloadLoadingInstance = ElLoading.service({
    text: "正在下载数据，请稍候",
    background: "rgba(0, 0, 0, 0.7)"
  })

  try {
    // 根据请求方法构建请求配置
    const config: any = {
      url,
      method,
      responseType: "blob",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }

    // POST请求使用data，GET请求使用params
    if (method === "post") {
      config.data = tansParams(params)
    } else {
      config.params = params
    }

    // 发起请求
    const response = await request<Blob>(config)

    // 验证响应是否为有效的blob
    const isValidBlob = blobValidate(response)

    if (isValidBlob) {
      // 正常下载文件
      const blob = new Blob([response])
      FileSaver.saveAs(blob, fileName)
    } else {
      // 处理错误响应（服务器返回的JSON错误信息）
      const blob = new Blob([response])
      const resText = await blob.text()

      try {
        const rspObj = JSON.parse(resText)
        const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode.default
        ElMessage.error(errMsg)
      } catch {
        ElMessage.error("下载文件失败，响应格式异常")
      }
    }
  } catch (error: any) {
    console.error("下载文件错误:", error)
    const errMsg = error?.message || "下载文件出现错误，请联系管理员！"
    ElMessage.error(errMsg)
  } finally {
    // 确保关闭加载动画
    downloadLoadingInstance?.close()
    downloadLoadingInstance = null
  }
}

/**
 * 导出按钮操作示例
 */
export function handleExport(queryParams: Record<string, any>) {
  const fileName = `dict_${new Date().getTime()}.xlsx`
  download("/system/dict/type/export", queryParams, fileName)
}

// ============= 组件中使用示例 =============

/**
 * Vue3 Setup 组件使用示例
 */
/*
<script setup lang="ts">
import { reactive } from 'vue';
import { download } from '@/utils/download';

// 查询参数
const queryParams = reactive({
  dictName: '',
  dictType: '',
  status: ''
});

// 导出按钮操作
const handleExport = () => {
  download(
    '/system/dict/type/export',
    { ...queryParams },
    `dict_${new Date().getTime()}.xlsx`
  );
};

// 或者使用GET方法导出
const handleExportGet = () => {
  download(
    '/system/dict/type/export',
    { ...queryParams },
    `dict_${new Date().getTime()}.xlsx`,
    'get'
  );
};
</script>
*/

/**
 * 下载 OSS 文件
 */
export const downloadOss = useFullscreenLoading(
  async (ossId: string | number) => {
    const url = `${baseURL}/resource/oss/download/${ossId}`
    try {
      const res = await axios({
        method: "get",
        url,
        responseType: "blob",
        headers: globalHeaders()
      })
      const isBlob = await blobValidate(res.data)
      if (isBlob) {
        const blob = new Blob([res.data], { type: "application/octet-stream" })
        FileSaver.saveAs(blob, decodeURIComponent(res.headers["download-filename"] as string))
      } else {
        printErrMsg(res.data)
      }
    } catch (r) {
      console.error(r)
      ElMessage.error("下载文件出现错误，请联系管理员！")
    }
  },
  {
    text: "正在下载数据，请稍候",
    background: "rgba(0, 0, 0, 0.7)"
  }
)

export const downloadZip = useFullscreenLoading(
  async (url: string, name: string) => {
    // 拼接完整路径
    const fullUrl = baseURL + url
    try {
      const res = await axios({
        method: "get",
        url: fullUrl,
        responseType: "blob",
        headers: globalHeaders()
      })
      const isBlob = blobValidate(res.data)
      if (isBlob) {
        const blob = new Blob([res.data], { type: "application/zip" })
        FileSaver.saveAs(blob, name)
      } else {
        printErrMsg(res.data)
      }
    } catch (r) {
      console.error(r)
      ElMessage.error("下载文件出现错误，请联系管理员！")
    }
  },
  {
    text: "正在下载数据，请稍候",
    background: "rgba(0, 0, 0, 0.7)"
  }
)

async function printErrMsg(data: any) {
  const resText = await data.text()
  const rspObj = JSON.parse(resText)
  const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode.default
  ElMessage.error(errMsg)
}
