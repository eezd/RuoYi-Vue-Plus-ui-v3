<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FlowVariableForm } from "@/common/apis/workflow/instance/types"

export interface InstanceVariableDialogState extends DialogOption {
  processName: string
  rawVariable: string
}

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<InstanceVariableDialogState>("dialog", { required: true })
const formData = defineModel<FlowVariableForm>("formData", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  submit: [payload: FlowVariableForm]
}
const submit = (payload: FlowVariableForm) => emit("submit", payload)
// #endregion

const formRef = useTemplateRef<FormInstance>("formRef")
const formRules: FormRules<FlowVariableForm> = {
  key: [{ required: true, message: "变量KEY不能为空", trigger: "blur" }],
  value: [{ required: true, message: "变量值不能为空", trigger: "blur" }]
}

const formattedVariable = computed(() => {
  try {
    if (!dialog.value.rawVariable) return "{}"
    return JSON.stringify(JSON.parse(dialog.value.rawVariable), null, 2)
  } catch {
    return dialog.value.rawVariable || "{}"
  }
})

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submit({ ...formData.value })
}
</script>

<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" width="60%" append-to-body>
    <el-card v-loading="dialog.loading" shadow="never">
      <template #header>
        <span>流程定义名称：{{ dialog.processName }}</span>
      </template>
      <pre class="variable-json">{{ formattedVariable }}</pre>
    </el-card>
    <el-card v-loading="dialog.loading" shadow="never" class="mt-4">
      <el-form ref="formRef" :model="formData" :rules="formRules" inline>
        <el-form-item label="变量KEY" prop="key">
          <el-input v-model="formData.key" placeholder="请输入变量KEY" />
        </el-form-item>
        <el-form-item label="变量值" prop="value">
          <el-input v-model="formData.value" placeholder="请输入变量值" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">
            更新变量
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </el-dialog>
</template>

<style lang="scss" scoped>
.variable-json {
  max-height: 320px;
  overflow-y: auto;
  margin: 0;
  padding: 12px;
  border-radius: 4px;
  background: #f6f8fa;
  line-height: 1.5;
}
</style>
