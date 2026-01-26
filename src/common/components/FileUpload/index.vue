<script setup lang="ts">
import type { OssVO } from "@/common/apis/admin/system/oss/types"
import { ElMessage } from "element-plus"
import { delSysOssApi, getSysOssByIdsApi } from "@/common/apis/admin/system/oss"
import propTypes from "@/common/utils/propTypes"
import { globalHeaders } from "@/http/axios"

const props = defineProps({
  /** v-model 绑定值 */
  modelValue: {
    type: [String, Object, Array],
    default: () => []
  },
  /** 文件数量上限，默认 5 张 */
  limit: propTypes.number.def(5),
  /** 文件大小限制（MB），默认 5MB */
  fileSize: propTypes.number.def(5),
  /** 允许的文件类型，如 ['png', 'jpg', 'jpeg'] */
  fileType: propTypes.array.def(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "pdf"]),
  /** 是否显示上传提示信息，默认显示 */
  isShowTip: {
    type: Boolean,
    default: true
  },
  // 禁用组件（仅查看文件）
  disabled: propTypes.bool.def(false)
})

const emit = defineEmits(["update:modelValue"])

/** 当前正在上传的文件数量计数器 */
const number = ref(0)
/** 临时存储上传成功的文件列表 */
const uploadList = ref<any[]>([])
/** Element Plus Upload 组件实例引用 */
const fileUploadRef = ref<ElUploadInstance>()
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
            name: item.originalName,
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

/**
 * 文件上传前的验证和处理
 * @param file 待上传的文件对象
 * @returns {boolean|Promise} 返回 false 则阻止上传，返回 Promise 则用压缩后的文件
 */
function handleBeforeUpload(file: any) {
  if (props.fileType.length) {
    const fileName = file.name.split(".")
    const fileExt = fileName[fileName.length - 1]
    if (!props.fileType.includes(fileExt)) {
      ElMessage.error(`文件格式不正确, 请上传 ${props.fileType.join("/")} 文件格式文件!`)
      return false
    }
  }
  // 校检文件名是否包含特殊字符
  if (file.name.includes(",")) {
    ElMessage.error("文件名不正确，不能包含英文逗号!")
    return false
  }
  // 校检文件大小
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize
    if (!isLt) {
      ElMessage.error(`上传文件大小不能超过 ${props.fileSize} MB!`)
      return false
    }
  }
  loadingInstance = ElLoading.service({ text: "正在上传文件，请稍候..." })
  number.value++
  return true
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
    fileUploadRef.value?.handleRemove(file)
    uploadedSuccessfully()
  }
}

/**
 * 删除文件前的处理
 */
function handleDelete(index: number) {
  const ossId = fileList.value[index].ossId
  delSysOssApi(ossId)
  fileList.value.splice(index, 1)
  emit("update:modelValue", listToString(fileList.value))
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
  ElMessage.error("上传文件失败")
  loadingInstance?.close()
}

// 获取文件名称
function getFileName(name: string) {
  if (name.includes("/")) {
    // 注意：这里依然需要 lastIndexOf 来确定切割的位置
    return name.slice(name.lastIndexOf("/") + 1)
  } else {
    return name
  }
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
  <div class="upload-file">
    <el-upload
      ref="fileUploadRef"
      multiple
      :action="uploadImgUrl"
      :before-upload="handleBeforeUpload"
      :file-list="fileList"
      :limit="limit"
      :accept="fileAccept"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      :show-file-list="false"
      :headers="headers"
      class="upload-file-uploader"
      v-if="!disabled"
    >
      <el-button type="primary">
        选取文件
      </el-button>
    </el-upload>

    <div v-if="showTip && !disabled" class="el-upload__tip">
      请上传
      <template v-if="fileSize">
        大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileType">
        格式为 <b style="color: #f56c6c">{{ fileType.join('/') }}</b>
      </template>
      的文件
    </div>

    <!-- 文件列表 -->
    <transition-group class="upload-file-list el-upload-list el-upload-list--text" name="el-fade-in-linear" tag="ul">
      <li v-for="(file, index) in fileList" :key="file.uid" class="el-upload-list__item ele-upload-list__item-content">
        <el-link :href="`${file.url}`" :underline="false" target="_blank">
          <span class="el-icon-document"> {{ getFileName(file.name) }} </span>
        </el-link>
        <div class="ele-upload-list__item-content-action">
          <el-button type="danger" v-if="!disabled" link @click="handleDelete(index)">
            删除
          </el-button>
        </div>
      </li>
    </transition-group>
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

.upload-file-uploader {
  margin-bottom: 5px;
}

.upload-file-list .el-upload-list__item {
  border: 1px solid #e4e7ed;
  line-height: 2;
  margin-bottom: 10px;
  position: relative;
}

.upload-file-list .ele-upload-list__item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: inherit;
}

.ele-upload-list__item-content-action .el-link {
  margin-right: 10px;
}
</style>
