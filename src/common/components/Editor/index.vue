<script setup lang="ts">
import { Quill, QuillEditor } from "@vueup/vue-quill"
import { globalHeaders } from "@/http/axios"
import "@vueup/vue-quill/dist/vue-quill.snow.css"

/**
 * defineProps
 */
// #region defineProps
const props = defineProps({
  /* 高度 */
  height: { type: Number, default: 400 },
  /* 最小高度 */
  minHeight: { type: Number, default: 400 },
  /* 只读 */
  readOnly: { type: Boolean, default: false },
  /* 上传文件大小限制(MB) */
  fileSize: { type: Number, default: 5 },
  /* 类型（base64格式、url格式） */
  type: { type: String, default: "url" }
})
// #endregion

/**
 * defineModel
 */
// #region defineModel
const content = defineModel<string>("content", { default: "" })
const loading = defineModel<boolean>("loading", { default: false })
const loadingText = defineModel<string>("loadingText", { default: "" })
// #endregion

const upload = reactive<UploadOption>({
  headers: globalHeaders(),
  url: `${import.meta.env.VITE_BASE_URL}/resource/oss/upload`
})
const quillEditorRef = ref()
const uploadRef = ref<HTMLDivElement>()

const options = ref<any>({
  theme: "snow",
  bounds: document.body,
  debug: "warn",
  modules: {
    // 工具栏配置
    toolbar: {
      container: [
        ["bold", "italic", "underline", "strike"], // 加粗 斜体 下划线 删除线
        ["blockquote", "code-block"], // 引用  代码块
        [{ list: "ordered" }, { list: "bullet" }], // 有序、无序列表
        [{ indent: "-1" }, { indent: "+1" }], // 缩进
        [{ size: ["small", false, "large", "huge"] }], // 字体大小
        [{ header: [1, 2, 3, 4, 5, 6, false] }], // 标题
        [{ color: [] }, { background: [] }], // 字体颜色、字体背景颜色
        [{ align: [] }], // 对齐方式
        ["clean"], // 清除文本格式
        ["link", "image", "video"] // 链接、图片、视频
      ],
      handlers: {
        image: (value: boolean) => {
          if (value) {
            // 调用element图片上传
            uploadRef.value?.click()
          } else {
            Quill.format("image", true)
          }
        }
      }
    }
  },
  placeholder: "请输入内容",
  readOnly: props.readOnly
})

const styles = computed(() => {
  const style: any = {}
  if (props.minHeight) {
    style.minHeight = `${props.minHeight}px`
  }
  if (props.height) {
    style.height = `${props.height}px`
  }
  return style
})

// 图片上传成功返回图片地址
function handleUploadSuccess(res: any) {
  // 如果上传成功
  if (res.code === 200) {
    // 获取富文本实例
    const quill = toRaw(quillEditorRef.value).getQuill()
    // 获取光标位置
    const length = quill.selection.savedRange.index
    // 插入图片，res为服务器返回的图片链接地址
    quill.insertEmbed(length, "image", res.data.url)
    // 调整光标到最后
    quill.setSelection(length + 1)
    loading.value = false
  } else {
    ElMessage.error("图片插入失败")
    loading.value = false
  }
}

// 图片上传前拦截
function handleBeforeUpload(file: any) {
  const type = ["image/jpeg", "image/jpg", "image/png", "image/svg"]
  const isJPG = type.includes(file.type)
  // 检验文件格式
  if (!isJPG) {
    ElMessage.error("图片格式错误")
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
  loading.value = true
  loadingText.value = "正在上传文件..."
  return true
}

// 图片失败拦截
function handleUploadError() {
  ElMessage.error("上传文件失败")
}
</script>

<template>
  <div>
    <el-upload
      v-if="type === 'url'"
      :action="upload.url"
      :before-upload="handleBeforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      class="editor-img-uploader"
      name="file"
      :show-file-list="false"
      :headers="upload.headers"
    >
      <i ref="uploadRef" />
    </el-upload>
  </div>
  <div class="editor" v-loading="loading" :element-loading-text="loadingText">
    <QuillEditor
      ref="quillEditorRef"
      v-model:content="content"
      content-type="html"
      :options="options"
      :style="styles"
    />
  </div>
</template>

<style>
.editor-img-uploader {
  display: none;
}
.editor,
.ql-toolbar {
  white-space: pre-wrap !important;
  line-height: normal !important;
}
.quill-img {
  display: none;
}
.ql-snow .ql-tooltip[data-mode="link"]::before {
  content: "请输入链接地址:";
}
.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0;
  content: "保存";
  padding-right: 0;
}
.ql-snow .ql-tooltip[data-mode="video"]::before {
  content: "请输入视频地址:";
}
.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: "14px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before {
  content: "10px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before {
  content: "18px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before {
  content: "32px";
}
.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: "文本";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
  content: "标题1";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
  content: "标题2";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
  content: "标题3";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="4"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="4"]::before {
  content: "标题4";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="5"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="5"]::before {
  content: "标题5";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="6"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="6"]::before {
  content: "标题6";
}
.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: "标准字体";
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before {
  content: "衬线字体";
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before {
  content: "等宽字体";
}
</style>
