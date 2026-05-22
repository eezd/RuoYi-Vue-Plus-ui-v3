<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import type { SpelForm } from "@/common/apis/workflow/spel/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { ElMessage } from "element-plus"
import { addWorkflowSpelApi, updateWorkflowSpelApi } from "@/common/apis/workflow/spel"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<SpelForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<SpelForm> = {
  status: [
    { required: true, message: "状态不能为空", trigger: "change" }
  ]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.id
    const reqData = formData.value as SpelForm
    const res = isUpdate
      ? await updateWorkflowSpelApi(reqData)
      : await addWorkflowSpelApi(reqData)
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

/** 更新 SpEL 预览值并决定是否显示输入框 */
function updateViewSpel() {
  const comp = formData.value.componentName?.trim() ?? ""
  const method = formData.value.methodName?.trim() ?? ""
  const paramStr = formData.value.methodParams?.trim() ?? ""
  if (!comp && !method && !paramStr) {
    formData.value.viewSpel = ""
    return
  }
  const parseParams = (str: string) =>
    str ? str.split(",").map(p => p.trim()).filter(Boolean) : []
  const paramList = parseParams(paramStr)
  if (!comp && !method && paramList.length === 1) {
    formData.value.viewSpel = `\${${paramList[0]}}`
    return
  }
  if (!comp || !method) {
    formData.value.viewSpel = "请填写组件名称和方法名"
    return
  }
  const paramPart = paramList.length > 0
    ? `(${paramList.map(p => `#${p}`).join(",")})`
    : "()"
  formData.value.viewSpel = `#{@${comp}.${method}${paramPart}}`
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
        <el-form-item label="组件名称" prop="componentName">
          <el-input v-model="formData.componentName" placeholder="请输入组件名称" @input="updateViewSpel" />
          <template #label>
            <span>
              <el-tooltip content="注册到Spring容器中的组件名，如：spelRuleComponent" placement="top">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
              组件名称
            </span>
          </template>
        </el-form-item>
        <el-form-item label="方法名称" prop="methodName">
          <el-input v-model="formData.methodName" placeholder="请输入方法名称" @input="updateViewSpel" />
          <template #label>
            <span>
              <el-tooltip content="组件中的方法名称，如：selectDeptLeaderById" placement="top">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
              方法名称
            </span>
          </template>
        </el-form-item>
        <el-form-item label="方法参数" prop="methodParams">
          <el-input v-model="formData.methodParams" placeholder="请输入方法参数" @input="updateViewSpel" />
          <template #label>
            <span>
              <el-tooltip content="方法参数，如：deptId, 多个使用 ',' 分隔，单参数变量仅支持单个方法参数" placement="top">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
              方法参数
            </span>
          </template>
        </el-form-item>

        <!-- 改为只读文本展示 -->
        <el-form-item label="SpEL 表达式">
          <span class="preview-box">
            {{ formData.viewSpel || '例如：#{@组件名.方法名(#方法参数)} 或 ${方法参数}' }}
          </span>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
