<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { RoleVO } from "@/common/apis/admin/system/role/types"
import type { UserForm } from "@/common/apis/admin/system/user/types"
import { useDevice } from "@@/composables/useDevice"
import { ElInput } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { addSysUserApi, updateSysUserApi } from "@/common/apis/admin/system/user"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<UserForm>>(
  "formData",
  {
    required: true
  }
)
const roleOptions = defineModel<RoleVO[]>("roleOptions", { required: true })
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
  if (!isEditable.value) return "查看用户"
  return formData.value.userId === undefined ? "新增用户" : "编辑用户"
})

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

/**
 * 创建或更新
 */
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    // (valid: boolean, fields)
    if (valid) {
      try {
        loading.value = true
        const isCreating = formData.value.userId === undefined
        if (isCreating) {
          const res = await addSysUserApi(formData.value as UserForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysUserApi(formData.value as UserForm)
          ElMessage.success(res.msg)
        }
      } finally {
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
  <el-dialog v-model="dialogVisible" :title="title" @closed="resetForm" :width="isMobile ? '90%' : '500px'">
    <el-form ref="formRef" v-loading="loading" label-width="80px" :model="formData" :rules="formRules" label-position="left">
      <el-form-item prop="userName" label="用户名称">
        <ElInput v-model="formData.userName" placeholder="请输入用户名称" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="nickName" label="用户昵称">
        <ElInput v-model="formData.nickName" placeholder="请输入用户昵称" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="phonenumber" label="手机号码">
        <ElInput v-model="formData.phonenumber" placeholder="请输入手机号码" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="email" label="邮箱">
        <ElInput v-model="formData.email" placeholder="请输入邮箱" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="sex" label="性别">
        <el-select v-model="formData.sex" placeholder="请选择" :disabled="!isEditable">
          <el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item prop="password" label="用户密码" v-if="formData.userId === undefined">
        <ElInput v-model="formData.password" placeholder="请输入用户密码" type="password" maxlength="40" show-password :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="status" label="状态">
        <el-radio-group v-model="formData.status" :disabled="!isEditable">
          <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="roleIds" label="角色">
        <el-select v-model="formData.roleIds" filterable multiple placeholder="请选择角色" :disabled="!isEditable">
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
        <ElInput v-model="formData.remark" type="textarea" placeholder="请输入备注" :disabled="!isEditable" />
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
