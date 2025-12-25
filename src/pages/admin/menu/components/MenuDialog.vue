<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { MenuOptionsType } from "../index.vue"
import type { MenuForm } from "@/common/apis/admin/system/menu/types"
import { useDevice } from "@@/composables/useDevice"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { addSysMenuApi, updateSysMenuApi } from "@/common/apis/admin/system/menu"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const isEditable = defineModel<boolean>("isEditable", { default: false })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const formData = defineModel<Partial<MenuForm>>(
  "formData",
  {
    required: true
  }
)
const menuOptions = defineModel<MenuOptionsType[]>(
  "menuOptions",
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
  if (!isEditable.value) return "查看菜单"
  return formData.value.menuId === undefined ? "新增菜单" : "编辑菜单"
})

const { isMobile } = useDevice()

const { sys_show_hide, sys_normal_disable } = toRefs<any>(useDict("sys_show_hide", "sys_normal_disable"))

const formRef = ref<FormInstance | null>(null)

const formRules: FormRules<any> = {
  menuName: [
    {
      required: true,
      trigger: "blur",
      message: "菜单名称必填"
    }
  ],
  orderNum: [
    {
      required: true,
      trigger: "blur",
      message: "菜单顺序必填"
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
        const isCreating = formData.value.menuId === undefined
        if (isCreating) {
          const res = await addSysMenuApi(formData.value as any)
          ElMessage.success(res.msg)
        } else {
          const res = await updateSysMenuApi(formData.value as any)
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
}
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="title" @closed="resetForm" :width="isMobile ? '90%' : '50%'">
    <el-form ref="formRef" v-loading="loading" label-width="100px" :model="formData" :rules="formRules" label-position="left">
      <el-row>
        <el-col :span="24">
          <el-form-item label="上级菜单">
            <el-tree-select
              v-model="formData.parentId"
              :data="menuOptions"
              :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
              value-key="menuId"
              placeholder="选择上级菜单"
              check-strictly
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="菜单类型" prop="menuType">
            <el-radio-group v-model="formData.menuType">
              <el-radio value="M">
                目录
              </el-radio>
              <el-radio value="C">
                菜单
              </el-radio>
              <el-radio value="F">
                按钮
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="isMobile ? 24 : 12">
          <el-form-item label="菜单名称" prop="menuName">
            <el-input v-model="formData.menuName" placeholder="请输入菜单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="isMobile ? 24 : 12">
          <el-form-item label="显示排序" prop="orderNum">
            <el-input-number v-model="formData.orderNum" controls-position="right" :min="0" />
          </el-form-item>
        </el-col>
        <el-col v-if="formData.menuType !== 'M'" :span="isMobile ? 24 : 12">
          <el-form-item>
            <el-input v-model="formData.perms" placeholder="请输入权限标识" maxlength="100" />
            <template #label>
              <span>
                <el-tooltip content="控制器中定义的权限字符，如：@SaCheckPermission('system:user:list')" placement="top">
                  <el-icon>
                    <question-filled />
                  </el-icon>
                </el-tooltip>
                权限字符
              </span>
            </template>
          </el-form-item>
        </el-col>
        <el-col v-if="formData.menuType !== 'F'" :span="isMobile ? 24 : 12">
          <el-form-item>
            <template #label>
              <span>
                <el-tooltip content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问" placement="top">
                  <el-icon>
                    <question-filled />
                  </el-icon>
                </el-tooltip>
                显示状态
              </span>
            </template>
            <el-radio-group v-model="formData.visible">
              <el-radio v-for="dict in sys_show_hide" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item>
            <template #label>
              <span>
                <el-tooltip content="选择停用则路由将不会出现在侧边栏，也不能被访问" placement="top">
                  <el-icon>
                    <question-filled />
                  </el-icon>
                </el-tooltip>
                菜单状态
              </span>
            </template>
            <el-radio-group v-model="formData.status">
              <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
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
