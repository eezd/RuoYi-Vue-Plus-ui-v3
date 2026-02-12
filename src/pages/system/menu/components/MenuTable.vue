<script lang="ts" setup>
import type { MenuTableRow } from "../index.vue"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { formatDateTime } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { CirclePlus, Delete, RefreshRight } from "@element-plus/icons-vue"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<MenuTableRow[]>("tableData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
const menuTableRef = defineModel<ElTableInstance | null>("menuTableRef", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  openCascadeDeleteDialog: []
  getTableData: []
  getChildrenList: [row: MenuTableRow, treeNode: unknown, resolve: (data: MenuTableRow[]) => void]
  expandMenuHandle: [row: MenuTableRow, expanded: boolean]
}
const openAddDialog = () => emit("openAddDialog")
const openCascadeDeleteDialog = () => emit("openCascadeDeleteDialog")
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const { sys_normal_disable } = toRefs<any>(useDict("sys_show_hide", "sys_normal_disable"))
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="primary"
          :icon="CirclePlus"
          :disabled="!checkPermission(['system:menu:add'])"
          @click="openAddDialog()"
        >
          新增菜单
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!checkPermission(['system:menu:remove'])"
          @click="openCascadeDeleteDialog()"
        >
          级联删除
        </el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="() => getTableData()" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-table
        ref="menuTableRef"
        :data="tableData"
        row-key="menuId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        lazy
        :load="(row, treeNode, resolve) => emit('getChildrenList', row, treeNode, resolve)"
        :expand-change="(row: any, expanded: boolean) => emit('expandMenuHandle', row, expanded)"
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="200" />
        <el-table-column prop="orderNum" label="排序" align="center" min-width="80" />
        <el-table-column prop="perms" label="权限标识" align="center" min-width="200" :show-overflow-tooltip="true" />
        <el-table-column prop="status" label="状态" min-width="80" align="center">
          <template #default="scope">
            <DictTag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" :width="isMobile ? 100 : 130" align="center">
          <template #default="scope">
            <slot name="operation" :scope="scope" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
