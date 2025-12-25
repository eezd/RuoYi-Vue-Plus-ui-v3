<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { ConfigForm } from "@/common/apis/admin/system/config/types"
import { useDevice } from "@@/composables/useDevice"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { addSysConfigApi, updateSysConfigApi } from "@/common/apis/admin/system/config"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<ConfigForm>>(
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

const { sys_yes_no } = toRefs<any>(useDict("sys_yes_no"))

const title = computed(() => {
  if (!isEditable.value) return "查看参数"
  return formData.value.configId === undefined ? "新增参数" : "编辑参数"
})

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)

const formRules: FormRules<ConfigForm> = {
  configName: [
    {
      required: true,
      trigger: "blur",
      message: "参数名称必填"
    }
  ],
  configKey: [
    {
      required: true,
      trigger: "blur",
      message: "参数键名必填"
    }
  ],
  configValue: [
    {
      required: true,
      trigger: "blur",
      message: "参数键值必填"
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
        const isCreating = formData.value.configId === undefined
        if (isCreating) {
          const res = await addSysConfigApi(formData.value as ConfigForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysConfigApi(formData.value as ConfigForm)
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
      <el-form-item prop="configName" label="参数名称">
        <el-input v-model="formData.configName" placeholder="请输入参数名称" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="configKey" label="参数键名">
        <el-input v-model="formData.configKey" placeholder="请输入参数键名" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="configValue" label="参数键值">
        <el-input v-model="formData.configValue" placeholder="请输入参数键值" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="configType" label="系统内置">
        <el-radio-group v-model="formData.configType">
          <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
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
