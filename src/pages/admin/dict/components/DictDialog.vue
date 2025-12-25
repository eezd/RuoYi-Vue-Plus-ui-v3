<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { DictTypeForm } from "@/common/apis/admin/system/dict/type/types"
import { useDevice } from "@@/composables/useDevice"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { addSysDictTypeApi, updateSysDictTypeApi } from "@/common/apis/admin/system/dict/type"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<DictTypeForm>>(
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

const title = computed(() => {
  if (!isEditable.value) return "查看字典"
  return formData.value.dictId === undefined ? "新增字典" : "编辑字典"
})

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)

const formRules: FormRules<DictTypeForm> = {
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
          const res = await addSysDictTypeApi(formData.value as DictTypeForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysDictTypeApi(formData.value as DictTypeForm)
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
