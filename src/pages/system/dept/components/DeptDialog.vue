<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { FormActionEmits } from "types/common"
import type { DeptOptionsType } from "../index.vue"
import type { DeptForm } from "@/common/apis/system/dept/types"
import type { UserVO } from "@/common/apis/system/user/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { ElMessage } from "element-plus"
import { addSysDeptApi, updateSysDeptApi } from "@/common/apis/system/dept"
import { getSysUserListByDeptIdApi } from "@/common/apis/system/user"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const formData = defineModel<Partial<DeptForm>>(
  "formData",
  {
    required: true
  }
)
const treeData = defineModel<DeptOptionsType[]>(
  "treeData",
  {
    required: true
  }
)
// #endregion

const { isMobile } = useDevice()
const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const deptUserList = ref<UserVO[]>([])

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules<any> = {
  parentId: [{ required: true, message: "上级部门不能为空", trigger: "blur" }],
  deptName: [{ required: true, message: "部门名称不能为空", trigger: "blur" }],
  orderNum: [{ required: true, message: "显示排序不能为空", trigger: "blur" }],
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" }]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    dialog.value.loading = true
    const isUpdate = !!formData.value.deptId
    const reqData = formData.value as DeptForm
    const res = isUpdate
      ? await updateSysDeptApi(reqData)
      : await addSysDeptApi(reqData)
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
/** 查询当前部门的所有用户 */
async function getDeptAllUser(deptId: any) {
  if (deptId !== null && deptId !== "" && deptId !== undefined) {
    const res = await getSysUserListByDeptIdApi(deptId)
    deptUserList.value = res.data
  }
}

watch(
  () => formData.value.deptId,
  (newVal) => {
    getDeptAllUser(newVal)
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
      <el-form ref="formRef" v-loading="dialog.loading" label-width="auto" :model="formData" :rules="formRules" label-position="left">
        <el-form-item prop="parentId" label="上级部门">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeData"
            :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
            value-key="deptId"
            placeholder="选择上级菜单"
            check-strictly
          />
        </el-form-item>
        <el-form-item prop="deptName" label="部门名称">
          <el-input v-model="formData.deptName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item prop="deptCategory" label="类别编码">
          <el-input v-model="formData.deptCategory" placeholder="请输入类别编码" />
        </el-form-item>
        <el-form-item prop="orderNum" label="显示顺序">
          <el-input-number v-model="formData.orderNum" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item prop="leader" label="负责人">
          <el-select v-model="formData.leader" placeholder="请选择负责人">
            <el-option v-for="item in deptUserList" :key="item.userId" :label="item.userName" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item prop="phone" label="联系电话">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item prop="email" label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item prop="status" label="部门状态">
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
