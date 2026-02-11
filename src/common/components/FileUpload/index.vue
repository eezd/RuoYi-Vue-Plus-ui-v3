<script setup lang="ts">
import type { UploadInstance, UploadProps, UploadUserFile } from "element-plus"
import { delSysOssApi, getSysOssByIdsApi } from "@@/apis/system/oss"
import { ElMessage } from "element-plus"
import { globalHeaders } from "@/http/axios"

/**
 * defineProps
 */
// #region defineProps
const props = defineProps({
  /** 文件数量上限，默认 5 个 */
  limit: { type: Number, default: 5 },
  /** 文件大小限制（MB），默认 5MB */
  fileSize: { type: Number, default: 5 },
  /** 允许的文件类型 */
  fileType: { type: Array as PropType<string[]>, default: () => ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "pdf"] },
  /** 是否显示上传提示信息，默认显示 */
  isShowTip: { type: Boolean, default: true },
  // 禁用组件（仅查看文件）
  disabled: { type: Boolean, default: false }
})
// #endregion

/**
 * defineModel
 */
// #region defineModel
const fileIds = defineModel<string>("fileIds", { default: "" })
const loading = defineModel<boolean>("loading", { default: false })
const loadingText = defineModel<string>("loadingText", { default: "" })
// #endregion

const uploadUrl = ref(`${import.meta.env.VITE_BASE_URL}/resource/oss/upload`)
const headers = ref(globalHeaders())
// 绑定的文件列表
const fileList = ref<UploadUserFile[]>([])
const fileUploadRef = useTemplateRef<UploadInstance>("fileUploadRef")

// 防止内部更新触发 watch 导致的闪烁
const isInnerUpdate = ref(false)

const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize))
const fileAccept = computed(() => props.fileType.map(type => `.${type}`).join(","))

watch(
  () => fileIds.value,
  async (val) => {
    // 如果是内部上传/删除引起的变化，不重新请求 API，防止闪烁
    if (isInnerUpdate.value) {
      isInnerUpdate.value = false
      return
    }

    const ids = (val ?? "").trim()
    if (!ids) {
      fileList.value = []
      return
    }

    // 只有外部传入新 ID 时才请求接口
    try {
      const res = await getSysOssByIdsApi(ids)
      const data = res?.data
      const list = Array.isArray(data) ? data : data ? [data] : []

      // 映射回 el-upload 需要的格式
      fileList.value = list.map((item: any) => ({
        name: item.originalName, // 显示的文件名
        url: item.url,
        ossId: item.ossId,
        uid: item.ossId || Date.now()
      })) as UploadUserFile[]
    } catch (e) {
      console.error("获取文件列表失败:", e)
    }
  },
  { immediate: true }
)

/**
 * 核心逻辑：从当前 fileList 提取 ossId 并更新 fileIds
 * 同时设置 isInnerUpdate = true 阻止 watch 再次请求
 */
function updateModelValue() {
  const ids = fileList.value
    .map((file: any) => file.ossId || (file.response?.data?.ossId))
    .filter(id => id) // 过滤掉无效 ID
    .join(",")

  if (fileIds.value !== ids) {
    isInnerUpdate.value = true // 标记为内部更新
    fileIds.value = ids
  }
}

/** 辅助函数：获取显示的文件名 */
function getFileName(name: string) {
  if (!name) return ""
  return name
}

/** 上传前校验 */
const handleBeforeUpload: UploadProps["beforeUpload"] = async (file) => {
  // 1. 格式校验
  const fileName = file.name
  const fileExtension = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()

  // 检查扩展名是否在允许列表中
  const isAllowed = props.fileType.some(type => type.toLowerCase() === fileExtension)

  if (!isAllowed) {
    ElMessage.error(`文件格式不正确, 请上传 ${props.fileType.join("/")} 格式的文件!`)
    return false
  }

  // 2. 大小校验
  if (props.fileSize && file.size / 1024 / 1024 > props.fileSize) {
    ElMessage.error(`上传文件大小不能超过 ${props.fileSize} MB!`)
    return false
  }

  loading.value = true
  loadingText.value = "正在上传文件..."
  return true
}

