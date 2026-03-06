<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import type { TenantForm } from "@/common/apis/system/tenant/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElMessage } from "element-plus"
import { addSysTenantApi, updateSysTenantApi } from "@/common/apis/system/tenant"
import { getSysTenantPackageSelectListApi } from "@/common/apis/system/tenantPackage"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<TenantForm>>(
  "formData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()
const { packageList } = toRefs<any>(useDict("packageList"))

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<TenantForm> = {
  id: [{ required: true, message: "id不能为空", trigger: "blur" }],
  tenantId: [{ required: true, message: "租户编号不能为空", trigger: "blur" }],
  contactUserName: [{ required: true, message: "联系人不能为空", trigger: "blur" }],
  contactPhone: [{ required: true, message: "联系电话不能为空", trigger: "blur" }],
  companyName: [{ required: true, message: "企业名称不能为空", trigger: "blur" }],
  username: [
    { required: true, message: "用户名不能为空", trigger: "blur" },
    { min: 2, max: 20, message: "用户名称长度必须介于 2 和 20 之间", trigger: "blur" }
  ],
  password: [
    { required: true, message: "密码不能为空", trigger: "blur" },
    { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" }
  ]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.id
    const reqData = formData.value as TenantForm
    const res = isUpdate
      ? await updateSysTenantApi(reqData)
      : await addSysTenantApi(reqData)
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

/** 查询所有租户套餐 */
async function getTenantPackage() {
  const res = await getSysTenantPackageSelectListApi()
  packageList.value = res.data
}

onMounted(() => {
  getTenantPackage()
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
        <el-form-item prop="companyName" label="公司名称">
          <el-input v-model="formData.companyName" placeholder="请输入公司名称" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="contactUserName" label="联系人">
          <el-input v-model="formData.contactUserName" placeholder="请输入联系人" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="contactPhone" label="联系电话">
          <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item v-if="!formData.id" prop="username" label="用户名">
          <el-input v-model="formData.username" placeholder="请输入用户名" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item v-if="!formData.id" prop="password" label="密码">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="packageId" label="租户套餐">
          <el-select v-model="formData.packageId" :disabled="!!formData.tenantId" placeholder="请选择租户套餐" clearable style="width: 100%">
            <el-option v-for="item in packageList" :key="item.packageId" :label="item.packageName" :value="item.packageId" />
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间" prop="expireTime">
          <el-date-picker v-model="formData.expireTime" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择过期时间" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="accountCount" label="用户数量">
          <el-input v-model="formData.accountCount" placeholder="请输入用户数量" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="domain" label="绑定域名">
          <el-input v-model="formData.domain" type="textarea" placeholder="请输入绑定域名" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="address" label="企业地址">
          <el-input v-model="formData.address" type="textarea" placeholder="请输入企业地址" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="licenseNumber" label="企业代码">
          <el-input v-model="formData.licenseNumber" type="textarea" placeholder="请输入企业代码" :disabled="!dialog.isEditable" />
        </el-form-item>
        <el-form-item prop="intro" label="企业简介">
          <el-input v-model="formData.intro" type="textarea" placeholder="请输入企业简介" :disabled="!dialog.isEditable" />
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
