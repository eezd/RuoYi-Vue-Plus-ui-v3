<script setup lang="ts">
import type { UploadInstance, UploadProps, UploadUserFile } from "element-plus"
import { delSysOssApi, getSysOssByIdsApi } from "@@/apis/system/oss"
import { ElMessage } from "element-plus"
import { compressAccurately } from "image-conversion"
import { globalHeaders } from "@/http/axios"

/**
 * defineProps
 */
// #region defineProps
const props = defineProps({
  /** 文件数量上限，默认 5 张 */
  limit: { type: Number, default: 5 },
  /** 文件大小限制（MB），默认 5MB */
  fileSize: { type: Number, default: 5 },
  /** 允许的文件类型 */
  fileType: { type: Array as PropType<string[]>, default: () => ["png", "jpg", "jpeg"] },
  /** 是否显示上传提示信息，默认显示 */
  isShowTip: { type: Boolean, default: true },
  /** 是否启用图片压缩功能，默认关闭 */
  compressSupport: { type: Boolean, default: false },
  /**
   * 图片压缩目标大小（KB）
   * 超过此大小的图片会被压缩到此大小以内
   * 默认 300KB
   */
  compressTargetSize: { type: Number, default: 300 }
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

const uploadImgUrl = ref(`${import.meta.env.VITE_BASE_URL}/resource/oss/upload`)
const headers = ref(globalHeaders())
// 绑定的文件列表
const fileList = ref<UploadUserFile[]>([])
const imageUploadRef = useTemplateRef<UploadInstance>("useTemplateRef")
const dialogImageUrl = ref("")
const dialogVisible = ref(false)

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
        name: item.originalName,
        url: item.url,
        ossId: item.ossId,
        uid: item.ossId || Date.now()
      })) as UploadUserFile[]
    } catch (e) {
      console.error("获取图片列表失败:", e)
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

/** 上传前校验与压缩 */
const handleBeforeUpload: UploadProps["beforeUpload"] = async (file) => {
  // 1. 格式校验
  const fileName = file.name
  const fileExtension = fileName.slice(fileName.lastIndexOf(".") + 1)
  const isImg = props.fileType.some(type =>
    file.type.includes(type) || fileExtension.toLowerCase() === type.toLowerCase()
  )

  if (!isImg) {
    ElMessage.error(`文件格式不正确, 请上传 ${props.fileType.join("/")} 图片!`)
    return false
  }
  if (props.fileSize && file.size / 1024 / 1024 > props.fileSize) {
    ElMessage.error(`上传图片大小不能超过 ${props.fileSize} MB!`)
    return false
  }

  // 2. 压缩处理
  if (props.compressSupport && file.size / 1024 > props.compressTargetSize) {
    loading.value = true
    loadingText.value = "正在压缩图片，请稍候..."
    try {
      const blob = await compressAccurately(file, props.compressTargetSize)
      // 需要将 blob 转回 File 对象，否则 element-plus 可能无法正确识别 uid
      const compressedFile = new File([blob], fileName, { type: blob.type })
      return compressedFile
    } catch {
      loading.value = false
      ElMessage.error("图片压缩失败")
      return false
    }
  }

  loading.value = true
  loadingText.value = "正在上传图片..."
  return true
}

/** 上传成功 */
const handleUploadSuccess: UploadProps["onSuccess"] = (res, file, uploadFiles) => {
  loading.value = false

  if (res.code === 200) {
    // 关键：将后端返回的 ossId 挂载到 file 对象上
    // uploadFiles 是当前控件内的所有文件列表（包含之前的和新上传的）
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

/** 删除文件 */
const handleDelete: UploadProps["beforeRemove"] = async (file) => {
  const ossId = (file as any).ossId

  // 如果是刚上传还是 loading 状态或者没有 ossId，直接移除即可
  if (!ossId) return true

  try {
    // 必须调接口删除成功才从 UI 移除
    // 如果你希望表单提交时才删除，这里可以去掉 API 调用
    loading.value = true
    loadingText.value = "正在删除..."
    await delSysOssApi(ossId)
    loading.value = false
    return true
  } catch {
    ElMessage.error("删除失败")
    return false // 阻止移除
  }
}

/** 移除文件后的回调（处理数据同步） */
const handleRemove: UploadProps["onRemove"] = (file, uploadFiles) => {
  fileList.value = uploadFiles
  updateModelValue()
}

/** 超限提示 */
const handleExceed: UploadProps["onExceed"] = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 张图片`)
}

/** 预览 */
const handlePictureCardPreview: UploadProps["onPreview"] = (file) => {
  dialogImageUrl.value = file.url!
  dialogVisible.value = true
}

defineExpose({
  imageUploadRef
})
</script>

<template>
  <div class="component-upload-image" v-loading="loading" :element-loading-text="loadingText">
    <el-upload
      ref="imageUploadRef"
      multiple
      v-model:file-list="fileList"
      list-type="picture-card"
      :action="uploadImgUrl"
      :headers="headers"
      :limit="limit"
      :accept="fileAccept"
      :show-file-list="true"
      :before-upload="handleBeforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :before-remove="handleDelete"
      :on-remove="handleRemove"
      :on-preview="handlePictureCardPreview"
      :class="{ hide: fileList.length >= limit }"
    >
      <el-icon class="avatar-uploader-icon">
        <plus />
      </el-icon>
    </el-upload>

    <div v-if="showTip" class="el-upload__tip">
      请上传
      <template v-if="fileSize">
        大小不超过 <b class="text-danger">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileType">
        格式为 <b class="text-danger">{{ fileType.join('/') }}</b>
      </template>
      的文件
    </div>

    <el-dialog v-model="dialogVisible" title="预览" width="800px" append-to-body>
      <img
        :src="dialogImageUrl"
        class="preview-img"
        alt="预览图片"
      >
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
:deep(.hide .el-upload--picture-card) {
  display: none;
}

.el-upload__tip {
  line-height: 1.2;
  margin-top: 5px;
}

.text-danger {
  color: #f56c6c;
}

.preview-img {
  display: block;
  max-width: 100%;
  margin: 0 auto;
}
</style>
