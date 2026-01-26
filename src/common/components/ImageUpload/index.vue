<script setup lang="ts">
import type { OssVO } from "@/common/apis/admin/system/oss/types"
import { compressAccurately } from "image-conversion"
import { delSysOssApi, getSysOssByIdsApi } from "@/common/apis/admin/system/oss"
import propTypes from "@/common/utils/propTypes"
import { globalHeaders } from "@/http/axios"

const props = defineProps({
  /** v-model 绑定值 */
  modelValue: {
    type: [String, Object, Array],
    default: () => []
  },
  /** 图片数量上限，默认 5 张 */
  limit: propTypes.number.def(5),
  /** 文件大小限制（MB），默认 5MB */
  fileSize: propTypes.number.def(5),
  /** 允许的文件类型，如 ['png', 'jpg', 'jpeg'] */
  fileType: propTypes.array.def(["png", "jpg", "jpeg"]),
  /** 是否显示上传提示信息，默认显示 */
  isShowTip: {
    type: Boolean,
    default: true
  },
  /** 是否启用图片压缩功能，默认关闭 */
  compressSupport: {
    type: Boolean,
    default: false
  },
  /**
   * 图片压缩目标大小（KB）
   * 超过此大小的图片会被压缩到此大小以内
   * 默认 300KB
   */
  compressTargetSize: propTypes.number.def(300)
})

const emit = defineEmits(["update:modelValue"])

/** 当前正在上传的文件数量计数器 */
const number = ref(0)
/** 临时存储上传成功的文件列表 */
const uploadList = ref<any[]>([])
/** 预览对话框中显示的图片 URL */
const dialogImageUrl = ref("")
/** 控制预览对话框的显示/隐藏 */
const dialogVisible = ref(false)
/** Element Plus Upload 组件实例引用 */
const imageUploadRef = ref<ElUploadInstance>()
/** 展示的文件列表（包含 name, url, ossId） */
const fileList = ref<any[]>([])

/** 上传服务器地址 */
const baseUrl = import.meta.env.VITE_BASE_URL
const uploadImgUrl = ref(`${baseUrl}/resource/oss/upload`)

const headers = ref(globalHeaders())

/**
 * 是否显示上传提示
 * 需要 isShowTip 为 true 且配置了 fileType 或 fileSize 时才显示
 */
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize))

/**
 * 根据 fileType 生成 accept 属性值
 * 例如：['png', 'jpg'] => '.png,.jpg'
 */
const fileAccept = computed(() => props.fileType.map(type => `.${type}`).join(","))

let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

watch(
  () => props.modelValue,
  async (val: any) => {
    if (val) {
      let list: OssVO[] = []
      if (Array.isArray(val)) {
        list = val as OssVO[]
      } else {
        const res = await getSysOssByIdsApi(val)
        list = res.data
      }
      fileList.value = list.map((item) => {
        if (typeof item === "string") {
          return { name: item, url: item }
        } else {
          return {
            name: item.ossId,
            url: item.url,
            ossId: item.ossId
          }
        }
      })
    } else {
      fileList.value = []
    }
  },
  { deep: true, immediate: true }
)

// ==================== 上传前处理 ====================
// eslint-disable-next-line jsdoc/require-returns-check
/**
 * 文件上传前的验证和处理
 * @param file 待上传的文件对象
 * @returns {boolean|Promise} 返回 false 则阻止上传，返回 Promise 则用压缩后的文件
 */
function handleBeforeUpload(file: any) {
  let isImg = false
  if (props.fileType.length) {
    let fileExtension = ""
    if (file.name.includes(".")) {
      const dotIndex = file.name.lastIndexOf(".")
      fileExtension = file.name.slice(dotIndex + 1)
    }
    isImg = props.fileType.some((type: any) => {
      if (file.type?.includes(type)) return true
      if (fileExtension && fileExtension.includes(type)) return true
      return false
    })
  } else {
    isImg = file.type?.includes("image")
  }

  if (!isImg) {
    ElMessage.error(`文件格式不正确, 请上传 ${props.fileType.join("/")} 图片格式文件!`)
    return false
  }
  if (file.name.includes(",")) {
    ElMessage.error("文件名不正确，不能包含英文逗号!")
    return false
  }
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize
    if (!isLt) {
      ElMessage.error(`上传图片大小不能超过 ${props.fileSize} MB!`)
      return false
    }
  }

  // 当开启压缩且文件大小超过压缩阈值时进行压缩
  if (props.compressSupport && file.size / 1024 > props.compressTargetSize) {
    loadingInstance?.close()
    loadingInstance = ElLoading.service({ text: "正在上传图片，请稍候..." })
    number.value++
    // 返回压缩后的文件 Promise
    return compressAccurately(file, props.compressTargetSize)
  } else {
    // 不需要压缩，直接上传
    loadingInstance?.close()
    loadingInstance = ElLoading.service({ text: "正在上传图片，请稍候..." })
    number.value++
  }
}

