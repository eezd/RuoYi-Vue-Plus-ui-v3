<script lang="ts" setup>
import type { RoleVO } from "@@/apis/system/role/types.ts"
import type { UserForm } from "@@/apis/system/user/types.ts"
import type { FormInstance, FormRules } from "element-plus"
import { addSysUserApi, updateSysUserApi } from "@@/apis/system/user"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElInput } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"

export interface EmitEvents {
  (e: "success"): void
  (e: "cancel"): void
}
const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<UserForm>>(
  "formData",
  {
    required: true
  }
)
const roleOptions = defineModel<RoleVO[]>("roleOptions", { required: true })
// #endregion

const { isMobile } = useDevice()
const { sys_normal_disable, sys_user_sex } = toRefs<any>(useDict("sys_normal_disable", "sys_user_sex"))

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<UserForm> = {
  userName: [
    {
      required: true,
      trigger: "blur",
      message: "用户名称必填"
    }
  ],
  nickName: [
    {
      required: true,
      trigger: "blur",
      message: "用户昵称必填"
    }
  ],
  roleIds: [
    {
      required: true,
      trigger: "blur",
      message: "角色必填"
    }
  ],
  password: formData.value.userId === undefined
    ? [
        {
          required: true,
          trigger: "blur",
          message: "密码必填"
        },
        {
          min: 5,
          max: 20,
          message: "密码长度必须 5 到 20 位",
          trigger: "blur"
        }
      ]
    : []
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.userId
    const reqData = formData.value as UserForm
    const res = isUpdate
      ? await updateSysUserApi(reqData)
      : await addSysUserApi(reqData)
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
  formRef.value?.resetFields()
  formData.value = cloneDeep({})
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
        <el-form-item prop="userName" label="用户名称">
          <ElInput v-model="formData.userName" placeholder="请输入用户名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="nickName" label="用户昵称">
          <ElInput v-model="formData.nickName" placeholder="请输入用户昵称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="phonenumber" label="手机号码">
          <ElInput v-model="formData.phonenumber" placeholder="请输入手机号码" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="email" label="邮箱">
          <ElInput v-model="formData.email" placeholder="请输入邮箱" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="sex" label="性别">
          <el-select v-model="formData.sex" placeholder="请选择" :disabled="!dialog.isEditable">
            <el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="password" label="用户密码" v-if="formData.userId === undefined">
          <ElInput v-model="formData.password" placeholder="请输入用户密码" type="password" maxlength="40" show-password :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-radio-group v-model="formData.status" :disabled="!dialog.isEditable">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="roleIds" label="角色">
          <el-select v-model="formData.roleIds" filterable multiple placeholder="请选择角色" :disabled="!dialog.isEditable">
            <el-option
              v-for="item in roleOptions"
              :key="item.roleId"
              :label="item.roleName"
              :value="item.roleId"
              :disabled="item.status === '1'"
            />
          </el-select>
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
