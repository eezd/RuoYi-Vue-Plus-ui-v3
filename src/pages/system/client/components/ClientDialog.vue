<script lang="ts" setup>
import type { ClientForm } from "@@/apis/system/client/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import { addSysClientApi, updateSysClientApi } from "@@/apis/system/client"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElMessage } from "element-plus"
import { ref } from "vue"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<ClientForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()
const { sys_grant_type, sys_device_type, sys_normal_disable } = toRefs<any>(useDict("sys_grant_type", "sys_device_type", "sys_normal_disable"))

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<ClientForm> = {
  clientId: [{ required: true, message: "客户端id不能为空", trigger: "blur" }],
  clientKey: [{ required: true, message: "客户端key不能为空", trigger: "blur" }],
  clientSecret: [{ required: true, message: "客户端秘钥不能为空", trigger: "blur" }],
  grantTypeList: [{ required: true, message: "授权类型不能为空", trigger: "change" }],
  deviceType: [{ required: true, message: "设备类型不能为空", trigger: "change" }]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.id
    const reqData = formData.value as ClientForm
    const res = isUpdate
      ? await updateSysClientApi(reqData)
      : await addSysClientApi(reqData)
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
        <el-form-item prop="clientKey" label="客户端key">
          <el-input v-model="formData.clientKey" placeholder="请输入客户端key" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="clientSecret" label="客户端秘钥">
          <el-input v-model="formData.clientSecret" placeholder="请输入客户端秘钥" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="grantTypeList" label="客户端管理键值">
          <el-select v-model="formData.grantTypeList" multiple placeholder="请输入授权类型">
            <el-option v-for="dict in sys_grant_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="deviceType" label="设备类型">
          <el-select v-model="formData.deviceType" placeholder="请输入设备类型">
            <el-option v-for="dict in sys_device_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>

        <el-form-item prop="activeTimeout">
          <template #label>
            <span>
              <el-tooltip content="指定时间无操作则过期（单位：秒），默认30分钟（1800秒）" placement="top">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
              Token活跃超时时间
            </span>
          </template>
          <el-input v-model.number="formData.activeTimeout" placeholder="请输入Token活跃超时时间" />
        </el-form-item>
        <el-form-item prop="timeout">
          <template #label>
            <span>
              <el-tooltip content="指定时间必定过期（单位：秒），默认七天（604800秒）" placement="top">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
              Token固定超时时间
            </span>
          </template>
          <el-input v-model="formData.timeout" placeholder="请输入Token固定超时时间" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
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