/**
 * 当文件数量超过限制时触发
 */
function handleExceed() {
  ElMessage.error(`上传文件数量不能超过 ${props.limit} 个!`)
}

/**
 * 文件上传成功后的处理
 * @param res 服务器返回的响应数据
 * @param file 上传的文件对象
 */
function handleUploadSuccess(res: any, file: UploadFile) {
  if (res.code === 200) {
    uploadList.value.push({
      name: res.data.fileName,
      url: res.data.url,
      ossId: res.data.ossId
    })
    uploadedSuccessfully()
  } else {
    // 上传失败，回滚计数器并移除文件
    number.value--
    loadingInstance?.close()
    ElMessage.error(res.msg)
    imageUploadRef.value?.handleRemove(file)
    uploadedSuccessfully()
  }
}

/**
 * 删除文件前的处理
 * @param file 要删除的文件对象
 * @returns {boolean} 返回 false 阻止默认删除行为
 */
function handleDelete(file: UploadFile): boolean {
  const findex = fileList.value.map(f => f.name).indexOf(file.name)

  // 如果文件存在且所有上传已完成
  if (findex > -1 && uploadList.value.length === number.value) {
    const ossId = fileList.value[findex].ossId
    delSysOssApi(ossId)
    fileList.value.splice(findex, 1)
    emit("update:modelValue", listToString(fileList.value))
    return false // 阻止 el-upload 的默认删除行为
  }
  return true // 允许默认删除行为
}

/**
 * 检查所有文件是否上传完成
 * 完成后合并文件列表并触发 v-model 更新
 */
function uploadedSuccessfully() {
  if (number.value > 0 && uploadList.value.length === number.value) {
    fileList.value = fileList.value
      .filter(f => f.url !== undefined) // 过滤掉无效文件
      .concat(uploadList.value) // 合并新上传的文件

    uploadList.value = []
    number.value = 0

    emit("update:modelValue", listToString(fileList.value))

    loadingInstance?.close()
  }
}

/**
 * 文件上传失败的处理
 */
function handleUploadError() {
  ElMessage.error("上传图片失败")
  loadingInstance?.close()
}

/**
 * 点击图片预览
 * @param file 要预览的文件对象
 */
function handlePictureCardPreview(file: any) {
  dialogImageUrl.value = file.url
  dialogVisible.value = true
}

/**
 * 将文件列表转换为以分隔符连接的 ossId 字符串
 * @param list 文件对象数组
 * @param separator 分隔符，默认为逗号
 * @returns {string} ossId 字符串，如 "id1,id2,id3"
 */
function listToString(list: any[], separator?: string): string {
  let strs = ""
  separator = separator || ","

  for (const i in list) {
    // 只处理有效的 ossId（非 undefined 且非 blob URL）
    if (undefined !== list[i].ossId && list[i].url.indexOf("blob:") !== 0) {
      strs += list[i].ossId + separator
    }
  }

  // 移除末尾多余的分隔符
  return strs !== "" ? strs.substring(0, strs.length - 1) : ""
}
</script>

<template>
  <div class="component-upload-image">
    <el-upload
      ref="imageUploadRef"
      multiple
      :action="uploadImgUrl"
      list-type="picture-card"
      :on-success="handleUploadSuccess"
      :before-upload="handleBeforeUpload"
      :limit="limit"
      :accept="fileAccept"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :before-remove="handleDelete"
      :show-file-list="true"
      :headers="headers"
      :file-list="fileList"
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
        大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileType">
        格式为 <b style="color: #f56c6c">{{ fileType.join('/') }}</b>
      </template>
      的文件
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="预览"
      width="800px"
      append-to-body
    >
      <img
        :src="dialogImageUrl"
        style="display: block; max-width: 100%; margin: 0 auto"
        alt="预览图片"
      >
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
/**
 * 当文件数量达到上限时隐藏上传按钮
 * .hide 类会在 :class 绑定中动态添加
 */
:deep(.hide .el-upload--picture-card) {
  display: none;
}
</style>