/** 上传成功 */
const handleUploadSuccess: UploadProps["onSuccess"] = (res, file, uploadFiles) => {
  loading.value = false

  if (res.code === 200) {
    // 关键：将后端返回的 ossId 挂载到 file 对象上
    const successFile = uploadFiles.find(f => f.uid === file.uid)
    if (successFile) {
      (successFile as any).ossId = res.data.ossId;
      (successFile as any).url = res.data.url
    }

    // 更新 fileList 并触发 v-model 更新
    fileList.value = uploadFiles
    updateModelValue()
    ElMessage.success("上传成功")
  } else {
    // 失败处理：从列表中移除该文件
    const index = fileList.value.findIndex(f => f.uid === file.uid)
    if (index !== -1) fileList.value.splice(index, 1)
    ElMessage.error(res.msg || "上传失败")
  }
}

/** 上传失败 */
const handleUploadError: UploadProps["onError"] = () => {
  loading.value = false
  ElMessage.error("上传发生错误")
}

/** 删除文件 (适配自定义列表的点击事件) */
async function handleDelete(index: number) {
  const file = fileList.value[index]
  const ossId = (file as any).ossId

  // 如果没有 ossId (虽然理论上都有)，直接前端移除
  if (!ossId) {
    fileList.value.splice(index, 1)
    updateModelValue()
    return
  }

  try {
    loading.value = true
    loadingText.value = "正在删除..."
    await delSysOssApi(ossId)
    // API删除成功后，前端移除
    fileList.value.splice(index, 1)
    updateModelValue()
    loading.value = false
    ElMessage.success("删除成功")
  } catch {
    loading.value = false
    ElMessage.error("删除失败")
  }
}

/** 超限提示 */
const handleExceed: UploadProps["onExceed"] = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

defineExpose({
  fileUploadRef
})
</script>

<template>
  <div class="component-upload-file" v-loading="loading" :element-loading-text="loadingText">
    <el-upload
      v-if="!disabled"
      ref="fileUploadRef"
      multiple
      v-model:file-list="fileList"
      :action="uploadUrl"
      :headers="headers"
      :limit="limit"
      :accept="fileAccept"
      :show-file-list="false"
      :before-upload="handleBeforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      class="mb-4"
    >
      <el-button type="primary">
        <span class="i-carbon-cloud-upload mr-1 text-lg" /> 上传文件
      </el-button>

      <template #tip>
        <div v-if="showTip" class="el-upload__tip mt-2 text-gray-400">
          请上传
          <template v-if="fileSize">
            大小不超过 <b class="text-red-500">{{ fileSize }}MB</b>
          </template>
          <template v-if="fileType">
            格式为 <b class="text-red-500">{{ fileType.join('/') }}</b>
          </template>
          的文件
        </div>
      </template>
    </el-upload>

    <transition-group name="list" tag="ul" class="space-y-2">
      <li
        v-for="(file, index) in fileList"
        :key="file.uid || index"
        class="group relative flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all duration-200"
      >
        <el-link
          :href="`${file.url}`"
          :underline="false"
          target="_blank"
          class="flex items-center flex-1 min-w-0 text-gray-700 hover:text-blue-600"
        >
          <span class="i-carbon-document flex-shrink-0 text-xl text-blue-500 mr-3" />
          <span class="truncate font-medium">{{ getFileName(file.name) }}</span>
        </el-link>

        <div class="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <el-button
            v-if="!disabled"
            type="danger"
            link
            @click="handleDelete(index)"
            class="delete-btn"
          >
            <span class="i-carbon-trash-can mr-1" />
            删除
          </el-button>
        </div>
      </li>
    </transition-group>

    <div
      v-if="fileList.length === 0 && disabled"
      class="flex flex-col items-center justify-center py-12 text-gray-400"
    >
      <span class="i-carbon-document-blank text-5xl mb-3" />
      <p class="text-sm">
        暂无文件
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}

.el-upload__tip {
  line-height: 1.4;
}
</style>
