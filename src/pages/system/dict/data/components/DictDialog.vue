<script lang="ts" setup>
import type { DictDataForm } from "@@/apis/system/dict/data/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import { addSysDictDataApi, updateSysDictDataApi } from "@@/apis/system/dict/data"
import { useDevice } from "@@/composables/useDevice.ts"
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
const formData = defineModel<Partial<DictDataForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<DictDataForm> = {
  dictLabel: [
    {
      required: true,
      trigger: "blur",
      message: "数据标签必填"
    }
  ],
  dictValue: [
    {
      required: true,
      trigger: "blur",
      message: "数据键值必填"
    }
  ],
  dictSort: [
    {
      required: true,
      trigger: "blur",
      message: "显示排序必填"
    }
  ]
}

// 数据标签回显样式
const listClassOptions = ref<Array<{ value: string, label: string }>>([
  { value: "default", label: "默认" },
  { value: "primary", label: "主要" },
  { value: "success", label: "成功" },
  { value: "info", label: "信息" },
  { value: "warning", label: "警告" },
  { value: "danger", label: "危险" }
])

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.dictCode
    const reqData = formData.value as DictDataForm
    const res = isUpdate
      ? await updateSysDictDataApi(reqData)
      : await addSysDictDataApi(reqData)
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
        <el-form-item prop="dictType" label="字典类型">
          <el-input v-model="formData.dictType" placeholder="请输入字典类型" :disabled="true" />
        </el-form-item>
        <el-form-item prop="dictLabel" label="数据标签">
          <el-input v-model="formData.dictLabel" placeholder="请输入数据标签" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="dictValue" label="数据键值">
          <el-input v-model="formData.dictValue" placeholder="请输入数据键值" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="cssClass" label="样式属性">
          <el-input v-model="formData.cssClass" placeholder="请输入样式属性" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="dictSort" label="显示排序">
          <el-input-number v-model="formData.dictSort" controls-position="right" :min="0" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="listClass" label="回显样式">
          <el-select v-model="formData.listClass" :disabled="!dialog.isEditable">
            <el-option
              v-for="item in listClassOptions"
              :key="item.value"
              :label="`${item.label}(${item.value})`"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="remark" label="备注">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" :disabled="!dialog.isEditable" />
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
