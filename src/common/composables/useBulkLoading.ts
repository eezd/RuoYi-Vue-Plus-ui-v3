import type { LoadingOptions } from "element-plus"
import { ElLoading } from "element-plus"

/**
 * @name 批量/并发加载 Composable
 * @description 适用于类似文件上传这种并发操作，通过计数器管理 Loading 状态，避免 Loading 闪烁
 */
export function useBulkLoading(options: LoadingOptions = {}) {
  let loadingInstance: ReturnType<typeof ElLoading.service> | null = null
  let count = 0

  const defaultOptions = {
    lock: true,
    text: "处理中...",
    background: "rgba(0, 0, 0, 0.7)"
  }

  const start = () => {
    if (count === 0) {
      loadingInstance = ElLoading.service({ ...defaultOptions, ...options })
    }
    count++
  }

  const close = () => {
    if (count > 0) {
      count--
    }
    if (count === 0 && loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }

  // 强制重置（用于组件销毁或异常情况）
  const reset = () => {
    count = 0
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }

  return { start, close, reset }
}
