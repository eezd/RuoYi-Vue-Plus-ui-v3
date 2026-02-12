<script lang="ts" setup>
import type { NoticeForm } from "@@/apis/system/notice/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import { addSysNoticeApi, updateSysNoticeApi } from "@@/apis/system/notice"
import Editor from "@@/components/Editor/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElMessage } from "element-plus"
import { ref } from "vue"

export interface EmitEvents {
  (e: "success"): void
  (e: "cancel"): void
}
const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<NoticeForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()
const { sys_notice_type, sys_notice_status } = toRefs<any>(useDict("sys_notice_type", "sys_notice_status"))

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<NoticeForm> = {
  noticeTitle: [
    {
      required: true,
      trigger: "blur",
      message: "公告标题必填"
    }
  ],
  noticeType: [
    {
      required: true,
      trigger: "blur",
      message: "公告类型必填"
    }
  ]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.noticeId
    const reqData = formData.value as NoticeForm
    const res = isUpdate
      ? await updateSysNoticeApi(reqData)
      : await addSysNoticeApi(reqData)
    ElMessage.success(res.msg)
    resetForm()
    dialog.value.visible = false
    emit("success")
  } finally {
    dialog.value.loading = false
  }
}

function handleCancel() {
  resetForm()
  dialog.value.visible = false
  emit("cancel")
}

function resetForm() {
  formRef.value?.clearValidate()
}
</script>

<template>
  <el-drawer
    v-model="dialog.visible"
    :title="dialog.title"
    direction="rtl"
    :size="isMobile ? '90%' : '40%'"
    @closed="handleCancel"
    class="system-drawer"
    modal-class="system-drawer-modal"
    :lock-scroll="true"
    destroy-on-close
  >
    <template #header="{ titleId, titleClass }">
      <div :id="titleId" :class="titleClass" class="drawer-header">
        <span>{{ dialog.title }}</span>
      </div>
    </template>
    <div class="drawer-content">
      <el-form ref="formRef" v-loading="dialog.loading" label-width="auto" :model="formData" :rules="formRules" label-position="left">
        <el-form-item prop="noticeTitle" label="公告标题">
          <el-input v-model="formData.noticeTitle" placeholder="请输入公告标题" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="noticeType" label="公告类型">
          <el-select class="min-w-[150px]" v-model="formData.noticeType" placeholder="公告类型" clearable :disabled="!dialog.isEditable">
            <el-option v-for="dict in sys_notice_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-radio-group v-model="formData.status" :disabled="!dialog.isEditable">
            <el-radio v-for="dict in sys_notice_status" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="noticeContent" label="内容">
          <Editor v-model:model-value="formData.noticeContent" :min-height="192" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="drawer-footer">
        <el-button class="btn-cancel" @click="handleCancel">
          取消
        </el-button>
        <el-button class="btn-submit" type="primary" @click="handleSubmit" :loading="dialog.loading" :disabled="!dialog.isEditable">
          确认
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
</style>
