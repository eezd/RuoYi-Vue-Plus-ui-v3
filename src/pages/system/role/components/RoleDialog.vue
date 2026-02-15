<script lang="ts" setup>
import type { MenuTreeOption, RoleMenuTree } from "@@/apis/system/menu/types.ts"
import type { RoleForm } from "@@/apis/system/role/types.ts"
import type { FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import { getMenuTreeSelectByRoleIdApi } from "@@/apis/system/menu"
import { addSysRoleApi, updateSysRoleApi } from "@@/apis/system/role"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElMessage } from "element-plus"
import TreePermission from "./TreePermission.vue"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const menuOptions = defineModel<MenuTreeOption[]>("menuOptions", { required: true })
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<RoleForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const menuPermissionRef = useTemplateRef("menuPermissionRef")

const formRef = useTemplateRef("formRef")
const formRules: FormRules<RoleForm> = {
  roleName: [
    {
      required: true,
      trigger: "blur",
      message: "角色名称必填"
    }
  ],
  roleKey: [
    {
      required: true,
      trigger: "blur",
      message: "角色键名必填"
    }
  ],
  roleSort: [
    {
      required: true,
      trigger: "blur",
      message: "角色顺序必填"
    }
  ]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.roleId
    formData.value.menuIds = menuPermissionRef.value?.getAllCheckedKeys()
    const reqData = formData.value as RoleForm
    const res = isUpdate
      ? await updateSysRoleApi(reqData)
      : await addSysRoleApi(reqData)
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
  menuPermissionRef.value?.reset()
}

function getRoleMenuTreeselect(roleId: string | number) {
  return getMenuTreeSelectByRoleIdApi(roleId).then((res): RoleMenuTree => {
    menuOptions.value = res.data.menus
    return res.data
  })
}

watch(() => formData.value.roleId, async () => {
  try {
    if (formData.value.roleId !== undefined) {
      dialog.value.loading = true
      const menuRes = await getRoleMenuTreeselect(formData.value.roleId)
      menuPermissionRef.value?.setCheckedKeys(menuRes.checkedKeys)
    }
  } finally {
    dialog.value.loading = false
  }
})
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
        <el-form-item prop="roleName" label="角色名称">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="roleKey" label="权限字符">
          <el-input v-model="formData.roleKey" placeholder="请输入权限字符" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="roleSort" label="角色顺序">
          <el-input-number v-model="formData.roleSort" controls-position="right" :min="0" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-radio-group v-model="formData.status" :disabled="!dialog.isEditable">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="menuCheckStrictly" label="菜单权限">
          <TreePermission
            ref="menuPermissionRef"
            v-model:check-strictly="formData.menuCheckStrictly"
            :tree-data="menuOptions"
            :editable="dialog.isEditable"
          />
        </el-form-item>
        <el-form-item prop="remark" label="备注">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" :disabled="!dialog.isEditable" />
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
