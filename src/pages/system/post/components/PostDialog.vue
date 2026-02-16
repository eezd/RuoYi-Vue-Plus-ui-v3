<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import type { DeptTreeVO } from "@/common/apis/system/dept/types"
import type { PostForm, PostVO } from "@/common/apis/system/post/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElInput } from "element-plus"
import { ref } from "vue"
import { addSysPostApi, getSysPostOptionSelectApi, updateSysPostApi } from "@/common/apis/system/post"

interface Props {
  enabledDeptOptions: DeptTreeVO[]
}
const { enabledDeptOptions } = defineProps<Props>()

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<PostForm>>(
  "formData",
  {
    required: true
  }
)
const deptOptions = defineModel<DeptTreeVO[]>("deptOptions", { required: true })
// #endregion

const { isMobile } = useDevice()
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<PostForm> = {
  postName: [{ required: true, message: "岗位名称不能为空", trigger: "blur" }],
  postCode: [{ required: true, message: "岗位编码不能为空", trigger: "blur" }],
  deptId: [{ required: true, message: "部门不能为空", trigger: "blur" }],
  postSort: [{ required: true, message: "岗位顺序不能为空", trigger: "blur" }]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.postId
    const reqData = formData.value as PostForm
    const res = isUpdate
      ? await updateSysPostApi(reqData)
      : await addSysPostApi(reqData)
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

// 岗位选项
const postOptions = ref<PostVO[]>([])
async function handleDeptChange(value: number | string) {
  const response = await getSysPostOptionSelectApi(value)
  postOptions.value = response.data
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
      <el-form ref="formRef" class="content-form" v-loading="dialog.loading" label-width="auto" :model="formData" :rules="formRules" label-position="left">
        <el-form-item prop="deptId" label="归属部门">
          <el-tree-select
            v-model="formData.deptId"
            :data="enabledDeptOptions"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="请选择归属部门"
            check-strictly
            @change="handleDeptChange"
          />
        </el-form-item>
        <el-form-item prop="postName" label="岗位名称">
          <ElInput v-model="formData.postName" placeholder="请输入岗位名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="postCode" label="岗位编码">
          <ElInput v-model="formData.postCode" placeholder="请输入岗位编码" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="postCategory" label="类别编码">
          <ElInput v-model="formData.postCategory" placeholder="请输入类别编码" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="postSort" label="岗位顺序">
          <ElInputNumber v-model.number="formData.postSort" placeholder="请输入岗位顺序" :disabled="!dialog.isEditable" controls-position="right" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-radio-group v-model="formData.status" :disabled="!dialog.isEditable">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="remark" label="备注">
          <ElInput v-model="formData.remark" type="textarea" placeholder="请输入备注" :disabled="!dialog.isEditable" />
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
