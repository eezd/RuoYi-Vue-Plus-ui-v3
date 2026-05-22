<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import type { CategoryOptionsType } from "../index.vue"
import type { CategoryForm } from "@/common/apis/workflow/category/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { ElMessage } from "element-plus"
import { addWorkflowCategoryApi, updateWorkflowCategoryApi } from "@/common/apis/workflow/category"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<CategoryForm>>(
  "formData",
  {
    required: true
  }
)
const treeData = defineModel<CategoryOptionsType[]>(
  "treeData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<any> = {
  parentId: [{ required: true, message: "请选择上级分类", trigger: "change" }],
  categoryName: [{ required: true, message: "请输入分类名称", trigger: "blur" }]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.categoryId
    const reqData = formData.value as CategoryForm
    const res = isUpdate
      ? await updateWorkflowCategoryApi(reqData)
      : await addWorkflowCategoryApi(reqData)
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
        <el-form-item label="上级分类">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeData"
            :props="{ value: 'categoryId', label: 'categoryName', children: 'children' }"
            value-key="categoryId"
            placeholder="选择上级分类"
            check-strictly
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="formData.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="orderNum">
          <el-input-number v-model="formData.orderNum" controls-position="right" :min="0" />
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
