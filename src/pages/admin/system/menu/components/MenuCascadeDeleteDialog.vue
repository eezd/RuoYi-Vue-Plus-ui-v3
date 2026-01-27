<script lang="ts" setup>
import type { MenuOptionsType } from "../index.vue"
import { cascadeDelSysMenuApi } from "@@/apis/admin/system/menu"
import { ElMessage } from "element-plus"

export interface EmitEvents {
  (e: "success"): void
  (e: "cancel"): void
}
const emit = defineEmits<EmitEvents>()

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
    await cascadeDelSysMenuApi(menuIds)
    ElMessage.success("删除成功")
    resetCancelCascade()
    dialog.value.visible = false
    emit("success")
  } finally {
    dialog.value.loading = false
  }
}

function handleCancel() {
  resetCancelCascade()
  dialog.value.visible = false
  emit("cancel")
}

function resetCancelCascade() {
  menuTreeRef.value?.setCheckedKeys([])
}
</script>

<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" @closed="handleCancel" destroy-on-close append-to-bod width="750px">
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
