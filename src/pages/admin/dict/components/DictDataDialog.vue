<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import { useDevice } from "@@/composables/useDevice"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { addSysDictTypeApi, updateSysDictTypeApi } from "@/common/apis/admin/dict/type"

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<any>(
  "formData",
  {
    required: true
  }
)
// #endregion

const title = computed(() => {
  if (!isEditable.value) return "查看字典"
  return formData.value.roleId === undefined ? "新增字典" : "编辑字典"
})

const { isMobile } = useDevice()

// 组件实例 (权限树)
const formRef = ref<FormInstance | null>(null)

const formRules: FormRules<any> = {
  dictName: [
    {
      required: true,
      trigger: "blur",
      message: "字典名称必填"
    }
  ],
  dictType: [
    {
      required: true,
      trigger: "blur",
      message: "字典类型必填"
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
        const isCreating = formData.value.dictId === undefined
        if (isCreating) {
          const res = await addSysDictTypeApi(formData.value)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysDictTypeApi(formData.value)
          ElMessage.success(res.msg)
          ElMessage.success("操作成功")
        }
      } finally {
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
  <el-dialog v-model="dialogVisible" :title="title" @closed="resetForm" :width="isMobile ? '80%' : '40%'">
    <el-form ref="formRef" label-width="80px" :model="formData" :rules="formRules" label-position="left">
      <el-form-item prop="dictName" label="字典名称">
        <el-input v-model="formData.dictName" placeholder="请输入字典名称" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="dictType" label="字典类型">
        <el-input v-model="formData.dictType" placeholder="请输入字典类型" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="remark" label="备注">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" :disabled="!isEditable" />
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
