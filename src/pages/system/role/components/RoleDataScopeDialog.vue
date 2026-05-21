<script lang="ts" setup>
import type { MenuTreeOption, RoleMenuTree } from "@@/apis/system/menu/types.ts"
import type { DeptTreeOption, RoleForm } from "@@/apis/system/role/types.ts"
import type { FormActionEmits } from "types/common"
import { getMenuTreeSelectByRoleIdApi } from "@@/apis/system/menu"
import { getSysDeptTreeSelectApi, updateSysRolePermissionApi } from "@@/apis/system/role"
import { useDevice } from "@@/composables/useDevice.ts"
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
const menuPermissionRef = useTemplateRef("menuPermissionRef")
const deptPermissionRef = useTemplateRef("deptPermissionRef")

const deptOptions = ref<DeptTreeOption[]>([])

const formRef = useTemplateRef("formRef")
/** 数据范围选项 */
const dataScopeOptions = ref([
  { value: "1", label: "全部数据权限" },
  { value: "2", label: "自定数据权限" },
  { value: "3", label: "本部门数据权限" },
  { value: "4", label: "本部门及以下数据权限" },
  { value: "5", label: "仅本人数据权限" },
  { value: "6", label: "部门及以下或本人数据权限" }
])

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (formData.value.roleId) {
      dialog.value.loading = true
      formData.value.menuIds = menuPermissionRef.value?.getAllCheckedKeys() || []
      formData.value.deptIds = formData.value.dataScope === "2" ? deptPermissionRef.value?.getAllCheckedKeys() || [] : []
      await updateSysRolePermissionApi(formData.value as RoleForm)
      ElMessage.success("修改成功")
      resetForm()
      dialog.value.visible = false
      emit("success")
    }
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
  deptPermissionRef.value?.reset()
}

function dataScopeSelectChange(value: string) {
  if (value !== "2") {
    deptPermissionRef.value?.reset()
  }
}

/** 根据角色ID查询菜单树结构 */
function getRoleMenuTreeselect(roleId: string | number) {
  return getMenuTreeSelectByRoleIdApi(roleId).then((res): RoleMenuTree => {
    menuOptions.value = res.data.menus
    return res.data
  })
}

async function getRoleDeptTreeSelect(roleId: string | number) {
  const res = await getSysDeptTreeSelectApi(roleId)
  deptOptions.value = res.data.depts
  return res.data
}

watch(() => formData.value.roleId, async () => {
  try {
    if (formData.value.roleId !== undefined) {
      dialog.value.loading = true
      const menuRes = await getRoleMenuTreeselect(formData.value.roleId)
      const deptRes = await getRoleDeptTreeSelect(formData.value.roleId)
      menuPermissionRef.value?.setCheckedKeys(menuRes.checkedKeys)
      deptPermissionRef.value?.setCheckedKeys(deptRes.checkedKeys)
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
      <el-form ref="formRef" v-loading="dialog.loading" label-width="auto" :model="formData" label-position="left">
        <el-form-item prop="roleName" label="角色名称">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="roleKey" label="权限字符">
          <el-input v-model="formData.roleKey" placeholder="请输入权限字符" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="dataScope" label="数据范围">
          <el-select v-model="formData.dataScope" @change="dataScopeSelectChange" :disabled="!dialog.isEditable">
            <el-option v-for="item in dataScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item prop="menuCheckStrictly" label="菜单权限">
          <TreePermission
            ref="menuPermissionRef"
            v-model:check-strictly="formData.menuCheckStrictly"
            :tree-data="menuOptions"
            :editable="dialog.isEditable"
          />
        </el-form-item>
        <el-form-item v-show="formData.dataScope === '2'" prop="deptCheckStrictly" label="数据权限">
          <TreePermission
            ref="deptPermissionRef"
            v-model:check-strictly="formData.deptCheckStrictly"
            :tree-data="deptOptions"
            :editable="dialog.isEditable"
            node-key="id"
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
