<script lang="ts" setup>
import DictTag from "@@/components/DictTag/index.vue"
import Editor from "@@/components/Editor/index.vue"
import FileUpload from "@@/components/FileUpload/index.vue"
import ImagePreview from "@@/components/ImagePreview/index.vue"
import ImageUpload from "@@/components/ImageUpload/index.vue"
import { useDict } from "@/common/composables/useDict"
import { checkPermission } from "@/common/utils/permission"

// 1. 组件：DictTag
const { sys_common_status } = toRefs<any>(useDict("sys_common_status"))

// 2. 组件：Editor 富文本编辑器
const noticeContent = ref<string>("")

// 3. 组件：FileUpload 文件上传, 返回ID数组
const fileUpload = ref<string>("")

// 4. 组件：ImageUpload 图片上传, 返回ID数组
const imageUpload = ref<string>("")

// 5. 组件：ImagePreview 图片预览
const productData = ref({
  images: "https://picsum.photos/200,https://picsum.photos/201"
})
</script>

<template>
  <div class="app-container">
    <h2>组件列表</h2>
    1. 组件：DictTag
    <DictTag :options="sys_common_status" :value="1" />
    <br>
    <br>
    2. 组件：Editor 富文本编辑器
    <Editor v-model:content="noticeContent" :height="50" :min-height="150" />
    <br>
    <br>
    3. 组件：FileUpload 文件上传, 返回ID数组
    <FileUpload v-model:file-ids="fileUpload" />
    <br>
    <br>
    4. 组件：ImageUpload 图片上传, 返回ID数组
    <ImageUpload v-model:file-ids="imageUpload" />
    {{ imageUpload }}
    <br>
    <br>
    5. 组件：ImagePreview 图片预览, 预览多张图片(src为逗号分隔的字符串-"https://picsum.photos/200,https://picsum.photos/201")
    <br>
    <ImagePreview
      :src="productData.images"
      :width="150"
      :height="150"
    />
    <br>
    <br>
    <h2>方法</h2>
    1. checkPermission(['system:user:add']), 检查是否具有权限
    <br>
    {{ checkPermission(['system:user:add']) }}
    <br>
    <br>
    2. v-permission="['system:user:add']" 这种同样是检查权限的指令, 区别在于它可以直接<a class="color-red">控制元素的显示与隐藏</a>
    <el-button v-permission="['system:user:add']">
      新增用户按钮
    </el-button>
    <br>
    <br>
    <ElDivider />
  </div>
</template>

<style lang="scss" scoped>

</style>
