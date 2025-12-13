<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { DictDataForm } from "@/common/apis/admin/dict/data/types"
import { useDevice } from "@@/composables/useDevice"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { addSysDictDataApi, updateSysDictDataApi } from "@/common/apis/admin/dict/data"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<DictDataForm>>(
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
  if (!isEditable.value) return "查看字典数据"
  return formData.value.dictCode === undefined ? "新增字典数据" : "编辑字典数据"
})

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

/**
 * 创建或更新
 */
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    // (valid: boolean, fields)
    if (valid) {
      try {
        loading.value = true
        const isCreating = formData.value.dictCode === undefined
        if (isCreating) {
          const res = await addSysDictDataApi(formData.value as DictDataForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysDictDataApi(formData.value as DictDataForm)
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
    <el-form ref="formRef" label-width="80px" :model="formData" :rules="formRules" label-position="left">
      <el-form-item prop="dictType" label="字典类型">
        <el-input v-model="formData.dictType" placeholder="请输入字典类型" :disabled="true" />
      </el-form-item>
      <el-form-item prop="dictLabel" label="数据标签">
        <el-input v-model="formData.dictLabel" placeholder="请输入数据标签" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="dictValue" label="数据键值">
        <el-input v-model="formData.dictValue" placeholder="请输入数据键值" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="cssClass" label="样式属性">
        <el-input v-model="formData.cssClass" placeholder="请输入样式属性" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="dictSort" label="显示排序">
        <el-input-number v-model="formData.dictSort" controls-position="right" :min="0" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="listClass" label="回显样式">
        <el-select v-model="formData.listClass" :disabled="!isEditable">
          <el-option
            v-for="item in listClassOptions"
            :key="item.value"
            :label="`${item.label}(${item.value})`"
            :value="item.value"
          />
        </el-select>
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
