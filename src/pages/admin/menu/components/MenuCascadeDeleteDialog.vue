<script lang="ts" setup>
import type { MenuOptionsType } from "../index.vue"
// import { useDevice } from "@@/composables/useDevice"
import { ElMessage } from "element-plus"
import { cascadeDelSysMenuApi } from "@/common/apis/admin/system/menu"

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const dialogVisible = defineModel<boolean>("dataDialogVisible", { required: true })
const menuTreeRef = defineModel<ElTreeInstance | null>("menuTreeRef", { required: true })
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

const title = "级联删除"

// const { isMobile } = useDevice()

/**
 * 创建或更新
 */
async function handleDeleteForm() {
  const menuIds = menuTreeRef.value?.getCheckedKeys() ?? []
  if (menuIds.length === 0) {
    ElMessage.warning("请选择要删除的菜单")
    return
  }

  try {
    loading.value = true
    await cascadeDelSysMenuApi(menuIds)
    await ElMessage.success("删除成功")
  } finally {
    // 新增/修改操作后刷新表格
    await getTableData()
    dialogVisible.value = false
    loading.value = false
  }
}

async function resetCancelCascade() {
  menuTreeRef.value?.setCheckedKeys([])
  dialogVisible.value = false
}
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="title" @closed="resetCancelCascade" destroy-on-close append-to-bod width="750px">
    <el-tree
      ref="menuTreeRef"
      class="tree-border"
      :data="menuOptions"
      show-checkbox
      node-key="menuId"
      :check-strictly="false"
      empty-text="加载中，请稍候"
      :default-expanded-keys="[0]"
      :props="{ label: 'menuName', children: 'children' }"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleDeleteForm" :loading="loading">
          确 定
        </el-button>
        <el-button @click="resetCancelCascade">
          取 消
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
</style>
