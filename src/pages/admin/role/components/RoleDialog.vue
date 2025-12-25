<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { MenuTreeOption, RoleMenuTree } from "@/common/apis/admin/system/menu/types"
import type { RoleForm } from "@/common/apis/admin/system/role/types"
import { useDevice } from "@@/composables/useDevice"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { roleMenuTreeselectApi } from "@/common/apis/admin/system/menu"
import { addSysRoleApi, updateSysRoleApi } from "@/common/apis/admin/system/role"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const menuRef = defineModel<ElTreeInstance | null>("menuRef", { required: true })
const menuOptions = defineModel<MenuTreeOption[]>("menuOptions", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<RoleForm>>(
  "formData",
  {
    required: true
  }
)
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
  if (!isEditable.value) return "查看角色"
  return formData.value.roleId === undefined ? "新增角色" : "编辑角色"
})

const { isMobile } = useDevice()

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const menuExpand = ref(false)
const menuNodeAll = ref(false)

const formRef = ref<FormInstance | null>(null)

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

/**
 * 创建或更新
 */
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    // (valid: boolean, fields)
    if (valid) {
      try {
        loading.value = true
        const isCreating = formData.value.roleId === undefined
        formData.value.menuIds = getMenuAllCheckedKeys()
        if (isCreating) {
          const res = await addSysRoleApi(formData.value as RoleForm)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysRoleApi(formData.value as RoleForm)
          ElMessage.success(res.msg)
        }
      } finally {
        // 新增/修改操作后刷新表格
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
  menuRef.value?.setCheckedKeys([])
}

/** 树权限（展开/折叠） */
function handleCheckedTreeExpand(value: any, type: string) {
  if (type === "menu") {
    const treeList = menuOptions.value
    for (let i = 0; i < treeList.length; i++) {
      if (menuRef.value) {
        menuRef.value.store.nodesMap[treeList[i].id].expanded = value
      }
    }
  }
}
/** 树权限（全选/全不选） */
function handleCheckedTreeNodeAll(value: any, type: string) {
  if (type === "menu") {
    menuRef.value?.setCheckedNodes(value ? (menuOptions.value as any) : [])
  }
}
/** 树权限（父子联动） */
function handleCheckedTreeConnect(value: any, type: string) {
  if (type === "menu") {
    formData.value.menuCheckStrictly = value
  }
}

/** 所有菜单节点数据 */
function getMenuAllCheckedKeys(): any {
  // 目前被选中的菜单节点
  const checkedKeys = menuRef.value?.getCheckedKeys()
  // 半选中的菜单节点
  const halfCheckedKeys = menuRef.value?.getHalfCheckedKeys()
  if (halfCheckedKeys) {
    checkedKeys?.unshift(...halfCheckedKeys)
  }
  console.log(checkedKeys)
  return checkedKeys
}

function getRoleMenuTreeselect(roleId: string | number) {
  return roleMenuTreeselectApi(roleId).then((res): RoleMenuTree => {
    menuOptions.value = res.data.menus
    return res.data
  })
}

watch(() => formData.value.roleId, async () => {
  try {
    if (formData.value.roleId !== undefined) {
      loading.value = true
      // 根据角色ID查询菜单树结构
      const res = await getRoleMenuTreeselect(formData.value.roleId)
      // 使用 for...of 来确保 setChecked 按顺序执行
      res.checkedKeys.forEach((v) => {
        nextTick(() => {
          menuRef.value?.setChecked(v, true, false)
        })
      })
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="title" @closed="resetForm" :width="isMobile ? '90%' : '500px'">
    <el-form ref="formRef" v-loading="loading" label-width="80px" :model="formData" :rules="formRules" label-position="left">
      <el-form-item prop="roleName" label="角色名称">
        <el-input v-model="formData.roleName" placeholder="请输入角色名称" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="roleKey" label="权限字符">
        <el-input v-model="formData.roleKey" placeholder="请输入权限字符" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="roleSort" label="角色顺序">
        <el-input-number v-model="formData.roleSort" controls-position="right" :min="0" :disabled="!isEditable" />
      </el-form-item>
      <el-form-item prop="status" label="状态">
        <el-radio-group v-model="formData.status" :disabled="!isEditable">
          <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="menuCheckStrictly" label="菜单权限">
        <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')" :disabled="!isEditable">
          展开/折叠
        </el-checkbox>
        <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event, 'menu')" :disabled="!isEditable">
          全选/全不选
        </el-checkbox>
        <el-checkbox v-model="formData.menuCheckStrictly" @change="handleCheckedTreeConnect($event, 'menu')" :disabled="!isEditable">
          父子联动
        </el-checkbox>
        <el-tree
          ref="menuRef"
          class="tree-border"
          :data="menuOptions"
          show-checkbox
          node-key="id"
          :check-strictly="!formData.menuCheckStrictly"
          empty-text="加载中，请稍候"
          :props="{ label: 'label', children: 'children' }"
        />
      </el-form-item>
      <el-form-item prop="remark" label="备注">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" :disabled="!isEditable" />
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
