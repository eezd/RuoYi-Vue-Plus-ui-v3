<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { NoticeForm } from "@/common/apis/admin/system/notice/types"
import Editor from "@@/components/Editor/index.vue"
import { useDevice } from "@@/composables/useDevice"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { addSysNoticeApi, updateSysNoticeApi } from "@/common/apis/admin/system/notice"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<NoticeForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  getTableData: []
}
const getTableData = () => emit("getTableData")
// #endregion

const { sys_notice_type, sys_notice_status } = toRefs<any>(useDict("sys_notice_type", "sys_notice_status"))

const title = computed(() => {
  if (!isEditable.value) return "查看参数"
  return formData.value.noticeId === undefined ? "新增参数" : "编辑参数"
})

const { isMobile } = useDevice()

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

/**
 * 创建或更新
 */
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    // (valid: boolean, fields)
    if (valid) {
      try {
        loading.value = true
        const isCreating = formData.value.noticeId === undefined
        if (isCreating) {
          const res = await addSysNoticeApi(formData.value as NoticeForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysNoticeApi(formData.value as NoticeForm)
          ElMessage.success(res.msg)
        }
      } finally {
        // 新增/修改操作后刷新表格
        await getTableData()
        dialogVisible.value = false
        loading.value = false
      }
    }
  })
}

/**
 * 重置表单
 */
function resetForm() {
  formRef.value?.clearValidate()
  formRef.value?.resetFields()
  formData.value = cloneDeep({})
}
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="title" @closed="resetForm" :width="isMobile ? '90%' : '40%'">
    <el-form ref="formRef" v-loading="loading" label-width="80px" :model="formData" :rules="formRules" label-position="left">
      <el-form-item prop="noticeTitle" label="公告标题">
        <el-input v-model="formData.noticeTitle" placeholder="请输入公告标题" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="noticeType" label="公告类型">
        <el-select class="min-w-[150px]" v-model="formData.noticeType" placeholder="公告类型" clearable :disabled="!isEditable">
          <el-option v-for="dict in sys_notice_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item prop="status" label="状态">
        <el-radio-group v-model="formData.status" :disabled="!isEditable">
          <el-radio v-for="dict in sys_notice_status" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="noticeContent" label="内容">
        <Editor v-model="formData.noticeContent" :min-height="192" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" @click="handleCreateOrUpdate" :loading="loading" :disabled="!isEditable">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
</style>
