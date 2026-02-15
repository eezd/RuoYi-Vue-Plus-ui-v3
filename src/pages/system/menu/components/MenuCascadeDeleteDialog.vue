<script lang="ts" setup>
import type { FormActionEmits } from "types/common"
import type { MenuOptionsType } from "../index.vue"
import { delSysMenuCascadeApi } from "@@/apis/system/menu"
import { ElMessage } from "element-plus"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
const menuOptions = defineModel<MenuOptionsType[]>(
  "menuOptions",
  {
    required: true
  }
)
// #endregion

const menuTreeRef = ref<ElTreeInstance | null>(null)

async function handleSubmit() {
  const menuIds = menuTreeRef.value?.getCheckedKeys() ?? []
  if (menuIds.length === 0) {
    ElMessage.warning("请选择要删除的菜单")
    return
  }
  try {
    dialog.value.loading = true
    await delSysMenuCascadeApi(menuIds)
    ElMessage.success("删除成功")
    dialog.value.visible = false
    emit("success")
  } finally {
    dialog.value.loading = false
  }
}

function handleCancel() {
  dialog.value.visible = false
  emit("cancel")
}

function handleClosed() {
  menuTreeRef.value?.setCheckedKeys([])
}
</script>

<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" @closed="handleClosed" destroy-on-close append-to-body width="750px">
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
        <el-button type="primary" @click="handleSubmit" :loading="dialog.loading">
          确 定
        </el-button>
        <el-button @click="handleCancel">
          取 消
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
</style>
