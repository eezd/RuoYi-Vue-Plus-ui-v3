<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import type { MenuTreeOption } from "@/common/apis/system/menu/types"
import type { TenantPkgForm } from "@/common/apis/system/tenantPackage/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { ElMessage } from "element-plus"
import { getMenuTreeSelectByPackageIdApi } from "@/common/apis/system/menu"
import { addSysTenantPackageApi, updateSysTenantPackageApi } from "@/common/apis/system/tenantPackage"
import TreePermission from "./TreePermission.vue"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<TenantPkgForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<TenantPkgForm> = {
  packageId: [{ required: true, message: "租户套餐id不能为空", trigger: "blur" }],
  packageName: [{ required: true, message: "套餐名称不能为空", trigger: "blur" }]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.packageId
    formData.value.menuIds = menuPermissionRef.value?.getAllCheckedKeys()
    const reqData = formData.value as TenantPkgForm
    const res = isUpdate
      ? await updateSysTenantPackageApi(reqData)
      : await addSysTenantPackageApi(reqData)
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

const menuPermissionRef = useTemplateRef("menuPermissionRef")
const menuOptions = ref<MenuTreeOption[]>([])

/** 更新菜单树结构 */
async function getPackageMenuTreeselect(packageId: string | number = 0) {
  const res = await getMenuTreeSelectByPackageIdApi(packageId)
  menuOptions.value = res.data.menus
  if (formData.value.packageId !== 0) {
    menuPermissionRef.value?.setCheckedKeys(res.data.checkedKeys)
  } else {
    menuPermissionRef.value?.setCheckedKeys([])
  }
}

watch(() => formData.value.packageId, async () => {
  if (formData.value.packageId) {
    try {
      dialog.value.loading = true
      await getPackageMenuTreeselect(formData.value.packageId)
    } finally {
      dialog.value.loading = false
    }
  }
})

onMounted(async () => {
  getPackageMenuTreeselect()
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
        <el-form-item prop="packageName" label="套餐名称">
          <el-input v-model="formData.packageName" placeholder="请输入套餐名称" :disabled="!dialog.isEditable" />
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
