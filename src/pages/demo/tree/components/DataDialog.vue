<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import type { TreeOptionsType } from "../index.vue"
import type { TreeForm } from "@/common/apis/system/demo-tree/types.ts"
import { useDevice } from "@@/composables/useDevice.ts"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { addSysTreeApi, updateSysTreeApi } from "@/common/apis/system/demo-tree"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<TreeForm>>(
  "formData",
  {
    required: true
  }
)
const treeData = defineModel<TreeOptionsType[]>(
  "treeData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<TreeForm> = {
  deptId: [{ required: true, message: "部门id不能为空", trigger: "blur" }],
  userId: [{ required: true, message: "用户id不能为空", trigger: "blur" }],
  treeName: [{ required: true, message: "树节点名不能为空", trigger: "blur" }]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.id
    const reqData = formData.value as TreeForm
    const res = isUpdate
      ? await updateSysTreeApi(reqData)
      : await addSysTreeApi(reqData)
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
        <el-form-item prop="parentId" label="父id">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeData"
            :props="{ value: 'id', label: 'treeName', children: 'children' }"
            value-key="id"
            placeholder="请选择父id"
            check-strictly
            :disabled="!dialog.isEditable"
          />
        </el-form-item>
        <el-form-item prop="deptId" label="部门id">
          <el-input v-model="formData.deptId" placeholder="请输入部门id" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="userId" label="用户id">
          <el-input v-model="formData.userId" placeholder="请输入用户id" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="treeName" label="值">
          <el-input v-model="formData.treeName" placeholder="请输入值" :disabled="!dialog.isEditable" />
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
