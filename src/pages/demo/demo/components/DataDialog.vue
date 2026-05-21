<script lang="ts" setup>
import type { DemoForm } from "@@/apis/system/demo/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import { addSysDemoApi, updateSysDemoApi } from "@@/apis/system/demo"
import { useDevice } from "@@/composables/useDevice.ts"
import { ElMessage } from "element-plus"
import { ref } from "vue"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<DemoForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<DemoForm> = {
  deptId: [{ required: true, message: "部门id不能为空", trigger: "blur" }],
  userId: [{ required: true, message: "用户id不能为空", trigger: "blur" }],
  orderNum: [{ required: true, message: "排序号不能为空", trigger: "blur" }],
  testKey: [{ required: true, message: "key键不能为空", trigger: "blur" }],
  value: [{ required: true, message: "值不能为空", trigger: "blur" }]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.id
    const reqData = formData.value as DemoForm
    const res = isUpdate
      ? await updateSysDemoApi(reqData)
      : await addSysDemoApi(reqData)
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
        <el-form-item prop="deptId" label="部门id">
          <el-input v-model="formData.deptId" placeholder="请输入部门id" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="userId" label="用户id">
          <el-input v-model="formData.userId" placeholder="请输入用户id" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="orderNum" label="排序号">
          <el-input v-model="formData.orderNum" placeholder="请输入排序号" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="testKey" label="key键">
          <el-input v-model="formData.testKey" placeholder="请输入key键" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="value" label="值">
          <el-input v-model="formData.value" placeholder="请输入值" :disabled="!dialog.isEditable" />
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
