<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import type { CategoryTreeVO } from "@/common/apis/workflow/category/types"
import type { FlowDefinitionForm } from "@/common/apis/workflow/definition/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { ElInput } from "element-plus"
import { ref } from "vue"
import { addWorkflowDefinitionApi, editWorkflowDefinitionApi } from "@/common/apis/workflow/definition"

interface Props {
  treeOptions: CategoryTreeVO[]
}
const { treeOptions } = defineProps<Props>()

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<FlowDefinitionForm>>(
  "formData",
  {
    required: true
  }
)
const activeName = defineModel<string>("activeName", { required: true })
// #endregion

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<FlowDefinitionForm> = {
  category: [{ required: true, message: "分类名称不能为空", trigger: "blur" }],
  flowName: [{ required: true, message: "流程定义名称不能为空", trigger: "blur" }],
  formCustom: [{ required: true, message: "请选择是否动态表单", trigger: "change" }],
  modelValue: [{ required: true, message: "设计器模式不能为空", trigger: "change" }],
  flowCode: [{ required: true, message: "流程定义编码不能为空", trigger: "blur" }]
}

const autoPass = ref(false)

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.id
    const ext: any = {}
    ext.autoPass = autoPass.value
    formData.value.ext = JSON.stringify(ext)
    const reqData = formData.value as FlowDefinitionForm
    const res = isUpdate
      ? await editWorkflowDefinitionApi(reqData)
      : await addWorkflowDefinitionApi(reqData).then((response) => {
          // 新增成功后切换到未发布tab
          activeName.value = "1"
          return response
        })
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

watch(
  () => dialog.value.visible,
  (newVal) => {
    if (newVal) {
      autoPass.value = false
      if (formData.value.ext != null && formData.value.ext !== "") {
        const extJson = JSON.parse(formData.value.ext)
        if (extJson.autoPass != null && extJson.autoPass !== "") {
          autoPass.value = extJson.autoPass
        }
      }
    }
  }
)
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
      <el-form ref="formRef" class="content-form" v-loading="dialog.loading" label-width="auto" :model="formData" :rules="formRules" label-position="left">
        <el-form-item prop="deptId" label="归属部门">
          <el-tree-select
            v-model="formData.category"
            :data="treeOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="请选择归属部门"
            check-strictly
          />
        </el-form-item>
        <el-form-item prop="flowCode" label="流程编码">
          <ElInput v-model="formData.flowCode" placeholder="请输入流程编码" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="flowName" label="流程名称">
          <ElInput v-model="formData.flowName" placeholder="请输入流程名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="modelValue" label="设计器模式">
          <el-radio-group v-model="formData.modelValue" :disabled="!!formData.id">
            <el-radio value="CLASSICS" size="large" border>
              经典模式
            </el-radio>
            <el-radio value="MIMIC" size="large" border>
              仿钉钉模式
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="autoPass" label="流程配置">
          <el-checkbox v-model="autoPass" label="下一节点执行人是当前任务处理人自动审批" />
        </el-form-item>
        <el-form-item prop="formCustom" label="是否动态表单">
          <el-radio-group v-model="formData.formCustom">
            <el-radio value="Y" size="large" border disabled>
              是
            </el-radio>
            <el-radio value="N" size="large" border>
              否
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="formPath" label="表单路径">
          <ElInput v-model="formData.formPath" placeholder="请输入表单路径" maxlength="100" show-word-limit :disabled="!dialog.isEditable" />
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
